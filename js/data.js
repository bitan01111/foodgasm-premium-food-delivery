// ============================================================
// 🇮🇳 Foodgasm 2.0: Authentic Pan-India Restaurant & Menu Data
// ============================================================

const CATEGORIES = [
  { id: 'all', emoji: '🍽️', label: 'All' },
  { id: 'street_food', emoji: '🛺', label: 'Street Carts' },
  { id: 'biryani', emoji: '🍛', label: 'Biryani' },
  { id: 'indian', emoji: '🍲', label: 'Indian & Mughlai' },
  { id: 'healthy', emoji: '🥗', label: 'Healthy & South' },
  { id: 'drinks', emoji: '☕', label: 'Chai & Cafes' },
  { id: 'desserts', emoji: '🍰', label: 'Desserts & Sweets' },
  { id: 'rolls', emoji: '🌯', label: 'Kathi Rolls' },
  { id: 'burgers', emoji: '🍔', label: 'Burgers' },
  { id: 'pizza', emoji: '🍕', label: 'Pizza' }
];

const RESTAURANTS = [
  // Kolkata
  {
    id: 'res_peter_cat',
    name: 'Peter Cat',
    cuisine: 'Continental · Mughlai · Sizzlers',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '25-35', deliveryFee: 0, minOrder: 299,
    distance: '1.2 km', distance_km: 1.2, badge: 'Iconic Heritage',
    offer: 'Legendary Chelo Kebab with butter rice', category: 'indian', type: 'restaurant',
    city: 'Kolkata', address: '18A, Park Street, Kolkata', veg: false,
    lat: 22.5519, lng: 88.3526
  },
  {
    id: 'res_arsalan',
    name: 'Arsalan Restaurant',
    cuisine: 'Kolkata Biryani · Mughlai · Tandoori',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '20-30', deliveryFee: 25, minOrder: 199,
    distance: '1.8 km', distance_km: 1.8, badge: 'City Bestseller',
    offer: 'Free aromatic Phirni on orders above ₹499', category: 'biryani', type: 'restaurant',
    city: 'Kolkata', address: '191, Marina Park Circus 7-Point, Kolkata', veg: false,
    lat: 22.5392, lng: 88.3656
  },
  {
    id: 'res_kusum_rolls',
    name: 'Kusum Rolls (Street Cart)',
    cuisine: 'Kolkata Kathi Rolls · Street Bites',
    img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=500&h=300&fit=crop',
    rating: 4.6, deliveryTime: '15-20', deliveryFee: 20, minOrder: 99,
    distance: '0.8 km', distance_km: 0.8, badge: 'Street Hero',
    offer: 'Double Egg Chicken Kathi Roll @ ₹99', category: 'street_food', type: 'street_cart',
    city: 'Kolkata', address: '21 Park Street, Kolkata', veg: false,
    lat: 22.5522, lng: 88.3529
  },
  {
    id: 'res_flurys',
    name: 'Flurys Tea Room',
    cuisine: 'European Cafe · Pastries · English Breakfast',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '25-35', deliveryFee: 0, minOrder: 249,
    distance: '1.4 km', distance_km: 1.4, badge: 'Since 1927',
    offer: 'Complimentary Rum Ball with any Specialty Tea', category: 'desserts', type: 'cafe',
    city: 'Kolkata', address: '18, Park Street, Kolkata', veg: false,
    lat: 22.5525, lng: 88.3518
  },

  // Delhi NCR
  {
    id: 'res_karims',
    name: "Karim's Old Delhi",
    cuisine: 'Mughlai · Nihari · Mutton Burra · Kebabs',
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '30-40', deliveryFee: 0, minOrder: 399,
    distance: '2.1 km', distance_km: 2.1, badge: 'Historic 1913',
    offer: 'Traditional Mutton Nihari with Khamiri Roti', category: 'indian', type: 'restaurant',
    city: 'Delhi NCR', address: 'Gali Kababian, Jama Masjid, Delhi', veg: false,
    lat: 28.6507, lng: 77.2334
  },
  {
    id: 'res_moti_mahal',
    name: 'Moti Mahal Delux',
    cuisine: 'Original Butter Chicken · Dal Makhani · Tandoor',
    img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&h=300&fit=crop',
    rating: 4.6, deliveryTime: '25-35', deliveryFee: 30, minOrder: 299,
    distance: '1.9 km', distance_km: 1.9, badge: 'Origin of Butter Chicken',
    offer: '20% OFF on Classic Butter Chicken Handi', category: 'indian', type: 'restaurant',
    city: 'Delhi NCR', address: '3704, Netaji Subhash Marg, Daryaganj, Delhi', veg: false,
    lat: 28.6433, lng: 77.2405
  },
  {
    id: 'res_paranthe_cart',
    name: 'Pandit Gaya Prasad Paranthe (Cart)',
    cuisine: 'Fried Stuffed Paranthas · Rabri · Street Bites',
    img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&h=300&fit=crop',
    rating: 4.5, deliveryTime: '20-30', deliveryFee: 15, minOrder: 120,
    distance: '0.9 km', distance_km: 0.9, badge: 'Heritage Cart',
    offer: 'Assorted 3-Parantha Combo with Kaddu ki Subzi', category: 'street_food', type: 'street_cart',
    city: 'Delhi NCR', address: 'Paranthe Wali Gali, Chandni Chowk, Delhi', veg: true,
    lat: 28.6562, lng: 77.2307
  },
  {
    id: 'res_saravana_bhavan',
    name: 'Saravana Bhavan',
    cuisine: 'South Indian · Ghee Roast Dosa · Filter Coffee',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
    rating: 4.6, deliveryTime: '15-25', deliveryFee: 0, minOrder: 180,
    distance: '1.1 km', distance_km: 1.1, badge: 'Pure Veg',
    offer: 'Special South Indian Thali @ ₹249', category: 'healthy', type: 'restaurant',
    city: 'Delhi NCR', address: 'P-15, Connaught Circus, New Delhi', veg: true,
    lat: 28.6328, lng: 77.2195
  },

  // Mumbai
  {
    id: 'res_britannia',
    name: 'Britannia & Co. Restaurant',
    cuisine: 'Parsi · Berry Pulao · Sali Boti · Caramel Custard',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '30-40', deliveryFee: 0, minOrder: 499,
    distance: '2.4 km', distance_km: 2.4, badge: 'Legendary Parsi',
    offer: 'Signature Mutton Berry Pulao with Fried Onions', category: 'indian', type: 'restaurant',
    city: 'Mumbai', address: 'Wakefield House, Ballard Estate, Mumbai', veg: false,
    lat: 18.9372, lng: 72.8406
  },
  {
    id: 'res_bademiya',
    name: 'Bademiya Seekh Kebab Cart',
    cuisine: 'Street Kebabs · Baida Roti · Rolls',
    img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=300&fit=crop',
    rating: 4.5, deliveryTime: '20-30', deliveryFee: 25, minOrder: 150,
    distance: '1.0 km', distance_km: 1.0, badge: 'Night Owl Cart',
    offer: 'Chicken Baida Roti + Seekh Kebab Roll Combo', category: 'street_food', type: 'street_cart',
    city: 'Mumbai', address: 'Tulloch Rd, Behind Taj Mahal Hotel, Colaba, Mumbai', veg: false,
    lat: 18.9238, lng: 72.8333
  },
  {
    id: 'res_kyani',
    name: 'Kyani & Co. Irani Cafe',
    cuisine: 'Irani Chai · Bun Maska · Kheema Pav · Mawa Cake',
    img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
    rating: 4.6, deliveryTime: '15-20', deliveryFee: 15, minOrder: 99,
    distance: '0.6 km', distance_km: 0.6, badge: 'Est. 1904',
    offer: 'Double Irani Chai + Mawa Cake for ₹99', category: 'drinks', type: 'cafe',
    city: 'Mumbai', address: '657, JSS Rd, Marine Lines, Mumbai', veg: false,
    lat: 18.9431, lng: 72.8286
  },
  {
    id: 'res_anand_dosa',
    name: 'Anand Dosa Stall (Cart)',
    cuisine: 'Gourmet Dosas · Jinny Dosa · Pizza Dosa',
    img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '15-25', deliveryFee: 20, minOrder: 120,
    distance: '0.7 km', distance_km: 0.7, badge: 'College Craze',
    offer: 'Loaded Cheesy Jinny Dosa @ ₹180', category: 'street_food', type: 'street_cart',
    city: 'Mumbai', address: 'Opp. Mithibai College, Vile Parle West, Mumbai', veg: true,
    lat: 19.0178, lng: 72.8306
  },

  // Bengaluru
  {
    id: 'res_vidyarthi_bhavan',
    name: 'Vidyarthi Bhavan',
    cuisine: 'Crispy Masala Dosa · Vada Sambhar · Filter Kaapi',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '20-30', deliveryFee: 15, minOrder: 99,
    distance: '1.3 km', distance_km: 1.3, badge: 'Heritage 1943',
    offer: 'Legendary Thick Crispy Butter Masala Dosa', category: 'healthy', type: 'restaurant',
    city: 'Bengaluru', address: '32, Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru', veg: true,
    lat: 12.9438, lng: 77.5739
  },
  {
    id: 'res_nagarjuna',
    name: 'Nagarjuna Andhra Meals',
    cuisine: 'Andhra Spicy Biryani · Chicken Sholay · Meals',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '25-35', deliveryFee: 30, minOrder: 299,
    distance: '2.2 km', distance_km: 2.2, badge: 'Fiery Andhra',
    offer: 'Andhra Chicken Roast + Gunpowder Ghee Rice', category: 'biryani', type: 'restaurant',
    city: 'Bengaluru', address: '44/1, Residency Rd, Bengaluru', veg: false,
    lat: 12.9723, lng: 77.6012
  },
  {
    id: 'res_corner_house',
    name: 'Corner House Ice Cream',
    cuisine: 'Desserts · Death by Chocolate · Sundaes · Shakes',
    img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&h=300&fit=crop',
    rating: 4.9, deliveryTime: '15-20', deliveryFee: 0, minOrder: 150,
    distance: '0.9 km', distance_km: 0.9, badge: 'Cult Classic',
    offer: 'Death by Chocolate (DBC) with extra hot fudge', category: 'desserts', type: 'cafe',
    city: 'Bengaluru', address: '7th Block, Koramangala, Bengaluru', veg: true,
    lat: 12.9344, lng: 77.6186
  },

  // Hyderabad
  {
    id: 'res_paradise_hyd',
    name: 'Paradise Biryani Secunderabad',
    cuisine: 'Hyderabadi Dum Biryani · Mirchi Ka Salan',
    img: 'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '25-35', deliveryFee: 25, minOrder: 299,
    distance: '1.7 km', distance_km: 1.7, badge: 'Since 1953',
    offer: 'Special Hyderabadi Mutton Dum Biryani Handi', category: 'biryani', type: 'restaurant',
    city: 'Hyderabad', address: 'SD Road, Secunderabad, Hyderabad', veg: false,
    lat: 17.4416, lng: 78.4873
  },
  {
    id: 'res_cafe_niloufer',
    name: 'Cafe Niloufer & Bakers',
    cuisine: 'Hyderabadi Irani Chai · Osmania Biscuits · Maska Bun',
    img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '15-25', deliveryFee: 15, minOrder: 80,
    distance: '0.8 km', distance_km: 0.8, badge: 'Irani King',
    offer: 'Special Malai Chai + 6 Osmania Biscuits @ ₹80', category: 'drinks', type: 'cafe',
    city: 'Hyderabad', address: 'Red Hills Rd, Lakdikapul, Hyderabad', veg: true,
    lat: 17.4019, lng: 78.4616
  },
  {
    id: 'res_shah_ghouse',
    name: 'Shah Ghouse Cafe & Haleem',
    cuisine: 'Authentic Haleem · Paya Shorba · Biryani',
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop',
    rating: 4.6, deliveryTime: '20-30', deliveryFee: 25, minOrder: 250,
    distance: '2.0 km', distance_km: 2.0, badge: 'Haleem Legend',
    offer: 'Rich Mutton Haleem topped with fried cashew', category: 'indian', type: 'restaurant',
    city: 'Hyderabad', address: 'Tolichowki Main Rd, Hyderabad', veg: false,
    lat: 17.3949, lng: 78.4116
  },

  // Chennai
  {
    id: 'res_murugan_idli',
    name: 'Murugan Idli Shop',
    cuisine: 'Soft Mallipoo Idli · Podi Dosa · Chutneys',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '15-25', deliveryFee: 20, minOrder: 140,
    distance: '1.1 km', distance_km: 1.1, badge: 'South Icon',
    offer: 'Ghee Podi Idli (4 pcs) with Hot Sambar', category: 'healthy', type: 'restaurant',
    city: 'Chennai', address: '77-1/1, GN Chetty Rd, T. Nagar, Chennai', veg: true,
    lat: 13.0416, lng: 80.2339
  },
  {
    id: 'res_buhari',
    name: 'Buhari Hotel (Original 65)',
    cuisine: 'Original Chicken 65 · Buhari Biryani · Parotta',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=300&fit=crop',
    rating: 4.5, deliveryTime: '25-35', deliveryFee: 30, minOrder: 280,
    distance: '2.3 km', distance_km: 2.3, badge: 'Inventors of 65',
    offer: 'The Original 1965 Recipe Chicken 65', category: 'indian', type: 'restaurant',
    city: 'Chennai', address: '83, Anna Salai, Chennai', veg: false,
    lat: 13.0604, lng: 80.2642
  },

  // Pune
  {
    id: 'res_kayani_bakery',
    name: 'Kayani Bakery (Pune)',
    cuisine: 'Shrewsbury Biscuits · Mawa Cake · Cheese Straws',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
    rating: 4.8, deliveryTime: '20-30', deliveryFee: 0, minOrder: 200,
    distance: '1.5 km', distance_km: 1.5, badge: 'Parsi Bakery 1955',
    offer: 'Authentic Butter Shrewsbury Biscuits (400g)', category: 'desserts', type: 'bakery',
    city: 'Pune', address: 'East Street, Camp, Pune', veg: true,
    lat: 18.5147, lng: 73.8786
  },
  {
    id: 'res_goodluck_cafe',
    name: 'Cafe Goodluck',
    cuisine: 'Bun Maska Omelette · Kheema Ghotala · Chai',
    img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop',
    rating: 4.7, deliveryTime: '15-25', deliveryFee: 15, minOrder: 100,
    distance: '0.8 km', distance_km: 0.8, badge: 'Pune Heritage',
    offer: 'Signature Cheese Bun Omelette + Masala Chai', category: 'drinks', type: 'cafe',
    city: 'Pune', address: 'FC Road, Deccan Gymkhana, Pune', veg: false,
    lat: 18.5173, lng: 73.8415
  }
];

const FOODS = [
  {
    id: 'item_chelo_kebab',
    restaurantId: 'res_peter_cat',
    restaurantName: 'Peter Cat',
    name: 'Famous Chelo Kebab Platter',
    price: 495, rating: 4.9, reviews: 2450, veg: false, category: 'indian',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop',
    desc: 'Charcoal-grilled minced mutton kebab and chicken reshmi kebab served over buttered basmati rice with poached egg.',
    tags: ['Signature', 'Bestseller'],
    calories: 780, protein: 48, carbs: 62, fat: 34
  },
  {
    id: 'item_arsalan_mutton_biryani',
    restaurantId: 'res_arsalan',
    restaurantName: 'Arsalan Restaurant',
    name: 'Arsalan Special Mutton Biryani',
    price: 360, rating: 4.9, reviews: 4800, veg: false, category: 'biryani',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=260&fit=crop',
    desc: 'Slow-cooked aromatic long-grain basmati with succulent tender mutton, golden saffron potato, and boiled egg.',
    tags: ['Bestseller', 'Kolkata Style'],
    calories: 720, protein: 42, carbs: 75, fat: 28
  },
  {
    id: 'item_double_chicken_roll',
    restaurantId: 'res_kusum_rolls',
    restaurantName: 'Kusum Rolls (Street Cart)',
    name: 'Double Egg Double Chicken Kathi Roll',
    price: 130, rating: 4.8, reviews: 3100, veg: false, category: 'street_food',
    img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
    desc: 'Crispy flaky lachha paratha layered with twin beaten eggs, spiced grilled chicken cubes, onions, and kasundi.',
    tags: ['Street Hero', 'High Protein'],
    calories: 520, protein: 32, carbs: 45, fat: 22
  },
  {
    id: 'item_flurys_rum_ball',
    restaurantId: 'res_flurys',
    restaurantName: 'Flurys Tea Room',
    name: 'Flurys Signature Rum Ball',
    price: 95, rating: 4.8, reviews: 3200, veg: true, category: 'desserts',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=260&fit=crop',
    desc: 'Legendary dense chocolate truffle cake soaked in dark rum syrup and coated in dark Dutch cocoa glaze.',
    tags: ['Heritage 1927'],
    calories: 290, protein: 4, carbs: 42, fat: 14
  },
  {
    id: 'item_karims_mutton_nihari',
    restaurantId: 'res_karims',
    restaurantName: "Karim's Old Delhi",
    name: 'Special Mutton Nihari',
    price: 440, rating: 4.9, reviews: 5600, veg: false, category: 'indian',
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=260&fit=crop',
    desc: 'Overnight slow-simmered tender mutton shank stew with ginger juliennes and special 24-spice potli broth.',
    tags: ['Historic 1913'],
    calories: 680, protein: 46, carbs: 14, fat: 48
  },
  {
    id: 'item_original_butter_chicken',
    restaurantId: 'res_moti_mahal',
    restaurantName: 'Moti Mahal Delux',
    name: 'The 1947 Original Butter Chicken',
    price: 420, rating: 4.8, reviews: 4200, veg: false, category: 'indian',
    img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=260&fit=crop',
    desc: 'Tandoori chicken simmered in pure butter, sweet sun-ripened tomatoes, and makhana gravy.',
    tags: ['Original Recipe', 'Bestseller'],
    calories: 640, protein: 40, carbs: 22, fat: 44
  },
  {
    id: 'item_kaju_parantha',
    restaurantId: 'res_paranthe_cart',
    restaurantName: 'Pandit Gaya Prasad Paranthe (Cart)',
    name: 'Special Kaju & Khoya Parantha',
    price: 120, rating: 4.8, reviews: 1950, veg: true, category: 'street_food',
    img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=260&fit=crop',
    desc: 'Crispy deep-fried parantha stuffed with rich cashew nuts, mawa, served with pumpkin curry.',
    tags: ['Pure Desi Ghee'],
    calories: 460, protein: 10, carbs: 58, fat: 22
  },
  {
    id: 'item_sb_ghee_roast_dosa',
    restaurantId: 'res_saravana_bhavan',
    restaurantName: 'Saravana Bhavan',
    name: 'Special Ghee Roast Paper Dosa',
    price: 185, rating: 4.7, reviews: 3600, veg: true, category: 'healthy',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
    desc: 'Extra-long ultra crispy paper dosa roasted with pure melted ghee, served with hot sambar and chutneys.',
    tags: ['Pure Veg'],
    calories: 410, protein: 8, carbs: 58, fat: 17
  },
  {
    id: 'item_mutton_berry_pulao',
    restaurantId: 'res_britannia',
    restaurantName: 'Britannia & Co. Restaurant',
    name: 'Iconic Mutton Berry Pulao',
    price: 590, rating: 4.9, reviews: 3800, veg: false, category: 'indian',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=260&fit=crop',
    desc: 'Authentic Iranian Zereshk barberries layered over spiced mutton, fragrant rice, and crisp shallots.',
    tags: ['Cult Classic'],
    calories: 740, protein: 44, carbs: 70, fat: 30
  },
  {
    id: 'item_bademiya_baida_roti',
    restaurantId: 'res_bademiya',
    restaurantName: 'Bademiya Seekh Kebab Cart',
    name: 'Chicken Baida Roti',
    price: 240, rating: 4.7, reviews: 4900, veg: false, category: 'street_food',
    img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
    desc: 'Flaky egg pocket stuffed with spiced minced chicken, fresh mint, and fried onions.',
    tags: ['Colaba Legend'],
    calories: 560, protein: 36, carbs: 42, fat: 28
  },
  {
    id: 'item_kyani_bun_maska',
    restaurantId: 'res_kyani',
    restaurantName: 'Kyani & Co. Irani Cafe',
    name: 'Classic Bun Maska with Special Chai',
    price: 70, rating: 4.9, reviews: 5200, veg: true, category: 'drinks',
    img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=260&fit=crop',
    desc: 'Pillow-soft sweet bun with salted Amul butter, paired with slow-brewed caramelised Irani tea.',
    tags: ['Mumbai Classic'],
    calories: 320, protein: 6, carbs: 42, fat: 15
  },
  {
    id: 'item_anand_jinny_dosa',
    restaurantId: 'res_anand_dosa',
    restaurantName: 'Anand Dosa Stall (Cart)',
    name: 'Chef Special Loaded Jinny Dosa',
    price: 180, rating: 4.9, reviews: 4900, veg: true, category: 'street_food',
    img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=260&fit=crop',
    desc: 'Crispy street dosa with shredded veggies, schezwan sauce, rolled and loaded with cheese.',
    tags: ['Cheese Burst', 'Viral'],
    calories: 560, protein: 14, carbs: 64, fat: 28
  },
  {
    id: 'item_vb_butter_masala_dosa',
    restaurantId: 'res_vidyarthi_bhavan',
    restaurantName: 'Vidyarthi Bhavan',
    name: 'Crispy Butter Masala Dosa',
    price: 85, rating: 4.9, reviews: 8400, veg: true, category: 'healthy',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
    desc: 'Golden thick, crispy butter dosa with red chutney spread and spiced potato filling.',
    tags: ['Heritage 1943'],
    calories: 380, protein: 9, carbs: 54, fat: 14
  },
  {
    id: 'item_death_by_chocolate',
    restaurantId: 'res_corner_house',
    restaurantName: 'Corner House Ice Cream',
    name: 'Death by Chocolate (DBC)',
    price: 260, rating: 5.0, reviews: 12000, veg: true, category: 'desserts',
    img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=260&fit=crop',
    desc: 'Dark chocolate cake with vanilla ice cream, toasted peanuts, cream, and bubbling warm hot fudge.',
    tags: ['Cult Legend'],
    calories: 680, protein: 12, carbs: 88, fat: 32
  },
  {
    id: 'item_paradise_mutton_biryani',
    restaurantId: 'res_paradise_hyd',
    restaurantName: 'Paradise Biryani Secunderabad',
    name: 'Paradise Special Mutton Dum Biryani',
    price: 399, rating: 4.8, reviews: 9200, veg: false, category: 'biryani',
    img: 'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=400&h=260&fit=crop',
    desc: 'Sealed handi dum biryani cooked with secret 31 spices, tender meat, and saffron rice.',
    tags: ['World Famous'],
    calories: 760, protein: 46, carbs: 78, fat: 28
  },
  {
    id: 'item_ghee_podi_idli',
    restaurantId: 'res_murugan_idli',
    restaurantName: 'Murugan Idli Shop',
    name: 'Melting Ghee Podi Idli (4 Pcs)',
    price: 140, rating: 4.9, reviews: 4600, veg: true, category: 'healthy',
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=260&fit=crop',
    desc: 'Pillowy soft steamed idlis tossed generously in spicy gunpowder podi and desi ghee.',
    tags: ['Pure Ghee'],
    calories: 360, protein: 11, carbs: 52, fat: 12
  },
  {
    id: 'item_original_chicken_65',
    restaurantId: 'res_buhari',
    restaurantName: 'Buhari Hotel (Original 65)',
    name: 'The 1965 Original Recipe Chicken 65',
    price: 290, rating: 4.8, reviews: 5200, veg: false, category: 'indian',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=260&fit=crop',
    desc: 'Crisp deep-fried spicy marinated chicken chunks created by A.M. Buhari in 1965.',
    tags: ['Original 1965'],
    calories: 510, protein: 44, carbs: 14, fat: 28
  },
  {
    id: 'item_shrewsbury_biscuits',
    restaurantId: 'res_kayani_bakery',
    restaurantName: 'Kayani Bakery (Pune)',
    name: 'Original Butter Shrewsbury Biscuits (400g Box)',
    price: 220, rating: 5.0, reviews: 8900, veg: true, category: 'desserts',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=260&fit=crop',
    desc: 'Pune’s most famous buttery, melt-in-mouth traditional English Shrewsbury biscuits.',
    tags: ['Heritage 1955'],
    calories: 450, protein: 6, carbs: 62, fat: 21
  }
];
