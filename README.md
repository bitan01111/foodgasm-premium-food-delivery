# Foodgasm — Food Delivery Frontend (Supabase)

Foodgasm is a single-page food delivery frontend built with **HTML/CSS/JavaScript** and powered by **Supabase** for authentication and data.

## What’s included

- Landing page UI with categories, trending, and restaurant browsing
- Menu browsing and food detail modal
- Search with filters and recent searches
- Cart + wishlist (stored locally, optionally synced)
- Checkout flow (COD + Razorpay UI)
- Orders history with live tracking UI
- Profile + settings (theme/language/currency)
- Admin dashboard widgets
- PWA support (manifest + `sw.js`)

## Technologies

- Frontend: Vanilla JS (no framework)
- Backend/Auth/DB: Supabase REST + Auth endpoints
- PWA: Service Worker (`sw.js`)
- Payments UI: Razorpay checkout script

## Runtime configuration (no secrets in repo)

`assets/js/config.js` reads Supabase values from `window.ENV`.

Deploy-time example:

```html
<script>
  window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
  };
</script>
```

## Deployment

This app is a static SPA.

- Ensure your hosting platform serves `index.html` for unknown routes (SPA fallback).
- Publish `index.html`, `/assets/*`, `manifest.json`, and `sw.js`.



## Project structure

```text
.
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── css/
│   └── js/
│       ├── config.js
│       └── app.js
└── (other static files)
```

## Notes

- Authentication uses Supabase token refresh and validates the session via `GET /auth/v1/user`.
- For best results, configure Supabase schema + RLS policies to match the app tables.


