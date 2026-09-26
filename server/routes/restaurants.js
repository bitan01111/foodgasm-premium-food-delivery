const express = require('express');
const router = express.Router();
const db = require('../db');

// Calculate Haversine Distance in Kilometers
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

// GET /api/restaurants
router.get('/', (req, res) => {
  try {
    const {
      city,
      category,
      type,
      search,
      is_veg,
      lat,
      lng,
      sort
    } = req.query;

    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params = [];

    if (city && city !== 'All') {
      query += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (is_veg === '1' || is_veg === 'true') {
      query += ' AND is_veg = 1';
    }

    if (search) {
      query += ` AND (
        name LIKE ? OR
        cuisine LIKE ? OR
        address LIKE ? OR
        id IN (SELECT restaurant_id FROM menu_items WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?)
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    let rows = db.prepare(query).all(...params);

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasCoordinates = !isNaN(userLat) && !isNaN(userLng);

    // Compute live distance, ETA, and delivery fee
    rows = rows.map((r) => {
      let distanceKm = 1.8; // default fallback distance
      if (hasCoordinates && r.lat && r.lng) {
        distanceKm = getHaversineDistance(userLat, userLng, r.lat, r.lng);
      }

      // Dynamic ETA based on distance
      const minEta = Math.max(12, Math.round(15 + distanceKm * 4));
      const maxEta = minEta + 10;
      const dynamicEta = `${minEta}-${maxEta} min`;

      // Dynamic Delivery Fee based on distance
      let fee = 0;
      if (distanceKm > 1) {
        fee = Math.round(20 + (distanceKm - 1) * 8);
      }
      if (r.avg_cost_for_two > 600 && distanceKm < 3) {
        fee = 0; // Free delivery promo
      }

      return {
        ...r,
        distance_km: distanceKm,
        distance: `${distanceKm} km`,
        delivery_time: dynamicEta,
        delivery_fee: fee,
        is_veg: Boolean(r.is_veg),
        is_open: Boolean(r.is_open)
      };
    });

    // Sort order
    if (sort === 'distance' && hasCoordinates) {
      rows.sort((a, b) => a.distance_km - b.distance_km);
    } else if (sort === 'rating') {
      rows.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'cost_low') {
      rows.sort((a, b) => a.avg_cost_for_two - b.avg_cost_for_two);
    } else if (sort === 'cost_high') {
      rows.sort((a, b) => b.avg_cost_for_two - a.avg_cost_for_two);
    } else {
      // Default: prioritize distance if user has coordinates, otherwise rating
      if (hasCoordinates) {
        rows.sort((a, b) => a.distance_km - b.distance_km);
      } else {
        rows.sort((a, b) => b.rating - a.rating);
      }
    }

    res.json({
      count: rows.length,
      city: city || 'Pan-India',
      restaurants: rows
    });
  } catch (err) {
    console.error('[Restaurants.getAll]', err);
    res.status(500).json({ error: 'Failed to retrieve restaurants' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get menu items
    const rawItems = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, rating DESC').all(restaurant.id);
    const menuItems = rawItems.map((item) => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      is_veg: Boolean(item.is_veg),
      is_available: Boolean(item.is_available)
    }));

    // Group items by category
    const categories = {};
    for (const item of menuItems) {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    }

    // Get reviews
    const reviews = db.prepare('SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 10').all(restaurant.id);

    res.json({
      restaurant: {
        ...restaurant,
        is_veg: Boolean(restaurant.is_veg),
        is_open: Boolean(restaurant.is_open)
      },
      menu: categories,
      allItems: menuItems,
      reviews
    });
  } catch (err) {
    console.error('[Restaurants.getOne]', err);
    res.status(500).json({ error: 'Failed to retrieve restaurant details' });
  }
});

module.exports = router;
