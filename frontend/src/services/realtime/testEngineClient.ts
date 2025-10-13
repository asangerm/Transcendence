import type { TestEngineState } from '../../types/realtime';

export class TestEngineRealtimeClient {
    private ws: WebSocket | null = null;
    private urlBase: string;
    private gameId: string | null = null;
    private onState: ((s: TestEngineState) => void) | null = null;
    private onHello: ((serverTime: number) => void) | null = null;
    private pending: any[] = [];
    private isOpen = false;

    constructor(urlBase = 'ws://localhost:8000/ws') {
        this.urlBase = urlBase;
    }

    setOnState(cb: (s: TestEngineState) => void): void {
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

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isOpen = false;
        this.pending = [];
    }
}
