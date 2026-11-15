'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../src/engine.js'),query={E};vm.runInNewContext(fs.readFileSync('src/ui/10c-obligations.js','utf8'),query);
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();try{for(const width of [390,1100]){
 const p=await b.newPage({viewport:{width,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(700);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S, 'trader'); S.noLock = 1;S.learn.level=11;S.learn.free=true;S.learn.intro=11;S.phase=2;S.player.gold=90000;g.E.A.buildShop(S,'riyadh');g.go('home');['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.renderAll(true);});
 const report=query.dailyObligations(await p.evaluate(()=>__game.S));
 const setBalance=async n=>{await p.evaluate(n=>{__game.S.player.gold=n;__game.renderAll(true);},n);};
 /* 049: مركز التنبيهات حُذف؛ تنبيه «رصيدك لا يكفي التزامات 7 أيام» هو بطاقة «cashlow» في «اليوم» (officeCards) بنصه وزرّه «راجع التزاماتي» (ofestate) وعتبته نفسها (7 أيام) */
 const alert=p.locator('#screen [data-act=ofestate]'),show=async()=>{await p.evaluate(d=>{__game.S.player.fixedEma=d;__game.S.day=Math.max(__game.S.day,6);__game.go('office');__game.renderAll(true);},report.daily);await p.waitForTimeout(250);};
 assert.equal(await p.locator('#alertPanel,#hAlert').count(),0,'لا لوحة تنبيهات');
 await setBalance(report.daily*7);await show();assert.equal(await alert.count(),0,'عند7أيام لا بطاقة');
 await setBalance(report.daily*7-0.01);await show();assert.equal(await alert.count(),1,'أقل من7أيام تظهر البطاقة');
 assert.match(await alert.first().locator('..').locator('..').innerText(),/7 أيام|التزامات/);
 await setBalance(report.daily*8);await show();assert.equal(await alert.count(),0,'تزول بعد توفير الرصيد');
 await setBalance(report.daily*5);await show();await alert.first().click();assert(await p.locator('.obligations:visible').first().isVisible());
 assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS seven-day threshold, balance recovery and estate navigation via the cashlow card (049: no alert center)');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
