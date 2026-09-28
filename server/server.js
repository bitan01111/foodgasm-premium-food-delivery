const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure database is initialized
const db = require('./db');
const seedDatabase = require('./seed');

// Run seed if restaurants table is empty
const restCount = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
if (!restCount || restCount.count === 0) {
  seedDatabase();
}

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Foodgasm API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets from project root
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

// Global error handler (e.g. malformed JSON)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// SPA Catch-all: serve index.html for any unhandled routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🍔 FOODGASM 2.0 FULL-STACK SERVER RUNNING!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`📡 API Base:   http://localhost:${PORT}/api`);
  console.log(`💾 Database:   SQLite (Embedded & Pre-seeded)`);
  console.log(`🇮🇳 Restaurants: Authentic Pan-India & Street Carts`);
  console.log(`==================================================\n`);
});

module.exports = app;
