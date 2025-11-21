export type GameRoom = {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  players: {
    top?: { id: string; username: string; ready: boolean };
    bottom?: { id: string; username: string; ready: boolean };
  };
  gameId?: string;
  createdAt: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
};

export type RoomPlayer = {
  id: string;
  username: string;
  ready: boolean;
  side?: 'top' | 'bottom';
};

export type LobbyState = {
  currentRoom: GameRoom | null;
  availableRooms: GameRoom[];
  playerId: string;
  username: string;
  isOwner: boolean;
  isReady: boolean;
};

export type RoomMessage =
  | { type: 'room_created'; room: GameRoom }
  | { type: 'room_joined'; room: GameRoom; player: RoomPlayer }
  | { type: 'room_left'; room: GameRoom; playerId: string }
  | { type: 'player_ready'; room: GameRoom; playerId: string; ready: boolean }
  | { type: 'player_kicked'; room: GameRoom; playerId: string }
  | { type: 'game_started'; room: GameRoom; gameId: string }
  | { type: 'room_list'; rooms: GameRoom[] }
  | { type: 'room_error'; message: string };
