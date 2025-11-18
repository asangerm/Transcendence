declare const Phaser: any;
import { getWsUrl } from '../../config';

export class Game2Scene extends Phaser.Scene {
    public events!: any;
    private ws!: WebSocket;
    private playerId!: string;
    private gameId!: string;
    private theme!: { bg: number; gridFill: number; gridStroke: number; neon: number; text: string; subText: string; xColor: string; oColor: string; timerNorm: string; timerWarn: string };
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isReconnecting = false;
    private allowReconnect = true;
    private ui: { statusText: any; gridTexts: any[]; gridBgs: any[]; selfText: any; opponentText: any; turnNameText?: any; resultText?: any; timerText?: any; timerRing?: any; ghostTexts?: any[] } = {
        statusText: null as any,
        gridTexts: [] as any[],
        gridBgs: [] as any[],
        selfText: null as any,
        opponentText: null as any,
        turnNameText: null as any,
        resultText: null as any,
        timerText: null as any,
        timerRing: null as any,
        ghostTexts: [] as any[]
    };
    private lastState: any = null;
    private gridZones: any[] = [];
    private gridGraphics: any[] = [];
    private gridCellsPositions: { x: number; y: number }[] = [];
    private winGraphics: any = null;
    private overlayDim: any = null;
    private replayContainer: any = null;
    private cellSizeRef: number = 140;
    private finishedFlagKey(gameId: string) { return `game2-finished:${gameId}`; }

    preload() {}

    create() {
        // Theme setup (URL param ?theme=dark|light|cyber|retro)
        const urlForTheme = new URL(window.location.href);
        const themeParam = (urlForTheme.searchParams.get('theme') || 'dark').toLowerCase();
        const themes: Record<string, typeof this.theme> = {
            dark:   { bg: 0x1a1a1a, gridFill: 0x2a2a2a, gridStroke: 0x444444, neon: 0x00d1ff, text: '#ffffff', subText: '#cccccc', xColor: '#00e5ff', oColor: '#ff2bd1', timerNorm: '#ffcc00', timerWarn: '#ff5555' },
            light:  { bg: 0xf5f5f5, gridFill: 0xffffff, gridStroke: 0xcccccc, neon: 0x00bcd4, text: '#1a1a1a', subText: '#333333', xColor: '#00a6c8', oColor: '#d81b60', timerNorm: '#e6a300', timerWarn: '#d32f2f' },
            cyber:  { bg: 0x0b0f1a, gridFill: 0x0f172a, gridStroke: 0x1f2a44, neon: 0x00ffff, text: '#e6f7ff', subText: '#9ecae6', xColor: '#00f0ff', oColor: '#ff00c8', timerNorm: '#ffd54f', timerWarn: '#ff5252' },
            retro:  { bg: 0x121212, gridFill: 0x1e1e1e, gridStroke: 0x3a3a3a, neon: 0x39ff14, text: '#f0f0df', subText: '#cfcfb8', xColor: '#39ff14', oColor: '#ffb000', timerNorm: '#ffe066', timerWarn: '#ff4d4d' }
        };
        this.theme = themes[themeParam] || themes.dark;

        // UI elements
        this.add.rectangle(640, 360, 1280, 720, this.theme.bg);
        // Titre in-canvas supprimé pour un affichage plus épuré
        // Remplacer les labels debug par une ligne de statut unique
        this.ui.statusText = this.add.text(50, 160, '', { 
            font: '24px Arial', 
            color: this.theme.subText 
        });
        // Nom coloré affiché à la suite du label quand c'est au tour de l'adversaire
        this.ui.turnNameText = this.add.text(50, 160, '', {
            font: '24px Arial',
            color: '#1e90ff'
        }).setAlpha(0);

        // Create 3x3 grid of clickable cells
        const cellSize = 140;
        const gap = 10;
        const gridWidth = cellSize * 3 + gap * 2;
        const startX = 640 - gridWidth / 2;
        const startY = 200; // vertical position of the grid (centré visuellement)

        this.ui.gridTexts = [];
        this.ui.gridBgs = [];
        this.ui.ghostTexts = [];
        this.gridZones = [];
        this.gridGraphics = [];
        this.gridCellsPositions = [];

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * (cellSize + gap) + cellSize / 2;
            const y = startY + row * (cellSize + gap) + cellSize / 2;

            // draw rounded tile via Graphics
            const g = this.add.graphics({ x, y });
            g.fillStyle(this.theme.gridFill, 1);
            g.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 12);
            g.lineStyle(2, this.theme.gridStroke, 1);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 12);
            // subtle neon outer glow (layered faint strokes)
            g.lineStyle(8, this.theme.neon, 0.06);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 16);
            g.lineStyle(14, this.theme.neon, 0.03);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 18);

            // interactive zone on top
            const zone = this.add.zone(x, y, cellSize, cellSize).setOrigin(0.5).setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => {
                this.playCell(i);
            });
            zone.on('pointerover', () => {
                this.tweens.add({ targets: g, scale: 1.03, duration: 120, ease: 'Sine.out' });
                // Ghost preview (only if empty and it's my turn)
                const state = this.lastState;
                const myTurn = state && !state.gameOver && state.currentPlayer === this.playerId;
                const empty = !state || (state.board?.[i] === '' || state.board?.[i] == null);
                if (myTurn && empty) {
                    const mark = this.playerId === 'player1' ? 'X' : 'O';
                    const color = mark === 'X' ? this.theme.xColor : this.theme.oColor;
                    const ghost = this.ui.ghostTexts && this.ui.ghostTexts[i];
                    if (ghost) {
                        ghost.setText(mark).setColor(color).setAlpha(0.22);
                        ghost.setScale(0.96);
                    }
                }
            });
            zone.on('pointerout', () => {
                this.tweens.add({ targets: g, scale: 1.0, duration: 120, ease: 'Sine.out' });
                const ghost = this.ui.ghostTexts && this.ui.ghostTexts[i];
                if (ghost) ghost.setText('').setAlpha(0);
            });
            zone.on('pointerdown', () => {
                this.tweens.add({ targets: g, scale: 0.97, duration: 80, yoyo: true, ease: 'Quad.out' });
                // Ink splash effect
                const splash = this.add.graphics({ x, y });
                const mark = this.playerId === 'player1' ? 'X' : 'O';
                const splashColor = (mark === 'X' ? 0x00e5ff : 0xff2bd1);
                splash.fillStyle(splashColor, 0.25);
                splash.fillCircle(0, 0, 2);
                splash.setDepth(2);
                this.tweens.add({
                    targets: splash,
                    scale: { from: 0.2, to: 1.2 },
                    alpha: { from: 0.35, to: 0 },
                    duration: 220,
                    ease: 'Quad.out',
                    onComplete: () => splash.destroy()
                });
            });

            // create text above the bg
            const cell = this.add.text(x, y, '', {
                font: '96px Arial',
                color: this.theme.text,
                align: 'center'
            }).setOrigin(0.5);
            cell.setDepth(1);
            // ghost text (preview)
            const ghostText = this.add.text(x, y, '', {
                font: '96px Arial',
                color: this.theme.text,
                align: 'center'
            }).setOrigin(0.5).setAlpha(0);
            ghostText.setDepth(0.9);

            this.ui.gridTexts.push(cell);
            this.ui.ghostTexts.push(ghostText);
            this.ui.gridBgs.push(zone); // keep same array for interactivity control
            this.gridZones.push(zone);
            this.gridGraphics.push(g);
            this.gridCellsPositions.push({ x, y });
        }
        this.cellSizeRef = cellSize;

        // Texte de timer (au-dessus de la grille)
        const timerY = startY - 82;
        this.ui.timerText = this.add.text(640, timerY, '', {
            font: '36px Arial',
            color: this.theme.timerNorm,
            align: 'center'
        }).setOrigin(0.5);
        this.ui.timerText.setDepth(20);
        // Ring graphics (around "Votre tour" region)
        this.ui.timerRing = this.add.graphics();
        this.ui.timerRing.setDepth(20);

        // Texte de résultat (au-dessus de la grille, sous le timer)
        this.ui.resultText = this.add.text(640, startY - 44, '', {
            font: '42px Arial',
            color: this.theme.subText,
            align: 'center'
        }).setOrigin(0.5);
        this.ui.resultText.setDepth(20);

        // Bouton Rejouer (caché par défaut)
        const maxY = this.gridCellsPositions.reduce((m, p) => Math.max(m, p.y), 0);
        const bw = 220;
        const bh = 56;
        const bx = 640;
        const by = maxY + this.cellSizeRef / 2 + 44;
        this.replayContainer = this.add.container(0, 0).setDepth(25).setVisible(false);
        const btnG = this.add.graphics({ x: bx, y: by });
        btnG.fillStyle(0x00c2ff, 1);
        btnG.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
        const btnLabel = this.add.text(bx, by, 'Rejouer', { font: '24px Arial', color: '#001018' }).setOrigin(0.5);
        const btnZone = this.add.zone(bx, by, bw, bh).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => this.tweens.add({ targets: btnG, scale: 1.05, duration: 120 }));
        btnZone.on('pointerout', () => this.tweens.add({ targets: btnG, scale: 1.0, duration: 120 }));
        btnZone.on('pointerdown', () => {
            import('../../router').then(m => m.navigateTo('/game2-lobby')).catch(() => {
                window.location.href = '/game2-lobby';
            });
        });
        this.replayContainer.add([btnG, btnLabel, btnZone]);

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
        // Si cette partie a été terminée précédemment, rediriger vers le lobby
        try {
            if (this.gameId && sessionStorage.getItem(this.finishedFlagKey(this.gameId)) === '1') {
                this.goToLobby();
                return;
            }
        } catch {}

        const wsUrl = getWsUrl(this.gameId);
        
        try {
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            this.events.emit('connectionFailed');
        }
    }

    private setupWebSocketHandlers() {
        
        // Add a timeout to detect if connection is not established
        const connectionTimeout = setTimeout(() => {
            if (this.ws.readyState === WebSocket.CONNECTING) {
                this.events.emit('gameError', 'Connection timeout - WebSocket failed to connect');
            }
        }, 5000);
        
        this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            if (this.events?.emit) this.events.emit('connectionEstablished');
            if (!this.gameId) {
                // Request to create a game - server will generate the actual gameId
                this.ws.send(JSON.stringify({
                    type: 'create_game',
                    kind: 'game2'
                }));
            } else {
                // already have a gameId; no UI debug message
            }
        };

        this.ws.onerror = () => {
            clearTimeout(connectionTimeout);
            if (this.events?.emit) this.events.emit('gameError', 'Connection error occurred');
            // no UI debug message
            this.attemptReconnect();
        };

        this.ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            // Only attempt reconnection if it's not a normal closure and not during reconnection
            if (this.allowReconnect && event.code !== 1000 && !this.isReconnecting) {
                if (this.events?.emit) this.events.emit('gameError', `Connection closed: ${event.code} ${event.reason}`);
                // no UI debug message
                this.attemptReconnect();
            }
        };

        this.ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                if (data.type === 'created' && data.gameId) {
                    this.gameId = data.gameId;
                } else if (data.type === 'state' && data.state?.board) {
                    this.lastState = data.state;
                    this.renderState(data.state);
                } else if (data.type === 'error') {
                    if (this.events?.emit) this.events.emit('gameError', data.message);
                    // no UI debug message
                }
            } catch (error) {
            }
        };
    }

    private playCell(index: number) {
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
        // Récupérer les noms (sans affichage des labels debug)
        let mySeat = this.playerId === 'player1' || this.playerId === 'player2' ? this.playerId : 'player1';
        let oppSeat = mySeat === 'player1' ? 'player2' : 'player1';
        const players = state.players || {};
        const opp = players?.[oppSeat];

        // Update cells (with colored marks)
        if (Array.isArray(state.board) && this.ui.gridTexts.length === 9) {
            for (let i = 0; i < 9; i++) {
                const v = state.board[i] || '';
                const color = v === 'X' ? '#00e5ff' : v === 'O' ? '#ff2bd1' : '#ffffff';
                this.ui.gridTexts[i].setText(v).setColor(color);
            }
        }

        // Update status text
        if (state.gameOver) {
            if (state.winner === 'player1' || state.winner === 'player2') {
                const winnerSeat = state.winner;
                const iWon = winnerSeat === this.playerId;
                // Afficher uniquement "Victoire" (vert) ou "Défaite" (rouge) au-dessus de la grille
                if (this.ui.resultText) {
                    this.ui.resultText
                        .setText(iWon ? 'Victoire' : 'Défaite')
                        .setStyle({ color: iWon ? '#44ff44' : '#ff4444' });
                }
                // vider la ligne de gauche
                this.ui.statusText.setText('');
                // draw winning line
                const win = this.detectWinningLine(state.board);
                if (win) {
                    const lineColor = winnerSeat === 'player2' ? 0xff2bd1 : 0x00e5ff; // O -> magenta, X -> cyan
                    this.drawWinLine(win[0], win[2], lineColor);
                }
            } else {
                // Égalité (gris)
                if (this.ui.resultText) {
                    this.ui.resultText.setText('Égalité').setStyle({ color: '#cccccc' });
                }
                this.ui.statusText.setText('');
            }
            // masquer le nom coloré
            if (this.ui.turnNameText) this.ui.turnNameText.setText('').setAlpha(0);
            // cacher le timer
            if (this.ui.timerText) this.ui.timerText.setText('');
            // effacer l'anneau du timer
            if (this.ui.timerRing) this.ui.timerRing.clear();
            // dim overlay
            if (!this.overlayDim) {
                this.overlayDim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45);
                this.overlayDim.setDepth(10);
            } else {
                this.overlayDim.setAlpha(0.45).setVisible(true);
            }
            // afficher bouton Rejouer
            if (this.replayContainer) this.replayContainer.setVisible(true);
            // Fermer proprement la connexion après fin de partie
            try {
                this.allowReconnect = false;
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close(1000, 'game_over');
                }
                // Marquer cette partie comme terminée pour empêcher la restauration via retour arrière
                if (this.gameId) {
                    sessionStorage.setItem(this.finishedFlagKey(this.gameId), '1');
                }
            } catch {}
        } else {
            // effacer le résultat si la partie n'est pas terminée
            if (this.ui.resultText) this.ui.resultText.setText('');
            if (this.overlayDim) this.overlayDim.setVisible(false);
            if (this.winGraphics) { this.winGraphics.destroy(); this.winGraphics = null; }
            if (this.replayContainer) this.replayContainer.setVisible(false);
            if (state.currentPlayer === this.playerId) {
                this.ui.statusText.setText('Votre tour').setStyle({ color: this.theme.text });
                if (this.ui.turnNameText) this.ui.turnNameText.setText('').setAlpha(0);
            } else {
                // "Au tour de [nom]" avec nom de couleur différente
                const oppName = opp?.username || (oppSeat === 'player1' ? 'Player 1' : 'Player 2');
                this.ui.statusText.setText('Au tour de ').setStyle({ color: this.theme.subText });
                // positionner le nom à la suite du label
                const sx = this.ui.statusText.x + this.ui.statusText.width + 6;
                const sy = this.ui.statusText.y;
                if (this.ui.turnNameText) {
                    this.ui.turnNameText.setPosition(sx, sy).setText(oppName).setStyle({ color: '#1e90ff' }).setAlpha(1);
                }
            }
            // Mettre à jour l'affichage du timer
            const deadline = typeof state.turnDeadline === 'number' ? state.turnDeadline : 0;
            const now = Date.now();
            const remainingMs = Math.max(0, deadline - now);
            const remainingSec = Math.ceil(remainingMs / 1000);
            if (this.ui.timerText) {
                const text = remainingSec > 0 ? `${remainingSec}s` : '0s';
                // Couleur d'urgence sous 5 secondes
                const color = remainingSec <= 5 ? this.theme.timerWarn : this.theme.timerNorm;
                this.ui.timerText.setText(text).setStyle({ color });
            }
            // Mettre à jour l'anneau circulaire autour du label "Votre tour"
            try {
                const perTurn = state.perTurnMs || 15000;
                const frac = Phaser.Math.Clamp(remainingMs / perTurn, 0, 1);
                const cx = this.ui.statusText.x - 26;
                const cy = this.ui.statusText.y + 12;
                const r = 18;
                const ring = this.ui.timerRing;
                ring.clear();
                // Background ring
                ring.lineStyle(6, 0x555555, 0.35);
                ring.beginPath();
                ring.arc(cx, cy, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
                ring.strokePath();
                ring.closePath();
                // Foreground arc
                const warn = remainingSec <= 5;
                const colorArc = warn ? parseInt(this.theme.timerWarn.replace('#','0x')) : parseInt(this.theme.timerNorm.replace('#','0x'));
                const alpha = warn ? (0.7 + 0.3 * Math.sin(now / 150)) : 0.9;
                ring.lineStyle(6, colorArc, alpha);
                ring.beginPath();
                const endAngle = -90 + 360 * frac;
                ring.arc(cx, cy, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(endAngle), false);
                ring.strokePath();
                ring.closePath();
            } catch {}
            // Nettoyer les ghosts s'il ne faut pas afficher
            if (this.ui.ghostTexts && this.ui.ghostTexts.length === 9) {
                for (let i = 0; i < 9; i++) {
                    const empty = state.board[i] === '' || state.board[i] == null;
                    if (!empty || state.currentPlayer !== this.playerId) {
                        this.ui.ghostTexts[i].setText('').setAlpha(0);
                    }
                }
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

    private detectWinningLine(board: string[]): number[] | null {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (const line of lines) {
            const [a,b,c] = line;
            const v = board[a];
            if (v && v === board[b] && v === board[c]) return line;
        }
        return null;
    }

    private drawWinLine(a: number, c: number, color: number = 0x00e5ff) {
        try {
            if (this.winGraphics) { this.winGraphics.destroy(); this.winGraphics = null; }
            const ax = this.gridCellsPositions[a].x;
            const ay = this.gridCellsPositions[a].y;
            const cx = this.gridCellsPositions[c].x;
            const cy = this.gridCellsPositions[c].y;
            const g = this.add.graphics();
            g.lineStyle(8, color, 1);
            g.strokeLineShape(new Phaser.Geom.Line(ax, ay, cx, cy));
            g.setDepth(15);
            this.winGraphics = g;
        } catch {}
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.events.emit('connectionFailed');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        setTimeout(() => {
            if (this.ws) {
                this.ws.close();
            }
            const wsUrl = getWsUrl(this.gameId);
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

    // Fermer le WS proprement si l'utilisateur quitte la page
    constructor() { 
        super('Game2Scene');
        window.addEventListener('beforeunload', () => {
            try {
                this.allowReconnect = false;
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close(1000, 'page_unload');
                }
            } catch {}
        });
        // Si la page est restaurée depuis le cache (retour arrière), rediriger si la partie est marquée finie
        window.addEventListener('pageshow', (e: any) => {
            try {
                const persisted = !!(e && e.persisted);
                const url = new URL(window.location.href);
                const gid = url.searchParams.get('gameId') || '';
                if (persisted && gid && sessionStorage.getItem(this.finishedFlagKey(gid)) === '1') {
                    this.goToLobby();
                }
            } catch {}
        });
    }

    private goToLobby() {
        try {
            // Navigation SPA si disponible
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            import('../../router').then(m => m.navigateTo('/')).catch(() => {
                window.location.href = '/';
            });
        } catch {
            window.location.href = '/';
        }
    }
}

