/* ---------- 043أ إطار تفويض ناظر الديوان (يد الديوان اليمنى) ----------
   الناظر يُفوَّض مهاماً بسقف خانات: 8 وتنمو إلى 30 بدرجته ([8,14,20,25,30] للدرجات 1–5؛ الدرجة من D.sk.g إن وُجد وإلا من أيام الخدمة 90/180/360/720).
   ثلاثة أنواع: once (تشغل خانة حتى تُنجز فتتحرر)، standing (قاعدة دائمة تشغل خانة حتى تُلغى)، report (تقرير: لا يشغل خانة).
   القواعد الخمس القائمة في 24g-diwan (سداد، تعبئة، بيع الراكد، مواشي، سحب) لا تشغل خانات ولا تتغير.
   كل مهمة بوضع exec (ينفّذ ويُبلغ) أو ask (يسأل أولاً ثم ينفّذ بعد المهلة) أو mine (تذكير فقط). أجر الناظر يزيد wageStep لكل خانة مستعملة.
   السجل D.tlog: كل فعل بتاريخه ومهمته وما فعل ومبلغه، والتراجع ≤ undoDays لما يعكسه محوّله (الترميم لا يُعكس فيُوسم irrev).
   P.diwan.tasks/tlog/frozen تُنشأ عند أول تفويض فقط؛ DELEG.on=false = السلوك السابق حرفياً بلا أي حقل جديد في الحفظ. */
const DELEG = { on: true, caps: [8, 14, 20, 25, 30], wageStep: 5, grades: [90, 180, 360, 720], undoDays: 3, logMax: 60, onceDays: 14, wait: 3, again: 7, belows: [45, 55, 65], pcts: [2, 5, 10], reportEvery: 7, reportMax: 1 };
const DELEG_MODES = { exec: 'نفّذ وأخبرني', ask: 'اسألني أولاً', mine: 'اتركه لي' };
const DELEG_TYPES = { once: 'مرة واحدة', standing: 'قاعدة دائمة', report: 'تقرير' };
const delegOf = S => (DELEG.on && diwanOf(S)) || null;
const dlR2 = x => Math.round(x * 100) / 100;
function delegGrade(S) { const D = delegOf(S); if (!D) return 1; const d = S.day - D.since; return 1 + DELEG.grades.filter(x => d >= x).length; }
const delegCap = S => (delegOf(S) ? DELEG.caps[delegGrade(S) - 1] : 0);
const delegUsed = S => { const D = delegOf(S); return D && D.tasks ? D.tasks.filter(t => t.type !== 'report').length : 0; };
const delegWageExtra = S => delegUsed(S) * DELEG.wageStep;
const dlCityName = (S, c) => (c === '*' ? 'كل المدن' : S.cities[c] ? S.cities[c].name : c);
function dlRec(S, D, t, kind, text, amount, extra) { // سجل الفعل (التاريخ، المهمة، ما فعل، المبلغ)
  const e = Object.assign({ d: S.day, id: t ? t.id : 0, kind: t ? t.kind : kind, text, amount: dlR2(amount || 0) }, extra || {});
  (D.tlog || (D.tlog = [])).unshift(e); if (D.tlog.length > DELEG.logMax) D.tlog.length = DELEG.logMax;
  if (t) { t.log.unshift({ d: S.day, text, amount: e.amount }); if (t.log.length > 10) t.log.length = 10; }
  diwanLog(S, D, 'task', null, text, amount || 0); return e;
}
/* ---- محوّل ترميم الدكاكين: أي دكان مملوك تحت الحد بميزانية شهرية نسبية من الرصيد، عبر A.shopRepair القائم (040هـ) ---- */
function sfList(S, t) {
  const out = []; for (const city of (S.order || [])) { if (t.scope !== '*' && t.scope !== city) continue; const pr = S.player.props[city]; if (!pr) continue;
    for (const sh of pr.shops) { if (shKind(sh) !== 'own') continue; const q = scQuote(S, city, sh.id); if (q && q.can && q.cond < t.limits.below) out.push({ city, id: sh.id, cond: q.cond, cost: q.cost }); } }
  return out.sort((a, b) => a.cond - b.cond || a.cost - b.cost);
}
function sfWin(S, t) { if (t.type !== 'standing') return { cap: Infinity, spent: 0, d: S.day, fresh: true }; const w = t.win; return !w || S.day - w.d >= 30 ? { d: S.day, cap: Math.round(S.player.gold * t.limits.pct / 100), spent: 0, fresh: true } : w; }
function sfPlan(S, t) {
  const w = sfWin(S, t), all = sfList(S, t), pick = []; let left = w.cap - w.spent, cost = 0;
  for (const x of all) if (x.cost <= left + 1e-9) { pick.push(x); left -= x.cost; cost += x.cost; }
  return { n: pick.length, total: all.length, cost, pick, cap: w.cap, spent: w.spent, text: 'أرمّم ' + pick.length + ' دكاناً' + (t.scope === '*' ? '' : ' في ' + dlCityName(S, t.scope)) + ' تحت حالة ' + t.limits.below + ' بنحو ' + fmtN(cost) + ' ريال' };
}
function sfRun(S, t) {
  const p = sfPlan(S, t); if (t.type === 'standing' && p.cap !== Infinity) { const w = sfWin(S, t); t.win = w.fresh ? { d: w.d, cap: w.cap, spent: 0 } : w; }
  let spent = 0, n = 0; const names = [];
  for (const x of p.pick) { const r = A.shopRepair(S, x.city, x.id); if (r.ok === false) continue; spent += x.cost; n++; names.push(dlCityName(S, x.city)); }
  if (t.win) t.win.spent += spent;
  const left = sfList(S, t).length;
  if (t.type === 'once') return { done: left === 0 || (n === 0 && p.total === 0), did: n ? 'رمّمتُ ' + n + ' دكاناً (' + [...new Set(names)].join('، ') + ') بـ' + fmtN(spent) + ' ريال، لا يُعكس الترميم' : (p.total ? '' : 'لا دكان تحت حالة ' + t.limits.below + ' في ' + dlCityName(S, t.scope)), cost: spent };
  return { done: false, did: n ? 'رمّمتُ ' + n + ' دكاناً (' + [...new Set(names)].join('، ') + ') بـ' + fmtN(spent) + ' ريال، لا يُعكس الترميم' : '', cost: spent };
}
/* ---- محوّل التقرير: حال الأعمال بأرقامها الفعلية (من hsView وأخواتها)؛ لا يشغل خانة ---- */
function dlBriefLines(S, names) {
  names = names || {}; const v = hsView(S) || { ledger: hsLedger(S), shops: hsShops(S), liq: null, rivals: hsRivals(S) }, L = v.ledger, out = [];
  out.push('الصافي ' + (L.net < 0 ? '−' : '+') + fmtN(Math.abs(L.net)) + ' ريال ' + (L.since === 'start' ? 'منذ البداية' : 'في آخر ' + L.days + ' يوماً') + ': دخل ' + fmtN(L.inc) + ' ومصروف ' + fmtN(L.exp));
  if (v.shops) out.push('الدكاكين: ' + v.shops.good + ' بحالة جيدة' + (v.shops.mid ? '، ' + v.shops.mid + ' مقبولة' : '') + (v.shops.bad ? '، ' + v.shops.bad + ' متهالكة' : ''));
  if (v.liq) out.push('السيولة تغطي ' + (v.liq.days === Infinity ? 'كل التزاماتك' : Math.floor(v.liq.days) + ' يوماً') + ' (نقد ' + fmtN(v.liq.cash) + ' ودائع ' + fmtN(v.liq.dep) + ')');
  if (v.rivals) out.push('منافسون نشطون في أسواقك: ' + v.rivals.list.length + '، الأقوى ' + v.rivals.top.name);
  return out;
}
const dlBriefRun = (S, t) => { const lines = dlBriefLines(S); t.last = S.day; return { done: false, did: 'تقرير الأعمال: ' + lines.join(' · '), cost: 0, news: true }; };
const DELEG_KINDS = {
  shopfix: { id: 'shopfix', name: 'ترميم الدكاكين', types: ['once', 'standing'], def: { type: 'standing', scope: '*', below: 55, pct: 5, mode: 'exec' },
    check(S, s) { if (!SHOPCOND.on) return NO('حالة الدكاكين غير مفعّلة'); if (!DELEG.belows.includes(+s.limits.below)) return NO('اختر حالة 45 أو 55 أو 65'); if (s.type === 'standing' && !DELEG.pcts.includes(+s.limits.pct)) return NO('اختر ميزانية 2 أو 5 أو 10٪ من الرصيد');
      if (s.scope !== '*' && !(S.player.props[s.scope] && S.player.props[s.scope].shops.some(sh => shKind(sh) === 'own'))) return NO('لا دكان مملوك في هذه المدينة'); return OK(''); },
    norm(s) { return s.type === 'standing' ? { below: +s.limits.below, pct: +s.limits.pct } : { below: +s.limits.below }; },
    plan: sfPlan, run: sfRun,
    fields(S, d) {
      const tmp = k => Object.assign({ id: 0, kind: 'shopfix', type: d.type, scope: d.scope, mode: d.mode, limits: { below: d.below, pct: d.pct } }, k || {}), cities = (S.order || []).filter(c => S.player.props[c] && S.player.props[c].shops.some(sh => shKind(sh) === 'own'));
      return [{ k: 'type', title: 'متى؟', opts: [{ v: 'standing', label: 'قاعدة دائمة', effect: 'يراقب كل يوم ويرمّم ضمن ميزانية شهرية · تشغل خانة' }, { v: 'once', label: 'الآن مرة واحدة', effect: 'يرمّم ما تحت الحد ثم تتحرر خانتها' }] },
        { k: 'scope', title: 'أين؟', opts: [{ v: '*', label: 'كل المدن', effect: sfList(S, tmp({ scope: '*' })).length + ' دكان تحت الحد الآن' }].concat(cities.map(c => ({ v: c, label: S.cities[c].name, effect: sfList(S, tmp({ scope: c })).length + ' دكان تحت الحد الآن' }))) },
        { k: 'below', title: 'تحت أي حالة؟', opts: DELEG.belows.map(b => ({ v: b, label: 'تحت ' + b, effect: sfList(S, tmp({ limits: { below: b, pct: d.pct } })).length + ' دكان الآن' })) }]
        .concat(d.type === 'standing' ? [{ k: 'pct', title: 'ميزانية الشهر', opts: DELEG.pcts.map(p => ({ v: p, label: p + '٪ من رصيدك', effect: 'حتى ' + fmtN(S.player.gold * p / 100) + ' ريال شهرياً' })) }] : [])
        .concat([{ k: 'mode', title: 'كيف يتصرف؟', opts: Object.keys(DELEG_MODES).map(m => ({ v: m, label: DELEG_MODES[m], effect: m === 'exec' ? 'يرمّم ويخبرك' : m === 'ask' ? 'يسألك ثم يرمّم بعد ' + DELEG.wait + ' أيام إن لم تردّ' : 'يذكّرك فقط ولا يرمّم' })) }]);
    },
    sum(S, d) { const t = Object.assign({ id: 0, kind: 'shopfix', type: d.type, scope: d.scope, mode: d.mode, limits: { below: d.below, pct: d.pct } }), p = sfPlan(S, t); return 'ترميم الدكاكين تحت حالة ' + d.below + ' في ' + dlCityName(S, d.scope) + ': ' + p.total + ' دكان الآن بنحو ' + fmtN(p.pick.length ? p.cost : 0) + ' ريال' + (d.type === 'standing' ? ' · ميزانية الشهر ' + d.pct + '٪ من رصيدك = ' + fmtN(p.cap) + ' ريال' : ''); } },
  brief: { id: 'brief', name: 'تقرير حال أعمالي', types: ['report'], def: { type: 'report', scope: '*', mode: 'exec' }, check: () => OK(''), norm: () => ({}), run: dlBriefRun, plan: () => ({ n: 1, cost: 0, text: 'أعدّ تقرير حال أعمالك' }), fields: () => [], sum: () => 'تقرير أسبوعي بأرقام دفترك ودكاكينك وسيولتك في الأخبار والسجل · لا يشغل خانة' }
};
const dlSlotLine = (S, type) => (type === 'report' ? 'لا يشغل خانة' : 'يشغل خانة ' + (delegUsed(S) + 1) + ' من ' + delegCap(S));
function delegCanAdd(S, spec) {
  const D = delegOf(S); if (!D) return NO('لا ناظر ديوان عندك'); const K = DELEG_KINDS[spec.kind]; if (!K) return NO('مهمة غير معروفة');
  if (!K.types.includes(spec.type)) return NO('هذا النوع لا يناسب المهمة'); if (!DELEG_MODES[spec.mode]) return NO('اختر نفّذ أو اسألني أو اتركه لي');
  if (spec.scope !== '*' && !S.cities[spec.scope]) return NO('مدينة غير معروفة'); spec = Object.assign({}, spec, { limits: spec.limits || {} });
  if (spec.type !== 'report') { const used = delegUsed(S), cap = delegCap(S); if (used >= cap) return NO('الخانات ممتلئة (' + used + '/' + cap + '): أنجز مهمة أو ألغِ واحدة'); }
  else if ((D.tasks || []).filter(t => t.type === 'report').length >= DELEG.reportMax) return NO('تقريرك الأسبوعي مضاف أصلاً');
  return K.check(S, spec);
}
function delegExec(S, D, t, forced) { // ينفّذ المهمة الآن أو يسأل/يذكّر بحسب وضعها
  const K = DELEG_KINDS[t.kind]; if (!K || D.frozen) return;
  if (t.pend) { if (t.pend.remind || t.pend.due == null || t.pend.due > S.day) return; const text = t.pend.text; t.pend = null; return delegDo(S, D, t, 'انتهت مهلة سؤالك فنفّذتُ: ' + text); }
  if (t.cool != null && t.cool > S.day) return;
  if (t.type === 'report') { if (t.last != null && S.day - t.last < DELEG.reportEvery && !forced) return; return delegDo(S, D, t, ''); }
  const p = K.plan(S, t), need = p && (p.total != null ? p.total : p.n); if (!p || !(p.n > 0)) { if (t.type === 'once' && !(need > 0)) { delegFinish(S, D, t, 'لا شيء يحتاج تدخلي الآن' + (t.kind === 'shopfix' ? ': لا دكان تحت حالة ' + t.limits.below + ' في ' + dlCityName(S, t.scope) : '')); } return; }
  if (t.mode === 'exec') return delegDo(S, D, t, '');
  t.pend = t.mode === 'ask' ? { d: S.day, due: S.day + DELEG.wait, text: p.text } : { d: S.day, remind: true, text: 'ذكّرتك: ' + p.text.replace(/^أ/, 'يمكن أن أ') };
}
function delegFinish(S, D, t, text) { D.tasks = D.tasks.filter(x => x !== t); dlRec(S, D, t, t.kind, 'أنجزتُ «' + DELEG_KINDS[t.kind].name + '»: ' + text, 0, { irrev: true, fin: 1 }); if (!D.tasks.length) delete D.tasks; }
function delegDo(S, D, t, pre) {
  const K = DELEG_KINDS[t.kind], c0 = S.ctxCur, r = K.run(S, t); S.ctxCur = c0; if (!r) return;
  if (r.did) { dlRec(S, D, t, t.kind, (pre ? pre + ' — ' : '') + r.did, r.cost, K.undo ? { u: r.u || 1 } : { irrev: true }); if (r.news) news(S, 'ناظر الديوان: ' + r.did); }
  if (r.done) delegFinish(S, D, t, r.did || 'تمّت');
}
function delegDay(S) {
  const D = delegOf(S); if (!D || !D.tasks || !D.tasks.length || D.dd === S.day) return; D.dd = S.day; const keep = S.ctxCur;
  for (const t of D.tasks.slice()) { if (!D.tasks.includes(t)) continue; if (t.type === 'once' && S.day - t.since > DELEG.onceDays) { delegFinish(S, D, t, 'لم يتيسر خلال ' + DELEG.onceDays + ' يوماً (الرصيد أو الشرط)، فألغيتُها'); continue; } delegExec(S, D, t); }
  S.ctxCur = keep;
}
function delegAdd(S, spec) {
  const q = delegCanAdd(S, spec); if (!q.ok) return q; const D = delegOf(S), K = DELEG_KINDS[spec.kind];
  const t = { id: S.nextId++, type: spec.type, kind: spec.kind, scope: spec.scope || '*', limits: K.norm(spec), mode: spec.type === 'report' ? 'exec' : spec.mode, since: S.day, status: 'active', log: [] };
  if (spec.type === 'standing') t.win = { d: S.day, cap: Math.round(S.player.gold * t.limits.pct / 100), spent: 0 };
  (D.tasks || (D.tasks = [])).push(t); dlRec(S, D, t, t.kind, 'قبلتُ «' + K.name + '» (' + DELEG_TYPES[t.type] + ')', 0, { irrev: true, add: 1 }); delegExec(S, D, t, true);
  return OK('فوّضتَ «' + K.name + '»' + (t.type === 'report' ? '' : ': ' + delegUsed(S) + '/' + delegCap(S) + ' خانة'));
}
function delegCancel(S, id) {
  const D = delegOf(S); const t = D && (D.tasks || []).find(x => x.id === id); if (!t) return NO('المهمة لم تعد قائمة');
  D.tasks = D.tasks.filter(x => x !== t); dlRec(S, D, t, t.kind, 'ألغيتَ «' + DELEG_KINDS[t.kind].name + '» فتحرّرت خانتها', 0, { irrev: true, fin: 1 }); if (!D.tasks.length) delete D.tasks; return OK('أُلغيت المهمة وتحرّرت خانتها');
}
function delegFreeze(S, on) {
  const D = delegOf(S); if (!D) return NO('لا ناظر ديوان عندك');
  if (on) { if (D.frozen) return NO('المهام مجمَّدة أصلاً'); D.frozen = true; return OK('جُمّدت كل المهام: لا تنفيذ حتى تستأنف، وتبقى خاناتها'); }
  if (!D.frozen) return NO('المهام تعمل أصلاً'); delete D.frozen; for (const t of D.tasks || []) if (t.pend && t.pend.due != null) t.pend.due = S.day + DELEG.wait; return OK('استؤنفت المهام');
}
function delegAnswer(S, id, ans) {
  const D = delegOf(S); const t = D && (D.tasks || []).find(x => x.id === id); if (!t || !t.pend) return NO('السؤال لم يعد قائماً'); const p = t.pend;
  if (ans === 'do' && !p.remind) { t.pend = null; delegDo(S, D, t, ''); return OK('نُفّذ عنك.'); }
  t.pend = null; t.cool = S.day + DELEG.again; dlRec(S, D, t, t.kind, 'تولّيتَ بنفسك: ' + p.text, 0, { irrev: true });
  if (t.type === 'once') delegFinish(S, D, t, 'تولّيتَها بنفسك'); return OK(p.remind ? 'حسناً.' : 'حسناً، أنت تتولاها.');
}
function delegUndo(S, i) {
  const D = delegOf(S), e = D && D.tlog && D.tlog[i]; if (!e) return NO('لا فعل للتراجع عنه'); const K = DELEG_KINDS[e.kind];
  if (!K || !K.undo || e.irrev || !e.u) return NO('هذا الفعل غير قابل للتراجع'); if (e.undone) return NO('تراجعتَ عنه أصلاً'); if (S.day - e.d > DELEG.undoDays) return NO('مضت مهلة التراجع (' + DELEG.undoDays + ' أيام)');
  const r = K.undo(S, e); if (r && r.ok === false) return r; e.undone = true; dlRec(S, D, null, e.kind, 'تراجعتَ عن: ' + e.text, e.amount, { irrev: true }); return OK('تُراجع عنه');
}
/* ---- اسأل الناظر: ستة أسئلة جاهزة تُجاب من بيانات اللاعب الفعلية، وكل جواب ينتهي بأزرار فعل ---- */
const DELEG_QS = [['status', 'كيف حال أعمالي؟'], ['loss', 'أين أخسر؟'], ['neglect', 'ماذا أهملتُ؟'], ['suggest', 'ماذا أفوّض؟'], ['rival', 'من أقوى منافس؟'], ['news', 'أخبار الأسواق؟']];
const DL_LOSS_SKIP = ['purchases', 'assets', 'debtPaid', 'loanBack', 'investment', 'foundCity', 'hiring'];
function dlLoss(S) { // مصادر الخسارة: كل بنود المصروف عدا المشتريات والأصول وسداد الأصل (ليست خسائر)، في آخر 30 يوماً أو منذ البداية
  const L = hsLedger(S), ring = S.player.hs || [], P = S.player; let snap = null; for (const s of ring) if (S.day - s.d >= HOMEST.minDays) snap = s; const base = snap ? snap.exp : {}, rows = [];
  for (const k in P.led.exp) { if (DL_LOSS_SKIP.includes(k)) continue; const v = (P.led.exp[k] || 0) - (base[k] || 0); if (v >= 1) rows.push({ k, v }); }
  rows.sort((a, b) => b.v - a.v); return { rows: rows.slice(0, 3), since: L.since, days: L.days };
}
function delegAsk(S, q, names) {
  names = names || {}; const out = { q, title: (DELEG_QS.find(x => x[0] === q) || [0, ''])[1], lines: [], acts: [] }, L = out.lines;
  const go = (w, label, c) => out.acts.push({ id: 'go-' + w, kind: 'go', w, c: c || '', label: label || 'تصرّف بنفسك' }), dl = (spec, label, off) => out.acts.push({ id: 'dl-' + spec.kind, kind: 'add', spec, label: label || 'فوِّضه للناظر', off: off || '' });
  const sf = { kind: 'shopfix', type: 'standing', scope: '*', limits: { below: 55, pct: 5 }, mode: 'exec' }, br = { kind: 'brief', type: 'report', scope: '*', limits: {}, mode: 'exec' };
  const offFor = spec => { const c = delegCanAdd(S, spec); return c.ok ? '' : c.msg; };
  if (q === 'status') { dlBriefLines(S).forEach(x => L.push(x)); go('ledger', 'افتح الدفتر'); dl(br, 'فوِّض تقريراً أسبوعياً', offFor(br)); }
  else if (q === 'loss') {
    const x = dlLoss(S); L.push('أكبر مصادر النفقات والخسائر ' + (x.since === 'start' ? 'منذ البداية' : 'في آخر ' + x.days + ' يوماً') + ' (دون المشتريات والأصول وسداد الأصل):');
    if (!x.rows.length) L.push('لا نفقات مسجّلة بعد.'); x.rows.forEach((r, i) => L.push((i + 1) + ') ' + (names[r.k] || 'بند آخر (' + r.k + ')') + ': ' + fmtN(r.v) + ' ريال')); go('ledger', 'افتح الدفتر');
    if (x.rows.some(r => r.k === 'upkeep')) dl(sf, 'فوِّض ترميم الدكاكين', offFor(sf)); }
  else if (q === 'neglect') {
    const sh = hsShops(S), bad = sh ? sh.list.filter(s => s.cond < HOMEST.badBelow) : [], dues = (S.paymentDues || []).filter(d => d && d.amount > 0), lv = typeof liqView === 'function' ? liqView(S) : null;
    const cars = (S.player.caravans || []).filter(c => { try { return ccIdleNow(S, c); } catch (e) { return false; } });
    if (bad.length) L.push('دكاكين تحت ' + HOMEST.badBelow + ': ' + bad.length + ' (' + bad.slice(0, 3).map(s => s.cityName + ' ' + Math.round(s.cond)).join('، ') + ')');
    if (dues.length) L.push('متأخرات غير مسدّدة: ' + dues.length + ' بنحو ' + fmtN(dues.reduce((a, d) => a + d.amount, 0)) + ' ريال');
    if (lv && lv.low) L.push('سيولة قليلة: تغطي ' + (lv.days === Infinity ? 'كل التزاماتك' : Math.floor(lv.days) + ' يوماً') + ' فقط');
    if (cars.length) L.push('قوافل واقفة بلا مسار: ' + cars.length);
    if (!L.length) L.push('لا شيء مهمل الآن: لا دكان تحت ' + HOMEST.badBelow + '، ولا متأخرات، ولا سيولة قليلة، ولا قافلة واقفة.');
    if (bad.length) { go('shops', 'افتح الدكاكين', bad[0].city); dl(sf, 'فوِّض ترميم الدكاكين', offFor(sf)); } else if (lv && lv.low) go('liq', 'اضبط السيولة'); else go('shops', 'افتح العقارات'); }
  else if (q === 'suggest') {
    const used = delegUsed(S), cap = delegCap(S), tmp = { id: 0, kind: 'shopfix', type: 'standing', scope: '*', mode: 'exec', limits: { below: 55, pct: 5 } }, p = DELEG_KINDS.shopfix.plan(S, tmp), D = delegOf(S), hasBrief = !!((D && D.tasks) || []).find(t => t.kind === 'brief');
    L.push('خاناتك: ' + used + ' من ' + cap + ' مستعملة.');
    if (p.total > 0) { L.push('ترميم دائم تحت 55: ' + p.total + ' دكان الآن بنحو ' + fmtN(p.cost) + ' ريال، ويشغل خانة ' + (used + 1) + ' من ' + cap + ' (أجر الناظر +' + DELEG.wageStep + ' يومياً)'); dl(sf, 'فوِّض الترميم الدائم', offFor(sf)); }
    else L.push('الترميم: لا دكان تحت 55 الآن، فلا حاجة لخانة.');
    if (!hasBrief) { L.push('تقرير أسبوعي بأرقام أعمالك: لا يشغل خانة'); dl(br, 'فوِّض التقرير الأسبوعي', offFor(br)); }
    if (p.total === 0 && hasBrief) L.push('لا شيء يستحق التفويض الآن.'); go('shops', 'افتح العقارات'); }
  else if (q === 'rival') {
    const rv = rgW(S) ? (S.rivals || []).filter(r => r.out == null && r.w != null && S.cities[r.city]).sort((a, b) => b.w - a.w || a.id - b.id)[0] : null, w = rv && rgWView(S, rv);
    if (!rv || !w) L.push('لا بيانات بعد.'); else L.push(rv.name + ' في ' + S.cities[rv.city].name + ': ثروته ' + (w.exact ? fmtN(w.v) : 'بين ' + fmtN(w.lo) + ' و' + fmtN(w.hi)) + ' ريال (معرفتك به: ' + w.knName + ')');
    go('riv', 'افتح المنافسين'); dl(br, 'فوِّض تقريراً أسبوعياً', offFor(br)); }
  else if (q === 'news') {
    const ns = (S.news || []).filter(n => !/^ناظر الديوان/.test(n.t) && S.day - n.d <= 30).slice(0, 5); if (!ns.length) L.push('لا أخبار جديدة في آخر 30 يوماً.'); ns.forEach(n => L.push((S.day - n.d === 0 ? 'اليوم' : 'قبل ' + (S.day - n.d) + ' يوماً') + ': ' + n.t));
    go('map', 'افتح الخريطة'); dl(br, 'فوِّض تقريراً أسبوعياً', offFor(br)); }
  else return null;
  return out;
}
function delegView(S) {
  const D = delegOf(S); if (!D) return { on: false };
  const used = delegUsed(S), cap = delegCap(S), tasks = (D.tasks || []).map(t => { const K = DELEG_KINDS[t.kind]; return { id: t.id, type: t.type, kind: t.kind, name: K ? K.name : t.kind, scope: t.scope, scopeName: dlCityName(S, t.scope), mode: t.mode, modeName: DELEG_MODES[t.mode], limits: t.limits, since: t.since, pend: t.pend || null, win: t.win || null, last: t.last == null ? null : t.last, log: t.log }; });
  return { on: true, grade: delegGrade(S), cap, used, free: cap - used, wageStep: DELEG.wageStep, wageExtra: used * DELEG.wageStep, wage: DIWAN.wage + used * DELEG.wageStep, frozen: !!D.frozen, tasks, log: (D.tlog || []).slice(0, 12), nextCap: delegGrade(S) < DELEG.caps.length ? DELEG.caps[delegGrade(S)] : null };
}
function delegMigrate(S, D) { // الناظر بلا tasks = لا مهام مفوَّضة؛ يُنقّى ما وُجد فقط
  const kinds = ['once', 'standing', 'report'];
  if (D.tasks !== undefined) { D.tasks = (Array.isArray(D.tasks) ? D.tasks : []).filter(t => t && Number.isSafeInteger(t.id) && kinds.includes(t.type) && typeof t.kind === 'string' && typeof t.scope === 'string' && t.limits && typeof t.limits === 'object' && DELEG_MODES[t.mode] && Number.isSafeInteger(t.since) && t.since <= S.day).slice(0, DELEG.caps[DELEG.caps.length - 1] + DELEG.reportMax);
    for (const t of D.tasks) { t.status = 'active'; if (!Array.isArray(t.log)) t.log = []; t.log = t.log.slice(0, 10); S.nextId = Math.max(S.nextId || 1, t.id + 1); if (t.pend && (typeof t.pend !== 'object' || typeof t.pend.text !== 'string')) delete t.pend; if (!t.pend) t.pend = null; }
    if (!D.tasks.length) delete D.tasks; }
  if (D.tlog !== undefined) { D.tlog = (Array.isArray(D.tlog) ? D.tlog : []).filter(e => e && Number.isSafeInteger(e.d) && e.d <= S.day && typeof e.text === 'string' && Number.isFinite(e.amount)).slice(0, DELEG.logMax); if (!D.tlog.length) delete D.tlog; }
  if (D.frozen !== undefined && D.frozen !== true) delete D.frozen; if (D.dd !== undefined && !Number.isSafeInteger(D.dd)) delete D.dd;
}
Object.assign(A, { delegAdd, delegCancel, delegFreeze, delegAnswer, delegUndo });
