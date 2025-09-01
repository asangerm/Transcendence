
import Phaser from 'phaser';
import { GameScene } from '../scripts/game2/GameScene';
import { UIScene } from '../scripts/game2/UIScene';

export function renderGame2() {
    const content = `
        <div class="min-h-screen">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Age of ward</h1>
                    <div id="gameCanvas" class="w-full h-96 bg-black rounded-lg">
                        <!-- Game canvas will be inserted here -->
                    </div>
                </div>
            </main>
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