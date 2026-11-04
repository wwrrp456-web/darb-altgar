'use strict';
// 032 تجربة البداية (محرك): بوابة المخاطر بعد المرحلة 4، أول خسارة 10٪، تنبيه عمّ سالم، ملخص الرحلة، اللحظة وتنظيف البطاقات، ومفاتيح الرجوع
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, F = E.FIRSTX;
const game = (seed, stage) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noShocks = true; S.player.gold = 5e5; if (stage) { S.learn.ageStages = 1; S.learn.stage = stage; S.learn.level = Math.min(stage, 11); } return S; };
const hot = S => { for (const k in S.risk) S.risk[k] = 0.95; };
const trip = (S, car, to) => { const r = A.travel(S, car.id, to, 0); a(r.ok, r.msg); let n = 0; while (car.left > 0 && n++ < 80) { E.tick(S, false); S.pause = false; } };
const bad = S => S.news.filter(n => /نهب|عاصفة/.test(n.t) && n.k === 'bad').length;
const near = S => { const car = S.player.caravans[0]; return S.order.filter(id => id !== car.city && !E.travelBlock(S, car, id)); };
// 1) قبل المرحلة 5: صفر نهب وصفر عاصفة رملية في 30 رحلة
{ const S = game(3, 3); hot(S); const car = S.player.caravans[0]; for (let i = 0; i < 30; i++) { const t = near(S)[0]; S.player.gold = 5e5; A.buy(S, car.id, 'perfume', 10); trip(S, car, t); if (S.road) { a.fail('حدث طريق قبل المرحلة 5'); } } a.equal(bad(S), 0, 'لا نهب ولا عاصفة قبل المرحلة 5'); a(!S.news.some(n => /عاصفة رملية/.test(n.t)), 'لا عاصفة رملية'); }
// 2) بعد المرحلة 5: تعود المخاطر، وأول خسارة 10٪ (وتُسجَّل مرة واحدة)
{ const S = game(3, 6); hot(S); const car = S.player.caravans[0]; let got = null; for (let i = 0; i < 40 && !got; i++) { const t = near(S)[0]; S.player.gold = 5e5; A.buy(S, car.id, 'perfume', 10); trip(S, car, t); if (S.road) { A.roadChoose(S, 'fight'); got = S.news.find(n => /نهب/.test(n.t)); } else got = S.news.find(n => /نهب/.test(n.t)); }
  a(S.learn.fx && S.learn.fx.loss != null, 'سُجّلت أول خسارة'); }
{ const S = game(3, 6); const car = S.player.caravans[0]; a.equal(E.ftxFirstLoss(S, car, 0.33), 0.10, 'أول خسارة 10٪'); a.equal(E.ftxFirstLoss(S, car, 0.33), 0.33, 'الثانية كالمعتاد'); }
// 3) مفتاح الرجوع: مطفأ ⇒ البوابة مفتوحة دائماً والخسارة كما هي
{ F.road = false; try { const S = game(3, 1); a.equal(E.ftxRoadOpen(S), true); a.equal(E.ftxFirstLoss(S, S.player.caravans[0], 0.33), 0.33); a.equal(E.ftxRoadWarn(S, S.player.caravans[0], 'jeddah'), null); } finally { F.road = true; } }
// 4) تنبيه عمّ سالم: طريق خطر ⇒ تنبيه؛ قبل المرحلة 5 لا تنبيه
{ const S = game(4, 6); hot(S); const car = S.player.caravans[0]; car.guards = 0; car.crew = 0; const t = near(S)[0], w = E.ftxRoadWarn(S, car, t); a(w && /قرار|القرار/.test(w.text), 'تنبيه الطريق الخطر'); const S2 = game(4, 2); hot(S2); a.equal(E.ftxRoadWarn(S2, S2.player.caravans[0], t), null, 'لا تنبيه قبل المرحلة 5'); }
// 5) ملخص الرحلة: المتوقع يطابق تقدير اللعبة قبل السفر، والأجزاء من دفتر المصروفات بالريال، والفعلي من الصفقات
{ const S = game(5, 6); S.noEvents = true; const car = S.player.caravans[0]; A.buy(S, car.id, 'perfume', 20); const o = E.sellOptions(S, car.city, 'perfume', 20, E.avgCost(car.basis, 'perfume'), car).find(x => !E.travelBlock(S, car, x.city) && x.profit > 0);
  const w0 = S.player.led.exp.wages || 0; trip(S, car, o.city); const v = E.ftxTripView(S); a(v, 'ملخص'); a.equal(v.exp, Math.round(o.profit), 'المتوقع = تقدير اللعبة'); const wg = v.parts.find(p => p.k === 'wages'); a(wg && Math.abs(wg.amt - ((S.player.led.exp.wages || 0) - w0)) <= 1, 'الأجور بالريال'); a.equal(v.sold, false);
  const r = A.sell(S, car.id, 'perfume', 999); a(r.ok); const v2 = E.ftxTripView(S); a.equal(v2.sold, true); a(Math.abs(v2.actual - Math.round(r.pl)) <= 1, 'الفعلي من الصفقة'); }
{ F.summary = false; try { const S = game(5, 6); const car = S.player.caravans[0]; A.buy(S, car.id, 'perfume', 5); trip(S, car, near(S)[0]); a.equal(E.ftxTripView(S), null); a.equal(car.plan, undefined); } finally { F.summary = true; } }
// 6) اللحظة: التحية المتقادمة تُحذف، وذات الدرس تبقى موسومة، وبطاقة الوصول تُعرَّف
{ const S = game(6, 6); const L = S.learn; L.bq = [{ c: 'cairo', n: 1 }, { c: 'cairo', n: 2 }, { c: S.player.caravans[0].city, n: 1 }]; S.day += 0; E.tick(S, false); S.day += 5; E.tick(S, false);
  a(!L.bq.some(b => b.c === 'cairo' && b.n === 1), 'التحية المتقادمة حُذفت'); a(L.bq.find(b => b.c === 'cairo' && b.n === 2).stale === true, 'بطاقة الدرس موسومة'); a(L.bq.some(b => b.c === S.player.caravans[0].city), 'بطاقة المدينة الحالية باقية');
  E.ftxMomentBoss(S, 'x'); L.fx.moment = { c: S.player.caravans[0].city, day: S.day }; a(E.ftxMomentBoss(S, S.player.caravans[0].city), 'بطاقة اللحظة'); a.equal(E.ftxMomentBoss(S, 'cairo'), null); }
{ F.moment = false; try { const S = game(6, 6); S.learn.bq = [{ c: 'cairo', n: 1 }]; S.day += 9; E.tick(S, false); a.equal(S.learn.bq.length, 1, 'مطفأ: لا تنظيف'); a.equal(E.ftxMomentBoss(S, 'cairo'), null); } finally { F.moment = true; } }
// 7) الحفظ القديم (بلا حقول) يعمل، والحفظ يحمل الحقول
{ const S = game(7, 6); const car = S.player.caravans[0]; A.buy(S, car.id, 'perfume', 5); trip(S, car, near(S)[0]); const L = E.load(E.save(S)); a(L.tripSum, 'الحفظ يحمل الملخص'); const old = JSON.parse(E.save(S)); delete old.tripSum; delete old.learn.fx; const O = E.load(JSON.stringify(old)); a(O); E.tick(O, false); }
console.log('PASS firstx: gate (stage<5 no loss), first loss 10%, Salem warn, trip summary, moment/stale cards, switches off, save compat');
