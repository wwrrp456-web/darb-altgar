'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();try{for(const width of [360,390,412,1100]){
 const p=await b.newPage({viewport:{width,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(700);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.level=11;S.learn.free=true;S.learn.intro=11;S.phase=3;S.player.gold=90000;g.E.A.buildShop(S,'riyadh');g.E.A.rentShop(S,'hail','stall');g.go('estate');});
 await p.evaluate(()=>{['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>__game.S.learn[k]=[]);__game.renderAll(true);});
 const card=p.locator('.obligations:visible');await card.locator('summary').click();
 assert.match(await card.innerText(),/إيجار الدكاكين والبسطات/);assert.match(await card.innerText(),/تقدير 30 يوماً/);
 assert(await card.locator('[data-obligation=daily]').innerText());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const daily=await card.locator('[data-obligation=daily]').innerText();
 await p.evaluate(()=>{window.scrollTo(0,0);});await p.waitForTimeout(150);
 await p.locator('[data-act=profile]:visible').first().click();
 assert.equal(await p.locator('#profile .obligations [data-obligation=daily]').innerText(),daily);
 assert(await p.locator('#profile .obligations').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS daily obligations in estate and profile at 360/390/412/1100; real clicks and no overflow');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
