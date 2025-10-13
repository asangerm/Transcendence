import { Renderer } from '../scripts/pong/Renderer';
import { CubeScene } from './CubeScene';

export class CubeRenderer {
    private canvas: HTMLCanvasElement;
    private container: HTMLDivElement;
    private textDisplay: HTMLDivElement;
    private renderer: Renderer;
    private animationFrameId: number | null;
    private lastFrameTime: number;
    private fps: number;
    private frameCount: number;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.container = document.createElement('div');
        this.container.className = 'cube-container';
        this.container.classList.add('relative', 'w-full', 'h-full', 'overflow-hidden', 'aspect-[16/9]');
        this.textDisplay = document.createElement('div');
        this.textDisplay.className = 'cube-text-display';
        this.textDisplay.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'bg-black/50', 'text-green-600', 'stroke-8', 'stroke-green-500', 'p-2', 'z-10', 'font-mono');
        this.textDisplay.textContent = 'Initializing Cube Engine...';
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.textDisplay);
        this.renderer = new Renderer(this.canvas, this.textDisplay);
        this.animationFrameId = null;
        this.lastFrameTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;
    }

    async mount(element: HTMLElement): Promise<void> {
        element.appendChild(this.container);
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        // Initialize the renderer
        await this.renderer.initialize();
        this.textDisplay.textContent = 'Cube Engine Ready';
    }

    unmount(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        window.removeEventListener('resize', this.handleResize);
        this.container.remove();
        this.canvas.remove();
    }

    private handleResize = (): void => {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    };

    requestFrame(scene: CubeScene, cubeSpeed: number): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.render(scene, cubeSpeed);
        });
    }

    private render(scene: CubeScene, cubeSpeed: number): void {
        // Update FPS counter
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }

        // Render the scene using the existing renderer
        this.renderer.render(scene as any, cubeSpeed);

        // Update text display with cube-specific info
        const cube = scene.findObjectByName('cube');
        const pos = cube?.position || { x: 0, y: 0, z: 0 };
        this.textDisplay.textContent = `Cube: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) | Speed: ${cubeSpeed.toFixed(2)} | FPS: ${this.fps}`;
    }

    getCanvasSize(): { width: number; height: number } {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        return { width: rect?.width ?? 800, height: rect?.height ?? 600 };
    }
}
