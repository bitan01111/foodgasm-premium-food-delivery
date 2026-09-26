const db = require('./db');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  console.log('[Seed] Seeding authentic Indian restaurants, street carts, and menu items...');

  // 1. Seed Users
  const passwordHash = bcrypt.hashSync('foodgasm123', 10);
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, phone, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr_customer', 'Aditya Roy', 'customer@foodgasm.com', passwordHash, '+91 9876543210', 'customer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop');
  insertUser.run('usr_owner', 'Rajesh Sharma', 'owner@foodgasm.com', passwordHash, '+91 9876543211', 'restaurant_owner', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop');
  insertUser.run('usr_rider', 'Vikram Singh', 'rider@foodgasm.com', passwordHash, '+91 9876543212', 'delivery_partner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop');
  insertUser.run('usr_admin', 'Bitan Chakraborty', 'admin@foodgasm.com', passwordHash, '+91 8910542451', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop');

  // 2. Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, min_order, max_discount, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCoupon.run('WELCOME50', 'percent', 50, 199, 120, '50% OFF up to ₹120 on your first order', 1);
  insertCoupon.run('FOODGASM', 'percent', 25, 299, 150, 'Flat 25% OFF on premium restaurants', 1);
  insertCoupon.run('STREETBITE', 'flat', 40, 149, 40, 'Flat ₹40 OFF on all street food carts', 1);
  insertCoupon.run('HUNGRY', 'percent', 20, 399, 200, '20% OFF on party orders above ₹399', 1);

  // 3. Authentic Indian Restaurants & Food Carts Across Metros
  const RESTAURANTS = [
    // --- KOLKATA ---
    {
      id: 'res_peter_cat',
      name: 'Peter Cat',
      slug: 'peter-cat-park-street-kolkata',
      cuisine: 'Continental · Mughlai · Sizzlers',
      category: 'indian',
      type: 'restaurant',
      city: 'Kolkata',
      address: '18A, Park Street, Kolkata',
      lat: 22.5519, lng: 88.3526,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 5420, delivery_time: '25-35', avg_cost_for_two: 800,
      badge: 'Iconic Heritage', offer: 'Legendary Chelo Kebab with butter rice', is_veg: 0
    },
    {
      id: 'res_arsalan',
      name: 'Arsalan Restaurant',
      slug: 'arsalan-park-circus-kolkata',
      cuisine: 'Kolkata Biryani · Mughlai · Tandoori',
      category: 'biryani',
      type: 'restaurant',
      city: 'Kolkata',
      address: '191, Marina Park Circus 7-Point, Kolkata',
      lat: 22.5414, lng: 88.3664,
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 8940, delivery_time: '20-30', avg_cost_for_two: 600,
      badge: 'City Bestseller', offer: 'Free aromatic Phirni on orders above ₹499', is_veg: 0
    },
    {
      id: 'res_kusum_rolls',
      name: 'Kusum Rolls (Street Cart)',
      slug: 'kusum-rolls-park-street-kolkata',
      cuisine: 'Kolkata Kathi Rolls · Street Bites',
      category: 'street_food',
      type: 'street_cart',
      city: 'Kolkata',
      address: '21 Park Street, Near Karnani Mansion, Kolkata',
      lat: 22.5528, lng: 88.3533,
      img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=500&h=300&fit=crop',
      rating: 4.6, reviews_count: 3200, delivery_time: '15-20', avg_cost_for_two: 200,
      badge: 'Street Hero', offer: 'Double Egg Chicken Kathi Roll @ ₹99', is_veg: 0
    },
    {
      id: 'res_flurys',
      name: 'Flurys Tea Room',
      slug: 'flurys-tea-room-kolkata',
      cuisine: 'European Cafe · Pastries · English Breakfast',
      category: 'desserts',
      type: 'cafe',
      city: 'Kolkata',
      address: '18, Park Street, Mullick Bazar, Kolkata',
      lat: 22.5521, lng: 88.3524,
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 4120, delivery_time: '25-35', avg_cost_for_two: 700,
      badge: 'Since 1927', offer: 'Complimentary Rum Ball with any Specialty Tea', is_veg: 0
    },

    // --- DELHI NCR ---
    {
      id: 'res_karims',
      name: "Karim's Old Delhi",
      slug: 'karims-jama-masjid-delhi',
      cuisine: 'Mughlai · Nihari · Mutton Burra · Kebabs',
      category: 'indian',
      type: 'restaurant',
      city: 'Delhi NCR',
      address: 'Gali Kababian, Jama Masjid, Old Delhi',
      lat: 28.6507, lng: 77.2334,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 12500, delivery_time: '30-40', avg_cost_for_two: 750,
      badge: 'Historic 1913', offer: 'Traditional Mutton Nihari with Khamiri Roti', is_veg: 0
    },
    {
      id: 'res_moti_mahal',
      name: 'Moti Mahal Delux',
      slug: 'moti-mahal-daryaganj-delhi',
      cuisine: 'Original Butter Chicken · Dal Makhani · Tandoor',
      category: 'indian',
      type: 'restaurant',
      city: 'Delhi NCR',
      address: '3704, Netaji Subhash Marg, Daryaganj, New Delhi',
      lat: 28.6475, lng: 77.2405,
      img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&h=300&fit=crop',
      rating: 4.6, reviews_count: 6700, delivery_time: '25-35', avg_cost_for_two: 700,
      badge: 'Birthplace of Butter Chicken', offer: '20% OFF on Classic Butter Chicken Handi', is_veg: 0
    },
    {
      id: 'res_paranthe_cart',
      name: 'Pandit Gaya Prasad Paranthe Wale (Cart)',
      slug: 'pandit-gaya-prasad-paranthe-delhi',
      cuisine: 'Fried Stuffed Paranthas · Rabri · Street Bites',
      category: 'street_food',
      type: 'street_cart',
      city: 'Delhi NCR',
      address: 'Paranthe Wali Gali, Chandni Chowk, Delhi',
      lat: 28.6562, lng: 77.2307,
      img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&h=300&fit=crop',
      rating: 4.5, reviews_count: 4800, delivery_time: '20-30', avg_cost_for_two: 250,
      badge: 'Heritage Cart', offer: 'Assorted 3-Parantha Combo with Kaddu ki Subzi', is_veg: 1
    },
    {
      id: 'res_saravana_bhavan',
      name: 'Saravana Bhavan',
      slug: 'saravana-bhavan-cp-delhi',
      cuisine: 'Authentic South Indian · Ghee Roast Dosa · Filter Coffee',
      category: 'healthy',
      type: 'restaurant',
      city: 'Delhi NCR',
      address: 'P-15, Connaught Circus, New Delhi',
      lat: 28.6318, lng: 77.2177,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
      rating: 4.6, reviews_count: 8100, delivery_time: '15-25', avg_cost_for_two: 450,
      badge: 'Pure Veg', offer: 'Special South Indian Thali @ ₹249', is_veg: 1
    },

    // --- MUMBAI ---
    {
      id: 'res_britannia',
      name: 'Britannia & Co. Restaurant',
      slug: 'britannia-co-ballard-estate-mumbai',
      cuisine: 'Parsi · Berry Pulao · Sali Boti · Caramel Custard',
      category: 'indian',
      type: 'restaurant',
      city: 'Mumbai',
      address: 'Wakefield House, 11 Sprott Rd, Ballard Estate, Mumbai',
      lat: 18.9351, lng: 72.8398,
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 4900, delivery_time: '30-40', avg_cost_for_two: 850,
      badge: 'Legendary Parsi', offer: 'Signature Mutton Berry Pulao with Fried Onions', is_veg: 0
    },
    {
      id: 'res_bademiya',
      name: 'Bademiya Seekh Kebab Cart',
      slug: 'bademiya-colaba-mumbai',
      cuisine: 'Street Kebabs · Baida Roti · Rolls',
      category: 'street_food',
      type: 'street_cart',
      city: 'Mumbai',
      address: 'Tulloch Rd, Behind Taj Mahal Hotel, Apollo Bandar, Colaba, Mumbai',
      lat: 18.9218, lng: 72.8327,
      img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=300&fit=crop',
      rating: 4.5, reviews_count: 9800, delivery_time: '20-30', avg_cost_for_two: 350,
      badge: 'Night Owl Cart', offer: 'Chicken Baida Roti + Seekh Kebab Roll Combo', is_veg: 0
    },
    {
      id: 'res_kyani',
      name: 'Kyani & Co. Irani Cafe',
      slug: 'kyani-co-marine-lines-mumbai',
      cuisine: 'Irani Chai · Bun Maska · Kheema Pav · Mawa Cake',
      category: 'drinks',
      type: 'cafe',
      city: 'Mumbai',
      address: 'Jermahal Estate, 657, JSS Rd, Marine Lines, Mumbai',
      lat: 18.9439, lng: 72.8277,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
      rating: 4.6, reviews_count: 5300, delivery_time: '15-20', avg_cost_for_two: 250,
      badge: 'Est. 1904', offer: 'Double Irani Chai + Mawa Cake for ₹99', is_veg: 0
    },
    {
      id: 'res_anand_dosa',
      name: 'Anand Dosa Stall (Mithibai Cart)',
      slug: 'anand-dosa-vile-parle-mumbai',
      cuisine: 'Gourmet Dosas · Jinny Dosa · Pizza Dosa · Pav Bhaji',
      category: 'street_food',
      type: 'street_cart',
      city: 'Mumbai',
      address: 'Opp. Mithibai College, Gulmohar Cross Rd, Vile Parle West, Mumbai',
      lat: 19.1032, lng: 72.8368,
      img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 6200, delivery_time: '15-25', avg_cost_for_two: 250,
      badge: 'College Craze', offer: 'Loaded Cheesy Jinny Dosa @ ₹180', is_veg: 1
    },

    // --- BENGALURU ---
    {
      id: 'res_vidyarthi_bhavan',
      name: 'Vidyarthi Bhavan',
      slug: 'vidyarthi-bhavan-gandhi-bazaar-bengaluru',
      cuisine: 'Crispy Masala Dosa · Vada Sambhar · Filter Kaapi',
      category: 'street_food',
      type: 'restaurant',
      city: 'Bengaluru',
      address: '32, Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru',
      lat: 12.9429, lng: 77.5738,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 11000, delivery_time: '20-30', avg_cost_for_two: 250,
      badge: 'Heritage 1943', offer: 'Legendary Thick Crispy Butter Masala Dosa', is_veg: 1
    },
    {
      id: 'res_nagarjuna',
      name: 'Nagarjuna Andhra Meals',
      slug: 'nagarjuna-residency-road-bengaluru',
      cuisine: 'Andhra Spicy Biryani · Chicken Sholay · Meals',
      category: 'biryani',
      type: 'restaurant',
      city: 'Bengaluru',
      address: '44/1, Residency Rd, Near Galaxy Theatre, Bengaluru',
      lat: 12.9719, lng: 77.6074,
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 9200, delivery_time: '25-35', avg_cost_for_two: 650,
      badge: 'Fiery Andhra', offer: 'Andhra Chicken Roast + Gunpowder Ghee Rice', is_veg: 0
    },
    {
      id: 'res_corner_house',
      name: 'Corner House Ice Cream',
      slug: 'corner-house-koramangala-bengaluru',
      cuisine: 'Desserts · Death by Chocolate · Sundaes · Shakes',
      category: 'desserts',
      type: 'cafe',
      city: 'Bengaluru',
      address: '7th Block, 80 Feet Rd, Koramangala, Bengaluru',
      lat: 12.9352, lng: 77.6245,
      img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&h=300&fit=crop',
      rating: 4.9, reviews_count: 14000, delivery_time: '15-20', avg_cost_for_two: 300,
      badge: 'Cult Classic', offer: 'Death by Chocolate (DBC) with extra hot fudge', is_veg: 1
    },

    // --- HYDERABAD ---
    {
      id: 'res_paradise_hyd',
      name: 'Paradise Biryani Secunderabad',
      slug: 'paradise-biryani-secunderabad',
      cuisine: 'World-Famous Hyderabadi Dum Biryani · Mirchi Ka Salan',
      category: 'biryani',
      type: 'restaurant',
      city: 'Hyderabad',
      address: 'SD Road, Sappu Bagh, Secunderabad, Hyderabad',
      lat: 17.4399, lng: 78.4983,
      img: 'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 18500, delivery_time: '25-35', avg_cost_for_two: 550,
      badge: 'Since 1953', offer: 'Special Hyderabadi Mutton Dum Biryani Handi', is_veg: 0
    },
    {
      id: 'res_cafe_niloufer',
      name: 'Cafe Niloufer & Bakers',
      slug: 'cafe-niloufer-red-hills-hyderabad',
      cuisine: 'Hyderabadi Irani Chai · Osmania Biscuits · Maska Bun',
      category: 'drinks',
      type: 'cafe',
      city: 'Hyderabad',
      address: '11-5-422, Red Hills Rd, Lakdikapul, Hyderabad',
      lat: 17.3995, lng: 78.4619,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 8200, delivery_time: '15-25', avg_cost_for_two: 200,
      badge: 'Irani King', offer: 'Special Malai Chai + 6 Osmania Biscuits @ ₹80', is_veg: 1
    },
    {
      id: 'res_shah_ghouse',
      name: 'Shah Ghouse Cafe & Haleem',
      slug: 'shah-ghouse-tolichowki-hyderabad',
      cuisine: 'Authentic Haleem · Paya Shorba · Biryani · Boti Kebab',
      category: 'indian',
      type: 'restaurant',
      city: 'Hyderabad',
      address: 'Opp. Skyview, Tolichowki Main Rd, Hyderabad',
      lat: 17.3970, lng: 78.4116,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop',
      rating: 4.6, reviews_count: 9400, delivery_time: '20-30', avg_cost_for_two: 500,
      badge: 'Haleem Legend', offer: 'Rich Mutton Haleem topped with fried cashew', is_veg: 0
    },

    // --- CHENNAI ---
    {
      id: 'res_murugan_idli',
      name: 'Murugan Idli Shop',
      slug: 'murugan-idli-shop-t-nagar-chennai',
      cuisine: 'Soft Mallipoo Idli · Podi Dosa · 4 Signature Chutneys',
      category: 'healthy',
      type: 'restaurant',
      city: 'Chennai',
      address: '77-1/1, GN Chetty Rd, T. Nagar, Chennai',
      lat: 13.0418, lng: 80.2337,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 7300, delivery_time: '15-25', avg_cost_for_two: 300,
      badge: 'South Icon', offer: 'Ghee Podi Idli (4 pcs) with Hot Sambar', is_veg: 1
    },
    {
      id: 'res_buhari',
      name: 'Buhari Hotel (Original Chicken 65)',
      slug: 'buhari-anna-salai-chennai',
      cuisine: 'Original Chicken 65 · Buhari Biryani · Ceylon Parotta',
      category: 'indian',
      type: 'restaurant',
      city: 'Chennai',
      address: '83, Anna Salai, Border Thottam, Padupakkam, Chennai',
      lat: 13.0645, lng: 80.2690,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop',
      rating: 4.5, reviews_count: 5800, delivery_time: '25-35', avg_cost_for_two: 550,
      badge: 'Inventors of 65', offer: 'The Original 1965 Recipe Chicken 65', is_veg: 0
    },

    // --- PUNE ---
    {
      id: 'res_kayani_bakery',
      name: 'Kayani Bakery (Pune)',
      slug: 'kayani-bakery-east-street-pune',
      cuisine: 'Shrewsbury Biscuits · Mawa Cake · Cheese Straws',
      category: 'desserts',
      type: 'bakery',
      city: 'Pune',
      address: '6, Dr Coyaji Rd, East Street, Camp, Pune',
      lat: 18.5147, lng: 73.8797,
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
      rating: 4.8, reviews_count: 6900, delivery_time: '20-30', avg_cost_for_two: 300,
      badge: 'Parsi Bakery 1955', offer: 'Authentic Butter Shrewsbury Biscuits (400g)', is_veg: 1
    },
    {
      id: 'res_goodluck_cafe',
      name: 'Cafe Goodluck',
      slug: 'cafe-goodluck-fc-road-pune',
      cuisine: 'Bun Maska Omelette · Kheema Ghotala · Chai',
      category: 'drinks',
      type: 'cafe',
      city: 'Pune',
      address: 'Fergusson College Rd, Goodluck Chowk, Deccan Gymkhana, Pune',
      lat: 18.5173, lng: 73.8415,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
      rating: 4.7, reviews_count: 8500, delivery_time: '15-25', avg_cost_for_two: 350,
      badge: 'Pune Heritage', offer: 'Signature Cheese Bun Omelette + Masala Chai', is_veg: 0
    }
  ];

  const insertRestaurant = db.prepare(`
    INSERT OR REPLACE INTO restaurants (
      id, name, slug, cuisine, category, type, city, address, lat, lng, img, rating,
      reviews_count, delivery_time, avg_cost_for_two, badge, offer, is_veg, is_open
    ) VALUES (
      @id, @name, @slug, @cuisine, @category, @type, @city, @address, @lat, @lng, @img, @rating,
      @reviews_count, @delivery_time, @avg_cost_for_two, @badge, @offer, @is_veg, 1
    )
  `);

  const insertManyRestaurants = db.transaction((list) => {
    for (const r of list) insertRestaurant.run(r);
  });
  insertManyRestaurants(RESTAURANTS);

  // 4. Seed Authentic Menu Items with Real Macro Nutrition
  const MENU_ITEMS = [
    // Peter Cat (Kolkata)
    {
      id: 'item_chelo_kebab',
      restaurant_id: 'res_peter_cat',
      name: 'Famous Chelo Kebab Platter',
      category: 'Mains',
      price: 495,
      rating: 4.9, reviews: 2450, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop',
      description: 'Charcoal-grilled minced mutton kebab and chicken reshmi kebab served over fragrant buttered basmati rice with a poached egg and grilled tomato.',
      tags: JSON.stringify(['Signature', 'Chef Special', 'Must Try']),
      calories: 780, protein: 48, carbs: 62, fat: 34
    },
    {
      id: 'item_reshmi_butter_masala',
      restaurant_id: 'res_peter_cat',
      name: 'Chicken Reshmi Butter Masala',
      category: 'Curries',
      price: 395,
      rating: 4.7, reviews: 1120, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=260&fit=crop',
      description: 'Silky chicken kebabs stewed in rich cashew cream and tomato gravy with fenugreek.',
      tags: JSON.stringify(['Bestseller']),
      calories: 620, protein: 38, carbs: 24, fat: 42
    },

    // Arsalan (Kolkata)
    {
      id: 'item_arsalan_mutton_biryani',
      restaurant_id: 'res_arsalan',
      name: 'Arsalan Special Mutton Biryani',
      category: 'Biryani',
      price: 360,
      rating: 4.9, reviews: 4800, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=260&fit=crop',
      description: 'Slow-cooked aromatic long-grain basmati with succulent tender mutton, golden saffron potato, boiled egg, and mitha attar.',
      tags: JSON.stringify(['Bestseller', 'Iconic', 'Kolkata Style']),
      calories: 720, protein: 42, carbs: 75, fat: 28
    },
    {
      id: 'item_arsalan_chicken_chaap',
      restaurant_id: 'res_arsalan',
      name: 'Royal Chicken Chaap',
      category: 'Sides',
      price: 240,
      rating: 4.8, reviews: 2900, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=260&fit=crop',
      description: 'Slow braised chicken leg piece in poppy seed, melon seed paste, and pure ghee sauce.',
      tags: JSON.stringify(['Classic Pair']),
      calories: 540, protein: 34, carbs: 12, fat: 38
    },

    // Kusum Rolls (Kolkata Street Cart)
    {
      id: 'item_double_chicken_roll',
      restaurant_id: 'res_kusum_rolls',
      name: 'Double Egg Double Chicken Kathi Roll',
      category: 'Rolls',
      price: 130,
      rating: 4.8, reviews: 3100, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
      description: 'Crispy flaky lachha paratha layered with twin beaten eggs, spiced grilled chicken cubes, onions, green chillies, and kasundi mustard.',
      tags: JSON.stringify(['Street Hero', 'High Protein']),
      calories: 520, protein: 32, carbs: 45, fat: 22
    },
    {
      id: 'item_paneer_tikka_roll',
      restaurant_id: 'res_kusum_rolls',
      name: 'Spicy Paneer Tikka Kathi Roll',
      category: 'Rolls',
      price: 110,
      rating: 4.6, reviews: 1400, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=260&fit=crop',
      description: 'Char-grilled cottage cheese tikka with capsicum and mint chutney in hot layered paratha.',
      tags: JSON.stringify(['Veg Special']),
      calories: 460, protein: 20, carbs: 46, fat: 20
    },

    // Karim's (Delhi)
    {
      id: 'item_karims_mutton_nihari',
      restaurant_id: 'res_karims',
      name: 'Special Mutton Nihari',
      category: 'Mughlai',
      price: 440,
      rating: 4.9, reviews: 5600, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=260&fit=crop',
      description: 'Overnight slow-simmered tender mutton shank stew with ginger juliennes and special 24-spice potli broth.',
      tags: JSON.stringify(['Heritage 1913', 'Morning Special']),
      calories: 680, protein: 46, carbs: 14, fat: 48
    },
    {
      id: 'item_karims_mutton_burra',
      restaurant_id: 'res_karims',
      name: 'Mutton Burra Kebab (4 Pcs)',
      category: 'Tandoor',
      price: 490,
      rating: 4.8, reviews: 3400, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=260&fit=crop',
      description: 'Smoky bone-in mutton ribs double marinated in mustard oil, malt vinegar, and crushed whole spices.',
      tags: JSON.stringify(['Smoky Tandoor']),
      calories: 590, protein: 52, carbs: 8, fat: 38
    },

    // Moti Mahal (Delhi)
    {
      id: 'item_original_butter_chicken',
      restaurant_id: 'res_moti_mahal',
      name: 'The 1947 Original Butter Chicken',
      category: 'Signature Curries',
      price: 420,
      rating: 4.8, reviews: 4200, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=260&fit=crop',
      description: 'The historic recipe invented right here: tandoori chicken simmered in pure butter, sweet sun-ripened tomatoes, and makhana gravy.',
      tags: JSON.stringify(['Legendary', 'Original Recipe']),
      calories: 640, protein: 40, carbs: 22, fat: 44
    },
    {
      id: 'item_moti_dal_makhani',
      restaurant_id: 'res_moti_mahal',
      name: 'Slow Simmered Dal Makhani',
      category: 'Signature Curries',
      price: 290,
      rating: 4.7, reviews: 3100, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=260&fit=crop',
      description: 'Black urad lentils and kidney beans slow-cooked on slow coal embers for 18 hours with white butter.',
      tags: JSON.stringify(['Bestseller', 'Veg']),
      calories: 480, protein: 18, carbs: 48, fat: 24
    },

    // Britannia & Co. (Mumbai)
    {
      id: 'item_mutton_berry_pulao',
      restaurant_id: 'res_britannia',
      name: 'Iconic Mutton Berry Pulao',
      category: 'Parsi Specialties',
      price: 590,
      rating: 4.9, reviews: 3800, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=260&fit=crop',
      description: 'Authentic Iranian Zereshk barberries imported from Iran, layered over aromatic spiced mutton, fragrant rice, and crisp fried shallots.',
      tags: JSON.stringify(['Cult Classic', 'Imported Berries']),
      calories: 740, protein: 44, carbs: 70, fat: 30
    },
    {
      id: 'item_britannia_caramel_custard',
      restaurant_id: 'res_britannia',
      name: 'Traditional Parsi Caramel Custard',
      category: 'Desserts',
      price: 180,
      rating: 4.8, reviews: 2100, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=400&h=260&fit=crop',
      description: 'Silky smooth melt-in-mouth egg custard bathed in amber golden caramel syrup.',
      tags: JSON.stringify(['Sweet Tooth']),
      calories: 280, protein: 8, carbs: 36, fat: 12
    },

    // Bademiya (Mumbai Street Cart)
    {
      id: 'item_bademiya_baida_roti',
      restaurant_id: 'res_bademiya',
      name: 'Chicken Baida Roti',
      category: 'Street Grills',
      price: 240,
      rating: 4.7, reviews: 4900, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
      description: 'Square flaky egg pocket pan-fried on a huge tawa, stuffed with spiced minced chicken, mint, and fried onions.',
      tags: JSON.stringify(['Colaba Street Legend']),
      calories: 560, protein: 36, carbs: 42, fat: 28
    },

    // Vidyarthi Bhavan (Bengaluru)
    {
      id: 'item_vb_butter_masala_dosa',
      restaurant_id: 'res_vidyarthi_bhavan',
      name: 'Crispy Butter Masala Dosa',
      category: 'Tiffins',
      price: 85,
      rating: 4.9, reviews: 8400, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
      description: 'Golden thick, crispy on the outside, fluffy inside dosa roasted in fresh local butter with red chutney spread and spiced potato filling.',
      tags: JSON.stringify(['Heritage 1943', 'Bestseller']),
      calories: 380, protein: 9, carbs: 54, fat: 14
    },
    {
      id: 'item_vb_filter_kaapi',
      restaurant_id: 'res_vidyarthi_bhavan',
      name: 'Meter Degree Filter Coffee',
      category: 'Beverages',
      price: 35,
      rating: 4.9, reviews: 4200, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=260&fit=crop',
      description: 'Fresh chicory-blended decoction frothed with boiling whole milk, served in traditional brass davarah and tumbler.',
      tags: JSON.stringify(['Morning Booster']),
      calories: 90, protein: 3, carbs: 12, fat: 3
    },

    // Corner House (Bengaluru)
    {
      id: 'item_death_by_chocolate',
      restaurant_id: 'res_corner_house',
      name: 'Death by Chocolate (DBC)',
      category: 'Signature Sundaes',
      price: 260,
      rating: 5.0, reviews: 12000, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=260&fit=crop',
      description: 'Rich dark chocolate cake smothered with scoops of vanilla ice cream, toasted peanuts, cream, and flooded with bubbling warm chocolate fudge.',
      tags: JSON.stringify(['Cult Legend', 'Ultimate Indulgence']),
      calories: 680, protein: 12, carbs: 88, fat: 32
    },

    // Paradise Biryani (Hyderabad)
    {
      id: 'item_paradise_mutton_biryani',
      restaurant_id: 'res_paradise_hyd',
      name: 'Paradise Special Mutton Dum Biryani',
      category: 'Biryani',
      price: 399,
      rating: 4.8, reviews: 9200, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=400&h=260&fit=crop',
      description: 'Sealed handi dum biryani cooked with secret 31 spices, tender meat, saffron rice, served with Mirchi Ka Salan and creamy Dahi ki Chutney.',
      tags: JSON.stringify(['World Famous', 'Handi Cooked']),
      calories: 760, protein: 46, carbs: 78, fat: 28
    },

    // Murugan Idli (Chennai)
    {
      id: 'item_ghee_podi_idli',
      restaurant_id: 'res_murugan_idli',
      name: 'Melting Ghee Podi Idli (4 Pcs)',
      category: 'Tiffins',
      price: 140,
      rating: 4.9, reviews: 4600, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
      description: 'Pillowy soft steamed idlis tossed generously in authentic spicy gunpowder (idli podi) and smoking desi ghee.',
      tags: JSON.stringify(['Pure Ghee', 'Chennai Favourite']),
      calories: 360, protein: 11, carbs: 52, fat: 12
    },
    // Flurys (Kolkata)
    {
      id: 'item_flurys_rum_ball',
      restaurant_id: 'res_flurys',
      name: 'Flurys Signature Rum Ball',
      category: 'Pastries',
      price: 95,
      rating: 4.8, reviews: 3200, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=260&fit=crop',
      description: 'Legendary dense chocolate truffle cake soaked in dark rum syrup and coated in dark Dutch cocoa glaze.',
      tags: JSON.stringify(['Heritage 1927', 'Bestseller']),
      calories: 290, protein: 4, carbs: 42, fat: 14
    },
    {
      id: 'item_flurys_english_breakfast',
      restaurant_id: 'res_flurys',
      name: 'Flurys Heritage English Breakfast',
      category: 'Breakfast',
      price: 375,
      rating: 4.7, reviews: 2100, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=260&fit=crop',
      description: 'Two sunny-side up eggs, grilled chicken sausages, crisp bacon, baked beans, sautéed mushrooms, grilled tomato, and butter toast.',
      tags: JSON.stringify(['Classic', 'High Protein']),
      calories: 640, protein: 44, carbs: 38, fat: 34
    },
    // Paranthe Wali Gali (Delhi)
    {
      id: 'item_kaju_parantha',
      restaurant_id: 'res_paranthe_cart',
      name: 'Special Kaju & Khoya Parantha',
      category: 'Paranthas',
      price: 120,
      rating: 4.8, reviews: 1950, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=260&fit=crop',
      description: 'Crispy deep-fried parantha stuffed with rich cashew nuts, mawa, and crushed dry fruits, served with sweet pumpkin curry and pickles.',
      tags: JSON.stringify(['Old Delhi Legend', 'Pure Desi Ghee']),
      calories: 460, protein: 10, carbs: 58, fat: 22
    },
    {
      id: 'item_aloo_papad_parantha',
      restaurant_id: 'res_paranthe_cart',
      name: 'Crispy Aloo Papad Parantha',
      category: 'Paranthas',
      price: 90,
      rating: 4.6, reviews: 2400, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=260&fit=crop',
      description: 'Crunchy crushed papad and spiced potato stuffed parantha, served with banana chutney and hing aloo curry.',
      tags: JSON.stringify(['Bestseller']),
      calories: 390, protein: 8, carbs: 54, fat: 16
    },
    // Saravana Bhavan (Delhi)
    {
      id: 'item_sb_ghee_roast_dosa',
      restaurant_id: 'res_saravana_bhavan',
      name: 'Special Ghee Roast Paper Dosa',
      category: 'South Indian',
      price: 185,
      rating: 4.7, reviews: 3600, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
      description: 'Extra-long ultra crispy paper dosa roasted with pure melted ghee, served with piping hot drumstick sambar and coconut chutneys.',
      tags: JSON.stringify(['Pure Veg', 'Must Try']),
      calories: 410, protein: 8, carbs: 58, fat: 17
    },
    // Kyani & Co. (Mumbai)
    {
      id: 'item_kyani_bun_maska',
      restaurant_id: 'res_kyani',
      name: 'Classic Bun Maska with Special Chai',
      category: 'Irani Specials',
      price: 70,
      rating: 4.9, reviews: 5200, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=260&fit=crop',
      description: 'Pillow-soft sweet bun slathered with dollops of salted Amul butter, paired with slow-brewed caramelised Irani tea.',
      tags: JSON.stringify(['Mumbai Classic', 'Comfort Food']),
      calories: 320, protein: 6, carbs: 42, fat: 15
    },
    {
      id: 'item_kyani_kheema_pav',
      restaurant_id: 'res_kyani',
      name: 'Spicy Mutton Kheema Pav',
      category: 'Irani Specials',
      price: 190,
      rating: 4.8, reviews: 3800, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=260&fit=crop',
      description: 'Finely minced mutton cooked with brown onions, green peas, and fragrant Irani garam masala, served with 2 warm buttered pavs.',
      tags: JSON.stringify(['High Protein', 'Bestseller']),
      calories: 520, protein: 38, carbs: 36, fat: 24
    },
    // Anand Dosa (Mumbai Mithibai Cart)
    {
      id: 'item_anand_jinny_dosa',
      restaurant_id: 'res_anand_dosa',
      name: 'Chef Special Loaded Jinny Dosa',
      category: 'Street Dosas',
      price: 180,
      rating: 4.9, reviews: 4900, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
      description: 'Street-style crispy dosa filled with shredded vegetables, schezwan sauce, mayonnaise, rolled into cylinders and loaded with grated processed cheese.',
      tags: JSON.stringify(['Viral Street Food', 'Cheese Burst']),
      calories: 560, protein: 14, carbs: 64, fat: 28
    },
    // Nagarjuna (Bengaluru)
    {
      id: 'item_nagarjuna_chicken_sholay',
      restaurant_id: 'res_nagarjuna',
      name: 'Fiery Andhra Chicken Sholay Kebab',
      category: 'Starters',
      price: 330,
      rating: 4.8, reviews: 4100, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop',
      description: 'Boneless tender chicken strips tossed with fiery green chillies, curry leaves, crushed black pepper, and Andhra spices.',
      tags: JSON.stringify(['Spicy', 'Chef Special']),
      calories: 480, protein: 42, carbs: 12, fat: 26
    },
    // Cafe Niloufer (Hyderabad)
    {
      id: 'item_niloufer_special_chai',
      restaurant_id: 'res_cafe_niloufer',
      name: 'Special Malai Chai with Osmania Biscuits',
      category: 'Tea & Snacks',
      price: 60,
      rating: 4.9, reviews: 6800, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=260&fit=crop',
      description: 'Thick, creamy, slow-dum Hyderabad tea topped with clotted malai, served with 4 melt-in-mouth Osmania biscuits.',
      tags: JSON.stringify(['Legendary', 'Morning Craving']),
      calories: 220, protein: 5, carbs: 32, fat: 9
    },
    // Shah Ghouse (Hyderabad)
    {
      id: 'item_shah_ghouse_haleem',
      restaurant_id: 'res_shah_ghouse',
      name: 'Royal Shahi Mutton Haleem',
      category: 'Haleem',
      price: 260,
      rating: 4.9, reviews: 7500, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=260&fit=crop',
      description: 'Slow-pounded mutton cooked for 12 hours with broken wheat, lentils, spices, desi ghee, garnished with fried golden onions, cashews, and lemon.',
      tags: JSON.stringify(['Ramzan Special', 'High Protein']),
      calories: 680, protein: 48, carbs: 52, fat: 32
    },
    // Buhari Hotel (Chennai)
    {
      id: 'item_original_chicken_65',
      restaurant_id: 'res_buhari',
      name: 'The 1965 Original Recipe Chicken 65',
      category: 'Starters',
      price: 290,
      rating: 4.8, reviews: 5200, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop',
      description: 'Crisp deep-fried spicy marinated chicken chunks created by A.M. Buhari in 1965 with South Indian tempering of curry leaves and whole red chillies.',
      tags: JSON.stringify(['Invented Here 1965', 'Must Try']),
      calories: 510, protein: 44, carbs: 14, fat: 28
    },
    // Kayani Bakery (Pune)
    {
      id: 'item_shrewsbury_biscuits',
      restaurant_id: 'res_kayani_bakery',
      name: 'Original Butter Shrewsbury Biscuits (400g Box)',
      category: 'Bakery',
      price: 220,
      rating: 5.0, reviews: 8900, is_veg: 1,
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=260&fit=crop',
      description: 'Pune’s most famous buttery, melt-in-mouth traditional English Shrewsbury shortbread biscuits baked fresh daily since 1955.',
      tags: JSON.stringify(['Heritage 1955', 'Bestseller']),
      calories: 450, protein: 6, carbs: 62, fat: 21
    },
    // Cafe Goodluck (Pune)
    {
      id: 'item_goodluck_bun_omelette',
      restaurant_id: 'res_goodluck_cafe',
      name: 'Cheese Bun Omelette & Cutting Chai',
      category: 'Breakfast',
      price: 130,
      rating: 4.8, reviews: 6100, is_veg: 0,
      img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=260&fit=crop',
      description: 'Fluffy 2-egg masala omelette folded inside a hot buttered bun loaded with melted cheese, served with ginger cutting chai.',
      tags: JSON.stringify(['Pune Favorite', 'Student Favorite']),
      calories: 420, protein: 18, carbs: 38, fat: 20
    }
  ];

  const insertMenuItem = db.prepare(`
    INSERT OR REPLACE INTO menu_items (
      id, restaurant_id, name, category, price, rating, reviews, is_veg,
      img, description, tags, calories, protein, carbs, fat, is_available
    ) VALUES (
      @id, @restaurant_id, @name, @category, @price, @rating, @reviews, @is_veg,
      @img, @description, @tags, @calories, @protein, @carbs, @fat, 1
    )
  `);

  const insertManyItems = db.transaction((list) => {
    for (const item of list) insertMenuItem.run(item);
  });
  insertManyItems(MENU_ITEMS);

  // 5. Seed Initial Addresses for Customer
  const insertAddr = db.prepare(`
    INSERT OR REPLACE INTO addresses (id, user_id, label, street, city, state, postal_code, lat, lng, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAddr.run('addr_home', 'usr_customer', 'Home', 'Flat 4B, Silver Heights, Park Street', 'Kolkata', 'West Bengal', '700016', 22.5519, 88.3526, 1);
  insertAddr.run('addr_office', 'usr_customer', 'Office', 'Tower 3, Sector V, Salt Lake', 'Kolkata', 'West Bengal', '700091', 22.5802, 88.4354, 0);

  console.log(`[Seed] ✅ Successfully seeded ${RESTAURANTS.length} authentic Indian restaurants and ${MENU_ITEMS.length} dishes with full macro nutrition!`);
}

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase();
}
