'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const approved=fs.readFileSync(path.join(__dirname,'../docs/review/APPROVED_REVIEW_2026-10-24.md'),'utf8');
(async()=>{const b=await chromium.launch();try{for(const width of [390,1100]){
 const p=await b.newPage({viewport:{width,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=8');await p.waitForTimeout(700);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S, 'trader'); S.noLock = 1;Object.assign(S.learn,{level:11,intro:11,free:true,datePend:false,fxSeen:true,advMute:true});S.phase=3;S.player.gold=100000;S.player.props={};S.player.factories=[];S.paymentDues=[];S.player.caravans[0].city='riyadh';S.player.caravans[0].left=0;g.E.A.buildShop(S,'riyadh');g.E.A.buildShop(S,'riyadh');g.go('estate');['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.renderAll(true);});
 const panel=p.locator('#assetSalePanel'),notice=p.locator('.asset-sale-lesson'),open=async()=>{const list=p.locator('.asset-sale-list');if(!await list.evaluate(e=>e.open))await list.locator('summary').click();await list.locator('[data-kind=shop]').first().click();};
 await open();await panel.locator('.asset-sale-zakat summary').click();const text=await panel.locator('.asset-sale-zakat p').innerText();assert(approved.includes('«'+text+'»'),'النص الشرعي مطابق للمصدر المعتمد حرفياً');
 assert.equal(await p.evaluate(()=>__game.S.learn.assetSaleLesson),undefined);await p.keyboard.press('Escape');assert.equal(await notice.count(),0);
 // المنع والإلغاء لا يسجلان درساً أو يغيّران السجل.
 await p.evaluate(()=>{__game.S.player.props.riyadh.shops[0].endowed=true;__game.renderAll(true);});await open();assert.equal(await panel.locator('#assetConfirm').count(),0);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>__game.S.learn.assetSaleLesson),undefined);
 await p.evaluate(()=>{__game.S.player.props.riyadh.shops[0].endowed=false;__game.renderAll(true);});await open();await panel.locator('#assetConfirm').click();assert.equal(await p.evaluate(()=>__game.S.learn.assetSaleLesson),undefined);await panel.locator('#assetConfirm').click();
 assert(await notice.isVisible());assert.equal(await notice.locator('.bub').innerText(),text);assert.equal(await p.evaluate(()=>__game.S.learn.assetSaleLesson.pending),true);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-v3')).learn.assetSaleLesson.pending),true);
 const hist=await p.evaluate(t=>__game.S.learn.hist.filter(h=>h.t===t).length,text);assert.equal(hist,1);
 await notice.locator('[data-act=asset-lesson-help]').click();assert(await p.locator('#salemPanel').isVisible());assert.match(await p.locator('#salemPanel').innerText(),/كيف يعمل بيع الأصول؟/);assert.match(await p.locator('#salemPanel').innerText(),/80٪/);await p.keyboard.press('Escape');
 await p.evaluate(()=>__game.go('home'));assert(await notice.isVisible());await notice.locator('[data-act=asset-lesson-close]').click();assert.equal(await notice.count(),0);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-v3')).learn.assetSaleLesson.pending),false);
 // التعليم محفوظ بعد إعادة الفتح، والبيع التالي لا يعيده ولا يكرر سجل المرشد.
 await p.reload();await p.waitForTimeout(700);await p.evaluate(()=>{__game.go('estate');__game.renderAll(true);});assert.equal(await notice.count(),0);await open();await panel.locator('#assetConfirm').click();await panel.locator('#assetConfirm').click();assert.equal(await notice.count(),0);assert.equal(await p.evaluate(t=>__game.S.learn.hist.filter(h=>h.t===t).length,text),1);
 await p.evaluate(()=>{const S=__game.S;S.player.wallet={sar:100,usd:0,au:0,ag:0};S.player.caravans[0].cargo={};S.player.caravans[0].herd={};S.learn.fh=[];__game.go('home');});const restart=await p.locator('.distress-card .bub').innerText();assert(approved.includes('«'+restart+'»'));
 if(width===390){const img=await p.locator('.distress-card').screenshot({path:path.join(__dirname,'../docs/ui-audit/asset-learning-390.jpg'),type:'jpeg',quality:55});assert(img.length<=150*1024);}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS asset learning: exact approved text, no lesson on cancel/refusal/first confirmation, successful sale, help, persistent dismissal, no repeat, responsive');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
