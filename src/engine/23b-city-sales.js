/* خطة التصفية تُنفَّذ على نسخة كاملة أولاً؛ لا بيع جزئي في الحالة الحية. */
const CITY_DUE_KINDS = ['rent','staff','manager','factory'];
function citySaleTargets(S, city) {
 const pr=S.player.props[city];if(!pr)return [];
 const rows=S.player.factories.filter(f=>f.city===city).map(f=>({kind:'factory',id:f.id,name:RECIPES[f.recipe].name}));
 if(pr.farm)rows.push({kind:'farm',id:null,name:'المزرعة'+(pr.butcher?' وملحمتها':'')});
 else if(pr.butcher)rows.push({kind:'butcher',id:null,name:'الملحمة'});
 for(let i=0;i<pr.whs;i++)rows.push({kind:'warehouse',id:null,name:'المخزن '+(i+1)});
 pr.shops.forEach((sh,i)=>rows.push({kind:shKind(sh)==='own'?'shop':'lease',id:sh.id,name:shKind(sh)==='own'?'الدكان '+(i+1):'إنهاء إيجار '+(shKind(sh)==='stall'?'البسطة ':'الدكان ')+(i+1)}));
 rows.push({kind:'close',id:null,name:'تصفية المخزون وإغلاق الإدارة'});
 return rows;
}
function prepareCityAssetSale(S,city,options={}){
 const no=msg=>({quote:NO(msg)}),pr=S.player.props[city];
 if(!S.cities[city]||!pr)return no('لا ممتلكات أو إدارة مسجلة في هذه المدينة.');
 if(!Number.isFinite(S.player.wallet.sar)||S.player.wallet.sar<0)return no('رصيد الريال غير صالح؛ راجع بيانات الحفظ قبل التصفية.');
 if(S.awayJob||S.awaySim)return no('انتظر انتهاء حساب الغياب قبل التصفية.');
 if(!options||!['sell','keep'].includes(options.livestock||'sell'))return no('اختر بيع المواشي أو الاحتفاظ بها.');
 const related=(S.paymentDues||[]).filter(d=>d.city===city&&CITY_DUE_KINDS.includes(d.kind));
 if(related.some(d=>!Number.isFinite(d.amount)||d.amount<0||d.unknownPast))return no('رصيد متأخر قديم غير مسجل بالكامل: للتأكد قبل التصفية.');
 const plan=citySaleTargets(S,city);
 if(plan.length===1&&storeLoad(S,city)<=1e-9&&!(pr.staff||[]).length&&!pr.mgr&&!pr.ins&&!related.some(d=>d.amount>0))return no('لا أصول أو مستحقات تحتاج تصفية هنا.');
 const first=assetBaseQuote(S,city,plan[0].kind,plan[0].id);if(!first.ok)return {quote:first};
 const copy=JSON.parse(save(S));attachWallet(copy);
 const P=copy.player,start=P.wallet.sar,factor=first.factor,bridge=related.reduce((sum,d)=>sum+d.amount,0);
 // رصيد محاسبي مؤقت داخل النسخة فقط؛ يقابله التزام بالقيمة نفسها حتى لا يغيّر صافي الثروة أو الضريبة.
 if(!Number.isFinite(bridge))return no('تعذر حساب المستحقات المسجلة؛ راجع بيانات الحفظ.');
 const reserve={amt:bridge,type:'assetSettlementReserve'};
 if(bridge>0){P.wallet.sar+=bridge;P.bank.loans.push(reserve);}
 const items=[],goods=[],livestock=[],staffFired=[];let value=0,propertyPrice=0,duesPaid=0,accompanyingButcher=false;
 for(const entry of plan){
  const q=assetBaseQuote(copy,city,entry.kind,entry.id,factor);
  if(!q.ok)return no(entry.name+': '+q.msg);
  q.livestockMode=entry.kind==='farm'?(options.livestock||'sell'):'sell';q.carId=options.carId;
  const closingOffice=entry.kind==='close'&&!!(copy.player.props[city].mgr||copy.player.props[city].ins);
  const result=assetSaleApply(copy,q);
  if(!result.ok)return no(entry.name+': '+result.msg);
  value+=q.value+q.accompanyingValue;propertyPrice+=result.propertyPrice;duesPaid+=result.duesPaid;
  goods.push(...result.goods);livestock.push(...result.livestock);staffFired.push(...result.staffFired);accompanyingButcher ||= q.accompanyingButcher;
  if(entry.kind!=='close'||result.goods.length||result.duesPaid||result.staffFired.length||closingOffice)items.push({...entry,propertyPrice:result.propertyPrice,duesPaid:result.duesPaid,net:result.net});
 }
 // المطالبات التاريخية المعروفة للعاملين الذين غادروا لا تسقط بمغادرة المدينة.
 const remaining=(copy.paymentDues||[]).filter(d=>d.city===city&&CITY_DUE_KINDS.includes(d.kind));
 copy.ctxCur='sar';
 for(const due of remaining){duesPaid+=pPay(copy,due.cat,due.amount,true);}
 const paidIds=new Set(remaining.map(d=>d.id));if(copy.paymentDues)copy.paymentDues=copy.paymentDues.filter(d=>!paidIds.has(d.id));
 if(bridge>0){P.wallet.sar-=bridge;P.bank.loans=P.bank.loans.filter(l=>l!==reserve);}
 if(![P.wallet.sar,value,propertyPrice,duesPaid].every(Number.isFinite))return no('تعذر حساب قيم التصفية؛ راجع بيانات الحفظ.');
 if(P.wallet.sar < -1e-7)return no('حصيلة البيع ورصيد الريال لا يكفيان لكل المستحقات؛ لا يُباع أي أصل.');
 if(P.wallet.sar<0)P.wallet.sar=0;
 const net=P.wallet.sar-start;
 const history=P.sold||(P.sold=[]);history.unshift({day:S.day,city,kind:'city',label:'تصفية مدينة',propertyPrice,goodsNet:net+duesPaid-propertyPrice,duesPaid,net,itemCount:items.length});if(history.length>30)history.length=30;
 const quote={ok:true,city,kind:'city',id:null,value,factor,mode:first.mode,price:propertyPrice,propertyPrice,accompanyingPrice:0,accompanyingWarehouses:0,accompanyingButcher:false,includesButcher:accompanyingButcher,
  goods,livestock,items,duesPaid,staffFired:[...new Set(staffFired)],goodsNet:net+duesPaid-propertyPrice,net,
  managerReleased:!!pr.mgr,insuranceStopped:!!pr.ins,livestockCar:options.livestock==='keep'?(options.carId==null?(P.caravans.find(c=>c.main)||P.caravans[0]).id:options.carId):null,
  note:'تصفية كل أصول المدينة وإيجاراتها، مع بقاء القافلة والقروض الشخصية ودَين الجدّ.'};
 return {quote,state:copy};
}
function cityAssetQuote(S,city,options){return prepareCityAssetSale(S,city,options).quote;}
function sellCityAssets(S,city,options){
 const prepared=prepareCityAssetSale(S,city,options);if(!prepared.quote.ok)return prepared.quote;
 // اعتماد النسخة المكتملة دفعة واحدة، ثم ربط محفظة الذهب بالجذر الحي مجدداً.
 for(const key of Object.keys(S))delete S[key];Object.assign(S,prepared.state);attachWallet(S);
 return {...prepared.quote,msg:'تمت تصفية أصول '+S.cities[city].name+'؛ تغير رصيد الريال بمقدار '+prepared.quote.net.toFixed(2)+' ريال.'};
}
