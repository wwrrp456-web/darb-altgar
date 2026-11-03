/* ---------- المشاريع الكبرى (WP-22، الحزمة 015ب): وجهة للفائض بسلّم من 250 ألفاً إلى عشرة مليارات ----------
   التصميم المعتمد: docs/goals/LADDER.md. الدرجة تُفتح بأعلى ثروة بلغها اللاعب (peak) فلا يُقفلها الإنفاق. المشروع مراحل تُدفع كاملة ثم تجري مدة إنشاء
   لا يسرّعها المال. الإنفاق مصرف نهائي (sink). الأثر حتمي معتدل بسقف في جدول PJ_CAP يُقرأ عبر projectMul/projectAdd من نقاط تعديل قائمة.
   الحفظ: S.projects اختياري ولا يُنشأ قبل بلوغ أول عتبة؛ PROJ.on=false يعيد السلوك القديم حرفياً (لا قسم ولا أثر ولا حقل جديد).
   المشاريع الموسومة rv تنتظر المختص (docs/review/batches/09-projects.md): مخفية وغير قابلة للتمويل ما دام معرّفها في review-flags. */
const PROJ = { on: true };
const PJ_TIERS = [250000, 1000000, 5000000, 25000000, 100000000, 500000000, 1000000000, 3000000000, 10000000000];
const PJ_STEP = 3; // الثروة تُفحص كل 3 أيام (peak)
// pick: city مدينة · port ميناء · country دولة · route طريق بين مدينتين؛ fx: k المفتاح وmul المعامل (أو add) وsc النطاق (city أو cc دولة المدينة المختارة أو country أو route أو all)
const PROJECTS = {
  P19: { tier: 1, name: 'لوحة أسعار السوق', text: 'لوحة معلنة بالأسعار تجذب الزبائن إلى دكاكينك في مدينة تختارها.', stages: [15000, 15000], days: 8, pick: 'city', fx: [{ k: 'shop', mul: 1.03, sc: 'city' }], dim: { trade: 2 }, eff: 'إقبال دكاكينك في المدينة +3٪' },
  P20: { tier: 1, name: 'محطة استراحة على الطريق', text: 'محطة صغيرة يستريح فيها الركب على طريق تختاره، فيقلّ تعرّض قوافلك للّصوص.', stages: [20000, 20000], days: 8, pick: 'route', fx: [{ k: 'risk', mul: 0.9, sc: 'route' }], dim: { sec: 3 }, eff: 'خطر هجوم اللصوص على الطريق ×0.9' },
  P01: { tier: 2, name: 'خان على الطريق', text: 'الخان: نُزُل تأوي إليه القوافل على الطريق قديماً. تبنيه على طريق تختاره فيقلّ خطر اللصوص فيه في الاتجاهين.', stages: [40000, 40000, 40000, 40000], days: 12, pick: 'route', fx: [{ k: 'risk', mul: 0.75, sc: 'route' }], dim: { sec: 8 }, eff: 'خطر هجوم اللصوص على الطريق ×0.75' },
  P02: { tier: 2, rv: 'PJ-01', name: 'ساحة السوق ومورد مائه', text: 'ساحة السوق ومورد مائه: ساحة مرتّبة في السوق فيها مورد ماء، يرتاح بها أهل المدينة وتخفّ أضرار الأمراض فيها.', stages: [40000, 40000, 40000], days: 10, pick: 'city', fx: [{ k: 'ev', mul: 0.9, sc: 'city' }], once: { trust: 10 }, dim: { health: 6, trade: 3 }, eff: 'ثقة زعيم المدينة +10 مرة واحدة، وأثر المرض والقحط ×0.9' },
  P03: { tier: 3, name: 'مدرسة التجّار', text: 'مدرسة تدرّب طاقمك في دولة المدينة التي تختارها فتتراكم خبرتهم أسرع.', stages: [150000, 150000, 150000, 150000], days: 20, pick: 'city', fx: [{ k: 'xp', mul: 1.15, sc: 'cc' }], dim: { sci: 10 }, eff: 'خبرة طاقمك في دولتها تتراكم +15٪ أسرع' },
  P04: { tier: 3, name: 'السوق المسقوف', text: 'سوق مسقوف يقبل عليه الناس في كل الفصول، في مدينة تختارها.', stages: [150000, 150000, 200000], days: 20, pick: 'city', fx: [{ k: 'shop', mul: 1.08, sc: 'city' }], dim: { trade: 8, urban: 4 }, eff: 'إقبال دكاكينك في المدينة +8٪' },
  P05: { tier: 4, name: 'توسعة ميناء', text: 'توسعة الميناء: زيادة رصيف السفن وحراسته في ميناء من موانئك السبعة، فتقلّ رسومه ويقلّ خطر القراصنة.', stages: [500000, 500000, 500000, 500000, 500000], days: 25, pick: 'port', fx: [{ k: 'portfee', mul: 0.85, sc: 'city' }, { k: 'pirate', mul: 0.8, sc: 'city' }], dim: { trade: 6, sec: 6 }, eff: 'رسوم الرسو ×0.85، وخطر القراصنة على السفن الداخلة ×0.8' },
  P06: { tier: 4, rv: 'PJ-02', name: 'البيمارستان (المستشفى)', text: 'البيمارستان: المستشفى في الحضارة الإسلامية، يُعالَج فيه المرضى. تبنيه في مدينة فتخفّ به نوبات المرض والقحط.', stages: [500000, 500000, 500000, 500000], days: 30, pick: 'city', fx: [{ k: 'ev', mul: 0.7, sc: 'city' }], dim: { health: 12 }, eff: 'شدة المرض والقحط في المدينة ×0.7' },
  P07: { tier: 5, name: 'الطريق المعبَّد', text: 'الطريق المعبَّد: طريق مرصوف مهيَّأ للسير. تبنيه بين مدينتين من دولتين متجاورتين فيقصر زمن الرحلة ويقلّ خطره.', stages: [1200000, 1600000, 1600000, 1600000, 2000000], days: 30, pick: 'route', adj: true, fx: [{ k: 'days', mul: 0.9, sc: 'route' }, { k: 'risk', mul: 0.9, sc: 'route' }], dim: { trade: 8, sec: 4 }, eff: 'زمن الرحلة على الطريق ×0.9 وخطره ×0.9' },
  P09: { tier: 5, name: 'دار العيار', text: 'دار العيار: دار تُضبط فيها المكاييل والموازين وتُوثَّق، فيثق التجّار بالسوق. تزيد ثقة زعماء دولة تختارها بك.', stages: [2000000, 2000000, 2000000], days: 20, pick: 'country', fx: [{ k: 'trustgrow', mul: 1.1, sc: 'country' }], dim: { trade: 4, lit: 4 }, eff: 'ثقة الزعماء بهداياك وعقودك تنمو +10٪ أسرع في الدولة' },
  P11: { tier: 6, name: 'دار الصناعة', text: 'دار الصناعة: ورش كبرى يتعلم فيها الصنّاع صنعتهم. تبنيها في دولة تختارها فترتفع جودة مصانعك فيها.', stages: [10000000, 10000000, 10000000, 10000000], days: 30, pick: 'country', fx: [{ k: 'qual', add: 3, sc: 'country' }], dim: { sci: 8, urban: 6 }, eff: 'جودة مصانعك في الدولة +3 نقاط' },
  P13: { tier: 7, rv: 'PJ-03', name: 'الجامعة والمكتبة الكبرى', text: 'الجامعة والمكتبة الكبرى: مكان للتعلّم وجمع الكتب. تبنيها في مدينة تختارها فيتعلم بها طاقمك أسرع.', stages: [30000000, 30000000, 30000000, 30000000], days: 45, pick: 'city', fx: [{ k: 'xp', mul: 1.1, sc: 'cc' }], dim: { sci: 15, lit: 12 }, eff: 'خبرة طاقمك في دولتها +10٪ إضافية' },
  P14: { tier: 8, name: 'شبكة الخانات', text: 'شبكة الخانات: خانات متصلة على طرق دولة كاملة (والخان نُزُل تأوي إليه القوافل). تمدّ بها خاناتك على طرقها، ويشترط إتمام «خان على الطريق».', stages: [60000000, 60000000, 60000000, 60000000, 60000000], days: 40, pick: 'country', need: 'P01', fx: [{ k: 'risk', mul: 0.85, sc: 'country' }], dim: { sec: 6 }, eff: 'خطر اللصوص على كل طرق الدولة ×0.85' },
  P15: { tier: 8, rv: 'PJ-04', name: 'دار الترجمة والنسخ', text: 'دار الترجمة والنسخ: مكان تُنقل فيه الكتب من لغة إلى أخرى وتُنسخ باليد. تبنيها في مدينة فتُقبل أسواقها على السلع الفاخرة.', stages: [62500000, 62500000, 62500000, 62500000], days: 45, pick: 'city', fx: [{ k: 'shop', mul: 1.08, sc: 'city', lux: true }], dim: { lit: 15, sci: 6 }, eff: 'إقبال دكاكينك على السلع الفاخرة في المدينة +8٪' },
};
const PJ_IDS = Object.keys(PROJECTS).sort((a, b) => PROJECTS[a].tier - PROJECTS[b].tier || (a < b ? -1 : 1));
// سقوف الأثر المجمَّع (FR-002): ما بعدها لا يزيد مهما تكرر؛ [الأدنى, الأعلى] للمعامل، وحدّ أعلى للجمع
const PJ_CAP = { shop: [1, 1.1], risk: [0.6, 1], days: [0.85, 1], xp: [1, 1.25], ev: [0.6, 1], trustgrow: [1, 1.15], pirate: [0.7, 1], portfee: [0.8, 1], qual: [0, 4] };
const pjOn = S => !!(PROJ.on && S && S.learn && S.learn.char);
const pjBase = k => String(k).split('#')[0];
const pjHidden = id => !!PROJECTS[pjBase(id)].rv && REVF.reviewHidden(PROJECTS[pjBase(id)].rv);
// يمكن بناء المشروع الواحد أكثر من مرة في أماكن مختلفة (قرار بن محمود 2026-11-03): المثيل الأول مفتاحه المعرّف، والتالي id#2 ... ولا يُبدأ مثيل جديد قبل إتمام السابق؛ والسقوف PJ_CAP تحكم الأثر المجمَّع
const pjKeys = (S, id) => { const p = pjData(S), out = []; if (!p) return out; for (const k of Object.keys(p.paid)) if (pjBase(k) === id) out.push(k); return out.sort((a, b) => (+String(a).split('#')[1] || 1) - (+String(b).split('#')[1] || 1)); };
const pjNextKey = (S, id) => { const ks = pjKeys(S, id), p = pjData(S); const open = ks.find(k => !p.done.includes(k)); if (open) return open; return ks.length ? id + '#' + (ks.length + 1) : id; };
const pjUsedPicks = (S, id, except) => pjKeys(S, id).filter(k => k !== except).map(k => pjData(S).pick[k]).filter(v => v != null);
const pjData = S => (S.projects && typeof S.projects === 'object' ? S.projects : null);
function pjEnsure(S) { if (!S.projects || typeof S.projects !== 'object') S.projects = { peak: 0, paid: {}, until: {}, pick: {}, done: [], tier: 0 }; const p = S.projects; p.paid = p.paid || {}; p.until = p.until || {}; p.pick = p.pick || {}; p.done = p.done || []; return p; }
const pjDone = (S, id) => !!(pjData(S) && pjData(S).done.some(k => pjBase(k) === id));
const pjTier = S => { const p = pjData(S); if (!p) return 0; let t = 0; PJ_TIERS.forEach((w, i) => { if (p.peak >= w) t = i + 1; }); return t; };
const pjCost = id => PROJECTS[pjBase(id)].stages.reduce((a, b) => a + b, 0);
const pjCountry = (S, c) => S.cities[c] ? S.cities[c].country : null;
// هل ينطبق أثر المشروع على السياق؟
function pjMatch(S, id, fx, ctx) {
  const pk = pjData(S).pick[id]; if (pk == null) return false; ctx = ctx || {};
  if (fx.lux && !(ctx.g && GD[ctx.g] && GD[ctx.g].lux)) return false;
  if (fx.sc === 'all') return true;
  if (fx.sc === 'city') return ctx.city === pk;
  if (fx.sc === 'cc') return !!ctx.city && pjCountry(S, ctx.city) === pjCountry(S, pk);
  if (fx.sc === 'route') return !!ctx.from && !!ctx.to && riskKey(ctx.from, ctx.to) === pk;
  if (fx.sc === 'country') { if (ctx.city) return pjCountry(S, ctx.city) === pk; return !!ctx.from && !!ctx.to && (pjCountry(S, ctx.from) === pk || pjCountry(S, ctx.to) === pk); }
  return false;
}
// المعامل المجمَّع لمفتاح أثر (1 إن لا أثر)، بسقفه
function projectMul(S, k, ctx) {
  const pm = prosMul(S, k, ctx); // أثر ازدهار المدينة (016) يُضرب في أثر المشاريع
  if (!pjOn(S) || !pjData(S) || !pjData(S).done.length) return pm; let m = 1;
  for (const id of pjData(S).done) for (const fx of PROJECTS[pjBase(id)].fx) if (fx.k === k && fx.mul && pjMatch(S, id, fx, ctx)) m *= fx.mul;
  const cap = PJ_CAP[k]; return (cap ? Math.min(cap[1], Math.max(cap[0], m)) : m) * pm;
}
function projectAdd(S, k, ctx) {
  const pa = prosAdd(S, k, ctx);
  if (!pjOn(S) || !pjData(S) || !pjData(S).done.length) return pa; let a = 0;
  for (const id of pjData(S).done) for (const fx of PROJECTS[pjBase(id)].fx) if (fx.k === k && fx.add && pjMatch(S, id, fx, ctx)) a += fx.add;
  const cap = PJ_CAP[k]; return (cap ? Math.min(cap[1], Math.max(cap[0], a)) : a) + pa;
}
// مساهمات الأبعاد الدائمة لكل مدينة (تقرؤها حزمة ازدهار المدن 016؛ لا أثر لها هنا)
function projectContrib(S) {
  const out = {}; if (!PROJ.on || !pjData(S)) return out;
  for (const id of pjData(S).done) { const pk = pjData(S).pick[id], d = PROJECTS[pjBase(id)].dim || {}, pt = PROJECTS[pjBase(id)].pick;
    const cities = pt === 'country' ? S.order.filter(c => pjCountry(S, c) === pk) : pt === 'route' ? String(pk).split('|') : [pk];
    for (const c of cities) { const o = out[c] || (out[c] = {}); for (const k in d) o[k] = (o[k] || 0) + d[k]; } }
  return out;
}
// خيارات الاختيار عند أول دفع
function projectPickOptions(S, id) {
  const d = PROJECTS[pjBase(id)]; if (!d) return []; const used = pjData(S) ? pjUsedPicks(S, pjBase(id), id) : [];
  return pjPickAll(S, d).filter(o => !used.includes(o.v));
}
function pjPickAll(S, d) {
  if (d.pick === 'city') return S.order.map(c => ({ v: c, label: S.cities[c].name }));
  if (d.pick === 'port') return PORTS.filter(c => S.cities[c]).map(c => ({ v: c, label: S.cities[c].name }));
  if (d.pick === 'country') return COUNTRIES.map(c => ({ v: c.id, label: c.name }));
  if (d.pick === 'route') {
    const anchors = new Set([...Object.keys(S.player.props), START_OF[S.home], ...S.player.caravans.map(c => c.city).filter(Boolean)]), seen = {}, out = [];
    for (const a of anchors) { if (!S.cities[a]) continue; for (const b of S.order) { if (a === b) continue; const dd = cdist(pjCountry(S, a), pjCountry(S, b)); if (d.adj ? dd !== 1 : dd > 1) continue; const k = riskKey(a, b); if (seen[k] || S.risk[k] == null) continue; seen[k] = 1; out.push({ v: k, label: S.cities[a].name + ' - ' + S.cities[b].name }); } }
    return out.sort((x, y) => x.label < y.label ? -1 : 1);
  }
  return [];
}
function projectPickLabel(S, id, v) { const o = pjPickAll(S, PROJECTS[pjBase(id)]).find(x => x.v === v); if (o) return o.label; if (PROJECTS[pjBase(id)].pick === 'route' && v) return String(v).split('|').map(c => S.cities[c] ? S.cities[c].name : c).join(' - '); return v || ''; }
// الدرجات والمشاريع المفتوحة (المخفية للمراجعة لا تظهر ولا تُموَّل)
function projectsOpen(S) {
  if (!pjOn(S) || !pjData(S)) return [];
  const t = pjTier(S); return PJ_IDS.filter(id => PROJECTS[id].tier <= t && !pjHidden(id));
}
function projectView(S) {
  const on = pjOn(S), p = on ? pjData(S) : null, nw = on ? netWorth(S) : 0, peak = p ? p.peak : 0, tier = p ? pjTier(S) : 0;
  const mk = key => { const id = pjBase(key), d = PROJECTS[id], paid = p ? (p.paid[key] || 0) : 0, done = !!(p && p.done.includes(key)), until = p ? p.until[key] || 0 : 0, wait = paid > 0 && S.day < until ? until - S.day : 0, nextCost = paid < d.stages.length ? d.stages[paid] : 0, need = d.need && !pjDone(S, d.need) ? d.need : null, n = +String(key).split('#')[1] || 1;
    return { id: key, base: id, n, again: n > 1, tier: d.tier, name: d.name, text: d.text, eff: d.eff, stages: d.stages, paid, total: d.stages.length, done, wait, nextCost, cost: pjCost(id), spent: d.stages.slice(0, paid).reduce((x, y) => x + y, 0), pick: p ? p.pick[key] || null : null, pickKind: d.pick, days: d.days, need, building: paid > 0 && !done && wait > 0 }; };
  const open = []; for (const id of projectsOpen(S)) { const ks = pjKeys(S, id); const list = ks.slice(); if (!ks.length || ks.every(k => p.done.includes(k))) list.push(pjNextKey(S, id)); for (const k of list) open.push(mk(k)); }
  const tiers = PJ_TIERS.map((w, i) => ({ n: i + 1, w, open: tier >= i + 1, left: Math.max(0, w - peak), ids: PJ_IDS.filter(id => PROJECTS[id].tier === i + 1 && !pjHidden(id)) }));
  return { on, tier, peak: Math.round(peak), nw: Math.round(nw), tiers, open, done: p ? p.done.length : 0 };
}
function projectFund(S, key, pick) {
  const id = pjBase(key), d = PROJECTS[id]; if (!pjOn(S)) return NO('المشاريع الكبرى غير متاحة الآن'); if (!d || pjHidden(id)) return NO('لا مشروع بهذا الاسم');
  const p = pjData(S); if (!p || pjTier(S) < d.tier) return NO('لم تبلغ درجة هذا المشروع بعد');
  if (key !== pjNextKey(S, id) && !(key in p.paid)) return NO('أتمّ المثيل السابق من هذا المشروع أولاً');
  if (p.done.includes(key)) return NO('أُتمّ هذا المشروع' + (key === id ? '؛ يمكنك بناءه مرة أخرى في مكان آخر' : ''));
  if (d.need && !pjDone(S, d.need)) return NO('يشترط إتمام «' + PROJECTS[d.need].name + '» أولاً');
  const paid = p.paid[key] || 0; if (paid >= d.stages.length) return NO('دُفعت كل المراحل؛ ينتظر الإنشاء');
  if (paid > 0 && S.day < (p.until[key] || 0)) return NO('تنتهي المرحلة الجارية بعد ' + (p.until[key] - S.day) + ' يوماً');
  let pk = p.pick[key]; if (pk == null) { if (!projectPickOptions(S, key).some(o => o.v === pick)) return NO('اختر ' + ({ city: 'المدينة', port: 'الميناء', country: 'الدولة', route: 'الطريق' })[d.pick] + ' جديداً لم تبنِ فيه هذا المشروع'); pk = pick; }
  const cost = d.stages[paid]; if (S.player.gold + 1e-6 < cost) return NO('رصيدك لا يكفي هذه المرحلة (' + cost + ' ريال)');
  p.pick[key] = pk; pPay(S, 'projects', cost, true); p.paid[key] = paid + 1; p.until[key] = S.day + d.days;
  return OK('دفعتَ المرحلة ' + (paid + 1) + ' من ' + d.stages.length + ' من «' + d.name + '» (' + cost + ' ريال). تنتهي بعد ' + d.days + ' يوماً.');
}
function pjComplete(S, id) {
  const p = pjData(S), d = PROJECTS[pjBase(id)]; p.done.push(id);
  if (d.once && d.once.trust) { const bs = bossOf(S, p.pick[id]); if (bs) bs.trust = clamp(bs.trust + d.once.trust, -100, 100); }
  news(S, 'اكتمل مشروعك «' + d.name + '»' + (p.pick[id] ? ' (' + projectPickLabel(S, id, p.pick[id]) + ')' : '') + ': ' + d.eff + '.' + (PROSPER.on && prosDimText(d.dim) ? ' يرتفع به ازدهار المدينة تدريجياً: ' + prosDimText(d.dim) + '.' : ''), 'good');
}
function projectDay(S) {
  if (!pjOn(S)) return;
  if (S.day % PJ_STEP === 0) { const nw = netWorth(S); let p = pjData(S); if (p || nw >= PJ_TIERS[0]) { p = pjEnsure(S); if (nw > p.peak) p.peak = nw; const t = pjTier(S); if (t > (p.tier || 0)) { p.tier = t; news(S, 'بلغتَ ثروة ' + fmtN(PJ_TIERS[t - 1]) + ' ريال: فُتحت في مكتبك مشاريع كبرى جديدة.', 'good'); } } }
  const p = pjData(S); if (!p) return;
  for (const id of Object.keys(p.paid)) { const d = PROJECTS[pjBase(id)]; if (!d || p.done.includes(id)) continue; if (p.paid[id] >= d.stages.length && S.day >= (p.until[id] || 0)) pjComplete(S, id); }
}
