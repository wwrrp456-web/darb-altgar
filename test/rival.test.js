// التاجر المنافس المسمّى: node test/rival.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const B = E.newGame(5); for (let i = 0; i < 120; i++) E.tick(B); ok(!B.rival, 'بلا شخصية تعلّم: لا منافس (يحمي معيار الضغط)');
const S = E.newGame(6); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.noShocks = true; S.player.gold = 800;
for (let i = 0; i < 30; i++) E.tick(S); ok(S.rival && /./.test(S.rival.name) && S.rival.gold === 3000 || S.rival.trips === 0, 'يُنشأ بذمة 3000 ولا يتحرك قبل اليوم 40');
for (let i = 0; i < 160; i++) E.tick(S); const a = S.rival;
ok(a.trips >= 8 && E.rivalNW(S) > 3000 && isFinite(E.rivalNW(S)), 'يتاجر ويربح (رحلات ' + a.trips + '، ثروة ' + E.rivalNW(S) + ')');
ok(a.hist.length >= 4, 'يسجّل منحنى ثروته');
// تفوّق اللاعب يولد خبراً
const T = E.newGame(7); A.learnSetChar(T, 'trader'); T.learn.level = 6; T.noShocks = true; T.rival = null; for (let i = 0; i < 60; i++) E.tick(T); T.player.gold = 90000; for (let i = 0; i < 3; i++) E.tick(T);
ok(T.news.some(n => /تفوّقتَ في الثروة/.test(n.t)), 'خبر التفوق على المنافس');
T.rival.gold = 400000; T.rival.ahead = -999; E.tick(T); ok(T.news.some(n => /يتقدمك بوضوح/.test(n.t)), 'تنبيه حين يتقدمك');
const L = E.load(E.save(S)); ok(L.rival && L.rival.name === S.rival.name && L.rival.gold === S.rival.gold, 'الحفظ');
// الصعوبة تغيّر القدرة
function nw(d) { const U = E.newGame(8); A.learnSetChar(U, 'trader'); U.learn.level = 6; U.noShocks = true; U.diff = d; for (let i = 0; i < 150; i++) E.tick(U); return E.rivalNW(U); }
ok(nw('hard') > 0 && nw('calm') > 0, 'يعمل في كل الصعوبات');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
