import { Server } from 'socket.io';
import socketAuth from './auth.js';
import registerCustomerEvents from './customerEvents.js';
import registerAdminEvents from './adminEvents.js';
import registerTrackingEvents from './trackingEvents.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? "*" : ["http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST", "PATCH"]
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
