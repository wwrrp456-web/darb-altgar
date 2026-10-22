// أصناف المواشي: سلع مستقلة بسمات، وفتح بالمستوى، وأثر السمات (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const B = E.BREEDS, SP = ['sheep', 'goat', 'cow', 'buffalo', 'camel', 'horse', 'chicken', 'duck'];
ok(B.length === 36 && new Set(B.map(b => b.id)).size === 36, 'ستة وثلاثون صنفاً بمعرّفات فريدة');
ok(B.every(b => SP.includes(b.sp) && E.GD[b.id] && E.GD[b.id].sp === b.sp && E.GD[b.id].live), 'كل صنف سلعة حيّة تتبع نوعاً');
ok(B.every(b => E.BR_KEYS.every(k => b.tr[k] >= 1 && b.tr[k] <= 5)), 'السمات بين 1 و5');
ok(SP.every(sp => B.filter(b => b.sp === sp && b.tier === 0).length >= 1 && B.filter(b => b.sp === sp && b.tier === 0).length <= 3), 'كل نوع فيه 1–3 أصناف مبتدئة فوق البلدي');
ok(B.every(b => b.at.every(id => E.CITY_DEFS.find(d => d.id === id).makes.includes(b.id) && E.CD[E.CITY_DEFS.find(d => d.id === id).country] && b.org.includes(E.CITY_DEFS.find(d => d.id === id).country))), 'تُباع الأصناف في مدن منشئها');
// أثر السمات
const najdi = E.GD.najdi, sheep = E.GD.sheep;
ok(najdi.spoil < sheep.spoil * 1.0001 && E.GD.shaele.spoil < E.GD.camel.spoil * 1.2 && E.GD.hu.spoil > sheep.spoil * 1.05, 'التحمّل يغيّر النفوق (نجدي تحمّل 4 أقل من البلدي، وهو تحمّل 2 أكثر)');
ok(E.BREED.hu.L > E.BREED.sheep.L && E.BREED.wadh.L < E.BREED.camel.L, 'الخصوبة تغيّر حجم الولادة');
ok(E.MEAT.naeemi > E.MEAT.sheep && E.MEAT.karakul < E.MEAT.sheep, 'اللحم يغيّر غلّة الذبح');
ok(E.PRODUCT.karakul[1] > E.PRODUCT.sheep[1] && E.PRODUCT.jamnapari[1] > E.PRODUCT.goat[1], 'الصوف واللبن يغيّران غلّة المزرعة');
// الفتح بالمستوى
const S = E.newGame(4); A.learnSetChar(S, 'trader'); S.player.gold += 50000; S.learn.level = 3; S.fxFree = true; // الاختبار للمستويات لا للصرف
const car = S.player.caravans[0]; car.city = 'tabriz'; car.left = 0; S.cities.tabriz.stock.karakul = 500;
let r = A.buy(S, car.id, 'karakul', 2); ok(r.ok === false && /المستوى 4/.test(r.msg), 'قره قل مغلق قبل المستوى 4: ' + r.msg);
S.learn.level = 4; r = A.buy(S, car.id, 'karakul', 2); ok(r.ok !== false && car.cargo.karakul >= 1, 'يُفتح عند المستوى 4');
const S2 = E.newGame(4); A.learnSetChar(S2, 'trader'); S2.player.gold += 9000; S2.learn.level = 1; const c2 = S2.player.caravans[0]; c2.city = 'riyadh'; S2.cities.riyadh.stock.najdi = 300;
ok(A.buy(S2, c2.id, 'najdi', 2).ok !== false, 'الصنف المبتدئ مفتوح من المستوى 1');
S2.cities.riyadh.stock.naeemi = 300; ok(A.buy(S2, c2.id, 'naeemi', 1).ok === false, 'المتقدم مغلق (7)');
ok(E.quoteBuy(S2, 'riyadh', 'naeemi', 5, null).n === 0, 'عرض الأسعار يمنع المغلق');
const S3 = E.newGame(5); ok(E.breedOpen(S3, 'naeemi'), 'من لا تعليم عنده: كل الأصناف مفتوحة');
// الآليون لا يتاجرون بها
const S4 = E.newGame(9); for (let i = 0; i < 60; i++) E.tick(S4);
ok(S4.agents.every(a => B.every(b => !(a.cargo[b.id] >= 1))), 'المنافسون الآليون لا يحملون أصناف المواشي');
// الحفظ والترحيل
const old = JSON.parse(E.save(S4)); for (const id in old.cities) { for (const b of B) { delete old.cities[id].stock[b.id]; delete old.cities[id].idx[b.id]; delete old.cities[id].prod[b.id]; } old.cities[id].makes = old.cities[id].makes.filter(g => !E.GD[g].sp); }
const Z = E.load(JSON.stringify(old)); ok(Z && Z.cities.riyadh.makes.includes('najdi') && Z.cities.riyadh.stock.najdi > 0, 'حفظ قديم: تظهر الأصناف الجديدة في الأسواق');
const st = E.stressTest({ seeds: 6, days: 60, bot: true }); ok(st.nan === 0, 'الضغط: لا NaN مع الأصناف');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
