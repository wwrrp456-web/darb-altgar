'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('/opt/node-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),variants=['dawn','noon','dusk','night','ramadan','eid'];
(async()=>{const b=await chromium.launch();try{
 for(const city of ['riyadh','jeddah'])for(const variant of variants){const f=path.join(root,'brand/lazy/city',city+'_'+variant+'.webp');assert(fs.statSync(f).size<150000,'individual scene budget');}
 const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await ctx.newPage(),errors=[],missing=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await p.goto('file://'+root+'/?learn=1&seed=37');await p.waitForFunction(()=>!!window.__game);
 await p.evaluate(()=>{const {S,E}=__game;E.A.learnSetChar(S,'trader');Object.assign(S.learn,{level:11,intro:11,stage:23,stageIntro:22,free:true,welcome:99,datePend:false});for(const k of ['stageUp','up','sq','tq','bq','csq','cq','fq','eq','rq'])S.learn[k]=[];S.learn.cards=E.CARDS.LIST.slice();S.learn.lore=Object.fromEntries(S.order.map(id=>[id,3]));S.learn.csec=S.order.slice();S.learn.secrets=E.COUNTRIES.map(c=>c.id);S.learn.tab=Object.keys(E.babFor(S).TABLETS);S.noEvents=true;S.noShocks=false;S.phase=4;S.climate.pending=[];S.cal.jd0=E.CAL.hijriToJd(1448,5,1);__game.setSpeed(0);__game.go('market');});
 for(const city of ['riyadh','jeddah']){
  await p.selectOption('#mktCity',city);
  for(let day=0;day<4;day++){
   await p.evaluate(day=>{__game.S.day=day;__game.renderAll(true);},day);
   const im=p.locator('.plaza .city-time-image');assert.equal(await im.getAttribute('data-scene-variant'),variants[day]);assert(await im.evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width/r.height-21/9)<.02;}),'panorama keeps21:9');await im.evaluate(e=>e.scrollIntoView({block:'center'}));await p.waitForFunction(()=>document.querySelector('.plaza .city-time-image').naturalWidth===768);
  }
  for(const [month,date,variant]of [[9,1,'ramadan'],[9,28,'ramadan'],[10,1,'eid'],[10,3,'eid'],[12,10,'eid'],[12,13,'eid'],[10,4,'dawn']]){
   await p.evaluate(([m,d])=>{const {S,E}=__game;S.cal.jd0=E.CAL.hijriToJd(1448,m,d);S.day=0;__game.renderAll(true);},[month,date]);
   assert.equal(await p.locator('.plaza .city-time-image').getAttribute('data-scene-variant'),variant);await p.waitForFunction(()=>document.querySelector('.plaza .city-time-image').naturalWidth>0);
  }
  await p.selectOption('#mktCity',city);await p.screenshot({path:path.join(root,'docs/review/city-previews',city+'-live.jpg'),type:'jpeg',quality:60});
 }
 // كل المدن الأخرى تبقى قابلة للعرض بصورتها الأصلية، لا طلب لمسار غير موجود.
 for(const id of await p.evaluate(()=>__game.S.order)){
  await p.selectOption('#mktCity',id);await p.locator('.city-time-image').evaluate(e=>e.scrollIntoView({block:'center'}));await p.waitForFunction(()=>document.querySelector('.city-time-image').naturalWidth>0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
 await p.emulateMedia({reducedMotion:'reduce'});await p.selectOption('#mktCity','riyadh');await p.evaluate(()=>{__game.S.day=1;__game.renderAll(true);});assert.equal(await p.locator('.city-fade-previous').count(),0,'reduced motion skips scene animation');
 await p.route('**/img/city/riyadh_night.webp*',r=>r.abort());await p.evaluate(()=>{__game.S.day=3;__game.renderAll(true);});await p.waitForFunction(()=>{const im=document.querySelector('.plaza .city-time-image');return im.dataset.fallbackTried==='1'&&im.naturalWidth>0;});
 console.log('OK city-scenes: 12 real lazy assets, four times, Hijri Ramadan and both Eids, 18 cities no404/overflow, reduced motion, original fallback');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
