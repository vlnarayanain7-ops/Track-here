import { Server } from 'socket.io';
import { allowedOrigins, isOriginAllowed } from '../config/cors.js';
import { verifyAccessToken } from '../utils/tokens.js';

let ioInstance = null;

function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Initialize Socket.IO Server with strict origin lockdown and user-only room scoping
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
      credentials: true,
    },
    allowRequest: (req, cb) => {
      // Runs for polling AND WebSocket upgrade handshake
      const o = req.headers.origin;
      cb(null, isOriginAllowed(o));
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const o = socket.handshake.headers.origin;
      if (o && !isOriginAllowed(o)) {
        return next(new Error('origin_not_allowed'));
      }
      const token = socket.handshake.auth?.token || readCookie(socket.handshake.headers.cookie, 'accessToken');
      if (!token) {
        return next(new Error('unauthorized'));
      }
      const user = verifyAccessToken(token);
      socket.data.userId = String(user.userId || user.id);
      socket.userId = socket.data.userId;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Never join a room name sent by the client: join ONLY user:${userId}
    socket.join(`user:${socket.data.userId}`);

    // Heartbeat / ping acknowledgment
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ status: 'ok', timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.data.userId}`);
    });
  });

  ioInstance = io;
  return io;
}

export const getIO = () => ioInstance;

/**
 * Emit an event strictly to a specific user's private socket room
 */
export function emitToUser(arg1, arg2, arg3, arg4) {
  let targetIo = ioInstance;
  let userId, event, payload;
  if (typeof arg1 === 'string') {
    userId = arg1;
    event = arg2;
    payload = arg3;
  } else {
    targetIo = arg1 || ioInstance;
    userId = arg2;
    event = arg3;
    payload = arg4;
  }
  if (!targetIo) return;
  targetIo.to(`user:${userId}`).emit(event, payload);
}
