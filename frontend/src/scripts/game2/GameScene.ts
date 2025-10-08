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
	anims!: Phaser.Animations.AnimationManager;
	
	// Variables de taille des châteaux
	castleScale: number = 0.62; // Facteur d'échelle (0.5 = 50% de la taille originale)
	castleOriginalWidth: number = 290;
	castleOriginalHeight: number = 550;

	constructor() { 
		super({ key: 'GameScene' }); 
	}

	preload()
	{
		// Charger l'image de fond
		this.load.image('background', '/src/scripts/game2/assets/images/background.png');
		
		// Charger les images des châteaux
		//this.load.image('castle-left', '/src/scripts/game2/assets/images/castle_left.png');
		//this.load.image('castle-right', '/src/scripts/game2/assets/images/castle_right.png');
		
		// Charger les images des troupes
		this.load.spritesheet('melee', '/src/scripts/game2/assets/images/melee_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('range', '/src/scripts/game2/assets/images/range_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		// Charger les spritesheets d'attaque pour toutes les troupes
		this.load.spritesheet('melee-attack', '/src/scripts/game2/assets/images/melee_attack_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('range-attack', '/src/scripts/game2/assets/images/range_attack_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('tank-attack', '/src/scripts/game2/assets/images/tank_attack_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('assassin-attack', '/src/scripts/game2/assets/images/assassin_attack_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('berserker-attack', '/src/scripts/game2/assets/images/berserker_attack_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('tank', '/src/scripts/game2/assets/images/tank_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('assassin', '/src/scripts/game2/assets/images/assassin_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('berserker', '/src/scripts/game2/assets/images/berserker_spritesheet.png', {
			frameWidth: 64,
			frameHeight: 64
		});
	}

	create()
	{
		// Créer les animations pour les troupes melee
		this.anims.create({
			key: 'melee-walk-left',
			frames: this.anims.generateFrameNumbers('melee', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'melee-walk-right',
			frames: this.anims.generateFrameNumbers('melee', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'range-walk-left',
			frames: this.anims.generateFrameNumbers('range', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'range-walk-right',
			frames: this.anims.generateFrameNumbers('range', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'tank-walk-left',
			frames: this.anims.generateFrameNumbers('tank', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'tank-walk-right',
			frames: this.anims.generateFrameNumbers('tank', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'assassin-walk-left',
			frames: this.anims.generateFrameNumbers('assassin', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'assassin-walk-right',
			frames: this.anims.generateFrameNumbers('assassin', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'berserker-walk-left',
			frames: this.anims.generateFrameNumbers('berserker', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'berserker-walk-right',
			frames: this.anims.generateFrameNumbers('berserker', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		// Créer les animations d'idle (repos) pour les troupes
		this.anims.create({
			key: 'melee-idle-left',
			frames: this.anims.generateFrameNumbers('melee', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'melee-idle-right',
			frames: this.anims.generateFrameNumbers('melee', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'range-idle-left',
			frames: this.anims.generateFrameNumbers('range', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'range-idle-right',
			frames: this.anims.generateFrameNumbers('range', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});
		this.anims.create({
			key: 'tank-idle-left',
			frames: this.anims.generateFrameNumbers('tank', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'tank-idle-right',
			frames: this.anims.generateFrameNumbers('tank', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});
		this.anims.create({
			key: 'assassin-idle-left',
			frames: this.anims.generateFrameNumbers('assassin', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'assassin-idle-right',
			frames: this.anims.generateFrameNumbers('assassin', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});
		this.anims.create({
			key: 'berserker-idle-left',
			frames: this.anims.generateFrameNumbers('berserker', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		this.anims.create({
			key: 'berserker-idle-right',
			frames: this.anims.generateFrameNumbers('berserker', { start: 0, end: 0 }),
			frameRate: 1,
			repeat: 0
		});

		// Créer les animations d'attaque pour toutes les troupes
		// Melee
		this.anims.create({
			key: 'melee-attack-left',
			frames: this.anims.generateFrameNumbers('melee-attack', { start: 0, end: 7 }),
			frameRate: 8,
			repeat: 0
		});
		this.anims.create({
			key: 'melee-attack-right',
			frames: this.anims.generateFrameNumbers('melee-attack', { start: 0, end: 7 }),
			frameRate: 8,
			repeat: 0
		});

		// Range
		this.anims.create({
			key: 'range-attack-left',
			frames: this.anims.generateFrameNumbers('range-attack', { start: 0, end: 12 }),
			frameRate: 13,
			repeat: 0
		});
		this.anims.create({
			key: 'range-attack-right',
			frames: this.anims.generateFrameNumbers('range-attack', { start: 0, end: 12 }),
			frameRate: 13,
			repeat: 0
		});

		// Tank
		this.anims.create({
			key: 'tank-attack-left',
			frames: this.anims.generateFrameNumbers('tank-attack', { start: 0, end: 7 }),
			frameRate: 8,
			repeat: 0
		});
		this.anims.create({
			key: 'tank-attack-right',
			frames: this.anims.generateFrameNumbers('tank-attack', { start: 0, end: 7 }),
			frameRate: 8,
			repeat: 0
		});

		// Assassin
		this.anims.create({
			key: 'assassin-attack-left',
			frames: this.anims.generateFrameNumbers('assassin-attack', { start: 0, end: 5 }),
			frameRate: 6,
			repeat: 0
		});
		this.anims.create({
			key: 'assassin-attack-right',
			frames: this.anims.generateFrameNumbers('assassin-attack', { start: 0, end: 5 }),
			frameRate: 6,
			repeat: 0
		});

		// Berserker
		this.anims.create({
			key: 'berserker-attack-left',
			frames: this.anims.generateFrameNumbers('berserker-attack', { start: 0, end: 5 }),
			frameRate: 6,
			repeat: 0
		});
		this.anims.create({
			key: 'berserker-attack-right',
			frames: this.anims.generateFrameNumbers('berserker-attack', { start: 0, end: 5 }),
			frameRate: 6,
			repeat: 0
		});

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

	createCastle(x: number, y: number, _textureKey: string, originX: number = 0)
	{
		// Créer une texture temporaire invisible pour le château
		this.createTexture('invisible-castle', 0x000000, 1, 1);
		
		// Créer un château invisible avec physique
		const castle = this.physics.add.sprite(x, y, 'invisible-castle') as any;
		castle.setOrigin(originX, 1).setImmovable(true);
		
		// Redimensionner le château en utilisant les variables
		const scaledWidth = this.castleOriginalWidth * this.castleScale;
		const scaledHeight = this.castleOriginalHeight * this.castleScale;
		castle.setDisplaySize(scaledWidth, scaledHeight);
		
		// Rendre le château invisible (alpha = 0)
		castle.setAlpha(0);
		
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
		//this.createTexture('road', 0x8B827D, 1280, 90);
		//this.add.image(0, 720, 'road').setOrigin(0, 1);
	
		// Création des châteaux (utilise maintenant les images PNG spécifiques)
		// Château gauche : coin bas-gauche aligné avec le bord gauche
		this.castleLeft = this.createCastle(0, 720 - 49, 'castle-left', 0);
		// Château droite : coin bas-droite aligné avec le bord droit
		this.castleRight = this.createCastle(1280, 720 - 49, 'castle-right', 1);
	
		// Événement UI
		this.scene.get('UIScene').events.emit('castle-ready',
		{
			castleLeft: this.castleLeft,
			castleRight: this.castleRight
		});
	}
}