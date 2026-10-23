'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../src/engine.js'),A=E.A;
const fresh=()=>{const S=E.newGame(37);A.learnSetChar(S,'trader');return S};
{
 const text=fs.readFileSync('docs/review/APPROVED_AGING_TEXTS.md','utf8');
 for(const t of Object.values(E.LIFE_TEXTS).flat())assert(text.includes(t),'يبقى النص المعتمد حرفياً');
 const S=fresh();S.day=(E.SALEM_PASSES_AGE-25)*354-1;E.tick(S);assert.equal(S.life.pending,'salem');assert.equal(E.mentorOf(S).name,'عبد الله بن سالم');
 const loaded=E.load(E.save(S));assert.equal(loaded.life.pending,'salem');assert(A.acknowledgeLife(S).ok);assert(!S.life.pending);assert.equal(S.life.farewellSeen,true);
 const old=fresh();delete old.learn.ageStages;old.day=100000;const L=E.load(E.save(old));assert.equal(E.ageOf(L),92);assert.equal(E.mentorOf(L).id,'mentor2');assert(!L.life.pending);assert.equal(L.life.farewellSeen,true);
}
{
 const S=fresh();S.learn.level=11;S.life={mentorSon:true};S.day=(95-25)*354;S.phase=4;S.player.gold=100000;S.player.name='الأب';
 for(const b of Object.values(S.bosses))b.trust=50;
 assert(A.signPact(S,'riyadh','supply').ok);const pact=JSON.stringify(S.player.pacts),debt=S.player.famDebt.left,oldGold=S.player.gold;
 const before=E.save(S);assert(!A.retire(S,{name:'سهيل',pct:101}).ok);assert.equal(E.save(S),before);assert(!A.retire(S,{name:'سهيل',willPct:34}).ok);assert.equal(E.save(S),before);
 const quote=E.retirementQuote(S,{name:'سهيل',pct:10,will:'أحسن إلى الناس',willPct:20});assert(quote.ok);assert.equal(E.save(S),before,'المعاينة لا تغيّر اللعبة');
 assert(A.retire(S,{name:'سهيل',pct:10,will:'أحسن إلى الناس',willPct:20}).ok);assert.equal(S.player.name,'سهيل');assert.equal(E.ageOf(S),25);assert(S.legacy.father.alive);assert.equal(S.legacy.father.name,'الأب');assert.equal(S.legacy.will.executed,false);assert.equal(S.legacy.will.pct,20);assert.equal(S.player.famDebt.left,debt);assert.equal(JSON.stringify(S.player.pacts),pact);
 assert.equal(S.learn.level,11);assert.equal(E.stageOf(S),null);assert.equal(E.mentorOf(S).id,'mentor2');assert(S.player.gold<oldGold);assert.equal(S.life.successionNotices.length,S.order.length);
 for(const b of Object.values(S.bosses)){assert.equal(b.trust,50*E.HEIR_TRUST);assert(b.father);assert(b.name.includes(' بن '));assert.equal(b.temper,.9)}
 assert.equal(E.load(E.save(S)).legacy.will.text,'أحسن إلى الناس');assert(!A.retire(S,{name:'آخر'}).ok);E.tick(S);assert.equal(E.ageOf(S),25);
}
{
 const S=fresh();S.life={mentorSon:true};S.learn.level=11;S.phase=2;S.player.gold=1e6;S.noShocks=true;S.noEvents=true;assert(A.buildShop(S,'riyadh').ok);const id=S.player.props.riyadh.shops[0].id;assert(A.shopQuick(S,'riyadh',id).ok);
 E.hawlLen(S,S.day);const twin=E.load(E.save(S)),perks=JSON.stringify(S.learn.perks);const cashBefore=S.player.gold;assert(A.setSalemWaqf(S,'riyadh',id).ok);assert.equal(S.player.gold,cashBefore);assert.equal(JSON.stringify(S.learn.perks),perks);const W=S.life.salemWaqf,span=E.hawlLen(S,W.start);let sum=0;
 for(let i=0;i<span;i++){E.tick(S);E.tick(twin);sum+=S.player.props.riyadh.hist.at(-1).net;}
 assert(sum>0);assert.equal(W.hist.length,1);assert(Math.abs(W.hist[0].net-sum)<1e-7);assert(Math.abs(W.hist[0].paid-sum*.1)<1e-7,'10% من الصافي بعد المصاريف لا من الإيراد');const levySaving=(twin.player.led.exp.wealthLevy||0)-(S.player.led.exp.wealthLevy||0);assert(Math.abs(twin.player.gold-S.player.gold+levySaving-W.hist[0].paid)<1e-6,'حفظ النقد بعد احتساب فرق عبء الثروة؛ لا خصم ثانٍ للتبرع');assert(twin.player.gold>S.player.gold);assert.equal(S.player.led.exp.charity,W.hist[0].paid);assert.equal(JSON.stringify(S.learn.perks),JSON.stringify(twin.learn.perks));assert(S.life.loyal);
 const workers=S.player.props.riyadh.staff.slice();for(const w of workers)A.fireStaff(S,'riyadh',w.id);for(let d=0;d<5;d++)E.tick(S);assert(W.net<0);assert.equal(W.balance,0,'لا حجز ولا تبرع عن فترة خاسرة');
 const keep=E.load(E.save(S));assert.equal(keep.life.salemWaqf.hist[0].paid,W.hist[0].paid);
}
{
 const S=fresh();S.life={mentorSon:true};S.learn.level=11;S.phase=2;S.player.gold=20000;assert(A.buildShop(S,'riyadh').ok);const shop=S.player.props.riyadh.shops[0].id;S.day=(95-25)*354;const nw=E.netWorth(S);assert(A.retire(S,{name:'سهيل',shop:{city:'riyadh',shop}}).ok);assert.equal(E.netWorth(S),nw-1000);assert(S.player.props.riyadh.shops[0].endowed);assert.equal(S.legacy.waqf.pct,1);
}
{
 const S=fresh();S.learn.level=11;S.day=(62-25)*354-1;S.captainAuto=true;E.awayStart(S,0);E.awayBegin(S,30000);E.awayAdvance(S,25);assert.equal(S.life.pending,'salem');assert.equal(S.awayJob.remaining,9);const day=S.day;E.awayAdvance(S,25);assert.equal(S.day,day);assert(A.acknowledgeLife(S).ok);while(S.awayJob)E.awayAdvance(S,25);assert.equal(S.awayReport.days,10);
}
console.log('PASS approved text fidelity, lifecycle/migration, atomic retirement, will, 18 successors, net waqf and paused away catch-up');
