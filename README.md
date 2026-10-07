# Happy Hour · Doral 🐾

Gamified dog-walking business dashboard — **Walk • Play • Happy Hour**.
A mobile-first, installable PWA (plain HTML/CSS/JS, no build step, no backend).
HQ: **Céntrico by Windsor, Doral**.

## Features
- Dashboard: HQ, Google Maps service zones, level/XP, stats, pricing, missions, safety rules, growth path, unlocks, marketing ideas.
- **Log a walk** (client + service from the price list, extra dogs, date, notes) → earnings, walk count, streak and +10 XP update automatically. Pack sales add prepaid credits.
- **Clients**: add / edit / delete (dog, breed, owner, phone, address, zone, emergency contact, vet, schedule, referral, pack credits, founding/active).
- **Missions** & **Next Goals** to claim XP; **4 levels** (Rookie Walker 0–99 XP, Trusted Neighbor 100–299, Doral Walker 300–699, Happy Hour Pro 700+). Level-ups unlock upgrades and Zone 3.
- **Reviews** with star ratings & testimonials; **marketing checklist** (+10 XP each).
- Data lives in `localStorage` on the device. Export/import backup, reset to demo data, or start fresh from the menu.
- Works offline (service worker) and can be added to the home screen.
- **Service zones map**: Google Maps iframe embed (no API key) pinned on Céntrico HQ, with Zone 1/2/3 legend overlays. Zone 3 unlocks at Level 4.

## Run locally
Any static server works, e.g. `python3 -m http.server 8080` then open http://localhost:8080.

## Deploy
Upload the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages…). All paths are relative, so it works from a sub-path like `https://<user>.github.io/pawquest-doral/`.

## Credits
- Hero photo: Blue Bird on Pexels (Pexels License) — https://www.pexels.com/photo/7210524/
- “Downtown Doral, Florida” by Ven-Lib, Wikimedia Commons, CC BY-SA 4.0 (cropped) — https://commons.wikimedia.org/wiki/File:Downtown_Doral,_Florida.jpg
- Golden retriever: Weigner Luan on Pexels (Pexels License) — https://www.pexels.com/photo/7163497/
- Map: Google Maps embed (iframe, no API key) for Céntrico by Windsor, Doral.
- Icons: Lucide (ISC); WhatsApp glyph from Simple Icons (CC0).
