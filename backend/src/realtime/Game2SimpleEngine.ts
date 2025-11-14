interface PlayerMeta {
    userId: string;
    username?: string;
}

export interface Game2State {
    id: string;
    kind: 'game2';
    createdAt: number;
    updatedAt: number;
    // Timer configuration and runtime data
    perTurnMs: number;          // milliseconds allowed per turn
    turnDeadline: number | null; // absolute timestamp (ms since epoch) when current player's time expires
    players: {
        player1?: PlayerMeta;
        player2?: PlayerMeta;
    };
    board: string[]; // 9 cells: 'X', 'O', ''
    currentPlayer: string; // 'player1' | 'player2'
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
        // Initialize first turn deadline immediately so timer persists across refresh
        this.state.turnDeadline = Date.now() + this.state.perTurnMs;
    }

    getState() {
        return this.state;
    }

    // Set player seat metadata (maps seat -> user)
    setPlayer(seat: 'player1' | 'player2', player: { id: string; username?: string }): void {
        this.state.players[seat] = { userId: player.id, username: player.username };
        this.state.updatedAt = Date.now();
    }

    applyInput(playerId: string, action: string) {
        // Validate player and state
        if (this.state.gameOver) return;
        if (playerId !== 'player1' && playerId !== 'player2') return;

        // Expect action in the form 'play:<index>' to carry the cell index
        // (ws layer forwards only 'action', so we encode index in action)
        if (typeof action !== 'string') return;
        if (!action.startsWith('play')) return;

        let cellIndex: number | null = null;
        const parts = action.split(':');
        if (parts.length === 2) {
            const parsed = parseInt(parts[1], 10);
            cellIndex = Number.isFinite(parsed) ? parsed : null;
        }

        if (cellIndex === null || cellIndex < 0 || cellIndex > 8) return;

        if (playerId !== this.state.currentPlayer) return;
        if (this.state.board[cellIndex] !== '') return;

        // Apply move: player1 -> 'X', player2 -> 'O'
        const mark = playerId === 'player1' ? 'X' : 'O';
        this.state.board[cellIndex] = mark;

        // Check win conditions
        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];

        const hasLine = wins.some(([a,b,c]) => {
            const v = this.state.board[a];
            return v !== '' && v === this.state.board[b] && v === this.state.board[c];
        });

        if (hasLine) {
            this.state.gameOver = true;
            this.state.winner = playerId;
            this.state.updatedAt = Date.now();
            return;
        }

        // Check draw
        const isFull = this.state.board.every(v => v !== '');
        if (isFull) {
            this.state.gameOver = true;
            this.state.winner = null;
            this.state.updatedAt = Date.now();
            return;
        }

        // Switch turn
        this.state.currentPlayer = this.state.currentPlayer === 'player1' ? 'player2' : 'player1';
        // Reset turn deadline for the next player
        this.state.turnDeadline = Date.now() + this.state.perTurnMs;
        this.state.updatedAt = Date.now();
    }

    update() {
        const now = Date.now();
        if (!this.state.gameOver && this.state.turnDeadline != null && now >= this.state.turnDeadline) {
            // Current player ran out of time → opponent wins
            const loser = this.state.currentPlayer;
            const winner = loser === 'player1' ? 'player2' : 'player1';
            this.state.gameOver = true;
            this.state.winner = winner;
            // Freeze deadline to indicate no further countdown
            this.state.turnDeadline = null;
            this.state.updatedAt = now;
            return;
        }
        // Keep updatedAt moving to ensure frequent state broadcasts
        this.state.updatedAt = now;
    }
}
