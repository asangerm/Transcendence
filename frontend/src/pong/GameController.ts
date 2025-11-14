import { Scene } from '../scripts/pong/Scene';
import { Ball } from '../scripts/pong/Ball';
import { Paddle } from '../scripts/pong/Paddle';
import { InputHandler } from '../scripts/pong/InputHandler';
import type { UserInputState } from '../scripts/pong/gameState';

export type ControllerSnapshot = {
    scene: Scene;
    ballSpeed: number;
};

type ControllerOptions = {
    topControls?: { left: string; right: string };
    bottomControls?: { left: string; right: string };
};

export class GameController {
    private scene: Scene;
    private ball: Ball | null;
    private topPaddle: Paddle | null;
    private bottomPaddle: Paddle | null;
    private input: InputHandler;
    private lastTime: number;
    private onStateUpdated: ((snapshot: ControllerSnapshot) => void) | null;
    private topControls: { left: string; right: string };
    private bottomControls: { left: string; right: string };
    private matchType: 'online' | 'local' = 'online';

    constructor(options: ControllerOptions = {}) {
        this.scene = new Scene();
        this.ball = null;
        this.topPaddle = null;
        this.bottomPaddle = null;
        this.input = new InputHandler();
        this.lastTime = performance.now();
        this.onStateUpdated = null;
        this.topControls = options.topControls ?? { left: 'z', right: 'x' };
        this.bottomControls = options.bottomControls ?? { left: 'c', right: 'v' };

        // Initialize entities from scene description
        const ballObject = this.scene.getObjects().find(o => o.name === 'ball');
        if (ballObject) {
            this.ball = new Ball(ballObject, this.scene);
        }
        const topPaddleObject = this.scene.getObjects().find(o => o.name === 'paddle_top');
        const bottomPaddleObject = this.scene.getObjects().find(o => o.name === 'paddle_bottom');
        if (topPaddleObject) {
            this.topPaddle = new Paddle(topPaddleObject, this.scene, this.topControls.left, this.topControls.right);
        }
        if (bottomPaddleObject) {
            this.bottomPaddle = new Paddle(bottomPaddleObject, this.scene, this.bottomControls.left, this.bottomControls.right);
        }
    }

    setPlayer(player: 'top' | 'bottom' | 'local'): void {
        this.scene.setPlayer(player);
    }

    setOnStateUpdated(callback: (snapshot: ControllerSnapshot) => void): void {
        this.onStateUpdated = callback;
    }

    setControls(top: { left: string; right: string }, bottom: { left: string; right: string }): void {
        this.topControls = { left: top.left.toLowerCase(), right: top.right.toLowerCase() };
        this.bottomControls = { left: bottom.left.toLowerCase(), right: bottom.right.toLowerCase() };
        if (this.topPaddle) this.topPaddle.setControls(this.topControls.left, this.topControls.right);
        if (this.bottomPaddle) this.bottomPaddle.setControls(this.bottomControls.left, this.bottomControls.right);
    }

    setMatchType(kind: 'online' | 'local'): void {
        this.matchType = kind;
    }

    getMatchType(): 'online' | 'local' {
        return this.matchType;
    }

    getScene(): Scene {
        return this.scene;
    }

    getBallSpeed(): number {
        return this.ball?.speed ?? 0;
    }

    update(): ControllerSnapshot {
        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        if (deltaTime > 0.1) deltaTime = 0.1;

        const moveSpeed = 10.0;
        const rotateSpeed = 3.0;
        if (this.matchType === 'local') {
            this.scene.camera.update(this.input.getKeys(), moveSpeed * deltaTime, rotateSpeed * deltaTime);
        }

        if (this.ball) {
            this.ball.update(deltaTime);
        }
        if (this.topPaddle) this.topPaddle.update(deltaTime, this.input.getKeys());
        if (this.bottomPaddle) this.bottomPaddle.update(deltaTime, this.input.getKeys());

        const snapshot: ControllerSnapshot = {
            scene: this.scene,
            ballSpeed: this.ball?.speed ?? 0
        };
        if (this.onStateUpdated) this.onStateUpdated(snapshot);
        return snapshot;
    }

    // Allow renderer/bootstrap to inform aspect ratio changes without renderer mutating logic state directly
    setViewportSize(width: number, height: number): void {
        if (height > 0) {
            this.scene.camera.aspect = width / height;
        }
    }
}


