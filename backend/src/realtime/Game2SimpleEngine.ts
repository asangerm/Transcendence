interface PlayerState {
    id: string;
    health: number;
}


export interface Game2State {
    id: string;
    kind: 'game2';
    createdAt: number;
    updatedAt: number;
    players: PlayerState[];
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
            players: [
                { id: 'player1', health: 100 },
                { id: 'player2', health: 100 }
            ],
            gameOver: false,
            winner: null
        };
    }

    getState() {
        return this.state;
    }

    applyInput(playerId: string, action: 'hit') {
        if (this.state.gameOver) return;
        // Only accept canonical slots
        if (playerId !== 'player1' && playerId !== 'player2') return;

        const attacker = playerId;
        const targetId = attacker === 'player1' ? 'player2' : 'player1';
        const target = this.state.players.find(p => p.id === targetId);
        if (!target) return;

        if (action === 'hit') {
            target.health = Math.max(target.health - 10, 0);
            this.state.updatedAt = Date.now();

            if (target.health <= 0) {
                this.state.gameOver = true;
                this.state.winner = attacker;
            }
        }
    }

    update() {
        // Game2SimpleEngine doesn't need continuous updates
        // This method is required by the Engine interface
        // Just update the timestamp for consistency
        this.state.updatedAt = Date.now();
    }
}
