// @ts-ignore
import * as Phaser from 'phaser';
import { CustomButton } from './CustomButton';
// import { TroopManager } from './TroopManager';

interface ButtonConfig {
	text: string;
	type: string;
	color: number;
}

export class UIScene extends Phaser.Scene
{
	buttons: ButtonConfig[];
	gameScene!: any; // GameScene avec troopManager
	castleLeft: any;
	castleRight: any;
	castleLeftHealthText!: Phaser.GameObjects.Text;
	castleRightHealthText!: Phaser.GameObjects.Text;
	castleLeftMoneyText!: Phaser.GameObjects.Text;
	castleRightMoneyText!: Phaser.GameObjects.Text;
	ButtonsLeft!: CustomButton[];
	ButtonsRight!: CustomButton[];
	gameOver: boolean = false;
	scene!: Phaser.Scenes.SceneManager;
	events!: Phaser.Events.EventEmitter;
	add!: Phaser.GameObjects.GameObjectFactory;
	time!: Phaser.Time.Clock;
	cameras!: Phaser.Cameras.Scene2D.CameraManager;
	updateReady: boolean = false;

	constructor()
	{
		super({ key: 'UIScene', active: true });
		
		// Configuration globale des boutons
		this.buttons =
		[
			{
				text: 'Soldat',
				type: 'MELEE',
				color: 0xCA3C66,
			},
			{
				text: 'Tank',
				type: 'TANK',
				color: 0xDB6A8F,
			},
			{
				text: 'Archer',
				type: 'RANGE',
				color: 0xE8AABE,
			},
			{
				text: 'Assassin',
				type: 'ASSASSIN',
				color: 0xA7E0E0,
			},
			{
				text: 'Berserker',
				type: 'BERSERKER',
				color: 0x4AA3A2,
			}
		];
	}

	create()
	{
		// Récupération de la GameScene une seule fois
		this.gameScene = this.scene.get('GameScene');

		this.events.once('castle-ready', ({ castleLeft, castleRight }: { castleLeft: any, castleRight: any }) =>
		{
			console.log('Châteaux reçus', castleLeft, castleRight);
			this.castleLeft = castleLeft;
			this.castleRight = castleRight;

			// Crée les textes SEULEMENT quand les châteaux sont prêts
			this.castleLeftHealthText = this.add.text(100, 100, '', { font: '20px Arial', color: '#fff' }).setOrigin(0.5);
			this.castleRightHealthText = this.add.text(100, 100, '', { font: '20px Arial', color: '#fff' }).setOrigin(0.5);
			this.castleLeftMoneyText = this.add.text(100, 100, '', { font: '20px Arial', color: '#fff' }).setOrigin(0.5);
			this.castleRightMoneyText = this.add.text(100, 100, '', { font: '20px Arial', color: '#fff' }).setOrigin(0.5);	
			// On crée les boutons une fois que tout est prêt
			this.createButtons();

			// Délai pour s'assurer que tout est prêt
			this.time.delayedCall(1000, () => {
				this.updateReady = true;
			});

			this.time.addEvent({
				delay: 1000, // 1000 ms = 1 seconde
				loop: true,
				callback: () => {
					this.castleLeft.money += 2;
					this.castleRight.money += 2;
				}
			})
		});
	}

	createButtons()
	{
		// Création des boutons pour l'équipe de gauche
		this.ButtonsLeft = [];
		this.buttons.forEach((btn: ButtonConfig, index: number) =>
		{
			const button = new CustomButton(this, 100, 50 + (index * 55), btn.text,
			() =>
			{
				const troopCost = this.gameScene.troopManager ? this.gameScene.troopManager.getTroopCost(btn.type) : 0;
				if (this.castleLeft.money >= troopCost) {
					this.castleLeft.money -= troopCost;
					this.gameScene.troopManager.requestTroopSpawn('left', btn.type, this.castleLeft);
				}
				return () => {};
			},
			{
				color: btn.color,
			});
			this.ButtonsLeft.push(button);
		});

		// Création des boutons pour l'équipe de droite (IA)
		this.ButtonsRight = [];
		this.buttons.forEach((btn: ButtonConfig, index: number) =>
		{
			const button = new CustomButton(this, 1180, 50 + (index * 55), btn.text,
			() =>
			{
				const troopCost = this.gameScene.troopManager ? this.gameScene.troopManager.getTroopCost(btn.type) : 0;
				if (this.castleRight.money >= troopCost) {
					this.castleRight.money -= troopCost;
					this.gameScene.troopManager.requestTroopSpawn('right', btn.type, this.castleRight);
				}
				return () => {};
			},
			{
				color: btn.color,
			});
			this.ButtonsRight.push(button);
		});
	}

	update()
	{
		if (this.gameOver || !this.ButtonsLeft || !this.ButtonsRight || !this.gameScene || !this.gameScene.troopManager || !this.castleLeft || !this.castleRight) return;
		
		// Attendre que tout soit prêt
		if (!this.updateReady || !this.castleLeftHealthText || !this.castleRightHealthText || !this.castleLeftMoneyText || !this.castleRightMoneyText) return;

		// Mise à jour des boutons de gauche (désactivé temporairement)
		// this.ButtonsLeft.forEach((btn: CustomButton, i: number) =>
		// {
		// 	if (btn && this.buttons[i]) {
		// 		const troopType = this.buttons[i].type;
		// 		const cost = this.gameScene.troopManager.getTroopCost(troopType);
		// 		btn.setEnabled(this.castleLeft.money >= cost);
		// 	}
		// });

		// Mise à jour des boutons de droite (désactivé temporairement)
		// this.ButtonsRight.forEach((btn: CustomButton, i: number) =>
		// {
		// 	if (btn && this.buttons[i]) {
		// 		const troopType = this.buttons[i].type;
		// 		const cost = this.gameScene.troopManager.getTroopCost(troopType);
		// 		btn.setEnabled(this.castleRight.money >= cost);
		// 	}
		// });

		// Mise à jour du texte avec la santé actuelle
		this.castleLeftHealthText.setText(`HP: ${Math.max(0, Math.floor(this.castleLeft.health))}`);
		this.castleRightHealthText.setText(`HP: ${Math.max(0, Math.floor(this.castleRight.health))}`);
		this.castleLeftMoneyText.setText(`Money: ${Math.max(0, Math.floor(this.castleLeft.money))}`);
		this.castleRightMoneyText.setText(`Money: ${Math.max(0, Math.floor(this.castleRight.money))}`);
		// Mise à jour de la position des textes
		// Variables pour ajuster facilement les positions
		const leftOffsetX = 100;  // Décalage horizontal pour le château gauche
		const rightOffsetX = -100; // Décalage horizontal pour le château droite
		const healthOffsetY = -320; // Décalage vertical pour HP
		const moneyOffsetY = -300; // Décalage vertical pour Money
		
		this.castleLeftHealthText.setPosition
		(
			this.castleLeft.x + leftOffsetX, // Position X ajustable
			this.castleLeft.y + healthOffsetY // Position Y ajustable
		);
		this.castleRightHealthText.setPosition
		(
			this.castleRight.x + rightOffsetX, // Position X ajustable
			this.castleRight.y + healthOffsetY // Position Y ajustable
		);
		this.castleLeftMoneyText.setPosition
		(
			this.castleLeft.x + leftOffsetX, // Position X ajustable
			this.castleLeft.y + moneyOffsetY // Position Y ajustable
		);
		this.castleRightMoneyText.setPosition
		(
			this.castleRight.x + rightOffsetX, // Position X ajustable
			this.castleRight.y + moneyOffsetY // Position Y ajustable
		);

		// Changement de couleur en fonction de la santé
		this.updateHealthColor(this.castleLeftHealthText, this.castleLeft.health);
		this.updateHealthColor(this.castleRightHealthText, this.castleRight.health);
		
		if (this.castleLeft.health <= 0 || this.castleRight.health <= 0) {
			this.gameOver = true;
	
			const winner = this.castleLeft.health <= 0 ? 'Équipe Droite' : 'Équipe Gauche';
			const message = `${winner} a gagné !`;
	
			this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, message, {
				font: '48px Arial',
				color: '#ffffff',
				backgroundColor: '#000000',
				padding: { x: 20, y: 10 },
			}).setOrigin(0.5);
	
			// Optionnel : désactiver tous les boutons
			this.ButtonsLeft.forEach(btn => btn.setEnabled(false));
			this.ButtonsRight.forEach(btn => btn.setEnabled(false));
		}

	}

	updateHealthColor(text: Phaser.GameObjects.Text, health: number)
	{
		if (health > 70)
		{ text.setColor('#00ff00'); }
		else if (health > 30)
		{ text.setColor('#ffff00'); }
		else
		{ text.setColor('#ff0000'); }
	}
}
