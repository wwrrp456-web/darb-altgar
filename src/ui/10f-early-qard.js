/* واجهة القرض المبكر؛ لا حساب مالي بديل عن المحرك. */
let earlyQardView=null,earlyQardTrigger=null;
const earlyQardMoney=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
function earlyQardLoan(){return S.player.bank.loans.find(l=>l.src==='salem'&&l.amt>0);}
function earlyQardButton(){return '<button class="sm" data-act="early-qard-open">'+(earlyQardLoan()?'تفاصيل القرض والسداد':'طلب القرض المبكر')+'</button>';}
function earlyQardCard(){
 const l=earlyQardLoan(),last=S.player.salemQard?.history?.[0];
 if(!l)return `<section class="card early-qard-card ${last?'qard-paid':''}"><h3>القرض المبكر</h3>${last?`<p>تم سداد القرض السابق بالكامل.</p>${S.player.salemQard?.onTime>0?'<span class="pill qard-fulfilment" aria-label="وسام موفٍ">موفٍ</span>':''}${last.early?mentorSay('وفيت يا ولدي','teach'):''}`:'<p>عاين أهليتك والمبلغ المتاح قبل الطلب.</p>'}${earlyQardButton()}</section>`;
 const days=Number.isFinite(l.due)?l.due-S.day:null,face=Number.isFinite(l.face)&&l.face>0?l.face:null,paid=face?Math.max(0,face-l.amt):null;
 return `<section class="card early-qard-card"><h3>قرض ${earlyQardMoney(l.amt)} ريال</h3><p>${days===null?'موعد السداد: للتأكد':days>0?'باقي '+days+' يوماً':days===0?'يحل السداد اليوم':'مضى على الموعد '+(-days)+' يوماً'}${l.defaulted?' · متعثر':''}</p>${face?`<label>سُدد ${earlyQardMoney(paid)} من ${earlyQardMoney(face)} ريال<progress aria-label="تقدم سداد القرض" max="${face}" value="${paid}"></progress></label>`:'<p>أصل القرض: للتأكد</p>'}${earlyQardButton()}</section>`;
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
