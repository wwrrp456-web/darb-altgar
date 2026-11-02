/* إدارة المزرعة: حركة مخزون وتكاليف وتقارير، بلا معادلة إنتاج أو تكاثر جديدة. */
const FARM_BOSS={on:true,phase:3,fee:1200,wage:20,every:7,maxCap:40};
const farmBossOf=(S,city)=>S.player.props[city]?.farmBoss;
const farmFarmers=(S,city)=>staffOf(S,city).filter(w=>w.role==='farmer');
function farmUpQuote(S,city){
 const f=farmOf(S,city),c=S.cities[city];if(!f||!c)return {ok:false,msg:'لا مزرعة هنا.'};
 if(f.level>=FARM_MAXLV)return {ok:false,msg:'المزرعة في أعلى مستوى.'};
 const pr=S.player.props[city],T={...S,player:{...S.player,props:{...S.player.props,[city]:{...pr,farm:{...f,level:f.level+1}}}}};
 const capacity=farmCap(T,city),have=farmFarmers(S,city),need=Math.ceil(capacity/FARMER_UNITS),extra=Math.max(0,need-have.length),newWage=wkWage(S,c,{role:'farmer',days:0});
 const wages=have.reduce((n,w)=>n+wkWage(S,c,w),0)+extra*newWage+(FARM_BOSS.on&&pr.farmBoss?pr.farmBoss.wage:0),upkeep=FARM_UPKEEP*(f.level+1);
 return {ok:true,cost:Math.round(FARM_UP*f.level*foreignMul(S,c)),level:f.level+1,capacity,have:have.length,need,extra,wages,upkeep,daily:wages+upkeep,hireFees:extra*newWage*2};
}
function hireFarmBoss(S,city,cap){
 const pr=S.player.props[city],c=S.cities[city];
 if(!FARM_BOSS.on||S.phase<FARM_BOSS.phase||!pr?.farm||!c)return NO('تحتاج مزرعة في الطور 3.');
 if(pr.farmBoss)return NO('رئيس المزرعة موجود بالفعل.');
 if(!Number.isSafeInteger(cap)||cap<0||cap>FARM_BOSS.maxCap)return NO('اختر سقف عدد المزارعين من0 إلى40.');
 ctxFor(S,city);if(S.player.gold<FARM_BOSS.fee)return NO('تحتاج '+FARM_BOSS.fee+' لتوظيف رئيس المزرعة.');
 pPay(S,'staff',FARM_BOSS.fee,true);pr.farmBoss={wage:FARM_BOSS.wage,cap,hired:0,since:S.day,reports:[],late:0};
 farmBossWeek(S,city).expenses+=FARM_BOSS.fee;
 return OK('وُظّف رئيس المزرعة بأجر '+FARM_BOSS.wage+' يومياً وسقف '+cap+' مزارعين.');
}
function setFarmBossCap(S,city,cap){const m=farmBossOf(S,city);if(!FARM_BOSS.on||!m||!Number.isSafeInteger(cap)||cap<0||cap>FARM_BOSS.maxCap)return NO('راجع سقف عدد المزارعين.');m.cap=cap;return OK('حُفظ سقف العدد؛ لا يُسرّح المزارعون الموجودون.');}
function fireFarmBoss(S,city){const m=farmBossOf(S,city);if(!FARM_BOSS.on||!m)return NO('لا رئيس مزرعة هنا.');if((S.paymentDues||[]).some(d=>d.id===m.paymentDue&&d.amount>0))return NO('سدّد أجر الرئيس المتأخر أولاً.');delete S.player.props[city].farmBoss;return OK('أُوقف تكليف رئيس المزرعة؛ المزارعون والقطيع باقون.');}
function farmBossWeek(S,city){
 const m=FARM_BOSS.on&&farmBossOf(S,city);if(!m)return null;
 if(!m.week)m.week={from:S.day,days:0,born:0,products:{},revenue:0,cost:0,expenses:0,hired:0,moved:0};return m.week;
}
function farmBossCost(S,city,amount){const w=amount>0&&farmBossWeek(S,city);if(w)w.expenses+=amount;}
function farmBossBirths(S,city,n){const w=n>0&&farmBossWeek(S,city);if(w)w.born+=n;}
function farmBossProduct(S,city,g,n){const w=n>0&&farmBossWeek(S,city);if(w)w.products[g]=(w.products[g]||0)+n;}
function farmBossTrade(S,city,net,profit){const w=farmBossWeek(S,city);if(w){w.revenue+=net;w.cost+=Math.max(0,net-profit);}}
function farmBossBegin(S,city){
 if(!FARM_BOSS.on)return;const pr=S.player.props[city],m=pr?.farmBoss,c=S.cities[city];if(!m||!pr.farm||m.workDay===S.day)return;
 m.workDay=S.day;ctxFor(S,city);const w=farmBossWeek(S,city);w.days++;w.expenses+=m.wage;
 const paid=payObligation(S,'staff',m.wage,city,'farmBoss',m,'أجر رئيس المزرعة');m.paid=(m.paid||0)+paid;m.late=paid+1e-6<m.wage?(m.late||0)+1:0;
 if(!m.late){
  for(const g of Object.keys(BREED))if((pr.store[g]||0)>=1){const r=farmFromStore(S,city,g,Math.floor(pr.store[g]));if(r.ok)w.moved+=r.n;}
  let count=farmFarmers(S,city).length;
  while(count<farmerNeed(S,city)&&count<m.cap){if(hirePool(S,city)<1)break;const cash=S.player.gold,r=A.hireStaff(S,city,'farmer');if(!r.ok)break;w.expenses+=Math.max(0,cash-S.player.gold);m.hired++;w.hired++;const next=farmFarmers(S,city).length;if(next<=count)break;count=next;}
 }
 // تكلفة الأجر المستحق، بما فيها اليدوي، لا تُخفى كربح عند تأخر السداد.
 w.expenses+=farmFarmers(S,city).reduce((n,f)=>n+(f.free>S.day?0:wkWage(S,c,{...f,days:f.days+1})),0);
}
function farmBossEnd(S,city){
 const m=FARM_BOSS.on&&farmBossOf(S,city),f=farmOf(S,city),w=m?.week;if(!m||!f||!w||w.days<FARM_BOSS.every||m.reportDay===S.day)return;
 const r={...w,to:S.day,products:{...w.products},herd:{...f.herd},young:Object.values(f.hx||{}).reduce((n,x)=>n+(x.y||0),0),profit:w.revenue-w.cost-w.expenses};
 m.reports=[r,...(m.reports||[])].slice(0,8);m.reportDay=S.day;delete m.week;
 news(S,'مكتب '+S.cities[city].name+': تقرير رئيس المزرعة جاهز؛ مواليد '+r.born+'، ونفقات '+Math.round(r.expenses)+'، وصافي بيع مباشر '+Math.round(r.profit)+'.');
}
function farmBossMigrate(S){
 for(const pr of Object.values(S.player.props||{})){
  const m=pr.farmBoss;if(!m)continue;
  if(!pr.farm||!Number.isFinite(m.wage)||m.wage<=0||!Number.isSafeInteger(m.cap)||m.cap<0||m.cap>FARM_BOSS.maxCap){delete pr.farmBoss;continue;}
  if(!Number.isSafeInteger(m.hired)||m.hired<0)m.hired=0;
  const valid=w=>w&&Number.isFinite(w.from)&&w.from<=S.day&&['days','born','revenue','cost','expenses','hired','moved'].every(k=>Number.isFinite(w[k])&&w[k]>=0)&&w.products&&Object.entries(w.products).every(([g,n])=>Object.hasOwn(GD,g)&&Number.isFinite(n)&&n>=0);
  if(m.week&&!valid(m.week))delete m.week;
  m.reports=(Array.isArray(m.reports)?m.reports:[]).filter(r=>valid(r)&&Number.isFinite(r.to)&&r.to<=S.day&&Number.isFinite(r.profit)&&r.herd&&Object.entries(r.herd).every(([g,n])=>Object.hasOwn(BREED,g)&&Number.isFinite(n)&&n>=0)).slice(0,8);
 }
}
