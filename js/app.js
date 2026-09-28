const app = {
  activeTab: 'home',
  dishes: [],
  cart: [],
  wishlist: [],
  
  tabs: [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'browse', label: 'Browse', icon: 'layout-grid' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { id: 'orders', label: 'Orders', icon: 'truck' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],

  async init() {
    this.renderNav();
    await this.fetchDishes();
    this.updateCart();
    this.renderWishlistGrid();
    this.switchTab('home');
    setInterval(() => { if (window.lucide) window.lucide.createIcons(); }, 500);
  },

  renderNav() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = this.tabs.map(tab => `
      <button onclick="app.switchTab('${tab.id}')" class="nav-btn w-full flex items-center px-8 py-3.5 text-xs font-semibold transition-all duration-200" data-tab="${tab.id}">
        <i data-lucide="${tab.icon}" class="w-4 h-4 mr-3"></i>
        ${tab.label}
      </button>
    `).join('');
  },

  async fetchDishes() {
    try {
      const res = await fetch('/api/restaurants');
      const data = await res.json();
      const items = (data.data || data.restaurants || []).map(r => ({
        id: r.id,
        name: r.name || r.title,
        price: r.avg_cost_for_two ? r.avg_cost_for_two / 40 : 15.5,
        image: r.img || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        badge: r.badge || ''
      }));
      if (items.length > 0) this.dishes = items;
      else this.loadDefaults();
    } catch (e) {
      console.error(e);
      this.loadDefaults();
    }
    // Set a few wishlist items by default to match screenshot
    if(this.dishes.length >= 3) {
      this.wishlist = [this.dishes[0].id, this.dishes[1].id, this.dishes[2].id];
    }
    this.renderDishes();
  },

  loadDefaults() {
    this.dishes = [
      { id: '1', name: 'Gourmet Wagyu Burger', price: 4.50, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', badge: '' },
      { id: '2', name: 'Seafood Paella', price: 23.60, image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=400&q=80', badge: '' },
      { id: '3', name: 'Truffle Pasta', price: 5.50, image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80', badge: '' },
      { id: '4', name: 'Berles Big Sitesitr', price: 3.50, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', badge: '' }
    ];
  },

  renderDishes() {
    const grid = document.getElementById('dishes-grid');
    if (!grid) return;
    grid.innerHTML = this.dishes.slice(0,6).map((d) => `
      <div class="bg-panelDark rounded-xl p-3 border border-white/5 flex flex-col hover:bg-white/5 transition-colors group">
        <div class="relative aspect-video rounded-lg overflow-hidden mb-3">
          <img src="${d.image}" alt="${d.name}" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <button class="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white" onclick="app.toggleWishlist('${d.id}')">
            <i data-lucide="heart" class="w-3 h-3 ${this.wishlist.includes(d.id) ? 'fill-white text-white' : ''}"></i>
          </button>
        </div>
        <h3 class="text-white font-semibold text-xs mb-1 line-clamp-1">${d.name}</h3>
        <div class="flex items-center justify-between mt-auto pt-2">
          <span class="text-white text-xs">$${d.price.toFixed(2)}</span>
          <button onclick="app.addToCart('${d.id}')" class="px-3 py-1.5 rounded bg-brand text-white text-[10px] font-bold">
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');
  },

  renderWishlistGrid() {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;
    const items = this.dishes.filter(d => this.wishlist.includes(d.id));
    grid.innerHTML = items.map((d) => `
      <div class="bg-bgDark rounded-lg p-2 border border-white/5 flex flex-col group relative">
        <div class="relative aspect-video rounded md overflow-hidden mb-2">
          <img src="${d.image}" alt="${d.name}" class="w-full h-full object-cover" />
          <button class="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white" onclick="app.toggleWishlist('${d.id}')">
            <i data-lucide="heart" class="w-3 h-3 fill-white text-white"></i>
          </button>
        </div>
        <h3 class="text-white font-semibold text-[9px] mb-0.5 truncate">${d.name}</h3>
        <span class="text-zinc-400 text-[9px]">$${d.price.toFixed(2)}</span>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  },

  toggleWishlist(id) {
    if (this.wishlist.includes(id)) {
      this.wishlist = this.wishlist.filter(w => w !== id);
    } else {
      this.wishlist.push(id);
    }
    this.renderDishes();
    this.renderWishlistGrid();
  },

  addToCart(id) {
    const dish = this.dishes.find(d => d.id === id);
    if (!dish) return;
    const existing = this.cart.find(c => c.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ ...dish, quantity: 1 });
    }
    this.updateCart();
  },

  updateQuantity(id, delta) {
    const item = this.cart.find(c => c.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(c => c.id !== id);
    }
    this.updateCart();
  },

  updateCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    
    if (this.cart.length === 0) {
      container.innerHTML = '<p class="text-zinc-500 text-xs">Cart is empty.</p>';
    } else {
      this.cart.forEach((item) => {
        container.innerHTML += `
          <div class="flex items-center gap-3">
            <img src="${item.image}" alt="${item.name}" class="w-10 h-10 rounded-md object-cover flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <h4 class="text-white text-xs font-semibold truncate">${item.name}</h4>
              <p class="text-zinc-400 text-[10px]">$${item.price.toFixed(2)}</p>
            </div>
            <div class="flex items-center bg-bgDark rounded border border-white/5 text-white text-[10px] flex-shrink-0">
              <button onclick="app.updateQuantity('${item.id}', -1)" class="px-1.5 py-1 text-zinc-400">-</button>
              <span class="px-1">${item.quantity}</span>
              <button onclick="app.updateQuantity('${item.id}', 1)" class="px-1.5 py-1 text-zinc-400">+</button>
            </div>
          </div>
        `;
      });
    }

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal > 0 ? 3.00 : 0;
    document.getElementById('cart-subtotal').innerText = '$' + subtotal.toFixed(2);
    document.getElementById('cart-delivery').innerText = '$' + delivery.toFixed(2);
    if (window.lucide) window.lucide.createIcons();
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isSelected = btn.dataset.tab === tabId;
      if (['orders', 'profile'].includes(tabId)) {
        btn.className = `nav-btn w-full flex items-center px-8 py-3.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'bg-white text-panelLight rounded-r-full' : 'text-white hover:bg-white/10 rounded-r-full'}`;
      } else {
        btn.className = `nav-btn w-full flex items-center px-8 py-3.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-[#FF5E3A]/20 to-transparent text-[#FF5E3A] border-l-2 border-[#FF5E3A]' : 'text-zinc-400 hover:text-white'}`;
      }
    });

    const sidebar = document.getElementById('sidebar');
    const logoText = document.getElementById('logo-text');
    
    // Hide all tabs first
    ['tab-home', 'tab-orders', 'tab-generic'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.add('hidden');
    });
    
    // Theme switching logic based on tab
    if (['orders', 'profile'].includes(tabId)) {
      sidebar.classList.remove('bg-panelDark');
      sidebar.classList.add('bg-panelLight');
      logoText.classList.remove('text-brand');
      logoText.classList.add('text-white');
    } else {
      sidebar.classList.add('bg-panelDark');
      sidebar.classList.remove('bg-panelLight');
      logoText.classList.add('text-brand');
      logoText.classList.remove('text-white');
    }

    if (tabId === 'home') {
      document.getElementById('tab-home').classList.remove('hidden');
    } else if (tabId === 'orders') {
      document.getElementById('tab-orders').classList.remove('hidden');
      this.renderOrders();
    } else if (tabId === 'wishlist') {
      // Re-use home layout but filter dishes
      document.getElementById('tab-home').classList.remove('hidden');
      this.renderWishlistOnly();
    } else {
      // Generic tab fallback
      const generic = document.getElementById('tab-generic');
      if(generic) {
         generic.classList.remove('hidden');
         generic.innerHTML = `
           <div class="flex-1 flex items-center justify-center bg-bgDark text-white w-full">
             <div class="text-center opacity-50">
               <i data-lucide="${this.tabs.find(t=>t.id===tabId).icon}" class="w-16 h-16 mx-auto mb-4 text-brand"></i>
               <h2 class="text-2xl font-bold mb-2 capitalize">${tabId}</h2>
               <p class="text-zinc-400 text-sm">Nothing to see here right now.</p>
             </div>
           </div>
         `;
         if (window.lucide) window.lucide.createIcons();
      }
    }
  },
  
  checkout() {
    if (this.cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderTotal = subtotal + 3.00;
    
    // Add to history
    this.orderHistory = this.orderHistory || [];
    this.orderHistory.unshift({
       date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
       time: 'Just now',
       price: orderTotal,
       fee: 3.00
    });
    
    // Clear cart
    this.cart = [];
    this.updateCart();
    
    // Switch to orders
    this.switchTab('orders');
  },
  
  renderOrders() {
    const tbody = document.getElementById('order-history-body');
    if (!tbody) return;
    
    const orders = this.orderHistory || [];
    
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-zinc-400">No previous orders found.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = orders.map(o => `
       <tr>
         <td class="py-4"><p class="font-bold text-zinc-800">${o.date}</p><p class="text-[10px] text-zinc-400">${o.time}</p></td>
         <td class="py-4 font-bold text-zinc-800">$${o.price.toFixed(2)}</td>
         <td class="py-4 font-bold text-zinc-800">$${o.fee.toFixed(2)}</td>
         <td class="py-4 text-right"><button class="px-3 py-1.5 rounded bg-brand text-white text-xs font-bold shadow-sm">Reorder</button></td>
       </tr>
    `).join('');
  },
  
  renderWishlistOnly() {
    const grid = document.getElementById('dishes-grid');
    if (!grid) return;
    const items = this.dishes.filter(d => this.wishlist.includes(d.id));
    if (items.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-10">Your wishlist is empty.</div>';
      return;
    }
    grid.innerHTML = items.map((d) => `
      <div class="bg-panelDark rounded-xl p-3 border border-white/5 flex flex-col hover:bg-white/5 transition-colors group">
        <div class="relative aspect-video rounded-lg overflow-hidden mb-3">
          <img src="${d.image}" alt="${d.name}" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <button class="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white" onclick="app.toggleWishlist('${d.id}')">
            <i data-lucide="heart" class="w-3 h-3 ${this.wishlist.includes(d.id) ? 'fill-white text-white' : ''}"></i>
          </button>
        </div>
        <h3 class="text-white font-semibold text-xs mb-1 line-clamp-1">${d.name}</h3>
        <div class="flex items-center justify-between mt-auto pt-2">
          <span class="text-white text-xs">$${d.price.toFixed(2)}</span>
          <button onclick="app.addToCart('${d.id}')" class="px-3 py-1.5 rounded bg-brand text-white text-[10px] font-bold">
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }
};

window.onload = () => app.init();
