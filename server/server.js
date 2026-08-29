import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import db from './db.js';

const app = express();
const httpServer = createServer(app);

// Use a dynamic port, defaulting to 3001
const port = process.env.PORT || 3001;

// Setup Socket.IO for real-time communication
// Allow CORS from the Vite dev server (port 3000)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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

// Create a new order
app.post('/api/orders', (req, res) => {
  try {
    const { items, total, contactInfo, shippingInfo, paymentMethod } = req.body;
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO orders (id, items, total, date, contactInfo, shippingInfo, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      orderId, 
      JSON.stringify(items), 
      total, 
      date, 
      JSON.stringify(contactInfo), 
      JSON.stringify(shippingInfo), 
      paymentMethod
    );
    
    const newOrder = { id: orderId, items, total, date, status: 'received', contactInfo, shippingInfo, paymentMethod };
    
    // Broadcast to all connected admin clients that a new order was placed
    io.emit('admin:new_order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (Admin view)
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders ORDER BY date DESC").all();
    // Parse JSON strings back to objects
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
app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const stmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
    const result = stmt.run(status, id);
    
    if (result.changes > 0) {
      // Emit real-time event to clients so their dashboard updates instantly
      io.emit('order:status_update', { id, status });
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
app.post('/api/quotes', (req, res) => {
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
    
    // Broadcast to admins
    io.emit('admin:new_quote', { id: quoteId, ...quote, date });
    
    res.status(201).json({ id: quoteId, success: true });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to submit quote request' });
  }
});


// ---------------------------------------------------------
// Socket.IO Connection Handling
// ---------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // A client can subscribe to specific rooms (e.g. tracking a specific order)
  socket.on('subscribe:order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Socket ${socket.id} joined room order:${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(`=================================`);
  console.log(`🚀 CircuitKart Backend API is running`);
  console.log(`🔗 http://localhost:${port}`);
  console.log(`=================================`);
});
