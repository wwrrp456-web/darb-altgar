/* معاينة وتنفيذ بيع الدكان والمخزن؛ المعاينة تعمل على نسخة معزولة. */
const ASSET_SALE_FACTORS = { calm: 0.80, distressed: 0.65 };
function assetBaseQuote(S, city, kind, id) {
  const c = S.cities[city], P = S.player, pr = P.props[city];
  const no = msg => ({ ok: false, msg });
  if (!c || !pr) return no('لا ممتلكات في هذه المدينة.');
  if (!['shop', 'warehouse'].includes(kind)) return no('هذا النوع غير متاح في هذه الدفعة.');
  let target = null, value = 0;
  if (kind === 'shop') {
    target = pr.shops.find(sh => sh.id === id);
    if (!target || shKind(target) !== 'own') return no('اختر دكاناً تملكه؛ المكان المستأجر لا يُباع.');
    if (target.endowed || lifeBooks(S).some(w => w.city === city && w.shop === id)) return no('هذا الأصل غير متاح للبيع.');
    value = 1000; // قيمة الدكان الحالية فيnetWorth، لا ثمن إعادة بنائه.
  } else {
    if (!(pr.whs > 0)) return no('لا مخزن تملكه هنا.');
    value = 800; // قيمة وحدة المخزن الحالية فيnetWorth.
  }
  const main = P.caravans.find(car => car.main) || P.caravans[0];
  if (main && main.left > 0) return no('انتظر وصول قافلتك الرئيسية قبل بيع الأصل.');
  if ((S.orders || []).some(order => order.from === city || order.to === city)) return no('أكمل عقد التوصيل المرتبط بهذه المدينة أولاً.');
  const dues = S.paymentDues || [], debt = bankDebt(S) > 0 || famDebtOn(S) || dues.some(d => d.amount > 0);
  const stranded = P.gold <= 150 && main && valueOf(holdings(main)) < 1 && passivePerDay(S) <= 0;
  const mode = debt || stranded ? 'distressed' : 'calm', factor = ASSET_SALE_FACTORS[mode], price = Math.floor(value * factor);
  const remainingShops = pr.shops.filter(sh => sh !== target);
  const removedWarehouses = kind === 'warehouse' ? 1 : Math.max(0, pr.whs - remainingShops.length);
  const remainingWarehouses = pr.whs - removedWarehouses;
  const capacityAfter = remainingWarehouses * WH_CAP + remainingShops.reduce((sum, sh) => sum + shCap(sh), 0);
  const rentDues = kind === 'shop' ? dues.filter(d => d.id === target.paymentDue && d.kind === 'rent') : [];
  return { ok: true, city, kind, id: target ? target.id : null, value, factor, mode, price,
    // مخازن ملازمة لبيع الدكان تُعرض منفصلة، ولا تختفي بلا ثمن.
    accompanyingWarehouses: removedWarehouses - (kind === 'warehouse' ? 1 : 0),
    accompanyingPrice: kind === 'shop' ? Math.floor(removedWarehouses * 800 * factor) : 0,
    capacityAfter, load: storeLoad(S, city),
    sharedStore: Object.entries(pr.store).filter(([, q]) => q > 0).map(([g, q]) => ({ g, q })),
    knownRentArrears: rentDues.reduce((sum, d) => sum + d.amount, 0),
    unknownRentArrears: !!(target && target.arrears && (!rentDues.length || rentDues.some(d => d.unknownPast))),
    note: 'تسعير الأصل فقط؛ صافي تصفية البضائع وأجور العاملين يُحسب قبل تنفيذ البيع.' };
}
function assetSaleWorkers(S, q) {
  const pr = S.player.props[q.city], fired = [];
  for (const role of ['seller', 'keeper']) {
    let covered = 0;
    const need = role === 'seller' ? sellerNeed(S, q.city) : keeperNeed(S, q.city);
    const workers = (pr.staff || []).filter(w => w.role === role).sort((a,b) => wkLv(b)-wkLv(a) || a.id-b.id);
    for (const w of workers) {
      if (covered >= need) fired.push(w);
      else covered += role === 'seller' ? WK.seller.pts[wkLv(w)] * (w.late ? 0.5 : 1) : w.late ? 0 : 1;
    }
  }
  return fired;
}
function assetStockFraction(S, c, pr, g, amount) {
  const quality = qualOf(pr.basis, g), integer = Math.floor(amount), r = sellUnits(S, S.player, c, g, integer, pr.store, true, quality, 'asset');
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
  const shop=q.kind==='shop'?pr.shops.find(sh=>sh.id===q.id):null;
  if(shop)pr.shops=pr.shops.filter(sh=>sh!==shop);
  pr.whs-=q.kind==='warehouse'?1:q.accompanyingWarehouses;
  const fired=assetSaleWorkers(S,q), targets=fired.concat(shop?[shop]:[]);
  const empty=!pr.shops.length&&!pr.whs&&!pr.farm&&!pr.butcher&&!P.factories.some(f=>f.city===q.city);
  if(empty&&pr.mgr)targets.push(pr.mgr);
  const dues=(S.paymentDues||[]).filter(d=>targets.some(t=>t.paymentDue===d.id));
  const unknown=targets.some(t=>(t.late||t.arrears)&&!dues.some(d=>d.id===t.paymentDue))||dues.some(d=>d.unknownPast);
  if(unknown){S.ctxCur=previousCurrency;return NO('مبلغ متأخر قديم غير مسجل: للتأكد قبل البيع.');}
  const owed=dues.reduce((sum,d)=>sum+d.amount,0);
  if(P.wallet.sar+1e-9<owed){S.ctxCur=previousCurrency;return NO('الثمن ورصيد الريال لا يكفيان للمستحقات المسجلة: '+owed.toFixed(2)+' ريال.');}
  for(const due of dues){const paid=pPay(S,due.cat,due.amount,true);if(shop&&due.id===shop.paymentDue)shop.rentPaid=(shop.rentPaid||0)+paid;}
  const paidIds=new Set(dues.map(d=>d.id));if(S.paymentDues)S.paymentDues=S.paymentDues.filter(d=>!paidIds.has(d.id));
  pr.staff=(pr.staff||[]).filter(w=>!fired.includes(w));if(empty){pr.mgr=null;pr.ins=null;}
  P.led.inc.assets=(P.led.inc.assets||0)+propertyPrice;fauc(S,'assetSale',propertyPrice);
  const result={ok:true,propertyPrice,goods,goodsNet:P.wallet.sar-start-propertyPrice+owed,duesPaid:owed,staffFired:fired.map(w=>w.id),net:P.wallet.sar-start};
  const history=P.sold||(P.sold=[]);history.unshift({day:S.day,city:q.city,kind:q.kind,id:q.id,label:'بيع أصل',propertyPrice,goodsNet:result.goodsNet,duesPaid:owed,net:result.net});if(history.length>30)history.pop();
  S.ctxCur=previousCurrency;return result;
}
function assetQuote(S, city, kind, id) {
  const base=assetBaseQuote(S,city,kind,id);if(!base.ok)return base;
  const copy=JSON.parse(save(S));attachWallet(copy);
  const result=assetSaleApply(copy,base);
  return result.ok?Object.assign({},base,result,{note:'صافي البيع يشمل البضاعة الزائدة عن السعة والمستحقات المسجلة؛ يبقى دَين الجدّ لاختيارك.'}):Object.assign({},base,{ok:false,msg:result.msg});
}
function sellAsset(S, city, kind, id) {
  const q=assetQuote(S,city,kind,id);if(!q.ok)return NO(q.msg);
  const result=assetSaleApply(S,q);
  return Object.assign(result,{msg:'تم بيع الأصل؛ تغير رصيد الريال بمقدار '+result.net.toFixed(2)+' ريال بعد تسوية المستحقات.'});
}
