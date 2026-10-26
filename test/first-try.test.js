// مكافأة الإجابة الأولى وأحداث السوق جانبية: node test/first-try.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1;
const p0 = E.pointsEarned(S);
ok(E.firstTry(S, 'q1') === true, 'أول إجابة صحيحة تُمنح');
ok(E.firstTry(S, 'q1') === false, 'لا تتكرر لنفس السؤال');
E.firstTry(S, 'q2');
const p1 = E.pointsEarned(S);
ok(p1.fta === 2 && p1.infl - p0.infl === 2 * E.FTA.infl && p1.xp - p0.xp === 2 * E.FTA.xp, 'نقطتان صغيرتان لكل إجابة: +' + (p1.infl - p0.infl) + ' نفوذ +' + (p1.xp - p0.xp) + ' خبرة');
const n0 = E.sideCount(S); S.learn.evDone = { broker: 1, 'friend:secure': 1 };
ok(E.sideCount(S) === n0 + 2, 'قرار السمسار وقرض الصديق يُحتسبان دروساً جانبية');
ok(E.sideTotal() >= 182 + E.SIDE_EVENTS.length - 1, 'المجموع الجانبي يشمل الأحداث: ' + E.sideTotal());
const T = E.newGame(6); ok(E.firstTry(T, 'x') === false, 'بلا شخصية لا مكافأة');
// القرار الفعلي يسجّل الحدث
const U = E.newGame(7); A.learnSetChar(U, 'trader'); U.noLock = 1; U.learn.eq = [{ id: 'broker', day: 1, dep: 300 }]; U.player.gold = 5000; A.eventChoice ? A.eventChoice(U, 'no') : E.eventChoice(U, 'no');
ok((U.learn.evDone || {}).broker === 1, 'رفض السمسار يُسجَّل');
console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
