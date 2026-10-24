'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
// سياسة الاهتزاز: نجاح الشراء/ربح كبير فقط، مع تفضيل الحركة والحماية من API مفقود أو مخفق.
const calls=[],policy={ui:{haptics:false},navigator:{vibrate:x=>calls.push(x)},matchMedia:()=>({matches:false}),$ :()=>null};
vm.runInNewContext(fs.readFileSync('src/ui/00a-haptics.js','utf8'),policy);
policy.hapticAfterAction({ok:true},'buy');assert.equal(calls.length,0);policy.ui.haptics=true;
policy.hapticAfterAction({ok:false,pl:2000},'buy');policy.hapticAfterAction({ok:true,pl:999},'sell');assert.equal(calls.length,0);
policy.hapticAfterAction({ok:true},'buy');policy.hapticAfterAction({ok:true,pl:1000},'sell');assert.equal(calls.length,2);
policy.matchMedia=()=>({matches:true});policy.hapticPulse('critical');assert.equal(calls.length,2);
policy.matchMedia=()=>({matches:false});policy.navigator.vibrate=()=>{throw Error('unsupported')};assert.doesNotThrow(()=>policy.hapticPulse('trade'));delete policy.navigator.vibrate;assert.doesNotThrow(()=>policy.hapticPulse('trade'));
(async()=>{const b=await chromium.launch();try{
 const ctx=await b.newContext({viewport:{width:390,height:850}});await ctx.addInitScript(()=>{window.__buzz=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:p=>{__buzz.push(p);return true;}});});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const url='file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4';await p.goto(url);await p.waitForTimeout(700);
 const setup=async()=>p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');Object.assign(S.learn,{level:11,intro:11,free:true,datePend:false,fxSeen:true,advMute:true});S.phase=2;S.player.gold=90000;g.go('market');['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.renderAll(true);});await setup();
 await p.locator('#hMenu').click();const button=p.locator('#hHaptics');assert.equal(await button.getAttribute('aria-pressed'),'false');assert.deepEqual(await p.evaluate(()=>__buzz),[]);
 await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-ui')).haptics),true);
 assert(await button.evaluate(e=>e.getBoundingClientRect().height>=44));assert(await p.locator('#hmenuPanel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.locator('#hMenu').click();
 await p.locator('[data-gd=wheat]').first().click();await p.evaluate(()=>__buzz=[]);await p.locator('[data-act=buy]:visible').first().click();assert.equal(await p.evaluate(()=>__buzz.length),1,'شراء فعلي مرة واحدة');
 await p.reload();await p.waitForTimeout(600);await setup();await p.locator('#hMenu').click();assert.equal(await button.getAttribute('aria-pressed'),'true','الاختيار محفوظ بعد الإعادة');await p.locator('#hMenu').click();
 // التنبيه الحرج عند ظهوره فقط، لا عند كل إعادة رسم.
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.rentShop(S,'riyadh','stall');S.player.props.riyadh.shops.at(-1).arrears=3;['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);__buzz=[];g.renderAll(true);});
 assert.equal(await p.evaluate(()=>__buzz.filter(Array.isArray).length),1);await p.evaluate(()=>__game.renderAll(true));assert.equal(await p.evaluate(()=>__buzz.filter(Array.isArray).length),1);
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__buzz=[]);await p.locator('[data-gd=wheat]').first().click();await p.locator('[data-act=buy]:visible').first().click();assert.deepEqual(await p.evaluate(()=>__buzz),[]);
 assert.deepEqual(errors,[]);await p.close();
 const u=await b.newPage({viewport:{width:390,height:850}});await u.addInitScript(()=>Object.defineProperty(navigator,'vibrate',{configurable:true,value:undefined}));await u.goto(url.replace('learn=1&',''));await u.waitForTimeout(600);await u.locator('#hMenu').click();assert(await u.locator('#hHaptics').isDisabled());assert.match(await u.locator('#hHaptics').innerText(),/غير متاح/);await u.close();
 console.log('PASS optional saved haptics, actual purchase, critical alert deduplication, reduced motion and unsupported API');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
