import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000'
    : undefined
);

/**
 * Get or create a singleton Socket instance
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/**
 * Connect the socket when authenticated
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket when logged out
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Hook Socket.IO events into TanStack Query cache invalidation
 * for multi-device, multi-tab real-time synchronization
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function setupRealtimeSync(queryClient) {
  const s = connectSocket();

  // Reconnection recovery: refresh stale queries
  s.on('connect', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
  });

  // Task events
  s.on('task:created', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  s.on('task:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  s.on('task:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  // Note events
  s.on('note:created', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  s.on('note:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  s.on('note:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  // Study Session & Timer events
  s.on('session:created', () => {
    queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  });

  s.on('session:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  s.on('session:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  });

  s.on('timer:started', () => {
    queryClient.invalidateQueries({ queryKey: ['timer'] });
  });

  s.on('timer:paused', () => {
    queryClient.invalidateQueries({ queryKey: ['timer'] });
  });

  s.on('timer:resumed', () => {
    queryClient.invalidateQueries({ queryKey: ['timer'] });
  });

  s.on('timer:finished', () => {
    queryClient.invalidateQueries({ queryKey: ['timer'] });
    queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  });

  // Problem events
  s.on('problem:created', () => {
    queryClient.invalidateQueries({ queryKey: ['problems'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  s.on('problem:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['problems'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  s.on('problem:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['problems'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  });

  // Revision events
  s.on('revision:created', () => {
    queryClient.invalidateQueries({ queryKey: ['revisions'] });
  });

  s.on('revision:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['revisions'] });
  });

  s.on('revision:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['revisions'] });
  });

  // Daily Plan & Review events
  s.on('dailyPlan:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
    queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
  });

  s.on('dailyReview:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['daily-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['daily-review'] });
  });

  // Timetable events
  s.on('timetable:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['timetable'] });
  });

  // Mock Test events
  s.on('mockTest:created', () => {
    queryClient.invalidateQueries({ queryKey: ['mock-tests'] });
  });

  s.on('mockTest:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['mock-tests'] });
  });

  s.on('mockTest:deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['mock-tests'] });
  });

  // User events
  s.on('user:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
  });

  return () => {
    s.off('connect');
    s.off('task:created');
    s.off('task:updated');
    s.off('task:deleted');
    s.off('note:created');
    s.off('note:updated');
    s.off('note:deleted');
    s.off('session:created');
    s.off('session:updated');
    s.off('session:deleted');
    s.off('timer:started');
    s.off('timer:paused');
    s.off('timer:resumed');
    s.off('timer:finished');
    s.off('problem:created');
    s.off('problem:updated');
    s.off('problem:deleted');
    s.off('revision:created');
    s.off('revision:updated');
    s.off('revision:deleted');
    s.off('dailyPlan:updated');
    s.off('dailyReview:updated');
    s.off('timetable:updated');
    s.off('mockTest:created');
    s.off('mockTest:updated');
    s.off('mockTest:deleted');
    s.off('user:updated');
  };
}

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  setupRealtimeSync,
};

