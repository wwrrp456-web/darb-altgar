// حكمة بابل: دَين الجدّ وخطة داباسير والحصّالة والألواح (المحرك): node test/babylon.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const raw = E.newGame(5); ok(!raw.player.famDebt, 'لعبة بلا شخصية (الألعاب الآلية): لا دَين');
const mk = () => { const S = E.newGame(5); A.learnSetChar(S, 'trader'); return S; };
let S = mk(), P = S.player, fd = P.famDebt, L = S.learn; L.level = 3;
ok(fd && fd.left === 1500 && fd.amt0 === 1500 && !fd.plan && P.vault === 0, 'دَين الجدّ ١٥٠٠ والحصّالة صفر بعد اختيار الشخصية');
ok(Math.abs(P.gold - 800) < 1e-6, 'الدَّين لا يمسّ المحفظة (٨٠٠)');
ok(E.zakatBase(S).debts === 1500, 'الدَّين الحالّ يُطرح من وعاء الزكاة');
// بيع رابح بلا خطة: لا اقتطاع
const car = P.caravans[0], g = E.GIDS.find(x => x !== 'wheat' && E.sells(S.cities[car.city], x));
const profitSale = (q) => { S.cities[car.city].stock[g] = 1e4; car.cargo = {}; car.cargo[g] = q; car.basis = {}; car.basis[g] = { q, c: 1 }; const g0 = P.gold; const r = A.sell(S, car.id, g, q); return { r, d: P.gold - g0 }; };
L.tab = Object.keys(E.BAB.TABLETS); let t = profitSale(10); ok(t.r.ok !== false && t.r.pl > 0 && Math.abs(t.d - t.r.net) < 1e-6 && fd.left === 1500 && P.vault === 0, 'بلا خطة لا اقتطاع');
// الخطة: ٢٠٪ للدائن و١٠٪ للحصّالة
A.debtPlan(S, true); ok(fd.plan && fd.due === S.day + 30, 'تفعيل الخطة يبدأ عدّاد القسط');
L.tab = L.tab.filter(x => x !== 'cure1'); t = profitSale(10); const pl = t.r.pl;
ok(Math.abs(fd.left - (1500 - 0.2 * pl)) < 1e-6 && Math.abs(P.vault - 0.1 * pl) < 1e-6 && Math.abs(t.d - (t.r.net - 0.3 * pl) - E.BAB.TABLETS.cure1.reward) < 1e-6, 'اقتطاع ٧٠/٢٠/١٠: دائن ' + (0.2 * pl).toFixed(1) + ' وحصّالة ' + (0.1 * pl).toFixed(1));
ok(fd.mPaid > 0 && fd.paid > 0, 'الدفعات تُسجَّل للقسط الشهري');
ok(L.tab.includes('cure1') && L.tq.includes('cure1'), 'لوح العلاج الأول بعد أول اقتطاع للحصّالة');
// بيع خاسر: لا اقتطاع
L.tab = L.tab.filter(x => x !== 'law4'); const left1 = fd.left, v1 = P.vault; S.cities[car.city].stock[g] = 1e4; car.cargo = {}; car.cargo[g] = 5; car.basis = {}; car.basis[g] = { q: 5, c: 1e5 }; A.sell(S, car.id, g, 5); ok(fd.left === left1 && P.vault === v1 && L.ev.loss >= 1 && L.tab.includes('law4'), 'الخسارة لا اقتطاع فيها ويُفتح لوح القانون الرابع');
// دفعة طوعية
P.gold = 5000; const gB = P.gold, r1 = A.debtPay(S, 100); ok(r1.ok !== false && Math.abs(P.gold - (gB - 100)) < 1e-6 && Math.abs(fd.left - (left1 - 100)) < 1e-6, 'دفعة طوعية ١٠٠');
ok(A.debtPay(S, 0).ok === false, 'دفعة صفر مرفوضة');
// القسط والصبر
S = mk(); P = S.player; fd = P.famDebt; L = S.learn; A.debtPlan(S, true); const due0 = fd.due;
S.day = due0; E.debtDay(S); ok(fd.patience === 75 && fd.due === due0 + 30, 'تأخّر عن القسط: الصبر ٧٥ والموعد التالي بعد ٣٠ يوماً');
fd.mPaid = 75; S.day = fd.due; E.debtDay(S); ok(fd.patience === 85, 'وفاء بالقسط يرفع الصبر ١٠');
fd.patience = 20; fd.mPaid = 0; P.gold = 2000; S.day = fd.due; const gS = P.gold, lS = fd.left; E.debtDay(S);
ok(fd.patience === 50 && P.gold < gS && fd.left < lS && P.gold >= 200, 'عند نفاد الصبر يستوفي الدائن ٢٥٪ ويعود الصبر ٥٠: ' + Math.round(gS - P.gold));
// بدء العدّ عند المستوى ٤ بلا خطة
S = mk(); P = S.player; fd = P.famDebt; S.learn.level = 4; E.debtDay(S); ok(fd.due === S.day + 30, 'يبدأ العدّ عند المستوى ٤ حتى بلا خطة');
// الحصّالة وكسرها
S = mk(); P = S.player; S.learn.level = 3; P.vault = 400; const nw0 = E.netWorth(S); ok(E.zakatBase(S).cash >= 400, 'الحصّالة تدخل وعاء الزكاة'); S.learn.rseen = {};
const gb = P.gold; const vb = A.vaultBreak(S); ok(vb.ok !== false && P.vault === 0 && Math.abs(P.gold - (gb + 400)) < 1e-6 && Math.abs(E.netWorth(S) - nw0) < 1e-6, 'كسر الحصّالة يعيد المال دون تغيير الثروة');
S.learn.tab = []; P.vault = 300; E.tabletCheck(S); ok(S.learn.tab.includes('law1'), 'لوح القانون الأول عند ٣٠٠ في الحصّالة');
// التحرر
S = mk(); P = S.player; fd = P.famDebt; L = S.learn; L.level = 3; P.gold = 3000; A.debtPay(S, 1500);
ok(fd.left === 0 && L.free && L.fq.includes('debtfree') && Math.abs(L.perks.pact - 0.95 * 0.97) < 1e-9, 'التحرر من الدَّين: ميزة سمعة الوفاء ٣٪');
E.learnCheck(S); ok(L.tab.includes('free'), 'لوح الروح الحرة');
ok(E.zakatBase(S).debts === 0, 'لا دَين في الزكاة بعد التحرر');
// الحفظ والتحميل
const S2 = E.load(JSON.stringify(S)); ok(S2.player.famDebt && S2.player.famDebt.left === 0 && Array.isArray(S2.learn.tq) && S2.learn.free, 'الحفظ والتحميل سليم');
// حفظ قديم بلا دَين
const old = E.newGame(5); A.learnSetChar(old, 'trader'); delete old.player.famDebt; delete old.player.vault; delete old.learn.tab; delete old.learn.tq; delete old.learn.fq;
const S3 = E.load(JSON.stringify(old)); E.tick(S3); ok(!S3.player.famDebt && Array.isArray(S3.learn.tab), 'حفظ قديم بلا دَين يعمل');
// البيانات
const B = E.BAB; ok(Object.keys(B.STORY).length === 10 && Object.keys(B.TABLETS).length === 13 && Object.keys(B.QUIZ).length === 9, 'عشر حكايات و١٣ لوحاً وأسئلة ٩ مستويات');
ok(Object.values(B.QUIZ).flat().every(q => q.o.length === 3 && q.ok === 0 && q.why), 'بنية الأسئلة سليمة');
// فترة التمرين تتطلب الخطة بعد المستوى ٢
S = mk(); L = S.learn; P = S.player; L.level = 2; L.hold = 0; L.intro = 2; const rs2 = (function () { L.ev = { buy: 1, sell: 1, profit15: 1, profit: 1 }; P.led.inc.realized = 500; E.learnCheck(S); return L.rest; })();
console.log('   rest after L2:', JSON.stringify(rs2));
ok(L.level === 3 && rs2 && rs2.plan === true, 'التمرين بعد المستوى ٢ يتطلب تفعيل الخطة');
rs2.w = rs2.k; P.gold = 5000; E.learnCheck(S); ok(!!L.rest, 'لا ينتهي التمرين قبل تفعيل الخطة');
A.debtPlan(S, true); E.learnCheck(S); ok(!L.rest, 'ينتهي التمرين بعد تفعيل الخطة');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
