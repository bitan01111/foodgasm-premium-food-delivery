const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/coupons (List active coupons)
router.get('/', (req, res) => {
  try {
    const coupons = db.prepare('SELECT code, discount_type, discount_value, min_order, max_discount, description FROM coupons WHERE is_active = 1').all();
    res.json({ coupons });
  } catch (err) {
    console.error('[Coupons.getAll]', err);
    res.status(500).json({ error: 'Failed to retrieve coupons' });
  }
});

// POST /api/coupons/validate
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal == null) {
      return res.status(400).json({ error: 'Code and subtotal are required' });
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase().trim());
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const numSubtotal = parseFloat(subtotal) || 0;
    if (numSubtotal < coupon.min_order) {
      return res.status(400).json({
        error: `Order minimum of ₹${coupon.min_order} required for coupon ${coupon.code}`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = Math.min((numSubtotal * coupon.discount_value) / 100, coupon.max_discount);
    } else {
      discount = Math.min(coupon.discount_value, numSubtotal);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount: Math.round(discount),
      message: `Coupon ${coupon.code} applied! Saved ₹${Math.round(discount)}`
    });
  } catch (err) {
    console.error('[Coupons.validate]', err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
