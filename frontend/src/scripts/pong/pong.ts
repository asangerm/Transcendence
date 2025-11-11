import { InputHandler } from './InputHandler';
import { Renderer } from './Renderer';
import { Scene } from './Scene';
import { Ball } from './Ball';
import { Paddle } from './Paddle';
import { AIPlayer, AIDifficulty } from './AIPlayer';

export class PongGame {
    private canvas: HTMLCanvasElement;
    private canvasContainer: HTMLDivElement;
    // private textDisplay: HTMLDivElement;
    private renderer: Renderer;
    private scene: Scene;
    private inputHandler: InputHandler;
    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private ball: Ball | null = null;
    private topPaddle: Paddle | null = null;
    private bottomPaddle: Paddle | null = null;

    // AI
    private aiPlayer: AIPlayer | null = null;
    private lastAIVisionUpdate = 0;
    private readonly AI_VISION_RATE = 1000; // 1Hz
    private aiEnabled = false;
    private aiPosition: 'top' | 'bottom' = 'top';
    private currentAIDecision: {
        targetX: number;
        movement?: string;
        strategy?: string;
    } = { targetX: 0 };

    constructor() {
        this.canvas = document.createElement('canvas');
        
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'pong-container';
        this.canvasContainer.classList.add('relative', 'w-full', 'h-full', 'overflow-hidden', 'aspect-[16/9]');

        const textDisplay = document.createElement('div');
        textDisplay.className = 'pong-text-display';
        textDisplay.classList.add(
            'absolute',
            'top-0',
            'left-0',
            'w-full',
            'bg-black/50',
            'text-red-600',
            'stroke-8',
            'stroke-red-500',
            'p-2',
            'z-10',
            'font-mono'
        );
        textDisplay.textContent = 'Camera: (0, 0, 0) | FPS: 0';
        
        this.canvasContainer.appendChild(this.canvas);
        this.canvasContainer.appendChild(textDisplay);
        
        // this.textDisplay = document.createElement('div');
        // this.textDisplay.className = 'pong-text-display';
        // this.textDisplay.classList.add('absolute', 'top-0', 'left-0', 'border-2', 'border-red-600', 'text-left', 'text-red-600');
        
        this.scene = new Scene();
        this.renderer = new Renderer(this.canvas, textDisplay);
        this.inputHandler = new InputHandler();
    }

    async mount(element: HTMLElement): Promise<void> {
        element.appendChild(this.canvasContainer);
        this.handleResize();
        window.addEventListener('resize', this.handleResize.bind(this));
        await this.renderer.initialize();
        
        // Initialize ball
        const ballObject = this.scene.getObjects().find(obj => obj.name === 'ball');
        if (ballObject) {
            this.ball = new Ball(ballObject, this.scene);
        }

        // Initialize paddles
        const topPaddleObject = this.scene.getObjects().find(obj => obj.name === 'paddle_top');
        const bottomPaddleObject = this.scene.getObjects().find(obj => obj.name === 'paddle_bottom');
        
        if (topPaddleObject) {
            this.topPaddle = new Paddle(topPaddleObject, this.scene, 'o', 'l');
        }
        if (bottomPaddleObject) {
            this.bottomPaddle = new Paddle(bottomPaddleObject, this.scene, 'r', 'f');
        }
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    unmount(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.canvas.remove();

        if (this.aiPlayer) {
            this.aiPlayer.cleanup();
            this.aiPlayer = null;
        }
    }

    //Enable AI player
    enableAI(position: 'top' | 'bottom' = 'top', difficulty: AIDifficulty = 'medium'): void {
        this.aiEnabled = true;
        this.aiPosition = position;
        this.aiPlayer = new AIPlayer('ai-player-1', position, difficulty);
    }

    disableAI(): void {
        this.aiEnabled = false;
        if (this.aiPlayer) {
            this.aiPlayer.cleanup();
            this.aiPlayer = null;
        }
    }

    private handleResize(): void {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.scene.camera.aspect = rect.width / rect.height;
        }
    }

    // Update AI vision at 1Hz
    private updateAIVision(): void {
        if (!this.aiEnabled || !this.aiPlayer || !this.ball) return;

        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastAIVisionUpdate;

        // Get new AI decision at 1Hz
        if (timeSinceLastUpdate >= this.AI_VISION_RATE) {
            this.lastAIVisionUpdate = now;
            const aiPaddle = this.aiPosition === 'top' ? this.topPaddle : this.bottomPaddle;
            if (!aiPaddle) return;

            const decision = this.aiPlayer.processDecision(this.ball, aiPaddle);
            this.currentAIDecision = decision;
        }

        // Apply current AI decision every frame (60Hz)
        this.applyAIDecision(this.currentAIDecision);
    }

    // Smart navigation system with intelligent braking
    private applyAIDecision(decision: { targetX: number }): void {
        const aiPaddle = this.aiPosition === 'top' ? this.topPaddle : this.bottomPaddle;
        if (!aiPaddle) return;

        const keys = this.inputHandler.getKeys();
        const leftKey = this.aiPosition === 'top' ? 'o' : 'r';
        const rightKey = this.aiPosition === 'top' ? 'l' : 'f';

        const currentX = aiPaddle.getPosition()[0];
        const targetX = decision.targetX;
        const diff = targetX - currentX;

        // Calculate braking distance (same speed as Paddle.ts)
        const paddleSpeed = 50; // units/sec
        const deltaTime = 1 / 60; // ~60 FPS
        const distancePerFrame = paddleSpeed * deltaTime;
        const brakingDistance = distancePerFrame * 2;

        keys[leftKey] = false;
        keys[rightKey] = false;

        // Stop if close enough to target
        if (Math.abs(diff) < brakingDistance) return;

        // Move towards target
        if (diff < 0) {
            keys[leftKey] = true;
        } else {
            keys[rightKey] = true;
        }
    }

    private gameLoop(currentTime: number): void {
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.updateAIVision();

        // Update camera based on input with delta time
        const moveSpeed = 10.0;
        const rotateSpeed = 3.0;
        this.scene.camera.update(this.inputHandler.getKeys(), moveSpeed * deltaTime, rotateSpeed * deltaTime);

        // Update ball physics
        if (this.ball) {
            this.ball.update(deltaTime);
        }

        // Update paddles
        if (this.topPaddle) {
            this.topPaddle.update(deltaTime, this.inputHandler.getKeys());
        }
        if (this.bottomPaddle) {
            this.bottomPaddle.update(deltaTime, this.inputHandler.getKeys());
        }

        // Render the scene
        this.renderer.render(this.scene, this.ball?.speed ?? 0);

        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}
