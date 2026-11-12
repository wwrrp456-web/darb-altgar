/* 035ج2 واجهة كفاءة رئيس المزرعة ومدير المصنع: بطاقتا «ما ينتظرك» (خطة الزرع، نفاد المواد) وسطور الدرجة في صفحتيهما؛ فوق ask ومكوّنات 037 فقط */
const fmxUiOn = () => { try { return !!((E.FARMX.on || E.MGRX.on) && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const fmxPlanCard = k => {
  const cn = cityName(k.city), nm = c => E.CROP_DEFS[c.crop].name, wt = c => E.CROP_WATER[c.water].name, same = k.best.crop === k.cheap.crop && k.best.water === k.cheap.water;
  const sum = (c, tag) => 'الكلفة نحو ' + fmt(Math.round(c.cost * k.n)) + ' ريال لـ' + k.n + ' قطعة · العائد المتوقع ' + fmt(Math.round(c.value * k.n)) + ' بعد ' + dayAr(c.days) + ' (' + tag + ')';
  const opts = [{ id: 'best', icon: 'ui-pay', title: 'ازرع ' + nm(k.best) + ' بسقي ' + wt(k.best), effect: sum(k.best, 'الأعلى ربحاً في اليوم') + ' · موصى به', best: true, act: () => A.farmXAct(S, k.city, k.id, 'best') }];
  if (!same) opts.push({ id: 'cheap', icon: 'ui-pay', title: 'ازرع ' + nm(k.cheap) + ' بسقي ' + wt(k.cheap), effect: sum(k.cheap, 'الأقل كلفة'), act: () => A.farmXAct(S, k.city, k.id, 'cheap') });
  opts.push({ id: 'none', icon: 'ui-decline', title: 'لا تزرع هذا الموسم', effect: 'تبقى القطع الفارغة بلا زرع ولا يُنفَق شيء', act: () => A.farmXAct(S, k.city, k.id, 'none') });
  return { id: k.id, icon: 'icons/sprout', title: 'خطة الزرع · ' + cn, why: 'بداية موسم: ' + k.n + ' قطعة حقل فارغة في مزرعتك، واقتراح رئيس المزرعة لا يُنفَّذ إلا بما تختاره', state: 'open', prio: 2, mark: true, opts };
};
const fmxShortCard = k => {
  const cn = cityName(k.city), nm = E.GD[k.g].name, cheap = k.cheap && k.cheap.id !== k.city ? ' · أرخص سوق تعرفه: ' + cityName(k.cheap.id) + ' بنحو ' + fmt(Math.round(k.cheap.p)) + ' (الشراء يتم من سوق ' + cn + ')' : '';
  return { id: k.id, icon: 'icons/factory', title: 'تنبيه نفاد المواد: ' + nm + ' في ' + cn, why: 'المخزون ' + fmt(k.stock) + ' يكفي ' + dayAr(Math.max(0, k.days)) + ' بمعدل ' + fmt(k.rate) + ' في اليوم' + cheap, state: 'open', prio: 1, mark: true, opts: [
    { id: 'buy', icon: 'ui-pay', title: 'اشترِ الآن من ' + cn, effect: fmt(k.qty) + ' ' + nm + ' بنحو ' + fmt(k.est) + ' ريال · تكفي نحو ' + E.MGRX.buyDays + ' أيام · موصى به', best: true, act: () => A.mgrXAct(S, k.city, k.id, 'buy') },
    { id: 'tomorrow', icon: 'ui-postpone', title: 'ذكّرني غداً', effect: 'يعود التنبيه غداً إن بقي النقص', act: () => A.mgrXAct(S, k.city, k.id, 'tomorrow') },
    { id: 'ignore', icon: 'ui-decline', title: 'تجاهل', effect: 'لا تنبيه لهذه المادة ' + E.MGRX.ignore + ' يوماً', act: () => A.mgrXAct(S, k.city, k.id, 'ignore') }] };
};
function fmxAskCards(city) {
  if (!fmxUiOn()) return []; const out = [];
  try { for (const k of (E.farmXView(S) || [])) if (!city || k.city === city) out.push(fmxPlanCard(k)); } catch (e) {}
  try { const v = E.mgrXView(S); if (v) for (const k of v.cards) if (!city || k.city === city) out.push(fmxShortCard(k)); } catch (e) {}
  return out;
}
const fmxCards = city => fmxAskCards(city).map(c => ask(c, c.id)).join('');
const fmxBtn = (city, k, v, label, on) => `<button type="button" class="sm${on ? ' on' : ''}" aria-pressed="${on ? 'true' : 'false'}" data-act="mxrule" data-c="${esc(city)}" data-k="${k}" data-v="${v}" style="min-height:44px">${esc(label)}</button>`;
function fmxFarmHTML(city) {
  if (!E.FARMX.on) return ''; const m = E.farmBossOf(S, city); if (!m) return ''; const g = E.fxGrade(m), name = E.SKILL.grades.a[g - 1], log = (m.x && m.x.log) || [];
  const lines = [g >= 3 ? 'لا ينقل أنعاماً إلى مزرعة ممتلئة (فوق ' + Math.round(E.FARMX.full * 100) + '٪) ويُبقي الزائد في مخزنك' : 'ينقل الأنعام من المخزن ما دام فيها مكان', g >= 3 ? 'يبيع صغاراً حين تمتلئ المزرعة بسعر لا يقل عن المرجعي وبحدّ ' + Math.round(E.FARMX.youngShare * 100) + '٪ منها في الأسبوع' : 'لا يبيع الصغار', g >= 5 ? 'يقترح خطة الزرع كل موسم ولا يزرع إلا ما تختاره' : '', 'لا يبيع الأنعام الكبيرة أبداً؛ ذلك لكبير الرعاة'].filter(Boolean);
  return `<section class="card farm-x" data-fx-grade="${g}"><div class="kv"><b>كفاءة رئيس المزرعة</b><span class="pill gold">${esc(name)}</span></div><div class="small">سقف المزارعين بدرجته: <b class="num">${E.fxMaxCap(m)}</b> · سقفك الحالي <b class="num">${m.cap}</b></div>${lines.map(t => `<div class="small muted">• ${esc(t)}</div>`).join('')}${log.slice(0, 3).map(e => `<div class="kv small"><span>يوم ${e.d} · ${esc(e.t)}</span>${e.amt ? `<span class="num ${e.amt < 0 ? 'dear' : 'cheap'}">${e.amt < 0 ? '−' : '+'}${fmt(Math.abs(e.amt))}</span>` : ''}</div>`).join('')}${fmxCards(city)}</section>`;
}
function fmxMgrHTML(city) {
  if (!E.MGRX.on) return ''; const v = E.mgrXView(S), r = v && v.mgrs.find(x => x.city === city); if (!r) return ''; const name = E.SKILL.grades.a[r.grade - 1];
  const warn = r.warn ? 'ينبّه قبل نفاد المواد الخام بـ' + dayAr(r.warn) + (r.grade >= 4 ? ' ويذكر أرخص سوق تعرفها' : '') : 'لا ينبّه قبل نفاد المواد (يبدأ من الدرجة الثالثة)';
  const buy = r.grade >= 5 ? `<div class="small muted">الشراء</div><div class="chips" role="group" aria-label="وضع الشراء">${fmxBtn(city, 'mode', 'ask', 'يسألني', r.mode === 'ask')}${fmxBtn(city, 'mode', 'exec', 'ينفّذ ويُبلغ', r.mode === 'exec')}</div><div class="small muted">الميزانية الأسبوعية للشراء التلقائي</div><div class="chips" role="group" aria-label="ميزانية الشراء">${E.MGRX.budgets.map(b => fmxBtn(city, 'budget', b, b ? fmt(b) + ' ريال' : 'صفر', r.budget === b)).join('')}</div><div class="small" data-mx-sum>${r.mode === 'exec' ? (r.budget ? 'يشتري تلقائياً حتى <b class="num">' + fmt(r.budget) + '</b> ريال في الأسبوع ويُبلغك' : 'ميزانية صفر: لا يشتري وحده، ويسألك') : 'يسألك قبل كل شراء'}</div>` : '';
  return `<section class="card mgr-x" data-mx-grade="${r.grade}"><div class="kv"><b>كفاءة المدير</b><span class="pill gold">${esc(name)}</span></div><div class="small">السعة: <b class="num">${r.cap}</b> أصول · أمانته: احتمال الاختلاس ≈ <b class="num">${String(r.theft).replace('.', '٫')}٪</b> في الشهر إن تأخرت مراجعة حساباته</div><div class="small muted">${esc(warn)}</div>${buy}${r.log.slice(0, 3).map(e => `<div class="kv small"><span>يوم ${e.d} · ${esc(e.t)}</span><span class="num ${e.amt < 0 ? 'dear' : 'cheap'}">−${fmt(Math.abs(e.amt))}</span></div>`).join('')}${fmxCards(city)}</section>`;
}
