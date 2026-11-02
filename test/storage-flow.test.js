'use strict';
const a=require('node:assert/strict'),E=require('../src/engine'),A=E.A;
function fresh(city='riyadh'){
 const S=E.newGame(5);A.chooseStart(S,city==='cairo'?'eg':'sa');A.learnSetChar(S,'trader');S.noLock=1;S.learn.level=11;S.learn.stage=23;S.phase=3;S.noEvents=true;S.noShocks=true;S.player.wallet.sar=500000;S.player.wallet.usd=500000;a(A.buildShop(S,city).ok);return S;
}
const near=(x,y)=>a(Math.abs(x-y)<1e-6,`${x} != ${y}`);
// D1: الزيادة منفصلة عن الرفوف، والتوسعة مدفوعة وتتبع عدد المخازن.
{
 const S=fresh(),p=S.player.props.riyadh;a(A.buildWarehouse(S,'riyadh').ok);a.equal(E.storeCap(S,'riyadh'),720);
 for(const [i,cost]of E.WH_UP_COST.entries()){const gold=S.player.wallet.sar;a(A.upgradeWarehouse(S,'riyadh').ok);near(gold-S.player.wallet.sar,cost);a.equal(E.storeCap(S,'riyadh'),720+300*(i+1));}
 a(!A.upgradeWarehouse(S,'riyadh').ok);a(A.buildFactory(S,'riyadh','perfume').ok);a(A.buildFarm(S,'riyadh').ok);a.equal(E.storeCap(S,'riyadh'),2320);
 E.STORAGE.grow=false;a.equal(E.storeCap(S,'riyadh'),720);a(!A.upgradeWarehouse(S,'riyadh').ok);E.STORAGE.grow=true;a.equal(p.whUp,3);
 const loaded=E.loadChecked(E.save(S));a(loaded.ok);a.equal(loaded.S.player.props.riyadh.whUp,3);
}
// D2: الحمولة والتكلفة والجودة تنتقل بلا خلق مال، ثم تباع في مدينة أخرى.
{
 const S=fresh(),car=S.player.caravans[0],p=S.player.props.riyadh;p.store.perfume=1000;p.basis.perfume={q:1000,c:10000,w:500};
 const cash=S.player.wallet.sar,room=E.capOfCar(car)-E.loadOf(car),q=Math.floor(room/E.GD.perfume.w);a(A.loadFromStore(S,car.id,'perfume',1000).ok);near(E.loadOf(car),E.capOfCar(car));a.equal(p.store.perfume,1000-q);near(E.avgCost(car.basis,'perfume'),10);near(E.qualOf(car.basis,'perfume'),.5);near(S.player.wallet.sar,cash);
 for(const n of [-1,NaN,Infinity,.5,0]){const raw=E.save(S);a(!A.loadFromStore(S,car.id,'perfume',n).ok);a.equal(E.save(S),raw);}
 a(!A.loadFromStore(S,999,'perfume',1).ok);a(!A.loadFromStore(S,car.id,'unknown',1).ok);car.left=1;const raw=E.save(S);a(!A.loadFromStore(S,car.id,'perfume',1).ok);a.equal(E.save(S),raw);car.left=0;
 a(A.travel(S,car.id,'hail').ok);for(let i=0;car.left>0&&i<100;i++){E.tick(S,false);S.pause=false;}a.equal(car.city,'hail');a(A.sell(S,car.id,'perfume',q).ok);a.equal(car.cargo.perfume,0);a(S.player.trades.some(t=>t.city==='hail'&&t.g==='perfume'&&t.side==='sell'));
}
// D3: إنتاج مستمر ومشترك، بيع فقط من الناتج، ضريبة السوق ورسم8% وأساس التكلفة.
{
 const S=fresh('cairo'),p=S.player.props.cairo;for(const recipe of ['textile','sugar'])a(A.buildFactory(S,'cairo',recipe).ok);
 const fs=S.player.factories,cap=E.storeCap(S,'cairo');p.store.textile=cap/2;p.store.sugar=cap/2;p.basis.textile={q:cap/2,c:cap*2};p.basis.sugar={q:cap/2,c:cap};p.store.iron=1;const iron=p.store.iron;
 for(const f of fs){a.equal(f.export,undefined);a(A.setFactoryExport(S,f.id,true).ok);}
 for(let d=0;d<30;d++){S.day=d;S.cities.cairo.stock.cotton=10000;S.cities.cairo.stock.wheat=10000;for(const f of fs){const before=(f.exported||0)+(p.store[E.RECIPES[f.recipe].out]||0);E.factoryDay(S,f);a((f.exported||0)+p.store[E.RECIPES[f.recipe].out]>before,'المصنعان ينتجان كل يوم '+JSON.stringify({d,recipe:f.recipe,before,after:(f.exported||0)+p.store[E.RECIPES[f.recipe].out],room:E.storeRoom(S,'cairo'),stock:p.store,usd:S.player.wallet.usd}));}a(E.storeLoad(S,'cairo')<=cap+1e-6);}
 a.equal(p.store.iron,iron);a(fs.every(f=>f.exported>0));a(S.player.trades.every(t=>['textile','sugar'].includes(t.g)&&t.sector==='factory'));
 near(S.player.led.exp.exportFee,fs.reduce((n,f)=>n+f.exportFees,0));a(S.stats.sink.exportFee>0);a(S.player.led.exp.tax>0);near(S.player.led.exp.exportFee,S.player.led.inc.sales*.08);near(S.player.wallet.sar,500000);
 const saved=E.loadChecked(E.save(S));a(saved.ok);a(saved.S.player.factories.every(f=>f.export===true));
 const T=E.load(E.save(S)),U=E.load(E.save(S));for(const f of U.player.factories)f.export=false;E.STORAGE.export=false;
 for(let i=0;i<fs.length;i++){E.factoryDay(T,T.player.factories[i]);E.factoryDay(U,U.player.factories[i]);}for(const f of T.player.factories)f.export=false;a.equal(E.save(T),E.save(U),'التصدير المعطّل يعيد نفس الإنتاج والحسابات دون بيع');a(!A.setFactoryExport(S,fs[0].id,true).ok);E.STORAGE.export=true;
}
// D4:8 أصول، يدير6، ثم8 بعد الترقية؛ إنذار أسبوعي ومضاعفات بلا تراكم وتنزيل.
{
 const S=fresh(),p=S.player.props.riyadh;for(let i=0;i<2;i++)a(A.buildShop(S,'riyadh').ok);for(let i=0;i<3;i++)a(A.buildWarehouse(S,'riyadh').ok);a(A.buildFactory(S,'riyadh','perfume').ok);a(A.buildFarm(S,'riyadh').ok);a.equal(E.teamAssets(S,'riyadh').length,8);
 p.mgr={rank:3,lv:2,id:999,wage:35,days:90,span:6,policy:{pay:false,restock:false,pricing:false,report:false,limit:0,every:'daily'}};
 const all=E.stewardOrderedAssets(S,'riyadh');a.equal(all.filter(x=>E.stewardCovers(S,'riyadh',x)).length,6);a(!E.mgrOk(S,'riyadh',p,S.player.factories[0]));a(E.mgrOk(S,'riyadh',p));
 for(let d=0;d<8;d++){E.tick(S,false);S.pause=false;}a.equal(S.news.filter(n=>/أمينك يدير أقدم/.test(n.t)).length,2);
 const wages=[49,66.5,91];for(const wage of wages){a(A.stewardSpanUp(S,'riyadh').ok);near(E.managerWage(p.mgr),wage);}a(!A.stewardSpanUp(S,'riyadh').ok);a.equal(E.stewardSpan(p.mgr),40);a(E.mgrOk(S,'riyadh',p,S.player.factories[0]));
 a(E.loadChecked(E.save(S)).ok);const loaded=E.load(E.save(S));a.equal(E.stewardSpan(loaded.player.props.riyadh.mgr),40);near(E.managerWage(loaded.player.props.riyadh.mgr),91);
 for(let i=0;i<3;i++)a(A.stewardSpanDown(S,'riyadh').ok);a(!A.stewardSpanDown(S,'riyadh').ok);near(E.managerWage(p.mgr),35);
 E.STEWARD.partial=false;a(!E.mgrOk(S,'riyadh',p));a(!A.stewardSpanUp(S,'riyadh').ok);E.STEWARD.partial=true;
}
// الحفظ القديم والحقول الاختيارية والتبديل لا يفقد الأصول أو الترقيات.
{
 const S=fresh();delete S.player.props.riyadh.assetOrder;const raw=E.save(S),r=E.loadChecked(raw);a(r.ok);a.equal(r.S.player.props.riyadh.whUp,undefined);a.equal(r.S.player.props.riyadh.assetOrder,undefined);a.equal(r.S.player.factories.length,0);
 const T=fresh();T.player.props.riyadh.whUp=99;T.player.props.riyadh.assetOrder=['__proto__','shop:999'];a(A.buildFactory(T,'riyadh','perfume').ok);T.player.factories[0].export='yes';const V=E.load(E.save(T));a.equal(V.player.props.riyadh.whUp,undefined);a.equal(V.player.factories[0].export,undefined);
 E.STORAGE.load=false;const before=E.save(S);a(!A.loadFromStore(S,1,'perfume',1).ok);a.equal(E.save(S),before);E.STORAGE.load=true;
}
console.log('PASS storage-flow: paid capacity, bounded transfer and real foreign-city sale, shared production/export/tax/fee/cost,6-of8 scope/up/down/warning, rollback and old saves');
