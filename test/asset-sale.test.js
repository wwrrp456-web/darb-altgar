'use strict';
const E=require('../src/engine.js'),assert=require('node:assert/strict');
function fresh(){const S=E.newGame(4);S.phase=3;S.player.gold=1e5;E.A.buildShop(S,'riyadh');E.A.buildWarehouse(S,'riyadh');return S;}
let S=fresh(),pr=S.player.props.riyadh,id=pr.shops[0].id;
pr.store.wheat=20.5;pr.basis.wheat={q:20.5,c:300};
const snapshot=E.save(S),q=E.assetQuote(S,'riyadh','shop',id);assert(q.ok);assert.equal(E.save(S),snapshot,'المعاينة لا تغير شيئاً');
const before=S.player.wallet.sar,phase=S.phase,car=S.player.caravans[0];const r=E.A.sellAsset(S,'riyadh','shop',id);
assert(r.ok);assert.equal(S.player.wallet.sar,before+q.net);assert.equal(pr.shops.length,0);assert.equal(pr.whs,0);assert(E.storeLoad(S,'riyadh')<1e-8);assert(!pr.basis.wheat);assert.equal(pr.staff.length,0);assert.equal(S.phase,phase);assert.equal(S.player.caravans[0],car);
assert.equal(S.player.sold[0].net,q.net);assert.equal(S.stats.fauc.assetSale,r.propertyPrice);assert.equal(E.A.sellAsset(S,'riyadh','shop',id).ok,false);
// لا يباع من المخزون المشترك إلا ما يزيد عن السعة الباقية؛ يشمل الكسور.
S=fresh();pr=S.player.props.riyadh;pr.store.wheat=100.5;pr.basis.wheat={q:100.5,c:1000};
const wh=E.assetQuote(S,'riyadh','warehouse');assert(wh.ok);assert(E.A.sellAsset(S,'riyadh','warehouse').ok);assert(E.storeLoad(S,'riyadh')<=E.storeCap(S,'riyadh')+1e-8);assert(pr.store.wheat>0);assert.equal(pr.shops.length,1);assert(pr.staff.some(w=>w.role==='seller'));assert(!pr.staff.some(w=>w.role==='keeper'));
// سداد المتأخر المعروف من الثمن، وترك الديون الشخصية كما هي.
S=fresh();pr=S.player.props.riyadh;const worker=pr.staff.find(w=>w.role==='seller');worker.paymentDue=88;worker.late=1;S.paymentDues=[{id:88,city:'riyadh',kind:'staff',cat:'staff',amount:70}];S.player.famDebt={left:500};
const wageQ=E.assetQuote(S,'riyadh','shop',pr.shops[0].id);assert.equal(wageQ.duesPaid,70);assert(E.A.sellAsset(S,'riyadh','shop',pr.shops[0].id).ok);assert.equal(S.paymentDues.length,0);assert.equal(S.player.famDebt.left,500);assert.equal(E.paymentHistory(S)[0].paid.staff,70);
// الرفض قبل أي تغيير عند نقص الثمن أو غياب مبلغ متأخر قديم.
for(const legacy of [false,true]){S=fresh();pr=S.player.props.riyadh;const w=pr.staff[0];w.paymentDue=4;w.late=1;S.player.wallet.sar=0;S.paymentDues=[{id:4,city:'riyadh',kind:'staff',cat:'staff',amount:1e7,unknownPast:legacy}];const before=E.save(S);assert.equal(E.A.sellAsset(S,'riyadh','shop',pr.shops[0].id).ok,false);assert.equal(E.save(S),before);}
// الثمن يصل إلى الريال، حتى لو كانت المدينة أجنبية والسياق دولاراً.
S=fresh();E.A.buildShop(S,'cairo');S.ctxCur='usd';const usd=S.player.wallet.usd,foreign=E.assetQuote(S,'cairo','shop',S.player.props.cairo.shops[0].id),sar=S.player.wallet.sar;
assert(E.A.sellAsset(S,'cairo','shop',foreign.id).ok);assert.equal(S.player.wallet.usd,usd);assert.equal(S.player.wallet.sar,sar+foreign.net);assert.equal(S.ctxCur,'sar','غلاف الأفعال الحالي يثبت سياق الريال');
const loaded=E.load(E.save(S));assert.equal(loaded.player.sold[0].label,'بيع أصل');
console.log('PASS atomic asset sale; fractional stock, capacity, staff settlement, personal debt, SAR proceeds, duplicate guard and save');
