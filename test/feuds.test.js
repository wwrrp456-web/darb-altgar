'use strict';
// 036و: الخصومات العادية: الأثر في السعر والرف (المرجعي والفعلي معاً)، الحدود، النهاية بعد المدة، المطفأ = قبل، حفظ قديم
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, { load, run } = require('./lib/skill-sim'), ok = m => console.log('OK   ' + m);
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 3; S.learn.level = 11; S.learn.stage = 23; return S; };
const mkFeud = (S, a, b, d = 40) => { S.feuds = [{ a, b, s: S.day, e: S.day + d }]; E.feudApply(S); return S.feuds[0]; };
const A0 = 'riyadh', B0 = 'cairo'; // مصنِّع غير خام في الرياض وسوق لا يصنعه
// 0) النصوص
assert.equal(E.FEUD_TXT.born('أ', 'ب', 'س', 'ص', 40), 'اختلف أ وب، فتشحّ سلع س في سوق ص نحو 40 يوماً.'); ok('نص الخصومة العادية مطابق لـ texts.md');
// 1) السعر والرف قبل وبعد
{ const S = mk(), g = E.fdGoods(S, A0, B0)[0], cb = S.cities[B0]; assert.ok(g, 'سلعة متضررة'); const p0 = E.unitPrice(cb, g), r0 = E.refPrice(cb, g), pj = JSON.stringify(S.player);
  mkFeud(S, A0, B0); assert.equal(JSON.stringify(S.player), pj, 'لا يمس اللاعب'); const p1 = E.unitPrice(cb, g), r1 = E.refPrice(cb, g);
  assert.ok(cb.fpm[g] >= E.PREM[B0][g] && cb.fpl[g] === E.GRIEF.pull, 'fpm وfpl'); assert.ok(p1 >= p0 && r1 >= r0 && (p1 > p0 || cb.fpm[g] === E.PREM[B0][g]), 'الفعلي والمرجعي معاً'); assert.ok(Math.abs(p1 / p0 - r1 / r0) < 1e-9, 'الفعلي والمرجعي بالنسبة نفسها');
  const ca = S.cities[A0]; assert.equal(ca.fpm, undefined, 'المنتِج لا يتأثر'); const S2 = E.load(E.save(S)); S2.feuds = []; E.feudApply(S2); assert.equal(S2.cities[B0].fpm, undefined, 'بعد الإزالة لا حقل');
  // الرف: يبدأ فارغاً ويمتلئ أبطأ
  const T = E.load(E.save(S)); T.feuds = []; E.feudApply(T); for (const W of [S, T]) { W.cities[B0].stock[g] = 0; W.cities[B0].extra = {}; } for (let i = 0; i < 10; i++) { for (const W of [S, T]) { E.tick(W, false); W.pause = false; } }
  assert.ok(S.cities[B0].stock[g] < T.cities[B0].stock[g], 'الرف يمتلئ أبطأ مع الخصومة: ' + S.cities[B0].stock[g].toFixed(1) + ' < ' + T.cities[B0].stock[g].toFixed(1)); ok('السعر المرجعي والفعلي والرف قبل/بعد، ولا مساس باللاعب'); }
// 2) النهاية بعد المدة
{ const S = mk(), g = E.fdGoods(S, A0, B0)[0], cb = S.cities[B0]; mkFeud(S, A0, B0, 3); for (let i = 0; i < 3; i++) { E.tick(S, false); S.pause = false; }
  assert.ok(!S.feuds.some(f => f.a === A0 && f.b === B0 && f.e === 3), 'انتهت'); assert.ok(S.news.some(n => /انتهت الخصومة بين/.test(n.t)), 'خبر النهاية'); assert.equal(cb.fpm && cb.fpm[g], undefined, 'عاد السعر'); ok('تنتهي بعد المدة وتعود السلع'); }
// 3) الحدود على 4 بذور × 3 سنوات
{ let tot = 0; for (const seed of [1, 2, 3, 4]) { const S = mk(seed); const seen = new Set(); for (let d = 0; d < 1080; d++) { E.tick(S, false); S.pause = false; const l = S.feuds || [];
      assert.ok(l.filter(f => !f.big).length <= E.GRIEF.world, 'عالم ≤ 4 (الكبرى خارج السقف)'); const cnt = {}, cit = {}; for (const f of l) { new Set([S.cities[f.a].country, S.cities[f.b].country]).forEach(k => { cnt[k] = (cnt[k] || 0) + 1; }); cit[f.a] = (cit[f.a] || 0) + 1; cit[f.b] = (cit[f.b] || 0) + 1; assert.ok(!['mecca', 'medina'].includes(f.a) && !['mecca', 'medina'].includes(f.b), 'لا مكة ولا المدينة'); if (f.big) continue; assert.ok(f.e - f.s >= 30 && f.e - f.s <= 60, 'المدة 30–60'); seen.add(f.a + f.b + f.s); }
      assert.ok(Object.values(cnt).every(v => v <= 2), 'دولة ≤ 2'); assert.ok(Object.values(cit).every(v => v === 1), 'مدينة ≤ 1'); } tot += seen.size; } assert.ok(tot >= 40, 'تولد خصومات: ' + tot); ok('الحدود (دولة 2، عالم 4، مدينة 1، لا مكة ولا المدينة، المدة 30–60)، الولادة ' + tot); }
// 4) المطفأ = قبل، بلا حقول
{ const prev = E.GRIEF.on; try { E.GRIEF.on = false; const S = mk(2); run(S, 400); assert.equal(S.feuds, undefined, 'لا S.feuds'); const raw = E.save(S); assert.ok(!/"feuds"|"fpm"|"fpl"/.test(raw), 'لا حقل في الحفظ');
    const cb = S.cities[B0], g = E.fdGoods(S, A0, B0)[0]; cb.fpm = { [g]: 9 }; assert.equal(E.unitPrice(cb, g), E.unitPrice({ ...cb, fpm: undefined }, g), 'المطفأ يتجاهل fpm'); ok('GRIEF.on=false: لا S.feuds ولا fpm ولا fpl والسعر كما كان'); } finally { E.GRIEF.on = prev; } }
// 5) حفظ قديم يعمل
{ const S = load('autopilot-23'); assert.ok((S.feuds || []).every(f => f.big), 'الحفظ القديم: لا عادية، والكبرى تُضاف عند التحميل (036ز)'); run(S, 5); const S2 = load('autopilot-23'); run(S2, 400); assert.ok(Array.isArray(S2.feuds), 'الحفظ القديم يولّد خصومات'); const R = E.load(E.save(S2)); assert.deepEqual(R.feuds, S2.feuds); assert.ok(E.feudView(R).length === S2.feuds.length, 'عرض بعد التحميل'); ok('حفظ قديم بلا feuds يعمل ويُحفظ ويُحمَّل'); }
