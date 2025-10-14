import { Pong } from '../pong';

export function renderPong() {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode') || 'online';
    const gameId = url.searchParams.get('gameId') || undefined;
    const side = (url.searchParams.get('side') as 'top' | 'bottom' | null) || undefined;

    // If no gameId is provided, redirect to lobby
    if (mode === 'online' && !gameId) {
        window.location.href = '/pong-lobby';
        return;
    }

    const controlsText = side === 'top' 
        ? 'Use O and L keys to move your paddle'
        : side === 'bottom'
        ? 'Use R and F keys to move your paddle'
        : 'Use O/L for top paddle, R/F for bottom paddle';

    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Pong Game</h1>
                    <div class="mb-4 text-center">
                        <p class="text-lg font-semibold text-secondary dark:text-secondary-dark">
                            ${controlsText}
                        </p>
                    </div>
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
        const pong = new Pong();
        if (mode === 'online') {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement, { online: true, gameId, side });
        } else {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement);
        }
    }
} 