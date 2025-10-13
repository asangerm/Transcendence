import type { ServerGameState, Vector3 } from './gameTypes';

export class PongEngine {
  private state: ServerGameState;
  private lastUpdate: number;
  private inputs: { top: { left: boolean; right: boolean }; bottom: { left: boolean; right: boolean } };

  constructor(id: string) {
    this.state = {
      id,
      kind: 'pong',
      players: {},
      ball: { position: { x: 0, y: 1.5, z: 0 }, velocity: { x: 6, y: 0, z: 4 } },
      paddles: {
        top: { position: { x: 0, y: 1.5, z: 45 } },
        bottom: { position: { x: 0, y: 1.5, z: -45 } },
      },
      scores: { top: 0, bottom: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameOver: false,
      winner: null,
    };
    this.lastUpdate = Date.now();
    this.inputs = { top: { left: false, right: false }, bottom: { left: false, right: false } };
  }

  getState(): ServerGameState {
    return this.state;
  }

  setPlayer(side: 'top' | 'bottom', player: { id: string; username?: string }): void {
    this.state.players[side] = player;
  }

  applyInput(side: 'top' | 'bottom', action: 'moveLeft' | 'moveRight' | 'stop'): void {
    if (action === 'moveLeft') {
      this.inputs[side].left = true; this.inputs[side].right = false;
    } else if (action === 'moveRight') {
      this.inputs[side].right = true; this.inputs[side].left = false;
    } else if (action === 'stop') {
      this.inputs[side].left = false; this.inputs[side].right = false;
    }
  }

  setPaddleX(side: 'top' | 'bottom', x: number): void {
    this.state.paddles[side].position.x = x;
  }

  update(): void {
    const now = Date.now();
    let dt = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    if (dt > 0.1) dt = 0.1;

    // Paddle movement from inputs and clamp within walls (arena width 50, walls at x +-25)
    const moveFromInput = (side: 'top' | 'bottom') => {
      const speed = 50; // units/sec
      const dir = this.inputs[side].left ? -1 : this.inputs[side].right ? 1 : 0;
      this.state.paddles[side].position.x += dir * speed * dt;
    };
    moveFromInput('top');
    moveFromInput('bottom');

    // Clamp paddles
    const clampPad = (pos: Vector3) => {
      const half = 25 - 5; // paddle half width ~=5
      if (pos.x < -half) pos.x = -half;
      if (pos.x > half) pos.x = half;
    };
    clampPad(this.state.paddles.top.position);
    clampPad(this.state.paddles.bottom.position);

    // Integrate ball
    const p = this.state.ball.position;
    const v = this.state.ball.velocity;
    p.x += v.x * dt;
    p.y += v.y * dt;
    p.z += v.z * dt;

    // Collide with vertical walls at x=+-25
    if (p.x <= -25 || p.x >= 25) {
      v.x = -v.x;
      p.x = Math.max(-25, Math.min(25, p.x));
      // small speed boost to keep pace lively and reduce grazing stalls
      const mag = Math.hypot(v.x, v.z);
      const target = Math.min(mag * 1.01, 25);
      if (mag > 0) {
        v.x = (v.x / mag) * target;
        v.z = (v.z / mag) * target;
      }
    }

    // Collide with top/bottom paddles (simple AABB on x, z proximity)
    const collidePaddle = (padZ: number, padX: number): boolean => {
      const withinZ = Math.abs(p.z - padZ) < 2; // contact depth
      const withinX = Math.abs(p.x - padX) < 5; // half paddle width
      return withinZ && withinX;
    };

    if (collidePaddle(this.state.paddles.top.position.z, this.state.paddles.top.position.x) && v.z > 0) {
      v.z = -Math.abs(v.z);
    } else if (collidePaddle(this.state.paddles.bottom.position.z, this.state.paddles.bottom.position.x) && v.z < 0) {
      v.z = Math.abs(v.z);
    }

    // Score if ball crosses back walls at z=+-50
    if (p.z >= 50) {
      this.state.scores.bottom += 1;
      p.x = 0; p.y = 1.5; p.z = 0; v.x = 6; v.y = 0; v.z = -4;
    } else if (p.z <= -50) {
      this.state.scores.top += 1;
      p.x = 0; p.y = 1.5; p.z = 0; v.x = -6; v.y = 0; v.z = 4;
    }

    this.state.updatedAt = now;
  }
}


