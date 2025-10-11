import { InputHandler } from './InputHandler';
import { Renderer } from './Renderer';
import { Scene } from './Scene';
import { Ball } from './Ball';
import { Paddle } from './Paddle';

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
    }

    private handleResize(): void {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.scene.camera.aspect = rect.width / rect.height;
        }
    }

    private gameLoop(currentTime: number): void {
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

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
