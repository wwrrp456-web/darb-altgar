'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();try {
  const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=37');await p.waitForFunction(()=>!!window.__game);
  await p.evaluate(()=>{const {S,E}=__game;E.A.chooseStart(S,'sa');E.A.learnSetChar(S, 'trader'); S.noLock = 1;S.learn.level=2;S.learn.stage=2;S.learn.stageIntro=2;S.learn.intro=2;S.learn.sq=[];S.learn.zseen=true;S.learn.welcome=99;S.learn.datePend=false;__game.setSpeed(0);__game.go('market')});
  assert.equal(await p.locator('#b2').isVisible(),false);assert.equal(await p.locator('#bNext').isVisible(),false);assert(await p.locator('#b1').isVisible());
  assert((await p.locator('#mission').innerText()).includes('استكشف وجرّب'));
  await p.locator('#hAvatar').click();assert((await p.locator('#profile').innerText()).includes('العمر: 25'));assert((await p.locator('#profile').innerText()).includes('متبقٍ 20 يوماً'));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.keyboard.press('Escape');
  await p.evaluate(()=>{__game.S.awayReport={days:2,change:15,events:['وصلت قافلتك إلى حائل.']};__game.renderAll(true)});
  assert(await p.locator('#awayPanel').isVisible());assert((await p.locator('#awayPanel').innerText()).includes('يومين'));await p.locator('[data-act=awayclose]').click();assert.equal(await p.locator('#awayPanel').isVisible(),false);
  await p.evaluate(()=>{const {S}=__game;const c=S.player.caravans[0];c.captain={role:'loyal',trade:1,nav:1,combat:1,xp:0};c.route={a:c.city,b:'hail',buyA:'dates',buyB:'wool'};__game.renderAll(true)});
  await p.evaluate(()=>document.querySelector('#hMenu').click());await p.locator('#captainAuto').click();await p.evaluate(()=>document.querySelector('#hMenu').click());assert.equal(await p.locator('#captainAuto').getAttribute('aria-pressed'),'true');
  const day=await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));return __game.S.day});
  await p.waitForTimeout(1300);assert.equal(await p.evaluate(()=>__game.S.day),day,'لا يعمل المؤقّت في الخلفية مع احتساب الغياب');
  await p.evaluate(()=>{__game.S.away.t=Date.now()-3000;Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
  await p.waitForFunction(()=>!!__game.S.lastAway&&!__game.S.awayJob);assert.equal(await p.evaluate(()=>__game.S.lastAway.days),1);assert.equal(await p.evaluate(()=>!!__game.S.awayReport),false,'التقرير لا يقفز أمام اللاعب');await p.evaluate(()=>document.querySelector('[data-act=ofaway]').click());assert((await p.locator('#awayPanel').innerText()).length>10);await p.locator('[data-act=awayclose]').click();
  for(let n=0;n<20 && await p.locator('#lesson:not([hidden]) [data-act=lclose]').count();n++) await p.locator('#lesson [data-act=lclose]').click();
  await p.evaluate(()=>document.querySelector('#hMenu').click());await p.locator('#captainAuto').click();await p.evaluate(()=>document.querySelector('#hMenu').click());assert.equal(await p.locator('#captainAuto').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);console.log('Age profile, calm stage gate, hidden accelerators, away report and mobile layout: PASS');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
