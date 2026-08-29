import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'circuitkart-secret-key-2025';

export default function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // Bind user data to socket
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
}
