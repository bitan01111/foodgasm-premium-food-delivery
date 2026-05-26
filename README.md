# Foodgasm 🍔 — Food Delivery SPA (Supabase)

A clean, recruiter-friendly **vanilla JavaScript** single-page food delivery frontend with **Supabase** authentication/data and **PWA** support.

🌐 **Live demo:** https://foodie-gasm.netlify.app/


---

## ✨ Highlights

- Responsive landing + restaurant browsing
- Menu & food detail modal
- Search with filters + recent searches
- Cart & wishlist (local storage)
- Checkout UI (COD + Razorpay)
- Orders history + live tracking UI
- Profile/settings (theme, language, currency)
- Admin dashboard widgets
- **PWA**: `manifest.json` + `sw.js`

---

## 🧰 Tech Stack

- Frontend: Vanilla JS / HTML / CSS (no framework)
- Backend/Auth/DB: **Supabase REST + Auth**
- PWA: Service Worker (`sw.js`)
- Payments UI: Razorpay checkout script

---

## 🗂 Project Structure

```text
.
├── index.html
├── manifest.json
├── sw.js
└── assets/
    ├── css/
    └── js/
        ├── config.js
        └── app.js
```

---

## 🔧 Configuration (no secrets committed)

`assets/js/config.js` reads Supabase settings from `window.ENV`.

```html
<script>
  window.ENV = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
  };
</script>
```

---

## 🚀 Deployment

This is a static SPA.

- Serve `index.html` for unknown routes (SPA fallback)
- Publish: `index.html`, `/assets/*`, `manifest.json`, `sw.js`

---

## Notes

- Uses Supabase session validation via `GET /auth/v1/user`.
- Recommended: configure Supabase schema + **RLS** policies to match the app tables.



