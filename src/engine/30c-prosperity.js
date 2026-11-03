/* ---------- ازدهار المدن (016؛ ملاحظتا بن محمود 10 و11): التصميم المعتمد docs/goals/WORLD.md الأقسام 0 و1 و4 و7 ----------
   لكل مدينة ستة أبعاد من 0 إلى 100: c.pros = { trade, urban, sci, lit, health, sec, b (القيم الأولية), care (مساهمة نشطة), popMul, pInf, last, m, pend }.
   القيمة الأولية من بيانات قائمة؛ الهدف tgt = b + min(40, care + دائم المشاريع)؛ كل شهر d += 0.08 × (tgt − d) بهبوط أقصى 1.2 نقطة شهرياً ولا دون b.
   care تذبل 4٪ شهرياً، وبعد 90 يوماً بلا زيارة ولا نشاط تذبل 3 نقاط إضافية شهرياً؛ ومساهمة المشاريع (projectContrib من 015) دائمة لا تذبل.
   PROSPER.on=false يعيد السلوك القديم حرفياً: لا حقل في المدينة ولا أثر ولا بطاقة. الحقل اختياري ويُنشأ عند أول تحديث شهري. */
const PROSPER = { on: true };
const PR_KEYS = ['trade', 'urban', 'sci', 'lit', 'health', 'sec'];
const PR_NAMES = { trade: 'التجارة', urban: 'العمران', sci: 'العلم', lit: 'الأدب', health: 'الصحة', sec: 'الأمن' };
const PR = { month: 30, cap: 40, ease: 0.08, maxDrop: 1.2, decay: 0.04, idleDays: 90, idleDrop: 3, shopC: 1.5, shopMax: 3, factC: 2, staffPer: 10, pactC: 1, infl: 0.3, inflCap: 25 };
// قيمة الأثر عند +40 فوق الأولي (خطياً دونها) كما في WORLD.md القسم 1
const PR_FX = { trade: 0.06, urban: 0.10, sci: 0.10, lit: 0.08, health: 0.3, sec: 0.2, popUrban: 0.10, popHealth: 0.03, qual: 2, giftLit: 0.10, shopCost: 0.10 };
const prOn = S => !!(PROSPER.on && S && S.learn && S.learn.char);
const prData = (S, id) => (S.cities[id] && S.cities[id].pros) || null;
function prBase(S, c) {
  let r = 0, n = 0; for (const o of S.order) { if (o === c.id) continue; const k = riskKey(c.id, o); if (S.risk[k] != null) { r += S.risk[k]; n++; } }
  return { trade: 30 + 15 * (c.size - 0.8), urban: 35 + 10 * c.size, sci: 20 + 5 * c.size, lit: 20, health: 30 + 30 * c.sat.food, sec: 100 * (1 - (n ? r / n : 0)) };
}
function prosEnsure(S, id) {
  const c = S.cities[id]; if (c.pros) return c.pros; const b = prBase(S, c), care = {}; PR_KEYS.forEach(k => care[k] = 0);
  return (c.pros = Object.assign({}, b, { b, care, popMul: 1, pInf: 0, last: S.day, m: S.day, pend: { lit: 0 } }));
}
const prFrac = (S, id, k) => { const p = prData(S, id); return p ? Math.max(0, Math.min(1, (p[k] - p.b[k]) / PR.cap)) : 0; };
// هل للاعب زيارة أو نشاط في المدينة اليوم؟
function prActive(S, id) {
  const P = S.player, pr = P.props[id]; if (pr && (pr.shops.length || pr.whs || pr.farm || pr.butcher || (pr.staff && pr.staff.length))) return true;
  if (P.factories.some(f => f.city === id)) return true; return P.caravans.some(cr => cr.left === 0 && cr.city === id);
}
// المساهمة الشهرية من نشاط اللاعب (الأرقام المعتمدة وحدها؛ ما لا رقم له في WORLD.md غير مفعّل)
function prInflow(S, id) {
  const P = S.player, pr = P.props[id], o = {}; PR_KEYS.forEach(k => o[k] = 0);
  if (pr) { o.trade += PR.shopC * Math.min(PR.shopMax, pr.shops.length); o.sci += (pr.staff ? pr.staff.length : 0) / PR.staffPer; }
  o.urban += PR.factC * P.factories.filter(f => f.city === id).length;
  const p = prData(S, id); if (p && p.pend) { o.lit += PR.pactC * (p.pend.lit || 0); }
  return o;
}
function prosPact(S, city) { if (!prOn(S) || !S.cities[city]) return; const p = prosEnsure(S, city); p.pend.lit = (p.pend.lit || 0) + 1; }
function prosMonth(S, id, perm) {
  const c = S.cities[id], p = prosEnsure(S, id), inflow = prInflow(S, id), idle = S.day - p.last > PR.idleDays; let tot = 0;
  for (const k of PR_KEYS) {
    let care = p.care[k] * (1 - PR.decay) + inflow[k]; if (idle) care = Math.max(0, care - PR.idleDrop); p.care[k] = care;
    const add = Math.min(PR.cap, care + ((perm || {})[k] || 0)); tot += add;
    const tgt = p.b[k] + add; let dl = PR.ease * (tgt - p[k]); if (dl < -PR.maxDrop) dl = -PR.maxDrop; p[k] = Math.max(p.b[k], Math.min(p.b[k] + PR.cap, p[k] + dl));
  }
  p.pend = { lit: 0 };
  // السكان المستهدفون: +10٪ من العمران و+3٪ من الصحة (عند أقصاهما)، يتبعها pop ببطء
  const fu = prFrac(S, id, 'urban'), fh = prFrac(S, id, 'health'), tm = 1 + PR_FX.popUrban * fu + PR_FX.popHealth * fh, nm = p.popMul + PR.ease * (tm - p.popMul);
  if (nm > 0 && p.popMul > 0) { const r = nm / p.popMul; for (let i = 0; i < 4; i++) c.pop[i] *= r; p.popMul = nm; }
  // نفوذ التاجر: +0.3 × (مساهمته من الأبعاد الستة) ÷ 100 شهرياً بسقف +25 مجمّعاً
  const bs = S.bosses && S.bosses[id]; if (bs && bs.ruler !== 'player' && p.pInf < PR.inflCap) { const dp = Math.min(PR.inflCap - p.pInf, PR.infl * tot / 100); bs.p = Math.max(0, Math.min(100, bs.p + dp)); p.pInf += dp; }
  p.m = S.day;
}
function prosperityDay(S) {
  if (!prOn(S)) return;
  for (const id of S.order) { if (prActive(S, id)) { const p = prData(S, id); if (p) p.last = S.day; } }
  if (S.day > 0 && S.day % PR.month === 0) { const perm = projectContrib(S); for (const id of S.order) { if (!prData(S, id) || S.day > prData(S, id).m) { const p = prData(S, id); if (!p) { prosEnsure(S, id); if (prActive(S, id)) prData(S, id).last = S.day; } prosMonth(S, id, perm[id]); } } }
}
// معاملات الأثر (تُضرب في projectMul؛ 1 إن لا أثر أو المفتاح مطفأ)
function prosMul(S, k, ctx) {
  if (!prOn(S)) return 1; ctx = ctx || {};
  if (k === 'shop') return (1 + PR_FX.trade * prFrac(S, ctx.city, 'trade')) * (ctx.g && GD[ctx.g] && GD[ctx.g].lux ? 1 + PR_FX.lit * prFrac(S, ctx.city, 'lit') : 1);
  if (k === 'xp') return 1 + PR_FX.sci * prFrac(S, ctx.city, 'sci');
  if (k === 'ev') return 1 - PR_FX.health * prFrac(S, ctx.city, 'health');
  if (k === 'trustgrow') return 1 + PR_FX.giftLit * prFrac(S, ctx.city, 'lit');
  if (k === 'risk') return (1 - PR_FX.sec * prFrac(S, ctx.from, 'sec')) * (1 - PR_FX.sec * prFrac(S, ctx.to, 'sec'));
  if (k === 'shopcost') return 1 + PR_FX.shopCost * prFrac(S, ctx.city, 'urban');
  return 1;
}
const prosAdd = (S, k, ctx) => (prOn(S) && k === 'qual' && ctx && ctx.city ? PR_FX.qual * prFrac(S, ctx.city, 'sci') : 0);
// نص أبعاد مشروع لخبر الإتمام
const prosDimText = dim => Object.keys(dim || {}).filter(k => PR_NAMES[k]).map(k => PR_NAMES[k] + ' +' + dim[k]).join('، ');
// عرض المدينة للواجهة
function prosperityView(S, id) {
  if (!prOn(S) || !S.cities[id]) return null; const p = prData(S, id), c = S.cities[id], perm = (pjData(S) ? projectContrib(S)[id] : null) || {}, b = p ? p.b : prBase(S, c);
  const dims = PR_KEYS.map(k => { const v = p ? p[k] : b[k], care = p ? p.care[k] : 0, pm = perm[k] || 0, tgt = b[k] + Math.min(PR.cap, care + pm), up = v - b[k];
    return { k, name: PR_NAMES[k], v, b: b[k], up, tgt, care, perm: pm, f: Math.max(0, Math.min(1, up / PR.cap)), share: v > 0 ? up / v : 0, trend: tgt - v > 0.5 ? 1 : tgt - v < -0.5 ? -1 : 0 }; });
  const f = k => dims.find(d => d.k === k).f, eff = { trade: 1 + PR_FX.trade * f('trade'), urban: 1 + PR_FX.urban * f('urban'), sci: 1 + PR_FX.sci * f('sci'), lit: 1 + PR_FX.lit * f('lit'), health: 1 - PR_FX.health * f('health'), sec: 1 - PR_FX.sec * f('sec') };
  return { id, dims, total: dims.reduce((a, d) => a + d.v, 0) / dims.length, eff, pop: popTotal(c), popMul: p ? p.popMul : 1, pInf: p ? p.pInf : 0, started: !!p, idleDays: p ? Math.max(0, S.day - p.last) : 0, projects: perm };
}
