/* واجهة بيع أصل واحد؛ كل مبالغ المعاينة من المحرك، ولا خصم عند الاختيار. */
const ASSET_LABELS={shop:'الدكان',warehouse:'المخزن',farm:'المزرعة',butcher:'الملحمة',factory:'المصنع',city:'أصول المدينة',restart:'التصفية الشاملة'};
let assetSaleView=null,assetSaleTrigger=null;
function assetSaleButton(city,kind,id,label){return `<button class="sm asset-sell-trigger" data-act="asset-open" data-city-id="${esc(city)}" data-kind="${kind}" data-id="${id==null?'':id}">${esc(label||'بيع '+ASSET_LABELS[kind])}</button>`;}
function assetSaleInventory(city){
 const pr=S.player.props[city];if(!pr)return '';
 const entries=pr.shops.map((sh,i)=>({sh,i})).filter(({sh})=>E.shKind(sh)==='own').map(({sh,i})=>({kind:'shop',id:sh.id,name:'الدكان '+(i+1)}));
 if(pr.whs>0)entries.push({kind:'warehouse',name:'مخزن واحد من '+pr.whs});
 if(pr.farm)entries.push({kind:'farm',name:'المزرعة · مستوى '+pr.farm.level});
 if(pr.butcher)entries.push({kind:'butcher',name:'الملحمة'});
 for(const f of S.player.factories.filter(f=>f.city===city))entries.push({kind:'factory',id:f.id,name:E.RECIPES[f.recipe].name+' · مستوى '+f.level});
 if(!entries.length&&!pr.shops.length&&!(pr.staff||[]).length&&!pr.mgr&&!pr.ins&&E.storeLoad(S,city)<=0)return '';
 return `<details class="card asset-sale-list" data-dk="asset-sales-${city}" ${detOpen['asset-sales-'+city]?'open':''}><summary>بيع الأصول في هذه المدينة</summary><p class="small muted">اختر أصلاً لمعاينة السعر وما يصاحبه، ثم أكد البيع بخطوتين.</p><div class="grid g2">${entries.map(e=>`<div class="card"><b>${esc(e.name)}</b><div class="row">${assetSaleButton(city,e.kind,e.id)}</div></div>`).join('')}</div><div class="row"><button class="sm" data-act="asset-city-open" data-city-id="${esc(city)}">بِع أصول هذه المدينة وانتقل</button></div></details>`;
}
function assetSaleName(v){
 if(v.kind==='shop'){const index=(S.player.props[v.city]?.shops||[]).findIndex(sh=>sh.id===v.id);if(index>=0)return 'الدكان '+(index+1);}
 if(v.kind==='factory'){const f=S.player.factories.find(f=>f.city===v.city&&f.id===v.id);if(f&&E.RECIPES[f.recipe])return E.RECIPES[f.recipe].name;}
 return ASSET_LABELS[v.kind]||'الأصل';
}
function openAssetSale(city,kind,id,trigger){
 if(!S.cities[city])return;
 assetSaleTrigger=trigger;assetSaleView={root:S,city,kind,id,options:{livestock:'sell',carId:main().id},phase:0,signature:'',message:''};
 const panel=$('assetSalePanel');panel.hidden=false;renderAssetSale();panel.showModal();panel.scrollTop=0;panel.querySelector('[data-act=asset-close]').focus({preventScroll:true});
}
function closeAssetSale(restore=true){
 const panel=$('assetSalePanel'),trigger=assetSaleTrigger;assetSaleView=null;assetSaleTrigger=null;
 if(panel){if(panel.open)panel.close();panel.hidden=true;panel.dataset.view='';}
 if(restore)(trigger&&trigger.isConnected?trigger:$('hMenu'))?.focus({preventScroll:true});
}
function currentAssetQuote(){const v=assetSaleView;try{return v.kind==='restart'?E.tradeRestartQuote(S):v.kind==='city'?E.cityAssetQuote(S,v.city,v.options):E.assetQuote(S,v.city,v.kind,v.id,v.options);}catch(e){return {ok:false,msg:'تعذرت معاينة الأصل. أغلق النافذة وحاول مجدداً.'};}}
function renderAssetSale(){
 const v=assetSaleView,panel=$('assetSalePanel');if(!v||!panel)return;if(v.root!==S){closeAssetSale(false);return;}
 const q=currentAssetQuote(),signature=JSON.stringify(q);
 if(v.phase===1&&signature!==v.signature){v.phase=0;v.message='تغيرت بيانات البيع. راجع المعاينة ثم أكد مجدداً.';}
 const name=assetSaleName(v),key=JSON.stringify([q,v.phase,v.options,v.message,name]);if(panel.dataset.view===key)return;panel.dataset.view=key;
 const focused=panel.contains(document.activeElement)?document.activeElement.id:null,money=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
 const row=(label,amount)=>`<div class="kv"><span>${label}</span><b class="num">${money(amount)} ريال</b></div>`;
 let h=`<div class="asset-sheet"><header class="asset-sheet-head"><h2 id="assetSaleTitle">${v.kind==='restart'?'تصفية الأصول والبداية الجديدة':'بيع '+esc(name)+' · '+esc(cityName(v.city))}</h2><button class="sm" data-act="asset-close" aria-label="إغلاق معاينة البيع">✕</button></header>`;
 if(v.kind==='farm'||v.kind==='city'&&S.player.props[v.city]?.farm)h+=`<div class="asset-sale-options"><label for="assetLivestock">المواشي عند بيع المزرعة</label><select id="assetLivestock"><option value="sell" ${v.options.livestock==='sell'?'selected':''}>بيع المواشي والصغار بسعر السوق</option><option value="keep" ${v.options.livestock==='keep'?'selected':''}>الاحتفاظ بالقطيع ونقله للقافلة</option></select>${v.options.livestock==='keep'?`<label for="assetCar">القافلة التي تستلم القطيع</label><select id="assetCar">${S.player.caravans.map(c=>`<option value="${c.id}" ${v.options.carId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><p class="small muted">يشترط الوقوف في المدينة وسعة كافية وخلو القافلة من الصنف المنقول. انقل الدواجن أو بعها من المزرعة أولاً.</p>`:''}</div>`;
 if(v.message)h+=`<p class="qnote" role="status">${esc(v.message)}</p>`;
 if(!q.ok)h+=`<p class="qnote" role="alert">${esc(q.msg)}</p>`;
 else if(v.kind==='restart')h+=tradeRestartBody(q,v,money,row);
 else{
  h+=`<p class="small muted">المعاينة فقط لا تغيّر ممتلكاتك أو رصيدك. سعر المبنى الحالي ${Math.round(q.factor*100)}٪ من قيمته، بحسب وضع السيولة والمديونية.</p>`+row(v.kind==='city'?'قيمة الأصول':'قيمة الأصل',q.value)+row(v.kind==='city'?'ثمن الأصول قبل المستحقات':'سعر بيع الأصل الآن',q.price);
  if(v.kind==='city'){h+=mentorSay(ASSET_SALE_TEXTS.move,'teach')+'<p class="qnote">يشمل التأكيد كل أصول المدينة وإيجاراتها. تُسدّد المستحقات من حصيلة المجموعة، ثم تُفتح الخريطة لتختار وجهتك؛ لا تسافر القافلة تلقائياً.</p>';h+=`<details open><summary>ما ستتم تصفيته (${q.items.length})</summary>${q.items.map(item=>`<div class="kv"><span>${esc(item.name)}</span><b class="num">${money(item.propertyPrice)} ريال</b></div>`).join('')}</details>`;}
  if(q.accompanyingWarehouses)h+=row('مخازن مصاحبة: '+q.accompanyingWarehouses,q.accompanyingPrice);
  if(q.accompanyingButcher)h+=row('الملحمة التابعة للمزرعة',q.accompanyingPrice);
  h+=row('صافي البضاعة والمواشي المباعة',q.goodsNet)+row('المستحقات المسجلة التي ستُسدّد',q.duesPaid)+row(q.net<0?'سيُخصم من رصيد الريال':'سيُضاف إلى رصيد الريال',Math.abs(q.net));
  if(q.net<0)h+='<p class="qnote">المستحقات تفوق ثمن البيع؛ وسيُقتطع الفارق من رصيد الريال المتاح.</p>';
  h+=`<p>عمال سيغادرون بعد السداد: <b>${q.staffFired.length}</b>.</p><p class="small muted">لا يوجد التزام تمويلي مرتبط بهذا الأصل؛ وبيع العقار لا يسدّد الديون الشخصية أو دَين الجد تلقائياً.</p>`;
  if(q.managerReleased)h+='<p class="small muted">ستنتهي إدارة المدينة بعد سداد مستحقات المدير.</p>';if(q.insuranceStopped)h+='<p class="small muted">سيتوقف اشتراك التكافل في المدينة بعد التصفية.</p>';
  if((v.kind==='farm'||v.kind==='city')&&S.player.props[v.city].farm?.stable)h+='<p class="qnote">يشمل البيع الإسطبل الملحق. لا تُحتسب له قيمة بيع منفصلة في تقييم المزرعة الحالي.</p>';
  const lines=[...(q.goods||[]).map(g=>`${GD[g.g].name}: ${money(g.q)} وحدة مباعة`),...(q.livestock||[]).map(g=>g.mode==='keep'?`${GD[g.g].name}: نقل ${money(g.adult)} من الكبار و${money(g.young)} من الصغار إلى القافلة`:`${GD[g.g].name}: بيع ${money(g.q)} ${g.age==='young'?'من الصغار':'من البالغات'}`)];
  if(lines.length)h+=`<details><summary>تفصيل البضاعة والمواشي</summary><ul>${lines.map(line=>`<li>${esc(line)}</li>`).join('')}</ul></details>`;
  h+=v.kind==='city'?'<p class="small muted">تبقى قوافلك وسفنك وممتلكات المدن الأخرى كما هي. لا يُسدد القرض الشخصي أو دَين الجدّ تلقائياً.</p>':`<p class="small muted">يبقى مخزون المدينة الذي تتسع له السعة الجديدة. بيع المزرعة يشمل ملحمتها إن وجدت، وبيع الملحمة منفردة يُبقي المزرعة.</p>`;
  h+=`<details class="asset-sale-zakat"><summary>بيع الأصول والزكاة</summary><p>${esc(ASSET_SALE_TEXTS.zakat)}</p></details>`;
  if(v.phase===1)h+=`<p class="qnote" role="status">التأكيد الأخير: ${v.kind==='city'?'ستتم تصفية كل الأصول والإيجارات في المدينة':'سيتم بيع الأصل'} وتسوية البنود الموضحة. راجع اختيارك قبل التنفيذ.</p>`;
 }
 h+=`<footer class="asset-sheet-actions"><button class="sm" data-act="asset-close">إلغاء</button>${q.ok?`<button id="assetConfirm" class="pri" data-act="asset-confirm">${v.phase?(v.kind==='restart'?'صفِّ أصولي وابدأ من جديد':v.kind==='city'?'تأكيد تصفية المدينة':'تأكيد البيع نهائياً'):'متابعة إلى التأكيد'}</button>`:''}</footer></div>`;
 panel.innerHTML=h;if(focused)document.getElementById(focused)?.focus({preventScroll:true});
}
function confirmAssetSale(){
 const v=assetSaleView;if(!v||v.root!==S)return closeAssetSale(false);
 const q=currentAssetQuote(),signature=JSON.stringify(q);if(!q.ok){v.phase=0;renderAssetSale();return;}
 if(v.phase!==1){v.signature=signature;v.phase=1;renderAssetSale();$('assetConfirm').focus();return;}
 if(signature!==v.signature){v.phase=0;v.message='تغيرت بيانات البيع. راجع المعاينة ثم أكد مجدداً.';renderAssetSale();return;}
 const result=v.kind==='restart'?A.restartTrade(S):v.kind==='city'?A.sellCityAssets(S,v.city,v.options):A.sellAsset(S,v.city,v.kind,v.id,v.options);
 if(!result.ok){v.phase=0;v.message=result.msg;renderAssetSale();return;}
 const toMap=v.kind==='city',restart=v.kind==='restart';if(restart)carSel=main().id;recordAssetSaleLesson(v.city);closeAssetSale(false);persist();act(result);if(toMap)go('map');else if(restart)go('market');$('hMenu')?.focus({preventScroll:true});
}
document.addEventListener('change',e=>{if(!assetSaleView||!['assetLivestock','assetCar'].includes(e.target.id))return;const v=assetSaleView;if(e.target.id==='assetLivestock')v.options.livestock=e.target.value;else v.options.carId=Number(e.target.value);v.phase=0;v.message='';renderAssetSale();});
document.addEventListener('keydown',e=>{
 if(!assetSaleView)return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeAssetSale();return;}
 if(e.key==='Tab'){
  const panel=$('assetSalePanel'),items=[...panel.querySelectorAll('button:not([disabled]),select,input,summary,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length),first=items[0],last=items.at(-1);
  if(first&&(!panel.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first).focus();}
 }
},true);
window.addEventListener('popstate',()=>closeAssetSale(false));
const assetPanel=$('assetSalePanel');
assetPanel.addEventListener('cancel',e=>{e.preventDefault();closeAssetSale();});
assetPanel.addEventListener('close',()=>{if(!assetPanel.open&&assetSaleView)closeAssetSale();});
assetPanel.addEventListener('click',e=>{if(e.target===assetPanel){const r=assetPanel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeAssetSale();}});

function distressCardHTML(){
 const m=main();if(!m||m.left>0||S.player.gold>150||E.valueOf(E.holdings(m))>=1||E.passivePerDay(S)>0)return '';
 const cities=Object.keys(S.player.props).filter(city=>{const p=S.player.props[city];return p.shops.length||p.whs||p.farm||p.butcher||(p.staff||[]).length||p.mgr||p.ins||E.storeLoad(S,city)>0||S.player.factories.some(f=>f.city===city);});
 const preferred=cities.includes(m.city)?m.city:cities[0];
 return `<section class="card distress-card" aria-label="خيارات استئناف التجارة"><h3>رصيد التجارة منخفض</h3>${mentorSay(ASSET_SALE_TEXTS.restart,'teach')}<p>يمكنك العمل في السوق لتوفير نقد، أو بيع أصل لتجهيز رحلتك التالية.</p><div class="row"><button class="sm" data-act="work">اعمل حمّالاً (+40)</button>${preferred?`<button class="sm" data-act="asset-manage" data-city-id="${esc(preferred)}">بِع أصلاً أو أكثر</button>`:''}${tradeRestartButton()}</div></section>`;
}
function manageDistressAssets(city){
 go('estate');estCity=city;estC=S.cities[city].country;detOpen['asset-sales-'+city]=true;renderAll(true);document.querySelector('.asset-sale-list')?.scrollIntoView({block:'start'});
}
