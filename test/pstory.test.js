// حكايات المنتجات: engine + واجهة الألبوم. node test/pstory.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
ok(Object.keys(E.LORE.PSTORY).length === 16, 'ست عشرة حكاية');
ok(Object.keys(E.LORE.PSTORY).every(g => E.GD[g] && E.LORE.PSTORY[g].x.length > 120 && E.LORE.PSTORY[g].x.length < 420), 'نصوص بطول معقول ولكل سلعة معرّف صحيح');
const sigs = new Set(E.newGame(1).order.map(id => E.newGame(1).cities[id].sig)); ok(Object.keys(E.LORE.PSTORY).every(g => sigs.has(g)), 'كل حكاية لمنتج مميز لمدينة');
const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.player.gold = 20000;
const car = S.player.caravans[0]; car.city = 'hail'; car.left = 0; S.cities.hail.stock.dates = 400; S.cities.hail.stock.wheat = 400;
A.buy(S, car.id, 'wheat', 5); ok(!(S.learn.pst || []).includes('wheat') && !(S.learn.pst || []).length, 'سلعة عادية بلا حكاية');
A.buy(S, car.id, 'dates', 5); ok((S.learn.pst || []).includes('dates'), 'شراء التمر يفتح حكايته');
ok(S.news.some(n => /حكاية منتج جديدة/.test(n.t)), 'خبر في الدفتر'); A.buy(S, car.id, 'dates', 5); ok(S.learn.pst.length === 1, 'لا تتكرر');
const car2 = S.player.caravans[0]; const L2 = E.load(E.save(S)); ok(L2.learn.pst.includes('dates'), 'الحفظ');
const B = E.newGame(6); B.player.caravans[0].city = 'hail'; B.cities.hail.stock.dates = 400; A.buy(B, B.player.caravans[0].id, 'dates', 5); ok(!B.learn || !(B.learn.pst || []).length, 'بلا شخصية تعلّم لا حكايات (معيار الضغط)');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
