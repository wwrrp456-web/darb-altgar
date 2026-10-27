'use strict';
const assert = require('node:assert/strict'), E = require('../src/engine.js');
const fresh = () => { const S = E.newGame(37); E.A.learnSetChar(S, 'trader'); S.noLock = 1; return S; };
{
 const S = fresh(); assert.equal(E.ageOf(S), 25); S.day = 354; assert.equal(E.ageOf(S), 26);
 assert.equal(E.STAGES.length, 22); assert.equal(E.STAGES.reduce((n,s)=>n+s.reward,0), E.LS.LEVELS.reduce((n,s)=>n+s.reward,0));
 for (let i=0;i<6;i++) { assert.deepEqual(E.STAGES[i].lesson,E.LS.LEVELS[i].lesson); assert.deepEqual(E.STAGES[i].quiz,E.LS.LEVELS[i].quiz); }
 S.learn.stage=7;S.learn.level=7;S.learn.stageIntro=7;S.learn.ev.buildShop=1;S.learn.lastStageAge=25;S.day=19;
 E.stageCheck(S);assert.equal(S.learn.stage,7);S.day++;E.stageCheck(S);assert.equal(S.learn.stage,8);assert.equal(S.learn.doneDay,S.day);
 const gold=S.player.gold;E.stageCheck(S);assert.equal(S.player.gold,gold);
 S.learn.stage=12;S.learn.level=E.STAGES[11].source;S.learn.lastStageAge=E.ageOf(S);S.learn.ev.profit=100;assert(E.stageStatus(S).required>=E.ageOf(S)+E.STAGE_GAP_MIN);
}
{
 const S=fresh();delete S.learn.ageStages;delete S.learn.stage;S.learn.level=8;S.learn.intro=8;S.day=100000;
 const gold=S.player.gold;const T=E.load(E.save(S));assert.equal(E.ageOf(T),92);assert.equal(T.learn.stage,10);assert.equal(T.learn.doneDay,T.day);assert.equal(T.player.gold,gold);assert(T.learn.stageDone.includes(9));
}
{
 const S=fresh();assert(!E.setCaptainAuto(S,true).ok);S.player.caravans[0].captain={trade:1,nav:1,combat:1};S.player.caravans[0].route={a:'riyadh',b:'hail',buyA:'perfume',buyB:'dates'};assert(E.setCaptainAuto(S,true).ok);
 E.awayStart(S,10000);E.awayStart(S,20000);assert.equal(S.away.t,10000);const r=E.awayResume(S,16000);assert(r.days>=1&&r.days<=2);assert(!S.away);assert(!S.awaySim);assert.equal(E.awayResume(S,20000),null);
 E.awayStart(S,20000);assert.equal(E.awayResume(S,19000),null);
}
{
 const S=fresh();S.captainAuto=true;E.awayStart(S,1000);const j=E.awayBegin(S,1000+24*3600000);assert.equal(j.wanted,9600);assert.equal(j.remaining,9600);
 j.remaining=Infinity;const T=E.load(E.save(S));assert(!T.awayJob,'ترحيل مهمة غياب غير صالحة');
 const base=fresh();base.learn.level=11;base.player.caravans[0].cargo.dates=5;base.player.caravans[0].basis.dates={q:5,c:1};
 const a=E.load(E.save(base)),b=E.load(E.save(base));b.awaySim=true;
 const preA=a.player.gold,preB=b.player.gold;E.A.sell(a,1,'dates',5);E.A.sell(b,1,'dates',5);
 const pa=a.player.trades[0].pl,pb=b.player.trades[0].pl;assert(pa>0);assert(Math.abs(pb-pa*E.AWAY_YIELD)<1e-6);assert(Math.abs((a.player.gold-preA)-(b.player.gold-preB)-pa*.2)<1e-6);
}
console.log('Age, 22 stages, reward conservation, gates, bonus minimum, migration and away accounting: PASS');
{ // مراحل التأسيس 1–4: فاصل تمرين 20 يوماً فقط، ثم 3 سنوات من المرحلة 5
 const S = fresh(); const D = E.AGE_YEAR;
 assert.equal(E.STAGES.length, 22); assert.equal(E.LS.STAGE_AGES[10], 28); assert.equal(E.LS.STAGE_AGES[21], 61);
 for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10]) { S.learn.stage = n; S.learn.level = E.STAGES[n - 1].source; S.learn.lastStageAge = 25; S.day = 19; assert.equal(E.stageStatus(S).waiting, true); S.day = 20; assert.equal(E.stageStatus(S).waiting, false, 'مرحلة ' + n); }
 S.learn.stage = 11; S.learn.level = E.STAGES[10].source; S.learn.lastStageAge = 25.6; S.day = 0; assert(E.stageStatus(S).days > 2.4 * D - 60, 'المرحلة 11 بعد نحو ثلاث سنوات من آخر مرحلة تأسيس');
}
