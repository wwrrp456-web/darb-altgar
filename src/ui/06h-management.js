/* هيكل الإدارة (023): عرض وروابط فقط في المكتب؛ الأزرار تستدعي أفعال الترقية والتوظيف القائمة نفسها. */
function mgmtBtn(a) {
  if (!a) return '';
  const attrs = Object.entries(a).filter(([k]) => k !== 'act' && k !== 'label').map(([k, v]) => `data-${k}="${esc(String(v))}"`).join(' ');
  return `<button class="sm pri" data-act="${a.act}" ${attrs}>${esc(a.label)}</button>`;
}
function mgmtRanksHTML() {
  return foldDet('mgmt-ranks', false, '<b>ما الفرق بين الرتب؟</b>', `<div class="card mgmt-ranks"><ul style="margin:4px 0;padding-inline-start:18px"><li><b>العامل</b> يعمل في دكانك أو مخزنك أو مزرعتك: يبيع ويحفظ ويرعى.</li><li><b>مدير الممتلك</b> يدير ممتلكاً واحداً وطاقمه وأنت غائب.</li><li><b>أمين المنطقة</b> يدير مدينة بممتلكاتها بتفويض وحدٍّ يومي تضعه أنت.</li><li><b>وكيل الإقليم</b> يدير دولة: يجمع تقارير أمنائها ويوزّع حدّها اليومي.</li><li><b>رئيس المزرعة</b> يهتم بمزرعة واحدة، و<b>كبير الرعاة</b> يشرف على مواشيك في الدولة، و<b>الأمين المدبّر</b> أمين مفوَّض بتدوير الأصناف وبيع الراكد وتدبير الأنعام، وكلٌّ في مكانه من بطاقته.</li></ul></div>`);
}
function mgmtNextHTML(n, who) {
  if (!n) return '';
  return `<div class="mgmt-next"><b class="small">${who}ما ينقصك للرتبة التالية (${esc(n.name)}):</b>${n.ok ? '<p class="small good">الشروط كلها متحققة الآن.</p>' : `<ul class="small" style="margin:4px 0;padding-inline-start:18px">${(n.reasons || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>`}${n.ok ? mgmtBtn(n.action) : ''}</div>`;
}
function mgmtCityHTML(c) {
  const m = c.manager, W = c.workers;
  const assets = c.assets.map(a => `<li>${a.by ? '✓' : '✗'} ${esc(a.label)} <span class="small muted">${a.by === 'steward' ? '· يديره الأمين' : a.by === 'manager' ? '· يديره المدير' : '· بلا مدير'}</span></li>`).join('');
  const work = [['seller', 'بائعون'], ['keeper', 'أمناء مخزن'], ['farmer', 'مزارعون']].filter(([k]) => W[k].need > 0 || W[k].n > 0).map(([k, n]) => `${n}: ${W[k].n}${W[k].need ? ' من ' + W[k].need : ''}${W[k].missing ? ' (ينقص ' + W[k].missing + ')' : ''}`).join(' · ');
  const alerts = c.alerts.map(a => `<div class="row mgmt-alert" style="flex-wrap:wrap"><span class="small dear">⚠ ${esc(a.text)}</span>${a.action ? mgmtBtn(a.action) : `<button class="sm" data-act="estcity" data-c="${c.id}">افتح المنطقة</button>`}</div>`).join('');
  return `<div class="card mgmt-city" data-mgmt-city="${c.id}"><div class="kv"><b>${esc(c.name)}</b><span class="pill ${c.rank ? 'gold' : ''}">${esc(c.rankName)}</span></div>${m ? `<div class="small">${m.rank === 3 ? 'الأمين يدير ' + Math.min(c.assets.length, m.span) + ' من ' + c.assets.length + ' ممتلكات.' : 'المدير يدير ' + esc(m.label || 'ممتلكاً واحداً') + '.'} أجره ${lm(m.wage, c.id)} يومياً.</div>${sbCityHTML(c.id)}${(() => { const pm = S.player.props[c.id] && S.player.props[c.id].mgr; return pm ? skillFold(pm, m.rank === 3 ? 'أمين المنطقة' : 'مدير الممتلك', 'm' + c.id) : ''; })()}` : ''}<ul class="small mgmt-assets" style="margin:6px 0;padding-inline-start:18px;list-style:none">${assets}</ul><div class="small">العمال — ${work || 'لا عمال'}</div><div class="kv small"><span>أجور المنطقة اليومية</span><b class="num">${lm(c.wages, c.id)}</b></div>${alerts}${mgmtNextHTML(c.next, '')}</div>`;
}
function mgmtHTML() {
  const v = E.MGMT.on && S.player && E.mgmtView(S);
  if (!v || !v.countries.length) return '';
  const sum = `${v.covered} من ${v.assets} ممتلكات لها مدير` + (v.alerts ? ` · ${v.alerts} تنبيهات` : '');
  let h = `<section class="card mgmt" aria-label="هيكل الإدارة"><h3 style="margin-top:0">هيكل الإدارة</h3><p class="small muted">من يدير ماذا في كل دولة ومدينة، وما ينقصك للرتبة التالية. ${esc(sum)}.</p>${mgmtRanksHTML()}`;
  for (const co of v.countries) {
    h += `<div class="mgmt-country" data-mgmt-country="${co.country}"><div class="kv"><b>${co.flag} ${esc(co.name)}</b><span class="small muted">أجور يومية ${lm(co.wages, co.cities[0] ? co.cities[0].id : undefined)}</span></div>`;
    h += co.agent ? `<p class="small">وكيل الإقليم يدير الدولة منذ يوم ${co.agent.since} بأجر ${lm(co.agent.wage, co.cities[0] ? co.cities[0].id : undefined)} يومياً.</p>` : '';
    h += mgmtNextHTML(co.next, 'للدولة: ');
    h += co.cities.map(mgmtCityHTML).join('') + '</div>';
  }
  return h + '</section>';
}
