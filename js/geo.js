// ============================================================
// 📍 Foodgasm 2.0: Smart Geolocation & Indian Cities Radar
// ============================================================

const INDIAN_CITIES = [
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Mumbai', lat: 18.9220, lng: 72.8347, state: 'Maharashtra' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' }
];

let currentLocation = JSON.parse(localStorage.getItem('fg_user_location') || 'null') || {
  type: 'city',
  name: 'Park Street, Kolkata',
  city: 'Kolkata',
  lat: 22.5519,
  lng: 88.3526
};

// Detect real GPS location
async function detectGpsLocation() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let displayName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        let detectedCity = 'Kolkata';

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const suburb = addr.suburb || addr.neighbourhood || addr.road || '';
            detectedCity = addr.city || addr.state_district || addr.state || 'Kolkata';
            displayName = suburb ? `${suburb}, ${detectedCity}` : detectedCity;
          }
        } catch (e) {
          console.warn('[Geo] Reverse geocode fallback:', e);
        }

        const loc = {
          type: 'gps',
          name: displayName,
          city: detectedCity,
          lat: latitude,
          lng: longitude
        };
        setLocation(loc);
        resolve(loc);
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.max(0.4, Math.round(d * 10) / 10);
}

function updateRestaurantDistances(userLat, userLng) {
  if (!userLat || !userLng || typeof RESTAURANTS === 'undefined') return;
  RESTAURANTS.forEach(r => {
    if (r.lat && r.lng) {
      const d = calculateDistanceKm(userLat, userLng, r.lat, r.lng);
      r.distance_km = d;
      if (d < 35) {
        r.distance = `${d} km`;
        const minT = Math.max(15, Math.round(10 + d * 3));
        const maxT = Math.max(25, Math.round(minT + 10));
        r.deliveryTime = `${minT}-${maxT}`;
        r.deliveryFee = d > 8 ? 40 : d > 4 ? 20 : 0;
      } else {
        r.distance = `${d} km (${r.city})`;
        r.deliveryTime = '35-50';
      }
    }
  });
}

function setLocation(loc) {
  currentLocation = loc;
  localStorage.setItem('fg_user_location', JSON.stringify(loc));

  const cityEl = document.getElementById('location-city');
  if (cityEl) {
    cityEl.textContent = loc.name || loc.city;
  }

  // Recalculate distances from user coordinates
  if (loc.lat && loc.lng) {
    updateRestaurantDistances(loc.lat, loc.lng);
  }

  if (typeof STATE !== 'undefined') {
    STATE.location = loc.city || loc.name;
    localStorage.setItem('fg_location', STATE.location);
    if (typeof renderHomeRestaurants === 'function') renderHomeRestaurants();
    if (typeof renderHomeFoods === 'function') renderHomeFoods();
    if (typeof renderRestaurantsList === 'function' && STATE.currentPage === 'restaurants') renderRestaurantsList();
  }

  if (typeof window.onLocationChange === 'function') {
    window.onLocationChange(loc);
  }
}

function selectCity(cityName) {
  const city = INDIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase()) || INDIAN_CITIES[0];
  setLocation({
    type: 'city',
    name: city.name,
    city: city.name,
    lat: city.lat,
    lng: city.lng
  });
}

function selectSavedAddress(type) {
  if (type === 'home') {
    setLocation({
      type: 'home',
      name: 'Home (Park Street, Kolkata)',
      city: 'Kolkata',
      lat: 22.5519,
      lng: 88.3526
    });
  } else if (type === 'office') {
    setLocation({
      type: 'office',
      name: 'Office (Sector V, Salt Lake)',
      city: 'Kolkata',
      lat: 22.5802,
      lng: 88.4354
    });
  }
}

// Initial calculation on load
if (currentLocation && currentLocation.lat && currentLocation.lng) {
  setTimeout(() => {
    updateRestaurantDistances(currentLocation.lat, currentLocation.lng);
  }, 100);
}

window.GEO = {
  cities: INDIAN_CITIES,
  get current() { return currentLocation; },
  detectGpsLocation,
  setLocation,
  selectCity,
  selectSavedAddress,
  calculateDistanceKm,
  updateRestaurantDistances
};
