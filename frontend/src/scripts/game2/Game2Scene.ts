/* eslint-disable @typescript-eslint/no-explicit-any */
// Use global Phaser provided by the bundler/runtime to avoid TS type dependency
declare const Phaser: any;

export class Game2Scene extends Phaser.Scene {
    // Explicitly declare events to satisfy TS when Phaser types are not available
    public events!: any;
    private ws!: WebSocket;
    private playerId!: string;
    private gameId!: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isReconnecting = false;
    private ui: { healthText: any; statusText: any; hitButton: any } = {
        healthText: null as any,
        statusText: null as any,
        hitButton: null as any
    };

    constructor() { super('Game2Scene'); }

    preload() {}

    create() {
        console.log('Game2Scene create() called');
        
        // UI elements (merged from UI2Scene)
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        this.add.text(640, 100, 'Game2 - Battle Arena', { 
            font: '48px Arial', 
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.ui.healthText = this.add.text(50, 200, 'Connecting...', { 
            font: '32px Arial', 
            color: '#ffffff' 
        });
        this.ui.statusText = this.add.text(50, 250, 'Waiting for connection...', { 
            font: '24px Arial', 
            color: '#cccccc' 
        });
        this.ui.hitButton = this.add.text(640, 500, 'HIT', { 
            font: '48px Arial', 
            color: '#ffffff',
            backgroundColor: '#ff4444',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => { this.hit(); })
        .on('pointerover', () => { this.ui.hitButton.setStyle({ backgroundColor: '#ff6666' }); })
        .on('pointerout', () => { this.ui.hitButton.setStyle({ backgroundColor: '#ff4444' }); });

        // Get gameId from URL parameters
        const url = new URL(window.location.href);
        const urlGameId = url.searchParams.get('gameId');
        this.gameId = urlGameId || '';
        const urlPlayer = (url.searchParams.get('player') || '').toLowerCase();
        if (urlPlayer === 'player1' || urlPlayer === 'player2') {
            this.playerId = urlPlayer;
        } else {
            this.playerId = Math.random() < 0.5 ? 'player1' : 'player2';
        }

        const wsUrl = this.gameId
            ? `ws://localhost:8000/ws?gameId=${this.gameId}`
            : `ws://localhost:8000/ws`;
        console.log('Creating WebSocket connection. URL:', wsUrl);
        
        try {
            this.ws = new WebSocket(wsUrl);
            console.log('WebSocket object created, readyState:', this.ws.readyState);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.events.emit('connectionFailed');
        }
    }

    private setupWebSocketHandlers() {
        console.log('Setting up WebSocket handlers, readyState:', this.ws.readyState);
        
        // Add a timeout to detect if connection is not established
        const connectionTimeout = setTimeout(() => {
            if (this.ws.readyState === WebSocket.CONNECTING) {
                console.error('WebSocket connection timeout');
                this.events.emit('gameError', 'Connection timeout - WebSocket failed to connect');
            }
        }, 5000);
        
        this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket connected to:', this.ws.url);
            console.log('WebSocket readyState:', this.ws.readyState);
            if (this.events?.emit) this.events.emit('connectionEstablished');
            if (!this.gameId) {
                this.ui.statusText.setText('Connected! Creating game...').setStyle({ color: '#44ff44' });
                // Request to create a game - server will generate the actual gameId
                this.ws.send(JSON.stringify({
                    type: 'create_game',
                    kind: 'game2'
                }));
            } else {
                this.ui.statusText.setText(`Connected to game ${this.gameId}`).setStyle({ color: '#44ff44' });
            }
        };

        this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('WebSocket error:', error);
            if (this.events?.emit) this.events.emit('gameError', 'Connection error occurred');
            this.ui.statusText.setText('Connection error occurred').setStyle({ color: '#ff4444' });
            this.attemptReconnect();
        };

        this.ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket closed:', event.code, event.reason);
            // Only attempt reconnection if it's not a normal closure and not during reconnection
            if (event.code !== 1000 && !this.isReconnecting) {
                if (this.events?.emit) this.events.emit('gameError', `Connection closed: ${event.code} ${event.reason}`);
                this.ui.statusText.setText(`Connection closed: ${event.code} ${event.reason}`).setStyle({ color: '#ff4444' });
                this.attemptReconnect();
            }
        };

        this.ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                // console.log('Message received:', data);
                
            if (data.type === 'created' && data.gameId) {
                // Server created the game, just update our gameId - no need to reconnect
                console.log('Game created with gameId:', data.gameId);
                this.gameId = data.gameId;
                // Don't reconnect - the connection is already established and working
            } else if (data.type === 'state' && data.state?.players) {
                    const players = data.state.players;
                    const p1 = players.find((p: any) => p.id === 'player1');
                    const p2 = players.find((p: any) => p.id === 'player2');
                    if (p1 && p2) {
                        const p1Label = p1.id === this.playerId ? 'You' : 'Player 1';
                        const p2Label = p2.id === this.playerId ? 'You' : 'Player 2';
                        this.ui.healthText.setText(`${p1Label}: ${p1.health} HP    ${p2Label}: ${p2.health} HP`);
                        if (p1.health <= 0) {
                            this.ui.statusText.setText('Player 2 Wins!').setStyle({ color: '#44ff44' });
                            this.ui.hitButton.setVisible(false);
                        } else if (p2.health <= 0) {
                            this.ui.statusText.setText('Player 1 Wins!').setStyle({ color: '#44ff44' });
                            this.ui.hitButton.setVisible(false);
                        } else {
                            this.ui.statusText.setText('Game in progress...').setStyle({ color: '#cccccc' });
                        }
                    }
                } else if (data.type === 'error') {
                    console.error('Server error:', data.message);
                    if (this.events?.emit) this.events.emit('gameError', data.message);
                    this.ui.statusText.setText(`Error: ${data.message}`).setStyle({ color: '#ff4444' });
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }

    hit() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ gameId: this.gameId, playerId: this.playerId, type: 'input', action: 'hit' }));
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.events.emit('connectionFailed');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            if (this.ws) {
                this.ws.close();
            }
            console.log('Creating new WebSocket connection for reconnection...');
            const wsUrl = this.gameId
                ? `ws://localhost:8000/ws?gameId=${this.gameId}`
                : `ws://localhost:8000/ws`;
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
            this.isReconnecting = false;
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
            this.ws = null as any;
        }
        super.destroy();
    }
}
