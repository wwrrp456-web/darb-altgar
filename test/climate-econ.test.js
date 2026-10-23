// محفظة موزعة على الدول الخمس، مع مسار يدوي ثابت وقائدين مستقلين ومزرعة ومصنع.
// محاكاة كاملة للسوق 4248 يوماً بلا إعادة ضبط الأسواق أو المعاملات أو الأرصدة أثناء اللعب.
// القياس للمقبوضات الفعلية بعد رسوم البيع، لا لصافي الأرباح ولا لقيمة المخزون.
const assert=require('node:assert/strict');
const E=require('../src/engine.js'),A=E.A;
function setup(){const S=E.newGame(5);A.chooseStart(S,'sa');A.learnSetChar(S,'trader');S.learn.level=11;S.learn.stage=23;S.learn.stageIntro=22;S.phase=4;S.player.gold=1e6;S.noEvents=true;S.bosses.riyadh.craft=true;
for(const city of ['riyadh','cairo','isfahan','delhi','xian']){A.buildShop(S,city);const sh=S.player.props[city].shops[0];for(let n=0;n<4;n++)A.shopQuick(S,city,sh.id);A.buildWarehouse(S,city);A.hireFill(S,city);}
A.buildFarm(S,'riyadh');A.hireStaff(S,'riyadh','farmer');A.buildButcher(S,'riyadh');S.player.props.riyadh.farm.herd={sheep:20,goat:8};S.player.props.riyadh.farm.hx={sheep:{m:5,y:0,b:0},goat:{m:2,y:0,b:0}};
assert(A.buildFactory(S,'cairo','perfume').ok);A.hireManager(S,'cairo',3);const f=S.player.factories[0];f.set={minBal:1000,maxBuy:2,sell:'now'};for(let i=0;i<2;i++){A.hireCaptain(S);const c=S.player.caravans.at(-1);c.captain.role='indep';c.captain.home='sa';}return S;}
const S=setup(),T=E.load(E.save(S));T.noClimate=true;delete T.climate;E.climateInit(T);const totals=[E.CLIMATE_SECTORS.map(()=>0),E.CLIMATE_SECTORS.map(()=>0)];
for(let d=0;d<12*354;d++){for(const [i,W]of[S,T].entries()){if(d%7===0)A.auditCity(W,'cairo');if(d%30===0){const f=W.player.props.riyadh.farm;if(f.herd.sheep>15)A.cutMeat(W,'riyadh','sheep',1);if(f.herd.goat>10)A.farmSell(W,'riyadh','goat',1);}if(W.zakat.due)A.zakatPay(W);const mc=W.player.caravans[0];if(!mc.left)for(const g of Object.keys(mc.cargo))if(mc.cargo[g]>=1)A.sell(W,mc.id,g,mc.cargo[g]);if(!mc.left){const at=mc.city,back=at==='riyadh',good=back?'dates':'wool';A.buy(W,mc.id,good,10);A.travel(W,mc.id,back?'hail':'riyadh');}E.tick(W);if(W.day%354===0){const row=W.climate.hist[0];for(const [j,k]of E.CLIMATE_SECTORS.entries())totals[i][j]+=row.income[k];}}if(d%354===353)console.log('year',(d+1)/354);}
const drift=totals[0].reduce((a,b)=>a+b)/totals[1].reduce((a,b)=>a+b)-1;
assert(totals.flat().every(x=>Number.isFinite(x)&&x>0),'المحفظتان تحققان دخلاً فعلياً من القطاعات الخمسة');
const factors=Array.from({length:12},(_,y)=>Object.values(E.climateRoll(S,y).cur)).flat(),mean=factors.reduce((a,b)=>a+b)/factors.length,std=Math.sqrt(factors.reduce((a,b)=>a+(b-mean)**2,0)/factors.length);
console.log(JSON.stringify({years:12,seed:5,totals,drift,std}));assert(Math.abs(drift)<=.05,'انحراف دخل المحفظة المتنوعة عبر 12 سنة ضمن 5%');assert(std>.08);console.log('PASS twelve actual simulation years, five income sectors, diversified income within 5% and visible annual variance');
