import { TroopManager } from './TroopManager.js';

export class GameScene extends Phaser.Scene
{
	constructor() { super('GameScene'); }

	preload()
	{
		this.createTexture('melee', 0xCA3C66, 32, 32);
		this.createTexture('range', 0xE8AABE, 24, 24);
		this.createTexture('tank', 0xDB6A8F, 38, 38);
		this.createTexture('assassin', 0xA7E0E0, 24, 24);
		this.createTexture('berserker', 0x4AA3A2, 24, 24);
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

	createTexture(key, color, width, height)
	{
		const g = this.make.graphics({ x: 0, y: 0, add: false });
		g.fillStyle(color, 1);
		g.fillRect(0, 0, width, height);
		g.generateTexture(key, width, height);
		g.destroy();
	}

	createCastle(x, y, textureKey, originX = 0)
	{
		const castle = this.physics.add.sprite(x, y, textureKey);
		castle.setOrigin(originX, 1).setImmovable(true);
		castle.health = 100;
		castle.money = 100;
		return castle;
	}

	createWorld()
	{
		// Route
		this.createTexture('road', 0x888888, 1300, 90);
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