export class Light {
    type: string;
    intensity: number;
    position: {x: number, y: number, z: number};
    rotation: {x: number, y: number, z: number};
    color: {r: number, g: number, b: number};

    constructor(type: string, intensity: number, position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number}, color: {r: number, g: number, b: number}) {
        this.type = type;
        this.intensity = intensity;
        this.position = position;
        this.rotation = rotation;
        this.color = color;
    }
}