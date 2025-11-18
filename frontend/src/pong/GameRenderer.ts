import { Renderer } from './scripts/Renderer';
import { Scene } from './scripts/Scene';

export class GameRenderer {
    private canvas: HTMLCanvasElement;
    private container: HTMLDivElement;
    private textDisplay: HTMLDivElement;
    private renderer: Renderer;
    private animationFrameId: number | null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.container = document.createElement('div');
        this.container.className = 'pong-container';
        this.container.classList.add('relative', 'w-full', 'h-full', 'overflow-hidden', 'aspect-[16/9]');
        this.textDisplay = document.createElement('div');
        this.textDisplay.className = 'pong-text-display';
        this.textDisplay.classList.add('absolute', 'inset-0', 'text-red-600', 'stroke-8', 'stroke-red-500', 'p-2', 'py-0', 'z-10', 'font-mono', 'font-black', 'select-none', 'pointer-events-none');
        this.textDisplay.textContent = 'Initializing...';
        
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.textDisplay);
        this.renderer = new Renderer(this.canvas, this.textDisplay);
        this.animationFrameId = null;
    }

    setTPS(tps: number): void {
        (this.renderer as any).setTPS?.(tps);
    }

    async mount(element: HTMLElement): Promise<void> {
        element.appendChild(this.container);
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        await this.renderer.initialize();
    }

    unmount(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        window.removeEventListener('resize', this.handleResize);
        this.container.remove();
    }

    private handleResize = (): void => {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    };

    requestFrame(scene: Scene, scores: { top: number; bottom: number }, isOnline: boolean = false, players?: { top?: string; bottom?: string }, result?: { mode: 'none' | 'victory' | 'defeat'; winner?: string }): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.renderer.render(scene, scores, isOnline, players, result);
            // this.updateStatusIndicator(isOnline);
        });
    }

    getCanvasSize(): { width: number; height: number } {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        return { width: rect?.width ?? this.canvas.width, height: rect?.height ?? this.canvas.height };
    }
}


