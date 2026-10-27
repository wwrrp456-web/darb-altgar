/* الرتبة الإدارية لا تُمنح بشراء مستوى الخبرة. */
const teamChoice={};
function teamManagerHTML(city) {
 const m=S.player.props[city]?.mgr;if(!m)return '';
 if(m.rank===3)return stewardCard(city);
 const a=E.teamAssets(S,city).find(a=>a.kind===m.asset?.kind&&a.id===m.asset?.id),money=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
 return `<div class="card property-manager"><h3>${ti('manager')} مدير ${esc(a?.label||'الممتلك')}</h3><p>الرتبة 2 · نطاقه ممتلك واحد في ${esc(cityName(city))}.</p><div class="kv"><span>الأجر اليومي</span><b class="num">${money(E.managerWage(m))} ريال</b></div><div class="kv"><span>الخدمة بعد الترقية</span><b>${m.days||0} يوم</b></div>${paymentButton(m)}${stewardPromotionHTML(city)}<div class="row" style="flex-wrap:wrap"><button class="sm" data-act="auditmgr" data-c="${city}">راجع حساباته</button><button class="sm" data-act="firemgr" data-c="${city}">أنه تكليفه</button></div><p class="small muted">لا يملك صلاحيات أمين المنطقة أو الوكيل. ترقية العامل تغير مهمته؛ راجع حاجة البائعين وأمناء المخازن.</p></div>`;
}
/* سلّم الرتب: من أنت الآن، وما شروط الرتبة التالية بعلامات ✓/✗ (شكوى الجمهور: السلّم الوظيفي غير واضح) */
function teamLadder(city, staff, assets, m) {
 const T=E.TEAM, top=staff.reduce((a,w)=>(!a||w.days>a.days?w:a),null), clean=top?E.workerCleanDays(S,top):0;
 const here=m?.rank===3?3:m?.rank===2?2:1, names=['عامل','مدير ممتلك','أمين المنطقة','وكيل'];
 const tk=['factory_worker','property_manager','regional_steward','regional_agent'],strip=`<div class="team-pics">${tk.map((k,i)=>`<div class="tp ${i+1===here?'on':i+1>here?'dim':''}">${pic('team/'+k,'tpic',names[i])}<span class="small">${names[i]}</span></div>`).join('')}</div>`;
 const steps=names.map((n,i)=>`<span class="pill ${i+1===here?'good':''}" style="${i+1>here+1?'opacity:.55':''}">${i+1}. ${n}${i+1===here?' ← أنت':''}</span>`).join(' ');
 const next=here===1?reqRows([
  [S.phase>=T.minPhase,'الطور '+T.minPhase+' فأكثر','طورك '+S.phase],
  [!!top&&top.days>=T.expertDays,'عامل خبير ('+T.expertDays+' يوم خدمة)',top?'أقدم عامل: '+top.days+' يوم':'وظّف عاملاً أولاً'],
  [clean>=T.cleanDays,'سجل أجور نظيف '+T.cleanDays+' يوماً',top?'لديه '+clean+' يوم':''],
  [assets.length>=T.minAssets||(assets.length===1&&staff.length>=T.singleAssetStaff),'ممتلكان أو ممتلك واحد مع '+T.singleAssetStaff+' عمال',assets.length+' ممتلك و'+staff.length+' عمال'],
 ],'شروط الرتبة 2: مدير ممتلك'):here===3?'<p class="small">أمين المنطقة فعّال؛ الوكيل لم يُفتح بعد.</p>':reqRows([
  [S.phase>=3,'الطور 3 فأكثر','طورك '+S.phase],
  [assets.length>=3,'ثلاثة ممتلكات في المنطقة',assets.length+' ممتلك'],
  [(m?.days||0)>=90,'مدير خدم 90 يوماً','خدم '+(m?.days||0)+' يوماً'],
  [E.stewardQuote(S,city).ok,'مراجعة ناجحة بعد مدة الخدمة ودون أجر متأخر',E.stewardQuote(S,city).ok?'مستوفٍ':'راجع بطاقة الترقية'],
 ],'شروط الرتبة 3: أمين المنطقة');
 return `${strip}<div class="small" style="margin:6px 0;display:flex;gap:4px;flex-wrap:wrap">${steps}</div>${next}`;
}
function teamCard(city) {
 const pr=S.player.props[city];if(!pr||!pr.shops.length)return '';
 const staff=E.staffOf(S,city),assets=E.teamAssets(S,city),m=pr.mgr,experts=staff.filter(w=>w.days>=E.TEAM.expertDays);
 const selected=assets.find(a=>a.kind+':'+a.id===teamChoice[city])||assets[0];
 const hire='<button class="sm" data-act="hirestaff" data-g="seller">وظّف عاملاً</button>';
 if(!experts.length&&!m)return `<section class="card team-card"><h3>هرم فريقي</h3>${teamLadder(city,staff,assets,m)}<p>الرتبة 1 · العامل يؤدي عمله، وتظهر الترقية عند بلوغه الخبرة المطلوبة.</p>${hire}</section>`;
 return `<section class="card team-card"><h3>هرم فريقي · ${esc(cityName(city))}</h3>${teamLadder(city,staff,assets,m)}${[2,3].includes(m?.rank)?teamManagerHTML(city):m?'<p>مدير أعمالك الموجود يستمر بعقده وصلاحياته الحالية.</p>':''}<details ${m?'':'open'}><summary>العمّال والترقية (${staff.length})</summary><p class="small muted">مدير الممتلك يُرقّى من عامل خبير: 120 يوم خدمة، و30 يوماً مسجلة بلا تأخر أجر. يلزم ممتلكان، أو ممتلك واحد مع 4 عمال. لا نفترض سجلاً للأيام السابقة للتحديث.</p>${assets.length?`<label>الممتلك الذي سيُكلّف به <select data-team-city="${city}" style="max-width:100%;min-height:44px">${assets.map(a=>`<option value="${a.kind}:${a.id}" ${a===selected?'selected':''}>${esc(a.label)}</option>`).join('')}</select></label>`:''}${staff.map(w=>{const q=E.promotionQuote(S,city,w.id,selected?.kind,selected?.id);return `<div class="card"><b>${esc(E.WK[w.role].name)} · ${esc(E.WK_LV[E.wkLv(w)])}</b><p class="small">الخدمة ${w.days} يوم · سجل الأجر النظيف ${q.clean||0} من 30 يوماً.</p>${w.days>=E.TEAM.expertDays?`<p class="small ${q.ok?'cheap':'muted'}">${q.ok?'مؤهل للترقية؛ الأجر الجديد '+q.wage+' ريال يومياً.':esc(q.msg)}</p><button class="sm pri" data-act="team-promote" data-c="${city}" data-worker="${w.id}" data-kind="${selected?.kind||''}" data-id="${selected?.id??''}" ${q.ok?'':'disabled'}>رقّه إلى مدير ممتلك</button>`:''}</div>`;}).join('')||'<p>لا عمّال في المنطقة.</p>'}${hire}</details></section>`;
}
