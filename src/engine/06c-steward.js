/* أمين21: ترقية داخلية بعد خدمة ومراجعة؛ لا توكيل ضمني أو تعيين خارجي. */
const STEWARD = { phase:3, serviceDays:90, minAssets:3, reviewDays:10, span:6, raise:1.5 };
const stewardOf=(S,city)=>S.player.props[city]?.mgr?.rank===3?S.player.props[city].mgr:null;
function stewardQuote(S,city) {
 const m=S.player.props[city]?.mgr,reasons=[];
 if(!Object.hasOwn(S.cities,city)||!Object.hasOwn(S.player.props,city))return {ok:false,msg:'لا ممتلكات في هذه المنطقة.'};
 if(!m||m.rank!==2)return {ok:false,msg:'تحتاج مدير ممتلك مُرقّى من عامل أولاً.'};
 const count=teamAssets(S,city).length,days=m.days||0;
 if(S.phase<STEWARD.phase)reasons.push('تحتاج الطور '+STEWARD.phase);
 if(days<STEWARD.serviceDays)reasons.push('بقي '+(STEWARD.serviceDays-days)+' يوم خدمة للمدير');
 if(count<STEWARD.minAssets)reasons.push('تحتاج '+STEWARD.minAssets+' ممتلكات في المنطقة');
 if(m.late||(S.paymentDues||[]).some(d=>d.id===m.paymentDue&&d.amount>0))reasons.push('سدّد أجر المدير المتأخر');
 if(!m.review||m.review.days<STEWARD.serviceDays||m.review.day>S.day||S.day-m.review.day>STEWARD.reviewDays)reasons.push('راجع حساباته بعد إتمام مدة الخدمة؛ المراجعة صالحة '+STEWARD.reviewDays+' أيام');
 const wage=Math.round(Math.max(MGR[2].wage,managerWage(m)*STEWARD.raise)*100)/100;
 return {ok:!reasons.length,msg:reasons.join(' · '),reasons,days,count,wage,oldWage:managerWage(m),span:STEWARD.span};
}
function promoteSteward(S,city) {
 const q=stewardQuote(S,city);if(!q.ok)return NO(q.msg);
 const m=S.player.props[city].mgr;
 Object.assign(m,{rank:3,lv:2,managerDays:m.days,days:0,since:S.day,audit:S.day,wage:q.wage,span:q.span,policy:{pay:false,report:false,restock:false,pricing:false,limit:0,every:'daily'}});delete m.serviceDay;delete m.review;
 return OK('رُقّي مديرك إلى أمين منطقة '+S.cities[city].name+' بأجر '+q.wage+' ريال يومياً، ونطاق '+q.span+' ممتلكات.');
}
const STEWARD_FLAGS=['pay','report','restock','pricing'];
function stewardStats(S,city){const m=stewardOf(S,city);if(!m)return null;if(m.work?.day!==S.day)m.work={day:S.day,spent:0,paid:0,stock:0,prices:0,actions:0,blocked:false};return m.work;}
function stewardRemaining(S,city){const m=stewardOf(S,city);return m?Math.max(0,(m.policy?.limit||0)-(m.work?.day===S.day?m.work.spent:0)):0;}
function stewardLog(S,city,body){const m=stewardOf(S,city);if(!m)return;const log=S.player.mgrActions||(S.player.mgrActions=[]);log.unshift({id:S.nextId++,d:S.day,city,steward:m.id,...body});if(log.length>30)log.length=30;const w=stewardStats(S,city);w.actions++;if(body.kind==='price')w.prices++;}
function stewardPays(S,city,cat){const m=stewardOf(S,city);if(!m?.policy?.pay||!['rent','staff','wages'].includes(cat))return false;const car=mainCar(S);return S.player.props[city].wageMode==='steward'||car.city!==city||car.left>0;}
function setStewardPolicy(S,city,next){
 const m=stewardOf(S,city);if(!m)return NO('تحتاج أمين منطقة مُرقّى أولاً.');
 if(!next||!STEWARD_FLAGS.every(k=>typeof next[k]==='boolean')||!Number.isFinite(next.limit)||next.limit<0||next.limit>1e9||!['daily','weekly','event'].includes(next.every))return NO('راجع الصلاحيات والحد اليومي.');
 if(next.limit+1e-6<(m.work?.day===S.day?m.work.spent:0))return NO('الحد الجديد أقل مما صُرف اليوم؛ يمكنك إيقاف الصلاحية مع إبقاء حد اليوم.');
 if((next.pay||next.restock)&&next.limit<=0)return NO('حدد حداً يومياً موجباً قبل تفويض السداد أو التعبئة.');
 m.policy=Object.fromEntries([...STEWARD_FLAGS.map(k=>[k,next[k]]),['limit',Math.round(next.limit*100)/100],['every',next.every]]);
 if(!m.policy.pay&&S.player.props[city].wageMode==='steward')S.player.props[city].wageMode='manual';
 return OK('حُفظ تفويض الأمين وحدّه اليومي. إيقاف السداد المفوّض يترك الأجور يدوية حتى تختار طريقتها.');
}
function stewardDebit(S,city,cat,amount,label){
 const w=stewardStats(S,city),paid=Math.max(0,Math.min(amount,stewardRemaining(S,city),S.player.wallet.sar));
 if(paid>0){const context=S.ctxCur;S.ctxCur='sar';pPay(S,cat,paid,true);S.ctxCur=context;regionalPaymentRecord(S,city,cat,paid,'steward');w.spent+=paid;w.paid+=paid;stewardLog(S,city,{kind:'pay',amount:paid,why:label});}
 if(paid+1e-6<amount)w.blocked=true;
 return paid;
}
function stewardBegin(S){
 for(const [city,pr]of Object.entries(S.player.props)){
  const m=stewardOf(S,city);
  if(pr.wageMode==='steward'&&!m){pr.wageMode='auto';news(S,'لا أمين في '+S.cities[city].name+'؛ عادت الأجور إلى السداد التلقائي.');}
  if(!m)continue;stewardStats(S,city);if(m.handledDay===S.day)continue;m.handledDay=S.day;
  if(!stewardPays(S,city,'staff'))continue;
  for(const due of (S.paymentDues||[]).filter(d=>d.city===city&&d.amount>0).slice()){
   const target=paymentTarget(S,due);if(due.kind==='staff'&&target?.role)workerPayDay(S,target);const paid=stewardDebit(S,city,due.cat,due.amount,'سداد متأخر: '+due.label);if(!(paid>0))break;
   if(target&&due.kind==='rent')target.rentPaid=(target.rentPaid||0)+paid;
   due.amount=Math.max(0,due.amount-paid);if(due.deferredWages)due.deferredWages=Math.max(0,due.deferredWages-paid);
   if(due.amount<1e-6){if(target){if(!due.unknownPast){if(due.kind==='rent')target.arrears=0;else if('late'in target)target.late=0;}delete target.paymentDue;}S.paymentDues=S.paymentDues.filter(d=>d!==due);}
  }
 }
}
function stewardEnd(S){
 for(const [city,pr]of Object.entries(S.player.props)){
  const m=stewardOf(S,city);if(!m||m.work?.day!==S.day||m.reportDay===S.day)continue;
  const w=m.work,due=(S.paymentDues||[]).filter(d=>d.city===city).reduce((n,d)=>n+d.amount,0);
  const report={day:S.day,paid:w.paid,stock:w.stock,prices:w.prices,spent:w.spent,remaining:stewardRemaining(S,city),cash:S.player.wallet.sar,due,blocked:w.blocked};m.reports=[report,...(m.reports||[])].slice(0,30);m.reportDay=S.day;
  if(m.policy?.report&&(m.policy.every==='daily'||m.policy.every==='weekly'&&S.day%7===0||w.blocked))news(S,'تقرير أمين '+S.cities[city].name+': سداد '+w.paid.toFixed(2)+'، تعبئة '+w.stock.toFixed(2)+' ريال'+(w.blocked?'؛ يحتاج مراجعة السيولة أو الحد.':'.'),w.blocked?'bad':'');
 }
}
function undoStewardPrice(S,city){
 const m=stewardOf(S,city);if(!m)return NO('لا أمين في المنطقة.');
 const action=(S.player.mgrActions||[]).find(a=>a.city===city&&a.steward===m.id&&a.kind==='price'&&!a.undone);
 if(!action||!GD[action.g]||!Number.isFinite(action.from)||!Number.isFinite(action.to)||action.from<.5||action.from>3||S.day-action.d>1||S.day<action.d)return NO('لا تعديل سعر حديث قابل للتراجع.');
 const item=S.player.props[city].shops.find(sh=>sh.id===action.shopId)?.items.find(it=>it.g===action.g);
 if(!item||Math.abs(item.price-action.to)>1e-8)return NO('تغير السعر أو الصنف بعد تصرف الأمين؛ لم يُعدّل شيء.');
 item.price=action.from;action.undone=true;stewardLog(S,city,{kind:'undo',amount:0,why:'تراجع عن تعديل سعر '+GD[action.g].name});return OK('أُعيد السعر السابق؛ لم يتغير الرصيد.');
}

function stewardMigrate(S,m){
 const p=m.policy||{},valid=Number.isFinite(p.limit)&&p.limit>=0&&p.limit<=1e9;
 m.policy={...Object.fromEntries(STEWARD_FLAGS.map(k=>[k,valid&&p[k]===true&&(!['pay','restock'].includes(k)||p.limit>0)])),limit:valid?p.limit:0,every:['daily','weekly','event'].includes(p.every)?p.every:'daily'};
 if(m.work&&(!Number.isSafeInteger(m.work.day)||m.work.day>S.day||!['spent','paid','stock','prices','actions'].every(k=>Number.isFinite(m.work[k])&&m.work[k]>=0)||m.work.spent+1e-6<m.work.paid+m.work.stock)){delete m.work;m.policy.pay=false;m.policy.restock=false;}
 m.reports=(Array.isArray(m.reports)?m.reports:[]).filter(r=>r&&Number.isSafeInteger(r.day)&&r.day<=S.day&&['paid','stock','prices','spent','remaining','cash','due'].every(k=>Number.isFinite(r[k])&&r[k]>=0)).slice(0,30);
}
