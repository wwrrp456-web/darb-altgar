/* حوارات الأجيال: النصوص الشرعية والوجدانية من المراجع، والخيارات لا تنفذ حتى اختيار اللاعب. */
let agingView = '';
const agingText = t => `<p>${esc(hadithQ({q:t,s:''})).replace(/\n/g,'<br>')}</p>`;
const agingDetails = (title,text) => `<details class="card"><summary>${esc(title)}</summary>${agingText(text)}</details>`;
function salemMemoryHTML() {
  const T=E.LIFE_TEXTS;
  const face=ART['hero/salem_expressions']?`<span class="pic av salem-portrait cutout" style="--salem-x:0;--salem-y:1"><img src="${ART['hero/salem_expressions']}" alt="عمّ سالم"></span>`:'';
  return `<section data-keep-mentor-name><div class="msay">${face}<div><b>عمّ سالم</b>${agingText(T.salemPassing)}</div></div>${agingText(T.salemFarewell)}${agingText(T.salemLastWish)}</section>`;
}
function ownedLifeShops() {
  const out=[];for(const [city,p] of Object.entries(S.player.props))for(const sh of p.shops)if(E.shKind(sh)==='own')out.push({city,shop:sh.id,sh});return out;
}
function lifeShopProtected(city,shop) {const w=S.life&&S.life.salemWaqf;return !!(w&&w.city===city&&w.shop===shop)||!!((S.player.props[city]||{}).shops||[]).find(x=>x.id===shop&&x.endowed);}
function waqfPickerHTML() {
  const shops=ownedLifeShops().filter(x=>!lifeShopProtected(x.city,x.shop));
  return `<section data-keep-mentor-name>${agingText(E.LIFE_TEXTS.salemWaqf)}${shops.length?`<label>الدكان<select id="salemWaqfShop">${shops.map(x=>`<option value="${esc(x.city+':'+x.shop)}">${esc(cityName(x.city))} · دكان ${x.shop}</option>`).join('')}</select></label><button class="btn" data-act="salemwaqfset">خصّص 10% من صافي ربحه</button>`:'<p>يمكنك تخصيص دكان عندما تملكه.</p>'}${agingDetails('الوقف',E.LIFE_TEXTS.waqf)}<button class="btn ghost" data-act="lifeclose">لاحقاً</button></section>`;
}
function retirementPlanFromForm() {
  const chosen=($('retireWaqfShop')||{}).value||'',sep=chosen.lastIndexOf(':'),shop=chosen?{city:chosen.slice(0,sep),shop:+chosen.slice(sep+1)}:null;
  return {name:($('heirName')||{}).value||'',will:($('heirWill')||{}).value||'',willPct:+(($('heirWillPct')||{}).value||0),pct:+(($('retireWaqfPct')||{}).value||0),shop,
    sellGoods:[...document.querySelectorAll('#agingPanel [data-retire-good]:checked')].map(x=>JSON.parse(decodeURIComponent(x.dataset.retireGood))),
    sellShops:[...document.querySelectorAll('#agingPanel [data-retire-shop]:checked')].map(x=>JSON.parse(decodeURIComponent(x.dataset.retireShop)))};
}
function updateRetirementPreview() {
  const el=$('retirementPreview');if(!el)return;
  const r=E.retirementQuote(S,retirementPlanFromForm());el.textContent=r.ok?'الثروة بعد قراراتك: '+R0(r.wealth)+' ريال · النقد المتاح: '+R0(r.cash)+' ريال':r.msg;
}
function retirementHTML() {
  const T=E.LIFE_TEXTS,r=E.retirementSummary(S),shops=ownedLifeShops(),eligible=shops.filter(x=>!lifeShopProtected(x.city,x.shop)),goods=[];
  for(const car of S.player.caravans){if(car.left>0)continue;for(const mode of ['cargo','herd'])for(const [g,n] of Object.entries(car[mode]||{}))if(n>=1&&GD[g]){const sel=encodeURIComponent(JSON.stringify({car:car.id,g,mode:mode==='herd'?'herd':undefined}));goods.push(`<label class="life-check"><input type="checkbox" data-retire-good="${sel}">بيع ${Math.floor(n)} ${esc(GD[g].name)} · ${esc(car.name||'قافلة')} · ${esc(cityName(car.city))}</label>`);}}
  return `<h2 id="agingTitle" tabindex="-1">التقاعد وانتقال الأمانة</h2><div data-keep-mentor-name>${agingText(T.retirement)}</div><div class="card"><b>${esc(r.name)} · ${r.age} سنة</b><p>الثروة ${R0(r.wealth)} ريال · الدكاكين ${r.shops} · الرحلات ${r.trips} · الإنجازات ${r.achievements.length}</p><p>الزكاة المخرجة ${R0(r.zakat)} ريال</p><p>الأب يبقى حياً متقاعداً، ويواصل ابنه التجارة.</p></div>
  <div class="life-form"><label>اسم الوريث<input id="heirName" maxlength="32" value="سهيل" autocomplete="off"></label>
  <fieldset><legend>ما توقفه صدقة جارية</legend><label>نسبة من الثروة<input id="retireWaqfPct" type="number" min="0" max="100" step=".1" value="0" inputmode="decimal"></label><label>أو دكان محدد<select id="retireWaqfShop"><option value="">لا دكان محدد</option>${eligible.map(x=>`<option value="${esc(x.city+':'+x.shop)}">${esc(cityName(x.city))} · دكان ${x.shop}</option>`).join('')}</select></label><p class="small muted">اختر نسبة نقدية أو دكاناً. تُعرض لك النتيجة قبل نقل الأمانة.</p>${agingDetails('الوقف',T.waqf)}</fieldset>
  <fieldset><legend>ما تبيعه وما تبقيه</legend><p>اترك الأصل دون تحديد ليبقى. البضاعة المسافرة تبقى مع قافلتها.</p>${goods.join('')||'<p class="muted">لا بضائع متاحة للبيع الآن.</p>'}${shops.map(x=>`<label class="life-check"><input type="checkbox" data-retire-shop="${encodeURIComponent(JSON.stringify({city:x.city,shop:x.shop}))}" ${lifeShopProtected(x.city,x.shop)?'disabled':''}>بيع دكان ${x.shop} في ${esc(cityName(x.city))} · 1000 ريال${lifeShopProtected(x.city,x.shop)?' · مخصص للوقف':''}</label>`).join('')}</fieldset>
  <fieldset><legend>وصية محفوظة</legend><label>وصية قصيرة<textarea id="heirWill" maxlength="400" rows="3"></textarea></label><label>نسبة خيرية للوصية (حتى الثلث)<input id="heirWillPct" type="number" min="0" max="33.333333" step=".1" value="0" inputmode="decimal"></label><p class="small muted">تُحفظ هنا فقط؛ لا تُنفّذ عند التقاعد.</p>${agingDetails('الوصية',T.will)}${agingDetails('الميراث',T.inheritance)}</fieldset>
  <p id="retirementPreview" class="card" role="status"></p><p id="lifeError" role="alert"></p><button class="btn" data-act="liferetire">اعتماد القرارات ونقل الأمانة</button></div>`;
}
function renderAgingUI() {
  const el=$('agingPanel');if(!el)return;const pending=S.life&&S.life.pending,kind=pending||agingView;
  if(!kind){el.hidden=true;delete el.dataset.kind;return;}
  el.hidden=false;if(el.dataset.kind===kind)return;el.dataset.kind=kind;
  let html='';if(kind==='retire')html=retirementHTML();
  else if(kind==='salem')html=`<h2 id="agingTitle" tabindex="-1">وصية عمّ سالم</h2>${salemMemoryHTML()}<div class="msay">${pic('hero/mentor2_thinking','av dialogue-portrait','عبد الله بن سالم')}<div><b>عبد الله بن سالم</b>${E.LIFE_TEXTS.sonIntroduction.map(agingText).join('')}</div></div><button class="btn" data-act="lifeack">متابعة مع عبد الله بن سالم</button>`;
  else if(kind==='memory')html=`<h2 id="agingTitle" tabindex="-1">دفتر عمّ سالم</h2>${salemMemoryHTML()}<button class="btn" data-act="lifeclose">إغلاق</button>`;
  else if(kind==='waqf')html=`<h2 id="agingTitle" tabindex="-1">وقف عمّ سالم</h2>${waqfPickerHTML()}`;
  el.innerHTML=`<div class="lbox aging-box" role="dialog" aria-modal="true" aria-labelledby="agingTitle" data-keep-mentor-name>${html}</div>`;
  if(kind==='retire')updateRetirementPreview();$('agingTitle')?.focus({preventScroll:true});
}
function submitRetirement() {
  const r=A.retire(S,retirementPlanFromForm());if(!r.ok){$('lifeError').textContent=r.msg;return;}
  agingView='';prof=false;act(r);persist();resumeAwayUI();
}
function lifeExtraProfileHTML() {
  let h='';const L=S.life||{},legacy=S.legacy;
  if(L.mentorSon)h+=`<section class="card" data-keep-mentor-name><h3>دفتر عمّ سالم</h3><p>مرشدك: عبد الله بن سالم</p><button class="btn ghost" data-act="lifememory">الوصية والدفتر</button>${!L.salemWaqf?'<button class="btn ghost" data-act="salemwaqfopen">وقف عمّ سالم (اختياري)</button>':''}${L.loyal?agingText(E.LIFE_TEXTS.loyalBadge):''}<details><summary>حكم من دفتر أبيه</summary>${E.LIFE_TEXTS.wisdom.map(agingText).join('')}</details></section>`;
  if(legacy&&legacy.retired){const f=legacy.father;h+=`<section class="card" data-history><h3>سجل الأب: ${esc(f.name)}</h3>${agingText(E.LIFE_TEXTS.fatherFarewell)}${agingText(E.LIFE_TEXTS.heirWelcome)}${pic('hero/c_'+f.char+'_old','father-picture',f.name)}<p>متقاعد · ${f.age} سنة · الثروة ${R0(f.wealth)} ريال</p><p>الدكاكين ${f.shops} · الرحلات ${f.trips} · الإنجازات ${f.achievements.length} · الزكاة ${R0(f.zakat)} ريال</p>${legacy.will.text||legacy.will.pct>0?`<details><summary>الوصية المحفوظة</summary><p>${esc(legacy.will.text)}</p><p>النسبة الخيرية ${legacy.will.pct}% · محفوظة</p>${agingText(E.LIFE_TEXTS.willConfirmed)}</details>`:''}</section>`;}
  const books=[['salem',L.salemWaqf],['father',legacy&&legacy.waqf]].filter(x=>x[1]);
  if(books.length)h+='<section class="card" data-keep-mentor-name><h3>دفتر الأوقاف</h3>'+books.map(([key,w])=>`<details open><summary>${w.salem?'وقف عمّ سالم':'وقف الأب'}</summary>${!w.salem?agingText(E.LIFE_TEXTS.waqfConfirmed):''}${w.type==='capital'?`<p>أصل الوقف ${R0(w.principal)} ريال · رصيده ${R0(w.capital)} ريال</p>`:`<p>${esc(cityName(w.city))} · ${w.pct*100}% من صافي ربح الدكان</p><p>صافي ربح الحول حتى الآن ${R0(w.net)} ريال · المحجوز للصرف ${R0(w.balance)} ريال</p><p class="small muted">الصافي بعد نصيب الدكان من المصاريف المشتركة.</p>`}${w.arrears>0?`<p>بقي للصرف ${R0(w.arrears)} ريال <button class="btn sm" data-act="waqfarrears" data-g="${key}">اصرف المتاح</button></p>`:''}<ul>${(w.hist||[]).map(x=>`<li>يوم ${x.day}: صافي ${R0(x.net)} ريال · صُرف ${R0(x.paid)} ريال</li>`).join('')}</ul></details>`).join('')+'</section>';
  return h+climateProfileHTML();
}

function bossAgeNote(id) { const text=E.elderBossText(S,id),bs=S.bosses[id];return text?`<div class="card age-note"><p>${esc(text)}</p>${bs.father?`<button class="btn ghost sm" data-act="bossheirack" data-c="${id}">حسناً</button>`:''}</div>`:''; }
function lifeNewsText(n) { return n.waqfPaid != null ? E.LIFE_TEXTS.salemWaqfAnnual.replace('{amount}',R0(n.waqfPaid)) : n.t; }
function renderMentorNames() {
  if(E.mentorOf(S).id!=='mentor2')return;
  const skip='script,style,noscript,.story,.lesson,.hist-row,[data-history],[data-keep-mentor-name]',replace=t=>t.replace(/(?:ال)?عمّ? سالم/g,MEN.name),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode()))if(node.parentElement&&node.parentElement.closest('button,h1,h2,h3,h4,summary,.sp-head,#salemPeek,.msay >div >b')&&!node.parentElement.closest(skip+',#profile .pf-head h2')&&/عمّ? سالم/.test(node.nodeValue))node.nodeValue=replace(node.nodeValue);
  document.querySelectorAll('[aria-label],[title],[alt]').forEach(el=>{if(el.closest(skip))return;for(const k of ['aria-label','title','alt'])if(el.hasAttribute(k)&&/عمّ? سالم/.test(el.getAttribute(k)))el.setAttribute(k,replace(el.getAttribute(k)));});
}
let lifePreviewTimer;
for(const event of ['input','change']) document.addEventListener(event,ev=>{if(ev.target.closest('#agingPanel .life-form')){clearTimeout(lifePreviewTimer);lifePreviewTimer=setTimeout(updateRetirementPreview,100);}});

function maskAgingForeground() { if(!$('agingPanel')?.hidden) for(const id of ['profile','modal','dlg','lesson','alertPanel','salemPanel']) { const el=$(id);if(el)el.hidden=true; } }
