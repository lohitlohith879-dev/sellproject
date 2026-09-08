import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
  }

  connect(token, role) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const SOCKET_URL =
      import.meta.env.VITE_API_URL ||
      window.location.origin;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log(`[Socket] Connected as ${role}`);
      this.reconnectAttempts = 0;
      this.emit('connection', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      this.emit('connection', false);
    });

    this.socket.on('connect_error', (err) => {
      console.error(
        `[Socket] Connection Error: ${err.message}`
      );
    });

    // Re-bind external listeners to new socket instance
    for (const [event, callbacks] of Object.entries(
      this.listeners
    )) {
      if (event !== 'connection') {
        callbacks.forEach((cb) => {
          this.socket.on(event, cb);
        });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);

    // Bind immediately if socket exists
    if (this.socket && event !== 'connection') {
      this.socket.on(event, callback);
    }
  }

  emit(event, data) {
    // Local emission
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  send(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketManager = new SocketManager();