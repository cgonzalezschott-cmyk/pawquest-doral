# PawQuest Doral 🐾

Gamified dog-walking business dashboard — **Walk • Play • Happy Dogs • Stronger Neighbors**.
A mobile-first, installable PWA (plain HTML/CSS/JS, no build step, no backend).

## Features
- Dashboard matching the PawQuest Doral design: HQ, service zones, level/XP, stats, pricing, missions, safety rules, growth path, unlocks, marketing ideas.
- **Log a walk** (client + service from the price list, extra dogs, date, notes) → earnings, walk count, streak and +10 XP update automatically. Pack sales add prepaid credits.
- **Clients**: add / edit / delete (dog, breed, owner, phone, address, zone, emergency contact, vet, schedule, referral, pack credits, founding/active).
- **Missions** & **Next Goals** to claim XP; **4 levels** (Rookie Walker 0–99 XP, Trusted Neighbor 100–299, Doral Walker 300–699, PawQuest Pro 700+). Level-ups unlock upgrades and Zone 3.
- **Reviews** with star ratings & testimonials; **marketing checklist** (+10 XP each).
- Data lives in `localStorage` on the device. Export/import backup, reset to demo data, or start fresh from the menu.
- Works offline (service worker) and can be added to the home screen.

## Run locally
Any static server works, e.g. `python3 -m http.server 8080` then open http://localhost:8080.

## Deploy
Upload the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages…). All paths are relative, so it works from a sub-path like `https://<user>.github.io/pawquest-doral/`.

## Credits
- Hero photo: Sarah O'Shea on Pexels (Pexels License) — https://www.pexels.com/photo/26839567/
- “Downtown Doral, Florida” by Ven-Lib, Wikimedia Commons, CC BY-SA 4.0 (cropped) — https://commons.wikimedia.org/wiki/File:Downtown_Doral,_Florida.jpg
- “Golden Retriever medium-to-light-coat” by Morphdog, Wikimedia Commons, CC BY-SA 4.0 (resized) — https://commons.wikimedia.org/wiki/File:Golden_Retriever_medium-to-light-coat.jpg
- Icons: Lucide (ISC); WhatsApp glyph from Simple Icons (CC0).
