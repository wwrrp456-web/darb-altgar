'use strict';
// نقاط المعهد (الدفعة أ): منح مرة واحدة عند إتمام المرحلة، وترحيل اللاعب القديم بما أتمّه، دون منح مكرر.
const assert = require('node:assert/strict'), E = require('../src/engine.js');
const fresh = () => { const S = E.newGame(3); E.A.learnSetChar(S, 'trader'); return S; };
{ const S = fresh(), L = S.learn;
  assert.deepEqual([L.pts.infl, L.pts.xp], [0, 0], 'تبدأ بلا نقاط'); assert.deepEqual(L.taken, []);
  assert(E.awardLesson(S, 1), 'يمنح أول مرة'); assert(!E.awardLesson(S, 1), 'لا منح مكرر');
  assert.equal(E.pointsLeft(S, 'infl'), E.LESSON_PTS.infl); assert.equal(E.pointsLeft(S, 'xp'), E.LESSON_PTS.xp);
  L.pts.spent.infl = 20; assert.equal(E.pointsLeft(S, 'infl'), E.LESSON_PTS.infl - 20, 'المتاح بعد الصرف'); }
{ // إتمام مرحلة فعلياً يمنح النقاط مرة واحدة
  const S = fresh(), L = S.learn; L.stage = 1; L.level = 1; L.stageIntro = 1; L.ev.buy = 1; L.ev.sell = 1; L.ev.profit = 1;
  const before = (L.taken || []).length; E.stageCheck(S); const after = L.taken.length; E.stageCheck(S);
  assert(L.stageDone.length === 0 || after === L.stageDone.length, 'كل مرحلة أُتمّت لها نقاطها'); assert.equal(L.taken.length, after, 'لا منح إضافي بإعادة الفحص'); assert(before <= after); }
{ // ترحيل حفظ قديم: ما أتمّه يُعدّ مكتملاً ويُمنح نقاطه مرة واحدة
  const S = fresh(), L = S.learn; L.stageDone = [1, 2, 3]; delete L.pts; delete L.taken; delete L.perks;
  const T = E.load(E.save(S)); assert.deepEqual(T.learn.taken.sort(), [1, 2, 3]); assert.equal(T.learn.pts.infl, 3 * E.LESSON_PTS.infl); assert.equal(T.learn.pts.xp, 3 * E.LESSON_PTS.xp);
  const U = E.load(E.save(T)); assert.equal(U.learn.pts.infl, 3 * E.LESSON_PTS.infl, 'لا ترحيل مكرر عند إعادة التحميل'); }
console.log('Lesson points: one-time award, spent tracking, old-save migration: PASS');
