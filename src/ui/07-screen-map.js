/* ---------- 2 الخريطة ---------- */
function countryChips(cur, attr) { return `<div class="chips" style="margin-bottom:10px">${attr === 'data-mc' ? `<button ${attr}="all" class="${cur === 'all' ? 'on' : ''}">🌍 كل العالم</button>` : ''}${E.COUNTRIES.map(c => `<button ${attr}="${c.id}" class="${cur === c.id ? 'on' : ''}">${c.flag} ${c.name}</button>`).join('')}</div>`; }
function selectCity(id) {
  if (!S.cities[id]) return;
  sel = id;
  if (screen === 'map' && mapC === 'all' && innerWidth < 600) { mapC = S.cities[sel].country; mapView = { zoom: 1, center: null }; }
  if (S.tut && screen === 'map') S.tut.f.picked = sel;
  return renderAll(true);
}
const mapBox = flatMapBox;
function flatMapBox() {
  const all = mapC === 'all', CT = S.cities, ids = all ? S.order : citiesOf(mapC);
  const W = ($('mapbox') && $('mapbox').clientWidth) || Math.max(1, $('screen').clientWidth - (innerWidth >= 1000 ? 338 : 2));
  const height = W < 600 ? (all && mapView.zoom < 1.8 ? 260 : 340) : 450;
  mapBase = WM.extent(S.order.map(id => CT[id]), all ? null : mapC, W / height);
  const vb = mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center), u = vb[2] / W;
  const overview = all && W < 600 && mapView.zoom < 1.8;
  const nar = W < 420, fsL = nar ? 11 : 12, fsC = nar ? 12 : 14;
  const nr = c => (overview ? 4 : (all ? 9 : 13) + c.size * .8 + (c.tier - 1)) * u;
  /* توزيع الأسماء دون تداخل: لكل مدينة عدّة مواضع مرشّحة (تحت/فوق/جنب)، يُختار أقلها تداخلاً مع أسماء ومدن أخرى */
  const rect = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 });
  const ov = (p, q) => Math.max(0, Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0)) * Math.max(0, Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0));
  const out = bx => (Math.max(0, vb[0] - bx.x0) + Math.max(0, bx.x1 - vb[0] - vb[2])) * (bx.y1 - bx.y0) + (Math.max(0, vb[1] - bx.y0) + Math.max(0, bx.y1 - vb[1] - vb[3])) * (bx.x1 - bx.x0);
  const nodeBox = {}; ids.forEach(id => { const c = CT[id], r = nr(c) + 2 * u; nodeBox[id] = rect(c.x, c.y, r * 2, r * 2); });
  const placed = [], lab = {}, cl = {};
  const score = (bx, own, k) => { let s = k * 0.01 * u * u + out(bx) * 30; placed.forEach(p => { s += ov(bx, p) * 3; }); ids.forEach(o => { s += ov(bx, nodeBox[o]) * (o === own ? 6 : 4); }); return s; };
  // أسماء الدول في مواضع هادئة ثابتة على الخريطة (تُحجَز أولاً فتتجنبها أسماء المدن)
  E.COUNTRIES.forEach(ct => {
    if (!all && ct.id !== mapC) return;
    const cs = citiesOf(ct.id).map(id => CT[id]); if (!cs.length) return;
    const anchor = ct.mapLabel || [cs.reduce((s, c) => s + c.x, 0) / cs.length, Math.max(...cs.map(c => c.y)) + 40];
    const hw = (ct.name.length * fsC * 0.30 + 15) * u, hh = (fsC + 8) * u, a = all ? anchor : [vb[0] + vb[2] / 2, vb[1] + hh];
    const bx = rect(a[0], a[1], hw * 2, hh); placed.push(bx); cl[ct.id] = { x: a[0], y: a[1] };
  });
  const cands = (c, hw, hh, r, g) => { const dv = r + g + hh / 2, dh = r + g + hw, o = []; [0, 1, 2].forEach(m => [1, -1].forEach(s => [0, .75, -.75, 1.5, -1.5].forEach(k => o.push([k * hw, s * (dv + m * (hh + g))])))); [0, 1, -1].forEach(k => [1, -1].forEach(s => o.push([s * dh, k * (hh + g)]))); return o; };
  const geo = {}; ids.forEach(id => { const c = CT[id], r = nr(c); geo[id] = { c, r, hw: (c.name.length * fsL * 0.36 + 9) * u, hh: (fsL + 9) * u, g: 3 * u }; });
  // خط ربط الاسم بمدينته: يُمنع تقاطع خطّين (يمنع أن يبدو اسم تابعاً لمدينة مجاورة)
  const lead = (c, bx) => ({ x1: c.x, y1: c.y, x2: Math.max(bx.x0, Math.min(c.x, bx.x1)), y2: Math.max(bx.y0, Math.min(c.y, bx.y1)) });
  const ccw = (ax, ay, bx, by, cx, cy) => (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  const cross = (p, q) => ccw(p.x1, p.y1, q.x1, q.y1, q.x2, q.y2) !== ccw(p.x2, p.y2, q.x1, q.y1, q.x2, q.y2) && ccw(p.x1, p.y1, p.x2, p.y2, q.x1, q.y1) !== ccw(p.x1, p.y1, p.x2, p.y2, q.x2, q.y2);
  const pick = id => { const { c, r, hw, hh, g } = geo[id]; let best = null; cands(c, hw, hh, r, g).forEach(([dx, dy], k) => { const bx = rect(c.x + dx, c.y + dy, hw * 2, hh), ld = lead(c, bx); let s = score(bx, id, k + Math.hypot(dx, dy) / u * .2); ids.forEach(o => { if (o !== id && lab[o] && cross(ld, lab[o].ld)) s += 6000 * u * u; }); if (!best || s < best.s) best = { s, bx, dx, dy, ld }; }); lab[id] = { x: c.x + best.dx, y: c.y + best.dy, hw, hh, up: best.dy < 0, bx: best.bx, ld: best.ld }; placed.push(best.bx); };
  const ord = (overview ? [] : ids.slice()).sort((p, q) => CT[q].size - CT[p].size);
  ord.forEach(pick);
  for (let pass = 0; pass < 4; pass++) ord.forEach(id => { const i = placed.indexOf(lab[id].bx); if (i >= 0) placed.splice(i, 1); pick(id); });
  let h = `<defs><pattern id="map-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#f6dfaa" stroke-opacity=".1" stroke-width="${u}"/></pattern></defs><rect x="${mapBase[0]}" y="${mapBase[1]}" width="${mapBase[2]}" height="${mapBase[3]}" fill="#6d8d95"/>`;
  WM.tiles.forEach(t => { if (ART[t.art]) h += `<image href="${ART[t.art]}" x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" preserveAspectRatio="none"/>`; });
  h += `<rect x="${mapBase[0]}" y="${mapBase[1]}" width="${mapBase[2]}" height="${mapBase[3]}" fill="url(#map-grid)" pointer-events="none"/>`;
  WM.roads(S.order.map(id => CT[id]), E.ADJ).forEach(({a, b, border}) => {
    if (!all && a.country !== mapC && b.country !== mapC) return;
    const risk = S.risk[E.riskKey(a.id, b.id)] || 0;
    const rp = E.routePath(a.id, b.id, false) || [[a.x, a.y], [b.x, b.y]];
    h += `<polyline class="map-road" points="${rp.map(q => q[0] + ',' + q[1]).join(' ')}" fill="none" stroke-linejoin="round" stroke="${risk > .1 ? '#a83f2c' : border ? '#f7e1ab' : '#765530'}" stroke-width="${(1.6 * u).toFixed(1)}" ${border ? `stroke-dasharray="${6*u} ${5*u}"` : ''} opacity="${overview ? '.45' : '.8'}"/>`;
  });
  const cr = main(), routeTo = cr.left > 0 ? cr.dest : sel, routeFrom = cr.left > 0 ? cr.from : cr.city;
  if (routeTo !== routeFrom && CT[routeTo] && CT[routeFrom]) {
    const a = CT[routeFrom], b = CT[routeTo], seaTrip = cr.left > 0 && !!cr.sea, pts = pl => pl.map(q => q[0] + ',' + q[1]).join(' ');
    const lp = E.routePath(routeFrom, routeTo, seaTrip) || [[a.x, a.y], [b.x, b.y]];
    h += `<polyline class="map-route" points="${pts(lp)}" fill="none" stroke-linejoin="round" stroke="#fff5d2" stroke-width="${6*u}" opacity=".7"/><polyline points="${pts(lp)}" fill="none" stroke-linejoin="round" stroke="${seaTrip ? '#2b5f8f' : '#476b7e'}" stroke-width="${3*u}" stroke-dasharray="${8*u} ${5*u}"/>`;
    if (cr.left === 0 && S.phase >= E.SEA.phase && E.isPort(routeFrom) && E.isPort(routeTo)) { const sp = E.routePath(routeFrom, routeTo, true); if (sp) h += `<polyline class="map-route-sea" points="${pts(sp)}" fill="none" stroke-linejoin="round" stroke="#2b5f8f" stroke-width="${2.2 * u}" stroke-dasharray="${3 * u} ${5 * u}" opacity=".85"/>`; }
  }
  E.COUNTRIES.forEach(ct => { const p = cl[ct.id]; if (!p) return; h += `<g data-mc="${ct.id}" role="button" tabindex="0" aria-label="استكشف ${ct.name}" class="map-country"><rect x="${p.x-(ct.name.length*fsC*.30+15)*u}" y="${p.y-(fsC+8)*u/2}" width="${(ct.name.length*fsC*.30+15)*2*u}" height="${(fsC+8)*u}" rx="${5*u}" fill="#e8eff3f5" stroke="#cfac69" stroke-width="${u}"/><text x="${p.x.toFixed(1)}" y="${(p.y + fsC * .35 * u).toFixed(1)}" text-anchor="middle" font-size="${(fsC * u).toFixed(1)}" font-weight="700" fill="#304f60" pointer-events="none">${ct.flag} ${ct.name}</text></g>`; });
  ids.forEach(id => {
    const c = CT[id], r = nr(c), ev = c.ev ? c.ev.k : '', ct = CD[c.country], L = lab[id];
    const glow = evGood(ev) ? '#d19a2a' : ev ? '#b8402f' : '';
    if (overview) {
      h += `<g data-city="${id}" role="button" tabindex="0" aria-label="${esc(c.name)}"><circle cx="${c.x}" cy="${c.y}" r="${10*u}" fill="transparent"/><circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${id === sel ? '#fff5d2' : '#476b7e'}" stroke="${id === sel ? '#a47419' : '#f6deae'}" stroke-width="${1.5*u}"/><title>${esc(c.name)}</title></g>`; return;
    }
    if (glow) h += `<circle cx="${c.x}" cy="${c.y}" r="${(r + 6 * u).toFixed(1)}" fill="${glow}" opacity=".45"/>`;
    h += `<g data-city="${id}" style="cursor:pointer" role="button" tabindex="0" aria-label="${esc(c.name)}${ev ? ' — ' + EVN[ev] : ''}">${(() => { const nx = Math.max(L.x - L.hw, Math.min(c.x, L.x + L.hw)), ny = Math.max(L.y - L.hh / 2, Math.min(c.y, L.y + L.hh / 2)); return Math.hypot(nx - c.x, ny - c.y) > r + 2 * u ? `<line x1="${c.x}" y1="${c.y}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${ct.color}" stroke-width="${(1.6 * u).toFixed(1)}" opacity=".95"/>` : ''; })()}<circle cx="${c.x}" cy="${c.y + u}" r="${(r + u).toFixed(1)}" fill="#173e37" opacity=".2"/><circle cx="${c.x}" cy="${c.y}" r="${r.toFixed(1)}" fill="#fff8e6" stroke="${sel === id ? '#a97920' : '#406f60'}" stroke-width="${((sel === id ? 2.4 : 1.5) * u).toFixed(1)}"/>`;
    const marker = c.owner ? 'fort' : hasShop(id) ? 'market' : 'city';
    h += `<image data-map-art="${marker}" href="${ART['map/'+marker]}" x="${c.x-r}" y="${c.y-r}" width="${r*2}" height="${r*2}" pointer-events="none"/>`;
    h += `<rect x="${(L.x - L.hw).toFixed(1)}" y="${(L.y - L.hh / 2).toFixed(1)}" width="${(L.hw * 2).toFixed(1)}" height="${L.hh.toFixed(1)}" rx="${(5 * u).toFixed(1)}" fill="${sel === id ? '#f7e5b7' : '#fff9e9f2'}" stroke="${sel === id ? '#9b7027' : '#b89c69'}" stroke-width="${u.toFixed(1)}"/><text x="${L.x.toFixed(1)}" y="${(L.y + fsL * .36 * u).toFixed(1)}" text-anchor="middle" font-size="${(fsL * u).toFixed(1)}" font-weight="700" fill="#263a31" pointer-events="none">${esc(c.name)}</text>`;
    if (ev) h += `<text x="${c.x}" y="${(L.up ? c.y + r + 12 * u : c.y - r - 4 * u).toFixed(1)}" text-anchor="middle" font-size="${(10 * u).toFixed(1)}" fill="${glow}" font-weight="700" stroke="#0a1418" stroke-width="${(2.4 * u).toFixed(1)}" paint-order="stroke" pointer-events="none">${EVN[ev]}</text>`;
    h += `</g>`;
  });
  /* موضع على مسار الرحلة (بري أو بحري) بنسبة التقدم، مع اتجاه المقطع الحالي وجزء المسار المقطوع */
  const pos = (from, to, left, total, sea) => {
    const pl = E.routePath(from, to, !!sea) || [[CT[from].x, CT[from].y], [CT[to].x, CT[to].y]], t = 1 - left / Math.max(1, total);
    let L = 0; const seg = []; for (let i = 1; i < pl.length; i++) { const d = Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); seg.push(d); L += d; }
    let rem = L * t, i = 0; while (i < seg.length - 1 && rem > seg[i]) { rem -= seg[i]; i++; }
    const f = seg[i] ? Math.min(1, rem / seg[i]) : 0, p = pl[i], q = pl[i + 1], x = p[0] + (q[0] - p[0]) * f, y = p[1] + (q[1] - p[1]) * f;
    pos.dx = q[0] - p[0]; pos.done = pl.slice(0, i + 1).concat([[x, y]]);
    return [x, y];
  };
  S.agents.forEach(a => { if (a.left > 0 && a.dest) { const [x, y] = pos(a.from, a.dest, a.left, a.total || a.left, false); h += `<circle cx="${x}" cy="${y}" r="${(2.6 * u).toFixed(1)}" fill="#6d6757" opacity=".8" pointer-events="none"/>`; } });
  S.player.caravans.forEach(c => {
    const here = CT[c.city]; let x, y;
    let dn = null, pdx = 0; if (c.left > 0) { [x, y] = pos(c.from, c.dest, c.left, c.total, !!c.sea); dn = pos.done; pdx = pos.dx; }
    else { x = here.x + (c.main ? -(nr(here) + 22 * u) : (nr(here) + 18 * u + 6 * (c.id % 7) * u)); y = here.y - nr(here) * .6; }
    const r = (c.main ? 19 : 13) * u, mv = c.left > 0, dir = mv && pdx < 0 ? -1 : 1;
    if (mv && c.main && dn) { h += `<polyline class="map-done" points="${dn.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}" fill="none" stroke="#d19a2a" stroke-width="${3.4 * u}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`; }
    const sz = r * (c.main && mv ? 4.2 : 3), spr = ART['map/camel_walk'] && ART['map/camel_rest'], sx = x - sz / 2, sy = y - sz * 0.8, mir = dir < 0 ? ` transform="translate(${(2 * x).toFixed(1)} 0) scale(-1 1)"` : '';
    const shipArt = c.sea && (ART['map/ship_' + (c.sea.type || 'dhow') + '_map'] || ART['map/ship_dhow_map']), shipImg = mv && shipArt;
    const body = shipImg ? `<g${mir}><image href="${shipArt}" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}"/></g>` : spr ? (mv ? `<g${mir}><svg class="camspr" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" viewBox="0 0 256 256" overflow="hidden"><image class="camwalk" href="${ART['map/camel_walk']}" width="1536" height="256"/></svg></g>` : `<image href="${ART['map/camel_rest']}" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}"/>`) : `<circle cx="${x}" cy="${y+u}" r="${r+u}" fill="#153f39" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff8e6" stroke="${c.main ? '#476b7e' : '#a98d4e'}" stroke-width="${2*u}"/><image data-map-art="caravan" href="${ART['map/caravan']}" x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}"/>`;
    const dust = mv && !c.sea && ART['map/dust'] ? `<svg class="dustbox" x="${(x - dir * sz * 0.55 - sz * 0.25).toFixed(1)}" y="${(y - sz * 0.25).toFixed(1)}" width="${(sz * 0.5).toFixed(1)}" height="${(sz * 0.5).toFixed(1)}" viewBox="0 0 128 128" overflow="hidden"><image class="dustspr" href="${ART['map/dust']}" width="512" height="128"/></svg>` : '';
    h += `<g class="map-caravan${mv ? ' moving' : ''}" data-caravan="${c.id}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" role="img" aria-label="${c.main ? 'قافلتي' : 'قافلة تجارية'}${mv ? ' في الطريق إلى '+esc(cityName(c.dest)) : ' في '+esc(cityName(c.city))}" pointer-events="none">${dust}<g class="${mv ? 'bob' : ''}">${body}</g></g>`;
  });
  return `<svg id="map" style="height:${height}px" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" direction="ltr" role="group" tabindex="0" aria-label="خريطة دروب التجارة؛ استخدم الأسهم للتحريك بعد التقريب">${h}</svg>`;
}
let paceLv = 0;
/* مؤن السفر: اختيار مستوى الإيقاع قبل الانطلاق، مع زمن الانتظار الفعلي قبل المؤن وبعدها */
function paceBlock(dest, sea) {
  const q = E.paceQuote(S, main(), dest, sea); if (!q) return '';
  const lv = Math.min(paceLv, 2), x = q.lv[lv];
  if (sea) return `<div class="kv"><span>الانتظار الفعلي</span><b class="num">${q.sec} ثانية${lv ? ' ← ' + x.sec : ''}</b></div>`;
  return `<div class="card pacebox"><b>مؤن السفر <span class="small muted">(اختيارية)</span></b><div class="small muted">تختصر انتظارك الفعلي فقط؛ أيام الرحلة وتكلفتها وأخطارها كما هي، ومن لا يشتريها لا يخسر شيئاً.</div><div class="chips" role="group" aria-label="مستوى مؤن السفر">${q.lv.map(L => `<button data-act="pacelv" data-lv="${L.id}" class="${L.id === lv ? 'on' : ''}" aria-pressed="${L.id === lv}">${L.name}</button>`).join('')}</div><div class="kv"><span>الانتظار الفعلي</span><b class="num">${q.sec} ثانية${lv ? ' ← ' + x.sec + ' ثانية' : ''}</b></div>${lv ? `<div class="kv"><span>تستهلك</span><b class="num">${x.units} وحدة (معك ${q.have})</b></div>${x.miss ? `<div class="kv"><span>تُشترى عند الانطلاق</span><b class="num">${x.miss} وحدة ≈ ${fmt(x.cost)}</b></div>` : ''}` : `<div class="small muted">المخزون معك: ${q.have} وحدة · السعر ${q.price} للوحدة هنا</div>`}</div>`;
}
function cityPanel() {
  const c = S.cities[sel], cr = main(), v = marketView(sel), here = cr.city === sel && cr.left === 0, ct = CD[c.country];
  const lst = GIDS.map(g => ({ g, r: v.p[g] / E.refPrice(c, g) })).sort((a, b) => a.r - b.r);
  const cheap = lst.slice(0, 2), dear = lst.slice(-2).reverse();
  let h = `<div class="card citycard">${cityScene(c)}<div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span>${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${dayAr(c.ev.left)}</span>` : ''}</div>`;
  h += `<div class="small muted" style="margin:6px 0">${liveView(sel) ? 'أسعار حيّة' : 'معلومات قبل ' + dayAr(v.age) + ''} · ${E.shopsOf(S, sel).length ? '🏪 ' + E.shopsOf(S, sel).length + ' دكان · 📦 ' + E.whsOf(S, sel) + ' مخزن' : 'لا عقارات لك هنا'}</div>`;
  h += `<div class="kv"><span>الأرخص نسبياً</span><span class="cheap">${cheap.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div><div class="kv"><span>الأغلى نسبياً</span><span class="dear">${dear.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div>`;
  if (c.sig && GD[c.sig]) h += `<div class="kv"><span>منتجها الخاص (لا يُنتَج إلا فيها)</span><b>${gi(c.sig)} ${GD[c.sig].name}</b></div>`;
  if (cr.left > 0) h += `<p class="small muted">قافلتك في الطريق.</p>`;
  else if (here) h += `<p><b>أنت هنا.</b></p><div class="row"><button class="pri" data-go="market">🏪 افتح السوق</button><button data-act="estcity" data-c="${sel}">🏬 العقارات</button></div>`;
  else {
    const dd = E.tripDays(S, cr, cr.city, sel), need = E.supplyNeed(cr, dd), pc = need * E.unitPrice(S.cities[cr.city], 'wheat'), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    const wind = E.routeLen(cr.city, sel, false) / Math.max(1, Math.hypot(S.cities[cr.city].x - c.x, S.cities[cr.city].y - c.y));
    h += `<div class="kv"><span>المدة</span><b class="num">${dd} أيام</b></div>${wind > 1.25 ? `<div class="small muted">الطريق البري يلتف حول البحر، فهو أطول ${Math.round((wind - 1) * 100)}٪ من الخط المستقيم.</div>` : ''}<div class="kv"><span>نفقة الطريق</span><b class="num">≈ ${fmt(pc)}</b></div><div class="kv"><span>خطر اللصوص</span><b class="num ${rk > 0.1 ? 'dear' : ''}">${Math.round(rk * 100)}٪</b></div>${cus ? `<div class="kv"><span>جمارك ${ct.name}</span><b class="num dear">${Math.round(cus * 100)}٪ من قيمة الحمولة</b></div>` : ''}`;
    h += favHereHTML(cr.city, sel);
    h += `${lockNote(sel) ? '' : paceBlock(sel, false)}${lockNote(sel) || `<div class="row"><button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)} براً</button></div>`}`;
    if (S.phase >= E.SEA.phase && E.isPort(cr.city) && E.isPort(sel)) {
      const sp = E.seaPlan(S, cr, sel), mon = sp.monsoon ? (sp.monsoon.dir === 'calm' ? 'داخل بحر واحد: لا رياح موسمية' : sp.monsoon.fair ? 'الرياح الموسمية معك' : 'الرياح الموسمية ضدك: أبطأ وأخطر') : '';
      h += `<div class="card seacmp"><b>${ti('travel_sea') || '🚢'} أو بحراً</b>${sp.ok ? `<div class="kv"><span>المدة</span><b class="num">${sp.days} أيام <span class="small muted">(براً ${dd})</span></b></div>${sp.days < dd ? `<div class="small cheap">البحر أقصر بـ ${dd - sp.days} ${dd - sp.days === 1 ? 'يوم' : 'أيام'} من البر.</div>` : sp.days > dd ? '<div class="small muted">البر أسرع هنا، والبحر يلفّ حول اليابسة.</div>' : ''}<div class="kv"><span>رسم الميناء</span><b class="num">${fmt(Math.round(sp.fee))} ${ti('port_fee')}</b></div><div class="kv"><span>نفقة الرحلة</span><b class="num">≈ ${fmt(Math.round(sp.prov))}</b></div><div class="kv"><span>سعة السفينة</span><b class="num">${sp.cap}</b></div><div class="kv"><span>خطر العواصف والقراصنة</span><b class="num ${sp.risk > 0.15 ? 'dear' : ''}">${Math.round(sp.risk * 100)}٪</b></div><div class="small ${sp.monsoon.fair ? 'cheap' : 'dear'}">${ti(sp.monsoon.dir === 'out' ? 'monsoon_out' : sp.monsoon.dir === 'back' ? 'monsoon_back' : 'wind_calm')} ${mon}</div>${paceBlock(sel, true)}<div class="row"><button class="pri big" data-act="sail" data-to="${sel}">🚢 أبحر إلى ${esc(c.name)}</button></div>` : `<div class="small muted">${esc(sp.msg)}</div>${sp.needShip ? '<div class="row"><button class="sm" data-go="caravan">⚓ اذهب إلى الأسطول</button></div>' : ''}`}</div>`;
    }
  }
  return h + `</div>`;
}
/* عند الانطلاق: تُركّز الخريطة المسطحة على الرحلة (تُظهر المنطلق والوجهة معاً) لتبقى القافلة أمام العين */
function focusTrip(cr) {
  const a = S.cities[cr.from || cr.city], b = S.cities[cr.dest || cr.city], span = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y) * 1.8) + 140;
  mapC = 'all'; mapView = { zoom: Math.max(1, Math.min(3, 1000 / span)), center: [(a.x + b.x) / 2, (a.y + b.y) / 2] };
}
function screenMap() {
  const cr = main(); let h = '';
  const g = guideHTML(); if (g) h += `<div style="margin-bottom:12px">${g}</div>`;
  if (cr.left > 0) h += `<div class="card jcard" style="margin-bottom:12px"><div class="row" style="margin:0"><b>${cr.sea ? '🚢' : '🐪'} ${cr.sea ? 'تُبحر' : 'في الطريق'} إلى ${cityTag(cr.dest)}</b><span class="muted">باقٍ ${cr.left} من ${dayAr(cr.total)}</span><span class="spacer"></span>${speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'}</div>${bar(cr.total - cr.left, cr.total, 'gold')}${cr.pace ? `<div class="small muted" style="margin-top:6px">زمن الرحلة الفعلي نحو ${cr.pace.sec} ثانية${cr.pace.lv ? ' بمؤن السفر (' + E.PACE.lv[cr.pace.lv].name + ')' : ''}</div>` : ''}${ambNow ? `<div class="small ambline" style="margin-top:6px">${ambNow.rumor ? '<b>شائعة السوق:</b> ' : ''}${esc(ambNow.t)}</div>` : ''}</div>`;
  h += `<div class="map-layout"><section class="map-atlas" aria-label="أطلس التجارة"><div class="map-heading"><div><small>أطلس التاجر</small><h2>دروب التجارة</h2></div><small>${E.COUNTRIES.length} دول · ${S.order.length} مدينة</small></div><div class="map-toolbar"><button data-act="maphere">🐪 موقع قافلتي</button><span class="spacer"></span><button data-act="mapzoom" data-d="1" aria-label="تقريب الخريطة" ${mapView.zoom >= 4 ? 'disabled' : ''}>＋</button><output aria-label="مستوى التقريب">${Math.round(mapView.zoom * 100)}٪</output><button data-act="mapzoom" data-d="-1" aria-label="إبعاد الخريطة" ${mapView.zoom <= 1 ? 'disabled' : ''}>−</button><button data-act="mapreset" aria-label="إعادة ضبط عرض الخريطة">↺</button></div><div class="map-filters">${countryChips(mapC, 'data-mc')}</div><div id="mapbox">${mapBox()}<div class="map-compass" role="img" aria-label="اتجاه الشمال"><span>شمال</span><img src="${ART['map/compass']}" alt="" draggable="false"></div></div><div class="map-legend"><span><i></i>درب محلي</span><span><i class="border"></i>درب بين الدول</span><span><i class="route"></i>${cr.left > 0 ? 'رحلتي الحالية' : 'المسار المختار'}</span><span><i class="risk"></i>خطر مرتفع</span></div><p class="map-caption">اختر دولة لاستكشاف مدنها، أو اضغط مدينة لعرض السوق والرحلة. قرّب واسحب لاستكشاف التفاصيل.</p><details class="map-cities" ${(mapListOpen[mapC] ?? (mapC !== 'all')) ? 'open' : ''}><summary>مدن ${mapC === 'all' ? 'العالم' : CD[mapC].name}</summary><div class="chips">${(mapC === 'all' ? S.order : citiesOf(mapC)).map(id => `<button data-city="${id}" class="${sel === id ? 'on' : ''}">${id === cr.city ? '🐪 ' : ''}${esc(cityName(id))}</button>`).join('')}</div></details></section><aside class="map-panel" aria-label="المدينة والرحلة">${cityPanel()}</aside></div>`;
  return h;
}

