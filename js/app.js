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
      if (tabId === 'orders') {
        // Light theme nav
        btn.className = `nav-btn w-full flex items-center px-8 py-3.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'bg-white text-panelLight rounded-r-full' : 'text-white hover:bg-white/10 rounded-r-full'}`;
      } else {
        // Dark theme nav
        btn.className = `nav-btn w-full flex items-center px-8 py-3.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-[#FF5E3A]/20 to-transparent text-[#FF5E3A] border-l-2 border-[#FF5E3A]' : 'text-zinc-400 hover:text-white'}`;
      }
    });

    const sidebar = document.getElementById('sidebar');
    const logoText = document.getElementById('logo-text');
    
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-orders').classList.add('hidden');
    
    if (tabId === 'orders') {
      sidebar.classList.remove('bg-panelDark');
      sidebar.classList.add('bg-panelLight');
      logoText.classList.remove('text-brand');
      logoText.classList.add('text-white');
      document.getElementById('tab-orders').classList.remove('hidden');
    } else {
      sidebar.classList.add('bg-panelDark');
      sidebar.classList.remove('bg-panelLight');
      logoText.classList.add('text-brand');
      logoText.classList.remove('text-white');
      document.getElementById('tab-home').classList.remove('hidden');
    }
  }
};

window.onload = () => app.init();
