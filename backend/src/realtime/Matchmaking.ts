import { roomManager } from './RoomManager';
import { gameManager } from './GameManager';

type Seat = 'player1' | 'player2';

export const matchmakingThreshold = 100
export const winBonus = 15
export const loseBonus = -17

type QueueEntry = {
  playerId: string;
  username: string;
  enqueuedAt: number;
  elo: number;
};

type MatchStatus =
  | { status: 'searching' }
  | { status: 'matched'; gameId: string; seat: Seat };

class MatchmakingManager {
  private queueGame2: QueueEntry[] = [];
  private playerStatus: Map<string, MatchStatus> = new Map();

  private ensureNotInRoom(playerId: string) {
    try {
      const room = roomManager.getPlayerRoom(playerId);
      if (room) {
        console.log('[MM] ensureNotInRoom: leaving previous room', { playerId, roomId: room.id, status: room.status });
        roomManager.leaveRoom(playerId);
      }
    } catch {}
  }

  joinGame2(playerId: string, username: string, elo: number): MatchStatus {
    this.cleanup();
    console.log('[MM] joinGame2 called', { playerId, username, elo, queueLen: this.queueGame2.length });
    this.ensureNotInRoom(playerId);
    const existing = this.playerStatus.get(playerId);
    if (existing && existing.status === 'matched') {
      const state: any = gameManager.getState((existing as any).gameId);
      if (state && state.gameOver === false) {
        console.log('[MM] player has active match, returning existing', { playerId, gameId: (existing as any).gameId });
        return existing;
      }
      this.playerStatus.delete(playerId);
      console.log('[MM] purged obsolete match status', { playerId });
    }

    this.queueGame2 = this.queueGame2.filter(q => q.playerId !== playerId);

    const opponent = this.queueGame2.find(q => q.playerId !== playerId && Math.abs(q.elo - elo) <= matchmakingThreshold);
    if (opponent) {
      this.queueGame2 = this.queueGame2.filter(q => q.playerId !== opponent.playerId);
      console.log('[MM] matching players', { player1: opponent.playerId, player2: playerId, elo1: opponent.elo, elo2: elo });

      this.ensureNotInRoom(opponent.playerId);

      const room = roomManager.createRoom(opponent.playerId, opponent.username, `MM-${Date.now()}`, 'game2');
      roomManager.joinRoom(room.id, playerId, username);

      roomManager.setPlayerReady(opponent.playerId, true);
      roomManager.setPlayerReady(playerId, true);
      const start = roomManager.startGame(room.id, opponent.playerId);
      console.log('[MM] startGame result', { roomId: room.id, gameId: start.gameId, success: start.success, error: start.error });

      if (!start.success || !start.gameId) {
        const now = Date.now();
        this.queueGame2.push({ playerId: opponent.playerId, username: opponent.username, enqueuedAt: now, elo: opponent.elo });
        this.queueGame2.push({ playerId, username, enqueuedAt: now, elo });
        this.playerStatus.set(opponent.playerId, { status: 'searching' });
        this.playerStatus.set(playerId, { status: 'searching' });
        console.log('[MM] requeued both after start failure', { player1: opponent.playerId, player2: playerId });
        return { status: 'searching' };
      }

      const gameId = start.gameId;
      this.playerStatus.set(opponent.playerId, { status: 'matched', gameId, seat: 'player1' });
      this.playerStatus.set(playerId, { status: 'matched', gameId, seat: 'player2' });
      console.log('[MM] matched', { player1: opponent.playerId, player2: playerId, gameId });
      return { status: 'matched', gameId, seat: 'player2' };
    }

    const status: MatchStatus = { status: 'searching' };
    const now = Date.now();
    this.queueGame2.push({ playerId, username, enqueuedAt: now, elo });
    this.playerStatus.set(playerId, status);
    console.log('[MM] enqueued', { playerId, queueLen: this.queueGame2.length });
    const partner = this.queueGame2.find(q => q.playerId !== playerId && Math.abs(q.elo - elo) <= matchmakingThreshold);
    if (partner) {
      this.queueGame2 = this.queueGame2.filter(q => q.playerId !== partner.playerId && q.playerId !== playerId);
      const ownerEntry = partner.enqueuedAt <= now ? partner : { playerId, username, enqueuedAt: now, elo };
      const joinerEntry = ownerEntry.playerId === partner.playerId ? { playerId, username, enqueuedAt: now, elo } : partner;
      console.log('[MM] late match after enqueue', { owner: ownerEntry.playerId, joiner: joinerEntry.playerId, elo1: ownerEntry.elo, elo2: joinerEntry.elo });

      const room = roomManager.createRoom(ownerEntry.playerId, ownerEntry.username, `MM-${Date.now()}`, 'game2');
      roomManager.joinRoom(room.id, joinerEntry.playerId, joinerEntry.username);
      roomManager.setPlayerReady(ownerEntry.playerId, true);
      roomManager.setPlayerReady(joinerEntry.playerId, true);
      const start = roomManager.startGame(room.id, ownerEntry.playerId);
      console.log('[MM] startGame result (late)', { roomId: room.id, gameId: start.gameId, success: start.success, error: start.error });

      if (!start.success || !start.gameId) {
        const t = Date.now();
        this.queueGame2.push({ playerId: ownerEntry.playerId, username: ownerEntry.username, enqueuedAt: t, elo: ownerEntry.elo });
        this.queueGame2.push({ playerId: joinerEntry.playerId, username: joinerEntry.username, enqueuedAt: t, elo: joinerEntry.elo });
        this.playerStatus.set(ownerEntry.playerId, { status: 'searching' });
        this.playerStatus.set(joinerEntry.playerId, { status: 'searching' });
        return { status: 'searching' };
      }

      const gameId = start.gameId;
      this.playerStatus.set(ownerEntry.playerId, { status: 'matched', gameId, seat: 'player1' });
      this.playerStatus.set(joinerEntry.playerId, { status: 'matched', gameId, seat: 'player2' });
      const mySeat: Seat = (playerId === ownerEntry.playerId) ? 'player1' : 'player2';
      return { status: 'matched', gameId, seat: mySeat };
    }

    return status;
  }

  cancel(playerId: string): { success: boolean } {
    this.queueGame2 = this.queueGame2.filter(q => q.playerId !== playerId);
    this.playerStatus.delete(playerId);
    console.log('[MM] cancel', { playerId, queueLen: this.queueGame2.length });
    return { success: true };
  }

  status(playerId: string): MatchStatus {
    this.cleanup();
    const st = this.playerStatus.get(playerId);
    if (st && st.status === 'matched') {
      const state: any = gameManager.getState((st as any).gameId);
      if (!state || state.gameOver === true) {
        this.playerStatus.delete(playerId);
        console.log('[MM] status: obsolete match purged', { playerId });
        return { status: 'searching' };
      }
    }
    const ret = st ?? { status: 'searching' } as MatchStatus;
    return ret;
  }

  cleanup(): void {
    const now = Date.now();
    this.queueGame2 = this.queueGame2.filter(q => now - q.enqueuedAt < 5 * 60 * 1000);
  }
}

export const matchmakingManager = new MatchmakingManager();


