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
        
        const target = this.state.players.find(p => p.id !== playerId);
        if (!target) return;
        
        if (action === 'hit') {
            target.health = Math.max(target.health - 10, 0);
            this.state.updatedAt = Date.now();
            
            // Check for game over
            if (target.health <= 0) {
                this.state.gameOver = true;
                this.state.winner = playerId;
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
