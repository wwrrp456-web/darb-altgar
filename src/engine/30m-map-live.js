/* ---------- 034 الخريطة الحية: دوال قراءة فقط للطبقات والبطاقات (لا حقل في الحفظ إطلاقاً) ----------
   الأرقام كلها من دوال المحرك القائمة (sellOptions، shopPnl، assetsIn، scQuote، S.risk، S.shocks، monsoonOf، rgStr/rgScale، S.rival)؛
   لا معادلة جديدة. المسارات (BOARD_ROUTES في 09e) للعرض فقط: المحاكاة لا تقرؤها أبداً (هي على 09d-routes.js).
   MAPLIVE.on=false أو ?maplive=off ⇒ الخريطة القديمة حرفاً (الواجهة تقرأ المفتاح). */
const MAPLIVE = { on: true, BW: 2048, BH: 1024, maxS: 1.6, tap: 6, clus: 30, wheel: 1.15, btn: 1.5, bestN: 3, backQ: 30 };
const BOARD_W = MAPLIVE.BW;
/* id: [x, y, w] نسب 0–1 من cities.json (النموذج 3 «الغروب») ووزن العرض */
const BOARD_XY = {
  riyadh: [.219, .487, 1.3], jeddah: [.148, .522, 1.4], hail: [.184, .395, .9], jazan: [.184, .653, 1.0], mecca: [.158, .540, 1.3], medina: [.145, .452, 1.1],
  cairo: [.073, .327, 1.5], alex: [.063, .306, 1.2], aswan: [.081, .455, .8], isfahan: [.327, .327, 1.2], shiraz: [.348, .399, 1.0], tabriz: [.245, .223, .9],
  delhi: [.539, .384, 1.5], mumbai: [.501, .625, 1.3], kolkata: [.662, .514, 1.1], xian: [.820, .291, 1.3], guangzhou: [.850, .533, 1.3], shanghai: [.960, .344, 1.5]
};
const mlP = id => [BOARD_XY[id][0] * MAPLIVE.BW, BOARD_XY[id][1] * MAPLIVE.BH];
const MAP_SEA_CHAIN = [['alex', 'jeddah'], ['jeddah', 'jazan'], ['jazan', 'mumbai'], ['mumbai', 'kolkata'], ['kolkata', 'guangzhou'], ['guangzhou', 'shanghai']];
const MAP_RISK_COL = ['#4f9a5f', '#c27a1a', '#a8402f'];
const MAP_PIN = { gold: '#b88a2a', ok: '#2f7d4f', none: '#9aa4ae', own: '#2c5b86', bad: '#a8402f', riv: '#7a3e8e' };
/* مسار العرض بين مدينتين بوحدات اللوحة؛ معكوس إن a>b؛ وإن غاب الزوج: خط مستقيم */
function boardPath(a, b, sea) {
  const k = a < b ? a + '|' + b : b + '|' + a, pl = ((sea ? BOARD_ROUTES.sea : BOARD_ROUTES.land) || {})[k];
  if (!pl) return [mlP(a), mlP(b)];
  const pts = pl.map(p => [p[0] * MAPLIVE.BW, p[1] * MAPLIVE.BH]); return a < b ? pts : pts.reverse();
}
function mapPathLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
/* الموضع على المسار عند النسبة t (0–1 بالطول): [x, y, غرباً؟] */
function mapAlong(pts, t) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1], g = Math.max(0, Math.min(1, t)) * tot; let i = 1; while (i < L.length - 1 && L[i] < g) i++;
  const f = (g - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, pts[i][0] < pts[i - 1][0]];
}
/* نصف الريح (§0-5): للاعب بالتاريخ الميلادي (أبريل–سبتمبر = الأول) وللروبوتات نصف سنة الاقتصاد */
function mapHalf(S, day) {
  if (S.learn && S.learn.char) { const m = dateOf(S, day).g.m; return m >= 4 && m <= 9; }
  return ((day == null ? S.day : day) % YEAR) < SEA.YEAR_HALF;
}
/* ما يُرسم من الطرق: البرية = شبكة WM.roads على إحداثيات المحاكاة (ما يراه اللاعب اليوم) برسم اللوحة، والبحرية سلسلة الموانئ، وخطوط الشهبندر */
function mapEdges(S, roads) {
  const WMi = (typeof module !== 'undefined' && module.exports) ? require('./world-map.js') : root.WorldMap;
  const rs = roads || WMi.roads(S.order.map(id => S.cities[id]), ADJ), seaOn = S.phase >= SEA.phase;
  const mk = (a, b, sea) => ({ a, b, sea, key: riskKey(a, b), path: boardPath(a, b, sea) });
  const land = rs.map(r => mk(r.a.id, r.b.id, false)), sea = seaOn ? MAP_SEA_CHAIN.filter(([a, b]) => S.cities[a] && S.cities[b]).map(([a, b]) => mk(a, b, true)) : [];
  const pm = (typeof pmLines === 'function' ? pmLines(S) : []).filter(c => c.line && S.cities[c.line.a] && S.cities[c.line.b]).map(c => mk(c.line.a, c.line.b, true));
  return { land, sea, pm };
}
/* القافلة النشطة (§4-أ) */
function mapActiveCar(S) {
  const cs = S.player.caravans, m = mainCar(S); if (m.left === 0) return m;
  return cs.find(c => c.left === 0 && GIDS.some(g => Math.floor(c.cargo[g] || 0) >= 1)) || m;
}
const mapHeld = car => GIDS.map(g => ({ g, q: Math.floor(car.cargo[g] || 0) })).filter(x => x.q >= 1).sort((a, b) => b.q - a.q);
/* حمولتي: ربح كل مدينة = Σ sellOptions للحمولة كلها، والترتيب بالربح في اليوم */
function mapCargoView(S) {
  const ac = mapActiveCar(S), held = mapHeld(ac), v = { ac, held, state: ac.left > 0 ? 'moving' : held.length ? 'loaded' : 'empty', per: {}, list: [], best: null };
  if (v.state !== 'loaded') return v;
  const opts = held.map(h => sellOptions(S, ac.city, h.g, h.q, avgCost(ac.basis, h.g) || mid(h.g), ac, 'trade'));
  S.order.forEach((id, ix) => {
    if (id === ac.city) return;
    let profit = 0, has = false; opts.forEach(os => { const o = os.find(x => x.city === id); if (o) { profit += o.profit; has = true; } });
    if (!has) return;
    const days = tripDays(S, ac, ac.city, id), block = travelBlock(S, ac, id) || null;
    v.per[id] = { city: id, ix, profit, days, perDay: profit / days, block };
  });
  v.list = Object.values(v.per).filter(x => x.profit > 0 && !x.block).sort((a, b) => b.perDay - a.perDay || b.profit - a.profit || a.ix - b.ix);
  v.best = v.list[0] || null; v.list.forEach(x => { x.mission = !!bestMission(S, x.city); });
  return v;
}
const mapBestList = S => mapCargoView(S).list.slice(0, MAPLIVE.bestN);
/* أملاكي */
function mapOwnView(S) {
  const per = {}; let N = 0, M = 0, net = 0, worst = null;
  S.order.forEach(c => {
    const pr = S.player.props[c], n = assetsIn(S, c); if (!pr || !n) return;
    const k = ownShops(pr), w = pr.whs || 0, f = S.player.factories.filter(x => x.city === c).length, farm = !!pr.farm, butcher = !!pr.butcher, pnl = shopPnl(S, c, 30), nt = (pnl && pnl.total) || 0;
    let bad = null;
    if (SHOPCOND.on) pr.shops.filter(sh => shKind(sh) === 'own').forEach(sh => { const q = scQuote(S, c, sh.id); if (q && q.cond < HOMEST.badBelow && (!bad || q.cond < bad.cond)) bad = { id: sh.id, cond: q.cond, name: q.name }; });
    const parts = [k && k + ' دكان', w && w + ' مخزن', f && f + ' مصنع', farm && 'مزرعة', butcher && 'ملحمة'].filter(Boolean), desc = parts.join(' · ') + (bad ? ' (الحالة ' + Math.round(bad.cond) + '، ' + bad.name + ')' : '');
    per[c] = { city: c, n, shops: k, whs: w, factories: f, farm, butcher, net: nt, bad, desc, icon: k > 0 ? 'icons/ui-shops' : f > 0 ? 'icons/factory' : farm ? 'icons/sprout' : null };
    N += n; M++; net += nt; if (bad && (!worst || bad.cond < worst.bad.cond)) worst = per[c];
  });
  return { per, N, M, net, worst };
}
/* المخاطر */
const mapLvl = raw => raw < BRIEF.riskB[0] ? 0 : raw < BRIEF.riskB[1] ? 1 : 2;
function mapRiskView(S, roads) {
  const E = mapEdges(S, roads), land = E.land.map(e => { const raw = S.risk[e.key] || 0, lvl = mapLvl(raw); return Object.assign({ raw, lvl, color: MAP_RISK_COL[lvl], w: lvl === 2 ? 3.2 : 2.4 }, e); });
  const sea = E.sea.map(e => Object.assign({ raw: S.risk[e.key] || 0, lvl: -1, color: '#e0b54a', w: 2.4 }, e)), pm = E.pm.map(e => Object.assign({ color: '#e0b54a', w: 2.4 }, e));
  const shocks = [];
  (S.shocks || []).forEach(sh => {
    if (sh.st !== 'on' || (sh.k !== 'banditwave' && sh.k !== 'pirates')) return;
    const isSea = sh.k === 'pirates', pool = (isSea ? sea : land).filter(e => e.a === sh.city || e.b === sh.city).sort((a, b) => b.raw - a.raw);
    const e = pool[0], at = e ? mapAlong(e.path, 0.5).slice(0, 2) : mlP(sh.city);
    shocks.push({ k: sh.k, city: sh.city, sea: isSea, at, icon: isSea ? 'map/sea_pirates' : 'map/road_bandits', text: (isSea ? 'قراصنة قرب ' : 'قطّاع طريق حول ') + S.cities[sh.city].name });
  });
  return { land, sea, pm, shocks, wind: mapWind(S) };
}
function mapWind(S) {
  if (S.phase < SEA.phase) return null;
  const half = mapHalf(S), K = Math.round((SEA.offDays - 1) * 100); let d = S.day; while (d < S.day + 400 && mapHalf(S, d + 1) === half) d++;
  return { half, season: half ? 'الصيف' : 'الشتاء', dir: half ? 'شرقاً' : 'غرباً', K, dEnd: d, at: [0.37 * MAPLIVE.BW, 0.82 * MAPLIVE.BH], rot: half ? -25 : 155, text: 'ريح ' + (half ? 'الصيف' : 'الشتاء') + ' · إبحار ' + (half ? 'شرقاً' : 'غرباً') + ' +' + K + '٪' };
}
/* المنافسون */
function mapRivView(S) {
  const per = {}, mine = new Set(); S.order.forEach(c => { if (assetsIn(S, c) > 0) mine.add(c); }); S.player.caravans.forEach(c => { if (c.left === 0) mine.add(c.city); });
  if (rgOn(S)) (S.rivals || []).forEach(rv => {
    if (rv.out != null || !S.cities[rv.city]) return;
    const st = rgStr(S, rv, true), cur = per[rv.city]; if (cur && cur.str >= st) return;
    const fx = rv.fx, g0 = fx && fx.gs && fx.gs[0], eff = fx ? RG_KINDS[fx.kind] + ' ' + (g0 && GD[g0] ? GD[g0].name + ' ' : '') + sgnN(Math.round(fx.mul * rgScale(S, rv) * 100)) + '٪' : '';
    per[rv.city] = { city: rv.city, id: rv.id, name: rv.name, str: st, strName: RG_STR_NAME(st), effect: eff };
  });
  const inMine = Object.keys(per).filter(c => mine.has(c)), top = inMine.map(c => per[c]).sort((a, b) => b.str - a.str)[0] || null;
  return { per, n: inMine.length, top, rivalOnRoad: !!(rivalOn(S) && S.rival.left > 0) };
}
const sgnN = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
/* بطاقة المدينة: «اشترِ منها للعودة» (§4-هـ) */
function mapBackBuy(S, id, ac) {
  ac = ac || mapActiveCar(S); const c = S.cities[id]; if (!c || id === ac.city) return [];
  const live = liveCity(S, id), out = [];
  GIDS.forEach(g => {
    if (!sells(c, g) || GD[g].sp || GD[g].fresh) return;
    const p0 = live ? unitPrice(c, g) : (S.player.known[id] && S.player.known[id].p[g]); if (!(p0 > 0)) return;
    const p = p0 * 1.04, q = Math.min(MAPLIVE.backQ, Math.floor(capOfCar(ac) / GD[g].w)); if (q < 1) return;
    const o = sellOptions(S, id, g, q, p, ac, 'trade').find(x => x.city === ac.city); if (o && o.profit > 0) out.push({ g, profit: o.profit });
  });
  return out.sort((a, b) => b.profit - a.profit).slice(0, 2);
}
function mapCityView(S, id) {
  const ac = mapActiveCar(S), cv = mapCargoView(S), per = cv.per[id] || null, own = mapOwnView(S).per[id] || null, rv = mapRivView(S).per[id] || null, est = ac.left === 0 && id !== ac.city ? roadEstimate(S, ac, id) : null;
  return { id, ac, cargo: per, here: ac.left === 0 && ac.city === id, own, riv: rv, risk: est ? est.level : null, riskName: est ? ['منخفض', 'متوسط', 'مرتفع'][est.level] : null, back: mapBackBuy(S, id, ac), block: ac.left === 0 && ac.city !== id ? (travelBlock(S, ac, id) || null) : null };
}
/* القوافل والسفن على الخريطة (§5-هـ): قوافلك كلها، وS.rival السائر وحده، والوكلاء السائرون */
function mapCarList(S) {
  const out = [];
  S.player.caravans.forEach(c => {
    const moving = c.left > 0, sea = !!c.sea, path = moving ? boardPath(c.from, c.dest, sea) : null, pos = moving ? mapAlong(path, 1 - c.left / Math.max(1, c.total)) : null;
    out.push({ key: 'c' + c.id, id: c.id, mine: true, name: c.name, main: !!c.main, moving, sea, city: c.city, from: c.from, dest: c.dest, left: c.left, total: c.total, path, pos, type: c.sea ? (c.sea.type || 'dhow') : null, cargo: mapHeld(c) });
  });
  if (rivalOn(S) && S.rival.left > 0) {
    const a = S.rival, path = boardPath(a.from, a.dest, false);
    out.push({ key: 'r', mine: false, rival: true, name: a.name, moving: true, sea: false, from: a.from, dest: a.dest, left: a.left, total: a.total, path, pos: mapAlong(path, 1 - a.left / Math.max(1, a.total)), cargo: GIDS.map(g => ({ g, q: Math.floor(a.cargo[g] || 0) })).filter(x => x.q >= 1) });
  }
  (S.agents || []).forEach((a, i) => { if (!(a.left > 0) || !a.from || !a.dest) return; const path = boardPath(a.from, a.dest, false); out.push({ key: 'a' + i, mine: false, agent: true, moving: true, from: a.from, dest: a.dest, left: a.left, total: a.total, pos: mapAlong(path, 1 - a.left / Math.max(1, a.total)) }); });
  return out;
}
