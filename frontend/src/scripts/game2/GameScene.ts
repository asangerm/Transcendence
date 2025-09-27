// @ts-ignore
import * as Phaser from 'phaser';
import { TroopManager } from './TroopManager';

export class GameScene extends Phaser.Scene
{
	castleLeft: any;
	castleRight: any;
	troopManager!: TroopManager;
	load!: Phaser.Loader.LoaderPlugin;
	scene!: Phaser.Scenes.SceneManager;
	time!: Phaser.Time.Clock;
	make!: Phaser.GameObjects.GameObjectFactory;
	physics!: Phaser.Physics.Arcade.ArcadePhysics;
	add!: Phaser.GameObjects.GameObjectFactory;

	constructor() { 
		super({ key: 'GameScene' }); 
	}

	preload()
	{
		// Charger l'image de fond
		this.load.image('background', '/src/scripts/game2/assets/images/background.jpg');
		
		// Charger les images des troupes
		this.load.image('melee', '/src/scripts/game2/assets/images/melee.png');
		this.load.image('range', '/src/scripts/game2/assets/images/range.png');
		this.load.image('tank', '/src/scripts/game2/assets/images/tank.png');
		this.load.image('assassin', '/src/scripts/game2/assets/images/assassin.png');
		this.load.image('berserker', '/src/scripts/game2/assets/images/berserker.png');
	}

	create()
	{
		this.scene.launch('UIScene');
		this.createWorld();

		// Ajoute un petit délai pour garantir que le listener est prêt
		this.time.delayedCall(50, () =>
		{
			this.scene.get('UIScene').events.emit('castle-ready', 
			{
				castleLeft: this.castleLeft,
				castleRight: this.castleRight
			});
		});
		this.troopManager = new TroopManager(this, this.castleLeft, this.castleRight);
	}

	update()
	{
		this.troopManager.update();
	}

	createTexture(key: string, color: number, width: number, height: number)
	{
		const g = this.make.graphics({ x: 0, y: 0 });
		g.fillStyle(color, 1);
		g.fillRect(0, 0, width, height);
		g.generateTexture(key, width, height);
		g.destroy();
	}

	createCastle(x: number, y: number, textureKey: string, originX: number = 0)
	{
		const castle = this.physics.add.sprite(x, y, textureKey) as any;
		castle.setOrigin(originX, 1).setImmovable(true);
		castle.health = 100;
		castle.money = 100;
		return castle;
	}

	createWorld()
	{
		// Image de fond
		const background = this.add.image(0, 0, 'background');
		background.setOrigin(0, 0);
		background.setDisplaySize(1280, 720); // Ajuster à la taille de l'écran
		background.setDepth(-10); // Mettre en arrière-plan
		
		// Route
		this.createTexture('road', 0x8B827D, 1280, 90);
		this.add.image(0, 720, 'road').setOrigin(0, 1);
	
		// Châteaux
		this.createTexture('castle', 0xccd0d0, 64, 160);
	
		// Création des châteaux
		this.castleLeft = this.createCastle(64, 720 - 90, 'castle', 0);
		this.castleRight = this.createCastle(1280 - 64, 720 - 90, 'castle', 1);
	
		// Événement UI
		this.scene.get('UIScene').events.emit('castle-ready',
		{
			castleLeft: this.castleLeft,
			castleRight: this.castleRight
		});
	}
}