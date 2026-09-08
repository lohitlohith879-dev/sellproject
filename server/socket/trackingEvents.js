// server/socket/trackingEvents.js — Live GPS Tracking Socket Events
import db from '../db.js';

export default function registerTrackingEvents(io, socket) {
  const user = socket.user;

  // ----------------------------------------------------------------
  // DRIVER: Join an order's tracking room and start broadcasting
  // Called when the driver opens the /driver/:orderId page
  // ----------------------------------------------------------------
  socket.on('driver:join_order', ({ orderId }) => {
    if (!orderId) return;

    // Validate the order exists
    const order = db.prepare('SELECT id, status, userId FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      socket.emit('tracking:error', { message: 'Order not found.' });
      return;
    }

    const room = `order_${orderId}`;
    socket.join(room);
    socket.currentOrderId = orderId;

    console.log(`[Tracking] Driver ${user.email} joined room: ${room}`);

    // Mark driver as online in last known location record
    db.prepare(`
      UPDATE driver_locations SET is_online = 1 WHERE order_id = ?
        AND id = (SELECT id FROM driver_locations WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1)
    `).run(orderId, orderId);

    socket.emit('tracking:joined', { orderId, room });
    // Notify admins a driver came online
    io.to('admins').emit('tracking:driver_online', { orderId, driverEmail: user.email, isOnline: true });
  });

  // ----------------------------------------------------------------
  // DRIVER: Send GPS coordinates
  // Saves to DB + broadcasts to the order room and admins
  // ----------------------------------------------------------------
  socket.on('driver:location_update', ({ orderId, latitude, longitude }) => {
    if (!orderId || latitude == null || longitude == null) return;

    // Security: Only allow admins or the assigned driver to emit location
    // For simplicity we validate orderId matches socket.currentOrderId
    if (socket.currentOrderId !== orderId && user.role !== 'admin') {
      socket.emit('tracking:error', { message: 'Unauthorized location update.' });
      return;
    }

    const timestamp = new Date().toISOString();

    // Get assignment info for driver name
    const assignment = db.prepare('SELECT driver_name FROM delivery_assignments WHERE order_id = ?').get(orderId);
    const driverName = assignment?.driver_name || user.name || user.email;

    // Save to driver_locations table
    db.prepare(`
      INSERT INTO driver_locations (order_id, driver_name, latitude, longitude, is_online, timestamp)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(orderId, driverName, latitude, longitude, timestamp);

    const payload = {
      orderId,
      latitude,
      longitude,
      timestamp,
      driverName,
      isOnline: true,
    };

    // Broadcast to EVERYONE in the order room (customer watching this order)
    io.to(`order_${orderId}`).emit('tracking:location', payload);

    // Also broadcast to ALL admins
    io.to('admins').emit('tracking:location', payload);
  });

  // ----------------------------------------------------------------
  // DRIVER: Go offline (when they close the page or mark as done)
  // ----------------------------------------------------------------
  socket.on('driver:go_offline', ({ orderId }) => {
    if (!orderId) return;
    const timestamp = new Date().toISOString();

    db.prepare(`
      UPDATE driver_locations SET is_online = 0, timestamp = ?
      WHERE order_id = ?
        AND id = (SELECT id FROM driver_locations WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1)
    `).run(timestamp, orderId, orderId);

    io.to(`order_${orderId}`).emit('tracking:driver_status', { orderId, isOnline: false, timestamp });
    io.to('admins').emit('tracking:driver_online', { orderId, isOnline: false, timestamp });
  });

  // ----------------------------------------------------------------
  // CUSTOMER: Subscribe to live updates for their order
  // Validates that the order belongs to this customer
  // ----------------------------------------------------------------
  socket.on('tracking:subscribe', ({ orderId }) => {
    if (!orderId) return;

    // Verify this customer owns the order
    const order = db.prepare('SELECT id, userId FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      socket.emit('tracking:error', { message: 'Order not found.' });
      return;
    }

    if (user.role === 'customer' && String(order.userId) !== String(user.id)) {
      socket.emit('tracking:error', { message: 'Access denied. Not your order.' });
      return;
    }

    const room = `order_${orderId}`;
    socket.join(room);
    console.log(`[Tracking] Customer ${user.email} subscribed to room: ${room}`);

    // Immediately send the latest known location
    const latest = db.prepare(`
      SELECT * FROM driver_locations WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1
    `).get(orderId);

    if (latest) {
      socket.emit('tracking:location', {
        orderId,
        latitude: latest.latitude,
        longitude: latest.longitude,
        timestamp: latest.timestamp,
        driverName: latest.driver_name,
        isOnline: latest.is_online === 1,
      });
    }

    socket.emit('tracking:subscribed', { orderId, room });
  });

  // ----------------------------------------------------------------
  // ADMIN: Subscribe to ALL active order rooms at once
  // ----------------------------------------------------------------
  socket.on('tracking:subscribe_all', () => {
    if (user.role !== 'admin') {
      socket.emit('tracking:error', { message: 'Admin only.' });
      return;
    }

    // Get all active orders (shipped / out_for_delivery)
    const activeOrders = db.prepare(`
      SELECT id FROM orders WHERE status IN ('shipped', 'out_for_delivery')
    `).all();

    activeOrders.forEach(o => {
      socket.join(`order_${o.id}`);
    });

    console.log(`[Tracking] Admin subscribed to ${activeOrders.length} order rooms`);
    socket.emit('tracking:subscribed_all', { count: activeOrders.length });
  });

  // Clean up on disconnect — mark driver offline
  socket.on('disconnect', () => {
    if (socket.currentOrderId) {
      const timestamp = new Date().toISOString();
      db.prepare(`
        UPDATE driver_locations SET is_online = 0, timestamp = ?
        WHERE order_id = ?
          AND id = (SELECT id FROM driver_locations WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1)
      `).run(timestamp, socket.currentOrderId, socket.currentOrderId);

      io.to(`order_${socket.currentOrderId}`).emit('tracking:driver_status', {
        orderId: socket.currentOrderId,
        isOnline: false,
        timestamp,
      });
      io.to('admins').emit('tracking:driver_online', {
        orderId: socket.currentOrderId,
        isOnline: false,
        timestamp,
      });
    }
  });
}
