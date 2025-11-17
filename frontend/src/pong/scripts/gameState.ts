export interface GameState {
    id: number;
    players: {
        top: {
            username: string;
            points: number;
            position: {x: number, y: number, z: number};
            velocity: {x: number, y: number, z: number};
        };
        bottom: {
            username: string;
            points: number;
            position: {x: number, y: number, z: number};
            velocity: {x: number, y: number, z: number};
        };
    }
    ball: {
        position: {x: number, y: number, z: number};
        velocity: {x: number, y: number, z: number};
    };
    gameOver: boolean;
    winner: string | null;
    createdAt: string;
    updatedAt: string;
}

export type GameAction = 'moveLeft' | 'moveRight';

export interface UserInputState {
    gameId: number; // id of the game instance targeted
    player: string; // username of the player
    action: GameAction;
}
