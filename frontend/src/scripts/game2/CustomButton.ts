import Phaser from 'phaser';

export class CustomButton
{
	scene: Phaser.Scene;
	button: Phaser.GameObjects.Image;
	text: Phaser.GameObjects.Text;

	constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: any = {})
	{
		this.scene = scene;
		const buttonColor = (options as any).color;
		const buttonWidth = 130;
		const buttonHeight = 50;
		const name = 'buttonTexture_' + buttonWidth + '_' + buttonHeight + '_' + buttonColor;
		const textStyle =
		{ 
			fontSize: '16px', 
			fontFamily: 'Arial', 
			color: '#000000' 
		};

		//Création de la texture du bouton
		if (!scene.textures.exists(name))
		{
			const buttonGraphics = scene.make.graphics({ x: 0, y: 0 });
			buttonGraphics.fillStyle(buttonColor, 1);
			buttonGraphics.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
			buttonGraphics.generateTexture(name, buttonWidth + 5, buttonHeight + 5);
			buttonGraphics.destroy();
		}

		// Création du bouton
		this.button = scene.add.image(x, y, name).setInteractive({useHandCursor : true});
		this.text = scene.add.text(x, y, text, textStyle).setOrigin(0.5);
		this.setupInteraction(onClick);
	}

	setupInteraction(onClick: () => void)
	{
		this.button.on('pointerdown', () =>
		{
			onClick();
		});
	}

	setVisible(visible: boolean)
	{
		this.button.setVisible(visible);
		this.text.setVisible(visible);
		return this;
	}

	destroy()
	{
		this.button.destroy();
		this.text.destroy();
	}

	setEnabled(enabled: boolean)
	{
		this.button.disableInteractive();
		this.text.setAlpha(0.5);
		if (enabled)
		{
			this.button.setInteractive({ useHandCursor: true });
			this.text.setAlpha(1);
		}
	}
}