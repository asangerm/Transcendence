import type { ServerGameState, Vector3 } from './gameTypes';

export class PongEngine {
  private state: ServerGameState;
  private previousState: ServerGameState | null = null;
  private lastUpdate: number;
  private inputs: { 
    top: { left: number; right: number }; 
    bottom: { left: number; right: number } 
  };

  // Physics constants for smooth sliding paddles
  private readonly PADDLE_ACCELERATION = 500; // units/sec² - higher for more responsive acceleration
  private readonly PADDLE_MAX_SPEED = 100; // units/sec - slightly higher max speed
  private readonly PADDLE_FRICTION = 15; // friction coefficient - higher for more realistic sliding
  private readonly BALL_SPEED_BOOST = 1.01; // speed boost factor on wall bounce
  private readonly BALL_MAX_SPEED = 25; // maximum ball speed
  private readonly ARENA_WIDTH = 50; // arena width
  private readonly PADDLE_HALF_WIDTH = 5; // paddle half width
  private readonly FIXED_DT = 1/60; // Fixed timestep for consistent physics (60fps)

  constructor(id: string, topPlayer: { id: string; username?: string }, bottomPlayer: { id: string; username?: string }) {
    this.state = {
      id,
      kind: 'pong',
      players: {},
      ball: { position: { x: 0, y: 1.5, z: 0 }, velocity: { x: 6, y: 0, z: 4 } },
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
    this.lastUpdate = Date.now();
    this.inputs = { 
      top: { left: 0, right: 0 }, 
      bottom: { left: 0, right: 0 } 
    };
  }

  getState(): ServerGameState {
    return this.state;
  }

  getPreviousState(): ServerGameState | null {
    return this.previousState;
  }

  // Handle client input for paddle movement
  setInput(side: 'top' | 'bottom', input: { left: number; right: number }): void {
    this.inputs[side] = input;
  }

  // Set player information
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
    // Update inputs based on received data (matching TestEngine pattern)
    // Only process fields that are present in the JSON (skip noOp fields)
    if ('topLeft' in inputData) {
      if (inputData.topLeft === 2) {
        this.inputs.top.left = 0; // Stop command resets to 0
      } else {
        this.inputs.top.left = inputData.topLeft;
      }
    }
    if ('topRight' in inputData) {
      if (inputData.topRight === 2) {
        this.inputs.top.right = 0; // Stop command resets to 0
      } else {
        this.inputs.top.right = inputData.topRight;
      }
    }
    if ('bottomLeft' in inputData) {
      if (inputData.bottomLeft === 2) {
        this.inputs.bottom.left = 0; // Stop command resets to 0
      } else {
        this.inputs.bottom.left = inputData.bottomLeft;
      }
    }
    if ('bottomRight' in inputData) {
      if (inputData.bottomRight === 2) {
        this.inputs.bottom.right = 0; // Stop command resets to 0
      } else {
        this.inputs.bottom.right = inputData.bottomRight;
      }
    }
  }

  setPaddleX(side: 'top' | 'bottom', x: number): void {
    this.state.paddles[side].position.x = x;
  }

  update(): void {
    const now = Date.now();
    
    // Store previous state for interpolation
    this.previousState = { ...this.state };
    if (this.state.gameOver || this.state.scores.top >= 10 || this.state.scores.bottom >= 10) {
      this.state.gameOver = true;
      this.state.winner = this.state.scores.top > this.state.scores.bottom ? 'top' : 'bottom';
      this.state.updatedAt = now;
      return;
    }
    
    // Use fixed timestep for consistent physics
    const dt = this.FIXED_DT;
    this.lastUpdate = now;

    // Update paddles with acceleration-based physics
    this.updatePaddle('top', dt);
    this.updatePaddle('bottom', dt);

    // Update ball physics
    this.updateBall(dt);

    this.state.updatedAt = now;
  }

  private updatePaddle(side: 'top' | 'bottom', dt: number): void {
    const paddle = this.state.paddles[side];
    const input = this.inputs[side];
    
    // Calculate acceleration based on inputs
    let acceleration = 0;
    if (input.left === 1) acceleration -= this.PADDLE_ACCELERATION;
    if (input.right === 1) acceleration += this.PADDLE_ACCELERATION;

    // Apply friction (always present, but stronger when no input)
    const hasInput = input.left === 1 || input.right === 1;
    const frictionCoeff = hasInput ? this.PADDLE_FRICTION * 0.3 : this.PADDLE_FRICTION; // Less friction when actively moving
    
    // Apply friction force (opposite to velocity direction)
    const frictionForce = frictionCoeff * dt;
    if (Math.abs(paddle.velocity.x) > 0.1) {
      paddle.velocity.x *= Math.max(0, 1 - frictionForce);
    } else {
      paddle.velocity.x = 0; // Stop very small velocities
    }

    // Apply acceleration
    paddle.velocity.x += acceleration * dt;

    // Apply speed limit
    const speed = Math.abs(paddle.velocity.x);
    if (speed > this.PADDLE_MAX_SPEED) {
      paddle.velocity.x = Math.sign(paddle.velocity.x) * this.PADDLE_MAX_SPEED;
    }

    // Integrate position using velocity
    paddle.position.x += paddle.velocity.x * dt;

    // Apply bounds with bounce
    this.applyPaddleBounds(paddle);
  }

  private applyPaddleBounds(paddle: { position: Vector3; velocity: Vector3 }): void {
    const half = this.ARENA_WIDTH / 2 - this.PADDLE_HALF_WIDTH;
    
    if (paddle.position.x <= -half) {
      paddle.position.x = -half;
      paddle.velocity.x = Math.abs(paddle.velocity.x) * 0.8; // Bounce with energy loss
    } else if (paddle.position.x >= half) {
      paddle.position.x = half;
      paddle.velocity.x = -Math.abs(paddle.velocity.x) * 0.8;
    }
  }

  private updateBall(dt: number): void {
    const ball = this.state.ball;
    const p = ball.position;
    const v = ball.velocity;

    // Integrate ball position
    p.x += v.x * dt;
    p.y += v.y * dt;
    p.z += v.z * dt;

    // Collide with vertical walls at x=±25
    if (p.x <= -this.ARENA_WIDTH / 2 || p.x >= this.ARENA_WIDTH / 2) {
      v.x = -v.x;
      p.x = Math.max(-this.ARENA_WIDTH / 2, Math.min(this.ARENA_WIDTH / 2, p.x));
      
      // Apply speed boost to keep pace lively and reduce grazing stalls
      const mag = Math.hypot(v.x, v.z);
      const target = Math.min(mag * this.BALL_SPEED_BOOST, this.BALL_MAX_SPEED);
      if (mag > 0) {
        v.x = (v.x / mag) * target;
        v.z = (v.z / mag) * target;
      }
    }

    // Collide with paddles
    this.checkPaddleCollision('top', p, v);
    this.checkPaddleCollision('bottom', p, v);

    // Score if ball crosses back walls at z=±50
    if (p.z >= 50) {
      this.state.scores.bottom += 1;
      this.resetBall();
    } else if (p.z <= -50) {
      this.state.scores.top += 1;
      this.resetBall();
    }
  }

  private checkPaddleCollision(side: 'top' | 'bottom', ballPos: Vector3, ballVel: Vector3): void {
    const paddle = this.state.paddles[side];
    const withinZ = Math.abs(ballPos.z - paddle.position.z) < 2; // contact depth
    const withinX = Math.abs(ballPos.x - paddle.position.x) < this.PADDLE_HALF_WIDTH; // half paddle width
    
    if (withinZ && withinX) {
      if (side === 'top' && ballVel.z > 0) {
        ballVel.z = -Math.abs(ballVel.z);
      } else if (side === 'bottom' && ballVel.z < 0) {
        ballVel.z = Math.abs(ballVel.z);
      }
    }
  }

  private resetBall(): void {
    const ball = this.state.ball;
    ball.position.x = 0;
    ball.position.y = 1.5;
    ball.position.z = 0;
    ball.velocity.x = 6;
    ball.velocity.y = 0;
    ball.velocity.z = 4;
  }
}


