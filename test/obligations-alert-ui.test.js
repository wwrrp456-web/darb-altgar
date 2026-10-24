'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../src/engine.js'),query={E};vm.runInNewContext(fs.readFileSync('src/ui/10c-obligations.js','utf8'),query);
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();try{for(const width of [390,1100]){
 const p=await b.newPage({viewport:{width,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(700);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.level=11;S.learn.free=true;S.learn.intro=11;S.phase=2;S.player.gold=90000;g.E.A.buildShop(S,'riyadh');g.go('home');['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.renderAll(true);});
 const report=query.dailyObligations(await p.evaluate(()=>__game.S));
 const setBalance=async n=>{await p.evaluate(n=>{__game.S.player.gold=n;__game.renderAll(true);},n);};
 const alert=p.locator('#alertPanel [data-k=obligations][data-act=algo]');
 await setBalance(report.daily*7);await p.locator('#hAlert').click();assert.equal(await alert.count(),0,'عند7أيام لا تنبيه');
 await setBalance(report.daily*7-0.01);assert.equal(await alert.count(),1,'أقل من7أيام يظهر');
 await setBalance(report.daily*5);assert.match(await alert.locator('..').locator('..').innerText(),/5/);
 assert(await p.locator('#alertPanel').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await alert.click();assert(await p.locator('.obligations:visible').isVisible());assert(await p.locator('#alertPanel').isHidden());
 await p.evaluate(()=>{__game.go('home');window.scrollTo(0,0);});await p.waitForTimeout(150);
 await p.locator('#hAlert').click();await p.locator('#alertPanel [data-k=obligations][data-act=alsnooze]').click();assert.equal(await alert.count(),0);
 await p.evaluate(()=>{__game.S.day+=3;__game.renderAll(true);});assert.equal(await alert.count(),1,'التأجيل3أيام ثم يعود');
 await setBalance(report.daily*8);assert.equal(await alert.count(),0,'يزول بعد توفير الرصيد');
 // قبل فتح العقارات، يفتح ملف التاجر بدلاً من شاشة مقفلة.
 await p.evaluate(()=>{__game.S.phase=1;__game.S.player.gold=0;__game.renderAll(true);});
 await alert.click();assert(await p.locator('#profile .obligations').isVisible());assert(await p.locator('#alertPanel').isHidden());
 assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS seven-day threshold, balance recovery, snooze, estate/profile navigation and mobile alert layout');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
