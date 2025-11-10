import type { GameRoom, LobbyState } from '../types/lobby';
import { AuthStore } from '../stores/auth.store';

export function renderPongLobby() {
    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-6 text-center">Pong Lobby</h1>
                    
                    <!-- Local Section -->
                    <div id="local-section" class="mb-8">
                        <div class="bg-gray-800 p-2 pl-4 rounded-xl flex items-center">
                            <h2 class="text-xl font-semibold">Local</h2>
                            <button 
                                id="play-local-btn" 
                                class="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                Play Locally
                            </button>
                        </div>
                    </div>
                    
                    <!-- Room Creation Section -->
                    <div id="room-creation" class="mb-8">
                        <div class="bg-gray-800 p-2 rounded-xl">
                            <h2 class="text-xl font-semibold ml-2 mb-2">Create New Room</h2>
                            <div class="flex gap-4">
                                <input 
                                    type="text" 
                                    id="room-name" 
                                    placeholder="Enter room name..." 
                                    class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                    maxlength="50"
                                />
                                <button 
                                    id="create-room-btn" 
                                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Create Room
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Room Joining Section -->
                    <div id="room-joining" class="mb-8">
                        <div class="bg-gray-800 p-2 rounded-xl">
                            <h2 class="text-xl font-semibold ml-2 mb-2">Join Room by ID</h2>
                            <div class="flex gap-4">
                                <input 
                                    type="text" 
                                    id="room-id" 
                                    placeholder="Enter room ID..." 
                                    class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                                <button 
                                    id="join-room-btn" 
                                    class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Current Room Section -->
                    <div id="current-room" class="mb-8 hidden">
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold">Current Room: <span id="current-room-name"></span></h2>
                                <button 
                                    id="leave-room-btn" 
                                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Leave Room
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <!-- Top Player -->
                                <div class="bg-gray-700 p-4 rounded-lg">
                                    <h3 class="font-semibold mb-2">Top Player</h3>
                                    <div id="top-player" class="text-gray-400">
                                        <span class="text-sm">Waiting for player...</span>
                                    </div>
                                </div>
                                
                                <!-- Bottom Player -->
                                <div class="bg-gray-700 p-4 rounded-lg">
                                    <h3 class="font-semibold mb-2">Bottom Player</h3>
                                    <div id="bottom-player" class="text-gray-400">
                                        <span class="text-sm">Waiting for player...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex gap-4">
                                <button 
                                    id="ready-btn" 
                                    class="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Ready
                                </button>
                                <button 
                                    id="start-game-btn" 
                                    class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors hidden"
                                >
                                    Start Game
                                </button>
                                <button 
                                    id="kick-player-btn" 
                                    class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors hidden"
                                >
                                    Kick Player
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Available Rooms Section -->
                    <div id="available-rooms">
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-semibold">Available Rooms</h2>
                                <button 
                                    id="refresh-rooms-btn" 
                                    class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>
                            <div id="rooms-list" class="space-y-2">
                                <div class="text-center text-gray-400 py-4">
                                    <span>Loading rooms...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error/Success Messages -->
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

    private ws: WebSocket | null = null;

    async init() {
        // Get user info (you might need to implement this based on your auth system)
        this.state.playerId = this.getCurrentUserId();
        this.state.username = this.getCurrentUsername();
        
        this.setupEventListeners();
        this.connectWebSocket();
        await this.loadAvailableRooms();
    }

    private setupEventListeners() {
        // Create room
        document.getElementById('create-room-btn')?.addEventListener('click', () => {
            this.createRoom();
        });

        // Join room
        document.getElementById('join-room-btn')?.addEventListener('click', () => {
            this.joinRoom();
        });

        // Leave room
        document.getElementById('leave-room-btn')?.addEventListener('click', () => {
            this.leaveRoom();
        });

        // Ready toggle
        document.getElementById('ready-btn')?.addEventListener('click', () => {
            this.toggleReady();
        });

        // Start game
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.startGame();
        });

        // Kick player
        document.getElementById('kick-player-btn')?.addEventListener('click', () => {
            this.kickPlayer();
        });

        // Refresh rooms
        document.getElementById('refresh-rooms-btn')?.addEventListener('click', () => {
            this.loadAvailableRooms();
        });

        // Enter key handlers
        document.getElementById('room-name')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });

        document.getElementById('room-id')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
    }

    private connectWebSocket() {
        // For now, use polling instead of WebSocket
        console.log('Using HTTP polling instead of WebSocket');
        this.startPolling();
    }

    private startPolling() {
        // Poll for updates every 1 second for faster response
        setInterval(() => {
            if (this.state.currentRoom) {
                this.loadCurrentRoom();
            } else {
                this.loadAvailableRooms();
            }
        }, 1000);
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
                if (message.playerId === this.state.playerId) {
                    this.state.currentRoom = null;
                    this.state.isOwner = false;
                    this.state.isReady = false;
                } else {
                    this.state.currentRoom = message.room;
                }
                this.updateUI();
                break;
                
            case 'player_ready':
                this.state.currentRoom = message.room;
                this.updateUI();
                break;
                
            case 'player_kicked':
                if (message.playerId === this.state.playerId) {
                    this.state.currentRoom = null;
                    this.state.isOwner = false;
                    this.state.isReady = false;
                    this.showMessage('You were kicked from the room', 'error');
                } else {
                    this.state.currentRoom = message.room;
                }
                this.updateUI();
                break;
                
            case 'game_started':
                this.showMessage('Game starting...', 'success');
                setTimeout(() => {
                    // Determine player side based on room position
                    const side = this.state.currentRoom?.players.top?.id === this.state.playerId ? 'top' : 'bottom';
                    window.location.href = `/pong?mode=online&gameId=${message.gameId}&side=${side}`;
                }, 1000);
                break;
                
            case 'room_list':
                // Not used - we use HTTP polling instead
                break;
                
            case 'room_error':
                this.showMessage(message.message, 'error');
                break;
        }
    }

    private async createRoom() {
        const roomNameInput = document.getElementById('room-name') as HTMLInputElement;
        const roomName = roomNameInput.value.trim();
        
        if (!roomName) {
            this.showMessage('Please enter a room name', 'error');
            return;
        }

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: roomName,
                    ownerId: this.state.playerId,
                    ownerUsername: this.state.username,
                    gameType: 'pong'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const room = await response.json();
            this.state.currentRoom = room;
            this.state.isOwner = true;
            this.updateUI();
            this.showMessage('Room created successfully!', 'success');
            roomNameInput.value = '';
        } catch (error) {
            this.showMessage('Failed to create room', 'error');
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
                throw new Error('Failed to update ready status');
            }

            this.state.isReady = newReadyState;
            this.updateUI();
        } catch (error) {
            this.showMessage('Failed to update ready status', 'error');
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
                throw new Error(error.error || 'Failed to start game');
            }

            const result = await response.json();
            this.showMessage('Game starting...', 'success');
            
            // Update the room status immediately to trigger redirect via polling
            this.state.currentRoom.status = 'in_progress';
            this.state.currentRoom.gameId = result.gameId;
            
            // Redirect immediately for the owner, polling will handle the second player
            setTimeout(() => {
                const side = this.state.currentRoom?.players.top?.id === this.state.playerId ? 'top' : 'bottom';
                window.location.href = `/pong?mode=online&gameId=${result.gameId}&side=${side}`;
            }, 500);
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to start game', 'error');
        }
    }

    private async kickPlayer() {
        if (!this.state.currentRoom || !this.state.isOwner) return;

        // For now, kick the other player (you might want to add a selection UI)
        const otherPlayer = this.state.currentRoom.players.top?.id === this.state.playerId 
            ? this.state.currentRoom.players.bottom 
            : this.state.currentRoom.players.top;

        if (!otherPlayer) return;

        try {
            await fetch(`/api/rooms/${this.state.currentRoom.id}/kick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: this.state.playerId,
                    targetPlayerId: otherPlayer.id
                })
            });

            this.showMessage('Player kicked', 'info');
            this.loadCurrentRoom();
        } catch (error) {
            this.showMessage('Failed to kick player', 'error');
        }
    }

    private async loadAvailableRooms() {
        try {
            const response = await fetch('/api/rooms?gameType=pong');
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const data = await response.json();
            this.state.availableRooms = data.rooms;
            this.updateRoomsList();
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    }

    private async loadCurrentRoom() {
        if (!this.state.currentRoom) return;

        try {
            const response = await fetch(`/api/rooms/${this.state.currentRoom.id}`);
            if (!response.ok) throw new Error('Failed to load room details');
            
            const room = await response.json();
            this.state.currentRoom = room;
            
            // Check if game has started
            if (room.status === 'in_progress' && room.gameId) {
                this.showMessage('Game starting...', 'success');
                // Redirect both players to the game
                setTimeout(() => {
                    const side = room.players.top?.id === this.state.playerId ? 'top' : 'bottom';
                    window.location.href = `/pong?mode=online&gameId=${room.gameId}&side=${side}`;
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
        const readyBtn = document.getElementById('ready-btn');
        const startGameBtn = document.getElementById('start-game-btn');
        const kickPlayerBtn = document.getElementById('kick-player-btn');

        if (readyBtn) {
            readyBtn.textContent = this.state.isReady ? 'Not Ready' : 'Ready';
            readyBtn.className = this.state.isReady 
                ? 'px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors'
                : 'px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors';
        }

        if (startGameBtn) {
            const canStart = this.state.isOwner && 
                this.state.currentRoom.players.top && 
                this.state.currentRoom.players.bottom &&
                this.state.currentRoom.players.top.ready && 
                this.state.currentRoom.players.bottom.ready;
            
            if (canStart) {
                startGameBtn.classList.remove('hidden');
            } else {
                startGameBtn.classList.add('hidden');
            }
        }

        if (kickPlayerBtn) {
            const hasOtherPlayer = (this.state.currentRoom.players.top && this.state.currentRoom.players.top.id !== this.state.playerId) ||
                                 (this.state.currentRoom.players.bottom && this.state.currentRoom.players.bottom.id !== this.state.playerId);
            
            if (this.state.isOwner && hasOtherPlayer) {
                kickPlayerBtn.classList.remove('hidden');
            } else {
                kickPlayerBtn.classList.add('hidden');
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
                    <span class="${isCurrentPlayer ? 'text-blue-400 font-semibold' : 'text-white'}">${player.username}${isCurrentPlayer ? ' (You)' : ''}</span>
                    <span class="px-2 py-1 rounded text-xs ${player.ready ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}">
                        ${player.ready ? 'Ready' : 'Not Ready'}
                    </span>
                </div>
            `;
        } else {
            playerDiv.innerHTML = '<span class="text-sm text-gray-400">Waiting for player...</span>';
        }
    }

    private updateRoomsList() {
        const roomsListDiv = document.getElementById('rooms-list');
        if (!roomsListDiv) return;

        // Filter rooms to only show pong rooms as a safety measure
        const pongRooms = this.state.availableRooms.filter(room => room.gameType === 'pong' || !room.gameType);

        if (pongRooms.length === 0) {
            roomsListDiv.innerHTML = '<div class="text-center text-gray-400 py-4">No available rooms</div>';
            return;
        }

        roomsListDiv.innerHTML = pongRooms.map(room => {
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
