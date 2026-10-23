const assert=require('node:assert/strict'),{chromium}=require('/opt/node-tools/node_modules/playwright'),path=require('node:path');
(async()=>{const b=await chromium.launch();try{const p=await(await b.newContext({viewport:{width:390,height:850}})).newPage();
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(900);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.intro=11;S.learn.level=6;S.learn.ageStages=false;S.phase=4;S.player.gold=90000;['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.go('market');});
 const d=p.locator('[data-dk=deals]');assert.ok(await d.count());await p.waitForTimeout(100);assert.ok(await d.evaluate(e=>e.open));
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-ui')||'{}').dealsOpen),undefined,'automatic opening must not override later defaults');
 await p.evaluate(()=>{__game.S.learn.level=7;__game.renderAll(true);});await p.waitForTimeout(100);assert.equal(await d.evaluate(e=>e.open),false,'after level 6');
 await d.locator('summary').evaluate(e=>e.click());await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-ui')).dealsOpen),true);
 await p.evaluate(()=>__game.renderAll(true));await p.waitForTimeout(100);assert.equal(await d.evaluate(e=>e.open),true);
 await d.locator('summary').evaluate(e=>e.click());await p.waitForTimeout(100);await p.evaluate(()=>__game.renderAll(true));await p.waitForTimeout(100);assert.equal(await d.evaluate(e=>e.open),false);
 // المراحل: رقم المستوى يطابق مصدر المرحلة الفعلية.
 await p.evaluate(()=>{const L=__game.S.learn;L.ageStages=true;L.level=__game.E.STAGES[5].source;L.stage=6;__game.renderAll(true);});await p.waitForTimeout(100);assert.equal(await d.evaluate(e=>e.open),true);
 await p.evaluate(()=>{const L=__game.S.learn;L.level=__game.E.STAGES[6].source;L.stage=7;__game.renderAll(true);});await p.waitForTimeout(100);assert.equal(await d.evaluate(e=>e.open),false);
 console.log('OK deals-fold-ui: level/stage 6 boundary, no automatic preference, explicit open/close preserved');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
