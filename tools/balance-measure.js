#!/usr/bin/env node
'use strict';
// 053 (قياس قبل المواصفة): لاعب آلي «مستثمر» من بداية جديدة (800 ريال، السعودية، تاجر) يتاجر بقافلته بأفعال اللاعب الحقيقية (A.buy/A.sell/A.travel)
// (ومجموعة ثالثة «تجارة فقط» بلا استثمار لقياس زمن بلوغ عتبات الثروة بالقافلة وحدها)
// ويعيد استثمار ربحه أسبوعياً بترتيب ثابت: دكان ← مخزن ← مزرعة ← مصنع ← قافلة ثانية ← سفينة ← توسّع (دكاكين في مدن أخرى، قوافل حتى حدّ الرتبة).
// لا مناورة (lobby): السيطرة تأتي من الحضور والمبيعات وحدها كما يلعب أغلب اللاعبين. مخاطر الطريق مفعّلة (القتال)، والصدمات مرة مفعّلة ومرة مطفأة (S.noShocks).
// يقيس: يوم أول دكان/مخزن/مزرعة/مصنع/قافلة ثانية/سفينة، يوم أول سوق مقاد وعدد الأسواق المقادة ودول كاملة، أسابيع الخسارة وأعمق تراجع، النهب والحريق وبقية بنود الخسارة،
// وفرق الثروة بين الصدمات مفعّلة ومطفأة. لا يغيّر شيئاً في src/. الاستعمال: node tools/balance-measure.js [--years 8] [--seeds 12] [--json out.json]
// 053أ (§8): --bal on|off (E.BAL.on) و--diff calm|normal|hard (S.diff بعد newGame) و--set demand.1=0.3,k.shop.1=18 (مقابض BAL بلا تعديل الشيفرة)
//   --mode invest|trade|rent|neglect|solo [--shocks on|off|both] [--price p]. أثمان اللاعب الآلي تُقرأ من دوال المحرك (farmCost وfactoryCost وcapFee وshipCost) لا أرقاماً مكتوبة.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OPT = { bal: arg('bal', 'off'), diff: arg('diff', 'normal'), set: arg('set', ''), price: arg('price', ''), skip: arg('skip', '') }; // --skip farm|factory: توأم بلا مزرعة أو مصنع لقياس دخلهما بالفرق (ط4)
// يضبط المقابض في نسخة المحرك (لكل عامل): demand.1=0.3 أو k.shop.1=18 (آخر رقم = فهرس المستوى)
function applyOpt(E, o) {
  E.BAL.on = o.bal === 'on';
  for (const kv of String(o.set || '').split(',').filter(Boolean)) { const [path, v] = kv.split('='), parts = path.split('.'), idx = +parts.pop(); let t = E.BAL; for (const k of parts) t = t[k]; if (Array.isArray(t[idx])) t[idx] = JSON.parse(v); else t[idx] = +v; }
}
const Y = 354, YEARS = +arg('years', 8), NSEEDS = +arg('seeds', 12), SEEDS = Array.from({ length: NSEEDS }, (_, i) => i + 1);
const EXPAND = ['riyadh', 'jeddah', 'mecca', 'medina', 'hail', 'cairo', 'alex', 'isfahan', 'shiraz', 'delhi', 'mumbai', 'xian', 'guangzhou', 'jazan', 'aswan', 'tabriz', 'kolkata', 'shanghai'];
const LOSS = ['bandits', 'pirates', 'storm', 'fire', 'fine', 'realizedLoss', 'spoil', 'spoilage', 'theft', 'seized'];

const TH = [5e3, 1e4, 25e3, 5e4, 1e5, 1e6];
function runOne(E, seed, shocks, years, mode = 'invest', opt = OPT) {
  applyOpt(E, opt); if (mode === 'solo') return runSolo(E, seed, opt);
  const A = E.A, S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); if (opt.diff && opt.diff !== 'normal') S.diff = opt.diff;
  S.noLock = 1; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; S.phase = 4; if (!shocks) S.noShocks = true;
  const P = S.player, first = {}, mark = (k, d) => { if (first[k] == null) first[k] = d; };
  const thr = TH.map(() => null), nwW = [], ctrl = [], shockN = {}, seen = new Set(), assetLog = [];
  let peak = 0, maxDD = 0, ddEp = 0, inDD = false, lossWeeks = 0, tripsAtShop = null, firstLed = null, rentDay = null, buyDay = null, rentInfo = null, hitTot = 0; const hitPrev = {}, idle = [];
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
  const fill = city => { if (mode !== 'neglect') return A.hireFill(S, city); for (let i = 0; i < 6 && E.sellerPts(S, city) + 1e-9 < E.sellerNeed(S, city); i++) if (!A.hireStaff(S, city, 'seller').ok) break; }; // neglect: بلا أمين مخزن
  const stock = city => { for (const sh of E.shopsOf(S, city)) if (sh.items.length < 4) for (const g of topGoods(city)) A.shopSetItem(S, city, sh.id, g, E.balPrice0(S), true); fill(city); };
  const buy = (k, d, fn, cost) => { const before = P.gold; const r = fn(); if (r && r.ok) { mark(k, d); assetLog.push({ k, d, cost: Math.round(before - P.gold) }); return true; } return false; };
  function invest(d) {
    const nw = E.netWorth(S), res = Math.max(400, 0.15 * nw), home = 'riyadh', g = () => P.gold - res, nShops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
    if (mode === 'rent' && !P.props[home]?.shops.length && rentDay == null) { const fee = E.rentOf(S, S.cities[home], 'shop', 'private', 0) * 3; if (g() >= fee && buy('rent', d, () => A.rentShop(S, home, 'shop', 'private'))) { rentDay = d; tripsAtShop = P.trips; stock(home); } return; }
    if (mode === 'rent' && rentDay != null && !buyDay) { const sh0 = P.props[home] && P.props[home].shops[0]; if (sh0 && E.shKind(sh0) !== 'own') { const q = E.shopBuyQuote(S, home, sh0.id); if (g() >= q.pay && buy('shop', d, () => A.buyShop(S, home, sh0.id))) { buyDay = d; rentInfo = { rentDay, buyDay: d, price: q.price, disc: Math.round(q.disc), pay: q.pay, rent: q.rent }; stock(home); } } return; }
    if (!nShops) { if (g() >= E.shopCost(S, S.cities[home]) && buy('shop', d, () => A.buildShop(S, home))) { tripsAtShop = P.trips; stock(home); } return; }
    const pr = P.props[home];
    if (pr && pr.whs < 1 && g() >= E.whCost(S, S.cities[home])) { buy('warehouse', d, () => A.buildWarehouse(S, home)); return; }
    if (pr && !pr.farm && opt.skip !== 'farm' && g() >= E.farmCost(S, S.cities[home])) { if (buy('farm', d, () => A.buildFarm(S, home))) A.hireStaff(S, home, 'farmer'); return; }
    if (!P.factories.length && opt.skip !== 'factory' && g() >= E.factoryCost(S, home, 'perfume').cost) { buy('factory', d, () => A.buildFactory(S, home, 'perfume')); return; }
    if (P.caravans.length < 2 && g() >= E.capFee(S)) { if (buy('caravan', d, () => A.hireCaptain(S))) { const c = P.caravans.at(-1); if (c.captain) { c.captain.role = 'indep'; c.captain.home = 'sa'; } } return; }
    if (!(P.ships || []).length && g() >= E.shipCost(S, 'dhow', 'jeddah')) { buy('ship', d, () => A.buyShip(S, 'jeddah', 'dhow')); return; }
    // توسّع: دكان جديد (ومخزنه) في أول مدينة متاحة بالترتيب، ثم قافلة حتى حدّ الرتبة
    for (const city of EXPAND) { const c = S.cities[city], n = E.shopsOf(S, city).length; if (n >= Math.min(3, E.shopLimit(c)) || g() < E.shopCost(S, c)) continue; if (buy('shop+', d, () => A.buildShop(S, city))) { stock(city); if (P.props[city].whs < P.props[city].shops.length && g() >= E.whCost(S, c)) A.buildWarehouse(S, city); return; } }
    if (g() >= E.capFee(S) && P.caravans.length < 6 && buy('caravan+', d, () => A.hireCaptain(S))) { const c = P.caravans.at(-1); if (c.captain) { c.captain.role = 'indep'; c.captain.home = 'sa'; } }
  }
  // رعاية الأصول: invest/rent يرمّم حين تنزل الحالة دون 60 ويعيّن مديراً في كل مدينة فيها دكانان فأكثر؛ neglect لا مدير ولا أمين ولا ترميم (الأجور والصيانة تبقى)
  let repairs = 0; const care = () => { if (mode === 'neglect') { for (const city of Object.keys(P.props)) { const pr = P.props[city]; if (pr.staff) pr.staff = pr.staff.filter(w => w.role !== 'keeper'); } return; }
    for (const city of Object.keys(P.props)) { const pr = P.props[city], ids = [...pr.shops.filter(sh => E.shKind(sh) === 'own').map(sh => sh.id), ...(pr.whs ? ['wh'] : [])];
      for (const id of ids) { const q = E.scQuote(S, city, id); if (q && q.can && q.cond < 60 && P.gold >= q.cost) { const g0 = P.gold; if (A.shopRepair(S, city, id).ok) repairs += g0 - P.gold; } }
      if (!pr.mgr && pr.shops.length >= 2 && P.gold > 5000) A.hireManager(S, city, 1); } };
  let fAct = 0, fPot = 0; const fW = [], revPrev = new Map(); // ط6 فاقد الإهمال (حكم Opus 2026-11-16c)
  // المستأجر يسدّد مستحقاته كل يوم (دفعات الإيجار تتراكم paymentDues)
  const settleDues = () => { for (const due of (S.paymentDues || []).slice()) if (due.amount > 0 && P.gold >= due.amount && A.settlePayment) A.settlePayment(S, due.id); };
  for (let d = 0; d < years * Y; d++) {
    if (S.zakat && S.zakat.due) A.zakatPay(S);
    trade(car0); if (d % 7 === 0 && mode !== 'trade') { invest(d); care(); } if (rentDay != null && !buyDay) settleDues(); if (d % 30 === 0) for (const city of Object.keys(P.props)) if (E.shopsOf(S, city).length) stock(city);
    E.tick(S, false); S.pause = false; if (S.road) A.roadChoose(S, 'fight'); if (S.life && S.life.pending) S.life.pending = null;
    for (const sh of S.shocks || []) if (!seen.has(sh.id) && sh.st === 'on') { seen.add(sh.id); shockN[sh.k] = (shockN[sh.k] || 0) + 1; }
    for (const city of Object.keys(P.props)) for (const sh of P.props[city].shops) {
      if (E.shKind(sh) !== 'own') continue;
      const r0 = sh.items.reduce((a, it) => a + (it.revenue || 0), 0), k = city + ':' + sh.id, dr = r0 - (revPrev.get(k) || 0); revPrev.set(k, r0);
      if (dr > 0) { const m = E.scSalesMul(sh, S); fAct += dr; fPot += dr / Math.max(0.01, m); }
    }
    if (d % 7 === 6) { fW.push(fPot > 0 ? 1 - fAct / fPot : null); fAct = 0; fPot = 0; }
    for (const city of Object.keys(P.props)) { const h = P.props[city].hitLost || 0, pv = hitPrev[city] || 0; if (h > pv) hitTot += h - pv; hitPrev[city] = h; }
    const led = S.order.filter(id => S.bosses[id] && S.bosses[id].ruler === 'player').length; if (led && firstLed == null) firstLed = d;
    if (d % 7 === 6) { const w = E.netWorth(S); TH.forEach((t, i) => { if (thr[i] == null && w >= t) thr[i] = d; }); if (nwW.length && w < nwW.at(-1)) lossWeeks++; nwW.push(Math.round(w)); peak = Math.max(peak, w); const dd = peak > 0 ? 1 - w / peak : 0; maxDD = Math.max(maxDD, dd); if (dd >= 0.05 && !inDD) { inDD = true; ddEp++; } if (dd < 0.01) inDD = false; }
    if ((d + 1) % Y === 0) ctrl.push({ led, countries: E.COUNTRIES.filter(co => S.order.filter(id => S.cities[id].country === co.id).every(id => S.bosses[id] && S.bosses[id].ruler === 'player')).length, nw: Math.round(E.netWorth(S)), gold: Math.round(P.gold), idle: +(P.gold / Math.max(1, E.netWorth(S))).toFixed(3) });
  }
  const exp = P.led.exp, inc = P.led.inc, nShops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
  const losses = {}; for (const k of Object.keys(exp)) if (LOSS.includes(k) && exp[k] > 0.5) losses[k] = Math.round(exp[k]);
  const tk = P.tk || {}, t5inc = (inc.shops || 0) + (inc.realized || 0), t5loss = hitTot + (exp.fire || 0) + (exp.flood || 0) + (exp.war || 0) + (exp.roadExtra || 0) - (tk.got || 0), shopWk = first.shop != null ? Math.floor(first.shop / 7) : null, fPost = shopWk == null ? [] : fW.slice(shopWk + 1).filter(x => x != null);
  return { seed, shocks, mode, nwW, t6: fPost.length ? +(fPost.reduce((a, b) => a + b, 0) / fPost.length).toFixed(4) : null, t6w: fPost.length ? +(fPost.filter(x => x >= 0.05).length / fPost.length).toFixed(4) : null, t6on: fPost.findIndex(x => x >= 0.05), t5: +(t5loss / Math.max(1, t5inc)).toFixed(4), t5loss: Math.round(t5loss), t5inc: Math.round(t5inc), roadExtra: Math.round(exp.roadExtra || 0), bal: opt.bal, diff: opt.diff, rentInfo, hitLost: Math.round(hitTot), flood: Math.round(exp.flood || 0), war: Math.round(exp.war || 0), fire: Math.round(exp.fire || 0), tkGot: Math.round(tk.got || 0), thr, first, tripsAtShop, firstLed, ctrl, weeks: nwW.length, lossWeeks, maxDD: +maxDD.toFixed(3), ddEp, losses, shockN, shops: nShops, fact: P.factories.length, cars: P.caravans.length, ships: (P.ships || []).length, D: +E.diffD(S).toFixed(2),
    incShops: Math.round(inc.shops || 0), incAll: Math.round(Object.values(inc).reduce((a, b) => a + b, 0)), assetsSpent: Math.round(exp.assets || 0), rent: Math.round(exp.rent || 0), lobby: Math.round(exp.lobby || 0), expKeys: Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, Math.round(v)])), incKeys: Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, Math.round(v)])), assetLog: assetLog.slice(0, 40) };
}
/* solo (053أ §8): دكان مملوك واحد في الرياض بأربعة أصناف، بلا تجارة قافلة، 120 يوماً؛ Y = 354 × صافي دخل الدكان ÷ 120 ÷ الثمن المدفوع (يُطرح قيده الدفتري الثابت من netWorth)
   ويُخرج Yq أيضاً على «ثمن التمليك» shopBuyQuote.price ليُقارن بجدول §8.1 */
function runSolo(E, seed, opt) {
  const A = E.A, S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.learn.stageIntro = 22; S.phase = 4; S.noShocks = true; S.noEvents = true;
  if (opt.diff && opt.diff !== 'normal') S.diff = opt.diff;
  const P = S.player, home = 'riyadh', c = S.cities[home]; P.gold = 1e6; const nw0 = E.netWorth(S), g0 = P.gold;
  if (!A.buildShop(S, home).ok) throw Error('solo: تعذّر بناء الدكان'); const paid = g0 - P.gold, pr = P.props[home], sh = pr.shops[0];
  const goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4), price = opt.price ? +opt.price : E.balPrice0(S);
  for (const g of goods) A.shopSetItem(S, home, sh.id, g, price, true); A.hireFill(S, home);
  const book = E.balShopBook(pr) + E.balWhBook(pr); let sold = 0;
  for (let d = 0; d < 120; d++) { E.tick(S, false); S.pause = false; if (S.road) A.roadChoose(S, 'fight'); }
  const inc = E.netWorth(S) - nw0 + paid - book, q = { price: Math.round(1500 * E.balK(S, 'shop')) };
  return { seed, mode: 'solo', bal: opt.bal, diff: opt.diff, p: price, paid, Y: +(354 * inc / 120 / paid).toFixed(4), Yq: +(354 * inc / 120 / q.price).toFixed(4), incDay: Math.round(inc / 120), shopSold: Math.round(P.led.inc.shops || 0) };
}
module.exports = { runOne, runSolo, applyOpt };
if (!isMainThread && workerData && workerData.__bal) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.seed, workerData.shocks, workerData.years, workerData.mode, workerData.opt)); return; }
if (require.main === module) {
  const MODE = arg('mode', ''), SH = arg('shocks', 'on'), tasks = [];
  if (!MODE) { for (const [shocks, mode] of [[true, 'invest'], [false, 'invest'], [true, 'trade']]) for (const seed of SEEDS) tasks.push({ __bal: 1, seed, shocks, mode, years: YEARS, opt: OPT }); }
  else if (MODE === 'solo') { for (const p of (OPT.price ? [OPT.price] : [1.3, 1.5, 1.7, 1.9, 2.2])) for (const seed of SEEDS) tasks.push({ __bal: 1, seed, shocks: false, mode: 'solo', years: 1, opt: { ...OPT, price: p } }); }
  else for (const shocks of SH === 'both' ? [true, false] : [SH !== 'off']) for (const seed of SEEDS) tasks.push({ __bal: 1, seed, shocks, mode: MODE, years: YEARS, opt: OPT });
  const res = []; let next = 0, running = 0;
  const pump = () => { while (running < Math.max(1, os.cpus().length) && next < tasks.length) { const t = tasks[next++]; running++; const w = new Worker(__filename, { workerData: t }); w.once('message', m => { res.push(m); console.error('done', res.length + '/' + tasks.length); }); w.once('error', e => { console.error(e); process.exit(1); }); w.once('exit', () => { running--; if (res.length === tasks.length) { const out = arg('json', path.join(__dirname, '../specs/053-economy-balance/measure.json')); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ years: YEARS, seeds: SEEDS, opt: OPT, rows: res.sort((a, b) => a.seed - b.seed || (b.shocks | 0) - (a.shocks | 0) || a.mode.localeCompare(b.mode) || (a.p || 0) - (b.p || 0)) }) + '\n'); console.log('كُتب ' + out); } else pump(); }); } };
  pump();
}
