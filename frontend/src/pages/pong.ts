import { Pong } from '../pong';

export function renderPong() {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode') || 'online';
    const gameId = url.searchParams.get('gameId') || undefined;
    const side = (url.searchParams.get('side') as 'top' | 'bottom' | null) || undefined;
    const difficulty = url.searchParams.get('difficulty') || 'medium';

    // If no gameId is provided, redirect to lobby
    if (mode === 'online' && !gameId) {
        window.location.href = '/pong-lobby';
        return;
    }

    const isLocal = mode === 'local';
    const isAI = mode === 'ai';
    const isTournament = mode === 'tournament';
    const matchId = url.searchParams.get('matchId') ? parseInt(url.searchParams.get('matchId')!) : undefined;

    if (isTournament && !matchId) {
        window.location.href = '/pong-lobby';
        return;
    }

    const controlsText = isAI
        ? 'Touches: Z/A pour votre raquette (vous jouez contre l\'IA)'
        : (isLocal || isTournament)
            ? 'Touches: Joueur 1: Z/A  Joueur 2: M/K'
            : 'Touches: Z/X pour votre raquette';
    const showQuitButton = !isTournament;

    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Pong</h1>
                    <div class="mb-4 text-center">
                        <p class="text-lg font-semibold text-secondary dark:text-secondary-dark">
                            ${controlsText}
                        </p>
                        ${showQuitButton ? `
                        <div class="flex flex-row justify-center gap-2">
                            <button id="quit-btn" class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                                Quitter
                            </button>
                        </div>` : ``}
                    </div>
                    <div id="gameCanvas" class="w-full h-96 rounded-lg">
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
        } else if (isTournament) {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement, { online: false, gameId, matchId });
        } else {
            pong.mount(document.getElementById('gameCanvas') as HTMLElement, { online: false, gameId, vsAI: isAI, aiDifficulty: difficulty as 'easy' | 'medium' | 'hard' }); }
        const quitBtn = document.getElementById('quit-btn');
        quitBtn?.addEventListener('click', async () => {
            try {
                let gid = gameId;
                if (!gid) {
                    const url2 = new URL(window.location.href);
                    gid = url2.searchParams.get('gameId') || '';
                }
                if (gid) {
                    const forfeitSide = (side as 'top' | 'bottom') || 'top';
                    await fetch(`http://${window.location.hostname}:8000/api/games/${gid}/forfeit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ side: forfeitSide })
                    });
                }
            } catch {}
            window.location.href = '/pong-lobby';
        });
    }
} 