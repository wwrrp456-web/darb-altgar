/* الرتبة الإدارية لا تُمنح بشراء مستوى الخبرة. */
const teamChoice={};
function teamManagerHTML(city) {
 const m=S.player.props[city]?.mgr;if(!m)return '';
 const a=E.teamAssets(S,city).find(a=>a.kind===m.asset?.kind&&a.id===m.asset?.id),money=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
 return `<div class="card property-manager"><h3>${ti('manager')} مدير ${esc(a?.label||'الممتلك')}</h3><p>الرتبة 2 · نطاقه ممتلك واحد في ${esc(cityName(city))}.</p><div class="kv"><span>الأجر اليومي</span><b class="num">${money(E.managerWage(m))} ريال</b></div><div class="kv"><span>الخدمة بعد الترقية</span><b>${m.days||0} يوم</b></div>${paymentButton(m)}<div class="row" style="flex-wrap:wrap"><button class="sm" data-act="auditmgr" data-c="${city}">راجع حساباته</button><button class="sm" data-act="firemgr" data-c="${city}">أنه تكليفه</button></div><p class="small muted">لا يملك صلاحيات أمين المنطقة أو الوكيل. ترقية العامل تغير مهمته؛ راجع حاجة البائعين وأمناء المخازن.</p></div>`;
}
function teamCard(city) {
 const pr=S.player.props[city];if(!pr||!pr.shops.length)return '';
 const staff=E.staffOf(S,city),assets=E.teamAssets(S,city),m=pr.mgr,experts=staff.filter(w=>w.days>=E.TEAM.expertDays);
 const selected=assets.find(a=>a.kind+':'+a.id===teamChoice[city])||assets[0];
 const hire='<button class="sm" data-act="hirestaff" data-g="seller">وظّف عاملاً</button>';
 if(!experts.length&&!m)return `<section class="card team-card"><h3>هرم فريقي</h3><p>الرتبة 1 · العامل يؤدي عمله، وتظهر الترقية عند بلوغه الخبرة المطلوبة.</p>${hire}</section>`;
 return `<section class="card team-card"><h3>هرم فريقي · ${esc(cityName(city))}</h3>${m?.rank===2?teamManagerHTML(city):m?'<p>مدير أعمالك الموجود يستمر بعقده وصلاحياته الحالية.</p>':''}<details ${m?'':'open'}><summary>العمّال والترقية (${staff.length})</summary><p class="small muted">مدير الممتلك يُرقّى من عامل خبير: 120 يوم خدمة، و30 يوماً مسجلة بلا تأخر أجر. يلزم ممتلكان، أو ممتلك واحد مع 4 عمال. لا نفترض سجلاً للأيام السابقة للتحديث.</p>${assets.length?`<label>الممتلك الذي سيُكلّف به <select data-team-city="${city}" style="max-width:100%;min-height:44px">${assets.map(a=>`<option value="${a.kind}:${a.id}" ${a===selected?'selected':''}>${esc(a.label)}</option>`).join('')}</select></label>`:''}${staff.map(w=>{const q=E.promotionQuote(S,city,w.id,selected?.kind,selected?.id);return `<div class="card"><b>${esc(E.WK[w.role].name)} · ${esc(E.WK_LV[E.wkLv(w)])}</b><p class="small">الخدمة ${w.days} يوم · سجل الأجر النظيف ${q.clean||0} من 30 يوماً.</p>${w.days>=E.TEAM.expertDays?`<p class="small ${q.ok?'cheap':'muted'}">${q.ok?'مؤهل للترقية؛ الأجر الجديد '+q.wage+' ريال يومياً.':esc(q.msg)}</p><button class="sm pri" data-act="team-promote" data-c="${city}" data-worker="${w.id}" data-kind="${selected?.kind||''}" data-id="${selected?.id??''}" ${q.ok?'':'disabled'}>رقّه إلى مدير ممتلك</button>`:''}</div>`;}).join('')||'<p>لا عمّال في المنطقة.</p>'}${hire}</details></section>`;
}
