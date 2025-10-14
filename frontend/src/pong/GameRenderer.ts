import { Renderer } from '../scripts/pong/Renderer';
import { Scene } from '../scripts/pong/Scene';

export class GameRenderer {
    private canvas: HTMLCanvasElement;
    private container: HTMLDivElement;
    private textDisplay: HTMLDivElement;
    private statusIndicator: HTMLDivElement;
    private renderer: Renderer;
    private animationFrameId: number | null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.container = document.createElement('div');
        this.container.className = 'pong-container';
        this.container.classList.add('relative', 'w-full', 'h-full', 'overflow-hidden', 'aspect-[16/9]');
        this.textDisplay = document.createElement('div');
        this.textDisplay.className = 'pong-text-display';
        this.textDisplay.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'bg-black/50', 'text-red-600', 'stroke-8', 'stroke-red-500', 'p-2', 'z-10', 'font-mono');
        this.textDisplay.textContent = 'Initializing...';
        
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'pong-status-indicator';
        this.statusIndicator.classList.add('absolute', 'top-4', 'right-4', 'px-4', 'py-2', 'rounded-lg', 'font-bold', 'text-white', 'z-20', 'font-mono', 'text-sm', 'shadow-lg');
        this.statusIndicator.textContent = 'MODE: CLIENT';
        this.statusIndicator.style.backgroundColor = 'rgba(255, 107, 53, 0.9)';
        this.statusIndicator.style.border = '2px solid #ff6b35';
        
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.textDisplay);
        this.container.appendChild(this.statusIndicator);
        this.renderer = new Renderer(this.canvas, this.textDisplay);
        this.animationFrameId = null;
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

    requestFrame(scene: Scene, ballSpeed: number, isOnline: boolean = false): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            this.renderer.render(scene, ballSpeed, isOnline);
            this.updateStatusIndicator(isOnline);
        });
    }

    private updateStatusIndicator(isOnline: boolean): void {
        const mode = isOnline ? 'SERVER' : 'CLIENT';
        const modeColor = isOnline ? '#00ff00' : '#ff6b35';
        const modeBg = isOnline ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 107, 53, 0.9)';
        
        this.statusIndicator.textContent = `MODE: ${mode}`;
        this.statusIndicator.style.backgroundColor = modeBg;
        this.statusIndicator.style.border = `2px solid ${modeColor}`;
    }

    getCanvasSize(): { width: number; height: number } {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        return { width: rect?.width ?? this.canvas.width, height: rect?.height ?? this.canvas.height };
    }
}


