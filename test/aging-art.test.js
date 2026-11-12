// حدود العمر الفعلية وتحديث الصورة دون تغيير المستوى، على جوال حقيقي في المتصفح.
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),E=require('../src/engine.js'),{chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const S=E.newGame(61);E.A.learnSetChar(S,'trader');S.day=15*354-1;assert.equal(E.charArtStage(S),'');S.day++;assert.equal(E.charArtStage(S),'_mid');S.day=45*354;assert.equal(E.charArtStage(S),'_old');S.day=60*354-1;assert.equal(E.bossArtStage(S),'');S.day++;assert.equal(E.bossArtStage(S),'_old');S.legacy={retired:true,heirAge:25};assert.equal(E.charArtStage(S),'_heir');assert.equal(E.bossArtStage(S),'_heir');assert.equal(E.mentorOf(S).name,'عبد الله بن سالم');
 /* 048: لحظتا الانتقال عند 40 و70 */
 {const mk=y=>{const T=E.newGame(61);E.A.learnSetChar(T,'trader');T.day=Math.round((y-25)*354);return T},cnt=(T,i)=>T.news.filter(n=>n.t===E.LIFE_TEXTS.ageMoment[i]).length;
  let T=mk(39.5);E.checkLifeEvents(T);assert.equal(cnt(T,0),0);assert.equal((T.life.ageMoments||[]).length,0);
  T.day=Math.round((40.2-25)*354);E.checkLifeEvents(T);E.checkLifeEvents(T);assert.equal(cnt(T,0),1,'40: مرة واحدة');assert.deepEqual(T.life.ageMoments,[40]);
  T.day=Math.round((70.2-25)*354);E.checkLifeEvents(T);E.checkLifeEvents(T);assert.equal(cnt(T,1),1,'70: مرة واحدة');assert.equal(cnt(T,0),1);assert.deepEqual(T.life.ageMoments,[40,70]);
  T=mk(55);E.checkLifeEvents(T);assert.deepEqual(T.life.ageMoments,[40],'حفظ قديم: يُسجَّل بصمت');assert.equal(cnt(T,0),0);
  T=mk(75);const n0=T.news.length;E.checkLifeEvents(T);assert.deepEqual(T.life.ageMoments,[40,70]);assert.equal(cnt(T,0)+cnt(T,1),0,'عمر 75: بلا أخبار');
  E.AGEMOM.on=false;try{T=mk(75);E.checkLifeEvents(T);assert.equal(T.life.ageMoments,undefined,'المطفأ: لا حقل');assert.equal(cnt(T,0)+cnt(T,1),0)}finally{E.AGEMOM.on=true}}
 const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=61');await p.waitForFunction(()=>!!window.__game);
 await p.evaluate(()=>{const {E,S}=__game;E.A.chooseStart(S,'sa');E.A.learnSetChar(S,'trader');S.learn.level=11;S.learn.stage=23;S.learn.intro=11;S.learn.welcome=99;S.learn.datePend=false;S.learn.zseen=true;['stageUp','up','sq','tq','bq','csq','cq','fq','eq','rq'].forEach(k=>S.learn[k]=[]);S.phase=4;__game.setSpeed(0);__game.renderAll(true)});
 await p.locator('#hAvatar:visible, #tbAv:visible').click();
 for(const [years,suffix] of [[39,''],[40,'_mid'],[69,'_mid'],[70,'_old']]){await p.evaluate(y=>{__game.S.day=(y-25)*354;__game.renderAll(true)},years);assert(await p.evaluate(s=>{const key='cutouts/hero/c_trader'+s;return document.querySelector('#hAvatar img.face').getAttribute('src')===ART[key]&&document.querySelector('#profile img.pimg').getAttribute('src')===ART[key]},suffix),'تتحدث صورة الشريط والملف عند '+years);}
 await p.keyboard.press('Escape');await p.evaluate(()=>{__game.S.day=60*354;__game.go('lords');__game.renderAll(true)});assert(await p.locator('[data-art="boss/riyadh_old"]').count());
 await p.evaluate(()=>{__game.S.legacy={retired:true,heirAge:25};__game.S.life={mentorSon:true};__game.renderAll(true)});assert(await p.locator('[data-art="boss/riyadh_heir"]').count());assert(await p.locator('#hSalem [data-art="hero/mentor2_thinking"]').count());
 assert(await p.evaluate(()=>document.querySelector('#hAvatar img.face').getAttribute('src')===ART['cutouts/hero/c_trader_heir']));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);console.log('PASS age portrait boundaries, all generations, unchanged-level HUD cache, mentor son, phone layout');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
