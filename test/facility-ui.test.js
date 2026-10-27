// تقارير المرافق: النقص والتنبيهات والتفضيل والاستلام على الجوال.
const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async () => {
 const b = await chromium.launch();
 try {
  for (const width of [390, 1100]) {
   const ctx = await b.newContext({ viewport: { width, height: 850 } }); const p = await ctx.newPage(), errors=[];
   p.on('pageerror', e => errors.push(e.message));
   await p.goto('file://' + path.join(__dirname,'../index.html') + '?learn=1&seed=4'); await p.waitForTimeout(900);
   await p.evaluate(() => {const g=__game,S=g.S;g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level=11;S.learn.free=true;S.learn.intro=11;S.phase=4;S.player.caravans[0].city='riyadh';S.player.caravans[0].left=0;S.player.gold=90000;['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.E.A.buildShop(S,'riyadh');g.E.A.buildShop(S,'hail');g.E.A.buildFarm(S,'riyadh');g.go('estate');g.renderAll(true);});
   await p.evaluate(()=>{['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>__game.S.learn[k]=[]);__game.renderAll(true);}); await p.waitForTimeout(150);
   assert.match(await p.locator('[data-report=farm]').innerText(), /بلا قطيع/);
   assert.ok(await p.locator('[data-dk=howto-farm]').evaluate(e=>e.open));
   await p.locator('[data-dk=howto-farm] > summary').click();await p.waitForTimeout(100);
   await p.evaluate(()=>__game.renderAll(true));await p.waitForTimeout(100);
   assert.equal(await p.locator('[data-dk=howto-farm]').evaluate(e=>e.open),false);
   await p.evaluate(()=>{const S=__game.S;S.player.props.riyadh.farm.herd.sheep=10;S.player.props.riyadh.staff=[];__game.renderAll(true);});
   assert.match(await p.locator('[data-report=farm]').innerText(), /نقص المزارعين/);
   await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.buildFactory(S,'riyadh','perfume');g.go('empire');g.renderAll(true);});
   assert.match(await p.locator('[data-report=factory]').innerText(), /مادة خام ناقصة/);
   assert.ok(await p.locator('[data-dk=howto-factory]').evaluate(e=>e.open));
   await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='openfx';document.body.append(b);b.click();b.remove();});
   assert.ok(await p.locator('[data-dk=howto-wallet]').evaluate(e=>e.open));
   await p.evaluate(()=>{__game.S.player.gold=0;__game.renderAll(true);});
   assert.match(await p.locator('[data-report=wallet]').innerText(), /سيولة منخفضة/);
   await p.evaluate(()=>document.querySelector('[data-act=alerts]').click());
   assert.match(await p.locator('#alertPanel').innerText(), /بلا قطيع|نقص المزارعين/);
   assert.match(await p.locator('#alertPanel').innerText(), /سيولة منخفضة/);
   await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='algo';b.dataset.k='facility:wallet';document.body.append(b);b.click();b.remove();});
   assert.ok(await p.locator('#fxFrom').count());
   await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='viewmarket';b.dataset.c='hail';document.body.append(b);b.click();b.remove();});
   await p.locator('[data-gd=wheat]').first().click();
   assert.ok(await p.locator('[data-dk=howto-agent]').count());
   assert.match(await p.locator('[data-report=agent]').innerText(),/نقد الطلب غير متوفر/);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(errors,[]);await ctx.close();
  }
  console.log('OK facility-ui: farm/factory/agent/wallet, alerts, navigation, saved help, mobile overflow');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
