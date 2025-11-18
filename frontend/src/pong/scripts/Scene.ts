import { Camera } from './Camera';
import { Light } from './Light';

const player1Camera = {
    "position": [0, 30, 65],
    "rotation": [0.4, 3.1415926535, 0],
    "fov": 75,
    "aspectX": 16,
    "aspectY": 9
}

const player2Camera = {
    "position": [0, 30, -65],
    "rotation": [0.4, 0, 0],
    "fov": 75,
    "aspectX": 16,
    "aspectY": 9
}

const localCamera = {
    "position": [-25, 35, 0],
    "rotation": [1, 1.5707963267948966192313216916398, 0],
    "fov": 75,
    "aspectX": 16,
    "aspectY": 9
}

const defaultScene = {
    "camera": player1Camera,
    "objects": [
        {
            "name": "floor",
            "type": "box",
            "position": [0, -1, 0],
            "size": [10000, 0.5, 10000],
			"color": [0.2, 0.2, 0.2],
			"texture": "https://playground.babylonjs.com/textures/floor.png"
        },{
            "name": "arena",
            "type": "box",
            "position": [0, -0.25, 0],
            "size": [50, 0.5, 100],
			"color": [0.2, 0.8, 0.5],
			"texture": "checker"
        },
        {
            "name": "ball",
            "type": "sphere",
            "position": [0, 1.5, 0],
            "size": [2, 2, 2],
			"color": [1, 0, 0],
			"texture": "glossy"
        },
        {
            "name": "paddle_top",
            "type": "box",
            "position": [0, 1.5, 45],
            "size": [10, 2.5, 1],
			"color": [0, 1, 0],
			"texture": "glossy"
        },
        {
            "name": "paddle_bottom",
            "type": "box",
            "position": [0, 1.5, -45],
            "size": [10, 2.5, 1],
			"color": [0, 0, 1],
			"texture": "glossy"
        },
        {
            "name": "wall_top",
            "type": "box",
            "position": [0, 2.25, 50],
            "size": [51, 5, 1],
			"color": [0, 0, 0],
			"texture": "metal"
			// "texture": "https://assets.babylonjs.com/environments/bricktile.jpg"
        },
        {
            "name": "wall_bottom",
            "type": "box",
            "position": [0, 2.25, -50],
            "size": [51, 5, 1],
			"color": [0, 0, 0],
			"texture": "metal"
			// "texture": "https://assets.babylonjs.com/environments/bricktile.jpg"
        },
        {
            "name": "wall_left",
            "type": "box",
            "position": [25, 2.25, 0],
            "size": [1, 5, 101],
			"color": [0, 0, 0],
			"texture": "metal"
			// "texture": "https://assets.babylonjs.com/environments/bricktile.jpg"
        },
        {
            "name": "wall_right",
            "type": "box",
            "position": [-25, 2.25, 0],
            "size": [1, 5, 101],
			"color": [0, 0, 0],
			"texture": "metal"
			// "texture": "https://assets.babylonjs.com/environments/bricktile.jpg"
        }
    ]
}

export interface GameObject {
    type: string;
    name: string;
    position: {x: number, y: number, z: number};
    size: {x: number, y: number, z: number};
    rotation: {x: number, y: number, z: number};
    color: {r: number, g: number, b: number};
	texture?: string;
}

type ImportedScene = {
    camera?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        fov?: number;
        aspectX?: number;
        aspectY?: number;
    };
    objects?: Array<{
        name: string;
        type: string;
        position?: [number, number, number];
        rotation?: [number, number, number];
        size?: [number, number, number];
        color?: [number, number, number];
        texture?: string;
    }>;
    lights?: Array<{
        type: string;
        position?: [number, number, number];
        rotation?: [number, number, number];
        color?: [number, number, number];
    }>;
};

export class Scene {
    camera: Camera;
    objects: GameObject[];
    lights: Light[];

    constructor() {
        this.camera = new Camera();
        this.objects = [];
        this.lights = [];
        this.loadScene();
    }

    private async loadScene(): Promise<void> {
        try {
            const data = (defaultScene as unknown) as ImportedScene;

            if (data.camera) {
                const pos = data.camera.position ?? [0, 0, 10];
                const rot = data.camera.rotation ?? [0, 0, 0];
                const aspectX = data.camera.aspectX ?? 16;
                const aspectY = data.camera.aspectY ?? 9;
                if (pos.length === 3) {
                    this.camera.position = { x: pos[0], y: pos[1], z: pos[2] };
                }
                if (rot.length === 3) {
                    this.camera.rotation = { x: rot[0], y: rot[1], z: rot[2] };
                }
                if (typeof data.camera.fov === 'number') {
                    this.camera.fov = data.camera.fov;
                }
                this.camera.aspect = aspectX / aspectY;
            }

            if (data.objects) {
                this.objects = data.objects.map((o) => ({
                    type: o.type,
                    name: o.name,
                    position: { x: o.position?.[0] ?? 0, y: o.position?.[1] ?? 0, z: o.position?.[2] ?? 0 },
                    size: { x: o.size?.[0] ?? 1, y: o.size?.[1] ?? 1, z: o.size?.[2] ?? 1 },
                    rotation: { x: o.rotation?.[0] ?? 0, y: o.rotation?.[1] ?? 0, z: o.rotation?.[2] ?? 0 },
                    color: { r: o.color?.[0] ?? 1, g: o.color?.[1] ?? 1, b: o.color?.[2] ?? 1 },
                    texture: o.texture ?? undefined,
                }));
            }

            if (data.lights) {
                this.lights = data.lights.map((l) => new Light(
                    l.type,
                    1,
                    { x: l.position?.[0] ?? 0, y: l.position?.[1] ?? 0, z: l.position?.[2] ?? 0 },
                    { x: l.rotation?.[0] ?? 0, y: l.rotation?.[1] ?? 0, z: l.rotation?.[2] ?? 0 },
                    { r: l.color?.[0] ?? 1, g: l.color?.[1] ?? 1, b: l.color?.[2] ?? 1 }
                ));
            }

            console.log('loaded scene: ', { scene: data });
        } catch (error) {
            console.error('Error loading scene:', error);
        }
    }

    setPlayer(player: 'top' | 'bottom' | 'local'): void {
        if (player === 'local') {
            this.camera.position = { x: localCamera.position[0], y: localCamera.position[1], z: localCamera.position[2] };
            this.camera.rotation = { x: localCamera.rotation[0], y: localCamera.rotation[1], z: localCamera.rotation[2] };
            this.camera.fov = localCamera.fov;
            this.camera.aspect = localCamera.aspectX / localCamera.aspectY;
        } else if (player === 'top') {
            this.camera.position = { x: player1Camera.position[0], y: player1Camera.position[1], z: player1Camera.position[2] };
            this.camera.rotation = { x: player1Camera.rotation[0], y: player1Camera.rotation[1], z: player1Camera.rotation[2] };
            this.camera.fov = player1Camera.fov;
            this.camera.aspect = player1Camera.aspectX / player1Camera.aspectY;
        } else {
            this.camera.position = { x: player2Camera.position[0], y: player2Camera.position[1], z: player2Camera.position[2] };
            this.camera.rotation = { x: player2Camera.rotation[0], y: player2Camera.rotation[1], z: player2Camera.rotation[2] };
            this.camera.fov = player2Camera.fov;
            this.camera.aspect = player2Camera.aspectX / player2Camera.aspectY;
        }
    }

    findObjectByIndex(index: number): GameObject | undefined {
        return this.objects[index];
    }

    findObjectByName(name: string): GameObject | undefined {
        return this.objects.find((o) => o.name === name);
    }

    updateObjectByIndex(index: number, updates: Partial<GameObject>): GameObject | undefined {
        const obj = this.findObjectByIndex(index);
        if (obj) {
            Object.assign(obj, updates);
        }
        return obj;
    }

    getObjects(): GameObject[] {
        return this.objects;
    }
} 