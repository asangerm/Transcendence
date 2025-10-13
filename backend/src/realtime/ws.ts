// Use untyped imports to avoid type resolution issues
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const websocket = require('@fastify/websocket');
type FastifyInstance = any;
import { gameManager } from './GameManager';
import type { ClientInput, ClientPaddleUpdate, TestEngineInput, RealtimeMessage } from './gameTypes';

export async function registerRealtime(app: FastifyInstance) {
  await app.register(websocket);

  const connections = new Map<string, Set<any>>();

  const broadcastState = (gameId: string) => {
    const engine = gameManager.getEngine(gameId);
    if (!engine) return;
    const stateMsg: RealtimeMessage = { type: 'state', state: engine.getState() };
    const subs = connections.get(gameId);
    if (!subs) return;
    const payload = JSON.stringify(stateMsg);
    for (const ws of subs) {
      try { ws.send(payload); } catch {}
    }
  };

  // Update loop and broadcast ~120fps for very smooth ball updates
  setInterval(() => {
    gameManager.tickAll();
    for (const gameId of connections.keys()) broadcastState(gameId);
  }, 8);

  app.get('/ws', { websocket: true }, (connection: any, req: any) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const gameId = url.searchParams.get('gameId') ?? '';
    if (!gameId) {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'Missing gameId' } satisfies RealtimeMessage));
      connection.socket.close();
      return;
    }

    if (!connections.has(gameId)) connections.set(gameId, new Set());
    connections.get(gameId)!.add(connection.socket);

    connection.socket.send(JSON.stringify({ type: 'hello', serverTime: Date.now() } as RealtimeMessage));

    connection.socket.on('message', (data: any) => {
      try {
        const raw = typeof data === 'string' ? data : (data?.toString?.() ?? '');
        if (!raw) return;
        const anyMsg = JSON.parse(raw);
        
        // Handle paddle position updates (Pong specific)
        if (anyMsg?.type === 'paddle') {
          const msg = anyMsg as ClientPaddleUpdate;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          // Cast to PongEngine to access setPaddleX method
          (engine as any).setPaddleX(msg.playerSide, msg.x);
          return;
        }
        
        // Handle test engine inputs (new JSON format)
        if (anyMsg?.gameId && (anyMsg?.up !== undefined || anyMsg?.down !== undefined || 
            anyMsg?.left !== undefined || anyMsg?.right !== undefined || 
            anyMsg?.forward !== undefined || anyMsg?.backward !== undefined)) {
          const engine = gameManager.getEngine(anyMsg.gameId);
          if (!engine) return;
          // Extract input data (exclude gameId)
          const inputData: Record<string, number> = {};
          if (anyMsg.up !== undefined) inputData.up = anyMsg.up;
          if (anyMsg.down !== undefined) inputData.down = anyMsg.down;
          if (anyMsg.left !== undefined) inputData.left = anyMsg.left;
          if (anyMsg.right !== undefined) inputData.right = anyMsg.right;
          if (anyMsg.forward !== undefined) inputData.forward = anyMsg.forward;
          if (anyMsg.backward !== undefined) inputData.backward = anyMsg.backward;
          // Cast to TestEngine to access applyInput method
          (engine as any).applyInput(inputData);
          return;
        }
        
        // Handle legacy test engine inputs (fallback)
        if (anyMsg?.action && ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'moveForward', 'moveBackward', 'stop'].includes(anyMsg.action)) {
          const msg = anyMsg as TestEngineInput;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          // Convert legacy action to new format
          const inputData: Record<string, number> = {};
          switch (msg.action) {
            case 'moveUp': inputData.up = 1; break;
            case 'moveDown': inputData.down = 1; break;
            case 'moveLeft': inputData.left = 1; break;
            case 'moveRight': inputData.right = 1; break;
            case 'moveForward': inputData.forward = 1; break;
            case 'moveBackward': inputData.backward = 1; break;
            case 'stop': 
              inputData.up = 2; inputData.down = 2; inputData.left = 2; 
              inputData.right = 2; inputData.forward = 2; inputData.backward = 2;
              break;
          }
          (engine as any).applyInput(inputData);
          return;
        }
        
        // Fallback: legacy pong action messages
        const msg = anyMsg as ClientInput;
        const engine = gameManager.getEngine(msg.gameId);
        if (!engine) return;
        // Cast to PongEngine to access two-parameter applyInput method
        (engine as any).applyInput(msg.playerSide, msg.action);
      } catch {}
    });

    connection.socket.on('close', () => {
      connections.get(gameId)?.delete(connection.socket);
    });
  });
}


