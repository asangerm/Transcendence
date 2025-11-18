import { Ball } from './Ball';
import { Scene, GameObject } from './Scene';

export class Renderer {
	private canvas: HTMLCanvasElement;
	private babylon: any | null;
	private engine: any | null;
	private scene3d: any | null;
	private camera3d: any | null;
	private light: any | null;
	private dirLight: any | null;
	private meshByName: Map<string, any>;
	private skyDome: any | null;
	private sunMesh: any | null;
	private sunDirection: any | null;
	private shadowGen: any | null;
	private initialized: boolean = false;
	private textDisplay: HTMLDivElement;
	
	private frameCount: number = 0;
	private lastTime: number = performance.now();
	private fps: number = 0;
	private tps: number = 0;

	constructor(canvas: HTMLCanvasElement, textDisplay: HTMLDivElement) {
		this.canvas = canvas;
		this.babylon = null;
		this.engine = null;
		this.scene3d = null;
		this.camera3d = null;
		this.light = null;
		this.dirLight = null;
		this.meshByName = new Map();
		this.skyDome = null;
		this.sunMesh = null;
		this.sunDirection = null;
		this.shadowGen = null;
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
			const { Engine, Scene: BabylonScene, FreeCamera, HemisphericLight, DirectionalLight, ShadowGenerator, Vector3, Color4, MeshBuilder, StandardMaterial, Color3, DynamicTexture, AbstractMesh, Mesh } = this.babylon;
			this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
			this.scene3d = new BabylonScene(this.engine);
			this.scene3d.clearColor = new Color4(0.3, 0.35, 0.4, 1);
			(this.scene3d as any).ambientColor = new (this.babylon as any).Color3(0.06, 0.06, 0.06);
			this.camera3d = new FreeCamera('camera', new Vector3(0, 0, -10), this.scene3d);
			this.camera3d.setTarget(Vector3.Zero());
			this.light = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene3d);
			this.light.intensity = 0.9;
			(this.light as any).groundColor = new Color3(0.2, 0.2, 0.25);

			// Gradient sky dome and billboard sun
			try {

				this.sunDirection = new Vector3(0.1, 1, 0).normalize();
				this.sunMesh = MeshBuilder.CreateDisc('sun', { radius: 0.8, tessellation: 12 }, this.scene3d);
				const sunMat = new StandardMaterial('sunMat', this.scene3d);
				sunMat.disableLighting = true;
				sunMat.emissiveColor = new Color3(1.0, 0.9, 0.7);
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
		const { MeshBuilder, StandardMaterial, Color3, DynamicTexture, Texture } = this.babylon ?? {};
		if (obj.type === 'box') {
			mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, this.scene3d);
		} else if (obj.type === 'sphere') {
			mesh = MeshBuilder.CreateSphere(obj.name, { diameter: 1, segments: 16 }, this.scene3d);
		} else {
			mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, this.scene3d);
		}
		const mat = new StandardMaterial(`${obj.name}-mat`, this.scene3d);
		mat.diffuseColor = new Color3(obj.color.r, obj.color.g, obj.color.b);
		try { (mat as any).ambientColor = new Color3(0.18, 0.18, 0.18); } catch {}
		// Apply simple procedural textures per object request
		if (obj.texture) {
			try {
				if (obj.texture === 'checker') {
					const size = 256;
					const cells = 8;
					const dt = new DynamicTexture(`${obj.name}-checker`, { width: size, height: size }, this.scene3d, false);
					const ctx = dt.getContext();
					const c1 = `rgb(${Math.floor(obj.color.r*255)},${Math.floor(obj.color.g*255)},${Math.floor(obj.color.b*255)})`;
					const c2 = `rgb(${Math.floor(obj.color.r*128)},${Math.floor(obj.color.g*128)},${Math.floor(obj.color.b*128)})`;
					const cellSize = size / cells;
					for (let y=0; y<cells; y++) {
						for (let x=0; x<cells; x++) {
							ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
							ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
						}
					}
					dt.update(false);
					mat.diffuseTexture = dt;
					mat.specularColor = new Color3(0.1, 0.1, 0.1);
				} else if (obj.texture === 'metal') {
					const size = 256;
					const dt = new DynamicTexture(`${obj.name}-metal`, { width: size, height: size }, this.scene3d, false);
					const ctx = dt.getContext();
					const base = Math.floor(Math.max(obj.color.r, obj.color.g, obj.color.b) * 180) + 50;
					const grad = ctx.createLinearGradient(0, 0, size, size);
					grad.addColorStop(0, `rgb(${base},${base},${base})`);
					grad.addColorStop(0.5, `rgb(${base+30},${base+30},${base+30})`);
					grad.addColorStop(1, `rgb(${base-10},${base-10},${base-10})`);
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, size, size);
					dt.update(false);
					mat.diffuseTexture = dt;
					mat.specularColor = new Color3(0.4, 0.4, 0.4);
					mat.specularPower = 96;
				} else if (obj.texture === 'glossy') {
					mat.specularColor = new Color3(0.6, 0.6, 0.6);
					mat.specularPower = 160;
				} else if (obj.texture.startsWith('http') || obj.texture.startsWith('/')) {
					const tex = new Texture(obj.texture, this.scene3d, true);
					try {
						const sx = Math.floor(Math.abs(obj.size.x)) / 50;
						const sz = Math.floor(Math.abs(obj.size.z)) / 50;
						(tex as any).uScale = sx;
						(tex as any).vScale = sz;
					} catch {}
					mat.diffuseTexture = tex;
					mat.specularColor = new Color3(0.15, 0.15, 0.15);
				}
			} catch (e) {
				console.warn(`Texture creation failed for ${obj.name}`, e);
			}
		}
		if (obj.name === 'floor' || obj.name === 'arena') {
			mat.specularColor = new Color3(0, 0, 0);
			mat.emissiveColor = new Color3(0, 0, 0);
		}
		mesh.material = mat;
		try {
			if (this.shadowGen) {
				if (obj.name === 'ball' || obj.name.startsWith('paddle')) {
					this.shadowGen.addShadowCaster(mesh);
					mesh.receiveShadows = true;
				}
				if (obj.name.includes('ground') || obj.name.includes('floor') || obj.name.includes('arena')) {
					mesh.receiveShadows = true;
				}
			}
		} catch {}
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

    render(scene: Scene, scores: { top: number; bottom: number }, isOnline: boolean = false, players?: { top?: string; bottom?: string }, result?: { mode: 'none' | 'victory' | 'defeat'; winner?: string }): void {
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
        const topName = players?.top || '';
        const bottomName = players?.bottom || '';
        const mode = result?.mode || 'none';
        const winner = result?.winner || '';
        let endMarkup = '';
        if (mode === 'victory') {
            endMarkup = `<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                <div class="text-5xl font-extrabold text-green-400 mb-2">Victoire</div>
                <div class="text-2xl text-white">Gagnant: ${winner}</div>
            </div>`;
        } else if (mode === 'defeat') {
            endMarkup = `<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                <div class="text-5xl font-extrabold text-red-500 mb-2">Défaite</div>
                <div class="text-2xl text-white">Gagnant: ${winner}</div>
            </div>`;
        }
		this.textDisplay.innerHTML = `
            <span class="text-red-600 absolute top-0 right-2 italic font-light">${this.fps}fps</span>
            <span class="text-white absolute top-0 left-2 italic font-light">${this.tps}tps</span>
            <span class="absolute top-6 left-2 text-lg font-sans font-semibold italic text-green-400">${topName}</span>
            <span class="absolute top-6 right-2 text-lg font-sans font-semibold italic text-blue-400">${bottomName}</span>
			<span class="opacity-70 font-sans italic text-green-600 absolute -bottom-4 left-2 text-[96px]">${scores.top}</span>
			<span class="opacity-70 font-sans italic text-blue-600 absolute -bottom-4 right-2 text-[96px]">${scores.bottom}</span>
            ${endMarkup}
		`;
	}

	setTPS(tps: number): void {
		this.tps = tps;
	}
}