// التقويم الهجري والميلادي وسنوات الرحلة (محرك): node test/calendar.test.js
const E = require('../src/engine.js'), A = E.A, C = E.CAL;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); return S; };
// تحويلات التواريخ
ok(C.gregToJd(2000, 1, 1) === 2451545, 'اليوم اليولياني لـ 1 يناير 2000');
{ let bad = 0; for (let i = 0; i < 40000; i++) { const jd = C.MIN + i, g = C.jdToGreg(jd), h = C.jdToHijri(jd); if (C.gregToJd(g.y, g.m, g.d) !== jd || C.hijriToJd(h.y, h.m, h.d) !== jd || h.m < 1 || h.m > 12 || h.d < 1 || h.d > 30) bad++; } ok(bad === 0, 'الذهاب والإياب سليم لمئة وعشر سنوات تقريباً'); }
{ const a = C.jdToHijri(C.gregToJd(2026, 2, 18)); ok(a.y === 1447 && a.m === 9 && a.d <= 2, '١ رمضان ١٤٤٧ يوافق نحو ١٨ فبراير ٢٠٢٦ (' + a.d + ')'); }
{ const a = C.jdToHijri(C.gregToJd(2026, 5, 27)); ok(a.y === 1447 && a.m === 12 && a.d >= 9 && a.d <= 11, 'عيد الأضحى ١٤٤٧ نحو ٢٧ مايو ٢٠٢٦ (' + a.d + ')'); }
{ let min = 999, max = 0; for (let y = 1448; y < 1480; y++) { const len = C.hijriToJd(y + 1, 1, 1) - C.hijriToJd(y, 1, 1); min = Math.min(min, len); max = Math.max(max, len); } ok(min === 354 && max === 355, 'السنة الهجرية ٣٥٤ أو ٣٥٥ يوماً (' + min + '-' + max + ')'); }
{ const t = C.MIN, n = C.nextHijri(t, 9, 1), h = C.jdToHijri(n); ok(n >= t && h.m === 9 && h.d === 1 && n - t < 400, 'أول رمضان القادم'); }
ok(C.jdStr(C.MIN).includes('هـ') && C.jdStr(C.MIN).includes('2026م'), 'نص التاريخ الهجري والميلادي');
ok(C.yearName(1) === 'السنة الأولى' && C.yearName(3) === 'السنة الثالثة' && C.yearName(10) === 'السنة العاشرة' && C.yearName(11) === 'السنة 11', 'أسماء السنوات');
// تاريخ البداية
{ const S = mk(3); const d0 = E.dateOf(S, 0); ok(d0.year === 1 && d0.dayInYear === 1 && d0.jd === C.MIN, 'الافتراضي: ٢٢ أكتوبر ٢٠٢٦ والسنة الأولى');
  ok(A.setStart(S, C.MIN - 1).ok === false, 'لا بداية قبل ٢٢ أكتوبر ٢٠٢٦'); ok(A.setStart(S, C.MAX + 1).ok === false, 'ولا بعد الحد الأعلى');
  const ram = C.nextHijri(C.MIN, 9, 1); const r = A.setStart(S, ram); ok(r.ok !== false && /رمضان/.test(r.msg) && S.cal.jd0 === ram && S.cal.set && !S.learn.datePend, 'ضبط البداية في أول رمضان');
  const d = E.dateOf(S, 0); ok(d.h.m === 9 && d.h.d === 1 && d.year === 1 && d.dayInYear === 1, 'اليوم الأول هو ١ رمضان');
  ok(E.dateOf(S, 29).h.m === 9 && E.dateOf(S, 30).h.m === 10 && E.dateOf(S, 30).h.d <= 1 + 0, 'بعد ٢٩/٣٠ يوماً يبدأ شوال');
  ok(A.setStart(S, ram + 5).ok === false, 'لا تغيير للبداية بعد ضبطها'); }
{ const S = mk(4); S.day = 3; ok(A.setStart(S, C.MIN + 10).ok === false, 'لا تُضبط البداية بعد أن تبدأ الأيام'); }
{ const S = E.newGame(5); ok(A.setStart(S, C.MIN + 10).ok === false, 'لا بداية قبل اختيار الشخصية'); }
// السنوات
{ const S = mk(6); A.setStart(S, C.MIN); const d = E.dateOf(S, 0); const len = d.yearLen;
  ok(len === 354 || len === 355, 'طول سنة الرحلة الأولى ' + len);
  ok(E.dateOf(S, len - 1).year === 1 && E.dateOf(S, len - 1).dayInYear === len, 'آخر يوم في السنة الأولى');
  ok(E.dateOf(S, len).year === 2 && E.dateOf(S, len).dayInYear === 1 && E.dateOf(S, len).yname === 'السنة الثانية', 'اليوم التالي أول السنة الثانية');
  ok(E.dateOf(S, len).h.m === d.h.m && E.dateOf(S, len).h.d === d.h.d, 'السنة الجديدة تبدأ في الذكرى الهجرية نفسها');
  for (let i = 0; i < len + 2; i++) { E.tick(S); S.pause = false; S.learn.eq.length = 0; }
  ok(S.cal.yr === 2 && S.yearLog.length === 1 && S.yearLog[0].n === 1 && S.yearLog[0].nw > 0, 'سُجّلت سنة منتهية وقيمة الثروة');
  ok(S.news.some(n => /بدأت السنة الثانية/.test(n.t)), 'خبر بداية السنة الثانية');
  ok(S.learn.rq.includes('newYear') || S.learn.rseen.newYear >= 1, 'تعليق عمّ سالم عن السنة'); }
// حفظ وترحيل
{ const S = mk(7); A.setStart(S, C.nextHijri(C.MIN, 1, 1)); const L = E.load(E.save(S)); ok(L.cal.jd0 === S.cal.jd0 && L.cal.set, 'الحفظ والتحميل يبقيان تاريخ البداية');
  const o = JSON.parse(E.save(S)); delete o.cal; const O = E.load(JSON.stringify(o)); ok(E.dateOf(O).jd >= C.MIN && E.dateOf(O).year >= 1, 'ترحيل حفظ قديم بلا التقويم'); }
// لا أثر على الروبوتات
{ const B = E.newGame(11); for (let i = 0; i < 400; i++) E.tick(B); ok(!B.yearLog && !B.news.some(n => /بدأت السنة/.test(n.t)), 'لعبة بلا شخصية: لا تقويم ولا أخبار سنوات'); }
// الرياح الموسمية بالتاريخ الميلادي للاعب، ونصف السنة القديم للروبوتات
{ const S = mk(8), G = (y, m, d) => C.gregToJd(y, m, d) - E.dateOf(S, 0).jd;
  S.day = G(2027, 6, 10); ok(E.monsoonOf(S, 'jeddah', 'mumbai').fair === true && E.monsoonOf(S, 'mumbai', 'jeddah').fair === false, 'في يونيو الرياح الجنوبية الغربية: الذهاب شرقاً معك والعودة ضدك');
  S.day = G(2027, 1, 10); ok(E.monsoonOf(S, 'jeddah', 'mumbai').fair === false && E.monsoonOf(S, 'mumbai', 'jeddah').fair === true, 'في يناير الشمالية الشرقية: العودة غرباً معك');
  S.day = G(2027, 4, 1); ok(E.monsoonOf(S, 'jeddah', 'mumbai').fair === true, 'أول أبريل بداية موسم الذهاب'); S.day = G(2027, 9, 30); ok(E.monsoonOf(S, 'jeddah', 'mumbai').fair === true, 'آخر سبتمبر آخر موسم الذهاب'); S.day = G(2027, 10, 1); ok(E.monsoonOf(S, 'jeddah', 'mumbai').fair === false, 'أول أكتوبر يبدأ موسم العودة');
  const B = E.newGame(9); B.day = 0; ok(E.monsoonOf(B, 'jeddah', 'mumbai').fair === true, 'الروبوتات: النصف الأول للذهاب كما كان'); B.day = 200; ok(E.monsoonOf(B, 'jeddah', 'mumbai').fair === false, 'والنصف الثاني للعودة'); }
console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
