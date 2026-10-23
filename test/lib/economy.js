'use strict';
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const SCENARIOS=['captain1','auto','shops3','factory','farm'];
const SEEDS=Array.from({length:40},(_,i)=>i+1),PORTFOLIO_SEEDS=SEEDS.slice(0,20),YEARS=12;
function setup(E,seed,scenario){
 const A=E.A,S=E.newGame(seed);A.learnSetChar(S,'trader');S.phase=3;S.player.gold=20000;S.noEvents=true;S.learn.level=11;S.learn.stage=23;S.learn.stageIntro=22;
 if(['captain1','auto'].includes(scenario))for(let i=0;i<(scenario==='auto'?3:1);i++){if(!A.hireCaptain(S).ok)throw Error('captain');const c=S.player.caravans.at(-1);c.captain.role='indep';c.captain.home='sa';}
 if(scenario==='shops3'){const c=S.cities.riyadh,goods=E.GIDS.filter(g=>E.sells(c,g)&&!E.GD[g].sp&&!E.GD[g].live).sort((a,b)=>c.dem[b]*E.unitPrice(c,b)-c.dem[a]*E.unitPrice(c,a)).slice(0,4);for(let i=0;i<3;i++)A.buildShop(S,'riyadh');for(const sh of E.shopsOf(S,'riyadh'))for(const g of goods)A.shopSetItem(S,'riyadh',sh.id,g,E.SHOP_PRICE0,true);A.hireFill(S,'riyadh');}
 if(scenario==='factory'){A.buildShop(S,'riyadh');A.buildWarehouse(S,'riyadh');if(!A.buildFactory(S,'riyadh','perfume').ok)throw Error('factory');}
 if(scenario==='farm'){const car=S.player.caravans[0];A.buildShop(S,'riyadh');if(!A.buildFarm(S,'riyadh').ok)throw Error('farm');for(const w of [...E.staffOf(S,'riyadh')])if(w.role==='seller')A.fireStaff(S,'riyadh',w.id);A.hireHerder(S,car.id);const r=A.buy(S,car.id,'sheep',20,'herd');if(!r.ok||r.n!==20||!A.farmIn(S,car.id,'sheep',20).ok)throw Error('real herd purchase');A.fireHerder(S,car.id);}
 return S;
}
function stepSector(E,S,scenario,d){const A=E.A,car=S.player.caravans[0];let sold=0;
 if(scenario==='direct')E.botMain(S);
 if(scenario==='factory'){A.fromStore(S,car.id,'perfume',1000);if(car.cargo.perfume>=1)A.sell(S,car.id,'perfume',car.cargo.perfume);}
 if(scenario==='farm'&&d%7===0){const f=E.farmOf(S,'riyadh'),n=Math.floor(E.youngOf(f,'sheep'));if(n){const r=A.farmSell(S,'riyadh','sheep',n,'young');if(r.ok)sold+=r.n;}A.fromStore(S,car.id,'wool',1000);if(car.cargo.wool>=1)A.sell(S,car.id,'wool',car.cargo.wool);}
 return sold;
}
function sector(E,{seed,years=YEARS,scenarios=SCENARIOS}){
 const result={seed,years,on:{},off:{},youngSold:[0,0]};
 for(const scenario of scenarios){const S=setup(E,seed,scenario),T=E.load(E.save(S));T.noClimate=true;delete T.climate;E.climateInit(T);
  const worlds=[S,T],before=worlds.map(W=>E.netWorth(W)),sold=[0,0];
  for(let d=0;d<years*354;d++)for(const [i,W]of worlds.entries()){sold[i]+=stepSector(E,W,scenario,d);E.tick(W,false);W.pause=false;}
  for(const [i,W]of worlds.entries()){const value=(E.netWorth(W)-before[i])/years;if(!Number.isFinite(value))throw Error('nonfinite '+scenario);result[i?'off':'on'][scenario]=value;}
  if(scenario==='farm'){result.youngSold=sold;if(sold.some(n=>n<=0))throw Error('no actual births/sales');}
 }
 return result;
}
function portfolio(E,{seed,years=YEARS}){
 const A=E.A,S=E.newGame(seed);A.chooseStart(S,'sa');A.learnSetChar(S,'trader');S.learn.level=11;S.learn.stage=23;S.learn.stageIntro=22;S.phase=4;S.player.gold=1e6;S.noEvents=true;S.bosses.riyadh.craft=true;
 for(const city of ['riyadh','cairo','isfahan','delhi','xian']){A.buildShop(S,city);const sh=S.player.props[city].shops[0];for(let n=0;n<4;n++)A.shopQuick(S,city,sh.id);A.buildWarehouse(S,city);A.hireFill(S,city);}
 A.buildFarm(S,'riyadh');A.hireStaff(S,'riyadh','farmer');A.buildButcher(S,'riyadh');S.player.props.riyadh.farm.herd={sheep:20,goat:8};S.player.props.riyadh.farm.hx={sheep:{m:5,y:0,b:0},goat:{m:2,y:0,b:0}};
 if(!A.buildFactory(S,'cairo','perfume').ok)throw Error('factory');A.hireManager(S,'cairo',3);S.player.factories[0].set={minBal:1000,maxBuy:2,sell:'now'};
 for(let i=0;i<2;i++){A.hireCaptain(S);const c=S.player.caravans.at(-1);c.captain.role='indep';c.captain.home='sa';}
 const T=E.load(E.save(S));T.noClimate=true;delete T.climate;E.climateInit(T);const totals=[Object.fromEntries(E.CLIMATE_SECTORS.map(k=>[k,0])),Object.fromEntries(E.CLIMATE_SECTORS.map(k=>[k,0]))];
 for(let d=0;d<years*354;d++)for(const [i,W]of[S,T].entries()){
  if(d%7===0)A.auditCity(W,'cairo');if(d%30===0){const f=W.player.props.riyadh.farm;if(f.herd.sheep>15)A.cutMeat(W,'riyadh','sheep',1);if(f.herd.goat>10)A.farmSell(W,'riyadh','goat',1);}
  if(W.zakat.due)A.zakatPay(W);const car=W.player.caravans[0];if(!car.left)for(const g of Object.keys(car.cargo))if(car.cargo[g]>=1)A.sell(W,car.id,g,car.cargo[g]);if(!car.left){const back=car.city==='riyadh';A.buy(W,car.id,back?'dates':'wool',10);A.travel(W,car.id,back?'hail':'riyadh');}
  E.tick(W,false);if(W.day%354===0)for(const k of E.CLIMATE_SECTORS)totals[i][k]+=W.climate.hist[0].income[k];
 }
 const factors=Array.from({length:years},(_,y)=>Object.values(E.climateRoll(S,y).cur)).flat(),mean=factors.reduce((a,b)=>a+b)/factors.length;
 return {seed,years,on:totals[0],off:totals[1],std:Math.sqrt(factors.reduce((a,b)=>a+(b-mean)**2,0)/factors.length)};
}
async function cohort(kind,{seeds=SEEDS,years=YEARS,scenarios,workers=4}={}){const results=new Array(seeds.length);let cursor=0;await Promise.all(Array.from({length:Math.min(workers,seeds.length)},async()=>{while(cursor<seeds.length){const i=cursor++;results[i]=await new Promise((resolve,reject)=>{const w=new Worker(__filename,{workerData:{kind,seed:seeds[i],years,scenarios}});let done=false;w.once('message',r=>{done=true;resolve(r);});w.once('error',reject);w.once('exit',code=>{if(code||!done)reject(Error('economy worker exit '+code));});});}}));return results;}
function average(rows){const keys=Object.keys(rows[0].on),on={},off={},drift={};for(const k of keys){on[k]=rows.reduce((n,r)=>n+r.on[k],0)/rows.length;off[k]=rows.reduce((n,r)=>n+r.off[k],0)/rows.length;drift[k]=(on[k]-off[k])/Math.max(1,Math.abs(off[k]));}return{on,off,drift};}
module.exports={SCENARIOS,SEEDS,PORTFOLIO_SEEDS,YEARS,sector,portfolio,cohort,average};
if(!isMainThread&&require.main===module){const E=require('../../src/engine.js'),result=workerData.kind==='portfolio'?portfolio(E,workerData):sector(E,workerData);if(process.env.ECONOMY_REPORT_PATH)require('node:fs').appendFileSync(process.env.ECONOMY_REPORT_PATH+'.progress',JSON.stringify(result)+'\n');parentPort.postMessage(result);}
