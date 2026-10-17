/* درب التجّار v0.2 — الواجهة: سبع شاشات بحالة واحدة مشتركة وتوجيه بالـ hash */
(function () {
'use strict';
const E = Engine, A = E.A, GD = E.GD, GIDS = E.GIDS, CD = E.CD;
const $ = id => document.getElementById(id);
const KEY = 'darb-v3', KEY2 = 'darb-v2';
let S, sel = 'riyadh', screen = 'home', speed = 0, pct = false, carSel = 1, timer = null, lastSave = 0, ct = 'cities', guideOff = false;
let pressing = false, dirty = false, mapC = 'all', mf = 'all', estC = 'sa', estCity = 'riyadh', empC = 'sa', oldSave = false, dg = null, dq = 10, fxFrom = 'sar', fxTo = 'usd';
const SPEEDS = { 0: 0, 1: 1100, 2: 450, 3: 140 };
try { guideOff = localStorage.getItem('darb-guide-off') === '1'; } catch (e) {}
const COAST = new Set(['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']);

const ART = window.ART || {};
const gi = g => (ART['goods/' + g] ? `<img class="gi" src="${ART['goods/' + g]}" alt="${GD[g].name}">` : GD[g].icon);
const uic = k => (ART['ui/' + k] ? `<img class="uic" src="${ART['ui/' + k]}" alt="">` : '');
const pic = (k, cls, alt) => (ART[k] ? `<img class="pic ${cls || ''}" src="${ART[k]}" alt="${alt || ''}">` : '');
const fmt = n => Math.round(n).toLocaleString('en-US');
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const car = () => S.player.caravans.find(c => c.id === carSel) || S.player.caravans[0];
const main = () => S.player.caravans[0];
const cityName = id => S.cities[id].name;
const flag = id => CD[S.cities[id].country].flag;
const cityTag = id => flag(id) + ' ' + esc(cityName(id));
const bar = (v, mx, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, 100 * v / mx))}%"></i></div>`;
const EVN = { boom: 'ازدهار', bust: 'كساد', plague: 'وباء', festival: 'مهرجان', war: 'حرب وحصار' };
const evGood = k => k === 'boom' || k === 'festival';
function spark(arr, w, h) {
  if (!arr || arr.length < 2) return '';
  const mn = Math.min(...arr), mx = Math.max(...arr), rg = mx - mn || 1;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / rg * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" style="direction:ltr;vertical-align:middle"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
function act(r) { if (r && r.msg) toast(r.msg); renderAll(true); }
const fx = () => S.fx;
const curBadge = c => ({ sar: '🇸🇦 ر.س', usd: '💵 $', au: '🥇 غ' })[c];
// سعر بالريال أولاً، ومعه الدولار في الأسواق الأجنبية
function pr(sar, country, dec) { const d = dec == null ? 1 : dec; const v = (Math.round(sar * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); return `<b class="num">${v}</b> ر.س` + (country && country !== 'sa' ? `<span class="usd">$${(sar / fx().usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>` : ''); }
const sgn = n => (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
const plCls = n => (n >= 0 ? 'up' : 'dn');
const citiesOf = cn => S.order.filter(id => S.cities[id].country === cn);

/* ---------- حفظ / بدء ---------- */
function persist() { try { localStorage.setItem(KEY, E.save(S)); } catch (e) {} }
function splash() {
  const el = $('splash'); if (!el) return;
  if (navigator.webdriver) { el.remove(); return; }
  const bg = ART['brand/splash'] || ART['brand/cover'] || ART['scene/caravan'];
  if (bg) el.style.backgroundImage = `url(${bg})`;
  el.innerHTML = `${ART['brand/emblem'] ? `<img src="${ART['brand/emblem']}" alt="">` : ''}<h1>درب التجّار</h1><div class="bar"><i></i></div>`;
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, 1500);
  if (ART['brand/emblem']) { const h = $('hName'); if (h) h.innerHTML = `<img src="${ART['brand/emblem']}" alt="" style="height:1.2em;vertical-align:-.25em;border-radius:50%;margin-inline-end:6px">درب التجّار`; }
}
function boot() {
  splash(); applyUi();
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel=manifest]')) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  try { const s = localStorage.getItem(KEY) || localStorage.getItem(KEY2); if (s) S = E.load(s); } catch (e) {}
  try { if (!S && localStorage.getItem('darb-v1')) oldSave = true; } catch (e) {}
  if (!S || !S.player) { let sd = (Date.now() % 100000) + 1; try { const q = new URLSearchParams(location.search).get('seed'); if (q) sd = +q || sd; } catch (e) {} S = E.newGame(sd); }
  sel = main().city; carSel = 1; estCity = sel; estC = S.cities[sel].country; empC = estC;
}

/* ---------- الوقت ---------- */
function setSpeed(n) { speed = n; clearInterval(timer); if (n) timer = setInterval(step, SPEEDS[n]); renderHeader(); renderAll(true); }
function step() {
  E.tick(S);
  if (S.pause) { speed = 0; clearInterval(timer); }
  if (S.day - lastSave >= 5) { persist(); lastSave = S.day; }
  renderAll(false);
}

/* ---------- التوجيه ---------- */
const SCREENS = [['home', '🏠', 'الرئيسية', 1], ['map', '🗺️', 'الخريطة', 1], ['market', '🏪', 'السوق', 1], ['caravan', '🐪', 'القافلة', 1], ['estate', '🏬', 'العقارات', 2], ['lords', '🤝', 'الزعماء', 1], ['empire', '🏛️', 'الإمبراطورية', 2], ['cities', '🏙️', 'الدول والدفتر', 1, 'الدول']];
function go(s) {
  if (!SCREENS.some(x => x[0] === s)) s = 'home';
  if (s === 'market' && main().left === 0 && screen !== 'market') sel = main().city;
  screen = s; dg = null; if (S.tut) { S.tut.f[s] = true; if (s === 'cities' && ct === 'fx') S.tut.f.fx = true; }
  if (location.hash !== '#' + s) { try { history.pushState(null, '', '#' + s); } catch (e) { location.hash = s; } }
  window.scrollTo(0, 0); renderAll(true);
}
window.addEventListener('popstate', () => { const h = location.hash.replace('#', ''); if (SCREENS.some(x => x[0] === h)) { screen = h; renderAll(true); } });

/* ---------- الرأس والتنقل ---------- */
function renderHeader() {
  const w = S.player.wallet;
  $('hWallets').innerHTML = `<span class="wchip">${uic('riyal')}${fmt(w.sar)}<small>ريال</small></span><span class="wchip">${uic('usd')}$${fmt(w.usd)}<small>دولار</small></span><span class="wchip">${uic('goldbar')}${w.au.toFixed(2)}<small>غ ذهب</small></span><span class="wtot">≈ ${fmt(S.player.gold)} ريال</span>`;
  $('hDay').textContent = S.day;
  const nw = E.netWorth(S), TT = [0, 5000, 20000, 60000, 200000], ti = TT.filter(a => nw >= a).length - 1;
  $('hTitle').textContent = E.titleOf(nw);
  $('hProg').style.width = (ti >= TT.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - TT[ti]) / (TT[ti + 1] - TT[ti]) * 100))) + '%';
  $('hRun').textContent = speed ? '▶ الوقت يمضي' : '⏸ الوقت متوقف'; $('hRun').classList.toggle('on', !!speed);
  [['bPause', 0], ['b1', 1], ['b2', 2], ['b3', 3]].forEach(([id, v]) => $(id).classList.toggle('on', speed === v));
}
const UIK = 'darb-ui'; let ui = { nav: false, top: false };
try { Object.assign(ui, JSON.parse(localStorage.getItem(UIK) || '{}')); } catch (e) {}
function applyUi() {
  document.body.classList.toggle('nav-off', !!ui.nav); document.body.classList.toggle('top-off', !!ui.top);
  const nt = $('navTog'), tt = $('topTog'); if (nt) { nt.textContent = ui.nav ? '☰' : '⌄'; nt.title = ui.nav ? 'فتح شريط القوائم' : 'طيّ شريط القوائم'; nt.setAttribute('aria-expanded', String(!ui.nav)); }
  if (tt) { tt.textContent = ui.top ? '⌄' : '⌃'; tt.title = ui.top ? 'فتح الشريط العلوي' : 'طيّ الشريط العلوي'; tt.setAttribute('aria-expanded', String(!ui.top)); }
  placeSpot();
}
function saveUi() { try { localStorage.setItem(UIK, JSON.stringify(ui)); } catch (e) {} applyUi(); }
function renderNav() {
  $('nav').innerHTML = SCREENS.map(([id, ic, name, ph, short]) => `<button data-go="${id}" class="${screen === id ? 'on' : ''}" ${screen === id ? 'aria-current="page"' : ''}><span class="ic">${ic}</span><span><span class="full">${name}</span><span class="short">${short || name}</span>${S.phase < ph ? ' <span class="lk">🔒</span>' : ''}${id === 'map' && main().left > 0 ? ' <span class="dot"></span>' : ''}</span></button>`).join('');
}
function journeyBar() {
  const cr = main();
  if (cr.left <= 0 || screen === 'map') return '';
  return `<div class="card" style="margin-bottom:12px;padding:10px 14px"><div class="row" style="margin:0"><b>🐪 في الطريق إلى ${cityTag(cr.dest)}</b><span class="muted small">باقٍ ${cr.left} يوم</span><span class="spacer"></span>${speed ? '' : '<button class="sm pri" data-act="play">▶ شغّل الوقت</button>'}<button class="sm" data-go="map">شاهد الرحلة</button></div>${bar(cr.total - cr.left, cr.total, 'gold')}</div>`;
}

/* ---------- مشاهد SVG ---------- */
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function heroScene() {
  return `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="610" cy="120" r="64" fill="#fff4cf" opacity=".92"/><circle cx="610" cy="120" r="92" fill="#fff4cf" opacity=".28"/><path d="M0 215 Q150 150 310 205 T620 195 T800 180 V300 H0Z" fill="var(--dune1)"/><path d="M0 262 Q200 205 400 250 T800 236 V300 H0Z" fill="var(--dune2)"/><g font-size="34" text-anchor="middle"><text x="330" y="244">🐪</text><text x="388" y="248">🐪</text><text x="446" y="244">🐪</text></g><g font-size="26"><text x="90" y="236">🌴</text><text x="700" y="226">🌴</text></g></svg>`;
}
const WALL = { sa: ['#e7d3a6', '#dcc592', '#efdcb5'], eg: ['#e9d9a9', '#d9c07e', '#f0e2b8'], ir: ['#9fc7d8', '#7fb0c8', '#c3dde8'], in: ['#f2b98a', '#e8a070', '#f7cfae'], cn: ['#d98c7a', '#c9705e', '#e8b0a2'] };
function cityScene(c) {
  const k = c.ev ? c.ev.k : '';
  const img = ART['city/' + c.id] || ART['scene/' + c.country];
  if (img) {
    const tint = { boom: '#e9b94955', festival: '#f3b6d255', plague: '#2f4a2a66', war: '#7a1f1466', bust: '#6b727a55' }[k] || '';
    return `<div class="cityimg"><img src="${img}" alt="${esc(c.name)}">${tint ? `<span class="tint" style="background:${tint}"></span>` : ''}<span class="cf">${CD[c.country].flag}</span><span class="cb">${k ? `<b class="evc">${EVN[k]}</b>` : ''}${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</span></div>`;
  }
  const sky = { boom: '#f6c667', festival: '#f3b6d2', plague: '#b9c4a2', war: '#d9867a', bust: '#c8cdd2' }[k] || 'var(--sky1)';
  let rn = hash(c.id); const rand = () => { rn = (Math.imul(rn, 1103515245) + 12345) >>> 0; return rn / 4294967296; };
  const cols = WALL[c.country], pag = c.country === 'cn';
  let s = `<svg class="scene" viewBox="0 0 320 130" role="img" aria-label="${esc(c.name)}"><rect width="320" height="130" fill="${sky}"/><circle cx="${40 + (hash(c.id) % 200)}" cy="30" r="14" fill="#fff4cf" opacity=".9"/>`;
  if (COAST.has(c.id)) s += `<path d="M0 100 Q40 92 80 100 T160 100 T240 100 T320 100 V130 H0Z" fill="var(--sea)"/>`;
  s += `<rect y="96" width="320" height="34" fill="var(--dune2)"/>`;
  const n = Math.round(5 + c.size * 3 + (c.tier - 1) * 2);
  for (let i = 0; i < n; i++) {
    const w = 22 + rand() * 18, h = 26 + rand() * 40 * Math.min(1.4, c.size), x = 8 + i * (300 / n) + rand() * 6, col = cols[i % 3];
    s += `<rect x="${x.toFixed(1)}" y="${(96 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${col}" stroke="#6b5a3a" stroke-width="1.2"/>`;
    if (i % 3 === 0) s += pag ? `<path d="M${(x - 5).toFixed(1)} ${(96 - h + 4).toFixed(1)} L${(x + w / 2).toFixed(1)} ${(96 - h - 12).toFixed(1)} L${(x + w + 5).toFixed(1)} ${(96 - h + 4).toFixed(1)}z" fill="#8a2a1c" stroke="#5b1a10" stroke-width="1"/>` : `<path d="M${x.toFixed(1)} ${(96 - h).toFixed(1)} q${(w / 2).toFixed(1)} -${(w * 0.8).toFixed(1)} ${w.toFixed(1)} 0z" fill="#c9a96a" stroke="#6b5a3a" stroke-width="1.2"/>`;
    s += `<rect x="${(x + w / 2 - 2).toFixed(1)}" y="${(96 - h * 0.55).toFixed(1)}" width="4" height="8" rx="2" fill="#6b5a3a" opacity=".7"/>`;
  }
  if (k === 'festival') s += [30, 80, 130, 180, 230, 280].map((x, i) => `<path d="M${x} ${16 + i} l8 0 l-4 12z" fill="${['#d19a2a', '#b8402f', '#1f6f6b'][i % 3]}"/>`).join('');
  if (k === 'war') s += `<circle cx="250" cy="50" r="16" fill="#555" opacity=".55"/><circle cx="270" cy="36" r="12" fill="#555" opacity=".45"/>`;
  if (k === 'plague') s += `<rect width="320" height="130" fill="#2f4a2a" opacity=".18"/>`;
  s += `<text x="12" y="124" font-size="16">${CD[c.country].flag}</text><text x="300" y="124" font-size="16" text-anchor="end">${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</text></svg>`;
  return s;
}
function journeyScene(cr) {
  const t = (cr.total - cr.left) / Math.max(1, cr.total);
  return `<div class="journey" aria-label="رحلة القافلة"><svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="150" cy="70" r="40" fill="#fff4cf" opacity=".9"/><path d="M0 150 Q160 100 320 145 T640 140 T800 130 V220 H0Z" fill="var(--dune1)"/><path d="M0 190 Q200 150 400 185 T800 175 V220 H0Z" fill="var(--dune2)"/></svg><span class="jl" style="right:3%">${cityTag(cr.from)}</span><span class="jl" style="left:3%">${cityTag(cr.dest)}</span><div class="camelMove" style="right:${(7 + 86 * t).toFixed(1)}%"><span class="camel">🐪</span></div></div>`;
}

/* ---------- المعلومات والصفقات ---------- */
const hasShop = cid => E.hasPresence(S, cid);
function liveView(cid) { const c = main(); return (c.city === cid && c.left === 0) || hasShop(cid); }
function marketView(cid) {
  const c = S.cities[cid];
  if (liveView(cid)) { const p = {}, st = {}; GIDS.forEach(g => { p[g] = E.unitPrice(c, g); st[g] = c.stock[g]; }); return { p, st, age: 0 }; }
  const k = S.player.known[cid]; return { p: k.p, st: k.st, age: S.day - k.day };
}
const live0 = id => liveView(id);
function deals() {
  const cr = main(), here = cr.city, hv = marketView(here), out = [], hc = S.cities[here], P = S.player;
  const wheat = E.unitPrice(hc, 'wheat');
  GIDS.forEach(g => S.order.forEach(d => {
    if (d === here) return;
    const dv = marketView(d), dc = S.cities[d], cus = dc.country === hc.country ? 0 : CD[dc.country].customs;
    const net = dv.p[g] * (1 - dc.tax - cus) - hv.p[g] * 1.02, days = E.tripDays(S, cr, here, d);
    if (net <= 0) return;
    const prov = E.supplyNeed(cr, days) * wheat, reserve = prov * 1.25 + 10;
    const room = Math.floor((E.capOfCar(cr) - E.loadOf(cr)) / GD[g].w), afford = Math.floor(Math.max(0, P.gold - reserve) / (hv.p[g] * (1 + cus * 1.1)));
    const stk = Math.floor(hv.st[g] * 0.6), q0 = Math.min(room, afford, stk), lim = q0 === afford ? 'gold' : q0 === room ? 'room' : 'stock';
    if (q0 < 1) return;
    // أنسب كمية: الربح الفعلي يشمل انزلاق الشراء والبيع، فالأكبر ليس دائماً الأربح
    let best = null;
    [1, 0.7, 0.5, 0.35, 0.2, 0.1].forEach(f => {
      const q = Math.max(1, Math.floor(q0 * f)), qb = live0(here) ? E.quoteBuy(S, here, g, q, P.gold - reserve) : { n: q, avg: hv.p[g] * 1.01 };
      if (qb.n < 1) return;
      const so = E.sellOptions(S, here, g, qb.n, qb.avg, cr).find(o => o.city === d);
      if (so && (!best || so.profit > best.profit)) best = { q: qb.n, profit: so.profit };
    });
    if (best && best.profit > 0) out.push({ g, d, net, days, q: best.q, max: q0, lim, profit: best.profit, pd: best.profit / days, pct: best.profit / (best.q * hv.p[g]), cus });
  }));
  return out.sort((a, b) => b.pd - a.pd);
}
const QS = {};
const LIMNOTE = { gold: 'لا يكفي مبلغك لشراء كمية إضافية', room: 'قافلتك امتلأت: لا مكان لكمية إضافية', stock: 'نفد المتوفر في السوق: لا كمية إضافية' };
const clampQ = (v, mx) => Math.max(1, Math.min(Math.max(1, mx), Math.floor(+v) || 1));
function stepper(key, val, mx, extra) {
  return `<div class="qs"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-10" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص ١٠">−١٠</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-1" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص">▼</button><input class="qin" type="number" inputmode="numeric" min="1" max="${mx}" value="${val}" data-act="qin" data-k="${key}" data-max="${mx}" aria-label="الكمية"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="1" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد">▲</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="10" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد ١٠">+١٠</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="999999" data-max="${mx}" ${val >= mx ? 'disabled' : ''}>أقصى</button>${extra || ''}</div>`;
}
function dealCard(o, can) {
  const key = 'd:' + o.g + ':' + o.d, q = clampQ(QS[key] == null ? o.q : QS[key], o.max), m = main(), here = m.city;
  let est = '', warn = '';
  if (can) {
    const qb = live0(here) ? E.quoteBuy(S, here, o.g, q, S.player.gold) : null, so = qb && qb.n ? E.sellOptions(S, here, o.g, qb.n, qb.avg, m).find(x => x.city === o.d) : null;
    if (qb && qb.n) est = `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س${so ? ` · ربح متوقع <b class="${so.profit >= 0 ? 'cheap' : 'dear'} num">${so.profit >= 0 ? '+' : ''}${fmt(so.profit)}</b>` : ''}`;
    if (q >= o.max) warn = `<div class="qnote">${LIMNOTE[o.lim]}</div>`;
    else if (q !== o.q && so && so.profit < o.profit * 0.9) warn = `<div class="qnote soft">الكمية الأنسب ${o.q} (ربح ${fmt(o.profit)})</div>`;
  }
  return `<div class="card deal"><div class="row" style="margin:0"><span style="font-size:30px">${gi(o.g)}</span><div><b>${GD[o.g].name}</b> ← ${cityTag(o.d)}<div class="small muted">${o.days} أيام${o.cus ? ' · جمارك ' + Math.round(o.cus * 100) + '٪' : ''}</div></div></div>${can ? `<div class="small">اختر الكمية (الأنسب <b class="num">${o.q}</b> · الأقصى <b class="num">${o.max}</b>)</div>${stepper(key, q, o.max)}<div class="small">${est}</div>${warn}<button class="pri" data-act="dealgo" data-g="${o.g}" data-d="${o.d}" data-q="${q}" title="يشتري الكمية المختارة ثم يسافر">اشترِ ${q} وسافر</button>` : `<div class="small">تشتري <b class="num">${o.q}</b> وحدة (الأنسب) · ربح متوقع <b class="cheap num">+${fmt(o.profit)}</b></div>`}</div>`;
}
function guideHTML() {
  if (guideOff || S.tut) return '';
  const P = S.player, cr = main(), ld = E.loadOf(cr);
  let step, msg, btn = '';
  if (cr.left > 0) { step = 3; msg = `القافلة في الطريق إلى <b>${cityTag(cr.dest)}</b> (باقٍ ${cr.left} يوم). ${speed ? 'الوقت يمضي، انتظر الوصول.' : 'الوقت متوقف: اضغط ▶ ليمضي.'}`; btn = speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'; }
  else if (ld >= 1 && P.trips >= 1) { step = 4; msg = `وصلت إلى <b>${cityTag(cr.city)}</b>! بِع بضاعتك هنا.`; btn = '<button class="pri" data-act="sellall">💰 بِع كل البضاعة</button>'; }
  else if (ld >= 1) { step = 2; msg = `معك بضاعة. الآن <b>سافر</b> إلى مدينة أغلى: من الخريطة أو بزر «اشترِ وسافر» في السوق.`; btn = '<button class="pri" data-go="map">🗺️ افتح الخريطة</button>'; }
  else if (P.trips === 0) { step = 1; msg = `أنت في <b>${cityTag(cr.city)}</b> بـ ${fmt(P.gold)} ريال. <b>اشترِ</b> سلعة سعرها أخضر (رخيص) من السوق. ابدأ بمدن بلدك فهي أقرب وبلا جمارك.`; btn = screen === 'market' ? '' : '<button class="pri" data-go="market">🏪 اذهب إلى السوق</button>'; }
  else { step = 5; msg = `ثروتك الآن ${fmt(E.netWorth(S))}. كرّر: <b>اشترِ رخيصاً ← سافر ← بِع</b>. عند ثروة ${fmt(E.PHASE_AT[1])} يُفتح الطور ٢ (دكاكين ومخازن وقادة).`; }
  return `<div class="guide"><div class="row" style="margin:0">${av('official')}<b>الخطوة ${step} من ٥</b><span class="spacer"></span><button class="sm" data-act="guideoff" title="إخفاء الإرشاد">إخفاء</button></div><div style="margin:4px 0">${msg}</div>${btn}</div>`;
}

/* ---------- ١ الرئيسية ---------- */
function screenHome() {
  const P = S.player, nw = E.netWorth(S), started = P.trips > 0 || S.day > 0, cr = main();
  const nextPh = S.phase < 4 ? E.PHASE_AT[S.phase] : null;
  const phNames = ['', 'تاجر متجول', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'];
  let h = `<div class="hero">${ART['scene/caravan'] ? `<img class="herobg" src="${ART['scene/caravan']}" alt="">` : heroScene()}${ART['scene/caravan'] ? '' : pic('hero/trader', 'trader', 'التاجر')}<div class="txt"><h1>درب التجّار</h1><p>قافلة، وأسواق تتنفس، وإمبراطورية تمتد من مصر إلى الصين.</p></div></div>`;
  if (oldSave) h = `<div class="guide" style="margin-bottom:12px">هذا إصدار جديد بعالم من خمس دول، ولا يقرأ حفظ الإصدار السابق. بدأت لك لعبة جديدة.</div>` + h;
  h += `<div class="grid g2" style="margin-top:12px"><div class="card"><h2>الحكاية</h2><p class="story">مات جدّك وترك لك قافلة صغيرة وثمانمئة ريال في الرياض. من هنا تبدأ دروب التجارة: بنجدٍ تمرٌ وقهوة، وبمصر قطنٌ وورق، وبفارس سجادٌ وزعفران، وبالهند توابلُ وأحجار، وبالصين حريرٌ وخزف. وعلى كل درب جمارك ولصوص وعواصف. اشترِ حيث الرخص، وبِع حيث الغلاء، ثم ابنِ دكاكين ومخازن ومصانع في مدن العالم… حتى يُقال عنك: <b>سيّد السوق</b>.</p><div class="row"><button class="pri big" data-go="${cr.left > 0 ? 'map' : 'market'}">${started ? '🐪 تابع الرحلة' : '🐪 ابدأ الرحلة'}</button><button data-go="map">🗺️ الخريطة</button></div></div>`;
  h += `<div class="card"><h2>حالتك</h2><div class="kv"><span>اللقب</span><b>${E.titleOf(nw)}</b></div><div class="kv"><span>اليوم</span><b class="num">${S.day}</b></div><div class="kv"><span>السيولة (ريال معادل)</span><b class="num">${fmt(P.gold)}</b></div><div class="kv"><span>🇸🇦 ريال · 💵 دولار · 🥇 ذهب</span><b class="num">${fmt(P.wallet.sar)} · $${fmt(P.wallet.usd)} · ${P.wallet.au.toFixed(2)}غ</b></div><div class="kv"><span>الثروة الصافية</span><b class="num">${fmt(nw)}</b></div><div class="kv"><span>الطور</span><b>${S.phase} · ${phNames[S.phase]}</b></div>${nextPh ? `<div class="small muted" style="margin-top:8px">الطور ${S.phase + 1} عند ثروة ${fmt(nextPh)}</div>${bar(nw, nextPh, 'gold')}` : '<p class="small">وصلت إلى آخر طور. لا نهاية للعبة.</p>'}</div></div>`;
  const g = guideHTML(); if (g) h += `<div style="margin-top:12px">${g}</div>`;
  if (S.tut && !S.tut.on) h += `<div class="card" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>🎓 <b>الجولة التعليمية</b>: تعلّم القراءة والشراء والسفر والبيع خطوة بخطوة.</span><span class="spacer"></span><button class="pri" data-act="tutrestart">ابدأ الجولة</button></div>`;
  h += `<h2 style="margin-top:16px">كيف تلعب؟</h2><div class="grid g4">`;
  [['🛒', 'اشترِ', 'في «السوق» السعر الأخضر يعني رخيص. اشترِ منه.'], ['🧭', 'سافر', 'من «الخريطة» اختر مدينة غالية واضغط سافر.'], ['⏳', 'انتظر', 'يمضي الوقت وترى القافلة تتحرك. ⏸ يوقفه.'], ['💰', 'بِع', 'عند الوصول اضغط «بِع كل البضاعة». الفرق ربحك.']].forEach(([ic, t, d], i) => { h += `<div class="card step"><div class="n">${i + 1}</div><div><h3>${ic} ${t}</h3><div class="small muted">${d}</div></div></div>`; });
  h += `</div><h2 style="margin-top:16px">دول العالم</h2><div class="grid g3">` + E.COUNTRIES.map(ct => {
    const own = E.GOODS.filter(x => x.org && x.org.includes(ct.id));
    return `<div class="card"><div class="row" style="margin:0"><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">${citiesOf(ct.id).length} مدن</span><span class="pill">جمارك ${Math.round(ct.customs * 100)}٪</span></div><div class="small" style="margin-top:6px">تشتهر بـ: ${own.map(x => gi(x.id) + ' ' + x.name).join('، ')}</div></div>`;
  }).join('') + `</div><h2 style="margin-top:16px">نشرة اليوم</h2><div class="card">${S.news.slice(0, 4).map(n => `<div class="kv"><span class="${n.k === 'good' ? 'cheap' : n.k === 'bad' ? 'dear' : ''}">${esc(n.t)}</span><span class="muted small">يوم ${n.d}</span></div>`).join('')}</div>`;
  return h;
}

/* ---------- ٢ الخريطة ---------- */
function countryChips(cur, attr) { return `<div class="chips" style="margin-bottom:10px">${attr === 'data-mc' ? `<button ${attr}="all" class="${cur === 'all' ? 'on' : ''}">🌍 كل العالم</button>` : ''}${E.COUNTRIES.map(c => `<button ${attr}="${c.id}" class="${cur === c.id ? 'on' : ''}">${c.flag} ${c.name}</button>`).join('')}</div>`; }
function mapBox() {
  let vb = [0, 60, 1000, 560];
  if (mapC !== 'all') { const cs = citiesOf(mapC).map(i => S.cities[i]); const xs = cs.map(c => c.x), ys = cs.map(c => c.y); const minx = Math.min(...xs) - 120, maxx = Math.max(...xs) + 120, miny = Math.min(...ys), maxy = Math.max(...ys), cy = (miny + maxy) / 2; let w = Math.max(maxx - minx, 460), hh = w * 0.68; if (hh < maxy - miny + 190) { hh = maxy - miny + 190; w = hh / 0.68; } vb = [(minx + maxx) / 2 - w / 2, cy - hh / 2, w, hh]; }
  const small = mapC === 'all' ? 1 : 0.55 * 1;
  let h = ART['map/world'] ? `<rect x="-200" y="-200" width="1500" height="1100" fill="#1d3a3d"/><image href="${ART['map/world']}" x="0" y="60" width="1000" height="560" preserveAspectRatio="none"/>` : `<rect x="-200" y="-200" width="1500" height="1100" fill="var(--sand)"/><path d="M262 120 Q300 260 275 360 Q300 450 270 600 L330 600 Q350 420 320 330 Q345 230 300 120Z" fill="var(--sea)" opacity=".85"/><path d="M-200 620 L1300 620 L1300 900 L-200 900Z" fill="var(--sea)" opacity=".7"/><path d="M470 330 Q520 360 520 420 Q470 400 470 330Z" fill="var(--sea)" opacity=".8"/>`;
  E.COUNTRIES.forEach(ct => { h += `<ellipse cx="${ct.cx}" cy="${ct.cy}" rx="${ct.id === 'cn' ? 130 : 105}" ry="${ct.id === 'sa' ? 120 : 95}" fill="${ct.color}" opacity="${mapC === 'all' || mapC === ct.id ? 0.16 : 0.05}"/><text x="${ct.cx}" y="${ct.cy - (ct.id === 'sa' ? 118 : 100)}" text-anchor="middle" font-size="${mapC === 'all' ? 17 : 14}" font-weight="800" fill="${ct.color}" opacity=".9">${ct.flag} ${ct.name}</text>`; });
  const ids = S.order, drawn = new Set();
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = S.cities[ids[i]], b = S.cities[ids[j]];
    if (a.country === b.country) { h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#7a6a45" stroke-width="1.6" opacity=".55"/>`; }
  }
  E.COUNTRIES.forEach(c1 => (E.ADJ[c1.id] || []).forEach(c2id => {
    if (c1.id > c2id) return; let best = null;
    citiesOf(c1.id).forEach(a => citiesOf(c2id).forEach(b => { const d = E.dist(S, a, b); if (!best || d < best.d) best = { a, b, d }; }));
    if (best) { const A_ = S.cities[best.a], B_ = S.cities[best.b], r = S.risk[E.riskKey(best.a, best.b)]; h += `<line x1="${A_.x}" y1="${A_.y}" x2="${B_.x}" y2="${B_.y}" stroke="${r > 0.1 ? '#b8402f' : '#8b7b55'}" stroke-width="1.6" stroke-dasharray="6 6" opacity=".6"/>`; }
  }));
  ids.forEach(id => {
    const c = S.cities[id], r = 11 + c.size * 5 + (c.tier - 1) * 2, ev = c.ev ? c.ev.k : '', ct = CD[c.country];
    const glow = evGood(ev) ? '#d19a2a' : ev ? '#b8402f' : '';
    if (glow) h += `<circle cx="${c.x}" cy="${c.y}" r="${r + 9}" fill="${glow}" opacity=".4"/>`;
    h += `<g data-city="${id}" style="cursor:pointer" role="button" aria-label="${esc(c.name)}"><circle cx="${c.x}" cy="${c.y + 2}" r="${r + 1}" fill="#000" opacity=".35"/><circle cx="${c.x}" cy="${c.y}" r="${r}" fill="#1b1d22" stroke="${sel === id ? '#fff' : ct.color}" stroke-width="${sel === id ? 4.5 : 3.5}"/><circle cx="${c.x}" cy="${c.y}" r="${r}" fill="none" stroke="${sel === id ? '#1f6f6b' : 'none'}" stroke-width="2" transform="scale(1)"/>`;
    h += `<text x="${c.x}" y="${c.y + 5}" text-anchor="middle" font-size="${mapC === 'all' ? 13 : 15}">${hasShop(id) ? '🏪' : c.owner ? '🏛️' : '🕌'}</text><rect x="${(c.x - (c.name.length * (mapC === 'all' ? 3.6 : 4.4) + 8)).toFixed(1)}" y="${c.y + r + 3}" width="${((c.name.length * (mapC === 'all' ? 3.6 : 4.4) + 8) * 2).toFixed(1)}" height="${mapC === 'all' ? 17 : 21}" rx="8" fill="#14161bd9" stroke="${ct.color}" stroke-width="1.2"/><text x="${c.x}" y="${c.y + r + (mapC === 'all' ? 16 : 19)}" text-anchor="middle" font-size="${mapC === 'all' ? 12 : 15}" font-weight="700" fill="#fff">${esc(c.name)}</text>`;
    if (ev) h += `<text x="${c.x}" y="${c.y - r - 5}" text-anchor="middle" font-size="11" fill="${glow}" font-weight="700" stroke="var(--sand)" stroke-width="2.5" paint-order="stroke">${EVN[ev]}</text>`;
    h += `</g>`;
  });
  const pos = (from, to, left, total) => { const a = S.cities[from], b = S.cities[to], t = 1 - left / Math.max(1, total); return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t]; };
  S.agents.forEach(a => { if (a.left > 0 && a.dest) { const [x, y] = pos(a.from, a.dest, a.left, a.total || a.left); h += `<circle cx="${x}" cy="${y}" r="3.2" fill="#6d6757" opacity=".8" pointer-events="none"/>`; } });
  S.player.caravans.forEach(c => { const here = S.cities[c.city]; let x, y; if (c.left > 0) [x, y] = pos(c.from, c.dest, c.left, c.total); else { x = here.x + (c.main ? -20 : 20 + 8 * c.id % 7); y = here.y - 22; } h += `<text x="${x}" y="${y}" font-size="${c.main ? 24 : 17}" text-anchor="middle" pointer-events="none">🐪</text>`; });
  return `<svg id="map" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" direction="ltr" aria-label="خريطة العالم">${h}</svg>`;
}
function cityPanel() {
  const c = S.cities[sel], cr = main(), v = marketView(sel), here = cr.city === sel && cr.left === 0, ct = CD[c.country];
  const lst = GIDS.map(g => ({ g, r: v.p[g] / E.refPrice(c, g) })).sort((a, b) => a.r - b.r);
  const cheap = lst.slice(0, 2), dear = lst.slice(-2).reverse();
  let h = `<div class="card citycard">${cityScene(c)}<div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span>${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${c.ev.left} يوم</span>` : ''}</div>`;
  h += `<div class="small muted" style="margin:6px 0">${liveView(sel) ? 'أسعار حيّة' : 'معلومات قبل ' + v.age + ' يوم'} · ${E.shopsOf(S, sel).length ? '🏪 ' + E.shopsOf(S, sel).length + ' دكان · 📦 ' + E.whsOf(S, sel) + ' مخزن' : 'لا عقارات لك هنا'}</div>`;
  h += `<div class="kv"><span>الأرخص نسبياً</span><span class="cheap">${cheap.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div><div class="kv"><span>الأغلى نسبياً</span><span class="dear">${dear.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div>`;
  if (cr.left > 0) h += `<p class="small muted">قافلتك في الطريق.</p>`;
  else if (here) h += `<p><b>أنت هنا.</b></p><div class="row"><button class="pri" data-go="market">🏪 افتح السوق</button><button data-act="estcity" data-c="${sel}">🏬 العقارات</button></div>`;
  else {
    const dd = E.tripDays(S, cr, cr.city, sel), need = E.supplyNeed(cr, dd), pc = need * E.unitPrice(S.cities[cr.city], 'wheat'), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    h += `<div class="kv"><span>المدة</span><b class="num">${dd} أيام</b></div><div class="kv"><span>المؤن</span><b class="num">≈ ${fmt(pc)}</b></div><div class="kv"><span>خطر اللصوص</span><b class="num ${rk > 0.1 ? 'dear' : ''}">${Math.round(rk * 100)}٪</b></div>${cus ? `<div class="kv"><span>جمارك ${ct.name}</span><b class="num dear">${Math.round(cus * 100)}٪ من قيمة الحمولة</b></div>` : ''}`;
    h += `<div class="row"><button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)}</button></div>`;
  }
  return h + `</div>`;
}
function screenMap() {
  const cr = main(); let h = '';
  const g = guideHTML(); if (g) h += `<div style="margin-bottom:12px">${g}</div>`;
  if (cr.left > 0) h += `<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><b>🐪 في الطريق إلى ${cityTag(cr.dest)}</b><span class="muted">باقٍ ${cr.left} من ${cr.total} يوم</span><span class="spacer"></span>${speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'}</div>${journeyScene(cr)}${bar(cr.total - cr.left, cr.total, 'gold')}</div>`;
  h += countryChips(mapC, 'data-mc');
  h += `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));align-items:start"><div id="mapbox">${mapBox()}</div>${cityPanel()}</div><p class="small muted">انقر مدينة لترى سوقها وتسافر إليها. الخطوط المتصلة طرق داخل الدولة، والمتقطعة بين الدول (وفيها جمارك). الأحمر طريق خطر.</p>`;
  return h;
}

/* ---------- ٣ السوق ---------- */
const tierName = t => (t === 'raw' ? 'خام' : t === 'spec' ? 'تخصصية' : 'مصنّعة');
function capStrip(mi, c) {
  const m = mi.all;
  return `<div class="sumbar"><div class="m"><div class="small muted">🐪 قافلتي</div><b class="num">${fmt(mi.carLoad)} / ${fmt(mi.carCap)}</b>${bar(mi.carLoad, mi.carCap, mi.carRoom < mi.carCap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.carRoom)} وزن</div></div>
  <div class="m"><div class="small muted">📦 مخزني في ${esc(c.name)}</div>${mi.store.has ? `<b class="num">${fmt(mi.store.load)} / ${fmt(mi.store.cap)}</b>${bar(mi.store.load, Math.max(1, mi.store.cap), mi.store.free < mi.store.cap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.store.free)} وزن</div>` : '<b>لا مخزن هنا</b><div class="small muted">ابنِ دكاناً ثم مخزناً من «العقارات»</div>'}</div>
  <div class="m"><div class="small muted">🏬 كل مخازني</div><b class="num">${fmt(m.load)} / ${fmt(m.cap)}</b>${bar(m.load, Math.max(1, m.cap))}<div class="small muted">${m.rows.length} مدينة · فارغ ${fmt(m.free)}</div></div>
  <div class="m"><div class="small muted">💰 رصيدك</div><b class="num">${fmt(S.player.gold)} ريال</b><div class="small muted">${fmt(S.player.wallet.sar)} ر.س · $${fmt(S.player.wallet.usd)} · ${S.player.wallet.au.toFixed(2)}غ</div></div></div>`;
}
function screenMarket() {
  const cr = main(), c = S.cities[sel], v = marketView(sel), live = liveView(sel), ct = CD[c.country];
  const atHere = cr.city === sel && cr.left === 0, ld = E.loadOf(cr);
  const mi = live ? E.marketInfo(S, sel, 1) : null, byG = {}; if (mi) mi.goods.forEach(x => byG[x.g] = x);
  let h = `${pic(ART['city/' + c.id] ? 'city/' + c.id : 'scene/' + c.country, 'banner', c.name)}<div class="row" style="margin-top:0"><span class="title" style="margin:0">${ART['hero/' + c.country] ? av(c.country) : ''}🏪 سوق ${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">رتبة ${c.tier}</span><span class="pill">يتعامل بـ ${E.curOf(c.country) === 'sar' ? 'الريال' : 'الدولار'}</span><span class="pill">ضريبة ${Math.round((c.tax + (atHere ? 0.05 * Math.min(1, E.netWorth(S) / 200000) : 0)) * 100)}٪</span>${live ? '<span class="pill good">أسعار حيّة</span>' : `<span class="pill bad">آخر زيارة قبل ${v.age} يوم</span>`}${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${c.ev.left} يوم</span>` : ''}<span class="spacer"></span><label class="small"><input type="checkbox" id="pctBox" ${pct ? 'checked' : ''}> عرض النسبة من المرجع</label></div>`;
  h += E.COUNTRIES.map(k => `<div class="chips" style="margin-bottom:6px"><span class="cn">${k.flag}</span>${citiesOf(k.id).map(id => `<button data-city="${id}" class="${id === sel ? 'on' : ''}">${id === cr.city ? '🐪 ' : ''}${esc(cityName(id))}</button>`).join('')}</div>`).join('');
  const g = guideHTML(); if (g) h += `<div style="margin:10px 0">${g}</div>`;
  h += bossStrip(c);
  // ملخص السوق عند الدخول
  if (mi) {
    h += `<div class="card" style="margin:10px 0"><h2>ماذا في سوق ${esc(c.name)}؟</h2><div class="row" style="margin-top:0"><span class="pill good">متوفر ${mi.present} من ${mi.total} سلعة</span>${mi.missing.length ? `<span class="pill bad">غير متوفر: ${mi.missing.map(x => gi(x) + ' ' + GD[x].name).join('، ')}</span>` : ''}</div>${capStrip(mi, c)}${atHere ? '' : '<p class="small muted" style="margin-bottom:0">هذه معلومات حيّة لأن لك عقاراً هنا. للتداول يجب أن تكون القافلة في المدينة.</p>'}</div>`;
  } else {
    h += `<div class="card" style="margin:10px 0"><h2>سوق ${esc(c.name)}</h2><p class="small muted" style="margin:0">معلوماتك عن هذا السوق قبل ${v.age} يوم. لترى ما فيه وما تستطيع أخذه وهل تكفي مخازنك، يجب أن تدخله بقافلتك أو أن تبني فيه دكاناً.</p></div>`;
  }
  if (cr.left > 0) h += `<div class="card" style="margin-bottom:12px">القافلة في الطريق إلى ${cityTag(cr.dest)}.</div>`;
  else if (atHere && ld >= 1) { const worth = Object.keys(cr.cargo).reduce((a, k) => a + (cr.cargo[k] >= 1 ? E.quoteSell(S, sel, k, cr.cargo[k], 1).net : 0), 0), cost = Object.keys(cr.basis || {}).reduce((a, k) => a + cr.basis[k].c, 0); h += `<div class="card" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>معك بضاعة صافي بيعها هنا <b class="num">${fmt(worth)}</b> ر.س مقابل تكلفتها <b class="num">${fmt(cost)}</b> ← <b class="pl ${plCls(worth - cost)} num">${sgn(worth - cost)} ر.س</b></span><span class="spacer"></span><button class="pri big" data-act="sellall">💰 بِع كل البضاعة هنا</button></div>`; }
  else if (!atHere) {
    const dd = E.tripDays(S, cr, cr.city, sel), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    h += `<div class="card" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>قافلتك في <b>${cityTag(cr.city)}</b>. للتداول هنا عليك السفر.</span><span class="spacer"></span><button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)} (${dd} أيام · خطر ${Math.round(rk * 100)}٪${cus ? ' · جمارك ' + Math.round(cus * 100) + '٪' : ''})</button></div>`;
  }
  if (cr.left === 0) { const top = deals().slice(0, 3); if (top.length) h += `<h2>أفضل الصفقات من ${cityTag(cr.city)}</h2><div class="grid g3" style="margin-bottom:14px">${top.map(o => dealCard(o, true)).join('')}</div>`; }
  h += `<h2>السلع <span class="small muted">اضغط على سلعة لترى كل تفاصيلها وأين تربح منها</span></h2><div class="chips tierchips">${[['all', 'الكل'], ['here', 'من ' + ct.name], ['raw', 'خام'], ['spec', 'تخصصية'], ['proc', 'مصنّعة']].map(([id, n]) => `<button data-mf="${id}" class="${mf === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="grid g3">`;
  GIDS.filter(gd => mf === 'all' || (mf === 'here' ? (GD[gd].org || []).includes(c.country) : GD[gd].tier === mf)).forEach(gd => {
    const G = GD[gd], x = byG[gd], price = v.p[gd], r = price / E.refPrice(c, gd), have = Math.floor(cr.cargo[gd] || 0), cls = r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : '';
    const badge = r < 0.85 ? `<span class="pill good">${uic('cheap')}رخيص</span>` : r > 1.15 ? `<span class="pill bad">${uic('dear')}غالٍ</span>` : '<span class="pill">عادي</span>';
    const stock = Math.floor(v.st[gd]), none = stock < 1;
    h += `<div class="card gcard ${none ? 'locked' : r < 0.85 ? 'cheapc' : r > 1.15 ? 'dearc' : ''}" data-gd="${gd}"><div class="top"><span class="ic">${gi(G.id)}</span><div style="flex:1"><b>${G.name}</b> ${badge}<div class="small muted">${G.org ? 'منشأ: ' + G.org.map(o => CD[o].flag).join('') : 'خام عام'} · ${tierName(G.tier)}</div><div class="price ${cls}">${pct ? Math.round(r * 100) + '٪' : pr(price, c.country)}</div></div><span class="muted">${spark(S.hist.px[sel] && S.hist.px[sel][gd], 56, 22)}</span></div>`;
    h += `<div class="small">${none ? '<span class="dear">غير متوفر في هذا السوق</span>' : 'متوفر <b class="num">' + fmt(stock) + '</b> وحدة'}</div>${bar(v.st[gd], E.capG(c, gd), r < 0.85 ? '' : r > 1.15 ? 'red' : 'gold')}`;
    if (x && !none) {
      const why = { gold: 'رصيدك', room: 'حمولة القافلة', stock: 'المتوفر في السوق' }[x.limit];
      h += `<div class="take">أقدر آخذ <b class="num">${fmt(x.canCar)}</b> <span class="muted">(الحدّ: ${why})</span></div><div class="fitrow"><span class="fit ${x.fitsCar ? 'ok' : 'no'}">${x.fitsCar ? '✓ تكفي قافلتي' : '✗ قافلتي تتسع ' + fmt(x.carU)}</span><span class="fit ${x.fitsStore ? 'ok' : 'no'}">${mi.store.has ? (x.fitsStore ? '✓ يكفي مخزني' : '✗ مخزني يتسع ' + fmt(x.storeU)) : '✗ لا مخزن'}</span></div>`;
    }
    if (have && live) { const q = E.quoteSell(S, sel, gd, have, 1), cost = x && x.avg != null ? x.avg * have : 0, pl = q.net - cost; h += `<div class="small">معك <b>${have}</b>${x && x.avg != null ? ' · تكلفتك ' + f1(x.avg) + ' للوحدة' : ''} · لو بعت هنا <b class="pl ${plCls(pl)} num">${sgn(pl)} ر.س</b></div>`; }
    else if (have) h += `<div class="small">معك <b>${have}</b></div>`;
    if (atHere) h += `${buyRow(gd, x, none)}${sellRow(gd, have, live)}`;
    h += `</div>`;
  });
  return h + `</div>`;
}

function sellRow(gd, have, live) {
  if (have < 1) return `<div class="btns"><span class="lb">بِع</span><span class="small muted">لا تملك منها شيئاً</span></div>`;
  const key = 's:' + gd, q = clampQ(QS[key] == null ? 1 : QS[key], have), qs = live ? E.quoteSell(S, sel, gd, q, 1) : null, avg = E.avgCost(main().basis, gd);
  const pl = qs && avg != null ? qs.net - avg * q : null;
  return `<div class="btns"><span class="lb">بِع</span></div>${stepper(key, q, have)}<div class="small">${qs ? `صافي ≈ <b class="num">${fmt(qs.net)}</b> ر.س${pl != null ? ` · <b class="pl ${plCls(pl)} num">${sgn(pl)}</b>` : ''}` : ''}</div>${q >= have ? '<div class="qnote soft">هذا كل ما تملكه من هذه السلعة</div>' : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="sell" data-g="${gd}" data-q="${q}">بِع ${q}</button><button class="sm" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button></div>`;
}
function buyRow(gd, x, none) {
  if (none || !x) return '';
  const mx = Math.max(0, x.canCar), key = 'g:' + gd;
  if (mx < 1) return `<div class="btns"><span class="lb">اشترِ</span></div><div class="qnote">${LIMNOTE[x.limit] || 'لا تستطيع الشراء الآن'}</div>`;
  const q = clampQ(QS[key] == null ? 1 : QS[key], mx), qb = E.quoteBuy(S, sel, gd, q, S.player.gold);
  return `<div class="btns"><span class="lb">اشترِ</span></div>${stepper(key, q, mx)}<div class="small">${qb && qb.n ? `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س` : ''}</div>${q >= mx ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="buy" data-g="${gd}" data-q="${q}">اشترِ ${q}</button></div>`;
}
/* ---------- لوحة تفصيل السلعة ---------- */
function renderModal() {
  const m = $('modal');
  if (!dg || screen !== 'market') { m.hidden = true; m.innerHTML = ''; return; }
  const gd = dg, G = GD[gd], c = S.cities[sel], cr = main(), v = marketView(sel), live = liveView(sel), atHere = cr.city === sel && cr.left === 0;
  const price = v.p[gd], ref = E.refPrice(c, gd), r = price / ref, hist = (S.hist.px[sel] || {})[gd] || [];
  const mi = live ? E.marketInfo(S, sel, 1) : null, x = mi && mi.goods.find(y => y.g === gd);
  const have = Math.floor(cr.cargo[gd] || 0), avg = E.avgCost(cr.basis, gd);
  const maxQ = x ? Math.max(1, x.canCar) : 100, q = dq === 'max' ? maxQ : +dq;
  const qb = live ? E.quoteBuy(S, sel, gd, q, S.player.gold) : null;
  const unitCost = have && avg != null ? avg : qb && qb.n ? qb.avg : price;
  const opts = E.sellOptions(S, sel, gd, Math.max(1, have || (qb ? qb.n : q)), unitCost), cur = E.curOf(c.country);
  let h = `<div class="mbox" role="dialog" aria-label="${G.name}"><div class="row" style="margin-top:0"><span style="font-size:40px">${gi(G.id)}</span><div><h2 style="margin:0">${G.name} <span class="pill">${tierName(G.tier)}</span>${G.org ? `<span class="pill">منشأ ${G.org.map(o => CD[o].flag + ' ' + CD[o].name).join('، ')}</span>` : '<span class="pill">خام عام</span>'}</h2><div class="small muted">وزن الوحدة ${G.w} · تلف ${G.spoil ? (G.spoil * 100).toFixed(1) + '٪ يومياً' : 'لا يتلف'} · ${G.ess ? 'ضرورية' : G.lux ? 'كمالية' : 'عادية'}</div></div><span class="spacer"></span><button data-act="gdclose" class="sm">✕ إغلاق</button></div>`;
  h += `<div class="grid g2" style="margin-top:8px"><div class="card"><div class="small muted">سعر الوحدة في ${esc(c.name)} ${live ? '' : '(معلومة قديمة)'}</div><div style="font-size:26px;font-weight:800" class="${r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : ''}">${pr(price, c.country)}</div><div class="small">المرجعي ${f1(ref)} ر.س · النسبة <b class="num">${Math.round(r * 100)}٪</b></div><div style="color:var(--teal)">${spark(hist, 220, 40)}</div><div class="small muted">آخر ${hist.length} يوماً: من ${f1(Math.min(...hist, price))} إلى ${f1(Math.max(...hist, price))} ر.س</div></div>`;
  h += `<div class="card"><div class="small muted">كم أشتري؟</div><div class="chips" style="margin:6px 0">${(S.tut && S.tut.on && S.tut.f.plan && S.tut.f.plan.g === gd && ![1, 10, 25, 100].includes(S.tut.f.plan.q) ? [1, 10, 25, 100, S.tut.f.plan.q].sort((a, b) => a - b) : [1, 10, 25, 100]).map(n => `<button data-dq="${n}" class="${String(dq) === String(n) ? 'on' : ''}">${n}${S.tut && S.tut.on && S.tut.f.plan && S.tut.f.plan.g === gd && S.tut.f.plan.q === n ? ' (مقترح)' : ''}</button>`).join('')}<button data-dq="max" class="${dq === 'max' ? 'on' : ''}">أقصى (${fmt(maxQ)})</button></div>${x && x.canCar >= 1 ? stepper('m', clampQ(q, maxQ), maxQ) : ''}${x && q >= maxQ ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}`;
  if (qb) {
    h += `<div class="kv"><span>تدفع</span><b>${pr(qb.cost, c.country, 0)}</b></div><div class="kv"><span>متوسط الوحدة (مع انزلاق السعر)</span><b>${pr(qb.avg, c.country)}</b></div>${qb.n < q ? `<div class="small dear">تستطيع شراء ${qb.n} فقط من ${q}${x ? ' (الحدّ: ' + ({ gold: 'رصيدك', room: 'الحمولة', stock: 'المتوفر' }[x.limit]) + ')' : ''}</div>` : ''}`;
    h += `<div class="fitrow"><span class="fit ${x.carU >= q ? 'ok' : 'no'}">${x.carU >= q ? '✓ تكفي قافلتي' : '✗ قافلتي تتسع ' + fmt(x.carU)}</span><span class="fit ${mi.store.has && x.storeU >= q ? 'ok' : 'no'}">${mi.store.has ? (x.storeU >= q ? '✓ يكفي مخزني هنا' : '✗ مخزني يتسع ' + fmt(x.storeU)) : '✗ لا مخزن هنا'}</span></div>`;
    h += atHere ? `<div class="row"><button class="pri" data-act="buy" data-g="${gd}" data-q="${qb.n || 1}" ${qb.n ? '' : 'disabled'}>اشترِ ${qb.n}</button>${have ? `<button data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button>` : ''}</div>${have ? sellRow(gd, have, live) : ''}` : '<div class="small muted">للشراء يجب أن تكون القافلة في هذه المدينة.</div>';
  } else h += '<p class="small muted">لا أسعار حيّة هنا. السعر المعروض آخر ما عرفته.</p>';
  h += `</div></div>`;
  if (have) {
    const qs = live ? E.quoteSell(S, sel, gd, have, 1) : null;
    h += `<div class="card" style="margin-top:10px"><b>معك ${have} وحدة</b><div class="kv"><span>تكلفتك للوحدة</span><b>${avg != null ? f1(avg) + ' ر.س' : '—'}</b></div>${qs ? `<div class="kv"><span>لو بعتها هنا (صافي بعد الضريبة)</span><b>${fmt(qs.net)} ر.س</b></div><div class="kv"><span>الربح/الخسارة</span><b class="pl ${plCls(qs.net - (avg || 0) * have)} num">${sgn(qs.net - (avg || 0) * have)} ر.س</b></div>` : ''}</div>`;
  }
  h += `<h3 style="margin-top:14px">أين أبيع ${G.name}؟ <span class="small muted">(لـ ${fmt(Math.max(1, have || (qb ? qb.n : q)))} وحدة، بعد الضريبة والجمارك والمؤن)</span></h3><div class="optrow hd small muted"><span>المدينة</span><span>سعر البيع</span><span>الصافي</span><span>أيام</span><span>الربح/الخسارة</span><span></span></div>`;
  opts.slice(0, 8).forEach(o => {
    h += `<div class="optrow"><span>${cityTag(o.city)}${o.age ? `<span class="small muted"> (قبل ${o.age}ي)</span>` : ''}</span><span>${pr(o.price, o.country)}</span><span class="num">${fmt(o.net)} ر.س${o.customs ? `<span class="usd">جمارك ${fmt(o.customs)}</span>` : ''}</span><span class="num">${o.days} · ${Math.round(o.risk * 100)}٪</span><span class="pl ${plCls(o.profit)} num">${sgn(o.profit)} ر.س<span class="usd">${sgn(o.perUnit)}/وحدة</span></span><span>${atHere && cr.left === 0 ? (have ? `<button class="sm pri" data-act="go" data-to="${o.city}">سافر</button>` : `<button class="sm pri" data-act="dealgo2" data-g="${gd}" data-d="${o.city}" data-q="${q}">اشترِ وسافر</button>`) : ''}</span></div>`;
  });
  const hist2 = S.player.trades.filter(t => t.g === gd).slice(0, 5);
  if (hist2.length) h += `<h3 style="margin-top:14px">صفقاتك الأخيرة في ${G.name}</h3>` + hist2.map(t => `<div class="kv small"><span>يوم ${t.day} · ${cityTag(t.city)} · ${t.side === 'shop' ? 'دكان' : 'بيع'} ${f1(t.q)}</span><b class="pl ${plCls(t.pl)} num">${sgn(t.pl)} ر.س</b></div>`).join('');
  m.innerHTML = h + `</div>`; m.hidden = false;
}

/* ---------- ٤ القافلة ---------- */
function screenCaravan() {
  const P = S.player, cr = car(); let h = `${pic('scene/caravan', 'banner', 'القافلة')}`;
  if (P.caravans.length > 1) h += `<div class="chips" style="margin-bottom:12px">${P.caravans.map(c => `<button data-act="selcar" data-id="${c.id}" class="${c.id === cr.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>`;
  const cap = E.capOfCar(cr), ld = E.loadOf(cr), idle = cr.left === 0;
  h += `<div class="grid g3"><div class="card"><h3>📍 الموقع</h3><b>${idle ? cityTag(cr.city) : 'في الطريق إلى ' + cityTag(cr.dest)}</b>${idle ? '' : `<div class="small muted">باقٍ ${cr.left} يوم</div>${bar(cr.total - cr.left, cr.total, 'gold')}`}</div><div class="card"><h3>💪 المعنويات</h3><b class="num">${Math.round(cr.morale)} / 100</b>${bar(cr.morale, 100, cr.morale < 50 ? 'red' : '')}<div class="small muted">تنخفض بالسفر وتعود بالراحة في المدن.</div></div><div class="card"><h3>${av('leader')} الطاقم</h3><div class="kv"><span>عربات</span><b>${cr.carts}</b></div><div class="kv"><span>رجال</span><b>${cr.crew}</b></div><div class="kv"><span>حرّاس</span><b>${cr.guards}</b></div>${cr.captain ? `<div class="small muted">القائد ${esc(cr.captain.name)}: تجارة ${cr.captain.trade} · ملاحة ${cr.captain.nav} · قتال ${cr.captain.combat}</div>` : ''}</div></div>`;
  const icons = []; GIDS.forEach(g => { const n = Math.ceil((cr.cargo[g] || 0) * GD[g].w / 10 - 0.001); for (let i = 0; i < n; i++) icons.push(gi(g)); });
  const slots = Math.max(cap / 10, icons.length);
  h += `<h2 style="margin-top:16px">📦 الحمولة <span class="muted small num">${fmt(ld)} / ${cap}</span></h2><div class="card"><div class="crates">${Array.from({ length: slots }, (_, i) => `<div class="crate ${icons[i] ? 'f' : ''}">${icons[i] || ''}</div>`).join('')}</div>${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).length ? `<div class="row small">${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).map(g => `<span class="pill">${gi(g)} ${GD[g].name}: ${Math.floor(cr.cargo[g])}${E.avgCost(cr.basis, g) != null ? ' · تكلفة ' + f1(E.avgCost(cr.basis, g)) : ''}</span>`).join('')}</div>` : '<p class="small muted">القافلة فارغة. اشترِ من السوق.</p>'}</div>`;
  h += `<h2 style="margin-top:16px">🔧 تجهيز القافلة</h2><div class="grid g4">`;
  [[uic('crate') || '🛒', 'عربة', 'تزيد الحمولة ١٠٠', '٦٠٠', 'cart'], [av('porter') || '🧑‍🌾', 'رجل طاقم', 'يسرّع الدفاع قليلاً', '٥٠', 'crew'], [av('guard') || '🛡️', 'حارس', 'يصدّ اللصوص', '٣٠٠', 'guard']].forEach(([ic, t, d, p, a]) => { h += `<div class="card up"><span class="ic">${ic}</span><b>${t}</b><div class="small muted">${d}</div><button data-act="${a}" ${idle ? '' : 'disabled'}>+ ${t} (${p})</button></div>`; });
  h += `<div class="card up"><span class="ic">📜</span><b>تأمين الرحلة</b><div class="small muted">٢٫٥٪ من قيمة الحمولة، ويقلل خسارة اللصوص إلى ٣٠٪.</div><label><input type="checkbox" id="insBox" ${cr.insured ? 'checked' : ''}> مفعّل</label></div></div>`;
  if (idle && cr.main && P.gold <= 150 && ld < 1) h += `<div class="card" style="margin-top:12px"><b>أفلست؟</b> <button data-act="work">اعمل حمّالاً في السوق (+٤٠)</button></div>`;
  return h;
}

/* ---------- ٥ العقارات: دكاكين ومخازن ---------- */
function teaser(ph, icon, title, items) {
  const nw = E.netWorth(S), need = E.PHASE_AT[ph - 1];
  return `<div class="card locked"><h2>${icon} ${title} <span class="pill">🔒 الطور ${ph}</span></h2><ul class="small" style="margin:0 0 6px;padding-inline-start:18px">${items.map(i => `<li>${i}</li>`).join('')}</ul><div class="small muted">يُفتح عند ثروة ${fmt(need)} (ثروتك ${fmt(nw)})</div><div class="lockbar">${bar(nw, need, 'gold')}</div></div>`;
}
/* ---------- الزعماء والعقود ---------- */
const av = k => pic('hero/' + k, 'av', '');
const pactIc = t => (t === 'guard' && ART['hero/guard'] ? av('guard') : t === 'supply' && ART['ui/crate'] ? uic('crate') : E.PACTS[t].icon);
const bossPic = (c, mine) => (mine ? pic('hero/trader', 'boss', 'أنت') : pic('boss/' + c.id, 'boss', ''));
const trustWord = v => v >= 50 ? 'صديق' : v >= 20 ? 'موثوق' : v > -10 ? 'محايد' : v > -40 ? 'متوتر' : 'عدائي';
function bossStrip(c) {
  const bs = E.bossOf(S, c.id); if (!bs) return '';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', pc = E.pactIn(S, c.id);
  return `<div class="card" style="margin:10px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-6px;inset-inline-end:-4px;font-size:22px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><b>${mine ? 'أنت حاكم سوق ' + esc(c.name) : 'كبير تجّار ' + esc(c.name) + ': ' + esc(bs.name)}</b><div class="small muted">نفوذك ${sh}٪ (تحكم عند ${Math.round(E.BOSS_TAKE * 100)}٪) · ثقته بك: ${trustWord(bs.trust)}${pc ? ' · بينكما ' + E.PACTS[pc.type].name : ''}</div>${bar(sh, 100, mine ? '' : 'gold')}</div><button class="sm ${S.phase >= 2 ? 'pri' : ''}" data-act="tolord" data-c="${c.id}">${S.phase >= 2 ? '🤝 العقود والنفوذ' : 'تعرّف على الزعيم'}</button></div>`;
}
let lordC = 'sa', lordCity = 'riyadh';
function screenLords() {
  const c = S.cities[lordCity], bs = E.bossOf(S, lordCity), P = S.player, on = S.phase >= 2;
  let h = `<span class="title" style="margin:0">🤝 الزعماء والعقود</span><p class="small muted" style="margin:6px 0 10px">في كل سوق كبير تجّار يحكمه. كلما بنيت وبعت أكثر زاد نفوذك. عندما تتجاوز حصتك ${Math.round(E.BOSS_TAKE * 100)}٪ تخلعه وتصير حاكماً (ضريبة ٢٠٪ لك، وشراء أرخص). وإن هبط نفوذك دون ${Math.round(E.BOSS_LOSE * 100)}٪ عاد إليه الحكم. وفي المقابل، يمكنك عقد شراكات معه.${on ? '' : ' <b>الأفعال تُفتح في الطور ٢.</b>'}</p>`;
  h += countryChips(lordC, 'data-lc') + `<div class="chips" style="margin-bottom:10px">${citiesOf(lordC).map(id => { const b = E.bossOf(S, id); return `<button data-lcity="${id}" class="${id === lordCity ? 'on' : ''}">${b && b.ruler === 'player' ? '👑 ' : ''}${esc(cityName(id))}</button>`; }).join('')}</div>`;
  if (!bs) return h + '<div class="card">لا زعيم في هذه المدينة (مدينة أسستَها بنفسك).</div>';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', ct = CD[c.country], pc = E.pactIn(S, lordCity);
  h += `<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-8px;inset-inline-end:-6px;font-size:28px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><h2 style="margin:0">${esc(bs.name)}</h2><div class="small muted">كبير تجّار ${esc(c.name)} · ${ct.flag} ${ct.name} · ${mine ? '<b>أنت الحاكم الآن</b>' : 'يحكم السوق'}</div></div></div>`;
  h += `<div class="grid g3" style="margin-top:10px"><div><div class="small muted">نفوذك في السوق</div><b class="num">${sh}٪</b>${bar(sh, 100, mine ? '' : 'gold')}<div class="small muted">نفوذك ${f1(bs.p)} مقابل نفوذه ${f1(bs.b)}</div></div><div><div class="small muted">ثقته بك</div><b>${trustWord(bs.trust)} <span class="num">(${Math.round(bs.trust)})</span></b>${bar(bs.trust + 100, 200, bs.trust < 0 ? 'red' : '')}</div><div><div class="small muted">ما يدخل نفوذك يومياً</div><div class="small">دكاكينك ${E.shopsOf(S, lordCity).length} · مخازنك ${E.whsOf(S, lordCity)} · مبيعاتك في السوق</div></div></div>`;
  if (!mine) { const k = Math.round(150 * c.size * (c.country === S.home ? 1 : 1.4)); h += `<div class="row" style="margin-top:10px"><button class="sm pri" data-act="lobby" data-q="5" ${on ? '' : 'disabled'}>📣 اكسب نفوذاً +٥ (${fmt(5 * k)})</button><button class="sm" data-act="lobby" data-q="20" ${on ? '' : 'disabled'}>+٢٠ (${fmt(20 * k)})</button><button class="sm" data-act="gift" ${on ? '' : 'disabled'}>🎁 هدية (${fmt(Math.round(500 * c.size * (c.country === S.home ? 1 : 1.4)))})</button></div><div class="small muted">الإنفاق على النفوذ يُغضب الزعيم قليلاً. الهدية ترفع ثقته (مرة كل ١٠ أيام).</div>`; }
  else h += `<div class="small" style="margin-top:8px">فوائد الحكم: ٢٠٪ من ضريبة مبيعاتك هنا تعود إليك، وشراؤك أرخص ٣٪، وتُحسب لثروتك. حافظ على نفوذك فوق ${Math.round(E.BOSS_LOSE * 100)}٪.</div>`;
  h += `</div>`;
  if (!mine) {
    if (pc) {
      const d = E.PACTS[pc.type];
      h += `<div class="card" style="margin-bottom:12px"><h2 style="margin-top:0">${pactIc(pc.type)} ${d.name} <span class="pill good">قائم</span></h2><div class="small">${d.desc}</div><div class="kv"><span>المتبقي</span><b>${pc.left} من ${pc.total} يوم</b></div>${bar(pc.total - pc.left, pc.total, 'gold')}<div class="kv"><span>الرسم اليومي</span><b>${fmt(pc.daily)} ريال</b></div>${pc.share ? `<div class="kv"><span>حصته من إيراد الدكاكين</span><b>${Math.round(pc.share * 100)}٪</b></div>` : ''}<div class="kv"><span>البند الجزائي عند الفسخ</span><b>${fmt(pc.penalty)} ريال</b></div><div class="row"><button class="sm" data-act="breakp">فسخ العقد</button></div></div>`;
    } else {
      h += `<h2>عروض ${esc(bs.name)}</h2><div class="grid g2">` + Object.keys(E.PACTS).map(k => {
        const d = E.PACTS[k], tm = E.pactTerms(S, lordCity, k), why = E.pactBlock(S, lordCity, k);
        return `<div class="card ${why ? 'locked' : ''}"><h3 style="margin-top:0">${pactIc(k)} ${d.name}${tm.negotiated ? ' <span class="pill good">مخفَّض ٢٠٪</span>' : ''}</h3><div class="small">${d.desc}</div><div class="kv"><span>المدة</span><b>${tm.days} يوماً</b></div>${tm.daily ? `<div class="kv"><span>رسم يومي</span><b>${fmt(tm.daily)} ريال</b></div>` : ''}${tm.share ? `<div class="kv"><span>حصة الزعيم</span><b>${Math.round(tm.share * 100)}٪ من إيراد الدكاكين</b></div>` : ''}${tm.upfront ? `<div class="kv"><span>دفعة مقدّمة</span><b>${fmt(tm.upfront)} ريال</b></div>` : ''}<div class="kv"><span>بند جزائي</span><b>${fmt(tm.penalty)} ريال</b></div>${why ? `<div class="small dear" style="margin-top:6px">${esc(why)}</div>` : ''}<div class="row"><button class="sm pri" data-act="sign" data-k="${k}" ${why ? 'disabled' : ''}>✍️ وقّع العقد</button><button class="sm" data-act="nego" data-k="${k}" ${why || tm.negotiated ? 'disabled' : ''}>🗣️ فاوض</button></div></div>`;
      }).join('') + `</div>`;
    }
  }
  const all = P.pacts || [];
  h += `<h2>${uic('seal')}عقودي (${all.length} من ${E.MAX_PACTS})</h2>` + (all.length ? `<div class="grid g3">${all.map(x => `<div class="card"><b>${pactIc(x.type)} ${E.PACTS[x.type].name}</b><div class="small muted">${cityTag(x.city)} · ${esc(E.bossOf(S, x.city).name)}</div><div class="small">متبقٍ ${x.left} يوم${x.daily ? ' · ' + fmt(x.daily) + '/يوم' : ''}</div></div>`).join('')}</div>` : '<div class="card small muted">لا عقود قائمة.</div>');
  const ruled = S.order.filter(id => E.bossOf(S, id) && E.bossOf(S, id).ruler === 'player');
  h += `<div class="small muted" style="margin-top:10px">أسواق تحكمها: ${ruled.length ? ruled.map(cityTag).join('، ') : 'لا شيء بعد'}.</div>`;
  return h;
}
function screenEstate() {
  if (S.phase < 2) return teaser(2, '🏬', 'الدكاكين والمخازن', ['ابنِ دكاكين في مدن أي دولة وبِع فيها سلعك بسعرك', 'السكان يشترون منها يومياً بحسب طبقاتهم وسعرك', 'كل دكان جديد يفتح لك مخزناً إضافياً']);
  const P = S.player, cities = citiesOf(estC), c = S.cities[estCity] || S.cities[cities[0]], ct = CD[c.country];
  const shops = E.shopsOf(S, c.id), whs = E.whsOf(S, c.id), pr = P.props[c.id], cap = E.storeCap(S, c.id), ld = E.storeLoad(S, c.id), lim = E.shopLimit(c);
  let h = `${pic('scene/shop', 'banner', 'الدكان')}<p class="sub">ابنِ دكاكين في مدن العالم. كل دكان جديد يتيح لك مخزناً إضافياً، والبيع آلي من المخزن بالسعر الذي تحدده.</p>${countryChips(estC, 'data-ec')}<div class="chips" style="margin-bottom:12px">${cities.map(id => `<button data-estcity="${id}" class="${id === c.id ? 'on' : ''}">${esc(cityName(id))}${E.shopsOf(S, id).length ? ' 🏪' + E.shopsOf(S, id).length : ''}</button>`).join('')}</div>`;
  h += `<div class="card"><div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span><span class="pill">ضريبة ${Math.round(c.tax * 100)}٪</span>${c.country !== S.home ? '<span class="pill bad">البناء هنا أغلى ×١٫٤</span>' : ''}</div>
  <div class="grid g3" style="margin-top:10px"><div class="card"><h3>🏪 الدكاكين ${shops.length} / ${lim}</h3>${bar(shops.length, lim)}<div class="row"><button class="pri" data-act="bshop" ${shops.length >= lim ? 'disabled' : ''}>ابنِ دكاناً (${fmt(E.shopCost(S, c))})</button></div></div>
  <div class="card"><h3>📦 المخازن ${whs} / ${shops.length}</h3>${bar(whs, Math.max(1, shops.length))}<div class="small muted">كل دكان يفتح مخزناً واحداً.</div><div class="row"><button class="pri" data-act="bwh" ${whs >= shops.length ? 'disabled' : ''}>ابنِ مخزناً (${fmt(E.whCost(S, c))})</button></div></div>
  <div class="card"><h3>🧺 التخزين ${fmt(ld)} / ${fmt(cap)}</h3>${bar(ld, Math.max(1, cap), ld > cap * 0.9 ? 'red' : '')}<div class="small muted">دخل اليوم: <b class="num">${fmt(pr ? pr.today || 0 : 0)}</b></div></div></div>`;
  if (!shops.length) h += `<p class="muted">لا عقارات لك في ${esc(c.name)} بعد. الدكان الأول يعطيك أيضاً أسعاراً حيّة في هذه المدينة.</p>`;
  shops.forEach((sh, i) => {
    h += `<div class="shopbox"><div class="row" style="margin:0"><b>🏪 الدكان ${i + 1}</b><span class="small muted">يتسع لـ ${E.SHOP_ITEMS_MAX} سلع</span></div>`;
    sh.items.forEach(it => {
      const G = GD[it.g], mp = E.unitPrice(c, it.g), ref = E.refPrice(c, it.g), have = Math.floor(pr.store[it.g] || 0);
      h += `<div class="itemrow"><span style="font-size:22px">${gi(G.id)}</span><b>${G.name}</b><span class="small muted">سوق ${f1(mp)} · مخزن ${have}</span><span class="spacer"></span><label class="small">السعر ٪ <input type="number" id="ip${sh.id}_${it.g}" value="${Math.round(it.price * 100)}" min="50" max="200" step="5"></label><label class="small"><input type="checkbox" id="ia${sh.id}_${it.g}" ${it.auto ? 'checked' : ''}> تعبئة آلية</label><button class="sm pri" data-act="isave" data-s="${sh.id}" data-g="${it.g}">حفظ</button><button class="sm" data-act="irm" data-s="${sh.id}" data-g="${it.g}">إزالة</button><span class="small ${it.lastSold > 0.05 ? 'cheap' : 'muted'}">بيع اليوم ${f1(it.lastSold || 0)} · إجمالي ${fmt(it.revenue || 0)}</span></div>`;
    });
    if (sh.items.length < E.SHOP_ITEMS_MAX) h += `<div class="itemrow"><b class="small">أضف سلعة:</b><select id="ig${sh.id}">${GIDS.map(g => `<option value="${g}">${GD[g].icon} ${GD[g].name}</option>`).join('')}</select><label class="small">السعر ٪ <input type="number" id="ipn${sh.id}" value="105" min="50" max="200" step="5"></label><button class="sm pri" data-act="iadd" data-s="${sh.id}">أضف</button></div>`;
    h += `</div>`;
  });
  if (pr && (Object.keys(pr.store).some(g => pr.store[g] >= 1) || shops.length)) {
    const cr = main(), here = cr.city === c.id && cr.left === 0;
    h += `<h3 style="margin-top:12px">📦 محتوى المخزن</h3><div class="row small">${GIDS.filter(g => pr.store[g] >= 1).map(g => `<span class="pill">${gi(g)} ${GD[g].name}: ${Math.floor(pr.store[g])}</span>`).join('') || '<span class="muted">فارغ. أحضر بضاعة بالقافلة أو فعّل التعبئة الآلية.</span>'}</div>`;
    h += here ? `<div class="row small">${GIDS.filter(g => pr.store[g] >= 1).map(g => `<button class="sm" data-act="fromstore" data-g="${g}">حمّل ${GD[g].name} في القافلة</button>`).join('')}${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).map(g => `<button class="sm" data-act="tostore" data-g="${g}">أودع ${GD[g].name} من القافلة</button>`).join('')}</div>` : `<p class="small muted">لتحميل المخزن أو إيداع البضاعة، يجب أن تكون قافلتك في ${esc(c.name)}.</p>`;
  }
  return h + `</div>`;
}

/* ---------- ٦ الإمبراطورية ---------- */
function screenEmpire() {
  const P = S.player; let h = '';
  const names = S.order.map(id => [id, flag(id) + ' ' + cityName(id)]), goods = GIDS.map(g => [g, GD[g].name]);
  const opt = (arr, selv, none) => (none ? '<option value="">— لا شيء —</option>' : '') + arr.map(([v, n]) => `<option value="${v}" ${v === selv ? 'selected' : ''}>${n}</option>`).join('');
  if (S.phase < 2) h += teaser(2, '🚚', 'الأسطول', ['قادة قوافل بمسارات آلية بين مدينتين']);
  else {
    h += `<div class="card"><h2>🚚 الأسطول</h2><div class="row"><button class="pri" data-act="hire">توظيف قائد قافلة (١٥٠٠)</button><span class="small muted">${P.caravans.length}/٦ · الرواتب تزيد ٦٪ لكل قافلة إضافية</span></div>`;
    const cs = P.caravans.filter(c => c.captain);
    if (!cs.length) h += '<p class="small muted">لا قادة بعد. وظّف قائداً واختر له مساراً بين مدينتين.</p>';
    cs.forEach(c => {
      const r = c.route || {};
      h += `<div class="card" style="margin:8px 0"><b>${esc(c.name)}</b> <span class="small muted">${c.left > 0 ? 'في الطريق إلى ' + cityTag(c.dest) : 'في ' + cityTag(c.city) + (c.waiting ? ' — ' + esc(c.waiting) : '')} · تجارة ${c.captain.trade} ملاحة ${c.captain.nav} قتال ${c.captain.combat} · حمولة ${fmt(E.loadOf(c))}/${E.capOfCar(c)}</span><div class="row small">من <select id="ra${c.id}">${opt(names, r.a)}</select> يشتري <select id="rba${c.id}">${opt(goods, r.buyA, true)}</select> ← إلى <select id="rb${c.id}">${opt(names, r.b)}</select> يشتري <select id="rbb${c.id}">${opt(goods, r.buyB, true)}</select> <button class="sm pri" data-act="route" data-id="${c.id}">اعتمد المسار</button><button class="sm" data-act="cartc" data-id="${c.id}">+ عربة</button><button class="sm" data-act="guardc" data-id="${c.id}">+ حارس</button></div></div>`;
    });
    h += `</div>`;
  }
  if (S.phase < 3) h += `<div style="margin-top:12px">${teaser(3, '🏭', 'الصناعة', ['لكل دولة أداتها: عطور بالسعودية، نسيج بمصر، سجاد بفارس، مجوهرات بالهند، أدوات بالصين', 'تحتاج دكاناً في المدينة، وتوفّر وظائف فترتقي طبقات المدينة'])}</div>`;
  else {
    h += `<div class="card" style="margin-top:12px"><h2>🏭 الصناعة</h2><p class="small muted">لكل دولة أداتها الخاصة، ولا تُبنى إلا فيها. المصنع يأخذ المواد من مخزن المدينة أو من سوقها وينتج إلى المخزن، ويدفع أجوراً وصيانة. يلزمك دكان في المدينة.</p>${countryChips(empC, 'data-ee')}<div class="chips" style="margin-bottom:10px">${citiesOf(empC).map(id => `<button data-estcity2="${id}" class="${id === estCity ? 'on' : ''}">${esc(cityName(id))}</button>`).join('')}</div><div class="grid g2">`;
    const cc = S.cities[estCity] && S.cities[estCity].country === empC ? S.cities[estCity] : S.cities[citiesOf(empC)[0]];
    for (const rid in E.RECIPES) {
      const rc = E.RECIPES[rid], mine = rc.country === cc.country, inV = Object.keys(rc.inp).reduce((a, g) => a + rc.inp[g] * E.mid(g), 0), outV = rc.n * E.mid(rc.out), ex = P.factories.find(f => f.city === cc.id && f.recipe === rid);
      h += `<div class="card ${mine ? '' : 'locked'}"><b>${CD[rc.country].flag} ${rc.name}</b><div class="small muted">${Object.keys(rc.inp).map(g => rc.inp[g] + ' ' + GD[g].name).join(' + ')} ← ${rc.n} ${GD[rc.out].name}<br>قيمة تقريبية ${fmt(inV)} ← ${fmt(outV)}</div><div class="row"><button class="sm pri" data-act="factory" data-r="${rid}" data-c="${cc.id}" ${mine ? '' : 'disabled'}>${ex ? 'رقِّ (المستوى ' + ex.level + ')' : 'ابنِ'} في ${esc(cc.name)}</button>${mine ? '' : `<span class="small muted">لا تُبنى إلا في ${CD[rc.country].name}</span>`}</div></div>`;
    }
    h += `</div><h3 style="margin-top:10px">مصانعك</h3>${P.factories.length ? P.factories.map(f => `<div class="kv"><span>${E.RECIPES[f.recipe].name} — ${cityTag(f.city)}</span><b>المستوى ${f.level}</b></div>`).join('') : '<p class="small muted">لا مصانع بعد.</p>'}</div>`;
  }
  if (S.phase < 4) h += `<div style="margin-top:12px">${teaser(4, '🏦', 'المصرف والإمبراطورية', ['ودائع بفائدة، وقروض، وسندات حرب', 'ترقية رتبة السوق', 'تأسيس مدينتك الخاصة وأخذ ٢٠٪ من ضرائبها'])}</div>`;
  else {
    const B = P.bank, debt = B.loans.reduce((a, l) => a + l.amt, 0), c = S.cities[sel];
    h += `<div class="card" style="margin-top:12px"><h2>🏦 المصرف والإمبراطورية</h2><div class="grid g2"><div><h3>الودائع (تُسحب في مدينتها، رسم ١٪)</h3><div class="row"><button class="sm" data-act="dep" data-q="1000">أودع ١٠٠٠ في ${esc(c.name)}</button><button class="sm" data-act="dep" data-q="10000">١٠٬٠٠٠</button><button class="sm" data-act="wd" data-q="1000">اسحب ١٠٠٠</button><button class="sm" data-act="wd" data-q="999999">اسحب الكل</button></div>${Object.keys(B.dep).filter(k => B.dep[k] > 0.5).map(k => `<div class="kv"><span>${cityTag(k)}</span><b class="num">${fmt(B.dep[k])}</b></div>`).join('') || '<p class="small muted">لا ودائع.</p>'}</div><div><h3>القروض وسندات الحرب</h3><div class="row"><button class="sm" data-act="borrow" data-q="5000">اقترض ٥٠٠٠</button><button class="sm" data-act="repay">سدّد ما أمكن</button></div><div class="small muted">فائدة ٠٫٢٥٪ يومياً · الحدّ ٥٠٪ من ثروتك · عليك ${fmt(debt)}</div><div class="row"><button class="sm" data-act="bond">سند حرب (٥٠٠٠ · ٢٠ يوماً)</button></div><div class="small muted">٥٥٪ ربح ٥٠٪ · ٤٥٪ خسارة ٥٠٪ · لديك ${B.bonds.length} سند</div></div></div><h3 style="margin-top:10px">الإمبراطورية (المدينة المحددة: ${cityTag(sel)})</h3><div class="row"><button class="sm pri" data-act="upg">رقِّ سوق ${esc(c.name)} (رتبة ${c.tier} ← ${c.tier + 1}: ${c.tier === 1 ? '٨٠٠٠' : '٢٥٠٠٠'})</button></div><div class="row"><select id="fcZone">${E.COUNTRIES.map(k => `<option value="${k.id}">${k.flag} ${k.name}</option>`).join('')}</select><select id="fcGood">${GIDS.map(g => `<option value="${g}">${GD[g].name}</option>`).join('')}</select><button class="sm pri" data-act="found">أسّس مدينة جديدة (٦٠٬٠٠٠)</button></div><p class="small muted">تأخذ ٢٠٪ من ضرائب مدينتك الخاصة.</p></div>`;
  }
  return h;
}

/* ---------- ٧ الدول والدفتر ---------- */
const LN = { exchange: 'رسوم صرافة', realized: 'أرباح محققة من الصفقات', realizedLoss: 'خسائر محققة في الصفقات', sales: 'مبيعات القافلة', shops: 'مبيعات الدكاكين', purchases: 'مشتريات', tax: 'ضرائب', customs: 'جمارك', provisions: 'مؤن', wages: 'رواتب', wear: 'إهلاك العربات', bandits: 'لصوص', spoilage: 'تلف', insurance: 'تأمين', upkeep: 'صيانة', assets: 'أصول', hiring: 'توظيف', wealthLevy: 'زكاة وأعطيات', loanInterest: 'فوائد قروض', interest: 'فوائد ودائع', bonds: 'سندات', governor: 'عوائد مدينتك', labor: 'عمل يدوي', foundCity: 'تأسيس مدينة', factory: 'إنتاج مصانع', bailout: 'إنقاذ تجّار', agentUpkeep: 'نفقات التجّار', investment: 'استثمار التجّار', bankFee: 'رسوم مصرف', bondLoss: 'خسارة سندات' };
let testOut = '';
function screenCities() {
  let h = `<div class="chips" style="margin-bottom:12px">${[['cities', '🌍 الدول والمدن'], ['fx', '💱 الصرافة'], ['ledger', '📒 الدفتر'], ['test', '🧪 اختبار الاقتصاد']].map(([id, n]) => `<button data-ct="${id}" class="${ct === id ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (ct === 'cities') {
    const nm = ['متسولون', 'فقراء', 'أثرياء', 'نخبة'];
    E.COUNTRIES.forEach(k => {
      const cs = citiesOf(k.id), pop = cs.reduce((a, id) => a + E.popTotal(S.cities[id]), 0), own = E.GOODS.filter(x => x.org && x.org.includes(k.id));
      h += `<div class="countryhead"><span class="cbadge" style="background:${k.color}">${k.flag} ${k.name}</span><span class="pill">سكان ${fmt(pop)}</span><span class="pill">جمارك ${Math.round(k.customs * 100)}٪</span><span class="small muted">${own.map(x => gi(x.id)).join(' ')}</span></div><div class="grid g3">`;
      h += cs.map(id => {
        const c = S.cities[id], pt = E.popTotal(c);
        return `<div class="card citycard">${cityScene(c)}<div class="row" style="margin:0"><b style="font-size:17px">${esc(c.name)}</b><span class="pill">رتبة ${c.tier}</span>${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]}</span>` : ''}${E.shopsOf(S, id).length ? `<span class="pill good">🏪${E.shopsOf(S, id).length} 📦${E.whsOf(S, id)}</span>` : ''}</div><div class="small muted" style="margin:4px 0">السكان ${fmt(pt)} · شبع ${Math.round(c.sat.food * 100)}٪ · كماليات ${Math.round(c.sat.lux * 100)}٪</div>${c.pop.map((v, i) => `<div class="kv small"><span>${nm[i]}</span><b class="num">${fmt(v)}</b></div>${bar(v, pt, i === 3 ? 'gold' : '')}`).join('')}<div class="small muted" style="margin-top:6px">ينتج: ${c.makes.map(g => gi(g)).join(' ')}</div><div class="row"><button class="sm" data-act="viewcity" data-c="${id}">🗺️ الخريطة</button><button class="sm" data-act="viewmarket" data-c="${id}">🏪 السوق</button></div></div>`;
      }).join('') + `</div>`;
    });
    h += `<p class="small muted">المتسولون يحتاجون وظائف ليصيروا فقراء. وإذا وصل القمح بانتظام يرتقي الفقراء إلى أثرياء فتطلب المدينة الكماليات.</p>`;
  } else if (ct === 'fx') {
    const w = S.player.wallet, F = S.fx, mm = a => [Math.min(...a), Math.max(...a)];
    const [u0, u1] = mm(F.hu), [g0, g1] = mm(F.hg);
    h += `<div class="grid g3"><div class="card fxcard"><div class="small muted">🇸🇦 الريال السعودي</div><b class="num">${fmt(w.sar)}</b> ريال<div class="small muted">عملة السعودية، وأساس كل الأسعار</div></div><div class="card fxcard"><div class="small muted">💵 الدولار (عالمي، عملة بقية الدول)</div><b class="num">$${fmt(w.usd)}</b> ≈ ${fmt(w.usd * F.usd)} ريال<div class="small">السعر الآن <b class="num">${F.usd.toFixed(3)}</b> ريال <span style="color:var(--teal)">${spark(F.hu, 90, 22)}</span></div><div class="small muted">آخر ${F.hu.length} يوماً: ${u0.toFixed(2)} – ${u1.toFixed(2)}</div></div><div class="card fxcard"><div class="small muted">🥇 الذهب (غرام)</div><b class="num">${w.au.toFixed(3)}</b> غ ≈ ${fmt(w.au * F.gold)} ريال<div class="small">الغرام الآن <b class="num">${fmt(F.gold)}</b> ريال <span style="color:var(--teal)">${spark(F.hg, 90, 22)}</span></div><div class="small muted">آخر ${F.hg.length} يوماً: ${fmt(g0)} – ${fmt(g1)}</div></div></div>`;
    h += `<div class="card" style="margin-top:12px"><h2>${pic('hero/changer', 'boss', 'الصرّاف')} 💱 الصرافة</h2><div class="row"><label class="small">من <select id="fxFrom">${['sar', 'usd', 'au'].map(c => `<option value="${c}" ${fxFrom === c ? 'selected' : ''}>${E.CURS[c].icon} ${E.CURS[c].name}</option>`).join('')}</select></label><label class="small">إلى <select id="fxTo">${['sar', 'usd', 'au'].filter(c => c !== fxFrom).map(c => `<option value="${c}" ${fxTo === c ? 'selected' : ''}>${E.CURS[c].icon} ${E.CURS[c].name}</option>`).join('')}</select></label><label class="small">المبلغ <input type="number" id="fxAmt" min="0" step="any" value="" placeholder="0" style="width:120px"></label><button class="sm" data-act="fxpct" data-q="25">٢٥٪</button><button class="sm" data-act="fxpct" data-q="50">٥٠٪</button><button class="sm" data-act="fxpct" data-q="100">الكل</button><button class="pri" data-act="fxdo">حوّل</button></div><div id="fxPrev" class="small" style="min-height:22px">أدخل مبلغاً لترى ما ستستلمه.</div>
    <div class="row"><button class="sm" data-act="fxall" data-f="usd" data-t="sar" ${w.usd > 0 ? '' : 'disabled'}>كل الدولار ← ريال</button><button class="sm" data-act="fxall" data-f="au" data-t="sar" ${w.au > 0 ? '' : 'disabled'}>كل الذهب ← ريال</button><button class="sm" data-act="fxall" data-f="sar" data-t="usd" ${w.sar > 0 ? '' : 'disabled'}>كل الريال ← دولار</button></div>
    <p class="small muted">الرسم ١٪ بين الريال والدولار و١٫٥٪ للذهب. وإن اشتريت في بلد أجنبي بلا رصيد دولار يُحوَّل لك تلقائياً من محافظك الأخرى برسم الصرافة ٠٫٥٪ زيادة. الذهب لا يدرّ فائدة، لكنه يغلو في الحروب. ورسوم الصرافة المدفوعة حتى الآن: <b class="num">${fmt(S.player.led.exp.exchange || 0)}</b> ريال.</p></div>`;
  } else if (ct === 'ledger') {
    const L = S.player.led, tr = o => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => `<div class="kv"><span>${LN[k] || k}</span><b class="num">${fmt(o[k])}</b></div>`).join('') || '<p class="small muted">—</p>';
    h += `<div class="grid g2"><div class="card"><h2>دخلك</h2>${tr(L.inc)}</div><div class="card"><h2>مصروفك</h2>${tr(L.exp)}</div></div><div class="card" style="margin-top:12px"><h2>صفقاتك الأخيرة</h2>${S.player.trades.slice(0, 12).map(t => `<div class="kv small"><span>يوم ${t.day} · ${gi(t.g)} ${GD[t.g].name} × ${f1(t.q)} · ${cityTag(t.city)} · ${t.side === 'shop' ? 'دكان' : 'بيع'}</span><b class="pl ${plCls(t.pl)} num">${sgn(t.pl)} ر.س</b></div>`).join('') || '<p class="small muted">لا صفقات بعد.</p>'}</div><div class="card" style="margin-top:12px"><h2>الثروة الصافية</h2><div style="color:var(--teal)">${spark(S.hist.nw, 520, 70)}</div></div><div class="card" style="margin-top:12px"><h2>مصارف العالم كلّه (أي تاجر)</h2><div class="row">${Object.keys(S.stats.sink).sort((a, b) => S.stats.sink[b] - S.stats.sink[a]).map(k => `<span class="pill">${LN[k] || k}: ${fmt(S.stats.sink[k])}</span>`).join('')}</div><h3>منابع من خارج التجارة</h3><div class="row">${Object.keys(S.stats.fauc).map(k => `<span class="pill">${LN[k] || k}: ${fmt(S.stats.fauc[k])}</span>`).join('') || '—'}</div></div>`;
  } else {
    h += `<div class="card"><p class="small">يشغّل المحاكاة آلياً ٨ بذور مع لاعب آلي، ويفحص الأسعار غير المنطقية، وانهيار المخزون أو امتلاءه، ونموّ الثروة، والمصارف.</p><div class="row"><button class="pri" data-act="stress">شغّل ١٠٠ يوم</button><button data-act="stress2">٣٠٠ يوم</button></div><div id="testOut">${testOut}</div></div>`;
  }
  return h;
}
function runStress(days) {
  $('testOut').innerHTML = '<p class="muted">جارٍ التشغيل…</p>';
  setTimeout(() => {
    const r = E.stressTest({ seeds: 8, days, bot: true }), s = r.summary;
    testOut = `<div class="kv"><span>أخطاء رقمية (NaN)</span><b class="${r.nan ? 'dear' : 'cheap'}">${r.nan}</b></div><div class="kv"><span>أدنى/أعلى سعر نسبياً</span><b class="num">${r.minRatio.toFixed(2)} – ${r.maxRatio.toFixed(2)}</b></div><div class="kv"><span>نفاد المخزون / امتلاؤه</span><b class="num">${s.floorPct}٪ / ${s.ceilPct}٪</b></div><div class="kv"><span>شبع السكان</span><b class="num">${Math.round(s.avgFoodSat * 100)}٪</b></div><div class="kv"><span>متوسط ذهب التاجر الآلي (بدأ ٦٠٠)</span><b class="num">${fmt(s.avgAgentGold)}</b></div><div class="kv"><span>ثروة اللاعب الآلي: متوسط / أدنى / أعلى</span><b class="num">${fmt(s.avgPlayerNW)} / ${fmt(s.minPlayerNW)} / ${fmt(s.maxPlayerNW)}</b></div><p class="small muted">أكبر المصارف: ${Object.keys(r.sinks).sort((a, b) => r.sinks[b] - r.sinks[a]).slice(0, 5).map(k => (LN[k] || k) + ' ' + fmt(r.sinks[k])).join('، ')}</p>`;
    if ($('testOut')) $('testOut').innerHTML = testOut;
  }, 30);
}

/* ---------- الجولة التعليمية ---------- */
const hasCargo = () => Object.keys(main().cargo).some(g => main().cargo[g] >= 1);
const sellKey = () => { const t = S.player.trades[0]; return t ? t.day + '|' + t.q + '|' + Math.round(t.net) : ''; };
function nearestDomestic() {
  const m = main(), c = S.cities[m.city];
  return S.order.filter(id => id !== m.city && S.cities[id].country === c.country).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0];
}
function lastSellLine() {
  const t = S.player.trades.find(x => x.side === 'sell'); if (!t) return 'بعت وتعلّمت.';
  const cost = t.net - t.pl, pc = cost > 0 ? Math.round(100 * t.pl / cost) : 0;
  return t.pl >= 0 ? `آخر صفقة: <b class="cheap">ربحت ${fmt(t.pl)} ريال</b> (${pc}٪ على ما دفعت).` : `آخر صفقة: <b class="dear">خسرت ${fmt(-t.pl)} ريال</b>. لا بأس: الخسارة الأولى أرخص معلّم.`;
}
// أنسب صفقة للمبتدئ: من أفضل الصفقات داخل بلده أولاً (بلا جمارك)، وإلا الأفضل عموماً
function tutPlan() {
  if (S.tut.f.plan) return S.tut.f.plan;
  const m = main(), hc = S.cities[m.city].country, all = deals();
  const big = all.filter(o => o.q >= 3 && o.profit >= 50), pool = (big.length ? big : all.filter(o => o.q >= 3).length ? all.filter(o => o.q >= 3) : all).slice().sort((x, y) => (y.pct || 0) - (x.pct || 0)), dom = pool.filter(o => S.cities[o.d].country === hc), pick = dom[0] || pool[0];
  const plan = pick ? { g: pick.g, d: pick.d, q: pick.q, profit: Math.round(pick.profit), foreign: S.cities[pick.d].country !== hc } : { g: 'wheat', d: nearestDomestic(), q: 10, profit: 0, foreign: false };
  if (S.tut.i >= 1) S.tut.f.plan = plan; return plan;
}
// أفضل مدينة لبيع ما تحمله الآن (داخل البلد أولاً إن ربحت فيها)
function tutDest() {
  const m = main(), hc = S.cities[m.city].country, held = E.GIDS.filter(g => (m.cargo[g] || 0) >= 1).sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0];
  if (!held) return { d: nearestDomestic(), profit: 0 };
  const opts = E.sellOptions(S, m.city, held, Math.floor(m.cargo[held]), E.avgCost(m.basis, held) || E.mid(held), m);
  const dom = opts.filter(o => o.country === hc && o.profit > 0)[0], best = dom || opts[0];
  return { d: best.city, g: held, profit: Math.round(best.profit), foreign: best.country !== hc };
}
const GOALS = { read: 'اضغط بطاقة السلعة المضيئة', buy: 'اختر الكمية ثم اضغط «اشترِ»', caravan: 'افتح تبويب «القافلة»', pick: 'اضغط المدينة المضيئة على الخريطة', go: 'اضغط زر «سافر»', wait: 'اضغط ▶ وانتظر وصول القافلة', sell: 'اضغط «بِع كل البضاعة»', fx: 'اضغط «محفظتك» أعلى الصفحة' };
function burst() {
  const c = $('coach'); if (!c || c.hidden) return; const r = c.getBoundingClientRect();
  ['✨', '⭐', '🪙', '✨', '🌟', '🪙', '✨', '⭐'].forEach((e, i) => { const s = document.createElement('span'); s.className = 'burst'; s.textContent = e; s.style.left = (r.left + r.width * (0.1 + 0.8 * Math.random())) + 'px'; s.style.top = (r.top + 10) + 'px'; s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); s.style.setProperty('--dy', (-40 - Math.random() * 90) + 'px'); document.body.appendChild(s); setTimeout(() => s.remove(), 1100); });
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
}
const TUT = [
  { id: 'intro', kind: 'info', scr: 'home', title: 'مرحباً أيها التاجر 🐪', next: 'ابدأ الجولة', go: 'market',
    body: () => `في دقائق ستتعلم: كيف <b>تقرأ السوق</b>، وتشتري، وتسافر، وتبيع، وتعرف ربحك. الجولة على لعبتك الحقيقية، والوقت متوقف حتى تشغّله أنت.<br><br>معك <b>٨٠٠ ريال 🇸🇦</b> وقافلة صغيرة في الرياض. الريال عملة السعودية، والدولار 💵 عملة بقية الدول، والذهب 🥇 تحفظ فيه قيمتك.` },
  { id: 'read', kind: 'action', scr: 'market', title: 'اقرأ السوق', target: () => '.gcard[data-gd="' + tutPlan().g + '"]',
    done: () => dg !== null || hasCargo(),
    body: () => `كل بطاقة سلعة تعرض: <b>السعر بالريال</b>، وشارة <span class="pill good">رخيص</span> أو <span class="pill bad">غالٍ</span> مقارنة بسعرها المعتاد، و<b>المتوفر</b>، و«<b>أقدر آخذ</b>» بحسب رصيدك وحمولتك.<br><br>القاعدة: <b>اشترِ الأخضر الرخيص، وبِعه حيث يكون أغلى.</b><br><br>👆 حسبتُ لك أنسب صفقة الآن: <b>${gi(tutPlan().g)} ${GD[tutPlan().g].name}</b> تشتريها هنا وتبيعها في <b>${cityTag(tutPlan().d)}</b>${tutPlan().foreign ? ' (دولة أخرى: ستدفع جمارك)' : ''}. اضغط عليها لتفتح تفاصيلها.` },
  { id: 'buy', kind: 'action', scr: 'market', title: 'اشترِ بعد أن تحسب', target: () => (dg ? '#modal button[data-act="buy"]' : '.gcard[data-gd="' + tutPlan().g + '"]'),
    done: () => hasCargo(),
    body: () => `في اللوحة جدول <b>أين أبيع</b>: ربحك المتوقع في كل مدينة بعد الضريبة والجمارك والمؤن. الأخضر ربح والأحمر خسارة.<br><br>اختر كمية (الأقصى المتاح يناسب هذه الصفقة، لكن اترك ريالات لمؤن الطريق) ثم اضغط <b>اشترِ</b>.` },
  { id: 'caravan', kind: 'action', scr: 'caravan', title: 'تعرّف على قافلتك', target: () => '#nav [data-go="caravan"]',
    done: () => !!S.tut.f.caravan,
    body: () => `شاشة <b>القافلة</b> تعرض حمولتك وتكلفة شرائك لكل سلعة. القافلة تتسع ١٠٠ وزن (لكل سلعة وزنها)، والطاقم يأكل مؤناً في الطريق.<br><br>على الدروب لصوص: <b>الحرّاس</b> يصدّونهم، و<b>التأمين</b> يخفف الخسارة. 👆 افتح شاشة القافلة.` },
  { id: 'pick', kind: 'action', scr: 'map', title: 'اختر وجهتك', target: () => '#map [data-city="' + tutDest().d + '"]',
    done: () => !!S.tut.f.picked && S.tut.f.picked !== main().city,
    body: () => `الخريطة تُريك الدول والمدن. اضغط مدينة لترى <b>المدة</b> و<b>خطر اللصوص</b> و<b>الجمارك</b> (تُدفع عند دخول دولة أخرى).<br><br>حسابي لبضاعتك: أفضل مكان تبيعها فيه الآن <b>${cityTag(tutDest().d)}</b>، وربحك المتوقع نحو <b class="${tutDest().profit >= 0 ? 'cheap' : 'dear'}">${fmt(tutDest().profit)} ريال</b>${tutDest().foreign ? ' (دولة أخرى: تُدفع جمارك)' : ' (من بلدك: بلا جمارك)'}.` },
  { id: 'go', kind: 'action', scr: 'map', title: 'سافر', target: () => 'button[data-act="go"]',
    done: () => main().left > 0 || !hasCargo() && S.player.trips > (S.tut.f.trips0 || 0),
    body: () => `زر <b>سافر</b> يشتري المؤن لطاقمك ويبدأ الرحلة. أثناء السفر لا تتاجر، لكن الوقت يمضي والأسعار تتغير في كل مكان.` },
  { id: 'wait', kind: 'action', scr: 'map', title: 'الطريق', target: () => (speed ? null : '#b1'),
    done: () => main().left === 0 && S.player.trips > (S.tut.f.trips0 || 0),
    body: () => `${speed ? 'الوقت يمضي.' : '<b>الوقت متوقف</b>: اضغط ▶ أعلى الصفحة ليبدأ.'} راقب القافلة على الخريطة وسرّع بزر ⏩.<br><br>قد تهبّ عاصفة أو يهاجمك لصوص، وهذا جزء من التجارة. سنكمل عند الوصول.` },
  { id: 'sell', kind: 'action', scr: 'market', title: 'بِع واعرف ربحك', target: () => 'button[data-act="sellall"]',
    done: () => { const t = S.player.trades[0]; return !!t && t.side === 'sell' && sellKey() !== S.tut.f.lastTrade; },
    body: () => `وصلت! اضغط <b>بِع كل البضاعة</b>. المبلغ <b>الصافي</b> بعد ضريبة المدينة. إن كان أقل من تكلفتك فهي خسارة، وستعرف بالضبط كم ربحت أو خسرت.` },
  { id: 'lesson', kind: 'info', scr: 'market', title: 'ماذا تعلمت؟', next: 'التالي',
    body: () => `${lastSellLine()}<br><br>تذكّر: كل شراء كبير <b>يرفع</b> السعر وكل بيع كبير <b>يخفضه</b> (انزلاق السعر)، فالصفقة الأكبر ليست دائماً الأربح. وجرّب سلعاً ومدناً مختلفة: الفروق بين الدول أكبر.` },
  { id: 'fx', kind: 'action', scr: 'cities', title: 'العملات والسفر للخارج', target: () => '#hWallets', skip: true,
    done: () => !!S.tut.f.fx,
    body: () => `خارج السعودية يتعاملون بالدولار. إن لم يكن معك دولار يُحوَّل لك تلقائياً من ريالك برسم صغير. وللتحويل بنفسك أو لمتابعة سعر الدولار والذهب اضغط <b>محفظتك</b> أعلى الصفحة.` },
  { id: 'next', kind: 'info', scr: 'estate', title: 'ما الذي بعد ذلك؟', next: 'التالي',
    body: () => `عند ثروة <b>${fmt(E.PHASE_AT[1])}</b> يُفتح <b>الطور ٢</b>: تبني <b>دكاناً</b> في أي مدينة تبيع فيه بسعرك وسكان المدينة يشترون منه، وكل دكان جديد يفتح لك <b>مخزناً</b>. ثم قادة قوافل آليون، ثم مصانع ومصرف. كل ذلك يبقى لك ولا يُصادَر.` },
  { id: 'done', kind: 'info', scr: 'market', title: 'أنت جاهز 🎉', next: 'انطلق',
    body: () => `<ul class="lessons"><li>قرأت السوق: الأخضر رخيص والأحمر غالٍ</li><li>اشتريت بعد حساب الربح المتوقع</li><li>سافرت وتحمّلت المؤن والجمارك</li><li>بعت وعرفت صافي ربحك</li><li>عرفت العملات والمحفظة</li></ul>نصيحة أخيرة: تابع <b>أفضل الصفقات</b> في أعلى السوق، واحسب قبل أن تشتري. ويمكنك إعادة الجولة من الصفحة الرئيسية في أي وقت.<br><br>بالتوفيق يا سيّد السوق!` },
];
function tutInit() {
  if (S.tut) return;
  const fresh = S.day === 0 && S.player.trips === 0 && !hasCargo();
  S.tut = { on: fresh, i: 0, f: { trips0: S.player.trips, lastTrade: sellKey() }, min: false };
}
function tutRestart() { S.tut = { on: true, i: 0, f: { trips0: S.player.trips, lastTrade: sellKey() }, min: false }; go('home'); }
function tutNext() {
  const st = TUT[S.tut.i]; S.tut.i++;
  if (S.tut.i >= TUT.length) { S.tut.on = false; toast('بالتوفيق يا سيّد السوق! 🐪'); persist(); return renderAll(true); }
  const nx = TUT[S.tut.i]; if (st.go) return go(st.go);
  renderAll(true);
}
function tutAdvance() {
  if (!S.tut || !S.tut.on) return false; let moved = false, g = 0;
  while (S.tut.on && g++ < 12) { const st = TUT[S.tut.i]; if (st && st.kind === 'action' && st.done()) { S.tut.i++; moved = true; if (S.tut.i >= TUT.length) S.tut.on = false; } else break; }
  if (moved && S.tut.on) { toast('أحسنت ✓'); setTimeout(burst, 60); }
  return moved;
}
let hlStep = '', hlScreen = '';
function placeSpot() {
  const sp = $('spot'); if (!sp) return; const n = document.querySelector('.tut-hl');
  if (!n || !S || !S.tut || !S.tut.on || S.tut.min) { sp.hidden = true; return; }
  const r = n.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) { sp.hidden = true; return; }
  sp.style.left = (r.left - 6) + 'px'; sp.style.top = (r.top - 6) + 'px'; sp.style.width = (r.width + 12) + 'px'; sp.style.height = (r.height + 12) + 'px'; sp.hidden = false;
  const down = r.bottom + 56 < innerHeight; sp.querySelector('b').style.cssText = down ? '' : 'top:auto;bottom:100%;transform:translateX(-50%) rotate(180deg)';
}
window.addEventListener('scroll', () => placeSpot(), { passive: true, capture: true }); window.addEventListener('resize', () => placeSpot());
function renderCoach() {
  const el = $('coach'), t = S.tut;
  document.querySelectorAll('.tut-hl').forEach(n => n.classList.remove('tut-hl'));
  if (!t || !t.on) { el.hidden = true; document.body.classList.remove('coaching'); return; }
  const st = TUT[t.i], total = TUT.length;
  if (hlScreen !== screen) { hlScreen = screen; hlStep = ''; }
  document.body.classList.toggle('coaching', !t.min);
  const pct = Math.round(t.i / total * 100);
  let h = `<div class="chead">${av('official')}<b>${st.title}</b><span class="small" style="opacity:.85">${t.i + 1}/${total}</span><button class="sm" data-act="tutmin" title="${t.min ? 'توسيع' : 'تصغير'}">${t.min ? '▲' : '▼'}</button></div><div class="cmain">`;
  h += `<div class="pbar"><i style="width:${Math.max(4, pct)}%"></i></div>`;
  if (!t.min) {
    h += `<div class="cbody">${st.body()}</div>`;
    if (st.kind === 'action' && GOALS[st.id]) h += `<div class="goal ${st.done() ? 'ok' : ''}"><span class="gk"></span><span>المطلوب منك: ${GOALS[st.id]}</span></div>`;
    if (screen !== st.scr && st.kind === 'action' && !(st.id === 'buy' && dg) ) h += `<div class="row"><button class="sm pri" data-act="tutgo" data-s="${st.scr}">اذهب إلى ${SCREENS.find(x => x[0] === st.scr)[2]}</button></div>`;
    h += `<div class="row" style="margin-bottom:0"><button class="sm" data-act="tutskip">تخطّي الجولة</button><span class="spacer"></span>${st.kind === 'info' ? `<button class="pri" data-act="tutnext">${st.next}</button>` : st.skip ? '<button class="sm" data-act="tutnext">تخطَّ هذه الخطوة</button>' : ''}</div>`;
  }
  h += '</div>';
  el.innerHTML = h; el.hidden = false;
  const sel2 = !t.min && st.target ? st.target() : null;
  setTimeout(placeSpot, 30);
  if (sel2) { const n = document.querySelector(sel2); if (n && (!n.closest('#screen') || screen === st.scr || st.id === 'caravan' || st.id === 'fx')) { n.classList.add('tut-hl'); const hk = t.i + '|' + screen + '|' + (dg ? 1 : 0); if (hlStep !== hk) { hlStep = hk; try { n.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e) {} } } }
}

/* ---------- العرض ---------- */
const RENDER = { home: screenHome, map: screenMap, market: screenMarket, caravan: screenCaravan, estate: screenEstate, empire: screenEmpire, lords: screenLords, cities: screenCities };
function renderAll(force) {
  tutInit(); tutAdvance();
  renderHeader();
  if (!force && pressing) { dirty = true; return; }
  renderNav();
  const ae = document.activeElement, scr = $('screen');
  if (!force && ae && /^(SELECT|INPUT)$/.test(ae.tagName) && ae.type !== 'checkbox' && scr.contains(ae)) return;
  if (!force && screen === 'cities' && ct === 'test') return;
  if (!force && (screen === 'estate' || screen === 'empire') && ae && scr.contains(ae)) return;
  $('journeyBar').innerHTML = journeyBar();
  scr.innerHTML = RENDER[screen]();
  if (force || !dg) renderModal();
  renderCoach();
  dirty = false;
}
function leaveTo(s) { screen = s; dg = null; try { history.pushState(null, '', '#' + s); } catch (e) {} window.scrollTo(0, 0); }

function dealGo(gd, to, want) {
  const m = main(), c0 = S.cities[m.city], cr0 = c0.country !== S.cities[to].country ? CD[S.cities[to].country].customs : 0;
  if (m.left > 0) return toast('القافلة في الطريق');
  const dd = E.tripDays(S, m, m.city, to), reserve = E.supplyNeed(m, dd) * E.unitPrice(c0, 'wheat') * 1.25 + 10;
  const room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[gd].w), afford = Math.floor((S.player.gold - reserve) / (E.unitPrice(c0, gd) * (1 + cr0 * 1.1)));
  const k = Math.max(0, Math.min(room, afford, want || 999));
  if (k < 1) return toast('رصيدك أو مساحة القافلة لا يكفي لهذه الصفقة');
  A.buy(S, m.id, gd, k);
  const r = A.travel(S, m.id, to);
  if (r.ok) { toast('اشتريت ' + k + ' ' + GD[gd].name + ' وانطلقت'); sel = m.city; dg = null; leaveTo('map'); setSpeed(speed || 1); } else act(r);
}
function fxPreview() {
  const el = $('fxPrev'); if (!el) return;
  const f = $('fxFrom').value, t = $('fxTo').value, amt = parseFloat($('fxAmt').value) || 0, w = S.player.wallet;
  if (f === t) { el.innerHTML = '<span class="dear">اختر عملتين مختلفتين</span>'; return; }
  const a = Math.min(amt, w[f]), val = a * E.rateOf(S, f), fee = val * E.feeOf(f, t), got = (val - fee) / E.rateOf(S, t);
  el.innerHTML = amt > w[f] ? `<span class="dear">رصيدك ${f === 'au' ? w[f].toFixed(3) : fmt(w[f])} فقط</span>` : `تدفع ${f === 'au' ? a.toFixed(3) : fmt(a)} ${E.CURS[f].name} ← تستلم <b>${t === 'au' ? got.toFixed(3) : fmt(got)}</b> ${E.CURS[t].name} · رسم ${fmt(fee)} ريال (${(E.feeOf(f, t) * 100).toFixed(1)}٪)`;
}
document.addEventListener('input', ev => { if (ev.target.id === 'fxAmt') fxPreview(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && dg) { dg = null; renderAll(true); } });

/* ---------- الأحداث ---------- */
document.addEventListener('pointerdown', () => { pressing = true; clearTimeout(document.__pt); document.__pt = setTimeout(() => { pressing = false; }, 1500); });
document.addEventListener('pointercancel', () => { pressing = false; if (dirty) renderAll(false); });
document.addEventListener('change', ev => {
  const i = ev.target; if (!i || !i.classList || !i.classList.contains('qin')) return;
  const mx = +i.dataset.max || 1, v = clampQ(i.value, mx), k = i.dataset.k; if (k === 'm') dq = v; else QS[k] = v; renderAll(true);
});
document.addEventListener('click', ev => {
  pressing = false;
  const t = ev.target.closest('[data-go],[data-city],[data-ct],[data-act],[data-mc],[data-mf],[data-ec],[data-ee],[data-estcity],[data-estcity2],[data-gd],[data-dq],[data-lc],[data-lcity]'); if (!t) { if (ev.target.id === 'modal') { dg = null; renderAll(true); return; } if (dirty) renderAll(false); return; }
  const d = t.dataset;
  if (d.go) return go(d.go);
  if (d.city) { sel = d.city; if (S.tut && screen === 'map') S.tut.f.picked = sel; return renderAll(true); }
  if (d.ct) { ct = d.ct; if (S.tut && ct === 'fx') S.tut.f.fx = true; return renderAll(true); }
  if (d.mc) { mapC = d.mc; if (mapC !== 'all' && S.cities[sel].country !== mapC) sel = citiesOf(mapC)[0]; return renderAll(true); }
  if (d.mf) { mf = d.mf; return renderAll(true); }
  if (d.gd) { dg = d.gd; const pl = S.tut && S.tut.on && S.tut.f.plan; dq = pl && pl.g === d.gd ? pl.q : 10; return renderAll(true); }
  if (d.dq) { dq = d.dq; return renderAll(true); }
  if (d.ec) { estC = d.ec; estCity = citiesOf(estC)[0]; return renderAll(true); }
  if (d.ee) { empC = d.ee; estCity = citiesOf(empC)[0]; return renderAll(true); }
  if (d.lc) { lordC = d.lc; lordCity = citiesOf(lordC)[0]; return renderAll(true); }
  if (d.lcity) { lordCity = d.lcity; return renderAll(true); }
  if (d.estcity) { estCity = d.estcity; return renderAll(true); }
  if (d.estcity2) { estCity = d.estcity2; return renderAll(true); }
  const a = d.act, cr = car(), g = d.g, q = +d.q, m = main();
  switch (a) {
    case 'qin': return;
    case 'qstep': { const mx = +d.max || 1, k = d.k; const cur = k === 'm' ? (dq === 'max' ? mx : +dq || 1) : (QS[k] == null ? (k.startsWith('d:') ? (deals().find(o => 'd:' + o.g + ':' + o.d === k) || { q: 1 }).q : 1) : QS[k]); const nv = clampQ(cur + (+d.d), mx); if (k === 'm') dq = nv; else QS[k] = nv; return renderAll(true); }
    case 'buy': return act(A.buy(S, m.id, g, q));
    case 'sell': return act(A.sell(S, m.id, g, q));
    case 'go': { const r = A.travel(S, m.id, d.to); if (r.ok) { toast(r.msg); sel = m.city; leaveTo('map'); setSpeed(speed || 1); } else act(r); return; }
    case 'play': return setSpeed(1);
    case 'guideoff': guideOff = true; try { localStorage.setItem('darb-guide-off', '1'); } catch (e) {} return renderAll(true);
    case 'sellall': { let tot = 0, n = 0; GIDS.forEach(x => { const k = Math.floor(m.cargo[x] || 0); if (k > 0) { const b = S.player.gold; const r = A.sell(S, m.id, x, k); if (r.ok) { n += k; tot += S.player.gold - b; } } }); return act({ ok: n > 0, msg: n ? 'بعت ' + n + ' وحدة بصافي ' + fmt(tot) + ' ريال' : 'لا بضاعة للبيع' }); }
    case 'dealgo': return dealGo(d.g, d.d, +d.q || 999);
    case 'dealgo2': return dealGo(d.g, d.d, +d.q || 999);
    case 'gdclose': dg = null; return renderAll(true);
    case 'openfx': ct = 'fx'; return go('cities');
    case 'tutnext': return tutNext();
    case 'tutskip': S.tut.on = false; persist(); return renderAll(true);
    case 'navtog': ui.nav = !ui.nav; return saveUi();
    case 'toptog': ui.top = !ui.top; return saveUi();
    case 'tutmin': S.tut.min = !S.tut.min; return renderAll(true);
    case 'tutgo': return go(d.s);
    case 'tutrestart': return tutRestart();
    case 'fxdo': { const amt = parseFloat($('fxAmt').value); return act(A.exchange(S, $('fxFrom').value, $('fxTo').value, amt)); }
    case 'fxall': return act(A.exchange(S, d.f, d.t, S.player.wallet[d.f]));
    case 'fxpct': { const f = $('fxFrom').value; $('fxAmt').value = (S.player.wallet[f] * (+d.q) / 100).toFixed(f === 'au' ? 3 : 0); return fxPreview(); }
    case 'selcar': carSel = +d.id; return renderAll(true);
    case 'cart': return act(A.buyCart(S, cr.id));
    case 'crew': return act(A.hireCrew(S, cr.id));
    case 'guard': return act(A.hireGuard(S, cr.id));
    case 'cartc': return act(A.buyCart(S, +d.id));
    case 'guardc': return act(A.hireGuard(S, +d.id));
    case 'work': return act(A.work(S));
    case 'hire': return act(A.hireCaptain(S));
    case 'bshop': return act(A.buildShop(S, estCity));
    case 'bwh': return act(A.buildWarehouse(S, estCity));
    case 'isave': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, g, (+$('ip' + sid + '_' + g).value || 100) / 100, $('ia' + sid + '_' + g).checked)); }
    case 'irm': return act(A.shopRemoveItem(S, estCity, +d.s, g));
    case 'iadd': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, $('ig' + sid).value, (+$('ipn' + sid).value || 105) / 100, true)); }
    case 'fromstore': return act(A.fromStore(S, m.id, g, 999));
    case 'tostore': return act(A.toStore(S, m.id, g, 999));
    case 'estcity': estCity = d.c; estC = S.cities[estCity].country; return go('estate');
    case 'route': { const id = +d.id, a1 = $('ra' + id).value, b1 = $('rb' + id).value; if (a1 === b1) return toast('اختر مدينتين مختلفتين'); return act(A.setRoute(S, id, { a: a1, b: b1, buyA: $('rba' + id).value || null, buyB: $('rbb' + id).value || null })); }
    case 'factory': return act(A.buildFactory(S, d.c, d.r));
    case 'dep': return act(A.deposit(S, sel, q));
    case 'wd': return act(A.withdraw(S, sel, q));
    case 'borrow': return act(A.borrow(S, q));
    case 'repay': return act(A.repay(S));
    case 'bond': return act(A.buyBond(S));
    case 'upg': return act(A.upgradeMarket(S, sel));
    case 'found': return act(A.foundCity(S, $('fcZone').value, $('fcGood').value));
    case 'viewcity': sel = d.c; mapC = S.cities[sel].country; return go('map');
    case 'tolord': lordCity = d.c; lordC = S.cities[lordCity].country; return go('lords');
    case 'lobby': return act(A.lobby(S, lordCity, q));
    case 'gift': return act(A.gift(S, lordCity));
    case 'nego': return act(A.negotiate(S, lordCity, d.k));
    case 'sign': return act(A.signPact(S, lordCity, d.k));
    case 'breakp': return act(A.breakPact(S, lordCity));
    case 'viewmarket': sel = d.c; leaveTo('market'); return renderAll(true);
    case 'dev1': S.player.gold += 10000; persist(); return renderAll(true);
    case 'dev2': S.player.gold += 50000; persist(); return renderAll(true);
    case 'dev3': for (let i = 0; i < 20; i++) E.tick(S); persist(); return renderAll(true);
    case 'devnew': { const b = $('devNew'); if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'اضغط للتأكيد (تفقد الحالية)'; return; } delete b.dataset.sure; b.textContent = 'لعبة جديدة'; S = E.newGame(Date.now() % 100000 + 1); sel = 'riyadh'; carSel = 1; mapC = 'all'; persist(); $('dev').hidden = true; setSpeed(0); return go('home'); }
    case 'stress': return runStress(100);
    case 'stress2': return runStress(300);
  }
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'fxFrom') { fxFrom = ev.target.value; if (fxTo === fxFrom) fxTo = ['sar', 'usd', 'au'].find(c => c !== fxFrom); renderAll(true); return; }
  if (ev.target.id === 'fxTo') { fxTo = ev.target.value; fxPreview(); return; }
  if (ev.target.id === 'pctBox') { pct = ev.target.checked; renderAll(true); }
  if (ev.target.id === 'insBox') { A.insure(S, car().id, ev.target.checked); renderAll(true); }
});
$('bPause').onclick = () => setSpeed(0);
$('b1').onclick = () => setSpeed(1); $('b2').onclick = () => setSpeed(2); $('b3').onclick = () => setSpeed(3);
$('bNext').onclick = () => { speed = 0; clearInterval(timer); step(); renderAll(true); };
$('bDev').onclick = () => { $('dev').hidden = !$('dev').hidden; };
window.addEventListener('beforeunload', persist);

boot();
{ const h = location.hash.replace('#', ''); screen = SCREENS.some(x => x[0] === h) ? h : 'home'; }
renderAll(true);
window.__game = { get S() { return S; }, E, setSpeed, go };
})();
