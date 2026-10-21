// زكاة بهيمة الأنعام (جدول المختص): الأنصبة والواجب، غرض القطيع، الإخراج عيناً أو نقداً: node test/zakat-an.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const T = E.ZAKAT_AN;
const show = (kind, n) => E.anDue(kind, n).map(x => x.k + '×' + x.n).join('+') || '-';
// الإبل
const camel = { 4: '-', 5: 'sheep×1', 9: 'sheep×1', 10: 'sheep×2', 14: 'sheep×2', 15: 'sheep×3', 19: 'sheep×3', 20: 'sheep×4', 24: 'sheep×4', 25: 'makhad×1', 35: 'makhad×1', 36: 'labun×1', 45: 'labun×1', 46: 'hiqqa×1', 60: 'hiqqa×1', 61: 'jadha×1', 75: 'jadha×1', 76: 'labun×2', 90: 'labun×2', 91: 'hiqqa×2', 120: 'hiqqa×2', 121: 'labun×3', 130: 'labun×2+hiqqa×1', 150: 'hiqqa×3', 160: 'labun×4' };
for (const n in camel) ok(show('camel', +n) === camel[n], 'إبل ' + n + ' ← ' + camel[n] + ' (' + show('camel', +n) + ')');
// البقر والغنم
const cow = { 29: '-', 30: 'tabi×1', 39: 'tabi×1', 40: 'musinna×1', 59: 'musinna×1', 60: 'tabi×2', 70: 'tabi×1+musinna×1', 80: 'musinna×2', 90: 'tabi×3', 120: 'musinna×3' }; // عند تساوي التركيبين (٤ تبيع أو ٣ مسنّة) نأخذ الأكبر سناً
for (const n in cow) ok(show('cow', +n) === cow[n], 'بقر ' + n + ' ← ' + cow[n] + ' (' + show('cow', +n) + ')');
const sheep = { 39: '-', 40: 'sheep×1', 120: 'sheep×1', 121: 'sheep×2', 200: 'sheep×2', 201: 'sheep×3', 399: 'sheep×3', 400: 'sheep×4', 499: 'sheep×4', 500: 'sheep×5', 650: 'sheep×6' };
for (const n in sheep) ok(show('sheep', +n) === sheep[n], 'غنم ' + n + ' ← ' + sheep[n] + ' (' + show('sheep', +n) + ')');
// لعبة: قطيع ماشٍ
const mk = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.player.gold = 60000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; return S; };
{ const S = mk(3), car = S.player.caravans[0]; car.herd = { sheep: 50, camel: 6 }; car.herders = 5;
  const b = E.zakatBase(S); ok(b.an.rows.length === 2 && b.an.any, 'القطيع الماشي يظهر في تقييم الأنعام');
  const rc = b.an.rows.find(r => r.kind === 'camel'), rs = b.an.rows.find(r => r.kind === 'sheep'); ok(rc.n === 6 && rc.due[0].k === 'sheep' && rc.due[0].n === 1 && rs.n === 50 && rs.due[0].k === 'sheep', 'الإبل ٦ ← شاة، والغنم ٥٠ ← شاة');
  const goods0 = b.goods; A.zakatHerdMode(S, 'sawm'); const b2 = E.zakatBase(S); ok(b2.goods < goods0 - 1 && b2.exHerd > 0, 'في «الرعي والنسل» يخرج القطيع من وعاء التجارة (' + Math.round(goods0) + ' ← ' + Math.round(b2.goods) + ')');
  A.zakatHerdMode(S, 'trade'); ok(E.zakatBase(S).goods === goods0, 'العودة إلى «التجارة» تعيده كما كان'); }
// دون النصاب: لا زكاة أنعام
{ const S = mk(4), car = S.player.caravans[0]; car.herd = { sheep: 30, camel: 3 }; const b = E.zakatBase(S); ok(!b.an.any && b.an.rows.every(r => !r.due.length), 'دون النصاب (٣٠ غنم، ٣ إبل) لا زكاة أنعام'); }
// الصغار تُضم إن بلغ الأصل النصاب
{ const S = mk(5), car = S.player.caravans[0]; car.herd = { sheep: 38 }; car.hx = { sheep: { m: 9, y: 10, b: 0, mq: 1, fq: 1, yq: 1 } }; let b = E.zakatBase(S); ok(b.an.rows[0].n === 38 && !b.an.rows[0].due.length, '٣٨ بالغة و١٠ صغار: الأصل دون النصاب فلا تُضم');
  car.herd = { sheep: 41 }; b = E.zakatBase(S); ok(b.an.rows[0].n === 51 && b.an.rows[0].due[0].k === 'sheep', '٤١ بالغة والصغار تُضم (٥١) ← شاة'); }
// الحول والإخراج: عيناً
function dueWorld(seed, herd) { const S = mk(seed), car = S.player.caravans[0]; car.herd = herd; car.herders = 5; A.zakatHerdMode(S, 'sawm'); S.zakat.start = S.day - 360; E.tick(S); return { S, car }; }
{ const { S, car } = dueWorld(6, { sheep: 120, camel: 5 }); const Z = S.zakat;
  ok(Z.due && Z.an && Z.anLeft === 2 && Z.herdMode === 'sawm', 'حال الحول: زكاة أنعام مستحقة (٢ شاة: ١ للغنم و١ للإبل)');
  const hs0 = Math.floor(car.herd.sheep), g0 = S.player.gold; const r = A.zakatAn(S, 'kind');
  ok(r.ok !== false && Math.floor(car.herd.sheep) <= hs0 - 2 && S.player.gold <= g0 && Z.anLeft === 0, 'الإخراج عيناً: يُخصم الواجب من القطيع (' + hs0 + ' ← ' + Math.floor(car.herd.sheep) + ')');
  ok(Z.amount > 0 ? Z.due : !Z.due, 'الحول لا ينتهي قبل زكاة المال النقدية إن كانت مستحقة'); if (Z.due) { const p = A.zakatPay(S, Z.amount); ok(p.ok !== false && !S.zakat.due, 'بعد زكاة المال ينتهي الحول'); } }
// الإخراج نقداً
{ const { S, car } = dueWorld(7, { cow: 31 }); const Z = S.zakat, g0 = S.player.gold; ok(Z.due && Z.anLeft === 1 && Z.an[0].due[0].k === 'tabi', '٣١ بقرة ← تبيع'); const cows0 = car.herd.cow, r = A.zakatAn(S, 'cash'); ok(r.ok !== false && car.herd.cow === cows0 && S.player.gold < g0 && Z.anLeft === 0, 'الإخراج نقداً: يُدفع ثمن رأس ولا يُمَسّ القطيع'); }
// تغيير الغرض عند الاستحقاق ثم القفل بعد البدء
{ const S = mk(8), car = S.player.caravans[0]; car.herd = { sheep: 60 }; S.zakat.herdMode = 'trade'; S.zakat.start = S.day - 360; E.tick(S); const Z = S.zakat;
  ok(Z.due && !Z.an && Z.anLeft === 0, 'بغرض التجارة: لا أنعام، القطيع ضمن الوعاء');
  const r = A.zakatHerdMode(S, 'sawm'); ok(r.ok !== false && Z.an && Z.anLeft === 1, 'تغيير الغرض عند الاستحقاق يعيد الحساب فتظهر زكاة الأنعام');
  const amt = Z.amount; if (amt > 0) { A.zakatPay(S, 1); ok(A.zakatHerdMode(S, 'trade').ok === false, 'بعد بدء الإخراج لا يتغير غرض القطيع'); } }
// حفظ قديم بلا حقول الأنعام
{ const S = mk(9); const old = JSON.parse(E.save(S)); delete old.zakat.herdMode; delete old.zakat.an; delete old.zakat.anLeft; const L = E.load(JSON.stringify(old)); ok(L && E.zakatBase(L).an && L.zakat.herdMode !== 'sawm', 'حفظ قديم بلا حقول الأنعام يعمل ويبقى على التجارة'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
