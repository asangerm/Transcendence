import type { TestEngineState, Vector3 } from './gameTypes';

export class TestEngine {
  private state: TestEngineState;
  private previousState: TestEngineState | null = null;
  private lastUpdate: number;
  private inputs: {
    up: number;    // 0 = noOp, 1 = move, 2 = stop
    down: number;
    left: number;
    right: number;
    forward: number;
    backward: number;
  };

  // Physics constants
  private readonly ACCELERATION = 100; // units/sec²
  private readonly MAX_SPEED = 15; // units/sec
  private readonly FRICTION = 8; // friction coefficient
  private readonly BOUNDS = 25; // world bounds (±25 units)
  private readonly FIXED_DT = 1/60; // Fixed timestep for consistent physics (60fps)

  constructor(id: string) {
    this.state = {
      id,
      kind: 'test',
      players: {},
      cube: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameOver: false,
      winner: null,
    };
    this.lastUpdate = Date.now();
    this.inputs = {
      up: 0,
      down: 0,
      left: 0,
      right: 0,
      forward: 0,
      backward: 0,
    };
  }

  getState(): TestEngineState {
    return this.state;
  }

  getPreviousState(): TestEngineState | null {
    return this.previousState;
  }

  getStatesForInterpolation(): { current: TestEngineState; previous: TestEngineState | null } {
    return {
      current: this.state,
      previous: this.previousState
    };
  }

  setPlayer(player: { id: string; username?: string }): void {
    this.state.players.player1 = player;
  }

  applyInput(inputData: Record<string, number>): void {
    // Update inputs based on received data
    // Only process fields that are present in the JSON (skip noOp fields)
    if ('up' in inputData) {
      if (inputData.up === 2) {
        this.inputs.up = 0; // Stop command resets to 0
      } else {
        this.inputs.up = inputData.up;
      }
    }
    if ('down' in inputData) {
      if (inputData.down === 2) {
        this.inputs.down = 0; // Stop command resets to 0
      } else {
        this.inputs.down = inputData.down;
      }
    }
    if ('left' in inputData) {
      if (inputData.left === 2) {
        this.inputs.left = 0; // Stop command resets to 0
      } else {
        this.inputs.left = inputData.left;
      }
    }
    if ('right' in inputData) {
      if (inputData.right === 2) {
        this.inputs.right = 0; // Stop command resets to 0
      } else {
        this.inputs.right = inputData.right;
      }
    }
    if ('forward' in inputData) {
      if (inputData.forward === 2) {
        this.inputs.forward = 0; // Stop command resets to 0
      } else {
        this.inputs.forward = inputData.forward;
      }
    }
    if ('backward' in inputData) {
      if (inputData.backward === 2) {
        this.inputs.backward = 0; // Stop command resets to 0
      } else {
        this.inputs.backward = inputData.backward;
      }
    }
  }

  update(): void {
    const now = Date.now();
    
    // Store previous state for interpolation
    this.previousState = { ...this.state };
    
    // Use fixed timestep for consistent physics
    const dt = this.FIXED_DT;
    this.lastUpdate = now;

    const cube = this.state.cube;

    // Calculate acceleration based on inputs
    cube.acceleration.x = 0;
    cube.acceleration.y = 0;
    cube.acceleration.z = 0;

    if (this.inputs.left === 1) cube.acceleration.x -= this.ACCELERATION;
    if (this.inputs.right === 1) cube.acceleration.x += this.ACCELERATION;
    if (this.inputs.up === 1) cube.acceleration.y += this.ACCELERATION;
    if (this.inputs.down === 1) cube.acceleration.y -= this.ACCELERATION;
    if (this.inputs.forward === 1) cube.acceleration.z += this.ACCELERATION;
    if (this.inputs.backward === 1) cube.acceleration.z -= this.ACCELERATION;

    // Apply friction when no input is active (all inputs are 0 or 2)
    const hasInput = this.inputs.up === 1 || this.inputs.down === 1 || this.inputs.left === 1 || 
                    this.inputs.right === 1 || this.inputs.forward === 1 || this.inputs.backward === 1;
    
    if (!hasInput) {
      // Apply friction to slow down the cube
      const frictionForce = this.FRICTION * dt;
      cube.velocity.x *= Math.max(0, 1 - frictionForce);
      cube.velocity.y *= Math.max(0, 1 - frictionForce);
      cube.velocity.z *= Math.max(0, 1 - frictionForce);
    }

    // Integrate velocity using acceleration
    cube.velocity.x += cube.acceleration.x * dt;
    cube.velocity.y += cube.acceleration.y * dt;
    cube.velocity.z += cube.acceleration.z * dt;

    // Apply speed limit
    const speed = Math.sqrt(cube.velocity.x ** 2 + cube.velocity.y ** 2 + cube.velocity.z ** 2);
    if (speed > this.MAX_SPEED) {
      const scale = this.MAX_SPEED / speed;
      cube.velocity.x *= scale;
      cube.velocity.y *= scale;
      cube.velocity.z *= scale;
    }

    // Integrate position using velocity
    cube.position.x += cube.velocity.x * dt;
    cube.position.y += cube.velocity.y * dt;
    cube.position.z += cube.velocity.z * dt;

    // Apply world bounds with bounce
    this.applyBounds(cube.position, cube.velocity);

    this.state.updatedAt = now;
  }

  private applyBounds(position: Vector3, velocity: Vector3): void {
    // X bounds
    if (position.x <= -this.BOUNDS) {
      position.x = -this.BOUNDS;
      velocity.x = Math.abs(velocity.x) * 0.8; // Bounce with energy loss
    } else if (position.x >= this.BOUNDS) {
      position.x = this.BOUNDS;
      velocity.x = -Math.abs(velocity.x) * 0.8;
    }

    // Y bounds
    if (position.y <= -this.BOUNDS) {
      position.y = -this.BOUNDS;
      velocity.y = Math.abs(velocity.y) * 0.8;
    } else if (position.y >= this.BOUNDS) {
      position.y = this.BOUNDS;
      velocity.y = -Math.abs(velocity.y) * 0.8;
    }

    // Z bounds
    if (position.z <= -this.BOUNDS) {
      position.z = -this.BOUNDS;
      velocity.z = Math.abs(velocity.z) * 0.8;
    } else if (position.z >= this.BOUNDS) {
      position.z = this.BOUNDS;
      velocity.z = -Math.abs(velocity.z) * 0.8;
    }
  }
}
