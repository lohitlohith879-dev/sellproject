import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'circuitkart.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDb() {
  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'placed',
      paymentStatus TEXT DEFAULT 'pending',
      date TEXT NOT NULL,
      updatedAt TEXT,
      contactInfo TEXT,
      shippingInfo TEXT,
      paymentMethod TEXT,
      estimatedDelivery TEXT,
      trackingNumber TEXT,
      deliveryNote TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS driver_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      driver_name TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_online INTEGER DEFAULT 1,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL UNIQUE,
      driver_name TEXT NOT NULL,
      driver_phone TEXT,
      assigned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      previousStatus TEXT,
      newStatus TEXT NOT NULL,
      changedBy TEXT NOT NULL,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(orderId) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      orderId TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Notification',
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      projectName TEXT NOT NULL,
      category TEXT,
      controller TEXT,
      description TEXT NOT NULL,
      budget TEXT,
      timeline TEXT,
      status TEXT DEFAULT 'pending',
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT,
      subcategory TEXT,
      description TEXT,
      shortDescription TEXT,
      difficulty TEXT,
      rating REAL,
      reviewCount INTEGER,
      price REAL NOT NULL,
      image TEXT,
      images TEXT,
      controller TEXT,
      sensors TEXT,
      communication TEXT,
      display TEXT,
      software TEXT,
      powerSystem TEXT,
      hardware TEXT,
      features TEXT,
      applications TEXT,
      components TEXT,
      blockDiagram TEXT,
      circuitDiagram TEXT,
      softwareDetails TEXT,
      whatsIncluded TEXT,
      sourceCode INTEGER DEFAULT 0,
      documentation INTEGER DEFAULT 0,
      tags TEXT,
      deliveryTime TEXT,
      popular INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 100,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      orderId TEXT,
      projectId TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS iot_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      difficulty TEXT NOT NULL,
      platform TEXT NOT NULL,
      controller TEXT,
      price REAL NOT NULL,
      kitPrice REAL NOT NULL,
      rating REAL DEFAULT 4.8,
      reviewCount INTEGER DEFAULT 0,
      image TEXT,
      shortDescription TEXT,
      description TEXT,
      features TEXT,
      components TEXT,
      budgetBreakdown TEXT,
      wiringGuide TEXT,
      firmwareCode TEXT,
      libraries TEXT,
      testingProcedure TEXT,
      troubleshooting TEXT,
      safetyPrecautions TEXT,
      demoTelemetryConfig TEXT,
      downloadsCount INTEGER DEFAULT 0,
      visitsCount INTEGER DEFAULT 0,
      isDemo INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS iot_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId TEXT NOT NULL,
      userId INTEGER,
      userName TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS iot_favorites (
      userId INTEGER NOT NULL,
      projectId TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(userId, projectId)
    );
  `;

  db.exec(initSql);

  try {
    // Seed initial IoT Projects if not populated
    const iotCount = db.prepare('SELECT COUNT(*) as count FROM iot_projects').get().count;
    if (iotCount === 0) {
      import('./iotProjectsSeed.js').then(({ initialIotProjects }) => {
        const insertStmt = db.prepare(`
          INSERT INTO iot_projects (
            id, name, slug, category, subcategory, difficulty, platform, controller,
            price, kitPrice, rating, reviewCount, image, shortDescription, description,
            features, components, budgetBreakdown, wiringGuide, firmwareCode,
            libraries, testingProcedure, troubleshooting, safetyPrecautions,
            demoTelemetryConfig, isDemo, active
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `);

        for (const p of initialIotProjects) {
          insertStmt.run(
            p.id, p.name, p.slug, p.category, p.subcategory || '', p.difficulty, p.platform, p.controller || '',
            p.price, p.kitPrice || p.price, p.rating || 4.8, p.reviewCount || 0, p.image || '',
            p.shortDescription || '', p.description || '', JSON.stringify(p.features || []),
            JSON.stringify(p.components || []), JSON.stringify(p.budgetBreakdown || []),
            JSON.stringify(p.wiringGuide || []), p.firmwareCode || '', JSON.stringify(p.libraries || []),
            JSON.stringify(p.testingProcedure || []), JSON.stringify(p.troubleshooting || []),
            JSON.stringify(p.safetyPrecautions || []), JSON.stringify(p.demoTelemetryConfig || {}),
            p.isDemo ? 1 : 0, p.active ? 1 : 0
          );
        }
        console.log(`✅ Seeded ${initialIotProjects.length} IoT & Embedded Systems Projects successfully.`);
      }).catch(err => {
        console.error('Error seeding IoT projects:', err);
      });
    }

    // Orders tracking migrations
    const ordersCols = db.prepare("PRAGMA table_info(orders)").all();
    const hasPaymentStatus = ordersCols.some(c => c.name === 'paymentStatus');
    const hasUpdatedAt = ordersCols.some(c => c.name === 'updatedAt');
    const hasEstimatedDelivery = ordersCols.some(c => c.name === 'estimatedDelivery');
    const hasTrackingNumber = ordersCols.some(c => c.name === 'trackingNumber');
    const hasDeliveryNote = ordersCols.some(c => c.name === 'deliveryNote');
    
    if (!hasPaymentStatus) db.prepare("ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT 'pending'").run();
    if (!hasUpdatedAt) db.prepare("ALTER TABLE orders ADD COLUMN updatedAt TEXT").run();
    if (!hasEstimatedDelivery) db.prepare("ALTER TABLE orders ADD COLUMN estimatedDelivery TEXT").run();
    if (!hasTrackingNumber) db.prepare("ALTER TABLE orders ADD COLUMN trackingNumber TEXT").run();
    if (!hasDeliveryNote) db.prepare("ALTER TABLE orders ADD COLUMN deliveryNote TEXT").run();

    // Live tracking migrations
    const hasDeliveryLat = ordersCols.some(c => c.name === 'delivery_lat');
    const hasDeliveryLng = ordersCols.some(c => c.name === 'delivery_lng');
    if (!hasDeliveryLat) db.prepare("ALTER TABLE orders ADD COLUMN delivery_lat REAL").run();
    if (!hasDeliveryLng) db.prepare("ALTER TABLE orders ADD COLUMN delivery_lng REAL").run();

    // Notifications migration
    const notifCols = db.prepare("PRAGMA table_info(notifications)").all();
    const hasOrderId = notifCols.some(c => c.name === 'orderId');
    const hasTitle = notifCols.some(c => c.name === 'title');
    
    if (!hasOrderId) db.prepare("ALTER TABLE notifications ADD COLUMN orderId TEXT").run();
    if (!hasTitle) db.prepare("ALTER TABLE notifications ADD COLUMN title TEXT NOT NULL DEFAULT 'Notification'").run();

    // Users profile migration
    const usersCols = db.prepare("PRAGMA table_info(users)").all();
    const hasPhone = usersCols.some(c => c.name === 'phone');
    const hasCollege = usersCols.some(c => c.name === 'college');
    const hasAddress = usersCols.some(c => c.name === 'address');

    if (!hasPhone) db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
    if (!hasCollege) db.prepare("ALTER TABLE users ADD COLUMN college TEXT").run();
    if (!hasAddress) db.prepare("ALTER TABLE users ADD COLUMN address TEXT").run();

    console.log('Database schemas verified/migrated successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  }

  console.log('Database initialized successfully.');
}

initDb();

export default db;
