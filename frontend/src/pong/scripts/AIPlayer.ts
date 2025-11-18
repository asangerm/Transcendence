import { Ball } from "./Ball";
import { Paddle } from "./Paddle";

export type AIDifficulty = "easy" | "medium" | "hard";

export interface AIDecision {
  movement: "left" | "right" | "none";
  targetX: number;
  strategy: string;
  confidence: number;
  ballDirection: string;
  ballDistance: number | string;
}

export class AIPlayer {
  private playerId: string;
  private position: "top" | "bottom";
  private difficulty: AIDifficulty;

  // game constants
  private readonly ARENA_WIDTH = 50;
  private readonly ARENA_DEPTH = 100;
  private readonly PADDLE_WIDTH = 10;
  private readonly BALL_RADIUS = 1;
  private readonly MY_PADDLE_Z: number;

  // Vision at 1Hz
  private lastVisionUpdate = 0;
  private readonly visionInterval = 1000;

  // Internal state
  private targetX = 0;
  private currentStrategy = "waiting";
  private confidence = 0;
  private ballHistory: Array<{
    x: number;
    y: number;
    z: number;
    time: number;
  }> = [];
  private readonly maxHistory = 3;

  // Strategy parameters
  private readonly RETURN_TO_CENTER = true;
  private readonly CENTER_RETURN_SPEED: number;
  private lastPaddleHit = 0;
  private readonly RETURN_TO_CENTER_DELAY: number;
  private readonly VISION_DISTANCE: number;

  constructor(
    playerId: string,
    position: "top" | "bottom",
    difficulty: AIDifficulty = "medium"
  ) {
    this.playerId = playerId;
    this.position = position;
    this.difficulty = difficulty;
    this.MY_PADDLE_Z = position === "top" ? 45 : -45;

    const config = this.getDifficultyConfig();
    this.RETURN_TO_CENTER_DELAY = config.returnDelay;
    this.VISION_DISTANCE = config.visionDistance;
    this.CENTER_RETURN_SPEED = config.centerSpeed;
  }

  // Difficulty configuration
  private getDifficultyConfig() {
    const configs = {
      easy: { visionDistance: 40, returnDelay: 1500, centerSpeed: 0.3 },
      medium: { visionDistance: 60, returnDelay: 1500, centerSpeed: 0.5 },
      hard: { visionDistance: 80, returnDelay: 1500, centerSpeed: 0.8 },
    };
    return configs[this.difficulty];
  }

  // Main AI decision process
  processDecision(ball: Ball, myPaddle: Paddle): AIDecision {
    const now = Date.now();

    if (now - this.lastVisionUpdate < this.visionInterval - 50) {
      return this.getLastDecision();
    }

    this.lastVisionUpdate = now;

    const ballPos = ball.getPosition();
    const ballVel = ball.getVelocity();
    const paddlePos = myPaddle.getPosition();

    this.updateBallHistory(ballPos);

    let velocity = { dx: ballVel[0], dy: ballVel[1], dz: ballVel[2] };
    if (Math.abs(velocity.dx) < 0.01 && Math.abs(velocity.dz) < 0.01) {
      velocity = this.calculateVelocity(ballPos);
    }

    const ballDirection = this.getBallDirection(velocity.dz);
    const ballDistance = Math.abs(ballPos[2] - this.MY_PADDLE_Z);

    let targetX: number;
    let strategy: string;

    if (
      ballDirection === "toward" &&
      (Math.abs(velocity.dz) > 0.1 || ballDistance < this.VISION_DISTANCE)
    ) {
      targetX = this.predictInterception(ballPos, velocity);
      strategy = "intercepting";
      this.confidence = Math.min(0.9, 1.0 - ballDistance / this.ARENA_DEPTH);
    } else {
      const timeSinceHit = now - this.lastPaddleHit;

      if (this.RETURN_TO_CENTER && timeSinceHit < this.RETURN_TO_CENTER_DELAY) {
        targetX = this.returnToCenterAggressive(paddlePos[0]);
        strategy = "centering_after_hit";
        this.confidence = 0.5;
      } else {
        targetX = this.returnToCenterAggressive(paddlePos[0]);
        strategy = "waiting";
        this.confidence = 0.5;
      }
    }

    // Apply difficulty error and clamp
    targetX = this.clampTargetX(targetX);
    targetX = this.applyDifficultyError(targetX);
    targetX = this.clampTargetX(targetX);

    this.targetX = targetX;
    this.currentStrategy = strategy;

    return {
      movement: "none",
      targetX,
      strategy,
      confidence: this.confidence,
      ballDirection,
      ballDistance: ballDistance.toFixed(0),
    };
  }

  // Predict ball interception with wall bounce anticipation
  private predictInterception(
    ballPos: [number, number, number],
    velocity: { dx: number; dy: number; dz: number }
  ): number {
    const timeToReach = Math.abs((this.MY_PADDLE_Z - ballPos[2]) / velocity.dz);

    // For imminent collision, use current position
    if (timeToReach < 0.2) {
      return ballPos[0];
    }

    let predictedX = ballPos[0] + velocity.dx * timeToReach;

    // Simulate wall bounces
    const leftWall = -this.ARENA_WIDTH / 2 + this.BALL_RADIUS;
    const rightWall = this.ARENA_WIDTH / 2 - this.BALL_RADIUS;

    let bounceCount = 0;
    while (
      (predictedX < leftWall || predictedX > rightWall) &&
      bounceCount < 5
    ) {
      if (predictedX < leftWall) {
        predictedX = 2 * leftWall - predictedX;
      } else if (predictedX > rightWall) {
        predictedX = 2 * rightWall - predictedX;
      }
      bounceCount++;
    }

    if (bounceCount >= 5) {
      predictedX = 0;
    }

    // Adaptive bias correction based on ball speed
    const ballSpeed = Math.sqrt(
      velocity.dx * velocity.dx + velocity.dz * velocity.dz
    );
    const speedFactor = Math.min(1.0, ballSpeed / 20);
    const BIAS_CORRECTION = 1.5 + speedFactor * 2.0;

    return predictedX - BIAS_CORRECTION;
  }

  // Return to center position
  private returnToCenterAggressive(currentX: number): number {
    return currentX + (0 - currentX) * this.CENTER_RETURN_SPEED;
  }

  // Calculate velocity from ball history (weighted average)
  private calculateVelocity(currentBall: [number, number, number]): {
    dx: number;
    dy: number;
    dz: number;
  } {
    if (this.ballHistory.length === 0) {
      return { dx: 0, dy: 0, dz: 0 };
    }

    let totalWeight = 0;
    let weightedDx = 0,
      weightedDy = 0,
      weightedDz = 0;
    const now = Date.now();

    for (let i = 0; i < this.ballHistory.length; i++) {
      const weight = i + 1;
      const prev = this.ballHistory[i];
      const timeDelta = (now - prev.time) / 1000;

      if (timeDelta > 0 && timeDelta < 5) {
        weightedDx += ((currentBall[0] - prev.x) / timeDelta) * weight;
        weightedDy += ((currentBall[1] - prev.y) / timeDelta) * weight;
        weightedDz += ((currentBall[2] - prev.z) / timeDelta) * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      const lastBall = this.ballHistory[this.ballHistory.length - 1];
      const timeDelta = 1.0;
      return {
        dx: (currentBall[0] - lastBall.x) / timeDelta,
        dy: (currentBall[1] - lastBall.y) / timeDelta,
        dz: (currentBall[2] - lastBall.z) / timeDelta,
      };
    }

    return {
      dx: weightedDx / totalWeight,
      dy: weightedDy / totalWeight,
      dz: weightedDz / totalWeight,
    };
  }

  private updateBallHistory(ballPos: [number, number, number]): void {
    this.ballHistory.push({
      x: ballPos[0],
      y: ballPos[1],
      z: ballPos[2],
      time: Date.now(),
    });

    if (this.ballHistory.length > this.maxHistory) {
      this.ballHistory.shift();
    }
  }

  private getBallDirection(
    ballDz: number
  ): "toward" | "away" | "stationary" {
    if (Math.abs(ballDz) < 0.1) return "stationary";

    if (this.position === "top") {
      return ballDz > 0 ? "toward" : "away";
    } else {
      return ballDz < 0 ? "toward" : "away";
    }
  }

  // Apply difficulty-based error to make AI beatable
  private applyDifficultyError(targetX: number): number {
    const errorRange: Record<AIDifficulty, number> = {
      easy: 8,
      medium: 2,
      hard: 0.2,
    };

    const maxError = errorRange[this.difficulty];
    const error = (Math.random() - 0.5) * maxError;

    return targetX + error;
  }

  // Clamp target to valid paddle positions
  private clampTargetX(targetX: number): number {
    const minX = -this.ARENA_WIDTH / 2 + this.PADDLE_WIDTH / 2;
    const maxX = this.ARENA_WIDTH / 2 - this.PADDLE_WIDTH / 2;
    return Math.max(minX, Math.min(maxX, targetX));
  }

  // Return cached decision between 1Hz updates
  private getLastDecision(): AIDecision {
    return {
      movement: "none",
      targetX: this.targetX,
      strategy: this.currentStrategy,
      confidence: this.confidence,
      ballDirection: "cached",
      ballDistance: "cached",
    };
  }

  notifyPaddleHit(): void {
    this.lastPaddleHit = Date.now();
  }

  cleanup(): void {
    this.ballHistory = [];
    this.lastPaddleHit = 0;
  }

  getDebugInfo() {
    return {
      playerId: this.playerId,
      position: this.position,
      difficulty: this.difficulty,
      targetX: this.targetX,
      strategy: this.currentStrategy,
      confidence: this.confidence,
      returnToCenter: this.RETURN_TO_CENTER,
    };
  }
}
