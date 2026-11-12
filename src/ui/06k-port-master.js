/* الشهبندر (027): بطاقة في المكتب (التوظيف، الخطوط البحرية، ما ينتظرك وما فعلته، القواعد) ولوحة الميناء في شاشة القافلة.
   مع ناظر الديوان يظهر تقريره وأسئلته داخل بطاقة الناظر (FR-005). الأزرار تستدعي أفعال الشهبندر القائمة في المحرك. */
function portmOpen() { return !!(E.PORTM.on && S.player && !S.player.portm && E.portmQuote(S).open); }
function portmGoalStep() {
  const q = E.portmQuote(S); if (!E.PORTM.on || S.player.portm || !q.open) return null;
  return { v: q.have, max: q.fee, done: false, step: q.ok ? ['وظّف الشهبندر', 'portmhire'] : null, why: q.ok ? 'الشروط كلها متحققة: وظّفه الآن.' : 'وظّف الشهبندر: اجمع ' + fmt(Math.ceil(q.fee - q.have)) + ' ريال أخرى (الرسم ' + fmt(q.fee) + ' ثم أجر ' + q.wage + ' ريال يومياً).' };
}
function portmHireHTML() {
  const q = E.portmQuote(S); if (!E.PORTM.on || S.player.portm || !q.open) return '';
  return `<section class="card portm portm-hire" aria-label="الشهبندر">${roleHead('characters/port-master', 'الشهبندر', `<h3 style="margin-top:0">الشهبندر</h3>`)}<p class="small muted">رئيس التجار في الميناء: يشغّل لسفينتك خطاً بحرياً بين ميناءين بقافلة مستأجرة، يبيع ويشتري ويُبحر وحده، ويلتزم موسم الرياح فيعمل على الساحل بين موانئ بحره وهو ينتظر ثم يعبر عند الفتح. أنت وحدك تفتح الخط وتلغيه وتشتري السفن وتبيعها.</p>${bar(Math.min(q.have, q.fee), q.fee)}<div class="kv small"><span>الرسم مرة واحدة</span><b class="num">${lm(q.fee)}</b></div><div class="kv small"><span>الأجر اليومي بعد التوظيف</span><b class="num">${lm(q.wage)}</b></div>${q.ok ? '<button class="sm pri" data-act="portmhire">وظّف الشهبندر</button>' : `<div class="small muted">${esc(q.reasons.join(' · '))}</div>`}</section>`;
}
const pmCity = id => cityName(id);
function portmRuleHTML(type, r) {
  const T = E.PORTM_TYPES[type], modes = Object.entries(E.DIWAN_MODES);
  return `<div class="card portm-rule" data-pmrtype="${type}"><b class="small">${esc(T.name)}</b><div class="row" style="flex-wrap:wrap;margin:4px 0 0"><select data-pmr="${type}" data-pmf="mode" aria-label="${esc(T.name)}">${modes.map(([k, n]) => `<option value="${k}" ${r.mode === k ? 'selected' : ''}>${n}</option>`).join('')}</select>${r.mode === 'ask' ? `<label class="small">المهلة <select data-pmr="${type}" data-pmf="wait" aria-label="المهلة بالأيام">${E.PORTM.waits.map(w => `<option value="${w}" ${r.wait === w ? 'selected' : ''}>${w} ${w === 1 ? 'يوم' : 'أيام'}</option>`).join('')}</select></label>` : ''}</div></div>`;
}
function portmAskHTML(a) {
  return `<div class="card portm-ask" data-pmask="${a.id}"><div class="small">${esc(a.text)}</div><div class="row" style="flex-wrap:wrap;margin:4px 0 0">${a.remind ? `<button class="sm" data-act="portmans" data-i="${a.id}" data-a="mine">حسناً</button>` : `<button class="sm pri" data-act="portmans" data-i="${a.id}" data-a="do">نفّذ عني</button><button class="sm" data-act="portmans" data-i="${a.id}" data-a="mine">سأتولاها</button><span class="small muted">${a.due != null ? 'ينفّذ بعد ' + Math.max(0, a.due - S.day) + ' يوماً إن لم تردّ' : ''}</span>`}</div></div>`;
}
const portmDidHTML = l => `<div class="small portm-did">${esc(E.dateOf(S, l.d).hs)} · ${esc(l.text)}</div>`;
function portmLineHTML(l) {
  const state = l.moving ? 'في الطريق إلى ' + esc(pmCity(l.dest)) + '، باقٍ ' + l.left + ' يوماً' : l.waiting ? esc(l.waiting) : 'راسية في ' + esc(pmCity(l.at)) + ' تستعد للإبحار';
  return `<div class="card portm-line" data-pmline="${l.car}"><div class="kv"><b>${esc(l.name)}</b><span class="small muted">${esc(l.ship || '')}</span></div><div class="small">${esc(pmCity(l.a))} و${esc(pmCity(l.b))} · ${l.allSeasons ? 'يُبحر في كل المواسم' : 'يلتزم موسم الرياح'}</div><div class="small ${l.waiting && !l.moving ? 'muted' : ''}">${state}${l.opens ? ' · الموسم يفتح بعد ' + l.opens + ' يوماً' : ''}</div><div class="small muted">${l.sails} رحلة · ربح المبيعات ${lm(l.pl)}</div><div class="row" style="flex-wrap:wrap;margin:4px 0 0"><label class="small"><input type="checkbox" data-pmall="${l.car}" ${l.allSeasons ? 'checked' : ''}> كل المواسم</label><button class="sm" data-act="portmclose" data-i="${l.car}">ألغِ الخط</button></div></div>`;
}
function portmOpenFormHTML() {
  const ships = E.shipsOf(S).filter(x => x.city && !S.player.caravans.some(c => c.line && c.line.ship === x.id)), cars = S.player.caravans.filter(c => c.captain && !c.main && !c.line && c.left === 0);
  if (!ships.length) return '<p class="small muted">لا سفينة راسية حرة لفتح خط. اشترِ سفينة من «القافلة» وهي في ميناء.</p>';
  const ports = E.PORTS || [];
  const sel = ships[0], here = sel.city, other = ports.find(p => p !== here) || here, okCars = cars.filter(c => c.city === here);
  return `<div class="card portm-open"><b class="small">افتح خطاً بحرياً</b><label class="small" style="display:block;margin-top:4px">السفينة <select id="pmShip" aria-label="السفينة">${ships.map(x => `<option value="${x.id}">${esc(x.name)} (${esc(pmCity(x.city))})</option>`).join('')}</select></label><label class="small" style="display:block">القافلة المستأجرة <select id="pmCar" aria-label="القافلة المستأجرة">${cars.map(c => `<option value="${c.id}">${esc(c.name)} (${esc(pmCity(c.city))})</option>`).join('') || '<option value="">لا قافلة مستأجرة متاحة</option>'}</select></label><div class="row" style="flex-wrap:wrap;margin:4px 0"><label class="small">الميناء أ <select id="pmA" aria-label="الميناء أ">${ports.map(p => `<option value="${p}" ${p === here ? 'selected' : ''}>${esc(pmCity(p))}</option>`).join('')}</select></label><label class="small">الميناء ب <select id="pmB" aria-label="الميناء ب">${ports.map(p => `<option value="${p}" ${p === other ? 'selected' : ''}>${esc(pmCity(p))}</option>`).join('')}</select></label></div><label class="small"><input type="checkbox" id="pmAllS"> أبحر في كل المواسم (مخاطرة أعلى)</label><p class="small muted">يبدأ الخط والقافلة والسفينة معاً في أحد ميناءيه.</p><button class="sm pri" data-act="portmopen">افتح الخط</button></div>`;
}
function portmSummary(v) { return v.lines.length ? 'أرباح البحر هذا الأسبوع ' + lm(v.weekPl) + ' من ' + v.lines.length + (v.lines.length === 1 ? ' خط' : ' خطوط') + '.' : 'لا خطوط بعد: افتح لسفينتك خطاً بين ميناءين.'; }
function portmHTML() {
  if (!E.PORTM.on || !S.learn || !S.learn.char) return '';
  if (!S.player.portm) return portmHireHTML();
  const v = E.portmView(S), withDiwan = !!S.player.diwan && E.DIWAN.on;
  const rules = Object.keys(E.PORTM_TYPES).map(k => portmRuleHTML(k, v.rules[k])).join('') + '<p class="small muted">لا يفتح خطاً ولا يشتري سفينة ولا يبيعها: هذا لك وحدك.</p>';
  const own = withDiwan ? '<p class="small muted">تقريره وأسئلته تظهر في بطاقة ناظر الديوان.</p>' : `${askSink ? '<p class="small muted">أسئلته في تبويب «اليوم».</p>' : `<div class="card portm-wait"><b>ما ينتظرك</b>${v.ask.map(portmAskHTML).join('') || '<div class="small muted">لا أسئلة معلّقة.</div>'}</div>`}<div class="card portm-done"><b>ما فعلته عنك (آخر 7 أيام)</b>${v.did.length ? v.did.map(portmDidHTML).join('') : '<div class="small muted">لم يفعل شيئاً هذا الأسبوع.</div>'}</div>`;
  const panels = Array.from(new Set(E.shipsOf(S).map(x => x.city || x.dest).filter(Boolean))).map(portmPanelHTML).join('');
  return `<section class="card portm" aria-label="الشهبندر">${roleHead('characters/port-master', 'الشهبندر', `<h3 style="margin-top:0">الشهبندر <span class="pill good">يعمل</span></h3>`)}<p class="small muted">أجره ${lm(v.wage)} يومياً · يلتزم موسم الرياح ويعمل على الساحل في انتظاره.</p><p class="small portm-sum">${esc(portmSummary(v))}</p>${v.lines.map(portmLineHTML).join('')}${portmOpenFormHTML()}${panels}${own}${foldDet('portm-rules', false, '<b>من يقرر؟</b> <span class="small muted">(قواعد الشهبندر)</span>', rules)}<button class="sm" data-act="portmfire">سرّح الشهبندر</button></section>`;
}
function portmPanelHTML(city) { // لوحة ميناء: الراسية والقادمة وموعد فتح الموسم
  const P = E.portmPanel(S, city); if (!P || (!P.docked.length && !P.incoming.length)) return '';
  const dock = P.docked.length ? P.docked.map(x => esc(x.name) + (x.line ? ' (على خط)' : '')).join('، ') : 'لا سفن راسية', inc = P.incoming.map(x => `${esc(x.name)} قادمة${x.from ? ' من ' + esc(pmCity(x.from)) : ''}${x.left != null ? ' بعد ' + x.left + ' يوماً' : ''}${x.cargo.length ? ' بـ' + x.cargo.map(g => esc(gname(g))).join(' و') : ''}`).join(' · '), wt = P.waits.map(w => `الموسم يفتح بعد ${w.opens == null ? '؟' : w.opens} يوماً (${esc(w.car)})`).join(' · ');
  return `<div class="card portm-panel" data-pmport="${city}"><b>ميناء ${esc(pmCity(city))}</b><div class="small">${P.docked.length === 1 ? 'سفينة راسية' : P.docked.length ? P.docked.length + ' سفن راسية' : 'لا سفن راسية'}: ${dock}</div>${inc ? `<div class="small">${inc}</div>` : ''}${wt ? `<div class="small muted">${wt}</div>` : ''}</div>`;
}
