// config.js
// This file intentionally does NOT include secrets.
// Supabase URL + keys should be provided via environment injection at deploy time.

(function () {
  const defaults = {
    APP_NAME: 'Foodgasm',
    DELIVERY_FEE: 49,
    TAX_RATE: 0.05,
  };

  // Option 1 (preferred): deploy tooling injects window.ENV
  // Option 2: Vercel/Netlify set <meta> tags — we still support window.ENV only to keep things simple.
  const env = (typeof window !== 'undefined' && window.ENV) ? window.ENV : {};

  window.CONFIG = {
    ...defaults,
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',
  };

  if (!window.CONFIG.SUPABASE_URL || !window.CONFIG.SUPABASE_ANON_KEY) {
    // Not throwing hard — lets local dev load UI without auth.
    console.warn('[config] Missing Supabase environment values. Auth features will be disabled.');
  }
})();

