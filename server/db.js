import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'circuitkart.db');

const rawDb = new DatabaseSync(dbPath);

function wrapStatement(stmt) {
  return {
    run(...args) {
      if (args.length === 1 && Array.isArray(args[0])) return stmt.run(...args[0]);
      return stmt.run(...args);
    },
    get(...args) {
      if (args.length === 1 && Array.isArray(args[0])) return stmt.get(...args[0]);
      return stmt.get(...args);
    },
    all(...args) {
      if (args.length === 1 && Array.isArray(args[0])) return stmt.all(...args[0]);
      return stmt.all(...args);
    }
  };
}

const origPrepare = rawDb.prepare.bind(rawDb);
rawDb.prepare = (sql) => wrapStatement(origPrepare(sql));
rawDb.pragma = (sql) => {
  try {
    return rawDb.prepare('PRAGMA ' + sql).all();
  } catch {
    return rawDb.exec('PRAGMA ' + sql);
  }
};
rawDb.transaction = (fn) => (...args) => {
  rawDb.exec('BEGIN IMMEDIATE');
  try {
    const res = fn(...args);
    rawDb.exec('COMMIT');
    return res;
  } catch (err) {
    rawDb.exec('ROLLBACK');
    throw err;
  }
};

const db = rawDb;
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

    CREATE TABLE IF NOT EXISTS user_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      pincode TEXT NOT NULL,
      locality TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      landmark TEXT,
      alternatePhone TEXT,
      type TEXT DEFAULT 'HOME',
      isDefault INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      projectId TEXT NOT NULL,
      projectType TEXT DEFAULT 'regular',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, projectId)
    );

    CREATE TABLE IF NOT EXISTS user_payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      maskedNumber TEXT NOT NULL,
      expiry TEXT,
      holderName TEXT,
      isDefault INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_dashboards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT,
      shortDescription TEXT,
      coverImage TEXT,
      screenshots TEXT,
      hardwareComponents TEXT,
      technologies TEXT,
      status TEXT DEFAULT 'Completed',
      githubUrl TEXT,
      demoVideoUrl TEXT,
      liveWebsiteUrl TEXT,
      overview TEXT,
      problemStatement TEXT,
      proposedSolution TEXT,
      componentList TEXT,
      circuitDiagram TEXT,
      workingPrinciple TEXT,
      results TEXT,
      features TEXT,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hardware_components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      priceType TEXT DEFAULT 'Estimated',
      lastVerified TEXT,
      inStock INTEGER DEFAULT 1,
      stockCount INTEGER DEFAULT 20,
      rating REAL DEFAULT 4.5,
      reviewCount INTEGER DEFAULT 25,
      image TEXT NOT NULL,
      gallery TEXT,
      voltage TEXT,
      current TEXT,
      interface TEXT,
      keySpecs TEXT,
      pinoutDiagram TEXT,
      pinConnections TEXT,
      workingPrinciple TEXT,
      applications TEXT,
      compatibility TEXT,
      exampleCode TEXT,
      datasheetUrl TEXT,
      retailers TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `;

  db.exec(initSql);

  try {
    // Seed initial Hardware Components Explorer
    const hwCount = db.prepare('SELECT COUNT(*) as count FROM hardware_components').get().count;
    if (hwCount === 0) {
      import('./hardwareComponentsSeed.js').then(({ initialHardwareComponents }) => {
        const insertStmt = db.prepare(`
          INSERT INTO hardware_components (
            id, name, model, category, price, mrp, priceType, lastVerified,
            inStock, stockCount, rating, reviewCount, image, gallery,
            voltage, current, interface, keySpecs, pinoutDiagram, pinConnections,
            workingPrinciple, applications, compatibility, exampleCode,
            datasheetUrl, retailers
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?
          )
        `);

        for (const c of initialHardwareComponents) {
          insertStmt.run(
            c.id, c.name, c.model || '', c.category, c.price, c.mrp, c.priceType || 'Estimated', c.lastVerified || '',
            c.inStock ? 1 : 0, c.stockCount || 20, c.rating || 4.5, c.reviewCount || 20, c.image, JSON.stringify(c.gallery || []),
            c.voltage || '', c.current || '', c.interface || '', JSON.stringify(c.keySpecs || {}), c.pinoutDiagram || '', JSON.stringify(c.pinConnections || []),
            c.workingPrinciple || '', JSON.stringify(c.applications || []), JSON.stringify(c.compatibility || {}), c.exampleCode || '',
            c.datasheetUrl || '', JSON.stringify(c.retailers || [])
          );
        }
        console.log(`✅ Seeded ${initialHardwareComponents.length} Genuine Hardware Components successfully.`);
      }).catch(err => {
        console.error('Error seeding hardware components:', err);
      });
    }

    // Seed initial Project Dashboards (IoT and Web Development)
    const dashCount = db.prepare('SELECT COUNT(*) as count FROM project_dashboards').get().count;
    if (dashCount === 0) {
      import('./projectDashboardsSeed.js').then(({ initialProjectDashboards }) => {
        const insertStmt = db.prepare(`
          INSERT INTO project_dashboards (
            id, title, slug, category, subcategory, description, shortDescription,
            coverImage, screenshots, hardwareComponents, technologies, status,
            githubUrl, demoVideoUrl, liveWebsiteUrl, overview, problemStatement,
            proposedSolution, componentList, circuitDiagram, workingPrinciple,
            results, features, published
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `);

        for (const p of initialProjectDashboards) {
          insertStmt.run(
            p.id, p.title, p.slug, p.category, p.subcategory || '', p.description || '', p.shortDescription || '',
            p.coverImage || '', p.screenshots || '[]', p.hardwareComponents || '', p.technologies || '[]',
            p.status || 'Completed', p.githubUrl || '', p.demoVideoUrl || '', p.liveWebsiteUrl || '',
            p.overview || '', p.problemStatement || '', p.proposedSolution || '', p.componentList || '[]',
            p.circuitDiagram || '', p.workingPrinciple || '', p.results || '', p.features || '[]',
            p.published !== undefined ? p.published : 1
          );
        }
        console.log(`✅ Seeded ${initialProjectDashboards.length} Project Dashboards (IoT & Web) successfully.`);
      }).catch(err => {
        console.error('Error seeding project dashboards:', err);
      });
    }

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
    const hasGender = usersCols.some(c => c.name === 'gender');
    const hasDob = usersCols.some(c => c.name === 'dob');
    const hasAvatar = usersCols.some(c => c.name === 'avatar');
    const hasPhoneVerified = usersCols.some(c => c.name === 'phone_verified');
    const hasMembership = usersCols.some(c => c.name === 'membership');

    if (!hasPhone) db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
    if (!hasCollege) db.prepare("ALTER TABLE users ADD COLUMN college TEXT").run();
    if (!hasAddress) db.prepare("ALTER TABLE users ADD COLUMN address TEXT").run();
    if (!hasGender) db.prepare("ALTER TABLE users ADD COLUMN gender TEXT").run();
    if (!hasDob) db.prepare("ALTER TABLE users ADD COLUMN dob TEXT").run();
    if (!hasAvatar) db.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run();
    if (!hasPhoneVerified) db.prepare("ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 1").run();
    if (!hasMembership) db.prepare("ALTER TABLE users ADD COLUMN membership TEXT DEFAULT 'Plus Member'").run();

    console.log('Database schemas verified/migrated successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  }

  console.log('Database initialized successfully.');
}

initDb();

export default db;
