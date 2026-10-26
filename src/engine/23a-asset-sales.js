/* معاينة وتنفيذ بيع الدكان والمخزن؛ المعاينة تعمل على نسخة معزولة. */
const ASSET_SALE_FACTORS = { calm: 0.80, distressed: 0.65 };
function assetBaseQuote(S, city, kind, id, fixedFactor) {
  const c = S.cities[city], P = S.player, pr = P.props[city];
  const no = msg => ({ ok: false, msg });
  if (!c || !pr) return no('لا ممتلكات في هذه المدينة.');
  if (!['shop', 'warehouse', 'farm', 'butcher', 'factory', 'lease', 'close'].includes(kind)) return no('هذا النوع غير متاح في هذه الدفعة.');
  let target = null, value = 0;
  if (kind === 'shop') {
    target = pr.shops.find(sh => sh.id === id);
    if (!target || shKind(target) !== 'own') return no('اختر دكاناً مملوكاً لك؛ فالعقار المستأجر لا يصح بيعه شرعاً ولا نظاماً.');
    if (target.endowed || lifeBooks(S).some(w => w.city === city && w.shop === id)) return no('هذا الأصل غير متاح للبيع.');
    value = 1000; // قيمة الدكان الحالية فيnetWorth، لا ثمن إعادة بنائه.
  } else if(kind==='lease'){
    target=pr.shops.find(sh=>sh.id===id&&shKind(sh)!=='own');if(!target)return no('لا إيجار قائم لهذا المكان.');value=0;
  } else if(kind==='close'){
    if(pr.shops.length||pr.whs||pr.farm||pr.butcher||P.factories.some(f=>f.city===city))return no('توجد أصول تحتاج تصفية أولاً.');value=0;
  } else if(kind==='farm'||kind==='butcher') {
    target=pr[kind];if(!target)return no('لا أصل من هذا النوع هنا.');
    value=kind==='farm'?2500*target.level:BUTCHER_COST*0.6;
  } else if(kind==='factory') {
    target=P.factories.find(f=>f.city===city&&f.id===id);if(!target)return no('اختر مصنعاً تملكه في هذه المدينة.');value=factoryValue(target);
  } else {
    if (!(pr.whs > 0)) return no('لا مخزن تملكه هنا.');
    value = 800; // قيمة وحدة المخزن الحالية فيnetWorth.
  }
  const main = P.caravans.find(car => car.main) || P.caravans[0];
  if (main && main.left > 0) return no('انتظر وصول قافلتك الرئيسية قبل بيع الأصل.');
  if ((S.orders || []).some(order => order.from === city || order.to === city)) return no('أكمل عقد التوصيل المرتبط بهذه المدينة أولاً.');
  const dues = S.paymentDues || [], debt = bankDebt(S) > 0 || famDebtOn(S) || dues.some(d => d.amount > 0);
  const stranded = P.gold <= 150 && main && valueOf(holdings(main)) < 1 && passivePerDay(S) <= 0;
  const factor = fixedFactor == null ? ASSET_SALE_FACTORS[debt || stranded ? 'distressed' : 'calm'] : fixedFactor, mode = factor===ASSET_SALE_FACTORS.distressed?'distressed':'calm', price = Math.floor(value * factor);
  const remainingShops = pr.shops.filter(sh => sh !== target);
  const removedWarehouses = kind === 'warehouse' ? 1 : Math.max(0, pr.whs - remainingShops.length);
  const remainingWarehouses = pr.whs - removedWarehouses;
  const capacityAfter = remainingWarehouses * WH_CAP + remainingShops.reduce((sum, sh) => sum + shCap(sh), 0);
  const rentDues = kind === 'shop'||kind==='lease' ? dues.filter(d => d.id === target.paymentDue && d.kind === 'rent') : [];
  const accompanyingValue=(kind==='shop'||kind==='lease')?removedWarehouses*800:kind==='farm'&&pr.butcher?BUTCHER_COST*.6:0;
  return { ok: true, city, kind, accompanyingValue, id: target && target.id != null ? target.id : null, value, factor, mode, price,
    // مخازن ملازمة لبيع الدكان تُعرض منفصلة، ولا تختفي بلا ثمن.
    accompanyingWarehouses: removedWarehouses - (kind === 'warehouse' ? 1 : 0),
    accompanyingPrice: Math.floor(accompanyingValue*factor),
    accompanyingButcher:kind==='farm'&&!!pr.butcher,
    capacityAfter, load: storeLoad(S, city),
    sharedStore: Object.entries(pr.store).filter(([, q]) => q > 0).map(([g, q]) => ({ g, q })),
    knownRentArrears: rentDues.reduce((sum, d) => sum + d.amount, 0),
    unknownRentArrears: !!(target && target.arrears && (!rentDues.length || rentDues.some(d => d.unknownPast))),
    note: 'تسعير الأصل فقط؛ صافي تصفية البضائع وأجور العاملين يُحسب قبل تنفيذ البيع.' };
}
function assetSaleWorkers(S, q) {
  const pr = S.player.props[q.city], fired = [];
  for (const role of q.kind==='farm'||q.kind==='close'?['seller','keeper','farmer']:['seller','keeper']) {
    let covered = 0;
    const need = role === 'seller' ? sellerNeed(S, q.city) : role==='farmer'?farmerNeed(S,q.city):keeperNeed(S, q.city);
    const workers = (pr.staff || []).filter(w => w.role === role).sort((a,b) => wkLv(b)-wkLv(a) || a.id-b.id);
    for (const w of workers) {
      if (covered >= need) fired.push(w);
      else covered += role === 'seller' ? WK.seller.pts[wkLv(w)] * (w.late ? 0.5 : 1) : w.late ? 0 : 1;
    }
  }
  return fired;
}
function assetStockFraction(S, c, pr, g, amount, qualityOverride) {
  const quality = qualityOverride == null ? qualOf(pr.basis, g) : qualityOverride, integer = Math.floor(amount), r = sellUnits(S, S.player, c, g, integer, pr.store, true, quality, 'asset');
  let net = r.net, quantity = r.n;
  const fraction = Math.min(amount-integer, pr.store[g] || 0);
  if (fraction > 1e-9) {
    const gross = unitPrice(c,g) * quality * fraction, tax = gross * taxRate(S,c,true);
    pr.store[g] -= fraction; c.stock[g] = Math.min(c.stock[g] + fraction, capG(c,g)*1.2);
    S.player.gold += gross-tax; net += gross-tax; quantity += fraction;
    sink(S,'tax',tax); S.player.led.inc.sales=(S.player.led.inc.sales||0)+gross; S.player.led.exp.tax=(S.player.led.exp.tax||0)+tax;
    const boss=bossOf(S,c.id);if(boss)boss.dsales+=gross;
    if(rulerMine(S,c)){const share=tax*.2;S.player.gold+=share;S.player.led.inc.governor=(S.player.led.inc.governor||0)+share;fauc(S,'governor',share);}
  }
  const cost=takeBasis(pr.basis || (pr.basis={}),g,quantity);
  logTrade(S,c.id,g,quantity,'sell',net,net-cost,'asset');
  return { g, q: quantity, net };
}
function assetSaleApply(S, q) {
  const P=S.player, pr=P.props[q.city], c=S.cities[q.city], previousCurrency=S.ctxCur;
  const start=P.wallet.sar, propertyPrice=q.price+q.accompanyingPrice;
  S.ctxCur='sar';P.wallet.sar+=propertyPrice;
  const load=q.load, fraction=load>0?Math.max(0,Math.min(1,(load-q.capacityAfter)/load)):0, goods=[];
  for(const {g,q:quantity} of q.sharedStore)if(fraction>0)goods.push(assetStockFraction(S,c,pr,g,quantity*fraction));
  const livestock=[];let livestockCar=null;
  if(q.kind==='farm'){
    const f=pr.farm,animalResult=assetFarmAnimals(S,q,f,pr);if(!animalResult.ok){S.ctxCur=previousCurrency;return animalResult;}livestock.push(...animalResult.livestock);livestockCar=animalResult.carId;
    for(const [g,amount] of Object.entries(f.acc||{}))if(amount>0&&GD[g])goods.push(assetStockFraction(S,c,{store:{[g]:amount},basis:{}},g,amount));
  }
  const target=q.kind==='factory'?P.factories.find(f=>f.id===q.id&&f.city===q.city):q.kind==='farm'||q.kind==='butcher'?pr[q.kind]:null;
  if(q.kind==='factory'&&target.acc>0){const g=RECIPES[target.recipe].out;goods.push(assetStockFraction(S,c,{store:{[g]:target.acc},basis:{[g]:{q:target.acc,c:target.accCost||0}}},g,target.acc,factoryQual(S,target)));}
  const shop=q.kind==='shop'||q.kind==='lease'?pr.shops.find(sh=>sh.id===q.id):null;
  if(shop)pr.shops=pr.shops.filter(sh=>sh!==shop);
  pr.whs-=q.kind==='warehouse'?1:q.accompanyingWarehouses;
  if(q.kind==='farm'){pr.farm=null;if(q.accompanyingButcher)pr.butcher=null;}
  if(q.kind==='butcher')pr.butcher=null;
  if(q.kind==='factory')P.factories=P.factories.filter(f=>f!==target);
  const fired=assetSaleWorkers(S,q), targets=fired.concat(shop?[shop]:target?[target]:[]);
  const empty=!pr.shops.length&&!pr.whs&&!pr.farm&&!pr.butcher&&!P.factories.some(f=>f.city===q.city);
  const scopeClosed=pr.mgr?.rank===2&&!managerScope(S,q.city,pr.mgr);
  if((empty||scopeClosed)&&pr.mgr)targets.push(pr.mgr);
  const dues=(S.paymentDues||[]).filter(d=>targets.some(t=>t.paymentDue===d.id));
  const unknown=targets.some(t=>(t.late||t.arrears)&&!dues.some(d=>d.id===t.paymentDue))||dues.some(d=>d.unknownPast);
  if(unknown){S.ctxCur=previousCurrency;return NO('يرجى التحقق من أداء أي مستحقات قديمة غير مقيدة قبل إتمام البيع.');}
  const owed=dues.reduce((sum,d)=>sum+d.amount,0);
  if(P.wallet.sar+1e-9<owed){S.ctxCur=previousCurrency;return NO('الثمن ورصيد الريال لا يكفيان للمستحقات المسجلة: '+owed.toFixed(2)+' ريال.');}
  for(const due of dues){const paid=pPay(S,due.cat,due.amount,true);if(shop&&due.id===shop.paymentDue)shop.rentPaid=(shop.rentPaid||0)+paid;}
  const paidIds=new Set(dues.map(d=>d.id));if(S.paymentDues)S.paymentDues=S.paymentDues.filter(d=>!paidIds.has(d.id));
  pr.staff=(pr.staff||[]).filter(w=>!fired.includes(w));if(scopeClosed)pr.mgr=null;if(empty){pr.mgr=null;pr.ins=null;}
  P.led.inc.assets=(P.led.inc.assets||0)+propertyPrice;fauc(S,'assetSale',propertyPrice);
  const result={ok:true,propertyPrice,goods,livestock,livestockCar,goodsNet:P.wallet.sar-start-propertyPrice+owed,duesPaid:owed,staffFired:fired.map(w=>w.id),net:P.wallet.sar-start};
  const history=P.sold||(P.sold=[]);if(q.kind!=='close'||goods.length||owed||fired.length)history.unshift({day:S.day,city:q.city,kind:q.kind,id:q.id,label:q.kind==='lease'?'إنهاء إيجار':q.kind==='close'?'إغلاق إدارة المدينة':'بيع أصل',propertyPrice,goodsNet:result.goodsNet,duesPaid:owed,net:result.net});if(history.length>30)history.pop();
  S.ctxCur=previousCurrency;return result;
}
function assetQuote(S, city, kind, id, options = {}) {
  if(!options||!['sell','keep'].includes(options.livestock||'sell'))return NO('اختر بيع المواشي أو الاحتفاظ بها.');
  if(kind!=='farm'&&options.livestock==='keep')return NO('خيار الاحتفاظ بالمواشي خاص ببيع المزرعة.');
  const base=assetBaseQuote(S,city,kind,id);if(!base.ok)return base;
  base.livestockMode=options.livestock||'sell';base.carId=options.carId;
  const copy=JSON.parse(save(S));attachWallet(copy);
  const result=assetSaleApply(copy,base);
  return result.ok?Object.assign({},base,result,{note:'صافي البيع يشمل السلع والأنعام المباعة بعد تسوية المستحقات؛ ويبقى المخزون الذي تستوعبه المدينة، ولا يُسدّد دَين الجد تلقائياً.'}):Object.assign({},base,{ok:false,msg:result.msg});
}
function sellAsset(S, city, kind, id, options) {
  const q=assetQuote(S,city,kind,id,options);if(!q.ok)return NO(q.msg);
  const result=assetSaleApply(S,q);
  return Object.assign(result,{msg:'تم بيع الأصل؛ تغير رصيد الريال بمقدار '+result.net.toFixed(2)+' ريال بعد تسوية المستحقات.'});
}
function assetFarmAnimals(S,q,f,pr){
 const keys=Array.from(new Set([...Object.keys(f.herd||{}),...Object.keys(f.hx||{})])),livestock=[];
 if(q.livestockMode==='keep'){
  const car=q.carId==null?(S.player.caravans.find(c=>c.main)||S.player.caravans[0]):S.player.caravans.find(c=>c.id===q.carId);
  if(!car||car.left>0||car.city!==q.city)return NO('لنقل المواشي يجب أن تكون القافلة المختارة واقفة في المدينة.');
  const projected={...car,herd:{...(car.herd||{})},hx:{...(car.hx||{})}};
  for(const g of keys){const adult=f.herd[g]||0,young=youngOf(f,g);if(!(adult>0||young>0))continue;
   if(!(GD[g]&&GD[g].hu>0))return NO('نقل المزرعة كاملة للقطيع لا يشمل الدواجن؛ انقلها أو بعها أولاً من المزرعة.');
   if((car.herd||{})[g]>0||(car.cargo||{})[g]>0||youngOf(car,g)>0)return NO('انقل أو بع الصنف الموجود في القافلة أولاً، للمحافظة على أنساب القطيع دون دمج.');
   projected.herd[g]=adult;projected.hx[g]=JSON.parse(JSON.stringify(hxOf(f,g)));
  }
  if(herdUnits(projected)>herdCap(car)+1e-9)return NO('سعة القطيع لا تكفي لنقل جميع المواشي وصغارها؛ زد الرعاة أو اختر البيع.');
  car.herd=projected.herd;car.hx=projected.hx;
  for(const g of keys){const adult=f.herd[g]||0,young=youngOf(f,g);if(!(adult>0||young>0))continue;
   const cost=takeBasis(pr.basis||(pr.basis={}),g,adult);addBasis(car.basis||(car.basis={}),g,adult,cost);
   if(f.pair&&f.pair[g])(car.pair||(car.pair={}))[g]=f.pair[g];
   livestock.push({g,adult,young,mode:'keep'});
  }
  return {ok:true,livestock,carId:car.id};
 }
 const c=S.cities[q.city];
 for(const g of keys){
  const adult=f.herd[g]||0,young=youngOf(f,g);
  if(adult>0){const r=assetStockFraction(S,c,{store:{[g]:adult},basis:pr.basis||(pr.basis={})},g,adult,pedMulOf(f,g));livestock.push({...r,age:'adult',mode:'sell'});}
  if(young>0){const x=hxOf(f,g),quality=YOUNG_SELL*(spOf(g)==='horse'?pedMul(x.yq||1):1)*hyPf(f,g);const r=assetStockFraction(S,c,{store:{[g]:young},basis:{}},g,young,quality);livestock.push({...r,age:'young',mode:'sell'});}
 }
 return {ok:true,livestock,carId:null};
}
