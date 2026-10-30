/* ---------- المواسم: مربوطة بالتاريخ الحقيقي. الدينية والتاريخية بالتاريخ الهجري (h: شهر، يوم، شهر، يوم)، والطبيعية بالميلادي (g)،
   فرمضان في رمضان والحج في ذي الحجة. تغيّر الطلب على سلع بعينها، وإشعار قبلها بثلاثة أيام. تعمل في لعبة التعلّم من المستوى 4 كالصدمات.
   المواعيد والأسواق التاريخية معتمدة من المختص الشرعي والتاريخي. قد يتزامن موسمان (الحج وعيد الأضحى مثلاً) فيجتمع أثرهما ---------- */
const YEAR = 354, MUSLIM = new Set(['sa', 'eg', 'ir']);
const HEJAZ = c => ['mecca', 'medina', 'jeddah'].includes(c.id), MKT_GOODS = ['leather', 'camel', 'horse', 'textile', 'wool', 'perfume'];
const SEASONS = {
  harvest: { name: 'موسم الحصاد', g: [4, 15, 6, 15], mul: 1.25, prod: true, desc: 'الغلال والخامات أوفر وأرخص' },
  winter: { name: 'برد الشتاء', g: [12, 1, 2, 28], mul: 1.25, goods: ['wool', 'leather', 'textile', 'wood'], where: () => true, desc: 'يشتد الطلب على الصوف والجلود والحطب' },
  shaban: { name: 'استعداد رمضان', h: [8, 16, 8, 30], mul: 1.15, goods: ['dates', 'wheat', 'rice', 'sugar', 'honey', 'oliveoil', 'raisins'], where: c => MUSLIM.has(c.country), desc: 'تتزوّد الأسواق بمؤن رمضان وتمره في النصف الثاني من شعبان' },
  ramadan: { name: 'شهر رمضان', h: [9, 1, 9, 30], mul: 1.3, goods: ['dates', 'honey', 'sugar', 'rice', 'wheat', 'oliveoil', 'cheese', 'raisins', 'eggs'], where: c => MUSLIM.has(c.country), desc: 'يرتفع الطلب على التمر والسكر والعسل والأرز في بلاد المسلمين' },
  fitr: { name: 'عيد الفطر', h: [10, 1, 10, 3], mul: 1.25, goods: ['textile', 'perfume', 'jewelry', 'sugar', 'honey', 'carpet', 'incense'], where: () => true, desc: 'هدايا وكسوة وحلوى، فيزداد الطلب على النسيج والعطور والمجوهرات' },
  rajab: { name: 'شهر رجب الحرام', h: [7, 1, 7, 30], mul: 1, info: true, desc: 'شهر حرام فرد في وسط العام، كانت العرب تعتمر فيه وتقصد أسواقه (كسوق حُباشة في تهامة) وتأمن فيه القوافل' },
  ukaz: { name: 'سوق عكاظ', h: [11, 1, 11, 20], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم كانت القبائل تجتمع فيه قبل موسم الحج للتجارة والشعر، فيكثر الطلب على الجلود والإبل والخيل والنسيج في الحجاز' },
  majanna: { name: 'سوق مَجَنّة', h: [11, 20, 11, 30], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم يلي عكاظ في أواخر ذي القعدة بأسفل مكة المكرمة، فتتابع القبائل تجارتها قبل الحج' },
  majaz: { name: 'سوق ذي المجاز', h: [12, 1, 12, 8], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم يقام في مطلع ذي الحجة قرب عرفات، وبعده يبدأ الحج' },
  hajj: { name: 'موسم الحجيج', h: [12, 8, 12, 13], mul: 1.35, boost: { mecca: 1.2, medina: 1.15 }, goods: ['wheat', 'dates', 'textile', 'incense', 'perfume', 'raisins', 'honey'], where: c => c.country === 'sa', desc: 'يزدحم الحجاز بالزوّار فيكثر الطلب على القوت والعطور والنسيج في السعودية، وأشدّه في مكة المكرمة والمدينة المنورة' },
  adha: { name: 'عيد الأضحى وأيام النحر', h: [12, 10, 12, 13], mul: 1.3, goods: ['sheep', 'goat', 'camel', 'cow', 'buffalo'], where: c => MUSLIM.has(c.country), desc: 'يكثر الطلب على الغنم والماعز والإبل والبقر والجاموس للأضاحي في بلاد المسلمين' },
};
const MARKETS_NOTE = 'هذه محاكاة لأسواق العرب الكبرى التي اشتهرت في تاريخ الحجاز (عكاظ، ومجنّة، وذو المجاز)، وكانت ترتحل فيها القوافل بالترتيب مع اقتراب موسم الحج.';
const SACRED_NEWS = 'دخلت الأشهر الحُرُم (ذو القعدة، ذو الحجة، محرم، ورجب)؛ وفيها وضعت العرب السلاح قديماً وعظّم الإسلام حرمتها، فتأمن القوافل ويقل خطر قطّاع الطرق.';
const SACRED_RISK = 0.5; // في الجزيرة العربية يهبط خطر قطّاع الطرق إلى النصف في الأشهر الحرم
const seasonsOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const inSpan = (m, d, r) => { const x = m * 100 + d, a = r[0] * 100 + r[1], b = r[2] * 100 + r[3]; return a <= b ? x >= a && x <= b : x >= a || x <= b; };
let _sc = { S: null, k: '', keys: [] };
/* المواسم القائمة في يوم معيّن (بترتيب التعريف) */
function seasonsAt(S, day) {
  const key = (S.cal ? S.cal.jd0 : 0) + ':' + day;
  if (_sc.S === S && _sc.k === key) return _sc.keys;
  const dt = dateOf(S, day), keys = [];
  for (const k in SEASONS) { const X = SEASONS[k]; if (X.h ? inSpan(dt.h.m, dt.h.d, X.h) : inSpan(dt.g.m, dt.g.d, X.g)) keys.push(k); }
  _sc = { S, k: key, keys }; return keys;
}
const seasonAt = (S, day) => { const k = seasonsAt(S, day == null ? S.day : day); return k.length ? k[k.length - 1] : null; }; // الأخصّ (آخر المتزامنة)
const seasonActive = (S, k) => seasonsOn(S) && seasonsAt(S, S.day).includes(k);
function seasonLeft(S, k) { let n = 0; while (n < 60 && seasonsAt(S, S.day + n).includes(k)) n++; return n; }
function seasonNow(S) { if (!seasonsOn(S)) return null; const k = seasonAt(S, S.day); return k ? { k, left: seasonLeft(S, k), also: seasonsAt(S, S.day).filter(x => x !== k).map(x => SEASONS[x].name), ...SEASONS[k] } : null; }
function seasonNext(S) { if (!seasonsOn(S)) return null; const now = seasonsAt(S, S.day); for (let i = 1; i <= 12; i++) { const ks = seasonsAt(S, S.day + i).filter(k => !now.includes(k) && !seasonsAt(S, S.day + i - 1).includes(k)); if (ks.length) return { k: ks[0], in: i, ...SEASONS[ks[0]] }; } return null; }
function seasonMul(S, c, g) {
  if (!seasonsOn(S)) return 1; let m = 1;
  seasonsAt(S, S.day).forEach(k => { const X = SEASONS[k]; if (X.goods && X.goods.includes(g) && X.where(c)) m *= X.mul * ((X.boost && X.boost[c.id]) || 1); });
  return m;
}
/* تقويم المواسم القادمة (للنافذة): أقرب بداية لكل موسم خلال سنة */
function seasonCalendar(S) {
  const out = [], now = seasonsAt(S, S.day);
  for (const k in SEASONS) {
    if (now.includes(k)) { out.push({ k, now: true, in: 0, left: seasonLeft(S, k), ...SEASONS[k] }); continue; }
    for (let i = 1; i <= 400; i++) if (seasonsAt(S, S.day + i).includes(k) && !seasonsAt(S, S.day + i - 1).includes(k)) { out.push({ k, now: false, in: i, jd: dateOf(S, S.day + i).jd, ...SEASONS[k] }); break; }
  }
  return out.sort((a, b) => a.in - b.in);
}
const isSacred = (S, day) => { const h = dateOf(S, day == null ? S.day : day).h; return h.m === 11 || h.m === 12 || h.m === 1 || h.m === 7; };
/* خطر الطريق في الأشهر الحرم: بين مدينتين في الجزيرة العربية، للاعب فقط */
const sacredMul = (S, a, b) => seasonsOn(S) && S.cities[a].country === 'sa' && S.cities[b].country === 'sa' && isSacred(S) ? SACRED_RISK : 1;
function seasonDay(S) {
  if (!seasonsOn(S)) return; const now = seasonsAt(S, S.day), was = seasonsAt(S, S.day - 1);
  seasonGoalDay(S, now, was);
  now.filter(k => !was.includes(k)).forEach(k => {
    const X = SEASONS[k]; news(S, 'بدأ ' + X.name + ': ' + X.desc + '.', 'good'); learnReact(S, 'seasonStart', 10);
    if (k === 'ukaz') news(S, MARKETS_NOTE, 'rumor');
    if (k === 'hajj') news(S, 'وصلت قوافل الحجيج من مصر والشام والعراق واليمن إلى الحجاز، وازدحمت أسواق مكة المكرمة والمدينة المنورة.', 'rumor');
  });
  const s1 = isSacred(S, S.day), s0 = isSacred(S, S.day - 1); if (s1 && !s0) news(S, SACRED_NEWS, 'rumor');
  const h = dateOf(S).h; if (h.m === 1 && h.d === 10) news(S, 'يوم عاشوراء (10 محرم): من الأيام الفاضلة في مطلع السنة الهجرية.', 'rumor');
  const a = seasonsAt(S, S.day + 3), b = seasonsAt(S, S.day + 2);
  a.filter(k => !b.includes(k)).forEach(k => news(S, 'يقترب ' + SEASONS[k].name + ' بعد 3 أيام: ' + SEASONS[k].desc + '.', 'rumor'));
}

/* ---------- أهداف المواسم (WP-23): هدف مشتق لكل موسم وجائزة تجميلية فقط (زخرفة ولقب)، بلا ذهب ولا نفوذ ولا خصم.
   الحقل الاختياري S.seasonGoals = { y: السنة الهجرية، done: ما أُنجز في الحول، seen: ما عُرض في الحول، cur: [{k, need, got, day}]، deco: {موسم: يوم} (دائم) }.
   مفتاح الرجوع SEASON_GOALS.on=false: لا هدف ولا عدّ ولا حقل. المواسم الدينية الستة معرّفاتها في السجل SG-01..06 وتبقى مخفية بـreview-flags حتى يعتمد المختص ---------- */
const SEASON_GOALS = { on: true };
const SG_ID = { shaban: 'SG-01', ramadan: 'SG-02', fitr: 'SG-03', hajj: 'SG-04', adha: 'SG-05', rajab: 'SG-06' }, SG_ART = { shaban: 'ramadan_prep', fitr: 'eid_fitr', ukaz: 'okaz', majaz: 'dhul_majaz' };
const sgArt = k => 'seasons/' + (SG_ART[k] || k), sgHidden = k => !!SG_ID[k] && REVF.reviewHidden(SG_ID[k]);
const sgKeys = () => Object.keys(SEASONS);
function seasonGoalDef(S, k, need) {
  const X = SEASONS[k]; if (!X) return null; const L = S && S.learn, lv = L ? L.level : 4; need = need != null ? need : clamp(10 * lv, 10, 120);
  const raw = X.prod ? (g => GD[g] && (GD[g].tier === 'raw' || g === 'wheat')) : null, goods = X.goods ? (g => X.goods.includes(g)) : null;
  const verb = X.prod ? 'buy' : 'sell', where = X.where || (() => true);
  const u = typeof need === 'number' && need <= 10 ? 'وحدات' : 'وحدة';
  const text = X.prod ? 'اشترِ ' + need + ' ' + u + ' من الغلال والخامات في ' + X.name : X.goods ? 'بع ' + need + ' ' + u + ' من سلع ' + X.name + ' في أسواقه' : 'بع ' + need + ' ' + u + ' من سلعك في أسواق ' + X.name;
  return { k, name: X.name, need, verb, goods: raw || goods, where, text, title: 'تاجر ' + X.name, art: sgArt(k), id: SG_ID[k] || null };
}
function seasonGoalDrain(S) {
  const L = S.learn; if (!L || !L.sgq || !L.sgq.length) return;
  for (const it of L.sgq.splice(0)) { const d = seasonGoalDef(S, it.k, it.need); if (d) news(S, 'هدف ' + d.name + ': ' + d.text + ' قبل أن ينتهي الموسم؛ جائزتك زخرفة ولقب «' + d.title + '».', 'good'); }
}
function seasonGoalDay(S, now, was) {
  if (!SEASON_GOALS.on) return; const L = S.learn; let G = S.seasonGoals; const y = dateOf(S).h.y;
  if (G && G.y !== y) { G.y = y; G.done = {}; G.seen = {}; }
  if (G && G.cur) G.cur = G.cur.filter(c => now.includes(c.k)); // انتهى الموسم: يزول الهدف بلا عقوبة
  for (const k of now.filter(x => !was.includes(x))) {
    if (sgHidden(k)) continue; G = G || (S.seasonGoals = { y, done: {}, seen: {}, cur: [], deco: {} });
    if (G.seen[k] || G.done[k]) continue; const d = seasonGoalDef(S, k); G.seen[k] = S.day; G.cur.push({ k, need: d.need, got: 0, day: S.day });
    L.sgq = L.sgq || []; schedQ(S, 'sgq', { k, need: d.need });
  }
  seasonGoalDrain(S);
}
function seasonGoalDone(S, c) {
  const G = S.seasonGoals; G.cur = G.cur.filter(x => x !== c); G.done[c.k] = S.day; (G.deco = G.deco || {})[c.k] = G.deco[c.k] || S.day; const d = seasonGoalDef(S, c.k, c.need);
  news(S, 'نلتَ زخرفة ' + d.name + ' ولقب «' + d.title + '» لإتمامك هدف الموسم.', 'good');
}
/* عدّ تقدّم الهدف من بيع/شراء اللاعب (من learnEvent)؛ لا يغيّر سعراً ولا ذهباً */
function seasonGoalHit(S, k, args, r) {
  if (!SEASON_GOALS.on) return; const G = S.seasonGoals; if (!G || !G.cur || !G.cur.length || !r || !r.n) return;
  const car = carById(S, args[0]); if (!car) return; const city = S.cities[car.city];
  for (const c of G.cur.slice()) {
    if (!seasonActive(S, c.k)) continue; const d = seasonGoalDef(S, c.k, c.need); if (d.verb !== k || (d.goods && !d.goods(args[1])) || !d.where(city)) continue;
    c.got = Math.min(c.need, c.got + r.n); if (c.got >= c.need) seasonGoalDone(S, c);
  }
}
/* ما يعرضه اللاعب: الأهداف الجارية، والزخارف المنالة (الدائمة)، وآخر زخرفة */
function seasonGoalView(S) {
  const G = S.seasonGoals || null, cur = G ? (G.cur || []).filter(c => seasonActive(S, c.k)).map(c => ({ ...c, left: seasonLeft(S, c.k), ...seasonGoalDef(S, c.k, c.need) })) : [];
  const deco = G && G.deco ? Object.keys(G.deco).map(k => ({ k, day: G.deco[k], ...seasonGoalDef(S, k) })).sort((a, b) => a.day - b.day) : [];
  return { on: SEASON_GOALS.on, cur, deco, last: deco.length ? deco[deco.length - 1] : null, all: sgKeys().filter(k => !sgHidden(k)).map(k => seasonGoalDef(S, k)) };
}
