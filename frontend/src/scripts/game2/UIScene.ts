import Phaser from 'phaser';
import { CustomButton } from './CustomButton';
import { TroopManager } from './TroopManager';

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
				type: 'BERSEKER',
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
		});
	}

	createButtons()
	{
		// Création des boutons pour l'équipe de gauche
		this.ButtonsLeft = [];
		this.buttons.forEach((btn: ButtonConfig, index: number) =>
		{
			const button = new CustomButton(this, 100, 100 + (index * 70), btn.text,
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
			const button = new CustomButton(this, 1180, 100 + (index * 70), btn.text,
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
		if (!this.ButtonsLeft || !this.ButtonsRight || !this.gameScene || !this.gameScene.troopManager) return;

		// Mise à jour des boutons de gauche
		this.ButtonsLeft.forEach((btn: CustomButton, i: number) =>
		{
			const troopType = this.buttons[i].type;
			const cost = this.gameScene.troopManager.getTroopCost(troopType);
			btn.setEnabled(this.castleLeft.money >= cost);
		});

		// Mise à jour des boutons de droite
		this.ButtonsRight.forEach((btn: CustomButton, i: number) =>
		{
			const troopType = this.buttons[i].type;
			const cost = this.gameScene.troopManager.getTroopCost(troopType);
			btn.setEnabled(this.castleRight.money >= cost);
		});

		// Mise à jour du texte avec la santé actuelle
		this.castleLeftHealthText.setText(`HP: ${Math.max(0, Math.floor(this.castleLeft.health))}`);
		this.castleRightHealthText.setText(`HP: ${Math.max(0, Math.floor(this.castleRight.health))}`);
		this.castleLeftMoneyText.setText(`Money: ${Math.max(0, Math.floor(this.castleLeft.money))}`);
		this.castleRightMoneyText.setText(`Money: ${Math.max(0, Math.floor(this.castleRight.money))}`);
		// Mise à jour de la position des textes
		this.castleLeftHealthText.setPosition
		(
			this.castleLeft.x + 32, // Centre du château
			this.castleLeft.y - 180 // Au-dessus du château
		);
		this.castleRightHealthText.setPosition
		(
			this.castleRight.x - 32, // Centre du château
			this.castleRight.y - 180 // Au-dessus du château
		);
		this.castleLeftMoneyText.setPosition
		(
			this.castleLeft.x + 32, // Centre du château
			this.castleLeft.y - 210 // Au-dessus du château
		);
		this.castleRightMoneyText.setPosition
		(
			this.castleRight.x - 32, // Centre du château
			this.castleRight.y - 210 // Au-dessus du château
		);

		// Changement de couleur en fonction de la santé
		this.updateHealthColor(this.castleLeftHealthText, this.castleLeft.health);
		this.updateHealthColor(this.castleRightHealthText, this.castleRight.health);
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
