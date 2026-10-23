'use strict';
const assert=require('node:assert/strict'),E=require('../src/engine.js'),A=E.A;
function fresh(seed=5){const S=E.newGame(seed);A.learnSetChar(S,'trader');S.learn.level=11;S.learn.stage=23;S.phase=4;S.player.gold=1e6;return S;}
function at(S,day){S.day=day;E.climateDay(S);return S.climate;}
{
 const S=fresh(),seed=S.seed,rng=S.seedB;let vals=[];
 for(let year=0;year<500;year++){const r=E.climateRoll(S,year),s=Object.values(r.cur),reg=Object.values(r.reg);assert(s.every(x=>x>=.75-1e-12&&x<=1.35+1e-12));assert(reg.every(x=>x>=.9-1e-12&&x<=1.15+1e-12));assert(Math.abs(s.reduce((a,b)=>a+b)/5-1)<1e-10);assert(Math.abs(reg.reduce((a,b)=>a+b)/5-1)<1e-10);assert.deepEqual(r,E.climateRoll(S,year));if(year)vals.push(...s);}
 assert(Math.sqrt(vals.reduce((a,b)=>a+(b-1)**2,0)/vals.length)>.08);assert.equal(S.seed,seed);assert.equal(S.seedB,rng);
 const r=E.climateRoll(S,7);S.seed+=123;assert.deepEqual(E.climateRoll(S,7),r,'لا يستمد المناخ بذرتَه من مولّد العالم المتغير');
 for(const k of E.CLIMATE_SECTORS)assert(Math.abs(Array.from({length:5},(_,y)=>E.climateRoll(S,y+1).cur[k]).reduce((a,b)=>a+b)/5-1)<1e-10,'متوسط القطاع متوازن عبر الدورة أيضاً');
 const C=at(S,354),before=E.climateFactor(S,'trade','riyadh');assert.equal(before,1);S.day+=15;const mid=E.climateFactor(S,'trade','riyadh');S.day+=15;const end=E.climateFactor(S,'trade','riyadh');assert(Math.abs(mid-(1+end)/2)<1e-12);assert(Math.abs(end-E.clamp(C.cur.trade*C.reg.sa,.7,1.5))<1e-12);
 S.noShocks=true;assert.equal(E.climateFactor(S,'trade','riyadh'),1);assert(Object.values(E.climateRoll(S,7).cur).every(x=>x===1));S.noShocks=false;assert.deepEqual(E.load(E.save(S)).climate,S.climate);
}
{
 const S=fresh();at(S,400);const car=S.player.caravans[0];car.cargo.wheat=10;car.basis.wheat={q:10,c:100};car.captain={role:'indep',trade:1,nav:1,combat:1,xp:0};car.route={a:'riyadh',b:'hail'};
 E.quoteSell(S,'riyadh','wheat',3);const before=E.save(S),q=E.quoteSell(S,'riyadh','wheat',3);assert.equal(E.save(S),before,'عرض البيع قراءة فقط');const sold=A.sell(S,car.id,'wheat',3);assert(sold.ok);assert(Math.abs(sold.net-q.net)<1e-8);assert.equal(S.player.trades[0].sector,'trade','بيع اللاعب يدوي حتى لو كانت القافلة بقائد ومسار');assert(Math.abs(S.climate.income.trade-q.net)<1e-8);
 assert.equal(E.climateFactor({...S,noShocks:true},'shops','riyadh'),1);S.climate.cur.trade=.8;S.climate.reg.sa=1;assert.equal(E.climateRisk(S,'trade','riyadh'),.7);assert.equal(E.climateShockRisk(S,'closure'),.7);assert.equal(E.climateShockRisk(S,'fair'),1);S.climate.cur.trade=1.1;assert.equal(E.climateRisk(S,'trade','riyadh'),1);
}
{
 const S=fresh();at(S,400);assert(A.hireCaptain(S).ok);const c=S.player.caravans.at(-1);c.captain.role='indep';c.captain.home='sa';c.cargo.wheat=3;c.basis.wheat={q:3,c:10};E.tick(S);assert(S.player.trades.some(t=>t.sector==='auto'));assert(S.climate.income.auto>0);assert.equal(c.tripSector,'auto','المسار المستقل يسجل نوع العملية عند الانطلاق');
 const manual=S.player.caravans[0];assert(A.travel(S,manual.id,'hail').ok);assert.equal(manual.tripSector,'trade');
}
{
 for(const qty of [1,10,50]){const S=fresh();at(S,400);S.climate.cur.trade=1.35;S.climate.reg.sa=1.15;const T=E.load(E.save(S));T.noClimate=true;
  const out=[];for(const W of [S,T]){const c=W.player.caravans[0],before=W.player.led.exp.purchases||0;assert(A.buy(W,c.id,'wheat',qty).ok);const cost=(W.player.led.exp.purchases||0)-before,q=E.quoteSell(W,c.city,'wheat',c.cargo.wheat),sold=A.sell(W,c.id,'wheat',c.cargo.wheat);assert(sold.ok);assert(Math.abs(sold.net-q.net)<1e-8);out.push({cost,net:sold.net});}
  if(out[1].net<=out[1].cost)assert(out[0].net<=out[0].cost+1e-8,'لا ربح دائري جديد من شراء السلعة وإعادة بيعها فوراً في أقوى مناخ');
 }
 const S=fresh();at(S,400);S.climate.cur.trade=1.35;S.climate.reg.sa=1;const net=E.climateSaleGross(S,'trade','riyadh',200,.1,100)*.9;assert(Math.abs(net-(100+80*1.35))<1e-10,'العامل على الربح الفعلي بعد تكلفة الشراء والضريبة');
}
{
 const S=fresh();at(S,400);S.climate.cur.trade=1.35;S.climate.reg.sa=1.15;assert(A.hireCaptain(S).ok);const c=S.player.caravans.at(-1);c.cargo.wheat=10;c.basis.wheat={q:10,c:500};const before=E.save(S),q=E.quoteSell(S,c.city,'wheat',3,1,null,'trade',50);assert.equal(E.save(S),before);const sold=A.sell(S,c.id,'wheat',3);assert(Math.abs(q.net-sold.net)<1e-8,'أساس تكلفة القافلة المعروضة لا أساس تكلفة القافلة الرئيسية');
}
{
 const S=fresh();at(S,400);S.climate.cur.trade=1.35;S.climate.reg.sa=1;const c=S.player.caravans[0];c.cargo.wheat=20;c.basis.wheat={q:10,c:100};const T=E.load(E.save(S));T.noClimate=true;const base=A.sell(T,c.id,'wheat',20),q=E.quoteSell(S,c.city,'wheat',20),sale=A.sell(S,c.id,'wheat',20);assert(Math.abs(sale.net-q.net)<1e-8);assert(Math.abs(sale.net-(base.net+Math.max(0,base.pl)*.35))<1e-8,'تكلفة السجل الفعلية لا تتضاعف عندما تزيد الكمية عن الكمية ذات التكلفة المسجلة');
}
{
 for(const city of ['riyadh','cairo','delhi','jeddah','aswan']){const S=fresh();A.buildShop(S,city);const sh=S.player.props[city].shops[0];for(let i=0;i<4;i++)assert(A.shopQuick(S,city,sh.id).ok);A.hireFill(S,city);const C=at(S,400);C.cur.shops=.75;C.reg[S.cities[city].country]=.9;let net=0;for(let d=0;d<30;d++){S.day++;E.shopsDay(S);net+=S.player.props[city].hist.at(-1).net;}assert(net>0,city+': الدكان الافتراضي موجب في أسوأ مناخ');}
}
{
 const receipts=[];
 for(const factor of [.75,1,1.35]){const S=fresh();A.buildShop(S,'riyadh');const sh=S.player.props.riyadh.shops[0];for(let i=0;i<4;i++)A.shopQuick(S,'riyadh',sh.id);A.hireFill(S,'riyadh');at(S,400);S.climate.cur.shops=factor;S.climate.reg.sa=1;const market=JSON.stringify(S.cities);for(let d=0;d<300;d++){S.cities=JSON.parse(market);E.shopsDay(S);}receipts.push(S.climate.income.shops);}
 assert(receipts[0]/receipts[1]>.7&&receipts[0]/receipts[1]<.8);assert(receipts[2]/receipts[1]>1.25&&receipts[2]/receipts[1]<1.45,'التعبئة تجاري الطلب النشط دون تخزين السلع الراكدة فوق الاحتياط');
}
{
 const S=fresh();A.buildShop(S,'riyadh');A.buildWarehouse(S,'riyadh');A.buildFarm(S,'riyadh');A.hireStaff(S,'riyadh','farmer');S.player.props.riyadh.farm.herd={sheep:20};S.player.props.riyadh.farm.hx={sheep:{m:5,y:0,b:0}};at(S,400);const T=E.load(E.save(S));T.noClimate=true;const factor=E.climateFactor(S,'farm','riyadh');for(const W of [S,T])E.farmDay(W,'riyadh',W.player.props.riyadh,W.cities.riyadh);const produced=W=>(W.player.props.riyadh.store.wool||0)+(W.player.props.riyadh.farm.acc.wool||0);assert(Math.abs(produced(S)/produced(T)-factor)<1e-10);
 const q=E.quoteSell(S,'riyadh','sheep',1,E.pedMulOf(S.player.props.riyadh.farm,'sheep'),null,'farm'),cash=S.player.gold;assert(A.farmSell(S,'riyadh','sheep',1).ok);assert(Math.abs(S.player.trades[0].net-q.net)<1e-8);assert.equal(S.player.trades[0].sector,'farm');assert.equal(S.climate.income.trade,0,'لا يُحتسب بيع المزرعة تجارة مباشرة');
}
{
 const S=fresh();A.buildShop(S,'riyadh');A.buildWarehouse(S,'riyadh');assert(A.buildFactory(S,'riyadh','perfume').ok);at(S,400);const T=E.load(E.save(S));T.noClimate=true;for(const W of [S,T])E.factoryDay(W,W.player.factories[0]);const a=S.player.props.riyadh.store.perfume,b=T.player.props.riyadh.store.perfume;assert(a>0&&b>0);assert(Math.abs(a/b-E.climateFactor(S,'factory','riyadh'))<1e-10);assert.equal(S.climate.income.factory,0,'الإنتاج المحفوظ ليس دخلاً نقدياً');
}
{
 const S=fresh();for(let y=0;y<7;y++){at(S,y*354+100);E.climateIncome(S,'trade',100+y);at(S,(y+1)*354);}assert.equal(S.climate.hist.length,5);const r=S.climate.hist[0];assert.equal(r.income.trade,106);assert.equal(r.previous.trade,105);assert(S.climate.pending.includes(r.year));A.climateClose(S,r.year);assert(!S.climate.pending.includes(r.year));const notice=S.climate.notices[0];A.climateRead(S,notice.id);assert(E.load(E.save(S)).climate.notices.find(n=>n.id===notice.id).read);assert(!E.load(E.save(S)).climate.pending.includes(r.year));
}
{
 const fs=require('node:fs'),approved=fs.readFileSync('docs/review/APPROVED_CLIMATE_TEXTS.md','utf8');
 const templates=[...approved.matchAll(/^\d+\. (.*\{sector\}.*)$/gm)].map(m=>m[1]);assert.equal(templates.length,6);const used=new Set();
 for(let year=1;year<=30;year++){const S=fresh();at(S,year*354+45);at(S,year*354+90);assert.equal(S.climate.notices.length,2);
 S.climate.notices.forEach((n,i)=>{const index=(year+E.CLIMATE_SECTORS.indexOf(n.sector))%3+i*3,t=templates[index];assert.equal(n.text,t.replace('{sector}',E.CLIMATE_NAMES[n.sector]));assert(!n.text.includes('TODO-REVIEW'));used.add(index);});}
 assert.equal(used.size,6,'الصيغ الست المعتمدة تصل فعلاً إلى أخبار اللاعب');
 assert.equal(new Set(E.STAGES.map(s=>s.title)).size,22);
 const bridges=fs.readFileSync('docs/review/batches/BRIDGES_PASTE.md','utf8');for(const st of E.STAGES){assert(st.bridge&&!st.bridge.includes('TODO-REVIEW'));assert(bridges.includes(st.title)&&bridges.includes(st.bridge));}
}
console.log('PASS deterministic bounded neutral climate, blending, regional effects, exact quotes, operation sectors, five safe shops, production, risks and persistent annual reports');
