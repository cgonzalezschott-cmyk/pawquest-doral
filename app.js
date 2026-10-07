/* Happy Hour (Doral) — all data stays in localStorage on this device. */
(() => {
'use strict';
const KEY = 'pawquest-doral:v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ic = (id, cls = '') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', {maximumFractionDigits: 2});
const pad = n => String(n).padStart(2, '0');
const dayStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dayStr(new Date());
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dayStr(d); };
const fmtDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}); };

/* ---------------- static content (from the design) ---------------- */
const LEVELS = [
  {n: 1, name: 'Rookie Walker',    min: 0,   next: 100, color: '#2fe36f', icon: 'backpack', cls: 'l1',
   items: ['Learn the basics', 'Get 3 founding dogs', 'Complete 10 walks']},
  {n: 2, name: 'Trusted Neighbor', min: 100, next: 300, color: '#3b8bff', icon: 'medal', cls: 'l2',
   items: ['5+ regular clients', 'Collect 5-star reviews', 'Build routine schedule']},
  {n: 3, name: 'Doral Walker',     min: 300, next: 700, color: '#a855f7', icon: 'crown', cls: 'l3',
   items: ['10+ active clients', 'Expand to Zone 2', 'Add drop-in visits', 'Branded shirt & gear']},
  {n: 4, name: 'Happy Hour Pro',   min: 700, next: null, color: '#ffc23a', icon: 'trophy', cls: 'l4',
   items: ['20+ active clients', 'Expand to wider Doral', 'Offer dog sitting & more', 'Formalize business (optional)'],
   itemIcons: ['dollar', 'foot', 'dollar', 'pencil']},
];
const SERVICES = [
  {id: 'founding30', name: '30 min Founding Walk', price: 15, icon: 'clock', badge: ['GREAT FOR STARTING', 'green'], kind: 'walk', min: 30},
  {id: 'std30', name: '30 min Standard Walk', price: 18, icon: 'clock', kind: 'walk', min: 30},
  {id: 'walk45', name: '45 min Walk', price: 24, icon: 'clock', kind: 'walk', min: 45},
  {id: 'walk60', name: '60 min Walk', price: 28, icon: 'clock', kind: 'walk', min: 60},
  {div: true},
  {id: 'pack5', name: '5-Walk Pack (save 5%)', price: 85, icon: 'tag', badge: ['POPULAR', 'blue'], kind: 'pack', credits: 5, min: 30},
  {id: 'pack10', name: '10-Walk Pack (save 10%)', price: 160, icon: 'tag', badge: ['BEST VALUE', 'blue'], kind: 'pack', credits: 10, min: 30},
  {div: true},
  {id: 'extra', name: 'Extra Dog (same home)', price: 5, display: '+ $5', icon: 'pawf', kind: 'addon'},
  {id: 'dropin', name: 'Drop-in Visit (feed, water, potty)', price: 15, icon: 'home', kind: 'visit', min: 20},
];
const SVC = Object.fromEntries(SERVICES.filter(s => s.id).map(s => [s.id, s]));
SVC.credit = {id: 'credit', name: 'Pack credit walk (prepaid)', price: 0, kind: 'walk', min: 30};

const MISSIONS = [
  {id: 'm1', title: 'Get 3 founding dogs', sub: 'Ask neighbors, friends, HOA group', xp: 100, icon: 'checkf', color: '#22c55e', prog: s => [foundingCount(s), 3]},
  {id: 'm2', title: 'Complete 10 walks', xp: 100, icon: 'pawf', color: '#f28c1b', bg: '#ffe6c7', prog: s => [s.walks.length, 10]},
  {id: 'm3', title: 'Collect 3 testimonials', sub: '(text or Google review)', xp: 75, icon: 'chat', color: '#fff', bg: '#2f80ed', prog: s => [s.reviews.filter(r => r.text && r.text.trim()).length, 3]},
  {id: 'm4', title: 'Ask 1 client for a referral', xp: 50, icon: 'userplus', color: '#2f80ed', prog: s => [s.clients.filter(c => c.referredBy).length, 1]},
  {id: 'm5', title: 'Post in neighborhood WhatsApp/HOA group', xp: 50, icon: 'wa', color: '#25d366'},
];
const SAFETY = [
  ['pawf', 'One dog at a time (initially)'],
  ['link', "Owner's leash/harness (or approved)"],
  ['cross', 'Emergency contact & vet info on file'],
  ['ban', 'No aggressive or reactive dogs'],
  ['thermo', 'Avoid extreme heat (walk early/late)'],
  ['drop', 'Water breaks for every walk'],
  ['camera', 'Photo update after every walk'],
];
const UNLOCKS = [
  {id: 'shirt', title: 'Branded<br>Shirt &amp; Gear', icon: 'shirt', lvl: 3, tip: 'A branded Happy Hour tee + leash bag makes you instantly recognizable in the lobby and the park.'},
  {id: 'qr', title: 'QR Flyers', sub: 'for your building', icon: 'qr', lvl: 1, tip: 'Print a modern flyer with a QR code (WhatsApp link or booking form). Ask management where you can post it: lobby, elevators, mail rooms.'},
  {id: 'gbp', title: 'Google<br>Business Profile', icon: 'google', lvl: 2, tip: 'Create a free Google Business Profile (service-area business, no public address) so happy clients can leave reviews.'},
  {id: 'sit', title: 'Pet Sitting', sub: '(drop-ins)', icon: 'home', lvl: 3, tip: 'Offer drop-in visits (feed, water, potty) for $15 — great for travel season.'},
  {id: 'holiday', title: 'Holiday<br>Pricing', icon: 'cal', lvl: 2, tip: 'Add a small holiday surcharge (e.g. +$5) for Thanksgiving, Christmas, New Year and spring break.'},
  {id: 'ins', title: 'Insurance &amp;<br>Registration', sub: '(later)', icon: 'shield', lvl: 4, tip: 'When you grow, look into pet-care liability insurance and registering the business (optional).'},
];
const MARKETING = [
  'Post in Céntrico & Doral neighborhood WhatsApp/HOA groups',
  'Modern flyer with QR code (lobby, elevators, mail rooms)',
  'Ask neighbors, friends and family to be your first clients',
  'Share before/after walk photos (with permission)',
  'Offer a Founding Client Discount ($15/walk)',
  'Collect testimonials and showcase them',
  'Offer referral rewards (e.g. $10 off for every new client)',
];
const GOALS = [
  {id: 'g1', name: 'Get 3 Founding Dogs', xp: 50, test: s => foundingCount(s) >= 3, hint: 'Mark 3 clients as Founding clients ($15/walk).'},
  {id: 'g2', name: 'Log 10 Walks', xp: 50, test: s => s.walks.length >= 10, hint: 'Log walks with the green paw button.'},
  {id: 'g3', name: 'Get 3 Reviews', xp: 50, test: s => s.reviews.length >= 3, hint: 'Ask happy owners for a quick review.'},
  {id: 'g4', name: 'Reach $500 Earnings', xp: 50, test: s => earnings(s) >= 500},
  {id: 'g5', name: '5 Active Clients', xp: 75, test: s => activeCount(s) >= 5},
  {id: 'g6', name: 'Log 50 Walks', xp: 75, test: s => s.walks.length >= 50},
  {id: 'g7', name: '10 Active Clients', xp: 100, test: s => activeCount(s) >= 10},
  {id: 'g8', name: 'Reach $2,500 Earnings', xp: 100, test: s => earnings(s) >= 2500},
  {id: 'g9', name: '20 Active Clients', xp: 150, test: s => activeCount(s) >= 20},
];
const XP = {walk: 10, client: 10, review: 10, marketing: 10};

/* ---------------- state ---------------- */
function seed() {
  const c1 = uid(), c2 = uid(), c3 = uid();
  const w = (ago, clientId, serviceId, amount) => ({id: uid(), date: daysAgo(ago), clientId, serviceId, extraDogs: 0, amount, xp: 0, photo: true, note: ''});
  return {
    v: 1, xp: 50, seeded: true,
    clients: [
      {id: c1, dog: 'Luna', breed: 'Golden Retriever', owner: 'Demo owner A', phone: '', address: 'Céntrico (demo)', zone: 1, emergency: 'Add emergency contact', vet: 'Add vet clinic & phone', schedule: 'Mon/Wed/Fri 7:00am', notes: 'Loves the park loop. Demo client — edit or delete.', founding: true, active: true, credits: 0, referredBy: ''},
      {id: c2, dog: 'Rocky', breed: 'French Bulldog', owner: 'Demo owner B', phone: '', address: 'Céntrico (demo)', zone: 1, emergency: 'Add emergency contact', vet: 'Add vet clinic & phone', schedule: 'Daily 6:30pm', notes: 'Short walks in the heat. Demo client.', founding: true, active: true, credits: 0, referredBy: ''},
      {id: c3, dog: 'Coco', breed: 'Maltipoo', owner: 'Demo owner C', phone: '', address: 'Céntrico (demo)', zone: 1, emergency: 'Add emergency contact', vet: 'Add vet clinic & phone', schedule: 'Tue/Thu 8:00am', notes: 'Bought a 5-walk pack. Demo client.', founding: true, active: true, credits: 3, referredBy: ''},
    ],
    // 9 walks over the last 5 days = $225 and a 5-day streak
    walks: [
      w(4, c1, 'founding30', 15), w(4, c2, 'founding30', 15),
      w(3, c3, 'pack5', 85), w(3, c1, 'walk60', 28),
      w(2, c2, 'founding30', 15), w(2, c3, 'credit', 0),
      w(1, c1, 'walk45', 24), w(1, c2, 'founding30', 15),
      w(0, c1, 'walk60', 28),
    ],
    reviews: [
      {id: uid(), name: "Luna's owner", rating: 5, text: 'Luna comes home happy and tired every time. Super reliable!', date: daysAgo(3)},
      {id: uid(), name: "Rocky's owner", rating: 5, text: 'Love the photo updates after every walk. Highly recommend!', date: daysAgo(1)},
    ],
    missions: {m1: true},
    marketing: {},
    goals: {},
    lastLevel: 1,
  };
}
function blank() { return {v: 1, xp: 0, clients: [], walks: [], reviews: [], missions: {}, marketing: {}, goals: {}, lastLevel: 1}; }
let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch { S = null; }
  if (!S || S.v !== 1) { S = seed(); save(); }
  for (const k of ['clients', 'walks', 'reviews']) S[k] ||= [];
  for (const k of ['missions', 'marketing', 'goals']) S[k] ||= {};
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('⚠️ Could not save (storage full?)'); } }

/* ---------------- derived ---------------- */
const earnings = s => s.walks.reduce((a, w) => a + (+w.amount || 0), 0);
const activeCount = s => s.clients.filter(c => c.active).length;
const foundingCount = s => s.clients.filter(c => c.founding).length;
function levelOf(xp) { let L = LEVELS[0]; for (const l of LEVELS) if (xp >= l.min) L = l; return L; }
function streak(s) {
  const days = new Set(s.walks.map(w => w.date));
  let n = 0, d = new Date();
  if (!days.has(dayStr(d))) d.setDate(d.getDate() - 1); // streak still alive if you walked yesterday
  while (days.has(dayStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function rating(s) { if (!s.reviews.length) return 0; return s.reviews.reduce((a, r) => a + r.rating, 0) / s.reviews.length; }
const clientById = id => S.clients.find(c => c.id === id);
function nextGoal() { return GOALS.find(g => !S.goals[g.id]); }

function growthDone(lvl, i) {
  const s = S, fiveStar = s.reviews.filter(r => r.rating === 5).length;
  const L = levelOf(s.xp).n;
  const map = {
    1: [s.walks.length > 0 || s.clients.length > 0, foundingCount(s) >= 3, s.walks.length >= 10],
    2: [activeCount(s) >= 5, fiveStar >= 5, s.clients.filter(c => c.schedule && c.active).length >= 3],
    3: [activeCount(s) >= 10, s.clients.some(c => +c.zone === 2), s.walks.some(w => w.serviceId === 'dropin'), L >= 3],
    4: [activeCount(s) >= 20, s.clients.some(c => +c.zone === 3), L >= 4, false],
  };
  return map[lvl][i];
}

/* ---------------- XP & levels ---------------- */
function addXP(n, why) {
  const before = levelOf(S.xp);
  S.xp = Math.max(0, S.xp + n);
  const after = levelOf(S.xp);
  save();
  if (n) toast(`<span class="xp">${n > 0 ? '+' : ''}${n} XP</span> ${esc(why || '')}`);
  if (after.n > before.n && after.n > (S.lastLevel || 1)) { S.lastLevel = after.n; save(); setTimeout(() => levelUp(after), 450); }
  else if (after.n < before.n) { S.lastLevel = after.n; save(); }
}
function levelUp(L) {
  const el = $('#levelUp');
  el.innerHTML = `<div class="lu-box" style="--c:${L.color}">${ic(L.icon)}<div class="big">LEVEL ${L.n}!</div><h3>${L.name}</h3>
    <p>You leveled up! ${L.n === 3 ? 'Zone 2 expansion, drop-ins & branded gear unlocked.' : L.n === 4 ? 'Zone 3 (Wider Doral) is now unlocked!' : 'New upgrades unlocked.'}</p>
    <button class="btn primary block" id="luOk">Let's go!</button></div>`;
  el.hidden = false;
  confetti(L.color);
  $('#luOk').onclick = () => { el.hidden = true; };
  if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
}
function confetti(main) {
  const colors = [main, '#2fe36f', '#3b8bff', '#ffc23a', '#a855f7', '#fff'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
    c.style.animationDelay = (Math.random() * .4) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

/* ---------------- render ---------------- */
function render() {
  const L = levelOf(S.xp);
  // level card
  const lc = $('#levelCard');
  lc.className = `card levelcard lvl${L.n}`;
  $('#lvlNum').textContent = L.n;
  $('#lvlTitle').textContent = `LEVEL ${L.n}`;
  $('#lvlRank').textContent = L.name;
  if (L.next) {
    $('#xpText').textContent = `${S.xp} / ${L.next} XP`;
    $('#xpFill').style.width = Math.min(100, (S.xp - L.min) / (L.next - L.min) * 100) + '%';
  } else {
    $('#xpText').textContent = `${S.xp} XP · MAX LEVEL`;
    $('#xpFill').style.width = '100%';
  }
  // stats
  $('#stEarn').textContent = Math.round(earnings(S)).toLocaleString('en-US');
  $('#stClients').textContent = activeCount(S);
  $('#stStreak').textContent = streak(S);
  const r = rating(S);
  $('#stRating').textContent = r ? r.toFixed(1) : '—';
  $('#stReviews').textContent = `(${S.reviews.length} review${S.reviews.length === 1 ? '' : 's'})`;
  // goal
  const g = nextGoal(), gc = $('#goalCard');
  const gi = $('.goal-info', gc);
  if (g) {
    const ready = g.test(S);
    gc.classList.toggle('ready', ready);
    gi.innerHTML = `<small>NEXT GOAL</small><span>${esc(g.name)}</span><b>+${g.xp} XP</b><em class="claim">Tap to claim!</em>`;
  } else {
    gc.classList.remove('ready');
    gi.innerHTML = `<small>ALL GOALS DONE</small><span>You're a Happy Hour legend</span><b>🏆</b>`;
  }
  // pricing
  $('#priceList').innerHTML = SERVICES.map(s => s.div ? '<li class="div" aria-hidden="true"></li>' :
    `<li data-svc="${s.id}" role="button" tabindex="0" title="Log a ${esc(s.name)}">${ic(s.icon)}<span class="pname">${esc(s.name)}</span><span class="pprice">${s.display || '$' + s.price}</span><span class="pbadge">${s.badge ? `<span class="badge ${s.badge[1]}">${s.badge[0]}</span>` : ''}</span></li>`).join('');
  // missions
  $('#missionList').innerHTML = MISSIONS.map(m => {
    const done = !!S.missions[m.id];
    const p = m.prog ? m.prog(S) : null;
    const ready = p && !done && p[0] >= p[1];
    const icon = done ? `<span class="mi" style="color:#22c55e">${ic('checkf')}</span>` :
      `<span class="mi" style="color:${m.color};${m.bg ? `background:${m.bg};` : ''}">${m.id === 'm1' ? ic('pawf') : ic(m.icon)}</span>`;
    const prog = p && !done ? `<span class="prog ${ready ? 'ready' : ''}">${ready ? 'Ready — tap to claim' : `${Math.min(p[0], p[1])}/${p[1]}`}</span>` : '';
    return `<li class="mission ${done ? 'done' : ''}" data-mission="${m.id}" role="button" tabindex="0" aria-pressed="${done}">
      ${icon}<span class="mt"><b>${esc(m.title)}</b>${m.sub ? `<small>${esc(m.sub)}</small>` : ''}${prog}</span>
      <span class="mx">+${m.xp} XP</span>${ic('chev', 'chev')}</li>`;
  }).join('');
  // safety
  $('#safetyList').innerHTML = SAFETY.map(([i, t]) => `<li>${ic(i)}<span>${esc(t)}</span></li>`).join('');
  // growth path
  $('#levelPath').innerHTML = LEVELS.map((l, idx) => {
    const cur = l.n === L.n, nxt = LEVELS[idx + 1];
    return `<div class="lvcard ${l.cls} ${cur ? 'current' : ''} ${l.n > L.n ? 'locked' : ''}" style="--c:${l.color};${nxt ? `--c2:${nxt.color}` : ''}">
      ${cur ? '<span class="you">YOU ARE HERE</span>' : ''}
      <div class="lvh">${ic(l.icon)}<div><small>LEVEL ${l.n}</small><b>${l.name}</b></div></div>
      <ul>${l.items.map((t, i) => {
        const d = growthDone(l.n, i);
        const icon = l.itemIcons ? l.itemIcons[i] : (d ? 'checkf' : 'check');
        return `<li class="${d ? 'done' : 'pending'}" title="${d ? 'Done' : 'Not yet'}">${ic(icon)}<span>${esc(t)}</span></li>`;
      }).join('')}</ul></div>`;
  }).join('');
  // unlocks
  $('#unlockGrid').innerHTML = UNLOCKS.map(u => `<button class="ut ${L.n >= u.lvl ? 'open' : ''}" data-unlock="${u.id}">${ic('lock', 'lk')}${ic(u.icon)}<span>${u.title}</span>${u.sub ? `<small>${u.sub}</small>` : ''}</button>`).join('');
  // marketing
  $('#mkList').innerHTML = MARKETING.map((t, i) => `<li class="${S.marketing[i] ? 'done' : ''}" data-mk="${i}" role="checkbox" aria-checked="${!!S.marketing[i]}" tabindex="0">${ic(S.marketing[i] ? 'checkf' : 'check')}<span>${esc(t)}</span></li>`).join('');
  // zones
  const z3 = L.n >= 4;
  $('.zones').classList.toggle('unlocked3', z3);
  $('#z3status').textContent = z3 ? '(Unlocked!)' : '(Later Unlock)';
  $('#z3chip').textContent = z3 ? 'Zone 3' : 'Zone 3 🔒';
}

/* ---------------- sheets ---------------- */
let sheetCloseCb = null;
function openSheet(title, html, mount) {
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheetWrap').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#sheetBody').scrollTop = 0;
  if (mount) mount($('#sheetBody'));
}
function closeSheet() {
  $('#sheetWrap').hidden = true; document.body.style.overflow = '';
  if (sheetCloseCb) { const f = sheetCloseCb; sheetCloseCb = null; f(); }
}
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2900);
}

/* --- log walk --- */
function logWalkSheet(pre = {}) {
  if (!S.clients.length) {
    openSheet('Log a Walk', `<p class="empty">Add your first client before logging a walk.</p><button class="btn primary block" id="goAdd">${ic('userplus')}Add a client</button>`,
      b => $('#goAdd', b).onclick = () => clientForm());
    return;
  }
  const svcOpts = SERVICES.filter(s => s.id && s.kind !== 'addon');
  const firstClient = pre.clientId || (S.clients.find(c => c.active) || S.clients[0]).id;
  openSheet('Log a Walk', `
    <form class="form" id="walkForm">
      <div class="field"><label>Client</label><select name="client">${S.clients.map(c => `<option value="${c.id}" ${c.id === firstClient ? 'selected' : ''}>${esc(c.dog)}${c.owner ? ' — ' + esc(c.owner) : ''}${c.active ? '' : ' (inactive)'}</option>`).join('')}</select></div>
      <div class="field"><label>Service</label><select name="service" id="svcSel"></select></div>
      <div class="two">
        <div class="field"><label>Extra dogs (same home, +$5 each)</label><input type="number" name="extra" min="0" max="5" value="0" inputmode="numeric"></div>
        <div class="field"><label>Date</label><input type="date" name="date" value="${today()}" max="${today()}"></div>
      </div>
      <div class="field"><label>Amount charged ($)</label><input type="number" name="amount" step="0.01" min="0" inputmode="decimal"></div>
      <label class="check"><input type="checkbox" name="photo" checked> Sent photo update to owner 📸</label>
      <div class="field"><label>Notes (optional)</label><textarea name="note" placeholder="Potty, mood, water, anything notable…"></textarea></div>
      <div class="summary"><div><small>This walk earns</small><b id="wSum">$15</b></div><div style="text-align:right"><small>Experience</small><b class="xp" style="color:var(--green)">+${XP.walk} XP</b></div></div>
      <button class="btn primary block" type="submit">${ic('pawf')}Log Walk</button>
    </form>`, b => {
    const f = $('#walkForm', b), sel = $('#svcSel', b);
    let manual = false;
    const fillServices = () => {
      const c = clientById(f.client.value);
      const opts = [...(c && c.credits > 0 ? [SVC.credit] : []), ...svcOpts];
      const want = pre.serviceId && opts.some(o => o.id === pre.serviceId) ? pre.serviceId : (c && c.credits > 0 ? 'credit' : (c && c.founding ? 'founding30' : 'std30'));
      sel.innerHTML = opts.map(o => `<option value="${o.id}" ${o.id === want ? 'selected' : ''}>${esc(o.id === 'credit' ? `Pack credit walk — ${c.credits} left ($0)` : `${o.name} — $${o.price}`)}</option>`).join('');
      pre.serviceId = null;
    };
    const calc = () => {
      const s = SVC[sel.value]; const extra = Math.max(0, +f.extra.value || 0);
      const amt = s.price + extra * 5;
      if (!manual) f.amount.value = amt;
      $('#wSum', b).textContent = money(+f.amount.value || 0);
    };
    fillServices(); calc();
    f.client.onchange = () => { fillServices(); manual = false; calc(); };
    sel.onchange = () => { manual = false; calc(); };
    f.extra.oninput = () => { manual = false; calc(); };
    f.amount.oninput = () => { manual = true; calc(); };
    f.onsubmit = e => {
      e.preventDefault();
      const c = clientById(f.client.value), s = SVC[sel.value];
      const walk = {id: uid(), date: f.date.value || today(), clientId: c.id, serviceId: s.id, extraDogs: Math.max(0, +f.extra.value || 0), amount: Math.max(0, +f.amount.value || 0), xp: XP.walk, photo: f.photo.checked, note: f.note.value.trim()};
      if (s.kind === 'pack') c.credits = (c.credits || 0) + s.credits - 1;
      if (s.id === 'credit') c.credits = Math.max(0, (c.credits || 0) - 1);
      S.walks.push(walk);
      const before = streak(S);
      save(); closeSheet();
      toast(`🐾 Walk logged for ${esc(c.dog)} · <span class="money">+${money(walk.amount)}</span>`);
      addXP(XP.walk, 'walk');
      render();
      const st = streak(S); if (st > before && st > 1) setTimeout(() => toast(`🔥 ${st}-day streak!`), 600);
    };
  });
}

/* --- clients --- */
function clientsSheet() {
  const rows = S.clients.slice().sort((a, b) => (b.active - a.active) || a.dog.localeCompare(b.dog)).map(c => {
    const walks = S.walks.filter(w => w.clientId === c.id).length;
    return `<div class="item" data-client="${c.id}" role="button" tabindex="0"><span class="av">${ic('dog')}</span>
      <span class="meta"><b>${esc(c.dog)}${c.founding ? '<span class="tagmini f">FOUNDING</span>' : ''}${c.credits ? `<span class="tagmini p">${c.credits} CREDITS</span>` : ''}${c.active ? '' : '<span class="tagmini i">INACTIVE</span>'}</b>
      <small>${esc([c.breed, c.owner].filter(Boolean).join(' · '))}</small><small>${walks} walk${walks === 1 ? '' : 's'} · Zone ${c.zone || 1}${c.schedule ? ' · ' + esc(c.schedule) : ''}</small></span>${ic('chev')}</div>`;
  }).join('');
  openSheet(`Clients (${activeCount(S)} active)`, `
    <div class="btn-row" style="margin-bottom:12px"><button class="btn primary" id="addClient" style="flex:1">${ic('userplus')}Add client</button></div>
    <div class="list">${rows || '<p class="empty">No clients yet. Add your first founding dog!</p>'}</div>`, b => {
    $('#addClient', b).onclick = () => clientForm();
    $$('[data-client]', b).forEach(el => el.onclick = () => clientDetail(el.dataset.client));
  });
}
function clientDetail(id) {
  const c = clientById(id); if (!c) return clientsSheet();
  const walks = S.walks.filter(w => w.clientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const total = walks.reduce((a, w) => a + w.amount, 0);
  openSheet(`${c.dog}`, `
    <dl class="kv">
      <dt>Breed</dt><dd>${esc(c.breed) || '—'}</dd>
      <dt>Owner</dt><dd>${esc(c.owner) || '—'}</dd>
      <dt>Phone</dt><dd>${c.phone ? `<a href="tel:${esc(c.phone)}" style="color:#8fc2ff">${esc(c.phone)}</a>` : '—'}</dd>
      <dt>Address</dt><dd>${esc(c.address) || '—'}</dd>
      <dt>Zone</dt><dd>Zone ${c.zone || 1}</dd>
      <dt>Emergency</dt><dd>${esc(c.emergency) || '—'}</dd>
      <dt>Vet</dt><dd>${esc(c.vet) || '—'}</dd>
      <dt>Schedule</dt><dd>${esc(c.schedule) || '—'}</dd>
      <dt>Pack credits</dt><dd>${c.credits || 0}</dd>
      <dt>Referred by</dt><dd>${esc(c.referredBy) || '—'}</dd>
      <dt>Notes</dt><dd>${esc(c.notes) || '—'}</dd>
      <dt>Status</dt><dd>${c.active ? 'Active' : 'Inactive'}${c.founding ? ' · Founding client' : ''}</dd>
      <dt>Lifetime</dt><dd>${walks.length} walks · ${money(total)}</dd>
    </dl>
    <div class="btn-row" style="margin:14px 0">
      <button class="btn primary" id="cLog" style="flex:1">${ic('pawf')}Log walk</button>
      <button class="btn" id="cEdit">${ic('pencil')}Edit</button>
      <button class="btn" id="cBack">Back</button>
    </div>
    <div class="list">${walks.slice(0, 20).map(walkRow).join('') || '<p class="empty">No walks yet.</p>'}</div>`, b => {
    $('#cLog', b).onclick = () => logWalkSheet({clientId: id});
    $('#cEdit', b).onclick = () => clientForm(id);
    $('#cBack', b).onclick = () => clientsSheet();
  });
}
function clientForm(id) {
  const c = id ? clientById(id) : {dog: '', breed: '', owner: '', phone: '', address: '', zone: 1, emergency: '', vet: '', schedule: '', notes: '', founding: foundingCount(S) < 3, active: true, credits: 0, referredBy: ''};
  const f = (name, label, ph = '', type = 'text') => `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(c[name])}" placeholder="${esc(ph)}"></div>`;
  openSheet(id ? `Edit ${c.dog}` : 'New Client', `
    <form class="form" id="cForm">
      <div class="two">${f('dog', "Dog's name *", 'e.g. Max')}${f('breed', 'Breed', 'e.g. Labrador')}</div>
      <div class="two">${f('owner', 'Owner name', 'First name')}${f('phone', 'Owner phone', '', 'tel')}</div>
      ${f('address', 'Address / unit', 'Building, tower, unit')}
      <div class="two">
        <div class="field"><label>Zone</label><select name="zone">${[1, 2, 3].map(z => `<option value="${z}" ${+c.zone === z ? 'selected' : ''}>Zone ${z} — ${['Céntrico', 'Downtown Doral & White Course Park', 'Wider Doral'][z - 1]}</option>`).join('')}</select></div>
        ${f('schedule', 'Schedule', 'e.g. Mon/Wed/Fri 7am')}
      </div>
      ${f('emergency', 'Emergency contact', 'Name & phone')}
      ${f('vet', 'Vet info', 'Clinic name & phone')}
      ${f('referredBy', 'Referred by (optional)', 'Which client referred them?')}
      <div class="field"><label>Pack credits remaining</label><input name="credits" type="number" min="0" value="${+c.credits || 0}" inputmode="numeric"></div>
      <div class="field"><label>Notes</label><textarea name="notes" placeholder="Temperament, allergies, leash/harness, door code reminders…">${esc(c.notes)}</textarea></div>
      <label class="check"><input type="checkbox" name="founding" ${c.founding ? 'checked' : ''}> Founding client ($15 founding walk rate)</label>
      <label class="check"><input type="checkbox" name="active" ${c.active ? 'checked' : ''}> Active client</label>
      <button class="btn primary block" type="submit">${ic('check')}${id ? 'Save changes' : 'Add client'}</button>
      ${id ? `<button class="btn danger block" type="button" id="cDel">${ic('trash')}Delete client</button>` : ''}
    </form>`, b => {
    const form = $('#cForm', b);
    form.onsubmit = e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (!d.dog.trim()) { form.dog.focus(); return; }
      const data = {dog: d.dog.trim(), breed: d.breed.trim(), owner: d.owner.trim(), phone: d.phone.trim(), address: d.address.trim(), zone: +d.zone, schedule: d.schedule.trim(), emergency: d.emergency.trim(), vet: d.vet.trim(), referredBy: d.referredBy.trim(), credits: Math.max(0, +d.credits || 0), notes: d.notes.trim(), founding: !!form.founding.checked, active: !!form.active.checked};
      if (id) { Object.assign(c, data); save(); toast(`✅ ${esc(c.dog)} updated`); clientDetail(id); render(); }
      else {
        const nc = {id: uid(), ...data}; S.clients.push(nc); save();
        toast(`🐶 Welcome, ${esc(nc.dog)}!`); addXP(XP.client, 'new client'); render(); clientDetail(nc.id);
      }
    };
    if (id) $('#cDel', b).onclick = () => {
      if (!confirm(`Delete ${c.dog}? Their past walks stay in your earnings history.`)) return;
      S.clients = S.clients.filter(x => x.id !== id); save(); render(); clientsSheet(); toast('Client deleted');
    };
  });
}

/* --- walk history --- */
function walkRow(w) {
  const c = clientById(w.clientId), s = SVC[w.serviceId] || {name: w.serviceId};
  return `<div class="item" data-walk="${w.id}"><span class="av" style="background:rgba(47,227,111,.15);color:var(--green)">${ic('pawf')}</span>
    <span class="meta"><b>${esc(c ? c.dog : 'Former client')}</b><small>${fmtDate(w.date)} · ${esc(s.name)}${w.extraDogs ? ` +${w.extraDogs} dog` : ''}${w.photo ? ' · 📸' : ''}</small>${w.note ? `<small>${esc(w.note)}</small>` : ''}</span>
    <span class="amt">${money(w.amount)}</span><button class="iconbtn" data-delwalk="${w.id}" aria-label="Delete walk">${ic('trash')}</button></div>`;
}
function historySheet() {
  const ws = S.walks.slice().sort((a, b) => b.date.localeCompare(a.date));
  const now = new Date(); const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const month = ws.filter(w => w.date.startsWith(monthKey)).reduce((a, w) => a + w.amount, 0);
  const week = ws.filter(w => w.date >= daysAgo(6)).reduce((a, w) => a + w.amount, 0);
  openSheet('Walks & Earnings', `
    <div class="statsbar card" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
      <div class="stat"><div><b>${money(earnings(S))}</b><small>All time</small></div></div>
      <div class="stat"><div><b>${money(week)}</b><small>Last 7 days</small></div></div>
      <div class="stat"><div><b>${ws.length}</b><small>Walks · 🔥 ${streak(S)} day streak</small></div></div>
    </div>
    <button class="btn primary block" id="hLog" style="margin-bottom:12px">${ic('plus')}Log a walk</button>
    <div class="list">${ws.map(walkRow).join('') || '<p class="empty">No walks yet — log your first one!</p>'}</div>
    <p class="note">This month: ${money(month)}. Deleting a walk removes its earnings and the ${XP.walk} XP it gave.</p>`, b => {
    $('#hLog', b).onclick = () => logWalkSheet();
    $$('[data-delwalk]', b).forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      const w = S.walks.find(x => x.id === btn.dataset.delwalk); if (!w || !confirm('Delete this walk?')) return;
      S.walks = S.walks.filter(x => x !== w);
      const c = clientById(w.clientId);
      if (c && w.serviceId === 'credit') c.credits = (c.credits || 0) + 1;
      if (c && SVC[w.serviceId]?.kind === 'pack') c.credits = Math.max(0, (c.credits || 0) - (SVC[w.serviceId].credits - 1));
      save(); if (w.xp) addXP(-w.xp, 'walk removed'); render(); historySheet();
    });
  });
}

/* --- reviews --- */
function reviewsSheet() {
  const list = S.reviews.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  openSheet(`Reviews · ${rating(S) ? rating(S).toFixed(1) : '—'} ★`, `
    <form class="form" id="rForm">
      <div class="field"><label>Rating</label><div class="stars" id="stars">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}" class="on" aria-label="${n} stars">★</button>`).join('')}</div></div>
      <div class="field"><label>From</label><input name="name" placeholder="e.g. Max's owner" list="clientNames"><datalist id="clientNames">${S.clients.map(c => `<option value="${esc(c.dog)}'s owner">`).join('')}</datalist></div>
      <div class="field"><label>Testimonial (optional — counts toward the testimonials mission)</label><textarea name="text" placeholder="What did they say?"></textarea></div>
      <button class="btn primary block" type="submit">${ic('star')}Add review (+${XP.review} XP)</button>
    </form>
    <div class="sep" style="margin:14px 0"></div>
    <div class="list">${list.map(r => `<div class="review"><div class="r1"><b>${esc(r.name || 'Client')}</b><span class="st">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div>
      ${r.text ? `<p>“${esc(r.text)}”</p>` : ''}<div class="r1" style="margin-top:6px"><small class="note">${r.date ? fmtDate(r.date) : ''}</small><button class="linkbtn" data-delrev="${r.id}" style="font-size:12px">Delete</button></div></div>`).join('') || '<p class="empty">No reviews yet.</p>'}</div>`, b => {
    let val = 5;
    const paint = () => $$('[data-star]', b).forEach(s => s.classList.toggle('on', +s.dataset.star <= val));
    $$('[data-star]', b).forEach(s => s.onclick = () => { val = +s.dataset.star; paint(); });
    $('#rForm', b).onsubmit = e => {
      e.preventDefault(); const f = e.target;
      S.reviews.push({id: uid(), name: f.name.value.trim() || 'Client', rating: val, text: f.text.value.trim(), date: today()});
      save(); addXP(XP.review, 'review'); render(); reviewsSheet();
    };
    $$('[data-delrev]', b).forEach(btn => btn.onclick = () => {
      if (!confirm('Delete this review?')) return;
      S.reviews = S.reviews.filter(r => r.id !== btn.dataset.delrev); save(); addXP(-XP.review, 'review removed'); render(); reviewsSheet();
    });
  });
}

/* --- missions / goals / levels / unlocks / zones --- */
function toggleMission(id) {
  const m = MISSIONS.find(x => x.id === id);
  if (S.missions[id]) {
    if (!confirm(`Un-check “${m.title}”? This removes ${m.xp} XP.`)) return;
    delete S.missions[id]; save(); addXP(-m.xp, 'mission un-checked');
  } else {
    const p = m.prog ? m.prog(S) : null;
    if (p && p[0] < p[1] && !confirm(`Progress is ${p[0]}/${p[1]}. Mark “${m.title}” complete anyway?`)) return;
    S.missions[id] = true; save(); addXP(m.xp, `mission: ${m.title}`);
  }
  render();
}
function goalSheet() {
  const g = nextGoal();
  if (!g) return openSheet('Goals', '<p class="empty">🏆 Every goal claimed. Amazing work!</p>');
  const ready = g.test(S);
  const upcoming = GOALS.filter(x => !S.goals[x.id] && x !== g).slice(0, 4);
  openSheet('Next Goal', `
    <div class="summary" style="margin-bottom:12px"><div><small>NEXT GOAL</small><b style="font-size:18px">${esc(g.name)}</b><small>${esc(g.hint || '')}</small></div><b style="color:var(--green)">+${g.xp} XP</b></div>
    ${ready ? `<button class="btn primary block" id="claim">${ic('trophy')}Claim +${g.xp} XP</button>` : `<p class="note">Not reached yet — keep going! You can still check your progress on the dashboard.</p>`}
    <div class="sep" style="margin:14px 0"></div><p class="note" style="margin:0 0 6px">Coming up:</p>
    ${upcoming.map(x => `<div class="lvrow">${ic(x.test(S) ? 'checkf' : 'trophy', 'gold')}<span style="flex:1">${esc(x.name)}</span><b style="color:var(--green)">+${x.xp} XP</b></div>`).join('')}`, b => {
    const c = $('#claim', b);
    if (c) c.onclick = () => { S.goals[g.id] = true; save(); closeSheet(); addXP(g.xp, `goal: ${g.name}`); render(); };
  });
}
function levelsSheet() {
  const L = levelOf(S.xp);
  openSheet('Levels & XP', `
    ${LEVELS.map(l => `<div class="lvrow"><svg style="width:30px;height:30px;color:${l.color}"><use href="#i-${l.icon}"/></svg>
      <span style="flex:1"><b>Level ${l.n} · ${l.name}</b><br><small class="note">${l.next ? `${l.min}–${l.next - 1} XP` : `${l.min}+ XP`}</small></span>${l.n === L.n ? '<b style="color:var(--green)">YOU</b>' : l.n < L.n ? ic('checkf', 'green') : ic('lock')}</div>`).join('')}
    <div class="sep" style="margin:12px 0"></div>
    <p class="note"><b>Earn XP:</b> missions (+50 to +100), next goals (+50 to +150), each walk +${XP.walk}, new client +${XP.client}, review +${XP.review}, each marketing idea done +${XP.marketing}.</p>
    <p class="note">You have <b>${S.xp} XP</b>.${L.next ? ` ${L.next - S.xp} XP to Level ${L.n + 1}.` : ' Max level reached!'}</p>`);
}
function unlockSheet(id) {
  const u = UNLOCKS.find(x => x.id === id), L = levelOf(S.xp), open = L.n >= u.lvl;
  openSheet(u.title.replace(/<br>/g, ' ').replace('&amp;', '&'), `
    <div class="summary" style="margin-bottom:12px;${open ? '' : 'background:rgba(255,194,58,.08);border-color:rgba(255,194,58,.4)'}"><div><small>${open ? 'UNLOCKED' : 'LOCKED'}</small><b style="font-size:17px">${open ? 'Ready to use' : `Unlocks at Level ${u.lvl} · ${LEVELS[u.lvl - 1].name}`}</b></div>${ic(open ? 'checkf' : 'lock', open ? 'green' : 'gold')}</div>
    <p class="note" style="font-size:14px">${u.tip}</p>`);
}
function zoneSheet(z) {
  const L = levelOf(S.xp);
  const info = {
    1: ['Zone 1 · Céntrico (Your HQ)', 'Your building and the immediate neighborhood. Start here: one dog at a time, founding clients, short walks to the park.', true],
    2: ['Zone 2 · Downtown Doral & White Course Park', 'Downtown Doral and Doral White Course Park — great for longer 45/60 min walks. Expand here around Level 3.', true],
    3: ['Zone 3 · Wider Doral', 'Wider Doral, including CityPlace and beyond. Unlocks at Level 4 (Happy Hour Pro).', L.n >= 4],
  }[z];
  const count = S.clients.filter(c => +c.zone === +z && c.active).length;
  openSheet(info[0], `<div class="summary" style="margin-bottom:12px"><div><small>${info[2] ? 'AVAILABLE' : 'LATER UNLOCK'}</small><b style="font-size:17px">${count} active client${count === 1 ? '' : 's'} here</b></div>${ic(info[2] ? 'pin' : 'lock', info[2] ? 'green' : 'gold')}</div>
    <p class="note" style="font-size:14px">${info[1]}</p>
    <a class="btn blue block" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(z == 1 ? 'Céntrico by Windsor, 8425 NW 41st St, Doral, FL' : z == 2 ? 'Downtown Doral, Florida' : 'Doral, Florida')}">${ic('map')}Open in Google Maps</a>`);
}

/* --- menu / settings --- */
function menuSheet() {
  openSheet('Menu', `
    <div class="list">
      <button class="item" data-go="clients"><span class="av">${ic('users')}</span><span class="meta"><b>Clients</b><small>Add, edit, emergency & vet info</small></span>${ic('chev')}</button>
      <button class="item" data-go="history"><span class="av">${ic('list')}</span><span class="meta"><b>Walks & earnings</b><small>History, weekly total, delete mistakes</small></span>${ic('chev')}</button>
      <button class="item" data-go="reviews"><span class="av">${ic('star')}</span><span class="meta"><b>Reviews</b><small>Add ratings & testimonials</small></span>${ic('chev')}</button>
      <button class="item" data-go="levels"><span class="av">${ic('award')}</span><span class="meta"><b>Levels & XP</b><small>How to level up</small></span>${ic('chev')}</button>
      <button class="item" data-go="install"><span class="av">${ic('spark')}</span><span class="meta"><b>Add to Home Screen</b><small>Install as an app, works offline</small></span>${ic('chev')}</button>
      <button class="item" data-go="credits"><span class="av">${ic('camera')}</span><span class="meta"><b>Photo credits</b><small>Free-license images used</small></span>${ic('chev')}</button>
    </div>
    <div class="sep" style="margin:14px 0"></div>
    <p class="note">Your data is saved only on this device (localStorage). Export a backup before switching phones.</p>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn sm" id="exp">Export backup</button>
      <label class="btn sm" style="cursor:pointer">Import backup<input type="file" id="imp" accept="application/json,.json" hidden></label>
    </div>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn sm" id="demo">Reset to demo data</button>
      <button class="btn sm danger" id="wipe">Start fresh (erase all)</button>
    </div>`, b => {
    $$('[data-go]', b).forEach(el => el.onclick = () => ACT[el.dataset.go]());
    $('#exp', b).onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], {type: 'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `happyhour-backup-${today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $('#imp', b).onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try { const d = JSON.parse(await file.text()); if (d.v !== 1 || !Array.isArray(d.walks)) throw 0; S = d; save(); render(); closeSheet(); toast('✅ Backup restored'); }
      catch { toast('⚠️ That file is not a Happy Hour backup'); }
    };
    $('#demo', b).onclick = () => { if (confirm('Replace everything with the demo data ($225, 3 clients, 50 XP)?')) { S = seed(); save(); render(); closeSheet(); toast('Demo data loaded'); } };
    $('#wipe', b).onclick = () => { if (confirm('Erase ALL clients, walks, reviews and XP and start from zero?')) { S = blank(); save(); render(); closeSheet(); toast('Fresh start — go get your first founding dog!'); } };
  });
}
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
function installSheet() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  openSheet('Add to Home Screen', standalone ? '<p class="empty">✅ Happy Hour is already installed on this device.</p>' : `
    ${deferredPrompt ? `<button class="btn primary block" id="inst" style="margin-bottom:12px">${ic('spark')}Install Happy Hour</button>` : ''}
    <p class="note" style="font-size:14px"><b>iPhone (Safari):</b> tap the Share button <b>⎋</b> → <b>Add to Home Screen</b> → Add.</p>
    <p class="note" style="font-size:14px"><b>Android (Chrome):</b> tap <b>⋮</b> → <b>Install app</b> (or <b>Add to Home screen</b>).</p>
    <p class="note">Once installed it opens full-screen and works offline.</p>`, b => {
    const i = $('#inst', b); if (i) i.onclick = async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; closeSheet(); };
  });
}
function creditsSheet() {
  openSheet('Photo credits', `<div class="note" style="font-size:13.5px;line-height:1.6">
    <p><b>Dog walker hero:</b> photo by Blue Bird on <a href="https://www.pexels.com/photo/a-young-woman-walking-a-group-of-dogs-in-a-park-7210524/" target="_blank" rel="noopener">Pexels</a> (Pexels License).</p>
    <p><b>Downtown Doral (HQ card):</b> “Downtown Doral, Florida” by Ven-Lib, <a href="https://commons.wikimedia.org/wiki/File:Downtown_Doral,_Florida.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> (cropped). Representative photo of the area near HQ, not the Céntrico building itself.</p>
    <p><b>Golden retriever:</b> photo by Weigner Luan on <a href="https://www.pexels.com/photo/close-up-shot-of-a-golden-retriever-7163497/" target="_blank" rel="noopener">Pexels</a> (Pexels License).</p>
    <p><b>Icons:</b> <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a> (ISC license); WhatsApp glyph from Simple Icons (CC0).</p>
    <p><b>Map:</b> Google Maps iframe embed centered on Céntrico by Windsor, Doral (no Maps API key required). Zone labels are Happy Hour UI overlays.</p></div>`);
}

const ACT = {
  logwalk: () => logWalkSheet(), clients: clientsSheet, history: historySheet, reviews: reviewsSheet,
  goal: () => { const g = nextGoal(); if (g && g.test(S)) goalSheet(); else goalSheet(); },
  levels: levelsSheet, menu: menuSheet, credits: creditsSheet, install: installSheet,
};

/* ---------------- events ---------------- */
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close]')) return closeSheet();
  const act = t.closest('[data-act]'); if (act) return ACT[act.dataset.act]?.();
  const svc = t.closest('[data-svc]');
  if (svc) { const s = SVC[svc.dataset.svc]; return logWalkSheet({serviceId: s.kind === 'addon' ? null : s.id}); }
  const mi = t.closest('[data-mission]'); if (mi) return toggleMission(mi.dataset.mission);
  const mk = t.closest('[data-mk]');
  if (mk) { const i = +mk.dataset.mk; if (S.marketing[i]) { delete S.marketing[i]; save(); addXP(-XP.marketing, 'idea un-checked'); } else { S.marketing[i] = true; save(); addXP(XP.marketing, 'marketing idea done'); } return render(); }
  const un = t.closest('[data-unlock]'); if (un) return unlockSheet(un.dataset.unlock);
  const z = t.closest('[data-zone]'); if (z) return zoneSheet(+z.dataset.zone);
  const nav = t.closest('[data-nav]');
  if (nav) {
    $$('.bottomnav button').forEach(b => b.classList.toggle('active', b === nav));
    const target = nav.dataset.nav === 'home' ? document.body : $('#' + nav.dataset.nav);
    if (target === document.body) window.scrollTo({top: 0, behavior: 'smooth'});
    else target.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#sheetWrap').hidden) closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"],[role="checkbox"]')) { e.preventDefault(); e.target.click(); }
});

load();
render();
if (new URLSearchParams(location.search).get('action') === 'logwalk') setTimeout(() => logWalkSheet(), 300);
// keep streak etc. fresh when the app comes back to the foreground on a new day
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// show the floating Log Walk button on desktop once the hero scrolls away
if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => $('.desk-fab').classList.toggle('show', !e.isIntersecting), {threshold: .15}).observe($('.hero'));
window.HappyHour = window.PawQuest = {get state() { return S; }, render};
})();
