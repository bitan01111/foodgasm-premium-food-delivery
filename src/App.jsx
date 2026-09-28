import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame, Search, MapPin, Bell, Heart, ShoppingCart,
  Settings, User, Compass, ListOrdered, Truck, Menu, X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(res => res.json())
      .then(data => {
        const items = (data.data || []).map(r => ({
          id: r.id,
          name: r.name,
          price: r.avg_cost_for_two ? r.avg_cost_for_two / 40 : 15.5,
          rating: r.rating || 4.5,
          reviews: r.reviews_count || 100,
          prepTime: r.delivery_time ? r.delivery_time + ' min' : '20 min',
          image: r.img || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
          badge: r.badge || 'Popular'
        }));
        setDishes(items.length ? items : getDefaultDishes());
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch from backend:', err);
        setDishes(getDefaultDishes());
        setLoading(false);
      });
  }, []);

  function getDefaultDishes() {
    return [
      { id: '1', name: 'Gourmet Wagyu Burger', price: 14.50, rating: 4.9, reviews: 342, prepTime: '20 min', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', badge: 'Signature' },
      { id: '2', name: 'Seafood Paella', price: 23.60, rating: 4.8, reviews: 218, prepTime: '30 min', image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=400&q=80', badge: 'Popular' },
      { id: '3', name: 'Truffle Pasta', price: 18.50, rating: 4.95, reviews: 489, prepTime: '15 min', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80', badge: 'Michelin' }
    ];
  }

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const handleAddToCart = (dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (dishId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === dishId) {
        const nextQuantity = item.quantity + delta;
        return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const toggleWishlist = (dishId) => {
    setWishlist(prev => prev.includes(dishId) ? prev.filter(id => id !== dishId) : [...prev, dishId]);
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const deliveryFee = subtotal > 0 ? 3.00 : 0;
  const grandTotal = subtotal + deliveryFee;

  const renderSidebar = (isLight = false) => {
    const bgClass = isLight ? 'bg-[#185A6B]' : 'bg-[#16191E] border-r border-white/5';
    const textClass = isLight ? 'text-white/70' : 'text-zinc-400';
    const activeClass = isLight ? 'bg-white/20 text-white font-bold' : 'bg-gradient-to-r from-[#FF5E3A]/20 to-transparent text-[#FF5E3A] border-l-2 border-[#FF5E3A] font-bold';

    return (
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static flex flex-col justify-between py-6 transition-transform duration-300 ${bgClass}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between px-8">
            <span className={`font-black text-2xl tracking-tight cursor-pointer ${isLight ? 'text-white' : 'text-[#FF5E3A]'}`} onClick={() => setActiveTab('home')}>
              Foodgasm
            </span>
            <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'home', label: 'Home', icon: Compass },
              { id: 'browse', label: 'Browse', icon: ListOrdered },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'orders', label: 'Orders', icon: Truck },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center px-8 py-3.5 text-sm transition-all duration-200 ${activeTab === tab.id ? activeClass : `${textClass} hover:text-white`}`}
              >
                <tab.icon className="w-5 h-5 mr-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    );
  };

  const renderHome = () => (
    <div className="flex flex-1 overflow-hidden bg-[#1D2128]">
      {renderSidebar(false)}
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-y-auto w-full relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6 sticky top-0 bg-[#1D2128]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#16191E] text-white border border-white/5 focus:outline-none focus:border-[#FF5E3A]/50 text-sm"
              />
            </div>
          </div>
          <button className="xl:hidden ml-4 relative text-white" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#FF5E3A] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
          </button>
        </header>

        <div className="px-4 lg:px-8 pb-8 space-y-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1412] to-[#2A1612] border border-white/10 p-6 lg:p-8 flex items-center justify-center min-h-[180px] lg:min-h-[220px]">
            <div className="text-center space-y-4 relative z-10">
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E3A] to-[#FFA726] tracking-widest">
                FOODGASM
              </h1>
              <p className="text-white tracking-widest text-xs lg:text-sm font-semibold">— PREMIUM FOOD DELIVERY —</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {loading ? (
               <div className="col-span-full text-center text-white py-12 animate-pulse">Loading menu...</div>
            ) : dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(dish => (
              <div key={dish.id} className="bg-[#16191E] rounded-2xl p-4 border border-white/5 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  <button onClick={() => toggleWishlist(dish.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:text-[#FF5E3A] transition-colors">
                    <Heart className={`w-4 h-4 ${wishlist.includes(dish.id) ? 'fill-[#FF5E3A] text-[#FF5E3A]' : ''}`} />
                  </button>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-md uppercase">{dish.badge}</span>
                </div>
                <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{dish.name}</h3>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-white font-bold text-lg">${dish.price.toFixed(2)}</span>
                  <button 
                    onClick={() => handleAddToCart(dish)}
                    className="px-4 py-2 rounded-lg bg-[#FF5E3A] text-white text-xs font-bold hover:bg-[#e04e2c] transition-colors flex items-center shadow-lg shadow-[#FF5E3A]/20"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Overlay for Mobile */}
      {cartOpen && <div className="fixed inset-0 bg-black/50 z-40 xl:hidden" onClick={() => setCartOpen(false)} />}

      {/* Right Sidebar (Cart) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 transform ${cartOpen ? 'translate-x-0' : 'translate-x-full'} xl:translate-x-0 xl:static flex-shrink-0 bg-[#16191E] border-l border-white/5 flex flex-col transition-transform duration-300`}>
        <div className="px-6 py-6 flex items-center justify-between xl:justify-end space-x-4 border-b border-white/5">
          <button className="xl:hidden text-white" onClick={() => setCartOpen(false)}><X className="w-5 h-5" /></button>
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-zinc-400" />
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FF5E3A]">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="User" />
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0">
          <h3 className="text-white font-bold text-lg mb-6">Smart Cart</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 && <p className="text-zinc-500 text-sm">Your cart is empty.</p>}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-xs font-bold truncate">{item.name}</h4>
                  <p className="text-[#FF5E3A] font-bold text-xs">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-[#1D2128] rounded-lg border border-white/5 text-white text-xs flex-shrink-0">
                  <button onClick={() => handleUpdateQuantity(item.id, -1)} className="px-2 py-1 hover:text-[#FF5E3A]">-</button>
                  <span className="px-1">{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, 1)} className="px-2 py-1 hover:text-[#FF5E3A]">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 space-y-2 text-sm flex-shrink-0">
            <div className="flex justify-between text-zinc-400 text-xs"><span>Subtotal</span><span className="text-white font-bold">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-zinc-400 text-xs"><span>Delivery Fee</span><span className="text-white font-bold">${deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between text-white font-bold text-lg pt-2"><span>Total</span><span className="text-[#FF5E3A]">${grandTotal.toFixed(2)}</span></div>
            <button className="w-full mt-4 py-3 rounded-xl bg-[#FF5E3A] text-white font-bold text-sm hover:bg-[#e04e2c] transition-colors">
              PROCEED TO ORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex font-sans selection:bg-[#FF5E3A] selection:text-white">
      {activeTab === 'home' ? renderHome() : (
        <div className="flex flex-1 items-center justify-center bg-[#1D2128] text-white flex-col gap-4">
           {renderSidebar(false)}
           <div className="flex-1 flex items-center justify-center flex-col">
              <h2 className="text-2xl font-bold">This section is under construction.</h2>
              <button onClick={() => setActiveTab('home')} className="mt-4 px-6 py-2 bg-[#FF5E3A] rounded-lg font-bold">Go Back Home</button>
           </div>
        </div>
      )}
    </div>
  );
}
