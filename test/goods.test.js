// السلع الجديدة (غذاء وخامات): الإنتاج، الأيقونات، ترحيل الحفظ القديم: node test/goods.test.js
const fs = require('fs'), path = require('path'); const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const NEW = ['salt', 'rice', 'sugar', 'honey', 'oliveoil', 'driedfish', 'leather', 'cheese', 'raisins', 'paper', 'soap', 'herbs', 'jerky', 'eggs'];
ok(NEW.every(g => E.GD[g]), 'السلع الجديدة الـ١٤ معرَّفة');
ok(NEW.every(g => fs.existsSync(path.join(__dirname, '../brand/img/goods/' + g + '.webp'))), 'لكل سلعة جديدة أيقونة مفرغة');
ok(NEW.every(g => E.CITY_DEFS.some(d => d.makes.includes(g))), 'كل سلعة جديدة تُنتَج في مدينة واحدة على الأقل');
const mk = fs.readFileSync(path.join(__dirname, '../src/icons.js'), 'utf8'); ok(NEW.every(g => mk.includes("'goods/" + g + "'")), 'الأيقونات مربوطة بالرموز في السجل');
const S = E.newGame(9); for (let i = 0; i < 60; i++) E.tick(S);
let bad = 0, miss = 0; for (const id of S.order) { const c = S.cities[id]; for (const g of E.GIDS) { const p = E.unitPrice(c, g); if (!isFinite(p) || p <= 0) bad++; if (c.makes.includes(g) && (c.stock[g] < 1 && c.prod[g] === undefined)) miss++; } }
ok(bad === 0 && miss === 0, 'لا أسعار فاسدة بعد ٦٠ يوماً ولا إنتاج ناقص');
ok(NEW.every(g => E.GD[g].pmin < E.GD[g].pmax && E.GD[g].w > 0), 'نطاقات الأسعار والأوزان سليمة');
ok(E.sells(S.cities.alex, 'oliveoil') && !E.sells(S.cities.riyadh, 'oliveoil') && E.buyMul, 'زيت الزيتون يُباع في الإسكندرية لا في الرياض');
// ترحيل حفظ قديم بلا السلع الجديدة
const raw = JSON.parse(E.save(S)); for (const id in raw.cities) { const c = raw.cities[id]; NEW.forEach(g => { delete c.stock[g]; delete c.idx[g]; delete c.short[g]; delete c.glut[g]; delete c.dem[g]; delete c.prod[g]; }); NEW.forEach(g => { if (raw.player.known[id]) { delete raw.player.known[id].p[g]; delete raw.player.known[id].st[g]; } }); c.makes = c.makes.filter(g => !NEW.includes(g)); }
const O = E.load(JSON.stringify(raw)); ok(!!O, 'تحميل حفظ قديم');
let nan = 0; for (const id of O.order) { const c = O.cities[id]; NEW.forEach(g => { if (!(c.stock[g] >= 0) || !isFinite(E.unitPrice(c, g))) nan++; }); if (O.player.known[id]) NEW.forEach(g => { if (O.player.known[id].p[g] === undefined) nan++; }); }
ok(nan === 0, 'السلع الجديدة مهيّأة في كل المدن والمعلومات المعروفة');
for (let i = 0; i < 30; i++) E.tick(O); ok(NEW.every(g => O.cities.alex.stock[g] >= 0), 'اللعبة المرحَّلة تعمل ٣٠ يوماً');
ok(O.cities.alex.makes.includes('oliveoil') && O.cities.hail.makes.includes('leather'), 'المدن المرحَّلة أخذت إنتاجها الجديد');
const st = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st.nan === 0 && st.summary.avgPlayerNW > 7000 && st.summary.avgPlayerNW < 16000, 'الضغط: لا NaN والثروة معقولة (' + Math.round(st.summary.avgPlayerNW) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
