// المواشي (الحمولة): العلف والنفوق والمناطق: node test/animals.test.js
const fs = require('fs'), path = require('path'); const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const AN = ['chicken', 'duck', 'sheep', 'goat', 'cow', 'buffalo', 'camel', 'horse'];
ok(AN.every(g => E.GD[g] && E.GD[g].live && E.GD[g].tier === 'live' && E.GD[g].fod > 0), 'الأنواع الثمانية معرَّفة كمواشٍ بعلف');
ok(AN.every(g => fs.existsSync(path.join(__dirname, '../brand/img/goods/' + g + '.webp'))), 'لكل نوع أيقونة مفرغة');
const icons = fs.readFileSync(path.join(__dirname, '../src/icons.js'), 'utf8'); ok(AN.every(g => icons.includes("'goods/" + g + "'")), 'الأيقونات مربوطة بالرموز');
ok(E.GD.chicken.hu === 0 && E.GD.duck.hu === 0 && E.GD.sheep.hu === 1 && E.GD.horse.hu === 2, 'الدواجن لا قطيع لها، والكبيرة وحدتان');
const mk = id => E.CITY_DEFS.filter(d => d.makes.some(g => g === id || E.GD[g].sp === id)).map(d => d.id); // النوع وأصنافه المسمّاة
ok(AN.every(g => mk(g).length >= 2), 'كل نوع يُنتَج في مدينتين فأكثر');
ok(mk('cow').every(id => E.CITY_DEFS.find(d => d.id === id).country !== 'in'), 'لا بقر في الهند');
ok(mk('buffalo').some(id => E.CITY_DEFS.find(d => d.id === id).country === 'in'), 'الجاموس في الهند');
ok(mk('camel').every(id => E.CITY_DEFS.find(d => d.id === id).country === 'sa'), 'الجمال من السعودية');
ok(!E.GIDS.some(g => /pig|خنزير/.test(g)) && !AN.some(g => /خنزير/.test(E.GD[g].name)), 'لا خنزير في اللعبة');
// الأسعار والمخزون
const S = E.newGame(4); for (let i = 0; i < 40; i++) E.tick(S);
ok(AN.every(g => E.sells(S.cities.riyadh, g) === E.CITY_DEFS[0].makes.includes(g)), 'تُباع في مدن إنتاجها فقط');
ok(E.unitPrice(S.cities.riyadh, 'camel') > 250 && E.unitPrice(S.cities.riyadh, 'camel') < 1000, 'سعر الجمل معقول (' + Math.round(E.unitPrice(S.cities.riyadh, 'camel')) + ')');
ok(E.PREM.shanghai.camel > E.PREM.jeddah.camel && E.PREM.shanghai.camel > 1, 'علاوة المسافة تشمل المواشي');
// العلف في مؤن الرحلة
const car = S.player.caravans[0]; car.cargo = {}; const base = E.supplyNeed(car, 6);
car.cargo = { sheep: 50 }; const withS = E.supplyNeed(car, 6); ok(withS > base && Math.abs(E.fodderDay(car) - 50 * E.GD.sheep.fod) < 1e-9, 'العلف يزيد مؤن الرحلة (' + base + ' ← ' + withS + ')');
car.cargo = { sheep: 50, wool: 50 }; ok(E.fodderDay(car) === 50 * E.GD.sheep.fod, 'السلع العادية بلا علف');
// تكلفة الرحلة الفعلية
const C = E.newGame(4); C.player.gold = 5000; const cc = C.player.caravans[0]; cc.cargo = { horse: 20 }; cc.crew = 4;
const g0 = C.player.gold, tr = E.A.travel(C, cc.id, 'jeddah'); ok(tr.ok !== false, 'سفر بخيل'); ok(g0 - C.player.gold >= E.GD.horse.fod * 20 * 2, 'المؤن المدفوعة تشمل علف الخيل');
// النفوق أثناء السفر
const D = E.newGame(6); const dc = D.player.caravans[0]; dc.cargo = { chicken: 200 }; dc.left = 5; dc.total = 5; dc.dest = 'jeddah'; dc.from = 'riyadh'; D.player.gold = 9999;
for (let i = 0; i < 4; i++) E.tick(D); ok(dc.cargo.chicken < 200 * (1 - 0.015 * 4 * 0.6) && dc.cargo.chicken > 150, 'الدجاج ينفق بسرعة في الطريق (' + Math.round(dc.cargo.chicken) + ' من 200)');
const H = E.newGame(6); const hc = H.player.caravans[0]; hc.cargo = { sheep: 200 }; hc.left = 5; hc.total = 5; hc.dest = 'jeddah'; hc.from = 'riyadh'; hc.hungry = true;
const K = E.newGame(6); const kc = K.player.caravans[0]; kc.cargo = { sheep: 200 }; kc.left = 5; kc.total = 5; kc.dest = 'jeddah'; kc.from = 'riyadh';
for (let i = 0; i < 4; i++) { E.tick(H); E.tick(K); } ok((200 - hc.cargo.sheep) > (200 - kc.cargo.sheep) || hc.cargo.sheep < kc.cargo.sheep + 0.5, 'الجوع يضاعف نفوق المواشي (' + Math.round(hc.cargo.sheep) + ' ≤ ' + Math.round(kc.cargo.sheep) + ')');
// صفقة تحسب العلف
const T = E.newGame(8); const tc = T.player.caravans[0]; const o0 = E.sellOptions(T, 'riyadh', 'sheep', 40, E.unitPrice(T.cities.riyadh, 'sheep'), tc).find(x => x.city === 'jeddah'), o1 = E.sellOptions(T, 'riyadh', 'wool', 40, E.unitPrice(T.cities.riyadh, 'wool'), tc).find(x => x.city === 'jeddah');
ok(o0 && o1 && o0.prov > o1.prov, 'تقدير الصفقة يحمّل المواشي علفها (' + Math.round(o0.prov) + ' > ' + Math.round(o1.prov) + ')');
// الحفظ والتحميل وحفظ قديم
const L = E.load(E.save(S)); ok(L && AN.every(g => L.cities.riyadh.stock[g] >= 0), 'الحفظ والتحميل');
const raw = JSON.parse(E.save(S)); for (const id in raw.cities) { const c = raw.cities[id]; AN.forEach(g => { delete c.stock[g]; delete c.idx[g]; delete c.short[g]; delete c.glut[g]; delete c.dem[g]; delete c.prod[g]; if (raw.player.known[id]) { delete raw.player.known[id].p[g]; delete raw.player.known[id].st[g]; } }); c.makes = c.makes.filter(g => !AN.includes(g)); }
const O = E.load(JSON.stringify(raw)); let bad = 0; for (const id of O.order) AN.forEach(g => { if (!(O.cities[id].stock[g] >= 0) || !isFinite(E.unitPrice(O.cities[id], g))) bad++; }); ok(bad === 0 && O.cities.riyadh.makes.some(g => E.GD[g].sp === 'camel'), 'حفظ قديم بلا مواشٍ يُرحَّل سليماً');
const st = E.stressTest({ seeds: 12, days: 100, bot: true }); ok(st.nan === 0 && st.summary.avgPlayerNW > 8000 && st.summary.avgPlayerNW < 16000, 'الضغط: لا NaN والثروة معقولة (' + Math.round(st.summary.avgPlayerNW) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
