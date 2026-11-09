/* شيخ القوافل (026): بطاقة في المكتب وسطر في شاشة الأسطول. مع ناظر الديوان يظهر تقريره وأسئلته داخل بطاقة الناظر (FR-004)، وإلا في بطاقته. */
function cchiefOpen() { return !!(E.CHIEFC.on && S.player && !S.player.cchief && E.cchiefQuote(S).open); }
function cchiefGoalStep() {
  const q = E.cchiefQuote(S); if (!E.CHIEFC.on || S.player.cchief || !q.open) return null;
  return { v: q.have, max: q.fee, done: false, step: q.ok ? ['وظّف شيخ القوافل', 'cchiefhire'] : null, why: q.ok ? 'الشروط كلها متحققة: وظّفه الآن.' : 'وظّف شيخ القوافل: اجمع ' + fmt(Math.ceil(q.fee - q.have)) + ' ريال أخرى (الرسم ' + fmt(q.fee) + ' ثم أجر ' + q.wage + ' ريال يومياً).' };
}
function cchiefHireHTML() {
  const q = E.cchiefQuote(S); if (!E.CHIEFC.on || S.player.cchief || !q.open) return '';
  return `<section class="card cchief cchief-hire" aria-label="شيخ القوافل"><h3 style="margin-top:0">شيخ القوافل</h3><p class="small muted">يقرأ أسطولك كله فيريح القائد المتعب بالتناوب، ويعيد القافلة الواقفة إلى العمل، ويوجّه قافلة لجلب سلعة نفدت من دكاكين مدينة أمينك. لا يشتري قافلة ولا يفصل قائداً ولا يمس قافلة وجّهتَها بيدك في آخر أسبوع.</p>${bar(Math.min(q.have, q.fee), q.fee)}<div class="kv small"><span>الرسم مرة واحدة</span><b class="num">${lm(q.fee)}</b></div><div class="kv small"><span>الأجر اليومي بعد التوظيف</span><b class="num">${lm(q.wage)}</b></div>${q.ok ? '<button class="sm pri" data-act="cchiefhire">وظّف شيخ القوافل</button>' : `<div class="small muted">${esc(q.reasons.join(' · '))}</div>`}</section>`;
}
function cchiefRuleHTML(type, r) {
  const T = E.CHIEFC_TYPES[type], modes = Object.entries(E.DIWAN_MODES);
  return `<div class="card cchief-rule" data-ccrtype="${type}"><b class="small">${esc(T.name)}</b><div class="row" style="flex-wrap:wrap;margin:4px 0 0"><select data-ccr="${type}" data-ccf="mode" aria-label="${esc(T.name)}">${modes.map(([k, n]) => `<option value="${k}" ${r.mode === k ? 'selected' : ''}>${n}</option>`).join('')}</select>${r.mode === 'ask' ? `<label class="small">المهلة <select data-ccr="${type}" data-ccf="wait" aria-label="المهلة بالأيام">${E.CHIEFC.waits.map(w => `<option value="${w}" ${r.wait === w ? 'selected' : ''}>${w} ${w === 1 ? 'يوم' : 'أيام'}</option>`).join('')}</select></label>` : ''}${type === 'supply' ? `<label class="small">ميزانية الرحلة <input type="number" min="${E.CAP_SUP.minBudget}" max="10000000" step="100" value="${r.budget}" data-ccr="supply" data-ccf="budget" style="width:100px" aria-label="ميزانية الرحلة بالريال"></label><label class="small">الكمية <input type="number" min="1" max="10000" step="1" value="${r.target}" data-ccr="supply" data-ccf="target" style="width:80px" aria-label="الكمية المستهدفة"></label>` : ''}</div></div>`;
}
function cchiefAskHTML(a) {
  return `<div class="card cchief-ask" data-ccask="${a.id}"><div class="small">${esc(a.text)}</div><div class="row" style="flex-wrap:wrap;margin:4px 0 0">${a.remind ? `<button class="sm" data-act="cchiefans" data-i="${a.id}" data-a="mine">حسناً</button>` : `<button class="sm pri" data-act="cchiefans" data-i="${a.id}" data-a="do">نفّذ عني</button><button class="sm" data-act="cchiefans" data-i="${a.id}" data-a="mine">سأتولاها</button><span class="small muted">${a.due != null ? 'ينفّذ بعد ' + Math.max(0, a.due - S.day) + ' يوماً إن لم تردّ' : ''}</span>`}</div></div>`;
}
const cchiefDidHTML = l => `<div class="small cchief-did">${esc(E.dateOf(S, l.d).hs)} · ${esc(l.text)}</div>`;
function cchiefSummary(v) { const n = k => v.did.filter(l => l.kind === k).length; const p = []; if (n('rest')) p.push('أرحتُ ' + n('rest') + ' ' + (n('rest') === 1 ? 'قائداً' : 'قادة')); if (n('rescue')) p.push('أعدتُ ' + n('rescue') + ' واقفة إلى العمل'); if (n('supply')) p.push('وجّهتُ ' + n('supply') + ' لجلب سلعة ناقصة'); return 'قوافلك هذا الأسبوع: ' + (p.length ? p.join('، ') + '.' : 'كل شيء يسير؛ لم أحتج إلى تدخل.'); }
function cchiefHTML() {
  if (!E.CHIEFC.on || !S.learn || !S.learn.char) return '';
  if (!S.player.cchief) return cchiefHireHTML();
  const v = E.cchiefView(S), withDiwan = !!S.player.diwan && E.DIWAN.on;
  const rules = Object.keys(E.CHIEFC_TYPES).map(k => cchiefRuleHTML(k, v.rules[k])).join('') + '<p class="small muted">لا يشتري قافلة ولا يفصل قائداً: هذا لك وحدك. ولا يمس قافلة وجّهتَها بيدك في آخر أسبوع.</p>';
  const own = withDiwan ? '<p class="small muted">تقريره وأسئلته تظهر في بطاقة ناظر الديوان.</p>' : `${askSink ? '<p class="small muted">أسئلته في تبويب «اليوم».</p>' : `<div class="card cchief-wait"><b>ما ينتظرك</b>${v.ask.map(cchiefAskHTML).join('') || '<div class="small muted">لا أسئلة معلّقة.</div>'}</div>`}<div class="card cchief-done"><b>ما فعلته عنك (آخر 7 أيام)</b>${v.did.length ? v.did.map(cchiefDidHTML).join('') : '<div class="small muted">لم يفعل شيئاً هذا الأسبوع.</div>'}</div>`;
  return `<section class="card cchief" aria-label="شيخ القوافل"><h3 style="margin-top:0">شيخ القوافل <span class="pill good">يعمل</span></h3><p class="small muted">أجره ${lm(v.wage)} يومياً · يشرف على ${v.cars} قافلة بقادة مستأجرين${v.resting ? ' · ' + v.resting + ' في راحة' : ''}.</p><p class="small cchief-sum">${esc(cchiefSummary(v))}</p>${own}${foldDet('cchief-rules', false, '<b>من يقرر؟</b> <span class="small muted">(قواعد الشيخ)</span>', rules)}<button class="sm" data-act="cchieffire">سرّح الشيخ</button></section>`;
}
function cchiefLine() { // سطر في شاشة الأسطول
  if (!E.CHIEFC.on || !S.learn || !S.learn.char) return '';
  if (S.player.cchief) { const v = E.cchiefView(S); return `<div class="card cchief-line"><b>شيخ القوافل</b><div class="small">${esc(cchiefSummary(v))}</div>${v.ask.length ? `<div class="small dear">${v.ask.length} ${v.ask.length === 1 ? 'سؤال ينتظر' : 'أسئلة تنتظر'} ردّك في «المكتب».</div>` : ''}</div>`; }
  const q = E.cchiefQuote(S); return q.open ? `<div class="card cchief-line"><b>شيخ القوافل</b><div class="small muted">${q.ok ? 'الشروط متحققة؛ وظّفه من «المكتب».' : esc(q.reasons.join(' · '))}</div></div>` : '';
}
