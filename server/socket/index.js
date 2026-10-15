import { Server } from 'socket.io';
import socketAuth from './auth.js';
import registerCustomerEvents from './customerEvents.js';
import registerAdminEvents from './adminEvents.js';
import registerTrackingEvents from './trackingEvents.js';

let io;

const allowedOrigins = [
  'https://sellproject-wv5s.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001'
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(u => {
    const trimmed = u.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return true;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ["GET", "POST", "PATCH"],
      credentials: true
    }
  });

  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} | Role: ${socket.user.role} | Email: ${socket.user.email}`);

    // Automatically join role-based rooms
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`[Socket] ${socket.id} joined 'admins' room`);
      registerAdminEvents(io, socket);
    } else {
      socket.join(`customer:${socket.user.id}`);
      console.log(`[Socket] ${socket.id} joined 'customer:${socket.user.id}' room`);
      registerCustomerEvents(io, socket);
    }

    // Register live tracking events for ALL authenticated users (customers, admins, drivers)
    registerTrackingEvents(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
