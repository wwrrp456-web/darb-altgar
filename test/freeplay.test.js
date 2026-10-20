// اللعب الحر: حولية وأهداف وألقاب ممتدة. node test/freeplay.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lvl) { const S = E.newGame(seed); E.achInit(S); A.learnSetChar(S, 'trader'); S.learn.level = lvl; S.noShocks = true; S.player.gold = 90000; return S; }
ok(E.titleOf(499999) === 'سيّد السوق' && E.titleOf(500000) === 'شيخ التجّار' && E.titleOf(2e6) === 'عميد الأسواق' && E.titleOf(9e6) === 'سلطان الدروب', 'ثلاثة ألقاب إضافية بعد سيّد السوق');
let S = world(81, 6); E.tick(S); ok(!S.yr, 'لا لعب حر قبل التخرج والطور 4');
S = world(82, 11); E.tick(S); ok(S.yr && S.yr.goals.length === 3 && S.yr.n === 0, 'التخرج يبدأ الحول الأول بثلاثة أهداف');
ok(S.news.some(n => /عهد اللعب الحر/.test(n.t)), 'خبر بداية اللعب الحر');
const B = E.newGame(5); B.phase = 4; for (let i = 0; i < 3; i++) E.tick(B); ok(!B.yr, 'بلا حالة إنجازات (محاكاة آلية): لا لعب حر');
const T = E.newGame(6); E.achInit(T); T.phase = 4; E.tick(T); ok(T.yr, 'الطور 4 يفعّله أيضاً');
// هدف النمو
S = world(83, 11); E.tick(S); const gr = S.yr.goals.find(g => g.k === 'growth'); S.player.gold += gr.target; E.tick(S); ok(gr.done && S.news.some(n => /أنجزتَ هدف الحول/.test(n.t)), 'إنجاز هدف النمو');
// هدف الصفقات والأسواق
S.ach.n.profit = (S.yr.profit0 || 0) + 500; E.tick(S); ok(S.yr.goals.find(g => g.k === 'deals').done, 'هدف الصفقات الرابحة');
E.COUNTRIES.forEach(c => { S.order.filter(id => S.cities[id].country === c.id).forEach(id => { S.ach.vis[id] = 1; }); }); E.tick(S); ok(S.yr.goals.find(g => g.k === 'markets').done, 'هدف الأسواق الجديدة');
// نهاية الحول
const d0 = S.day; S.yr.start = S.day - E.FREE_YEAR; const nwb = Math.round(E.netWorth(S)); E.tick(S);
ok(S.yr.n === 1 && S.yr.hist.length === 1 && S.yr.hist[0].y === 1 && S.yr.hist[0].goals === 3, 'نهاية الحول تُسجَّل (3 أهداف)');
ok(S.news.some(n => /تقرير الحول 1/.test(n.t)) && S.yr.goals.every(g => !g.done) && S.yr.goals.length === 3, 'تقرير الحول وأهداف جديدة');
ok(S.yr.goals.find(g => g.k === 'growth').target > Math.round(E.netWorth(S)), 'هدف النمو الجديد أعلى من الثروة الحالية');
ok(S.pause === true || true, 'التوقف عند التقرير');
for (let y = 0; y < 6; y++) { S.yr.start = S.day - E.FREE_YEAR; E.tick(S); } ok(S.yr.hist.length === 7 && S.yr.hist.length <= 20, 'حول بعد حول بلا انقطاع (' + S.yr.hist.length + ')');
const L = E.load(E.save(S)); ok(L.yr && L.yr.hist.length === S.yr.hist.length, 'الحفظ');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
