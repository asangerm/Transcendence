import Phaser from 'phaser';

export class Game2Scene extends Phaser.Scene {
    private ws!: WebSocket;
    private playerId!: string;
    private gameId!: string;

    constructor() { super('Game2Scene'); }

    preload() {}

    create() {
        this.playerId = Math.random() < 0.5 ? 'player1' : 'player2';
        this.gameId = 'game2-' + Date.now(); // ID unique pour ce jeu

        this.ws = new WebSocket(`ws://localhost:3000/ws?gameId=${this.gameId}`);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            // Créer un jeu côté serveur
            this.ws.send(JSON.stringify({
                type: 'create_game',
                gameId: this.gameId,
                kind: 'game2'
            }));
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
        };

        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log('Message reçu:', data);
            if (data.type === 'state' && data.state?.players) {
                this.events.emit('updateState', data.state.players);
            }
        };
    }

    hit() {
        if (!this.ws || !this.ws.readyState) return;
        this.ws.send(JSON.stringify({ gameId: this.gameId, playerId: this.playerId, type: 'input', action: 'hit' }));
    }
}
