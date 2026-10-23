'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../../src/engine.js'),A=E.A;
const fresh=()=>{const S=E.newGame(37);A.learnSetChar(S,'trader');return S};
// مسار زمني متصل: لا قفز في اليوم أو العمر، ولا حقن نقد بعد التجهيز.
{
 let S=fresh();S.noShocks=true;S.noEvents=true;S.phase=3;S.player.gold=100000;
 assert(A.buildShop(S,'riyadh').ok);const shop=S.player.props.riyadh.shops[0].id;
 for(let i=0;i<4;i++)assert(A.shopQuick(S,'riyadh',shop).ok);A.hireFill(S,'riyadh');
 const checkFinite=(x,path='S')=>{if(typeof x==='number')assert(Number.isFinite(x),path);else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))checkFinite(v,path+'.'+k);};
 let salemCount=0,waqfPaid=0;const checkpoints=new Set([25,40,58,60,61,62,70,85,90,95]);
 for(let day=0;day<=70*E.AGE_YEAR;day++){
  if(day){E.tick(S);if(S.zakat.due)A.zakatPay(S);S.pause=false;}
  const age=E.ageOf(S);
  if(S.life?.pending==='salem'){salemCount++;assert.equal(age,62);assert.equal(E.mentorOf(S).id,'mentor2');assert(A.acknowledgeLife(S).ok);assert(A.setSalemWaqf(S,'riyadh',shop).ok);}
  if(day%E.AGE_YEAR===0&&checkpoints.has(age)){
   checkFinite(S);assert.equal(S.seed>>>0,S.seed,'بذرة العالم تبقى 32-بت طوال المسيرة');assert.equal(S.seedB>>>0,S.seedB,'بذرة المواشي تبقى 32-بت طوال المسيرة');assert.equal(E.charArtStage(S),age>=70?'_old':age>=40?'_mid':'');
   assert.equal(E.bossArtStage(S),age>=85?'_old':'');
   assert.equal(E.mentorOf(S).id,age>=62?'mentor2':'salem');
   if([58,60,61].includes(age)){const i=[58,60,61].indexOf(age);assert(S.news.some(n=>n.t===E.LIFE_TEXTS.fatigue[i]),'جملة التعب المناسبة تصدر في وقتها');}
   if(age===60||age===90){const before=E.save(S);S=E.load(before);assert.equal(E.ageOf(S),age);assert.equal(E.save(E.load(E.save(S))),E.save(S),'استقرار الحفظ بعد الترحيل');checkFinite(S);}
   if(age>=70)waqfPaid+=S.life.salemWaqf.hist.reduce((n,r)=>n+r.paid,0);
  }
 }
 assert.equal(salemCount,1);assert(waqfPaid>0,'صرف فعلي للأوقاف خلال المسيرة');assert.equal(S.life.pending,'retire');
 assert.equal(S.order.length,18);const fathers=Object.fromEntries(S.order.map(id=>[id,{name:S.bosses[id].name,trust:S.bosses[id].trust}]));
 assert(A.retire(S,{name:'سهيل',will:'أحسن إلى الناس',willPct:20,pct:1}).ok);
 assert.equal(E.charArtStage(S),'_heir');assert.equal(E.bossArtStage(S),'_heir');assert.equal(E.mentorOf(S).id,'mentor2');assert.equal(E.ageOf(S),25);assert(S.legacy.father.alive);assert.equal(S.legacy.father.age,95);
 for(const id of S.order){assert.equal(S.bosses[id].father.name,fathers[id].name);assert.equal(S.bosses[id].trust,fathers[id].trust*E.HEIR_TRUST);assert.equal(E.elderBossText(S,id),E.LIFE_TEXTS.bossHeirMeeting);}
 assert.equal(S.life.successionNotices.length,18);assert(!A.retire(S,{name:'ثان'}).ok);E.tick(S);checkFinite(S);assert.equal(E.ageOf(S),25);assert.equal(S.life.successionNotices.length,18);
 console.log('PASS continuous 24780 daily ticks: age 25–95, save/load 60/90, waqf payouts, mentor and all 18 markets, one retirement');
}
