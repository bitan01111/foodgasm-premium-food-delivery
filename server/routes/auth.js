const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'foodgasm_super_secret_jwt_key_2026';

// Helper to generate token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware: Authenticate JWT
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role === 'restaurant_owner' || role === 'delivery_partner' || role === 'admin' ? role : 'customer';

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      phone || '',
      userRole,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    );

    const user = { id, name: name.trim(), email: email.toLowerCase().trim(), role: userRole };
    const token = generateToken(user);

    res.status(201).json({ user, token, message: 'Account created successfully' });
  } catch (err) {
    console.error('[Auth.register]', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('[Auth.login]', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/demo-login/:role (Instant 1-Click Recruiter Demo Access)
router.get('/demo-login/:role', (req, res) => {
  try {
    const role = req.params.role;
    const roleMap = {
      customer: 'customer@foodgasm.com',
      owner: 'owner@foodgasm.com',
      rider: 'rider@foodgasm.com',
      admin: 'admin@foodgasm.com'
    };

    const targetEmail = roleMap[role];
    if (!targetEmail) {
      return res.status(400).json({ error: 'Invalid demo role. Choose customer, owner, rider, or admin.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
    if (!user) {
      return res.status(404).json({ error: 'Demo user not seeded' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      },
      message: `Logged in as Demo ${user.role.replace('_', ' ').toUpperCase()}`
    });
  } catch (err) {
    console.error('[Auth.demo-login]', err);
    res.status(500).json({ error: 'Demo login error' });
  }
});

// POST /api/auth/google (Google One-Tap / OAuth sign-in)
router.post('/google', (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      const id = 'usr_g_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const userName = name ? name.trim() : cleanEmail.split('@')[0];
      const userAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, phone, role, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userName,
        cleanEmail,
        'oauth_google_login',
        '',
        'customer',
        userAvatar
      );
      user = { id, name: userName, email: cleanEmail, role: 'customer', avatar: userAvatar };
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar
      },
      message: `Signed in with Google as ${user.name}! 🚀`
    });
  } catch (err) {
    console.error('[Auth.google]', err);
    res.status(500).json({ error: 'Google authentication error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(user.id);
    res.json({ user, addresses });
  } catch (err) {
    console.error('[Auth.me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, requireAuth, JWT_SECRET };
