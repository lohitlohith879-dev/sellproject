import db from '../db.js';

export default function registerCustomerEvents(io, socket) {
  // Listen for customer activity to log in the admin feed
  socket.on('customer:activity', (activity) => {
    try {
      const date = new Date().toISOString();
      const desc = `${socket.user.name} (${socket.user.email}): ${activity}`;
      
      const stmt = db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)');
      stmt.run('customer', desc, date);
      
      const newActivity = { type: 'customer', description: desc, date };
      
      // Broadcast to all admins instantly
      io.to('admins').emit('admin:activity', newActivity);
    } catch (err) {
      console.error('Error logging customer activity:', err);
    }
  });
}
