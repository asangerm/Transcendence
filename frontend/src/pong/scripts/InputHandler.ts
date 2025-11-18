export class InputHandler {
    private keys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this.keys[event.key.toLowerCase()] = true;
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keys[event.key.toLowerCase()] = false;
    }

    public isKeyPressed(key: string): boolean {
        return this.keys[key.toLowerCase()] || false;
    }

    public getKeys(): { [key: string]: boolean } {
        return this.keys;
    }
} 