/* القرض المبكر مستقل عن سياسة قرض الطور4. */
const EARLY_QARD={min:2000,base:2000,max:3000,level:3,upgradeLevel:5,days:90,grace:30,debtCap:3000,wealthShare:.5};
function earlyQardQuote(S,amount){
 const P=S.player,L=S.learn,policy=EARLY_QARD,no=(code,msg,extra={})=>({ok:false,code,msg,...extra});
 if(!L?.char||L.level<policy.level||S.phase<1)return no('level','يُتاح القرض المبكر من مستوى التعلم 3.');
 const main=P.caravans.find(c=>c.main)||P.caravans[0];if(!main||main.left>0)return no('travel','انتظر وصول قافلتك قبل طلب القرض.');
 if(S.awayJob||S.awaySim)return no('away','انتظر انتهاء حساب الغياب.');
 const loans=P.bank.loans;
 if(loans.some(l=>!Number.isFinite(l.amt)||l.amt<0))return no('data','بيانات الدين غير مكتملة: للتأكد.');
 if(loans.some(l=>l.src==='salem'&&l.amt>0))return no('active','لديك قرض مبكر قائم؛ سدّده قبل طلب آخر.');
 if(loans.some(l=>l.amt>0&&((l.late||0)>0||Number.isFinite(l.due)&&l.due<=S.day)))return no('late','سدّد القسط المستحق قبل طلب قرض جديد.');
 const fd=P.famDebt,family=fd?fd.left:0;
 if(!Number.isFinite(family)||family<0)return no('data','رصيد دَين الجدّ غير مكتمل: للتأكد.');
 if(family>0&&fd.due!=null&&fd.due<=S.day){
  if(!Number.isFinite(fd.amt0)||fd.amt0<=0)return no('data','القسط العائلي غير مقيد بالكامل: للتأكد.');
  const need=Math.min(family,Math.round(fd.amt0*BAB.DEBT.installPct));
  if((fd.mPaid||0)<need)return no('late','سدّد القسط العائلي المستحق قبل طلب قرض جديد.');
 }
 const wealth=netWorth(S),debt=bankDebt(S)+family;
 if(!Number.isFinite(wealth)||!Number.isFinite(debt))return no('data','تعذر حساب الثروة أو الدين: للتأكد.');
 const ceiling=L.level>=policy.upgradeLevel||(P.salemQard?.onTime||0)>0?policy.max:policy.base;
 const wealthLimit=Math.max(0,Math.floor((wealth+policy.base)*policy.wealthShare)),debtRoom=Math.max(0,Math.floor(policy.debtCap-debt)),limit=Math.min(ceiling,wealthLimit,debtRoom);
 const terms={limit,ceiling,wealthLimit,debtRoom,existingDebt:debt,days:policy.days,grace:policy.grace,due:S.day+policy.days};
 if(limit<policy.min)return no('capacity','الحد المتاح أقل من 2000 ريال وفق سقف الثروة أو إجمالي الديون؛ لا يُصدر قرض أصغر.',terms);
 const requested=amount===undefined?limit:amount;
 if(!Number.isSafeInteger(requested)||requested<policy.min||requested>limit)return no('amount','اختر مبلغاً صحيحاً بين 2000 و'+limit+' ريال.',terms);
 return {ok:true,...terms,amount:requested,type:'qard',src:'salem',markup:0};
}
function issueEarlyQard(S,amount){
 const q=earlyQardQuote(S,amount);if(!q.ok)return q;
 const P=S.player,id=S.nextId++,loan={id,type:'qard',src:'salem',amt:q.amount,face:q.amount,markup:0,day:S.day,due:q.due,late:0};
 P.bank.loans.push(loan);P.wallet.sar+=q.amount;
 const book=P.salemQard||(P.salemQard={onTime:0,history:[]});book.issued=(book.issued||0)+1;
 return {...OK('استلمت '+q.amount+' ريال؛ موعد السداد يوم '+q.due+'.'),id,amount:q.amount,due:q.due};
}
function earlyQardComplete(S,l){
 if(l.completed||l.amt>1e-8)return;
 l.completed=true;l.amt=0;
 const book=S.player.salemQard||(S.player.salemQard={onTime:0,history:[]}),onTime=Number.isFinite(l.due)&&S.day<=l.due,early=onTime&&S.day<l.due;
 if(onTime)book.onTime=(book.onTime||0)+1;
 const history=book.history||(book.history=[]);history.unshift({id:l.id,face:l.face,paidAt:S.day,onTime,early,defaulted:!!l.defaulted});history.length=Math.min(20,history.length);
}
function payEarlyQard(S,l,amount){
 if(!(Number.isFinite(amount)&&amount>0&&l.amt>0&&l.src==='salem'))return 0;
 const n=Math.min(amount,l.amt,Math.max(0,S.player.wallet.sar));if(!(n>0))return 0;
 S.player.wallet.sar-=n;l.amt-=n;S.player.led.exp.debtPaid=(S.player.led.exp.debtPaid||0)+n;earlyQardComplete(S,l);return n;
}
function repayEarlyQard(S,amount){
 const l=S.player.bank.loans.find(l=>l.src==='salem'&&l.amt>0);if(!l)return NO('لا قرض مبكر قائم.');
 if(amount===undefined)amount=l.amt;
 if(!Number.isFinite(amount)||amount<=0)return NO('اختر مبلغ سداد موجباً.');
 const paid=payEarlyQard(S,l,amount);if(!paid)return NO('رصيد الريال لا يكفي للسداد.');
 S.player.bank.loans=S.player.bank.loans.filter(l=>l.src==='salem'?l.amt>1e-8:l.amt>.5);
 return {...OK('سدّدت '+paid.toFixed(2)+' ريال من القرض المبكر.'),paid,left:l.amt,early:!!l.completed&&S.day<l.due};
}
function earlyQardDay(S,l){
 if(!Number.isFinite(l.due))return; // لا أجل مخترع لقيد قديم ناقص.
 for(const days of [10,3])if(l.due-S.day===days&&!l['remind'+days]){l['remind'+days]=true;news(S,'بقي '+days+' أيام على سداد القرض المبكر.');}
 if(S.day<l.due)return;
 payEarlyQard(S,l,l.amt);
 if(l.amt>1e-8&&S.day>=l.due+EARLY_QARD.grace){
  l.late=S.day-l.due-EARLY_QARD.grace+1;
  if(!l.defaulted){l.defaulted=true;repOf(S.player).broke++;news(S,'تأخر سداد القرض المبكر؛ يبقى المبلغ المستحق دون زيادة.','bad');interrupt(S,'earlyQardDefault');}
 }
}
function earlyQardDebtCut(S,pl){
 const P=S.player,fd=P.famDebt;let paid=0,budget=Math.max(0,Math.min(pl*BAB.DEBT.cutDebt,P.wallet.sar));
 const targets=P.bank.loans.filter(l=>l.amt>0).map(l=>({day:l.day||0,l}));if(fd.left>0)targets.push({day:-1,family:true});targets.sort((a,b)=>a.day-b.day);
 for(const t of targets){if(budget<=0)break;const n=Math.min(budget,t.family?fd.left:t.l.amt,P.wallet.sar);if(n<=0)continue;
  if(t.family){P.wallet.sar-=n;debtApply(S,n);}else if(t.l.src==='salem')payEarlyQard(S,t.l,n);else{P.wallet.sar-=n;t.l.amt-=n;P.led.exp.debtPaid=(P.led.exp.debtPaid||0)+n;}budget-=n;paid+=n;
 }
 P.bank.loans=P.bank.loans.filter(l=>l.src==='salem'?l.amt>1e-8:l.amt>.5);
 return paid;
}
