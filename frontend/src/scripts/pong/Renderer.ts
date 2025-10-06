import { Ball } from './Ball';
import { Scene, GameObject } from './Scene';

export class Renderer {
	private canvas: HTMLCanvasElement;
	private babylon: any | null;
	private engine: any | null;
	private scene3d: any | null;
	private camera3d: any | null;
	private light: any | null;
	private meshByName: Map<string, any>;
	private skyDome: any | null;
	private sunMesh: any | null;
	private sunDirection: any | null;
	private initialized: boolean = false;
	private textDisplay: HTMLDivElement;
	private frameCount: number = 0;
	private lastTime: number = performance.now();
	private fps: number = 0;

	constructor(canvas: HTMLCanvasElement, textDisplay: HTMLDivElement) {
		this.canvas = canvas;
		this.babylon = null;
		this.engine = null;
		this.scene3d = null;
		this.camera3d = null;
		this.light = null;
		this.meshByName = new Map();
		this.skyDome = null;
		this.sunMesh = null;
		this.sunDirection = null;
		this.textDisplay = textDisplay;
		this.setupCanvas();
	}

	setupCanvas(): void {
		const displayWidth = this.canvas.clientWidth;
		const displayHeight = this.canvas.clientHeight;
		if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
			this.canvas.width = displayWidth;
			this.canvas.height = displayHeight;
		}
		if (this.engine) {
			this.engine.resize();
		}
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;
		try {
			this.babylon = await import('@babylonjs/core');
			const { Engine, Scene: BabylonScene, FreeCamera, HemisphericLight, Vector3, Color4, MeshBuilder, StandardMaterial, Color3, DynamicTexture, AbstractMesh, Mesh } = this.babylon;
			this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
			this.scene3d = new BabylonScene(this.engine);
			// Base clear color behind sky dome
			this.scene3d.clearColor = new Color4(0.45, 0.7, 0.95, 1);
			this.camera3d = new FreeCamera('camera', new Vector3(0, 0, -10), this.scene3d);
			this.camera3d.setTarget(Vector3.Zero());
			this.light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene3d);
			this.light.intensity = 0.9;

			// Gradient sky dome and billboard sun
			try {
				const height = 256;
				const gradTex = new DynamicTexture('skyGradient', { width: 2, height }, this.scene3d, false);
				const ctx = gradTex.getContext();
				const gradient = ctx.createLinearGradient(0, 0, 0, height);
				gradient.addColorStop(0, '#87CEFA');
				gradient.addColorStop(1, '#1E3A8A');
				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, 2, height);
				gradTex.update(false);

				this.skyDome = MeshBuilder.CreateSphere('skyDome', { diameter: 2000, segments: 32, sideOrientation: Mesh.BACKSIDE }, this.scene3d);
				const skyMat = new StandardMaterial('skyMat', this.scene3d);
				skyMat.disableLighting = true;
				skyMat.backFaceCulling = false;
				skyMat.emissiveTexture = gradTex;
				this.skyDome.material = skyMat;

				this.sunDirection = new Vector3(0.3, 0.6, 0.2).normalize();
				this.sunMesh = MeshBuilder.CreateDisc('sun', { radius: 40, tessellation: 48 }, this.scene3d);
				const sunMat = new StandardMaterial('sunMat', this.scene3d);
				sunMat.disableLighting = true;
				sunMat.emissiveColor = new Color3(1.0, 0.95, 0.75);
				sunMat.specularColor = new Color3(0, 0, 0);
				this.sunMesh.material = sunMat;
				this.sunMesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
				this.sunMesh.isPickable = false;
			} catch (e) {
				console.warn('Gradient sky or sun creation failed:', e);
			}
			this.initialized = true;
		} catch (error) {
			console.error('Error initializing Babylon renderer:', error);
			throw error;
		}
	}

	private ensureMeshForObject(obj: GameObject): any {
		const existing = this.meshByName.get(obj.name);
		if (existing) return existing;
		if (!this.scene3d) throw new Error('Renderer not initialized');
		let mesh: any;
		const { MeshBuilder, StandardMaterial, Color3 } = this.babylon ?? {};
		if (obj.type === 'box') {
			mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, this.scene3d);
		} else if (obj.type === 'sphere') {
			mesh = MeshBuilder.CreateSphere(obj.name, { diameter: 1, segments: 16 }, this.scene3d);
		} else {
			mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, this.scene3d);
		}
		const mat = new StandardMaterial(`${obj.name}-mat`, this.scene3d);
		mat.diffuseColor = new Color3(obj.color.r, obj.color.g, obj.color.b);
		mesh.material = mat;
		this.meshByName.set(obj.name, mesh);
		return mesh;
	}

	private updateCameraFromScene(scene: Scene): void {
		if (!this.camera3d) return;
		const cam = scene.camera;
		this.camera3d.position.set(cam.position.x, cam.position.y, cam.position.z);
		this.camera3d.rotation.x = cam.rotation.x;
		this.camera3d.rotation.y = cam.rotation.y;
		this.camera3d.rotation.z = cam.rotation.z;
		// Convert degrees to radians if values look like degrees (> 2π is unlikely for radians)
		const fov = cam.fov > Math.PI * 2 ? (cam.fov * Math.PI) / 180 : cam.fov;
		this.camera3d.fov = fov;
	}

	render(scene: Scene, ballSpeed: number): void {
		if (!this.engine || !this.scene3d) return;
		this.setupCanvas();
		this.updateCameraFromScene(scene);
		// Keep sky centered and sun positioned relative to camera
		if (this.camera3d) {
			if (this.skyDome) {
				this.skyDome.position.copyFrom(this.camera3d.position);
			}
			if (this.sunMesh && this.sunDirection) {
				const target = this.camera3d.position.add(this.sunDirection.scale(800));
				this.sunMesh.position.copyFrom(target);
			}
		}
		const objects = scene.getObjects();
		for (const obj of objects) {
			const mesh = this.ensureMeshForObject(obj);
			mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
			mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
			mesh.scaling.set(obj.size.x, obj.size.y, obj.size.z);
			const { Color3 } = this.babylon ?? {};
			const mat = mesh.material as any;
			if (mat) {
				mat.diffuseColor = new Color3(obj.color.r, obj.color.g, obj.color.b);
			}
		}
		this.scene3d.render();
		this.frameCount++;
		const currentTime = performance.now();
		const elapsed = currentTime - this.lastTime;
		if (elapsed >= 1000) {
			this.fps = Math.round((this.frameCount * 1000) / elapsed);
			this.frameCount = 0;
			this.lastTime = currentTime;
		}
		const pos = scene.camera.position;
		this.textDisplay.textContent = `Camera: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) | FPS: ${this.fps} | Speed: ${ballSpeed.toFixed(2)}`;
	}
}