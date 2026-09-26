const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ai/cravings
router.post('/cravings', (req, res) => {
  try {
    const { mood, query } = req.body;

    let itemsQuery = `
      SELECT m.*, r.name as restaurant_name, r.city as restaurant_city, r.rating as restaurant_rating
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    const normalized = (mood || query || '').toLowerCase();

    if (normalized.includes('protein') || normalized.includes('gym') || normalized.includes('fitness')) {
      itemsQuery += ' AND m.protein >= 30 ORDER BY m.protein DESC LIMIT 6';
    } else if (normalized.includes('budget') || normalized.includes('under 199') || normalized.includes('cheap')) {
      itemsQuery += ' AND m.price <= 199 ORDER BY m.rating DESC LIMIT 6';
    } else if (normalized.includes('late night') || normalized.includes('midnight') || normalized.includes('study')) {
      itemsQuery += ' AND (m.category IN ("Biryani", "Rolls", "Mughlai") OR m.name LIKE "%Roll%" OR m.name LIKE "%Biryani%") ORDER BY m.rating DESC LIMIT 6';
    } else if (normalized.includes('rain') || normalized.includes('tea') || normalized.includes('chai') || normalized.includes('snack')) {
      itemsQuery += ' AND (m.category IN ("Beverages", "Irani Specials", "Tea & Snacks") OR m.name LIKE "%Chai%" OR m.name LIKE "%Maska%") ORDER BY m.rating DESC LIMIT 6';
    } else if (normalized.includes('sweet') || normalized.includes('dessert') || normalized.includes('chocolate')) {
      itemsQuery += ' AND (m.category IN ("Desserts", "Signature Sundaes", "Pastries", "Bakery") OR m.name LIKE "%Chocolate%") ORDER BY m.rating DESC LIMIT 6';
    } else if (normalized.includes('south') || normalized.includes('dosa') || normalized.includes('idli')) {
      itemsQuery += ' AND (m.category IN ("Tiffins", "South Indian", "Street Dosas") OR m.name LIKE "%Dosa%" OR m.name LIKE "%Idli%") ORDER BY m.rating DESC LIMIT 6';
    } else if (normalized.includes('veg')) {
      itemsQuery += ' AND m.is_veg = 1 ORDER BY m.rating DESC LIMIT 6';
    } else {
      // General smart recommendation
      itemsQuery += ' ORDER BY m.rating DESC, m.reviews DESC LIMIT 6';
    }

    const recommendations = db.prepare(itemsQuery).all(...params).map(it => ({
      ...it,
      tags: it.tags ? JSON.parse(it.tags) : [],
      is_veg: Boolean(it.is_veg)
    }));

    let message = `Here are our chef-curated top picks for "${mood || query}":`;
    if (normalized.includes('protein')) message = `💪 High-Protein Fuel: Found dishes with 30g+ protein per serving!`;
    if (normalized.includes('budget')) message = `💰 Student Budget Picks: Top-rated comfort food under ₹199!`;
    if (normalized.includes('rain')) message = `🌧️ Rainy Day Specials: Steaming hot chai and fresh buttery snacks!`;
    if (normalized.includes('sweet')) message = `🍫 Sweet Tooth Alert: Legendary sundaes, pastries & desserts!`;

    res.json({
      mood: mood || query || 'General',
      message,
      recommendations
    });
  } catch (err) {
    console.error('[AI.cravings]', err);
    res.status(500).json({ error: 'AI recommendation error' });
  }
});

module.exports = router;
