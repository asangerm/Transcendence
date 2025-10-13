import { Pong } from '../pong';

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
        const url = new URL(window.location.href);
        const mode = url.searchParams.get('mode') || 'online';
        const gameId = url.searchParams.get('gameId') || undefined;
        const side = (url.searchParams.get('side') as 'top' | 'bottom' | null) || undefined;
        const pong = new Pong();
        if (mode === 'online') {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement, { online: true, gameId, side });
        } else {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement);
        }
    }
} 