// منطق التعليم في المحرك: node test/learnengine.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(11);
ok(S.learn && S.learn.char === null && S.learn.level === 1, 'لعبة جديدة بلا شخصية ومستوى ١');
ok(A.learnSetChar(S, 'negotiator').ok && S.learn.perks.customs === 0.9 && S.learn.perks.pact === 0.8 * 0.95, 'ميزات المفاوض + سرّ السعودية');
ok(S.learn.sq.includes('sa'), 'سرّ السعودية في الطابور');
ok(!A.learnSetChar(S, 'x').ok, 'شخصية مجهولة مرفوضة');
// مستوى ١ و٢
const c = S.cities.riyadh, g = E.GIDS.find(x => x !== 'wheat' && E.sells(c, x)); c.stock[g] = 1e4;
const g0 = S.player.gold; A.buy(S, 1, g, 4); A.sell(S, 1, g, 4);
ok(S.learn.ev.buy === 1 && S.learn.ev.sell === 1, 'تسجيل أحداث الشراء والبيع');
// رفع الميزة يؤثر
const T = E.newGame(11); A.learnSetChar(T, 'trader'); const U = E.newGame(11);
const st = (X) => { const car = X.player.caravans[0], d = E.tripDays(X, car, 'riyadh', 'jeddah'); return E.supplyNeed(car, d); };
ok(st(T) === st(U), 'حاجة المؤن واحدة، والتخفيض في التكلفة');
const L = E.newGame(11); A.learnSetChar(L, 'leader'); const car = L.player.caravans[0];
ok(E.tripDays(L, car, 'riyadh', 'hail') <= E.tripDays(U, U.player.caravans[0], 'riyadh', 'hail'), 'قائد القوافل أسرع');
// ترحيل حفظ قديم
const old = JSON.parse(JSON.stringify(U)); delete old.learn; old.phase = 3;
const m = E.load(JSON.stringify(old));
ok(m.learn.char === 'trader' && m.learn.level >= 7 && m.learn.up.length === 0, 'ترحيل: تاجر ومستوى حسب الطور بلا نوافذ');
// المستويات العشرة سليمة التركيب
const LS = E.LS; ok(LS.LEVELS.length === 10 && LS.CHARS.length === 5 && Object.keys(LS.SECRETS).length === 5, '١٠ مستويات و٥ شخصيات و٥ أسرار');
ok(LS.LEVELS.every(l => l.lesson.length >= 3 && l.goals(S).length >= 1), 'كل مستوى له درس وأهداف');
// فتح مستويات كاملة بمحاكاة
const F = E.newGame(3); A.learnSetChar(F, 'trader'); F.learn.ev = { buy: 1, buyCheap: 1, sell: 1, profit15: 1, profit: 3, profitCross: 1, mixed: 1, exchange: 1, buildShop: 1, toStore: 1, signPact: 1, agentBuy: 1, borrow: 1, repay: 1, crossed: 1 };
F.player.led.inc.realized = 500; F.player.led.exp.provisions = 10; F.player.trips = 3; F.learn.goods = ['dates', 'wool', 'iron']; F.learn.secrets = ['sa', 'eg'];
E.learnCheck(F); ok(F.learn.level === 11 && F.learn.up.length === 10, 'إكمال كل المستويات يصل إلى ١١');
ok(Object.keys(LS.STORY).length === 10 && LS.LEVELS.every(l => LS.STORY[l.n].x.length > 80), 'عشرة فصول من حكاية الجدّ');
ok(Object.values(LS.REACT).every(r => LS.MOODS[r.m]) && Object.keys(LS.REACT).length >= 20, 'التعليقات كثيرة ولكل منها مزاج صحيح');
{ const Q = E.newGame(4); A.learnSetChar(Q, 'trader'); Q.learn.rq = []; Q.player.caravans[0].cargo = {}; Q.player.gold = 10; E.learnCheck(Q); ok(Q.learn.rq.includes('broke'), 'تعليق قلّة الرصيد'); Q.day += 5; Q.learn.rq = []; E.learnCheck(Q); ok(Q.learn.rq.length === 0, 'لا يكرره قبل انقضاء المهلة'); Q.day += 25; E.learnCheck(Q); ok(Q.learn.rq.includes('broke'), 'يكرره بعد المهلة'); }
{ // المستوى ١ يكتمل بأي شراء وبيع (لا حلقة تكرار حين لا توجد سلعة رخيصة)
  const Y = E.newGame(8); A.learnSetChar(Y, 'trader'); Y.learn.up = [];
  const c = Y.cities.riyadh, g = E.GIDS.find(x => x !== 'wheat' && E.sells(c, x)); c.stock[g] = 1e4; c.price = c.price || {};
  Y.player.caravans[0].cargo = {}; const r1 = A.buy(Y, 1, g, 3); ok(r1.ok, 'شراء عادي بلا شرط الرخص');
  ok(Y.learn.level === 1, 'بعد الشراء وحده يبقى المستوى ١ (الهدف الثاني: البيع)');
  A.sell(Y, 1, g, 3); ok(Y.learn.level === 2 && Y.learn.up[0] === 1, 'بعد الشراء والبيع يكتمل المستوى ١ دون تكرار');
}
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
