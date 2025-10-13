import { randomUUID } from 'crypto';
import type { GameKind, ServerGameState, TestEngineState } from './gameTypes';
import { PongEngine } from './PongEngine';
import { TestEngine } from './TestEngine';

type Engine = PongEngine | TestEngine;

export class GameManager {
  private games: Map<string, Engine> = new Map();

  createGame(kind: GameKind = 'pong'): { id: string } {
    const id = randomUUID();
    let engine: Engine;
    
    switch (kind) {
      case 'pong':
        engine = new PongEngine(id);
        break;
      case 'test':
        engine = new TestEngine(id);
        break;
      default:
        throw new Error(`Unsupported game kind: ${kind}`);
    }
    
    this.games.set(id, engine);
    return { id };
  }

  getState(id: string): ServerGameState | TestEngineState | null {
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
    for (const g of this.games.values()) g.update();
  }

  remove(id: string): void {
    this.games.delete(id);
  }
}

export const gameManager = new GameManager();


