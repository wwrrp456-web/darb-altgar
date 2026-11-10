/* أمين21: ترقية داخلية بعد خدمة ومراجعة؛ لا توكيل ضمني أو تعيين خارجي. */
const STEWARD = { phase:3, serviceDays:90, minAssets:3, reviewDays:10, span:6, raise:1.5, partial:true, spans:[6,10,16,40], raises:[1,1.4,1.9,2.6] };
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
 Object.assign(m,{rank:3,lv:2,managerDays:m.days,days:0,since:S.day,audit:S.day,wage:q.wage,span:q.span,policy:{pay:false,report:false,restock:false,pricing:false,rotate:false,sellStale:false,herd:false,minPrice:{sellStale:1,herd:1},limit:0,every:'daily'}});delete m.serviceDay;delete m.review;
 skPromoteSteward(m);
 return OK('رُقّي مديرك إلى أمين منطقة '+S.cities[city].name+' بأجر '+q.wage+' ريال يومياً، ونطاق '+q.span+' ممتلكات.');
}
const STEWARD_BASE_FLAGS=['pay','report','restock','pricing'];
/* الأمين المدبّر (017): ثلاث صلاحيات مطفأة افتراضياً؛ STEWARD_SMART.on=false يعيد السلوك القديم حرفياً. */
const STEWARD_SMART={on:true,idleShop:14,idleStore:30,rotateWeek:7,rotateMin:20,dayQty:40,minPct:[.5,5]};
const STEWARD_SMART_FLAGS=['rotate','sellStale','herd'];
const STEWARD_FLAGS=[...STEWARD_BASE_FLAGS,...STEWARD_SMART_FLAGS];
const stewardMinPct=(p,k)=>{const v=p?.minPrice?.[k];return Number.isFinite(v)&&v>=STEWARD_SMART.minPct[0]&&v<=STEWARD_SMART.minPct[1]?v:1;};
function stewardStats(S,city){const m=stewardOf(S,city);if(!m)return null;if(m.work?.day!==S.day)m.work={day:S.day,spent:0,paid:0,stock:0,prices:0,actions:0,rotated:0,sold:0,earned:0,herded:0,blocked:false};return m.work;}
function stewardRemaining(S,city){const m=stewardOf(S,city);return m?Math.max(0,(m.policy?.limit||0)-(m.work?.day===S.day?m.work.spent:0)):0;}
function stewardLog(S,city,body){const m=stewardOf(S,city);if(!m)return;const log=S.player.mgrActions||(S.player.mgrActions=[]);log.unshift({id:S.nextId++,d:S.day,city,steward:m.id,...body});if(log.length>30)log.length=30;const w=stewardStats(S,city);w.actions++;if(body.kind==='price')w.prices++;}
function stewardPays(S,city,cat,kind,target){const m=stewardOf(S,city);if(!m?.policy?.pay||!['rent','staff','wages'].includes(cat))return false;if(target&&!stewardPaymentScope(S,city,kind,target))return false;const car=mainCar(S);return S.player.props[city].wageMode==='steward'||car.city!==city||car.left>0;}
function setStewardPolicy(S,city,next){
 const m=stewardOf(S,city);if(!m)return NO('تحتاج أمين منطقة مُرقّى أولاً.');
 if(!next||!STEWARD_BASE_FLAGS.every(k=>typeof next[k]==='boolean')||!STEWARD_SMART_FLAGS.every(k=>next[k]===undefined||typeof next[k]==='boolean')||['sellStale','herd'].some(k=>next.minPrice?.[k]!==undefined&&!(Number.isFinite(next.minPrice[k])&&next.minPrice[k]>=STEWARD_SMART.minPct[0]&&next.minPrice[k]<=STEWARD_SMART.minPct[1]))||!Number.isFinite(next.limit)||next.limit<0||next.limit>1e9||!['daily','weekly','event'].includes(next.every))return NO('راجع الصلاحيات والحد اليومي.');
 if(next.limit+1e-6<(m.work?.day===S.day?m.work.spent:0))return NO('الحد الجديد أقل مما صُرف اليوم؛ يمكنك إيقاف الصلاحية مع إبقاء حد اليوم.');
 if((next.pay||next.restock)&&next.limit<=0)return NO('حدد حداً يومياً موجباً قبل تفويض السداد أو التعبئة.');
 m.policy=Object.fromEntries([...STEWARD_FLAGS.map(k=>[k,next[k]===true]),['minPrice',{sellStale:stewardMinPct(next,'sellStale'),herd:stewardMinPct(next,'herd')}],['limit',Math.round(next.limit*100)/100],['every',next.every]]);
 if(!STEWARD_SMART_FLAGS.some(k=>m.policy[k]))delete m.idle;
 if(!m.policy.pay&&S.player.props[city].wageMode==='steward')S.player.props[city].wageMode='manual';
 return OK('حُفظ تفويض الأمين وحدّه اليومي. إيقاف السداد المفوّض يترك الأجور يدوية حتى تختار طريقتها.');
}
function stewardDebit(S,city,cat,amount,label){
 const w=stewardStats(S,city);{const want=Math.min(amount,stewardRemaining(S,city));if(S.player.wallet.sar+1e-9<want)diwanCover(S,city,want-S.player.wallet.sar,cat);}
 const paid=Math.max(0,Math.min(amount,stewardRemaining(S,city),S.player.wallet.sar));
 if(paid>0){const context=S.ctxCur;S.ctxCur='sar';pPay(S,cat,paid,true);S.ctxCur=context;regionalPaymentRecord(S,city,cat,paid,'steward');w.spent+=paid;w.paid+=paid;stewardLog(S,city,{kind:'pay',amount:paid,why:label});}
 if(paid+1e-6<amount)w.blocked=true;
 return paid;
}
function stewardBegin(S){
 for(const [city,pr]of Object.entries(S.player.props)){
  const m=stewardOf(S,city);
  if(pr.wageMode==='steward'&&!m){pr.wageMode='auto';news(S,'لا أمين في '+S.cities[city].name+'؛ عادت الأجور إلى السداد التلقائي.');}
  if(!m)continue;stewardStats(S,city);stewardScopeWarning(S,city);if(m.handledDay===S.day)continue;m.handledDay=S.day;
  if(!stewardPays(S,city,'staff'))continue;
  for(const due of diwanOrder(S,(S.paymentDues||[]).filter(d=>d.city===city&&d.amount>0).slice())){
   const target=paymentTarget(S,due);if(target&&!stewardPaymentScope(S,city,due.kind,target))continue;if(due.kind==='staff'&&target?.role)workerPayDay(S,target);const paid=stewardDebit(S,city,due.cat,due.amount,'سداد متأخر: '+due.label);if(!(paid>0))break;
   if(target&&due.kind==='rent')target.rentPaid=(target.rentPaid||0)+paid;
   due.amount=Math.max(0,due.amount-paid);if(due.deferredWages)due.deferredWages=Math.max(0,due.deferredWages-paid);
   if(due.amount<1e-6){if(target){if(!due.unknownPast){if(due.kind==='rent')target.arrears=0;else if('late'in target)target.late=0;}delete target.paymentDue;}S.paymentDues=S.paymentDues.filter(d=>d!==due);}
  }
 }
}
function stewardEnd(S){
 for(const [city,pr]of Object.entries(S.player.props)){
  const m=stewardOf(S,city);if(!m||m.work?.day!==S.day||m.reportDay===S.day)continue;
  const said=stewardSmartDay(S,city);
  const w=m.work,due=(S.paymentDues||[]).filter(d=>d.city===city).reduce((n,d)=>n+d.amount,0);
  const report={day:S.day,paid:w.paid,stock:w.stock,prices:w.prices,spent:w.spent,remaining:stewardRemaining(S,city),cash:S.player.wallet.sar,due,blocked:w.blocked,rotated:w.rotated||0,sold:w.sold||0,earned:w.earned||0,herded:w.herded||0};m.reports=[report,...(m.reports||[])].slice(0,30);m.reportDay=S.day;
  if(m.policy?.report&&(m.policy.every==='daily'||m.policy.every==='weekly'&&S.day%7===0||w.blocked))news(S,'تقرير أمين '+S.cities[city].name+': سداد '+w.paid.toFixed(2)+'، تعبئة '+w.stock.toFixed(2)+' ريال'+(said.length?'؛ '+said.join('، '):'')+(w.blocked?'؛ يحتاج مراجعة السيولة أو الحد.':'.'),w.blocked?'bad':'');
 }
}
/* ---- الأمين المدبّر: تدوير الأصناف، بيع الراكد، الأنعام. كلها بآليات قائمة (sellUnits، farmFromStore) ولا مال من العدم. ---- */
const stewardShown=(pr,g)=>pr.shops.some(sh=>sh.items.some(it=>it.g===g));
function stewardNetUnit(S,c,pr,g){return unitPrice(c,g)*qualOf(pr.basis,g)*(1-taxRate(S,c,true));}
function stewardFloor(S,c,pr,g,pct){const cost=avgCost(pr.basis,g),ref=cost>0?cost:refPrice(c,g);return ref*pct;}
/* يبيع وحدة وحدة ما دام صافي سعر الوحدة (بعد الضريبة) لا ينزل عن الحد؛ يرجع عدد المباع وصافيه. */
function stewardSellSafe(S,city,pr,g,maxQty,pct){
 const c=S.cities[city],floor=stewardFloor(S,c,pr,g,pct);let n=0,net=0;
 pr.basis=pr.basis||{};
 while(n<maxQty&&Math.floor(pr.store[g]||0)>=1&&stewardNetUnit(S,c,pr,g)+1e-9>=floor){
  const ql=qualOf(pr.basis,g),basis=avgCost(pr.basis,g)||0,r=sellUnits(S,S.player,c,g,1,pr.store,true,ql,'trade',basis);if(!r.n)break;
  const cost=takeBasis(pr.basis,g,r.n);logTrade(S,city,g,r.n,'sell',r.net,r.net-cost,'trade');n+=r.n;net+=r.net;
 }
 return {n,net};
}
function stewardFactoryGoods(S,city){const set=new Set();for(const f of S.player.factories.filter(f=>f.city===city)){const rc=RECIPES[f.recipe];if(!rc)continue;set.add(rc.out);for(const g of MFG_IN[rc.out]||[])set.add(g);for(const g of Object.keys(rc.in||{}))set.add(g);}return set;}
function stewardRotate(S,city,pr,m,w,said,legacy){
 if(sbOn('trial')&&!legacy)return sbRotate(S,city,pr,m,w,said); // 035ب: تجربة رف واحد بالدرجة والوضع والموسم؛ legacy: تفويض صريح (تعبئة الديوان عند امتلاء المخزن) يبقى كما كان
 const c=S.cities[city];
 for(const sh of pr.shops){
  if(!stewardCovers(S,city,{kind:'shop',id:sh.id}))continue;
  if(Number.isSafeInteger(sh.rotatedDay)&&S.day-sh.rotatedDay<sbRotateGap(m))continue;
  const old=sh.items.find(it=>(it.idleDays||0)>=sbIdleShop(m));if(!old)continue;
  const pool=GIDS.filter(g=>g!==old.g&&Object.hasOwn(pr.store,g)&&(pr.store[g]||0)>=STEWARD_SMART.rotateMin&&!stewardShown(pr,g)&&sells(c,g)&&!GD[g].sp&&!GD[g].live&&!Object.hasOwn(BREED,g));
  if(!pool.length)continue;
  const g=pool.sort((a,b)=>c.dem[b]*unitPrice(c,b)-c.dem[a]*unitPrice(c,a)||GIDS.indexOf(a)-GIDS.indexOf(b))[0],i=sh.items.indexOf(old);
  sh.items.splice(i,1);const r=A.shopSetItem(S,city,sh.id,g,SHOP_PRICE0,true);
  if(!r.ok){sh.items.splice(i,0,old);continue;}
  sh.rotatedDay=S.day;w.rotated++;said.push('دوّرتُ '+GD[old.g].name+' بـ'+GD[g].name);
  stewardLog(S,city,{kind:'rotate',amount:0,g,from:old.g,why:'دوّرتُ '+GD[old.g].name+' (لم يُبع '+old.idleDays+' يوماً) بـ'+GD[g].name});
 }
}
function stewardSellStale(S,city,pr,m,w,said,left){
 const pct=stewardMinPct(m.policy,'sellStale'),skip=stewardFactoryGoods(S,city);
 // 022: سلع الحاجة وقت ضيق المدينة تُطرح أولاً، ولا يُشترط لها طول الركود (لا يحتكر الأمين بنفسه)
 const tight=new Set(GIDS.filter(g=>{const s=hdOn(S)?hdState(S,city,g):null;return s&&s.short&&s.held>=1;}));
 for(const g of [...tight,...GIDS.filter(x=>!tight.has(x))]){
  if(left.q<1)break;const e=m.idle?.[g],need=tight.has(g);
  if(!need&&(!e||S.day-e.since<sbIdleStore(m))||Object.hasOwn(BREED,g)||skip.has(g)||stewardShown(pr,g)||Math.floor(pr.store[g]||0)<1)continue;
  const r=stewardSellSafe(S,city,pr,g,left.q,pct);if(r.n<1)continue;
  left.q-=r.n;w.sold+=r.n;w.earned+=r.net;said.push('بعتُ '+r.n+' '+GD[g].name+' راكداً');
  stewardLog(S,city,{kind:'sell',amount:r.net,g,quantity:r.n,why:'بعتُ '+r.n+' '+GD[g].name+' راكداً في المخزن'});
 }
}
function stewardHerd(S,city,pr,m,w,said,left){
 const pct=stewardMinPct(m.policy,'herd');
 for(const g of Object.keys(BREED)){
  let have=Math.floor(pr.store[g]||0);if(have<1)continue;
  if(FARM_MANAGE.on&&farmOf(S,city)){const r=farmFromStore(S,city,g,have);if(r.ok&&r.n>0){w.herded+=r.n;said.push('أدخلتُ '+r.n+' '+GD[g].name+' المزرعة');stewardLog(S,city,{kind:'herd',amount:0,g,quantity:r.n,why:'أدخلتُ '+r.n+' '+GD[g].name+' من المخزن إلى المزرعة'});have=Math.floor(pr.store[g]||0);}}
  if(have<1||left.q<1)continue;
  const r=stewardSellSafe(S,city,pr,g,Math.min(have,left.q),pct);if(r.n<1)continue;
  left.q-=r.n;w.sold+=r.n;w.earned+=r.net;said.push('بعتُ '+r.n+' '+GD[g].name+' من المخزن');
  stewardLog(S,city,{kind:'sell',amount:r.net,g,quantity:r.n,why:'بعتُ '+r.n+' '+GD[g].name+' أنعاماً لا مكان لها في المزرعة'});
 }
}
function stewardSmartDay(S,city){
 const m=stewardOf(S,city),pr=S.player.props[city];
 if(!STEWARD_SMART.on||!m||!pr||!m.policy)return [];
 const p=m.policy,smart=STEWARD_SMART_FLAGS.some(k=>p[k])||sbOn('trial');
 if(!smart){delete m.idle;return [];}
 if(m.smartDay===S.day)return [];m.smartDay=S.day;
 const w=stewardStats(S,city),said=[];
 if(!mgrOk(S,city,pr)){w.blocked=true;return said;}
 ctxFor(S,city);
 if(p.sellStale){const idle=m.idle||(m.idle={});for(const g of GIDS){const q=pr.store[g]||0;if(q<1){delete idle[g];continue;}const e=idle[g];if(!e||Math.abs(e.q-q)>1e-6)idle[g]={q,since:S.day};}}
 else delete m.idle;
 const left={q:sbDayQty(m)};
 if(p.rotate||sbOn('trial'))stewardRotate(S,city,pr,m,w,said);
 if(p.herd)stewardHerd(S,city,pr,m,w,said,left);
 if(p.sellStale)stewardSellStale(S,city,pr,m,w,said,left);
 if(p.sellStale&&m.idle)for(const g of Object.keys(m.idle)){const q=pr.store[g]||0;if(q<1)delete m.idle[g];else if(Math.abs(m.idle[g].q-q)>1e-6)m.idle[g]={q,since:S.day};}
 return said;
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
 m.policy={...Object.fromEntries(STEWARD_FLAGS.map(k=>[k,valid&&p[k]===true&&(!['pay','restock'].includes(k)||p.limit>0)])),minPrice:{sellStale:stewardMinPct(p,'sellStale'),herd:stewardMinPct(p,'herd')},limit:valid?p.limit:0,every:['daily','weekly','event'].includes(p.every)?p.every:'daily'};
 if(m.work&&(!Number.isSafeInteger(m.work.day)||m.work.day>S.day||!['spent','paid','stock','prices','actions'].every(k=>Number.isFinite(m.work[k])&&m.work[k]>=0)||m.work.spent+1e-6<m.work.paid+m.work.stock)){delete m.work;m.policy.pay=false;m.policy.restock=false;}
 if(m.idle&&(typeof m.idle!=='object'||Array.isArray(m.idle)||!STEWARD_SMART_FLAGS.some(k=>m.policy[k])))delete m.idle;
 if(m.idle)for(const g of Object.keys(m.idle)){const e=m.idle[g];if(!GD[g]||!e||!Number.isFinite(e.q)||e.q<0||!Number.isSafeInteger(e.since)||e.since>S.day)delete m.idle[g];}
 if(m.work)for(const k of ['rotated','sold','earned','herded'])if(!Number.isFinite(m.work[k])||m.work[k]<0)m.work[k]=0;
 m.reports=(Array.isArray(m.reports)?m.reports:[]).filter(r=>r&&Number.isSafeInteger(r.day)&&r.day<=S.day&&['paid','stock','prices','spent','remaining','cash','due'].every(k=>Number.isFinite(r[k])&&r[k]>=0)).slice(0,30);
}

const stewardTier = m => Number.isInteger(m?.spanTier) && m.spanTier >= 0 && m.spanTier < STEWARD.spans.length ? m.spanTier : 0;
const stewardSpan = m => STEWARD.partial ? STEWARD.spans[stewardTier(m)] : STEWARD.span;
const assetKey = a => a.kind + ':' + a.id;
function stewardOrderedAssets(S, city) {
 const all=teamAssets(S,city),order=S.player.props[city]?.assetOrder||[];
 return order.map(k=>all.find(a=>assetKey(a)===k)).filter(Boolean).concat(all.filter(a=>!order.includes(assetKey(a))));
}
function stewardRememberAssets(S, city, before) {
 const pr=S.player.props[city];if(!pr)return;
 const all=teamAssets(S,city).map(assetKey),old=before||pr.assetOrder||all;
 pr.assetOrder=old.filter(k=>all.includes(k)).concat(all.filter(k=>!old.includes(k)));
}
function stewardCovers(S,city,asset) {
 const m=stewardOf(S,city);if(!m)return false;
 if(!STEWARD.partial)return teamAssets(S,city).length<=STEWARD.span;
 const selected=stewardOrderedAssets(S,city).slice(0,stewardSpan(m));
 return asset?selected.some(a=>a.kind===asset.kind&&a.id===asset.id):selected.length>0;
}
function stewardPaymentScope(S,city,kind,target) {
 if(!STEWARD.partial)return true;
 if(kind==='farmBoss')return stewardCovers(S,city,{kind:'farm',id:0});
 if(kind==='factory')return stewardCovers(S,city,{kind:'factory',id:target.id});
 if(kind==='rent')return stewardCovers(S,city,{kind:'shop',id:target.id});
 if(kind==='staff'&&target?.role){const kinds=target.role==='keeper'?['warehouse']:target.role==='farmer'?['farm']:['shop'];return stewardOrderedAssets(S,city).slice(0,stewardSpan(stewardOf(S,city))).some(a=>kinds.includes(a.kind));}
 return true;
}
function stewardSpanQuote(S, city, direction) {
 const m=stewardOf(S,city),tier=stewardTier(m),next=tier+direction;
 if(!STEWARD.partial||!m||![1,-1].includes(direction)||next<0||next>=STEWARD.spans.length)return {ok:false,msg:'لا تغيير متاح لنطاق الأمين.'};
 return {ok:true,tier:next,span:STEWARD.spans[next],wage:managerWage({...m,spanTier:next}),oldWage:managerWage(m)};
}
function stewardSpanChange(S,city,direction){const q=stewardSpanQuote(S,city,direction);if(!q.ok)return NO(q.msg);stewardOf(S,city).spanTier=q.tier;return OK('صار نطاق الأمين '+q.span+' ممتلكات، بأجر '+q.wage+' يومياً.');}
function stewardScopeWarning(S,city){
 const m=stewardOf(S,city);if(!STEWARD.partial||!m||teamAssets(S,city).length<=stewardSpan(m))return;
 stewardStats(S,city).blocked=true;
 if(Number.isInteger(m.scopeWarnDay)&&S.day-m.scopeWarnDay<7)return;
 m.scopeWarnDay=S.day;news(S,'مكتب '+S.cities[city].name+': أمينك يدير أقدم '+stewardSpan(m)+' ممتلكات؛ وسّع نطاقه ليشمل البقية.','bad');
}
