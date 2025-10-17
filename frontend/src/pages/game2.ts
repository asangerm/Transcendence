import Phaser from 'phaser';
import { Game2Scene } from '../scripts/game2/Game2Scene';
import { UI2Scene } from '../scripts/game2/UI2Scene';

export function renderGame2() {
    const content = `
        <div class="w-full h-full flex items-center justify-center pt-2">
            <div class="bg-primary dark:bg-primary-dark rounded-lg shadow-md flex flex-col items-center justify-center px-4 w-min">
                <h1 class="text-3xl font-bold p-4">Game2 Simple</h1>
                <div id="gameCanvas" class="max-h-[80vh] max-w-[90vw] w-min aspect-[1280/720] rounded-lg bg-transparent relative overflow-hidden">
                </div>
            </div>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) app.innerHTML = content;

    setTimeout(() => initGame(), 100);
}

function initGame() {
    const config = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        backgroundColor: '#1a1a1a',
        parent: 'gameCanvas',
        scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: { default: 'arcade' },
        scene: [UI2Scene, Game2Scene]
    };

    const game = new Phaser.Game(config);
    
    // S'assurer que UI2Scene est au premier plan
    game.scene.bringToTop('UI2Scene');
}
