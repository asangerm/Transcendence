import type { LobbyState } from '../types/lobby';
import { AuthStore } from '../stores/auth.store';
import { navigateTo } from '../router';

export function renderPongLobby() {
    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto p-4">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-2xl shadow-md flex flex-col gap-4">
					<h1 class="text-3xl font-bold text-center">Salon Pong</h1>
                    
                    <!-- Local Section -->
                    <div id="local-section" class="">
                        <div class="bg-gray-800 p-2 pl-4 rounded-xl flex items-center">
                            <h2 class="text-xl font-semibold">Local</h2>
                            <button 
                                id="play-local-btn" 
                                class="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                            >
								Jouer en local
                            </button>
                        </div>
                    </div>

                    <!-- AI Section -->
                    <div id="ai-section" class="">
                        <div class="bg-gray-800 p-2 pl-4 rounded-xl">
                            <h2 class="text-xl font-semibold mb-2">Contre l'IA</h2>
                            <div class="flex items-center gap-3">
                                <select id="ai-difficulty" class="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none">
                                    <option value="easy">Facile</option>
                                    <option value="medium" selected>Moyen</option>
                                    <option value="hard">Difficile</option>
                                </select>
                                <button
                                    id="play-ai-btn"
                                    class="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Jouer contre l'IA
                                </button>
                            </div>
                        </div>
                    </div>
                    
					<div id="duel-section" class="">
						<div class="bg-gray-800 p-2 rounded-xl">
							<h2 class="text-xl font-semibold ml-2 mb-2">Demander un duel</h2>
							<div class="flex flex-col gap-2">
								<div class="flex gap-4 items-center">
									<input 
										type="text" 
										id="duel-search" 
										placeholder="Rechercher un joueur..." 
										class="flex-1 px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
										autocomplete="off"
									/>
									<button 
										id="send-duel-btn" 
										class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled
									>
										Envoyer la demande
									</button>
								</div>
                                <div id="duel-results" class="bg-gray-700 rounded-lg max-h-64 overflow-auto hidden"></div>
                                <div id="duel-selected" class="text-sm text-gray-300"></div>
                            </div>
						</div>
					</div>

					<div id="duels-list-section" class="">
						<div class="bg-gray-800 p-2 rounded-xl">
							<h2 class="text-xl font-semibold ml-2 mb-2">Demandes de duel</h2>
							<div id="duels-list" class="flex flex-col gap-2"></div>
						</div>
					</div>

                    <!-- Current Room Section -->
                    <div id="current-room" class="hidden w-min">
                        <div class="bg-gray-800 p-2 rounded-xl">
                            <div class="flex justify-between items-center mb-2">
								<h2 class="text-xl font-semibold ml-2">Salle actuelle : <span id="current-room-name" class="font-normal italic"></span></h2>
                            </div>
                            
                            <div class="flex flex-row gap-2 mb-2">
                                <!-- Top Player -->
                                <div class="bg-gray-700 p-2 rounded-lg w-52">
									<h3 class="font-semibold mb-1">Joueur 1</h3>
                                    <div id="top-player" class="text-gray-400">
										<span class="text-sm">En attente d’un joueur...</span>
                                    </div>
                                </div>
                                
                                <!-- Bottom Player -->
                                <div class="bg-gray-700 p-2 rounded-lg w-52">
									<h3 class="font-semibold mb-2">Joueur 2</h3>
                                    <div id="bottom-player" class="text-gray-400">
										<span class="text-sm">En attente d’un joueur...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button 
                                    id="start-game-btn" 
                                    class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors hidden"
                                >
									Démarrer
                                </button>
                                <button 
                                    id="leave-room-btn" 
                                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                                >
									Quitter
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
                <!-- Error/Success Messages -->
                <div id="message-container" class=""></div>
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
    const lobby = new PongLobby();
    lobby.init();
}

class PongLobby {
    private state: LobbyState = {
        currentRoom: null,
        availableRooms: [],
        playerId: '',
        username: '',
        isOwner: false,
		isReady: false
    };

	private selectedOpponentId: string = '';
	private selectedOpponentName: string = '';
	private duels: any[] = [];
	private hasPendingOwnRequest: boolean = false;
	private isLoadingDuels: boolean = false;
	private lastNonEmptyDuels: any[] = [];
	private hasLoadedDuelsOnce: boolean = false;

    async init() {
        this.state.playerId = this.getCurrentUserId();
        this.state.username = this.getCurrentUsername();

        this.initializeOpponentFromUrl();
        
        this.setupEventListeners();
        this.startPolling();
        const restored = await this.checkExistingRoom();
        if (!restored) {
            await this.loadAvailableRooms();
        }
		await this.loadDuels();
		this.startDuelPolling();
    }

    private initializeOpponentFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const opponentName = params.get('opponent');
    const opponentId = params.get('opponentId');
    if (opponentName && opponentId) {
        const duelInput = document.getElementById('duel-search') as HTMLInputElement;
        if (duelInput) {
            duelInput.value = opponentName;
        }
            this.selectedOpponentName = opponentName;
            this.selectedOpponentId = opponentId;
            this.updateDuelSelectionUI();
        
        }
    }


    private setupEventListeners() {
		const duelSearch = document.getElementById('duel-search') as HTMLInputElement | null;
		const sendDuelBtn = document.getElementById('send-duel-btn') as HTMLButtonElement | null;
		const playLocalBtn = document.getElementById('play-local-btn') as HTMLButtonElement | null;
		duelSearch?.addEventListener('input', () => {
			this.onDuelSearchInput(duelSearch.value);
		});
		sendDuelBtn?.addEventListener('click', () => {
			this.sendDuel();
		});
		playLocalBtn?.addEventListener('click', () => {
			navigateTo('/pong?mode=local');
		});

        const playAiBtn = document.getElementById('play-ai-btn') as HTMLButtonElement | null;
		playAiBtn?.addEventListener('click', () => {
			const aiDifficulty = (document.getElementById('ai-difficulty') as HTMLSelectElement)?.value || 'medium';
			navigateTo(`/pong?mode=ai&difficulty=${aiDifficulty}`);
		});

        document.getElementById('join-room-btn')?.addEventListener('click', () => {
            this.joinRoom();
        });

        document.getElementById('leave-room-btn')?.addEventListener('click', () => {
            this.leaveRoom();
        });

        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('refresh-rooms-btn')?.addEventListener('click', () => {
            this.loadAvailableRooms();
        });
    }

	private async onDuelSearchInput(q: string) {
		const resultsContainer = document.getElementById('duel-results');
		if (!resultsContainer) return;
		const trimmed = q.trim();
		if (trimmed.length < 2) {
			resultsContainer.classList.add('hidden');
			resultsContainer.innerHTML = '';
			return;
		}
		try {
			let res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`, {
				credentials: 'include'
			});
			if (!res.ok) {
				const fallback = await fetch(`/users/search?q=${encodeURIComponent(trimmed)}`, { credentials: 'include' });
				if (!fallback.ok) {
					let msg = 'Erreur de recherche';
					try {
						const err = await fallback.json();
						if (err && (err.error || err.message)) msg = err.error || err.message;
					} catch {}
					throw new Error(msg);
				}
				res = fallback;
			}
			const data = await res.json();
			const users = (data.users || []).filter((u: any) => u.id.toString() !== this.state.playerId);
			if (users.length === 0) {
				resultsContainer.innerHTML = `<div class="px-3 py-2 text-sm text-gray-300">Aucun résultat</div>`;
				resultsContainer.classList.remove('hidden');
				return;
			}
			resultsContainer.innerHTML = users.map((u: any) => {
				return `
					<button class="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors" data-user-id="${u.id}" data-user-name="${u.display_name}">
						<span class="text-white">${u.display_name}</span>
					</button>
				`;
			}).join('');
			resultsContainer.classList.remove('hidden');
			Array.from(resultsContainer.querySelectorAll('[data-user-id]')).forEach(el => {
				el.addEventListener('click', () => {
					const id = (el as HTMLElement).getAttribute('data-user-id') || '';
					const name = (el as HTMLElement).getAttribute('data-user-name') || '';
					this.selectedOpponentId = id;
					this.selectedOpponentName = name;
					resultsContainer.classList.add('hidden');
					resultsContainer.innerHTML = '';
					this.updateDuelSelectionUI();
				});
			});
		} catch (e: any) {
			const msg = e instanceof Error && e.message ? e.message : 'Erreur de recherche';
			resultsContainer.innerHTML = `<div class="px-3 py-2 text-sm text-gray-300">${msg}</div>`;
			resultsContainer.classList.remove('hidden');
		}
	}

	private updateDuelSelectionUI() {
		const selectedDiv = document.getElementById('duel-selected');
		const sendBtn = document.getElementById('send-duel-btn') as HTMLButtonElement | null;
		if (selectedDiv) {
			selectedDiv.textContent = this.selectedOpponentId ? `Adversaire sélectionné : ${this.selectedOpponentName}` : '';
		}
		if (sendBtn) {
			sendBtn.disabled = !this.selectedOpponentId || this.hasPendingOwnRequest;
			sendBtn.textContent = this.hasPendingOwnRequest ? 'Demande en attente' : 'Envoyer la demande';
			if (this.hasPendingOwnRequest) {
				sendBtn.classList.add('opacity-50','cursor-not-allowed');
			} else {
				sendBtn.classList.remove('opacity-50','cursor-not-allowed');
			}
		}
	}

	private async sendDuel() {
		if (!this.selectedOpponentId || this.hasPendingOwnRequest) return;
		try {
			const res = await fetch('/api/send-duel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					requesterId: this.state.playerId,
					challengedId: this.selectedOpponentId
				})
			});
			const data = await res.json();
			if (!res.ok || data.error) {
				this.showMessage(data.message || 'Échec de l’envoi de la demande', 'error');
				return;
			}
			this.showMessage('Demande envoyée', 'success');
			this.selectedOpponentId = '';
			this.selectedOpponentName = '';
			this.updateDuelSelectionUI();
			await this.loadDuels();
		} catch {
			this.showMessage('Échec de l’envoi de la demande', 'error');
		}
	}

	private async loadDuels() {
		if (this.isLoadingDuels) return;
		this.isLoadingDuels = true;
        const hadPendingOwnRequest = this.hasPendingOwnRequest;
		try {
			const res = await fetch(`/api/duels/${this.state.playerId}`, {
				credentials: 'include'
			});
			if (!res.ok) throw new Error();
			const data = await res.json();
			const nextDuels = data.duels || [];
			this.duels = nextDuels;
            this.lastNonEmptyDuels = nextDuels;
			
			this.hasLoadedDuelsOnce = true;
			this.hasPendingOwnRequest = this.duels.some((d: any) => d.requester_id?.toString() === this.state.playerId && d.status === 'pending');
		} catch {
            
		} finally {
			this.updateDuelSelectionUI();
			this.updateDuelsList();
            // Si une demande a été acceptée (ou supprimée), vérifier immédiatement si une salle a été créée
            if (hadPendingOwnRequest && !this.hasPendingOwnRequest) {
                this.loadPlayerRoom();
            }
			this.isLoadingDuels = false;
		}
	}

	private updateDuelsList() {
		const list = document.getElementById('duels-list');
		if (!list) return;
		const duelsToRender = this.duels.length ? this.duels : (this.hasLoadedDuelsOnce && this.lastNonEmptyDuels.length ? this.lastNonEmptyDuels : []);
		if (!duelsToRender.length) {
			list.innerHTML = `
                <div class="w-full flex justify-center items-center text-gray-400 py-4">
                    ${this.isLoadingDuels ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>' : '<span>Aucune demande</span>'}
                </div>`;
			return;
		}
		list.innerHTML = duelsToRender.map((d: any) => {
			const meRequester = d.requester_id?.toString() === this.state.playerId;
			const meChallenged = d.challenged_id?.toString() === this.state.playerId;
			const label = `${d.requester_username} vs ${d.challenged_username}`;
			const status = d.status;
			let actions = '';
			if (status === 'pending' && meRequester) {
				actions = `
					span:En attente
					<button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded ml-2" data-cancel="${d.id}">Annuler</button>
				`;
			} else if (status === 'pending' && meChallenged) {
				actions = `
					<button class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded" data-accept="${d.id}">Accepter</button>
					<button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded ml-2" data-refuse="${d.id}">Refuser</button>
				`;
			} else if (status === 'accepted') {
				actions = `span:Accepté`;
			} else {
				actions = `span:${status || ''}`;
			}
			const actionsHtml = actions.split('span:').join('<span class="px-2 py-1 rounded text-xs bg-gray-600 text-gray-200">') + (actions.includes('span:') ? '</span>' : '');
			return `
				<div class="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
					<div class="text-white">${label}</div>
					<div class="flex items-center gap-2">${actionsHtml}</div>
				</div>
			`;
		}).join('');
		Array.from(list.querySelectorAll('[data-cancel]')).forEach(el => {
			el.addEventListener('click', () => {
				const id = (el as HTMLElement).getAttribute('data-cancel');
				if (id) this.cancelDuel(parseInt(id, 10));
			});
		});
		Array.from(list.querySelectorAll('[data-accept]')).forEach(el => {
			el.addEventListener('click', () => {
				const id = (el as HTMLElement).getAttribute('data-accept');
				if (id) this.acceptDuel(parseInt(id, 10));
			});
		});
		Array.from(list.querySelectorAll('[data-refuse]')).forEach(el => {
			el.addEventListener('click', () => {
				const id = (el as HTMLElement).getAttribute('data-refuse');
				if (id) this.cancelDuel(parseInt(id, 10));
			});
		});
	}

	private startDuelPolling() {
		setInterval(() => {
			this.loadDuels();
		}, 2000);
	}

	private async acceptDuel(duelId: number) {
		try {
			const res = await fetch('/api/accept-duel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ duelRequestId: duelId })
			});
			const data = await res.json();
			if (!res.ok || data.error) {
				this.showMessage(data.message || 'Échec de l’acceptation', 'error');
				return;
			}
			this.showMessage('Duel accepté', 'success');
			if (data.room) {
				this.state.currentRoom = data.room;
				this.state.isOwner = data.room.ownerId === this.state.playerId;
				this.state.isReady = true;
				this.updateUI();
			}
			await this.loadDuels();
		} catch {
			this.showMessage('Échec de l’acceptation', 'error');
		}
	}

	private async cancelDuel(duelId: number) {
		try {
			const res = await fetch('/api/cancel-duel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ duelRequestId: duelId })
			});
			const data = await res.json();
			if (!res.ok || data.error) {
				this.showMessage(data.message || 'Échec de l’annulation', 'error');
				return;
			}
            this.duels = this.duels.filter((d: any) => d.id !== duelId);
			this.showMessage('Demande annulée', 'info');
			await this.loadDuels();
		} catch {
			this.showMessage('Échec de l’annulation', 'error');
		}
	}

    private async checkExistingRoom(): Promise<boolean> {
        try {
            const response = await fetch('/api/rooms?gameType=pong');
            if (!response.ok) throw new Error('Failed to load rooms');
            const data = await response.json();
            const rooms: any[] = data.rooms || [];
            const current = rooms.find(room => {
                const topId = room.players?.top?.id;
                const bottomId = room.players?.bottom?.id;
                return topId === this.state.playerId || bottomId === this.state.playerId;
            });
            if (current) {
                this.state.currentRoom = current;
                this.state.isOwner = current.ownerId === this.state.playerId;
                // infer current player's ready state
                const player =
                    current.players?.top?.id === this.state.playerId
                        ? current.players.top
                        : current.players?.bottom?.id === this.state.playerId
                            ? current.players.bottom
                            : undefined;
                this.state.isReady = !!player?.ready;
                this.updateUI();
                return true;
            }
        } catch (error) {

        }
        return false;
    }

    private startPolling() {
        setInterval(() => {
            if (this.state.currentRoom) {
                this.loadCurrentRoom();
            } else {
				this.loadPlayerRoom();
				this.loadAvailableRooms();
            }
        }, 1000);
    }

    private async joinRoom() {
        const roomIdInput = document.getElementById('room-id') as HTMLInputElement;
        const roomId = roomIdInput.value.trim();
        
        if (!roomId) {
            return;
        }

        try {
            const response = await fetch(`/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.state.playerId,
                    username: this.state.username
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Échec de la connexion à la salle');
            }

            const room = await response.json();
            this.state.currentRoom = room;
            this.state.isOwner = false;
            this.updateUI();
            this.showMessage('Rejoint la salle avec succès!', 'success');
            roomIdInput.value = '';
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Échec de la connexion à la salle', 'error');
        }
    }

    private async leaveRoom() {
        if (!this.state.currentRoom) return;

        try {
            await fetch(`/api/rooms/${this.state.currentRoom.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.state.playerId
                })
            });

            this.state.currentRoom = null;
            this.state.isOwner = false;
            this.state.isReady = false;
            this.updateUI();
            this.showMessage('Salle annulée', 'info');
        } catch (error) {
            this.showMessage('Échec de l’annulation de la salle', 'error');
        }
    }

    private async startGame() {
        if (!this.state.currentRoom || !this.state.isOwner) return;

        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: this.state.playerId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Échec du démarrage du jeu');
            }

            const result = await response.json();
            this.showMessage('Demarrage du jeu...', 'success');
            
            this.state.currentRoom.status = 'in_progress';
            this.state.currentRoom.gameId = result.gameId;
            
            setTimeout(() => {
                const side = this.state.currentRoom?.players.top?.id === this.state.playerId ? 'top' : 'bottom';
                navigateTo(`/pong?mode=online&gameId=${result.gameId}&side=${side}`);
            }, 500);
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Échec du démarrage du jeu', 'error');
        }
    }

    private async loadAvailableRooms() {
        try {
            const response = await fetch('/api/rooms?gameType=pong');
            if (!response.ok) throw new Error('Échec du chargement des salles');
            
            const data = await response.json();
            this.state.availableRooms = data.rooms;
            this.updateRoomsList();
        } catch (error) {
            console.error('Échec du chargement des salles:', error);
        }
    }

    private async loadCurrentRoom() {
        if (!this.state.currentRoom || !this.state.currentRoom.id) return;

        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}`);
            if (!response.ok) {
                if ((response as any).status === 404) {
                    this.state.currentRoom = null;
                    this.state.isOwner = false;
                    this.state.isReady = false;
                    this.updateUI();
                    this.showMessage('Salle annulée', 'info');
                    return;
                }
                throw new Error('Échec du chargement des détails de la salle');
            }
            
            const room = await response.json();
            this.state.currentRoom = room;
            
            // Check if game has started
			if (room.status === 'in_progress' && room.gameId) {
				try {
					const gRes = await fetch(`/api/games/${room.gameId}`);
					if (gRes.ok) {
						const gameState = await gRes.json();
						if (!gameState.gameOver) {
							this.showMessage('Démarrage du jeu...', 'success');
							setTimeout(() => {
								const side = room.players.top?.id === this.state.playerId ? 'top' : 'bottom';
								navigateTo(`/pong?mode=online&gameId=${room.gameId}&side=${side}`);
							}, 1000);
							return;
						}
					}
				} catch {}
			}
            
            this.updateUI();
        } catch (error) {
            console.error('Échec du chargement des détails de la salle:', error);
        }
    }
	
	private async loadPlayerRoom() {
		try {
			const response = await fetch(`/api/players/${this.state.playerId}/room`);
			if (!response.ok) return;
			const data = await response.json();
            if (data && (data as any).error) {
                return;
            }
			const room = data;
			this.state.currentRoom = room;
			this.state.isOwner = room.ownerId === this.state.playerId;
			this.state.isReady = !!(
				(room.players.top && room.players.top.id === this.state.playerId && room.players.top.ready) ||
				(room.players.bottom && room.players.bottom.id === this.state.playerId && room.players.bottom.ready)
			);
			this.updateUI();
		} catch {}
	}

    private updateUI() {
        const currentRoomDiv = document.getElementById('current-room');
        const roomCreationDiv = document.getElementById('room-creation');
        const roomJoiningDiv = document.getElementById('room-joining');
        const availableRoomsDiv = document.getElementById('available-rooms');

        if (this.state.currentRoom) {
            // Show current room, hide creation/joining
            currentRoomDiv?.classList.remove('hidden');
            roomCreationDiv?.classList.add('hidden');
            roomJoiningDiv?.classList.add('hidden');
            availableRoomsDiv?.classList.add('hidden');

            this.updateCurrentRoomDisplay();
        } else {
            // Show creation/joining, hide current room
            currentRoomDiv?.classList.add('hidden');
            roomCreationDiv?.classList.remove('hidden');
            roomJoiningDiv?.classList.remove('hidden');
            availableRoomsDiv?.classList.remove('hidden');
        }
    }

    private updateCurrentRoomDisplay() {
        if (!this.state.currentRoom) return;

        // Update room name
        const roomNameSpan = document.getElementById('current-room-name');
        if (roomNameSpan) roomNameSpan.textContent = this.state.currentRoom.name;

        // Update players
        this.updatePlayerDisplay('top', this.state.currentRoom.players.top);
        this.updatePlayerDisplay('bottom', this.state.currentRoom.players.bottom);

        // Update buttons
        const startGameBtn = document.getElementById('start-game-btn');

        if (startGameBtn) {
			if (this.state.isOwner) {
                startGameBtn.classList.remove('hidden');
            } else {
                startGameBtn.classList.add('hidden');
            }
        }
    }

    private updatePlayerDisplay(side: 'top' | 'bottom', player: { id: string; username: string; ready: boolean } | undefined) {
        const playerDiv = document.getElementById(`${side}-player`);
        if (!playerDiv) return;

        if (player) {
            const isCurrentPlayer = player.id === this.state.playerId;
            playerDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="${isCurrentPlayer ? 'text-blue-400 font-semibold' : 'text-white'}">${player.username}${isCurrentPlayer ? ' (Vous)' : ''}</span>
                    <span class="px-2 py-1 rounded text-xs ${player.ready ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}">
                        ${player.ready ? 'Prêt' : 'Pas prêt'}
                    </span>
                </div>
            `;
        } else {
            playerDiv.innerHTML = '<span class="text-sm text-gray-400">En attente d’un joueur...</span>';
        }
    }

    private updateRoomsList() {
        const roomsListDiv = document.getElementById('rooms-list');
        if (!roomsListDiv) return;

        const pongRooms = this.state.availableRooms.filter(room => (room as any).gameType === 'pong' || !(room as any).gameType);

        if (pongRooms.length === 0) {
            roomsListDiv.innerHTML = '<div class="text-center text-gray-400 py-4">Aucune salle disponible</div>';
            return;
        }

        roomsListDiv.innerHTML = pongRooms.map(room => {
            const playerCount = Object.keys(room.players).length;
            
            return `
                <div class="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer" data-room-id="${room.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-white">${room.name}</h3>
                            <p class="text-sm text-gray-400">Créé par: ${room.ownerUsername}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-400">${playerCount}/2 joueurs</p>
                            <p class="text-xs text-gray-500">${new Date(room.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for room joining
        roomsListDiv.querySelectorAll('[data-room-id]').forEach(element => {
            element.addEventListener('click', () => {
                const roomId = element.getAttribute('data-room-id');
                if (roomId) {
                    (document.getElementById('room-id') as HTMLInputElement).value = roomId;
                    this.joinRoom();
                }
            });
        });
    }


    private showMessage(message: string, type: 'success' | 'error' | 'info') {
        const container = document.getElementById('message-container');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 rounded-lg font-semibold ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        messageDiv.textContent = message;

        container.innerHTML = '';
        container.appendChild(messageDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    private getCurrentUserId(): string {
        return AuthStore.getUser()?.id.toString() || '';
    }

    private getCurrentUsername(): string {
        return AuthStore.getUser()?.display_name || '';
    }
}
