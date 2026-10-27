/* فرص24: ثمن مغلق ونافذة3–7أيام، وتنفيذ ذري دون منح نقد مؤقت. */
const VAULT_OPP_KINDS = ['goods','shop','warehouse','partnership'];
/* قرار المالك: عمّ سالم لا يعرض إلا صفقة حقيقية يُجنى ربحها فوراً في نقد اللاعب. فالدكان والمخزن والشراكة (ربحها ورقي لا يتحقق إلا ببيع الأصل أو بعد مدة) لم تعد تُعرض، وتبقى مدعومة للعروض القديمة المعلّقة فقط. */
const VAULT_OPP_OFFER = ['goods'];
const vaultRound = n => Math.round(n*100)/100;
function vaultOppBudget(S) {
 const ex=S.learn?.ex||{},L=S.player.led;
 return Math.max(0,250+.1*Math.max(0,(L.inc.realized||0)-(L.exp.realizedLoss||0))-(ex.vaultUsedBonus||0));
}
function vaultOppReturn(S,o) {
 if(o.kind==='goods'){
  const c=S.cities[o.city],shadow={...S,cities:{...S.cities,[o.city]:{...c,stock:{...c.stock,[o.g]:c.stock[o.g]-o.qty}}}};
  return quoteSell(shadow,o.city,o.g,o.qty,1,null,'trade',o.cost/o.qty).net;
 }
 if(o.kind==='partnership')return o.stake*(1-FIN.mud.fee);
 const distressed=bankDebt(S)>0||famDebtOn(S)||(S.paymentDues||[]).some(d=>d.amount>0);
 return (o.kind==='shop'?1000:800)*o.qty*ASSET_SALE_FACTORS[distressed?'distressed':'calm'];
}
function vaultOppBonus(S,o,expected) {
 const capital=o.kind==='goods'?mid(o.g)*o.qty:o.kind==='partnership'?o.stake:(o.kind==='shop'?1000:800)*o.qty;
 return Math.max(0,capital-o.cost,expected-o.cost);
}
function vaultOppCopy(S){const T=JSON.parse(save(S));attachWallet(T);return T;}
function vaultOpportunityCandidate(S,kind){return vaultOpportunityCandidateRead(vaultOppCopy(S),kind);}
function vaultOpportunityCandidateRead(S,kind) {
 const L=S.learn,P=S.player,car=mainCar(S);if(!L?.char||taught(L)<4||car.left>0||S.life?.pending||S.road||!VAULT_OPP_OFFER.includes(kind))return null;
 const cash=Math.max(0,P.wallet.sar),all=Math.max(cash,liquid(S)),vault=P.vault||0,budget=vaultOppBudget(S);
 const high=vault>0?Math.min(cash+vault,all*2):cash*.35;
 const low=vault>0?all+.01:1;if(high<low||budget<1)return null;
 const target=Math.min(high,Math.max(low,all*(vault>0?1.3:.15)));
 const create=body=>{
  const o={id:S.nextId,created:S.day,expires:S.day+3+Math.floor(roll(S,41)*5),...body};
  o.cost=vaultRound(o.cost);if(!vaultMoney(o.cost)||o.cost<low||o.cost>high)return null;
  const expected=vaultOppReturn(S,o),rate=expected/o.cost-1,bonus=vaultOppBonus(S,o,expected);
  if(!Number.isFinite(expected)||rate<.15-1e-7||rate>.25+1e-7||bonus>budget+1e-7)return null;
  return {...o,estimated:expected,bonus};
 };
 if(kind==='goods'){
  const c=S.cities[car.city],goods=GIDS.filter(g=>!GD[g].live&&sells(c,g)&&c.stock[g]>=1);
  const offset=Math.floor(roll(S,42)*goods.length);
  for(let i=0;i<goods.length;i++){
   const g=goods[(offset+i)%goods.length],room=Math.floor((capOfCar(car)-loadOf(car))/GD[g].w),quota=quotaOn(S,c,g)?Math.floor(quotaLeft(S,c)):Infinity;
   const max=Math.min(1000,room,quota,Math.floor(c.stock[g]*.5));if(max<1)continue;
   for(const discount of [.25,.275,.30,.325,.35]){
    const unit=refPrice(c,g)*(1-discount),qty=Math.min(max,Math.floor(high/unit),Math.max(1,Math.ceil(target/unit)));
    if(qty<1)continue;const o=create({kind,city:car.city,g,qty,cost:unit*qty,reference:refPrice(c,g),discount});if(o)return o;
   }
  }return null;
 }
 for(const city of Object.keys(P.props)){
  const pr=P.props[city];if(!hasPresence(S,city)||!pr.shops.length)continue;
  if(kind==='partnership'){
   if(S.phase<4||(bossOf(S,city)?.trust||0)<30)continue;
   const cost=vaultRound(Math.min(target,budget/(1.2/(1-FIN.mud.fee)-1))),o=create({kind,city,qty:1,cost,stake:cost*1.2/(1-FIN.mud.fee)});if(o)return o;
  }else{
   if(S.phase<2)continue;
   const max=kind==='shop'?shopLimit(S.cities[city])-pr.shops.length:pr.shops.length-pr.whs;
   const value=kind==='shop'?1000:800,distressed=bankDebt(S)>0||famDebtOn(S)||(S.paymentDues||[]).some(d=>d.amount>0),unit=value*ASSET_SALE_FACTORS[distressed?'distressed':'calm']/1.2;
   const qty=Math.min(max,Math.floor(high/unit),Math.max(1,Math.ceil(target/unit)));
   if(qty<1)continue;const o=create({kind,city,qty,cost:unit*qty,reference:value});if(o)return o;
  }
 }return null;
}
function vaultOpportunityQuote(S,id){if(S.learn?.ex?.vaultOffer?.status!=='pending')return {ok:false,msg:'لا فرصة مفتوحة بهذا الرقم'};return vaultOpportunityQuoteRead(vaultOppCopy(S),id);}
function vaultOpportunityQuoteRead(S,id) {
 const o=S.learn?.ex?.vaultOffer,fail=msg=>({ok:false,msg});
 if(!o||o.status!=='pending'||id!=null&&o.id!==id)return fail('لا فرصة مفتوحة بهذا الرقم');
 if(S.day>o.expires)return fail('انتهت مهلة الفرصة');
 const P=S.player,car=mainCar(S),c=S.cities[o.city];
 if(!S.learn.char||taught(S.learn)<4||car.left>0||S.road||S.life?.pending)return fail('أكمل الرحلة أو الحدث الحالي أولاً');
 if(!c||!VAULT_OPP_KINDS.includes(o.kind)||!Number.isSafeInteger(o.qty)||o.qty<1||!vaultMoney(o.cost)||o.cost<=0)return fail('بيانات الفرصة غير صالحة');
 if(o.kind==='goods'){
  if(!GD[o.g]||GD[o.g].live||car.city!==o.city||!sells(c,o.g))return fail('هذه الصفقة مرتبطة بسوقها الأصلي');
  if(c.stock[o.g]<o.qty||capOfCar(car)-loadOf(car)<o.qty*GD[o.g].w)return fail('تغيّر المتوفر أو سعة القافلة');
  if(quotaOn(S,c,o.g)&&quotaLeft(S,c)<o.qty)return fail('حصتك الحالية لا تكفي لهذه الكمية');
 }else{
  const pr=P.props[o.city];if(!pr?.shops.length||!hasPresence(S,o.city))return fail('تحتاج موطئ قدم في سوق الفرصة');
  if(o.kind==='partnership'){
   if(S.phase<4||(bossOf(S,o.city)?.trust||0)<30||!vaultMoney(o.stake)||o.stake<=o.cost)return fail('الشراكة تحتاج الطور4وثقة30');
  }else if(S.phase<2||(o.kind==='shop'?pr.shops.length+o.qty>shopLimit(c):pr.whs+o.qty>pr.shops.length))return fail('لا سعة عقارية متاحة لهذه الفرصة');
 }
 const estimated=vaultOppReturn(S,o),rate=estimated/o.cost-1,bonus=vaultOppBonus(S,o,estimated);
 if(!Number.isFinite(estimated)||rate<.15-1e-7||rate>.25+1e-7||bonus>vaultOppBudget(S)+1e-7)return fail('تغيّر تقييم الفرصة؛ راجع السوق قبل الشراء');
 const cash=P.wallet.sar,missing=Math.max(0,o.cost-cash),balance=P.vault||0;
 if(!Number.isFinite(cash)||!vaultMoney(balance)||missing>balance+1e-8)return fail('المحفظة والحصالة لا تكفيان للثمن');
 return {ok:true,offer:{...o},cost:o.cost,cash,balance,missing,estimated,profit:estimated-o.cost,bonus,days:o.expires-S.day,first:!(S.learn.ex.vaultOpp>0)};
}
function vaultOpportunityDay(S) {
 const L=S.learn;if(!L?.char||taught(L)<4)return;
 L.ex=L.ex||{broker:-99,friend:-99,luck:-99};const old=L.ex.vaultOffer;
 if(old?.status==='pending'&&S.day>old.expires){old.status='expired';L.eq=(L.eq||[]).filter(e=>e.offerId!==old.id);news(S,'انتهت مهلة الفرصة التجارية؛ رصيد الحصالة محفوظ.');}
 if(L.eq?.length||old?.status==='pending'||S.noEvents||S.awaySim)return;
 const last=Number.isFinite(L.ex.luck)?L.ex.luck:-99,gap=45+Math.floor(roll(S,40)*46);if(S.day-last<gap)return;
 const offset=Math.floor(roll(S,43)*VAULT_OPP_OFFER.length);
 for(let i=0;i<VAULT_OPP_OFFER.length;i++){
  const o=vaultOpportunityCandidate(S,VAULT_OPP_OFFER[(offset+i)%VAULT_OPP_OFFER.length]);if(!o)continue;
  o.id=S.nextId++;o.status='pending';L.ex.vaultOffer=o;L.ex.luck=S.day;L.eq=L.eq||[];L.eq.push({id:'luck',offerId:o.id,day:S.day});S.pause=true;return;
 }
}
function vaultOpportunityBuy(S,id,useVault=false) {
 const q=vaultOpportunityQuote(S,id);if(!q.ok)return NO(q.msg);
 if(q.missing>0&&!useVault)return NO('ينقصك '+fmtN(q.missing)+' ريال؛ افتح الحصالة لتمويل الفرصة');
 const T=JSON.parse(save(S));attachWallet(T);const P=T.player,o=q.offer,car=mainCar(T),c=T.cities[o.city];
 if(q.missing>0){const r=vaultDraw(T,q.missing,'opportunity');if(!r.ok)return r;}
 P.wallet.sar-=q.cost;
 let soldNow=null;
 if(o.kind==='goods'){
  c.stock[o.g]-=o.qty;car.cargo[o.g]=(car.cargo[o.g]||0)+o.qty;addBasis(car.basis,o.g,o.qty,q.cost);P.led.exp.purchases=(P.led.exp.purchases||0)+q.cost;
  if(quotaOn(T,c,o.g)){quotaLeft(T,c);P.quota[c.id].v-=o.qty;}
  /* البيع الفوري في السوق نفسه: الربح يدخل نقدك ويمكنك استعماله، ثم يعود ما سُحب من الحصّالة إليها */
  soldNow=A.sell(T,car.id,o.g,o.qty);if(!soldNow||soldNow.ok===false)return NO('تعذّر بيع الصفقة فوراً؛ لم يتغير شيء');
  if(q.missing>0){const back=Math.min(q.missing,Math.max(0,P.wallet.sar));P.wallet.sar-=back;P.vault=vaultRound((P.vault||0)+back);}
 }else if(o.kind==='partnership')P.bank.dep[o.city]=(P.bank.dep[o.city]||0)+o.stake;
 else{
  const pr=P.props[o.city];for(let i=0;i<o.qty;i++){if(o.kind==='shop'){pr.shops.push({id:T.nextId++,items:[],kind:'own'});welcomeCrew(T,pr,SELLER_PTS,0);}else{pr.whs++;welcomeCrew(T,pr,0,1);}}
  P.led.exp.assets=(P.led.exp.assets||0)+q.cost;
  learnEvent(T,o.kind==='shop'?'buildShop':'buildWarehouse',[o.city],{ok:true});
 }
 const L=T.learn;L.ex.vaultUsedBonus=(L.ex.vaultUsedBonus||0)+q.bonus;L.ex.vaultOffer.status='purchased';L.ex.vaultOfferHistory=[{id:o.id,kind:o.kind,day:T.day,cost:q.cost,withdrawn:q.missing,estimated:q.estimated,bonus:q.bonus},...(L.ex.vaultOfferHistory||[])].slice(0,20);
 L.ev.luckGot=(L.ev.luckGot||0)+1;if(q.missing>0)L.ex.vaultOpp=(L.ex.vaultOpp||0)+1;L.eq=L.eq.filter(e=>e.offerId!==o.id);snapshotKnown(T,[o.city]);learnCheck(T);
 if(!Number.isFinite(P.wallet.sar)||P.wallet.sar<-.000001)return NO('تعذر إتمام التمويل');
 T.ctxCur=S.ctxCur;Object.assign(S,T);attachWallet(S);
 return {ok:true,msg:soldNow?'اغتنمت الفرصة وبعتَ فوراً: ربحك '+fmtN(Math.round(q.estimated-q.cost))+' ريال صار في نقدك، ورصيد حصّالتك '+fmtN(S.player.vault||0)+' ريال.':'اغتنمت الفرصة؛ رصيد الحصالة '+fmtN(S.player.vault||0)+' ريال، والخطة مستمرة.',withdrawn:q.missing,cost:q.cost,kind:o.kind,sold:!!soldNow};
}
function vaultOpportunityChoice(S,ch) {
 const ev=S.learn.eq[0],o=S.learn.ex?.vaultOffer;if(!ev||!o||ev.offerId!==o.id)return NO('لا فرصة مفتوحة');
 if(ch==='yes')return vaultOpportunityBuy(S,o.id,false);
 S.learn.eq.shift();if(ch!=='later')o.status='declined';return OK(ch==='later'?'الفرصة محفوظة في التنبيهات حتى انتهاء مهلتها.':'تركت الفرصة؛ لا يتغير رصيد حصالتك.');
}
