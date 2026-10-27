// تنبيهات عمّ سالم واقعية: مرة عند حدوث المشكلة، لا تتكرر، وتزول بزوالها: node test/react-episodes.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { level: 11, stage: 23, stageIntro: 22, free: true, datePend: false }); S.learn.rq = []; S.learn.rseen = {};
const L = S.learn, P = S.player, count = k => L.rq.filter(x => x === k).length;
E.learnCheck(S); L.rq = []; L.ract = {}; // تفريغ مكافآت الألواح والمسائل قبل ضبط الرصيد
// الإفلاس: gold < 60 وبلا بضاعة
P.gold = 10; P.wallet.sar = 10; for (const c of P.caravans) c.cargo = {};
E.learnCheck(S); ok(count('broke') === 1 && L.ract.broke === 1, 'عند الإفلاس يُنطق التنبيه مرة واحدة');
L.rq = []; // عرضه اللاعب
for (let d = 0; d < 60; d++) { S.day++; E.learnCheck(S); }
ok(count('broke') === 0, 'لا يتكرر خلال 60 يوماً ما دامت المشكلة قائمة');
// خروج من الإفلاس: التنبيه المعلّق في الطابور يُسحب
L.rq = ['broke']; P.gold = 5000; P.wallet.sar = 5000; E.learnCheck(S);
ok(count('broke') === 0 && !L.ract.broke, 'بعد زوال الإفلاس يُسحب التنبيه المعلّق ويُصفَّر');
// عودة المشكلة: تنبيه جديد
P.gold = 5; P.wallet.sar = 5; E.learnCheck(S); ok(count('broke') === 1, 'إفلاس جديد: تنبيه جديد');
// مشكلة غير قائمة لا تُنبَّه أصلاً
const T = E.newGame(6); A.learnSetChar(T, 'trader'); T.learn.rq = []; E.learnReact(T, 'broke', 20); ok(T.learn.rq.length === 0, 'لا إفلاس فلا تنبيه حتى لو طُلب');
// نصيحة الدَّين: مرة واحدة ما دام الدَّين قائماً
const U = E.newGame(7); A.learnSetChar(U, 'trader'); U.learn.rq = []; U.player.bank.loans.push({ amt: 500, late: 0, left: 5 });
E.learnReact(U, 'tipDebt', 30); E.learnReact(U, 'tipDebt', 30); ok(U.learn.rq.filter(x => x === 'tipDebt').length === 1, 'نصيحة الدَّين لا تُكرَّر');
U.player.bank.loans.length = 0; E.reactEpisodes(U); ok(!U.learn.rq.includes('tipDebt'), 'سُدّد الدَّين: تُسحب النصيحة');
// الطابور بلا تكرار
const V = E.newGame(8); A.learnSetChar(V, 'trader'); V.learn.rq = []; E.learnReact(V, 'exchange'); E.learnReact(V, 'exchange', 1); V.day += 5; E.learnReact(V, 'exchange', 1);
ok(V.learn.rq.filter(x => x === 'exchange').length <= 1, 'لا يتكدس تنبيه واحد في الطابور');
console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
