interface PlayerState {
    id: string;
    health: number;
}

export interface Game2State {
    id: string;
    kind: 'game2';
    createdAt: number;
    players: PlayerState[];
}

export class Game2SimpleEngine {
    private state: Game2State;

    constructor(id: string) {
        this.state = {
            id,
            kind: 'game2',
            createdAt: Date.now(),
            players: [
                { id: 'player1', health: 100 },
                { id: 'player2', health: 100 }
            ]
        };
    }

    getState() {
        return this.state;
    }

    applyInput(playerId: string, action: 'hit') {
        const target = this.state.players.find(p => p.id !== playerId);
        if (!target) return;
        if (action === 'hit') target.health = Math.max(target.health - 10, 0);
    }

    update() {
        // Game2SimpleEngine doesn't need continuous updates
        // This method is required by the Engine interface
    }
}
