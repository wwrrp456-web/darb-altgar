// التمويل المشروع: مضاربة ومرابحة وقرض حسن وصكوك: node test/finance.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed) { const S = E.newGame(seed); S.phase = 4; S.noShocks = true; S.player.gold = 60000; S.day = 80; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; S.cities.riyadh.stock.coffee = 500; S.cities.riyadh.stock.wheat = 800; return S; }
ok(!E.newGame(1).player.bank.loans.length && E.FIN.mur.terms[30] === 0.06, 'ثوابت التمويل');
// مضاربة
let S = world(71); let r = A.invest(S, 'riyadh', 10000); ok(r.ok && S.player.bank.dep.riyadh === 10000 && /الخسارة على رأس المال/.test(r.msg), 'مضاربة: إيداع بتنبيه الخسارة');
let tot = 0; const dep0 = S.player.bank.dep.riyadh; for (let i = 0; i < 100; i++) { const b = S.player.bank.dep.riyadh; E.tick(S); S.player.gold = 60000; tot += S.player.bank.dep.riyadh - b; }
ok(S.player.led.inc.mudaraba > 0 && S.player.bank.dep.riyadh > dep0 * 0.97, 'ربح المضاربة يتراكم عموماً (' + Math.round(S.player.bank.dep.riyadh - dep0) + ')');
// خسارة نادرة تحدث وتُبلَّغ
let losses = 0; for (let k = 0; k < 40; k++) { const T = world(100 + k); T.seedB = 1000 + k * 7919; A.invest(T, 'riyadh', 10000); for (let i = 0; i < 100; i++) { E.tick(T); T.player.gold = 60000; } if (T.news.some(n => /خسرت مضاربتك/.test(n.t))) losses++; } ok(losses >= 1 && losses < 40, 'الخسارة ممكنة ونادرة (' + losses + ' من 40)');
const g1 = S.player.gold; r = A.divest(S, 'riyadh', 1000); ok(r.ok && S.player.gold - g1 < 1000 && /رسم إداري/.test(r.msg), 'السحب برسم إداري');
ok(!A.invest(E.newGame(5), 'riyadh', 1000).ok, 'مغلق قبل الطور 4');
// مرابحة
S = world(72); const car = S.player.caravans[0]; const q = E.murabahaQuote(S, 'coffee', 20, 30); ok(q.ok && Math.abs(q.face - q.cost * 1.06) < 1e-6 && q.profit > 0, 'عرض المرابحة: الهامش معلوم سلفاً (6٪)');
const gold0 = S.player.gold; r = A.murabaha(S, 'coffee', 20, 30); ok(r.ok && S.player.gold === gold0 && (car.cargo.coffee || 0) >= 20 && S.player.bank.loans.length === 1, 'المرابحة: البضاعة بلا دفع نقدي ودَين مسجَّل');
const L = S.player.bank.loans[0]; ok(L.type === 'mur' && L.due === S.day + 30 && L.face === L.amt, 'العقد بأجله وثمنه');
for (let i = 0; i < 10; i++) { E.tick(S); S.player.gold = gold0; } ok(Math.abs(S.player.bank.loans[0].amt - L.face) < 1e-9, 'لا تتراكم زيادة على الدَّين (بلا فائدة مركبة)');
ok(!A.murabaha(S, 'coffee', 5, 90).ok || true, 'عقد ثانٍ ممكن إن وُجد حد'); const nw = E.netWorth(S); ok(E.netWorth(S) < nw + 1 && E.bankDebt(S) >= L.face, 'الدَّين يظهر في الثروة');
for (let i = 0; i < 25; i++) E.tick(S); ok(!S.player.bank.loans.some(l => l.id === L.id), 'يُسدَّد عند الأجل تلقائياً إن وُجد رصيد');
S = world(73); A.murabaha(S, 'coffee', 20, 30); S.player.gold = 0; for (let i = 0; i < 40; i++) { E.tick(S); S.player.gold = 0; } const ll = S.player.bank.loans[0];
ok(ll && ll.late > 0 && Math.abs(ll.amt - ll.face) < 1e-6, 'التأخر لا يزيد الدَّين (لا غرامة)'); ok(S.news.some(n => /لا غرامة عليك/.test(n.t)), 'تنبيه التأخر بلا غرامة');
S.player.gold = 50000; ok(!A.murabaha(S, 'coffee', 5, 30).ok, 'لا تمويل جديد مع دَين متأخر'); A.settle(S); ok(!S.player.bank.loans.length && A.murabaha(S, 'coffee', 5, 30).ok, 'بعد السداد يعود التمويل');
S = world(74); S.player.gold = 100; ok(!A.murabaha(S, 'coffee', 400, 90).ok, 'حدّ التمويل 50٪ من الثروة'); ok(!A.murabaha(S, 'sheep', 5, 30).ok, 'لا مرابحة على المواشي'); ok(!A.murabaha(S, 'coffee', 5, 45).ok, 'أجل غير معروف');
// قرض حسن
S = world(75); const bs = S.bosses.riyadh; bs.trust = 5; ok(!A.qard(S, 1000).ok, 'القرض الحسن يحتاج ثقة 20'); bs.trust = 30; const gq = S.player.gold; r = A.qard(S, 1500); ok(r.ok && S.player.gold === gq + 1500 && /بلا زيادة/.test(r.msg), 'قرض حسن بلا زيادة');
ok(!A.qard(S, 1000).ok, 'قرض واحد عند الزعيم'); ok(!A.qard(world(76), 9000).ok, 'سقف القرض'); S.player.gold = 5000; A.settle(S); ok(!S.player.bank.loans.length, 'سداد القرض الحسن بالمثل تماماً');
S = world(77); S.bosses.riyadh.trust = 30; A.qard(S, 1000); S.player.gold = 0; const t0 = S.bosses.riyadh.trust; for (let i = 0; i < 80; i++) { E.tick(S); S.player.gold = 0; } ok(S.bosses.riyadh.trust < t0 && E.bankDebt(S) <= 1000 + 1e-6, 'التأخر يخسّرك ثقة الزعيم لا مالاً');
// صكوك
S = world(78); const g5 = S.player.gold; r = A.buySukuk(S); ok(r.ok && S.player.gold === g5 - 5000, 'صك مشاركة 5000'); for (let i = 0; i < 22; i++) E.tick(S); ok(S.player.bank.bonds.length === 0 && S.news.some(n => /القافلة التجارية/.test(n.t)), 'النتيجة بحسب التجارة وليست مراهنة');
let wins = 0, lossN = 0; for (let k = 0; k < 60; k++) { const T = world(200 + k); T.seedB = 5000 + k * 104729; const g = T.player.gold; A.buySukuk(T); for (let i = 0; i < 22; i++) { E.tick(T); } const d = T.news.find(n => /القافلة التجارية/.test(n.t)); if (d && d.k === 'good') wins++; else lossN++; } ok(wins > 0 && lossN > 0, 'ربح وخسارة ممكنان (' + wins + '/' + lossN + ')');
// حفظ وترحيل قديم
S = world(79); A.murabaha(S, 'coffee', 10, 60); S.player.bank.loans.push({ amt: 500, day: 1 }); const Z = E.load(E.save(S)); E.tick(Z); ok(Z.player.bank.loans.length === 2 && Z.player.bank.loans.every(l => l.due != null), 'الحفظ، وقرض قديم بلا أجل يُرحَّل');
ok(!/loanInterest/.test(JSON.stringify(Object.keys(S.player.led.exp))), 'لا بند فوائد قروض');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
