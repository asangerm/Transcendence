import type { ServerGameState } from '../../types/realtime';
import { getWsUrl } from '../../config'; 

export type ClientSide = 'top' | 'bottom';

export class PongRealtimeClient {
    private ws: WebSocket | null = null;
    private urlBase: string;
    private gameId: string | null = null;
    private onState: ((s: ServerGameState) => void) | null = null;
    private onHello: ((serverTime: number) => void) | null = null;
    private pending: any[] = [];
    private isOpen = false;

    constructor(urlBase?: string) {
        this.urlBase = urlBase ?? getWsUrl();
      }

    setOnState(cb: (s: ServerGameState) => void): void {
        this.onState = cb;
    }

    setOnHello(cb: (serverTime: number) => void): void {
        this.onHello = cb;
    }

    connect(gameId: string): Promise<void> {
        this.gameId = gameId;
        const ws = new WebSocket(`${this.urlBase}?gameId=${encodeURIComponent(gameId)}`);
        this.ws = ws;
        return new Promise((resolve) => {
            ws.onopen = () => {
                this.isOpen = true;
                this.flush();
                resolve();
            };
            ws.onclose = () => {
                this.isOpen = false;
            };
            ws.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg.type === 'hello' && this.onHello) this.onHello(msg.serverTime);
                    if (msg.type === 'state' && this.onState) this.onState(msg.state);
                } catch {}
            };
        });
    }

    sendInput(inputData: Record<string, number>): void {
        if (!this.gameId) return;
        const payload = { gameId: this.gameId, ...inputData };
        this.send(payload);
    }

    // Legacy method for backward compatibility
    sendInputLegacy(side: ClientSide, action: 'moveLeft' | 'moveRight' | 'stop'): void {
        if (!this.gameId) return;
        const payload = { gameId: this.gameId, playerSide: side, action };
        this.send(payload);
    }

    sendPaddleX(side: ClientSide, x: number): void {
        if (!this.gameId) return;
        const payload = { type: 'paddle', gameId: this.gameId, playerSide: side, x };
        this.send(payload);
    }

    sendPaddleInput(side: ClientSide, left: number, right: number): void {
        if (!this.gameId) return;
        const payload = { 
            type: 'input', 
            gameId: this.gameId, 
            side: side, 
            left: left, 
            right: right 
        };
        this.send(payload);
    }

    private send(obj: any): void {
        if (this.ws && this.isOpen && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj));
        } else {
            this.pending.push(obj);
        }
    }

    private flush(): void {
        while (this.pending.length && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const obj = this.pending.shift();
            this.ws.send(JSON.stringify(obj));
        }
    }
}


