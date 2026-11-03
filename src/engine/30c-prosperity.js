/* ---------- ازدهار المدن (016؛ ملاحظتا بن محمود 10 و11): التصميم المعتمد docs/goals/WORLD.md الأقسام 0 و1 و4 و7 ----------
   لكل مدينة ستة أبعاد من 0 إلى 100: c.pros = { trade, urban, sci, lit, health, sec, b (القيم الأولية), care (مساهمة نشطة), popMul, pInf, last, m, pend }.
   القيمة الأولية من بيانات قائمة؛ الهدف tgt = b + min(40, care + دائم المشاريع)؛ كل شهر d += 0.08 × (tgt − d) بهبوط أقصى 1.2 نقطة شهرياً ولا دون b.
   care تذبل 4٪ شهرياً، وبعد 90 يوماً بلا زيارة ولا نشاط تذبل 3 نقاط إضافية شهرياً؛ ومساهمة المشاريع (projectContrib من 015) دائمة لا تذبل.
   PROSPER.on=false يعيد السلوك القديم حرفياً: لا حقل في المدينة ولا أثر ولا بطاقة. الحقل اختياري ويُنشأ عند أول تحديث شهري. */
const PROSPER = { on: true };
const PR_KEYS = ['trade', 'urban', 'sci', 'lit', 'health', 'sec'];
const PR_NAMES = { trade: 'التجارة', urban: 'العمران', sci: 'العلم', lit: 'الأدب', health: 'الصحة', sec: 'الأمن' };
const PR_STAT = { tradePct: 5, tradeCap: 20, whsC: 2, whsCap: 10, farmC: 3, farmCap: 9, guardC: 1, guardCap: 10, arriveC: 0.5, secCap: 15 }; // قرار بن محمود 2026-11-03: مساهمات قائمة بالمستوى لا شهرية
const PR_CLS = { richCap: 0.15, richSlow: 0.05, urbanJob: 0.004, urbanMax: 0.01, healthSci: 0.002, healthMax: 0.004, lifeCap: 0.10, zkCost: 25, zkCap: 0.05 }; // معدلات رفع الطبقات (وثّقها التقرير): شهرياً من الطبقة، وسقف تراكمي من السكان، والزكاة
// ميزان الهجرة (إضافة بن محمود 2026-11-04): كل شهر يُقارن الجذب (الازدهار الكلي، الأمن، الوظائف، اعتدال الأسعار) بالطرد (قلة الأمن، الإهمال، الغلاء، قلة الوظائف)؛ حدّ ±15٪ عن قيمة المدينة الأولى ببطء
const PR_MIG = { cap: 0.15, ease: 0.05, scale: 0.5, prosN: 45, prosS: 30, secN: 92, secS: 10, priceN: 1.15, priceS: 0.25, jobsS: 0.2, neglectFrom: 90, neglectFull: 180, quiet: 0.05 };
// سوق العمل: عمال اللاعب (بائعون وأمناء مخازن ومزارعون وعمال مصانع) من المساكين وأهل الكفاف؛ فوق 10٪ منهم ترتفع أجور التوظيف الجديد تدريجياً حتى 30٪ فتبلغ ×1.5
const PR_LAB = { from: 0.10, full: 0.30, max: 1.5, factory: 80, warn: 1.02 };
const CLASS_NAMES = ['الفقراء', 'المساكين', 'أهل الكفاف', 'الموسرون']; // معتمد: docs/review/APPROVED_CLASSES_2026-11-03.md
const ZAKAT_IMPACT = 'أثر زكاتك: استغنى بها {N} من أهل مدينتك وارتقوا في معيشتهم.'; // معتمد حرفياً
const PR = { month: 30, cap: 40, ease: 0.08, maxDrop: 1.2, decay: 0.04, idleDays: 90, idleDrop: 3, shopC: 1.5, shopMax: 3, factC: 2, staffPer: 10, pactC: 1, infl: 0.3, inflCap: 25 };
// قيمة الأثر عند +40 فوق الأولي (خطياً دونها) كما في WORLD.md القسم 1
const PR_FX = { trade: 0.06, urban: 0.10, sci: 0.10, lit: 0.08, health: 0.3, sec: 0.2, popUrban: 0.05, popHealth: 0.03, qual: 2, giftLit: 0.10, shopCost: 0.10 };
const prOn = S => !!(PROSPER.on && S && S.learn && S.learn.char);
const prData = (S, id) => (S.cities[id] && S.cities[id].pros) || null;
function prBase(S, c) {
  let r = 0, n = 0; for (const o of S.order) { if (o === c.id) continue; const k = riskKey(c.id, o); if (S.risk[k] != null) { r += S.risk[k]; n++; } }
  return { trade: 30 + 15 * (c.size - 0.8), urban: 35 + 10 * c.size, sci: 20 + 5 * c.size, lit: 20, health: 30 + 30 * c.sat.food, sec: 100 * (1 - (n ? r / n : 0)) };
}
function prosEnsure(S, id) {
  const c = S.cities[id]; if (c.pros) return c.pros; const b = prBase(S, c), care = {}; PR_KEYS.forEach(k => care[k] = 0);
  const tot = popTotal(c); return (c.pros = Object.assign({}, b, { b, care, popMul: 1, pInf: 0, last: S.day, m: S.day, pend: { lit: 0 }, vol: 0, share: 0, stat: { trade: 0, urban: 0, health: 0, guards: 0 }, lift: 0, zk: 0, poor: c.pop[0] / tot, poorPrev: c.pop[0] / tot }));
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
// حجم تداول اللاعب في المدينة (قيمة الصفقة) يغذي حصته من السوق
function prosTrade(S, city, value) { if (!prOn(S) || !S.cities[city] || !(value > 0)) return; prosEnsure(S, city).vol += value; }
// وصول قافلة محروسة سالماً: +0.5 للأمن تذبل كالمساهمة النشطة
function prosArrive(S, city) { if (!prOn(S) || !S.cities[city]) return; const p = prosEnsure(S, city); p.care.sec += PR_STAT.arriveC; }
// المساهمات القائمة بالمستوى (قرار بن محمود): حصة التداول، المستودعات، مستوى المزرعة، حراس القوافل الواقفة في المدينة
function prStat(S, id) {
  const c = S.cities[id], p = prData(S, id), pr = S.player.props[id], T = PR_STAT; let M = 0; for (const g of GIDS) M += PR.month * (c.dem[g] || 0) * unitPrice(c, g);
  const v = p.vol || 0; p.share = 0.5 * (p.share || 0) + 0.5 * (v + M > 0 ? v / (v + M) : 0); p.vol = 0;
  const guards = S.player.caravans.reduce((n, cr) => n + (cr.left === 0 && cr.city === id ? cr.guards || 0 : 0), 0);
  return { trade: Math.min(T.tradeCap, Math.floor(p.share * 100 / T.tradePct)), urban: Math.min(T.whsCap, T.whsC * (pr && pr.whs ? pr.whs : 0)), health: Math.min(T.farmCap, T.farmC * (pr && pr.farm ? pr.farm.level : 0)), guards: Math.min(T.guardCap, T.guardC * guards) };
}
function prosPact(S, city) { if (!prOn(S) || !S.cities[city]) return; const p = prosEnsure(S, city); p.pend.lit = (p.pend.lit || 0) + 1; }
// عدد عمال اللاعب في المدينة (طاقم المخازن والدكاكين والمزارع + عمال مصانعه 80 لكل مستوى كما في فرص العمل القائمة)
const prWorkers = (S, id) => { const pr = S.player.props[id]; return (pr && pr.staff ? pr.staff.length : 0) + PR_LAB.factory * S.player.factories.filter(f => f.city === id).reduce((a, f) => a + f.level, 0); };
function laborShare(S, id) { const c = S.cities[id], den = c.pop[1] + c.pop[2]; return den > 0 ? prWorkers(S, id) / den : 0; }
function laborMul(S, id) { if (!prOn(S) || !S.cities[id]) return 1; const s = laborShare(S, id); return 1 + (PR_LAB.max - 1) * Math.max(0, Math.min(1, (s - PR_LAB.from) / (PR_LAB.full - PR_LAB.from))); }
const laborTag = (S, id) => { const m = laborMul(S, id); return m > 1 ? { lm: m } : {}; };
// إشارات الهجرة: كل منها بين −1 (طرد) و+1 (جذب)
function migSignals(S, id) {
  const c = S.cities[id], p = prData(S, id), cl = x => Math.max(-1, Math.min(1, x)); let r = 0, n = 0; for (const o of S.order) { if (o === id) continue; const k = riskKey(id, o); if (S.risk[k] != null) { r += S.risk[k]; n++; } }
  const P = PR_KEYS.reduce((a, k) => a + p[k], 0) / PR_KEYS.length, sec = 100 * (1 - (n ? r / n : 0)) + (p.sec - p.b.sec), tt = popTotal(c), staff = (S.player.props[id] && S.player.props[id].staff ? S.player.props[id].staff.length : 0);
  const extra = Object.values(c.extra || {}).reduce((a, v) => a + v, 0), free = tt * 0.78 + (c.factJobs || 0) + extra * 8 + staff - (c.pop[1] + c.pop[2] + c.pop[3]);
  let pr = 0, m = 0; for (const g in HOARD_GOODS) if (c.dem[g] > 0) { pr += ratio(c, g); m++; } pr = m ? pr / m : PR_MIG.priceN;
  const stake = PR_KEYS.reduce((a, k) => a + p.care[k], 0) > 1, idle = S.day - p.last;
  return { pros: cl((P - PR_MIG.prosN) / PR_MIG.prosS), sec: cl((sec - PR_MIG.secN) / PR_MIG.secS), jobs: cl(free / (PR_MIG.jobsS * tt)), price: cl((PR_MIG.priceN - pr) / PR_MIG.priceS), neglect: stake ? -Math.max(0, Math.min(1, (idle - PR_MIG.neglectFrom) / (PR_MIG.neglectFull - PR_MIG.neglectFrom))) : 0 };
}
const lam = n => (n.startsWith('ال') ? 'لل' + n.slice(2) : 'ل' + n);
const MIG_UP = { pros: 'ازدهارها', sec: 'أمانها', jobs: 'كثرة فرص العمل', price: 'اعتدال أسعارها' }, MIG_DOWN = { sec: 'قلة الأمن', neglect: 'الإهمال', price: 'غلاء الأسعار', jobs: 'قلة الوظائف' };
function prosMonth(S, id, perm) {
  const c = S.cities[id], p = prosEnsure(S, id), inflow = prInflow(S, id), idle = S.day - p.last > PR.idleDays, st = (p.stat = prStat(S, id)); let tot = 0;
  for (const k of PR_KEYS) {
    let care = p.care[k] * (1 - PR.decay) + inflow[k]; if (idle) care = Math.max(0, care - PR.idleDrop); p.care[k] = care;
    const stand = k === 'sec' ? Math.min(PR_STAT.secCap, st.guards + care) : care + (st[k] || 0), add = Math.min(PR.cap, stand + ((perm || {})[k] || 0)); tot += add;
    const tgt = p.b[k] + add; let dl = PR.ease * (tgt - p[k]); if (dl < -PR.maxDrop) dl = -PR.maxDrop; p[k] = Math.max(p.b[k], Math.min(p.b[k] + PR.cap, p[k] + dl));
  }
  p.pend = { lit: 0 };
  // الطبقات تتحرك بالازدهار: العمران والوظائف (دكاكين اللاعب ومصانعه) ترفع الفقراء إلى المساكين، والصحة والعلم ترفعان المساكين إلى أهل الكفاف؛ ببطء وبسقف تراكمي
  { const tt = popTotal(c); p.poorPrev = p.poor == null ? c.pop[0] / tt : p.poor; const pr = S.player.props[id], jobs = Math.min(1, ((pr ? pr.shops.length : 0) + S.player.factories.filter(f => f.city === id).length) / 6), room = Math.max(0, PR_CLS.lifeCap * tt - (p.lift || 0));
    if (room > 0) { const n01 = Math.min(room, c.pop[0] * Math.min(PR_CLS.urbanMax, PR_CLS.urbanJob * (prFrac(S, id, 'urban') + jobs))), n12 = Math.min(room - n01, c.pop[1] * Math.min(PR_CLS.healthMax, PR_CLS.healthSci * (prFrac(S, id, 'health') + prFrac(S, id, 'sci'))));
      if (n01 > 0) { c.pop[0] -= n01; c.pop[1] += n01; } if (n12 > 0) { c.pop[1] -= n12; c.pop[2] += n12; } p.lift = (p.lift || 0) + n01 + n12; }
    p.poor = c.pop[0] / popTotal(c); }
  // السكان المستهدفون: +10٪ من العمران و+3٪ من الصحة (عند أقصاهما)، يتبعها pop ببطء
  const fu = prFrac(S, id, 'urban'), fh = prFrac(S, id, 'health'), tm = 1 + PR_FX.popUrban * fu + PR_FX.popHealth * fh, nm = p.popMul + PR.ease * (tm - p.popMul);
  if (nm > 0 && p.popMul > 0) { const r = nm / p.popMul; for (let i = 0; i < 4; i++) c.pop[i] *= r; p.popMul = nm; }
  // نفوذ التاجر: +0.3 × (مساهمته من الأبعاد الستة) ÷ 100 شهرياً بسقف +25 مجمّعاً
  const bs = S.bosses && S.bosses[id]; if (bs && bs.ruler !== 'player' && p.pInf < PR.inflCap) { const dp = Math.min(PR.inflCap - p.pInf, PR.infl * tot / 100); bs.p = Math.max(0, Math.min(100, bs.p + dp)); p.pInf += dp; }
  // ميزان الهجرة: الوافدون والراحلون بنسب طبقات المدينة الحالية (يضربون السكان كلهم بالمعامل نفسه)، بحد ±15٪ ببطء
  { const sg = migSignals(S, id), M = (sg.pros + sg.sec + sg.jobs + sg.price + sg.neglect) / 5, tgt = 1 + PR_MIG.cap * Math.max(-1, Math.min(1, M / PR_MIG.scale)), mm = p.migMul == null ? 1 : p.migMul, nm2 = mm + PR_MIG.ease * (tgt - mm);
    if (nm2 > 0 && mm > 0) { const r = nm2 / mm; for (let i = 0; i < 4; i++) c.pop[i] *= r; } p.migMul = nm2; p.mig = { M, up: Object.keys(MIG_UP).filter(k => sg[k] > 0.05).sort((a, b) => sg[b] - sg[a]).slice(0, 2), down: Object.keys(MIG_DOWN).filter(k => sg[k] < -0.05).sort((a, b) => sg[a] - sg[b]).slice(0, 2) }; }
  // سوق العمل: تنبيه المكتب حين تبدأ الأجور بالارتفاع
  { const lm = laborMul(S, id); if (lm >= PR_LAB.warn && !p.laborWarn) { p.laborWarn = true; news(S, 'قلّت الأيدي العاملة في ' + c.name + '؛ الأجور ترتفع.', 'bad'); } else if (lm <= 1 && p.laborWarn) p.laborWarn = false; }
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
// الزكاة المخرجة ترفع جزءاً من الفقراء والمساكين في مدينة اللاعب الأم بقدر الزكاة وبسقف 5٪ منهم؛ تعيد عدد من ارتقوا
function prosZakat(S, paid) {
  if (!prOn(S) || !(paid > 0)) return 0; const id = START_OF[S.home] || S.order[0], c = S.cities[id]; if (!c) return 0;
  const p = prosEnsure(S, id), a = c.pop[0], b = c.pop[1], N = Math.min(Math.floor(paid / PR_CLS.zkCost), Math.floor(PR_CLS.zkCap * (a + b))); if (N < 1 || a + b <= 0) return 0;
  const n0 = Math.min(a, Math.round(N * a / (a + b))), n1 = Math.min(b + n0, N - n0); c.pop[0] -= n0; c.pop[1] += n0 - n1; c.pop[2] += n1; p.zk = (p.zk || 0) + n0 + n1; p.poor = c.pop[0] / popTotal(c); return n0 + n1;
}
const prosAdd = (S, k, ctx) => (prOn(S) && k === 'qual' && ctx && ctx.city ? PR_FX.qual * prFrac(S, ctx.city, 'sci') : 0);
// نص أبعاد مشروع لخبر الإتمام
const prosDimText = dim => Object.keys(dim || {}).filter(k => PR_NAMES[k]).map(k => PR_NAMES[k] + ' +' + dim[k]).join('، ');
// عرض المدينة للواجهة
function prosperityView(S, id) {
  if (!prOn(S) || !S.cities[id]) return null; const p = prData(S, id), c = S.cities[id], perm = (pjData(S) ? projectContrib(S)[id] : null) || {}, b = p ? p.b : prBase(S, c);
  const dims = PR_KEYS.map(k => { const v = p ? p[k] : b[k], care = p ? p.care[k] : 0, pm = perm[k] || 0, st = p && p.stat ? p.stat[k === 'sec' ? 'guards' : k] || 0 : 0, stand = k === 'sec' ? Math.min(PR_STAT.secCap, st + care) : care + st, tgt = b[k] + Math.min(PR.cap, stand + pm), up = v - b[k];
    return { k, name: PR_NAMES[k], v, b: b[k], up, tgt, care, stat: st, perm: pm, f: Math.max(0, Math.min(1, up / PR.cap)), share: v > 0 ? up / v : 0, trend: tgt - v > 0.5 ? 1 : tgt - v < -0.5 ? -1 : 0 }; });
  const f = k => dims.find(d => d.k === k).f, eff = { trade: 1 + PR_FX.trade * f('trade'), urban: 1 + PR_FX.urban * f('urban'), sci: 1 + PR_FX.sci * f('sci'), lit: 1 + PR_FX.lit * f('lit'), health: 1 - PR_FX.health * f('health'), sec: 1 - PR_FX.sec * f('sec') };
  const tt = popTotal(c), poor = c.pop[0] / tt; const mg = p && p.mig ? p.mig : null, mgName = c.name; return { id, dims, poor, counts: c.pop.slice(), popMul2: p && p.migMul != null ? p.migMul : 1, migLine: mg && mg.up.length && mg.M > PR_MIG.quiet ? 'يفد الناس إلى ' + mgName + ' ' + mg.up.map(k => lam(MIG_UP[k])).join(' و') + '.' : mg && mg.down.length && mg.M < -PR_MIG.quiet ? 'يرحل الناس عن ' + mgName + ' ' + mg.down.map(k => lam(MIG_DOWN[k])).join(' و') + '.' : '', labor: { share: laborShare(S, id), mul: laborMul(S, id) }, poorPrev: p && p.poorPrev != null ? p.poorPrev : poor, lift: p ? p.lift || 0 : 0, zk: p ? p.zk || 0 : 0, share: p ? p.share || 0 : 0, total: dims.reduce((a, d) => a + d.v, 0) / dims.length, eff, pop: popTotal(c), popMul: p ? p.popMul : 1, pInf: p ? p.pInf : 0, started: !!p, idleDays: p ? Math.max(0, S.day - p.last) : 0, projects: perm };
}
// هرم الطبقات: الموسرون لا يتجاوزون 15٪ من السكان، ويبطؤ الارتقاء إليهم خطياً من 10٪ إلى 15٪ (1 دون 10٪ ثم 0 عند 15٪). مفتاح PROSPER.on يعيد القديم.
function richRoom(c) { if (!PROSPER.on) return 1; const sh = c.pop[3] / popTotal(c); return Math.max(0, Math.min(1, (PR_CLS.richCap - sh) / (PR_CLS.richCap - PR_CLS.richSlow * 2))); }
