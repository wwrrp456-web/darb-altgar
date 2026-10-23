'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('/opt/node-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch();try{for(const width of [360,390,412]){
 const p=await b.newPage({viewport:{width,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+root+'/?learn=1&seed=37');await p.waitForFunction(()=>!!window.__game);
 await p.evaluate(()=>{const {S,E}=__game;E.A.learnSetChar(S,'trader');Object.assign(S.learn,{level:11,intro:11,stage:23,stageIntro:22,free:true,welcome:99,datePend:false});for(const k of ['stageUp','up','sq','tq','bq','csq','cq','fq','eq','rq'])S.learn[k]=[];S.learn.cards=E.CARDS.LIST.slice();S.learn.lore=Object.fromEntries(S.order.map(id=>[id,3]));S.learn.csec=S.order.slice();S.learn.secrets=E.COUNTRIES.map(c=>c.id);S.learn.tab=Object.keys(E.babFor(S).TABLETS);S.noEvents=true;S.phase=4;S.player.gold=100000;S.climate.pending=[];const c=S.player.caravans[0];c.city='riyadh';c.left=0;c.cargo={};c.basis={};['wheat','wool','coffee','perfume','herbs'].forEach((g,i)=>{c.cargo[g]=i+1;c.basis[g]={q:i+1,c:(i+1)*(i+2)*10};});__game.setSpeed(0);__game.go('caravan');});
 assert.equal(await p.locator('.cargo-products [data-act=cargo]').count(),5);assert.equal(await p.locator('.crates,.cargo-card .pbtn').count(),0);assert(!/تكلفة/.test(await p.locator('.cargo-products').innerText()),'cost appears in details only');
 await p.locator('.cargo-products').scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.cargo-product img')].every(im=>im.naturalWidth>0));
 assert(await p.locator('.cargo-product').evaluateAll(a=>a.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
 assert(await p.locator('.cargo-product img').evaluateAll(a=>a.every(e=>{const r=e.getBoundingClientRect();return r.width>=48&&r.height>=48;})));
 if(width===390)await p.screenshot({path:path.join(root,'docs/ui-audit/cargo-products-390.jpg'),type:'jpeg',quality:60});
 const before=await p.evaluate(()=>({gold:__game.S.player.gold,cargo:JSON.stringify(__game.S.player.caravans[0].cargo)}));
 for(const [g,n,cost]of [['wheat','1','20'],['wool','2','30'],['coffee','3','40'],['perfume','4','50'],['herbs','5','60']]){
  const tile=p.locator('.cargo-product[data-g='+g+']');await tile.focus();await p.keyboard.press('Enter');assert(await p.locator('#modal').isVisible());
  assert.equal(await p.locator('#modal .kv').filter({hasText:'الكمية معك'}).locator('b').innerText(),n);
  assert.equal(await p.locator('#modal .kv').filter({hasText:'متوسط تكلفتك للوحدة'}).locator('b').innerText(),cost);
  assert(/الوزن الذي تشغله/.test(await p.locator('#modal').innerText()));await p.keyboard.press('Escape');assert(await p.locator('#modal').isHidden());
 }
 assert.deepEqual(await p.evaluate(()=>({gold:__game.S.player.gold,cargo:JSON.stringify(__game.S.player.caravans[0].cargo)})),before,'opening details does not trade');
 // في الرحلة: بيانات المنتج متاحة دون سعر حي أو بيع.
 await p.evaluate(()=>{const c=__game.S.player.caravans[0];c.left=3;c.total=3;c.from=c.city;c.dest='hail';__game.renderAll(true);});await p.locator('.cargo-product[data-g=wheat]').click();assert(/القافلة في الطريق/.test(await p.locator('#modal').innerText()));assert.equal(await p.locator('#modal [data-act=cgsell]').count(),0);await p.keyboard.press('Escape');
 // التفاصيل والإيداع يتبعان القافلة المحددة، لا حمولة القافلة الرئيسية.
 const other=await p.evaluate(()=>{const {S,E}=__game;S.player.caravans[0].left=0;E.A.buildShop(S,'riyadh');E.A.buildWarehouse(S,'riyadh');const r=E.A.hireCaptain(S);if(!r.ok)throw Error(r.msg);const c=S.player.caravans.at(-1);c.city='riyadh';c.left=0;c.cargo={wheat:7};c.basis={wheat:{q:7,c:700}};__game.renderAll(true);__game.go('caravan');return c.id;});
 await p.locator('[data-act=selcar][data-id="'+other+'"]').click();await p.locator('.cargo-product[data-g=wheat]').click();assert.equal(await p.locator('#modal .kv').filter({hasText:'الكمية معك'}).locator('b').innerText(),'7');assert.equal(await p.locator('#modal .kv').filter({hasText:'متوسط تكلفتك للوحدة'}).locator('b').innerText(),'100');assert.equal(await p.locator('#modal [data-act=cgsell]').count(),0);
 await p.locator('#modal [data-act=stow]').click();assert.equal(await p.evaluate(id=>__game.S.player.caravans.find(c=>c.id===id).cargo.wheat,other),6);assert.equal(await p.evaluate(()=>__game.S.player.caravans[0].cargo.wheat),1);await p.locator('#modal [data-act=tostore]').click();assert.equal(await p.evaluate(id=>__game.S.player.caravans.find(c=>c.id===id).cargo.wheat||0,other),0);assert.equal(await p.evaluate(()=>__game.S.player.caravans[0].cargo.wheat),1);await p.keyboard.press('Escape');
 await p.evaluate(()=>{__game.S.player.caravans.forEach(c=>c.cargo={});__game.renderAll(true);});assert.equal(await p.locator('.cargo-product').count(),0);assert(await p.locator('.cargo-card [data-go=market]').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);await p.close();
 console.log('OK cargo products '+width+': one tile per good, keyboard details, true costs, no trade on open, travel, selected caravan deposit, empty state');
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
