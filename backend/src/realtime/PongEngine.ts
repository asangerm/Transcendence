import type { ServerGameState, Vector3 } from './gameTypes';

export class PongEngine {
  private state: ServerGameState;
  private previousState: ServerGameState | null = null;
  private inputs: { 
    top: { left: number; right: number }; 
    bottom: { left: number; right: number } 
  };
  private lastPointLoser: 'top' | 'bottom' = 'bottom';
  private roundFreezeUntil: number | null = null;
  private pendingLaunch: { vx: number; vz: number } | null = null;
  private freezeStartAt: number | null = null;
  private readonly BOUNCE_CYCLE_MS = 700;
  private readonly BOUNCE_COUNT = 3;
  private readonly BOUNCE_AMPLITUDE = 5;

  private readonly PADDLE_ACCELERATION = 500;
  private readonly PADDLE_MAX_SPEED = 80;
  private readonly PADDLE_FRICTION = 15;
  private readonly BALL_SPEED_BOOST = 1.5;
  private readonly BALL_MAX_SPEED = 30;
  private readonly ARENA_WIDTH = 50;
  private readonly PADDLE_HALF_WIDTH = 5;
  private readonly FIXED_DT = 1/60;

  constructor(id: string, topPlayer: { id: string; username?: string }, bottomPlayer: { id: string; username?: string }) {
    this.state = {
      id,
      kind: 'pong',
      players: {},
      ball: { position: { x: 0, y: 1.5, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
      paddles: {
        top: { position: { x: 0, y: 1.5, z: 45 }, velocity: { x: 0, y: 0, z: 0 } },
        bottom: { position: { x: 0, y: 1.5, z: -45 }, velocity: { x: 0, y: 0, z: 0 } },
      },
      scores: { top: 0, bottom: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameOver: false,
      winner: null,
    };
    this.inputs = { 
      top: { left: 0, right: 0 }, 
      bottom: { left: 0, right: 0 } 
    };
    this.resetBall();
  }

  getState(): ServerGameState {
    return this.state;
  }

  getPreviousState(): ServerGameState | null {
    return this.previousState;
  }

  setInput(side: 'top' | 'bottom', input: { left: number; right: number }): void {
    this.inputs[side] = input;
  }

  setPlayer(side: 'top' | 'bottom', player: { id: string; username?: string }): void {
    this.state.players[side] = player;
  }

  getStatesForInterpolation(): { current: ServerGameState; previous: ServerGameState | null } {
    return {
      current: this.state,
      previous: this.previousState
    };
  }

  forfeit(side: 'top' | 'bottom'): void {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.state.winner = side === 'top' ? 'bottom' : 'top';
    this.state.updatedAt = Date.now();
  }

  applyInput(inputData: Record<string, number>): void {
    if ('topLeft' in inputData) {
      if (inputData.topLeft === 2) {
        this.inputs.top.left = 0;
      } else {
        this.inputs.top.left = inputData.topLeft;
      }
    }
    if ('topRight' in inputData) {
      if (inputData.topRight === 2) {
        this.inputs.top.right = 0;
      } else {
        this.inputs.top.right = inputData.topRight;
      }
    }
    if ('bottomLeft' in inputData) {
      if (inputData.bottomLeft === 2) {
        this.inputs.bottom.left = 0;
      } else {
        this.inputs.bottom.left = inputData.bottomLeft;
      }
    }
    if ('bottomRight' in inputData) {
      if (inputData.bottomRight === 2) {
        this.inputs.bottom.right = 0;
      } else {
        this.inputs.bottom.right = inputData.bottomRight;
      }
    }
  }

  setPaddleX(side: 'top' | 'bottom', x: number): void {
    this.state.paddles[side].position.x = x;
  }

  update(): boolean {
    const now = Date.now();
    
    this.previousState = { ...this.state };
    if (this.state.gameOver || this.state.scores.top >= 10 || this.state.scores.bottom >= 10) {
      this.state.gameOver = true;
      this.state.winner = this.state.scores.top > this.state.scores.bottom ? 'top' : 'bottom';
      this.state.updatedAt = now;
      return false;
    }
    
    const dt = this.FIXED_DT;

    this.updatePaddle('top', dt);
    this.updatePaddle('bottom', dt);

    this.updateBall(dt);

    this.state.updatedAt = now;
    return true;
  }

  private updatePaddle(side: 'top' | 'bottom', dt: number): void {
    const paddle = this.state.paddles[side];
    const input = this.inputs[side];
    
    let acceleration = 0;
    if (input.left === 1) acceleration -= this.PADDLE_ACCELERATION;
    if (input.right === 1) acceleration += this.PADDLE_ACCELERATION;

    const hasInput = input.left === 1 || input.right === 1;
    const frictionCoeff = hasInput ? this.PADDLE_FRICTION * 0.3 : this.PADDLE_FRICTION;
    
    const frictionForce = frictionCoeff * dt;
    if (Math.abs(paddle.velocity.x) > 0.1) {
      paddle.velocity.x *= Math.max(0, 1 - frictionForce);
    } else {
      paddle.velocity.x = 0;
    }

    paddle.velocity.x += acceleration * dt;

    const speed = Math.abs(paddle.velocity.x);
    if (speed > this.PADDLE_MAX_SPEED) {
      paddle.velocity.x = Math.sign(paddle.velocity.x) * this.PADDLE_MAX_SPEED;
    }

    paddle.position.x += paddle.velocity.x * dt;

    this.applyPaddleBounds(paddle);
  }

  private applyPaddleBounds(paddle: { position: Vector3; velocity: Vector3 }): void {
    const half = this.ARENA_WIDTH / 2 - this.PADDLE_HALF_WIDTH;
    
    if (paddle.position.x <= -half) {
      paddle.position.x = -half;
      paddle.velocity.x = Math.abs(paddle.velocity.x) * 0.8;
    } else if (paddle.position.x >= half) {
      paddle.position.x = half;
      paddle.velocity.x = -Math.abs(paddle.velocity.x) * 0.8;
    }
  }

  private updateBall(dt: number): void {
    const ball = this.state.ball;
    const p = ball.position;
    const v = ball.velocity;

    const now = Date.now();
    if (this.roundFreezeUntil != null) {
      if (now < this.roundFreezeUntil) {
        v.x = 0;
        v.y = 0;
        v.z = 0;
        if (this.freezeStartAt != null) {
          const elapsed = now - this.freezeStartAt;
          const cyclesDone = Math.floor(elapsed / this.BOUNCE_CYCLE_MS);
          if (cyclesDone < this.BOUNCE_COUNT) {
            const t = (elapsed % this.BOUNCE_CYCLE_MS) / this.BOUNCE_CYCLE_MS;
            const y0 = 1.5;
            const y = y0 + Math.sin(Math.PI * t) * this.BOUNCE_AMPLITUDE;
            p.y = y;
          } else {
            p.y = 1.5;
          }
        }
        return;
      } else {
        if (this.pendingLaunch) {
          v.x = this.pendingLaunch.vx;
          v.y = 0;
          v.z = this.pendingLaunch.vz;
        }
        this.roundFreezeUntil = null;
        this.pendingLaunch = null;
        p.y = 1.5;
        this.freezeStartAt = null;
      }
    }

    p.x += v.x * dt;
    p.y += v.y * dt;
    p.z += v.z * dt;

    if (p.x <= -(this.ARENA_WIDTH / 2 - 0.5) || p.x >= (this.ARENA_WIDTH / 2 - 0.5)) {
      v.x = -v.x;
      p.x = Math.max(-(this.ARENA_WIDTH / 2 - 0.5), Math.min(this.ARENA_WIDTH / 2 - 0.5, p.x));
      
      const mag = Math.hypot(v.x, v.z);
      const target = Math.min(mag * this.BALL_SPEED_BOOST, this.BALL_MAX_SPEED);
      if (mag > 0) {
        v.x = (v.x / mag) * target;
        v.z = (v.z / mag) * target;
      }
    }

    this.checkPaddleCollision('top', p, v);
    this.checkPaddleCollision('bottom', p, v);

    if (p.z >= 49.5) {
      this.state.scores.bottom += 1;
      this.lastPointLoser = 'top';
      this.resetBall();
    } else if (p.z <= -49.5) {
      this.state.scores.top += 1;
      this.lastPointLoser = 'bottom';
      this.resetBall();
    }
  }

  private checkPaddleCollision(side: 'top' | 'bottom', ballPos: Vector3, ballVel: Vector3): void {
    const paddle = this.state.paddles[side];
    const withinZ = Math.abs(ballPos.z - paddle.position.z) < 2;
    const withinX = Math.abs(ballPos.x - paddle.position.x) < this.PADDLE_HALF_WIDTH;

    if (withinZ && withinX) {
      const originalSpeed = Math.hypot(ballVel.x, ballVel.z);
      if (side === 'top' && ballVel.z > 0) {
        ballVel.z = -Math.abs(ballVel.z);
      } else if (side === 'bottom' && ballVel.z < 0) {
        ballVel.z = Math.abs(ballVel.z);
      }
      ballVel.x += paddle.velocity.x * 0.1;
      let mag = Math.hypot(ballVel.x, ballVel.z);
      if (originalSpeed < mag) {
        const s = originalSpeed / mag;
        ballVel.x *= s;
        ballVel.z *= s;
      }
      
      if (mag > this.BALL_MAX_SPEED) {
        const s = this.BALL_MAX_SPEED / mag;
        ballVel.x *= s;
        ballVel.z *= s;
      }
      if (Math.abs(ballVel.z) < 4) {
        ballVel.z = Math.sign(ballVel.z || 1) * 4;
      }
      const sgnX = Math.sign(ballVel.x) || 1;
      const sgnZ = Math.sign(ballVel.z) || 1;
      const speed = Math.hypot(ballVel.x, ballVel.z);
      let ang = Math.atan2(Math.abs(ballVel.x), Math.abs(ballVel.z));
      const minA = 0.45;
      const maxA = 1.1;
      if (ang < minA) ang = minA;
      if (ang > maxA) ang = maxA;
      ballVel.x = sgnX * Math.sin(ang) * speed;
      ballVel.z = sgnZ * Math.cos(ang) * speed;
    }
  }

  private resetBall(): void {
    const ball = this.state.ball;
    ball.position.x = 0;
    ball.position.y = 1.5;
    ball.position.z = 0;
    const dirZ = this.lastPointLoser === 'top' ? 1 : -1;
    const maxDeg = 30;
    const a = ((Math.random() * 2 - 1) * maxDeg) * (Math.PI / 180);
    const speed = this.BALL_MAX_SPEED;
    const vx = Math.sin(a) * speed;
    const vz = Math.cos(a) * speed * dirZ;
    ball.velocity.x = 0;
    ball.velocity.y = 0;
    ball.velocity.z = 0;
    this.pendingLaunch = { vx, vz };
    this.roundFreezeUntil = Date.now() + 3000;
    this.freezeStartAt = Date.now();
  }
}


