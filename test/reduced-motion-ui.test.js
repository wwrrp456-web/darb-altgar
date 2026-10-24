'use strict';
const assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:390,height:850},reducedMotion:'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__motions=[];const original=Element.prototype.animate;Element.prototype.animate=function(...args){__motions.push(this.getAttribute('class')||'');return original.apply(this,args);};});
await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4&type=1&map=2d');await p.waitForTimeout(700);
await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.level=5;S.learn.intro=5;S.learn.free=true;S.learn.datePend=false;S.learn.fxSeen=true;S.learn.advMute=true;S.player.gold=90000;const c=S.player.caravans[0];c.city='riyadh';c.left=0;const trip=g.E.A.travel(S,c.id,'hail');if(!trip.ok)throw Error(trip.msg);['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.go('map');g.renderAll(true);});
assert.equal(await p.locator('.camwalk').first().evaluate(e=>getComputedStyle(e).animationName),'camwalk');
await p.evaluate(()=>{__motions=[];__game.S.player.caravans[0].left--;__game.renderAll(true);});assert(await p.evaluate(()=>__motions.some(c=>c.includes('map-caravan'))));
await p.evaluate(()=>{const e=document.createElement('div');e.id='testMotion';document.body.append(e);window.__activeMotion=e.animate([{opacity:0},{opacity:1}],10000);});
await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__activeMotion.playState),'idle','تغيير تفضيل الجهاز يلغي الحركة الجارية');
assert.equal(await p.locator('.camwalk').first().evaluate(e=>getComputedStyle(e).animationName),'none');
await p.evaluate(()=>{__motions=[];__game.S.player.caravans[0].left--;__game.renderAll(true);});assert.deepEqual(await p.evaluate(()=>__motions),[],'لا انزلاق في الخريطة أو مشهد الرحلة');
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
// حوار حقيقي يظل يكتب تدريجياً مع تقليل الحركة.
await p.evaluate(()=>{const g=__game,c=g.S.player.caravans[0];c.left=0;c.city='riyadh';['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>g.S.learn[k]=[]);g.go('market');g.renderAll(true);});
await p.locator('.plaza .spot[data-g=riyadh_boss]').click();await p.waitForTimeout(100);const first=(await p.locator('#dlg .dlg-say').innerText()).length;assert.equal(await p.locator('#dlg .dlg-say.typing').count(),1);await p.waitForTimeout(350);assert((await p.locator('#dlg .dlg-say').innerText()).length>first);await p.locator('#dlg .dlg-say').click();assert.equal(await p.locator('#dlg .dlg-say.typing').count(),0);assert.match(await p.locator('#dlg .dlg-say').innerText(),/أهلاً بك في سوق الرياض/);
assert.deepEqual(errors,[]);console.log('PASS reduced motion stops walking, sliding and active animation, while actual dialogue keeps typing');await p.close();}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
