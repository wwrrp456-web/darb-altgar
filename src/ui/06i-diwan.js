/* ناظر الديوان (025): بطاقة في المكتب: التوظيف، الخزينة، من يقرر، ما فعلته عنك، وما ينتظرك. الأزرار تستدعي أفعال الناظر القائمة في المحرك. */
const DIWAN_KIND = { pay: 'سداد', fill: 'تعبئة', sell: 'بيع', herd: 'صفقة', ask: 'سؤال', remind: 'تذكير' };
function diwanOpen() { return !!(E.DIWAN.on && S.player && !S.player.diwan && E.diwanQuote(S).open); }
function diwanGoalStep() {
  const q = E.diwanQuote(S); if (!E.DIWAN.on || S.player.diwan || !q.open) return null;
  return { v: q.have, max: q.fee, done: false, step: q.ok ? ['وظّف ناظر الديوان', 'diwanhire'] : null, why: q.ok ? 'الشروط كلها متحققة: وظّفه الآن.' : 'وظّف ناظر الديوان: اجمع ' + fmt(Math.ceil(q.fee - q.have)) + ' ريال أخرى (الرسم ' + fmt(q.fee) + ' ثم أجر ' + q.wage + ' ريال يومياً).' };
}
function diwanHireHTML() {
  const q = E.diwanQuote(S); if (!E.DIWAN.on || S.player.diwan || !q.open) return '';
  return `<section class="card diwan diwan-hire" aria-label="ناظر الديوان"><h3 style="margin-top:0">ناظر الديوان</h3><p class="small muted">يقوم مقامك في الروتين حين تغيب: يغطي الأجور من خزينة تودعها عنده، ويعبّئ دكاكينك حين يمتلئ المخزن، ويذكّرك بالمواعيد. لا يخترع أعمالاً جديدة، ولا يتصرف في الزكاة ولا في المشاريع الكبرى.</p>${bar(Math.min(q.have, q.fee), q.fee)}<div class="kv small"><span>الرسم مرة واحدة</span><b class="num">${lm(q.fee)}</b></div><div class="kv small"><span>الأجر اليومي بعد التوظيف</span><b class="num">${lm(q.wage)}</b></div>${q.ok ? '<button class="sm pri" data-act="diwanhire">وظّف ناظر الديوان</button>' : `<div class="small muted">${esc(q.reasons.join(' · '))}</div>`}</section>`;
}
function diwanRuleHTML(type, r) {
  const T = E.DIWAN_TYPES[type], modes = Object.entries(E.DIWAN_MODES);
  return `<div class="card diwan-rule" data-dwtype="${type}"><b class="small">${esc(T.name)}</b><div class="row" style="flex-wrap:wrap;margin:4px 0 0"><select data-dwr="${type}" data-dwf="mode" aria-label="${esc(T.name)}">${modes.map(([k, n]) => `<option value="${k}" ${r.mode === k ? 'selected' : ''}>${n}</option>`).join('')}</select>${r.mode === 'ask' ? `<label class="small">المهلة <select data-dwr="${type}" data-dwf="wait" aria-label="المهلة بالأيام">${E.DIWAN.waits.map(w => `<option value="${w}" ${r.wait === w ? 'selected' : ''}>${w} ${w === 1 ? 'يوم' : 'أيام'}</option>`).join('')}</select></label>` : ''}${type === 'herd' ? `<label class="small">حد الصفقة <input type="number" min="0" max="10000000" step="100" value="${r.max}" data-dwr="herd" data-dwf="max" style="width:110px" aria-label="حد الصفقة بالريال"></label>` : ''}</div></div>`;
}
function diwanAskHTML(a) {
  const city = a.city && S.cities[a.city] ? esc(cityName(a.city)) : '';
  return `<div class="card diwan-ask" data-dwask="${a.id}"><div class="small">${esc(a.text)}</div><div class="row" style="flex-wrap:wrap;margin:4px 0 0">${a.remind ? `<button class="sm" data-act="diwanans" data-i="${a.id}" data-a="mine">حسناً</button>` : `<button class="sm pri" data-act="diwanans" data-i="${a.id}" data-a="do">نفّذ عني</button><button class="sm" data-act="diwanans" data-i="${a.id}" data-a="mine">سأتولاها</button><span class="small muted">${a.due != null ? 'ينفّذ بعد ' + Math.max(0, a.due - S.day) + ' يوماً إن لم تردّ' : ''}</span>`}</div></div>`;
}
function diwanHTML() {
  if (!E.DIWAN.on || !S.learn || !S.learn.char) return '';
  const D = S.player.diwan; if (!D) return diwanHireHTML();
  const v = E.diwanView(S), cc = E.CHIEFC.on && S.player.cchief ? E.cchiefView(S) : null, days = Number.isFinite(v.days) ? Math.floor(v.days) : 0, sug = v.suggest;
  const treasury = `<div class="card diwan-box"><b>خزينة الديوان</b><div class="kv"><span>الرصيد</span><b class="num" data-dwbox>${lm(v.box)}</b></div><div class="kv small"><span>تكفي نحو</span><b>${days} يوماً</b></div>${bar(Math.min(days, 354), 354)}<p class="small muted">مال الخزينة مالك: يدخل في ثروتك وفي وعاء زكاتك. اللعبة تقترح أجور ممتلكاتك وإيجاراتها لسنة: <b class="num">${lm(sug)}</b>.</p><div class="row" style="flex-wrap:wrap"><input id="dwAmt" type="number" min="0" step="100" value="${Math.max(0, Math.round(sug - v.box))}" style="width:120px" aria-label="المبلغ بالريال"><button class="sm pri" data-act="diwandep">أودع</button><button class="sm" data-act="diwanwd">اسحب</button></div></div>`;
  const rules = `${Object.keys(E.DIWAN_TYPES).map(k => diwanRuleHTML(k, v.rules[k])).join('')}<p class="small muted">لا يُفوَّض أبداً: الاستثمارات الكبيرة والمشاريع وفتح الدول والأهداف الكبرى وكل ما فيه حكم شرعي كالزكاة والعقود؛ يذكّرك بها فقط.</p>`;
  const didAll = v.did.map(l => ({ ...l, who: '' })).concat(cc ? cc.did.map(l => ({ ...l, text: 'شيخ القوافل: ' + l.text })) : []).sort((x, y) => y.d - x.d);
  const did = didAll.length ? didAll.map(l => `<div class="small diwan-did">${esc(E.dateOf(S, l.d).hs)} · ${esc(l.text)}${l.amount > 0 ? ' · ' + lm(l.amount) : ''}</div>`).join('') : '<div class="small muted">لم يفعل شيئاً هذا الأسبوع.</div>';
  const waits = v.ask.map(diwanAskHTML).join('') + (cc ? cc.ask.map(a => (typeof cchiefAskHTML === 'function' ? cchiefAskHTML(a) : '')).join('') : ''), rem = v.reminders.map(r => `<div class="small ${r.bad ? 'dear' : ''} diwan-rem"><b>موعد:</b> ${esc(r.text)}</div>`).join('');
  return `<section class="card diwan" aria-label="ناظر الديوان"><h3 style="margin-top:0">ناظر الديوان <span class="pill good">يعمل</span></h3><p class="small muted">أجره ${lm(v.wage)} يومياً. يحرّك أدواتك القائمة ولا يصرف إلا من خزينته.</p>${treasury}<div class="card diwan-wait"><b>ما ينتظرك</b>${waits || '<div class="small muted">لا أسئلة معلّقة.</div>'}${rem}</div><div class="card diwan-done"><b>ما فعلته عنك (آخر 7 أيام)</b>${did}</div>${foldDet('diwan-rules', false, '<b>من يقرر؟</b> <span class="small muted">(قواعد الناظر)</span>', rules)}<button class="sm" data-act="diwanfire">سرّح الناظر وأعد الخزينة إلى محفظتي</button></section>`;
}
