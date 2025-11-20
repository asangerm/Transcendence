interface PlayerMeta {
    userId: string;
    username?: string;
}

export interface Game2State {
    id: string;
    kind: 'game2';
    createdAt: number;
    updatedAt: number;
    perTurnMs: number;
    turnDeadline: number | null;
    players: {
        player1?: PlayerMeta;
        player2?: PlayerMeta;
    };
    board: string[];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
}

export class Game2SimpleEngine {
    private state: Game2State;

    constructor(id: string) {
        this.state = {
            id,
            kind: 'game2',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            perTurnMs: 15000,
            turnDeadline: null,
            players: {},
            board: Array(9).fill(''),
            currentPlayer: 'player1',
            gameOver: false,
            winner: null
        };
        this.state.turnDeadline = Date.now() + this.state.perTurnMs;
    }

    getState() {
        return this.state;
    }

    setPlayer(seat: 'player1' | 'player2', player: { id: string; username?: string }): void {
        this.state.players[seat] = { userId: player.id, username: player.username };
        this.state.updatedAt = Date.now();
    }

    applyInput(playerId: string, action: string) {
        if (this.state.gameOver) return;
        if (playerId !== 'player1' && playerId !== 'player2') return;

        if (typeof action !== 'string') return;
        if (!action.startsWith('play')) return;

        let indexCase: number | null = null;
        const morceaux = action.split(':');
        if (morceaux.length === 2) {
            const entier = parseInt(morceaux[1], 10);
            indexCase = Number.isFinite(entier) ? entier : null;
        }

        if (indexCase === null || indexCase < 0 || indexCase > 8) return;

        if (playerId !== this.state.currentPlayer) return;
        if (this.state.board[indexCase] !== '') return;

        const signe = playerId === 'player1' ? 'X' : 'O';
        this.state.board[indexCase] = signe;

        const lignesGagnantes = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];

        const aLigne = lignesGagnantes.some(([a,b,c]) => {
            const v = this.state.board[a];
            return v !== '' && v === this.state.board[b] && v === this.state.board[c];
        });

        if (aLigne) {
            this.state.gameOver = true;
            this.state.winner = playerId;
            this.state.updatedAt = Date.now();
            return;
        }

        const estPlein = this.state.board.every(v => v !== '');
        if (estPlein) {
            this.state.gameOver = true;
            this.state.winner = null;
            this.state.updatedAt = Date.now();
            return;
        }

        this.state.currentPlayer = this.state.currentPlayer === 'player1' ? 'player2' : 'player1';
        this.state.turnDeadline = Date.now() + this.state.perTurnMs;
        this.state.updatedAt = Date.now();
    }

    update() {
        const maintenant = Date.now();
        if (!this.state.gameOver && this.state.turnDeadline != null && maintenant >= this.state.turnDeadline) {
            const perdant = this.state.currentPlayer;
            const gagnant = perdant === 'player1' ? 'player2' : 'player1';
            this.state.gameOver = true;
            this.state.winner = gagnant;
            this.state.turnDeadline = null;
            this.state.updatedAt = maintenant;
            return;
        }
        this.state.updatedAt = maintenant;
    }
}
