/* ---------- التقويم: كل يوم في اللعبة يقابل يوماً حقيقياً يبدأ من تاريخ يختاره اللاعب ----------
   الميلادي بحساب اليوليان، والهجري بالتقويم الحسابي (المدني)، وقد يخالف رؤية الهلال بيوم أو يومين فيُذكر للاعب أنه تقريبي.
   السنة في رحلة اللاعب: من يوم البداية إلى الذكرى الهجرية التالية له (354 أو 355 يوماً). لا أثر على الروبوتات ولا على الاقتصاد. */
const HMONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const GMONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const YORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
function gregToJd(y, m, d) { const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045; }
function jdToGreg(jd) { const a = jd + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4), d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153); return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 }; }
const hijriToJd = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439;
function jdToHijri(jd) {
  let l = jd - 1948440 + 10632; const n = Math.floor((l - 1) / 10631); l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor(50 * l / 17719) + Math.floor(l / 5670) * Math.floor(43 * l / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const m = Math.floor(24 * l / 709); return { y: 30 * n + j - 30, m, d: l - Math.floor(709 * m / 24) };
}
const CAL = { MIN: gregToJd(2026, 10, 22), MAX: gregToJd(2099, 12, 31) }; // لا تبدأ الرحلة بتاريخ أقدم من هذا
const hStr = h => h.d + ' ' + HMONTHS[h.m - 1] + ' ' + h.y + ' هـ', gStr = g => g.d + ' ' + GMONTHS[g.m - 1] + ' ' + g.y + 'م';
const jdStr = jd => hStr(jdToHijri(jd)) + ' · ' + gStr(jdToGreg(jd));
const yearName = n => 'السنة ' + (n >= 1 && n <= YORD.length ? YORD[n - 1] : n);
const calOf = S => S.cal || (S.cal = { jd0: CAL.MIN, yr: 1 });
function dateOf(S, day) {
  const c = calOf(S), jd0 = c.jd0, jd = jd0 + (day == null ? S.day : day), h = jdToHijri(jd), g = jdToGreg(jd), h0 = jdToHijri(jd0);
  const ann = k => hijriToJd(h0.y + k, h0.m, h0.d); let k = h.y - h0.y; while (ann(k) > jd) k--; while (ann(k + 1) <= jd) k++;
  const s = ann(k), e = ann(k + 1);
  return { jd, h, g, hs: hStr(h), gs: gStr(g), year: k + 1, yname: yearName(k + 1), dayInYear: jd - s + 1, yearLen: e - s, yearStart: s };
}
/* أول تاريخ هجري (شهر ويوم) من jd فصاعداً */
function nextHijri(jd, m, d) { for (let i = 0; i < 400; i++) { const h = jdToHijri(jd + i); if (h.m === m && h.d === d) return jd + i; } return jd; }
function calDay(S) {
  const L = S.learn; if (!L || !L.char || !S.cal) return;
  const c = S.cal, d = dateOf(S); if (c.yr == null) c.yr = d.year;
  if (d.year <= c.yr) return;
  S.yearLog = S.yearLog || []; const nw = Math.round(netWorth(S)), prev = S.yearLog.length ? S.yearLog[S.yearLog.length - 1].nw : null;
  for (let n = c.yr; n < d.year; n++) S.yearLog.push({ n, nw, day: S.day });
  c.yr = d.year;
  news(S, 'طويتَ سنةً من رحلتك، وبدأت ' + d.yname + ' (' + d.hs + '). ثروتك الآن ≈ ' + nw + ' ريال' + (prev != null ? '، وكانت ' + prev + ' في آخر السنة التي قبلها' : '') + '.', 'good');
  learnReact(S, 'newYear', 1);
}
