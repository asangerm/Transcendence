import { CubeScene } from './CubeScene';
import { CubeRenderer } from './CubeRenderer';
import { TestEngineRealtimeClient } from '../services/realtime/testEngineClient';
import type { TestEngineState, Vector3 } from '../types/realtime';
import { getApiUrl } from '../config';

export class TestEngine {
    private scene: CubeScene;
    private renderer: CubeRenderer;
    private rafId: number | null;
    private realtime: TestEngineRealtimeClient | null;
    private online: boolean;
    private onlineKeys: { [key: string]: boolean } = {};
    private cubeSpeed: number;
    
    // Interpolation state
    private currentServerState: TestEngineState | null = null;
    private previousServerState: TestEngineState | null = null;
    private lastServerUpdate: number = 0;
    private interpolationDelay: number = 100; // 100ms interpolation delay
    
    // Display state
    private displayPosition: Vector3 = { x: 0, y: 0, z: 0 };

    constructor() {
        this.scene = new CubeScene();
        this.renderer = new CubeRenderer();
        this.rafId = null;
        this.realtime = null;
        this.online = false;
        this.cubeSpeed = 0;
    }

    async initialize(): Promise<void> {
        // Wait for scene to load
        await this.scene.waitForLoad();
    }

    async mount(element: HTMLElement, opts?: { online?: boolean; gameId?: string }): Promise<void> {
        await this.renderer.mount(element);
        await this.initialize();
        
        if (opts?.online) {
            this.online = true;
            const gameId = opts.gameId ?? (await this.createGame());
            this.realtime = new TestEngineRealtimeClient();
            this.realtime.setOnState((state) => this.applyServerState(state));
            await this.realtime.connect(gameId);
            
            // Attach keyboard handlers
            const keyHandler = (e: KeyboardEvent) => this.handleOnlineKey(e);
            window.addEventListener('keydown', keyHandler, { passive: true });
            window.addEventListener('keyup', keyHandler);
            
            // Start render loop
            this.loop();
        } else {
            // Offline mode - just render the static scene
            this.loop();
        }
    }

    unmount(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        if (this.realtime) {
            this.realtime.disconnect();
            this.realtime = null;
        }
        
        this.renderer.unmount();
    }

    private async createGame(): Promise<string> {
        const response = await fetch(`${getApiUrl()}/api/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'test' })
        });
        const data = await response.json();
        return data.id;
    }

    private handleOnlineKey(e: KeyboardEvent): void {
        const key = e.key.toLowerCase();
        const isPressed = e.type === 'keydown';
        
        if (!this.realtime) return;
        
        // Update local key state and send appropriate commands
        switch (key) {
            case 'w':
            case 'arrowup':
                this.onlineKeys.up = isPressed;
                if (!isPressed) this.sendStopCommand('up');
                break;
            case 's':
            case 'arrowdown':
                this.onlineKeys.down = isPressed;
                if (!isPressed) this.sendStopCommand('down');
                break;
            case 'a':
            case 'arrowleft':
                this.onlineKeys.left = isPressed;
                if (!isPressed) this.sendStopCommand('left');
                break;
            case 'd':
            case 'arrowright':
                this.onlineKeys.right = isPressed;
                if (!isPressed) this.sendStopCommand('right');
                break;
            case 'q':
                this.onlineKeys.forward = isPressed;
                if (!isPressed) this.sendStopCommand('forward');
                break;
            case 'e':
                this.onlineKeys.backward = isPressed;
                if (!isPressed) this.sendStopCommand('backward');
                break;
        }
        
        // Send current input state as JSON (only for pressed keys)
        if (isPressed) {
            this.sendInputState();
        }
    }
    
    private sendInputState(): void {
        if (!this.realtime) return;
        
        const inputData: Record<string, number> = {};
        
        // Build input object with move commands (1) for pressed keys
        if (this.onlineKeys.up) inputData.up = 1;
        if (this.onlineKeys.down) inputData.down = 1;
        if (this.onlineKeys.left) inputData.left = 1;
        if (this.onlineKeys.right) inputData.right = 1;
        if (this.onlineKeys.forward) inputData.forward = 1;
        if (this.onlineKeys.backward) inputData.backward = 1;
        
        // Send the input data
        this.realtime.sendInput(inputData);
    }
    
    private sendStopCommand(direction: string): void {
        if (!this.realtime) return;
        
        const inputData: Record<string, number> = {};
        inputData[direction] = 2; // Stop command
        
        this.realtime.sendInput(inputData);
    }

    private applyServerState(state: TestEngineState): void {
        // Store previous state for interpolation
        this.previousServerState = this.currentServerState;
        this.currentServerState = state;
        this.lastServerUpdate = performance.now();
        
        // Calculate cube speed for display
        this.cubeSpeed = Math.sqrt(
            state.cube.velocity.x ** 2 + 
            state.cube.velocity.y ** 2 + 
            state.cube.velocity.z ** 2
        );
    }


    private loop(): void {
        if (this.online && this.currentServerState) {
            // Online mode with interpolation
            this.updateWithInterpolation();
        } else {
            // Offline mode - just render static scene
            this.renderer.requestFrame(this.scene, 0);
        }
        
        this.rafId = requestAnimationFrame(() => this.loop());
    }

    private updateWithInterpolation(): void {
        if (!this.currentServerState) return;
        
        const currentTime = performance.now();
        const timeSinceServerUpdate = currentTime - this.lastServerUpdate;
        
        // If we have both current and previous states, interpolate between them
        if (this.previousServerState && timeSinceServerUpdate < this.interpolationDelay) {
            const alpha = Math.min(1, timeSinceServerUpdate / this.interpolationDelay);
            
            this.displayPosition = {
                x: this.previousServerState.cube.position.x + 
                   (this.currentServerState.cube.position.x - this.previousServerState.cube.position.x) * alpha,
                y: this.previousServerState.cube.position.y + 
                   (this.currentServerState.cube.position.y - this.previousServerState.cube.position.y) * alpha,
                z: this.previousServerState.cube.position.z + 
                   (this.currentServerState.cube.position.z - this.previousServerState.cube.position.z) * alpha,
            };
        } else {
            // Use current server state directly
            this.displayPosition = { ...this.currentServerState.cube.position };
        }
        
        this.scene.updateCubePosition(this.displayPosition);
        this.renderer.requestFrame(this.scene, this.cubeSpeed);
    }

}
