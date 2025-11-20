import type { GameRoom, LobbyState } from '../types/lobby';
import { AuthStore } from '../stores/auth.store';

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

    private ws: WebSocket | null = null;
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
                window.location.href = `/game2?mode=online&gameId=${data.gameId}&player=${data.seat}`;
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
                    window.location.href = `/game2?mode=online&gameId=${data.gameId}&player=${data.seat}`;
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

    private handleWebSocketMessage(message: any) {
        switch (message.type) {
            case 'room_created':
                this.state.currentRoom = message.room;
                this.state.isOwner = true;
                this.updateUI();
                this.showMessage('Room created successfully!', 'success');
                break;
                
            case 'room_joined':
                this.state.currentRoom = message.room;
                this.state.isOwner = false;
                this.updateUI();
                this.showMessage('Joined room successfully!', 'success');
                break;
                
            case 'room_left':
                this.state.currentRoom = null;
                this.state.isOwner = false;
                this.state.isReady = false;
                this.updateUI();
                this.showMessage('Left room', 'info');
                break;
                
            case 'player_joined':
                if (this.state.currentRoom) {
                    this.state.currentRoom.players = message.room.players;
                    this.updateUI();
                }
                break;
                
            case 'player_left':
                if (this.state.currentRoom) {
                    this.state.currentRoom.players = message.room.players;
                    this.updateUI();
                }
                break;
                
            case 'player_ready':
                if (this.state.currentRoom) {
                    this.state.currentRoom.players = message.room.players;
                    this.updateUI();
                }
                break;
                
            case 'game_started':
                this.showMessage('Game starting...', 'success');
                setTimeout(() => {
                    let seat = '';
                    if (this.state.currentRoom) {
                        const p1 = this.state.currentRoom.players.player1;
                        const p2 = this.state.currentRoom.players.player2;
                        if (p1 && p1.id === this.state.playerId) seat = 'player1';
                        else if (p2 && p2.id === this.state.playerId) seat = 'player2';
                    }
                    window.location.href = `/game2?mode=online&gameId=${message.gameId}${seat ? `&player=${seat}` : ''}`;
                }, 1000);
                break;
                
            case 'room_list':
                break;
                
            case 'room_error':
                this.showMessage(message.message, 'error');
                break;
        }
    }

    private async joinRoom() {
        const roomIdInput = document.getElementById('room-id') as HTMLInputElement;
        const roomId = roomIdInput.value.trim();
        
        if (!roomId) {
            this.showMessage('Please enter a room ID', 'error');
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
                throw new Error(error.error || 'Failed to join room');
            }

            const room = await response.json();
            this.state.currentRoom = room;
            this.state.isOwner = false;
            this.updateUI();
            this.showMessage('Joined room successfully!', 'success');
            roomIdInput.value = '';
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to join room', 'error');
        }
    }

    private async leaveRoom() {
        if (!this.state.currentRoom) return;

        try {
            await fetch(`/api/rooms/${this.state.currentRoom.id}/leave`, {
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
            this.showMessage('Left room', 'info');
        } catch (error) {
            this.showMessage('Failed to leave room', 'error');
        }
    }

    private async toggleReady() {
        if (!this.state.currentRoom) return;

        const newReadyState = !this.state.isReady;
        
        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.state.playerId,
                    ready: newReadyState
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update ready status');
            }

            this.state.isReady = newReadyState;
            this.updateUI();
            this.showMessage(newReadyState ? 'You are ready!' : 'You are not ready', 'info');
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to update ready status', 'error');
        }
    }

    private async startGame() {
        if (!this.state.currentRoom) return;

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
                throw new Error(error.error || 'Failed to start game');
            }

            const result = await response.json();
            this.showMessage('Game starting...', 'success');
            setTimeout(() => {
                window.location.href = `/game2?mode=online&gameId=${result.gameId}&player=player1`;
            }, 1000);
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to start game', 'error');
        }
    }

    private async kickPlayer() {
        if (!this.state.currentRoom) return;

        const otherPlayer = Object.values(this.state.currentRoom.players).find(p => p.id !== this.state.playerId);
        if (!otherPlayer) return;

        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}/kick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: this.state.playerId,
                    targetPlayerId: otherPlayer.id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to kick player');
            }

            this.showMessage('Player kicked', 'info');
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to kick player', 'error');
        }
    }

    private async loadAvailableRooms() {
        try {
            const response = await fetch('/api/rooms?gameType=game2');
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const data = await response.json();
            this.state.availableRooms = data.rooms || [];
            this.updateRoomsList();
        } catch (error) {
            console.error('Failed to load available rooms:', error);
        }
    }

    private async loadCurrentRoom() {
        if (!this.state.currentRoom) return;

        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}`);
            if (!response.ok) throw new Error('Failed to load room details');
            
            const room = await response.json();
            this.state.currentRoom = room;
            
            if (room.status === 'in_progress' && room.gameId) {
                this.showMessage('Game starting...', 'success');
                const p1 = room.players.player1;
                const p2 = room.players.player2;
                let seat = '';
                if (p1 && p1.id === this.state.playerId) seat = 'player1';
                else if (p2 && p2.id === this.state.playerId) seat = 'player2';
                setTimeout(() => {
                    window.location.href = `/game2?mode=online&gameId=${room.gameId}${seat ? `&player=${seat}` : ''}`;
                }, 1000);
                return;
            }
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to load room details:', error);
        }
    }

    private updateUI() {
        const currentRoomDiv = document.getElementById('current-room');
        const roomCreationDiv = document.getElementById('room-creation');
        const roomJoiningDiv = document.getElementById('room-joining');
        
        if (this.state.currentRoom) {
            currentRoomDiv?.classList.remove('hidden');
            roomCreationDiv?.classList.add('hidden');
            roomJoiningDiv?.classList.add('hidden');
            
            const roomNameSpan = document.getElementById('current-room-name');
            if (roomNameSpan) roomNameSpan.textContent = this.state.currentRoom.name;
            
            this.updatePlayerDisplay('player1', this.state.currentRoom.players.player1);
            this.updatePlayerDisplay('player2', this.state.currentRoom.players.player2);
            
            this.updateRoomButtons();
        } else {
            currentRoomDiv?.classList.add('hidden');
            roomCreationDiv?.classList.remove('hidden');
            roomJoiningDiv?.classList.remove('hidden');
        }
    }

    private updatePlayerDisplay(playerId: string, player: { id: string; username: string; ready: boolean } | undefined) {
        const playerDiv = document.getElementById(playerId);
        if (!playerDiv) return;

        if (player) {
            playerDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-white">${player.username}</span>
                    <span class="text-sm ${player.ready ? 'text-green-400' : 'text-yellow-400'}">
                        ${player.ready ? 'Ready' : 'Not Ready'}
                    </span>
                </div>
            `;
        } else {
            playerDiv.innerHTML = '<span class="text-sm text-gray-400">Waiting for player...</span>';
        }
    }

    private updateRoomButtons() {
        if (!this.state.currentRoom) return;

        const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
        const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
        const kickPlayerBtn = document.getElementById('kick-player-btn') as HTMLButtonElement;

        const isOwner = this.state.currentRoom.ownerId === this.state.playerId;
        const playerCount = Object.keys(this.state.currentRoom.players).length;
        const allPlayersReady = Object.values(this.state.currentRoom.players).every(p => p.ready);

        if (readyBtn) {
            readyBtn.textContent = this.state.isReady ? 'Not Ready' : 'Ready';
        }

        if (isOwner && playerCount === 2 && allPlayersReady) {
            startGameBtn.classList.remove('hidden');
        } else {
            startGameBtn.classList.add('hidden');
        }

        if (isOwner && playerCount > 1) {
            kickPlayerBtn.classList.remove('hidden');
        } else {
            kickPlayerBtn.classList.add('hidden');
        }
    }

    private updateRoomsList() {
        const roomsListDiv = document.getElementById('rooms-list');
        if (!roomsListDiv) return;

        const game2Rooms = this.state.availableRooms.filter(room => room.gameType === 'game2');

        if (game2Rooms.length === 0) {
            roomsListDiv.innerHTML = '<div class="text-center text-gray-400 py-4">No available rooms</div>';
            return;
        }

        roomsListDiv.innerHTML = game2Rooms.map(room => {
            const playerCount = Object.keys(room.players).length;
            const isOwner = room.ownerId === this.state.playerId;
            
            return `
                <div class="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer" data-room-id="${room.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-white">${room.name}</h3>
                            <p class="text-sm text-gray-400">Owner: ${room.ownerUsername}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-400">${playerCount}/2 players</p>
                            <p class="text-xs text-gray-500">${new Date(room.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

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