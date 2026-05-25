# Foodgasm (Recruiter-Ready) — TODO

## Plan summary
Refactor the existing single-file `foodgasm_fixed.html` into a clean, recruiter-friendly GitHub project while preserving UI, animations, branding, and functionality.

## Steps
- [x] 1) Create professional repo structure (index.html, assets/css, assets/js, database, config, PWA files)
- [x] 2) Extract CSS from `foodgasm_fixed.html` into `assets/css/globals.css` and supporting CSS files
- [x] 3) Extract JS into `assets/js/app.js` + feature modules (auth, wishlist, cart, orders, ui, storage, search, config)
- [x] 4) Replace inline secrets with an env/config approach (no hardcoded Supabase keys in code)
- [ ] 5) Update HTML to load extracted CSS/JS + wire existing functions/IDs
- [ ] 6) Add `manifest.json`, `sw.js`, and basic offline fallback
- [x] 7) Add recruiter README.md (features, auth flow, setup, deployment)
- [ ] 8) Add Supabase schema SQL migration + RLS policies + setup guide
- [ ] 9) Add `.gitignore` + MIT `LICENSE`
- [ ] 10) Add deployment configs: `vercel.json` + `netlify.toml` (if needed) + GitHub Pages note
- [ ] 11) Run quick local validation: build references (file paths), ensure no missing functions
- [ ] 12) Final recruiter audit checklist

