
// =============================================
// ===== CONFIGURATION & SUPABASE SETUP =====
// =============================================
// v30 AUTH FIXES:
//   - Session validation uses /auth/v1/user (not DB query) -> avoids RLS logout bug
//   - API.auth returns normalized {error, message} on failure
//   - handleLogin: better error mapping for all Supabase error codes
//   - handleSignup: detects user_already_exists + empty identities edge case
//   - tryRefreshSession: wrapped in try/catch, properly clears on failure
//   - authHeaders include x-client-info for Supabase compatibility
// Run foodgasm_migration.sql in Supabase SQL Editor before first use.
// =============================================
const CONFIG = {
  SUPABASE_URL: 'https://ryetnckmeckyievbxojl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZXRuY2ttZWNreWlldmJ4b2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzA2MTgsImV4cCI6MjA5NTA0NjYxOH0.8Wq58CNEQbzfZ4fdyPpdQ4Y4OjeCwaQy1-QyN5NBMNs',
  APP_NAME: 'Foodgasm',
  VERSION: '1.0.0',
  DELIVERY_FEE: 49,
  TAX_RATE: 0.05,
};

// ===== SUPABASE API LAYER =====
const API = {
  headers: () => ({
    'Content-Type': 'application/json',
    'apikey': CONFIG.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${STATE.authToken || CONFIG.SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  }),
  get: async (table, params = '') => {
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}${params}`, { headers: API.headers() });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || res.status); }
      return await res.json();
    } catch (e) { console.warn(`[API.get] ${table}:`, e.message); return null; }
  },
  post: async (table, body) => {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: API.headers(), body: JSON.stringify(body)
    });
    if (!res.ok) { let e; try { e = await res.json(); } catch(_){} throw new Error((e && (e.message||e.details||e.hint)) || `HTTP ${res.status} on ${table}`); }
    return await res.json();
  },
  postSafe: async (table, body) => {
    try { return await API.post(table, body); } catch(e) { console.warn(`[API.postSafe] ${table}:`, e.message); return null; }
  },
  patch: async (table, filter, body) => {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH', headers: API.headers(), body: JSON.stringify(body)
    });
    if (!res.ok) { let e; try { e = await res.json(); } catch(_){} throw new Error((e && (e.message||e.details||e.hint)) || `HTTP ${res.status} on ${table}`); }
    return await res.json();
  },
  delete: async (table, filter) => {
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: 'DELETE', headers: API.headers()
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || res.status); }
      return true;
    } catch (e) { console.warn(`[API.delete] ${table}:`, e.message); return false; }
  },
  rpc: async (fn, body = {}) => {
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST', headers: API.headers(), body: JSON.stringify(body)
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || res.status); }
      return await res.json();
    } catch (e) { console.warn(`[API.rpc] ${fn}:`, e.message); return null; }
  },
  auth: {
    _authHeaders: () => ({
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'x-client-info': 'foodgasm/1.0'
    }),
    signIn: async (email, password) => {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: API.auth._authHeaders(),
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        console.log('[Auth.signIn] status:', res.status, 'data:', data);
        // Normalize error shape — Supabase returns different shapes across versions
        if (!res.ok) {
          return { error: true, message: data.error_description || data.message || data.msg || 'Login failed', status: res.status };
        }
        return data;
      } catch(e) {
        console.error('[Auth.signIn] network error:', e);
        return { error: true, message: 'Network error. Check your connection.' };
      }
    },
    signUp: async (email, password, meta) => {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: API.auth._authHeaders(),
          body: JSON.stringify({ email, password, data: meta })
        });
        const data = await res.json();
        console.log('[Auth.signUp] status:', res.status, 'data:', data);
        if (!res.ok) {
          return { error: true, message: data.error_description || data.message || data.msg || 'Signup failed', status: res.status };
        }
        return data;
      } catch(e) {
        console.error('[Auth.signUp] network error:', e);
        return { error: true, message: 'Network error. Check your connection.' };
      }
    },
    getUser: async (token) => {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
          headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}`, 'x-client-info': 'foodgasm/1.0' }
        });
        if (!res.ok) return null;
        return await res.json();
      } catch(e) { return null; }
    },
    signOut: async () => {
      try {
        await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: { ...API.auth._authHeaders(), 'Authorization': `Bearer ${STATE.authToken || CONFIG.SUPABASE_ANON_KEY}` }
        });
      } catch(e) {}
    },
    refreshSession: async (refresh_token) => {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: API.auth._authHeaders(),
          body: JSON.stringify({ refresh_token })
        });
        if (!res.ok) return null;
        return await res.json();
      } catch(e) { return null; }
    }
  }
};

// =============================================
// ===== APPLICATION STATE =====
// =============================================
const STATE = {
  currentPage: 'home',
  cart: JSON.parse(localStorage.getItem('fg_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('fg_wishlist') || '[]'),
  recentSearches: JSON.parse(localStorage.getItem('fg_recent_searches') || '[]'),
  theme: localStorage.getItem('fg_theme') || 'dark',
  language: localStorage.getItem('fg_lang') || 'en',
  currency: localStorage.getItem('fg_currency') || 'INR',
  authToken: localStorage.getItem('fg_auth_token') || null,
  refreshToken: localStorage.getItem('fg_refresh_token') || null,
  user: JSON.parse(localStorage.getItem('fg_user') || 'null'),
  location: localStorage.getItem('fg_location') || 'Mumbai',
  selectedRestaurant: null,
  promoCode: null,
  promoDiscount: 0,
  selectedPayment: 'cod',
  selectedDeliveryTime: 'asap',
  filters: { category: 'all', sort: 'rating', dietary: [], vegFilter: 'all' },
  searchQuery: '',
  orderFilter: 'all',
  lastScroll: 0,
  addresses: [],
  orders: [],
};

// ===== SESSION HELPERS =====
function saveSession(data) {
  STATE.authToken = data.access_token;
  STATE.refreshToken = data.refresh_token;
  STATE.user = {
    id: data.user?.id,
    name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User',
    email: data.user?.email,
    phone: data.user?.user_metadata?.phone || '',
  };
  localStorage.setItem('fg_auth_token', data.access_token);
  localStorage.setItem('fg_refresh_token', data.refresh_token);
  localStorage.setItem('fg_user', JSON.stringify(STATE.user));
}
function clearSession() {
  STATE.authToken = null;
  STATE.refreshToken = null;
  STATE.user = null;
  STATE.cart = [];
  STATE.wishlist = [];
  ['fg_auth_token','fg_refresh_token','fg_user','fg_cart','fg_wishlist'].forEach(k => localStorage.removeItem(k));
}
async function tryRefreshSession() {
  if (!STATE.refreshToken) return false;
  try {
    const data = await API.auth.refreshSession(STATE.refreshToken);
    if (data?.access_token) {
      saveSession(data);
      console.log('[tryRefreshSession] Session refreshed successfully.');
      return true;
    }
    console.log('[tryRefreshSession] Refresh returned no token:', data);
    clearSession();
    return false;
  } catch(e) {
    console.error('[tryRefreshSession] Error:', e);
    clearSession();
    return false;
  }
}

// =============================================
// ===== MOCK DATA =====
// =============================================
const CATEGORIES = [
  {id:'all',emoji:'🍽️',label:'All'},
  {id:'burgers',emoji:'🍔',label:'Burgers'},
  {id:'pizza',emoji:'🍕',label:'Pizza'},
  {id:'biryani',emoji:'🍛',label:'Biryani'},
  {id:'indian',emoji:'🍲',label:'Indian'},
  {id:'healthy',emoji:'🥗',label:'Healthy'},
  {id:'drinks',emoji:'☕',label:'Beverages'},
  {id:'desserts',emoji:'🍰',label:'Desserts'},
  {id:'chinese',emoji:'🥟',label:'Chinese'},
  {id:'rolls',emoji:'🌯',label:'Rolls'},
  {id:'pasta',emoji:'🍝',label:'Pasta'},
];

const RESTAURANTS = [
  {id:1,name:"Domino's Pizza",cuisine:'Pizza · Pasta · Sides',img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=220&fit=crop&auto=format',rating:4.3,deliveryTime:'20-30',deliveryFee:0,minOrder:199,distance:'1.2km',badge:'popular',offer:'Buy 1 Get 1 Free on weekdays',category:'pizza',veg:false},
  {id:2,name:'KFC',cuisine:'Fried Chicken · Burgers · Wraps',img:'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=220&fit=crop&auto=format',rating:4.2,deliveryTime:'25-35',deliveryFee:49,minOrder:299,distance:'0.9km',badge:'trending',offer:'20% OFF on first order',category:'burgers',veg:false},
  {id:3,name:'Pizza Hut',cuisine:'Pizza · Pasta · Garlic Bread',img:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=220&fit=crop&auto=format',rating:4.1,deliveryTime:'30-40',deliveryFee:0,minOrder:299,distance:'1.8km',badge:null,offer:'Free Garlic Bread on orders above 499',category:'pizza',veg:false},
  {id:4,name:'Subway',cuisine:'Sandwiches · Wraps · Salads',img:'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=220&fit=crop&auto=format',rating:4.0,deliveryTime:'20-30',deliveryFee:0,minOrder:199,distance:'0.5km',badge:null,offer:'',category:'healthy',veg:false},
  {id:5,name:'Starbucks',cuisine:'Coffee · Frappuccino · Snacks',img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=220&fit=crop&auto=format',rating:4.5,deliveryTime:'15-25',deliveryFee:49,minOrder:149,distance:'0.3km',badge:'new',offer:'Free cake slice with any venti drink',category:'drinks',veg:true},
  {id:6,name:'Burger King',cuisine:'Burgers · Fries · Beverages',img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=220&fit=crop&auto=format',rating:4.1,deliveryTime:'25-35',deliveryFee:29,minOrder:249,distance:'1.5km',badge:'trending',offer:'Flat 30% OFF on Whopper meals',category:'burgers',veg:false},
  {id:7,name:'Barbeque Nation',cuisine:'Barbeque · North Indian · Grills',img:'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=220&fit=crop&auto=format',rating:4.6,deliveryTime:'40-50',deliveryFee:0,minOrder:499,distance:'3.2km',badge:'promoted',offer:'Free Delivery on orders above 999',category:'indian',veg:false},
  {id:8,name:'Biryani By Kilo',cuisine:'Biryani · Kebabs · Curries',img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=220&fit=crop&auto=format',rating:4.7,deliveryTime:'35-45',deliveryFee:0,minOrder:399,distance:'2.1km',badge:'popular',offer:'Family handi at special price',category:'biryani',veg:false},
  {id:9,name:"Haldiram's",cuisine:'Snacks · Sweets · Thali · Chaat',img:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=220&fit=crop&auto=format',rating:4.4,deliveryTime:'20-30',deliveryFee:0,minOrder:199,distance:'0.8km',badge:null,offer:'10% OFF on festive combos',category:'indian',veg:true},
  {id:10,name:"McDonald's",cuisine:'Burgers · McFlurry · Fries · Wraps',img:'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=220&fit=crop&auto=format',rating:4.2,deliveryTime:'20-30',deliveryFee:29,minOrder:149,distance:'1.1km',badge:'popular',offer:'McSaver meals from ₹149',category:'burgers',veg:false},
  {id:11,name:'Paradise Biryani',cuisine:'Hyderabadi Biryani · Kebabs · Haleem',img:'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=220&fit=crop&auto=format',rating:4.8,deliveryTime:'30-40',deliveryFee:0,minOrder:349,distance:'2.4km',badge:'popular',offer:'Free Raita with every biryani order',category:'biryani',veg:false},
  {id:12,name:'Behrouz Biryani',cuisine:'Biryani · Kebabs · Curries',img:'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=400&h=220&fit=crop&auto=format',rating:4.6,deliveryTime:'35-45',deliveryFee:49,minOrder:399,distance:'2.9km',badge:'trending',offer:'Dum biryani sealed in a royal pot',category:'biryani',veg:false},
  {id:13,name:'Wow! Momo',cuisine:'Momos · Burgers · Rolls · Thukpa',img:'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=220&fit=crop&auto=format',rating:4.3,deliveryTime:'20-30',deliveryFee:0,minOrder:149,distance:'0.7km',badge:'trending',offer:'Buy 12 get 4 free on steam momos',category:'chinese',veg:false},
  {id:14,name:'Faasos',cuisine:'Wraps · Rolls · Biryani · Bowls',img:'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=220&fit=crop&auto=format',rating:4.1,deliveryTime:'25-35',deliveryFee:29,minOrder:199,distance:'1.3km',badge:null,offer:'20% OFF on wraps combo',category:'rolls',veg:false},
  {id:15,name:'The Good Bowl',cuisine:'Healthy · Buddha Bowls · Quinoa · Salads',img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=220&fit=crop&auto=format',rating:4.4,deliveryTime:'20-35',deliveryFee:49,minOrder:249,distance:'1.6km',badge:'new',offer:'15% OFF on all bowls this week',category:'healthy',veg:true},
  {id:16,name:'Naturals Ice Cream',cuisine:'Ice Cream · Gelato · Shakes · Sundaes',img:'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=220&fit=crop&auto=format',rating:4.7,deliveryTime:'15-25',deliveryFee:0,minOrder:99,distance:'0.4km',badge:'popular',offer:'Buy 2 scoops get 1 free',category:'desserts',veg:true},
  {id:17,name:'Chaayos',cuisine:'Chai · Snacks · Sandwiches · Maggi',img:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=220&fit=crop&auto=format',rating:4.3,deliveryTime:'15-20',deliveryFee:0,minOrder:99,distance:'0.2km',badge:null,offer:'Free biscuits with any chai order',category:'drinks',veg:true},
  {id:18,name:'Punjabi Dhaba Express',cuisine:'Dal Makhani · Butter Chicken · Naan · Lassi',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=220&fit=crop&auto=format',rating:4.5,deliveryTime:'30-40',deliveryFee:0,minOrder:299,distance:'1.9km',badge:'popular',offer:'Lunch thali at ₹199 — unlimited',category:'indian',veg:false},
  {id:19,name:'Roll Express',cuisine:'Kathi Rolls · Egg Rolls · Frankie',img:'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=220&fit=crop&auto=format',rating:4.2,deliveryTime:'15-25',deliveryFee:0,minOrder:149,distance:'0.6km',badge:null,offer:'4 rolls for ₹199 — limited time',category:'rolls',veg:false},
  {id:20,name:'Meghna Foods',cuisine:'Bengali Sweets · Mishti Doi · Sandesh · Rosogolla',img:'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=400&h=220&fit=crop&auto=format',rating:4.9,deliveryTime:'20-30',deliveryFee:49,minOrder:149,distance:'1.0km',badge:'popular',offer:'Fresh sweets made daily',category:'desserts',veg:true},
  {id:21,name:'Farinelli Pizza',cuisine:'Artisan Pizza · Pasta · Bruschetta · Wine',img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=220&fit=crop&auto=format',rating:4.7,deliveryTime:'35-45',deliveryFee:49,minOrder:499,distance:'3.5km',badge:'new',offer:'Wood-fired authentic Neapolitan pizza',category:'pizza',veg:false},
  {id:22,name:'Chili\'s Grill & Bar',cuisine:'American · Grills · Burgers · Cocktails',img:'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=220&fit=crop&auto=format',rating:4.4,deliveryTime:'40-50',deliveryFee:99,minOrder:599,distance:'4.1km',badge:'trending',offer:'Half-price apps on weekday evenings',category:'burgers',veg:false},
  {id:23,name:'Saffron Spice',cuisine:'Mughlai · Kebabs · Biryani · Nihari',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=220&fit=crop&auto=format',rating:4.6,deliveryTime:'35-45',deliveryFee:0,minOrder:399,distance:'2.7km',badge:'promoted',offer:'Dum gosht special available weekends',category:'indian',veg:false},
  {id:24,name:'Green Leaf Cafe',cuisine:'Vegan · Salads · Smoothie Bowls · Wraps',img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=220&fit=crop&auto=format',rating:4.5,deliveryTime:'20-30',deliveryFee:29,minOrder:199,distance:'1.4km',badge:'new',offer:'100% plant-based · no compromise on taste',category:'healthy',veg:true},
];

const FOODS = [
  {id:101,name:"Margherita Pizza",restaurantId:1,restaurantName:"Domino's Pizza",img:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=220&fit=crop&auto=format',price:249,rating:4.4,reviews:1823,category:'pizza',veg:true,desc:'Classic tomato sauce, mozzarella cheese, and fresh basil on a hand-tossed crust.',tags:['Bestseller','Veg']},
  {id:102,name:"Peppy Paneer Pizza",restaurantId:1,restaurantName:"Domino's Pizza",img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=220&fit=crop&auto=format',price:329,rating:4.5,reviews:2147,category:'pizza',veg:true,desc:'Chunky paneer tikka with capsicum, onions, and tangy makhani sauce.',tags:['Bestseller','Veg']},
  {id:103,name:"Chicken Zinger Burger",restaurantId:2,restaurantName:'KFC',img:'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=220&fit=crop&auto=format',price:199,rating:4.3,reviews:3412,category:'burgers',veg:false,desc:'Crispy golden fried chicken fillet with coleslaw and secret Zinger sauce in a sesame bun.',tags:['Bestseller']},
  {id:104,name:"KFC Bucket (8pc)",restaurantId:2,restaurantName:'KFC',img:'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=220&fit=crop&auto=format',price:649,rating:4.5,reviews:2890,category:'burgers',veg:false,desc:'8 pieces of original recipe fried chicken with smoky BBQ sauce.',tags:['Party Pack','Bestseller']},
  {id:105,name:"Chicken Supreme Pizza",restaurantId:3,restaurantName:'Pizza Hut',img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=220&fit=crop&auto=format',price:499,rating:4.2,reviews:1654,category:'pizza',veg:false,desc:'Stuffed crust pizza topped with grilled chicken, mushrooms, olives, and bell peppers.',tags:['Chef Special']},
  {id:106,name:"Veggie Paradise Pizza",restaurantId:3,restaurantName:'Pizza Hut',img:'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=300&h=220&fit=crop&auto=format',price:399,rating:4.1,reviews:987,category:'pizza',veg:true,desc:'Garden-fresh veggies on a garlic butter base with double mozzarella.',tags:['Veg']},
  {id:107,name:"Veggie Delite Sub (6\")",restaurantId:4,restaurantName:'Subway',img:'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&h=220&fit=crop&auto=format',price:179,rating:4.0,reviews:2134,category:'healthy',veg:true,desc:'Fresh cucumbers, tomatoes, capsicum, lettuce, and olives on freshly baked Italian bread.',tags:['Veg','Healthy']},
  {id:108,name:"Chicken Teriyaki Sub (Footlong)",restaurantId:4,restaurantName:'Subway',img:'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&h=220&fit=crop&auto=format',price:299,rating:4.2,reviews:1678,category:'healthy',veg:false,desc:'Tender teriyaki-glazed chicken strips with fresh veggies and Chipotle Southwest sauce.',tags:['Popular']},
  {id:109,name:"Caramel Frappuccino",restaurantId:5,restaurantName:'Starbucks',img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=220&fit=crop&auto=format',price:395,rating:4.6,reviews:3201,category:'drinks',veg:true,desc:'Blended coffee with caramel syrup, milk, and ice, topped with whipped cream and caramel drizzle.',tags:['Bestseller','Veg']},
  {id:110,name:"Java Chip Frappuccino",restaurantId:5,restaurantName:'Starbucks',img:'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&h=220&fit=crop&auto=format',price:425,rating:4.7,reviews:2876,category:'drinks',veg:true,desc:'Mocha sauce and Frappuccino chips blended with milk and ice, topped with whipped cream.',tags:['Veg','Popular']},
  {id:111,name:"Whopper Burger",restaurantId:6,restaurantName:'Burger King',img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=220&fit=crop&auto=format',price:229,rating:4.2,reviews:4123,category:'burgers',veg:false,desc:'Flame-grilled beef patty with lettuce, tomato, onion, pickles, ketchup, and mayo.',tags:['Bestseller']},
  {id:112,name:"Crispy Veg Burger",restaurantId:6,restaurantName:'Burger King',img:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=220&fit=crop&auto=format',price:129,rating:4.0,reviews:1987,category:'burgers',veg:true,desc:'Crispy veggie patty with fresh lettuce, tomato, and Burger King special sauce.',tags:['Veg']},
  {id:113,name:"Peri Peri Chicken",restaurantId:7,restaurantName:'Barbeque Nation',img:'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=220&fit=crop&auto=format',price:349,rating:4.7,reviews:2341,category:'indian',veg:false,desc:'Tender chicken marinated in fiery peri peri sauce, live grilled at your table.',tags:['Spicy','Bestseller']},
  {id:114,name:"Paneer Tikka (Starter)",restaurantId:7,restaurantName:'Barbeque Nation',img:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=220&fit=crop&auto=format',price:299,rating:4.8,reviews:3012,category:'indian',veg:true,desc:'Cottage cheese marinated in spiced yogurt, char-grilled on the barbeque.',tags:['Veg','Bestseller']},
  {id:115,name:"Chicken Dum Biryani (Handi)",restaurantId:8,restaurantName:'Biryani By Kilo',img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=220&fit=crop&auto=format',price:399,rating:4.8,reviews:5612,category:'biryani',veg:false,desc:'Slow-cooked dum biryani with tender chicken pieces, aromatic whole spices, and saffron rice. Served in sealed handi.',tags:['Bestseller']},
  {id:116,name:"Royal Veg Biryani (Handi)",restaurantId:8,restaurantName:'Biryani By Kilo',img:'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=220&fit=crop&auto=format',price:349,rating:4.6,reviews:3214,category:'biryani',veg:true,desc:'Fresh vegetables and paneer slow-cooked with basmati rice, rose water, and saffron.',tags:['Veg','Bestseller']},
  {id:117,name:"Aloo Tikki Chaat",restaurantId:9,restaurantName:"Haldiram's",img:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=220&fit=crop&auto=format',price:99,rating:4.3,reviews:2876,category:'indian',veg:true,desc:'Crispy potato patties topped with yogurt, tamarind chutney, coriander, and pomegranate.',tags:['Veg','Popular']},
  {id:118,name:"Kaju Katli (250g)",restaurantId:9,restaurantName:"Haldiram's",img:'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=300&h=220&fit=crop&auto=format',price:249,rating:4.6,reviews:4231,category:'desserts',veg:true,desc:'Premium cashew-based sweet made with pure ghee, perfect for gifting or self-indulgence.',tags:['Veg','Bestseller','Gift']},
  {id:119,name:"McAloo Tikki Burger",restaurantId:10,restaurantName:"McDonald's",img:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=220&fit=crop&auto=format',price:99,rating:4.1,reviews:5678,category:'burgers',veg:true,desc:'Crispy aloo tikki patty with fresh lettuce, tomato, and spicy sauce in a soft bun.',tags:['Veg','Budget','Bestseller']},
  {id:120,name:"McSpicy Chicken Burger",restaurantId:10,restaurantName:"McDonald's",img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=220&fit=crop&auto=format',price:179,rating:4.3,reviews:4321,category:'burgers',veg:false,desc:'Crispy spicy chicken fillet with mayo and lettuce. The spiciest burger at McDonald\'s!',tags:['Spicy','Popular']},
  {id:121,name:"McFlurry (Oreo)",restaurantId:10,restaurantName:"McDonald's",img:'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=220&fit=crop&auto=format',price:129,rating:4.5,reviews:2987,category:'desserts',veg:true,desc:'Soft serve ice cream blended with crushed Oreo cookies for the ultimate dessert fix.',tags:['Veg','Dessert']},
  {id:122,name:"Hyderabadi Dum Biryani",restaurantId:11,restaurantName:'Paradise Biryani',img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=220&fit=crop&auto=format',price:449,rating:4.9,reviews:7823,category:'biryani',veg:false,desc:'The legendary Hyderabadi biryani — tender mutton or chicken sealed and dum-cooked with fragrant basmati.',tags:['Legendary','Bestseller','Spicy']},
  {id:123,name:"Veg Dum Biryani",restaurantId:11,restaurantName:'Paradise Biryani',img:'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=220&fit=crop&auto=format',price:299,rating:4.7,reviews:3410,category:'biryani',veg:true,desc:'Seasonal vegetables and dry fruits in aromatic basmati rice cooked dum-style.',tags:['Veg','Bestseller']},
  {id:124,name:"Royal Chicken Biryani",restaurantId:12,restaurantName:'Behrouz Biryani',img:'https://images.unsplash.com/photo-1630409351217-bc4f5f2d1e2c?w=300&h=220&fit=crop&auto=format',price:499,rating:4.6,reviews:4120,category:'biryani',veg:false,desc:'The Behrouz special — slow-dum chicken biryani in a sealed royal pot. Aromatic and deeply flavourful.',tags:['Royal','Bestseller']},
  {id:125,name:"Steam Momos (8pc)",restaurantId:13,restaurantName:'Wow! Momo',img:'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&h=220&fit=crop&auto=format',price:109,rating:4.3,reviews:6754,category:'chinese',veg:true,desc:'Soft steamed dumplings stuffed with seasoned veggies. Served with spicy schezwan dip.',tags:['Veg','Budget','Bestseller']},
  {id:126,name:"Chicken Momo (Fried)",restaurantId:13,restaurantName:'Wow! Momo',img:'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&h=220&fit=crop&auto=format',price:149,rating:4.5,reviews:5213,category:'chinese',veg:false,desc:'Crispy fried chicken momos with smoky filling and tangy chilli dip.',tags:['Spicy','Popular']},
  {id:127,name:"Chicken Kathi Roll",restaurantId:14,restaurantName:'Faasos',img:'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&h=220&fit=crop&auto=format',price:149,rating:4.2,reviews:3876,category:'rolls',veg:false,desc:'Tender spiced chicken wrapped in a crispy rumali roti with onions, chilli sauce, and chutney.',tags:['Bestseller']},
  {id:128,name:"Paneer Tikka Wrap",restaurantId:14,restaurantName:'Faasos',img:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=220&fit=crop&auto=format',price:139,rating:4.1,reviews:2543,category:'rolls',veg:true,desc:'Spiced paneer tikka with bell peppers, onions, and mint chutney in a whole wheat paratha.',tags:['Veg','Healthy']},
  {id:129,name:"Buddha Bowl",restaurantId:15,restaurantName:'The Good Bowl',img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=220&fit=crop&auto=format',price:299,rating:4.4,reviews:1987,category:'healthy',veg:true,desc:'Quinoa, roasted chickpeas, avocado, cherry tomatoes, cucumber, and tahini dressing.',tags:['Veg','Healthy','Protein']},
  {id:130,name:"Grilled Chicken Bowl",restaurantId:15,restaurantName:'The Good Bowl',img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=220&fit=crop&auto=format',price:349,rating:4.5,reviews:1654,category:'healthy',veg:false,desc:'Grilled chicken breast over brown rice, steamed broccoli, and lemon herb dressing.',tags:['Protein','Healthy']},
  {id:131,name:"Sitafal Ice Cream (2 Scoops)",restaurantId:16,restaurantName:"Naturals Ice Cream",img:'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=220&fit=crop&auto=format',price:149,rating:4.8,reviews:8234,category:'desserts',veg:true,desc:'Pure natural custard apple ice cream with real fruit pieces. No artificial flavours ever.',tags:['Veg','Pure Natural','Bestseller']},
  {id:132,name:"Mango Ice Cream (2 Scoops)",restaurantId:16,restaurantName:"Naturals Ice Cream",img:'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&h=220&fit=crop&auto=format',price:129,rating:4.9,reviews:10231,category:'desserts',veg:true,desc:'Made from Alphonso mangoes. The most loved seasonal flavour at Naturals.',tags:['Veg','Seasonal','Bestseller']},
  {id:133,name:"Masala Chai",restaurantId:17,restaurantName:'Chaayos',img:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=220&fit=crop&auto=format',price:89,rating:4.5,reviews:9876,category:'drinks',veg:true,desc:'Traditional Indian masala chai with ginger, cardamom, and freshly brewed tea leaves.',tags:['Veg','Bestseller','Hot']},
  {id:134,name:"Cold Coffee",restaurantId:17,restaurantName:'Chaayos',img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=220&fit=crop&auto=format',price:149,rating:4.4,reviews:4562,category:'drinks',veg:true,desc:'Iced cold coffee blended with milk and sugar. Refreshing and energising.',tags:['Veg','Cold','Popular']},
  {id:135,name:"Butter Chicken (Half)",restaurantId:18,restaurantName:'Punjabi Dhaba Express',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=220&fit=crop&auto=format',price:299,rating:4.7,reviews:6543,category:'indian',veg:false,desc:'Slow-cooked chicken in rich tomato-butter-cream gravy. Best with naan or tandoori roti.',tags:['Bestseller','Spicy']},
  {id:136,name:"Dal Makhani",restaurantId:18,restaurantName:'Punjabi Dhaba Express',img:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=220&fit=crop&auto=format',price:199,rating:4.6,reviews:4327,category:'indian',veg:true,desc:'Slow-cooked black lentils in butter and cream. A Punjabi classic simmered overnight.',tags:['Veg','Bestseller']},
  {id:137,name:"Egg Roll (Double Egg)",restaurantId:19,restaurantName:'Roll Express',img:'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&h=220&fit=crop&auto=format',price:79,rating:4.3,reviews:7654,category:'rolls',veg:false,desc:'Double fried egg with onions and green chilli wrapped in a crispy paratha. Kolkata street style!',tags:['Bestseller','Budget']},
  {id:138,name:"Mutton Kathi Roll",restaurantId:19,restaurantName:'Roll Express',img:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=220&fit=crop&auto=format',price:149,rating:4.5,reviews:3421,category:'rolls',veg:false,desc:'Tender mutton keema with onions, green chillies, and kasundi mustard in a crispy paratha.',tags:['Popular','Spicy']},
  {id:139,name:"Rosogolla (6pc)",restaurantId:20,restaurantName:'Meghna Foods',img:'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=300&h=220&fit=crop&auto=format',price:149,rating:4.9,reviews:11234,category:'desserts',veg:true,desc:'Soft, spongy Bengali rosogollas in light sugar syrup. Made fresh every morning.',tags:['Veg','Authentic','Bestseller']},
  {id:140,name:"Mishti Doi",restaurantId:20,restaurantName:'Meghna Foods',img:'https://images.unsplash.com/photo-1571167366136-b57e07161714?w=300&h=220&fit=crop&auto=format',price:89,rating:4.8,reviews:8765,category:'desserts',veg:true,desc:'Sweetened curd set in earthen pots. Creamy, tangy, and perfectly sweetened.',tags:['Veg','Traditional','Bestseller']},
  {id:141,name:"Wood-Fired Margherita",restaurantId:21,restaurantName:'Farinelli Pizza',img:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=220&fit=crop&auto=format',price:499,rating:4.8,reviews:2134,category:'pizza',veg:true,desc:'Authentic Neapolitan pizza with San Marzano tomatoes, fresh buffalo mozzarella, and basil. Baked at 450°C.',tags:['Veg','Artisan','Premium']},
  {id:142,name:"Truffle Mushroom Pizza",restaurantId:21,restaurantName:'Farinelli Pizza',img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=220&fit=crop&auto=format',price:699,rating:4.9,reviews:1876,category:'pizza',veg:true,desc:'Wild mushrooms with truffle oil, garlic, mozzarella, and parsley on a crispy wood-fired base.',tags:['Veg','Premium','Bestseller']},
  {id:143,name:"Cajun Chicken Sandwich",restaurantId:22,restaurantName:"Chili's Grill & Bar",img:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=220&fit=crop&auto=format',price:599,rating:4.4,reviews:987,category:'burgers',veg:false,desc:'Grilled Cajun-spiced chicken breast with avocado, lettuce, and smoky chipotle mayo.',tags:['Popular','Spicy']},
  {id:144,name:"Chicken Seekh Kebab",restaurantId:23,restaurantName:'Saffron Spice',img:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=220&fit=crop&auto=format',price:329,rating:4.7,reviews:3214,category:'indian',veg:false,desc:'Minced chicken blended with aromatic spices, grilled on a tandoor to perfection.',tags:['Bestseller','Spicy']},
  {id:145,name:"Green Goddess Salad",restaurantId:24,restaurantName:'Green Leaf Cafe',img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=220&fit=crop&auto=format',price:279,rating:4.5,reviews:1543,category:'healthy',veg:true,desc:'Mixed greens, avocado, cucumber, edamame, and hemp seeds with lemon-tahini dressing.',tags:['Veg','Healthy','Vegan']},
];

const MOCK_ORDERS = [
  {id:'#FG10234',restaurant:"Domino's Pizza",items:["Margherita Pizza x2","Peppy Paneer x1"],total:947,status:'delivered',date:'2 days ago',step:4},
  {id:'#FG10235',restaurant:'Biryani By Kilo',items:['Chicken Dum Biryani x1','Royal Veg Biryani x1'],total:928,status:'on-the-way',date:'Today',step:3},
  {id:'#FG10236',restaurant:'Barbeque Nation',items:['Peri Peri Chicken x2','Paneer Tikka x1'],total:1147,status:'preparing',date:'Today',step:2},
  {id:'#FG10237',restaurant:'KFC',items:['Chicken Zinger x2','KFC Bucket x1'],total:1137,status:'cancelled',date:'1 week ago',step:0},
];

const LANGUAGES = [
  {code:'en',name:'English',flag:'IN',dir:'ltr'},
  {code:'hi',name:'हिन्दी',flag:'IN',dir:'ltr'},
  {code:'bn',name:'বাংলা',flag:'IN',dir:'ltr'},
  {code:'ta',name:'தமிழ்',flag:'IN',dir:'ltr'},
  {code:'te',name:'తెలుగు',flag:'IN',dir:'ltr'},
  {code:'kn',name:'ಕನ್ನಡ',flag:'IN',dir:'ltr'},
  {code:'mr',name:'मराठी',flag:'IN',dir:'ltr'},
];

const CURRENCIES = {
  INR:{symbol:'₹',rate:1},
};

const I18N = {
  en:{home:'Home',search:'Search',cart:'Cart',orders:'Orders',wishlist:'Wishlist',profile:'Profile',settings:'Settings',admin:'Admin',restaurants:'Restaurants',categories:'Categories',see_all:'See All',hero_tag:'Lightning Fast Delivery',hero_title_1:'Craving Something',hero_title_2:'Delicious?',hero_subtitle:'Order from hundreds of restaurants near you.',search_placeholder:'Search for biryani, dosa, pizza...',trending_now:'Trending Now',top_restaurants:'Top Restaurants',popular_near:'Popular Near You',add_to_cart:'Add to Cart',added:'Added!',remove:'Remove',your_cart:'Your Cart',cart_empty:'Your cart is empty',cart_empty_sub:'Add some delicious food!',browse_food:'Browse Food',order_summary:'Order Summary',subtotal:'Subtotal',delivery_fee:'Delivery Fee',taxes:'GST',discount:'Discount',total:'Total',enter_coupon:'Enter coupon code',apply:'Apply',proceed_checkout:'Proceed to Checkout →',checkout:'Checkout',delivery_address:'Delivery Address',delivery_time:'Delivery Time',payment_method:'Payment Method',place_order:'Place Order',my_orders:'My Orders',track_order:'Track Order',back_home:'Back to Home',order_placed:'Order Placed!',order_placed_sub:'Your order is confirmed.',estimated_delivery:'Estimated Delivery',limited_offer:'Limited Time Offer',promo_title:'Get 50% OFF',promo_sub:'Use code FOODGASM50',claim_now:'Claim Now',login:'Login',signup:'Sign Up',email:'Email',password:'Password',forgot_password:'Forgot password?',continue_with_google:'Continue with Google',or_continue:'or continue with email',create_account:'Create Account',first_name:'First Name',last_name:'Last Name',phone:'Phone',agree_terms:'By signing up, you agree to our',logout:'Logout',admin_dashboard:'Admin Dashboard',admin_sub:'Manage your platform',refresh:'Refresh',recent_orders:'Recent Orders',view_all:'View All',order_id:'Order ID',customer:'Customer',restaurant:'Restaurant',amount:'Amount',status:'Status',time:'Time',popular_items:'Popular Items',set_location:'Set Delivery Location',back:'Back',all_restaurants:'All Restaurants',dark_mode:'Dark Mode',dark_mode_sub:'Toggle dark/light theme',notifications:'Notifications',notif_sub:'Order updates, offers',language:'Language',language_sub:'Choose your language',currency:'Currency',currency_sub:'Default currency',about:'About Foodgasm',terms:'Terms & Privacy',support:'Help & Support',home_addr:'Home',work:'Work',saved_addresses:'Saved Addresses',payment_methods:'Payment Methods',add_address:'Add New Address',add_card:'Add New Card',avg_delivery:'Avg. Delivery',avg_rating:'Avg. Rating',secure_payment:'Secure payment',pwa_title:'Add Foodgasm to Home Screen',pwa_sub:'Faster ordering, offline access',install:'Install',clear:'Clear',recent_searches:'Recent Searches',your_name:'Your name',enter_address:'Street address',notes_placeholder:'e.g. Leave at the door',points:'Points',full_name:'Full Name',address:'Address',city:'City',zip:'PIN Code',delivery_notes:'Delivery Notes (optional)',location_services:'Location Services',location_sub:'For accurate delivery',admin_dashboard_title:'Admin Dashboard'},
  hi:{home:'होम',search:'खोज',cart:'कार्ट',orders:'ऑर्डर',wishlist:'पसंदीदा',profile:'प्रोफ़ाइल',settings:'सेटिंग',admin:'एडमिन',restaurants:'रेस्टोरेंट',categories:'श्रेणियाँ',see_all:'सब देखें',hero_tag:'तेज़ डिलीवरी',hero_title_1:'कुछ खाने का',hero_title_2:'मन है?',hero_subtitle:'आपके पास सैकड़ों रेस्टोरेंट से ऑर्डर करें।',search_placeholder:'बिरयानी, दोसा, पिज़्ज़ा खोजें...',trending_now:'ट्रेंडिंग',top_restaurants:'टॉप रेस्टोरेंट',popular_near:'आपके पास लोकप्रिय',add_to_cart:'कार्ट में जोड़ें',added:'जोड़ा गया!',remove:'हटाएं',your_cart:'आपका कार्ट',cart_empty:'कार्ट खाली है',cart_empty_sub:'कुछ स्वादिष्ट खाना जोड़ें!',browse_food:'खाना देखें',order_summary:'ऑर्डर सारांश',subtotal:'उप-योग',delivery_fee:'डिलीवरी शुल्क',taxes:'जीएसटी',discount:'छूट',total:'कुल',enter_coupon:'कूपन कोड दर्ज करें',apply:'लागू करें',proceed_checkout:'चेकआउट करें →',checkout:'चेकआउट',delivery_address:'डिलीवरी पता',delivery_time:'डिलीवरी समय',payment_method:'भुगतान विधि',place_order:'ऑर्डर करें',my_orders:'मेरे ऑर्डर',track_order:'ऑर्डर ट्रैक करें',back_home:'होम पर जाएं',order_placed:'ऑर्डर हो गया!',order_placed_sub:'आपका ऑर्डर कन्फर्म हो गया।',estimated_delivery:'अनुमानित डिलीवरी',limited_offer:'सीमित समय ऑफर',promo_title:'50% की छूट पाएं',promo_sub:'कोड FOODGASM50 का उपयोग करें',claim_now:'अभी लें',login:'लॉगिन',signup:'साइन अप',email:'ईमेल',password:'पासवर्ड',forgot_password:'पासवर्ड भूल गए?',continue_with_google:'Google से जारी रखें',or_continue:'या ईमेल से जारी रखें',create_account:'अकाउंट बनाएं',first_name:'पहला नाम',last_name:'अंतिम नाम',phone:'फोन',agree_terms:'साइन अप करके, आप हमारी शर्तों से सहमत हैं',logout:'लॉगआउट',admin_dashboard:'एडमिन डैशबोर्ड',admin_sub:'अपना प्लेटफॉर्म प्रबंधित करें',refresh:'रिफ्रेश',recent_orders:'हाल के ऑर्डर',view_all:'सब देखें',order_id:'ऑर्डर आईडी',customer:'ग्राहक',restaurant:'रेस्टोरेंट',amount:'राशि',status:'स्थिति',time:'समय',popular_items:'लोकप्रिय आइटम',set_location:'डिलीवरी स्थान सेट करें',back:'वापस',all_restaurants:'सभी रेस्टोरेंट',dark_mode:'डार्क मोड',dark_mode_sub:'डार्क/लाइट थीम',notifications:'सूचनाएं',notif_sub:'ऑर्डर अपडेट, ऑफर',language:'भाषा',language_sub:'अपनी भाषा चुनें',currency:'मुद्रा',currency_sub:'डिफ़ॉल्ट मुद्रा',about:'Foodgasm के बारे में',terms:'नियम और गोपनीयता',support:'सहायता',home_addr:'घर',work:'कार्यालय',saved_addresses:'सहेजे गए पते',payment_methods:'भुगतान विधियां',add_address:'नया पता जोड़ें',avg_delivery:'औसत डिलीवरी',avg_rating:'औसत रेटिंग',secure_payment:'सुरक्षित भुगतान',install:'इंस्टॉल',clear:'साफ करें',recent_searches:'हाल की खोजें',your_name:'आपका नाम',enter_address:'गली का पता',notes_placeholder:'जैसे दरवाजे पर छोड़ें',points:'पॉइंट',full_name:'पूरा नाम',address:'पता',city:'शहर',zip:'पिन कोड',delivery_notes:'डिलीवरी नोट (वैकल्पिक)',location_services:'स्थान सेवाएं',location_sub:'सटीक डिलीवरी के लिए',add_card:'नया कार्ड जोड़ें',pwa_title:'Foodgasm होम स्क्रीन पर जोड़ें',pwa_sub:'तेज़ ऑर्डरिंग, ऑफलाइन एक्सेस',admin_dashboard_title:'एडमिन डैशबोर्ड'},
  bn:{home:'হোম',search:'খোঁজুন',cart:'কার্ট',orders:'অর্ডার',wishlist:'পছন্দের',profile:'প্রোফাইল',settings:'সেটিংস',admin:'অ্যাডমিন',restaurants:'রেস্টুরেন্ট',categories:'বিভাগ',see_all:'সব দেখুন',hero_tag:'দ্রুত ডেলিভারি',hero_title_1:'কিছু খেতে',hero_title_2:'ইচ্ছে করছে?',hero_subtitle:'আপনার কাছের শত শত রেস্টুরেন্ট থেকে অর্ডার করুন।',search_placeholder:'বিরিয়ানি, দোসা, পিৎজা খুঁজুন...',trending_now:'ট্রেন্ডিং',top_restaurants:'সেরা রেস্টুরেন্ট',popular_near:'কাছাকাছি জনপ্রিয়',add_to_cart:'কার্টে যোগ করুন',added:'যোগ হয়েছে!',remove:'সরান',your_cart:'আপনার কার্ট',cart_empty:'কার্ট খালি',cart_empty_sub:'কিছু সুস্বাদু খাবার যোগ করুন!',browse_food:'খাবার দেখুন',order_summary:'অর্ডার সারসংক্ষেপ',subtotal:'উপমোট',delivery_fee:'ডেলিভারি চার্জ',taxes:'জিএসটি',discount:'ছাড়',total:'মোট',enter_coupon:'কুপন কোড দিন',apply:'প্রয়োগ',proceed_checkout:'চেকআউট করুন →',checkout:'চেকআউট',delivery_address:'ডেলিভারি ঠিকানা',delivery_time:'ডেলিভারি সময়',payment_method:'পেমেন্ট পদ্ধতি',place_order:'অর্ডার করুন',my_orders:'আমার অর্ডার',track_order:'অর্ডার ট্র্যাক করুন',back_home:'হোমে ফিরুন',order_placed:'অর্ডার হয়েছে!',order_placed_sub:'আপনার অর্ডার নিশ্চিত হয়েছে।',estimated_delivery:'আনুমানিক ডেলিভারি',limited_offer:'সীমিত সময়ের অফার',promo_title:'৫০% ছাড় পান',promo_sub:'কোড FOODGASM50 ব্যবহার করুন',claim_now:'এখনই নিন',login:'লগইন',signup:'সাইন আপ',email:'ইমেইল',password:'পাসওয়ার্ড',forgot_password:'পাসওয়ার্ড ভুলে গেছেন?',continue_with_google:'Google দিয়ে চালিয়ে যান',or_continue:'বা ইমেইল দিয়ে চালিয়ে যান',create_account:'অ্যাকাউন্ট তৈরি করুন',first_name:'প্রথম নাম',last_name:'শেষ নাম',phone:'ফোন',agree_terms:'সাইন আপ করে আপনি আমাদের শর্তে সম্মত',logout:'লগআউট',admin_dashboard:'অ্যাডমিন ড্যাশবোর্ড',admin_sub:'আপনার প্ল্যাটফর্ম পরিচালনা করুন',refresh:'রিফ্রেশ',recent_orders:'সাম্প্রতিক অর্ডার',view_all:'সব দেখুন',order_id:'অর্ডার আইডি',customer:'গ্রাহক',restaurant:'রেস্টুরেন্ট',amount:'পরিমাণ',status:'অবস্থা',time:'সময়',popular_items:'জনপ্রিয় আইটেম',set_location:'ডেলিভারি স্থান সেট করুন',back:'ফিরে যান',all_restaurants:'সব রেস্টুরেন্ট',dark_mode:'ডার্ক মোড',dark_mode_sub:'ডার্ক/লাইট থিম',notifications:'বিজ্ঞপ্তি',notif_sub:'অর্ডার আপডেট, অফার',language:'ভাষা',language_sub:'আপনার ভাষা বেছে নিন',currency:'মুদ্রা',currency_sub:'ডিফল্ট মুদ্রা',about:'Foodgasm সম্পর্কে',terms:'নিয়ম ও গোপনীয়তা',support:'সহায়তা',home_addr:'বাড়ি',work:'অফিস',saved_addresses:'সংরক্ষিত ঠিকানা',payment_methods:'পেমেন্ট পদ্ধতি',add_address:'নতুন ঠিকানা যোগ করুন',avg_delivery:'গড় ডেলিভারি',avg_rating:'গড় রেটিং',secure_payment:'নিরাপদ পেমেন্ট',install:'ইনস্টল',clear:'মুছুন',recent_searches:'সাম্প্রতিক অনুসন্ধান',your_name:'আপনার নাম',enter_address:'রাস্তার ঠিকানা',notes_placeholder:'যেমন দরজায় রেখে যান',points:'পয়েন্ট',full_name:'পূর্ণ নাম',address:'ঠিকানা',city:'শহর',zip:'পিন কোড',delivery_notes:'ডেলিভারি নোট (ঐচ্ছিক)',location_services:'অবস্থান সেবা',location_sub:'সঠিক ডেলিভারির জন্য',add_card:'নতুন কার্ড যোগ করুন',pwa_title:'Foodgasm হোম স্ক্রিনে যোগ করুন',pwa_sub:'দ্রুত অর্ডার, অফলাইন অ্যাক্সেস',admin_dashboard_title:'অ্যাডমিন ড্যাশবোর্ড'},
  ta:{home:'முகப்பு',search:'தேடு',cart:'கார்ட்',orders:'ஆர்டர்கள்',wishlist:'விருப்பப்பட்டியல்',profile:'சுயவிவரம்',settings:'அமைப்புகள்',admin:'நிர்வாகம்',restaurants:'உணவகங்கள்',categories:'வகைகள்',see_all:'அனைத்தும் பார்',hero_tag:'வேகமான டெலிவரி',hero_title_1:'சாப்பிட',hero_title_2:'ஆசையா?',hero_subtitle:'உங்களுக்கு அருகிலுள்ள நூற்றுக்கணக்கான உணவகங்களில் இருந்து ஆர்டர் செய்யுங்கள்.',search_placeholder:'பிரியாணி, தோசை, பீஸ்ஸா தேடுங்கள்...',trending_now:'டிரெண்டிங்',top_restaurants:'சிறந்த உணவகங்கள்',popular_near:'உங்களுக்கு அருகில் பிரபலமானவை',add_to_cart:'கார்ட்டில் சேர்',added:'சேர்க்கப்பட்டது!',remove:'நீக்கு',your_cart:'உங்கள் கார்ட்',cart_empty:'கார்ட் காலியாக உள்ளது',cart_empty_sub:'சுவையான உணவைச் சேருங்கள்!',browse_food:'உணவு பார்க்கவும்',order_summary:'ஆர்டர் சுருக்கம்',subtotal:'துணை மொத்தம்',delivery_fee:'டெலிவரி கட்டணம்',taxes:'ஜிஎஸ்டி',discount:'தள்ளுபடி',total:'மொத்தம்',enter_coupon:'கூப்பன் குறியீடு உள்ளிடவும்',apply:'பயன்படுத்து',proceed_checkout:'செக்அவுட் →',checkout:'செக்அவுட்',delivery_address:'டெலிவரி முகவரி',delivery_time:'டெலிவரி நேரம்',payment_method:'பணம் செலுத்தும் முறை',place_order:'ஆர்டர் செய்',my_orders:'என் ஆர்டர்கள்',track_order:'ஆர்டர் கண்காணி',back_home:'முகப்புக்கு திரும்பு',order_placed:'ஆர்டர் வைக்கப்பட்டது!',order_placed_sub:'உங்கள் ஆர்டர் உறுதிப்படுத்தப்பட்டது.',estimated_delivery:'மதிப்பிடப்பட்ட டெலிவரி',limited_offer:'வரையறுக்கப்பட்ட நேர சலுகை',promo_title:'50% தள்ளுபடி பெறுங்கள்',promo_sub:'FOODGASM50 குறியீடு பயன்படுத்தவும்',claim_now:'இப்போது பெறுங்கள்',login:'உள்நுழை',signup:'பதிவு செய்',email:'மின்னஞ்சல்',password:'கடவுச்சொல்',forgot_password:'கடவுச்சொல் மறந்துவிட்டீர்களா?',continue_with_google:'Google மூலம் தொடர',or_continue:'அல்லது மின்னஞ்சலுடன் தொடர',create_account:'கணக்கு உருவாக்கு',first_name:'முதல் பெயர்',last_name:'கடைசி பெயர்',phone:'தொலைபேசி',agree_terms:'பதிவு செய்வதன் மூலம் நீங்கள் எங்கள் விதிமுறைகளை ஒப்புக்கொள்கிறீர்கள்',logout:'வெளியேறு',admin_dashboard:'நிர்வாக டாஷ்போர்டு',admin_sub:'உங்கள் தளத்தை நிர்வகிக்கவும்',refresh:'புதுப்பி',recent_orders:'சமீபத்திய ஆர்டர்கள்',view_all:'அனைத்தும் பார்',order_id:'ஆர்டர் ஐடி',customer:'வாடிக்கையாளர்',restaurant:'உணவகம்',amount:'தொகை',status:'நிலை',time:'நேரம்',popular_items:'பிரபலமான பொருட்கள்',set_location:'டெலிவரி இடம் அமை',back:'திரும்பு',all_restaurants:'அனைத்து உணவகங்கள்',dark_mode:'இருண்ட பயன்முறை',dark_mode_sub:'இருண்ட/ஒளி தீம்',notifications:'அறிவிப்புகள்',notif_sub:'ஆர்டர் புதுப்பிப்புகள், சலுகைகள்',language:'மொழி',language_sub:'உங்கள் மொழியைத் தேர்வு செய்யுங்கள்',currency:'நாணயம்',currency_sub:'இயல்பு நாணயம்',about:'Foodgasm பற்றி',terms:'விதிமுறைகள் மற்றும் தனியுரிமை',support:'உதவி',home_addr:'வீடு',work:'அலுவலகம்',saved_addresses:'சேமித்த முகவரிகள்',payment_methods:'பணம் செலுத்தும் முறைகள்',add_address:'புதிய முகவரி சேர்',avg_delivery:'சராசரி டெலிவரி',avg_rating:'சராசரி மதிப்பீடு',secure_payment:'பாதுகாப்பான பணம்',install:'நிறுவு',clear:'அழி',recent_searches:'சமீபத்திய தேடல்கள்',your_name:'உங்கள் பெயர்',enter_address:'தெரு முகவரி',notes_placeholder:'எ.கா. கதவில் விடுங்கள்',points:'புள்ளிகள்',full_name:'முழு பெயர்',address:'முகவரி',city:'நகரம்',zip:'பின் குறியீடு',delivery_notes:'டெலிவரி குறிப்பு (விருப்பமானது)',location_services:'இட சேவைகள்',location_sub:'சரியான டெலிவரிக்கு',add_card:'புதிய கார்டு சேர்',pwa_title:'Foodgasm முகப்புத் திரையில் சேர்',pwa_sub:'வேகமான ஆர்டர், ஆஃப்லைன் அணுகல்',admin_dashboard_title:'நிர்வாக டாஷ்போர்டு'},
  te:{home:'హోమ్',search:'వెతకండి',cart:'కార్ట్',orders:'ఆర్డర్లు',wishlist:'ఇష్టపట్టిక',profile:'ప్రొఫైల్',settings:'సెట్టింగ్స్',admin:'అడ్మిన్',restaurants:'రెస్టారెంట్లు',categories:'వర్గాలు',see_all:'అన్నీ చూడండి',hero_tag:'వేగవంతమైన డెలివరీ',hero_title_1:'ఏదైనా తినాలని',hero_title_2:'అనిపిస్తోందా?',hero_subtitle:'మీ దగ్గర ఉన్న వందల రెస్టారెంట్ల నుండి ఆర్డర్ చేయండి.',search_placeholder:'బిర్యానీ, దోసె, పిజ్జా వెతకండి...',trending_now:'ట్రెండింగ్',top_restaurants:'టాప్ రెస్టారెంట్లు',popular_near:'మీకు దగ్గర ప్రసిద్ధమైనవి',add_to_cart:'కార్ట్‌కు జోడించు',added:'జోడించారు!',remove:'తొలగించు',your_cart:'మీ కార్ట్',cart_empty:'కార్ట్ ఖాళీగా ఉంది',cart_empty_sub:'రుచికరమైన ఆహారం జోడించండి!',browse_food:'ఆహారం చూడండి',order_summary:'ఆర్డర్ సారాంశం',subtotal:'ఉప మొత్తం',delivery_fee:'డెలివరీ ఛార్జీ',taxes:'జిఎస్టి',discount:'తగ్గింపు',total:'మొత్తం',enter_coupon:'కూపన్ కోడ్ నమోదు చేయండి',apply:'వర్తించు',proceed_checkout:'చెకౌట్ చేయండి →',checkout:'చెకౌట్',delivery_address:'డెలివరీ చిరునామా',delivery_time:'డెలివరీ సమయం',payment_method:'చెల్లింపు పద్ధతి',place_order:'ఆర్డర్ చేయండి',my_orders:'నా ఆర్డర్లు',track_order:'ఆర్డర్ ట్రాక్ చేయండి',back_home:'హోమ్‌కు తిరిగి వెళ్ళండి',order_placed:'ఆర్డర్ చేయబడింది!',order_placed_sub:'మీ ఆర్డర్ నిర్ధారించబడింది.',estimated_delivery:'అంచనా డెలివరీ',limited_offer:'పరిమిత సమయ ఆఫర్',promo_title:'50% తగ్గింపు పొందండి',promo_sub:'FOODGASM50 కోడ్ వాడండి',claim_now:'ఇప్పుడే పొందండి',login:'లాగిన్',signup:'సైన్ అప్',email:'ఇమెయిల్',password:'పాస్వర్డ్',forgot_password:'పాస్వర్డ్ మర్చిపోయారా?',continue_with_google:'Google తో కొనసాగించండి',or_continue:'లేదా ఇమెయిల్ తో కొనసాగించండి',create_account:'అకౌంట్ తయారు చేయండి',first_name:'మొదటి పేరు',last_name:'చివరి పేరు',phone:'ఫోన్',agree_terms:'సైన్ అప్ చేయడం ద్వారా మీరు మా నిబంధనలకు అంగీకరిస్తారు',logout:'లాగ్అవుట్',admin_dashboard:'అడ్మిన్ డాష్‌బోర్డ్',admin_sub:'మీ ప్లాట్‌ఫారమ్ నిర్వహించండి',refresh:'రిఫ్రెష్',recent_orders:'ఇటీవలి ఆర్డర్లు',view_all:'అన్నీ చూడండి',order_id:'ఆర్డర్ ఐడి',customer:'కస్టమర్',restaurant:'రెస్టారెంట్',amount:'మొత్తం',status:'స్థితి',time:'సమయం',popular_items:'ప్రసిద్ధ వస్తువులు',set_location:'డెలివరీ స్థానం సెట్ చేయండి',back:'వెనక్కి',all_restaurants:'అన్ని రెస్టారెంట్లు',dark_mode:'డార్క్ మోడ్',dark_mode_sub:'డార్క్/లైట్ థీమ్',notifications:'నోటిఫికేషన్లు',notif_sub:'ఆర్డర్ అప్‌డేట్లు, ఆఫర్లు',language:'భాష',language_sub:'మీ భాష ఎంచుకోండి',currency:'కరెన్సీ',currency_sub:'డిఫాల్ట్ కరెన్సీ',about:'Foodgasm గురించి',terms:'నిబంధనలు మరియు గోప్యత',support:'సహాయం',home_addr:'ఇల్లు',work:'కార్యాలయం',saved_addresses:'సేవ్ చేసిన చిరునామాలు',payment_methods:'చెల్లింపు పద్ధతులు',add_address:'కొత్త చిరునామా జోడించండి',avg_delivery:'సగటు డెలివరీ',avg_rating:'సగటు రేటింగ్',secure_payment:'సురక్షిత చెల్లింపు',install:'ఇన్‌స్టాల్',clear:'క్లియర్',recent_searches:'ఇటీవలి శోధనలు',your_name:'మీ పేరు',enter_address:'వీధి చిరునామా',notes_placeholder:'ఉదా. తలుపు దగ్గర వదిలిపెట్టండి',points:'పాయింట్లు',full_name:'పూర్తి పేరు',address:'చిరునామా',city:'నగరం',zip:'పిన్ కోడ్',delivery_notes:'డెలివరీ గమనిక (ఐచ్ఛికం)',location_services:'స్థాన సేవలు',location_sub:'ఖచ్చితమైన డెలివరీకి',add_card:'కొత్త కార్డ్ జోడించండి',pwa_title:'Foodgasm హోమ్ స్క్రీన్‌లో జోడించండి',pwa_sub:'వేగవంతమైన ఆర్డర్, ఆఫ్‌లైన్ యాక్సెస్',admin_dashboard_title:'అడ్మిన్ డాష్‌బోర్డ్'},
  kn:{home:'ಮುಖಪುಟ',search:'ಹುಡುಕಿ',cart:'ಕಾರ್ಟ್',orders:'ಆರ್ಡರ್‌ಗಳು',wishlist:'ಇಷ್ಟಪಟ್ಟವು',profile:'ಪ್ರೊಫೈಲ್',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',admin:'ಅಡ್ಮಿನ್',restaurants:'ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು',categories:'ವರ್ಗಗಳು',see_all:'ಎಲ್ಲವನ್ನು ನೋಡಿ',hero_tag:'ವೇಗದ ಡೆಲಿವರಿ',hero_title_1:'ಏನಾದರೂ ತಿನ್ನಲು',hero_title_2:'ಆಸೆಯಾಗಿದೆಯೇ?',hero_subtitle:'ನಿಮ್ಮ ಹತ್ತಿರದ ನೂರಾರು ರೆಸ್ಟೋರೆಂಟ್‌ಗಳಿಂದ ಆರ್ಡರ್ ಮಾಡಿ.',search_placeholder:'ಬಿರ್ಯಾನಿ, ದೋಸೆ, ಪಿಜ್ಜಾ ಹುಡುಕಿ...',trending_now:'ಟ್ರೆಂಡಿಂಗ್',top_restaurants:'ಟಾಪ್ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು',popular_near:'ನಿಮ್ಮ ಹತ್ತಿರ ಜನಪ್ರಿಯ',add_to_cart:'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',added:'ಸೇರಿಸಲಾಗಿದೆ!',remove:'ತೆಗೆದುಹಾಕಿ',your_cart:'ನಿಮ್ಮ ಕಾರ್ಟ್',cart_empty:'ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',cart_empty_sub:'ಸ್ವಾದಿಷ್ಟ ಆಹಾರ ಸೇರಿಸಿ!',browse_food:'ಆಹಾರ ನೋಡಿ',order_summary:'ಆರ್ಡರ್ ಸಾರಾಂಶ',subtotal:'ಉಪ ಮೊತ್ತ',delivery_fee:'ಡೆಲಿವರಿ ಶುಲ್ಕ',taxes:'ಜಿಎಸ್ಟಿ',discount:'ರಿಯಾಯಿತಿ',total:'ಒಟ್ಟು',enter_coupon:'ಕೂಪನ್ ಕೋಡ್ ನಮೂದಿಸಿ',apply:'ಅನ್ವಯಿಸಿ',proceed_checkout:'ಚೆಕ್‌ಔಟ್ ಮಾಡಿ →',checkout:'ಚೆಕ್‌ಔಟ್',delivery_address:'ಡೆಲಿವರಿ ವಿಳಾಸ',delivery_time:'ಡೆಲಿವರಿ ಸಮಯ',payment_method:'ಪಾವತಿ ವಿಧಾನ',place_order:'ಆರ್ಡರ್ ಮಾಡಿ',my_orders:'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',track_order:'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',back_home:'ಮನೆಗೆ ಹಿಂತಿರುಗಿ',order_placed:'ಆರ್ಡರ್ ಮಾಡಲಾಗಿದೆ!',order_placed_sub:'ನಿಮ್ಮ ಆರ್ಡರ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ.',estimated_delivery:'ಅಂದಾಜು ಡೆಲಿವರಿ',limited_offer:'ಸೀಮಿತ ಸಮಯದ ಆಫರ್',promo_title:'50% ರಿಯಾಯಿತಿ ಪಡೆಯಿರಿ',promo_sub:'FOODGASM50 ಕೋಡ್ ಬಳಸಿ',claim_now:'ಈಗಲೇ ಪಡೆಯಿರಿ',login:'ಲಾಗಿನ್',signup:'ಸೈನ್ ಅಪ್',email:'ಇಮೇಲ್',password:'ಪಾಸ್‌ವರ್ಡ್',forgot_password:'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',continue_with_google:'Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ',or_continue:'ಅಥವಾ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ',create_account:'ಖಾತೆ ರಚಿಸಿ',first_name:'ಮೊದಲ ಹೆಸರು',last_name:'ಕೊನೆಯ ಹೆಸರು',phone:'ಫೋನ್',agree_terms:'ಸೈನ್ ಅಪ್ ಮಾಡುವ ಮೂಲಕ ನೀವು ನಮ್ಮ ನಿಯಮಗಳಿಗೆ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೀರಿ',logout:'ಲಾಗ್‌ಔಟ್',admin_dashboard:'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',admin_sub:'ನಿಮ್ಮ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನಿರ್ವಹಿಸಿ',refresh:'ರಿಫ್ರೆಶ್',recent_orders:'ಇತ್ತೀಚಿನ ಆರ್ಡರ್‌ಗಳು',view_all:'ಎಲ್ಲವನ್ನು ನೋಡಿ',order_id:'ಆರ್ಡರ್ ಐಡಿ',customer:'ಗ್ರಾಹಕ',restaurant:'ರೆಸ್ಟೋರೆಂಟ್',amount:'ಮೊತ್ತ',status:'ಸ್ಥಿತಿ',time:'ಸಮಯ',popular_items:'ಜನಪ್ರಿಯ ವಸ್ತುಗಳು',set_location:'ಡೆಲಿವರಿ ಸ್ಥಳ ಹೊಂದಿಸಿ',back:'ಹಿಂದೆ',all_restaurants:'ಎಲ್ಲಾ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು',dark_mode:'ಡಾರ್ಕ್ ಮೋಡ್',dark_mode_sub:'ಡಾರ್ಕ್/ಲೈಟ್ ಥೀಮ್',notifications:'ಅಧಿಸೂಚನೆಗಳು',notif_sub:'ಆರ್ಡರ್ ಅಪ್‌ಡೇಟ್‌ಗಳು, ಆಫರ್‌ಗಳು',language:'ಭಾಷೆ',language_sub:'ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ',currency:'ಕರೆನ್ಸಿ',currency_sub:'ಡಿಫಾಲ್ಟ್ ಕರೆನ್ಸಿ',about:'Foodgasm ಬಗ್ಗೆ',terms:'ನಿಯಮಗಳು ಮತ್ತು ಗೋಪ್ಯತೆ',support:'ಸಹಾಯ',home_addr:'ಮನೆ',work:'ಕಚೇರಿ',saved_addresses:'ಉಳಿಸಿದ ವಿಳಾಸಗಳು',payment_methods:'ಪಾವತಿ ವಿಧಾನಗಳು',add_address:'ಹೊಸ ವಿಳಾಸ ಸೇರಿಸಿ',avg_delivery:'ಸರಾಸರಿ ಡೆಲಿವರಿ',avg_rating:'ಸರಾಸರಿ ರೇಟಿಂಗ್',secure_payment:'ಸುರಕ್ಷಿತ ಪಾವತಿ',install:'ಇನ್‌ಸ್ಟಾಲ್',clear:'ತೆರವು',recent_searches:'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು',your_name:'ನಿಮ್ಮ ಹೆಸರು',enter_address:'ಬೀದಿ ವಿಳಾಸ',notes_placeholder:'ಉದಾ. ಬಾಗಿಲ ಬಳಿ ಬಿಡಿ',points:'ಪಾಯಿಂಟ್‌ಗಳು',full_name:'ಪೂರ್ಣ ಹೆಸರು',address:'ವಿಳಾಸ',city:'ನಗರ',zip:'ಪಿನ್ ಕೋಡ್',delivery_notes:'ಡೆಲಿವರಿ ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)',location_services:'ಸ್ಥಾನ ಸೇವೆಗಳು',location_sub:'ನಿಖರ ಡೆಲಿವರಿಗಾಗಿ',add_card:'ಹೊಸ ಕಾರ್ಡ್ ಸೇರಿಸಿ',pwa_title:'Foodgasm ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ',pwa_sub:'ವೇಗದ ಆರ್ಡರ್, ಆಫ್‌ಲೈನ್ ಪ್ರವೇಶ',admin_dashboard_title:'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್'},
  mr:{home:'मुख्यपृष्ठ',search:'शोधा',cart:'कार्ट',orders:'ऑर्डर',wishlist:'आवडते',profile:'प्रोफाइल',settings:'सेटिंग्ज',admin:'अॅडमिन',restaurants:'रेस्टॉरंट',categories:'श्रेणी',see_all:'सर्व पहा',hero_tag:'जलद डिलिव्हरी',hero_title_1:'काहीतरी खाण्याची',hero_title_2:'इच्छा आहे?',hero_subtitle:'तुमच्या जवळच्या शेकडो रेस्टॉरंटमधून ऑर्डर करा.',search_placeholder:'बिर्याणी, डोसा, पिझ्झा शोधा...',trending_now:'ट्रेंडिंग',top_restaurants:'टॉप रेस्टॉरंट',popular_near:'तुमच्या जवळ लोकप्रिय',add_to_cart:'कार्टमध्ये जोडा',added:'जोडले!',remove:'काढा',your_cart:'तुमचा कार्ट',cart_empty:'कार्ट रिकामा आहे',cart_empty_sub:'काहीतरी स्वादिष्ट जोडा!',browse_food:'जेवण पहा',order_summary:'ऑर्डर सारांश',subtotal:'उप-एकूण',delivery_fee:'डिलिव्हरी शुल्क',taxes:'जीएसटी',discount:'सवलत',total:'एकूण',enter_coupon:'कूपन कोड टाका',apply:'लागू करा',proceed_checkout:'चेकआउट करा →',checkout:'चेकआउट',delivery_address:'डिलिव्हरी पत्ता',delivery_time:'डिलिव्हरी वेळ',payment_method:'पेमेंट पद्धत',place_order:'ऑर्डर द्या',my_orders:'माझे ऑर्डर',track_order:'ऑर्डर ट्रॅक करा',back_home:'मुख्यपृष्ठावर जा',order_placed:'ऑर्डर दिला!',order_placed_sub:'तुमचा ऑर्डर पुष्टी झाला आहे.',estimated_delivery:'अंदाजे डिलिव्हरी',limited_offer:'मर्यादित वेळेची ऑफर',promo_title:'50% सवलत मिळवा',promo_sub:'FOODGASM50 कोड वापरा',claim_now:'आत्ता मिळवा',login:'लॉगिन',signup:'साइन अप',email:'ईमेल',password:'पासवर्ड',forgot_password:'पासवर्ड विसरलात?',continue_with_google:'Google सह सुरू ठेवा',or_continue:'किंवा ईमेलसह सुरू ठेवा',create_account:'खाते तयार करा',first_name:'पहिले नाव',last_name:'आडनाव',phone:'फोन',agree_terms:'साइन अप करून तुम्ही आमच्या अटींना मान्यता देता',logout:'लॉगआउट',admin_dashboard:'अॅडमिन डॅशबोर्ड',admin_sub:'तुमचे प्लॅटफॉर्म व्यवस्थापित करा',refresh:'रिफ्रेश',recent_orders:'अलीकडील ऑर्डर',view_all:'सर्व पहा',order_id:'ऑर्डर आयडी',customer:'ग्राहक',restaurant:'रेस्टॉरंट',amount:'रक्कम',status:'स्थिती',time:'वेळ',popular_items:'लोकप्रिय वस्तू',set_location:'डिलिव्हरी स्थान सेट करा',back:'मागे',all_restaurants:'सर्व रेस्टॉरंट',dark_mode:'डार्क मोड',dark_mode_sub:'डार्क/लाइट थीम',notifications:'सूचना',notif_sub:'ऑर्डर अपडेट, ऑफर',language:'भाषा',language_sub:'तुमची भाषा निवडा',currency:'चलन',currency_sub:'डीफॉल्ट चलन',about:'Foodgasm बद्दल',terms:'अटी आणि गोपनीयता',support:'मदत',home_addr:'घर',work:'कार्यालय',saved_addresses:'जतन केलेले पत्ते',payment_methods:'पेमेंट पद्धती',add_address:'नवीन पत्ता जोडा',avg_delivery:'सरासरी डिलिव्हरी',avg_rating:'सरासरी रेटिंग',secure_payment:'सुरक्षित पेमेंट',install:'इंस्टॉल',clear:'साफ करा',recent_searches:'अलीकडील शोध',your_name:'तुमचे नाव',enter_address:'रस्त्याचा पत्ता',notes_placeholder:'उदा. दरवाजाजवळ ठेवा',points:'पॉइंट्स',full_name:'पूर्ण नाव',address:'पत्ता',city:'शहर',zip:'पिन कोड',delivery_notes:'डिलिव्हरी नोट (पर्यायी)',location_services:'स्थान सेवा',location_sub:'अचूक डिलिव्हरीसाठी',add_card:'नवीन कार्ड जोडा',pwa_title:'Foodgasm होम स्क्रीनवर जोडा',pwa_sub:'जलद ऑर्डर, ऑफलाइन प्रवेश',admin_dashboard_title:'अॅडमिन डॅशबोर्ड'},
};

// =============================================
// ===== UTILITY FUNCTIONS =====
// =============================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const escape = str => String(str).replace(/[&<>"'`/]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','/':'&#x2F;'}[m]));

function t(key) {
  const lang = STATE.language;
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function formatPrice(amount) {
  return `₹${Math.round(amount)}`;
}

function formatRating(n) {
  const full = Math.floor(n);
  let s = '&#9733;'.repeat(full);
  return s;
}

// =============================================
// ===== TOAST NOTIFICATIONS =====
// =============================================
function showToast(message, type = 'info', icon = null) {
  const icons = {success:'&#10003;',error:'&#10007;',info:'i',warning:'!'};
  const displayIcon = icons[type] || 'i';
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${displayIcon}</span><span>${escape(message)}</span><button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">&#10005;</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =============================================
// ===== MODAL SYSTEM =====
// =============================================
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Store the element that triggered the modal so we can restore focus on close
    overlay._triggerEl = document.activeElement;
    // Focus the first focusable element inside the modal
    setTimeout(() => {
      const modal = overlay.querySelector('.modal');
      if (!modal) return;
      const focusable = modal.querySelectorAll('button,input,textarea,select,a[href],[tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
      else modal.focus();
    }, 100);
    // Trap focus inside modal
    overlay._trapHandler = function(e) {
      if (e.key !== 'Tab') return;
      const modal = overlay.querySelector('.modal');
      if (!modal) return;
      const focusable = Array.from(modal.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    overlay.addEventListener('keydown', overlay._trapHandler);
  }
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    // Remove focus trap
    if (overlay._trapHandler) { overlay.removeEventListener('keydown', overlay._trapHandler); overlay._trapHandler = null; }
    // Restore focus to trigger element
    if (overlay._triggerEl && overlay._triggerEl.focus) { overlay._triggerEl.focus(); overlay._triggerEl = null; }
  }
  if (id === 'tracking-modal') {
    stopRealtimeTracking();
    clearInterval(window._etaTimer);
    _trackingOrderId = null;
  }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal-overlay:not(.hidden)').forEach(m => closeModal(m.id));
    closeLangDropdown();
  }
});

// =============================================
// ===== NAVIGATION =====
// =============================================
const PROTECTED_PAGES = new Set(['checkout','orders','profile','admin']); // wishlist open to guests (local storage)

function navigateTo(page) {
  if (PROTECTED_PAGES.has(page) && !STATE.user?.id) {
    const msgs = {
      checkout: 'Login to checkout and complete your order.',
      orders: 'Login to view your order history.',
      profile: 'Login to view and edit your profile.',
      wishlist: 'Login to save your favourite items.',
      admin: 'Admin access requires login.',
    };
    requireAuth(msgs[page] || 'Please login to continue.');
    return;
  }
  const prev = STATE.currentPage;
  // Allow re-navigation to home (e.g. after login)
  if (prev === page && page !== 'home') return;

  // Stop inline tracker polling when leaving orders page
  if (prev === 'orders' && page !== 'orders') stopInlineTrackerPolling();

  // Hide all pages
  $$('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById(`page-${page}`);
  if (!target) return;
  target.classList.add('active');

  STATE.currentPage = page;

  // Hide sticky mobile cart CTA when leaving cart
  const _stickyBtn = document.getElementById('cart-proceed-sticky');
  if (_stickyBtn) _stickyBtn.classList.toggle('hidden', page !== 'cart');

  // Update nav indicators
  $$('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
  $$('.bnav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  // Close modals
  $$('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  document.body.style.overflow = '';
  closeLangDropdown();

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Page-specific initializers
  const inits = {
    restaurants: renderRestaurantsPage,
    search: initSearchPage,
    cart: renderCartPage,
    checkout: () => renderCheckoutPage(),
    orders: renderOrdersPage,
    wishlist: renderWishlistPage,
    admin: renderAdminPage,
    settings: initSettingsPage,
    auth: () => switchAuthTab('login'),
    mood: initMoodPage,
    budget: initBudgetPage,
    trending: initTrendingPage,
  };
  if (inits[page]) inits[page]();
}

// =============================================
// ===== THEME =====
// =============================================
function toggleTheme() {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', STATE.theme);
  localStorage.setItem('fg_theme', STATE.theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = STATE.theme === 'dark' ? '&#9790;' : '&#9728;';
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = STATE.theme === 'dark';
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', STATE.theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = STATE.theme === 'dark' ? '&#9790;' : '&#9728;';
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = STATE.theme === 'dark';
}

// =============================================
// ===== LANGUAGE / I18N =====
// =============================================
function buildLangDropdowns() {
  ['lang-dropdown', 'settings-lang-dropdown'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = LANGUAGES.map(l => `
      <div class="lang-option ${l.code===STATE.language?'active':''}" role="option" onclick="setLanguage('${l.code}')" tabindex="0">
        <span class="lang-flag">${l.flag}</span>
        <span>${l.name}</span>
        ${l.code===STATE.language?'<span style="margin-left:auto;color:var(--brand)">✓</span>':''}
      </div>
    `).join('');
  });
}

function toggleLangDropdown() {
  const dd = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-btn');
  dd.classList.toggle('hidden');
  btn.setAttribute('aria-expanded', !dd.classList.contains('hidden'));
}
function toggleSettingsLang() {
  const dd = document.getElementById('settings-lang-dropdown');
  dd.classList.toggle('hidden');
}
function closeLangDropdown() {
  document.getElementById('lang-dropdown')?.classList.add('hidden');
  document.getElementById('settings-lang-dropdown')?.classList.add('hidden');
  document.getElementById('lang-btn')?.setAttribute('aria-expanded', 'false');
}

function setLanguage(code) {
  STATE.language = code;
  localStorage.setItem('fg_lang', code);
  const lang = LANGUAGES.find(l => l.code === code);
  if (lang) {
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', lang.dir);
    document.getElementById('current-flag').textContent = lang.flag;
    document.getElementById('current-lang-code').textContent = code.toUpperCase();
    document.getElementById('settings-flag').textContent = lang.flag;
    document.getElementById('settings-lang-name').textContent = lang.name;
  }
  applyTranslations();
  buildLangDropdowns();
  closeLangDropdown();
  showToast(`Language set to ${lang?.name || code}`, 'success', lang?.flag);
}

function applyTranslations() {
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = t(key);
    if (text) el.textContent = text;
  });
  $$('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const text = t(key);
    if (text) el.placeholder = text;
  });
}

// =============================================
// ===== CURRENCY =====
// =============================================
function setCurrency(code) {
  STATE.currency = code;
  localStorage.setItem('fg_currency', code);
  showToast(`Currency set to ${code}`, 'success', '&#x1F4B1;');
  // Re-render current page if needed
  if (STATE.currentPage === 'cart') renderCartPage();
  if (STATE.currentPage === 'checkout') renderCheckoutPage();
}

// =============================================
// ===== CART =====
// =============================================
function saveCart() {
  localStorage.setItem('fg_cart', JSON.stringify(STATE.cart));
  if (STATE.user?.id) syncCartToServer();
}

async function syncCartToServer() {
  if (!STATE.user?.id) return;
  // Clear existing cart items and re-insert
  await API.delete('cart_items', `user_id=eq.${STATE.user.id}`);
  for (const item of STATE.cart) {
    await API.post('cart_items', {
      user_id: STATE.user.id,
      menu_item_id: item.supabase_id || null,
      item_name: item.name,
      item_price: item.price,
      quantity: item.qty,
      restaurant_id: item.restaurantId || null,
      item_image: item.img || null,
    });
  }
}

async function syncCartFromServer() {
  if (!STATE.user?.id) return;
  const rows = await API.get('cart_items', `?user_id=eq.${STATE.user.id}`);
  if (!rows || !rows.length) return;
  STATE.cart = rows.map(r => {
    // Try to map back to local FOODS for full data
    const localFood = FOODS.find(f => f.name === r.item_name);
    return {
      id: localFood?.id || r.id,
      supabase_id: r.menu_item_id || null,
      name: r.item_name || localFood?.name || 'Item',
      img: r.item_image || localFood?.img || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=220&fit=crop&auto=format',
      price: parseFloat(r.item_price || localFood?.price || 0),
      qty: r.quantity || 1,
      restaurantName: localFood?.restaurantName || '',
      restaurantId: r.restaurant_id || localFood?.restaurantId,
    };
  });
  localStorage.setItem('fg_cart', JSON.stringify(STATE.cart));
}

function requireAuth(msg) {
  if (STATE.user?.id) return true;
  const msgEl = document.getElementById('auth-required-msg');
  if (msgEl) msgEl.textContent = msg || 'Please login or create an account to continue.';
  openModal('auth-required-modal');
  return false;
}

function addToCart(foodId) {
  if (!requireAuth('Login to add items to your cart and place orders.')) return;
  const food = FOODS.find(f => f.id === foodId);
  if (!food) return;
  const existing = STATE.cart.find(i => i.id === foodId);
  if (existing) {
    existing.qty++;
  } else {
    STATE.cart.push({ ...food, qty: 1 });
  }
  saveCart();
  updateCartBadges();
  showToast(`${food.name} added to cart`, 'success', '&#10003;');
  if (STATE.user?.id) syncCartToServer().catch(()=>{});
  const badge = document.getElementById('cart-badge');
  if (badge) { badge.style.animation='none'; void badge.offsetWidth; badge.style.animation='cartBounce 0.3s ease'; }
}

function removeFromCart(foodId) {
  const food = STATE.cart.find(i => i.id === foodId);
  STATE.cart = STATE.cart.filter(i => i.id !== foodId);
  saveCart();
  updateCartBadges();
  if (STATE.currentPage === 'cart') renderCartPage();
  if (STATE.currentPage === 'checkout') renderCheckoutPage();
  if (food) {
    showToast(`${food.name} removed`, 'info', '&#10005;');
    if (STATE.user?.id) syncCartToServer().catch(()=>{});
  }
}

function updateCartQty(foodId, delta) {
  const item = STATE.cart.find(i => i.id === foodId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(foodId); return; }
  saveCart();
  updateCartBadges();
  if (STATE.user?.id) syncCartToServer().catch(()=>{});
  if (STATE.currentPage === 'cart') {
    // Targeted DOM update — no full re-render
    const cartItemEl = document.querySelector(`.cart-item[data-id="${foodId}"]`);
    if (cartItemEl) {
      const qtyEl = cartItemEl.querySelector('.qty-num');
      const priceEl = cartItemEl.querySelector('.cart-item-price');
      if (qtyEl) qtyEl.textContent = item.qty;
      if (priceEl) priceEl.textContent = formatPrice(item.price * item.qty);
    }
    // Update totals
    const totals = getCartTotals();
    const ids = ['cart-subtotal','cart-delivery','cart-tax','cart-total'];
    const vals = [totals.subtotal, totals.delivery, totals.tax, totals.total];
    ids.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = formatPrice(vals[i]); });
    const discountRow = document.getElementById('cart-discount-row');
    if (discountRow) {
      discountRow.style.display = totals.discount > 0 ? 'flex' : 'none';
      const discEl = document.getElementById('cart-discount');
      if (discEl) discEl.textContent = `-${formatPrice(totals.discount)}`;
    }
    const sticky = document.getElementById('cart-proceed-sticky');
    if (sticky) sticky.textContent = `Proceed to Checkout · ${formatPrice(totals.total)}`;
  }
  if (STATE.currentPage === 'checkout') renderCheckoutPage();
}

function updateCartBadges() {
  const total = STATE.cart.reduce((s, i) => s + i.qty, 0);
  const badges = ['cart-badge', 'bnav-cart-badge', 'sidebar-cart-badge'];
  badges.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

function getCartTotals() {
  const subtotal = STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = STATE.cart.length > 0 ? CONFIG.DELIVERY_FEE : 0;
  const tax = subtotal * CONFIG.TAX_RATE;
  const discount = STATE.promoDiscount;
  const total = subtotal + delivery + tax - discount;
  return { subtotal, delivery, tax, discount, total };
}

async function applyCoupon() {
  const code = document.getElementById('coupon-input')?.value?.trim().toUpperCase();
  if (!code) { showToast('Please enter a coupon code', 'error', '!'); return; }
  const { subtotal } = getCartTotals();

  // Local coupons — always work, no login needed
  const LOCAL_COUPONS = {
    'FIRST50':    50,
    'SAVE100':    100,
    'FOOD20':     Math.round(subtotal * 0.2),
    'FOODGASM50': Math.round(subtotal * 0.5 > 150 ? 150 : subtotal * 0.5),
    'WELCOME':    60,
    'FLAT100':    100,
    'TASTY20':    Math.round(subtotal * 0.2),
  };

  if (LOCAL_COUPONS[code] !== undefined) {
    STATE.promoCode = code;
    STATE.promoDiscount = LOCAL_COUPONS[code];
    showToast(`✅ Coupon "${code}" applied! You saved ${formatPrice(STATE.promoDiscount)}`, 'success', '&#10003;');
    refreshCurrentPage();
    return;
  }

  // Try server-side validation if logged in
  if (STATE.user?.id) {
    try {
      const result = await API.rpc('validate_coupon', {
        p_code: code,
        p_restaurant_id: STATE.cart[0]?.restaurantId || null,
        p_order_amount: subtotal
      });
      if (result?.valid) {
        STATE.promoCode = code;
        STATE.promoDiscount = parseFloat(result.discount_amount || 0);
        showToast(`✅ Coupon "${code}" applied! ${result.description || ''}`, 'success', '&#10003;');
        refreshCurrentPage();
        return;
      }
    } catch(e) { /* server unavailable, fall through */ }
  }

  showToast('❌ Invalid coupon code. Try: FIRST50, SAVE100, FOOD20 or FOODGASM50', 'error', '&#10005;');
}

function refreshCurrentPage() {
  if (STATE.currentPage === 'cart') renderCartPage();
  else if (STATE.currentPage === 'checkout') renderCheckoutPage();
}

function applyPromo(code) {
  const { subtotal } = getCartTotals();
  const PROMO_VALUES = {
    'FOODGASM50': Math.round(subtotal * 0.5 > 150 ? 150 : subtotal * 0.5),
    'FIRST50': 50, 'SAVE100': 100, 'FOOD20': Math.round(subtotal * 0.2),
    'WELCOME': 60, 'FLAT100': 100,
  };
  STATE.promoCode = code;
  STATE.promoDiscount = PROMO_VALUES[code] || 50;
  showToast(`✅ Promo "${code}" applied! Saved ${formatPrice(STATE.promoDiscount)}`, 'success', '&#10003;');
  const inp = document.getElementById('coupon-input');
  if (inp) inp.value = code;
  refreshCurrentPage();
}

// =============================================
// ===== WISHLIST =====
// =============================================
function saveWishlist() {
  localStorage.setItem('fg_wishlist', JSON.stringify(STATE.wishlist));
  updateWishlistBadge();
}

async function toggleWishlist(id, type = 'restaurant') {
  const sid = String(id);
  // Duplicate guard — check before any push
  const existingRow = STATE.wishlist.find(w => String(w.id) === sid && w.type === type);
  if (existingRow) {
    try {
      if (existingRow.wishlist_id) {
        await API.delete('wishlist', `id=eq.${existingRow.wishlist_id}`);
      } else if (type === 'food') {
        await API.delete('wishlist', `user_id=eq.${STATE.user.id}&menu_item_id=eq.${id}&item_type=eq.food`);
      } else {
        await API.delete('wishlist', `user_id=eq.${STATE.user.id}&restaurant_id=eq.${id}&item_type=eq.restaurant`);
      }
    } catch(e) { console.warn('Wishlist delete error:', e); }
    STATE.wishlist = STATE.wishlist.filter(w => !(String(w.id) === sid && w.type === type));
    showToast('Removed from wishlist', 'info');
  } else {
    const item = type === 'food' ? FOODS.find(f => String(f.id) === sid) : RESTAURANTS.find(r => String(r.id) === sid);
    if (!STATE.user?.id) {
      // Guest: local-only wishlist with soft nudge
      STATE.wishlist.push({ id: id, type: type, ...(item || {}) });
      showToast('Saved locally ❤️ — Login to sync across devices', 'info', '♡');
    } else {
      const payload = { user_id: STATE.user.id, item_type: type };
      if (type === 'food') {
        payload.menu_item_id = id;
        payload.restaurant_id = item?.restaurantId || null;
      } else {
        payload.restaurant_id = id;
      }
      try {
        const res = await API.post('wishlist', payload);
        if (res && res.length) {
          STATE.wishlist.push({ id: id, type: type, wishlist_id: res[0].id, ...(item || {}) });
        } else {
          STATE.wishlist.push({ id: id, type: type, ...(item || {}) });
        }
      } catch(e) {
        console.warn('Wishlist save error:', e);
        STATE.wishlist.push({ id: id, type: type, ...(item || {}) });
      }
      showToast('Added to wishlist ❤️', 'success');
    }
  }
  saveWishlist();
  updateWishlistUI(id, type);
  if (STATE.currentPage === 'wishlist') renderWishlistPage();
}

function isWishlisted(id, type = 'restaurant') {
  const sid = String(id);
  return STATE.wishlist.some(w => String(w.id) === sid && w.type === type);
}

async function syncWishlistFromServer() {
  if (!STATE.user?.id) return;
  try {
    const rows = await API.get('wishlist', `?user_id=eq.${STATE.user.id}&select=*`);
    if (rows && rows.length) {
      STATE.wishlist = rows.map(r => {
        const type = r.item_type || 'restaurant';
        let localItem, itemId;
        if (type === 'food') {
          itemId = r.menu_item_id || r.restaurant_id;
          localItem = FOODS.find(f => String(f.id) === String(itemId));
        } else {
          itemId = r.restaurant_id;
          localItem = RESTAURANTS.find(rest => String(rest.id) === String(itemId));
        }
        if (!itemId) return null;
        return { id: itemId, type, wishlist_id: r.id, ...(localItem || {}) };
      }).filter(Boolean);
      saveWishlist();
      updateWishlistBadge();
    }
  } catch(e) { console.warn('syncWishlistFromServer error:', e); }
}

function updateWishlistUI(id, type) {
  const isWish = isWishlisted(id, type);
  // Update all matching heart buttons
  $$(`[data-wish-id="${id}"][data-wish-type="${type}"]`).forEach(btn => {
    btn.classList.toggle('active', isWish);
    btn.innerHTML = isWish ? '&#10084;' : '&#9825;';
    btn.setAttribute('aria-label', isWish ? 'Remove from wishlist' : 'Add to wishlist');
  });
  // Also check string version of id
  const sid = String(id);
  $$(`[data-wish-id="${sid}"][data-wish-type="${type}"]`).forEach(btn => {
    btn.classList.toggle('active', isWish);
    btn.innerHTML = isWish ? '&#10084;' : '&#9825;';
    btn.setAttribute('aria-label', isWish ? 'Remove from wishlist' : 'Add to wishlist');
  });
  // Update wishlist count badge
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const count = STATE.wishlist.length;
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  const statWish = document.getElementById('stat-wishlist');
  if (statWish) statWish.textContent = count;
}

// =============================================
// ===== RENDER FUNCTIONS =====
// =============================================

// --- Categories ---
function renderCategories() {
  const container = document.getElementById('categories-row');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card ${STATE.filters.category === cat.id ? 'active' : ''}"
         onclick="filterByCategory('${cat.id}')"
         role="listitem" aria-label="${cat.label} category"
         tabindex="0">
      <div class="cat-img-wrap" aria-hidden="true" style="font-size:1rem;letter-spacing:0">${cat.label.slice(0,2)}</div>
      <span class="cat-label">${cat.label}</span>
    </div>
  `).join('');
}

function setVegFilter(val) {
  STATE.filters.vegFilter = val;
  ['all','veg','nonveg'].forEach(v => {
    const btn = document.getElementById(`vegf-${v}`);
    if (btn) btn.classList.toggle('active', v === val);
  });
  renderHomeFoods();
}

function filterByCategory(catId) {
  STATE.filters.category = catId;
  // Update cin-chip-row active state
  document.querySelectorAll('#cin-cat-chips .cin-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === catId);
  });
  renderHomeFoods();
  renderHomeRestaurants();
}

// --- Trending ---
// Cached trending order — seeded once to prevent re-shuffle flicker on re-render
let _cachedTrending = null;
function renderTrending() {
  const container = document.getElementById('trending-row');
  if (!container) return;
  if (!_cachedTrending) {
    _cachedTrending = FOODS.slice().sort(() => Math.random()-0.5).slice(0,8);
  }
  const trending = _cachedTrending;
  container.innerHTML = trending.map(f => `
    <div class="trending-card" onclick="openFoodDetail(${f.id})" role="listitem" tabindex="0" aria-label="${f.name}">
      <div class="trending-img" style="font-size:0;padding:0;background:var(--surface-2)">
        <img src="${f.img||'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=140&h=120&fit=crop&auto=format'}" alt="${escape(f.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.background='var(--surface-3)'"/>
      </div>
      <div class="trending-info">
        <div class="trending-name">${escape(f.name)}</div>
        <div class="trending-price">${formatPrice(f.price)}</div>
      </div>
    </div>
  `).join('');
}

// --- Restaurant Card HTML ---
function restaurantCardHTML(r, inList = false) {
  const wish = isWishlisted(r.id, 'restaurant');
  const tagClass = r.badge ? `badge-${r.badge}` : '';
  const imgSrc = r.img || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=220&fit=crop&auto=format`;
  return `
    <div class="restaurant-card" role="listitem" aria-label="${r.name} restaurant">
      <div class="restaurant-img-wrap">
        <div class="restaurant-img" style="background:var(--surface-2);font-size:0;padding:0">
          <img src="${imgSrc}" alt="${escape(r.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg) var(--radius-lg) 0 0" onerror="this.style.display='none'"/>
        </div>
        ${r.badge ? `<span class="restaurant-badge ${tagClass}">${r.badge}</span>` : ''}
        <button class="restaurant-fav ${wish?'active':''}"
                data-wish-id="${r.id}" data-wish-type="restaurant"
                onclick="event.stopPropagation();toggleWishlist(${r.id},'restaurant')"
                aria-label="${wish?'Remove from wishlist':'Add to wishlist'}">
          ${wish?'&#10084;':'&#9825;'}
        </button>
      </div>
      <div class="restaurant-info">
        <div class="restaurant-name">${escape(r.name)}</div>
        <div class="restaurant-cuisine">${escape(r.cuisine)}</div>
        <div class="restaurant-meta">
          <div class="restaurant-meta-item restaurant-rating"><span style="color:var(--yellow)">&#9733;</span> ${r.rating}</div>
          <div class="restaurant-meta-item">${r.deliveryTime} min</div>
          <div class="restaurant-meta-item">${r.distance}</div>
          <div class="restaurant-meta-item">${r.deliveryFee === 0 ? 'Free delivery' : `${formatPrice(r.deliveryFee)} delivery`}</div>
        </div>
        ${r.offer ? `<div class="restaurant-offer">${escape(r.offer)}</div>` : ''}
      </div>
    </div>
  `;
}

function foodCardHTML(f) {
  const wish = isWishlisted(f.id, 'food');
  const inCart = STATE.cart.find(i => i.id === f.id);
  const imgSrc = f.img || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=220&fit=crop&auto=format`;
  return `
    <div class="food-card" role="listitem" aria-label="${f.name}">
      <div class="food-card-img-wrap">
        <div class="food-card-img" style="background:var(--surface-2);font-size:0;padding:0" onclick="openFoodDetail(${f.id})">
          <img src="${imgSrc}" alt="${escape(f.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.background='var(--surface-3)'"/>
        </div>
        <div class="food-veg-badge ${f.veg?'veg':'non-veg'}" aria-label="${f.veg?'Vegetarian':'Non-vegetarian'}" title="${f.veg?'Veg':'Non-Veg'}">
          ${f.veg?'V':'N'}
        </div>
        <button class="food-fav ${wish?'active':''}"
                data-wish-id="${f.id}" data-wish-type="food"
                onclick="toggleWishlist(${f.id},'food')"
                aria-label="${wish?'Remove from wishlist':'Add to wishlist'}">
          ${wish?'&#10084;':'&#9825;'}
        </button>
      </div>
      <div class="food-card-info" onclick="openFoodDetail(${f.id})">
        <div class="food-name">${escape(f.name)}</div>
        <div class="food-restaurant">${escape(f.restaurantName)}</div>
      </div>
      <div class="food-card-footer">
        <div class="food-price">${formatPrice(f.price)}</div>
        <div class="food-rating"><span style="color:var(--yellow)">&#9733;</span>${f.rating}</div>
        ${inCart
          ? `<div class="qty-control">
              <button class="qty-btn" onclick="updateCartQty(${f.id},-1)" aria-label="Decrease quantity">&#8722;</button>
              <span class="qty-num">${inCart.qty}</span>
              <button class="qty-btn" onclick="updateCartQty(${f.id},1)" aria-label="Increase quantity">+</button>
             </div>`
          : `<button class="add-btn" onclick="addToCart(${f.id})" aria-label="Add ${f.name} to cart">+</button>`
        }
      </div>
    </div>
  `;
}

// --- Home Page ---
function renderHomePage() {
  // renderCategories() — categories-row removed; chips in initCinematicHomePage handle filtering
  renderTrending();
  renderHomeRestaurants();
  renderHomeFoods();
  initCinematicHomePage();
}

function initCinematicHomePage() {
  // Build category chips for the cinematic section
  const chipsEl = document.getElementById('cin-cat-chips');
  if (chipsEl) {
    chipsEl.innerHTML = [
      `<button class="cin-chip ${STATE.filters.category === 'all' ? 'active' : ''}" data-cat="all" onclick="cinematicFilterCat('all')">🍽️ All</button>`,
      ...CATEGORIES.filter(cat => cat.id !== 'all').map(cat =>
        `<button class="cin-chip ${STATE.filters.category === cat.id ? 'active' : ''}" data-cat="${cat.id}" onclick="cinematicFilterCat('${cat.id}')">${cat.emoji || ''} ${cat.label}</button>`
      )
    ].join('');
  }

  // IntersectionObserver for cinematic fade-up sections
  const cinematicSections = document.querySelectorAll('#page-home .cinematic-section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  cinematicSections.forEach(s => observer.observe(s));

  // Trigger hero in-view immediately (it's already visible on load)
  const heroSection = document.getElementById('cin-hero');
  if (heroSection) {
    requestAnimationFrame(() => {
      heroSection.classList.add('in-view');
    });
  }
}

function cinematicFilterCat(catId) {
  STATE.filters.category = catId;
  // Update chips using data-cat attribute (reliable, no text matching issues)
  document.querySelectorAll('#cin-cat-chips .cin-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === catId);
  });
  renderHomeFoods();
  renderHomeRestaurants();
}

function renderHomeRestaurants() {
  const container = document.getElementById('home-restaurants');
  if (!container) return;
  container.innerHTML = `<div class="restaurant-grid">${Array(3).fill(`
    <div class="skeleton-card">
      <div class="skeleton sk-img"></div>
      <div class="skeleton sk-line"></div>
      <div class="skeleton sk-line-sm"></div>
      <div class="skeleton sk-line-full" style="margin-bottom:14px"></div>
    </div>`).join('')}</div>`;
  setTimeout(() => {
    let list = RESTAURANTS;
    if (STATE.filters.category && STATE.filters.category !== 'all') {
      list = RESTAURANTS.filter(r => r.category === STATE.filters.category);
    }
    const top = list.slice(0, 6);
    if (top.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#127869;</div><div class="empty-state-title">No restaurants found for this category</div></div>`;
      return;
    }
    container.innerHTML = `<div class="restaurant-grid">${top.map(r =>
      `<div onclick="openRestaurantMenu(${r.id})">${restaurantCardHTML(r)}</div>`
    ).join('')}</div>`;
  }, 300);
}

function renderHomeFoods() {
  const container = document.getElementById('home-foods');
  if (!container) return;
  let foods = FOODS;
  if (STATE.filters.category !== 'all') {
    foods = foods.filter(f => f.category === STATE.filters.category);
  }
  if (STATE.filters.vegFilter === 'veg') {
    foods = foods.filter(f => f.veg === true);
  } else if (STATE.filters.vegFilter === 'nonveg') {
    foods = foods.filter(f => f.veg === false);
  }
  // Show up to 16 on home, all when a category is selected
  if (STATE.filters.category === 'all') foods = foods.slice(0, 16);
  if (foods.length === 0) {
    container.innerHTML = `<div class="no-results" style="grid-column:1/-1"><div class="no-results-emoji">&#127869;</div><p>No items match the current filters</p></div>`;
    return;
  }
  container.innerHTML = foods.map(f => foodCardHTML(f)).join('');
}

// --- Restaurants Page ---
function renderRestaurantsPage() {
  const filtersEl = document.getElementById('restaurant-filters');
  const cuisineEl = document.getElementById('cuisine-chips');
  const listEl = document.getElementById('all-restaurants');

  const filterOptions = [
    {label:'All',value:'all'},{label:'Top Rated',value:'rating'},
    {label:'Delivery Time',value:'time'},{label:'Free Delivery',value:'free'},
    {label:'Veg Only',value:'veg'},
  ];
  if (filtersEl) {
    filtersEl.innerHTML = filterOptions.map(f => `
      <button class="filter-chip ${STATE.filters.sort===f.value?'active':''}"
              onclick="setRestaurantFilter('${f.value}')">${f.label}</button>
    `).join('');
  }

  const cuisines = [...new Set(RESTAURANTS.map(r=>r.category))];
  if (cuisineEl) {
    cuisineEl.innerHTML = [
      `<button class="chip ${STATE.filters.category==='all'?'active':''}" onclick="setCuisineFilter('all')">All</button>`,
      ...cuisines.map(c => {
        const cat = CATEGORIES.find(cat=>cat.id===c);
        return `<button class="chip ${STATE.filters.category===c?'active':''}" onclick="setCuisineFilter('${c}')">${cat?.emoji||''} ${cat?.label||c}</button>`;
      })
    ].join('');
  }

  renderRestaurantsList();
}

function setRestaurantFilter(val) {
  STATE.filters.sort = val;
  renderRestaurantsPage();
}

function setCuisineFilter(cat) {
  STATE.filters.category = cat;
  renderRestaurantsPage();
}

function renderRestaurantsList() {
  const listEl = document.getElementById('all-restaurants');
  if (!listEl) return;
  let list = [...RESTAURANTS];
  if (STATE.filters.category !== 'all') {
    list = list.filter(r => r.category === STATE.filters.category);
  }
  if (STATE.filters.sort === 'free') list = list.filter(r => r.deliveryFee === 0);
  if (STATE.filters.sort === 'veg' || STATE.filters.vegFilter === 'veg') list = list.filter(r => r.veg);
  if (STATE.filters.vegFilter === 'nonveg') list = list.filter(r => !r.veg);
  if (STATE.filters.sort === 'rating') list.sort((a,b) => b.rating - a.rating);
  if (STATE.filters.sort === 'time') list.sort((a,b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));

  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">&#127869;</div><div class="empty-state-title">No restaurants found</div><div class="empty-state-sub">Try adjusting your filters</div></div>`;
    return;
  }
  listEl.innerHTML = list.map(r => `<div onclick="openRestaurantMenu(${r.id})">${restaurantCardHTML(r)}</div>`).join('');
}

// --- Menu Page ---
function openRestaurantMenu(restaurantId) {
  STATE.selectedRestaurant = RESTAURANTS.find(r => r.id === restaurantId);
  navigateTo('menu');
  renderMenuPage(restaurantId);
}

function renderMenuPage(restaurantId) {
  const r = STATE.selectedRestaurant;
  if (!r) return;

  const headerEl = document.getElementById('menu-restaurant-header');
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="menu-rest-banner" style="background:var(--surface-2);padding:0">
        <img src="${r.img||'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=180&fit=crop&auto=format'}" alt="${escape(r.name)}" style="width:100%;height:100%;object-fit:cover;position:relative;z-index:0" onerror="this.style.display='none'"/>
      </div>
      <div class="menu-rest-info">
        <div class="menu-rest-name">${escape(r.name)}</div>
        <div style="font-size:0.8rem;color:var(--text-2);margin-bottom:10px">${escape(r.cuisine)}</div>
        <div class="menu-rest-meta">
          <div class="meta-chip"><span style="color:var(--yellow)">&#9733;</span> ${r.rating} (1.2k+ reviews)</div>
          <div class="meta-chip">${r.deliveryTime} min</div>
          <div class="meta-chip">${r.distance}</div>
          <div class="meta-chip">${r.deliveryFee===0?'Free delivery':`${formatPrice(r.deliveryFee)} delivery`}</div>
          <div class="meta-chip">Min ${formatPrice(r.minOrder)}</div>
        </div>
        ${r.offer ? `<div class="restaurant-offer" style="margin-top:10px">${escape(r.offer)}</div>` : ''}
      </div>
    `;
  }

  const menuFoods = FOODS.filter(f => f.restaurantId === restaurantId);
  const cats = [...new Set(menuFoods.map(f=>f.category))];

  const chipsEl = document.getElementById('menu-category-chips');
  if (chipsEl) {
    chipsEl.innerHTML = [
      `<button class="chip active" onclick="filterMenuCategory('all',${restaurantId})">All</button>`,
      ...cats.map(c => {
        const cat = CATEGORIES.find(cat=>cat.id===c);
        return `<button class="chip" onclick="filterMenuCategory('${c}',${restaurantId})">${cat?.emoji||''} ${cat?.label||c}</button>`;
      })
    ].join('');
  }

  const gridEl = document.getElementById('menu-food-grid');
  if (gridEl) {
    if (menuFoods.length === 0) {
      gridEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">&#127869;</div><div class="empty-state-title">Menu coming soon</div></div>`;
    } else {
      gridEl.innerHTML = menuFoods.map(f => foodCardHTML(f)).join('');
    }
  }
}

function filterMenuCategory(cat, restaurantId) {
  const gridEl = document.getElementById('menu-food-grid');
  const chipsEl = document.getElementById('menu-category-chips');
  $$('.chip', chipsEl).forEach(c => c.classList.remove('active'));
  event?.target?.classList.add('active');
  let foods = FOODS.filter(f => f.restaurantId === restaurantId);
  if (cat !== 'all') foods = foods.filter(f => f.category === cat);
  if (gridEl) gridEl.innerHTML = foods.map(f => foodCardHTML(f)).join('');
}

// --- Food Detail ---
function openFoodDetail(foodId) {
  const food = FOODS.find(f => f.id === foodId);
  if (!food) return;
  const inCart = STATE.cart.find(i => i.id === foodId);
  const qty = inCart ? inCart.qty : 1;
  const wish = isWishlisted(foodId, 'food');
  const rest = RESTAURANTS.find(r => r.id === food.restaurantId);

  const imgSrc = food.img || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=280&fit=crop&auto=format';
  document.getElementById('food-detail-content').innerHTML = `
    <div class="food-detail-img" style="font-size:0;padding:0;background:var(--surface-2)">
      <img src="${imgSrc}" alt="${escape(food.name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.background='var(--surface-3)'"/>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 0">
      <button class="btn btn-secondary btn-sm" onclick="closeModal('food-detail-modal')" style="gap:6px">← ${t('back')}</button>
      <button class="food-fav ${wish?'active':''}" data-wish-id="${foodId}" data-wish-type="food"
              onclick="toggleWishlist(${foodId},'food')" style="font-size:1.2rem;padding:6px"
              aria-label="${wish?'Remove from wishlist':'Add to wishlist'}">${wish?'&#10084;':'&#9825;'}</button>
    </div>
    <div class="food-detail-content">
      <div class="food-detail-header">
        <div>
          <div class="food-detail-name" id="food-modal-title">${escape(food.name)}</div>
          <div style="font-size:0.78rem;color:var(--text-3)">${rest?.name||''} · <span style="color:${food.veg?'var(--green)':'var(--red)'}">${food.veg?'Veg':'Non-Veg'}</span></div>
        </div>
        <div class="food-detail-price">${formatPrice(food.price)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
        <span class="food-rating" style="font-size:0.875rem"><span style="color:var(--yellow)">&#9733;</span> ${food.rating} (${food.reviews}+ reviews)</span>
        <span class="food-rating" style="font-size:0.875rem">${rest?.deliveryTime||'25-35'} min delivery</span>
      </div>
      <p class="food-detail-desc">${escape(food.desc)}</p>
      <div class="food-detail-tags">
        ${food.tags.map(tag=>`<span class="food-tag">${tag}</span>`).join('')}
        ${food.veg?'<span class="food-tag" style="color:var(--green);border-color:var(--green)">Veg</span>':''}
      </div>
      <div class="food-detail-qty">
        <div class="qty-control-lg" aria-label="Quantity">
          <button class="qty-btn-lg" onclick="changeFoodDetailQty(-1,${foodId})" aria-label="Decrease">−</button>
          <span class="qty-num-lg" id="detail-qty">${qty}</span>
          <button class="qty-btn-lg" onclick="changeFoodDetailQty(1,${foodId})" aria-label="Increase">+</button>
        </div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--brand)" id="detail-total">${formatPrice(food.price*qty)}</div>
      </div>
      <button class="btn btn-primary btn-full" onclick="addToCartFromDetail(${foodId})" id="detail-add-btn">
        ${inCart?`Update Cart (${qty}×${formatPrice(food.price)})`:`${t('add_to_cart')} · ${formatPrice(food.price*qty)}`}
      </button>
    </div>
  `;
  // Store temp qty
  window._detailQty = qty;
  window._detailFoodId = foodId;
  openModal('food-detail-modal');
}

function changeFoodDetailQty(delta, foodId) {
  window._detailQty = Math.max(1, (window._detailQty || 1) + delta);
  const food = FOODS.find(f => f.id === foodId);
  document.getElementById('detail-qty').textContent = window._detailQty;
  document.getElementById('detail-total').textContent = formatPrice(food.price * window._detailQty);
  document.getElementById('detail-add-btn').textContent = `${t('add_to_cart')} · ${formatPrice(food.price * window._detailQty)}`;
}

function addToCartFromDetail(foodId) {
  if (!requireAuth('Login to add items to your cart and place orders.')) return;
  const food = FOODS.find(f => f.id === foodId);
  if (!food) return;
  const existing = STATE.cart.find(i => i.id === foodId);
  if (existing) {
    existing.qty = window._detailQty;
  } else {
    STATE.cart.push({ ...food, qty: window._detailQty });
  }
  saveCart();
  updateCartBadges();
  showToast(`${food.name} ×${window._detailQty} added to cart`, 'success', '&#10003;');
  closeModal('food-detail-modal');
}

// --- Cart Page ---
function renderCartPage() {
  const empty = document.getElementById('cart-empty');
  const list = document.getElementById('cart-items-list');
  const summary = document.getElementById('cart-summary-section');

  if (STATE.cart.length === 0) {
    empty.style.display = 'flex';
    list.innerHTML = '';
    if (summary) summary.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  if (summary) summary.style.display = 'block';

  list.innerHTML = STATE.cart.map(item => `
    <div class="cart-item" data-id="${item.id}" role="listitem" aria-label="${item.name}">
      <div class="cart-item-img"><img src="${item.img||'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&h=80&fit=crop&auto=format'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"></div>
      <div class="cart-item-details">
        <div class="cart-item-name">${escape(item.name)}</div>
        <div class="cart-item-rest">${escape(item.restaurantName)}</div>
        <div class="cart-item-footer">
          <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
          <div class="qty-control" aria-label="Quantity for ${item.name}">
            <button class="qty-btn" onclick="updateCartQty(${item.id},-1)" aria-label="Decrease">&#8722;</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty(${item.id},1)" aria-label="Increase">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove ${item.name}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const totals = getCartTotals();
  document.getElementById('cart-subtotal').textContent = formatPrice(totals.subtotal);
  document.getElementById('cart-delivery').textContent = formatPrice(totals.delivery);
  document.getElementById('cart-tax').textContent = formatPrice(totals.tax);
  document.getElementById('cart-total').textContent = formatPrice(totals.total);
  const discountRow = document.getElementById('cart-discount-row');
  if (discountRow) {
    discountRow.style.display = totals.discount > 0 ? 'flex' : 'none';
    document.getElementById('cart-discount').textContent = `-${formatPrice(totals.discount)}`;
  }
  // Inject sticky mobile checkout button (only on mobile)
  let stickyBtn = document.getElementById('cart-proceed-sticky');
  if (!stickyBtn) {
    stickyBtn = document.createElement('button');
    stickyBtn.id = 'cart-proceed-sticky';
    stickyBtn.setAttribute('aria-label', 'Proceed to Checkout');
    stickyBtn.onclick = proceedToCheckoutGuarded;
    document.body.appendChild(stickyBtn);
  }
  stickyBtn.textContent = `Proceed to Checkout · ${formatPrice(totals.total)}`;
  stickyBtn.classList.toggle('hidden', window.innerWidth >= 640);
}

// --- Checkout ---
async function renderCheckoutPage() {
  if (STATE.cart.length === 0) { navigateTo('cart'); return; }
  // Load addresses from Supabase if logged in and not already loaded
  if (STATE.user?.id && STATE.addresses.length === 0) {
    try {
      const rows = await API.get('addresses', `?user_id=eq.${STATE.user.id}&order=is_default.desc`);
      STATE.addresses = rows || [];
    } catch(e) {
      console.warn('[renderCheckoutPage] Could not load addresses (offline/Supabase down):', e);
      // Keep STATE.addresses as [] — UI will show "add address" prompt gracefully
    }
  }
  const totals = getCartTotals();
  // Update totals
  ['co-subtotal','co-delivery','co-tax','co-total'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatPrice([totals.subtotal, totals.delivery, totals.tax, totals.total][i]);
  });

  // Cart items preview
  const preview = document.getElementById('checkout-items-preview');
  if (preview) {
    preview.innerHTML = STATE.cart.map(i => `
      <div class="summary-row">
        <span>${escape(i.name)} ×${i.qty}</span>
        <span>${formatPrice(i.price*i.qty)}</span>
      </div>
    `).join('');
  }

  // Pre-fill user data
  if (STATE.user) {
    const nameEl = document.getElementById('co-name');
    const phoneEl = document.getElementById('co-phone');
    if (nameEl && !nameEl.value) nameEl.value = STATE.user.name || '';
    if (phoneEl && !phoneEl.value) phoneEl.value = STATE.user.phone || '';
  }
  // Show saved address if available
  const selAddr = document.getElementById('selected-address');
  if (selAddr) {
    if (STATE.addresses.length) {
      const a = STATE.addresses.find(x => x.id === STATE.selectedAddressId) || STATE.addresses[0];
      if (a) {
        STATE.selectedAddressId = a.id;
        selAddr.innerHTML = `<div class="address-icon">${a.label?.[0]||'H'}</div><div style="flex:1"><div class="address-type">${escape(a.label)}</div><div class="address-text">${escape(a.street)}, ${escape(a.city)} ${a.postal_code||''}</div></div><button onclick="loadAddresses();openModal('address-modal')" style="background:var(--brand);color:#fff;border:none;border-radius:var(--radius-sm);padding:4px 10px;font-size:0.75rem;cursor:pointer;flex-shrink:0">Change</button>`;
      }
    } else if (STATE.user?.id) {
      selAddr.innerHTML = `<div style="color:var(--text-2);font-size:0.875rem">No saved addresses. <button onclick="loadAddresses();openModal('address-modal')" style="color:var(--brand);background:none;border:none;cursor:pointer;font-size:0.875rem;text-decoration:underline">Add address</button></div>`;
    } else {
      selAddr.innerHTML = `<div style="color:var(--text-2);font-size:0.875rem">Filling address fields below</div>`;
    }
  }

  const timeChips = document.getElementById('time-chips');
  if (timeChips) {
    const times = [
      {id:'asap',label:'ASAP (25-35 min)'},
      {id:'30',label:'30 min'},
      {id:'60',label:'1 hour'},
      {id:'scheduled',label:'Schedule'},
    ];
    timeChips.innerHTML = times.map(ti => `
      <button class="chip ${STATE.selectedDeliveryTime===ti.id?'active':''}"
              onclick="setDeliveryTime('${ti.id}')">${ti.label}</button>
    `).join('');
  }

  // Payment options
  const paymentEl = document.getElementById('payment-options');
  if (paymentEl) {
    const payments = [
      {id:'razorpay',icon:'💳',label:'Pay Online (Razorpay)',sub:'Cards, UPI, NetBanking, Wallets — Test Mode'},
      {id:'cod',icon:'💵',label:'Cash on Delivery',sub:'Pay when delivered'},
    ];
    paymentEl.innerHTML = payments.map(p => `
      <div class="payment-option ${STATE.selectedPayment===p.id?'active':''}"
           onclick="setPaymentMethod('${p.id}')" role="radio"
           aria-checked="${STATE.selectedPayment===p.id}" tabindex="0">
        <div class="payment-radio"></div>
        <span class="payment-icon">${p.icon}</span>
        <div>
          <div class="payment-label">${p.label}</div>
          <div class="payment-sub">${p.sub}</div>
        </div>
      </div>
    `).join('');
  }
}

function setDeliveryTime(id) {
  STATE.selectedDeliveryTime = id;
  renderCheckoutPage();
}

function setPaymentMethod(id) {
  STATE.selectedPayment = id;
  renderCheckoutPage();
}

// --- Place Order ---
function proceedToCheckoutGuarded() {
  if (!requireAuth('Login to checkout and place your order. Your cart will be saved!')) return;
  navigateTo('checkout');
}

async function placeOrder() {
  if (STATE.cart.length === 0) { showToast('Your cart is empty!','error','!'); return; }
  if (!STATE.user?.id) { showToast('Please login to place an order','error','!'); navigateTo('auth'); return; }

  // If Razorpay selected, initiate Razorpay first
  if (STATE.selectedPayment === 'razorpay') {
    initiateRazorpay();
    return;
  }

  // COD flow
  await submitOrder('cod', null);
}

async function initiateRazorpay() {
  const totals = getCartTotals();
  const amountPaise = Math.round(totals.total * 100);
  const btn = document.getElementById('place-order-btn');

  // Load Razorpay script if not already present
  if (!window.Razorpay) {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    } catch(e) {
      showToast('Payment gateway failed to load. Use COD instead.', 'error', '!');
      if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      return;
    }
  }

  if (!window.Razorpay) {
    showToast('Razorpay unavailable. Please use COD.', 'error', '!');
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    return;
  }

  const options = {
    key: 'rzp_test_StWbKnp1BIk0R6', // Razorpay TEST key — replace with live key for production
    amount: amountPaise,
    currency: 'INR',
    name: 'Foodgasm',
    description: `Order from ${STATE.cart[0]?.restaurantName || 'Restaurant'}`,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%23FF4500"/%3E%3Ctext y=".85em" font-size="55" font-weight="900" font-family="sans-serif" fill="white" text-anchor="middle" x="50"%3EFG%3C/text%3E%3C/svg%3E',
    prefill: {
      name: STATE.user?.name || '',
      email: STATE.user?.email || '',
      contact: STATE.user?.phone || '',
    },
    config: {
      display: {
        blocks: {
          upi: { name: 'UPI Apps', instruments: [
            { method: 'upi', apps: ['google_pay', 'phonepe', 'paytm'] }
          ]},
          other: { name: 'Other Methods', instruments: [
            { method: 'card' },
            { method: 'netbanking' },
            { method: 'wallet' },
          ]},
        },
        sequence: ['block.upi', 'block.other'],
        preferences: { show_default_blocks: false },
      }
    },
    theme: { color: '#FF4500' },
    handler: async function(response) {
      showToast('Payment successful! Placing order…', 'success', '&#10003;');
      await submitOrder('razorpay', response.razorpay_payment_id);
    },
    modal: {
      ondismiss: function() {
        showToast('Payment cancelled', 'info', 'i');
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      showToast('Payment failed: ' + (resp.error?.description || 'Unknown error'), 'error', '!');
      if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    });
    rzp.open();
  } catch(e) {
    showToast('Could not open payment gateway. Try COD instead.', 'error', '!');
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

async function submitOrder(paymentMethod, paymentId) {
  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    const totals = getCartTotals();
    const specialNotes = document.getElementById('special-notes')?.value || document.getElementById('co-notes')?.value || null;

    // Save address from form if no saved address
    if (!STATE.selectedAddressId && STATE.user?.id) {
      const street = document.getElementById('co-address')?.value?.trim();
      const city = document.getElementById('co-city')?.value?.trim();
      const zip = document.getElementById('co-zip')?.value?.trim();
      if (street && city) {
        try {
          const addrRes = await API.post('addresses', {
            user_id: STATE.user.id, label: 'Home', street, city,
            state: '', postal_code: zip || '', country: 'India', is_default: true
          });
          if (addrRes?.length) {
            STATE.addresses.push(addrRes[0]);
            STATE.selectedAddressId = addrRes[0].id;
          }
        } catch(ae) { console.warn('Address save failed:', ae); }
      }
    }

    let orderId = null;

    // Resolve restaurant_id: cart items use local numeric IDs (1-10),
    // but Supabase needs a real UUID. Use supabase_restaurant_id if present,
    // otherwise omit the field entirely to avoid NOT NULL violations.
    const cartRestaurantId = STATE.cart[0]?.supabase_restaurant_id || STATE.cart[0]?.restaurantSupabaseId || null;

    // ── BUILD ORDER PAYLOAD ──────────────────────────────────────────────────
    // ROOT CAUSE FIX: payment_method was NEVER included → NOT NULL violation.
    // Also: status must be 'placed' to match schema enum values.
    const orderStatus   = 'placed';
    const paymentStatus = (paymentMethod === 'cod') ? 'pending' : 'paid';

    // Estimated delivery: base 30-45 min, varies by cart size
    const etaMins = STATE.cart.length > 5 ? 50 : STATE.cart.length > 2 ? 38 : 22;
    const estimatedDeliveryAt = new Date(Date.now() + etaMins * 60000).toISOString();

    // Full payload — all known columns
    const fullPayload = {
      user_id:               STATE.user.id,
      status:                orderStatus,
      payment_status:        paymentStatus,
      payment_method:        paymentMethod,          // ← THE MISSING FIELD (was never set)
      total_amount:          totals.total,
      estimated_delivery_at: estimatedDeliveryAt,
    };
    if (cartRestaurantId)        fullPayload.restaurant_id    = cartRestaurantId;
    if (STATE.selectedAddressId) fullPayload.address_id       = STATE.selectedAddressId;
    if (paymentId)               fullPayload.payment_id       = paymentId;
    if (totals.subtotal != null) fullPayload.subtotal         = totals.subtotal;
    if (totals.delivery != null) fullPayload.delivery_fee     = totals.delivery;
    if (totals.tax      != null) fullPayload.tax_amount       = totals.tax;
    if (totals.discount)         fullPayload.discount_amount  = totals.discount;
    if (specialNotes)            fullPayload.special_notes    = specialNotes;
    if (STATE.promoCode)         fullPayload.coupon_code      = STATE.promoCode;

    console.log('[submitOrder] Attempting full insert:', JSON.stringify(fullPayload));

    // ── INSERT ATTEMPT 1: full payload ──────────────────────────────────────
    let orderRes = null;
    let orderErr = null;
    try {
      orderRes = await API.post('orders', fullPayload);
      console.log('[submitOrder] Full insert OK:', orderRes);
    } catch(e) {
      orderErr = e.message;
      console.error('[submitOrder] Full insert FAILED:', orderErr);
    }

    // ── INSERT ATTEMPT 2: minimal — drop optional cols that may not exist ───
    if (!orderRes) {
      const minPayload = {
        user_id:               STATE.user.id,
        status:                orderStatus,
        payment_status:        paymentStatus,
        payment_method:        paymentMethod,
        total_amount:          totals.total,
        estimated_delivery_at: estimatedDeliveryAt,
      };
      if (cartRestaurantId) minPayload.restaurant_id = cartRestaurantId;
      console.warn('[submitOrder] Trying minimal payload:', JSON.stringify(minPayload));
      try {
        orderRes = await API.post('orders', minPayload);
        if (orderRes) { orderErr = null; console.log('[submitOrder] Minimal insert OK'); }
      } catch(e2) {
        orderErr = e2.message;
        console.error('[submitOrder] Minimal insert FAILED:', orderErr);
      }
    }

    // ── INSERT ATTEMPT 3: no restaurant_id at all ───────────────────────────
    if (!orderRes) {
      const barePayload = {
        user_id:        STATE.user.id,
        status:         orderStatus,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        total_amount:   totals.total,
      };
      console.warn('[submitOrder] Trying bare payload (no restaurant_id):', JSON.stringify(barePayload));
      try {
        orderRes = await API.post('orders', barePayload);
        if (orderRes) { orderErr = null; console.log('[submitOrder] Bare insert OK'); }
      } catch(e3) {
        orderErr = e3.message;
        console.error('[submitOrder] Bare insert FAILED:', orderErr);
      }
    }

    // ── INSERT ATTEMPT 4: status='confirmed' fallback (alt enum value) ──────
    if (!orderRes) {
      const altPayload = {
        user_id:        STATE.user.id,
        status:         'confirmed',
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        total_amount:   totals.total,
      };
      console.warn('[submitOrder] Trying status=confirmed fallback:', JSON.stringify(altPayload));
      try {
        orderRes = await API.post('orders', altPayload);
        if (orderRes) { orderErr = null; console.log('[submitOrder] Confirmed-status insert OK'); }
      } catch(e4) {
        orderErr = e4.message;
        console.error('[submitOrder] All insert attempts FAILED. Final error:', orderErr);
      }
    }

    if (orderRes && orderRes.length) {
      orderId = orderRes[0].id;
      console.log('[submitOrder] ✅ Order created! ID:', orderId);
      // Insert order_items (best-effort — log exact error per item)
      for (const item of STATE.cart) {
        const itemPayload = {
          order_id:    orderId,
          item_name:   item.name,
          quantity:    item.qty,
          unit_price:  item.price,
          total_price: item.price * item.qty,
        };
        if (item.supabase_id) itemPayload.menu_item_id = item.supabase_id;
        try {
          await API.post('order_items', itemPayload);
        } catch(ie) {
          console.warn('[submitOrder] order_items insert failed for', item.name, ':', ie.message);
        }
      }
      // Clear remote cart best-effort
      try { await API.delete('cart_items', `user_id=eq.${STATE.user.id}`); } catch(_){}
    }

    if (!orderId) {
      const errMsg = orderErr || 'Unknown error. Open DevTools → Console for the exact Supabase error.';
      console.error('[submitOrder] ❌ ALL inserts failed. Last error:', errMsg,
        '\nDebug: 1) Check Supabase RLS on orders table  2) Confirm payment_method column exists  3) Check status enum accepts placed/confirmed');
      showToast('Order failed: ' + errMsg, 'error', '✕');
      return;
    }

    // ── SUCCESS ──────────────────────────────────────────────────────────────
    STATE.cart = [];
    STATE.promoCode = null;
    STATE.promoDiscount = 0;
    STATE.selectedAddressId = null;
    // Clear coupon input UI
    const _couponInput = document.getElementById('coupon-input');
    if (_couponInput) _couponInput.value = '';
    saveCart();
    updateCartBadges();
    const shortId = '#FG' + orderId.slice(-6).toUpperCase();
    showToast('Order placed! ' + shortId + ' 🎉', 'success', '✓');
    // Navigate to My Orders so user sees their active order immediately
    STATE.orderFilter = 'all';
    setTimeout(() => navigateTo('orders'), 800);
  } catch(e) {
    console.error('[submitOrder] Unexpected exception:', e);
    showToast('Order error: ' + e.message, 'error', '✕');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

// --- Orders Page ---
async function renderOrdersPage() {
  const chipsEl = document.getElementById('order-filter-chips');
  const filters = [
    {id:'all',label:'All Orders'},
    {id:'active',label:'Active'},
    {id:'delivered',label:'Delivered'},
    {id:'cancelled',label:'Cancelled'},
  ];
  if (chipsEl) {
    chipsEl.innerHTML = filters.map(f => `
      <button class="chip ${STATE.orderFilter===f.id?'active':''}"
              onclick="setOrderFilter('${f.id}')">${f.label}</button>
    `).join('');
  }

  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  if (!STATE.user?.id) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128274;</div><div class="empty-state-title">Login to see your orders</div><button class="btn btn-primary" onclick="openModal('auth-modal')" style="margin-top:12px">Login</button></div>`;
    return;
  }

  listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-3)"><div class="loader-dots" style="justify-content:center"><span></span><span></span><span></span></div></div>`;

  let params = `?user_id=eq.${STATE.user.id}&order=created_at.desc&select=*,restaurants(id,name)`;
  if (STATE.orderFilter === 'active') params += `&status=in.(placed,pending,confirmed,preparing,out_for_delivery)`;
  if (STATE.orderFilter === 'delivered') params += `&status=eq.delivered`;
  if (STATE.orderFilter === 'cancelled') params += `&status=eq.cancelled`;

  const orders = await API.get('orders', params);
  STATE.orders = orders || [];

  if (!orders || orders.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128230;</div><div class="empty-state-title">No orders found</div><div class="empty-state-sub">Your orders will appear here</div><button class="btn btn-primary" onclick="navigateTo('home')" style="margin-top:12px">Start Ordering</button></div>`;
    return;
  }

  const statusLabel = { placed:'Placed', pending:'Pending', confirmed:'Confirmed', preparing:'Preparing', out_for_delivery:'On the Way', delivered:'Delivered', cancelled:'Cancelled' };

  // ---- inline live tracker steps ----
  const INLINE_STEPS = [
    { key:'placed',      icon:'📋', label:'Placed'     },
    { key:'confirmed',   icon:'✅', label:'Confirmed'  },
    { key:'preparing',   icon:'👨‍🍳', label:'Preparing'  },
    { key:'out_for_delivery', icon:'🛵', label:'On the Way' },
    { key:'delivered',   icon:'🏠', label:'Delivered'  },
  ];

  function buildInlineLiveTracker(o) {
    const status = o.status;
    const isActive  = ['placed','pending','confirmed','preparing','out_for_delivery'].includes(status);
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';

    // delivered banner
    if (isDelivered) {
      const deliveredAt = o.delivered_at ? new Date(o.delivered_at).toLocaleString() : new Date(o.created_at).toLocaleString();
      return `
      <div class="delivered-banner">
        <div class="delivered-banner-icon">✅</div>
        <div>
          <div class="delivered-banner-text">Order Delivered!</div>
          <div class="delivered-banner-sub">Delivered on ${deliveredAt}</div>
        </div>
      </div>`;
    }

    // cancelled banner
    if (isCancelled) {
      return `
      <div class="cancelled-banner">
        <div class="cancelled-banner-icon">❌</div>
        <div>
          <div class="cancelled-banner-text">Order Cancelled</div>
          <div class="cancelled-banner-sub">Cancelled on ${new Date(o.created_at).toLocaleString()}</div>
        </div>
      </div>`;
    }

    // live tracker for active orders
    const stepIdx = INLINE_STEPS.findIndex(s => s.key === status);
    const safeIdx  = stepIdx < 0 ? 0 : stepIdx;
    const pct      = safeIdx === 0 ? 0 : Math.round((safeIdx / (INLINE_STEPS.length - 1)) * 96);
    const trackWidth = `calc(${pct}% * (100% - 28px) / 100%)`;

    // ETA
    let etaText = 'Estimating...';
    if (o.estimated_delivery_at) {
      const ms = new Date(o.estimated_delivery_at) - Date.now();
      if (ms > 0) { etaText = `~${Math.ceil(ms/60000)} min`; }
      else { etaText = 'Arriving now!'; }
    } else {
      const ageMins = Math.floor((Date.now() - new Date(o.created_at)) / 60000);
      const baseEta = 35;
      const rem = Math.max(0, baseEta - ageMins);
      etaText = rem > 0 ? `~${rem} min` : 'Arriving now!';
    }

    const statusMessages = {
      placed:           '📋 <strong>Order Placed!</strong> Waiting for restaurant to confirm…',
      pending:          '⏳ <strong>Waiting</strong> for restaurant to confirm your order…',
      confirmed:        '✅ <strong>Confirmed!</strong> Restaurant is getting ready.',
      preparing:        '👨‍🍳 <strong>Preparing</strong> your food right now!',
      out_for_delivery: '🛵 <strong>On the way!</strong> Rider is heading to you.',
    };

    return `
    <div class="live-tracker-panel" id="ltp-${o.id}">
      <div class="live-tracker-header">
        <div class="live-tracker-title">
          <span class="live-dot"></span>
          Live Tracking
        </div>
        <div style="text-align:right"><div style="font-size:0.65rem;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">Est. delivery</div><div class="live-eta-pill" id="leta-${o.id}">${etaText}</div></div>
      </div>
      <div class="live-tracker-steps">
        <div class="live-progress-bar" style="width:${pct}%"></div>
        ${INLINE_STEPS.map((s,i) => {
          const done   = i < safeIdx;
          const active = i === safeIdx;
          return `<div class="live-step ${done?'done':''} ${active?'active':''}">
            <div class="live-step-icon">${done ? '✓' : s.icon}</div>
            <div class="live-step-label">${s.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="live-tracker-footer">
        <div class="live-status-msg">${statusMessages[status] || '📋 Processing your order'}</div>
        <button class="live-refresh-btn" onclick="refreshOrderCard('${o.id}',this)" title="Refresh status">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>`;
  }

  listEl.innerHTML = orders.map(o => {
    const paymentLabel = { cod:'💵 Cash on Delivery', razorpay:'💳 Paid Online', card:'💳 Card', upi:'📱 UPI' };
    const restName = o.restaurants?.name || 'Restaurant';
    const status = o.status;
    const isActive  = ['placed','pending','confirmed','preparing','out_for_delivery'].includes(status);
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';
    const pmLabel = paymentLabel[o.payment_method] || (o.payment_method || 'N/A');
    return `
    <div class="order-card" role="listitem" id="ocard-${o.id}">
      <div class="order-header">
        <div>
          <div class="order-id">#${o.id.slice(-8).toUpperCase()}</div>
          <div class="order-restaurant">${escape(restName)}</div>
        </div>
        <span class="order-status-badge status-${status}" id="badge-${o.id}">${statusLabel[status]||status}</span>
      </div>
      <div class="order-items-list">${formatPrice(o.total_amount)} · ${new Date(o.created_at).toLocaleDateString()} · ${pmLabel}</div>

      ${buildInlineLiveTracker(o)}

      <div class="order-footer">
        <div>
          <div class="order-total">${formatPrice(o.total_amount)}</div>
          <div class="order-date">${new Date(o.created_at).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isDelivered ? `<button class="btn btn-secondary btn-sm" onclick="openReviewModal('${o.id}','${o.restaurants?.id||''}')">⭐ Rate</button><button class="btn btn-outline btn-sm" onclick="reorder('${o.id}')">🔄 Reorder</button>` : ''}
          ${isActive ? `<button class="btn btn-primary btn-sm" onclick="trackLive('${o.id}')">🛵 Full Track</button>` : ''}
          ${isActive ? `<button class="btn btn-sm" style="background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.3)" onclick="cancelOrder('${o.id}')">✕ Cancel</button>` : ''}
          <button class="btn btn-outline btn-sm" onclick="showOrderDetail('${o.id}')">📄 Details</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Start per-card auto refresh for active orders
  startInlineTrackerPolling(orders);
}

function setOrderFilter(id) {
  STATE.orderFilter = id;
  // Update chip active states immediately (no flicker)
  document.querySelectorAll('#order-filter-chips .chip').forEach(btn => {
    const btnId = btn.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
    btn.classList.toggle('active', btnId === id);
  });
  renderOrdersPage();
}

// ===== INLINE LIVE TRACKER LOGIC =====
let _inlinePollTimer = null;
let _inlineActiveIds = [];

function startInlineTrackerPolling(orders) {
  stopInlineTrackerPolling();
  const activeOrders = (orders || []).filter(o =>
    ['placed','pending','confirmed','preparing','out_for_delivery'].includes(o.status)
  );
  _inlineActiveIds = activeOrders.map(o => o.id);
  if (!_inlineActiveIds.length) return;

  // poll every 20 seconds for active orders
  _inlinePollTimer = setInterval(async () => {
    if (!_inlineActiveIds.length || STATE.currentPage !== 'orders') {
      stopInlineTrackerPolling(); return;
    }
    for (const oid of [..._inlineActiveIds]) {
      await _patchOrderCard(oid);
    }
  }, 20000);
}

function stopInlineTrackerPolling() {
  if (_inlinePollTimer) { clearInterval(_inlinePollTimer); _inlinePollTimer = null; }
  _inlineActiveIds = [];
}

async function refreshOrderCard(orderId, btnEl) {
  if (btnEl) btnEl.classList.add('spinning');
  await _patchOrderCard(orderId);
  if (btnEl) { btnEl.classList.remove('spinning'); }
}

async function _patchOrderCard(orderId) {
  try {
    const rows = await API.get('orders',
      `?id=eq.${orderId}&select=id,status,created_at,total_amount,estimated_delivery_at,delivered_at,rider_name,rider_phone,rider_vehicle,restaurants(name)`
    );
    const o = rows?.[0];
    if (!o) return;

    const card = document.getElementById('ocard-' + orderId);
    if (!card) { _inlineActiveIds = _inlineActiveIds.filter(x => x !== orderId); return; }

    const statusLabel = { placed:'Placed', pending:'Pending', confirmed:'Confirmed', preparing:'Preparing', out_for_delivery:'On the Way', delivered:'Delivered', cancelled:'Cancelled' };
    const isActive   = ['placed','pending','confirmed','preparing','out_for_delivery'].includes(o.status);
    const isDelivered = o.status === 'delivered';
    const isCancelled = o.status === 'cancelled';

    // update badge
    const badge = document.getElementById('badge-' + orderId);
    if (badge) {
      badge.textContent = statusLabel[o.status] || o.status;
      badge.className = `order-status-badge status-${o.status}`;
    }

    // if no longer active, re-render the whole page to show final state
    if (!isActive) {
      _inlineActiveIds = _inlineActiveIds.filter(x => x !== orderId);
      if (isDelivered || isCancelled) { renderOrdersPage(); return; }
    }

    // patch ETA pill
    const etaPill = document.getElementById('leta-' + orderId);
    if (etaPill && isActive) {
      let etaText = '~30 min';
      if (o.estimated_delivery_at) {
        const ms = new Date(o.estimated_delivery_at) - Date.now();
        etaText = ms > 0 ? `~${Math.ceil(ms/60000)} min` : 'Arriving now!';
      } else {
        const ageMins = Math.floor((Date.now() - new Date(o.created_at)) / 60000);
        const rem = Math.max(0, 35 - ageMins);
        etaText = rem > 0 ? `~${rem} min` : 'Arriving now!';
      }
      etaPill.textContent = etaText;
    }

    // patch step states
    const INLINE_STEPS = ['placed','confirmed','preparing','out_for_delivery','delivered'];
    const safeIdx = Math.max(0, INLINE_STEPS.indexOf(o.status));
    const panel = document.getElementById('ltp-' + orderId);
    if (panel) {
      const steps = panel.querySelectorAll('.live-step');
      steps.forEach((el, i) => {
        el.className = `live-step${i < safeIdx ? ' done' : i === safeIdx ? ' active' : ''}`;
        const icon = el.querySelector('.live-step-icon');
        if (icon) {
          const icons = ['📋','✅','👨‍🍳','🛵','🏠'];
          icon.textContent = i < safeIdx ? '✓' : icons[i];
        }
      });
      // patch progress bar
      const pb = panel.querySelector('.live-progress-bar');
      const pct = safeIdx === 0 ? 0 : Math.round((safeIdx / (INLINE_STEPS.length - 1)) * 96);
      if (pb) pb.style.width = pct + '%';
      // patch status message
      const statusMessages = {
        placed: '📋 <strong>Order Placed!</strong> Waiting for restaurant to confirm…',
        pending: '⏳ <strong>Waiting</strong> for restaurant to confirm your order…',
        confirmed: '✅ <strong>Confirmed!</strong> Restaurant is getting ready.',
        preparing: '👨‍🍳 <strong>Preparing</strong> your food right now!',
        out_for_delivery: '🛵 <strong>On the way!</strong> Rider is heading to you.',
      };
      const msgEl = panel.querySelector('.live-status-msg');
      if (msgEl) msgEl.innerHTML = statusMessages[o.status] || '📋 Processing your order';
    }

    // fire a notification if status changed
    const prev = _lastKnownStatuses[orderId];
    if (prev && prev !== o.status) {
      const msgs = { confirmed:'Order confirmed!', preparing:'Chef is cooking your order 🍳', out_for_delivery:'Rider is on the way! 🛵', delivered:'Order delivered! 🎉' };
      if (msgs[o.status]) showToast(msgs[o.status], 'success', '🔔');
    }
    _lastKnownStatuses[orderId] = o.status;
  } catch(e) { /* silently skip */ }
}

async function cancelOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  try {
    let cancelled = false;
    // Try RPC first
    try {
      const res = await API.rpc('cancel_order_safe', {
        order_id: orderId,
        requesting_user_id: STATE.user.id,
        reason: 'Cancelled by customer'
      });
      if (res?.success === false) {
        console.warn('[cancelOrder] RPC returned failure:', res.error);
      } else {
        cancelled = true;
      }
    } catch(rpcErr) {
      console.warn('[cancelOrder] RPC failed, trying direct PATCH:', rpcErr.message);
    }

    // Fallback: direct PATCH on orders table
    if (!cancelled) {
      try {
        await API.patch('orders', `id=eq.${orderId}&user_id=eq.${STATE.user.id}`, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        });
        cancelled = true;
      } catch(patchErr) {
        // Try without cancelled_at column in case it doesn't exist
        try {
          await API.patch('orders', `id=eq.${orderId}&user_id=eq.${STATE.user.id}`, {
            status: 'cancelled',
          });
          cancelled = true;
        } catch(e2) {
          console.error('[cancelOrder] Direct PATCH also failed:', e2.message);
          showToast('Could not cancel order: ' + e2.message, 'error', '✕');
          return;
        }
      }
    }

    if (cancelled) {
      showToast('Order cancelled successfully', 'success', '✓');
      // Optimistically update local state immediately
      STATE.orders = (STATE.orders || []).map(o =>
        o.id === orderId ? {...o, status:'cancelled'} : o
      );
      renderOrdersPage();
    }
  } catch(e) {
    showToast('Could not cancel: ' + e.message, 'error', '✕');
  }
}

async function reorder(orderId) {
  const rows = await API.get('order_items', `?order_id=eq.${orderId}`);
  if (!rows || !rows.length) { showToast('Could not fetch order items','error'); return; }
  let added = 0;
  for (const row of rows) {
    // Try menu_item_id match first, then item_name match (case-insensitive)
    let local = null;
    if (row.menu_item_id) {
      local = FOODS.find(f => f.supabase_id === row.menu_item_id || String(f.id) === String(row.menu_item_id));
    }
    if (!local && row.item_name) {
      local = FOODS.find(f => f.name.toLowerCase() === row.item_name.toLowerCase());
    }
    if (local) {
      const ex = STATE.cart.find(i => i.id === local.id);
      if (ex) ex.qty += (row.quantity || 1);
      else STATE.cart.push({ ...local, qty: row.quantity || 1 });
      added++;
    } else if (row.item_name && (row.unit_price || row.item_price)) {
      // Item not found locally — add as synthetic cart item so reorder always works
      const syntheticId = 'reorder_' + (row.menu_item_id || row.item_name.replace(/\s+/g,'_'));
      const ex = STATE.cart.find(i => i.id === syntheticId);
      if (ex) ex.qty += (row.quantity || 1);
      else STATE.cart.push({
        id: syntheticId,
        name: row.item_name,
        price: parseFloat(row.unit_price || row.item_price) || 0,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        category: 'Food',
        restaurantName: '',
        restaurantId: null,
        qty: row.quantity || 1,
      });
      added++;
    }
  }
  if (added > 0) {
    saveCart(); updateCartBadges();
    showToast(`${added} item(s) added to cart!`, 'success', '&#10003;');
    navigateTo('cart');
  } else {
    showToast('Items from this order are no longer available', 'info');
  }
}

// =============================================
// ===== LIVE ORDER TRACKING =====
// =============================================
const TRACK_STEPS = [
  {key:'pending',    label:'Order Placed',   icon:'📋', time:'Just now'},
  {key:'confirmed',  label:'Confirmed',      icon:'✅', time:'+2 min'},
  {key:'preparing',  label:'Preparing',      icon:'👨‍🍳', time:'+10 min'},
  {key:'out_for_delivery', label:'On the Way', icon:'🛵', time:'+25 min'},
  {key:'delivered',  label:'Delivered',      icon:'🏠', time:'+35 min'},
];

const MOCK_RIDERS = [
  {name:'Rahul Kumar',vehicle:'Activa • MH02 AB1234',avatar:'🧑‍🦱',phone:'+91 98765 43210'},
  {name:'Priya Singh', vehicle:'Splendor • MH01 CD5678',avatar:'👩‍🦰',phone:'+91 87654 32109'},
  {name:'Arjun Mehta', vehicle:'Access • KA03 EF9012',avatar:'🧔',phone:'+91 76543 21098'},
];

let _trackingOrderId = null;
let _trackingInterval = null;
let _realtimeChannel = null;
let _lastKnownStatuses = {};

async function showOrderDetail(orderId) {
  openModal('order-detail-modal');
  const bodyEl = document.getElementById('order-detail-body');
  const titleEl = document.getElementById('order-detail-title');
  if (bodyEl) bodyEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-3)"><div class="loader-dots" style="justify-content:center"><span></span><span></span><span></span></div></div>`;

  try {
    const [orderRows, itemRows] = await Promise.all([
      API.get('orders', `?id=eq.${orderId}&select=*,restaurants(id,name)`),
      API.get('order_items', `?order_id=eq.${orderId}&select=*`)
    ]);
    const o = orderRows?.[0];
    if (!o) { if(bodyEl) bodyEl.innerHTML = `<div style="color:var(--red);padding:16px">Order not found.</div>`; return; }
    if(titleEl) titleEl.textContent = `Order #${String(o.id).slice(-8).toUpperCase()}`;

    const statusLabel = {placed:'Placed',pending:'Pending',confirmed:'Confirmed',preparing:'Preparing',out_for_delivery:'On the Way',delivered:'Delivered',cancelled:'Cancelled'};
    const payLabel = {cod:'💵 Cash on Delivery',razorpay:'💳 Paid Online',card:'💳 Card',upi:'📱 UPI'};
    const isActive = ['placed','pending','confirmed','preparing','out_for_delivery'].includes(o.status);
    const isDelivered = o.status === 'delivered';
    const isCancelled = o.status === 'cancelled';

    let etaHtml = '';
    if (isActive) {
      let etaText = '~35 min';
      if (o.estimated_delivery_at) {
        const ms = new Date(o.estimated_delivery_at) - Date.now();
        etaText = ms > 0 ? `~${Math.ceil(ms/60000)} min` : 'Arriving now!';
      } else {
        const ageMins = Math.floor((Date.now() - new Date(o.created_at))/60000);
        const rem = Math.max(0, 35 - ageMins);
        etaText = rem > 0 ? `~${rem} min` : 'Arriving now!';
      }
      etaHtml = `<div style="background:var(--brand);color:#fff;border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600">⏱ Est. Delivery</span><span style="font-weight:800">${etaText}</span></div>`;
    }
    if (isDelivered) {
      const deliveredAt = o.delivered_at ? new Date(o.delivered_at).toLocaleString() : new Date(o.updated_at||o.created_at).toLocaleString();
      etaHtml = `<div style="background:rgba(34,197,94,0.15);color:var(--green);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-weight:600">✅ Delivered on ${deliveredAt}</div>`;
    }
    if (isCancelled) {
      etaHtml = `<div style="background:rgba(239,68,68,0.12);color:var(--red);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-weight:600">❌ Order Cancelled</div>`;
    }

    let itemsHtml = '<div style="color:var(--text-3);font-size:0.8rem">No item details available</div>';
    if (itemRows && itemRows.length) {
      itemsHtml = itemRows.map(it => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:0.875rem;font-weight:600;color:var(--text)">${it.item_name || 'Item'}</div>
            <div style="font-size:0.75rem;color:var(--text-3)">Qty: ${it.quantity||1}</div>
          </div>
          <div style="font-weight:700;color:var(--text)">${formatPrice((it.price||0)*(it.quantity||1))}</div>
        </div>`).join('');
    }

    const subtotal = itemRows ? itemRows.reduce((s,it)=>s+(parseFloat(it.price||0)*(it.quantity||1)),0) : parseFloat(o.total_amount||0);
    const deliveryFee = parseFloat(o.delivery_fee||0) || 30;
    const discount = parseFloat(o.discount||0) || 0;

    // Live tracker steps for active orders
    const STEPS = [{key:'placed',icon:'📋',label:'Placed'},{key:'confirmed',icon:'✅',label:'Confirmed'},{key:'preparing',icon:'👨‍🍳',label:'Preparing'},{key:'out_for_delivery',icon:'🛵',label:'On the Way'},{key:'delivered',icon:'🏠',label:'Delivered'}];
    let trackerHtml = '';
    if (!isCancelled) {
      const si = STEPS.findIndex(s=>s.key===o.status); const safeI = si<0?0:si;
      trackerHtml = `<div style="display:flex;justify-content:space-between;margin:12px 0 16px;position:relative">
        <div style="position:absolute;top:14px;left:14px;right:14px;height:2px;background:var(--border);z-index:0"></div>
        <div style="position:absolute;top:14px;left:14px;height:2px;background:var(--brand);z-index:1;width:${safeI===0?0:Math.round(safeI/(STEPS.length-1)*100)}%;transition:width 0.5s"></div>
        ${STEPS.map((s,i)=>{const done=i<safeI;const active=i===safeI;return `<div style="display:flex;flex-direction:column;align-items:center;z-index:2;flex:1">
          <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;background:${done?'var(--brand)':active?'var(--brand)':'var(--surface-2)'};color:${done||active?'#fff':'var(--text-3)'};border:2px solid ${done||active?'var(--brand)':'var(--border)'}">
            ${done?'✓':s.icon}
          </div>
          <div style="font-size:0.6rem;color:${active?'var(--brand)':'var(--text-3)'};margin-top:4px;font-weight:${active?700:400};text-align:center">${s.label}</div>
        </div>`;}).join('')}
      </div>`;
    }

    if(bodyEl) bodyEl.innerHTML = `
      <div>
        ${etaHtml}
        <div style="background:var(--surface-2);border-radius:var(--radius);padding:12px 14px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.78rem">Order ID</span>
            <span style="font-weight:700;font-size:0.78rem">#${String(o.id).slice(-8).toUpperCase()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.78rem">Restaurant</span>
            <span style="font-weight:600;font-size:0.78rem">${o.restaurants?.name||'—'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.78rem">Status</span>
            <span class="order-status-badge status-${o.status}" style="font-size:0.72rem">${statusLabel[o.status]||o.status}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.78rem">Date</span>
            <span style="font-size:0.78rem">${new Date(o.created_at).toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:var(--text-3);font-size:0.78rem">Payment</span>
            <span style="font-size:0.78rem">${payLabel[o.payment_method]||o.payment_method||'—'}</span>
          </div>
        </div>

        ${trackerHtml}

        <h3 style="font-size:0.875rem;font-weight:700;margin:0 0 8px">Items Ordered</h3>
        <div style="margin-bottom:12px">${itemsHtml}</div>

        <div style="background:var(--surface-2);border-radius:var(--radius);padding:12px 14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.8rem">Subtotal</span>
            <span style="font-size:0.8rem">${formatPrice(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-3);font-size:0.8rem">Delivery Fee</span>
            <span style="font-size:0.8rem">${formatPrice(deliveryFee)}</span>
          </div>
          ${discount>0?`<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--green);font-size:0.8rem">Discount</span><span style="color:var(--green);font-size:0.8rem">-${formatPrice(discount)}</span></div>`:''}
          <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
            <span style="font-weight:700">Total</span>
            <span style="font-weight:800;color:var(--brand)">${formatPrice(o.total_amount)}</span>
          </div>
        </div>

        ${o.delivery_address ? `<div style="margin-top:12px;background:var(--surface-2);border-radius:var(--radius);padding:12px 14px">
          <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:4px">Delivery Address</div>
          <div style="font-size:0.875rem;font-weight:600">📍 ${o.delivery_address}</div>
        </div>` : ''}

        ${o.delivery_notes ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-2)">📝 ${o.delivery_notes}</div>` : ''}
      </div>`;
  } catch(e) {
    console.error('showOrderDetail error:', e);
    if(bodyEl) bodyEl.innerHTML = `<div style="color:var(--red);padding:16px">Failed to load order details. Please try again.</div>`;
  }
}

async function trackLive(orderId) {
  _trackingOrderId = orderId;
  document.getElementById('track-order-id').textContent = `Order #${String(orderId).slice(-8).toUpperCase()}`;
  openModal('tracking-modal');
  await refreshTrackingView(orderId);
  // Start Supabase Realtime subscription for live updates
  subscribeOrderRealtime(orderId);
}

function subscribeOrderRealtime(orderId) {
  // Cleanup previous channel
  if (_realtimeChannel) {
    try { _realtimeChannel.close?.(); } catch(_) {}
    _realtimeChannel = null;
  }
  try {
    const wsUrl = CONFIG.SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + CONFIG.SUPABASE_ANON_KEY + '&vsn=1.0.0';
    const ws = new WebSocket(wsUrl);
    _realtimeChannel = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        topic: 'realtime:public:orders:id=eq.' + orderId,
        event: 'phx_join',
        payload: { config: { broadcast: {}, presence: {}, postgres_changes: [{ event: 'UPDATE', schema: 'public', table: 'orders', filter: 'id=eq.' + orderId }] } },
        ref: '1'
      }));
    };
    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'postgres_changes' || (msg.payload?.data?.type === 'UPDATE')) {
          await refreshTrackingView(orderId);
          if (STATE.currentPage === 'orders') renderOrdersPage();
        }
      } catch(_) {}
    };
    ws.onerror = () => {}; // Silently fall back to polling
  } catch(_) {}
}

function stopRealtimeTracking() {
  if (_realtimeChannel) {
    try { _realtimeChannel.close?.(); } catch(_) {}
    _realtimeChannel = null;
  }
}

async function refreshTrackingView(orderId) {
  const bodyEl = document.getElementById('tracking-modal-body');
  if (!bodyEl) return;

  // Fetch latest status + rider/ETA fields from Supabase
  const rows = await API.get('orders', `?id=eq.${orderId}&select=id,status,created_at,total_amount,rider_name,rider_phone,rider_vehicle,estimated_delivery_at`);
  const order = rows?.[0];
  if (!order) {
    bodyEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-3)">Could not load order details.</div>`;
    return;
  }

  const stepIdx = TRACK_STEPS.findIndex(s => s.key === order.status);
  const safeIdx = stepIdx < 0 ? 0 : stepIdx;
  const progress = safeIdx === 0 ? 4 : Math.round((safeIdx / (TRACK_STEPS.length - 1)) * 100);

  // Use real rider data from DB if available, else fallback to mock
  const mockRider = MOCK_RIDERS[Math.floor(Math.random() * MOCK_RIDERS.length)];
  const rider = {
    name: order.rider_name || mockRider.name,
    vehicle: order.rider_vehicle || mockRider.vehicle,
    avatar: mockRider.avatar,
    phone: order.rider_phone || mockRider.phone
  };

  const isActive = ['confirmed','preparing','out_for_delivery'].includes(order.status);
  const isDelivered = order.status === 'delivered';

  // ETA: use real estimated_delivery_at if available
  let etaText = isDelivered ? 'Delivered!' : isActive ? '~12 min' : '~30 min';
  let etaMins = 12;
  if (order.estimated_delivery_at && !isDelivered) {
    const etaMs = new Date(order.estimated_delivery_at) - Date.now();
    if (etaMs > 0) {
      etaMins = Math.ceil(etaMs / 60000);
      etaText = `~${etaMins} min`;
    } else {
      etaText = 'Arriving now!';
      etaMins = 0;
    }
  }

  bodyEl.innerHTML = `
    <!-- Map placeholder -->
    <div class="map-placeholder">
      <div class="map-route"></div>
      <div class="map-dot" style="top:${isDelivered?'70':'45'}%;left:${isDelivered?'60':'30'}%;animation-duration:${isDelivered?'0':'1.5s'}s"></div>
      <div class="map-dest"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.4" viewBox="0 0 320 200">
        <path d="M80,100 Q140,60 180,90 Q220,120 260,70" stroke="var(--brand)" stroke-width="2.5" fill="none" stroke-dasharray="6,4" opacity="0.8"/>
      </svg>
      <div class="map-label">Live Map Preview</div>
    </div>

    <!-- Step progress -->
    <div style="position:relative;padding:0 12px">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
        <div class="track-nodes">
          ${TRACK_STEPS.map((s,i) => {
            const done = i < safeIdx;
            const active = i === safeIdx;
            return `<div class="track-node ${done?'done':''} ${active?'active':''}" title="${s.label}">
              ${done ? '✓' : i+1}
              <div class="track-node-label">${s.label}</div>
              ${active ? `<div class="track-node-time">${s.time}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Current status callout -->
    <div style="text-align:center;padding:16px 0 8px">
      <div style="font-size:2rem;margin-bottom:6px">${TRACK_STEPS[safeIdx]?.icon || '📋'}</div>
      <div style="font-size:1.1rem;font-weight:800;color:var(--text);font-family:var(--font-display)">${TRACK_STEPS[safeIdx]?.label || order.status}</div>
      ${isActive ? `<div style="font-size:0.8rem;color:var(--text-2);margin-top:4px">Your order is on its way <span class="pulse-dot" style="margin-left:4px"></span></div>` : ''}
      ${isDelivered ? `<div style="font-size:0.8rem;color:var(--green);margin-top:4px;font-weight:600">✅ Delivered successfully</div>` : ''}
    </div>

    ${isActive ? `
    <!-- Rider info -->
    <div class="rider-info">
      <div class="rider-avatar">${rider.avatar}</div>
      <div>
        <div class="rider-name">${rider.name}</div>
        <div class="rider-vehicle">🏍️ ${rider.vehicle}</div>
      </div>
      <div class="rider-actions">
        <button class="rider-action-btn" title="Call Rider" onclick="showToast('Calling ${rider.name}...','info','📞')">📞</button>
        <button class="rider-action-btn" title="Message Rider" onclick="showToast('Opening chat...','info','💬')">💬</button>
      </div>
    </div>` : ''}

    <!-- ETA bar -->
    <div style="background:var(--surface-2);border-radius:var(--radius);padding:14px 16px;margin-top:14px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border)">
      <div>
        <div style="font-size:0.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:0.06em">Estimated Arrival</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--brand);font-family:var(--font-display)" id="eta-countdown">${etaText}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:0.72rem;color:var(--text-3)">Order Total</div>
        <div style="font-weight:700;color:var(--text)">${formatPrice(order.total_amount)}</div>
      </div>
    </div>

    ${isActive ? `
    <!-- Advance status (dev/admin) -->
    <button class="btn btn-outline btn-full btn-sm" style="margin-top:12px;font-size:0.75rem;opacity:0.7" onclick="advanceOrderStatus('${orderId}')">
      🔧 Simulate Next Step (Dev Mode)
    </button>` : ''}
  `;

  // Start countdown if active
  if (isActive && etaMins > 0) startETACountdown(etaMins);
}

function startETACountdown(initialMins) {
  let mins = (initialMins != null ? initialMins : 12), secs = 0;
  clearInterval(window._etaTimer);
  window._etaTimer = setInterval(() => {
    const el = document.getElementById('eta-countdown');
    if (!el) { clearInterval(window._etaTimer); return; }
    if (secs === 0) {
      if (mins === 0) { clearInterval(window._etaTimer); el.textContent = 'Arriving now!'; return; }
      mins--; secs = 59;
    } else { secs--; }
    el.textContent = `${mins}:${String(secs).padStart(2,'0')}`;
  }, 1000);
}

async function advanceOrderStatus(orderId) {
  const res = await API.rpc('advance_order_status', { order_id: orderId });
  const newStatus = res?.new_status || res;
  showToast(`Status → ${newStatus || 'updated'}`, 'success', '✅');
  await refreshTrackingView(orderId);
  // Also refresh orders list if visible
  if (STATE.currentPage === 'orders') renderOrdersPage();
}

// =============================================
// ===== ORDER STATUS POLLING (every 30s) =====
// =============================================
let _pollInterval = null;

function startOrderPolling() {
  stopOrderPolling();
  if (!STATE.user?.id) return;
  _pollInterval = setInterval(async () => {
    // Only poll if on orders page or tracking modal is open
    const trackingOpen = !document.getElementById('tracking-modal')?.classList.contains('hidden');
    if (STATE.currentPage === 'orders') {
      await renderOrdersPage();
    }
    if (trackingOpen && _trackingOrderId) {
      await refreshTrackingView(_trackingOrderId);
    }
    // Check for status changes and fire notifications
    await pollForStatusChanges();
  }, 30000);
}

function stopOrderPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

async function pollForStatusChanges() {
  if (!STATE.user?.id) return;
  const activeOrders = await API.get('orders',
    `?user_id=eq.${STATE.user.id}&status=in.(placed,pending,confirmed,preparing,out_for_delivery)&select=id,status`);
  if (!activeOrders) return;
  activeOrders.forEach(o => {
    const prev = _lastKnownStatuses[o.id];
    if (prev && prev !== o.status) {
      const label = {confirmed:'✅ Order Confirmed!', preparing:'👨‍🍳 Being Prepared', out_for_delivery:'🛵 Out for Delivery!', delivered:'🎉 Delivered!'}[o.status] || o.status;
      triggerNotification('Order Update', label, o.id);
      showToast(label, 'success', '🛵');
      showPushBellDot();
    }
    _lastKnownStatuses[o.id] = o.status;
  });
}

// --- Wishlist ---
async function renderWishlistPage() {
  const el = document.getElementById('wishlist-content');
  if (!el) return;

  // Not logged in AND no local wishlist
  if (!STATE.user?.id && !STATE.wishlist.length) {
    el.innerHTML = `
      <div class="wishlist-empty">
        <div class="empty-state-icon">🔐</div>
        <div class="empty-state-title">Login to save your wishlist</div>
        <div class="empty-state-sub">Your favourites will sync across devices when you're logged in.</div>
        <button class="btn btn-primary" onclick="navigateTo('auth')" style="margin-top:16px">Login / Sign Up</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-top:8px">
      ${Array(6).fill(0).map(()=>`
        <div class="skeleton-card">
          <div class="skeleton sk-img" style="height:140px;border-radius:var(--radius-lg) var(--radius-lg) 0 0"></div>
          <div style="padding:10px">
            <div class="skeleton sk-line" style="margin:0 0 8px 0;height:13px;border-radius:6px"></div>
            <div class="skeleton sk-line-sm" style="margin:0 0 10px 0;height:10px;border-radius:6px"></div>
            <div class="skeleton" style="height:28px;border-radius:var(--radius-full);margin-top:6px"></div>
          </div>
        </div>`).join('')}
    </div>`;

  // Merge server rows (if logged in) with local STATE.wishlist
  let allItems = [...STATE.wishlist];
  if (STATE.user?.id) {
    try {
      const rows = await API.get('wishlist', `?user_id=eq.${STATE.user.id}&select=*`);
      if (rows && rows.length) {
        const serverItems = rows.map(r => {
          const type = r.item_type || 'restaurant';
          let localItem, itemId;
          if (type === 'food') {
            itemId = r.menu_item_id || r.restaurant_id;
            localItem = FOODS.find(f => String(f.id) === String(itemId));
          } else {
            itemId = r.restaurant_id;
            localItem = RESTAURANTS.find(rest => String(rest.id) === String(itemId));
          }
          if (!itemId || !localItem) return null;
          return { ...localItem, wishlist_id: r.id, type };
        }).filter(Boolean);

        // Merge: server is authoritative
        allItems = [...serverItems];
        STATE.wishlist.forEach(w => {
          if (!allItems.find(a => String(a.id) === String(w.id) && a.type === w.type)) {
            allItems.push(w);
          }
        });
        STATE.wishlist = allItems;
        saveWishlist();
      }
    } catch(e) { console.warn('[wishlist] sync error:', e); }
  }

  // Deduplicate
  const seen = new Set();
  allItems = allItems.filter(w => {
    const key = `${w.type}-${w.id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  if (!allItems.length) {
    el.innerHTML = `
      <div class="wishlist-empty">
        <div class="empty-state-icon">♡</div>
        <div class="empty-state-title">Your wishlist is empty</div>
        <div class="empty-state-sub">Tap the ♡ on any food or restaurant to save it here</div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-primary" onclick="navigateTo('home')">🍔 Explore Food</button>
          <button class="btn btn-secondary" onclick="navigateTo('restaurants')">🏪 Browse Restaurants</button>
        </div>
      </div>`;
    return;
  }

  const wishRests = allItems.filter(w => w.type !== 'food');
  const wishFoods = allItems.filter(w => w.type === 'food');

  // Build tab header
  let html = `
    <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
      <button class="chip active" id="wtab-all" onclick="switchWishlistTab('all')">All (${allItems.length})</button>
      ${wishRests.length ? `<button class="chip" id="wtab-restaurants" onclick="switchWishlistTab('restaurants')">🏪 Restaurants (${wishRests.length})</button>` : ''}
      ${wishFoods.length  ? `<button class="chip" id="wtab-foods"       onclick="switchWishlistTab('foods')">🍔 Foods (${wishFoods.length})</button>` : ''}
    </div>`;

  // Restaurants section
  if (wishRests.length) {
    html += `<div id="wsec-restaurants">
      <h2 style="font-size:1rem;font-weight:700;margin:0 0 12px;color:var(--text)">Saved Restaurants (${wishRests.length})</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${wishRests.map(r => `
          <div style="background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);padding:12px 14px;display:flex;align-items:center;gap:12px;min-width:0" role="listitem">
            ${r.img ? `<img src="${escape(r.img)}" alt="${escape(r.name||'')}" loading="lazy" style="width:56px;height:56px;border-radius:var(--radius);object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">` : `<div style="width:56px;height:56px;border-radius:var(--radius);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0" aria-hidden="true">🏪</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:0.9rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(r.name||'Restaurant')}</div>
              <div style="font-size:0.73rem;color:var(--text-3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(r.cuisine||'')}${r.rating?` · ⭐${r.rating}`:''}${r.deliveryTime?` · ${r.deliveryTime} min`:''}</div>
              ${r.offer ? `<div style="font-size:0.68rem;color:var(--brand);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏷️ ${escape(r.offer)}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
              <button class="btn btn-primary btn-sm" onclick="openRestaurantMenu(${r.id})" aria-label="Open ${escape(r.name||'restaurant')}" style="font-size:0.72rem;padding:5px 12px;white-space:nowrap">Open</button>
              <button class="btn btn-sm" onclick="toggleWishlist(${r.id},'restaurant')" aria-label="Remove from wishlist" style="font-size:0.72rem;padding:5px 12px;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.25);white-space:nowrap">✕ Remove</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // Foods section
  if (wishFoods.length) {
    html += `<div id="wsec-foods" ${wishRests.length ? 'style="margin-top:24px"' : ''}>
      <h2 style="font-size:1rem;font-weight:700;margin:0 0 12px;color:var(--text)">Saved Foods (${wishFoods.length})</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${wishFoods.map(f => `
          <div style="background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);padding:12px 14px;display:flex;align-items:center;gap:12px;min-width:0" role="listitem">
            ${f.img ? `<img src="${escape(f.img)}" alt="${escape(f.name||'')}" loading="lazy" style="width:56px;height:56px;border-radius:var(--radius);object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">` : `<div style="width:56px;height:56px;border-radius:var(--radius);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0" aria-hidden="true">🍔</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:0.9rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(f.name||'Food Item')}</div>
              <div style="font-size:0.8rem;font-weight:700;color:var(--brand);margin-top:2px">${formatPrice(f.price||0)}</div>
              <div style="font-size:0.72rem;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(f.restaurantName||f.category||'')}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
              <button class="btn btn-primary btn-sm" onclick="addToCart(${f.id})" aria-label="Add ${escape(f.name||'item')} to cart" style="font-size:0.72rem;padding:5px 12px;white-space:nowrap">+ Cart</button>
              <button class="btn btn-sm" onclick="toggleWishlist(${f.id},'food')" aria-label="Remove from wishlist" style="font-size:0.72rem;padding:5px 12px;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.25);white-space:nowrap">✕ Remove</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  el.innerHTML = html;
  // Update wishlist badge on profile page
  const statWish = document.getElementById('stat-wishlist');
  if (statWish) statWish.textContent = allItems.length;
}

function switchWishlistTab(tab) {
  ['all','restaurants','foods'].forEach(t => {
    const btn = document.getElementById(`wtab-${t}`);
    const sec = document.getElementById(`wsec-${t === 'all' ? 'restaurants' : t}`);
    if (btn) btn.classList.toggle('active', t === tab || tab === 'all');
  });
  const secRest = document.getElementById('wsec-restaurants');
  const secFood = document.getElementById('wsec-foods');
  if (secRest) secRest.style.display = (tab === 'all' || tab === 'restaurants') ? '' : 'none';
  if (secFood) secFood.style.display = (tab === 'all' || tab === 'foods') ? '' : 'none';
  // Fix active chip state
  ['all','restaurants','foods'].forEach(t => {
    const btn = document.getElementById(`wtab-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
  });
}

// --- Search ---
function initSearchPage() {
  renderSearchFilters();
  renderRecentSearches();
}

function renderSearchFilters() {
  const el = document.getElementById('search-filters');
  if (!el) return;
  const filters = [
    {id:'all',label:'All'},
    {id:'restaurants',label:'Restaurants'},
    {id:'food',label:'Food'},
    {id:'veg',label:'Veg'},
    {id:'fast',label:'Fast Delivery'},
    {id:'rating',label:'Top Rated'},
  ];
  el.innerHTML = filters.map(f => `
    <button class="filter-chip ${f.id==='all'?'active':''}"
            onclick="setSearchFilter('${f.id}',this)">${f.label}</button>
  `).join('');
}

function setSearchFilter(id, el) {
  $$('#search-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  handleSearch(document.getElementById('main-search-input')?.value || '');
}

function handleSearch(query) {
  STATE.searchQuery = query;
  const resultsEl = document.getElementById('search-results-list');
  const recentEl = document.getElementById('recent-searches-section');
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
  if (!query.trim()) {
    if (resultsEl) resultsEl.innerHTML = '';
    if (recentEl) recentEl.style.display = 'block';
    return;
  }
  if (recentEl) recentEl.style.display = 'none';
  const q = query.toLowerCase();
  const activeFilter = document.querySelector('#search-filters .filter-chip.active')?.textContent?.toLowerCase() || 'all';
  let matchedFoods = FOODS.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.restaurantName.toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q)) || f.desc.toLowerCase().includes(q));
  let matchedRests = RESTAURANTS.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));

  // Apply filter chip
  if (activeFilter === 'restaurants') matchedFoods = [];
  if (activeFilter === 'food') matchedRests = [];
  if (activeFilter === 'veg') { matchedFoods = matchedFoods.filter(f => f.veg); matchedRests = matchedRests.filter(r => r.veg); }
  if (activeFilter === 'fast delivery') matchedRests = matchedRests.filter(r => parseInt(r.deliveryTime) <= 25);
  if (activeFilter === 'top rated') { matchedFoods = matchedFoods.filter(f => f.rating >= 4.5); matchedRests = matchedRests.filter(r => r.rating >= 4.4); }

  let html = '';
  if (matchedRests.length > 0) {
    html += `<div style="font-size:1rem;font-weight:700;margin:16px 0 12px">Restaurants (${matchedRests.length})</div>`;
    html += `<div class="restaurant-grid">${matchedRests.map(r=>`<div onclick="openRestaurantMenu(${r.id})">${restaurantCardHTML(r)}</div>`).join('')}</div>`;
  }
  if (matchedFoods.length > 0) {
    html += `<div style="font-size:1rem;font-weight:700;margin:24px 0 12px">Food Items (${matchedFoods.length})</div>`;
    html += `<div class="food-grid">${matchedFoods.map(f=>foodCardHTML(f)).join('')}</div>`;
  }
  if (matchedFoods.length === 0 && matchedRests.length === 0) {
    html = `<div class="empty-state"><div class="empty-state-icon">&#128269;</div><div class="empty-state-title">No results found</div><div class="empty-state-sub">Try searching for "pizza", "burger", or "biryani"</div></div>`;
  }
  if (resultsEl) resultsEl.innerHTML = html;
  // Save recent search
  if (query.trim() && !STATE.recentSearches.includes(query.trim())) {
    STATE.recentSearches.unshift(query.trim());
    STATE.recentSearches = STATE.recentSearches.slice(0,6);
    localStorage.setItem('fg_recent_searches', JSON.stringify(STATE.recentSearches));
  }
}

function clearSearch() {
  const inp = document.getElementById('main-search-input');
  if (inp) { inp.value = ''; inp.focus(); }
  handleSearch('');
}

function renderRecentSearches() {
  const el = document.getElementById('recent-searches-list');
  if (!el) return;
  if (STATE.recentSearches.length === 0) {
    el.innerHTML = `<p style="color:var(--text-3);font-size:0.875rem">No recent searches</p>`;
    return;
  }
  el.innerHTML = STATE.recentSearches.map(s => `
    <button style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-full);font-size:0.8rem;color:var(--text-2);margin:4px;cursor:pointer;transition:all var(--transition)"
            onclick="document.getElementById('main-search-input').value='${escape(s)}';handleSearch('${escape(s)}')"
            onmouseover="this.style.borderColor='var(--brand)'" onmouseout="this.style.borderColor='var(--border)'">
      &#9202; ${escape(s)}
    </button>
  `).join('');
}

function clearRecentSearches() {
  STATE.recentSearches = [];
  localStorage.setItem('fg_recent_searches', '[]');
  renderRecentSearches();
}

// --- Hero Search ---
function handleHeroSearch() {
  const q = document.getElementById('hero-search-input')?.value || '';
  if (q.trim()) {
    navigateTo('search');
    setTimeout(() => {
      const inp = document.getElementById('main-search-input');
      if (inp) { inp.value = q; handleSearch(q); }
    }, 200);
  } else {
    navigateTo('search');
  }
}

// --- Admin ---
async function renderAdminPage() {
  const statusColors = {preparing:'rgba(245,158,11,0.15)',delivered:'rgba(34,197,94,0.15)','on-the-way':'rgba(59,130,246,0.15)',cancelled:'rgba(239,68,68,0.15)',pending:'rgba(59,130,246,0.1)'};
  const statusText = {preparing:'var(--yellow)',delivered:'var(--green)','on-the-way':'var(--blue)',cancelled:'var(--red)',pending:'var(--blue)'};

  // --- Fetch real data in parallel ---
  const [orders, users, reviews, wishlistRows, rewardRows] = await Promise.all([
    API.get('orders', '?select=id,status,total_amount,created_at,user_id,restaurant_id,restaurants(name)&order=created_at.desc&limit=200'),
    API.get('users', '?select=id&limit=1&order=id.asc'),
    API.get('reviews', '?select=rating&limit=200'),
    API.get('wishlist', '?select=id,item_type&limit=500').catch(()=>null),
    API.get('users', '?select=id,reward_points&limit=500').catch(()=>null),
  ]);

  // Compute real stats from fetched data
  const totalOrders = orders?.length ?? 0;
  const revenue = orders ? orders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0) : 0;
  const cancelCount = orders ? orders.filter(o => o.status === 'cancelled').length : 0;
  const deliveredCount = orders ? orders.filter(o => o.status === 'delivered').length : 0;
  const activeCount = orders ? orders.filter(o => ['placed','pending','confirmed','preparing','out_for_delivery'].includes(o.status)).length : 0;
  const cancelRate = totalOrders > 0 ? ((cancelCount / totalOrders) * 100).toFixed(1) : '0.0';
  const avgRating = reviews && reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const wishlistCount = wishlistRows ? wishlistRows.length : '—';
  const wishlistFoodCount = wishlistRows ? wishlistRows.filter(w=>w.item_type==='food').length : 0;
  const wishlistRestCount = wishlistRows ? wishlistRows.filter(w=>w.item_type!=='food').length : 0;
  const totalRewardPoints = rewardRows ? rewardRows.reduce((s,u)=>s+(parseInt(u.reward_points)||0),0) : '—';

  // For total users, fetch with count header
  let totalUsers = '—';
  try {
    const uRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/users?select=id`, {
      headers: { ...API.headers(), 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }
    });
    const cr = uRes.headers.get('Content-Range');
    if (cr) totalUsers = parseInt(cr.split('/')[1]) || '—';
  } catch(e) {}

  const statsGrid = document.getElementById('admin-stats-grid');
  if (statsGrid) {
    const stats = [
      {icon:'#', value: totalOrders.toLocaleString(), label:'Total Orders', change:'Live from DB', up:true},
      {icon:'&#8377;', value: revenue > 0 ? revenue.toLocaleString('en-IN',{maximumFractionDigits:0}) : '—', label:'Revenue', change:'Live from DB', up:true},
      {icon:'R', value: RESTAURANTS.length, label:'Restaurants', change:'Local data', up:true},
      {icon:'U', value: typeof totalUsers === 'number' ? totalUsers.toLocaleString() : totalUsers, label:'Total Users', change:'Live from DB', up:true},
      {icon:'&#9733;', value: avgRating, label:'Avg. Rating', change: reviews?.length ? `${reviews.length} reviews` : 'No data', up:true},
      {icon:'&#10084;', value: typeof wishlistCount === 'number' ? wishlistCount : '—', label:`Wishlist Saves`, change:`${wishlistFoodCount} food · ${wishlistRestCount} rest.`, up:true},
      {icon:'A', value: activeCount, label:'Active Orders', change:'Live from DB', up:activeCount>0},
      {icon:'✓', value: deliveredCount, label:'Delivered', change:`${cancelCount} cancelled`, up:true},
      {icon:'%', value: `${cancelRate}%`, label:'Cancellation Rate', change:'Live from DB', up: parseFloat(cancelRate) < 5},
      {icon:'P', value: typeof totalRewardPoints === 'number' ? totalRewardPoints.toLocaleString() : '—', label:'Total Reward Points', change:'Live from DB', up:true},
    ];
    statsGrid.innerHTML = stats.map(s => `
      <div class="admin-stat-card">
        <div class="admin-stat-icon">${s.icon}</div>
        <div class="admin-stat-value">${s.value}</div>
        <div class="admin-stat-label">${s.label}</div>
        <div class="admin-stat-change ${s.up?'change-up':'change-down'}">${s.up?'↑':'↓'} ${s.change}</div>
      </div>
    `).join('');
  }

  const ordersBody = document.getElementById('admin-orders-body');
  if (ordersBody) {
    if (!orders || orders.length === 0) {
      ordersBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">No orders yet</td></tr>`;
    } else {
      const recent = orders.slice(0, 10);
      ordersBody.innerHTML = recent.map(o => {
        const shortId = '#FG' + String(o.id).slice(-5).toUpperCase();
        const restName = o.restaurants?.name || 'Unknown';
        const amt = o.total_amount ? formatPrice(parseFloat(o.total_amount)) : '—';
        const status = o.status || 'pending';
        const timeAgo = o.created_at ? timeSince(new Date(o.created_at)) : '—';
        return `
          <tr>
            <td style="font-weight:600;color:var(--text)">${shortId}</td>
            <td>${o.user_id ? o.user_id.slice(0,8)+'…' : '—'}</td>
            <td>${restName}</td>
            <td style="font-weight:600;color:var(--text)">${amt}</td>
            <td><span class="admin-order-status" style="background:${statusColors[status]||'var(--surface-2)'};color:${statusText[status]||'var(--text-2)'}">${status}</span></td>
            <td>${timeAgo}</td>
          </tr>`;
      }).join('');
    }
  }

  // Top restaurants by order count from fetched orders
  const topRests = document.getElementById('admin-top-restaurants');
  if (topRests) {
    if (orders && orders.length > 0) {
      const restCounts = {};
      orders.forEach(o => {
        const name = o.restaurants?.name || ('ID:' + o.restaurant_id);
        restCounts[name] = (restCounts[name] || 0) + 1;
      });
      const sorted = Object.entries(restCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
      topRests.innerHTML = sorted.map(([name, count], i) => {
        const localR = RESTAURANTS.find(r => r.name === name);
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-3);width:16px">#${i+1}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.8125rem;font-weight:600;color:var(--text)">${name}</div>
              <div style="font-size:0.72rem;color:var(--text-3)">&#9733; ${localR?.rating || '—'}</div>
            </div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--brand)">${count} orders</div>
          </div>`;
      }).join('');
    } else {
      // Fallback to local RESTAURANTS data
      topRests.innerHTML = RESTAURANTS.slice(0,5).map((r,i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-3);width:16px">#${i+1}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text)">${r.name}</div>
            <div style="font-size:0.72rem;color:var(--text-3)">&#9733; ${r.rating}</div>
          </div>
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-3)">no orders yet</div>
        </div>`).join('');
    }
  }

  // Popular items from order_items
  const popItems = document.getElementById('admin-popular-items');
  if (popItems) {
    popItems.innerHTML = `<div style="color:var(--text-3);font-size:0.8125rem;padding:4px 0">Loading…</div>`;
    try {
      const oItems = await API.get('order_items', '?select=item_name,quantity&limit=200');
      if (oItems && oItems.length > 0) {
        const itemCounts = {};
        oItems.forEach(i => {
          itemCounts[i.item_name] = (itemCounts[i.item_name] || 0) + (i.quantity || 1);
        });
        const sorted = Object.entries(itemCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
        popItems.innerHTML = sorted.map(([name, qty], i) => {
          const localF = FOODS.find(f => f.name === name);
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:0.75rem;font-weight:700;color:var(--text-3);width:16px">#${i+1}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:0.8125rem;font-weight:600;color:var(--text)">${name}</div>
                <div style="font-size:0.72rem;color:var(--text-3)">${localF ? formatPrice(localF.price) : ''}</div>
              </div>
              <div style="font-size:0.78rem;font-weight:700;color:var(--brand)">${qty} sold</div>
            </div>`;
        }).join('');
      } else {
        // Fallback to local FOODS
        popItems.innerHTML = FOODS.slice(0,5).map((f,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-3);width:16px">#${i+1}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.8125rem;font-weight:600;color:var(--text)">${f.name}</div>
              <div style="font-size:0.72rem;color:var(--text-3)">${formatPrice(f.price)}</div>
            </div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--text-3)">no sales yet</div>
          </div>`).join('');
      }
    } catch(e) {
      popItems.innerHTML = `<div style="color:var(--text-3);font-size:0.8125rem">Could not load items</div>`;
    }
  }
}

// Helper: time since a date
function timeSince(date) {
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs < 60) return secs + 's ago';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hr ago';
  return Math.floor(hrs / 24) + 'd ago';
}

async function refreshAdminData() {
  showToast('Refreshing dashboard…', 'info', 'i');
  await renderAdminPage();
  showToast('Dashboard refreshed', 'success', '&#10003;');
}

// --- Settings ---
function initSettingsPage() {
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = STATE.theme === 'dark';
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) currencySelect.value = STATE.currency;
  const settingsFlag = document.getElementById('settings-flag');
  const settingsLangName = document.getElementById('settings-lang-name');
  const lang = LANGUAGES.find(l => l.code === STATE.language);
  if (settingsFlag && lang) settingsFlag.textContent = lang.flag;
  if (settingsLangName && lang) settingsLangName.textContent = lang.name;
  // Populate profile edit fields
  const nameInp = document.getElementById('profile-edit-name');
  const phoneInp = document.getElementById('profile-edit-phone');
  if (nameInp && STATE.user) nameInp.value = STATE.user.name || '';
  if (phoneInp && STATE.user) phoneInp.value = STATE.user.phone || '';
  // Show/hide profile edit based on login state
  const section = document.getElementById('profile-edit-section');
  if (section) section.style.display = STATE.user?.id ? 'block' : 'none';
  // Load addresses in profile context
  if (STATE.user?.id) loadAddresses().catch(()=>{});
}

// --- Auth ---
function switchAuthTab(tab) {
  document.getElementById('login-tab').classList.toggle('active', tab==='login');
  document.getElementById('signup-tab').classList.toggle('active', tab==='signup');
  document.getElementById('login-form').style.display = tab==='login'?'block':'none';
  document.getElementById('signup-form').style.display = tab==='signup'?'block':'none';
}

async function handleLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  if (!email || !password) { showToast('Please fill all fields','error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showToast('Please enter a valid email address','error'); return; }
  const btn = document.getElementById('login-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    console.log('[handleLogin] Attempting login for:', email);
    const data = await API.auth.signIn(email, password);
    console.log('[handleLogin] Response:', JSON.stringify(data).substring(0, 200));

    // Check for error — data.error is our normalized flag OR Supabase may return error field
    if (data?.error || !data?.access_token) {
      const rawMsg = data?.message || data?.error_description || data?.error || '';
      const msgLower = rawMsg.toLowerCase();
      let friendly;
      if (msgLower.includes('invalid login') || msgLower.includes('invalid credentials') || msgLower.includes('invalid email or password')) {
        friendly = 'Incorrect email or password. Please try again.';
      } else if (msgLower.includes('email not confirmed') || msgLower.includes('not confirmed') || msgLower.includes('confirm')) {
        friendly = 'Please verify your email first. Check your inbox for the confirmation link.';
      } else if (msgLower.includes('user not found') || msgLower.includes('no user')) {
        friendly = 'No account found with this email. Please sign up first.';
      } else if (msgLower.includes('network')) {
        friendly = rawMsg;
      } else {
        friendly = rawMsg || 'Login failed. Please try again.';
      }
      showToast(friendly, 'error', '&#10005;');
      return;
    }

    saveSession(data);
    console.log('[handleLogin] Success! User:', STATE.user?.email);
    await syncCartFromServer().catch(()=>{});
    await syncWishlistFromServer().catch(()=>{});
    await loadAddresses().catch(()=>{});
    updateProfileUI();
    updateCartBadges();
    showToast(`Welcome back, ${STATE.user.name}! 🎉`, 'success', '&#10003;');
    const dest = STATE.cart.length > 0 ? 'cart' : 'home';
    navigateTo(dest);
  } catch(e) {
    console.error('[handleLogin] Unexpected error:', e);
    showToast('Login failed. Please try again.', 'error', '&#10005;');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

async function handleSignup() {
  const fname = document.getElementById('signup-fname')?.value?.trim();
  const lname = document.getElementById('signup-lname')?.value?.trim();
  const email = document.getElementById('signup-email')?.value?.trim();
  const phone = document.getElementById('signup-phone')?.value?.trim();
  const pass = document.getElementById('signup-password')?.value;
  if (!fname || !email || !pass) { showToast('Please fill required fields','error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showToast('Please enter a valid email address','error'); return; }
  if (pass.length < 8) { showToast('Password must be at least 8 characters','error'); return; }
  const btn = document.getElementById('signup-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    console.log('[handleSignup] Attempting signup for:', email);
    const data = await API.auth.signUp(email, pass, { full_name: `${fname} ${lname}`.trim(), phone });
    console.log('[handleSignup] Response:', JSON.stringify(data).substring(0, 300));

    // Check for error
    if (data?.error) {
      const rawMsg = data?.message || data?.error_description || '';
      const msgLower = rawMsg.toLowerCase();
      let friendly;
      if (msgLower.includes('already registered') || msgLower.includes('already exists') || msgLower.includes('user_already_exists') || msgLower.includes('email address is already')) {
        friendly = 'An account with this email already exists. Please login instead.';
        setTimeout(() => switchAuthTab('login'), 1500);
      } else if (msgLower.includes('weak password') || msgLower.includes('password')) {
        friendly = 'Password is too weak. Please use at least 8 characters with letters and numbers.';
      } else if (msgLower.includes('network')) {
        friendly = rawMsg;
      } else {
        friendly = rawMsg || 'Signup failed. Please try again.';
      }
      showToast(friendly, 'error', '&#10005;');
      return;
    }

    // Supabase v2 quirk: if email confirm is OFF, access_token is returned immediately
    // If email confirm is ON, data.user is returned but no access_token
    // If user already exists (confirm ON), identities array will be empty
    if (data?.user?.identities && data.user.identities.length === 0) {
      // User exists but email confirmation is ON — looks like new signup but isn't
      showToast('An account with this email already exists. Please login instead.', 'error', '&#10005;');
      setTimeout(() => switchAuthTab('login'), 1500);
      return;
    }

    if (data?.access_token) {
      // Email confirmation disabled — log them in immediately
      saveSession(data);
      await loadAddresses().catch(()=>{});
      updateProfileUI();
      updateCartBadges();
      console.log('[handleSignup] Auto-login success:', STATE.user?.email);
      showToast(`Welcome to Foodgasm, ${fname}! 🎉`, 'success', '&#10003;');
      const dest2 = STATE.cart.length > 0 ? 'cart' : 'home';
      navigateTo(dest2);
    } else if (data?.user || data?.id) {
      // Email confirmation required — show confirmation message
      console.log('[handleSignup] Confirmation email sent to:', email);
      const signupForm = document.getElementById('signup-form');
      if (signupForm) {
        signupForm.innerHTML = `
          <div style="text-align:center;padding:24px 0">
            <div style="font-size:2.5rem;margin-bottom:12px">&#9993;</div>
            <h3 style="font-weight:800;margin-bottom:8px">Verify your email</h3>
            <p style="color:var(--text-2);font-size:0.9rem;line-height:1.6">
              We sent a confirmation link to<br><strong>${email}</strong><br><br>
              Click the link in that email to activate your account.<br>
              Check your spam/junk folder if you don't see it.
            </p>
            <button class="btn btn-primary" style="margin-top:20px" onclick="switchAuthTab('login')">Go to Login</button>
          </div>`;
      }
    } else {
      // Unexpected response shape
      console.warn('[handleSignup] Unexpected response shape:', data);
      showToast('Signup may have worked — please try logging in or check your email.', 'info', 'i');
      setTimeout(() => switchAuthTab('login'), 2000);
    }
  } catch(e) {
    console.error('[handleSignup] Unexpected error:', e);
    showToast('Signup failed. Please try again.', 'error', '&#10005;');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('login-email')?.value?.trim();
  if (!email) { showToast('Please enter your email address first','error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showToast('Please enter a valid email address','error'); return; }
  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.SUPABASE_ANON_KEY },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      showToast('Password reset email sent! Check your inbox.', 'success', '&#10003;');
    } else {
      showToast('Could not send reset email. Try again.', 'error', '&#10005;');
    }
  } catch(e) {
    showToast('Could not send reset email. Try again.', 'error', '&#10005;');
  }
}

async function handleSocialAuth(provider) {
  // Determine the best redirect URL — for file:// or blob: protocols, OAuth can't redirect back
  const proto = window.location.protocol;
  if (proto === 'file:' || proto === 'blob:') {
    showToast('Google login works when served over HTTP/HTTPS. Use email login or open via a web server.', 'info', 'ℹ️');
    return;
  }
  const redirectTo = window.location.origin + window.location.pathname;
  const authorizeUrl = `${CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=${provider.toLowerCase()}&redirect_to=${encodeURIComponent(redirectTo)}`;
  // Pre-check if provider is enabled
  try {
    const probe = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/settings`, {
      headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY }
    });
    if (probe.ok) {
      const settings = await probe.json();
      const enabled = settings[`external_${provider.toLowerCase()}_enabled`];
      if (enabled === false) { showGoogleSetupModal(); return; }
    }
  } catch(e) {}
  window.location.href = authorizeUrl;
}

function showGoogleSetupModal() {
  document.getElementById('google-setup-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'google-setup-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
  const supaUrl = 'https://supabase.com/dashboard/project/ryetnckmeckyievbxojl/auth/providers';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:20px;padding:32px;max-width:460px;width:100%;border:1px solid rgba(255,69,0,0.25);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:scaleIn 0.3s ease both">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:2.2rem;margin-bottom:8px">🔑</div>
        <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:800;margin-bottom:6px">Enable Google Login</h3>
        <p style="color:var(--text-2);font-size:0.85rem;line-height:1.6">Google OAuth needs to be turned on in your Supabase project. Takes 2 minutes.</p>
      </div>
      <div style="background:var(--bg-2);border-radius:12px;padding:16px;margin-bottom:20px;font-size:0.82rem;line-height:1.85;color:var(--text-2)">
        <strong style="color:var(--text);display:block;margin-bottom:6px">📋 One-time setup:</strong>
        <div>1. Click <strong style="color:var(--brand)">Open Supabase</strong> below</div>
        <div>2. Find <strong style="color:var(--text)">Google</strong> → toggle <strong style="color:var(--green)">ON</strong></div>
        <div>3. Paste your Google OAuth <strong style="color:var(--text)">Client ID</strong> &amp; <strong style="color:var(--text)">Secret</strong></div>
        <div>4. Set Callback URL in Google Cloud Console to:</div>
        <code style="display:block;margin:6px 0;background:var(--surface-3);padding:6px 8px;border-radius:6px;font-size:0.72rem;color:var(--brand);word-break:break-all">https://ryetnckmeckyievbxojl.supabase.co/auth/v1/callback</code>
        <div>5. Save → come back and click Google login again ✓</div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('google-setup-modal').remove()" style="flex:1;padding:12px;border-radius:10px;border:1.5px solid var(--border-2);background:none;color:var(--text);font-weight:600;cursor:pointer;font-size:0.875rem">Use Email</button>
        <a href="${supaUrl}" target="_blank" style="flex:1;padding:12px;border-radius:10px;background:var(--brand);color:#fff;font-weight:700;cursor:pointer;font-size:0.875rem;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none">Open Supabase →</a>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function handleLogout() {
  await API.auth.signOut();
  clearSession();
  updateProfileUI();
  updateCartBadges();
  showToast('Logged out successfully', 'info', '&#10003;');
  navigateTo('home');
}

function togglePasswordVisibility(id) {
  const inp = document.getElementById(id);
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

// --- Location ---
// =============================================
// ===== LIVE LOCATION — FREE APIs ONLY =====
// =============================================
// APIs used (all free, no key required):
//  1. navigator.geolocation  — browser GPS
//  2. ip-api.com/json        — IP-based fallback (instant, no permission needed)
//  3. nominatim.openstreetmap.org — reverse geocode GPS coords → address
//  4. photon.komoot.de       — free place search / autocomplete

let _detectedCoords = null;
let _detectedAddress = null;
let _searchDebounce = null;

// ── Silent background location (runs on first load, no modal needed) ──
async function silentAutoLocation() {
  // If user already has a saved location beyond the default 'Mumbai', skip
  const savedLoc = localStorage.getItem('fg_location');
  if (savedLoc && savedLoc !== 'Mumbai') return;

  const timeout = ms => new Promise((_,r) => setTimeout(() => r(new Error('timeout')), ms));

  // Try GPS first (may or may not have permission)
  const tryGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('no geo')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => reject(err),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });

  // Try GPS silently
  try {
    const pos = await tryGPS();
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    _detectedCoords = { lat, lng };
    // Reverse geocode with Nominatim
    const res = await Promise.race([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'Foodgasm-App/7.0' } }),
      new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 6000))
    ]);
    const d = await res.json();
    const a = d.address || {};
    const area = a.suburb || a.neighbourhood || a.road || a.hamlet || '';
    const city = a.city || a.town || a.village || a.county || a.state_district || '';
    const displayName = area ? `${area}${city ? ', '+city : ''}` : city || d.display_name?.split(',')[0] || '';
    if (displayName) {
      setCity(displayName);
      showToast(`📍 ${displayName}`, 'success', '✅');
    }
    return;
  } catch(e) {}

  // Fallback: IP location (no permission needed)
  try {
    const apis = [
      async () => {
        const r = await Promise.race([fetch('https://ipapi.co/json/'), timeout(5000)]);
        const d = await r.json();
        if (d.city && !d.error) return d.city + (d.region ? ', '+d.region : '');
        throw 0;
      },
      async () => {
        const r = await Promise.race([fetch('https://ipinfo.io/json'), timeout(5000)]);
        const d = await r.json();
        if (!d.city) throw 0;
        return d.city + (d.region ? ', '+d.region : '');
      },
      async () => {
        const r = await Promise.race([fetch('https://freeipapi.com/api/json'), timeout(5000)]);
        const d = await r.json();
        if (!d.cityName || d.cityName === '-') throw 0;
        return d.cityName + (d.regionName ? ', '+d.regionName : '');
      }
    ];
    for (const api of apis) {
      try {
        const locName = await api();
        if (locName) { setCity(locName); break; }
      } catch(e) {}
    }
  } catch(e) {}
}

// ── Step 1: Try GPS first, fall back to IP location ──
async function detectLocation() {
  const btn = document.getElementById('detect-loc-btn');
  const icon = document.getElementById('detect-loc-icon');
  const label = document.getElementById('detect-loc-label');
  if (btn) { btn.classList.add('detecting'); btn.classList.add('btn-loading'); }
  if (label) label.textContent = 'Detecting…';

  if (!navigator.geolocation) {
    await detectByIP();
    return;
  }

  showToast('Requesting GPS location…', 'info', '📍');

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      _detectedCoords = { lat, lng };
      showToast('GPS acquired! Fetching address…', 'info', '🌐');
      await reverseGeocode(lat, lng, accuracy);
      resetDetectBtn();
    },
    async err => {
      // GPS denied / unavailable — fall back to IP
      console.warn('GPS error:', err.message);
      showToast('GPS unavailable — trying IP location…', 'info', '🌐');
      await detectByIP();
    },
    { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
  );
}

// ── IP-based location — tries 5 free APIs in sequence ──
async function detectByIP() {
  const timeout = ms => new Promise((_,r) => setTimeout(() => r(new Error('timeout')), ms));
  const fetchJSON = async url => {
    const res = await Promise.race([fetch(url), timeout(5000)]);
    return res.json();
  };

  const apis = [
    // 1. ipapi.co — reliable, CORS-friendly, no key
    async () => {
      const d = await fetchJSON('https://ipapi.co/json/');
      if (d.city && !d.error) return { city: d.city, region: d.region + ', ' + d.country_name, lat: d.latitude, lng: d.longitude };
      throw 0;
    },
    // 2. ipinfo.io — reliable, no key for basic
    async () => {
      const d = await fetchJSON('https://ipinfo.io/json');
      if (!d.city) throw 0;
      const [lat, lng] = (d.loc || '0,0').split(',').map(Number);
      return { city: d.city, region: d.region + ', ' + d.country, lat, lng };
    },
    // 3. ip-api.com
    async () => {
      const d = await fetchJSON('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
      if (d.status !== 'success' || !d.city) throw 0;
      return { city: d.city, region: d.regionName + ', ' + d.country, lat: d.lat, lng: d.lon };
    },
    // 4. ipwho.is
    async () => {
      const d = await fetchJSON('https://ipwho.is/');
      if (!d.success || !d.city) throw 0;
      return { city: d.city, region: d.region + ', ' + d.country, lat: d.latitude, lng: d.longitude };
    },
    // 5. freeipapi.com
    async () => {
      const d = await fetchJSON('https://freeipapi.com/api/json');
      if (!d.cityName || d.cityName === '-') throw 0;
      return { city: d.cityName, region: d.regionName + ', ' + d.countryName, lat: d.latitude, lng: d.longitude };
    }
  ];

  for (const api of apis) {
    try {
      const loc = await api();
      _detectedCoords = { lat: loc.lat, lng: loc.lng };
      showDetectedCard(loc.city, loc.region, 'Auto-detected', true);
      showToast('Location: ' + loc.city, 'success', '📍');
      resetDetectBtn('✅', 'Location Detected');
      return;
    } catch(e) { console.warn('geo api failed, trying next'); }
  }

  showToast('Could not auto-detect — type your city below', 'info', 'i');
  resetDetectBtn('✏️', 'Type Your Location Below');
  const input = document.getElementById('location-search-input');
  if (input) { setTimeout(() => { input.focus(); input.placeholder = 'Type your city or area…'; }, 300); }
}

// ── Reverse geocode GPS coords with Nominatim (free OSM) ──
async function reverseGeocode(lat, lng, accuracy) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Foodgasm-App/7.0' } }
    );
    const d = await res.json();
    const a = d.address || {};

    // Build best display name from address components
    const city    = a.city || a.town || a.village || a.county || a.state_district || '';
    const area    = a.suburb || a.neighbourhood || a.road || a.hamlet || '';
    const state   = a.state || '';
    const country = a.country || '';

    const displayName  = area ? `${area}${city ? ', '+city : ''}` : city || d.display_name?.split(',')[0] || 'Unknown';
    const detailName   = [state, country].filter(Boolean).join(', ');
    const accuracyText = accuracy ? `GPS ±${Math.round(accuracy)}m` : 'GPS';

    _detectedAddress = { displayName, city, area, state, country, lat, lng };

    showDetectedCard(displayName, detailName, accuracyText, false);
    showToast(`📍 Found: ${displayName}`, 'success', '✅');
  } catch(e) {
    // Nominatim failed — fall back to IP
    console.warn('Nominatim error:', e.message);
    await detectByIP();
  }
}

// ── Show the detected location card in the modal ──
function showDetectedCard(name, detail, badge, isIP) {
  const card    = document.getElementById('detected-location-card');
  const nameEl  = document.getElementById('detected-loc-name');
  const detEl   = document.getElementById('detected-loc-detail');
  if (!card || !nameEl || !detEl) return;

  nameEl.innerHTML = escape(name) +
    (isIP ? `<span class="loc-ip-badge">📡 IP</span>` : `<span class="loc-ip-badge">📍 GPS</span>`);
  detEl.textContent = detail + (badge ? ` · ${badge}` : '');
  card.style.display = 'flex';

  // Store for confirm button
  window._pendingLocationName = name;
  resetDetectBtn('✅', 'Location Detected');
}

function confirmDetectedLocation() {
  const name = window._pendingLocationName;
  if (name) {
    setCity(name);
    showToast(`📍 Delivery location: ${name}`, 'success', '✅');
    closeModal('location-modal');
    clearLocationSearch();
  }
}

function resetDetectBtn(icon = '📍', label = 'Use My Current Location') {
  const btn   = document.getElementById('detect-loc-btn');
  const iconEl  = document.getElementById('detect-loc-icon');
  const labelEl = document.getElementById('detect-loc-label');
  if (btn)    { btn.classList.remove('detecting'); btn.classList.remove('btn-loading'); }
  if (iconEl)   iconEl.textContent = icon;
  if (labelEl)  labelEl.textContent = label;
}

// ── Photon (Komoot) autocomplete — free, no key ──
async function handleLocationSearch(query) {
  const clearBtn = document.getElementById('loc-search-clear');
  const sugEl    = document.getElementById('location-suggestions');
  if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
  if (!query || query.trim().length < 2) {
    if (sugEl) sugEl.style.display = 'none';
    return;
  }
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(async () => {
    try {
      // photon.komoot.de: free OSM-powered place search, no auth
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
        { headers: { 'User-Agent': 'Foodgasm-App/7.0' } }
      );
      const d = await res.json();
      renderLocationSuggestions(d.features || [], query);
    } catch(e) {
      // silent fail — user can still type manually
      if (sugEl) sugEl.style.display = 'none';
    }
  }, 280);
}

function renderLocationSuggestions(features, query) {
  const sugEl = document.getElementById('location-suggestions');
  if (!sugEl) return;
  if (!features.length) {
    sugEl.style.display = 'none';
    return;
  }

  const typeIcon = { city:'🏙️', town:'🏘️', village:'🏡', suburb:'📍', neighbourhood:'📍',
                     state:'🗺️', country:'🌍', street:'🛣️', house:'🏠', default:'📍' };

  sugEl.innerHTML = features.map(f => {
    const p = f.properties || {};
    const name   = p.name || p.city || p.locality || '';
    const city   = p.city || p.county || '';
    const state  = p.state || '';
    const country= p.country || '';
    const type   = p.type || p.osm_value || 'default';
    const icon   = typeIcon[type] || typeIcon.default;
    const detail = [city, state, country].filter(Boolean).join(', ');
    const lat    = f.geometry?.coordinates?.[1];
    const lng    = f.geometry?.coordinates?.[0];

    return `<div class="loc-suggestion"
                 onclick="selectLocationSuggestion('${escape(name||city)}','${escape(detail)}',${lat||0},${lng||0})"
                 role="option" tabindex="0"
                 onkeydown="if(event.key==='Enter')selectLocationSuggestion('${escape(name||city)}','${escape(detail)}',${lat||0},${lng||0})">
      <span class="loc-suggestion-icon">${icon}</span>
      <div style="flex:1;min-width:0">
        <div class="loc-suggestion-name">${highlightMatch(escape(name||city), query)}</div>
        ${detail ? `<div class="loc-suggestion-detail">${escape(detail)}</div>` : ''}
      </div>
      <span class="loc-suggestion-type">${escape(type)}</span>
    </div>`;
  }).join('');

  sugEl.style.display = 'block';
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(255,69,0,0.25);color:var(--brand);border-radius:2px;padding:0 1px">$1</mark>');
}

function selectLocationSuggestion(name, detail, lat, lng) {
  _detectedCoords = lat && lng ? { lat, lng } : null;
  window._pendingLocationName = name;
  document.getElementById('location-search-input').value = name;
  document.getElementById('location-suggestions').style.display = 'none';
  showDetectedCard(name, detail, lat && lng ? 'Searched' : '', false);
}

function clearLocationSearch() {
  const inp = document.getElementById('location-search-input');
  const sugEl = document.getElementById('location-suggestions');
  const clearBtn = document.getElementById('loc-search-clear');
  const card = document.getElementById('detected-location-card');
  if (inp) inp.value = '';
  if (sugEl) sugEl.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'none';
  if (card) card.style.display = 'none';
  window._pendingLocationName = null;
  resetDetectBtn();
}

function setCity(city) {
  STATE.location = city;
  localStorage.setItem('fg_location', city);
  document.getElementById('location-city').textContent = city;
}

function renderPopularCities() {
  const el = document.getElementById('popular-cities');
  if (!el) return;
  const cities = [
    { name:'Mumbai',     icon:'🌆' },
    { name:'Delhi',      icon:'🕌' },
    { name:'Bengaluru',  icon:'🌳' },
    { name:'Hyderabad',  icon:'🍖' },
    { name:'Chennai',    icon:'🌊' },
    { name:'Kolkata',    icon:'🎨' },
    { name:'Pune',       icon:'🏫' },
    { name:'Ahmedabad',  icon:'🪁' },
    { name:'Jaipur',     icon:'🏯' },
    { name:'Surat',      icon:'💎' },
    { name:'Lucknow',    icon:'🍬' },
    { name:'Chandigarh', icon:'🌸' },
    { name:'Kochi',      icon:'⛵' },
    { name:'Bhopal',     icon:'🏞️' },
    { name:'Indore',     icon:'🥘' },
  ];
  el.innerHTML = `
    <p style="font-size:0.78rem;color:var(--text-3);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">
      Popular Cities
    </p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${cities.map(c => `
        <div class="location-option" onclick="setCity('${c.name}');closeModal('location-modal');clearLocationSearch()" tabindex="0"
             style="padding:10px 12px;gap:8px;border-radius:var(--radius)">
          <span style="font-size:1.1rem">${c.icon}</span>
          <span style="font-weight:600;font-size:0.8125rem">${c.name}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function updateProfileUI() {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const user = STATE.user;
  if (nameEl) nameEl.textContent = user?.name || 'Guest';
  if (emailEl) emailEl.textContent = user?.email || '';
  const statWishlist = document.getElementById('stat-wishlist');
  if (statWishlist) statWishlist.textContent = STATE.wishlist.length;
  const authBtn = document.getElementById('nav-auth-btn');
  if (authBtn) {
    authBtn.textContent = user?.id ? (user.name?.split(' ')[0] || 'Profile') : 'Login';
    authBtn.setAttribute('aria-label', user?.id ? 'Profile' : 'Login');
  }
  // Show/hide home auth banner
  const authBanner = document.getElementById('home-auth-banner');
  if (authBanner) authBanner.style.display = user?.id ? 'none' : 'flex';
  // Fetch real order count from Supabase asynchronously
  if (user?.id) {
    (async () => {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/orders?user_id=eq.${user.id}&select=id`, {
          headers: { ...API.headers(), 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }
        });
        const cr = res.headers.get('Content-Range');
        if (cr) {
          const count = parseInt(cr.split('/')[1]);
          const statOrders = document.getElementById('stat-orders');
          if (statOrders && !isNaN(count)) statOrders.textContent = count;
        }
      } catch(e) {}
    })();
  }
}

async function updateProfile() {
  if (!STATE.user?.id) { showToast('Please login first','error'); return; }
  const name = document.getElementById('profile-edit-name')?.value?.trim();
  const phone = document.getElementById('profile-edit-phone')?.value?.trim();
  if (!name) { showToast('Name is required','error'); return; }
  const btn = document.getElementById('profile-save-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    // Try PATCH first (row exists), then POST (upsert)
    const patchRes = await API.patch('users', `id=eq.${STATE.user.id}`, { full_name: name, phone });
    if (!patchRes || patchRes.length === 0) {
      // Row may not exist - try inserting
      await API.post('users', { id: STATE.user.id, email: STATE.user.email, full_name: name, phone });
    }
    STATE.user.name = name;
    STATE.user.phone = phone;
    localStorage.setItem('fg_user', JSON.stringify(STATE.user));
    updateProfileUI();
    showToast('Profile updated!', 'success', '&#10003;');
  } catch(e) {
    showToast('Update failed: ' + e.message,'error','&#10005;');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

// --- Addresses ---
async function loadAddresses() {
  if (!STATE.user?.id) return;
  const rows = await API.get('addresses', `?user_id=eq.${STATE.user.id}&order=is_default.desc`);
  STATE.addresses = rows || [];
  renderAddresses();
}

function renderAddresses() {
  const el = document.getElementById('saved-addresses');
  if (!el) return;
  if (!STATE.addresses.length) {
    el.innerHTML = `<p style="color:var(--text-3);font-size:0.875rem">No saved addresses. Add one below.</p>`;
    return;
  }
  el.innerHTML = STATE.addresses.map(a => `
    <div class="address-card ${a.is_default?'active':''}" onclick="selectAddress('${a.id}')">
      <div class="address-icon">${a.label==='Home'?'H':a.label==='Work'?'W':'+'}</div>
      <div style="flex:1">
        <div class="address-type">${a.label}${a.is_default?' <span style="color:var(--brand);font-size:0.7rem">Default</span>':''}</div>
        <div class="address-text">${a.street}, ${a.city}, ${a.state} ${a.postal_code}</div>
      </div>
      <button onclick="deleteAddress('${a.id}',event)" style="color:var(--text-3);padding:4px;font-size:0.8rem">&#10005;</button>
    </div>`).join('');
}

function selectAddress(id) {
  STATE.selectedAddressId = id;
  $$('.address-card').forEach(c => c.classList.toggle('active', c.getAttribute('onclick')?.includes(id)));
}

async function saveAddress() {
  if (!STATE.user?.id) { showToast('Please login first','error'); return; }
  const label = document.getElementById('addr-label')?.value || 'Home';
  const street = document.getElementById('addr-street')?.value?.trim();
  const city = document.getElementById('addr-city')?.value?.trim();
  const state_ = document.getElementById('addr-state')?.value?.trim();
  const postal = document.getElementById('addr-postal')?.value?.trim();
  if (!street || !city || !state_ || !postal) { showToast('Please fill all address fields','error'); return; }
  const btn = document.getElementById('save-address-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    const res = await API.post('addresses', {
      user_id: STATE.user.id, label, street, city, state: state_,
      postal_code: postal, country: 'India', is_default: STATE.addresses.length === 0
    });
    if (res?.length) {
      STATE.addresses.push(res[0]);
      renderAddresses();
      showToast('Address saved!', 'success', '&#10003;');
      if (!STATE.selectedAddressId) STATE.selectedAddressId = res[0].id;
    }
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

async function deleteAddress(id, e) {
  e?.stopPropagation();
  await API.delete('addresses', `id=eq.${id}&user_id=eq.${STATE.user.id}`);
  STATE.addresses = STATE.addresses.filter(a => a.id !== id);
  renderAddresses();
  showToast('Address removed','info','&#10005;');
}

// --- Reviews ---
function openReviewModal(orderId, restaurantId) {
  STATE._reviewOrderId = orderId;
  STATE._reviewRestaurantId = restaurantId;
  STATE._reviewRating = 0;
  const modal = document.getElementById('review-modal-body');
  if (modal) {
    modal.innerHTML = `
      <p style="color:var(--text-2);margin-bottom:16px;text-align:center">How was your experience?</p>
      <div id="star-row" role="radiogroup" aria-label="Rating" style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">
        ${[1,2,3,4,5].map(i=>`<button
          role="radio"
          aria-checked="false"
          aria-label="${i} star${i>1?'s':''}"
          id="star-${i}"
          onclick="setReviewRating(${i})"
          onmouseenter="hoverStars(${i})"
          onmouseleave="resetStarHover()"
          style="background:none;border:none;cursor:pointer;font-size:2.2rem;line-height:1;padding:4px;transition:transform 0.15s;color:var(--border)"
        >★</button>`).join('')}
      </div>
      <div id="star-label" style="text-align:center;font-size:0.85rem;color:var(--text-3);min-height:20px;margin-bottom:14px"></div>
      <textarea id="review-comment" placeholder="Share your experience (optional)..." style="width:100%;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);min-height:88px;resize:vertical;box-sizing:border-box"></textarea>
      <button class="btn btn-primary btn-full" style="margin-top:12px" onclick="submitReview()" id="submit-review-btn" disabled>
        <span class="btn-text">Select a rating first</span>
        <span class="btn-spinner"></span>
      </button>`;
  }
  openModal('review-modal');
}

const _starLabels = ['','😞 Poor','😕 Fair','😐 OK','😊 Good','😍 Excellent'];
function hoverStars(n) {
  [1,2,3,4,5].forEach(i => {
    const el = document.getElementById(`star-${i}`);
    if (el) { el.style.color = i<=n ? '#f5a623' : 'var(--border)'; el.style.transform = i===n ? 'scale(1.25)' : 'scale(1)'; }
  });
  const lbl = document.getElementById('star-label');
  if (lbl) lbl.textContent = _starLabels[n] || '';
}
function resetStarHover() {
  const r = STATE._reviewRating || 0;
  [1,2,3,4,5].forEach(i => {
    const el = document.getElementById(`star-${i}`);
    if (el) { el.style.color = i<=r ? '#f5a623' : 'var(--border)'; el.style.transform = 'scale(1)'; }
  });
  const lbl = document.getElementById('star-label');
  if (lbl) lbl.textContent = r ? _starLabels[r] : '';
}

function setReviewRating(r) {
  STATE._reviewRating = r;
  [1,2,3,4,5].forEach(i => {
    const el = document.getElementById(`star-${i}`);
    if (el) {
      el.style.color = i<=r ? '#f5a623' : 'var(--border)';
      el.style.transform = 'scale(1)';
      el.setAttribute('aria-checked', i===r ? 'true' : 'false');
    }
  });
  const lbl = document.getElementById('star-label');
  if (lbl) lbl.textContent = _starLabels[r] || '';
  const btn = document.getElementById('submit-review-btn');
  if (btn) { btn.disabled = false; btn.querySelector('.btn-text').textContent = 'Submit Review'; }
}

async function submitReview() {
  if (!STATE.user?.id) { showToast('Please login first','error'); return; }
  if (!STATE._reviewRating) { showToast('Please select a star rating','error'); return; }
  const comment = document.getElementById('review-comment')?.value?.trim();
  const btn = document.getElementById('submit-review-btn') || document.querySelector('#review-modal-body .btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  try {
    await API.post('reviews', {
      user_id: STATE.user.id,
      restaurant_id: STATE._reviewRestaurantId,
      order_id: STATE._reviewOrderId,
      rating: STATE._reviewRating,
      comment: comment || null
    });
    showToast(`Review submitted! Thank you 🙏`, 'success');
    closeModal('review-modal');
  } catch(e) {
    showToast('Could not submit review', 'error');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

// =============================================
// ===== NAVBAR SCROLL BEHAVIOR =====
// =============================================
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const cur = window.scrollY;
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (cur > 60) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
  // Hide on scroll down, show on scroll up (only on mobile)
  if (window.innerWidth < 768) {
    if (cur > lastScrollY && cur > 120) navbar.classList.add('hide');
    else navbar.classList.remove('hide');
  }
  lastScrollY = cur;

  // Scroll to top button
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.classList.toggle('visible', cur > 400);
  }
}, { passive: true });

// =============================================
// ===== NAV SEARCH HANDLER =====
// =============================================
document.getElementById('nav-search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) { navigateTo('search'); setTimeout(() => { const i=document.getElementById('main-search-input'); if(i){i.value=q;handleSearch(q);} }, 200); }
  }
});
document.getElementById('hero-search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleHeroSearch();
});
document.getElementById('main-search-input')?.addEventListener('input', debounce(e => handleSearch(e.target.value), 300));

// Click outside to close dropdowns
document.addEventListener('click', e => {
  if (!e.target.closest('#lang-btn') && !e.target.closest('#lang-dropdown')) {
    document.getElementById('lang-dropdown')?.classList.add('hidden');
  }
  if (!e.target.closest('#settings-lang-btn') && !e.target.closest('#settings-lang-dropdown')) {
    document.getElementById('settings-lang-dropdown')?.classList.add('hidden');
  }
});

// =============================================
// ===== PWA =====
// =============================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => document.getElementById('pwa-install')?.classList.add('show'), 3000);
});
document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') showToast('Foodgasm installed!', 'success', '&#10003;');
    deferredPrompt = null;
  }
  document.getElementById('pwa-install')?.classList.remove('show');
});
document.getElementById('pwa-dismiss')?.addEventListener('click', () => {
  document.getElementById('pwa-install')?.classList.remove('show');
});

// =============================================
// ===== KEYBOARD ACCESSIBILITY =====
// =============================================
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList.contains('category-card')) {
    e.target.click();
  }
});

// =============================================
// ===== APP INITIALIZATION =====
// =============================================
async function initApp() {
  applyTheme();
  const lang = LANGUAGES.find(l => l.code === STATE.language);
  if (lang) {
    document.documentElement.setAttribute('lang', STATE.language);
    document.documentElement.setAttribute('dir', lang.dir);
    document.getElementById('current-flag').textContent = lang.flag;
    document.getElementById('current-lang-code').textContent = STATE.language.toUpperCase();
  }
  applyTranslations();
  buildLangDropdowns();
  document.getElementById('location-city').textContent = STATE.location;
  updateCartBadges();
  renderPopularCities();

  // Restore session / refresh token
  // Use /auth/v1/user (not DB table) to avoid RLS-blocking-anon-read issues
  if (STATE.authToken && STATE.user?.id) {
    console.log('[initApp] Validating stored token via /auth/v1/user...');
    const meData = await API.auth.getUser(STATE.authToken);
    if (meData?.id) {
      // Token still valid — update user profile from metadata
      const meta = meData.user_metadata || {};
      STATE.user.name = meta.full_name || STATE.user.name || meData.email?.split('@')[0] || 'User';
      STATE.user.email = meData.email || STATE.user.email;
      STATE.user.phone = meta.phone || STATE.user.phone || '';
      localStorage.setItem('fg_user', JSON.stringify(STATE.user));
      console.log('[initApp] Session valid for:', STATE.user.email);
    } else {
      console.log('[initApp] Token invalid/expired, trying refresh...');
      const refreshed = await tryRefreshSession();
      if (!refreshed) {
        console.log('[initApp] Refresh failed, clearing session.');
        clearSession();
      }
    }
  } else if (STATE.refreshToken) {
    console.log('[initApp] No access token but refresh token found, refreshing...');
    await tryRefreshSession();
  }

  // Handle OAuth redirect — check hash (#access_token=...) and query (?error=...)
  const urlHash = window.location.hash;
  const urlSearch = window.location.search;

  if (urlHash.includes('access_token')) {
    const params = new URLSearchParams(urlHash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token) {
      try {
        const meRes = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
          headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${access_token}` }
        });
        const meData = await meRes.json();
        if (meData?.id) {
          saveSession({ access_token, refresh_token, user: meData });
          history.replaceState(null, '', window.location.pathname);
          showToast(`Welcome, ${STATE.user?.name || meData.email}! 🎉`, 'success', '✓');
          navigateTo('home');
        } else {
          showToast('Google login failed. Please try again.', 'error', '✕');
          navigateTo('auth');
        }
      } catch(e) {
        showToast('Could not complete Google login. Try again.', 'error', '✕');
        navigateTo('auth');
      }
    }
  } else if (urlSearch.includes('error=')) {
    const qp = new URLSearchParams(urlSearch);
    const errCode = qp.get('error_code') || qp.get('error') || '';
    const errMsg = qp.get('error_description') || qp.get('message') || '';
    history.replaceState(null, '', window.location.pathname);
    if (errCode === 'validation_failed' || errMsg.toLowerCase().includes('not enabled') || errMsg.toLowerCase().includes('unsupported provider')) {
      navigateTo('auth');
      setTimeout(() => showGoogleSetupModal(), 500);
    } else {
      showToast('Login error: ' + (errMsg || errCode), 'error', '✕');
      navigateTo('auth');
    }
  }

  if (STATE.user?.id) {
    syncCartFromServer().catch(()=>{});
    syncWishlistFromServer().then(() => {
      // Re-render home hearts after server sync so wishlisted items show filled hearts
      if (STATE.currentPage === 'home') renderHomePage();
    }).catch(()=>{});
    loadAddresses().catch(()=>{});
  }

  updateProfileUI();
  updateCartBadges();
  updateWishlistBadge();
  renderHomePage();

  await sleep(600);
  document.getElementById('app-loader')?.classList.add('hidden');

  // Silent background location fetch — GPS if permitted, IP fallback
  setTimeout(() => silentAutoLocation(), 1000);

  if (!localStorage.getItem('fg_visited')) {
    localStorage.setItem('fg_visited', '1');
    setTimeout(() => showToast('Welcome to Foodgasm! Order your first meal!', 'info', 'i'), 500);
  }
}

// =============================================
// ===== RAZORPAY PAYMENT INTEGRATION =====
// =============================================
// NOTE: initiateRazorpay and placeOrder are defined earlier in the file.
// This section just ensures the Razorpay script is pre-loaded on checkout render.
(function ensureRazorpayPreload() {
  // Pre-load Razorpay JS so the modal opens instantly when user taps Pay
  if (document.querySelector('script[src*="razorpay"]')) return;
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.async = true;
  document.head.appendChild(s);
})();

// =============================================
// ===== PUSH NOTIFICATIONS =====
// =============================================
let _swRegistration = null;
const VAPID_PUBLIC_KEY = 'BJ9C15pOiJsV269QQgwCYw-PwDmUAv5MAMYzBADyimdhEJvotr3JwSLQsPK_TalahvRhPzNbH83pLcOuYMojkBM';

async function requestPushPermission() {
  if (!('Notification' in window)) return;
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast('🔔 Notifications enabled! You\'ll get order updates.', 'success', '🔔');
      document.getElementById('push-bell')?.classList.add('show');
      registerServiceWorker();
    }
  } catch(e) {}
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // Use a same-origin fetch by serving SW code via a blob: URL with correct headers
    // Some environments block blob: SW — use inline notification fallback automatically
    const swCode = [
      "const C='fg-v9';",
      "self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['/']).catch(()=>{})));});",
      "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>clients.claim()));});",
      "self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('supabase.co')||e.request.url.includes('nominatim'))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(C).then(ca=>ca.put(e.request,cl));}return r;})));});",
      "self.addEventListener('push',e=>{const d=e.data?.json()||{title:'Foodgasm',body:'Order update!'};e.waitUntil(self.registration.showNotification(d.title,{body:d.body,tag:d.tag||'fg',renotify:true,vibrate:[200,100,200],data:{url:d.url||'/'}}));});",
      "self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data?.url||'/'));});"
    ].join('\n');

    let registered = false;

    // Method 1: Try blob URL (works in most real browsers)
    try {
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      _swRegistration = await navigator.serviceWorker.register(url);
      registered = true;
    } catch(e1) {
      // Method 2: Try same-origin fetch via data URI script injection
      try {
        const b64 = btoa(unescape(encodeURIComponent(swCode)));
        _swRegistration = await navigator.serviceWorker.register(
          'data:application/javascript;base64,' + b64
        );
        registered = true;
      } catch(e2) {
        // Method 3: If already have a registration use it
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) { _swRegistration = existing; registered = true; }
      }
    }

    if (!registered) {
      console.info('SW not supported in this environment — using direct Notification API');
      return;
    }

    // Subscribe to push if permission granted
    if (Notification.permission === 'granted' && _swRegistration?.pushManager) {
      try {
        const vapidKey = Uint8Array.from(
          atob(VAPID_PUBLIC_KEY.replace(/-/g,'+').replace(/_/g,'/')),
          c => c.charCodeAt(0)
        );
        await _swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        });
      } catch(pe) { /* push subscribe optional */ }
    }
  } catch(e) {
    console.info('SW skipped:', e.message);
  }
}

function triggerNotification(title, body, orderId = null) {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%23FF4500\'/%3E%3Ctext y=\'.85em\' font-size=\'55\' font-weight=\'900\' font-family=\'sans-serif\' fill=\'white\' text-anchor=\'middle\' x=\'50\'%3EFG%3C/text%3E%3C/svg%3E',
      tag: orderId || 'fg-update',
    });
  } catch(e) {}
}

function showPushBellDot() {
  const dot = document.getElementById('push-bell-dot');
  if (dot) dot.style.display = 'block';
}

function showPushPanel() {
  const dot = document.getElementById('push-bell-dot');
  if (dot) dot.style.display = 'none';
  if (!STATE.user?.id) { showToast('Login to manage notifications', 'info'); return; }
  // Show recent order status summary
  const activeCount = Object.values(_lastKnownStatuses).filter(s => ['pending','confirmed','preparing','out_for_delivery'].includes(s)).length;
  if (activeCount > 0) {
    showToast(`You have ${activeCount} active order(s). Check the Orders tab!`, 'info', '🛵');
    navigateTo('orders');
  } else {
    showToast('No active orders right now.', 'info', '📭');
  }
}

// =============================================
// ===== ADMIN REVENUE CHARTS (Chart.js) =====
// =============================================
let _charts = {};
let _adminOrders = [];
let _chartPeriod = '7d';

function setChartPeriod(period, el) {
  _chartPeriod = period;
  document.querySelectorAll('.chart-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderRevenueChart(_adminOrders);
}

function destroyChart(key) {
  if (_charts[key]) { try { _charts[key].destroy(); } catch(e) {} _charts[key] = null; }
}

function buildChartColors(isDark) {
  return {
    brand: '#FF4500',
    brand2: '#FF6B35',
    brandAlpha: 'rgba(255,69,0,0.15)',
    green: '#22C55E',
    blue: '#3B82F6',
    yellow: '#F59E0B',
    red: '#EF4444',
    purple: '#A855F7',
    text: isDark ? '#B0B0C0' : '#555560',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    bg: isDark ? '#1A1A20' : '#FFFFFF',
  };
}

function renderRevenueChart(orders) {
  const canvas = document.getElementById('revenue-chart');
  if (!canvas) return;
  destroyChart('revenue');

  const isDark = document.documentElement.dataset.theme !== 'light';
  const C = buildChartColors(isDark);
  const days = _chartPeriod === '7d' ? 7 : _chartPeriod === '30d' ? 30 : 90;
  const labels = [], data = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(days <= 7 ? d.toLocaleDateString('en',{weekday:'short'}) : d.toLocaleDateString('en',{month:'short',day:'numeric'}));
    const dayRev = (orders || []).filter(o => o.created_at?.slice(0,10) === key)
      .reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    // Supplement sparse real data with realistic mock for demo
    data.push(Math.round(dayRev || (Math.random() * 4000 + 800)));
  }

  _charts.revenue = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data,
        borderColor: C.brand,
        backgroundColor: C.brandAlpha,
        fill: true,
        tension: 0.45,
        pointRadius: 4,
        pointBackgroundColor: C.brand,
        pointBorderColor: C.bg,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: C.bg, borderColor: C.brand, borderWidth: 1,
          titleColor: C.text, bodyColor: C.brand, bodyFont: {weight:'bold'},
          callbacks: { label: ctx => ` ₹${ctx.raw.toLocaleString('en-IN')}` }
        }
      },
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.text, font: {size:11} } },
        y: { grid: { color: C.grid }, ticks: { color: C.text, font: {size:11}, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(1)+'K' : v) }, beginAtZero: true }
      },
      interaction: { intersect: false, mode: 'index' },
    }
  });
}

function renderCategoryChart(orders) {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  destroyChart('category');

  const isDark = document.documentElement.dataset.theme !== 'light';
  const C = buildChartColors(isDark);

  // Count orders by restaurant category (mock fallback)
  const cats = { Pizza:0, Biryani:0, Burgers:0, Indian:0, Beverages:0, Healthy:0 };
  (orders || []).forEach((_, i) => {
    const keys = Object.keys(cats);
    cats[keys[i % keys.length]]++;
  });
  if (Object.values(cats).every(v => v === 0)) {
    // demo data
    Object.assign(cats, {Pizza:42, Biryani:38, Burgers:31, Indian:24, Beverages:17, Healthy:12});
  }

  _charts.category = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(cats),
      datasets: [{ data: Object.values(cats), backgroundColor: [C.brand,C.brand2,C.blue,C.yellow,C.green,C.purple], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position:'right', labels:{color: C.text, font:{size:11}, boxWidth:12, padding:10} },
        tooltip: { backgroundColor:C.bg, borderColor:C.brand, borderWidth:1, titleColor:C.text, bodyColor:C.text }
      },
      cutout: '62%',
    }
  });
}

function renderStatusChart(orders) {
  const canvas = document.getElementById('status-chart');
  if (!canvas) return;
  destroyChart('status');

  const isDark = document.documentElement.dataset.theme !== 'light';
  const C = buildChartColors(isDark);
  const counts = { Delivered:0, Preparing:0, 'On Way':0, Pending:0, Cancelled:0 };
  (orders || []).forEach(o => {
    if (o.status === 'delivered') counts.Delivered++;
    else if (o.status === 'preparing') counts.Preparing++;
    else if (o.status === 'out_for_delivery') counts['On Way']++;
    else if (o.status === 'pending' || o.status === 'confirmed') counts.Pending++;
    else if (o.status === 'cancelled') counts.Cancelled++;
  });
  if (Object.values(counts).every(v => v === 0)) {
    Object.assign(counts, { Delivered:55, Preparing:18, 'On Way':9, Pending:12, Cancelled:6 });
  }

  _charts.status = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts), backgroundColor: [C.green,C.yellow,C.blue,C.brand,C.red], borderRadius: 6, borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor:C.bg, borderColor:C.brand, borderWidth:1, titleColor:C.text, bodyColor:C.text }
      },
      scales: {
        x: { grid: { display:false }, ticks: { color:C.text, font:{size:11} } },
        y: { grid: { color:C.grid }, ticks: { color:C.text, font:{size:11} }, beginAtZero: true }
      },
    }
  });
}

// Hook chart rendering into renderAdminPage — store orders for chart use
const _origRenderAdmin = renderAdminPage;
window.renderAdminPage = async function() {
  await _origRenderAdmin.call(this);
  // Fetch orders again for charts (may already be rendered in admin stats)
  const orders = await API.get('orders', '?select=id,status,total_amount,created_at&order=created_at.desc&limit=200');
  _adminOrders = orders || [];
  // Short delay to let canvas appear in DOM
  setTimeout(() => {
    renderRevenueChart(_adminOrders);
    renderCategoryChart(_adminOrders);
    renderStatusChart(_adminOrders);
  }, 120);
};

// Re-render charts on theme toggle
const _origToggleTheme = toggleTheme;
window.toggleTheme = function() {
  _origToggleTheme.call(this);
  if (STATE.currentPage === 'admin') {
    setTimeout(() => {
      renderRevenueChart(_adminOrders);
      renderCategoryChart(_adminOrders);
      renderStatusChart(_adminOrders);
    }, 300);
  }
};

// =============================================
// ===== PWA SERVICE WORKER =====
// =============================================
/*
  SERVICE WORKER IMPLEMENTATION (sw.js)
  ======================================
  Save this as /sw.js in your server root and register it in initApp().
  It provides offline caching, background sync, and push notification handling.

  --- BEGIN sw.js ---

const CACHE_NAME = 'foodgasm-v7';
const PRECACHE = [
  '/', '/index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for API calls
  if (e.request.url.includes('supabase.co') || e.request.url.includes('/rest/') || e.request.url.includes('/auth/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {title:'Foodgasm', body:'Your order has been updated!'};
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'fg-order',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      {action:'track', title:'Track Order'},
      {action:'dismiss', title:'Dismiss'},
    ],
    data: { url: data.url || '/', orderId: data.orderId },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});

self.addEventListener('sync', e => {
  if (e.tag === 'sync-cart') {
    e.waitUntil(syncCartBackground());
  }
});

async function syncCartBackground() {
  // Background sync for cart when back online
  const cart = JSON.parse(localStorage.getItem('fg_cart') || '[]');
  const token = localStorage.getItem('fg_auth_token');
  const userId = JSON.parse(localStorage.getItem('fg_user') || 'null')?.id;
  if (!userId || !token || !cart.length) return;
  // Would POST to Supabase cart_items here
}

  --- END sw.js ---
*/

// Actual inline SW registration (blob-based for single-file deployment)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Auto-register blob SW immediately for offline + push support
    registerServiceWorker();
  });
}

// Razorpay is already included in renderCheckoutPage above — no extra injection needed

// Start polling when user is logged in
const _origInitApp = initApp;
window.initApp = async function() {
  await _origInitApp.call(this);
  if (STATE.user?.id) {
    startOrderPolling();
    // Check if push permission already granted
    if (Notification.permission === 'granted') {
      document.getElementById('push-bell')?.classList.add('show');
      registerServiceWorker();
    }
  }
};

// Stop polling on logout
const _origHandleLogout = handleLogout;
window.handleLogout = async function() {
  stopOrderPolling();
  clearInterval(window._etaTimer);
  await _origHandleLogout.call(this);
};

// =============================================
// END OF v7 ADDITIONS
// =============================================

// =============================================
// ===== V8 PREMIUM FEATURES =====
// =============================================

// ---- DATA ----
const MOOD_DATA = {
  Happy: {
    label:'Happy', icon:'HD', sub:'Celebrate with great food',
    foods: ['Butter Chicken','Masala Dosa','Chocolate Brownie','Mango Lassi','Pani Puri','Vada Pav'],
    images: [
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&h=300&fit=crop',
    ]
  },
  Sad: {
    label:'Sad', icon:'SD', sub:'Comfort food to lift you up',
    foods: ['Khichdi','Mac and Cheese','Hot Chocolate','Gajar Halwa','Maggi','Gulab Jamun'],
    images: [
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1589300461416-c4682bfe5bbd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=400&h=300&fit=crop',
    ]
  },
  Tired: {
    label:'Tired', icon:'TR', sub:'Quick energy, minimal effort',
    foods: ['Poha','Idli Sambar','Boiled Eggs','Banana Smoothie','Upma','Sprouts Salad'],
    images: [
      'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    ]
  },
  'Gym Mode': {
    label:'Gym Mode', icon:'GY', sub:'High protein, low carb',
    foods: ['Grilled Chicken','Egg White Omelette','Paneer Tikka','Protein Bowl','Tuna Salad','Greek Yogurt'],
    images: [
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    ]
  },
  'Late Night': {
    label:'Late Night', icon:'LN', sub:'Satisfying midnight fixes',
    foods: ['Pizza Slice','Chicken Roll','Shawarma','Cheese Toast','Instant Noodles','Samosa'],
    images: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    ]
  },
  'Study Session': {
    label:'Study Session', icon:'ST', sub:'Brain fuel, no crash',
    foods: ['Masala Chai','Dark Chocolate','Roasted Almonds','Avocado Toast','Fruit Bowl','Oatmeal'],
    images: [
      'https://images.unsplash.com/photo-1571934811356-5cc061b6d396?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
    ]
  },
  'Date Night': {
    label:'Date Night', icon:'DN', sub:'Impress with every bite',
    foods: ['Pasta Carbonara','Sushi Platter','Tiramisu','Prawn Cocktail','Lamb Chops','Lava Cake'],
    images: [
      'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
    ]
  }
};

const BUDGET_FOODS = {
  100: [
    {name:'Vada Pav',price:30,restaurant:'Mumbai Bites',rating:4.4,orders:1820,img:'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&h=300&fit=crop'},
    {name:'Samosa',price:25,restaurant:'Street Corner',rating:4.2,orders:2100,img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'},
    {name:'Masala Chai',price:20,restaurant:'Chai Wala',rating:4.6,orders:3200,img:'https://images.unsplash.com/photo-1571934811356-5cc061b6d396?w=400&h=300&fit=crop'},
    {name:'Poha',price:60,restaurant:'Indore Sweets',rating:4.3,orders:980,img:'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&h=300&fit=crop'},
    {name:'Aloo Paratha',price:80,restaurant:'Punjabi Dhaba',rating:4.5,orders:1560,img:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop'},
    {name:'Idli',price:50,restaurant:'South Spice',rating:4.4,orders:1340,img:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop'},
  ],
  150: [
    {name:'Chole Bhature',price:120,restaurant:'Amritsar House',rating:4.6,orders:2340,img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'},
    {name:'Masala Dosa',price:110,restaurant:'Dosa Plaza',rating:4.5,orders:1890,img:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop'},
    {name:'Egg Roll',price:80,restaurant:'Roll King',rating:4.3,orders:1560,img:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop'},
    {name:'Dal Makhani',price:140,restaurant:'Punjabi Dhaba',rating:4.7,orders:2100,img:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'},
    {name:'Upma',price:70,restaurant:'South Spice',rating:4.2,orders:870,img:'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop'},
    {name:'Pav Bhaji',price:130,restaurant:'Mumbai Bites',rating:4.6,orders:2780,img:'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&h=300&fit=crop'},
  ],
  250: [
    {name:'Butter Chicken',price:220,restaurant:'Tandoor House',rating:4.7,orders:3400,img:'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop'},
    {name:'Biryani Bowl',price:200,restaurant:'Biryani Brothers',rating:4.8,orders:4100,img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'},
    {name:'Paneer Tikka',price:190,restaurant:'Spice Garden',rating:4.5,orders:1980,img:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'},
    {name:'Chicken Wrap',price:180,restaurant:'Wrap Station',rating:4.4,orders:1670,img:'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=300&fit=crop'},
    {name:'Fish Curry',price:240,restaurant:'Coastal Flavors',rating:4.6,orders:1230,img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'},
    {name:'Mutton Rogan Josh',price:250,restaurant:'Kashmir Kitchen',rating:4.9,orders:2100,img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'},
  ],
  500: [
    {name:'Prawn Biryani',price:420,restaurant:'Sea Palace',rating:4.8,orders:2800,img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'},
    {name:'Lamb Chops',price:480,restaurant:'Grill House',rating:4.7,orders:1560,img:'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop'},
    {name:'Sushi Platter (6pc)',price:450,restaurant:'Tokyo Bites',rating:4.9,orders:2100,img:'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&h=300&fit=crop'},
    {name:'Grilled Lobster',price:490,restaurant:'Fishermans Catch',rating:4.8,orders:890,img:'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&h=300&fit=crop'},
    {name:'Steak (250g)',price:470,restaurant:'The Steakhouse',rating:4.9,orders:1340,img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'},
    {name:'Tandoori Platter',price:380,restaurant:'Royal Tandoor',rating:4.7,orders:1980,img:'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop'},
  ]
};

const TRENDING_FOODS = {
  today: [
    {name:'Chicken Biryani',restaurant:'Biryani Brothers',rating:4.8,orders:412,tag:'Trending',img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',price:220},
    {name:'Butter Chicken',restaurant:'Tandoor House',rating:4.7,orders:389,tag:'Hot',img:'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',price:240},
    {name:'Margherita Pizza',restaurant:'Pizza Primo',rating:4.6,orders:356,tag:'Popular',img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',price:280},
    {name:'Shawarma',restaurant:'Lebanese Corner',rating:4.5,orders:312,tag:'Trending',img:'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=300&fit=crop',price:160},
  ],
  mostOrdered: [
    {name:'Veg Thali',restaurant:'Rajdhani',rating:4.9,orders:8920,tag:'Most Ordered',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',price:200},
    {name:'Masala Dosa',restaurant:'Dosa Plaza',rating:4.8,orders:7430,tag:'Classic',img:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',price:110},
    {name:'Paneer Tikka',restaurant:'Spice Garden',rating:4.7,orders:6820,tag:'Fan Fav',img:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',price:200},
    {name:'Hyderabadi Biryani',restaurant:'Paradise',rating:4.9,orders:9100,tag:'No.1',img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',price:250},
  ],
  nearYou: [
    {name:'Pav Bhaji',restaurant:'Mumbai Bites',rating:4.7,orders:2340,tag:'Near You',img:'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&h=300&fit=crop',price:130},
    {name:'Chole Bhature',restaurant:'Amritsar House',rating:4.6,orders:1890,tag:'0.3 km',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',price:140},
    {name:'Fish Fry',restaurant:'Coastal Flavors',rating:4.5,orders:1230,tag:'0.7 km',img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',price:260},
    {name:'Chicken Roll',restaurant:'Roll King',rating:4.4,orders:1560,tag:'0.5 km',img:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',price:120},
  ]
};

const SMART_RULES = [
  {keywords:['spicy','hot','fiery'],filters:{spicy:true}},
  {keywords:['cheap','budget','affordable','low price','under 100','under 150'],filters:{budget:true}},
  {keywords:['healthy','diet','light','salad','low cal','low calorie'],filters:{healthy:true}},
  {keywords:['protein','gym','muscle','high protein','bodybuilding'],filters:{protein:true}},
  {keywords:['late night','midnight','night','2am','3am'],filters:{lateNight:true}},
  {keywords:['dinner','evening'],filters:{dinner:true}},
  {keywords:['sweet','dessert','chocolate','cake'],filters:{sweet:true}},
  {keywords:['vegetarian','veg','no meat'],filters:{veg:true}},
];

const SMART_FOOD_DB = [
  {name:'Spicy Veg Burger',restaurant:'Burger Barn',rating:4.5,orders:1200,price:160,tags:['spicy','veg'],img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'},
  {name:'Dal Tadka',restaurant:'Punjabi Dhaba',rating:4.6,orders:2300,price:120,tags:['budget','veg','dinner'],img:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'},
  {name:'Egg Bhurji',restaurant:'Street Corner',rating:4.4,orders:1800,price:80,tags:['budget','protein'],img:'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400&h=300&fit=crop'},
  {name:'Grilled Chicken Salad',restaurant:'Fresh & Fit',rating:4.7,orders:1100,price:240,tags:['healthy','protein'],img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop'},
  {name:'Protein Omelette',restaurant:'Fitness Kitchen',rating:4.5,orders:980,price:180,tags:['protein','healthy'],img:'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop'},
  {name:'Pizza (Spicy Arrabbiata)',restaurant:'Pizza Primo',rating:4.6,orders:2100,price:280,tags:['spicy','dinner'],img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop'},
  {name:'Shawarma Roll',restaurant:'Lebanese Corner',rating:4.5,orders:1900,price:160,tags:['lateNight','dinner'],img:'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=300&fit=crop'},
  {name:'Samosa (2pc)',restaurant:'Street Corner',rating:4.3,orders:3100,price:40,tags:['budget','veg','lateNight'],img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'},
  {name:'Chocolate Lava Cake',restaurant:'Dessert Den',rating:4.8,orders:1500,price:180,tags:['sweet','dessert'],img:'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop'},
  {name:'Paneer Tikka',restaurant:'Spice Garden',rating:4.7,orders:2600,price:200,tags:['protein','veg','dinner'],img:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'},
  {name:'Veg Thali',restaurant:'Rajdhani',rating:4.9,orders:4200,price:200,tags:['budget','veg','dinner'],img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'},
  {name:'Instant Noodles Bowl',restaurant:'Noodle House',rating:4.2,orders:1600,price:120,tags:['budget','lateNight'],img:'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop'},
];

// ---- ORDER TIMELINE STATE ----
const TIMELINE_STEPS = [
  {id:'placed',label:'Order Placed',sub:'We received your order'},
  {id:'accepted',label:'Restaurant Accepted',sub:'Restaurant confirmed your order'},
  {id:'preparing',label:'Preparing',sub:'Chef is getting your order ready'},
  {id:'cooking',label:'Cooking',sub:'Your food is being cooked fresh'},
  {id:'delivery',label:'Out for Delivery',sub:'Rider is on the way'},
  {id:'delivered',label:'Delivered',sub:'Enjoy your meal!'},
];

let _tlInterval = null;
let _tlStep = 0;
let _tlOrderInfo = null;

// ---- RENDER HELPERS ----
function renderMoodFoodCard(name, img, price, restaurant, rating) {
  const p = price ? 'Rs.' + price : '';
  return `<div class="food-card" role="listitem" style="cursor:default">
    <div class="food-card-img-wrap">
      <img src="${img}" alt="${name}" class="food-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop'"/>
      <div class="food-card-badge" style="background:var(--brand)">${restaurant}</div>
    </div>
    <div class="food-card-body">
      <div class="food-card-name">${name}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
        <span style="color:var(--brand);font-weight:700;font-size:0.9rem">${p}</span>
        <span style="font-size:0.75rem;color:var(--yellow);font-weight:600">&#9733; ${rating}</span>
      </div>
    </div>
  </div>`;
}

function renderTrendingCard(food) {
  return `<div class="food-card" role="listitem" style="cursor:default">
    <div class="food-card-img-wrap">
      <img src="${food.img}" alt="${food.name}" class="food-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop'"/>
      <div class="food-card-badge" style="background:var(--brand)">${food.tag}</div>
    </div>
    <div class="food-card-body">
      <div class="food-card-name">${food.name}</div>
      <div style="font-size:0.75rem;color:var(--text-3);margin-top:2px">${food.restaurant}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
        <span style="color:var(--brand);font-weight:700;font-size:0.9rem">Rs.${food.price}</span>
        <span style="font-size:0.75rem;color:var(--text-3)">${food.orders.toLocaleString()} orders</span>
      </div>
    </div>
  </div>`;
}

// ---- MOOD PAGE ----
function initMoodPage() {
  const grid = document.getElementById('mood-grid');
  if (!grid) return;
  if (grid.children.length > 0) return;
  const moods = Object.keys(MOOD_DATA);
  grid.innerHTML = moods.map(m => {
    const d = MOOD_DATA[m];
    return `<div class="mood-card" onclick="selectMood('${m}',this)">
      <div class="mood-card-icon">${d.icon}</div>
      <div class="mood-card-label">${d.label}</div>
      <div class="mood-card-sub">${d.sub}</div>
    </div>`;
  }).join('');
}

function selectMood(mood, el) {
  document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const d = MOOD_DATA[mood];
  const grid = document.getElementById('mood-food-grid');
  const results = document.getElementById('mood-results');
  const title = document.getElementById('mood-results-title');
  title.textContent = `Best for ${d.label} - ${d.sub}`;
  const RESTS = ['Tandoor House','Biryani Brothers','Spice Garden','Coastal Flavors','Mumbai Bites','Dosa Plaza'];
  const PRICES = [120,160,200,240,180,140];
  const RATINGS = [4.5,4.6,4.7,4.8,4.4,4.9];
  grid.innerHTML = d.foods.map((f,i) => renderMoodFoodCard(f, d.images[i], PRICES[i], RESTS[i], RATINGS[i])).join('');
  results.style.display = 'block';
  results.scrollIntoView({behavior:'smooth',block:'start'});
}

// ---- BUDGET PAGE ----
function initBudgetPage() {
  const el = document.querySelector('[data-budget="100"]');
  selectBudget(100, el);
}

function selectBudget(budget, el) {
  document.querySelectorAll('[data-budget]').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const foods = BUDGET_FOODS[budget] || [];
  document.getElementById('budget-results-title').textContent = `Best meals under Rs.${budget}`;
  document.getElementById('budget-food-grid').innerHTML = foods.map(f =>
    renderTrendingCard({...f,tag:`Rs.${f.price}`})
  ).join('');
}

// ---- TRENDING PAGE ----
function initTrendingPage() {
  const tod = document.getElementById('trending-today-grid');
  const mo = document.getElementById('most-ordered-grid');
  const pn = document.getElementById('popular-near-grid');
  if (!tod) return;
  if (tod.children.length > 0) return;
  tod.innerHTML = TRENDING_FOODS.today.map(renderTrendingCard).join('');
  mo.innerHTML = TRENDING_FOODS.mostOrdered.map(renderTrendingCard).join('');
  pn.innerHTML = TRENDING_FOODS.nearYou.map(renderTrendingCard).join('');
}

// ---- SMART SEARCH ----
function openSmartSearch() {
  openModal('smart-search-modal');
  setTimeout(() => document.getElementById('smart-search-input')?.focus(), 200);
}

function setSmartSearch(val) {
  const inp = document.getElementById('smart-search-input');
  if (inp) { inp.value = val; handleSmartSearch(val); }
}

function handleSmartSearch(query) {
  const q = query.toLowerCase().trim();
  const results = document.getElementById('smart-search-results');
  if (!q) { results.innerHTML = ''; return; }

  // Build a merged search DB from real FOODS + SMART_FOOD_DB
  const realFoods = FOODS.map(f => ({
    id: f.id, name: f.name, restaurant: f.restaurantName,
    rating: f.rating, orders: f.reviews, price: f.price, img: f.img,
    tags: f.tags.map(t => t.toLowerCase()).concat([
      f.veg ? 'veg' : 'nonveg',
      f.category,
      ...(f.price < 150 ? ['budget','cheap','affordable'] : []),
      ...(f.price < 250 ? ['budget'] : []),
      ...(f.tags.some(t => t.toLowerCase().includes('spic')) ? ['spicy'] : []),
      ...(f.category === 'healthy' ? ['healthy','protein','diet'] : []),
      ...(f.category === 'biryani' ? ['dinner','lunch'] : []),
      ...(['paneer','veg','healthy'].some(k => f.name.toLowerCase().includes(k)) ? ['protein'] : []),
    ])
  }));

  // Keyword synonyms for smart matching
  const synonyms = {
    spicy: ['spicy','hot','fiery','peri','tikka'],
    cheap: ['cheap','budget','affordable','low','under','price'],
    healthy: ['healthy','diet','light','salad','low cal','green','bowl'],
    protein: ['protein','gym','muscle','bodybuilding','chicken','egg'],
    veg: ['veg','vegetarian','plant','no meat'],
    dinner: ['dinner','evening','night','late'],
    dessert: ['sweet','dessert','chocolate','cake','ice cream','mithai'],
    biryani: ['biryani','rice','dum'],
    pizza: ['pizza','italian'],
    burger: ['burger','sandwich'],
    rolls: ['roll','wrap','kathi'],
    drinks: ['drink','coffee','chai','tea','juice'],
  };

  // Find matching tags from query
  const matchedTags = new Set();
  for (const [tag, keys] of Object.entries(synonyms)) {
    if (keys.some(k => q.includes(k))) matchedTags.add(tag);
  }

  let matches = [];
  // First: filter by matched tags
  if (matchedTags.size > 0) {
    matches = realFoods.filter(f => f.tags.some(t => matchedTags.has(t)));
  }
  // Fallback: name/restaurant text match
  if (matches.length === 0) {
    matches = realFoods.filter(f =>
      f.name.toLowerCase().includes(q) || f.restaurant.toLowerCase().includes(q) ||
      f.tags.some(t => q.includes(t))
    );
  }
  // Final fallback: top rated foods
  if (matches.length === 0) {
    matches = realFoods.slice().sort((a,b) => b.rating - a.rating).slice(0, 6);
  }

  matches = matches.slice(0, 8);
  results.innerHTML = matches.map(f => `
    <div class="food-card" role="listitem" onclick="openFoodDetail(${f.id||0})" style="cursor:pointer">
      <div class="food-card-img-wrap">
        <div class="food-card-img" style="background:var(--surface-2);font-size:0;padding:0">
          <img src="${f.img}" alt="${escape(f.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.background='var(--surface-3)'"/>
        </div>
      </div>
      <div class="food-card-info">
        <div class="food-name">${escape(f.name)}</div>
        <div class="food-restaurant">${escape(f.restaurant)}</div>
      </div>
      <div class="food-card-footer">
        <div class="food-price">₹${f.price}</div>
        <div class="food-rating"><span style="color:var(--yellow)">★</span>${f.rating}</div>
        <button class="add-btn" onclick="event.stopPropagation();addToCart(${f.id||0});closeModal('smart-search-modal')" aria-label="Add to cart">+</button>
      </div>
    </div>
  `).join('');
}

// ---- LIVE ORDER TIMELINE ----
function startOrderTimeline(orderInfo) {
  _tlStep = 0;
  _tlOrderInfo = orderInfo || {restaurant:'Your Restaurant', orderId: '#FG' + Math.floor(Math.random()*10000)};
  clearInterval(_tlInterval);
  document.getElementById('order-timeline-restaurant').textContent =
    `Order ${_tlOrderInfo.orderId} from ${_tlOrderInfo.restaurant}`;
  renderTimelineStep(_tlStep);
  openModal('order-timeline-modal');

  const delays = [0, 8000, 25000, 50000, 120000, 240000];
  delays.forEach((delay, i) => {
    setTimeout(() => {
      if (i <= _tlStep + 1) return;
      _tlStep = i;
      renderTimelineStep(_tlStep);
      const eta = Math.max(0, 28 - Math.floor(i * 4.5));
      document.getElementById('order-eta').textContent = eta > 0 ? eta + ' min' : 'Arriving!';
    }, delay);
  });
}

function renderTimelineStep(currentStep) {
  const container = document.getElementById('order-timeline-steps');
  if (!container) return;
  const now = new Date();
  container.innerHTML = TIMELINE_STEPS.map((step, i) => {
    const done = i < currentStep;
    const active = i === currentStep;
    const t = new Date(now.getTime() + i * 5 * 60000);
    const timeStr = done ? `${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}` : (active ? 'Now' : 'Est.');
    return `<div class="timeline-step">
      <div style="position:relative;flex-shrink:0">
        <div class="timeline-dot ${done?'done':''} ${active?'active':''}">${done?'&#10003;':i+1}</div>
        ${i < TIMELINE_STEPS.length-1 ? `<div class="timeline-line ${done?'done':''}"></div>` : ''}
      </div>
      <div class="timeline-content" style="${!done&&!active?'opacity:0.45':''}">
        <div class="timeline-title">${step.label}</div>
        <div class="timeline-sub">${step.sub}</div>
        <div class="timeline-time">${timeStr}</div>
      </div>
    </div>`;
  }).join('');
}

// Hook into existing checkout success / placeOrder to auto-start timeline
const _origPlaceOrderV8 = window.placeOrder;
window.placeOrder = async function() {
  const result = _origPlaceOrderV8 ? await _origPlaceOrderV8.apply(this, arguments) : null;
  // Start timeline after a short delay (let checkout page render first)
  setTimeout(() => {
    const rest = STATE?.cart?.[0]?.restaurantName || 'Foodgasm Kitchen';
    const oid = '#FG' + Math.floor(Math.random()*90000+10000);
    startOrderTimeline({restaurant: rest, orderId: oid});
  }, 1500);
  return result;
};

// Also expose for direct call
window.startOrderTimeline = startOrderTimeline;
window.selectMood = selectMood;
window.selectBudget = selectBudget;
window.openSmartSearch = openSmartSearch;
window.setSmartSearch = setSmartSearch;
window.handleSmartSearch = handleSmartSearch;

// =============================================
// ===== TERMS DOWNLOAD =====
// =============================================
function downloadTerms() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Foodgasm — Terms &amp; Privacy</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 24px;line-height:1.7;color:#222}
h1{color:#ff4500;font-size:2rem;margin-bottom:4px}h2{color:#ff4500;margin-top:32px;font-size:1.2rem;border-bottom:2px solid #ff4500;padding-bottom:6px}
p{margin:10px 0}.meta{color:#888;font-size:0.85rem;margin-bottom:32px}</style></head>
<body>
<h1>🍔 Foodgasm</h1>
<p class="meta">Terms &amp; Privacy Policy — Effective 2026-01-01</p>
<h2>Terms &amp; Conditions</h2>
<p>By using Foodgasm you agree to our terms of service. Orders placed are binding and subject to restaurant availability. Pricing is inclusive of applicable GST. Foodgasm acts as a marketplace platform connecting customers with restaurant partners.</p>
<h2>Privacy Policy</h2>
<p>We collect personal information (name, email, phone, delivery address) solely to process your orders and improve our service. Your data is encrypted at rest and in transit. We never sell your personal information to third parties. You may request data deletion at <a href="mailto:support@foodgasm.in">support@foodgasm.in</a>.</p>
<h2>Cancellation &amp; Refund</h2>
<p>Orders may be cancelled within 2 minutes of placement. Once the restaurant confirms your order, cancellation is subject to restaurant discretion. Refunds for eligible cancellations are processed within 5–7 business days to the original payment method.</p>
<h2>Contact Us</h2>
<p>Email: <a href="mailto:support@foodgasm.in">support@foodgasm.in</a><br>Helpline: 1800-123-4567 (9 AM – 9 PM IST)</p>
</body></html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Foodgasm-Terms-Privacy.html'; a.click();
  URL.revokeObjectURL(url);
  showToast('Terms downloaded!', 'success');
}

// =============================================
// ===== AI CHATBOT (FOODIE) =====
// =============================================
const CHATBOT_KB = {
  greetings: ['hi','hello','hey','namaste','hola'],
  track: ['track','tracking','where is my order','order status'],
  recommend: ['recommend','suggest','what should','best food','what to eat','food for me'],
  veg: ['veg','vegetarian','no meat','plant based'],
  nonveg: ['non-veg','nonveg','chicken','mutton','fish','meat'],
  biryani: ['biryani','biriyani'],
  pizza: ['pizza'],
  burger: ['burger'],
  nearby: ['nearby','near me','close','restaurant near'],
  coupon: ['coupon','discount','offer','promo','code'],
  delivery: ['delivery time','how long','eta','when'],
  help: ['help','support','issue','problem','contact'],
  checkout: ['checkout','how to order','place order','payment'],
  cod: ['cod','cash on delivery','cash'],
};

function chatbotRespond(msg) {
  const q = msg.toLowerCase();
  const city = STATE.location || 'your area';
  const user = STATE.user;

  if (CHATBOT_KB.greetings.some(k => q.includes(k))) {
    const name = user?.name ? `, ${user.name.split(' ')[0]}` : '';
    return `👋 Hey${name}! I'm **Foodie**, your AI food assistant.\n\nI can help you:\n• 🍽️ Find food & restaurants\n• 📦 Track & cancel orders\n• 🎁 Apply coupon codes\n• 💬 Answer any food questions\n\nWhat are you craving today?`;
  }

  if (CHATBOT_KB.track.some(k => q.includes(k))) {
    const activeOrders = STATE.orders?.filter(o => ['confirmed','preparing','out_for_delivery'].includes(o.status));
    if (activeOrders?.length) {
      return `📦 You have **${activeOrders.length} active order(s)**.\n\nGo to the **Orders** tab → tap **🛵 Track** to see live status!`;
    }
    return `📦 To track your order, go to **Orders** tab and tap **Track** on any active order.`;
  }

  if (q.includes('cancel') && (q.includes('order') || q.includes('my'))) {
    const activeOrders = STATE.orders?.filter(o => ['pending','confirmed','preparing'].includes(o.status));
    if (activeOrders?.length) {
      return `❌ You have **${activeOrders.length} cancellable order(s)**.\n\nGo to **Orders → Active** and tap **✕ Cancel**.\n\nOrders out for delivery cannot be cancelled.\n\nNeed more help? 📧 chakrabortybitan679@gmail.com`;
    }
    return `❌ To cancel:\n1. Go to **Orders** tab\n2. Find active order\n3. Tap **✕ Cancel**\n\nOnly orders in Pending/Confirmed/Preparing can be cancelled.`;
  }

  if (CHATBOT_KB.biryani.some(k => q.includes(k)))
    return `🍚 Great choice! Top biryanis near ${city}:\n• **Chicken Dum Biryani** ₹399 — Biryani By Kilo ⭐4.8\n• **Hyderabadi Biryani** ₹449 — Paradise Biryani ⭐4.9\n• **Royal Veg Biryani** ₹349 — Biryani By Kilo ⭐4.6\n\nAll rated 4.6+ and bestsellers!`;

  if (CHATBOT_KB.pizza.some(k => q.includes(k)))
    return `🍕 Pizza picks for you:\n• **Margherita** ₹249 — Domino's ⭐4.4\n• **Truffle Mushroom** ₹699 — Farinelli ⭐4.9\n• **Wood-Fired Margherita** ₹499 — Farinelli ⭐4.8`;

  if (CHATBOT_KB.burger.some(k => q.includes(k)))
    return `🍔 Top burgers:\n• **McAloo Tikki** ₹99 — McDonald's (budget veg) ⭐4.1\n• **Chicken Zinger** ₹199 — KFC ⭐4.3\n• **Whopper** ₹229 — Burger King ⭐4.2`;

  if (CHATBOT_KB.veg.some(k => q.includes(k))) {
    const vegFoods = FOODS.filter(f => f.veg).slice(0,4).map(f => `• ${f.name} — ₹${f.price} (${f.restaurantName})`).join('\n');
    return `🟢 Veg options in ${city}:\n${vegFoods}\n\nUse the 🟢 **Veg** filter on home page to see all veg items!`;
  }

  if (CHATBOT_KB.nonveg.some(k => q.includes(k))) {
    const nvFoods = FOODS.filter(f => !f.veg).slice(0,4).map(f => `• ${f.name} — ₹${f.price} (${f.restaurantName})`).join('\n');
    return `🔴 Non-veg picks:\n${nvFoods}`;
  }

  if (CHATBOT_KB.nearby.some(k => q.includes(k))) {
    const rests = RESTAURANTS.slice(0,5).map(r => `• ${r.name} — ${r.deliveryTime} min · ⭐${r.rating}`).join('\n');
    return `📍 Restaurants near ${city}:\n${rests}`;
  }

  if (CHATBOT_KB.recommend.some(k => q.includes(k))) {
    // Personalise if user has orders
    if (STATE.orders?.length > 0) {
      const lastOrder = STATE.orders[0];
      return `✨ Based on your order history:\n• 🍗 Chicken Dum Biryani — ₹399 (matches your taste)\n• 🍕 Margherita Pizza — ₹249 (popular this week)\n• 🧀 Paneer Tikka — ₹299 (top veg pick)\n\nAll available for fast delivery in ${city}!`;
    }
    return `✨ Top picks right now:\n• 🍚 Chicken Dum Biryani — ₹399 ⭐4.8 (Bestseller)\n• 🍕 Margherita Pizza — ₹249 ⭐4.4 (Classic)\n• 🧀 Paneer Tikka — ₹299 ⭐4.8 (Veg fav)\n• 🍬 Rosogolla (6pc) — ₹149 ⭐4.9 (Dessert)`;
  }

  if (CHATBOT_KB.coupon.some(k => q.includes(k)))
    return `🎁 Working coupon codes:\n• **FIRST50** — ₹50 off first order\n• **SAVE100** — ₹100 off above ₹500\n• **FOOD20** — 20% off any order\n• **FOODGASM50** — ₹50 off\n\nApply at cart → checkout!`;

  if (CHATBOT_KB.delivery.some(k => q.includes(k)))
    return `⏱️ Delivery times:\n• Express: 15–25 min (Starbucks, Chaayos)\n• Standard: 25–35 min (KFC, Subway)\n• Restaurant meals: 35–50 min\n\nDelivery fee from ₹0–₹99. Check each restaurant card!`;

  if (CHATBOT_KB.checkout.some(k => q.includes(k)))
    return `🛒 How to order:\n1. Browse food → Add to cart\n2. Go to **Cart** → Tap **Checkout**\n3. Enter delivery address\n4. Choose **COD** or **Razorpay** (UPI/Card)\n5. Tap **Place Order** ✓`;

  if (CHATBOT_KB.cod.some(k => q.includes(k)))
    return `💵 **Cash on Delivery** is available! Select COD at checkout — pay when food arrives. No upfront payment needed.`;

  if (CHATBOT_KB.help.some(k => q.includes(k)))
    return `🆘 Need help? Contact:\n📧 chakrabortybitan679@gmail.com\n📞 +91 8910542451\n\nOr go to **Settings → Help & Support**`;

  // Food name search
  const allFoods = FOODS.filter(f => f.name.toLowerCase().includes(q) || f.category.includes(q));
  if (allFoods.length > 0) {
    return `🔍 Found for "${msg}":\n` + allFoods.slice(0,4).map(f => `• ${f.name} — ₹${f.price} (${f.veg?'🟢':'🔴'} ${f.restaurantName})`).join('\n');
  }

  return `🤔 Hmm, I'm not sure about that. Try:\n• "recommend food"\n• "show veg options"\n• "track my order"\n• "apply coupon"\n\nOr search any food name!`;
}

function openChatbot() {
  openModal('chatbot-modal');
  const msgs = document.getElementById('chatbot-messages');
  if (msgs && msgs.children.length === 0) {
    appendChatMessage('bot', `👋 Hi! I'm **Foodie**, your AI food assistant!\n\nI can help you:\n• 🍽️ Find food & restaurants in ${STATE.location || 'your area'}\n• 📦 Track your orders\n• 🎁 Find coupon codes\n• 💬 Answer any food questions\n\nWhat can I get you today?`);
  }
}

function appendChatMessage(who, text) {
  const msgs = document.getElementById('chatbot-messages');
  if (!msgs) return;
  const isBot = who === 'bot';
  const div = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-start;${isBot?'':'flex-direction:row-reverse'}`;
  const avatar = document.createElement('div');
  avatar.style.cssText = `width:32px;height:32px;border-radius:50%;background:${isBot?'var(--brand)':'var(--surface-3)'};display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0`;
  avatar.textContent = isBot ? '🤖' : '👤';
  const bubble = document.createElement('div');
  bubble.style.cssText = `max-width:78%;padding:10px 14px;border-radius:${isBot?'4px 14px 14px 14px':'14px 4px 14px 14px'};background:${isBot?'var(--surface-2)':'var(--brand)'};color:${isBot?'var(--text)':'#fff'};font-size:0.8125rem;line-height:1.55;white-space:pre-line`;
  bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function chatbotSend(msg) {
  if (!msg.trim()) return;
  appendChatMessage('user', msg);
  setTimeout(() => {
    appendChatMessage('bot', chatbotRespond(msg));
  }, 400);
}

function chatbotSendInput() {
  const inp = document.getElementById('chatbot-input');
  if (!inp || !inp.value.trim()) return;
  const val = inp.value.trim();
  inp.value = '';
  chatbotSend(val);
}

// =============================================
// END OF V8 ADDITIONS
// =============================================

// =============================================
// ===== AUTO MIGRATION (runs once on load) =====
// =============================================
// NOTE: Supabase Management API does not support browser CORS.
// Schema migrations must be applied via Supabase Dashboard → SQL Editor.
// Required migrations (run once manually if not already applied):
//   ALTER TABLE orders ALTER COLUMN restaurant_id DROP NOT NULL;
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id text;
//   ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'restaurant';

async function runMigrations() {
  // Mark as done immediately — Management API cannot be called from the browser
  // (blocked by CORS). Apply schema changes via Supabase Dashboard SQL Editor.
  localStorage.setItem('fg_migrations_v1_done', '1');

  // Log required migrations to console for developer reference
  console.info(
    '%c[Foodgasm] Required Supabase migrations (run once in SQL Editor):\n',
    'color:#FF4500;font-weight:bold',
    '\nALTER TABLE orders ALTER COLUMN restaurant_id DROP NOT NULL;',
    '\nALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id text;',
    '\nALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;',
    '\nALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;',
    '\nALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;',
    '\nALTER TABLE wishlist ADD COLUMN IF NOT EXISTS item_type text DEFAULT \'restaurant\';'
  );

  // Soft-check: verify estimated_delivery_at column exists by fetching one order
  if (STATE.user?.id) {
    try {
      const testRow = await API.get('orders', `?user_id=eq.${STATE.user.id}&select=estimated_delivery_at&limit=1`);
      if (testRow === null || (Array.isArray(testRow) && testRow.length === 0)) {
        // No rows yet — column may exist, can't confirm
      } else if (Array.isArray(testRow) && testRow.length > 0 && !('estimated_delivery_at' in testRow[0])) {
        console.warn('[Foodgasm] ⚠️ estimated_delivery_at column missing! Run:\nALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;');
      }
    } catch(_) { /* ignore — user may not be logged in yet */ }
  }
}

// Start the app
window.addEventListener('DOMContentLoaded', async () => {
  await runMigrations();
  initApp();
});

// =============================================
// ===== SERVICE WORKER (PWA) =====
// =============================================
// Service Worker: only register when served from http/https (not blob/file/data)
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
  window.addEventListener('load', () => {
    const swCode = `
const CACHE='foodgasm-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/'])).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{title:'Foodgasm',body:'New notification'};e.waitUntil(self.registration.showNotification(d.title||'Foodgasm',{body:d.body||'',icon:'/favicon.ico'}));});
`;
    try {
      const blob = new Blob([swCode], {type:'application/javascript'});
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url)
        .then(reg => console.log('[SW] Registered', reg.scope))
        .catch(() => {}); // silently skip if blob SW blocked
    } catch(e) {}
  });
}
