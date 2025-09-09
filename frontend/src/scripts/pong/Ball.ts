import { GameObject, Scene } from './Scene';

export class Ball {
    private position: [number, number, number];
    private velocity: [number, number, number];
    private radius: number;
    private speed: number;
    private gameObject: GameObject;
    private scene: Scene;

    constructor(gameObject: GameObject, scene: Scene) {
        this.gameObject = gameObject;
        this.scene = scene;
        this.position = [gameObject.position.x, gameObject.position.y, gameObject.position.z];
        this.velocity = [0, 0, 0];
        this.radius = gameObject.size.x / 2; // Assuming sphere has equal dimensions
        this.speed = 20; // Initial speed
        this.reset();
    }

    reset(): void {
        // Reset position to center
        this.position = [0, 0, 0];
        
        // Random initial direction
        // const angle = Math.random() * Math.PI * 2;
        // this.velocity = [
        //     Math.cos(angle) * this.speed,
        //     0,
        //     Math.sin(angle) * this.speed
        // ];
        
        // Update game object position
        this.gameObject.position = { x: this.position[0], y: this.position[1], z: this.position[2] };
    }

    update(deltaTime: number): void {
        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }
        // Update position based on velocity
        const newPosition: [number, number, number] = [
            this.position[0] + this.velocity[0] * deltaTime,
            this.position[1] + this.velocity[1] * deltaTime,
            this.position[2] + this.velocity[2] * deltaTime
        ];

        // Check for collisions
        const collision = this.checkCollision(newPosition);
        if (collision) {
            // Move to collision point
            this.position = collision.position;
            // Update velocity based on collision
            this.velocity = collision.velocity;
        } else {
            // No collision, update position
            this.position = newPosition;
        }

        // Update game object position
        this.gameObject.position = { x: this.position[0], y: this.position[1], z: this.position[2] };
    }

    private checkCollision(newPosition: [number, number, number]): { position: [number, number, number], velocity: [number, number, number] } | null {
        const objects = this.scene.getObjects();
        let closestCollision: { position: [number, number, number], velocity: [number, number, number], distance: number } | null = null;

        for (const obj of objects) {
            if (obj === this.gameObject) continue;

            let collision: { position: [number, number, number], velocity: [number, number, number] } | null = null;

            if (obj.type === 'box') {
                collision = this.checkBoxCollision(obj, newPosition);
            } else if (obj.type === 'sphere') {
                collision = this.checkSphereCollision(obj, newPosition);
            }

            if (collision) {
                // Calculate distance to collision point
                const dx = collision.position[0] - this.position[0];
                const dy = collision.position[1] - this.position[1];
                const dz = collision.position[2] - this.position[2];
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (!closestCollision || distance < closestCollision.distance) {
                    closestCollision = { ...collision, distance };
                }
            }
        }

        return closestCollision ? { position: closestCollision.position, velocity: closestCollision.velocity } : null;
    }

    private checkBoxCollision(box: GameObject, newPosition: [number, number, number]): { position: [number, number, number], velocity: [number, number, number] } | null {
        // Get box properties in array form
        const boxPos: [number, number, number] = [box.position.x, box.position.y, box.position.z];
        const boxSize: [number, number, number] = [box.size.x, box.size.y, box.size.z];
        const boxRot: [number, number, number] = [box.rotation?.x ?? 0, box.rotation?.y ?? 0, box.rotation?.z ?? 0];

        // Calculate box corners in world space
        const corners = this.getBoxCorners(boxPos, boxSize, boxRot);

        // Find closest point on box to ball
        const closestPoint = this.findClosestPointOnBox(newPosition, corners);

        // Calculate distance to closest point
        const dx = newPosition[0] - closestPoint[0];
        const dy = newPosition[1] - closestPoint[1];
        const dz = newPosition[2] - closestPoint[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check if collision occurred
        if (distance < this.radius) {
            // Calculate collision normal
            const normal = this.normalize([dx, dy, dz]);

            // Calculate new position (move ball out of collision)
            const position: [number, number, number] = [
                closestPoint[0] + normal[0] * this.radius,
                closestPoint[1] + normal[1] * this.radius,
                closestPoint[2] + normal[2] * this.radius
            ];

            // Calculate new velocity (reflect off surface)
            const velocity = this.reflectVelocity(this.velocity, normal);

            return { position, velocity };
        }

        return null;
    }

    private checkSphereCollision(sphere: GameObject, newPosition: [number, number, number]): { position: [number, number, number], velocity: [number, number, number] } | null {
        const spherePos: [number, number, number] = [sphere.position.x, sphere.position.y, sphere.position.z];
        const sphereRadius = sphere.size.x / 2;

        // Calculate distance between centers
        const dx = newPosition[0] - spherePos[0];
        const dy = newPosition[1] - spherePos[1];
        const dz = newPosition[2] - spherePos[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check if collision occurred
        const minDistance = this.radius + sphereRadius;
        if (distance < minDistance) {
            // Calculate collision normal
            const normal = this.normalize([dx, dy, dz]);

            // Calculate new position (move ball out of collision)
            const position: [number, number, number] = [
                spherePos[0] + normal[0] * minDistance,
                spherePos[1] + normal[1] * minDistance,
                spherePos[2] + normal[2] * minDistance
            ];

            // Calculate new velocity (reflect off surface)
            const velocity = this.reflectVelocity(this.velocity, normal);

            return { position, velocity };
        }

        return null;
    }

    private getBoxCorners(pos: [number, number, number], size: [number, number, number], rot: [number, number, number]): [number, number, number][] {
        const [sx, sy, sz] = size;
        const corners: [number, number, number][] = [
            [-sx/2, -sy/2, -sz/2],
            [sx/2, -sy/2, -sz/2],
            [sx/2, sy/2, -sz/2],
            [-sx/2, sy/2, -sz/2],
            [-sx/2, -sy/2, sz/2],
            [sx/2, -sy/2, sz/2],
            [sx/2, sy/2, sz/2],
            [-sx/2, sy/2, sz/2]
        ];

        // Apply rotation
        const [rx, ry, rz] = rot;
        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        const cosZ = Math.cos(rz);
        const sinZ = Math.sin(rz);

        return corners.map(([x, y, z]) => {
            // Rotate around X
            let [x1, y1, z1] = [x, y * cosX - z * sinX, y * sinX + z * cosX];
            // Rotate around Y
            let [x2, y2, z2] = [x1 * cosY + z1 * sinY, y1, -x1 * sinY + z1 * cosY];
            // Rotate around Z
            let [x3, y3, z3] = [x2 * cosZ - y2 * sinZ, x2 * sinZ + y2 * cosZ, z2];
            // Translate to position
            return [x3 + pos[0], y3 + pos[1], z3 + pos[2]] as [number, number, number];
        });
    }

    private findClosestPointOnBox(point: [number, number, number], corners: [number, number, number][]): [number, number, number] {
        // Find the closest point on each face of the box
        const faces = [
            [corners[0], corners[1], corners[2], corners[3]], // front
            [corners[4], corners[5], corners[6], corners[7]], // back
            [corners[0], corners[1], corners[5], corners[4]], // bottom
            [corners[2], corners[3], corners[7], corners[6]], // top
            [corners[0], corners[3], corners[7], corners[4]], // left
            [corners[1], corners[2], corners[6], corners[5]]  // right
        ];

        let closestPoint: [number, number, number] | null = null;
        let minDistance = Infinity;

        for (const face of faces) {
            const pointOnFace = this.closestPointOnPolygon(point, face);
            const dx = point[0] - pointOnFace[0];
            const dy = point[1] - pointOnFace[1];
            const dz = point[2] - pointOnFace[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = pointOnFace;
            }
        }

        return closestPoint!;
    }

    private closestPointOnPolygon(point: [number, number, number], polygon: [number, number, number][]): [number, number, number] {
        // Calculate polygon normal
        const normal = this.calculatePolygonNormal(polygon);

        // Project point onto polygon plane
        const projectedPoint = this.projectPointOntoPlane(point, polygon[0], normal);

        // Check if point is inside polygon
        if (this.isPointInPolygon(projectedPoint, polygon, normal)) {
            return projectedPoint;
        }

        // Find closest point on polygon edges
        let closestPoint: [number, number, number] | null = null;
        let minDistance = Infinity;

        for (let i = 0; i < polygon.length; i++) {
            const edgeStart = polygon[i];
            const edgeEnd = polygon[(i + 1) % polygon.length];
            const pointOnEdge = this.closestPointOnLineSegment(projectedPoint, edgeStart, edgeEnd);
            
            const dx = point[0] - pointOnEdge[0];
            const dy = point[1] - pointOnEdge[1];
            const dz = point[2] - pointOnEdge[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = pointOnEdge;
            }
        }

        return closestPoint!;
    }

    private calculatePolygonNormal(polygon: [number, number, number][]): [number, number, number] {
        const v1 = this.subtract(polygon[1], polygon[0]);
        const v2 = this.subtract(polygon[2], polygon[0]);
        return this.normalize(this.cross(v1, v2));
    }

    private projectPointOntoPlane(point: [number, number, number], planePoint: [number, number, number], normal: [number, number, number]): [number, number, number] {
        const v = this.subtract(point, planePoint);
        const distance = this.dot(v, normal);
        return this.subtract(point, this.multiply(normal, distance));
    }

    private isPointInPolygon(point: [number, number, number], polygon: [number, number, number][], normal: [number, number, number]): boolean {
        let angle = 0;
        for (let i = 0; i < polygon.length; i++) {
            const v1 = this.subtract(polygon[i], point);
            const v2 = this.subtract(polygon[(i + 1) % polygon.length], point);
            angle += Math.atan2(this.dot(this.cross(v1, v2), normal), this.dot(v1, v2));
        }
        return Math.abs(angle) > Math.PI;
    }

    private closestPointOnLineSegment(point: [number, number, number], lineStart: [number, number, number], lineEnd: [number, number, number]): [number, number, number] {
        const line = this.subtract(lineEnd, lineStart);
        const lineLength = Math.sqrt(this.dot(line, line));
        const lineDir = this.multiply(line, 1 / lineLength);
        const pointToStart = this.subtract(point, lineStart);
        const projection = this.dot(pointToStart, lineDir);
        
        if (projection <= 0) return lineStart;
        if (projection >= lineLength) return lineEnd;
        
        return this.add(lineStart, this.multiply(lineDir, projection));
    }

    private reflectVelocity(velocity: [number, number, number], normal: [number, number, number]): [number, number, number] {
        const dot = this.dot(velocity, normal);
        return this.subtract(velocity, this.multiply(normal, 2 * dot));
    }

    private normalize(v: [number, number, number]): [number, number, number] {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (length === 0) return [0, 0, 0];
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    private add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    private subtract(a: [number, number, number], b: [number, number, number]): [number, number, number] {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    private multiply(v: [number, number, number], s: number): [number, number, number] {
        return [v[0] * s, v[1] * s, v[2] * s];
    }

    private dot(a: [number, number, number], b: [number, number, number]): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    private cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    getPosition(): [number, number, number] {
        return [...this.position];
    }

    getVelocity(): [number, number, number] {
        return [...this.velocity];
    }
} 