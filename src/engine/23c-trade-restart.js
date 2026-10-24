/* بداية اختيارية للتجارة، لا لعبة جديدة: كل التصفية في نسخة قبل اعتمادها. */
function prepareTradeRestart(S) {
 const no=msg=>({quote:NO(msg)}),P=S.player,main=P.caravans.find(c=>c.main)||P.caravans[0];
 if(!main||!S.cities[main.city])return no('لا قافلة رئيسية صالحة لإعادة البداية.');
 if(P.caravans.some(c=>c.left>0||c.sea)||(P.ships||[]).some(s=>!s.city))return no('انتظر وصول كل القوافل والسفن قبل التصفية الشاملة.');
 if(S.awayJob||S.awaySim||S.road||S.life?.pending||S.story?.cur)return no('أكمل الحدث أو حساب الغياب قبل التصفية الشاملة.');
 if((S.orders||[]).length)return no('أكمل عقود التوصيل قبل التصفية الشاملة.');
 if(P.bank.bonds.length)return no('انتظر استحقاق الصكوك؛ لا يوجد لها بيع مبكر في نظام اللعبة.');
 if(Object.values(S.cities).some(c=>c.owner==='player'||bossOf(S,c.id)?.ruler==='player'))return no('ملكية المدن وحكم الأسواق غير قابلين للتصفية هنا؛ لا تتغير ملكيتهما.');
 const dues=S.paymentDues||[];
 if(dues.some(d=>!Number.isFinite(d.amount)||d.amount<0||d.unknownPast||!PAYMENT_CATS.includes(d.cat)||!['caravan','ship',...CITY_DUE_KINDS].includes(d.kind)))return no('المستحقات غير مقيدة بالكامل: للتأكد قبل التصفية الشاملة.');
 const fleet=[...P.caravans,...(P.ships||[])];
 if(fleet.some(c=>(c.late||c.arrears)&&!dues.some(d=>d.id===c.paymentDue)))return no('متأخر قديم للطاقم غير مقيد: للتأكد قبل التصفية الشاملة.');
 if(!Object.values(P.wallet).every(n=>Number.isFinite(n)&&n>=0)||!Object.values(P.bank.dep).every(n=>Number.isFinite(n)&&n>=0))return no('رصيد غير صالح؛ راجع بيانات الحفظ قبل التصفية.');
 if(P.factories.some(f=>!P.props[f.city]))return no('بيانات مدينة المصنع ناقصة؛ للتأكد قبل التصفية.');
 const validStock=st=>Object.entries(st||{}).every(([g,n])=>GD[g]&&Number.isFinite(n)&&n>=0);
 for(const c of P.caravans)if(!S.cities[c.city]||!validStock(c.cargo)||!validStock(c.herd))return no('بيانات حمولة قافلة غير صالحة؛ راجع الحفظ.');
 for(const [city,pr]of Object.entries(P.props))if(!S.cities[city]||!validStock(pr.store))return no('بيانات مخزون مدينة غير صالحة؛ راجع الحفظ.');
 const debt=bankDebt(S)>0||famDebtOn(S)||dues.some(d=>d.amount>0),stranded=P.gold<=150&&valueOf(holdings(main))<1&&passivePerDay(S)<=0;
 const factor=ASSET_SALE_FACTORS[debt||stranded?'distressed':'calm'],start=P.wallet.sar;
 const T=JSON.parse(save(S));attachWallet(T);T.ctxCur='sar';
 const bridge=dues.reduce((n,d)=>n+d.amount,0);if(!Number.isFinite(bridge))return no('تعذر جمع المستحقات.');
 let reserveId='restartSettlement';while(T.player.bank.loans.some(l=>l.id===reserveId))reserveId+='-';
 // يقابل الاحتياطي التزام مساوٍ داخل النسخة فقط؛ تبقى الثروة والضريبة كما هما.
 if(bridge>0){T.player.wallet.sar+=bridge;T.player.bank.loans.push({id:reserveId,amt:bridge,type:'assetSettlementReserve'});}
 const items=[],goods=[],livestock=[];let assetProceeds=0,duesPaid=0,investmentReturn=0,investmentFees=0;
 for(const city of Object.keys(T.player.props))for(const entry of citySaleTargets(T,city)){
  const q=assetBaseQuote(T,city,entry.kind,entry.id,factor);if(!q.ok)return no(S.cities[city].name+': '+q.msg);
  q.livestockMode='sell';const office=entry.kind==='close'&&!!(T.player.props[city].mgr||T.player.props[city].ins),r=assetSaleApply(T,q);if(!r.ok)return no(S.cities[city].name+': '+r.msg);
  assetProceeds+=r.propertyPrice;duesPaid+=r.duesPaid;
  goods.push(...r.goods.map(g=>({...g,city})));livestock.push(...r.livestock.map(g=>({...g,city})));
  if(entry.kind!=='close'||r.goods.length||r.duesPaid||r.staffFired.length||office)items.push({...entry,city,price:r.propertyPrice,duesPaid:r.duesPaid});
 }
 for(const car of T.player.caravans){
  const c=T.cities[car.city];
  for(const [g,n]of Object.entries(car.cargo))if(n>0)goods.push({...assetStockFraction(T,c,{store:car.cargo,basis:car.basis},g,n),city:car.city,carId:car.id});
  const animals=assetFarmAnimals(T,{city:car.city,livestockMode:'sell'},car,{basis:car.basis});if(!animals.ok)return no(animals.msg);
  livestock.push(...animals.livestock.map(g=>({...g,city:car.city,carId:car.id})));
  car.cargo={};car.herd={};car.basis={};car.hx={};car.cx={};car.pair={};car.route=null;
  if(car.id!==main.id){
   // قيمة العربة الحالية300فيnetWorth؛ رسوم تعيين العامل والحارس ليست أصلاً يباع.
   let price=Math.floor(car.carts*300*factor),mountPrice=0;
   if(car.mount){const mount=mountOf(car);if(!mount)return no('نوع مركب غير معروف؛ للتأكد قبل التصفية.');mountPrice=Math.round(mount.cost*.6);}
   price+=mountPrice;T.player.wallet.sar+=price;assetProceeds+=price;T.player.led.inc.assets=(T.player.led.inc.assets||0)+price;fauc(T,'assetSale',price);
   items.push({kind:'caravan',id:car.id,city:car.city,name:car.name,price,mountPrice,duesPaid:0});
  }
 }
 for(const sh of T.player.ships||[]){
  const type=SHIPS[sh.type];if(!type||!T.cities[sh.city])return no('بيانات سفينة غير صالحة؛ للتأكد قبل التصفية.');
  const price=Math.round(type.cost*SEA.sellBack);T.player.wallet.sar+=price;assetProceeds+=price;T.player.led.inc.assets=(T.player.led.inc.assets||0)+price;fauc(T,'assetSale',price);
  items.push({kind:'ship',id:sh.id,city:sh.city,name:sh.name,price,duesPaid:0});
 }
 for(const [city,amount]of Object.entries(T.player.bank.dep))if(amount>0){
  if(!T.cities[city])return no('مدينة مضاربة غير معروفة؛ للتأكد قبل التصفية.');
  const r=A.divest(T,city,amount);if(!r.ok)return no(r.msg);
  const fee=amount*FIN.mud.fee,net=amount-fee;investmentReturn+=net;investmentFees+=fee;items.push({kind:'investment',city,name:'سحب المضاربة',price:net,fee});
 }
 // يشمل أيضاً مطالبات موظف أو طاقم غادر سابقاً؛ لا تسقط بالتصفية.
 for(const due of T.paymentDues||[]){
  const paid=pPay(T,due.cat,due.amount,true);duesPaid+=paid;if(paid+1e-7<due.amount)return no('الحصيلة لا تكفي لكل المستحقات؛ لا يُباع أي أصل.');
 }
 if(bridge>0){T.player.wallet.sar-=bridge;T.player.bank.loans=T.player.bank.loans.filter(l=>l.id!==reserveId);}
 const cash=T.player.wallet.sar;
 if(![cash,assetProceeds,duesPaid,investmentReturn,investmentFees].every(Number.isFinite)||cash < -1e-7)return no('الحصيلة ورصيد الريال لا يكفيان للمستحقات؛ لا يُباع أي أصل.');
 if(!items.length&&!goods.length&&!livestock.length&&!duesPaid&&S.phase===1)return no('لا أصول تحتاج تصفية أو طور يحتاج إعادة بداية.');
 T.player.wallet.sar=Math.max(0,cash);T.paymentDues=[];
 const kept=T.player.caravans.find(c=>c.id===main.id);kept.main=true;kept.late=0;kept.arrears=0;delete kept.paymentDue;
 T.player.caravans=[kept];T.player.ships=[];T.captainAuto=false;delete T.away;
 T.phase=1;T.pause=true;
 const net=T.player.wallet.sar-start,goodsNet=net+duesPaid-assetProceeds-investmentReturn;
 const history=T.player.sold||(T.player.sold=[]);history.unshift({day:S.day,kind:'restart',label:'تصفية وبداية جديدة',propertyPrice:assetProceeds,goodsNet,duesPaid,net,itemCount:items.length});history.length=Math.min(30,history.length);
 const quote={ok:true,kind:'restart',factor,items,goods,livestock,assetProceeds,goodsNet,investmentReturn,investmentFees,duesPaid,net,cashAfter:T.player.wallet.sar,phaseAfter:1,
  retained:{carId:main.id,city:main.city,wallet:{...T.player.wallet},vault:T.player.vault||0,loans:bankDebt(T),familyDebt:T.player.famDebt?.left||0},
  note:'تبقى القافلة الرئيسية وتجهيزاتها ومؤنها والشخصية والتعليم والإنجازات والعمر والديون والحصّالة. لا منحة نقدية ولا إعادة مكافآت. تعود الأطوار المالية وفق حدود الثروة المعتادة.'};
 return {quote,state:T};
}
function tradeRestartQuote(S){return prepareTradeRestart(S).quote;}
function restartTrade(S){
 const prepared=prepareTradeRestart(S);if(!prepared.quote.ok)return prepared.quote;
 for(const key of Object.keys(S))delete S[key];Object.assign(S,prepared.state);attachWallet(S);
 return {...prepared.quote,msg:'اكتملت التصفية وبقيت قافلتك الرئيسية؛ يمكنك بدء تجارة جديدة.'};
}
