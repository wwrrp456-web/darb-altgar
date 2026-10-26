'use strict';
const E=require('../src/engine.js'),assert=require('node:assert/strict');
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function fresh(seed=8){const S=E.newGame(seed);E.A.learnSetChar(S, 'trader'); S.noLock = 1;S.learn.level=11;S.learn.stage=23;S.learn.stageIntro=22;S.player.gold=100000;S.phase=4;S.player.props={};S.player.factories=[];S.paymentDues=[];delete S.player.famDebt;return S;}
let S=fresh();assert(E.A.buildShop(S,'riyadh').ok);assert(E.A.buildWarehouse(S,'riyadh').ok);assert(E.A.buildFarm(S,'riyadh').ok);assert(E.A.buildFactory(S,'riyadh','perfume').ok);assert(E.A.buildShop(S,'hail').ok);assert(E.A.rentShop(S,'hail','stall').ok);
S.player.props.riyadh.store.wheat=2.5;S.player.props.riyadh.basis.wheat={q:2.5,c:20};S.player.props.riyadh.farm.herd.sheep=4;S.player.props.riyadh.farm.hx.sheep={m:1,y:2,b:1,mq:1,fq:1,yq:1};S.player.props.riyadh.farm.acc.wool=.4;
assert(E.A.hireCaptain(S).ok);const main=S.player.caravans[0],extra=S.player.caravans[1];extra.cargo.coffee=2.25;extra.basis.coffee={q:2.25,c:100};extra.herd.sheep=3;extra.hx={sheep:{m:1,y:.5,b:0,mq:1,fq:1,yq:1}};extra.mount={kind:'camel'};extra.route={a:'riyadh',b:'hail'};main.cargo.wheat=1.5;main.basis.wheat={q:1.5,c:10};main.supplies=8;main.mount={kind:'horse'};S.captainAuto=true;
assert(E.A.buyShip(S,'jeddah','dhow').ok);S.player.bank.dep.hail=1200;S.player.bank.loans=[{id:7,type:'qard',city:'hail',amt:70,due:400}];S.player.famDebt={left:150,amt0:300};S.player.wallet.usd=9;S.player.vault=33;S.player.name='فهد';S.day=15;E.achInit(S);S.ach.got={one:{day:1}};
const identities=JSON.stringify({learn:S.learn,ach:S.ach,day:S.day,seed:S.seed,seedB:S.seedB,zakat:S.zakat,family:S.player.famDebt,loans:S.player.bank.loans,name:S.player.name}),raw=E.save(S),before=S.player.wallet.sar,mainId=main.id;
const q=E.tradeRestartQuote(S);assert(q.ok,q.msg);assert.equal(E.save(S),raw,'معاينة قراءة فقط');assert.equal(q.factor,.65);assert(q.items.some(i=>i.kind==='lease'));assert(q.items.some(i=>i.kind==='ship'));assert(q.items.some(i=>i.kind==='caravan'));near(q.investmentFees,12);near(q.investmentReturn,1188);near(q.net,q.assetProceeds+q.goodsNet+q.investmentReturn-q.duesPaid);
assert(q.livestock.some(g=>g.age==='young'&&g.carId===extra.id));const root=S;const r=E.A.restartTrade(S);assert(r.ok,r.msg);assert.equal(S,root);near(S.player.wallet.sar,before+q.net);near(S.player.wallet.sar,q.cashAfter);assert.equal(S.phase,1);assert.equal(S.player.caravans.length,1);assert.equal(S.player.caravans[0].id,mainId);assert.equal(S.player.caravans[0].city,'riyadh');assert.equal(S.player.caravans[0].supplies,8);assert.equal(S.player.caravans[0].mount.kind,'horse');assert.equal(E.valueOf(E.holdings(S.player.caravans[0])),0);assert.equal(S.player.ships.length,0);assert.equal(S.player.factories.length,0);assert.equal(S.player.bank.dep.hail,0);assert.equal(S.player.vault,33);assert.equal(S.player.wallet.usd,9);assert.equal(S.captainAuto,false);
assert.equal(JSON.stringify({learn:S.learn,ach:S.ach,day:S.day,seed:S.seed,seedB:S.seedB,zakat:S.zakat,family:S.player.famDebt,loans:S.player.bank.loans,name:S.player.name}),identities,'لا إعادة شخصية أو درس أو جائزة أو عمر أو دين أو مولد');for(const pr of Object.values(S.player.props)){assert.equal(pr.shops.length,0);assert.equal(pr.whs,0);assert(!pr.farm);assert.equal(pr.staff.length,0);assert.equal(E.valueOf(pr.store),0);}assert.equal(S.player.sold[0].kind,'restart');assert(S.player.sold.length<=30);
const stable=E.save(S);assert.equal(E.A.restartTrade(S).ok,false);assert.equal(E.save(S),stable,'لا تكرار يخلق مالاً');const loaded=E.load(E.save(S));assert.equal(loaded.phase,1);assert.equal(loaded.learn.char,'trader');assert.equal(loaded.player.sold[0].kind,'restart');S.ctxCur='usd';const usd=S.player.wallet.usd;S.player.gold+=37.5;near(S.player.wallet.usd,usd+10);
// حصيلة مدينة لاحقة تسدد أجور أصل المدينة الأولى، بلا قرض متبقٍ.
S=fresh();E.A.buildShop(S,'riyadh');E.A.buildFactory(S,'riyadh','perfume');E.A.buildShop(S,'hail');E.A.buildShop(S,'hail');S.player.wallet.sar=0;const f=S.player.factories[0];f.paymentDue=1;f.late=1;S.paymentDues=[{id:1,city:'riyadh',kind:'factory',cat:'wages',amount:3500}];assert.equal(E.cityAssetQuote(S,'riyadh').ok,false);const pooled=E.tradeRestartQuote(S);assert(pooled.ok,pooled.msg);assert.equal(pooled.duesPaid,3500);assert(E.A.restartTrade(S).ok);assert.equal(S.player.bank.loans.length,0);assert.equal(S.paymentDues.length,0);near(S.player.wallet.sar,1050);
// المطالبات الباقية لطاقم أو موظف مغادر لا تختفي، وتتحدد من القيد الحقيقي.
S=fresh();S.player.caravans[0].paymentDue=1;S.paymentDues=[{id:1,city:'riyadh',kind:'caravan',cat:'wages',amount:10},{id:2,city:'hail',kind:'staff',cat:'staff',amount:20},{id:3,city:'jeddah',kind:'ship',cat:'wages',amount:30}];const claim=E.tradeRestartQuote(S);assert(claim.ok);assert.equal(claim.duesPaid,60);assert(E.A.restartTrade(S).ok);assert.equal(S.paymentDues.length,0);assert.equal(S.player.caravans[0].paymentDue,undefined);near(S.player.led.exp.wages,40);near(S.player.led.exp.staff,20);
for(const problem of ['road','extra-road','ship-sea','order','waqf','unknown','insufficient','bonds','city-owner','ruler','event','missing-factory-city','bad-balance','unknown-crew']){
 S=fresh();E.A.buildShop(S,'riyadh');E.A.buildShop(S,'hail');
 if(problem==='road')S.player.caravans[0].left=1;
 if(problem==='extra-road'){E.A.hireCaptain(S);S.player.caravans[1].left=1;}
 if(problem==='ship-sea')S.player.ships=[{id:99,type:'dhow',city:null,dest:'jazan'}];
 if(problem==='order')S.orders=[{from:'riyadh',to:'hail'}];
 if(problem==='waqf')S.player.props.hail.shops[0].endowed=true;
 if(problem==='unknown')S.paymentDues=[{id:1,city:'hail',kind:'staff',cat:'staff',amount:10,unknownPast:true}];
 if(problem==='insufficient'){S.player.wallet.sar=0;S.paymentDues=[{id:1,city:'hail',kind:'staff',cat:'staff',amount:1e7}];}
 if(problem==='bonds')S.player.bank.bonds=[{amt:5000,due:100}];
 if(problem==='city-owner')S.cities.hail.owner='player';
 if(problem==='ruler')S.bosses.hail.ruler='player';
 if(problem==='event')S.road={day:1};
 if(problem==='missing-factory-city')S.player.factories=[{id:3,city:'jeddah',recipe:'perfume',level:1}];
 if(problem==='bad-balance')S.player.wallet.sar=-1;
 if(problem==='unknown-crew')S.player.caravans[0].late=1;
 const snapshot=E.save(S);assert.equal(E.A.restartTrade(S).ok,false,problem);assert.equal(E.save(S),snapshot,problem+' رفض ذري');
}
// دورة بناء/تصفية ثابتة وبلا مكافآت تعليمية أو إعفاء من الديون: لا مكسب من الحلقة.
const rows=[];for(const seed of [1,2]){S=fresh(seed);for(let cycle=0;cycle<3;cycle++){S.phase=4;const start=S.player.wallet.sar;E.A.buildShop(S,'riyadh');E.A.buildWarehouse(S,'riyadh');const cost=start-S.player.wallet.sar;const quote=E.tradeRestartQuote(S);assert(quote.ok);const learning=JSON.stringify(S.learn);assert(E.A.restartTrade(S).ok);const returned=S.player.wallet.sar-(start-cost);assert(returned<cost);assert(S.player.wallet.sar<start);assert.equal(JSON.stringify(S.learn),learning);rows.push({seed,cycle,cost,returned,loss:cost-returned});}}
console.log(JSON.stringify({restartAssetLoops:rows}));console.log('PASS global restart: read-only quote, pooled claims, fleets, goods/young, investment fees, retained identity/debts/main, atomic refusals, no repeated grants, save and wallet');
// الحفظ السابق لا يحتاج حقول بداية جديدة، وحدود الأطوار اليومية لا تتغير.
S=E.load(E.save(fresh()));assert.equal(S.player.sold,undefined);assert(E.A.restartTrade(S).ok);assert.equal(S.phase,1);S.noEvents=true;E.tick(S,false);assert.equal(S.phase,4,'تعود الأطوار المالية بحسب الثروة دون إعادة التعليم');
// تعيين قافلة إضافية وشراء مركب وسفينة ثم التصفية لا يعيد كلفة تجهيزها.
S=fresh();const fleetStart=S.player.wallet.sar;assert(E.A.hireCaptain(S).ok);assert(E.A.buyMount(S,S.player.caravans[1].id,'camel').ok);assert(E.A.buyShip(S,'jeddah','dhow').ok);const afterBuy=S.player.wallet.sar;assert(E.A.restartTrade(S).ok);assert(S.player.wallet.sar<fleetStart);assert(S.player.wallet.sar>afterBuy);console.log('PASS old save, phase thresholds and fleet round-trip loss');
