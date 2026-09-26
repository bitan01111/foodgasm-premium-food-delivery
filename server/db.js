const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'foodgasm.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      cuisine TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT DEFAULT 'restaurant',
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      img TEXT NOT NULL,
      rating REAL DEFAULT 4.5,
      reviews_count INTEGER DEFAULT 120,
      delivery_time TEXT DEFAULT '25-35',
      avg_cost_for_two INTEGER DEFAULT 350,
      badge TEXT,
      offer TEXT,
      is_veg INTEGER DEFAULT 0,
      is_open INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      rating REAL DEFAULT 4.5,
      reviews INTEGER DEFAULT 50,
      is_veg INTEGER DEFAULT 1,
      img TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT DEFAULT 'Home',
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      postal_code TEXT,
      lat REAL,
      lng REAL,
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      restaurant_name TEXT NOT NULL,
      status TEXT DEFAULT 'placed',
      payment_status TEXT DEFAULT 'pending',
      payment_method TEXT DEFAULT 'cod',
      payment_id TEXT,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      coupon_code TEXT,
      delivery_address TEXT NOT NULL,
      special_notes TEXT,
      rider_name TEXT,
      rider_phone TEXT,
      current_lat REAL,
      current_lng REAL,
      dest_lat REAL,
      dest_lng REAL,
      created_at TEXT DEFAULT (datetime('now')),
      estimated_delivery_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      is_veg INTEGER DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_discount REAL DEFAULT 999,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
    CREATE INDEX IF NOT EXISTS idx_restaurants_cat ON restaurants(category);
    CREATE INDEX IF NOT EXISTS idx_menu_items_rest ON menu_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);
}

initSchema();

module.exports = db;
