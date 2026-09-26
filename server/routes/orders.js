const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('./auth');

// Helper to interpolate rider coordinates between restaurant and customer
function interpolatePosition(startLat, startLng, endLat, endLng, fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  return {
    lat: Math.round((startLat + (endLat - startLat) * f) * 10000) / 10000,
    lng: Math.round((startLng + (endLng - startLng) * f) * 10000) / 10000
  };
}

// POST /api/orders (Create Order)
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      restaurant_id,
      items,
      address,
      payment_method,
      coupon_code,
      special_notes,
      dest_lat,
      dest_lng
    } = req.body;

    if (!restaurant_id || !items || !items.length || !address) {
      return res.status(400).json({ error: 'Missing required order fields (restaurant, items, address)' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Selected restaurant was not found' });
    }

    // Verify and compute items total server-side (tamper-proof!)
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    const getMenuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?');
    for (const it of items) {
      const dbItem = getMenuItem.get(it.id || it.menu_item_id);
      if (dbItem) {
        const qty = Math.max(1, parseInt(it.quantity) || 1);
        calculatedSubtotal += dbItem.price * qty;
        verifiedItems.push({
          menu_item_id: dbItem.id,
          name: dbItem.name,
          price: dbItem.price,
          quantity: qty,
          is_veg: dbItem.is_veg
        });
      }
    }

    if (!verifiedItems.length) {
      return res.status(400).json({ error: 'No valid menu items in cart' });
    }

    // Validate Coupon if provided
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(coupon_code.toUpperCase().trim());
      if (coupon && calculatedSubtotal >= coupon.min_order) {
        if (coupon.discount_type === 'percent') {
          discountAmount = Math.min((calculatedSubtotal * coupon.discount_value) / 100, coupon.max_discount);
        } else {
          discountAmount = Math.min(coupon.discount_value, calculatedSubtotal);
        }
      }
    }

    // Taxes & Delivery Calculation
    const taxAmount = Math.round(calculatedSubtotal * 0.05); // 5% GST
    const deliveryFee = calculatedSubtotal > 500 ? 0 : 35; // Free over 500
    const totalAmount = Math.max(0, Math.round(calculatedSubtotal + taxAmount + deliveryFee - discountAmount));

    const orderId = 'ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const orderStatus = 'placed';
    const paymentStatus = payment_method === 'cod' ? 'pending' : 'paid';

    // Estimated delivery in 30 mins
    const estimatedDelivery = new Date(Date.now() + 30 * 60000).toISOString();

    const customerLat = parseFloat(dest_lat) || (restaurant.lat + 0.015);
    const customerLng = parseFloat(dest_lng) || (restaurant.lng + 0.018);

    db.prepare(`
      INSERT INTO orders (
        id, user_id, restaurant_id, restaurant_name, status, payment_status,
        payment_method, payment_id, subtotal, delivery_fee, tax_amount,
        discount_amount, total_amount, coupon_code, delivery_address,
        special_notes, rider_name, rider_phone, current_lat, current_lng,
        dest_lat, dest_lng, estimated_delivery_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      req.user.id,
      restaurant.id,
      restaurant.name,
      orderStatus,
      paymentStatus,
      payment_method || 'cod',
      payment_method === 'cod' ? null : `pay_${Date.now()}`,
      calculatedSubtotal,
      deliveryFee,
      taxAmount,
      discountAmount,
      totalAmount,
      coupon_code || null,
      address,
      special_notes || null,
      'Vikram Singh (Rider)',
      '+91 9876543212',
      restaurant.lat,
      restaurant.lng,
      customerLat,
      customerLng,
      estimatedDelivery
    );

    // Insert order items
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, is_veg)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vi of verifiedItems) {
      const oiId = 'oi_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      insertOrderItem.run(oiId, orderId, vi.menu_item_id, vi.name, vi.price, vi.quantity, vi.is_veg);
    }

    res.status(201).json({
      orderId,
      status: orderStatus,
      totalAmount,
      message: 'Order placed successfully! 🎉'
    });
  } catch (err) {
    console.error('[Orders.create]', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders (User's order history)
router.get('/', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.img as restaurant_img
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map((o) => ({
      ...o,
      items: getItems.all(o.id)
    }));

    res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error('[Orders.getAll]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id/track (Real-time Live Radar & Rider Simulation)
router.get('/:id/track', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, r.lat as rest_lat, r.lng as rest_lng, r.address as rest_address, r.name as rest_name
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Determine lifecycle state based on elapsed minutes from creation
    const createdTime = new Date(order.created_at).getTime();
    const elapsedMinutes = Math.max(0, (Date.now() - createdTime) / 60000);

    let simulatedStatus = order.status;
    let fraction = 0;

    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      if (elapsedMinutes < 0.5) {
        simulatedStatus = 'placed';
        fraction = 0;
      } else if (elapsedMinutes < 1.5) {
        simulatedStatus = 'confirmed';
        fraction = 0.05;
      } else if (elapsedMinutes < 3) {
        simulatedStatus = 'preparing';
        fraction = 0.15;
      } else if (elapsedMinutes < 7) {
        simulatedStatus = 'out_for_delivery';
        fraction = Math.min(0.95, 0.2 + (elapsedMinutes - 3) * 0.2);
      } else {
        simulatedStatus = 'delivered';
        fraction = 1;
      }
    } else if (order.status === 'delivered') {
      fraction = 1;
    }

    const startLat = order.rest_lat;
    const startLng = order.rest_lng;
    const destLat = order.dest_lat || (startLat + 0.015);
    const destLng = order.dest_lng || (startLng + 0.018);

    const riderPos = interpolatePosition(startLat, startLng, destLat, destLng, fraction);

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({
      orderId: order.id,
      status: simulatedStatus,
      fraction,
      restaurant: {
        id: order.restaurant_id,
        name: order.rest_name,
        lat: startLat,
        lng: startLng,
        address: order.rest_address
      },
      customer: {
        address: order.delivery_address,
        lat: destLat,
        lng: destLng
      },
      rider: {
        name: order.rider_name || 'Vikram Singh',
        phone: order.rider_phone || '+91 9876543212',
        lat: riderPos.lat,
        lng: riderPos.lng
      },
      total: order.total_amount,
      items,
      createdAt: order.created_at,
      estimatedDelivery: order.estimated_delivery_at
    });
  } catch (err) {
    console.error('[Orders.track]', err);
    res.status(500).json({ error: 'Tracking unavailable' });
  }
});

// PATCH /api/orders/:id/status (Admin / Restaurant Owner / Delivery Partner control)
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, status });
  } catch (err) {
    console.error('[Orders.updateStatus]', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
