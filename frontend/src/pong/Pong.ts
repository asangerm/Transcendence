import { GameController, ControllerSnapshot } from './GameController';
import { GameRenderer } from './GameRenderer';
import type { UserInputState } from './scripts/gameState';
import { PongRealtimeClient } from '../services/realtime/pongClient';
import type { ServerGameState } from '../types/realtime';
import { getApiUrl } from "../config";

export class Pong {
    private controller: GameController;
    private renderer: GameRenderer;
    private rafId: number | null;
    private realtime: PongRealtimeClient | null;
    private online: boolean;
    private onlineKeys: { [key: string]: boolean };
    private lastFrameTime: number;
    private serverTargets: {
        ballPos: { x: number; y: number; z: number } | null;
        ballVel: { x: number; y: number; z: number } | null;
        padTopX: number | null;
        padBottomX: number | null;
        lastRecv: number;
    };
    private _tpsCount: number = 0;
    private _tpsLastAt: number = performance.now();
    private _tps: number = 0;
    private endScreen: { mode: 'none' | 'victory' | 'defeat'; winner?: string } = { mode: 'none' };
  private playerLabels: { top: string; bottom: string } = { top: '', bottom: '' };
    private tournamentMatchId: number | null = null;
    private tournamentRedirectDone = false;

    constructor() {
        this.controller = new GameController();
        this.renderer = new GameRenderer();
        this.rafId = null;
        this.realtime = null;
        this.online = false;
        this.onlineKeys = {};
        this.lastFrameTime = performance.now();
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
            this.loop();
        } else {
            this.online = true;
            const matchId = opts?.matchId;
            this.tournamentMatchId = matchId ?? null;
            this.tournamentRedirectDone = false;
            let gameId = opts?.gameId || '';
            if (matchId != null) {
                if (gameId) {
                    try {
                        const res = await fetch(`${getApiUrl()}/api/games/${encodeURIComponent(gameId)}`);
                        if (!res.ok) {
                            gameId = '';
                        }
                    } catch {
                        gameId = '';
                    }
                }
                if (!gameId) {
                    const res = await fetch(`${getApiUrl()}/tournament/match/${matchId}/start`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (!res.ok) {
                        throw new Error('Failed to start tournament match');
                    }
                    const data = await res.json();
                    gameId = data.gameId;
                }
            } else {
                if (gameId) {
                    try {
                        const res = await fetch(`${getApiUrl()}/api/games/${encodeURIComponent(gameId)}`);
                        if (!res.ok) {
                            gameId = await this.createGame();
                        }
                    } catch {
                        gameId = await this.createGame();
                    }
                } else {
                    gameId = await this.createGame();
                }
            }
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
            this.controller.setMatchType(matchId != null ? 'local' : 'local');
            const keyHandler = (e: KeyboardEvent) => this.handleLocalKey(e);
            window.addEventListener('keydown', keyHandler, { passive: true });
            window.addEventListener('keyup', keyHandler);
            try {
                const url = new URL(window.location.href);
                if (matchId != null) {
                    url.searchParams.set('mode', 'tournament');
                    url.searchParams.set('matchId', String(matchId));
                } else {
                    url.searchParams.set('mode', 'local');
                }
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
            this.renderer.requestFrame(snapshot.scene, snapshot.scores, false, this.playerLabels, this.endScreen);
        } else {
            this.sendInputState();

            if (ball) {
                if (this.serverTargets.ballVel) {
                    ball.position.x += this.serverTargets.ballVel.x * dt;
                    ball.position.y += this.serverTargets.ballVel.y * dt;
                    ball.position.z += this.serverTargets.ballVel.z * dt;
                }
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

            if (padTop && this.serverTargets.padTopX !== null) {
                const dx = this.serverTargets.padTopX - padTop.position.x;
                if (Math.abs(dx) > 0.1) {
                    padTop.position.x += dx * 0.3;
                } else {
                    padTop.position.x = this.serverTargets.padTopX;
                }
            }

            if (padBottom && this.serverTargets.padBottomX !== null) {
                const dx = this.serverTargets.padBottomX - padBottom.position.x;
                if (Math.abs(dx) > 0.1) {
                    padBottom.position.x += dx * 0.3;
                } else {
                    padBottom.position.x = this.serverTargets.padBottomX;
                }
            }

            this.renderer.requestFrame(scene, this.controller.getScores(), true, this.playerLabels, this.endScreen);
        }

        const { width, height } = this.renderer.getCanvasSize();
        this.controller.setViewportSize(width, height);
        this.rafId = requestAnimationFrame(this.loop);
    };

    private async createGame(): Promise<string> {
        const res = await fetch(`${getApiUrl()}/api/games`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'pong' }) });
        const data = await res.json();
        return data.id as string;
    }

    private applyServerState(state: ServerGameState): void {
        if (!state.gameOver) {
            this.endScreen = { mode: 'none' };
        }
        if (!state.gameOver) {
            this.endScreen = { mode: 'none' };
        }
        this.serverTargets.ballPos = { ...state.ball.position };
        this.serverTargets.ballVel = { ...state.ball.velocity };
        this.serverTargets.padTopX = state.paddles.top.position.x;
        this.serverTargets.padBottomX = state.paddles.bottom.position.x;
        this.serverTargets.lastRecv = performance.now();
        this.controller.setScores(state.scores);
        const topLabel_ = state.players.top?.username || state.players.top?.id || '';
        const bottomLabel_ = state.players.bottom?.username || state.players.bottom?.id || '';
        if (topLabel_) this.playerLabels.top = String(topLabel_);
        if (bottomLabel_) this.playerLabels.bottom = String(bottomLabel_);
        if (state.gameOver && state.winner) {
            const winnerSide = state.winner;
            const label = winnerSide === 'top' ? this.playerLabels.top : this.playerLabels.bottom;
            const matchType = this.controller.getMatchType();
            const fallback = winnerSide === 'top' ? 'Joueur 1' : 'Joueur 2';
            const winnerLabel = label || fallback;
            if (matchType === 'online') {
                const mySide = this.getPlayerSide();
                if (mySide) {
                    this.endScreen = {
                        mode: mySide === winnerSide ? 'victory' : 'defeat',
                        winner: winnerLabel
                    };
                }
            } else {
                this.endScreen = {
                    mode: 'victory',
                    winner: winnerLabel
                };
            }
            if (this.tournamentMatchId != null && !this.tournamentRedirectDone) {
                this.tournamentRedirectDone = true;
                setTimeout(() => {
                    window.location.href = '/tournaments';
                }, 2000);
            }
        }
        const topLabel = state.players.top?.username || state.players.top?.id || '';
        const bottomLabel = state.players.bottom?.username || state.players.bottom?.id || '';
        if (topLabel) this.playerLabels.top = String(topLabel);
        if (bottomLabel) this.playerLabels.bottom = String(bottomLabel);
        if (state.gameOver && state.winner) {
            const winnerSide = state.winner;
            const label = winnerSide === 'top' ? this.playerLabels.top : this.playerLabels.bottom;
            const matchType = this.controller.getMatchType();
            const fallback = winnerSide === 'top' ? 'Joueur 1' : 'Joueur 2';
            const winnerLabel = label || fallback;
            if (matchType === 'online') {
                const mySide = this.getPlayerSide();
                if (mySide) {
                    this.endScreen = {
                        mode: mySide === winnerSide ? 'victory' : 'defeat',
                        winner: winnerLabel
                    };
                }
            } else {
                this.endScreen = {
                    mode: 'victory',
                    winner: winnerLabel
                };
            }
            if (this.tournamentMatchId != null && !this.tournamentRedirectDone) {
                this.tournamentRedirectDone = true;
                setTimeout(() => {
                    window.location.href = '/tournaments';
                }, 2000);
            }
        }
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
        
        const isDown = e.type === 'keydown' && !e.repeat;
        const isUp = e.type === 'keyup';
        const key = e.key.toLowerCase();
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
        const url = new URL(window.location.href);
        const side = url.searchParams.get('side') as 'top' | 'bottom' | null;
        
        if (side) {
            return side;
        }
        return null;
    }
    
    private sendStopCommand(direction: string): void {
        if (!this.realtime) return;
        
        const inputData: Record<string, number> = {};
        inputData[direction] = 2;
        
        this.realtime.sendInput(inputData);
    }
}


