// رحلة كاملة عبر المستويات العشرة بأفعال حقيقية في المحرك: node test/journey.test.js [seed]
const E = require('../src/engine.js'); const A = E.A, GD = E.GD;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const seed = +process.argv[2] || 7; const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.abroad = true; // القفل له اختبار خاص (abroad)
const car = () => S.player.caravans[0], L = S.learn;
const arrive = () => { for (let i = 0; i < 80 && car().left > 0; i++) E.tick(S); };
function pick(foreign, exclude) {
  const c = car(), here = S.cities[c.city]; let best = null;
  E.GIDS.forEach(g => {
    if (g === 'wheat' || GD[g].live || !E.sells(here, g) || (exclude && exclude.includes(g))) return;
    const room = Math.floor((E.capOfCar(c) - E.loadOf(c)) / GD[g].w), p = E.unitPrice(here, g) * 1.04;
    const q = Math.min(25, room, Math.floor(S.player.gold * 0.7 / p), Math.floor(here.stock[g] * 0.5)); if (q < 3) return;
    let o = E.sellOptions(S, c.city, g, q, p, c); o = o.filter(x => !E.travelBlock(S, c, x.city)); if (foreign) o = o.filter(x => x.country !== here.country); if (!o.length) return;
    const sc = o[0].profit / (p * q); if (!best || sc > best.sc) best = { g, q, dest: o[0].city, sc, p };
  });
  return best;
}
function cycle(foreign, exclude, mixed) {
  const d = pick(foreign, exclude); if (!d) { S.player.gold += 500; return false; }
  const r = A.buy(S, 1, d.g, d.q); if (!r.ok) return false;
  if (mixed) { const e = pick(foreign, (exclude || []).concat([d.g])); if (e) A.buy(S, 1, e.g, Math.min(e.q, 4)); }
  if (!A.travel(S, 1, d.dest).ok) { E.A.sell(S, 1, d.g, 999); return false; }
  arrive(); Object.keys(car().cargo).forEach(g => { if (car().cargo[g] >= 1) A.sell(S, 1, g, 9999); }); return true;
}
const skipRest = () => { L.rest = null; L.hold = 0; E.learnCheck(S); };
function until(lv, fn, max) { let n = 0; while (L.level < lv && n++ < max) { fn(n); L.rest = null; L.hold = 0; } return L.level >= lv; } // فترات التمرين تُتخطى هنا (تُختبر في start.test.js)

ok(L.level === 1, 'البداية: المستوى ١');
ok(until(2, () => cycle(false), 4), 'م١ ← م٢ بعد شراء وبيع (المستوى ' + L.level + ')');
ok(until(3, () => cycle(false), 14), 'م٢ ← م٣ هامش ١٠٪ وأرباح ٣٠٠ (المستوى ' + L.level + ')');
ok(until(4, () => cycle(false), 14), 'م٣ ← م٤ ثلاث رحلات وأرباح ومؤن (المستوى ' + L.level + ')');
ok(until(5, () => cycle(true), 14), 'م٤ ← م٥ جمارك وربح بعد عبور الحدود (المستوى ' + L.level + ')');
ok(until(6, n => { const ex = Object.keys(L.goods || {}).length ? L.goods : []; cycle(false, ex, true); }, 20), 'م٥ ← م٦ تنويع: ٣ سلع رابحة وقافلة مختلطة (المستوى ' + L.level + ')');
S.player.gold = Math.max(S.player.gold, 300);
const w = S.player.wallet; const ex = w.sar >= 100 ? A.exchange(S, 'sar', 'usd', 100) : A.exchange(S, 'usd', 'sar', Math.max(1, Math.floor(w.usd * 0.5))); ok(ex.ok, 'تحويل عملة: ' + (ex.msg || ''));
if (L.secrets.length < 2) cycle(true); 
ok(L.level >= 7, 'م٦ ← م٧ صرف عملات وزيارة دولتين (المستوى ' + L.level + '، دول: ' + L.secrets.join(',') + ')');
skipRest();
// الطور ٢: دكان ومخزن
S.player.gold += 9000; E.tick(S); ok(S.phase >= 2, 'الطور ٢ مفتوح');
const here0 = car().city; const bs = A.buildShop(S, here0); ok(bs.ok, 'بناء دكان: ' + (bs.msg || ''));
const g7 = pick(false); if (g7) A.buy(S, 1, g7.g, Math.min(g7.q, 6)); const gg = Object.keys(car().cargo).find(g => car().cargo[g] >= 1);
const ts = gg ? A.toStore(S, 1, gg, 3) : { ok: false, msg: 'لا بضاعة' }; ok(ts.ok, 'إيداع بضاعة في المخزن: ' + (ts.msg || ''));
ok(L.level >= 8, 'م٧ ← م٨ دكان وتخزين (المستوى ' + L.level + ')');
skipRest();
// الشراكة
let signed = false; S.player.gold += 3000;
for (const id of S.order) { for (const t of Object.keys(E.PACTS)) { if (!signed && !E.pactBlock(S, id, t) && A.signPact(S, id, t).ok) signed = true; } }
ok(signed, 'توقيع شراكة'); ok(L.level >= 9, 'م٨ ← م٩ (المستوى ' + L.level + ')'); skipRest();
// الوكيل (الطور ٣)
S.player.gold += 40000; E.tick(S); ok(S.phase >= 3, 'الطور ٣ مفتوح');
let ag = false; for (const id of S.order) { for (const g of E.GIDS) { if (!ag && E.sells(S.cities[id], g) && g !== 'wheat') { const q = E.agentQuote(S, id, g, 5); if (q.ok && A.agentBuy(S, id, g, 5).ok) ag = true; } } }
ok(ag, 'طلب عبر الوكيل'); ok(L.level >= 10, 'م٩ ← م١٠ (المستوى ' + L.level + ')'); skipRest();
// الطور ٤: ائتمان
S.player.gold += 90000; E.tick(S); ok(S.phase >= 4, 'الطور ٤ مفتوح');
S.cities[S.player.caravans[0].city].stock.wheat = 800; const bo = A.murabaha(S, 'wheat', 10, 30); ok(bo.ok, 'مرابحة: ' + (bo.msg || '')); A.settle(S);
ok(L.level === 11, 'م١٠ ← التخرّج: المستوى ١١ (المستوى ' + L.level + ')');
skipRest();
ok(L.up.length === 10 && L.up.every((v, i) => v === i + 1), 'عشر نوافذ ترقية مرتّبة: ' + L.up.join(','));
ok(Object.keys(L.rseen).length > 8, 'تعليقات عمّ سالم أُطلقت أثناء الرحلة (' + Object.keys(L.rseen).length + ')');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
