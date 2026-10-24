/* معاينة فقط؛ الإصدار والسداد في دفعة المحرك التالية. */
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
