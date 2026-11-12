/* ---------- ثروة المنافسين ورئيس التجار (040ح؛ قرار بن محمود 2026-11-10) ----------
   لكل منافس ثروة rv.w (ريال) تُحدَّث شهرياً: ربح (معدل × ثروة × ازدهار المدينة × ما بقي من طاقتها + حصة من الطلب) − نفقات − خسائر (أزمة المدينة ومصيبة بذرية)؛
   دون خط الإفلاس يخرج بخبر. القوة rv.str تُعاد من ترتيب الثروة في مدينته (0.3 للأضعف … 1.0 للأغنى) وبها أثره ومساهمته في الصندوق (كما في 040ج).
   المقاعد: 1–3 لكل مدينة بحسب حجمها وازدهارها بدل الحد العالمي. رئيس التجار: صاحب أعلى ثروة إن تجاوز الثاني بـ15٪ ثلاثين يوماً.
   المعرفة rv.kn (0–3) تحدّد دقة ما يراه اللاعب من الثروة (الحاكم: دقيقة). كل العشوائية من rgHash (بذرة + معرّف + ملح) فلا تمسّ مجاري rnd ولا rgRng إلا في الولادة.
   RIVALW.on=false يعيد 040ج حرفياً: لا rv.w ولا rv.kn ولا G.chief ولا G.ev ولا D.newsNext في الحفظ. */
const RIVALW = { on: true, cap: 250000, rate: 0.12, upkeep: 0.005, dem: 800, founder: [0.15, 0.45], seed: 0.12, floor: 0.04, shockLoss: 0.12, disaster: 0.06, disLoss: [0.3, 0.7], margin: 1.15, hold: 30, gap: [5, 9], hardMax: 54, visit: 60, band: [0.5, 0.25, 0.1, 0], newsEvery: [30, 45], evMax: 40 };
const RG_KN_NAME = ['ضعيفة', 'متوسطة', 'جيدة', 'كاملة'];
const rgW = S => !!(RIVALW.on && RIVALGEN.cont && rgOn(S));
function rgSeats(S) {
  const ids = S.order, pops = ids.map(id => popTotal(S.cities[id])), pa = pops.reduce((a, b) => a + b, 0) / Math.max(1, ids.length), ra = rgProsAvg(S), out = {};
  ids.forEach((id, i) => { out[id] = rgClamp(1 + (pops[i] >= pa ? 1 : 0) + (rgPros(S, id) >= ra ? 1 : 0), 1, 3); }); return out;
}
const rgSeatsTotal = S => { const s = rgSeats(S); return S.order.reduce((a, id) => a + s[id], 0); };
const rgCityN = (S, cid) => (S.rivals || []).filter(rv => rv.out == null && rv.city === cid).length;
const rgFree = (S, cid, seats) => rgCityN(S, cid) < (seats || rgSeats(S))[cid];
const rgProsF = (S, cid) => rgClamp(rgPros(S, cid) / (rgProsAvg(S) || 1), 0.5, 1.5);
const rgK = (S, cid) => RIVALW.cap * (popTotal(S.cities[cid]) / 1400) * (0.6 + 0.4 * rgProsF(S, cid));
function rgWInit(S, rv, repl) { const K = rgK(S, rv.city), f = repl ? RIVALW.seed : RIVALW.founder[0] + RIVALW.founder[1] * rgStr(S, rv, true); rv.w = Math.round(K * f * (0.85 + 0.3 * rgHash(S, rv.id, 41))); rv.kn = 0; }
const rgPresence = (S, cid) => {
  const bs = bossOf(S, cid); if (bs && bs.ruler === 'player') return true; const pr = S.player.props[cid]; if (pr && ((pr.shops && pr.shops.length) || pr.whs)) return true;
  const p = S.cities[cid] && S.cities[cid].pros; return !!(p && p.last != null && S.day - p.last <= RIVALW.visit);
};
/* خبر عادي (دون ناظر) أو بند في أخبار الناظر؛ لا يصل إلا خبر سوق لك فيه حضور */
function rgPost(S, cid, long, short) {
  if (!rgW(S)) { news(S, long); return; } if (!rgPresence(S, cid)) return;
  if (diwanOf(S)) { const G = rgState(S); (G.ev = G.ev || []).push({ d: S.day, c: cid, t: short || long }); if (G.ev.length > RIVALW.evMax) G.ev.shift(); } else news(S, long);
}
/* المعرفة بثروة المنافس الآن (0–3): الحاكم 3؛ غيره: زيارة ≤ 60 يوماً (+1)، قائد «عيون الأسواق» في مدينته (+1)، ناظر الديوان وفي المدينة أصل لك (+1) */
function rgKnowNow(S, rv) {
  const bs = bossOf(S, rv.city); if (bs && bs.ruler === 'player') return 3; let k = 0;
  const p = S.cities[rv.city].pros; if (p && p.last != null && S.day - p.last <= RIVALW.visit) k++;
  if (S.player.caravans.some(c => capRole(c) === 'eyes' && c.left === 0 && c.city === rv.city)) k++;
  if (diwanOf(S) && S.player.props[rv.city]) k++;
  return Math.min(3, k);
}
function rgKnowDay(S) { // الذاكرة ترتفع فوراً وتنقص درجة كل شهر بعد زوال مصدرها
  for (const rv of (S.rivals || [])) { if (rv.out != null || rv.w == null) continue; const now = rgKnowNow(S, rv), m = rv.kn || 0;
    if (now > m) rv.kn = now; else if (now < m && S.day % PR.month === 0) rv.kn = Math.max(now, m - 1); }
}
function rgWealthMonth(S) {
  const al = (S.rivals || []).filter(rv => rv.out == null && S.cities[rv.city]), by = {};
  for (const rv of al) if (rv.w == null) rgWInit(S, rv, false);
  for (const rv of al) {
    const cid = rv.city, c = S.cities[cid], K = rgK(S, cid), st = rgStr(S, rv, true), sk = 0.6 + 0.8 * rgHash(S, rv.id, 31), n = Math.max(1, rgCityN(S, cid));
    const luck = 0.5 + rgHash(S, rv.id, S.day + 300000), gain = RIVALW.rate * rv.w * Math.max(0, 1 - rv.w / K) * sk * luck * rgProsF(S, cid) * (0.5 + st) + RIVALW.dem * popTotal(c) / 1000 * st / n; // حظ شهري 0.5–1.5
    let loss = RIVALW.upkeep * K; if (rgShock(S, cid)) loss += rv.w * RIVALW.shockLoss * (1.3 - st);
    if (rgHash(S, rv.id, S.day + 100000) < RIVALW.disaster) loss += rv.w * (RIVALW.disLoss[0] + (RIVALW.disLoss[1] - RIVALW.disLoss[0]) * rgHash(S, rv.id, S.day + 200000));
    rv.w = Math.max(0, Math.round(rv.w + gain - loss));
    if (rv.w < RIVALW.floor * K) { rv.out = S.day; rv.fate = 0; rgPost(S, cid, rv.name + ' أفلس وخرج من سوق ' + c.name + ' بعد خسائر متتالية.', rv.name + ' أفلس في سوق ' + c.name); continue; }
    (by[cid] = by[cid] || []).push(rv);
  }
  for (const cid in by) { const L = by[cid].sort((a, b) => b.w - a.w || a.id - b.id), n = L.length, K = rgK(S, cid);
    L.forEach((rv, i) => { rv.str = 0.3 + 0.7 * (n > 1 ? (n - 1 - i) / (n - 1) : rgClamp(rv.w / K, 0, 1)); const I = RG_IDEAS.find(x => x.id === rv.idea); if (rv.fx && rv.fx.cont && I) rv.fx.mul = rgClamp(I.mul * rv.str, -RIVALGEN.cap, RIVALGEN.cap); }); }
  rgChiefMonth(S, by);
}
const rgChiefSt = (S, cid) => { const G = rgState(S); return (G.chief && G.chief[cid]) || null; };
function rgChiefMonth(S, by) {
  const G = rgState(S), ch = G.chief || (G.chief = {});
  for (const cid of S.order) {
    const L = by[cid] || [], st = ch[cid] || (ch[cid] = { id: 0, nm: '', cand: 0, cd: 0 }), nm = S.cities[cid].name, top = L[0], ok = !!top && (L.length === 1 || top.w >= L[1].w * RIVALW.margin), cur = st.id ? L.find(r => r.id === st.id) : null;
    if (st.id && !cur) { rgPost(S, cid, 'خلا منصب رئيس التجار في سوق ' + nm + ' بخروج ' + st.nm + '.', 'خلا منصب رئيس التجار في ' + nm); st.id = 0; st.nm = ''; }
    if (ok && (!cur || top.id !== cur.id)) {
      if (st.cand === top.id && S.day - st.cd >= RIVALW.hold) { const was = st.nm; st.id = top.id; st.nm = top.name; st.cand = 0;
        rgPost(S, cid, was && cur ? top.name + ' أخذ منصب رئيس التجار في سوق ' + nm + ' من ' + was + '.' : top.name + ' صار رئيس التجار في سوق ' + nm + '.', was && cur ? top.name + ' خلف ' + was + ' رئيساً للتجار في ' + nm : top.name + ' رئيس التجار في ' + nm); }
      else if (st.cand !== top.id) { st.cand = top.id; st.cd = S.day; }
    } else st.cand = 0;
  }
}
function rgNewsDay(S) { // أخبار الأسواق للناظر: تقرير لا يشغل خانة كل 30–45 يوماً
  const D = diwanOf(S), G = rgState(S); if (!D) { if (G.ev && G.ev.length) G.ev = []; return; }
  if (D.newsNext == null) D.newsNext = S.day + RIVALW.newsEvery[0]; if (S.day < D.newsNext) return;
  const ev = (G.ev || []).filter(e => e.d > (D.newsLast || -1)); D.newsLast = S.day; D.newsNext = S.day + RIVALW.newsEvery[0] + Math.floor(rgHash(S, 77, S.day) * (RIVALW.newsEvery[1] - RIVALW.newsEvery[0] + 1)); G.ev = [];
  if (!ev.length) return; const txt = ev.slice(0, 4).map(e => e.t).join('؛ ') + (ev.length > 4 ? '؛ و' + (ev.length - 4) + ' أخرى' : '') + '.';
  diwanLog(S, D, 'news', null, 'أخبار الأسواق: ' + txt, 0); news(S, 'ناظر الديوان: أخبار الأسواق: ' + txt);
}
function rgWDay(S) { // يومياً: المعرفة والأخبار؛ شهرياً: الثروة
  if (S.day > 0 && S.day % PR.month === 0) rgWealthMonth(S);
  rgKnowDay(S); rgNewsDay(S);
}
function rgRound(x) { const s = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, x))) - 1)); return Math.round(x / s) * s; }
/* ما يراه اللاعب من الثروة: دقيق للحاكم (kn=3)، وإلا نطاق يضيق بالمعرفة وتثبّت إزاحته بذرة المنافس شهراً */
function rgWView(S, rv) {
  if (rv.w == null) return null; const bs = bossOf(S, rv.city), mine = !!(bs && bs.ruler === 'player'), kn = mine ? 3 : Math.max(rv.kn || 0, rgKnowNow(S, rv)), b = RIVALW.band[kn];
  if (!b) return { kn, knName: RG_KN_NAME[kn], exact: true, v: rv.w, lo: rv.w, hi: rv.w };
  const s = (rgHash(S, rv.id, 60 + Math.floor(S.day / PR.month)) - 0.5) * b;
  return { kn, knName: RG_KN_NAME[kn], exact: false, v: null, lo: rgRound(Math.max(0, rv.w * (1 + s - b))), hi: rgRound(rv.w * (1 + s + b)) };
}
const rivalChiefOf = (S, cid) => { const st = rgW(S) ? rgChiefSt(S, cid) : null; const rv = st && st.id ? (S.rivals || []).find(r => r.id === st.id && r.out == null) : null; return rv ? { id: rv.id, name: rv.name, wealth: rgWView(S, rv) } : null; };
/* حقول إضافية في rivalGenView (040ح): لا يتغيّر شيء مما تقرؤه 042؛ الثروة الدقيقة لا تُكشف إلا عند kn=3 */
function rgWExtra(S, rv) {
  const w = rgWView(S, rv); if (!w) return {}; const L = (S.rivals || []).filter(r => r.out == null && r.city === rv.city && r.w != null), tot = L.reduce((a, r) => a + r.w, 0), st = rgChiefSt(S, rv.city);
  return { cid: rv.city, wealth: w, chief: !!(st && st.id === rv.id), share: tot > 0 ? Math.round(100 * rv.w / tot) : 0, wrank: L.filter(r => r.w > rv.w || (r.w === rv.w && r.id < rv.id)).length + 1, str100: Math.round((rgStr(S, rv, true)) * 100) };
}
