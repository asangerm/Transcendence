
declare const Phaser: any;

export class Game2Scene extends Phaser.Scene {
    public events!: any;
    private ws!: WebSocket;
    private playerId!: string;
    private gameId!: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isReconnecting = false;
    private allowReconnect = true;
    private ui: { statusText: any; gridTexts: any[]; gridBgs: any[]; selfText: any; opponentText: any } = {
        statusText: null as any,
        gridTexts: [] as any[],
        gridBgs: [] as any[],
        selfText: null as any,
        opponentText: null as any
    };
    private lastState: any = null;

    constructor() {
        super('Game2Scene');
        // Fermer le WS proprement si l'utilisateur quitte la page
        window.addEventListener('beforeunload', () => {
            try {
                this.allowReconnect = false;
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close(1000, 'page_unload');
                }
            } catch {}
        });
    }

    preload() {}

    create() {
        console.log('Game2Scene create() called');
        
        // UI elements
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        this.add.text(640, 100, 'Game2 - Tic-Tac-Toe', { 
            font: '48px Arial', 
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.ui.selfText = this.add.text(50, 150, 'Vous: ...', {
            font: '22px Arial',
            color: '#ffffff'
        });
        this.ui.opponentText = this.add.text(50, 175, 'Adversaire: ...', {
            font: '22px Arial',
            color: '#ffffff'
        });
        this.ui.statusText = this.add.text(50, 200, 'Waiting for connection...', { 
            font: '24px Arial', 
            color: '#cccccc' 
        });

        // Create 3x3 grid of clickable cells
        const cellSize = 140;
        const gap = 10;
        const gridWidth = cellSize * 3 + gap * 2;
        const startX = 640 - gridWidth / 2;
        const startY = 280; // vertical position of the grid

        this.ui.gridTexts = [];
        this.ui.gridBgs = [];

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * (cellSize + gap) + cellSize / 2;
            const y = startY + row * (cellSize + gap) + cellSize / 2;

            // create background rectangle first (target for interactions)
            const bg = this.add.rectangle(x, y, cellSize, cellSize, 0x2a2a2a).setOrigin(0.5);
            bg.setStrokeStyle(2, 0x444444);
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => { 
                console.log('bg pointerdown', i, 'playerId', this.playerId);
                this.playCell(i); 
            });

            // create text above the bg
            const cell = this.add.text(x, y, '', {
                font: '96px Arial',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            cell.setDepth(1);

            this.ui.gridTexts.push(cell);
            this.ui.gridBgs.push(bg);
        }

        // Get gameId from URL parameters
        const url = new URL(window.location.href);
        const urlGameId = url.searchParams.get('gameId');
        this.gameId = urlGameId || '';
        const urlPlayer = (url.searchParams.get('player') || '').toLowerCase();
        if (urlPlayer === 'player1' || urlPlayer === 'player2') {
            this.playerId = urlPlayer;
        } else {
            // Fallback déterministe: par défaut player1 (évite l'aléatoire)
            this.playerId = 'player1';
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
            if (this.allowReconnect && event.code !== 1000 && !this.isReconnecting) {
                if (this.events?.emit) this.events.emit('gameError', `Connection closed: ${event.code} ${event.reason}`);
                this.ui.statusText.setText(`Connection closed: ${event.code} ${event.reason}`).setStyle({ color: '#ff4444' });
                this.attemptReconnect();
            }
        };

        this.ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                console.log('WS message received:', data);
                
                if (data.type === 'created' && data.gameId) {
                    console.log('Game created with gameId:', data.gameId);
                    this.gameId = data.gameId;
                } else if (data.type === 'state' && data.state?.board) {
                    this.lastState = data.state;
                    this.renderState(data.state);
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

    private playCell(index: number) {
        console.log('playCell called for index', index, 'ws readyState', this.ws?.readyState, 'lastState', this.lastState);
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        // Optional client-side checks based on last known state
        if (this.lastState) {
            if (this.lastState.gameOver) return;
            if (this.lastState.currentPlayer !== this.playerId) return;
            if (this.lastState.board?.[index] !== '') return;
        }

        // Send both shape expected by spec and encoded action understood by server layer
        this.ws.send(JSON.stringify({
            gameId: this.gameId,
            playerId: this.playerId,
            type: 'input',
            action: `play:${index}`,
            cellIndex: index
        }));
    }

    private renderState(state: any) {
        // Update names from authoritative state
        try {
            const mySeat = this.playerId === 'player1' || this.playerId === 'player2' ? this.playerId : 'player1';
            const oppSeat = mySeat === 'player1' ? 'player2' : 'player1';
            const players = state.players || {};
            const me = players?.[mySeat];
            const opp = players?.[oppSeat];
            if (this.ui.selfText && me) this.ui.selfText.setText(`Vous: ${me.username || mySeat}`);
            if (this.ui.opponentText) this.ui.opponentText.setText(`Adversaire: ${opp?.username || oppSeat}`);
        } catch {}

        // Update cells
        if (Array.isArray(state.board) && this.ui.gridTexts.length === 9) {
            for (let i = 0; i < 9; i++) {
                const v = state.board[i] || '';
                this.ui.gridTexts[i].setText(v);
            }
        }

        // Update status text
        if (state.gameOver) {
            if (state.winner === 'player1' || state.winner === 'player2') {
                const winnerSeat = state.winner;
                const players = state.players || {};
                const winner = players?.[winnerSeat];
                const winnerName = (winner && winner.username) ? winner.username : (winnerSeat === 'player1' ? 'Player 1' : 'Player 2');
                this.ui.statusText.setText(`Victoire: ${winnerName}`).setStyle({ color: '#44ff44' });
            } else {
                this.ui.statusText.setText('Draw!').setStyle({ color: '#cccccc' });
            }
            // Fermer proprement la connexion après fin de partie
            try {
                this.allowReconnect = false;
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close(1000, 'game_over');
                }
            } catch {}
        } else {
            if (state.currentPlayer === this.playerId) {
                this.ui.statusText.setText('Your turn').setStyle({ color: '#ffffff' });
            } else {
                this.ui.statusText.setText('Waiting for opponent').setStyle({ color: '#cccccc' });
            }
        }

        // Enable/disable interactivity on the bg rectangles (not on text)
        const myTurn = !state.gameOver && state.currentPlayer === this.playerId;
        for (let i = 0; i < this.ui.gridTexts.length; i++) {
            const bg = this.ui.gridBgs[i];
            const empty = state.board[i] === '' || state.board[i] == null;
            if (myTurn && empty) {
                if (!bg.input || !bg.input.enabled) bg.setInteractive({ useHandCursor: true });
            } else {
                if (bg.input && bg.input.enabled) bg.disableInteractive();
            }
        }
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
            try {
                this.allowReconnect = false;
                if (this.ws.readyState === WebSocket.OPEN) this.ws.close(1000, 'scene_destroy');
            } catch {}
            this.ws = null as any;
        }
        super.destroy();
    }

    
}
