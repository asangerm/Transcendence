import type { LobbyState } from '../types/lobby';
import { AuthStore } from '../stores/auth.store';
import { navigateTo } from '../router';

export function renderGame2Lobby() {
    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-6 text-center">Game2 - Matchmaking</h1>

                    <div id="mm-block" class="mb-6 bg-gray-800 p-6 rounded-lg text-center">
                        <p id="mm-status" class="text-lg text-gray-300 mb-4">Clique sur "Chercher une partie" pour trouver un adversaire.</p>
                        <div class="flex gap-4 justify-center">
                            <button id="mm-search" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                                Chercher une partie
                            </button>
                            <button id="mm-cancel" class="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors hidden">
                                Annuler
                            </button>
                        </div>
                    </div>

                    <div id="message-container" class="mt-4"></div>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
        initializeLobby();
    }
}

function initializeLobby() {
    const lobby = new Game2Lobby();
    lobby.init();
}

class Game2Lobby {
    private state: LobbyState = {
        currentRoom: null,
        availableRooms: [],
        playerId: '',
        username: '',
        isOwner: false,
        isReady: false
    };

    private mmInterval: any = null;

    async init() {
        this.state.playerId = this.getCurrentUserId();
        this.state.username = this.getCurrentUsername();
        
        this.setupEventListeners();
    }

    private setupEventListeners() {
        document.getElementById('mm-search')?.addEventListener('click', () => {
            this.startMatchmaking();
        });
        document.getElementById('mm-cancel')?.addEventListener('click', () => {
            this.cancelMatchmaking();
        });
    }

    private async startMatchmaking() {
        const statusP = document.getElementById('mm-status');
        const btnSearch = document.getElementById('mm-search');
        const btnCancel = document.getElementById('mm-cancel');
        if (!this.state.playerId || !this.state.username) {
            this.showMessage('Identité introuvable, veuillez vous reconnecter.', 'error');
            return;
        }
        if (statusP) statusP.textContent = 'Recherche d\'adversaire...';
        btnSearch?.classList.add('hidden');
        btnCancel?.classList.remove('hidden');

        try {
            const res = await fetch('/api/matchmaking/game2/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.state.playerId, username: this.state.username })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Matchmaking indisponible');
            }
            if (data.status === 'matched' && data.gameId && data.seat) {
                navigateTo(`/game2?mode=online&gameId=${data.gameId}&player=${data.seat}`);
                return;
            }
        } catch (e) {
            this.showMessage('Erreur: impossible de lancer la recherche', 'error');
            btnCancel?.classList.add('hidden');
            btnSearch?.classList.remove('hidden');
            return;
        }

        this.mmInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/matchmaking/status/${this.state.playerId}`);
                const data = await res.json();
                if (data.status === 'matched' && data.gameId && data.seat) {
                    clearInterval(this.mmInterval);
                    this.mmInterval = null;
                    navigateTo(`/game2?mode=online&gameId=${data.gameId}&player=${data.seat}`);
                }
            } catch {}
        }, 1000);
    }

    private async cancelMatchmaking() {
        const statusP = document.getElementById('mm-status');
        const btnSearch = document.getElementById('mm-search');
        const btnCancel = document.getElementById('mm-cancel');
        if (this.mmInterval) { clearInterval(this.mmInterval); this.mmInterval = null; }
        try {
            await fetch('/api/matchmaking/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.state.playerId })
            });
        } catch {}
        if (statusP) statusP.textContent = 'Recherche annulée.';
        btnCancel?.classList.add('hidden');
        btnSearch?.classList.remove('hidden');
    }

    constructor() {
        window.addEventListener('beforeunload', () => {
            if (this.mmInterval) { clearInterval(this.mmInterval); this.mmInterval = null; }
            if (this.state.playerId) {
                navigator.sendBeacon('/api/matchmaking/cancel', JSON.stringify({ playerId: this.state.playerId }));
            }
        });
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 rounded-lg mb-4 ${
            type === 'success' ? 'bg-green-800 text-green-200' :
            type === 'error' ? 'bg-red-800 text-red-200' :
            'bg-blue-800 text-blue-200'
        }`;
        messageDiv.textContent = message;

        messageContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    private getCurrentUserId(): string {
        return AuthStore.getUser()?.id.toString() || '';
    }

    private getCurrentUsername(): string {
        return AuthStore.getUser()?.display_name || '';
    }
}