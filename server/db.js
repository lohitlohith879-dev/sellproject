import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'circuitkart.db');

// Create a new database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema if it doesn't exist
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
      items TEXT NOT NULL, -- JSON string of cart items
      total REAL NOT NULL,
      status TEXT DEFAULT 'received',
      date TEXT NOT NULL,
      contactInfo TEXT, -- JSON string
      shippingInfo TEXT, -- JSON string
      paymentMethod TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
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
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER, -- NULL means global admin notification
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `;
  
  db.exec(initSql);
  console.log('Database initialized successfully.');
}

// Ensure the db is initialized
initDb();

export default db;
