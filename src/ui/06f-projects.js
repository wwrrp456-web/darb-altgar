/* المشاريع الكبرى (015ب): قسم في مكتب التاجر: الدرجة الحالية والتالية، بطاقات المشاريع المفتوحة بمراحلها، والدرجات العليا مقفلة تُرى وتحفّز. التصميم: docs/goals/LADDER.md */
function projectCardHTML(p) {
  const pickWord = { city: 'المدينة', port: 'الميناء', country: 'الدولة', route: 'الطريق' }[p.pickKind], label = p.pick ? E.projectPickLabel(S, p.id, p.pick) : '';
  let st; if (p.done) st = '<span class="pill">✓ اكتمل</span>'; else if (p.need) st = `<span class="small muted">يشترط إتمام «${esc(E.PROJECTS[p.need].name)}» أولاً</span>`; else if (p.paid >= p.total) st = `<span class="small muted">الإنشاء جارٍ، يكتمل بعد ${p.wait} يوماً</span>`; else if (p.wait > 0) st = `<span class="small muted">المرحلة ${p.paid} من ${p.total} قيد الإنشاء: ${p.wait} يوماً</span>`; else st = `<span class="small muted">المرحلة ${p.paid + 1} من ${p.total} جاهزة للدفع</span>`;
  let pick = ''; if (!p.done && !p.pick && !p.need) { const opts = E.projectPickOptions(S, p.id); pick = `<label class="small">اختر ${pickWord}: <select id="pjPick-${p.id}" aria-label="اختر ${pickWord}">${opts.map(o => `<option value="${esc(o.v)}">${esc(o.label)}</option>`).join('')}</select></label>`; }
  const can = !p.done && !p.need && p.paid < p.total && p.wait === 0, enough = S.player.gold + 1e-6 >= p.nextCost;
  const btn = can ? `<button class="btn ${enough ? 'gold' : ''}" data-act="pjfund" data-id="${p.id}" ${enough ? '' : 'disabled'}>ادفع المرحلة ${p.paid + 1}: ${fmt(p.nextCost)} ريال</button>${enough ? '' : '<div class="small muted">رصيدك أقل من كلفة المرحلة</div>'}` : '';
  return `<div class="card pjcard${p.done ? ' done' : ''}" data-project="${p.id}"><div class="row" style="margin:0"><b>${esc(p.name)}</b><span class="small muted" style="margin-inline-start:auto">الكلفة ${fmt(p.cost)} · ${p.total === 2 ? 'مرحلتان' : p.total + ' مراحل'}</span></div><div class="small">${esc(p.text)}</div><div class="small"><b>الأثر:</b> ${esc(p.eff)}${label ? ` · <b>${esc(label)}</b>` : ''}</div>${bar(p.paid, p.total, 'gold')}<div class="small">${st}${p.spent ? ` · مدفوع ${fmt(p.spent)}` : ''}</div>${pick}${btn}</div>`;
}
function projectsHTML() {
  if (!S.learn || !S.learn.char || NOLEARN) return ''; const v = E.projectView(S); if (!v.on) return '';
  const next = v.tiers.find(t => !t.open);
  let h = `<section class="card projects" aria-label="المشاريع الكبرى"><h3 style="margin-top:0">المشاريع الكبرى</h3><p class="small muted">مشاريع تبنيها بمالك الفائض على مراحل، ولكل مشروع أثر دائم معتدل. أعلى ثروة بلغتها: <b class="num">${fmt(v.peak)}</b> ريال${v.tier ? ` · الدرجة ${v.tier} من ${v.tiers.length}` : ''}.</p>`;
  if (v.open.length) { const ord = v.open.slice().sort((a, b) => (a.done - b.done) || (b.building - a.building) || (a.tier - b.tier)); h += ord.map(projectCardHTML).join(''); }
  else h += `<div class="small">أول درجة تُفتح عند ثروة <b class="num">${fmt(v.tiers[0].w)}</b> ريال (بقي <b class="num">${fmt(v.tiers[0].left || v.tiers[0].w - v.nw)}</b>).</div>`;
  if (next && v.open.length) h += `<div class="small muted" style="margin-top:8px">الدرجة التالية (${next.n}) عند <b class="num">${fmt(next.w)}</b> ريال، بقي <b class="num">${fmt(next.left)}</b>.</div>`;
  const locked = v.tiers.filter(t => !t.open); if (locked.length) h += `<details class="mdet fold" data-fold="pj-locked" ${foldOpen('pj-locked', false) ? 'open' : ''} style="margin-top:8px"><summary><b>درجات أعلى مقفلة (${locked.length})</b></summary>${locked.map(t => `<div class="row small" style="margin:4px 0"><span>الدرجة ${t.n}: عند <b class="num">${fmt(t.w)}</b> ريال</span><span class="muted" style="margin-inline-start:auto">${t.ids.length ? t.ids.map(id => esc(E.PROJECTS[id].name)).join(' · ') : 'مشاريعها لاحقاً'}</span></div>`).join('')}</details>`;
  return h + '</section>';
}
