
const controls = {
    forward: 'z',
    backward: 's',
    left: 'q',
    right: 'd',
    up: ' ',
    down: 'shift',
    yawLeft: 'arrowleft',
    yawRight: 'arrowright',
    pitchUp: 'arrowup',
    pitchDown: 'arrowdown',
}


export class Camera {
    position: {x: number, y: number, z: number};
    rotation: {x: number, y: number, z: number};  // [pitch, yaw, roll]
    fov: number;
    aspect: number;

    constructor(position: {x: number, y: number, z: number} = {x: 0, y: -7.88, z: 5}, rotation: {x: number, y: number, z: number} = {x: 0, y: 0, z: 0}, fov = 90, aspect = 1) {
        this.position = position;
        this.rotation = rotation;
        this.fov = fov;
        this.aspect = aspect;
    }

    update(keys: { [key: string]: boolean }, moveSpeed = 0.01, rotateSpeed = 0.02): void {
        const forward = [
            -Math.cos(this.rotation.y + Math.PI/2),   // yaw
            0,
            Math.sin(this.rotation.y + Math.PI/2),  // yaw
        ];
        const right = [
            Math.cos(this.rotation.y),   // yaw
            0,
            -Math.sin(this.rotation.y),  // yaw
        ];

        // Update position
        if (keys[controls.forward]) {
            this.position.x += forward[0] * moveSpeed;
            this.position.z += forward[2] * moveSpeed;
        }
        if (keys[controls.backward]) {
            this.position.x -= forward[0] * moveSpeed;
            this.position.z -= forward[2] * moveSpeed;
        }
        if (keys[controls.left]) {
            this.position.x -= right[0] * moveSpeed;
            this.position.z -= right[2] * moveSpeed;
        }
        if (keys[controls.right]) {
            this.position.x += right[0] * moveSpeed;
            this.position.z += right[2] * moveSpeed;
        }
        if (keys[controls.up]) {
            this.position.y += moveSpeed;
        }
        if (keys[controls.down]) {
            this.position.y -= moveSpeed;
        }

        // Update rotation
        if (keys[controls.yawRight]) {
            this.rotation.y += rotateSpeed;  // yaw
        }
        if (keys[controls.yawLeft]) {
            this.rotation.y -= rotateSpeed;  // yaw
        }
        if (keys[controls.pitchDown]) {
            this.rotation.x += rotateSpeed;  // pitch
        }
        if (keys[controls.pitchUp]) {
            this.rotation.x -= rotateSpeed;  // pitch
        }
    }

    getRotationMatrix(): Float32Array {
        const pitch = this.rotation.x;  // X rotation (up/down)
        const yaw = this.rotation.y;    // Y rotation (left/right)
        
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        return new Float32Array([
            cosY, 0, -sinY,
            -sinY * sinP, cosP, -cosY * sinP,
            sinY * cosP, sinP, cosY * cosP
        ]);
    }
} 