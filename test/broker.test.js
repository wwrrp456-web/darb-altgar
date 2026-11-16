'use strict';
// 030 السمسار التعليمي المولَّد (المحرك): SC-001 (1,000 عرض بذاكرة تراكمية)، SC-002 (5,000 عرض: قرينة لكل غاشّ ونسب الصدق)، FR-002 (لا حظ)،
// الحدود، الأفعال والمهلة والردّ والصافي، SC-004 (النصوص الشرعية حرفاً)، SC-005 (المطفأ = البصمة القديمة). node test/broker.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, B = E.BROKER;
const game = (seed, o) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 7; S.noShocks = true; S.noEvents = true; S.player.gold = (o && o.gold) || 6000; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.learn.eq.length && S.learn.eq[0].id !== 'broker') S.learn.eq = []; } };
const sig = o => [o.name, o.type, o.style, o.pers, o.ri, o.rel].join('|');
a.equal(B.on, true);
// SC-004: النصوص الشرعية حرفاً من ملف الاعتماد، ولا نص شرعي آخر خارج BR_SH وBR_HADITH
{
  const appr = fs.readFileSync(path.join(__dirname, '../docs/review/APPROVED_BROKER_2026-11-16.md'), 'utf8');
  for (const k of ['SH01', 'SH03', 'SH04', 'SH05']) a(appr.includes('«' + E.BR_SH[k] + '»'), k + ' حرفاً في ملف الاعتماد');
  a.deepEqual(Object.keys(E.BR_SH), ['SH01', 'SH03', 'SH04', 'SH05']);
  const src = fs.readFileSync(path.join(__dirname, '../src/engine/15d-broker.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '').replace(/const BR_SH = \{[\s\S]*?\n\};/, '').replace(/const BR_HADITH = .*/, '');
  for (const w of ['ﷺ', 'محرّم', 'حرام', 'حلال', 'math.random']) a(!src.toLowerCase().includes(w.toLowerCase()), 'نص شرعي أو عشوائية خارج BR_SH: ' + w);
  for (const bad of ['rnd(', 'rndB(', 'roll(', 'rgRng(', 'Math.random']) a(!src.includes(bad), 'ممنوع في السمسار: ' + bad);
  const ui = fs.readFileSync(path.join(__dirname, '../src/ui/06u-broker.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); a(!/<select|<details|best:/.test(ui), 'لا select ولا details ولا best في البطاقة');
  const les = fs.readFileSync(path.join(__dirname, '../src/lessons.js'), 'utf8').split('\n').filter(l => /^\s*brk\w+:/.test(l)).join('\n'); a(!/ﷺ|محرّم|حرام|حلال/.test(les), 'دروس brk* بلا نص شرعي');
  a.equal(E.BR_TITLE.length, 30); a.equal(new Set(E.BR_TITLE).size, 30); for (const t of E.BR_TITLE) a(!E.RG_TITLE.includes(t), 'تكرار لقب مع المنافسين: ' + t);
}
let badAll = 0; // SC-001: 1,000 عرض × 3 بذور بذاكرة تراكمية ممرَّرة: لا تكرار كامل، ولا أسلوب قبل رؤية 4 من 5 في النوع نفسه
for (const seed of [1, 2, 3]) {
  const S = game(seed), mem = E.brokerMemoryNew(), sigs = new Set(), seen = {}; let bad = 0;
  S.player.gold = 1e6; const car = S.player.caravans[0]; for (const g of E.GIDS) if (!E.GD[g].live && E.sells(S.cities[car.city], g)) S.cities[car.city].stock[g] = 500;
  for (let i = 0; i < 1000; i++) {
    S.brokers = null; const o = E.brokerGen(S, mem); a(o, 'عرض #' + i);
    a(!sigs.has(sig(o)), 'تكرار كامل: ' + sig(o)); sigs.add(sig(o));
    const set = seen[o.type] || (seen[o.type] = new Set()); if (set.has(o.style) && set.size < 4) bad++; set.add(o.style);
    if (i % 25 === 0) { S.brokers = { offer: null, ret: null, pend: [], ledger: {}, log: [], ask: {} }; }
  }
  badAll += bad; a(mem.recent.length <= 80, 'الذاكرة أحدث 80');
}
// أوزان 1/(1+c)^8 تُبقي احتمال التكرار المبكر أقل من 1٪ لا صفراً: نقبل ≤ 0.1٪ من 3,000 عرض (انحراف موثَّق في report.md)
a(badAll <= 3, 'أسلوب تكرر قبل رؤية 4 من 5: ' + badAll); console.log('SC-001 تكرارات مبكرة: ' + badAll + ' من 3000');
// SC-002: 5,000 عرض: قرينة «عاين» لكل غاشّ؛ نسب الصدق بالسمعة؛ ضجيج الصادق
{
  const S = game(9), mem = E.brokerMemoryNew(), by = {}; let honestN = 0, noise = 0, bad = 0;
  S.player.gold = 1e6; const car = S.player.caravans[0]; for (const g of E.GIDS) if (!E.GD[g].live && E.sells(S.cities[car.city], g)) S.cities[car.city].stock[g] = 500;
  for (let i = 0; i < 5000; i++) {
    S.brokers = null; S.brokerSeen = null; const o = E.brokerGen(S, E.brokerMemoryNew()); a(o);
    const r = by[o.ri] || (by[o.ri] = { n: 0, h: 0 }); r.n++; if (o.t.honest) { r.h++; honestN++; if (o.t.noise || o.t.wOk === false || o.ri === 2) noise++; }
    else { bad++; a(o.t.noInsp || o.t.qd < 1, 'غاشّ بلا قرينة'); a(o.q * (o.p - o.m * o.t.qd) <= 0.42 * o.p * o.q, 'خسارة صفقة واحدة ≤ 40٪ من حجمها (والتقريب لخانتين ≤ 42٪) (FR-005)'); a(o.t.qd < 1 && (o.t.qd <= o.p / o.m * 0.80 + 0.03 || o.t.noInsp), 'جودة الغاشّ u×v'); }
    a(o.q >= B.minQ && o.p < o.m, 'سعر وكمية'); const amt = o.p * o.q * (o.cur === 'sar' ? 1 : S.fx.usd); a(amt <= Math.min(B.share * E.liquid(S), B.cap[E.rgTier(S)]) + o.p * 2, 'الحجم ≤ الحدّ');
  }
  a(by[0].h / by[0].n >= 0.85, 'معروف بالصدق ≥ 85٪: ' + (by[0].h / by[0].n)); a(by[4].h / by[4].n <= 0.25, 'سيئ السمعة ≤ 25٪: ' + (by[4].h / by[4].n)); a(noise / honestN >= 0.20, 'ضجيج الصادق ≥ 20٪: ' + (noise / honestN)); a(bad > 500, 'غاشّون كفاية');
}
// FR-002: القبول والأفعال لا تسحب شيئاً؛ والإعادة بالبذرة نفسها تعطي العروض نفسها
{
  const run = () => { E.brokerMemorySet(null); const S = game(5); const seq = []; for (let d = 0; d < 200; d++) { step(S, 1); if (S.brokers && S.brokers.offer && !S.brokers.offer._n) { S.brokers.offer._n = 1; seq.push(sig(S.brokers.offer) + ':' + JSON.stringify(S.brokers.offer.t) + ':' + S.brokers.offer.p + ':' + S.brokers.offer.q); } } return seq; };
  const s1 = run(), s2 = run(); a(s1.length >= 3, 'عروض في 200 يوم: ' + s1.length); a.deepEqual(s1, s2, 'الإعادة بالبذرة نفسها');
  const S = game(6); step(S, 1); let o = null; for (let d = 0; d < 80 && !o; d++) { step(S, 1); o = S.brokers && S.brokers.offer; } a(o, 'عرض');
  const G0 = JSON.stringify(S.brokerGen), rv0 = JSON.stringify(S.rivalGen), seed0 = S.seed; S.player.gold = 1e6; const car = S.player.caravans[0]; car.cargo = {}; car.basis = {};
  A.brokerInspect(S); A.brokerAsk(S); A.brokerWarranty(S); A.brokerAccept(S); a.equal(JSON.stringify(S.brokerGen), G0, 'الأفعال لا تغيّر S.brokerGen'); a.equal(JSON.stringify(S.rivalGen), rv0, 'ولا مجرى المنافسين'); a.equal(S.seed, seed0);
}
E.brokerMemorySet(null);
// الحدود: المستوى والسيولة وعرض واحد ووقوف القافلة والحدث التعليمي المفتوح والفاصل
{
  let S = game(8); S.learn.level = 5; step(S, 120); a(!S.brokers || !S.brokers.offer, 'لا عرض قبل المستوى 6');
  S = game(8, { gold: 300 }); step(S, 120); a(!S.brokers || !S.brokers.offer, 'لا عرض بسيولة دون 600');
  S = game(8); let n = 0, last = -999, gaps = []; for (let d = 0; d < 240; d++) { step(S, 1); const o = S.brokers && S.brokers.offer; if (o && !o._c) { o._c = 1; n++; if (last > 0) gaps.push(S.day - last); last = S.day; a(S.brokers.offer === o); } if (o && o.until < S.day) a.fail('عرض باقٍ بعد انقضائه'); } a(n >= 3, 'عروض: ' + n); for (const g of gaps) a(g >= 20 && g <= 60, 'الفاصل ' + g);
  S = game(8); S.learn.eq = [{ id: 'mj', day: 0 }]; for (let d = 0; d < 80; d++) { E.tick(S, false); S.pause = false; a(!S.brokers || !S.brokers.offer, 'لا عرض مع حدث تعليمي مفتوح'); }
}
// الأفعال والمهلة والردّ والصافي بالمعادلة
function natural() { const S = game(11); for (let d = 0; d < 120; d++) { E.tick(S, false); if (S.brokers && S.brokers.offer) { a.equal(S.pause, false, 'بلا إيقاف'); a.equal(S.learn.eq.length, 0, 'لا نافذة'); a(S.intrN.brokerGen >= 1, 'عدّاد brokerGen'); a(S.news.some(n => /سمسار في سوق/.test(n.t))); return true; } S.pause = false; S.learn.eq = []; } return false; }
function offerWith(seed, pred, tries) { // يولّد مباشرةً (سريع) ثم يضع العرض كما تضعه الدورة
  E.brokerMemorySet(null);
  for (let s = seed; s < seed + (tries || 60); s++) {
    const S = game(s); S.player.gold = 20000; S.player.caravans[0].carts = 50; S.day = 40; const car = S.player.caravans[0], c = S.cities[car.city];
    for (const g of E.GIDS) if (!E.GD[g].live && E.sells(c, g)) c.stock[g] = Math.max(c.stock[g] || 0, 300);
    for (let k = 0; k < 400; k++) { const o = E.brokerGen(S, E.brokerMemoryNew()); if (o && pred(o)) { S.brokers.offer = o; S.brokers.offer.until = S.day + 8; S.brokerGen.next = S.day + 25; S.learn.ex = S.learn.ex || { broker: -99, friend: -99, luck: -99 }; return S; } }
  }
  return null;
}
{
  // صادق بلا مهلة: حاضرة
  a(natural(), 'عرض طبيعي بلا نافذة'); const S = offerWith(100, o => o.t.honest && o.type === 'good' && !o.t.noise && o.t.wOk && !o.t.noInsp), o = S.brokers.offer, car = S.player.caravans[0], P = S.player;
  car.cargo = {}; car.basis = {}; S.ctxCur = o.cur; const g0 = P.gold; S.ctxCur = 'sar';
  const r1 = A.brokerInspect(S); a(r1.ok, r1.msg); a(A.brokerInspect(S).ok === false, 'المعاينة مرة واحدة'); a(/كما وُصفت/.test(r1.msg));
  a(A.brokerAsk(S).ok, 'سؤال'); a(A.brokerAsk(S).ok === false);
  const w = A.brokerWarranty(S); a(w.ok && /كتب لك/.test(w.msg), w.msg);
  S.ctxCur = o.cur; const before = P.gold; S.ctxCur = 'sar'; const cost = Math.round(o.p * o.q * 100) / 100; const ac = A.brokerAccept(S); a(ac.ok, ac.msg);
  S.ctxCur = o.cur; const after = P.gold; S.ctxCur = 'sar'; a(Math.abs(before - after - cost) < 0.02, 'المدفوع: ' + (before - after) + ' ≠ ' + cost);
  a.equal(Math.round(car.cargo[o.g]), o.q); a.equal(car.basis[o.g].q, o.q); a(S.brokers.ret && !S.brokers.ret.bad, 'مهلة ردّ مفتوحة'); a.equal(S.brokers.offer, null);
  step(S, 1); a.equal(S.learn.rq.includes('brkOk'), false, 'لا تعليق قبل الحلّ'); const q0 = S.learn.rq.slice();
  step(S, 2); a(S.learn.rq.includes('brkOk'), 'brkOk بعد يومين'); a.equal(S.brokers.ret, null, 'تسقط المهلة للصادق'); a(/صافيك نحو/.test(S.learn.rp.brkOk)); a.equal(S.learn.evDone.broker, 1);
  const e = S.brokers.ledger[o.name]; a.equal(e.acc, 1); a.equal(e.rev, 1); a.equal(e.hon, 1); a(S.brokers.log.some(x => x.st === 'acc' && x.honest === true));
  const rr = Math.round(o.q * (o.m - o.p)); a(Math.abs(e.net - rr * (o.cur === 'sar' ? 1 : S.fx.usd)) < 2 + o.q, 'الصافي بالمعادلة');
}
{
  // غاشّ بمهلة: ردّ البضاعة
  const S = offerWith(300, o => !o.t.honest && o.type !== 'refer' && !o.t.noInsp && o.t.wOk && o.style !== 'others'), o = S.brokers.offer, car = S.player.caravans[0], P = S.player; car.cargo = {}; car.basis = {};
  a(A.brokerWarranty(S).ok); const i = A.brokerInspect(S); a(/جودتها نحو/.test(i.msg) || o.type === 'unseen', i.msg);
  S.ctxCur = o.cur; const b0 = P.gold; S.ctxCur = 'sar'; a(A.brokerAccept(S).ok); step(S, 3);
  a(S.brokers.ret && S.brokers.ret.bad, 'المهلة بعد انكشاف الغش'); a(S.news.some(n => /جودتها نحو/.test(n.t) && n.k === 'bad')); a.equal(S.learn.rq.includes('brkLost'), false, 'لا حكم قبل الردّ/انقضاء المهلة');
  a(A.brokerReturn(S).ok, 'ردّ'); S.ctxCur = o.cur; const b1 = P.gold; S.ctxCur = 'sar';
  a(S.learn.rq.includes('brkRet')); const p = S.learn.rp.brkRet; a(p.includes(E.BR_SH.SH04) && p.includes(E.BR_HADITH), 'تعليق الغش بالحديث المعتمد'); a.equal(S.brokers.ret, null); a.equal(car.cargo[o.g] || 0, 0);
  a.equal(A.brokerReturn(S).ok, false);
}
{
  // غاشّ «يستشهد بآخرين» بلا مهلة: خسارة بعبارة النجش
  const S = offerWith(500, o => !o.t.honest && o.style === 'others' && o.type !== 'refer'), o = S.brokers.offer; S.player.caravans[0].cargo = {}; S.player.caravans[0].basis = {};
  A.brokerWarranty(S); a(A.brokerAccept(S).ok); S.brokers.ret = null; step(S, 3); a(S.learn.rq.includes('brkLost')); const p = S.learn.rp.brkLost; a(p.includes(E.BR_SH.SH03) && p.includes(E.BR_SH.SH04), 'النجش والحديث'); a(/نحو [\d,]+ /.test(p));
  const e = S.brokers.ledger[o.name]; a(e.net < 0 && e.rev === 1 && e.hon === 0, 'خسارة في السجل');
}
{
  // الرفض: غاشّ → brkDodged (مع الحديث)، وصادق → brkMissed (بلا حديث)
  const S1 = offerWith(700, o => !o.t.honest), S2 = offerWith(900, o => o.t.honest);
  A.brokerDecline(S1); a.equal(S1.brokers.offer, null); step(S1, 1); a.equal(S1.learn.rq.includes('brkDodged'), false); step(S1, 2); a(S1.learn.rq.includes('brkDodged')); a(S1.learn.rp.brkDodged.includes(E.BR_SH.SH04)); a.equal(S1.learn.ev.brokerNo, 1);
  A.brokerDecline(S2); step(S2, 3); a(S2.learn.rq.includes('brkMissed')); a(!S2.learn.rp.brkMissed.includes(E.BR_SH.SH04));
}
{
  // الدلالة: أجرة بنصها المعتمد في العرض؛ لا مهلة؛ والأجرة في الدفع والصافي
  const S = offerWith(1100, o => o.type === 'refer' && o.t.honest), o = S.brokers.offer, v = E.brokerView(S).offer; a(v.lines.some(l => l.includes(E.BR_SH.SH01)), 'نص SH-01 في البطاقة'); a(v.feeAmt > 0 && v.total === v.cost + v.feeAmt);
  a.equal(A.brokerWarranty(S).ok, false); a(E.BROKER.fee.includes(o.fee)); S.player.caravans[0].cargo = {}; S.player.caravans[0].basis = {}; a(A.brokerAccept(S).ok); a.equal(S.brokers.ret, null);
}
{
  // رفض المعاينة قرينة بلا رسم؛ والعرض ينصرف بعد مدته؛ والقبول بلا مكان أو رصيد يُرفض
  const S = offerWith(1300, o => o.t.noInsp), P = S.player, g0 = P.gold; a(A.brokerInspect(S).ok); a.equal(P.gold, g0, 'لا رسم عند الرفض'); a(S.brokers.offer.seen.insp.refused);
  const S2 = offerWith(1500, () => true), o2 = S2.brokers.offer; S2.player.gold = 1; a.equal(A.brokerAccept(S2).ok, false); S2.player.gold = 1e6; const car = S2.player.caravans[0]; car.cargo = { wheat: 1e9 }; a.equal(A.brokerAccept(S2).ok, false, 'لا مكان'); car.cargo = {};
  const until = o2.until; step(S2, until - S2.day + 1); a(!S2.brokers.offer || S2.brokers.offer.id !== o2.id, 'ينصرف بعد مدته'); a(S2.news.some(n => /انصرف السمسار/.test(n.t)));
  const S3 = offerWith(1700, () => true); S3.player.caravans[0].left = 3; a.equal(A.brokerAccept(S3).ok, false, 'القافلة ليست في المدينة');
}
{
  // الحفظ والتحميل يحفظان العرض والمهلة والسجل
  const S = offerWith(1900, o => !o.t.honest && o.type !== 'refer' && o.t.wOk), L0 = JSON.stringify(S.brokers); const T = E.load(E.save(S)); a.equal(JSON.stringify(T.brokers), L0); a.deepEqual(T.brokerGen, S.brokerGen);
  S.player.caravans[0].cargo = {}; S.player.caravans[0].basis = {}; A.brokerWarranty(S); A.brokerAccept(S); step(S, 3); const T2 = E.load(E.save(S)); a(T2.brokers.ret && T2.brokers.ret.bad); a(A.brokerKeep(T2).ok, 'الإبقاء بعد التحميل'); step(T2, 0); a(T2.learn.rq.includes('brkLost'));
}
// SC-005: المطفأ = البصمة القديمة حرفاً بلا حقول
{
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/broker-baseline.json'), 'utf8')), now = require('../tools/broker-fingerprint.js')();
  for (const s of Object.keys(base)) { a.equal(now[s].hash, base[s].hash, 'بصمة المطفأ بذرة ' + s); a.deepEqual(now[s].keys, base[s].keys); a(!now[s].keys.some(k => /^broker/.test(k)), 'لا حقل broker'); a(now[s].brokerDays.length >= 3, 'السمسار القديم يظهر'); }
  B.on = true;
}
// T002: إعادة هيكلة rgRng/rgPick بلا أثر: بصمة ولادات المنافسين (3 بذور × 400 يوم) = بصمة المحرك السابق
{
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/rg-baseline.json'), 'utf8')), now = require('../tools/rg-fingerprint.js')(E);
  for (const s of Object.keys(base)) { a.equal(now[s].hash, base[s].hash, 'ولادات المنافسين بذرة ' + s); a.equal(now[s].births, base[s].births); a(base[s].births >= 30); }
}
console.log('broker: OK');
