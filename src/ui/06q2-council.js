/* ---------- 043أ «مجلس الناظر» (يد الديوان اليمنى): نافذة سفلية بمكوّنات 037 (dsheet وask) فقط ----------
   نقطة الوصول: الرئيسية ← «حال أعمالي» ← زر «مجلس الناظر» في رأس البطاقة (نقرتان). لا قوائم منسدلة ولا أيقونات جديدة.
   قاعدة ظهور الاختيار: كل خيار on + aria-pressed="true" مع سطر ملخّص بالرقم، والنافذة تُعاد رسمها بعد كل اختيار.
   كل الأرقام من E.delegView/E.delegAsk (المحرك)؛ الأزرار تستدعي A.deleg* القائمة فقط. E.DELEG.on=false ⇒ لا زر ولا نافذة. */
const dlSt = { draft: null, q: null, adding: false };
const dlUiOn = () => { try { return !!(hsUiOn() && E.delegOf(S)); } catch (e) { return false; } };
function dlDraft() { if (!dlSt.draft) dlSt.draft = Object.assign({ kind: 'shopfix' }, E.DELEG_KINDS.shopfix.def); return dlSt.draft; }
const dlSpec = d => ({ kind: d.kind, type: d.type, scope: d.scope, mode: d.mode, limits: d.kind === 'rvpart' ? { capPct: d.capPct, minShare: d.minShare } : { below: d.below, pct: d.pct } });
const dlOk = { ok: true, msg: '' };
function dlHead() { return dlUiOn() ? `<button type="button" class="dchip hs-council" data-dchip="fold:hs-council" aria-expanded="${dsh.domain === 'fold:hs-council'}" aria-label="مجلس الناظر" style="min-height:44px;padding:6px 12px">${dIc('ui-delegate')}<span class="dnm">مجلس الناظر</span></button>` : ''; }
function dlStatus(t, v) {
  if (v.frozen) return 'مجمَّدة'; if (t.pend) return t.pend.remind ? 'تذكير بانتظارك' : 'تنتظر ردّك · تُنفَّذ بعد ' + Math.max(0, t.pend.due - S.day) + ' يوماً إن لم تردّ';
  if (t.type === 'report') return t.last == null ? 'تعمل أسبوعياً' : 'آخر تقرير قبل ' + (S.day - t.last) + ' يوماً'; return t.type === 'once' ? 'تنتظر التنفيذ' : 'تعمل كل يوم';
}
function dlTaskHTML(t, v) {
  const desc = t.kind === 'rvpart' ? 'عروض المنافسين الواردة · سقف ' + t.limits.capPct + '٪ من رصيدك للعقد · نسبة لك ≥ ' + Math.round(t.limits.minShare * 100) + '٪ · ' + t.modeName : (t.limits.below ? 'تحت حالة ' + t.limits.below + ' · ' : '') + t.scopeName + (t.limits.pct ? ' · ميزانية ' + t.limits.pct + '٪ من رصيدك' + (t.win ? ' (هذا الشهر ' + fmt(t.win.spent) + ' من ' + fmt(t.win.cap) + ')' : '') : '') + ' · ' + t.modeName;
  const pend = t.pend ? `<div class="small" data-dl-pend>${esc(t.pend.text)}</div><div class="row" style="flex-wrap:wrap">${t.pend.remind ? '' : `<button type="button" class="sm pri" data-act="dlans" data-i="${t.id}" data-a="do" style="min-height:44px">نفّذ عني</button>`}<button type="button" class="sm" data-act="dlans" data-i="${t.id}" data-a="mine" style="min-height:44px">${t.pend.remind ? 'حسناً' : 'سأتولاها'}</button></div>` : '';
  return `<div class="card dl-task" data-dltask="${t.id}"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><b class="small">${esc(t.name)}</b><span class="pill${t.type === 'report' ? '' : ' good'}">${E.DELEG_TYPES[t.type]}${t.type === 'report' ? ' · بلا خانة' : ''}</span></div><div class="small">${esc(desc)}</div><div class="small muted">${esc(dlStatus(t, v))}</div>${pend}<button type="button" class="sm" data-act="dlcancel" data-i="${t.id}" style="min-height:44px;margin-top:6px">ألغِ المهمة</button></div>`;
}
function dlAskHTML() {
  const q = dlSt.q, r = q ? E.delegAsk(S, q, LN) : null;
  const btns = E.DELEG_QS.map(([k, n]) => `<button type="button" class="dopt${q === k ? ' on' : ''}"${q === k ? ' aria-pressed="true"' : ' aria-pressed="false"'} data-act="dlq" data-q="${k}" style="min-height:44px">${dIc('ui-delegate')}<span class="dot">${esc(n)}</span></button>`).join('');
  const ans = r ? `<div class="card dl-answer" data-dl-answer="${q}"><b class="small">${esc(r.title)}</b>${r.lines.map(l => `<div class="small">${esc(l)}</div>`).join('')}<div class="row" style="flex-wrap:wrap;margin-top:6px">${r.acts.map((a, i) => a.kind === 'go' ? `<button type="button" class="sm" data-act="dlgo" data-w="${a.w}" data-c="${esc(a.c)}" style="min-height:44px">${esc(a.label)}</button>` : `<button type="button" class="sm pri" data-act="dladd" data-i="${i}" style="min-height:44px"${a.off ? ' disabled' : ''}>${esc(a.label)}</button>${a.off ? `<span class="small dear">${esc(a.off)}</span>` : ''}`).join('')}</div></div>` : '<p class="small muted">اختر سؤالاً: يجيبك الناظر من أرقامك الفعلية.</p>';
  return `<h4 class="dsec">اسأل الناظر</h4><div class="dl-qs" style="display:grid;gap:6px">${btns}</div>${ans}`;
}
function dlAskCards() { // بطاقات «أضف مهمة» بمكوّن ask: كل خيار يُظلَّل ويُعاد رسم النافذة
  if (!dlUiOn() || !dlSt.adding) return []; const d = dlDraft(), K = E.DELEG_KINDS[d.kind], cards = [], ok = () => dlOk;
  cards.push({ id: 'dl:kind', icon: 'ui-delegate', title: 'ماذا يفوَّض؟', why: K.name, state: 'open', prio: 1, keep: true, opts: Object.values(E.DELEG_KINDS).map(k => ({ id: 'k-' + k.id, icon: 'ui-delegate', title: k.name, effect: k.types.includes('report') ? 'لا يشغل خانة' : 'يشغل خانة', on: d.kind === k.id, act: () => { dlSt.draft = Object.assign({ kind: k.id }, k.def); return dlOk; } })) });
  for (const f of K.fields(S, d)) cards.push({ id: 'dl:f:' + f.k, icon: 'ui-delegate', title: f.title, why: (f.opts.find(o => o.v === d[f.k]) || {}).label || '', state: 'open', prio: 2, keep: true, opts: f.opts.map(o => ({ id: 'v-' + o.v, icon: 'ui-delegate', title: o.label, effect: o.effect, on: o.v === d[f.k], act: () => { d[f.k] = o.v; return dlOk; } })) });
  const can = E.delegCanAdd(S, dlSpec(d));
  cards.push({ id: 'dl:go', icon: 'ui-delegate', title: 'أضف المهمة', why: dlSumLine(), state: 'open', prio: 3, keep: true, opts: [can.ok ? { id: 'add', icon: 'ui-delegate', title: 'أضف المهمة', effect: dlSlot(d), best: true, act: () => { const r = A.delegAdd(S, dlSpec(d)); if (r.ok) { dlSt.adding = false; dlSt.draft = null; } return r; } } : { id: 'add', icon: 'ui-delegate', title: 'أضف المهمة', off: can.msg }] });
  return cards;
}
const dlSlot = d => E.DELEG_KINDS[d.kind].types.includes('report') ? 'لا يشغل خانة' : 'يشغل خانة ' + (E.delegUsed(S) + 1) + ' من ' + E.delegCap(S);
const dlSumLine = () => { const d = dlDraft(); return E.DELEG_KINDS[d.kind].sum(S, d) + ' · ' + dlSlot(d); };
function dlBody() {
  if (!dlUiOn()) return ''; const v = E.delegView(S), L = v.log.slice(0, 8);
  const head = `<div class="kv"><span>الخانات المستعملة</span><b class="num" data-dl-slots>${v.used} من ${v.cap}</b></div>${bar(v.used, v.cap)}<div class="kv small"><span>أجر الناظر اليومي</span><b class="num">${fmt(v.wage)}${v.wageExtra ? ` <span class="muted">(+${fmt(v.wageExtra)} للخانات)</span>` : ''}</b></div><p class="small muted">${v.nextCap ? 'تنمو الخانات إلى ' + v.nextCap + ' بدرجة الناظر التالية (بطول خدمته). ' : 'بلغت أقصى سعة. '}كل خانة مستعملة تزيد أجره ${fmt(v.wageStep)} يومياً؛ والتقارير لا تشغل خانة، والواجبات الخمسة القائمة لا تشغلها أيضاً.</p>`
    + `<button type="button" class="dopt${v.frozen ? ' on' : ''}" aria-pressed="${v.frozen ? 'true' : 'false'}" data-act="dlfreeze" data-on="${v.frozen ? 0 : 1}" style="min-height:44px">${dIc('ui-delegate')}<span class="dot">${v.frozen ? 'مجمَّدة: اضغط لاستئناف المهام' : 'تجميد الكل'}</span><span class="dos">${v.frozen ? 'لا تنفيذ ولا أسئلة حتى تستأنف، وخاناتها محجوزة' : 'يوقف كل المهام دون حذفها'}</span></button>`;
  const tasks = v.tasks.length ? v.tasks.map(t => dlTaskHTML(t, v)).join('') : '<p class="small muted">لا مهام مفوَّضة بعد. أضف مهمة أو اسأل الناظر عما يستحق التفويض.</p>';
  const add = `<button type="button" class="sm pri" data-act="dlnew" style="width:100%;min-height:44px;margin-top:8px"${dlSt.adding ? ' aria-pressed="true"' : ''}>${dlSt.adding ? 'أغلق «أضف مهمة»' : 'أضف مهمة'}</button>` + (dlSt.adding ? `<p class="small" data-dl-sum><b>${esc(dlSumLine())}</b></p>${dlAskCards().map(c => ask(c, c.id)).join('')}` : '');
  const log = L.length ? L.map((e, i) => `<div class="small diwan-did">${esc(E.dateOf(S, e.d).hs)} · ${esc(e.text)}${e.amount > 0 ? ' · ' + fmt(e.amount) + ' ريال' : ''}${e.irrev && !e.add && !e.fin && e.amount > 0 ? ' <span class="pill">غير قابل للتراجع</span>' : ''}${e.undone ? ' <span class="pill">تُراجع عنه</span>' : e.u && !e.irrev && S.day - e.d <= E.DELEG.undoDays ? ` <button type="button" class="sm" data-act="dlundo" data-i="${i}" style="min-height:44px">تراجع</button>` : ''}</div>`).join('') : '<p class="small muted">لم يفعل شيئاً بعد.</p>';
  return `<div class="dl-council">${roleHead('characters/diwan-nazir', 'ناظر الديوان', '<h4 class="dsec" style="margin:0">مجلس الناظر</h4>')}${head}<h4 class="dsec">المهام المفوَّضة</h4>${tasks}${add}${dlAskHTML()}<h4 class="dsec">سجل الناظر</h4>${log}</div>`;
}
function dlGo(w, c) { if (w === 'map') { dClose(); return go('map'); } return hsGo(w, c); }
function dlAct(d) { // يُستدعى من 16-events: كل ضغط يُعاد معه رسم النافذة
  let r = null, a;
  if (d.act === 'dlfreeze') r = A.delegFreeze(S, d.on === '1');
  else if (d.act === 'dlcancel') r = A.delegCancel(S, +d.i);
  else if (d.act === 'dlans') r = A.delegAnswer(S, +d.i, d.a);
  else if (d.act === 'dlundo') r = A.delegUndo(S, +d.i);
  else if (d.act === 'dlnew') { dlSt.adding = !dlSt.adding; if (dlSt.adding) dlDraft(); }
  else if (d.act === 'dlq') dlSt.q = dlSt.q === d.q ? null : d.q;
  else if (d.act === 'dladd') { a = E.delegAsk(S, dlSt.q, LN).acts[+d.i]; r = a && a.kind === 'add' ? A.delegAdd(S, a.spec) : null; }
  else if (d.act === 'dlgo') return dlGo(d.w, d.c);
  if (r) { act(r); if (r.ok) { try { persist(); } catch (e) {} } } dsh.keep = true; dRender();
}
