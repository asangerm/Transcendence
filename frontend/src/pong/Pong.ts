import { GameController, ControllerSnapshot } from './GameController';
import { GameRenderer } from './GameRenderer';
import type { UserInputState } from '../scripts/pong/gameState';
import { PongRealtimeClient } from '../services/realtime/pongClient';

export class Pong {
    private controller: GameController;
    private renderer: GameRenderer;
    private rafId: number | null;
    private realtime: PongRealtimeClient | null;
    private online: boolean;
    private onlineKeys: { [key: string]: boolean };
    private lastFrameTime: number;
    private paddleSpeed: number;
    private serverTargets: {
        ballPos: { x: number; y: number; z: number } | null;
        ballVel: { x: number; y: number; z: number } | null;
        padTopX: number | null;
        padBottomX: number | null;
        lastRecv: number;
    };
    private _lastPadSyncAt: number | null = null;

    constructor() {
        this.controller = new GameController();
        this.renderer = new GameRenderer();
        this.rafId = null;
        this.realtime = null;
        this.online = false;
        this.onlineKeys = {};
        this.lastFrameTime = performance.now();
        this.paddleSpeed = 50;
        this.serverTargets = { ballPos: null, ballVel: null, padTopX: null, padBottomX: null, lastRecv: 0 };
        this.controller.setOnStateUpdated((snapshot: ControllerSnapshot) => {
            this.renderer.requestFrame(snapshot.scene, snapshot.ballSpeed);
        });
    }

    async mount(element: HTMLElement, opts?: { online?: boolean; gameId?: string; side?: 'top' | 'bottom' }): Promise<void> {
        await this.renderer.mount(element);
        const { width, height } = this.renderer.getCanvasSize();
        this.controller.setViewportSize(width, height);
        if (opts?.online) {
            this.online = true;
            const gameId = opts.gameId ?? (await this.createGame());
            this.realtime = new PongRealtimeClient();
            this.realtime.setOnState((state) => this.applyServerState(state));
            await this.realtime.connect(gameId);
            // attach keyboard -> ws
            const keyHandler = (e: KeyboardEvent) => this.handleOnlineKey(e, opts.side);
            window.addEventListener('keydown', keyHandler, { passive: true });
            window.addEventListener('keyup', keyHandler);
            // Start passive render loop in case of missed frames
            this.loop();
        } else {
            this.loop();
        }
    }

    unmount(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.renderer.unmount();
    }

    applyRemoteInput(input: UserInputState): void {
        this.controller.applyRemoteInput(input);
    }

    private loop = (): void => {
        const now = performance.now();
        let dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        if (dt > 0.05) dt = 0.05;

        const scene = this.controller.getScene();
        const ball = scene.findObjectByName('ball');
        const padTop = scene.findObjectByName('paddle_top');
        const padBottom = scene.findObjectByName('paddle_bottom');

        if (!this.online) {
            const snapshot: ControllerSnapshot = this.controller.update();
            this.renderer.requestFrame(snapshot.scene, snapshot.ballSpeed);
        } else {
            // Client-side prediction for paddles (client authoritative x)
            if (padTop) {
                const leftKey = 'o';
                const rightKey = 'l';
                let x = padTop.position.x;
                if (this.onlineKeys[leftKey]) x -= this.paddleSpeed * dt;
                if (this.onlineKeys[rightKey]) x += this.paddleSpeed * dt;
                const half = (padTop.size?.x ?? 10) / 2;
                const maxX = 25 - half;
                x = Math.max(-maxX, Math.min(maxX, x));
                padTop.position.x = x;
            }

            if (padBottom) {
                const leftKey = 'r';
                const rightKey = 'f';
                let x = padBottom.position.x;
                if (this.onlineKeys[leftKey]) x -= this.paddleSpeed * dt;
                if (this.onlineKeys[rightKey]) x += this.paddleSpeed * dt;
                const half = (padBottom.size?.x ?? 10) / 2;
                const maxX = 25 - half;
                x = Math.max(-maxX, Math.min(maxX, x));
                padBottom.position.x = x;
            }

            // Ball extrapolation to reduce stutter + reconciliation
            if (ball) {
                // Extrapolate with last server velocity
                if (this.serverTargets.ballVel) {
                    ball.position.x += this.serverTargets.ballVel.x * dt;
                    ball.position.y += this.serverTargets.ballVel.y * dt;
                    ball.position.z += this.serverTargets.ballVel.z * dt;
                }
                // Reconcile toward server position: snap on large deltas, smooth on small
                if (this.serverTargets.ballPos) {
                    const dx = this.serverTargets.ballPos.x - ball.position.x;
                    const dy = this.serverTargets.ballPos.y - ball.position.y;
                    const dz = this.serverTargets.ballPos.z - ball.position.z;
                    const dist = Math.hypot(dx, dy, dz);
                    if (dist > 5) {
                        ball.position.x = this.serverTargets.ballPos.x;
                        ball.position.y = this.serverTargets.ballPos.y;
                        ball.position.z = this.serverTargets.ballPos.z;
                    } else {
                        ball.position.x = ball.position.x + dx * 0.25;
                        ball.position.y = ball.position.y + dy * 0.25;
                        ball.position.z = ball.position.z + dz * 0.25;
                    }
                }
            }

            // Throttle-sync paddle x back to server (20Hz)
            if (this.realtime) {
                const t = performance.now();
                if (!this._lastPadSyncAt || t - this._lastPadSyncAt > 50) {
                    if (padTop) this.realtime.sendPaddleX('top', padTop.position.x);
                    if (padBottom) this.realtime.sendPaddleX('bottom', padBottom.position.x);
                    this._lastPadSyncAt = t;
                }
            }

            // Render every frame
            const speed = this.serverTargets.ballVel ? Math.hypot(this.serverTargets.ballVel.x, this.serverTargets.ballVel.z) : 0;
            this.renderer.requestFrame(scene, speed);
        }

        const { width, height } = this.renderer.getCanvasSize();
        this.controller.setViewportSize(width, height);
        this.rafId = requestAnimationFrame(this.loop);
    };

    private async createGame(): Promise<string> {
        const res = await fetch('http://localhost:8000/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'pong' }) });
        const data = await res.json();
        return data.id as string;
    }

    // Map server state onto our scene graph for rendering
    private applyServerState(state: any): void {
        // Update targets for smoothing and extrapolation
        this.serverTargets.ballPos = { ...state.ball.position };
        this.serverTargets.ballVel = { ...state.ball.velocity };
        this.serverTargets.padTopX = state.paddles.top.position.x;
        this.serverTargets.padBottomX = state.paddles.bottom.position.x;
        this.serverTargets.lastRecv = performance.now();
        // No immediate snap; loop will smoothly reconcile and render
    }

    private handleOnlineKey(e: KeyboardEvent, side?: 'top' | 'bottom'): void {
        if (!this.realtime) return;
        // Prevent multiple repeats causing jitter: only act on initial keydown and keyup
        const isDown = e.type === 'keydown' && !e.repeat;
        const isUp = e.type === 'keyup';
        const key = e.key.toLowerCase();
        const sides: Array<'top' | 'bottom'> = side ? [side] : ['top', 'bottom'];
        for (const s of sides) {
            const leftKey = s === 'top' ? 'o' : 'r';
            const rightKey = s === 'top' ? 'l' : 'f';
            // local prediction key state
            if (isDown || isUp) {
                if (key === leftKey) {
                    this.onlineKeys[leftKey] = isDown ? true : false;
                }
                if (key === rightKey) {
                    this.onlineKeys[rightKey] = isDown ? true : false;
                }
            }
        }
    }
}


