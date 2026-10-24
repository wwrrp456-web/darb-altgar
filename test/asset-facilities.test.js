'use strict';
const E=require('../src/engine.js'),assert=require('node:assert/strict');
function fresh(){const S=E.newGame(4);S.phase=3;S.player.gold=1e5;E.A.buildShop(S,'riyadh');E.A.buildWarehouse(S,'riyadh');E.A.buildFarm(S,'riyadh');E.A.buildButcher(S,'riyadh');delete S.player.famDebt;return S;}
let S=fresh(),pr=S.player.props.riyadh,f=pr.farm;
f.herd.sheep=10;f.hx.sheep={m:3,y:2,b:1,mq:1,fq:1,yq:1};f.acc.wool=.25;pr.basis.sheep={q:10,c:800};pr.store.wool=10;pr.basis.wool={q:10,c:0};
const before=E.save(S),q=E.assetQuote(S,'riyadh','farm');assert(q.ok);assert.equal(q.value,2500);assert.equal(q.price,2000);assert.equal(q.accompanyingPrice,1680);assert.equal(E.save(S),before);assert(q.livestock.some(r=>r.age==='young'&&r.q===2));
const balance=S.player.wallet.sar,r=E.A.sellAsset(S,'riyadh','farm');assert(r.ok);assert.equal(S.player.wallet.sar,balance+q.net);assert.equal(pr.farm,null);assert.equal(pr.butcher,null);assert.equal(pr.store.wool,10);assert(!pr.basis.sheep);assert(!pr.staff.some(w=>w.role==='farmer'));assert(pr.staff.some(w=>w.role==='seller'));assert.equal(E.A.sellAsset(S,'riyadh','farm').ok,false);
// الملحمة منفردة لا تزيل المزرعة أو المواشي أو العمال الزراعيين.
S=fresh();pr=S.player.props.riyadh;const oldFarm=pr.farm,oldStaff=pr.staff;assert(E.A.sellAsset(S,'riyadh','butcher').ok);assert.equal(pr.farm,oldFarm);assert.equal(pr.butcher,null);assert.equal(pr.staff.filter(w=>w.role==='farmer').length,oldStaff.filter(w=>w.role==='farmer').length);
// نقل القطيع كاملاً يحتفظ بالأنساب والصغار والحمل وأساس التكلفة.
S=fresh();pr=S.player.props.riyadh;f=pr.farm;f.herd.sheep=8;f.hx.sheep={m:2,y:3,b:1,mq:1.1,fq:1.2,yq:1.15};pr.basis.sheep={q:8,c:800};const car=S.player.caravans[0];car.herders=5;const genetics=JSON.stringify(f.hx.sheep);
const keep=E.assetQuote(S,'riyadh','farm',null,{livestock:'keep',carId:car.id});assert(keep.ok);assert(keep.livestock.every(r=>r.mode==='keep'));assert(E.A.sellAsset(S,'riyadh','farm',null,{livestock:'keep',carId:car.id}).ok);assert.equal(car.herd.sheep,8);assert.equal(JSON.stringify(car.hx.sheep),genetics);assert.equal(car.basis.sheep.c,800);
// رفض النقل غير الممكن يبقي جميع الأموال والحيوانات دون تغيير.
for(const issue of ['capacity','same','poultry','absent']){S=fresh();f=S.player.props.riyadh.farm;f.herd.sheep=4;const c=S.player.caravans[0];c.herders=2;if(issue==='capacity')c.herders=0;if(issue==='same')c.herd={sheep:1};if(issue==='poultry')f.herd.chicken=2;if(issue==='absent')c.city='hail';const before=E.save(S);assert.equal(E.A.sellAsset(S,'riyadh','farm',null,{livestock:'keep',carId:c.id}).ok,false,issue);assert.equal(E.save(S),before,issue+' atomic');}
// المصنع يسوى أجره المسجل ويبيع الناتج المتبقي ولا يمس مخزون المدينة المشترك.
S=fresh();pr=S.player.props.riyadh;assert(E.A.buildFactory(S,'riyadh','perfume').ok);const factory=S.player.factories[0];factory.acc=.5;factory.accCost=20;factory.paymentDue=99;factory.late=1;S.paymentDues=[{id:99,city:'riyadh',kind:'factory',cat:'wages',amount:50}];pr.store.perfume=3;
const fq=E.assetQuote(S,'riyadh','factory',factory.id);assert(fq.ok);assert.equal(fq.duesPaid,50);assert(fq.goods.some(g=>g.g==='perfume'&&g.q===.5));const bal=S.player.wallet.sar;assert(E.A.sellAsset(S,'riyadh','factory',factory.id).ok);assert.equal(S.player.wallet.sar,bal+fq.net);assert.equal(S.player.factories.length,0);assert.equal(pr.store.perfume,3);assert.equal(S.paymentDues.length,0);assert(pr.farm);
const loaded=E.load(E.save(S));assert.equal(loaded.player.sold[0].kind,'factory');assert.equal(E.assetQuote(S,'riyadh','pasture').ok,false);
// تسوية مستحقات المزارع عند بيع مزرعته.
S=fresh();pr=S.player.props.riyadh;const farmer=pr.staff.find(w=>w.role==='farmer');farmer.free=0;farmer.late=1;farmer.paymentDue=77;S.paymentDues=[{id:77,city:'riyadh',kind:'staff',cat:'staff',amount:40}];assert.equal(E.assetQuote(S,'riyadh','farm').duesPaid,40);assert(E.A.sellAsset(S,'riyadh','farm').ok);assert.equal(S.paymentDues.length,0);
// لا إعفاء للأجور عند بيع آخر دكان مع إبقاء المزرعة.
S=fresh();pr=S.player.props.riyadh;assert(E.A.sellAsset(S,'riyadh','shop',pr.shops[0].id).ok);const remaining=pr.staff.find(w=>w.role==='farmer');remaining.free=0;const wage=E.wkWage(S,S.cities.riyadh,remaining),paid=S.player.led.exp.staff||0;E.shopsDay(S);assert.equal(S.player.led.exp.staff-paid,wage);assert(pr.farm);
// المواشي التي لا تمشي في قطيع القافلة متاحة للبيع مع المزرعة.
S=fresh();pr=S.player.props.riyadh;pr.farm.herd.chicken=2;pr.farm.hx.chicken={m:1,y:3,b:0};const birds=E.assetQuote(S,'riyadh','farm');assert(birds.ok);assert.equal(birds.livestock.filter(a=>a.g==='chicken').length,2);assert(E.A.sellAsset(S,'riyadh','farm').ok);
console.log('PASS farm/butcher/factory sales, animals and young, pending production, genetics transfer, atomic refusal and save');
