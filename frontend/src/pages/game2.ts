
import Phaser from 'phaser';
import { GameScene } from '../scripts/game2/GameScene';
import { UIScene } from '../scripts/game2/UIScene';

export function renderGame2() {
    const content = `
        <div class="w-full h-full flex items-center justify-center pt-2">
            <div class="bg-primary dark:bg-primary-dark rounded-lg shadow-md flex flex-col items-center justify-center px-4 w-min">
                <h1 class="text-3xl font-bold p-4">Age of ward</h1>
                <div id="gameCanvas" class="max-h-[80vh] max-w-[90vw] w-min aspect-[1280/720] rounded-lg bg-transparent relative overflow-hidden">
                    <!-- Game canvas will be inserted here -->
                </div>
            </div>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;

		setTimeout(() => {
            initGame();
        }, 100);
        // Game logic will be implemented here
    }
}

function initGame() {
    const config = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        backgroundColor: '#1a1a1a',
        parent: 'gameCanvas', // ← IMPORTANT : cible le div gameCanvas
        scale: {
            mode: Phaser.Scale.ENVELOP,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: { debug: true }
        },
        scene: [GameScene, UIScene]
    };

    new Phaser.Game(config);
}