'use strict';
// 034 الخريطة الحية (المحرك): node test/map-live.test.js
// (1) لا أثر على المحاكاة، (2) الإحداثيات والمسارات والقناع، (3) حمولتي، (4) أملاكي، (5) المخاطر والرياح، (6) المنافسون والقوافل
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m), ROOT = path.join(__dirname, '..');
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noShocks = true; return S; };
const car0 = S => S.player.caravans[0];
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const give = (S, g, q, c) => { const car = car0(S); car.cargo[g] = q; car.basis[g] = { q, c: q * (c || E.mid(g)), ql: 1 }; };
E.rivalMemorySet(null);

// 1) المحاكاة لا تقرؤها: 09d بلا تغيير، وأيام الرحلات مطابقة لما قبل الحزمة، والمفتاح لا يغيّر الحفظ
{ const sha = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'src/engine/09d-routes.js'))).digest('hex');
  a.equal(sha, '7a37dade9d66f4c6f5bb2dab2bc4024daaa3030e', '09d-routes.js بلا تغيير (بصمة الملف)');
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/map-live-tripdays.json'), 'utf8')), S = E.newGame(fx.seed), car = car0(S); let n = 0;
  for (const x of S.order) for (const y of S.order) if (x !== y) { a.equal(E.tripDays(S, car, x, y), fx.days[x + '>' + y], 'tripDays ' + x + '>' + y); n++; }
  a.equal(n, 306);
  const run = on => { E.MAPLIVE.on = on; const S2 = game(3); step(S2, 200); return JSON.stringify(E.save(S2)); };
  const on = run(true), off = run(false); E.MAPLIVE.on = true; a.equal(on, off, 'MAPLIVE.on لا يغيّر E.save بعد 200 يوم');
  a.ok(!/maplive|MAPLIVE/i.test(on), 'لا حقل جديد في الحفظ'); }
ok('09d بلا تغيير، tripDays لكل الأزواج (306) مطابقة لما قبل الحزمة، والمفتاح لا يغيّر الحفظ بعد 200 يوم');

// 2) الإحداثيات والمسارات والقناع
const mask = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/board-mask.json'), 'utf8'));
{ const cj = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/next/map-final/3/cities.json'), 'utf8')), S = E.newGame(3);
  for (const id of S.order) { a.ok(E.BOARD_XY[id], 'BOARD_XY لـ' + id); a.equal(E.BOARD_XY[id][0], cj[id].x, id + ' x'); a.equal(E.BOARD_XY[id][1], cj[id].y, id + ' y'); a.ok(E.BOARD_XY[id][2] > 0); }
  a.equal(Object.keys(E.BOARD_XY).length, 18); a.equal(E.BOARD_W, 2048);
  const R = E.BOARD_ROUTES, ids = Object.keys(cj).sort(), ports = E.PORTS.slice().sort();
  a.equal(Object.keys(R.land).length, 153); a.equal(Object.keys(R.sea).length, 21);
  const txt = fs.readFileSync(path.join(ROOT, 'src/engine/09e-board-routes.js'), 'utf8'); a.ok(txt.length <= 40000, 'حجم 09e ' + txt.length);
  for (const [kind, rs] of [['land', R.land], ['sea', R.sea]]) for (const k of Object.keys(rs)) { const [p, q] = k.split('|'), pl = rs[k];
    a.deepEqual(pl[0], [cj[p].x, cj[p].y], k + ' يبدأ بإحداثيات ' + p); a.deepEqual(pl[pl.length - 1], [cj[q].x, cj[q].y], k + ' ينتهي بإحداثيات ' + q); a.ok(p < q); }
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) a.ok(R.land[ids[i] + '|' + ids[j]], 'زوج بري ' + ids[i] + '|' + ids[j]);
  for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) a.ok(R.sea[ports[i] + '|' + ports[j]], 'زوج بحري ' + ports[i] + '|' + ports[j]);
  // boardPath: بوحدات اللوحة، معكوس إن a>b، ومستقيم إن غاب الزوج
  const bp = E.boardPath('riyadh', 'cairo', false), bq = E.boardPath('cairo', 'riyadh', false); a.deepEqual(bp.slice().reverse(), bq);
  a.deepEqual(bp[0], [E.BOARD_XY.riyadh[0] * 2048, E.BOARD_XY.riyadh[1] * 1024], 'يبدأ من المدينة الأولى المعطاة');
  a.deepEqual(E.boardPath('riyadh', 'riyadh', true).length, 2, 'زوج غائب: مستقيم');
  // القناع: عيّنة نقاط كل 6px من كل مسار؛ الماء رقمه ≥ 5 والممرّات c تُستثنى، ومحيط المدينتين 60px
  const cell = mask.cell, W = 2048, H = 1024, dig = (x, y) => { const ch = mask.rows[Math.min(mask.h - 1, Math.max(0, Math.floor(y / cell)))][Math.min(mask.w - 1, Math.max(0, Math.floor(x / cell)))]; return ch; };
  const tally = { land: [0, 0], sea: [0, 0] };
  for (const [kind, rs] of [['land', R.land], ['sea', R.sea]]) for (const k of Object.keys(rs)) { const [p, q] = k.split('|'), ends = [p, q].map(id => [cj[id].x * W, cj[id].y * H]), pts = rs[k].map(v => [v[0] * W, v[1] * H]);
    for (let s = 1; s < pts.length; s++) { const [x0, y0] = pts[s - 1], [x1, y1] = pts[s], m = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 6));
      for (let t = 0; t <= m; t++) { const x = x0 + (x1 - x0) * t / m, y = y0 + (y1 - y0) * t / m; if (ends.some(e => Math.hypot(e[0] - x, e[1] - y) < 60)) continue; const ch = dig(x, y); if (ch === 'c') continue;
        tally[kind][0]++; const water = +ch >= 5; if (kind === 'land' ? water : !water) tally[kind][1]++; } } }
  const rl = tally.land[1] / tally.land[0], rs_ = tally.sea[1] / tally.sea[0]; console.log('     قناع: برّ في الماء ' + (rl * 100).toFixed(2) + '٪ من ' + tally.land[0] + '، بحر على اليابسة ' + (rs_ * 100).toFixed(2) + '٪ من ' + tally.sea[0]);
  a.ok(rl <= 0.03, 'نقاط بريّة على الماء ≤ 3٪: ' + rl); a.ok(rs_ <= 0.05, 'نقاط بحرية على اليابسة ≤ 5٪: ' + rs_); }
ok('BOARD_XY = cities.json لمدن S.order، 153 بريّاً و21 بحرياً تبدأ وتنتهي بإحداثيات مدينتيها، الحجم ≤ 40 ألف، والقناع: بري على اليابسة وبحري على الماء');

// 3) حمولتي
{ const S = game(5), car = car0(S); car.city = 'riyadh'; car.left = 0; for (const k in car.cargo) delete car.cargo[k]; car.basis = {};
  let v = E.mapCargoView(S); a.equal(v.state, 'empty'); a.deepEqual(v.list, []); a.equal(v.best, null); a.equal(E.mapBestList(S).length, 0);
  give(S, 'textile', 40); v = E.mapCargoView(S); a.equal(v.state, 'loaded'); a.equal(v.ac, car); a.deepEqual(v.held, [{ g: 'textile', q: 40 }]);
  const opts = E.sellOptions(S, 'riyadh', 'textile', 40, E.avgCost(car.basis, 'textile') || E.mid('textile'), car, 'trade');
  for (const o of opts) { const x = v.per[o.city]; a.ok(x, o.city); a.equal(x.profit, o.profit, 'profit_c = Σ sellOptions ' + o.city); a.equal(x.days, o.days, 'days = o.days'); a.equal(x.perDay, o.profit / o.days); }
  a.ok(!v.per.riyadh, 'لا المدينة الحالية');
  const blocked = S.order.filter(id => id !== 'riyadh' && E.travelBlock(S, car, id)); a.ok(blocked.length > 0, 'في الحالة المحجوبة مدن خارج البلد');
  for (const x of v.list) { a.ok(!E.travelBlock(S, car, x.city), 'لا محجوب في القائمة: ' + x.city); a.ok(x.profit > 0); }
  for (let i = 1; i < v.list.length; i++) a.ok(v.list[i - 1].perDay >= v.list[i].perDay - 1e-9, 'مرتبة بالربح في اليوم');
  for (const id of blocked) a.ok(!v.list.some(x => x.city === id) && v.per[id].block, 'المحجوب له block وخارج القائمة');
  a.equal(v.best, v.list[0]); a.ok(E.mapBestList(S).length <= E.MAPLIVE.bestN);
  // مدة الرحلة مأخوذة من tripDays للقافلة نفسها
  for (const x of v.list) a.equal(x.days, E.tripDays(S, car, 'riyadh', x.city));
  ok('حمولتي: profit_c = Σ sellOptions نفسها، days = tripDays، مرتبة بالربح في اليوم، بلا محجوب'); }
{ // حالة تختلف فيها الأولى بالربح عن الأولى باليوم: نبحث في بذور وسلع متعددة
  let found = null;
  for (let seed = 1; seed <= 40 && !found; seed++) for (const g of ['textile', 'wheat', 'spice', 'coffee', 'wool', 'incense', 'dates', 'iron']) {
    const S = E.newGame(seed), car = car0(S); S.noShocks = true; car.city = 'riyadh'; car.left = 0; for (const k in car.cargo) delete car.cargo[k]; car.basis = {}; if (!E.GD[g] || E.GD[g].sp || E.GD[g].fresh) continue; give(S, g, 30); const v = E.mapCargoView(S);
    if (v.list.length < 2) continue; const byProfit = v.list.slice().sort((p, q) => q.profit - p.profit)[0]; if (byProfit.city !== v.list[0].city) { found = { seed, g, v, byProfit }; break; } }
  a.ok(found, 'وُجدت حالة تختلف فيها الأولى بالربح عن الأولى باليوم'); a.ok(found.v.list[0].perDay > found.byProfit.perDay, 'الترتيب بـperDay لا بالربح وحده');
  ok('الترتيب بالربح في اليوم: بذرة ' + found.seed + ' ' + found.g + ' الأولى ' + found.v.list[0].city + ' (' + Math.round(found.v.list[0].perDay) + '/يوم) وأعلى ربح ' + found.byProfit.city); }
{ const S = game(5), car = car0(S); car.city = 'riyadh'; car.left = 0; give(S, 'textile', 40); a.ok(A.travel(S, car.id, 'jazan').ok); const v = E.mapCargoView(S); a.equal(v.state, 'moving'); a.deepEqual(v.list, []); a.equal(v.best, null); a.equal(E.mapBestList(S).length, 0);
  const L = E.mapCarList(S).find(c => c.mine && c.id === car.id); a.ok(L.moving && L.path.length >= 2 && L.pos.length === 3, 'القافلة السائرة لها مسار وموضع'); ok('قافلة سائرة ⇒ moving بلا قائمة ولا أفضل'); }
{ // القافلة النشطة
  const S = game(5), c1 = car0(S); c1.city = 'riyadh'; c1.left = 0; for (const k in c1.cargo) delete c1.cargo[k]; c1.basis = {};
  const c2 = JSON.parse(JSON.stringify(c1)); c2.id = 2; c2.main = false; c2.name = 'الثانية'; c2.cargo = { textile: 10 }; c2.basis = { textile: { q: 10, c: 100, ql: 1 } }; S.player.caravans.push(c2);
  a.equal(E.mapActiveCar(S), c1, 'الرئيسية واقفة (ولو فارغة): هي النشطة'); c1.left = 3; c1.total = 3; c1.dest = 'jazan'; c1.from = 'riyadh'; a.equal(E.mapActiveCar(S), c2, 'الرئيسية سائرة: أول قافلة واقفة بحمولة');
  c2.cargo = {}; a.equal(E.mapActiveCar(S), c1, 'لا واقفة بحمولة: الرئيسية');
  const L = E.mapCarList(S); a.equal(L.filter(c => c.mine).length, 2, 'قوافلك كلها على الخريطة'); ok('القافلة النشطة: الرئيسية إن واقفة، وإلا أول واقفة بحمولة، وإلا الرئيسية'); }

// 4) أملاكي
{ const S = game(5); S.phase = 3; S.player.gold = 500000; S.player.wallet.sar = 500000;
  for (let i = 0; i < 2; i++) a.ok(A.buildShop(S, 'riyadh').ok, 'دكان ' + i); a.ok(A.buildWarehouse(S, 'riyadh').ok, 'مخزن');
  // مصنع في القاهرة بلا دكان فيها: يُبنى في جدة (يلزمه دكان ومخزن) ثم يُنقل إلى القاهرة ويُزال ما عداه
  a.ok(A.buildShop(S, 'jeddah').ok); a.ok(A.buildWarehouse(S, 'jeddah').ok); let f = A.buildFactory(S, 'jeddah', 'perfume'); if (!f.ok) f = A.buildFactory(S, 'jeddah', Object.keys(E.RECIPES || {})[0]); a.ok(f.ok, 'مصنع: ' + JSON.stringify(f));
  S.player.factories[0].city = 'cairo'; { const pj = S.player.props.jeddah; pj.shops = []; pj.whs = 0; S.player.props.cairo = pj; delete S.player.props.jeddah; }
  const v = E.mapOwnView(S); a.equal(v.per.riyadh.n, 3, 'دكانان ومخزن'); a.equal(v.per.cairo.n, 1, 'مصنع'); a.equal(v.N, 4); a.equal(v.M, 2); a.equal(v.per.riyadh.shops, 2); a.equal(v.per.riyadh.whs, 1); a.equal(v.per.cairo.factories, 1); a.equal(v.per.cairo.icon, 'icons/factory'); a.equal(v.per.riyadh.icon, 'icons/ui-shops');
  a.equal(v.per.riyadh.desc, '2 دكان · 1 مخزن'); a.equal(v.per.cairo.desc, '1 مصنع');
  for (const c of S.order) a.equal(v.per[c] ? v.per[c].n : 0, E.assetsIn(S, c), 'n = assetsIn ' + c);
  const pr = S.player.props.riyadh; pr.hist = [{ rev: 100, net: 40 }, { rev: 120, net: 60 }]; a.equal(E.mapOwnView(S).per.riyadh.net, E.shopPnl(S, 'riyadh', 30).total, 'net = shopPnl(…,30).total'); a.equal(E.mapOwnView(S).per.riyadh.net, 100);
  a.equal(E.mapOwnView(S).worst, null, 'لا متهالك');
  const sh = E.shopsOf(S, 'riyadh')[0]; sh.cond = E.HOMEST.badBelow - 1; const w = E.mapOwnView(S); a.ok(w.per.riyadh.bad && w.per.riyadh.bad.cond === sh.cond, 'دكان دون HOMEST.badBelow ⇒ bad'); a.equal(w.worst.city, 'riyadh'); a.ok(/الحالة \d+، /.test(w.per.riyadh.desc), w.per.riyadh.desc);
  sh.cond = E.HOMEST.badBelow; a.equal(E.mapOwnView(S).per.riyadh.bad, null, 'عند الحد لا يُعدّ متهالكاً'); }
ok('أملاكي: n=3 و1، N=4 وM=2، net = shopPnl(…,30).total، والدكان دون HOMEST.badBelow ⇒ bad');

// 5) المخاطر والرياح
{ const S = game(5); const lv = [[0.05, 0], [0.08, 1], [0.12, 2]]; const e0 = E.mapEdges(S).land[0];
  for (const [raw, l] of lv) { S.risk[e0.key] = raw; const e = E.mapRiskView(S).land.find(x => x.key === e0.key); a.equal(e.lvl, l, 'raw ' + raw); a.equal(e.color, ['#4f9a5f', '#c27a1a', '#a8402f'][l]); a.equal(e.w, l === 2 ? 3.2 : 2.4); }
  a.equal(E.mapEdges(S).sea.length, 0, 'لا بحر قبل الطور ' + E.SEA.phase);
  S.shocks = [{ k: 'banditwave', st: 'rumor', city: 'riyadh', end: S.day + 9 }]; a.equal(E.mapRiskView(S).shocks.length, 0, 'rumor لا تظهر');
  S.shocks[0].st = 'on'; const sk = E.mapRiskView(S).shocks; a.equal(sk.length, 1); a.equal(sk[0].icon, 'map/road_bandits'); a.equal(sk[0].text, 'قطّاع طريق حول ' + S.cities.riyadh.name);
  const edge = E.mapRiskView(S).land.filter(x => x.a === 'riyadh' || x.b === 'riyadh').sort((p, q) => q.raw - p.raw)[0], mid = E.mapAlong(edge.path, 0.5); a.ok(Math.abs(sk[0].at[0] - mid[0]) < 1e-6 && Math.abs(sk[0].at[1] - mid[1]) < 1e-6, 'الأيقونة عند منتصف الطريق الأعلى خطراً');
  S.shocks = [{ k: 'pirates', st: 'on', city: 'jeddah', end: S.day + 9 }, { k: 'closure', st: 'on', city: 'cairo', end: S.day + 9 }]; S.phase = 3; const rv = E.mapRiskView(S); a.equal(rv.shocks.length, 1, 'إغلاق ليس من الخطرين'); a.equal(rv.shocks[0].icon, 'map/sea_pirates'); a.equal(rv.shocks[0].text, 'قراصنة قرب ' + S.cities.jeddah.name);
  a.equal(E.mapEdges(S).sea.length, 6, 'سلسلة بحرية من 6 مقاطع من الطور 3'); }
{ const S = game(5); S.phase = 3; const w = E.mapWind(S); a.equal(w.K, 35, 'K = 35'); a.equal(E.mapWind(Object.assign({}, S, { phase: 2 })), null, 'لا ريح قبل البحر');
  // تاريخان: أبريل (نصف أول) وأكتوبر (نصف ثان): نقفز بالأيام حتى نجد كلاً منهما
  const at = m => { const T = game(5); T.phase = 3; for (let d = 0; d < 400; d++) { T.day = d; if (E.dateOf(T).g.m === m && E.dateOf(T).g.d === 15) return T; } return null; };
  const apr = at(4), oct = at(10); a.ok(apr && oct, 'تاريخان'); const wa = E.mapWind(apr), wo = E.mapWind(oct);
  a.equal(wa.half, true); a.equal(wa.dir, 'شرقاً'); a.equal(wa.season, 'الصيف'); a.equal(wo.half, false); a.equal(wo.dir, 'غرباً'); a.equal(wo.season, 'الشتاء');
  a.equal(E.dateOf(apr, wa.dEnd).g.m, 9, 'آخر يوم من النصف الأول في سبتمبر'); a.equal(E.dateOf(apr, wa.dEnd + 1).g.m, 10); a.equal(E.dateOf(oct, wo.dEnd).g.m, 3, 'آخر يوم من الثاني في مارس'); a.equal(E.dateOf(oct, wo.dEnd + 1).g.m, 4);
  a.equal(wa.rot, -25); a.equal(wo.rot, 155); a.equal(wa.text, 'ريح الصيف · إبحار شرقاً +35٪'); a.equal(wo.text, 'ريح الشتاء · إبحار غرباً +35٪');
  // يتّفق مع monsoonOf: شرقاً في الصيف = رياح معك
  a.equal(E.monsoonOf(apr, 'jeddah', 'mumbai').fair, true); a.equal(E.monsoonOf(oct, 'jeddah', 'mumbai').fair, false); }
ok('المخاطر: raw 0.05/0.08/0.12 ⇒ lvl 0/1/2، صدمة rumor لا تظهر وon تظهر عند منتصف الطريق، K=35، dEnd في سبتمبر ومارس، الاتجاه يوافق monsoonOf');

// 6) المنافسون والقوافل
{ const S = game(5); S.phase = 3; step(S, 40); const rg = E.rivalGenView(S); let n0 = 0;
  const v0 = E.mapRivView(S); a.deepEqual(Object.keys(v0.per).sort(), (S.rivals || []).filter(r => r.out == null).map(r => r.city).filter((c, i, ar) => ar.indexOf(c) === i).sort(), 'منافس لكل مدينة فيها حيّ'); a.equal(v0.n, 0, 'لا منافس في أسواقك بلا أملاك');
  // نضع قافلتك وأملاكاً حيث منافسون
  const rv = (S.rivals || []).find(r => r.out == null && r.fx); if (rv) { car0(S).city = rv.city; car0(S).left = 0; const v = E.mapRivView(S); a.ok(v.n >= 1, 'منافس في سوقك حيث قافلتك'); const x = v.per[rv.city];
    a.equal(x.strName, E.RG_STR_NAME(E.rgStr(S, rv, true))); const g0 = E.GD[rv.fx.gs[0]].name, mulS = (rv.fx.mul * E.rgScale(S, rv) * 100); a.ok(x.effect.startsWith(E.RG_KINDS[rv.fx.kind] + ' ' + g0 + ' '), x.effect); a.ok(x.effect.endsWith((Math.round(mulS) > 0 ? '+' : Math.round(mulS) < 0 ? '−' : '') + Math.abs(Math.round(mulS)) + '٪'), x.effect + ' ' + mulS); a.ok(v.top && v.top.str >= x.str - 1e-9); n0 = 1; }
  a.ok(n0 || !(S.rivals || []).length, 'تغطية المنافس المولَّد');
  // قافلة S.rival السائرة وحدها في mapCarList بين المنافسين
  S.rival = S.rival || {}; Object.assign(S.rival, { name: 'منافس', from: 'riyadh', dest: 'jazan', left: 3, total: 5, cargo: { textile: 10 }, city: 'riyadh' }); const L = E.mapCarList(S), rs = L.filter(c => c.rival); a.equal(rs.length, 1); a.deepEqual(L.filter(c => !c.mine && !c.rival && !c.agent), []); a.equal(rs[0].total, 5); a.ok(rs[0].pos.length === 3);
  const pos = E.mapAlong(E.boardPath('riyadh', 'jazan', false), 1 - 3 / 5); a.ok(Math.hypot(rs[0].pos[0] - pos[0], rs[0].pos[1] - pos[1]) < 1e-6, 'الموضع عند t = 1 − left/total');
  S.rival.left = 0; a.equal(E.mapCarList(S).filter(c => c.rival).length, 0, 'واقفة: لا تُرسم'); a.equal(E.mapRivView(S).rivalOnRoad, false); S.rival.left = 2; a.equal(E.mapRivView(S).rivalOnRoad, true); }
ok('المنافسون: الشارة والأثر بالإشارة من rgStr وrgScale، و S.rival السائر وحده قافلةُ منافس في mapCarList');

// 7) بطاقة المدينة: اشترِ منها للعودة
{ const S = game(5), car = car0(S); car.city = 'riyadh'; car.left = 0; give(S, 'textile', 40); const v = E.mapCityView(S, 'jazan'); a.ok(v.back.length <= 2); for (const b of v.back) { a.ok(b.profit > 0); a.ok(!E.GD[b.g].sp && !E.GD[b.g].fresh); }
  for (let i = 1; i < v.back.length; i++) a.ok(v.back[i - 1].profit >= v.back[i].profit); a.equal(v.here, false); a.equal(E.mapCityView(S, 'riyadh').here, true); a.equal(v.riskName, ['منخفض', 'متوسط', 'مرتفع'][E.roadEstimate(S, car, 'jazan').level]); }
ok('بطاقة المدينة: اشترِ منها للعودة (أفضل اثنتين بربح موجب)، وخطر الطريق من roadEstimate');
console.log('map-live: ALL OK');
