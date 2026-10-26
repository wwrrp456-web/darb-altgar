'use strict';
// نقاط المعهد: الأساسية (المراحل) للخبرة، والجانبية تُشتق من الحالة للنفوذ؛ لا منح مكرر ولا ترحيل يدوي.
const assert = require('node:assert/strict'), E = require('../src/engine.js'), V = E.lessonValues(), P = V;
const fresh = () => { const S = E.newGame(3); E.A.learnSetChar(S, 'trader'); const L = S.learn; L.secrets = []; L.csec = []; L.cards = []; L.tab = []; L.mj = { seen: {}, baraka: 0 }; for (const id in S.bosses) S.bosses[id].lore = 0; return S; };
{ const S = fresh(), L = S.learn;
  assert.deepEqual([E.pointsLeft(S, 'infl'), E.pointsLeft(S, 'xp')], [0, 0], 'تبدأ بلا نقاط'); assert.deepEqual(L.taken, []);
  assert(E.awardLesson(S, 1), 'يسجّل الأساسي أول مرة'); assert(!E.awardLesson(S, 1), 'لا تكرار');
  assert.equal(E.pointsLeft(S, 'xp'), Math.round(P.core.xp), 'الأساسي: خبرة'); assert.equal(E.pointsLeft(S, 'infl'), Math.round(P.core.infl));
  assert(P.core.xp > P.core.infl && P.side.infl > P.side.xp, 'الأساسية للخبرة والجانبية للنفوذ');
  L.cards = ['a']; L.mj.seen = { x: { ok: true } }; L.secrets = ['sa']; L.csec = ['riyadh']; L.tab = ['law1']; S.bosses.riyadh.lore = 2;
  assert.equal(E.sideCount(S), 7, 'الجانبي من الحالة: بطاقة، حكم، سرّان، لوح، فصلان');
  assert.equal(E.pointsLeft(S, 'infl'), Math.round(P.core.infl + 7 * P.side.infl), 'النفوذ من الجانبي'); assert.equal(E.pointsLeft(S, 'xp'), Math.round(P.core.xp + 7 * P.side.xp));
  L.pts.spent.infl = 20; assert.equal(E.pointsLeft(S, 'infl'), Math.round(P.core.infl + 7 * P.side.infl) - 20, 'المتاح بعد الصرف'); }
{ // القسمة: مجموع ما يمكن كسبه من كل الدروس = الحصة الثابتة مهما كثرت الدروس
  const v = E.lessonValues(); assert(Math.abs(v.core.xp * v.coreCount - E.POOL.core.xp) < 1e-6); assert(Math.abs(v.side.infl * v.sideCount - E.POOL.side.infl) < 1e-6, 'حصة النفوذ الجانبية ثابتة'); assert(E.sideTotal() >= 100, 'الجانبية كثيرة'); }
{ // إتمام مرحلة فعلياً يسجّل الدرس مرة واحدة
  const S = fresh(), L = S.learn; L.stage = 1; L.level = 1; L.stageIntro = 1; L.ev.buy = 1; L.ev.sell = 1; L.ev.profit = 1;
  E.stageCheck(S); const n = L.taken.length; E.stageCheck(S); assert.equal(L.taken.length, n, 'لا منح إضافي بإعادة الفحص'); assert.equal(n, L.stageDone.length); }
{ // ترحيل حفظ قديم: ما أتمّه يُعدّ مكتملاً، ونسخ سابقة بمجاميع مخزّنة تُحسب من جديد دون المساس بما صُرف
  const S = fresh(), L = S.learn; L.stageDone = [1, 2, 3]; delete L.pts; delete L.taken;
  const T = E.load(E.save(S)); assert.deepEqual(T.learn.taken.sort(), [1, 2, 3]); assert.equal(E.pointsLeft(T, 'xp'), Math.round(3 * P.core.xp));
  const U = E.load(E.save(T)); assert.equal(E.pointsLeft(U, 'xp'), Math.round(3 * P.core.xp), 'لا ترحيل مكرر');
  const V = fresh(); V.learn.taken = [1, 2]; V.learn.pts = { infl: 100, xp: 100, spent: { infl: 30, xp: 0 } };
  const W = E.load(E.save(V)); assert.equal(E.pointsLeft(W, 'xp'), Math.round(2 * P.core.xp)); assert.equal(W.learn.pts.spent.infl, 30, 'ما صُرف يبقى'); assert(W.learn.pts.infl === undefined, 'لا مجموع مخزّن'); }
console.log('Lesson points: core lessons give experience, side lessons derive influence from state, one-time, migration: PASS');
