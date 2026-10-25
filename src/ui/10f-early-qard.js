/* واجهة القرض المبكر؛ لا حساب مالي بديل عن المحرك. */
let earlyQardView=null,earlyQardTrigger=null;
const earlyQardMoney=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
function earlyQardLoan(){return S.player.bank.loans.find(l=>l.src==='salem'&&l.amt>0);}
function earlyQardButton(){return '<button class="sm" data-act="early-qard-open">'+(earlyQardLoan()?'تفاصيل القرض والسداد':'طلب القرض المبكر')+'</button>';}
function earlyQardCard(){
 const l=earlyQardLoan(),last=S.player.salemQard?.history?.[0];
 if(!l)return `<section class="card early-qard-card ${last?'qard-paid':''}"><h3>القرض المبكر</h3>${last?`<p>تم سداد القرض السابق بالكامل.</p>${S.player.salemQard?.onTime>0?'<span class="pill qard-fulfilment" aria-label="وسام موفٍ">موفٍ</span>':''}${last.early?mentorSay('وفيت يا ولدي','teach'):''}`:'<p>عاين أهليتك والمبلغ المتاح قبل الطلب.</p>'}${earlyQardButton()}</section>`;
 const days=Number.isFinite(l.due)?l.due-S.day:null,face=Number.isFinite(l.face)&&l.face>0?l.face:null,paid=face?Math.max(0,face-l.amt):null;
 return `<section class="card early-qard-card"><h3>قرض ${earlyQardMoney(l.amt)} ريال</h3><p>${days===null?'موعد السداد: للتأكد':days>0?'باقي '+days+' يوماً':days===0?'يحل السداد اليوم':'مضى على الموعد '+(-days)+' يوماً'}${l.defaulted?' · متعثر':''}</p>${face?`<label>سُدد ${earlyQardMoney(paid)} من ${earlyQardMoney(face)} ريال<progress aria-label="تقدم سداد القرض" max="${face}" value="${paid}"></progress></label>`:'<p>أصل القرض: للتأكد</p>'}${earlyQardButton()}${earlyQardDealHTML()}</section>`;
}
function earlyQardReminder(){const l=earlyQardLoan();return l&&Number.isFinite(l.due)&&l.due-S.day<=10?earlyQardCard():'';}
function openEarlyQard(trigger){earlyQardTrigger=trigger;earlyQardView={root:S};const p=$('earlyQardPanel');p.hidden=false;renderEarlyQard();p.showModal();p.querySelector('button').focus();}
function closeEarlyQard(restore=true){const p=$('earlyQardPanel'),t=earlyQardTrigger;earlyQardView=null;earlyQardTrigger=null;if(p.open)p.close();p.hidden=true;p.dataset.view='';p.innerHTML='';if(restore)(t?.isConnected?t:$('hMenu'))?.focus({preventScroll:true});}
function renderEarlyQard(){
 if(!earlyQardView)return;if(earlyQardView.root!==S)return closeEarlyQard(false);
 const p=$('earlyQardPanel'),l=earlyQardLoan(),q=E.earlyQardQuote(S),key=JSON.stringify([l,q,S.player.wallet.sar]);if(p.dataset.view===key)return;p.dataset.view=key;
 const selected=p.querySelector('input')?.value,focused=p.contains(document.activeElement)?document.activeElement.id:null;
 let h='<div class="asset-sheet"><header class="asset-sheet-head"><h2 id="earlyQardTitle">القرض المبكر</h2><button class="sm" data-act="early-qard-close" aria-label="إغلاق القرض">✕</button></header>';
 if(l){const max=Math.min(l.amt,S.player.wallet.sar);h+=`<p>المتبقي: <b>${earlyQardMoney(l.amt)} ريال</b> · رصيد الريال: ${earlyQardMoney(S.player.wallet.sar)}</p><label for="earlyQardAmount">مبلغ السداد بالريال</label><input id="earlyQardAmount" type="number" inputmode="decimal" min="0.01" max="${max}" step="any" value="${max}"><p class="small muted">يُخصم من رصيد الريال فقط؛ يمكنك السداد جزئياً. لا تُسحب العملات الأخرى أو الحصّالة.</p><footer class="asset-sheet-actions"><button class="sm" data-act="early-qard-close">إلغاء</button><button class="pri" data-act="early-qard-pay" ${max>0?'':'disabled'}>تأكيد السداد</button></footer>`;}
 else if(!q.ok)h+=`<p role="alert">${esc(q.msg)}</p><button class="sm" data-act="early-qard-close">إغلاق</button>`;
 else h+=`<p>بكفالة جدّك · المدة ${q.days} يوماً · بلا زيادة.</p><p>المتاح من ${E.EARLY_QARD.min} إلى ${earlyQardMoney(q.limit)} ريال. موعد السداد: اليوم ${q.due}.</p><label for="earlyQardAmount">مبلغ القرض بالريال</label><input id="earlyQardAmount" type="number" inputmode="numeric" min="${E.EARLY_QARD.min}" max="${q.limit}" step="1" value="${q.limit}"><p class="small muted">يضاف إلى رصيد الريال مع دين مساوٍ له. يبدأ استيفاء المتاح تلقائياً عند الموعد؛ وبعد ${q.grace} يوماً دون إكمال السداد تتأثر سمعة الوفاء. لا زيادة على الدين ولا مصادرة.</p><footer class="asset-sheet-actions"><button class="sm" data-act="early-qard-close">إلغاء</button><button class="pri" data-act="early-qard-issue">تأكيد الاقتراض</button></footer>`;
 p.innerHTML=h+'<p id="earlyQardError" role="alert"></p></div>';const input=p.querySelector('input');if(input&&selected!==undefined)input.value=selected;if(focused)$(focused)?.focus({preventScroll:true});
}
function submitEarlyQard(pay){
 if(!earlyQardView||earlyQardView.root!==S)return closeEarlyQard(false);
 const input=$('earlyQardAmount');if(!input||!input.value||!input.reportValidity())return;
 const r=pay?A.repayEarlyQard(S,Number(input.value)):A.earlyQard(S,Number(input.value));
 if(!r.ok){$('earlyQardError').textContent=r.msg;return;}
 closeEarlyQard();persist();act(r);if(pay&&r.early){toast('وفيت يا ولدي');sfx('success');}
}
const earlyQardPanel=$('earlyQardPanel');
earlyQardPanel.addEventListener('cancel',e=>{e.preventDefault();closeEarlyQard();});
earlyQardPanel.addEventListener('close',()=>{if(earlyQardView)closeEarlyQard();});
document.addEventListener('keydown',e=>{if(!earlyQardView)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeEarlyQard();}else if(e.key==='Tab'){const nodes=[...earlyQardPanel.querySelectorAll('button:not([disabled]),input')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},true);
window.addEventListener('popstate',()=>closeEarlyQard(false));

/* المعاينة تقتصر على رأس مال القرض المتبقي؛ لا تغير الرصيد ولا حالة السوق. */
function earlyQardTripPlan(t,p){
 const l=earlyQardLoan(),m=main(),c=S.cities[m.city];
 if(!l||l.id!==t.loanId||m.left>0||E.travelBlock(S,m,t.d))return {...p,ok:false,k:0,cost:0,budget:0,afford:0,msg:'لم يعد القرض أو هذا المسار متاحاً. أغلق التجهيز وراجع التمويل والخريطة.'};
 const budget=Math.max(0,Math.min(t.budget,l.amt,S.player.wallet.sar)),bb=E.buyBudget(S,m.city),wheat=E.unitPrice(c,'wheat');
 const held=E.holdings(m),value=E.valueOf(held),currency=E.curOf(c.country);
 // احتياطي محافظ لتحويل رأس المال الريالي إلى عملة السوق، وفق رسوم applyDelta.
 const fx=currency==='sar'?0:E.feeOf('sar',currency)+0.005+(E.fxMode(S)==='penalty'?E.FXM.penalty:0);
 const extra=n=>{const cargo={...held,[t.g]:(held[t.g]||0)+n},v=value+n*E.mid(t.g);
  return Math.ceil(n*(GD[t.g].fod||0)*p.days)*wheat*1.25+E.customsOf(S,m.city,t.d,cargo)+(m.insured?v*E.TK.tripRate*(p.sea?1.4:1):0)+(p.sea?Math.max(E.SEA.feeMin,E.SEA.feePct*v)-p.sp.fee:0);};
 const quote=n=>E.quoteBuy(S,m.city,t.g,n,bb);
 let lo=0,hi=Math.max(0,Math.floor(Math.min(p.room,t.q,c.stock[t.g])));
 while(lo<hi){const n=Math.ceil((lo+hi)/2),q=quote(n);if(q.n===n&&(q.cost+extra(n)+p.reserve)*(1+fx)<=budget)lo=n;else hi=n-1;}
 const q=quote(lo),reserve=(p.reserve+extra(lo))*(1+fx)+q.cost*fx;
 return {...p,ok:true,k:lo,cost:q.cost,reserve,budget,afford:lo,walletShort:E.fxMode(S)==='manual'&&bb<budget-p.reserve&&lo<1&&p.room>=1};
}
function earlyQardDeal(){
 const l=earlyQardLoan(),m=main();if(!l||!Number.isSafeInteger(l.id)||m.left>0||S.awayJob)return null;
 const budget=Math.min(l.amt,S.player.wallet.sar);if(!(budget>0))return null;
 let best=null;
 for(const o of deals()){
  const room=Math.floor((E.capOfCar(m)-E.loadOf(m))/GD[o.g].w),t={g:o.g,d:o.d,q:room,route:'land',loanId:l.id,budget},p=tripPlan(t);
  if(!p.ok||p.k<1)continue;
  const sale=E.sellOptions(S,m.city,o.g,p.k,p.cost/p.k,m).find(x=>x.city===o.d);
  if(sale&&sale.profit>0&&(!best||sale.profit/p.days>best.profit/best.days))best={...t,q:p.k,cost:p.cost,reserve:p.reserve,profit:sale.profit,days:p.days,age:sale.age};
 }
 return best;
}
function earlyQardDealHTML(){
 const d=earlyQardDeal();if(!d)return '<p class="small muted qard-no-deal">لا صفقة مناسبة للقرض الآن. راجع الحمولة والرصيد وعملة السوق والأسعار لاحقاً.</p>';
 return `<div class="qard-deal" data-good="${d.g}" data-destination="${d.d}" data-quantity="${d.q}" data-budget="${d.budget}" data-cost="${d.cost}" data-reserve="${d.reserve}"><h4>صفقة مقترحة للقرض</h4><p>${gi(d.g)} ${GD[d.g].name} · ${cityTag(d.d)} · ${d.days} أيام</p><p>حتى ${d.q} وحدة · شراء ${earlyQardMoney(d.cost)} ريال · احتياطي الطريق والجمارك ${earlyQardMoney(d.reserve)} ريال، ضمن ميزانية ${earlyQardMoney(d.budget)} ريال.</p><p class="small muted">ربح تقديري ${earlyQardMoney(d.profit)} ريال؛ معلومات الوجهة منذ ${d.age} أيام. الأسعار والمخاطر قد تغيّر النتيجة، ولا تضمن سداد القرض.</p><button class="pri" data-act="early-qard-deal">اشترِ بالقرض الآن</button><p class="small muted">يفتح تجهيز الرحلة للمراجعة؛ لا شراء ولا انطلاق قبل تأكيدك. مؤن التسريع الاختيارية لها تكلفتها المنفصلة.</p></div>`;
}
function openEarlyQardDeal(){
 const d=earlyQardDeal();if(!d)return toast('تغيرت حالة القافلة أو السوق؛ لا صفقة مناسبة للقرض الآن.');
 if(prof)prof=false;salemSet(false);closeEarlyQard(false);dealGo(d.g,d.d,d.q,{loanId:d.loanId,budget:d.budget});
}
