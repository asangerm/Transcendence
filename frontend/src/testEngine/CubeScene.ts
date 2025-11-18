import { Camera } from '../pong/scripts/Camera';
import { Light } from '../pong/scripts/Light';

const cubeScene = {
    "camera": {
        "position": [0, 30, -30],
        "rotation": [0.5, 0, 0],
        "fov": 75,
        "aspectX": 16,
        "aspectY": 9
    },
    "objects": [
        {
            "name": "floor",
            "type": "box",
            "position": [0, -1, 0],
            "size": [100, 0.5, 100],
            "color": [0.2, 0.2, 0.2]
        },
        {
            "name": "cube",
            "type": "box",
            "position": [0, 0, 0],
            "size": [2, 2, 2],
            "color": [1, 0.5, 0]
        },
        {
            "name": "wall_north",
            "type": "box",
            "position": [0, 5, 25],
            "size": [50, 10, 1],
            "color": [0.1, 0.1, 0.1]
        },
        {
            "name": "wall_south",
            "type": "box",
            "position": [0, 5, -25],
            "size": [50, 10, 1],
            "color": [0.1, 0.1, 0.1]
        },
        {
            "name": "wall_east",
            "type": "box",
            "position": [25, 5, 0],
            "size": [1, 10, 50],
            "color": [0.1, 0.1, 0.1]
        },
        {
            "name": "wall_west",
            "type": "box",
            "position": [-25, 5, 0],
            "size": [1, 10, 50],
            "color": [0.1, 0.1, 0.1]
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
    }>;
    lights?: Array<{
        type: string;
        position?: [number, number, number];
        rotation?: [number, number, number];
        color?: [number, number, number];
    }>;
};

export class CubeScene {
    camera: Camera;
    objects: GameObject[];
    lights: Light[];
    private loadPromise: Promise<void>;

    constructor() {
        this.camera = new Camera();
        this.objects = [];
        this.lights = [];
        this.loadPromise = this.loadScene();
    }

    async waitForLoad(): Promise<void> {
        await this.loadPromise;
    }

    private async loadScene(): Promise<void> {
        try {
            const data = (cubeScene as unknown) as ImportedScene;

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

            console.log('loaded cube scene: ', { scene: data });
        } catch (error) {
            console.error('Error loading cube scene:', error);
        }
    }

    findObjectByName(name: string): GameObject | undefined {
        return this.objects.find((o) => o.name === name);
    }

    updateCubePosition(position: { x: number; y: number; z: number }): void {
        const cube = this.findObjectByName('cube');
        if (cube) {
            cube.position = position;
        }
    }

    getObjects(): GameObject[] {
        return this.objects;
    }
}
