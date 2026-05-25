# Foodgasm — Premium Food Delivery (Supabase)

Foodgasm is a premium, recruiter-friendly, production-style food delivery frontend built with **HTML/CSS/JavaScript** and a **Supabase** backend for auth + data.

> This project started as a single-file prototype (`foodgasm_fixed.html`) and has been refactored into a maintainable structure while preserving the original UI, animations, and features.

## Features

- Cinematic landing + category matrix
- Trending feed + restaurant grid
- Menu browsing + food detail modal
- Smart search + recent searches
- Wishlist + Cart (local state)
- Checkout flow + payment integration UI
- Orders history + live order tracking (modal UI)
- Auth (Supabase email/password + OAuth) with session refresh
- Profile + Settings (theme, language, currency)
- Admin dashboard widgets (charts)
- PWA basics (manifest + service worker)

## Tech Stack

- Frontend: **HTML + CSS + JavaScript** (vanilla)
- Backend/Auth/DB: **Supabase** (REST + Auth endpoints)
- PWA: Service Worker (`sw.js`)
- Charts: Chart.js (loaded by app)

## Architecture (simple + maintainable)

- `index.html`
  - Page markup + IDs used by the app
  - Loads CSS + JS bundles
- `assets/css/*`
  - Style sheets split by purpose (globals/components/auth/responsive/animations)
- `assets/js/*`
  - `assets/js/config.js` provides runtime config (no secrets)
  - `assets/js/app.js` bootstraps the app
  - `assets/js/modules/*` (in progress) holds feature logic

## Authentication Flow (Supabase)

1. User logs in with Supabase Auth REST endpoint.
2. Access + refresh tokens are stored in `localStorage`.
3. Session is validated via `GET /auth/v1/user` (prevents RLS logout edge cases).
4. Tokens refresh using `grant_type=refresh_token`.
5. Auth headers use the refreshed access token.

## Environment Variables / Runtime Config

This repo avoids hardcoding Supabase secrets.

### Option A (recommended): runtime injection
Set `window.ENV` at deploy time so `assets/js/config.js` can read:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Example (platform-specific):
```html
<script>
  window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
  };
</script>
```

## Supabase Database Setup

See `database/` for:
- schema migration SQL
- RLS policies
- setup guide

> Note: the SQL files will be added in the next extraction pass.

## Folder Structure

```text
foodgasm/
  index.html
  README.md
  manifest.json
  sw.js
  .gitignore
  LICENSE

  assets/
    css/
      globals.css
      components.css
      auth.css
      responsive.css
      animations.css
    js/
      config.js
      app.js
      modules/
        init.js

  database/
    supabase-schema.sql
    rls-policies.sql
    setup-guide.md
```

## Deployment

### Vercel
- Uses SPA rewrite to `index.html` via `vercel.json`.

### Netlify
- Add a publish rule + SPA fallback to `index.html`.

### GitHub Pages
- GitHub Pages works if you only serve static assets; use rewrite rules if needed.

## Accessibility Notes

- Skip link (`Skip to main content`)
- Focus-visible outlines
- `aria-live` for toasts
- Modal dialogs use `role="dialog"` and `aria-modal`

## Challenges Solved

- Avoided Supabase auth/session edge case by validating session using `GET /auth/v1/user`.
- Token refresh is wrapped in safe try/catch and clears session on failure.

## Future Improvements

- Finish JS extraction into feature modules (auth/cart/wishlist/orders)
- Add complete Supabase schema + RLS SQL files
- Add real PWA offline fallback routes and icon assets

---

## Push Commands (example)

```bash
git init
git add .
git commit -m "Refactor Foodgasm into recruiter-ready structure"
git branch -M main
git remote add origin https://github.com/bitan01111/foodgasm-premium-food-delivery.git
git push -u origin main
```

