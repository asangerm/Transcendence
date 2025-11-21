declare const Phaser: any;
import { getWsUrl } from '../../config';
import { navigateTo } from '../../router';

export class Game2Scene extends Phaser.Scene {
    public events!: any;
    private socket!: WebSocket;
    private identifiantJoueur!: string;
    private identifiantPartie!: string;
    private theme!: { bg: number; gridFill: number; gridStroke: number; neon: number; text: string; subText: string; xColor: string; oColor: string; timerNorm: string; timerWarn: string };
    private tentativesReco = 0;
    private maxTentativesReco = 5;
    private delaiReco = 1000;
    private enReconnexion = false;
    private autoriserReco = true;
    private elementsUI: { statusText: any; gridTexts: any[]; gridBgs: any[]; selfText: any; opponentText: any; turnNameText?: any; resultText?: any; timerText?: any; timerRing?: any; ghostTexts?: any[] } = {
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
    private dernierEtat: any = null;
    private zonesGrille: any[] = [];
    private graphismesGrille: any[] = [];
    private positionsCellules: { x: number; y: number }[] = [];
    private graphismeVictoire: any = null;
    private voileObscurci: any = null;
    private conteneurRejouer: any = null;
    private tailleCelluleRef: number = 140;
    private cleFinie(idPartie: string) { return `game2-finished:${idPartie}`; }

    preload() {}

    create() {
        const urlForTheme = new URL(window.location.href);
        const themeParam = (urlForTheme.searchParams.get('theme') || 'dark').toLowerCase();
        const themes: Record<string, typeof this.theme> = {
            dark:   { bg: 0x1a1a1a, gridFill: 0x2a2a2a, gridStroke: 0x444444, neon: 0x00d1ff, text: '#ffffff', subText: '#cccccc', xColor: '#00e5ff', oColor: '#ff2bd1', timerNorm: '#ffcc00', timerWarn: '#ff5555' },
            light:  { bg: 0xf5f5f5, gridFill: 0xffffff, gridStroke: 0xcccccc, neon: 0x00bcd4, text: '#1a1a1a', subText: '#333333', xColor: '#00a6c8', oColor: '#d81b60', timerNorm: '#e6a300', timerWarn: '#d32f2f' },
            cyber:  { bg: 0x0b0f1a, gridFill: 0x0f172a, gridStroke: 0x1f2a44, neon: 0x00ffff, text: '#e6f7ff', subText: '#9ecae6', xColor: '#00f0ff', oColor: '#ff00c8', timerNorm: '#ffd54f', timerWarn: '#ff5252' },
            retro:  { bg: 0x121212, gridFill: 0x1e1e1e, gridStroke: 0x3a3a3a, neon: 0x39ff14, text: '#f0f0df', subText: '#cfcfb8', xColor: '#39ff14', oColor: '#ffb000', timerNorm: '#ffe066', timerWarn: '#ff4d4d' }
        };
        this.theme = themes[themeParam] || themes.dark;

        this.add.rectangle(640, 360, 1280, 720, this.theme.bg);
        this.elementsUI.statusText = this.add.text(50, 160, '', { 
            font: '24px Arial', 
            color: this.theme.subText 
        });
        this.elementsUI.turnNameText = this.add.text(50, 160, '', {
            font: '24px Arial',
            color: '#1e90ff'
        }).setAlpha(0);

        const cellSize = 140;
        const gap = 10;
        const gridWidth = cellSize * 3 + gap * 2;
        const startX = 640 - gridWidth / 2;
        const startY = 200; // vertical position of the grid (centré visuellement)

        this.elementsUI.gridTexts = [];
        this.elementsUI.gridBgs = [];
        this.elementsUI.ghostTexts = [];
        this.zonesGrille = [];
        this.graphismesGrille = [];
        this.positionsCellules = [];

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * (cellSize + gap) + cellSize / 2;
            const y = startY + row * (cellSize + gap) + cellSize / 2;

            const g = this.add.graphics({ x, y });
            g.fillStyle(this.theme.gridFill, 1);
            g.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 12);
            g.lineStyle(2, this.theme.gridStroke, 1);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 12);
            g.lineStyle(8, this.theme.neon, 0.06);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 16);
            g.lineStyle(14, this.theme.neon, 0.03);
            g.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 18);

            const zone = this.add.zone(x, y, cellSize, cellSize).setOrigin(0.5).setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => {
                this.jouerCase(i);
            });
            zone.on('pointerover', () => {
                this.tweens.add({ targets: g, scale: 1.03, duration: 120, ease: 'Sine.out' });
                const state = this.dernierEtat;
                const myTurn = state && !state.gameOver && state.currentPlayer === this.identifiantJoueur;
                const empty = !state || (state.board?.[i] === '' || state.board?.[i] == null);
                if (myTurn && empty) {
                    const mark = this.identifiantJoueur === 'player1' ? 'X' : 'O';
                    const color = mark === 'X' ? this.theme.xColor : this.theme.oColor;
                    const ghost = this.elementsUI.ghostTexts && this.elementsUI.ghostTexts[i];
                    if (ghost) {
                        ghost.setText(mark).setColor(color).setAlpha(0.22);
                        ghost.setScale(0.96);
                    }
                }
            });
            zone.on('pointerout', () => {
                this.tweens.add({ targets: g, scale: 1.0, duration: 120, ease: 'Sine.out' });
                const ghost = this.elementsUI.ghostTexts && this.elementsUI.ghostTexts[i];
                if (ghost) ghost.setText('').setAlpha(0);
            });
            zone.on('pointerdown', () => {
                this.tweens.add({ targets: g, scale: 0.97, duration: 80, yoyo: true, ease: 'Quad.out' });
                const splash = this.add.graphics({ x, y });
                const mark = this.identifiantJoueur === 'player1' ? 'X' : 'O';
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

            const cell = this.add.text(x, y, '', {
                font: '96px Arial',
                color: this.theme.text,
                align: 'center'
            }).setOrigin(0.5);
            cell.setDepth(1);
            const ghostText = this.add.text(x, y, '', {
                font: '96px Arial',
                color: this.theme.text,
                align: 'center'
            }).setOrigin(0.5).setAlpha(0);
            ghostText.setDepth(0.9);

            this.elementsUI.gridTexts.push(cell);
            this.elementsUI.ghostTexts.push(ghostText);
            this.elementsUI.gridBgs.push(zone);
            this.zonesGrille.push(zone);
            this.graphismesGrille.push(g);
            this.positionsCellules.push({ x, y });
        }
        this.tailleCelluleRef = cellSize;

        const timerY = startY - 82;
        this.elementsUI.timerText = this.add.text(640, timerY, '', {
            font: '36px Arial',
            color: this.theme.timerNorm,
            align: 'center'
        }).setOrigin(0.5);
        this.elementsUI.timerText.setDepth(20);
        this.elementsUI.timerRing = this.add.graphics();
        this.elementsUI.timerRing.setDepth(20);

        this.elementsUI.resultText = this.add.text(640, startY - 44, '', {
            font: '42px Arial',
            color: this.theme.subText,
            align: 'center'
        }).setOrigin(0.5);
        this.elementsUI.resultText.setDepth(20);

        const maxY = this.positionsCellules.reduce((m, p) => Math.max(m, p.y), 0);
        const bw = 220;
        const bh = 56;
        const bx = 640;
        const by = maxY + this.tailleCelluleRef / 2 + 44;
        this.conteneurRejouer = this.add.container(0, 0).setDepth(25).setVisible(false);
        const btnG = this.add.graphics({ x: bx, y: by });
        btnG.fillStyle(0xEBEBEB, 1);
        btnG.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
        const btnLabel = this.add.text(bx, by, 'Rejouer', { font: '24px Arial', color: '#001018' }).setOrigin(0.5);
        const btnZone = this.add.zone(bx, by, bw, bh).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => this.tweens.add({ targets: btnG, scale: 1.05, duration: 120 }));
        btnZone.on('pointerout', () => this.tweens.add({ targets: btnG, scale: 1.0, duration: 120 }));
        btnZone.on('pointerdown', () => {
            navigateTo('/game2-lobby');
        });
        this.conteneurRejouer.add([btnG, btnLabel, btnZone]);

        const url = new URL(window.location.href);
        const urlGameId = url.searchParams.get('gameId');
        this.identifiantPartie = urlGameId || '';
        const urlPlayer = (url.searchParams.get('player') || '').toLowerCase();
        if (urlPlayer === 'player1' || urlPlayer === 'player2') {
            this.identifiantJoueur = urlPlayer;
        } else {
            this.identifiantJoueur = 'player1';
        }
        try {
            if (this.identifiantPartie && sessionStorage.getItem(this.cleFinie(this.identifiantPartie)) === '1') {
                this.allerAuLobby();
                return;
            }
        } catch {}

        const wsUrl = getWsUrl(this.identifiantPartie);
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.initialiserGestionnairesSocket();
        } catch (error) {
            this.events.emit('connectionFailed');
        }
    }

    private initialiserGestionnairesSocket() {
        const connectionTimeout = setTimeout(() => {
            if (this.socket.readyState === WebSocket.CONNECTING) {
                this.events.emit('gameError', 'Connection timeout - WebSocket failed to connect');
            }
        }, 5000);
        
        this.socket.onopen = () => {
            clearTimeout(connectionTimeout);
            if (this.events?.emit) this.events.emit('connectionEstablished');
            if (!this.identifiantPartie) {
                this.socket.send(JSON.stringify({
                    type: 'create_game',
                    kind: 'game2'
                }));
            } else {
            }
        };

        this.socket.onerror = () => {
            clearTimeout(connectionTimeout);
            if (this.events?.emit) this.events.emit('gameError', 'Connection error occurred');
            this.tenterReconnexion();
        };

        this.socket.onclose = (event) => {
            clearTimeout(connectionTimeout);
            if (this.autoriserReco && event.code !== 1000 && !this.enReconnexion) {
                if (this.events?.emit) this.events.emit('gameError', `Connection closed: ${event.code} ${event.reason}`);
                this.tenterReconnexion();
            }
        };

        this.socket.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                if (data.type === 'created' && data.gameId) {
                    this.identifiantPartie = data.gameId;
                } else if (data.type === 'state' && data.state?.board) {
                    this.dernierEtat = data.state;
                    this.afficherEtat(data.state);
                } else if (data.type === 'error') {
                    if (this.events?.emit) this.events.emit('gameError', data.message);
                }
            } catch (error) {
            }
        };
    }

    private jouerCase(index: number) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        if (this.dernierEtat) {
            if (this.dernierEtat.gameOver) return;
            if (this.dernierEtat.currentPlayer !== this.identifiantJoueur) return;
            if (this.dernierEtat.board?.[index] !== '') return;
        }

        this.socket.send(JSON.stringify({
            gameId: this.identifiantPartie,
            playerId: this.identifiantJoueur,
            type: 'input',
            action: `play:${index}`,
            cellIndex: index
        }));
    }

    private afficherEtat(state: any) {
        let mySeat = this.identifiantJoueur === 'player1' || this.identifiantJoueur === 'player2' ? this.identifiantJoueur : 'player1';
        let oppSeat = mySeat === 'player1' ? 'player2' : 'player1';
        const players = state.players || {};
        const opp = players?.[oppSeat];

        if (Array.isArray(state.board) && this.elementsUI.gridTexts.length === 9) {
            for (let i = 0; i < 9; i++) {
                const v = state.board[i] || '';
                const color = v === 'X' ? '#00e5ff' : v === 'O' ? '#ff2bd1' : '#ffffff';
                this.elementsUI.gridTexts[i].setText(v).setColor(color);
            }
        }

        if (state.gameOver) {
            if (state.winner === 'player1' || state.winner === 'player2') {
                const winnerSeat = state.winner;
                const iWon = winnerSeat === this.identifiantJoueur;
                if (this.elementsUI.resultText) {
                    this.elementsUI.resultText
                        .setText(iWon ? 'Victoire' : 'Défaite')
                        .setStyle({ color: iWon ? '#44ff44' : '#ff4444' });
                }
                this.elementsUI.statusText.setText('');
                const win = this.detecterLigneGagnante(state.board);
                if (win) {
                    const lineColor = winnerSeat === 'player2' ? 0xff2bd1 : 0x00e5ff; // O -> magenta, X -> cyan
                    this.tracerLigneVictoire(win[0], win[2], lineColor);
                }
            } else {
                if (this.elementsUI.resultText) {
                    this.elementsUI.resultText.setText('Égalité').setStyle({ color: '#cccccc' });
                }
                this.elementsUI.statusText.setText('');
            }
            if (this.elementsUI.turnNameText) this.elementsUI.turnNameText.setText('').setAlpha(0);
            if (this.elementsUI.timerText) this.elementsUI.timerText.setText('');
            if (this.elementsUI.timerRing) this.elementsUI.timerRing.clear();
            if (!this.voileObscurci) {
                this.voileObscurci = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45);
                this.voileObscurci.setDepth(10);
            } else {
                this.voileObscurci.setAlpha(0.45).setVisible(true);
            }
            if (this.conteneurRejouer) this.conteneurRejouer.setVisible(true);
            try {
                this.autoriserReco = false;
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.close(1000, 'game_over');
                }
                if (this.identifiantPartie) {
                    sessionStorage.setItem(this.cleFinie(this.identifiantPartie), '1');
                }
            } catch {}
        } else {
            if (this.elementsUI.resultText) this.elementsUI.resultText.setText('');
            if (this.voileObscurci) this.voileObscurci.setVisible(false);
            if (this.graphismeVictoire) { this.graphismeVictoire.destroy(); this.graphismeVictoire = null; }
            if (this.conteneurRejouer) this.conteneurRejouer.setVisible(false);
            if (state.currentPlayer === this.identifiantJoueur) {
                this.elementsUI.statusText.setText('Votre tour').setStyle({ color: this.theme.text });
                if (this.elementsUI.turnNameText) this.elementsUI.turnNameText.setText('').setAlpha(0);
            } else {
                const oppName = opp?.username || (oppSeat === 'player1' ? 'Player 1' : 'Player 2');
                this.elementsUI.statusText.setText('Au tour de ').setStyle({ color: this.theme.subText });
                const sx = this.elementsUI.statusText.x + this.elementsUI.statusText.width + 6;
                const sy = this.elementsUI.statusText.y;
                if (this.elementsUI.turnNameText) {
                    this.elementsUI.turnNameText.setPosition(sx, sy).setText(oppName).setStyle({ color: '#1e90ff' }).setAlpha(1);
                }
            }
            const deadline = typeof state.turnDeadline === 'number' ? state.turnDeadline : 0;
            const now = Date.now();
            const remainingMs = Math.max(0, deadline - now);
            const remainingSec = Math.ceil(remainingMs / 1000);
            if (this.elementsUI.timerText) {
                const text = remainingSec > 0 ? `${remainingSec}s` : '0s';
                const color = remainingSec <= 5 ? this.theme.timerWarn : this.theme.timerNorm;
                this.elementsUI.timerText.setText(text).setStyle({ color });
            }
            try {
                const perTurn = state.perTurnMs || 15000;
                const frac = Phaser.Math.Clamp(remainingMs / perTurn, 0, 1);
                const cx = this.elementsUI.statusText.x - 26;
                const cy = this.elementsUI.statusText.y + 12;
                const r = 18;
                const ring = this.elementsUI.timerRing;
                ring.clear();
                ring.lineStyle(6, 0x555555, 0.35);
                ring.beginPath();
                ring.arc(cx, cy, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
                ring.strokePath();
                ring.closePath();
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
            if (this.elementsUI.ghostTexts && this.elementsUI.ghostTexts.length === 9) {
                for (let i = 0; i < 9; i++) {
                    const empty = state.board[i] === '' || state.board[i] == null;
                    if (!empty || state.currentPlayer !== this.identifiantJoueur) {
                        this.elementsUI.ghostTexts[i].setText('').setAlpha(0);
                    }
                }
            }
        }

        const myTurn = !state.gameOver && state.currentPlayer === this.identifiantJoueur;
        for (let i = 0; i < this.elementsUI.gridTexts.length; i++) {
            const bg = this.elementsUI.gridBgs[i];
            const empty = state.board[i] === '' || state.board[i] == null;
            if (myTurn && empty) {
                if (!bg.input || !bg.input.enabled) bg.setInteractive({ useHandCursor: true });
            } else {
                if (bg.input && bg.input.enabled) bg.disableInteractive();
            }
        }
    }

    private detecterLigneGagnante(board: string[]): number[] | null {
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

    private tracerLigneVictoire(a: number, c: number, color: number = 0x00e5ff) {
        try {
            if (this.graphismeVictoire) { this.graphismeVictoire.destroy(); this.graphismeVictoire = null; }
            const ax = this.positionsCellules[a].x;
            const ay = this.positionsCellules[a].y;
            const cx = this.positionsCellules[c].x;
            const cy = this.positionsCellules[c].y;
            const g = this.add.graphics();
            g.lineStyle(8, color, 1);
            g.strokeLineShape(new Phaser.Geom.Line(ax, ay, cx, cy));
            g.setDepth(15);
            this.graphismeVictoire = g;
        } catch {}
    }

    private tenterReconnexion() {
        if (this.tentativesReco >= this.maxTentativesReco) {
            this.events.emit('connectionFailed');
            return;
        }

        this.enReconnexion = true;
        this.tentativesReco++;
        
        setTimeout(() => {
            if (this.socket) {
                this.socket.close();
            }
            const wsUrl = getWsUrl(this.identifiantPartie);
            this.socket = new WebSocket(wsUrl);
            this.initialiserGestionnairesSocket();
            this.enReconnexion = false;
        }, this.delaiReco * this.tentativesReco);
    }

    destroy() {
        if (this.socket) {
            try {
                this.autoriserReco = false;
                if (this.socket.readyState === WebSocket.OPEN) this.socket.close(1000, 'scene_destroy');
            } catch {}
            this.socket = null as any;
        }
        super.destroy();
    }

    constructor() { 
        super('Game2Scene');
        window.addEventListener('beforeunload', () => {
            try {
                this.autoriserReco = false;
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.close(1000, 'page_unload');
                }
            } catch {}
        });
        window.addEventListener('pageshow', (e: any) => {
            try {
                const persisted = !!(e && e.persisted);
                const url = new URL(window.location.href);
                const gid = url.searchParams.get('gameId') || '';
                if (persisted && gid && sessionStorage.getItem(this.cleFinie(gid)) === '1') {
                    this.allerAuLobby();
                }
            } catch {}
        });
    }

    private allerAuLobby() {
        navigateTo('/');
    }
}

