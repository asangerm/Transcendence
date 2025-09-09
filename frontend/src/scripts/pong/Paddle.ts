import { GameObject, Scene } from './Scene';

export class Paddle {
    private position: [number, number, number];
    private gameObject: GameObject;
    private scene: Scene;
    private speed: number;
    private moveLeft: string;
    private moveRight: string;

    constructor(gameObject: GameObject, scene: Scene, moveLeft: string, moveRight: string) {
        this.gameObject = gameObject;
        this.scene = scene;
        this.position = [gameObject.position.x, gameObject.position.y, gameObject.position.z];
        this.speed = 50; // Paddle movement speed
        this.moveLeft = moveLeft;
        this.moveRight = moveRight;
    }

    update(deltaTime: number, keys: { [key: string]: boolean }): void {
        // Get current position
        const currentX = this.position[0];
        
        // Calculate movement based on input
        let newX = currentX;
        if (keys[this.moveLeft]) {
            newX -= this.speed * deltaTime;
        }
        if (keys[this.moveRight]) {
            newX += this.speed * deltaTime;
        }

        // Clamp paddle position to prevent it from going off screen
        const paddleWidth = this.gameObject.size.x;
        const maxX = 40 - paddleWidth / 2; // Assuming game area is 80 units wide
        newX = Math.max(-maxX, Math.min(maxX, newX));

        // Update position
        this.position[0] = newX;
        this.gameObject.position = { x: this.position[0], y: this.position[1], z: this.position[2] };
    }

    getPosition(): [number, number, number] {
        return [...this.position];
    }
} 