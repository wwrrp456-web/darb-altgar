/* الرتبة الإدارية لا تُمنح بشراء مستوى الخبرة. */
const teamChoice={};
function teamManagerHTML(city) {
 const m=S.player.props[city]?.mgr;if(!m)return '';
 if(m.rank===3)return stewardCard(city);
 const a=E.teamAssets(S,city).find(a=>a.kind===m.asset?.kind&&a.id===m.asset?.id),money=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
 return `<div class="card property-manager"><h3>${ti('manager')} مدير ${esc(a?.label||'الممتلك')}</h3><p>الرتبة 2 · نطاقه ممتلك واحد في ${esc(cityName(city))}.</p><div class="kv"><span>الأجر اليومي</span><b class="num">${lm(E.managerWage(m), city)}</b></div><div class="kv"><span>الخدمة بعد الترقية</span><b>${m.days||0} يوم</b></div>${paymentButton(m)}${stewardPromotionHTML(city)}<div class="row" style="flex-wrap:wrap"><button class="sm" data-act="auditmgr" data-c="${city}">راجع حساباته</button><button class="sm" data-act="firemgr" data-c="${city}">أنه تكليفه</button></div><p class="small muted">لا يملك صلاحيات أمين المنطقة أو الوكيل. ترقية العامل تغير مهمته؛ راجع حاجة البائعين وأمناء المخازن.</p></div>`;
}
let teamRankSel = 0;
/* شرح كل رتبة بأرقام اللعبة الفعلية: ما مهمتها، ماذا تستفيد منها، كم تكلّف، وهل تستحق الترقية إليها (شكوى المالك: اللاعب لا يعرف أيّ ترقية تنفعه) */
function teamRankPanel(i, here, city, m) {
  const W = E.WK, T = E.TEAM, ST = E.STEWARD, rng = a => a[0] + '–' + a[2], money = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const sq = here === 2 ? E.stewardQuote(S, city) : null;
  const R = [
    { n: 'عامل', does: ['البائع يبيع في الدكان؛ بلا بائع لا يُباع شيء.', 'أمين المخزن يحفظ المخزون من التناقص اليومي.', 'المزارع والراعي يرعيان القطيع ويجمعان منتجه.'],
      gain: ['هو الأساس الذي يعمل به كل ممتلك.', 'كلما طالت خدمته ارتفع مستواه (مبتدئ ثم ماهر ثم خبير) فيزيد أداؤه.'],
      cost: 'أجر يومي: بائع ' + rng(W.seller.wage) + '، أمين مخزن ' + rng(W.keeper.wage) + '، مزارع ' + rng(W.farmer.wage) + ' ريال.',
      left: 'يبقى عليك: التسعير وتعبئة المخزن وسداد الأجور بنفسك.', worth: '' },
    { n: 'مدير ممتلك', does: ['يدير ممتلكاً واحداً وطاقمه (دكان أو مزرعة أو ملحمة أو مخزن أو مصنع).', 'يعبّئ مخزن الدكان من السوق تلقائياً ضمن احتياطي نقدي يحفظ التزاماتك.', 'يعدّل الأسعار كل أسبوع: يخفض الراكد ويرفع الشحيح.'],
      gain: ['ممتلكك يعمل بلا تدخلك حين تسافر أو تغيب.', 'يخفّ عنك قرار التسعير والتعبئة اليومي.', 'تُنتج له الأيام خبرة فيرتقي إلى أمين المنطقة.'],
      cost: 'أجره اليومي ' + T.managerRaise + ' ضعف أجر العامل المُرقّى، وبحدّ أدنى ' + E.MGR[1].wage + ' ريال.',
      left: 'يبقى عليك: ممتلكاتك الأخرى، وسداد الأجور.',
      worth: here === 1 ? 'يستحق إن كان ممتلكك يتعطل حين تغيب: مخزون ينفد أو أسعار راكدة. وإن كنت تلازمه كل يوم فالعامل يكفيك.' : '' },
    { n: 'أمين المنطقة', does: ['يشرف على كل ممتلكات المنطقة (حتى ' + ST.span + ' ممتلكات).', 'بتفويضك وحدٍّ يومي تضعه أنت: يسدّد الأجور والإيجار، ويعبّئ المخازن، ويعدّل أسعار الدكاكين.', 'يرسل تقريراً بما فعل، ويمكنك التراجع عن آخر تعديل سعر.'],
      gain: ['يغطي منطقة كاملة وأنت في سفر طويل.', 'لا يتجاوز الحدّ اليومي الذي حددته.', 'يمنع تأخر الأجور فلا يترك عمّالك ولا يُخلى إيجارك.'],
      cost: 'أجره اليومي ' + ST.raise + ' ضعف أجر المدير، وبحدّ أدنى ' + E.MGR[2].wage + ' ريال' + (sq && sq.wage ? ' (للمدير الحالي: من ' + money(sq.oldWage) + ' إلى ' + money(sq.wage) + ')' : '') + '. إن زادت الممتلكات عن ' + ST.span + ' تتوقف مزايا الإدارة.',
      left: 'يبقى عليك: قرارات الشراء والبيع الكبرى.',
      worth: here === 2 ? 'يستحق إن كان لك ' + ST.minAssets + ' ممتلكات فأكثر في المنطقة وتغيب كثيراً. وإن كان عندك ممتلك أو اثنان فمدير الممتلك يكفيك ويوفر عليك أجراً أعلى.' : '' },
    { n: 'وكيل الإقليم', does: ['يشرف على أمناء مناطقك في الدولة الواحدة (حتى 3 مناطق) وسياساتهم العامة.', 'يرسل إلى مكتبك تقريراً موحّداً أسبوعياً: دخل كل منطقة، وما تأخر من أجورها، وما نقص من مخزونها.', 'يوزّع الحد اليومي بين المناطق فلا يتأخر أجر منطقة وفي أخرى فائض.'],
      gain: ['يغطي دولة كاملة وأنت في سفر طويل، بتقرير واحد بدل عدة تقارير.', 'يمنع أن تتعطل منطقة لأن حدّها اليومي نفد بينما غيرها لم يستعمل حدّه.', 'يُنبّهك مبكراً إلى المنطقة التي تخسر.'],
      cost: 'رسم توظيف ' + E.RA.fee + ' ريال، وأجره اليومي ضعف أجر الأمين. شرطه: الطور ' + E.RA.phase + '، وأمينان على الأقل في الدولة نفسها. يُوظَّف من مكتب التاجر.',
      left: 'يبقى عليك: قرارات الشراء والبيع الكبرى وتوسعة الأعمال.',
      worth: 'يستحق فقط إن كانت لك مناطق متعددة في دولة واحدة وتغيب كثيراً؛ وإلا فالأمين يكفيك. وفي أول ' + E.RA.probation + ' يوماً يعمل بنصف الحد حتى يثبت.' },
  ][i - 1];
  const li = a => '<ul style="margin:4px 0;padding-inline-start:18px">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const state = i < here ? 'رتبة تجاوزتها' : i === here ? 'رتبتك الآن' : i === here + 1 ? 'الرتبة التالية' : 'رتبة أبعد';
  return `<div class="card rank-panel" role="region" aria-label="شرح الرتبة"><b>${i}. ${esc(R.n)}</b> <span class="pill">${state}</span><div class="small"><b>مهمته</b>${li(R.does)}<b>ما تستفيده</b>${li(R.gain)}<div><b>التكلفة:</b> ${esc(R.cost)}</div>${R.left ? '<div class="muted">' + esc(R.left) + '</div>' : ''}${R.worth ? '<div class="qnote" style="margin-top:6px"><b>هل يستحق؟</b> ' + esc(R.worth) + '</div>' : ''}</div></div>`;
}
/* سلّم الرتب: من أنت الآن، وما شروط الرتبة التالية بعلامات ✓/✗ (شكوى الجمهور: السلّم الوظيفي غير واضح) */
function teamLadder(city, staff, assets, m) {
 const T=E.TEAM, top=staff.reduce((a,w)=>(!a||w.days>a.days?w:a),null), clean=top?E.workerCleanDays(S,top):0;
 const here=m?.rank===3?3:m?.rank===2?2:1, names=['عامل','مدير ممتلك','أمين المنطقة','وكيل'];
 const tk=['factory_worker','property_manager','regional_steward','regional_agent'],strip=`<div class="team-pics">${tk.map((k,i)=>`<button type="button" class="tp ${i+1===here?'on':i+1>here?'dim':''} ${teamRankSel===i+1?'sel':''}" data-act="teamrank" data-g="${i+1}" aria-pressed="${teamRankSel===i+1}">${pic('team/'+k,'tpic',names[i])}<span class="small">${names[i]}</span></button>`).join('')}</div>`;
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
 return `${strip}<div class="small muted">اضغط على أي رتبة لتعرف مهمتها وما تستفيده منها وهل تستحق الترقية.</div>${teamRankSel?teamRankPanel(teamRankSel,here,city,m):''}<div class="small" style="margin:6px 0;display:flex;gap:4px;flex-wrap:wrap">${steps}</div>${next}`;
}
function teamCard(city) {
 const pr=S.player.props[city];if(!pr||!pr.shops.length)return '';
 const staff=E.staffOf(S,city),assets=E.teamAssets(S,city),m=pr.mgr,experts=staff.filter(w=>w.days>=E.TEAM.expertDays);
 const selected=assets.find(a=>a.kind+':'+a.id===teamChoice[city])||assets[0];
 const hire='<button class="sm" data-act="hirestaff" data-g="seller">وظّف عاملاً</button>';
 if(!experts.length&&!m)return `<section class="card team-card"><h3>هرم فريقي</h3>${teamLadder(city,staff,assets,m)}<p>الرتبة 1 · العامل يؤدي عمله، وتظهر الترقية عند بلوغه الخبرة المطلوبة.</p>${hire}</section>`;
 return `<section class="card team-card"><h3>هرم فريقي · ${esc(cityName(city))}</h3>${teamLadder(city,staff,assets,m)}${experts.length&&!m?mentorSay(MENTOR_B05.m10,'teach'):''}${[2,3].includes(m?.rank)?teamManagerHTML(city):m?'<p>مدير أعمالك الموجود يستمر بعقده وصلاحياته الحالية.</p>':''}<details ${m?'':'open'}><summary>العمّال والترقية (${staff.length})</summary><p class="small muted">مدير الممتلك يُرقّى من عامل خبير: 120 يوم خدمة، و30 يوماً مسجلة بلا تأخر أجر. يلزم ممتلكان، أو ممتلك واحد مع 4 عمال. لا نفترض سجلاً للأيام السابقة للتحديث.</p>${assets.length?`<label>الممتلك الذي سيُكلّف به <select data-team-city="${city}" style="max-width:100%;min-height:44px">${assets.map(a=>`<option value="${a.kind}:${a.id}" ${a===selected?'selected':''}>${esc(a.label)}</option>`).join('')}</select></label>`:''}${staff.map(w=>{const q=E.promotionQuote(S,city,w.id,selected?.kind,selected?.id);return `<div class="card"><b>${esc(E.WK[w.role].name)} · ${esc(E.WK_LV[E.wkLv(w)])}</b><p class="small">الخدمة ${w.days} يوم · سجل الأجر النظيف ${q.clean||0} من 30 يوماً.</p>${w.days>=E.TEAM.expertDays?`<p class="small ${q.ok?'cheap':'muted'}">${q.ok?'مؤهل للترقية؛ الأجر الجديد '+q.wage+' ريال يومياً.':esc(q.msg)}</p><button class="sm pri" data-act="team-promote" data-c="${city}" data-worker="${w.id}" data-kind="${selected?.kind||''}" data-id="${selected?.id??''}" ${q.ok?'':'disabled'}>رقّه إلى مدير ممتلك</button>`:''}</div>`;}).join('')||'<p>لا عمّال في المنطقة.</p>'}${hire}</details></section>`;
}
