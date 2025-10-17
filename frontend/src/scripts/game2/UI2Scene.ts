import Phaser from 'phaser';

export class UI2Scene extends Phaser.Scene {
    private game2Scene!: any;
    private healthText!: Phaser.GameObjects.Text;

    constructor() { super('UI2Scene'); }

    create() {
        // Texte de test pour vérifier que la scène fonctionne
        this.add.text(100, 100, 'UI2Scene chargée!', { font: '24px Arial', color: '#ffffff' });
        
        // Fond coloré pour voir la scène
        this.add.rectangle(640, 360, 1280, 720, 0xFF1111, 0.3);

        this.healthText = this.add.text(20, 20, 'En attente...', { font: '24px Arial', color: '#ffffff' });

        const button = this.add.text(600, 600, 'HIT', { font: '32px Arial', backgroundColor: '#ff0000' })
            .setInteractive()
            .on('pointerdown', () => {
                console.log('Bouton HIT cliqué!');
                if (this.game2Scene) {
                    this.game2Scene.hit();
                }
            });

        // Attendre que Game2Scene soit prête
        this.time.delayedCall(100, () => {
            this.game2Scene = this.scene.get('Game2Scene');
            if (this.game2Scene) {
                this.game2Scene.events.on('updateState', (players: any) => {
                    const p1 = players.find((p: any) => p.id === 'player1');
                    const p2 = players.find((p: any) => p.id === 'player2');
                    this.healthText.setText(`Player1: ${p1?.health || 0}   Player2: ${p2?.health || 0}`);
                });
            }
        });
    }
}
