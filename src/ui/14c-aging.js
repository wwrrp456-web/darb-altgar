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
  return `${tierScene('event/retirement', 'التقاعد')}<h2 id="agingTitle" tabindex="-1">التقاعد وانتقال الأمانة</h2><div data-keep-mentor-name>${agingText(T.retirement)}</div><div class="card"><b>${esc(r.name)} · ${r.age} سنة</b><p>الثروة ${R0(r.wealth)} ريال · الدكاكين ${r.shops} · الرحلات ${r.trips} · الإنجازات ${r.achievements.length}</p><p>الزكاة المخرجة ${R0(r.zakat)} ريال</p><p>الأب يبقى حياً متقاعداً، ويواصل ابنه التجارة.</p></div>
  <div class="life-form"><label>اسم الوريث<input id="heirName" maxlength="32" value="سهيل" autocomplete="off"></label>
  <fieldset><legend>ما توقفه صدقة جارية</legend><label>نسبة من الثروة<input id="retireWaqfPct" type="number" min="0" max="100" step=".1" value="0" inputmode="decimal"></label><label>أو دكان محدد<select id="retireWaqfShop"><option value="">لا دكان محدد</option>${eligible.map(x=>`<option value="${esc(x.city+':'+x.shop)}">${esc(cityName(x.city))} · دكان ${x.shop}</option>`).join('')}</select></label><p class="small muted">اختر نسبة نقدية أو دكاناً. تُعرض لك النتيجة قبل نقل الأمانة.</p>${agingDetails('الوقف',T.waqf)}</fieldset>
  <fieldset><legend>ما تبيعه وما تبقيه</legend><p>اترك الأصل دون تحديد ليبقى. البضاعة المسافرة تبقى مع قافلتها.</p>${goods.join('')||'<p class="muted">لا بضائع متاحة للبيع الآن.</p>'}${shops.map(x=>`<label class="life-check"><input type="checkbox" data-retire-shop="${encodeURIComponent(JSON.stringify({city:x.city,shop:x.shop}))}" ${lifeShopProtected(x.city,x.shop)?'disabled':''}>بيع دكان ${x.shop} في ${esc(cityName(x.city))} · 1000 ريال${lifeShopProtected(x.city,x.shop)?' · مخصص للوقف':''}</label>`).join('')}</fieldset>
  <fieldset><legend>وصية محفوظة</legend><label>وصية قصيرة<textarea id="heirWill" maxlength="400" rows="3"></textarea></label><label>نسبة خيرية للوصية (حتى الثلث)<input id="heirWillPct" type="number" min="0" max="33.333333" step=".1" value="0" inputmode="decimal"></label><p class="small muted">تُحفظ هنا فقط؛ لا تُنفّذ عند التقاعد.</p>${agingDetails('الوصية',T.will)}${agingDetails('الميراث',T.inheritance)}</fieldset>
  <p id="retirementPreview" class="card" role="status"></p><p id="lifeError" role="alert"></p><button class="btn" data-act="liferetire">اعتماد القرارات ونقل الأمانة</button></div>`;
}
function renderAgingUI() {
  const el=$('agingPanel');if(!el)return;if(grandchildPrompt&&agingView==='grandchild')return renderGrandchildConfirm();const pending=S.life&&S.life.pending,kind=pending||agingView;
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
  if (legacy&&legacy.retired) h+=grandchildRetiredHTML();
  return h+grandchildRecordHTML()+climateProfileHTML();
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

/* ابدأ حفيداً: المعاينة والإلغاء لا يكتبان حالة اللعبة أو تخزينها. */
let grandchildPrompt = null;
function grandchildPerkText(perk, card) {
  if (perk === 'purse') return 'حقيبة البداية: +' + f1(Math.min(200, Math.max(0, card.wealth) * .01)) + ' ريال (سقف 200)';
  if (perk === 'name') return 'اسم الجد: +10 ثقة لزعيم مدينة بدايتك فقط';
  return 'خريطة الجد: أسعار مدينتين قريبتين من مدينة البداية';
}
function grandchildMessageHTML() {
  const a = S.ancestry; if (!a || !a.message.trim()) return '';
  return `<section class="card grandchild-message" data-keep-mentor-name><b>عمّ سالم</b><p>ترك لك جدّك ${esc(a.name)} هذه الكلمات:</p><blockquote>${esc(a.message)}</blockquote></section>`;
}
function grandchildRemember() {
  if (!S.ancestry?.message.trim()) return;
  const h = S.learn.hist || (S.learn.hist = []);
  if (!h.some(x => x.ancestry)) h.unshift({ d: S.day, who: LSN.MENTOR.name, t: 'رسالة الجد', ancestry: true });
}
function grandchildWelcome() {
  if (!S.ancestry) return LSN.WELCOME;
  return LSN.WELCOME.map((b, i) => i === 1 ? { say: 'تبدأ اليوم مسيرة جديدة، وأنا معك لتتعلم التجارة خطوةً خطوة.' } : i === 2 ? { say: 'كل تاجر كبير بدأ بخطوة وقافلة صغيرة.' } : b);
}
function grandchildIntro(n, lv) {
  return S.ancestry && (n.stage === 1 || n.lvl === 1) ? 'يا ولدي، أول الأدب في التجارة: ألا تشتري سلعةً حتى تعرف قيمتها وثمنها المعتاد.' : lv.intro;
}
function grandchildRecordHTML() {
  const a = S.ancestry; if (!a) return '';
  return `<section class="card grandchild-record" data-history><h3>${esc(a.title)}</h3>${pic('hero/c_' + a.char + '_old', 'father-picture', a.name)}<p>بطاقة الجد: ${esc(a.name)}</p><p>الثروة ${R0(a.wealth)} ريال · الأيام ${fmt(a.days)} · السنة ${a.year} هـ</p><p>${esc(grandchildPerkText(a.perk, a))}</p>${a.message.trim() ? `<details><summary>كلمات الجد</summary><blockquote>${esc(a.message)}</blockquote></details>` : ''}</section>`;
}
function grandchildRetiredHTML() {
  if (!E.GRANDCHILD.on || !S.legacy?.retired || !E.grandchildCard(S)) return '';
  return '<section class="card grandchild-retired"><h3>التقاعد وانتقال الأمانة</h3><p>يمكنك متابعة مسيرة الوريث، أو بدء مسيرة جديدة لحفيد التاجر بإرث رمزي محدود.</p><button data-act="grandchild-open">ابدأ حفيداً</button></section>';
}
function renderGrandchildEntry() {
  let button = $('hGrandchild'); const available = E.GRANDCHILD.on && S.legacy?.retired && !!E.grandchildCard(S);
  if (!available) button?.remove();
  else if (!button) { button = document.createElement('button'); button.id = 'hGrandchild'; button.dataset.act = 'grandchild-open'; button.setAttribute('role','menuitem'); button.textContent = 'ابدأ حفيداً'; $('hmenuPanel').prepend(button); }
  let badge = $('hAncestry');
  if (!S.ancestry) { badge?.remove(); return; }
  if (!badge) { badge=document.createElement('small');badge.id='hAncestry';$('hTitle').parentElement.append(badge); }
  badge.textContent = (S.player.name || 'التاجر') + ' · ' + S.ancestry.title; badge.title=badge.textContent;
}
function grandchildOpen() {
  if (grandchildPrompt || !E.GRANDCHILD.on || !S.legacy?.retired) return;
  if (savePause || apNoSave || S.awayJob || fgOpen() || learnNext()) return toast('أكمل البطاقة المفتوحة أولاً وتأكد من عمل الحفظ.');
  const card = E.grandchildCard(S); if (!card) return;
  let saved; try { saved = localStorage.getItem(KEY); } catch (_) { return toast('تعذر قراءة الحفظ؛ لم يتغير تقدمك.'); }
  grandchildPrompt = { state:S, raw:E.save(S), saved, card, perk:'purse', pause:savePause, view:agingView, focus:document.activeElement, applying:false };
  clearTimeout(saveT); savePause=true; setHmenu(false); agingView='grandchild'; renderGrandchildConfirm();
}
function renderGrandchildConfirm() {
  const c=grandchildPrompt, el=$('agingPanel'); if (!c) return;
  el.hidden=false;if(el.dataset.kind==='grandchild'&&el.querySelector('#grandchildConfirm'))return;el.dataset.kind='grandchild';
  el.innerHTML=`<div id="grandchildConfirm" class="lbox aging-box grandchild-confirm" role="dialog" aria-modal="true" aria-labelledby="grandchildTitle"><h2 id="grandchildTitle" tabindex="-1">ابدأ حفيداً</h2><p class="grandchild-warning">ستبدأ لعبة جديدة وتُستبدل مسيرة الجد.</p><p>تبدأ بقافلة البداية العادية ودروسها من أولها. لا تنتقل أصول الجد أو تقدمه.</p><p>اللقب: <b>${esc(c.card.title)}</b></p><fieldset><legend>اختر مزية واحدة فقط</legend>${['purse','name','map'].map(perk=>`<label class="grandchild-choice"><input type="radio" name="grandchildPerk" value="${perk}" ${perk===c.perk?'checked':''}>${esc(grandchildPerkText(perk,c.card))}</label>`).join('')}</fieldset><button data-act="grandchild-export">احفظ نسخة أولاً</button><p class="small muted">التصدير يحفظ مسيرة الجد الحالية. يمكنك الإلغاء والمتابعة كما أنت.</p><p id="grandchildStatus" role="status"></p><div class="row"><button class="pri" data-act="grandchild-start">ابدأ</button><button data-act="grandchild-cancel">إلغاء</button></div></div>`;
  $('grandchildTitle').focus({preventScroll:true});
}
function grandchildCancel() {
  const c=grandchildPrompt;if(!c)return;grandchildPrompt=null;clearTimeout(saveT);agingView=c.view;savePause=c.pause;
  $('agingPanel').hidden=true;delete $('agingPanel').dataset.kind;renderAgingUI();
  (c.focus?.isConnected&&c.focus.getClientRects().length?c.focus:$('hMenu'))?.focus({preventScroll:true});
}
async function grandchildExport() {
  if(!grandchildPrompt)return;
  backupMessage='';await backupExport();backupClose();if(grandchildPrompt){$('grandchildStatus').textContent=backupMessage;$('grandchildTitle').focus({preventScroll:true});}
}
async function grandchildStart() {
  const c=grandchildPrompt;if(!c||c.applying||!E.GRANDCHILD.on)return;
  c.applying=true;const button=document.querySelector('[data-act=grandchild-start]');if(button)button.disabled=true;document.querySelectorAll('[name=grandchildPerk]').forEach(input=>input.disabled=true);$('grandchildStatus').textContent='جارٍ تجهيز نسخة الجد…';
  const fail=t=>{if(grandchildPrompt===c){c.applying=false;$('grandchildStatus').textContent=t;if(button)button.disabled=false;document.querySelectorAll('[name=grandchildPerk]').forEach(input=>input.disabled=false);}};
  let next,before;try{next=E.startGrandchild(c.state,c.perk,Date.now()%100000+1);if(!next)return fail('تعذر إعداد المسيرة الجديدة؛ لم يتغير تقدمك.');before=await backupZip(c.raw);if(!before)before=JSON.stringify(backupEnvelopeOf(c.raw));}catch(_){return fail('تعذر تجهيز نسخة الجد؛ لم يتغير تقدمك.');}
  if(grandchildPrompt!==c)return; // الإلغاء أثناء الضغط لا يكتب شيئاً.
  if(S!==c.state||E.save(S)!==c.raw||!E.GRANDCHILD.on)return fail('تغيّرت المسيرة؛ ألغِ النافذة وأعد فتحها لمراجعتها.');
  let previousBefore=null,wroteBefore=false;
  try {
    if(localStorage.getItem(KEY)!==c.saved)return fail('تغيّر الحفظ في نافذة أخرى؛ لم نستبدله.');
    previousBefore=localStorage.getItem(BACKUP_BEFORE);localStorage.setItem(BACKUP_BEFORE,before);wroteBefore=true;
    localStorage.setItem(KEY,E.save(next));
  } catch(_) {
    if(wroteBefore)try{if(previousBefore===null)localStorage.removeItem(BACKUP_BEFORE);else localStorage.setItem(BACKUP_BEFORE,previousBefore);}catch(_){}
    return fail('تعذرت الكتابة على هذا الجهاز؛ لم يتغير تقدمك.');
  }
  // بعد نجاح الكتابة فقط. حلقة النسخ تحتفظ أيضاً بلقطة الجد، و«قبل الاستعادة» يتيح التراجع القائم.
  backupStore({day:c.state.day,stage:c.state.learn.stage||c.state.learn.level,retired:true,createdAt:new Date().toISOString()},c.raw);
  S=next;grandchildPrompt=null;savePause=c.pause;agingView='';$('agingPanel').hidden=true;delete $('agingPanel').dataset.kind;
  newSure=false;storyGo=false;sel=main().city;carSel=1;mapC='all';mapView={zoom:1,center:null};mapListOpen={};dg=null;prof=false;seq=null;view=null;mhelp=null;rcpt=null;renderReceipt();roadRes=null;arr=null;lastLeft=null;salemOpen=false;closeResourceMenu();setHdr(false);setFab(false);setAlerts(false);closeMini();
  setSpeed(0);go('home');persist();
}
document.addEventListener('click',ev=>{const button=ev.target.closest('[data-act^="grandchild-"]');if(!button)return;ev.preventDefault();ev.stopImmediatePropagation();const act=button.dataset.act;if(act==='grandchild-open')grandchildOpen();else if(act==='grandchild-cancel')grandchildCancel();else if(act==='grandchild-export')grandchildExport();else if(act==='grandchild-start')grandchildStart();},true);
document.addEventListener('change',ev=>{if(ev.target.name==='grandchildPerk'&&grandchildPrompt&&!grandchildPrompt.applying)grandchildPrompt.perk=ev.target.value;});
document.addEventListener('keydown',ev=>{if(!grandchildPrompt)return;if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();grandchildCancel();}if(ev.key==='Tab'){const a=[...$('grandchildConfirm').querySelectorAll('button:not(:disabled),input')].filter(e=>e.getClientRects().length),first=a[0],last=a.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}},true);
