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

const TIMELINE_STEPS = [
  {id:'placed',label:'Order Placed',sub:'We received your order'},
  {id:'accepted',label:'Restaurant Accepted',sub:'Restaurant confirmed your order'},
  {id:'preparing',label:'Preparing',sub:'Chef is getting your order ready'},
  {id:'cooking',label:'Cooking',sub:'Your food is being cooked fresh'},
  {id:'delivery',label:'Out for Delivery',sub:'Rider is on the way'},
  {id:'delivered',label:'Delivered',sub:'Enjoy your meal!'},
];
