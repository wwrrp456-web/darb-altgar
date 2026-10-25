#!/usr/bin/env node
'use strict';
// قياس محدود مستقل؛ يستخدم اقتراح الواجهة نفسه دون DOM أو نسخ خوارزميته.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const E=require('../src/engine.js'),root=path.resolve(__dirname,'..');
const sources=['src/engine.js','src/ui/05-scenes-deals.js','src/ui/10f-early-qard.js','src/ui/15-render.js','scripts/measure-early-qard.js'];
const fingerprint=()=>crypto.createHash('sha256').update(sources.map(f=>fs.readFileSync(path.join(root,f))).join('\n')).digest('hex');
function advisor(S){const noop=()=>{},context=vm.createContext({S,E,GD:E.GD,GIDS:E.GIDS,CD:E.CD,main:()=>S.player.caravans[0],$:()=>({addEventListener:noop}),document:{addEventListener:noop},window:{addEventListener:noop}});for(const f of ['src/ui/05-scenes-deals.js','src/ui/10f-early-qard.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});const code=fs.readFileSync(path.join(root,'src/ui/15-render.js'),'utf8');vm.runInContext(code.slice(code.indexOf('function tripPlan('),code.indexOf('function dealGoNow(')),context);return {novice:()=>context.earlyQardDeal(),skilled:()=>context.deals()};}
function setup(seed,paired){const S=E.newGame(seed);E.A.learnSetChar(S,'trader');Object.assign(S.learn,{level:3,intro:3,free:false,stageDone:E.STAGES.map(s=>s.n),tab:Object.keys(E.BAB.TABLETS)});S.player.famDebt.left=0;S.player.famDebt.plan=false;S.player.wallet={sar:paired?2000:0,usd:0,au:0,ag:0};S.player.vault=paired?0:2000;S.phase=1;S.noEvents=true;return S;}
function simulate(seed,kind,days,loanCount,paired=false){const S=setup(seed,paired),ad=advisor(S),car=S.player.caravans[0],before=E.netWorth(S);let issued=0,trades=0,profit=0,firstPaid=null,waits=0;const loan=()=>S.player.bank.loans.find(l=>l.src==='salem');
 for(let day=0;day<days;day++){
  if(!car.left){for(const g of Object.keys(car.cargo))if(car.cargo[g]>=1){const r=E.A.sell(S,car.id,g,car.cargo[g]);if(r.ok){trades++;profit+=r.pl||0;}}
   const l=loan();if(l&&trades>0&&S.player.wallet.sar>=l.amt){E.A.repayEarlyQard(S);if(!loan()&&firstPaid===null)firstPaid=S.day;}
   if(!loan()&&issued<loanCount){const r=E.A.earlyQard(S,2000);if(r.ok)issued++;}
   let d;if(kind==='novice'&&loan())d=ad.novice();else {const o=ad.skilled()[0];if(o)d={g:o.g,d:o.d,q:o.q};}
   if(d){const r=E.A.buy(S,car.id,d.g,d.q);if(r.ok){const trip=E.A.travel(S,car.id,d.d);if(!trip.ok)throw Error('trip: '+trip.msg);}}else waits++;
  }
  E.tick(S,false);S.pause=false;
 }
 const history=S.player.salemQard?.history||[];if(firstPaid===null&&history[0]?.onTime)firstPaid=history.at(-1).paidAt;
 return {seed,kind,days,issued,firstPaid,paidIn90:firstPaid!==null&&firstPaid<=90,remaining:loan()?.amt||0,trades,profit,waits,startWorth:before,endWorth:E.netWorth(S),vault:S.player.vault,history};
}
async function main(){if(process.argv.length>2)throw Error('قياس ثابت:8بذور،90يوماً للسداد و354يوماً للمقارنة، بلا خيارات توسعة.');const file=path.join(root,'docs/review/EARLY_QARD_TASK25.json'),hash=fingerprint();if(fs.existsSync(file)){const old=JSON.parse(fs.readFileSync(file));if(old.fingerprint===hash){console.log('المصدر مطابق؛ استُعمل القياس المحفوظ.');return;}}
 const rows=[];for(let seed=1;seed<=8;seed++){const row={seed,skilled:simulate(seed,'skilled',90,1),novice:simulate(seed,'novice',90,1),twoLoans:simulate(seed,'skilled',354,2,true),noLoan:simulate(seed,'skilled',354,0,true)};row.advantage=(row.twoLoans.endWorth-row.noLoan.endWorth)/Math.max(1,Math.abs(row.noLoan.endWorth));rows.push(row);console.log(JSON.stringify({seed,skilled:row.skilled.firstPaid,novice:row.novice.firstPaid,advantage:row.advantage}));await new Promise(r=>setTimeout(r,0));}
 if(hash!==fingerprint())throw Error('تغير المصدر أثناء القياس');const skilledRate=rows.filter(r=>r.skilled.paidIn90).length/8,noviceRate=rows.filter(r=>r.novice.paidIn90).length/8,meanAdvantage=rows.reduce((n,r)=>n+r.advantage,0)/8;const report={task:25,measuredAt:new Date().toISOString(),fingerprint:hash,scope:'isolated level3 trade economy; vault2000/cash0 for repayment, cash2000/vault0 for paired comparison; no family debt, no lesson/tablet grants; noEvents suppresses story choices; climate and world simulation remain active',seeds:[1,2,3,4,5,6,7,8],repaymentDays:90,pairedDays:354,targets:{skilled:.9,novice:.7,meanAdvantage:.15},skilledRate,noviceRate,meanAdvantage,acceptance:{skilled:skilledRate>=.9,novice:noviceRate>=.7,advantage:meanAdvantage<=.15},rows};fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({skilledRate,noviceRate,meanAdvantage,acceptance:report.acceptance}));}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});module.exports={advisor,setup,simulate,fingerprint};
