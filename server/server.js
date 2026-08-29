import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { initSocket, getIo } from './socket/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'circuitkart-secret-key-2025';

const app = express();
const httpServer = createServer(app);

// Use a dynamic port, defaulting to 3001
const port = process.env.PORT || 3001;

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

app.post('/api/orders', authMiddleware, requireCustomer, (req, res) => {
  try {
    const { items, total, contactInfo, shippingInfo, paymentMethod } = req.body;
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO orders (id, userId, items, total, date, contactInfo, shippingInfo, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      orderId, 
      req.user.id,
      JSON.stringify(items), 
      total, 
      date, 
      JSON.stringify(contactInfo), 
      JSON.stringify(shippingInfo), 
      paymentMethod
    );
    
    const newOrder = { id: orderId, userId: req.user.id, items, total, date, status: 'received', contactInfo, shippingInfo, paymentMethod };
    
    const io = getIo();
    // Broadcast to all connected admin clients that a new order was placed
    io.to('admins').emit('admin:new_order', newOrder);

    // Also insert into activities feed
    const desc = `New order ${orderId} placed by ${req.user.email} (₹${total})`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('order', desc, date);
    io.to('admins').emit('admin:activity', { type: 'order', description: desc, date });
    
    // Broadcast to customer so their dashboard updates
    io.to(`customer:${req.user.id}`).emit('order:created', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
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

// Update order status (Admin action)
app.patch('/api/orders/:id/status', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get order to find userId
    const order = db.prepare("SELECT userId FROM orders WHERE id = ?").get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const stmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
    const result = stmt.run(status, id);
    
    if (result.changes > 0) {
      const io = getIo();
      // Emit real-time event to customer
      io.to(`customer:${order.userId}`).emit('order:status_update', { id, status });
      
      // Also broadcast to other admins to sync dashboards
      io.to('admins').emit('order:status_update', { id, status });

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

// Start the server
httpServer.listen(port, async () => {
  console.log(`=================================`);
  console.log(`🚀 CircuitKart Backend API is running`);
  console.log(`🔗 http://localhost:${port}`);
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
