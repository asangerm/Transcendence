import { PongGame } from '../scripts/pong/pong';

export function renderPong() {
    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Pong Game</h1>
                    <div id="gameCanvas" class="w-full h-96 rounded-lg">
                        <!-- Game canvas will be inserted here -->
                    </div>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
        // Game logic will be implemented here
        const pongGame = new PongGame();
        pongGame.mount(document.getElementById('gameCanvas') as HTMLElement);
    }
} 