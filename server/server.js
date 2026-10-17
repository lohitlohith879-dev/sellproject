import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { initSocket, getIo, isOriginAllowed } from './socket/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'circuitkart-secret-key-2025';

const app = express();
const httpServer = createServer(app);

// Dynamic port
const port = process.env.PORT || 3001;

// Setup Socket.IO modular connection
initSocket(httpServer);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

    // Notify admins via socket and activity feed
    const date = new Date().toISOString();
    const desc = `New customer registered: ${user.name} (${user.email})`;
    try {
      db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('customer', desc, date);
      getIo().to('admins').emit('admin:activity', { type: 'customer', description: desc, date });
      getIo().to('admins').emit('admin:new_user', user);
    } catch (e) {
      console.error('Socket emit error on register:', e);
    }

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
  const user = db.prepare('SELECT id, name, email, role, phone, college, address, gender, dob, avatar, phone_verified, membership, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// GET USER PROFILE
app.get('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, college, address, gender, dob, avatar, phone_verified, membership, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// UPDATE USER PROFILE
app.put('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const { name, phone, college, address, gender, dob, avatar } = req.body;
    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        college = COALESCE(?, college),
        address = COALESCE(?, address),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        avatar = COALESCE(?, avatar)
      WHERE id = ?
    `).run(
      name !== undefined ? name : null,
      phone !== undefined ? phone : null,
      college !== undefined ? college : null,
      address !== undefined ? address : null,
      gender !== undefined ? gender : null,
      dob !== undefined ? dob : null,
      avatar !== undefined ? avatar : null,
      req.user.id
    );

    const updatedUser = db.prepare('SELECT id, name, email, role, phone, college, address, gender, dob, avatar, phone_verified, membership, created_at FROM users WHERE id = ?').get(req.user.id);

    // Notify admins of profile update
    const date = new Date().toISOString();
    const desc = `Customer ${updatedUser.name} (${updatedUser.email}) updated profile details`;
    try {
      db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('customer', desc, date);
      getIo().to('admins').emit('admin:activity', { type: 'customer', description: desc, date });
      getIo().to('admins').emit('admin:user_updated', updatedUser);
    } catch (e) {}

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// CHANGE PASSWORD
app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ADDRESSES API
app.get('/api/users/addresses', authMiddleware, (req, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM user_addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user.id);
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

app.post('/api/users/addresses', authMiddleware, (req, res) => {
  try {
    const { name, phone, pincode, locality, address, city, state, landmark, alternatePhone, type, isDefault } = req.body;
    if (!name || !phone || !pincode || !address || !city || !state) {
      return res.status(400).json({ error: 'Name, phone, pincode, address, city, and state are required.' });
    }

    // If marked default or first address, clear others
    const count = db.prepare('SELECT COUNT(*) as count FROM user_addresses WHERE userId = ?').get(req.user.id).count;
    const shouldBeDefault = isDefault || count === 0 ? 1 : 0;
    if (shouldBeDefault) {
      db.prepare('UPDATE user_addresses SET isDefault = 0 WHERE userId = ?').run(req.user.id);
    }

    const result = db.prepare(`
      INSERT INTO user_addresses (userId, name, phone, pincode, locality, address, city, state, landmark, alternatePhone, type, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, name, phone, pincode, locality || '', address, city, state,
      landmark || '', alternatePhone || '', type || 'HOME', shouldBeDefault
    );

    const newAddress = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newAddress);
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

app.put('/api/users/addresses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, pincode, locality, address, city, state, landmark, alternatePhone, type, isDefault } = req.body;

    const existing = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND userId = ?').get(id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Address not found' });

    if (isDefault) {
      db.prepare('UPDATE user_addresses SET isDefault = 0 WHERE userId = ?').run(req.user.id);
    }

    db.prepare(`
      UPDATE user_addresses SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        pincode = COALESCE(?, pincode),
        locality = COALESCE(?, locality),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        landmark = COALESCE(?, landmark),
        alternatePhone = COALESCE(?, alternatePhone),
        type = COALESCE(?, type),
        isDefault = COALESCE(?, isDefault)
      WHERE id = ? AND userId = ?
    `).run(
      name, phone, pincode, locality, address, city, state,
      landmark, alternatePhone, type, isDefault !== undefined ? (isDefault ? 1 : 0) : null,
      id, req.user.id
    );

    const updated = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/users/addresses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND userId = ?').get(id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Address not found' });

    db.prepare('DELETE FROM user_addresses WHERE id = ? AND userId = ?').run(id, req.user.id);

    // If the deleted address was default, make another one default
    if (existing.isDefault) {
      const remaining = db.prepare('SELECT id FROM user_addresses WHERE userId = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
      if (remaining) {
        db.prepare('UPDATE user_addresses SET isDefault = 1 WHERE id = ?').run(remaining.id);
      }
    }

    res.json({ success: true, message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

app.patch('/api/users/addresses/:id/default', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND userId = ?').get(id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Address not found' });

    db.prepare('UPDATE user_addresses SET isDefault = 0 WHERE userId = ?').run(req.user.id);
    db.prepare('UPDATE user_addresses SET isDefault = 1 WHERE id = ?').run(id);

    res.json({ success: true, message: 'Default address updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// WISHLIST API
app.get('/api/users/wishlist', authMiddleware, (req, res) => {
  try {
    const wishlistRows = db.prepare('SELECT * FROM user_wishlist WHERE userId = ? ORDER BY id DESC').all(req.user.id);
    const regularProjects = db.prepare('SELECT * FROM projects').all();
    const iotProjects = db.prepare('SELECT * FROM iot_projects').all();

    const items = wishlistRows.map(row => {
      let project = null;
      if (row.projectType === 'iot') {
        const p = iotProjects.find(i => String(i.id) === String(row.projectId) || i.slug === row.projectId);
        if (p) {
          project = {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            rating: p.rating || 4.8,
            image: p.image || '',
            category: p.category || 'IoT',
            type: 'iot'
          };
        }
      } else {
        const p = regularProjects.find(i => String(i.id) === String(row.projectId) || i.slug === row.projectId);
        if (p) {
          project = {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            rating: p.rating || 4.7,
            image: p.image || '',
            category: p.category || 'Embedded',
            type: 'regular'
          };
        }
      }

      if (!project) {
        // Fallback placeholder if project not found
        project = {
          id: row.projectId,
          slug: row.projectId,
          name: 'Electronic Kit #' + row.projectId,
          price: 1499,
          rating: 4.8,
          image: '',
          category: 'Hardware',
          type: row.projectType || 'regular'
        };
      }

      return {
        wishlistId: row.id,
        projectId: row.projectId,
        projectType: row.projectType,
        created_at: row.created_at,
        ...project
      };
    });

    res.json(items);
  } catch (err) {
    console.error('Wishlist fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.post('/api/users/wishlist', authMiddleware, (req, res) => {
  try {
    const { projectId, projectType } = req.body;
    if (!projectId) return res.status(400).json({ error: 'Project ID is required' });

    db.prepare(`
      INSERT INTO user_wishlist (userId, projectId, projectType)
      VALUES (?, ?, ?)
      ON CONFLICT(userId, projectId) DO NOTHING
    `).run(req.user.id, projectId, projectType || 'regular');

    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

app.delete('/api/users/wishlist/:projectId', authMiddleware, (req, res) => {
  try {
    const { projectId } = req.params;
    db.prepare('DELETE FROM user_wishlist WHERE userId = ? AND (projectId = ? OR id = ?)').run(req.user.id, projectId, projectId);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// PAYMENT METHODS API (Masked / Safe display only)
app.get('/api/users/payment-methods', authMiddleware, (req, res) => {
  try {
    const methods = db.prepare('SELECT id, type, title, maskedNumber, expiry, holderName, isDefault, created_at FROM user_payment_methods WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user.id);
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

app.post('/api/users/payment-methods', authMiddleware, (req, res) => {
  try {
    const { type, title, maskedNumber, expiry, holderName, isDefault } = req.body;
    if (!type || !title || !maskedNumber) {
      return res.status(400).json({ error: 'Payment details required' });
    }

    if (isDefault) {
      db.prepare('UPDATE user_payment_methods SET isDefault = 0 WHERE userId = ?').run(req.user.id);
    }

    const result = db.prepare(`
      INSERT INTO user_payment_methods (userId, type, title, maskedNumber, expiry, holderName, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, type, title, maskedNumber, expiry || '', holderName || '', isDefault ? 1 : 0);

    const created = db.prepare('SELECT id, type, title, maskedNumber, expiry, holderName, isDefault FROM user_payment_methods WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});

app.delete('/api/users/payment-methods/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM user_payment_methods WHERE id = ? AND userId = ?').run(id, req.user.id);
    res.json({ success: true, message: 'Payment method removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove payment method' });
  }
});

// REWARDS & COUPONS API
app.get('/api/users/rewards', authMiddleware, (req, res) => {
  try {
    // Calculate SuperCoins based on completed orders
    const orders = db.prepare("SELECT total, status FROM orders WHERE userId = ?").all(req.user.id);
    const deliveredTotal = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    // Base coins 100 for registration + 10% on delivered orders up to 500
    const superCoins = 100 + Math.min(Math.floor(deliveredTotal * 0.05), 500);

    const coupons = [
      {
        code: 'CIRCUIT100',
        title: '₹100 Instant Discount',
        desc: 'Valid on orders above ₹999 on IoT & Embedded kits',
        discount: 100,
        minOrder: 999,
        expiry: '31 Dec 2026',
        category: 'All Categories'
      },
      {
        code: 'MAKER15',
        title: '15% Off on DIY Projects',
        desc: 'Special discount for student makers and engineers',
        discount: '15%',
        minOrder: 1499,
        expiry: '15 Nov 2026',
        category: 'Robotics & ESP32'
      },
      {
        code: 'FREESHIP',
        title: 'Free Express Shipping',
        desc: 'Enjoy free delivery across India on any order',
        discount: 'Free Delivery',
        minOrder: 499,
        expiry: '28 Feb 2026',
        category: 'Hardware & Kits'
      }
    ];

    res.json({
      superCoins,
      membershipTier: 'CircuitKart Plus Member',
      perks: [
        'Free Express Delivery on all orders',
        '2x SuperCoins earn rate',
        'Early access to new IoT project releases',
        'Direct 1-on-1 priority tech support for circuit design'
      ],
      coupons
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
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
// IOT & EMBEDDED SYSTEMS PROJECTS API
// ---------------------------------------------------------

function parseIotProject(p) {
  if (!p) return null;
  const demoConfig = JSON.parse(p.demoTelemetryConfig || '{}');
  const components = JSON.parse(p.components || '[]');
  const budgetBreakdown = JSON.parse(p.budgetBreakdown || '[]');
  const wiringGuide = JSON.parse(p.wiringGuide || '[]');
  const libraries = JSON.parse(p.libraries || '[]');
  const testingProcedure = JSON.parse(p.testingProcedure || '[]');
  const troubleshooting = JSON.parse(p.troubleshooting || '[]');
  const safetyPrecautions = JSON.parse(p.safetyPrecautions || '[]');

  // Map sensors array into metrics map if needed for frontend flexibility
  const metrics = demoConfig.metrics || {};
  if (Array.isArray(demoConfig.sensors) && Object.keys(metrics).length === 0) {
    demoConfig.sensors.forEach(s => {
      const key = (s.name || s.type || 'sensor').toLowerCase().replace(/[^a-z0-9]/g, '_');
      metrics[key] = {
        label: s.name,
        value: s.value,
        unit: s.unit,
        min: s.min,
        max: s.max,
        status: s.status || 'NORMAL'
      };
    });
    demoConfig.metrics = metrics;
  }

  // Provide actuators map
  if (!demoConfig.actuators) {
    demoConfig.actuators = {
      relay: 'OFF',
      buzzer: 'OFF'
    };
  }

  return {
    ...p,
    title: p.name,
    name: p.name,
    estimatedCost: p.price,
    price: p.price,
    kitPrice: p.kitPrice || p.price,
    isKitAvailable: (p.kitPrice || p.price) > 0,
    visits: p.visitsCount || 0,
    downloads: p.downloadsCount || 0,
    isActive: p.active === 1,
    active: p.active === 1,
    isDemo: p.isDemo === 1,
    pinout: wiringGuide,
    wiringGuide: wiringGuide,
    testingSteps: testingProcedure,
    testingProcedure: testingProcedure,
    components: components,
    budgetBreakdown: budgetBreakdown,
    libraries: libraries,
    troubleshooting: troubleshooting,
    safetyPrecautions: safetyPrecautions,
    telemetryConfig: demoConfig,
    demoTelemetryConfig: demoConfig,
    features: JSON.parse(p.features || '[]')
  };
}

// 1. Get all IoT projects with filters
app.get('/api/iot-projects', (req, res) => {
  try {
    const { category, difficulty, search, sort } = req.query;
    let query = 'SELECT * FROM iot_projects WHERE active = 1';
    const params = [];

    if (category && category !== 'all' && category !== 'All Categories') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (difficulty && difficulty !== 'all') {
      query += ' AND LOWER(difficulty) = LOWER(?)';
      params.push(difficulty);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR platform LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (sort === 'price-low' || sort === 'cost-asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price-high' || sort === 'cost-desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else if (sort === 'popular') {
      query += ' ORDER BY visitsCount DESC, reviewCount DESC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const rows = db.prepare(query).all(...params);
    const projects = rows.map(parseIotProject);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching iot projects:', err);
    res.status(500).json({ error: 'Failed to fetch IoT projects' });
  }
});

// 2. Get single IoT project by slug
app.get('/api/iot-projects/:slug', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM iot_projects WHERE slug = ? OR id = ?').get(req.params.slug, req.params.slug);
    if (!row) {
      return res.status(404).json({ error: 'IoT Project not found' });
    }
    // Increment visit counter
    db.prepare('UPDATE iot_projects SET visitsCount = visitsCount + 1 WHERE id = ?').run(row.id);
    row.visitsCount = (row.visitsCount || 0) + 1;
    res.json(parseIotProject(row));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IoT project details' });
  }
});

// 3. Download tracking & source code fetch
app.post('/api/iot-projects/:id/download', (req, res) => {
  try {
    const project = db.prepare('SELECT id, name, slug, firmwareCode, downloadsCount FROM iot_projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    db.prepare('UPDATE iot_projects SET downloadsCount = downloadsCount + 1 WHERE id = ?').run(project.id);
    res.json({
      success: true,
      downloads: (project.downloadsCount || 0) + 1,
      downloadsCount: (project.downloadsCount || 0) + 1,
      filename: `${project.slug}-firmware.ino`,
      code: project.firmwareCode
    });
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// 4. Live Telemetry Data API (Simulation & real state)
app.get('/api/iot-projects/:id/telemetry', (req, res) => {
  try {
    const project = db.prepare('SELECT id, slug, demoTelemetryConfig FROM iot_projects WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const parsed = parseIotProject(project);
    const config = parsed.demoTelemetryConfig;
    
    // Add realistic randomized jitter around baseline values for realistic demonstration
    if (config.metrics) {
      Object.keys(config.metrics).forEach(k => {
        const m = config.metrics[k];
        if (typeof m.value === 'number') {
          const range = (m.max - m.min) || 10;
          const jitter = (Math.random() - 0.5) * range * 0.05;
          m.value = Math.max(m.min || 0, Math.min(m.max || 100, Number((m.value + jitter).toFixed(1))));
        }
      });
    }

    config.timestamp = new Date().toISOString();
    config.isDemo = true;
    res.json({
      telemetry: config,
      isDemo: true,
      timestamp: config.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate telemetry' });
  }
});

// 5. Actuator Toggle Simulation
app.post('/api/iot-projects/:id/actuator', (req, res) => {
  try {
    const key = req.body.actuator || req.body.key || 'relay';
    const state = req.body.state || 'ON';
    res.json({
      success: true,
      key,
      state,
      actuators: { [key]: state },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Actuator toggle failed' });
  }
});

// 6. Reviews: GET & POST
app.get('/api/iot-projects/:id/reviews', (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM iot_reviews WHERE projectId = ? ORDER BY id DESC').all(req.params.id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/iot-projects/:id/reviews', authMiddleware, (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ error: 'Rating and comment are required' });
    const user = req.user;
    
    db.prepare('INSERT INTO iot_reviews (projectId, userId, userName, rating, comment) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, user.id, user.name || 'Verified Engineer', Number(rating), comment);

    // Recalculate average rating for project
    const stats = db.prepare('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM iot_reviews WHERE projectId = ?').get(req.params.id);
    db.prepare('UPDATE iot_projects SET rating = ?, reviewCount = ? WHERE id = ?')
      .run(Number(stats.avgRating.toFixed(1)), stats.count, req.params.id);

    res.json({ success: true, rating: stats.avgRating, reviewCount: stats.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post review' });
  }
});

// 7. Favorites: Toggle & List
app.post('/api/iot-projects/:id/favorite', authMiddleware, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM iot_favorites WHERE userId = ? AND projectId = ?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM iot_favorites WHERE userId = ? AND projectId = ?').run(req.user.id, req.params.id);
      res.json({ favorited: false });
    } else {
      db.prepare('INSERT INTO iot_favorites (userId, projectId) VALUES (?, ?)').run(req.user.id, req.params.id);
      res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

app.get('/api/iot-projects/user/favorites', authMiddleware, (req, res) => {
  try {
    const favs = db.prepare('SELECT projectId FROM iot_favorites WHERE userId = ?').all(req.user.id);
    res.json(favs.map(f => f.projectId));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// 8. Admin CRUD for IoT Projects
app.get('/api/admin/iot-projects', authMiddleware, requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM iot_projects ORDER BY id ASC').all();
    res.json(rows.map(parseIotProject));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin IoT projects' });
  }
});

app.post('/api/admin/iot-projects', authMiddleware, requireAdmin, (req, res) => {
  try {
    const p = req.body;
    const id = p.slug || 'iot-' + Date.now();
    db.prepare(`
      INSERT INTO iot_projects (
        id, name, slug, category, subcategory, difficulty, platform, controller,
        price, kitPrice, rating, reviewCount, image, shortDescription, description,
        features, components, budgetBreakdown, wiringGuide, firmwareCode,
        libraries, testingProcedure, troubleshooting, safetyPrecautions,
        demoTelemetryConfig, isDemo, active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id, p.name, p.slug || id, p.category || 'Arduino Projects', p.subcategory || '',
      p.difficulty || 'Beginner', p.platform || 'Arduino', p.controller || '',
      Number(p.price || 0), Number(p.kitPrice || p.price || 0), 5.0, 0, p.image || '',
      p.shortDescription || '', p.description || '', JSON.stringify(p.features || []),
      JSON.stringify(p.components || []), JSON.stringify(p.budgetBreakdown || []),
      JSON.stringify(p.wiringGuide || []), p.firmwareCode || '', JSON.stringify(p.libraries || []),
      JSON.stringify(p.testingProcedure || []), JSON.stringify(p.troubleshooting || []),
      JSON.stringify(p.safetyPrecautions || []), JSON.stringify(p.demoTelemetryConfig || {}),
      p.isDemo ? 1 : 0, p.active !== undefined ? (p.active ? 1 : 0) : 1
    );

    const desc = `Admin added new IoT Project: ${p.name}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('iot-project', desc, new Date().toISOString());

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error creating IoT project:', err);
    res.status(500).json({ error: 'Failed to create IoT project' });
  }
});

app.put('/api/admin/iot-projects/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const p = req.body;
    db.prepare(`
      UPDATE iot_projects SET
        name = ?, category = ?, subcategory = ?, difficulty = ?, platform = ?, controller = ?,
        price = ?, kitPrice = ?, image = ?, shortDescription = ?, description = ?,
        features = ?, components = ?, budgetBreakdown = ?, wiringGuide = ?, firmwareCode = ?,
        libraries = ?, testingProcedure = ?, troubleshooting = ?, safetyPrecautions = ?,
        demoTelemetryConfig = ?, isDemo = ?, active = ?
      WHERE id = ?
    `).run(
      p.name, p.category, p.subcategory || '', p.difficulty, p.platform, p.controller || '',
      Number(p.price || 0), Number(p.kitPrice || p.price || 0), p.image || '',
      p.shortDescription || '', p.description || '', JSON.stringify(p.features || []),
      JSON.stringify(p.components || []), JSON.stringify(p.budgetBreakdown || []),
      JSON.stringify(p.wiringGuide || []), p.firmwareCode || '', JSON.stringify(p.libraries || []),
      JSON.stringify(p.testingProcedure || []), JSON.stringify(p.troubleshooting || []),
      JSON.stringify(p.safetyPrecautions || []), JSON.stringify(p.demoTelemetryConfig || {}),
      p.isDemo ? 1 : 0, p.active !== undefined ? (p.active ? 1 : 0) : 1,
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating IoT project:', err);
    res.status(500).json({ error: 'Failed to update IoT project' });
  }
});

app.delete('/api/admin/iot-projects/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM iot_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete IoT project' });
  }
});

// ---------------------------------------------------------
// PROJECT DASHBOARDS API (IoT & Web Development Management)
// ---------------------------------------------------------

// Helper to parse project JSON fields
function formatProjectDashboard(p) {
  if (!p) return null;
  let screenshots = [];
  let hardwareComponents = [];
  let technologies = [];
  let componentList = [];
  let features = [];

  try { screenshots = typeof p.screenshots === 'string' ? JSON.parse(p.screenshots || '[]') : p.screenshots || []; } catch(e) {}
  try {
    if (typeof p.hardwareComponents === 'string') {
      hardwareComponents = p.hardwareComponents.startsWith('[') ? JSON.parse(p.hardwareComponents) : p.hardwareComponents.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      hardwareComponents = p.hardwareComponents || [];
    }
  } catch(e) {}
  try {
    if (typeof p.technologies === 'string') {
      technologies = p.technologies.startsWith('[') ? JSON.parse(p.technologies) : p.technologies.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      technologies = p.technologies || [];
    }
  } catch(e) {}
  try { componentList = typeof p.componentList === 'string' ? JSON.parse(p.componentList || '[]') : p.componentList || []; } catch(e) {}
  try {
    if (typeof p.features === 'string') {
      features = p.features.startsWith('[') ? JSON.parse(p.features) : p.features.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      features = p.features || [];
    }
  } catch(e) {}

  return {
    ...p,
    screenshots,
    hardwareComponents,
    technologies,
    componentList,
    features,
    published: p.published === 1
  };
}

// Compute statistics across projects
function computeProjectStats(projects) {
  const total = projects.length;
  const completed = projects.filter(p => (p.status || '').toLowerCase() === 'completed').length;
  const ongoing = projects.filter(p => (p.status || '').toLowerCase() === 'in progress').length;
  const planned = projects.filter(p => (p.status || '').toLowerCase() === 'planned').length;
  
  const techSet = new Set();
  projects.forEach(p => {
    (p.technologies || []).forEach(t => { if (t) techSet.add(t); });
  });

  return {
    total,
    completed,
    ongoing,
    planned,
    technologiesCount: techSet.size,
    technologiesList: Array.from(techSet).sort()
  };
}

// GET all projects or filter by category/search/tech/status
app.get('/api/project-dashboards', (req, res) => {
  try {
    const { category, status, tech, q } = req.query;
    let query = 'SELECT * FROM project_dashboards WHERE published = 1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND LOWER(category) = ?';
      params.push(category.toLowerCase());
    }

    if (status && status !== 'all') {
      query += ' AND LOWER(status) = ?';
      params.push(status.toLowerCase());
    }

    query += ' ORDER BY created_at DESC';
    let rows = db.prepare(query).all(...params);
    let projects = rows.map(formatProjectDashboard);

    if (tech && tech !== 'all') {
      const techLower = tech.toLowerCase();
      projects = projects.filter(p => p.technologies.some(t => t.toLowerCase() === techLower));
    }

    if (q && q.trim()) {
      const queryStr = q.trim().toLowerCase();
      projects = projects.filter(p => 
        (p.title || '').toLowerCase().includes(queryStr) ||
        (p.shortDescription || '').toLowerCase().includes(queryStr) ||
        (p.description || '').toLowerCase().includes(queryStr) ||
        p.technologies.some(t => t.toLowerCase().includes(queryStr)) ||
        p.hardwareComponents.some(h => (typeof h === 'string' ? h : h.name || '').toLowerCase().includes(queryStr))
      );
    }

    const stats = computeProjectStats(projects);
    res.json({ projects, stats });
  } catch (err) {
    console.error('Error fetching project dashboards:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET by category specifically
app.get('/api/project-dashboards/cat/:category', (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    if (!['iot', 'web'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be iot or web' });
    }
    const rows = db.prepare('SELECT * FROM project_dashboards WHERE LOWER(category) = ? AND published = 1 ORDER BY created_at DESC').all(category);
    const projects = rows.map(formatProjectDashboard);
    const stats = computeProjectStats(projects);
    res.json({ projects, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category projects' });
  }
});

// GET single project by ID or slug
app.get('/api/project-dashboards/item/:idOrSlug', (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const row = db.prepare('SELECT * FROM project_dashboards WHERE id = ? OR slug = ?').get(param, param);
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(formatProjectDashboard(row));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project detail' });
  }
});

// Admin: Create new project
app.post('/api/project-dashboards', authMiddleware, requireAdmin, (req, res) => {
  try {
    const {
      title,
      category,
      subcategory,
      description,
      shortDescription,
      coverImage,
      screenshots,
      hardwareComponents,
      technologies,
      status,
      githubUrl,
      demoVideoUrl,
      liveWebsiteUrl,
      overview,
      problemStatement,
      proposedSolution,
      componentList,
      circuitDiagram,
      workingPrinciple,
      results,
      features,
      published
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category (iot or web) are required.' });
    }

    const cleanCategory = category.toLowerCase().trim() === 'web' ? 'web' : 'iot';
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `${cleanCategory}-${slugBase}-${Date.now().toString().slice(-4)}`;
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const stmt = db.prepare(`
      INSERT INTO project_dashboards (
        id, title, slug, category, subcategory, description, shortDescription,
        coverImage, screenshots, hardwareComponents, technologies, status,
        githubUrl, demoVideoUrl, liveWebsiteUrl, overview, problemStatement,
        proposedSolution, componentList, circuitDiagram, workingPrinciple,
        results, features, published, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `);

    stmt.run(
      id,
      title,
      slug,
      cleanCategory,
      subcategory || '',
      description || '',
      shortDescription || description || '',
      coverImage || '',
      typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots || []),
      typeof hardwareComponents === 'string' ? hardwareComponents : JSON.stringify(hardwareComponents || []),
      typeof technologies === 'string' ? technologies : JSON.stringify(technologies || []),
      status || 'Completed',
      githubUrl || '',
      demoVideoUrl || '',
      liveWebsiteUrl || '',
      overview || '',
      problemStatement || '',
      proposedSolution || '',
      typeof componentList === 'string' ? componentList : JSON.stringify(componentList || []),
      circuitDiagram || '',
      workingPrinciple || '',
      results || '',
      typeof features === 'string' ? features : JSON.stringify(features || []),
      published !== undefined ? (published ? 1 : 0) : 1
    );

    const created = db.prepare('SELECT * FROM project_dashboards WHERE id = ?').get(id);
    res.status(201).json(formatProjectDashboard(created));
  } catch (err) {
    console.error('Error creating project dashboard:', err);
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// Admin: Update project
app.put('/api/project-dashboards/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT id FROM project_dashboards WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const {
      title,
      category,
      subcategory,
      description,
      shortDescription,
      coverImage,
      screenshots,
      hardwareComponents,
      technologies,
      status,
      githubUrl,
      demoVideoUrl,
      liveWebsiteUrl,
      overview,
      problemStatement,
      proposedSolution,
      componentList,
      circuitDiagram,
      workingPrinciple,
      results,
      features,
      published
    } = req.body;

    const stmt = db.prepare(`
      UPDATE project_dashboards SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        description = COALESCE(?, description),
        shortDescription = COALESCE(?, shortDescription),
        coverImage = COALESCE(?, coverImage),
        screenshots = COALESCE(?, screenshots),
        hardwareComponents = COALESCE(?, hardwareComponents),
        technologies = COALESCE(?, technologies),
        status = COALESCE(?, status),
        githubUrl = COALESCE(?, githubUrl),
        demoVideoUrl = COALESCE(?, demoVideoUrl),
        liveWebsiteUrl = COALESCE(?, liveWebsiteUrl),
        overview = COALESCE(?, overview),
        problemStatement = COALESCE(?, problemStatement),
        proposedSolution = COALESCE(?, proposedSolution),
        componentList = COALESCE(?, componentList),
        circuitDiagram = COALESCE(?, circuitDiagram),
        workingPrinciple = COALESCE(?, workingPrinciple),
        results = COALESCE(?, results),
        features = COALESCE(?, features),
        published = COALESCE(?, published),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      title,
      category ? category.toLowerCase().trim() : null,
      subcategory,
      description,
      shortDescription,
      coverImage,
      screenshots ? (typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots)) : null,
      hardwareComponents ? (typeof hardwareComponents === 'string' ? hardwareComponents : JSON.stringify(hardwareComponents)) : null,
      technologies ? (typeof technologies === 'string' ? technologies : JSON.stringify(technologies)) : null,
      status,
      githubUrl,
      demoVideoUrl,
      liveWebsiteUrl,
      overview,
      problemStatement,
      proposedSolution,
      componentList ? (typeof componentList === 'string' ? componentList : JSON.stringify(componentList)) : null,
      circuitDiagram,
      workingPrinciple,
      results,
      features ? (typeof features === 'string' ? features : JSON.stringify(features)) : null,
      published !== undefined ? (published ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM project_dashboards WHERE id = ?').get(id);
    res.json(formatProjectDashboard(updated));
  } catch (err) {
    console.error('Error updating project dashboard:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Admin: Delete project
app.delete('/api/project-dashboards/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM project_dashboards WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Admin: Toggle publish
app.patch('/api/project-dashboards/:id/publish', authMiddleware, requireAdmin, (req, res) => {
  try {
    const current = db.prepare('SELECT published FROM project_dashboards WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Project not found' });
    const newPub = current.published === 1 ? 0 : 1;
    db.prepare('UPDATE project_dashboards SET published = ?, updated_at = datetime("now") WHERE id = ?').run(newPub, req.params.id);
    res.json({ success: true, published: newPub === 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle publication' });
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

app.post('/api/orders', authMiddleware, requireCustomer, (req, res) => {
  try {
    const { items, total, contactInfo, shippingInfo, paymentMethod } = req.body;
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString();
    const userId = req.user.id;
    const userEmail = req.user.email;

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
    const orders = db.prepare(`
      SELECT 
        o.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      ORDER BY o.date DESC
    `).all();
    orders.forEach(o => {
      try { o.items = JSON.parse(o.items || '[]'); } catch { o.items = []; }
      try { o.contactInfo = JSON.parse(o.contactInfo || '{}'); } catch { o.contactInfo = {}; }
      try { o.shippingInfo = JSON.parse(o.shippingInfo || '{}'); } catch { o.shippingInfo = {}; }
      o.customerName = o.shippingInfo?.name || o.userName || o.contactInfo?.name || 'Customer';
      o.name = o.customerName;
      o.phone = o.contactInfo?.phone || o.userPhone || '-';
      o.email = o.contactInfo?.email || o.userEmail || '-';
      o.created_at = o.date;
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

// Admin Analytics and Feed Data (Overview, Users, Orders, Quotes, Activities)
app.get('/api/admin/feed', authMiddleware, requireAdmin, (req, res) => {
  try {
    // 1. All Orders with customer name, contact & shipping
    const orders = db.prepare(`
      SELECT 
        o.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      ORDER BY o.date DESC
    `).all();

    orders.forEach(o => {
      try { o.items = JSON.parse(o.items || '[]'); } catch { o.items = []; }
      try { o.contactInfo = JSON.parse(o.contactInfo || '{}'); } catch { o.contactInfo = {}; }
      try { o.shippingInfo = JSON.parse(o.shippingInfo || '{}'); } catch { o.shippingInfo = {}; }
      o.customerName = o.shippingInfo?.name || o.userName || o.contactInfo?.name || 'Customer';
      o.name = o.customerName;
      o.phone = o.contactInfo?.phone || o.userPhone || '-';
      o.email = o.contactInfo?.email || o.userEmail || '-';
      o.created_at = o.date;
    });

    // 2. Active Projects
    const projects = db.prepare("SELECT * FROM projects WHERE active = 1").all();

    // 3. Full Registered Users List
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.phone, 
        u.college, 
        u.address, 
        u.created_at,
        COUNT(o.id) as orderCount,
        COALESCE(SUM(o.total), 0) as totalSpent,
        MAX(o.date) as lastOrderDate
      FROM users u
      LEFT JOIN orders o ON o.userId = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    // Fill missing phone and address from user orders if available
    users.forEach(u => {
      if (!u.phone || !u.address) {
        const userOrder = orders.find(o => o.userId === u.id);
        if (userOrder) {
          if (!u.phone && userOrder.phone && userOrder.phone !== '-') {
            u.phone = userOrder.phone;
          }
          if (!u.address && userOrder.shippingInfo?.address1) {
            const ship = userOrder.shippingInfo;
            u.address = [ship.address1, ship.address2, ship.city, ship.state, ship.zip].filter(Boolean).join(', ');
          }
        }
      }
    });

    // 4. Custom Quotes
    const quotes = db.prepare("SELECT * FROM quotes ORDER BY date DESC").all();
    quotes.forEach(q => {
      q.customerName = q.name;
      q.created_at = q.date;
      q.requirements = q.description;
    });

    // 5. Activity Log
    const activities = db.prepare("SELECT * FROM activities ORDER BY date DESC LIMIT 50").all();

    res.json({
      orders,
      projects,
      users,
      quotes,
      activities,
      activity: activities
    });
  } catch (error) {
    console.error('Failed to fetch admin feed:', error);
    res.status(500).json({ error: 'Failed to fetch admin feed data' });
  }
});

// Admin Users API - Full list
app.get('/api/admin/users', authMiddleware, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.phone, 
        u.college, 
        u.address, 
        u.created_at,
        COUNT(o.id) as orderCount,
        COALESCE(SUM(o.total), 0) as totalSpent,
        MAX(o.date) as lastOrderDate
      FROM users u
      LEFT JOIN orders o ON o.userId = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    const orders = db.prepare("SELECT userId, contactInfo, shippingInfo FROM orders ORDER BY date DESC").all();
    users.forEach(u => {
      if (!u.phone || !u.address) {
        const userOrder = orders.find(o => o.userId === u.id);
        if (userOrder) {
          try {
            const contact = JSON.parse(userOrder.contactInfo || '{}');
            const ship = JSON.parse(userOrder.shippingInfo || '{}');
            if (!u.phone && contact.phone) u.phone = contact.phone;
            if (!u.address && ship.address1) {
              u.address = [ship.address1, ship.address2, ship.city, ship.state, ship.zip].filter(Boolean).join(', ');
            }
          } catch {}
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin User Details by ID (Profile + Orders)
app.get('/api/admin/users/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, role, phone, college, address, created_at FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY date DESC').all(id);
    orders.forEach(o => {
      try { o.items = JSON.parse(o.items || '[]'); } catch { o.items = []; }
      try { o.contactInfo = JSON.parse(o.contactInfo || '{}'); } catch { o.contactInfo = {}; }
      try { o.shippingInfo = JSON.parse(o.shippingInfo || '{}'); } catch { o.shippingInfo = {}; }
    });

    res.json({ user, orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Admin Delete User
app.delete('/api/admin/users/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    const date = new Date().toISOString();
    const desc = `Admin deleted user account #${id}`;
    db.prepare('INSERT INTO activities (type, description, date) VALUES (?, ?, ?)').run('admin', desc, date);
    getIo().to('admins').emit('admin:activity', { type: 'admin', description: desc, date });

    res.json({ success: true, message: `User #${id} deleted.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
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

  app.get('/*splat', (req, res) => {
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
