import { randomUUID } from 'crypto';
import type { GameKind, ServerGameState, TestEngineState } from './gameTypes';
import type { Game2State } from './Game2SimpleEngine';
import { PongEngine } from './PongEngine';
import { TestEngine } from './TestEngine';
import { Game2SimpleEngine } from './Game2SimpleEngine';

type Engine = PongEngine | TestEngine | Game2SimpleEngine;

export class GameManager {
  private games: Map<string, Engine> = new Map();

  createGame(kind: GameKind = 'pong', topPlayer?: { id: string; username?: string }, bottomPlayer?: { id: string; username?: string }): { id: string } {
    const id = randomUUID();
    let engine: Engine;
    
    switch (kind) {
      case 'pong':
        {
          const tp = topPlayer ?? { id: randomUUID() };
          const bp = bottomPlayer ?? { id: randomUUID() };
          engine = new PongEngine(id, tp, bp);
        }
        break;
      case 'test':
        engine = new TestEngine(id);
        break;
      case 'game2':
        engine = new Game2SimpleEngine(id);
        break;
      default:
        throw new Error(`Unsupported game kind: ${kind}`);
    }
    
    this.games.set(id, engine);
    return { id };
  }

  getState(id: string): ServerGameState | TestEngineState | Game2State | null {
    const g = this.games.get(id);
    return g ? g.getState() : null;
  }

  getEngine(id: string): Engine | null {
    return this.games.get(id) ?? null;
  }

  list(): Array<{ id: string; kind: GameKind; createdAt: number }> {
    return Array.from(this.games.values()).map(g => ({ id: g.getState().id, kind: g.getState().kind, createdAt: g.getState().createdAt }));
  }

  tickAll(): void {
    for (const g of this.games.values()) {
      if (g.update() === false) {
        setTimeout(() => {
          // cleanup room and game
        }, 10000)
      }
    }
  }

  remove(id: string): void {
    this.games.delete(id);
  }

  forfeit(id: string, side: 'top' | 'bottom'): boolean {
    const engine = this.games.get(id);
    if (!engine) return false;
    if ('forfeit' in engine && typeof (engine as any).forfeit === 'function') {
      (engine as any).forfeit(side);
      return true;
    }
    return false;
  }
}

export const gameManager = new GameManager();