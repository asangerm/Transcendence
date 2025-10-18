import Phaser from 'phaser';

export class Game2Scene extends Phaser.Scene {
    private ws!: WebSocket;
    private playerId!: string;
    private gameId!: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isReconnecting = false;

    constructor() { super('Game2Scene'); }

    preload() {}

    create() {
        console.log('Game2Scene create() called');
        
        // Get gameId from URL parameters
        const url = new URL(window.location.href);
        this.gameId = url.searchParams.get('gameId') || 'game2-' + Date.now();
        this.playerId = Math.random() < 0.5 ? 'player1' : 'player2';

        console.log('Creating WebSocket connection with gameId:', this.gameId);
        console.log('WebSocket URL:', `ws://localhost:3000/ws?gameId=${this.gameId}`);
        
        try {
            this.ws = new WebSocket(`ws://localhost:3000/ws?gameId=${this.gameId}`);
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
            this.events.emit('connectionEstablished');
            // Request to create a game - server will generate the actual gameId
            this.ws.send(JSON.stringify({
                type: 'create_game',
                kind: 'game2'
            }));
        };

        this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('WebSocket error:', error);
            this.events.emit('gameError', 'Connection error occurred');
            this.attemptReconnect();
        };

        this.ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket closed:', event.code, event.reason);
            // Only attempt reconnection if it's not a normal closure and not during reconnection
            if (event.code !== 1000 && !this.isReconnecting) {
                this.events.emit('gameError', `Connection closed: ${event.code} ${event.reason}`);
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
                    // console.log('Processing state update:', data.state);
                    // console.log('Players:', data.state.players);
                    this.events.emit('updateState', data.state.players);
                } else if (data.type === 'error') {
                    console.error('Server error:', data.message);
                    this.events.emit('gameError', data.message);
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
            this.ws = new WebSocket(`ws://localhost:3000/ws?gameId=${this.gameId}`);
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
