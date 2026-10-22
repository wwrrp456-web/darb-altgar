// رحلة محرك عبر المراحل العمرية بأفعالها الحقيقية؛ دعم الرصيد هنا لتغطية انتظار السنين، وليس قياس توازن.
'use strict';
const assert=require('node:assert/strict'),E=require('../src/engine.js'),A=E.A,S=E.newGame(7);A.learnSetChar(S,'trader');S.learn.abroad=true;A.debtPlan(S,true);
const car=()=>S.player.caravans[0];let shopCity,shopId;
function arrive(){for(let n=0;car().left>0&&n<100;n++){E.tick(S);S.pause=false}assert.equal(car().left,0)}
function trade(foreign,mixed){
 const c=car(),here=S.cities[c.city];let best;
 for(const g of E.GIDS){if(g==='wheat'||E.GD[g].live||!E.sells(here,g))continue;const buy=E.quoteBuy(S,c.city,g,10,S.player.gold*.6);if(!buy.n)continue;
  const sale=E.sellOptions(S,c.city,g,buy.n,buy.avg,c).find(o=>!E.travelBlock(S,c,o.city)&&(!foreign||o.country!==here.country));if(sale&&(!best||sale.profit>best.sale.profit))best={g,buy,sale};
 }
 if(!best){A.work(S);E.tick(S);return}
 assert(A.buy(S,c.id,best.g,best.buy.n).ok);
 if(mixed)for(const g of E.GIDS){if(g!==best.g&&E.sells(here,g)&&A.buy(S,c.id,g,2).ok)break}
 assert(A.travel(S,c.id,best.sale.city).ok);arrive();for(const g of Object.keys(c.cargo))if(c.cargo[g]>=1)A.sell(S,c.id,g,9999);
}
for(let expected=1;expected<=22;expected++){
 const st=E.stageOf(S);assert.equal(st.n,expected);const status=E.stageStatus(S);S.player.gold+=status.days*15+10000;
 for(let n=0;n<status.days;n++){A.work(S);E.tick(S);S.pause=false}
 S.learn.stageIntro=expected;E.learnCheck(S);
 for(let attempt=0;E.stageOf(S)?.n===expected&&attempt<50;attempt++){
  const n=expected,c=car();
  if(n<=5)trade(n===4,n===5);
  else if(n===6){A.exchange(S,'sar','usd',50);trade(true,false)}
  else if(n===7){E.tick(S);shopCity=c.city;assert(A.buildShop(S,shopCity).ok);shopId=S.player.props[shopCity].shops[0].id}
  else if(n===8){assert(A.shopQuick(S,shopCity,shopId).ok)}
  else if(n===9){E.tick(S)}
  else if(n<=12){let done=false;for(const city of S.order)for(const type of Object.keys(E.PACTS))if(!done&&!E.pactBlock(S,city,type)&&A.signPact(S,city,type).ok)done=true;assert(done)}
  else if(n<=15){let done=false;for(const city of S.order)for(const g of E.GIDS)if(!done&&g!=='wheat'&&E.agentQuote(S,city,g,5).ok&&A.agentBuy(S,city,g,5).ok)done=true;assert(done)}
  else if(n===16||n===18){S.player.gold+=100000;S.phase=4;S.cities[c.city].stock.wheat=1000;if(n===16||(S.learn.ev.murabaha||0)<2)assert(A.murabaha(S,'wheat',5,30).ok);if(n===18)assert(A.settle(S).ok)}
  else if(n===17){if(E.bankDebt(S))assert(A.settle(S).ok)}
  else if(n===19){S.player.gold+=100000;E.tick(S)}
  else if(n===20){S.player.gold=Math.max(S.player.gold,(S.zakat.amount||0)+10000);if(!S.zakat.due)E.tick(S);if(S.zakat.due)assert(A.zakatPay(S,S.zakat.amount).ok)}
  else if(n===21){S.player.gold+=500000;S.phase=4;assert(A.invest(S,c.city,300000).ok);for(let d=0;d<32;d++)E.tick(S)}
  else {S.player.gold+=2000;if(S.player.famDebt.left>0)assert(A.debtPay(S,1500).ok)}
  E.learnCheck(S);
 }
 assert((S.learn.stageDone||[]).includes(expected),'لم تكتمل المرحلة '+expected);console.log('OK stage',expected,'age',E.ageOf(S).toFixed(2));
}
assert.equal(S.learn.level,11);assert.deepEqual(S.learn.stageDone,Array.from({length:22},(_,i)=>i+1));console.log('22 stages completed by real trade, property, partnership, agency, finance and zakat actions: PASS');
