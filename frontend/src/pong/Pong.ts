import { GameController, ControllerSnapshot } from './GameController';
import { GameRenderer } from './GameRenderer';
import type { UserInputState } from '../scripts/pong/gameState';
import { PongRealtimeClient } from '../services/realtime/pongClient';
import type { ServerGameState } from '../types/realtime';

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
    private _tpsCount: number = 0;
    private _tpsLastAt: number = performance.now();
    private _tps: number = 0;

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
            this.renderer.requestFrame(snapshot.scene, snapshot.scores, this.online);
        });
    }

    async mount(element: HTMLElement, opts?: { online?: boolean; gameId?: string; side?: 'top' | 'bottom'; matchId?: number }): Promise<void> {
        await this.renderer.mount(element);
        const { width, height } = this.renderer.getCanvasSize();
        this.controller.setViewportSize(width, height);
        if (opts?.online) {
            this.online = true;
            const gameId = opts.gameId ?? (await this.createGame());
            this.realtime = new PongRealtimeClient();
            this.realtime.setOnState((state) => {
                const now = performance.now();
                this._tpsCount += 1;
                const elapsed = now - this._tpsLastAt;
                if (elapsed >= 1000) {
                    this._tps = this._tpsCount;
                    this._tpsCount = 0;
                    this._tpsLastAt = now;
                } else if (elapsed > 0) {
                    this._tps = Math.round((this._tpsCount * 1000) / elapsed);
                }
                this.renderer.setTPS?.(this._tps);
                this.applyServerState(state);
            });
            await this.realtime.connect(gameId);
            // attach keyboard -> ws
            this.controller.setPlayer(opts.side || 'top');
            this.controller.setMatchType('online');
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('mode', 'online');
                url.searchParams.set('gameId', gameId);
                if (opts.side) url.searchParams.set('side', opts.side);
                window.history.replaceState({}, '', url.toString());
            } catch {}

            const keyHandler = (e: KeyboardEvent) => this.handleOnlineKey(e, opts.side);
            window.addEventListener('keydown', keyHandler, { passive: true });
            window.addEventListener('keyup', keyHandler);
            // Start passive render loop in case of missed frames
            this.loop();
        } else {
            this.online = true;
            const gameId = await this.createGame();
            this.realtime = new PongRealtimeClient();
            this.realtime.setOnState((state) => {
                const now = performance.now();
                this._tpsCount += 1;
                const elapsed = now - this._tpsLastAt;
                if (elapsed >= 1000) {
                    this._tps = this._tpsCount;
                    this._tpsCount = 0;
                    this._tpsLastAt = now;
                } else if (elapsed > 0) {
                    this._tps = Math.round((this._tpsCount * 1000) / elapsed);
                }
                this.renderer.setTPS?.(this._tps);
                this.applyServerState(state);
            });
            await this.realtime.connect(gameId);
            this.controller.setPlayer('local');
            this.controller.setMatchType('local');
            const keyHandler = (e: KeyboardEvent) => this.handleLocalKey(e);
            window.addEventListener('keydown', keyHandler, { passive: true });
            window.addEventListener('keyup', keyHandler);
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('mode', 'local');
                url.searchParams.set('gameId', gameId);
                window.history.replaceState({}, '', url.toString());
            } catch {}
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
            this.renderer.requestFrame(snapshot.scene, snapshot.scores, false);
        } else {
            // Send input state to server (server-authoritative paddles)
            this.sendInputState();

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

            // Paddle position interpolation from server
            if (padTop && this.serverTargets.padTopX !== null) {
                const dx = this.serverTargets.padTopX - padTop.position.x;
                if (Math.abs(dx) > 0.1) {
                    padTop.position.x += dx * 0.3; // Smooth interpolation
                } else {
                    padTop.position.x = this.serverTargets.padTopX;
                }
            }

            if (padBottom && this.serverTargets.padBottomX !== null) {
                const dx = this.serverTargets.padBottomX - padBottom.position.x;
                if (Math.abs(dx) > 0.1) {
                    padBottom.position.x += dx * 0.3; // Smooth interpolation
                } else {
                    padBottom.position.x = this.serverTargets.padBottomX;
                }
            }

            // Render every frame
            this.renderer.requestFrame(scene, this.controller.getScores(), true);
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
    private applyServerState(state: ServerGameState): void {
        // Update targets for smoothing and extrapolation
        this.serverTargets.ballPos = { ...state.ball.position };
        this.serverTargets.ballVel = { ...state.ball.velocity };
        this.serverTargets.padTopX = state.paddles.top.position.x;
        this.serverTargets.padBottomX = state.paddles.bottom.position.x;
        this.serverTargets.lastRecv = performance.now();
        // Update scores from server so they can be displayed later
        this.controller.setScores(state.scores);
        
        // Update paddle positions directly for immediate response
        const scene = this.controller.getScene();
        const padTop = scene.findObjectByName('paddle_top');
        const padBottom = scene.findObjectByName('paddle_bottom');
        
        if (padTop) {
            padTop.position.x = state.paddles.top.position.x;
        }
        if (padBottom) {
            padBottom.position.x = state.paddles.bottom.position.x;
        }
    }

    private handleOnlineKey(e: KeyboardEvent, side?: 'top' | 'bottom'): void {
        if (!this.realtime || !side) return;
        
        // Prevent multiple repeats causing jitter: only act on initial keydown and keyup
        const isDown = e.type === 'keydown' && !e.repeat;
        const isUp = e.type === 'keyup';
        const key = e.key.toLowerCase();
        
        // Only handle keys for the player's assigned side
        const leftKey = 'z';
        const rightKey = 'x';
        
        if (isDown || isUp) {
            if (key === leftKey) {
                this.onlineKeys[leftKey] = isDown ? true : false;
                if (isUp) {
                    this.sendStopCommand(side === 'top' ? 'topLeft' : 'bottomLeft');
                }
            }
            if (key === rightKey) {
                this.onlineKeys[rightKey] = isDown ? true : false;
                if (isUp) {
                    this.sendStopCommand(side === 'top' ? 'topRight' : 'bottomRight');
                }
            }
        }
        
        // Send input state to server using new format
        this.sendInputState();
    }
    
    private handleLocalKey(e: KeyboardEvent): void {
        if (!this.realtime || this.controller.getMatchType() !== 'local') return;
        const isDown = e.type === 'keydown' && !e.repeat;
        const isUp = e.type === 'keyup';
        const key = e.key.toLowerCase();
        const keys = ['a','z','k','m'];
        if ((isDown || isUp) && keys.includes(key)) {
            this.onlineKeys[key] = isDown ? true : false;
            this.sendInputState();
        }
    }
    
    private sendInputState(): void {
        if (!this.realtime) return;
        if ((this.controller as any).getMatchType && this.controller.getMatchType() === 'local') {
            const topLeft = this.onlineKeys['z'] ? 1 : 0;
            const topRight = this.onlineKeys['a'] ? 1 : 0;
            const bottomLeft = this.onlineKeys['m'] ? 1 : 0;
            const bottomRight = this.onlineKeys['k'] ? 1 : 0;
            this.realtime.sendPaddleInput('top', topLeft, topRight);
            this.realtime.sendPaddleInput('bottom', bottomLeft, bottomRight);
            return;
        }
        // Determine which paddle this player controls based on their side
        const playerSide = this.getPlayerSide();
        if (playerSide === 'top') {
            const left = this.onlineKeys['x'] ? 1 : 0;
            const right = this.onlineKeys['z'] ? 1 : 0;
            this.realtime.sendPaddleInput('top', left, right);
        } else if (playerSide === 'bottom') {
            const left = this.onlineKeys['z'] ? 1 : 0;
            const right = this.onlineKeys['x'] ? 1 : 0;
            this.realtime.sendPaddleInput('bottom', left, right);
        }
    }
    
    private getPlayerSide(): 'top' | 'bottom' | null {
        // Get the side from the URL parameters or from the game state
        const url = new URL(window.location.href);
        const side = url.searchParams.get('side') as 'top' | 'bottom' | null;
        
        if (side) {
            return side;
        }
        
        // Fallback: try to determine from game state
        // This would need to be implemented based on how the game state tracks players
        return null;
    }
    
    private sendStopCommand(direction: string): void {
        if (!this.realtime) return;
        
        const inputData: Record<string, number> = {};
        inputData[direction] = 2; // Stop command
        
        this.realtime.sendInput(inputData);
    }
}


