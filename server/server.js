import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { initSocket, getIo } from './socket/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'circuitkart-secret-key-2025';

const app = express();
const httpServer = createServer(app);

// Use a dynamic port, defaulting to 3000
const port = process.env.PORT || 3000;

// Setup Socket.IO modular connection
initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// REST API Routes
// ---------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------------------------------------------------------
// AUTH Routes
// ---------------------------------------------------------

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

function requireCustomer(req, res, next) {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({ error: 'Customer access required' });
  }
}

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, password_hash, 'customer');

    const user = { id: result.lastInsertRowid, name, email, role: 'customer' };

    // Issue JWT
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET CURRENT USER (protected)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ADMIN LOGIN (role-restricted)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'No admin account found with this email.' });
    }

    // Check admin role BEFORE verifying password (prevents timing attacks)
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. This account does not have admin privileges.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Admin login: ${user.email}`);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ---------------------------------------------------------
// PUBLIC DATA API (For Customer Website)
// ---------------------------------------------------------

app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects WHERE active = 1').all();
    projects.forEach(p => {
      p.images = JSON.parse(p.images || '[]');
      p.sensors = JSON.parse(p.sensors || '[]');
      p.communication = JSON.parse(p.communication || '[]');
      p.display = JSON.parse(p.display || '[]');
      p.software = JSON.parse(p.software || '[]');
      p.features = JSON.parse(p.features || '[]');
      p.applications = JSON.parse(p.applications || '[]');
      p.components = JSON.parse(p.components || '[]');
      p.whatsIncluded = JSON.parse(p.whatsIncluded || '[]');
      p.tags = JSON.parse(p.tags || '[]');
      p.sourceCode = p.sourceCode === 1;
      p.documentation = p.documentation === 1;
      p.popular = p.popular === 1;
      p.featured = p.featured === 1;
      p.active = p.active === 1;
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/components', (req, res) => {
  try {
    const components = db.prepare('SELECT * FROM components WHERE active = 1').all();
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ---------------------------------------------------------
// ADMIN DATA API (CRUD for Projects, Components, Settings)
// ---------------------------------------------------------

app.get('/api/admin/projects', authMiddleware, requireAdmin, (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects').all();
    projects.forEach(p => {
      p.images = JSON.parse(p.images || '[]');
      p.sensors = JSON.parse(p.sensors || '[]');
      p.communication = JSON.parse(p.communication || '[]');
      p.display = JSON.parse(p.display || '[]');
      p.software = JSON.parse(p.software || '[]');
      p.features = JSON.parse(p.features || '[]');
      p.applications = JSON.parse(p.applications || '[]');
      p.components = JSON.parse(p.components || '[]');
      p.whatsIncluded = JSON.parse(p.whatsIncluded || '[]');
      p.tags = JSON.parse(p.tags || '[]');
      p.sourceCode = p.sourceCode === 1;
      p.documentation = p.documentation === 1;
      p.popular = p.popular === 1;
      p.featured = p.featured === 1;
      p.active = p.active === 1;
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/admin/projects', authMiddleware, requireAdmin, (req, res) => {
  try {
    const project = req.body;
    const id = project.slug || 'proj-' + Date.now();
    const date = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO projects (
        id, name, slug, category, subcategory, description, shortDescription, 
        difficulty, price, image, images, controller, sensors, communication, 
        display, software, features, applications, components, whatsIncluded, tags
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id, project.name, project.slug || id, project.category || 'misc', project.subcategory || '',
      project.description || '', project.shortDescription || '', project.difficulty || 'Beginner',
      project.price || 0, project.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', JSON.stringify(project.images || []),
      project.controller || '', JSON.stringify(project.sensors || []), 
      JSON.stringify(project.communication || []), JSON.stringify(project.display || []),
      JSON.stringify(project.software || []), JSON.stringify(project.features || []),
      JSON.stringify(project.applications || []), JSON.stringify(project.components || []),
      JSON.stringify(project.whatsIncluded || []), JSON.stringify(project.tags || [])
    );

    const desc = `Admin added new project: ${project.name}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('project', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'project', description: desc, date });
    
    // Broadcast to all clients
    getIo().emit('project:updated', { id });

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

app.put('/api/admin/projects/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const project = req.body;
    
    const stmt = db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        shortDescription = COALESCE(?, shortDescription),
        price = COALESCE(?, price),
        image = COALESCE(?, image),
        difficulty = COALESCE(?, difficulty),
        active = COALESCE(?, active),
        featured = COALESCE(?, featured)
      WHERE id = ?
    `);
    
    stmt.run(
      project.name, project.slug, project.category,
      project.description, project.shortDescription,
      project.price, project.image, project.difficulty,
      project.active !== undefined ? (project.active ? 1 : 0) : null,
      project.featured !== undefined ? (project.featured ? 1 : 0) : null,
      id
    );
    
    const date = new Date().toISOString();
    const desc = `Admin updated project ${id}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('project', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'project', description: desc, date });

    getIo().emit('project:updated', { id });

    res.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/admin/projects/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    
    const date = new Date().toISOString();
    const desc = `Admin deleted project ${id}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('project', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'project', description: desc, date });
    
    getIo().emit('project:updated', { id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.get('/api/admin/components', authMiddleware, requireAdmin, (req, res) => {
  try {
    const components = db.prepare('SELECT * FROM components').all();
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

app.put('/api/admin/components/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock, active } = req.body;
    
    if (price !== undefined) {
      db.prepare('UPDATE components SET price = ? WHERE id = ?').run(price, id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update component' });
  }
});

app.put('/api/admin/settings', authMiddleware, requireAdmin, (req, res) => {
  try {
    const settings = req.body; // Object of key-value pairs
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    // Use transaction for multiple inserts
    const updateSettings = db.transaction((settingsObj) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        stmt.run(key, String(value));
      }
    });
    
    updateSettings(settings);
    
    const date = new Date().toISOString();
    const desc = `Admin updated website settings`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('settings', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'settings', description: desc, date });
    
    getIo().emit('settings:updated', settings);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Optional auth middleware — attaches user if token present, allows guests through
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Invalid token — treat as guest
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

app.post('/api/orders', optionalAuth, (req, res) => {
  try {
    const { items, total, contactInfo, shippingInfo, paymentMethod } = req.body;
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString();
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : (contactInfo?.email || 'Guest');
    
    const stmt = db.prepare(`
      INSERT INTO orders (id, userId, items, total, date, contactInfo, shippingInfo, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      orderId, 
      userId,
      JSON.stringify(items), 
      total, 
      date, 
      JSON.stringify(contactInfo), 
      JSON.stringify(shippingInfo), 
      paymentMethod
    );
    
    const newOrder = { id: orderId, userId, items, total, date, status: 'placed', paymentStatus: 'pending', contactInfo, shippingInfo, paymentMethod };
    
    // Insert initial order history
    db.prepare(`
      INSERT INTO order_status_history (orderId, newStatus, changedBy, note)
      VALUES (?, ?, ?, ?)
    `).run(orderId, 'placed', 'customer', 'Order placed successfully');
    
    const io = getIo();
    // Broadcast to all connected admin clients that a new order was placed
    io.to('admins').emit('admin:new_order', newOrder);

    // Also insert into activities feed
    const desc = `New order ${orderId} placed by ${userEmail} (₹${total})`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('order', desc, date);
    io.to('admins').emit('admin:activity', { type: 'order', description: desc, date });
    
    // Broadcast to customer so their dashboard updates (if logged in)
    if (userId) io.to(`customer:${userId}`).emit('order:created', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/orders/:id/payment', authMiddleware, requireCustomer, (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;
    
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND userId = ?").get(id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const paymentDesc = `UPI (Txn: ${transactionId})`;
    db.prepare("UPDATE orders SET status = ?, paymentMethod = ?, paymentStatus = ?, updatedAt = ? WHERE id = ?").run('payment_confirmed', paymentDesc, 'paid', new Date().toISOString(), id);
    
    // Insert history
    db.prepare(`
      INSERT INTO order_status_history (orderId, previousStatus, newStatus, changedBy, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, order.status, 'payment_confirmed', 'customer', 'Payment proof submitted');
    
    const io = getIo();
    io.to(`customer:${req.user.id}`).emit('order:status_update', { id, status: 'payment_confirmed', paymentMethod: paymentDesc, paymentStatus: 'paid' });
    io.to('admins').emit('order:status_update', { id, status: 'payment_confirmed', paymentMethod: paymentDesc, paymentStatus: 'paid' });
    
    const date = new Date().toISOString();
    const desc = `Customer submitted payment proof for order ${id}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('order', desc, date);
    io.to('admins').emit('admin:activity', { type: 'order', description: desc, date });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
});

// Get all orders (Admin view)
app.get('/api/orders/all', authMiddleware, requireAdmin, (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders ORDER BY date DESC").all();
    orders.forEach(o => {
      o.items = JSON.parse(o.items || '[]');
      o.contactInfo = JSON.parse(o.contactInfo || '{}');
      o.shippingInfo = JSON.parse(o.shippingInfo || '{}');
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: get single order + history
app.get('/api/admin/orders/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.items = JSON.parse(order.items || '[]');
    order.contactInfo = JSON.parse(order.contactInfo || '{}');
    order.shippingInfo = JSON.parse(order.shippingInfo || '{}');
    const history = db.prepare("SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(id);
    res.json({ ...order, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Get customer orders
app.get('/api/orders', authMiddleware, requireCustomer, (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders WHERE userId = ? ORDER BY date DESC").all(req.user.id);
    orders.forEach(o => {
      o.items = JSON.parse(o.items || '[]');
      o.contactInfo = JSON.parse(o.contactInfo || '{}');
      o.shippingInfo = JSON.parse(o.shippingInfo || '{}');
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order + history (Customer)
app.get('/api/orders/:id', authMiddleware, requireCustomer, (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND userId = ?").get(id, req.user.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.items = JSON.parse(order.items || '[]');
    order.contactInfo = JSON.parse(order.contactInfo || '{}');
    order.shippingInfo = JSON.parse(order.shippingInfo || '{}');
    
    const history = db.prepare("SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(id);
    
    res.json({ ...order, history });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Update order status (Admin action)
app.patch('/api/orders/:id/status', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, estimatedDelivery } = req.body;
    
    // Get order to find userId
    const order = db.prepare("SELECT userId, status FROM orders WHERE id = ?").get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updates = ['status = ?', 'updatedAt = ?'];
    const params = [status, new Date().toISOString()];
    
    if (trackingNumber !== undefined) {
      updates.push('trackingNumber = ?');
      params.push(trackingNumber);
    }
    if (estimatedDelivery !== undefined) {
      updates.push('estimatedDelivery = ?');
      params.push(estimatedDelivery);
    }
    
    params.push(id); // for WHERE id = ?

    const stmt = db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    if (result.changes > 0) {
      // Add to history
      db.prepare(`
        INSERT INTO order_status_history (orderId, previousStatus, newStatus, changedBy, note)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, order.status, status, req.user.email, note || null);

      // Create a notification for the customer
      let notifTitle = 'Order Update';
      let notifMsg = `Your order ${id} is now ${status.replace('_', ' ')}.`;
      if (status === 'shipped' && trackingNumber) notifMsg += ` Tracking Number: ${trackingNumber}`;
      
      const notifId = db.prepare('INSERT INTO notifications (userId, orderId, type, title, message, date) VALUES (?, ?, ?, ?, ?, ?)').run(
        order.userId, id, 'order_update', notifTitle, notifMsg, new Date().toISOString()
      ).lastInsertRowid;
      
      const newNotif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

      // Get full updated history to send in the real-time event
      const history = db.prepare("SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(id);
      
      const payload = { 
        id, 
        status, 
        trackingNumber, 
        estimatedDelivery,
        history,
        notification: newNotif
      };

      const io = getIo();
      // Emit real-time event to customer
      io.to(`customer:${order.userId}`).emit('order:status_update', payload);
      
      // Also broadcast to other admins to sync dashboards
      io.to('admins').emit('order:status_update', payload);

      // Add to activities
      const date = new Date().toISOString();
      const desc = `Admin updated order ${id} to ${status}`;
      db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('order', desc, date);
      io.to('admins').emit('admin:activity', { type: 'order', description: desc, date });

      res.json({ success: true, id, status });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Submit a custom project quote request
app.post('/api/quotes', authMiddleware, requireCustomer, (req, res) => {
  try {
    const quote = req.body;
    const quoteId = 'REQ-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO quotes (id, name, email, phone, role, projectName, category, controller, description, budget, timeline, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      quoteId, quote.name, quote.email, quote.phone, quote.role,
      quote.projectName, quote.category, quote.controller, quote.description,
      quote.budget, quote.timeline, date
    );
    
    const io = getIo();
    // Broadcast to admins
    io.to('admins').emit('admin:new_quote', { id: quoteId, ...quote, date });
    
    const desc = `New custom quote requested by ${req.user.email}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('quote', desc, date);
    io.to('admins').emit('admin:activity', { type: 'quote', description: desc, date });

    res.status(201).json({ id: quoteId, success: true });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to submit quote request' });
  }
});

// Admin Analytics and Feed Data
app.get('/api/admin/feed', authMiddleware, requireAdmin, (req, res) => {
  try {
    const activities = db.prepare("SELECT * FROM activities ORDER BY date DESC LIMIT 50").all();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

app.post('/api/admin/notifications', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const date = new Date().toISOString();
    
    db.prepare('INSERT INTO notifications (userId, type, message, date) VALUES (?, ?, ?, ?)').run(userId || null, type || 'info', message, date);
    
    if (userId) {
      getIo().to(`customer:${userId}`).emit('notification', { message, type: type || 'info' });
    } else {
      getIo().emit('notification', { message, type: type || 'info' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get user notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? OR userId IS NULL ORDER BY date DESC LIMIT 50").all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?").run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ---------------------------------------------------------
// REVIEWS API
// ---------------------------------------------------------

// Submit a review for a project
app.post('/api/reviews', authMiddleware, requireCustomer, (req, res) => {
  try {
    const { orderId, projectId, rating, comment } = req.body;
    
    // Insert the review
    db.prepare(`
      INSERT INTO reviews (userId, orderId, projectId, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, orderId, projectId, rating, comment);

    // Update project overall rating
    const reviews = db.prepare("SELECT rating FROM reviews WHERE projectId = ?").all(projectId);
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    db.prepare(`
      UPDATE projects 
      SET rating = ?, reviewCount = ? 
      WHERE id = ?
    `).run(avgRating.toFixed(1), reviews.length, projectId);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get reviews for a specific project
app.get('/api/reviews/:projectId', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.name as userName 
      FROM reviews r 
      JOIN users u ON r.userId = u.id 
      WHERE r.projectId = ? 
      ORDER BY r.createdAt DESC
    `).all(req.params.projectId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ---------------------------------------------------------
// LIVE TRACKING API
// ---------------------------------------------------------

// POST /api/tracking/location — Driver submits GPS coordinates (REST fallback for Socket.IO)
app.post('/api/tracking/location', authMiddleware, (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body;
    if (!orderId || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'orderId, latitude, and longitude are required.' });
    }

    const timestamp = new Date().toISOString();
    const assignment = db.prepare('SELECT driver_name FROM delivery_assignments WHERE order_id = ?').get(orderId);
    const driverName = assignment?.driver_name || req.user.name || req.user.email;

    db.prepare(`
      INSERT INTO driver_locations (order_id, driver_name, latitude, longitude, is_online, timestamp)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(orderId, driverName, latitude, longitude, timestamp);

    const payload = { orderId, latitude, longitude, timestamp, driverName, isOnline: true };
    const io = getIo();
    io.to(`order_${orderId}`).emit('tracking:location', payload);
    io.to('admins').emit('tracking:location', payload);

    res.json({ success: true, timestamp });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Failed to save location.' });
  }
});

// GET /api/tracking/location/:orderId — Get latest driver location for an order
app.get('/api/tracking/location/:orderId', authMiddleware, (req, res) => {
  try {
    const { orderId } = req.params;

    // Authorization: customers can only see their own order's location
    if (req.user.role === 'customer') {
      const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      if (String(order.userId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const location = db.prepare(`
      SELECT * FROM driver_locations WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1
    `).get(orderId);

    if (!location) return res.json({ location: null });

    res.json({
      location: {
        orderId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        driverName: location.driver_name,
        isOnline: location.is_online === 1,
      }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location.' });
  }
});

// GET /api/tracking/active — All active deliveries with latest driver locations (Admin only)
app.get('/api/tracking/active', authMiddleware, requireAdmin, (req, res) => {
  try {
    const activeOrders = db.prepare(`
      SELECT o.id, o.status, o.delivery_lat, o.delivery_lng, o.shippingInfo, o.contactInfo,
             u.name as customerName,
             da.driver_name, da.driver_phone,
             dl.latitude, dl.longitude, dl.timestamp as locationTimestamp, dl.is_online
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN delivery_assignments da ON da.order_id = o.id
      LEFT JOIN driver_locations dl ON dl.order_id = o.id
        AND dl.id = (SELECT id FROM driver_locations WHERE order_id = o.id ORDER BY timestamp DESC LIMIT 1)
      WHERE o.status IN ('shipped', 'out_for_delivery')
      ORDER BY o.date DESC
    `).all();

    const result = activeOrders.map(o => ({
      orderId: o.id,
      status: o.status,
      customerName: o.customerName,
      shippingInfo: JSON.parse(o.shippingInfo || '{}'),
      contactInfo: JSON.parse(o.contactInfo || '{}'),
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      driverName: o.driver_name,
      driverPhone: o.driver_phone,
      driverLocation: o.latitude != null ? {
        latitude: o.latitude,
        longitude: o.longitude,
        timestamp: o.locationTimestamp,
        isOnline: o.is_online === 1,
      } : null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching active deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch active deliveries.' });
  }
});

// POST /api/tracking/assign — Assign a driver to an order (Admin only)
app.post('/api/tracking/assign', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { orderId, driverName, driverPhone, deliveryLat, deliveryLng } = req.body;
    if (!orderId || !driverName) {
      return res.status(400).json({ error: 'orderId and driverName are required.' });
    }

    // Upsert assignment
    db.prepare(`
      INSERT INTO delivery_assignments (order_id, driver_name, driver_phone, assigned_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(order_id) DO UPDATE SET
        driver_name = excluded.driver_name,
        driver_phone = excluded.driver_phone,
        assigned_at = excluded.assigned_at
    `).run(orderId, driverName, driverPhone || null);

    // Store delivery coordinates on the order
    if (deliveryLat != null && deliveryLng != null) {
      db.prepare('UPDATE orders SET delivery_lat = ?, delivery_lng = ? WHERE id = ?').run(deliveryLat, deliveryLng, orderId);
    }

    // Notify admin room
    getIo().to('admins').emit('tracking:driver_assigned', { orderId, driverName, driverPhone });

    const date = new Date().toISOString();
    const desc = `Driver "${driverName}" assigned to order ${orderId}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('order', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'order', description: desc, date });

    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ error: 'Failed to assign driver.' });
  }
});

// GET /api/tracking/assignment/:orderId — Get driver assignment for an order
app.get('/api/tracking/assignment/:orderId', authMiddleware, (req, res) => {
  try {
    const { orderId } = req.params;

    // Customers can only see their own order
    if (req.user.role === 'customer') {
      const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId);
      if (!order || String(order.userId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const assignment = db.prepare('SELECT * FROM delivery_assignments WHERE order_id = ?').get(orderId);
    res.json({ assignment: assignment || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment.' });
  }
});

// PATCH /api/tracking/delivery-coords/:orderId — Admin sets delivery lat/lng
app.patch('/api/tracking/delivery-coords/:orderId', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryLat, deliveryLng } = req.body;
    if (deliveryLat == null || deliveryLng == null) {
      return res.status(400).json({ error: 'deliveryLat and deliveryLng are required.' });
    }
    db.prepare('UPDATE orders SET delivery_lat = ?, delivery_lng = ? WHERE id = ?').run(deliveryLat, deliveryLng, orderId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery coordinates.' });
  }
});

// Serve Vite frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start the server

httpServer.listen(port, '0.0.0.0', async () => {
  console.log(`=================================`);
  console.log(`🚀 CircuitKart Backend API is running`);
  console.log(`🔗 http://0.0.0.0:${port}`);
  console.log(`=================================`);

  // Seed default admin user if not exists
  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = 'admin@circuitkart.com'").get();
    if (!existing) {
      const hash = await bcrypt.hash('Admin@1234', 10);
      db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run('Admin', 'admin@circuitkart.com', hash, 'admin');
      console.log('✅ Default admin created: admin@circuitkart.com / Admin@1234');
    }
  } catch (e) {
    console.log('Admin seed skipped:', e.message);
  }
});
