#!/usr/bin/env node
'use strict';
// 053 (قياس قبل المواصفة): لاعب آلي «مستثمر» من بداية جديدة (800 ريال، السعودية، تاجر) يتاجر بقافلته بأفعال اللاعب الحقيقية (A.buy/A.sell/A.travel)
// (ومجموعة ثالثة «تجارة فقط» بلا استثمار لقياس زمن بلوغ عتبات الثروة بالقافلة وحدها)
// ويعيد استثمار ربحه أسبوعياً بترتيب ثابت: دكان ← مخزن ← مزرعة ← مصنع ← قافلة ثانية ← سفينة ← توسّع (دكاكين في مدن أخرى، قوافل حتى حدّ الرتبة).
// لا مناورة (lobby): السيطرة تأتي من الحضور والمبيعات وحدها كما يلعب أغلب اللاعبين. مخاطر الطريق مفعّلة (القتال)، والصدمات مرة مفعّلة ومرة مطفأة (S.noShocks).
// يقيس: يوم أول دكان/مخزن/مزرعة/مصنع/قافلة ثانية/سفينة، يوم أول سوق مقاد وعدد الأسواق المقادة ودول كاملة، أسابيع الخسارة وأعمق تراجع، النهب والحريق وبقية بنود الخسارة،
// وفرق الثروة بين الصدمات مفعّلة ومطفأة. لا يغيّر شيئاً في src/. الاستعمال: node tools/balance-measure.js [--years 8] [--seeds 12] [--json out.json]
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const Y = 354, YEARS = +arg('years', 8), NSEEDS = +arg('seeds', 12), SEEDS = Array.from({ length: NSEEDS }, (_, i) => i + 1);
const EXPAND = ['riyadh', 'jeddah', 'mecca', 'medina', 'hail', 'cairo', 'alex', 'isfahan', 'shiraz', 'delhi', 'mumbai', 'xian', 'guangzhou', 'jazan', 'aswan', 'tabriz', 'kolkata', 'shanghai'];
const LOSS = ['bandits', 'pirates', 'storm', 'fire', 'fine', 'realizedLoss', 'spoil', 'spoilage', 'theft', 'seized'];

const TH = [5e3, 1e4, 25e3, 5e4, 1e5, 1e6];
function runOne(E, seed, shocks, years, mode = 'invest') {
  const A = E.A, S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader');
  S.noLock = 1; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; S.phase = 4; if (!shocks) S.noShocks = true;
  const P = S.player, first = {}, mark = (k, d) => { if (first[k] == null) first[k] = d; };
  const thr = TH.map(() => null), nwW = [], ctrl = [], shockN = {}, seen = new Set(), assetLog = [];
  let peak = 0, maxDD = 0, ddEp = 0, inDD = false, lossWeeks = 0, tripsAtShop = null, firstLed = null;
  const car0 = P.caravans[0];
  // تاجر جشع بأفعال اللاعب: يبيع كل حمولته عند الوصول، ثم يختار سلعة×وجهة بأعلى ربح يومي متوقع (ربع مخزون السوق حدّاً، والجمارك والمؤن محسوبة)
  function trade(car) {
    if (car.left > 0) return; const c = S.cities[car.city];
    for (const g of Object.keys(car.cargo)) if (car.cargo[g] >= 1) A.sell(S, car.id, g, Math.floor(car.cargo[g]));
    const wheat = E.unitPrice(c, 'wheat'), cands = [];
    for (const d of S.order) {
      if (d === car.city || E.travelBlock(S, car, d) || E.shockBlock(S, car.city, d)) continue;
      const dc = S.cities[d], days = E.tripDays(S, car, car.city, d), cus = dc.country === c.country ? 0 : E.CD[dc.country].customs, prov = E.supplyNeed(car, days) * wheat;
      for (const g of E.GIDS) {
        if (!E.sells(c, g) || E.GD[g].sp || E.GD[g].live || E.GD[g].fresh) continue;
        const pb = E.unitPrice(c, g) * 1.03, ps = E.unitPrice(dc, g) * 0.97 * (1 - dc.tax - cus), w = E.GD[g].w || 1;
        const q = Math.floor(Math.min((E.capOfCar(car) - E.loadOf(car)) / w, Math.max(0, P.gold - prov - 60) / pb, c.stock[g] * 0.25));
        if (q < 1) continue; const m = (q * (ps - pb) - prov) / Math.max(1, days); if (m > 0) cands.push({ g, d, q, m });
      }
    }
    cands.sort((a, b) => b.m - a.m);
    for (const k of cands.slice(0, 4)) { const r = A.buy(S, car.id, k.g, k.q); if (!r.ok) continue; if (A.travel(S, car.id, k.d).ok) return; A.sell(S, car.id, k.g, Math.floor(car.cargo[k.g] || 0)); }
    if (P.gold < 60) { A.work(S); return; }
    const o = S.order.filter(x => x !== car.city && !E.travelBlock(S, car, x) && !E.shockBlock(S, car.city, x)).sort((a, b) => E.tripDays(S, car, car.city, a) - E.tripDays(S, car, car.city, b));
    if (o.length) A.travel(S, car.id, o[0]);
  }
  const topGoods = city => { const c = S.cities[city]; return E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4); };
  const stock = city => { for (const sh of E.shopsOf(S, city)) if (sh.items.length < 4) for (const g of topGoods(city)) A.shopSetItem(S, city, sh.id, g, E.SHOP_PRICE0, true); A.hireFill(S, city); };
  const buy = (k, d, fn, cost) => { const before = P.gold; const r = fn(); if (r && r.ok) { mark(k, d); assetLog.push({ k, d, cost: Math.round(before - P.gold) }); return true; } return false; };
  function invest(d) {
    const nw = E.netWorth(S), res = Math.max(400, 0.15 * nw), home = 'riyadh', g = () => P.gold - res, nShops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
    if (!nShops) { if (g() >= E.shopCost(S, S.cities[home]) && buy('shop', d, () => A.buildShop(S, home))) { tripsAtShop = P.trips; stock(home); } return; }
    const pr = P.props[home];
    if (pr && pr.whs < 1 && g() >= E.whCost(S, S.cities[home])) { buy('warehouse', d, () => A.buildWarehouse(S, home)); return; }
    if (pr && !pr.farm && g() >= E.FARM_COST) { if (buy('farm', d, () => A.buildFarm(S, home))) A.hireStaff(S, home, 'farmer'); return; }
    if (!P.factories.length && g() >= 4000) { buy('factory', d, () => A.buildFactory(S, home, 'perfume')); return; }
    if (P.caravans.length < 2 && g() >= 1500) { if (buy('caravan', d, () => A.hireCaptain(S))) { const c = P.caravans.at(-1); if (c.captain) { c.captain.role = 'indep'; c.captain.home = 'sa'; } } return; }
    if (!(P.ships || []).length && g() >= E.SHIPS.dhow.cost) { buy('ship', d, () => A.buyShip(S, 'jeddah', 'dhow')); return; }
    // توسّع: دكان جديد (ومخزنه) في أول مدينة متاحة بالترتيب، ثم قافلة حتى حدّ الرتبة
    for (const city of EXPAND) { const c = S.cities[city], n = E.shopsOf(S, city).length; if (n >= Math.min(3, E.shopLimit(c)) || g() < E.shopCost(S, c)) continue; if (buy('shop+', d, () => A.buildShop(S, city))) { stock(city); if (P.props[city].whs < P.props[city].shops.length && g() >= E.whCost(S, c)) A.buildWarehouse(S, city); return; } }
    if (g() >= 1500 && P.caravans.length < 6 && buy('caravan+', d, () => A.hireCaptain(S))) { const c = P.caravans.at(-1); if (c.captain) { c.captain.role = 'indep'; c.captain.home = 'sa'; } }
  }
  for (let d = 0; d < years * Y; d++) {
    if (S.zakat && S.zakat.due) A.zakatPay(S);
    trade(car0); if (d % 7 === 0 && mode === 'invest') invest(d); if (d % 30 === 0) for (const city of Object.keys(P.props)) if (E.shopsOf(S, city).length) stock(city);
    E.tick(S, false); S.pause = false; if (S.road) A.roadChoose(S, 'fight'); if (S.life && S.life.pending) S.life.pending = null;
    for (const sh of S.shocks || []) if (!seen.has(sh.id) && sh.st === 'on') { seen.add(sh.id); shockN[sh.k] = (shockN[sh.k] || 0) + 1; }
    const led = S.order.filter(id => S.bosses[id] && S.bosses[id].ruler === 'player').length; if (led && firstLed == null) firstLed = d;
    if (d % 7 === 6) { const w = E.netWorth(S); TH.forEach((t, i) => { if (thr[i] == null && w >= t) thr[i] = d; }); if (nwW.length && w < nwW.at(-1)) lossWeeks++; nwW.push(Math.round(w)); peak = Math.max(peak, w); const dd = peak > 0 ? 1 - w / peak : 0; maxDD = Math.max(maxDD, dd); if (dd >= 0.05 && !inDD) { inDD = true; ddEp++; } if (dd < 0.01) inDD = false; }
    if ((d + 1) % Y === 0) ctrl.push({ led, countries: E.COUNTRIES.filter(co => S.order.filter(id => S.cities[id].country === co.id).every(id => S.bosses[id] && S.bosses[id].ruler === 'player')).length, nw: Math.round(E.netWorth(S)), gold: Math.round(P.gold) });
  }
  const exp = P.led.exp, inc = P.led.inc, nShops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
  const losses = {}; for (const k of Object.keys(exp)) if (LOSS.includes(k) && exp[k] > 0.5) losses[k] = Math.round(exp[k]);
  return { seed, shocks, mode, thr, first, tripsAtShop, firstLed, ctrl, weeks: nwW.length, lossWeeks, maxDD: +maxDD.toFixed(3), ddEp, losses, shockN, shops: nShops, fact: P.factories.length, cars: P.caravans.length, ships: (P.ships || []).length, D: +E.diffD(S).toFixed(2),
    incShops: Math.round(inc.shops || 0), incAll: Math.round(Object.values(inc).reduce((a, b) => a + b, 0)), assetsSpent: Math.round(exp.assets || 0), rent: Math.round(exp.rent || 0), lobby: Math.round(exp.lobby || 0), expKeys: Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, Math.round(v)])), assetLog: assetLog.slice(0, 40) };
}
module.exports = { runOne };
if (!isMainThread && workerData && workerData.__bal) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.seed, workerData.shocks, workerData.years, workerData.mode)); return; }
if (require.main === module) {
  const tasks = []; for (const [shocks, mode] of [[true, 'invest'], [false, 'invest'], [true, 'trade']]) for (const seed of SEEDS) tasks.push({ __bal: 1, seed, shocks, mode, years: YEARS });
  const res = []; let next = 0, running = 0;
  const pump = () => { while (running < Math.max(1, os.cpus().length) && next < tasks.length) { const t = tasks[next++]; running++; const w = new Worker(__filename, { workerData: t }); w.once('message', m => { res.push(m); console.error('done', res.length + '/' + tasks.length); }); w.once('error', e => { console.error(e); process.exit(1); }); w.once('exit', () => { running--; if (res.length === tasks.length) { const out = arg('json', path.join(__dirname, '../specs/053-economy-balance/measure.json')); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ years: YEARS, seeds: SEEDS, rows: res.sort((a, b) => a.seed - b.seed || b.shocks - a.shocks || a.mode.localeCompare(b.mode)) }) + '\n'); console.log('كُتب ' + out); } else pump(); }); } };
  pump();
}
