// الزكاة في المحرك: node test/zakat.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = () => { const S = E.newGame(21); A.learnSetChar(S, 'trader'); return S; };
let S = mk();
ok(!!S.zakat && S.zakat.start === null, 'لعبة جديدة: حول لم يبدأ');
let b = E.zakatBase(S);
ok(Math.abs(b.nisab - 85 * S.fx.gold) < 1e-6, 'النصاب = ٨٥ غراماً × سعر الذهب: ' + b.nisab);
ok(!b.met, 'ثمانمئة ريال أقل من النصاب');
E.tick(S); ok(S.zakat.start === null, 'لا يبدأ الحول تحت النصاب');
S.player.gold = 40000; b = E.zakatBase(S);
ok(b.met && b.amount === Math.round(b.base * 0.025), 'فوق النصاب: المقدار ٢٫٥٪ من الوعاء: ' + b.amount);
E.tick(S); ok(S.zakat.start === S.day, 'بدأ الحول عند بلوغ النصاب');
ok(S.learn.rq.includes('nisab'), 'تعليق عمّ سالم: بلغت النصاب');
// الأصول الثابتة مستثناة
const before = E.zakatBase(S).base; S.player.props.riyadh = { shops: [{ id: 91, items: [] }, { id: 92, items: [] }], whs: 2, store: {}, basis: {}, today: 0 }; S.player.caravans[0].carts = 6; S.player.caravans[0].guards = 8;
ok(Math.abs(E.zakatBase(S).base - before) < 1e-6, 'الدكاكين والمخازن والعربات والحراس لا تدخل الوعاء');
// البضاعة بسعر السوق والديون تُطرح
S.player.caravans[0].cargo.dates = 100; const g = E.zakatBase(S); ok(g.goods > 0 && g.base > before, 'البضاعة تدخل الوعاء');
S.player.bank.loans.push({ amt: 10000 }); ok(E.zakatBase(S).base < g.base - 9000, 'الدين يُطرح');
S.player.bank.loans.length = 0; S.player.caravans[0].cargo = {};
// تمام الحول
S.zakat.start = S.day - 354; E.tick(S); ok(S.zakat.due === true && S.zakat.amount > 0, 'حال الحول فصارت الزكاة مستحقة: ' + S.zakat.amount);
ok(S.learn.rq.includes('zakatDue') && S.pause, 'تنبيه عمّ سالم وإيقاف الوقت');
// دفع جزئي ثم كامل
const full = S.zakat.amount, g0 = S.player.gold;
let r = A.zakatPay(S, Math.round(full / 2)); ok(r.ok && S.zakat.due && S.zakat.amount === full - Math.round(full / 2), 'دفع جزئي: يبقى المستحق');
r = A.zakatPay(S, 1e9); ok(r.ok && !S.zakat.due && S.zakat.last === S.day && S.zakat.hist[0].note === 'paid', 'دفع الباقي يُتمّ الزكاة');
ok(Math.abs((g0 - S.player.gold) - full) < 2, 'الخصم من الرصيد = المستحق (' + Math.round(g0 - S.player.gold) + ')');
ok(S.zakat.start === S.day, 'بدأ حول جديد لأن المال ما زال فوق النصاب');
ok(!A.zakatPay(S, 100).ok, 'لا دفع بلا استحقاق');
// تأجيل
S = mk(); S.player.gold = 40000; E.tick(S); S.zakat.start = S.day - 355; E.tick(S); ok(S.zakat.due, 'مستحقة');
ok(A.zakatDefer(S).ok && S.zakat.defer === S.day + 7 && S.zakat.due, 'التأجيل أسبوعاً والزكاة تبقى دَيناً');
S.learn.rq = []; S.day += 8; E.tick(S); ok(S.learn.rq.includes('zakatLate'), 'تذكير بعد انتهاء مهلة التأجيل');
// نقص النصاب عند التمام: تسقط وتبدأ دورة جديدة
S = mk(); S.player.gold = 40000; E.tick(S); S.zakat.start = S.day - 355; S.player.gold = 1000; E.tick(S);
ok(!S.zakat.due && S.zakat.start === null && S.zakat.hist[0].note === 'below', 'نقص النصاب عند التمام: لا زكاة ويُعاد الحول');
// رصيد لا يكفي
S = mk(); S.player.gold = 40000; E.tick(S); S.zakat.start = S.day - 355; E.tick(S); S.player.gold = 5; ok(!A.zakatPay(S, 500).ok, 'رصيد لا يكفي');
// الحفظ القديم
const old = JSON.parse(JSON.stringify(mk())); delete old.zakat; ok(!!E.load(JSON.stringify(old)).zakat, 'ترحيل الحفظ القديم يضيف zakat');
// اللاعب بلا شخصية (اختبارات الضغط والبوتات): لا زكاة
const N = E.newGame(5); N.player.gold = 90000; E.tick(N); ok(N.zakat.start === null, 'بلا شخصية لا يعمل الحساب');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
