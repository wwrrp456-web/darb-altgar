'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const box={module:{exports:{}},require:require('node:module').createRequire(require.resolve('../src/engine.js')),console};
const original=fs.readFileSync(path.join(__dirname,'fixtures/farm-day-before-014.txt'),'utf8');
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/engine.js'),'utf8').replace('const API = {','const originalFarmDay = '+original+';\nconst API = { originalFarmDay, farmBossBegin, farmBossEnd, '),box);
const E=box.module.exports,A=E.A,near=(x,y)=>a(Math.abs(x-y)<1e-7,`${x} != ${y}`),same=(x,y)=>a.equal(JSON.stringify(x),JSON.stringify(y));
function fresh(){const S=E.newGame(5);A.learnSetChar(S,'trader');S.noLock=1;S.learn.level=11;S.learn.stage=23;S.phase=3;S.noEvents=true;S.noShocks=true;S.player.gold=200000;a(A.buildShop(S,'riyadh').ok);a(A.buildWarehouse(S,'riyadh').ok);a(A.buildFarm(S,'riyadh').ok);return S;}
// D1: قافلة ثانية، الحدود، مخزن، شراء مباشر دون قافلة أو كبير رعاة.
{
 const S=fresh(),p=S.player.props.riyadh;a(A.hireCaptain(S).ok);const c=S.player.caravans.at(-1);a(!c.main);c.city='riyadh';c.herders=2;c.herd={najdi:20};c.hx={najdi:{m:5,p:6,y:2,b:0,mq:1,fq:1,yq:1}};c.basis.najdi={q:20,c:200};
 a(A.farmIn(S,c.id,'najdi',10).ok);near(p.farm.herd.najdi,10);near(p.farm.hx.najdi.m,2.5);near(p.farm.hx.najdi.p,3);near(c.hx.najdi.y,2);near(p.basis.najdi.c,100);a(A.farmOut(S,c.id,'najdi',4).ok);near(p.farm.herd.najdi,6);near(c.herd.najdi,14);near(c.hx.najdi.p,4.2);
 const cost=p.basis.najdi.c;a(A.farmToStore(S,'riyadh','najdi',3).ok);near(p.store.najdi,3);near(p.storeHx.najdi.p,.9);near(p.basis.najdi.c,cost);a(A.farmFromStore(S,'riyadh','najdi',2).ok);near(p.store.najdi,1);near(p.farm.herd.najdi,5);near(p.basis.najdi.c,cost);
 const before=S.player.gold;S.player.caravans.forEach(x=>x.city='hail');a(A.farmBuy(S,'riyadh','najdi',5).ok);a(S.player.gold<before);a(!S.player.chiefs);near(p.farm.herd.najdi,10);
 for(const op of [()=>A.farmIn(S,c.id,'najdi',2),()=>A.farmOut(S,c.id,'najdi',2),()=>A.farmFromStore(S,'riyadh','silk',2),()=>A.farmToStore(S,'riyadh','najdi',NaN),()=>A.farmBuy(S,'riyadh','najdi',Infinity)]){const raw=E.save(S);a(!op().ok);a.equal(E.save(S),raw);}
 c.city='riyadh';c.left=1;a(!A.farmIn(S,c.id,'najdi',2).ok);a(!A.farmOut(S,c.id,'najdi',2).ok);c.left=0;c.herders=0;a(!A.farmOut(S,c.id,'najdi',20).ok);
 const T=E.loadChecked(E.save(S));a(T.ok);same(T.S.player.props.riyadh.storeHx,p.storeHx);
}
// الحمل والسلالة والهجين، والسعة المادية للمخزن والمزرعة بلا استنساخ.
{
 const S=fresh(),p=S.player.props.riyadh,f=p.farm;f.herd.horse=4;f.hx.horse={m:1,p:2,y:1,b:0,mq:4,fq:3,yq:2};p.basis.horse={q:4,c:1000};a(A.farmToStore(S,'riyadh','horse',2).ok);a(A.farmFromStore(S,'riyadh','horse',2).ok);near(f.herd.horse,4);near(f.hx.horse.m,1);near(f.hx.horse.p,2);near(f.hx.horse.mq,4);near(f.hx.horse.fq,3);near(f.hx.horse.y,1);near(p.basis.horse.c,1000);a(A.farmToStore(S,'riyadh','horse',2).ok);p.store.horse=1;a(A.farmFromStore(S,'riyadh','horse',1).ok);near(f.herd.horse,3);near(f.hx.horse.m,.75);near(f.hx.horse.p,1.5);
 p.store.wheat=E.storeCap(S,'riyadh')/E.GD.wheat.w;const raw=E.save(S);a(!A.farmToStore(S,'riyadh','horse',1).ok);a.equal(E.save(S),raw);
 p.store.wheat=0;p.store.najdi=1000;const r=A.farmFromStore(S,'riyadh','najdi',1000);a(r.ok);a(E.farmUnits(f)<=E.farmCap(S,'riyadh')+1e-7);
}
// D3: المعاينة لا تمس الحفظ، والتكلفة والسعة والاحتياج عند الامتلاء.
{
 const S=fresh(),raw=E.save(S),q=E.farmUpQuote(S,'riyadh');a(q.ok);a.equal(E.save(S),raw);a.equal(q.cost,3000);a.equal(q.capacity,64);a.equal(q.need,2);a.equal(q.have,1);a.equal(q.extra,1);near(q.daily,q.wages+q.upkeep);a(A.upgradeFarm(S,'riyadh').ok);a.equal(E.farmCap(S,'riyadh'),q.capacity);a(A.upgradeFarm(S,'riyadh').ok);a(!E.farmUpQuote(S,'riyadh').ok);
}
// D4: cap سقف الموجودين، لا سقف يومي ولا تسريح ضمني؛ تقرير7 أيام فعلي.
{
 const S=fresh(),p=S.player.props.riyadh;A.upgradeFarm(S,'riyadh');A.upgradeFarm(S,'riyadh');p.farm.herd.najdi=80;p.farm.hx.najdi={m:20,p:10,y:0,b:3,mq:1,fq:1,yq:1};p.basis.najdi={q:80,c:800};p.store.najdi=3;
 const money=S.player.gold;a(A.hireFarmBoss(S,'riyadh',2).ok);near(money-S.player.gold,1200);const boss=E.farmBossOf(S,'riyadh');a.equal(boss.wage,20);a(!A.hireFarmBoss(S,'riyadh',3).ok);
 E.tick(S,false);a.equal(E.staffOf(S,'riyadh').filter(w=>w.role==='farmer').length,2);a.equal(boss.hired,1);a((p.store.najdi||0)<3);a.equal(boss.reports.length,0);
 a(A.setFarmBossCap(S,'riyadh',1).ok);E.tick(S,false);a.equal(E.staffOf(S,'riyadh').filter(w=>w.role==='farmer').length,2,'خفض السقف لا يسرّح');a(A.setFarmBossCap(S,'riyadh',3).ok);E.tick(S,false);a.equal(E.staffOf(S,'riyadh').filter(w=>w.role==='farmer').length,3);a.equal(boss.hired,2);
 for(let i=3;i<7;i++)E.tick(S,false);a.equal(boss.reports.length,1);const r=boss.reports[0];a.equal(r.days,7);a(r.born>=3);a(r.expenses>=7*20+7*12);a.equal(r.hired,2);a(r.moved>=1);near(r.profit,r.revenue-r.cost-r.expenses);a(S.news.some(n=>n.t.includes('تقرير رئيس المزرعة')));
 a(A.farmSell(S,'riyadh','najdi',1).ok);a(boss.week.revenue>0);const loaded=E.loadChecked(E.save(S));a(loaded.ok);a.equal(loaded.S.player.props.riyadh.farmBoss.cap,3);a.equal(loaded.S.player.props.riyadh.farmBoss.reports.length,1);
 const before=E.save(S);a(!A.setFarmBossCap(S,'riyadh',-1).ok);a.equal(E.save(S),before);
 E.FARM_BOSS.on=false;const snapshot=E.save(boss),cash=S.player.gold;E.farmBossBegin(S,'riyadh');E.farmBossEnd(S,'riyadh');a.equal(E.save(boss),snapshot);near(S.player.gold,cash);a(!A.hireFarmBoss(S,'riyadh',2).ok);E.FARM_BOSS.on=true;
}
// الأجر المتأخر باقٍ عند التحميل، ولا يُحذف بتسريح الرئيس.
{
 const S=fresh();a(A.hireFarmBoss(S,'riyadh',1).ok);S.player.wallet.sar=0;S.day++;E.farmBossBegin(S,'riyadh');const m=E.farmBossOf(S,'riyadh');a(m.late>0);a(S.paymentDues.some(d=>d.kind==='farmBoss'));a(!A.fireFarmBoss(S,'riyadh').ok);const T=E.loadChecked(E.save(S));a(T.ok);a(T.S.paymentDues.some(d=>d.kind==='farmBoss'));T.S.player.gold=1000;const id=T.S.paymentDues.find(d=>d.kind==='farmBoss').id;a(A.settlePayment(T.S,id).ok);a(A.fireFarmBoss(T.S,'riyadh').ok);const U=E.load(E.save(S));a(A.sellAsset(U,'riyadh','farm',0).ok);a(!U.player.props.riyadh.farmBoss);a(!U.paymentDues.some(d=>d.kind==='farmBoss'));
}
// الإدارة التلقائية لا تستخدم مسار استبدال عامل آخر حين يكتمل سوق العمل.
{const S=fresh(),p=S.player.props.riyadh;A.upgradeFarm(S,'riyadh');A.upgradeFarm(S,'riyadh');p.farm.herd.najdi=80;while(E.hirePool(S,'riyadh')>0)a(A.hireStaff(S,'riyadh','seller').ok);a(A.hireFarmBoss(S,'riyadh',4).ok);const ids=JSON.stringify(p.staff.map(w=>w.id));S.day++;E.farmBossBegin(S,'riyadh');a.equal(JSON.stringify(p.staff.map(w=>w.id)),ids);a.equal(p.farmBoss.hired,0);}
// مقارنة التنفيذ السابق: الإنتاج والتكاثر والنفوق والعشوائية كما هي تماماً.
for(const observe of [false,true]){
 const S=fresh(),p=S.player.props.riyadh;p.farm.herd.najdi=12;p.farm.hx.najdi={m:3,p:6,y:2,b:0,mq:1,fq:1,yq:1};if(observe)p.farmBoss={wage:20,cap:0,hired:0,reports:[]};
 const T=E.load(E.save(S));E.FARM_BOSS.on=observe;
 for(let d=1;d<=90;d++){S.day=T.day=d;E.farmDay(S,'riyadh',p,S.cities.riyadh);E.originalFarmDay(T,'riyadh',T.player.props.riyadh,T.cities.riyadh);same(p.farm,T.player.props.riyadh.farm);same(p.store,T.player.props.riyadh.store);same(p.basis,T.player.props.riyadh.basis);a.equal(S.seed,T.seed);near(S.player.gold,T.player.gold);}
 E.FARM_BOSS.on=true;
}
{
 const S=fresh();a.equal(S.player.props.riyadh.farmBoss,undefined);a(E.loadChecked(E.save(S)).ok);E.FARM_MANAGE.on=false;const raw=E.save(S);a(!A.farmBuy(S,'riyadh','najdi',1).ok);a.equal(E.save(S),raw);E.FARM_MANAGE.on=true;
}
console.log('PASS farm-manage: second caravan, warehouse/pregnancy/pedigree/cost/capacity, direct buy, pure expansion preview, worker count cap,7day reports and arrears, old saves/off,90day exact old-formula comparison');
