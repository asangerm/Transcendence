import Phaser from 'phaser';

export class UI2Scene extends Phaser.Scene {
    private game2Scene!: any;
    private healthText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private hitButton!: Phaser.GameObjects.Text;

    constructor() { super('UI2Scene'); }

    create() {
        console.log('UI2Scene create() called');
        
        // Background
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        
        // Title
        this.add.text(640, 100, 'Game2 - Battle Arena', { 
            font: '48px Arial', 
            color: '#ffffff' 
        }).setOrigin(0.5);

        // Health display
        this.healthText = this.add.text(50, 200, 'Connecting...', { 
            font: '32px Arial', 
            color: '#ffffff' 
        });

        // Status display
        this.statusText = this.add.text(50, 250, 'Waiting for connection...', { 
            font: '24px Arial', 
            color: '#cccccc' 
        });

        // Hit button
        this.hitButton = this.add.text(640, 500, 'HIT', { 
            font: '48px Arial', 
            color: '#ffffff',
            backgroundColor: '#ff4444',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            if (this.game2Scene) {
                this.game2Scene.hit();
            }
        })
        .on('pointerover', () => {
            this.hitButton.setStyle({ backgroundColor: '#ff6666' });
        })
        .on('pointerout', () => {
            this.hitButton.setStyle({ backgroundColor: '#ff4444' });
        });

        // Wait for Game2Scene to be ready
        this.time.delayedCall(100, () => {
            console.log('Looking for Game2Scene...');
            this.game2Scene = this.scene.get('Game2Scene');
            console.log('Game2Scene found:', this.game2Scene);
            
            // Check if Game2Scene is actually running
            const isGame2SceneRunning = this.scene.isActive('Game2Scene');
            console.log('Is Game2Scene running?', isGame2SceneRunning);
            
            if (this.game2Scene && isGame2SceneRunning) {
                console.log('Setting up game events...');
                this.setupGameEvents();
            } else {
                console.log('Game2Scene not running, starting it...');
                this.scene.start('Game2Scene');
                this.time.delayedCall(200, () => {
                    this.game2Scene = this.scene.get('Game2Scene');
                    const isRunning = this.scene.isActive('Game2Scene');
                    console.log('Game2Scene after start - running:', isRunning);
                    if (this.game2Scene && isRunning) {
                        console.log('Game2Scene started successfully');
                        this.setupGameEvents();
                    } else {
                        console.error('Failed to start Game2Scene');
                    }
                });
            }
        });
    }

    private setupGameEvents() {
        this.game2Scene.events.on('connectionEstablished', () => {
            this.statusText.setText('Connected! Creating game...').setStyle({ color: '#44ff44' });
        });

        this.game2Scene.events.on('updateState', (players: any) => {
            console.log('UI2Scene received updateState event:', players);
            const p1 = players.find((p: any) => p.id === 'player1');
            const p2 = players.find((p: any) => p.id === 'player2');
            
            console.log('Found players:', { p1, p2 });
            
            if (p1 && p2) {
                this.healthText.setText(`Player 1: ${p1.health} HP    Player 2: ${p2.health} HP`);
                
                // Check for game over
                if (p1.health <= 0) {
                    this.statusText.setText('Player 2 Wins!').setStyle({ color: '#44ff44' });
                    this.hitButton.setVisible(false);
                } else if (p2.health <= 0) {
                    this.statusText.setText('Player 1 Wins!').setStyle({ color: '#44ff44' });
                    this.hitButton.setVisible(false);
                } else {
                    this.statusText.setText('Game in progress...').setStyle({ color: '#cccccc' });
                }
            } else {
                console.log('Players not found or incomplete:', { p1, p2 });
            }
        });

        this.game2Scene.events.on('gameError', (message: string) => {
            this.statusText.setText(`Error: ${message}`).setStyle({ color: '#ff4444' });
        });

        this.game2Scene.events.on('connectionFailed', () => {
            this.statusText.setText('Connection failed. Please refresh the page.').setStyle({ color: '#ff4444' });
            this.hitButton.setVisible(false);
        });
    }
}
