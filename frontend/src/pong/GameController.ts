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

    constructor(options: ControllerOptions = {}) {
        this.scene = new Scene();
        this.ball = null;
        this.topPaddle = null;
        this.bottomPaddle = null;
        this.input = new InputHandler();
        this.lastTime = performance.now();
        this.onStateUpdated = null;

        // Initialize entities from scene description
        const ballObject = this.scene.getObjects().find(o => o.name === 'ball');
        if (ballObject) {
            this.ball = new Ball(ballObject, this.scene);
        }
        const topPaddleObject = this.scene.getObjects().find(o => o.name === 'paddle_top');
        const bottomPaddleObject = this.scene.getObjects().find(o => o.name === 'paddle_bottom');
        const topControls = options.topControls ?? { left: 'o', right: 'l' };
        const bottomControls = options.bottomControls ?? { left: 'r', right: 'f' };
        if (topPaddleObject) {
            this.topPaddle = new Paddle(topPaddleObject, this.scene, topControls.left, topControls.right);
        }
        if (bottomPaddleObject) {
            this.bottomPaddle = new Paddle(bottomPaddleObject, this.scene, bottomControls.left, bottomControls.right);
        }
    }

    setOnStateUpdated(callback: (snapshot: ControllerSnapshot) => void): void {
        this.onStateUpdated = callback;
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

        // Camera controls are input-driven but only affect view; keep here for now
        const moveSpeed = 10.0;
        const rotateSpeed = 3.0;
        this.scene.camera.update(this.input.getKeys(), moveSpeed * deltaTime, rotateSpeed * deltaTime);

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

    // Hook for remote/network inputs to affect game logic deterministically
    applyRemoteInput(input: UserInputState): void {
        // Example: map to paddle moves by setting virtual key states
        const player = input.player.toLowerCase();
        const action = input.action;
        // Minimal placeholder to show API surface; integrate real mapping later
        if (player && action) {
            // No-op for now; local InputHandler handles real keyboard
        }
    }

    // Allow renderer/bootstrap to inform aspect ratio changes without renderer mutating logic state directly
    setViewportSize(width: number, height: number): void {
        if (height > 0) {
            this.scene.camera.aspect = width / height;
        }
    }
}


