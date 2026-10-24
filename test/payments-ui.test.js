'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();try{for(const width of [390,1100]){
 const p=await b.newPage({viewport:{width,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(700);
 const due=await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.level=11;S.learn.free=true;S.learn.intro=11;S.phase=3;S.player.gold=90000;g.E.A.rentShop(S,'riyadh','stall');S.player.props.riyadh.staff.forEach(w=>w.free=0);S.player.gold=0;g.E.tick(S);g.go('estate');return S.paymentDues.find(d=>d.kind==='rent');});
 await p.evaluate(()=>{['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>__game.S.learn[k]=[]);__game.renderAll(true);});
 const rentButton=p.locator(`.shopbox [data-act=settlepayment][data-id="${due.id}"]`);
 assert(await rentButton.isDisabled());
 await p.evaluate(()=>{__game.S.player.gold=1000;__game.renderAll(true);});
 await rentButton.click();
 assert.equal(await p.evaluate(()=>__game.S.player.gold),1000-due.amount);
 assert.equal(await p.evaluate(id=>__game.S.paymentDues.some(d=>d.id===id),due.id),false);
 assert.match(await p.locator('#toast').innerText(),/دفعت/);
 assert.equal(await rentButton.count(),0);
 const history=p.locator('.obligations .payment-history');await history.locator('summary').click();
 assert.match(await history.innerText(),/المجموع:/);assert.match(await history.innerText(),/ريال/);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const debts=p.locator('.obligations .payment-dues');await debts.locator('summary').click();
 assert.match(await debts.innerText(),/متأخرات مسجلة/);assert(await debts.locator('[data-act=settlepayment]').count()>0);
 if(width===390){const img=await p.locator('.obligations').screenshot({path:path.join(__dirname,'../docs/ui-audit/payments-390.jpg'),type:'jpeg',quality:55});assert(img.length<=150*1024);}
 assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS payments ledger and exact settlement with insufficient balance, feedback and mobile layout');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
