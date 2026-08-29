import db from '../db.js';

export default function registerAdminEvents(io, socket) {
  // Listen for admin activity to log in the admin feed
  socket.on('admin:activity', (activity) => {
    try {
      const date = new Date().toISOString();
      const desc = `Admin (${socket.user.email}): ${activity}`;
      
      const stmt = db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)');
      stmt.run('admin', desc, date);
      
      const newActivity = { type: 'admin', description: desc, date };
      
      // Broadcast to all admins (including self for multi-tab sync)
      io.to('admins').emit('admin:activity', newActivity);
    } catch (err) {
      console.error('Error logging admin activity:', err);
    }
  });
}
