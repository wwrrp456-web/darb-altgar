const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch();
 try {
  for (const width of [320,390,760,1280]) {
   const page=await browser.newPage({viewport:{width,height:1000}}), errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.join(__dirname,'../index.html#map'));
   const view=()=>page.locator('#map').getAttribute('viewBox');
   const original=await view();
   assert.equal(await page.locator('#map [data-city]').count(),16);
   assert.equal(await page.locator('#map .map-caravan image').count(),1);
   assert(await page.locator('#map').evaluate(svg=>svg.lastElementChild.matches('.map-caravan')),'Caravan draws above terrain, routes and cities');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.equal(await page.locator('[data-act=mapzoom][data-d="-1"]').isDisabled(),true);
   await page.click('[data-act=mapzoom][data-d="1"]');
   const zoomed=await view();assert.notEqual(zoomed,original);
   await page.locator('#map').focus();await page.keyboard.press('ArrowRight');
   const keyboardView=await view(); assert.notEqual(keyboardView,zoomed);
   // اسحب منطقة الخريطة، ويجب ألا تتحول حركة السحب إلى اختيار مدينة.
   const box=await page.locator('#map').boundingBox();
   const selected=await page.locator('.map-cities button.on').getAttribute('data-city');
   await page.mouse.move(box.x+box.width*.6,box.y+box.height*.5);
   await page.mouse.down();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.5,{steps:5});await page.mouse.up();
   assert.notEqual(await view(),keyboardView);
   assert.equal(await page.locator('.map-cities button.on').getAttribute('data-city'),selected);
   await page.click('[data-act=mapreset]'); assert.equal(await view(),original);
   await page.click('.map-filters [data-mc=eg]');
   assert.equal(await page.locator('#map [data-city]').count(),3);
   assert.equal(await page.locator('#map [data-city] image[data-map-art=city]').count(),3);
   assert(await page.evaluate(async()=>{
    for(const key of ['city','market','fort','caravan','compass']){
     const img=new Image();img.src=ART['map/'+key];await img.decode();
     const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
     const cx=c.getContext('2d');cx.drawImage(img,0,0);const d=cx.getImageData(0,0,c.width,c.height).data;
     let clear=0,solid=0;for(let i=3;i<d.length;i+=4){clear+=d[i]===0;solid+=d[i]>240;}
     if(clear<100||solid<100)return false;
    }return true;
   }),'All map icons decode and have actual transparency');
   await page.locator('#map [data-city=alex]').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.map-cities button.on').getAttribute('data-city'),'alex');
   assert.equal(await page.locator('#map .map-route').count(),1);
   assert.match(await page.locator('.map-panel').textContent(),/الإسكندرية/);
   await page.click('[data-act=maphere]');
   assert.equal(await page.locator('.map-filters [data-mc=sa].on').count(),1);
   // دولة تجريبية جديدة خارج حدود الرقعة الأصلية، بلا موضع اسم مخصص.
   await page.evaluate(()=>{
    const {E,S}=__game;
    const country={id:'test',name:'بلاد الاختبار',flag:'🌐',color:'#228899',customs:.05,cx:-500,cy:-200};
    E.COUNTRIES.push(country);E.CD.test=country;E.ADJ.test=['eg'];
    E.GIDS.forEach(g=>E.GD[g].cult.test=1);
    S.cities.testport={...structuredClone(S.cities.cairo),id:'testport',name:'الميناء الجديد',country:'test',x:-500,y:-200};
    S.order.push('testport');E.snapshotKnown(S,['testport']);
    S.order.forEach(id=>{if(id!=='testport')S.risk[E.riskKey(id,'testport')]=.08});__game.renderAll(true);
   });
   await page.click('.map-filters [data-mc=all]');
   const bounds=(await view()).split(' ').map(Number);
   assert(bounds[0]<=-500 && bounds[1]<=-200);
   assert.equal(await page.locator('#map [data-mc=test]').count(),1);
   await page.click('.map-filters [data-mc=test]');
   assert.equal(await page.locator('#map [data-city=testport]').count(),1);
   assert.match(await page.locator('.map-panel').textContent(),/الميناء الجديد/);
   assert(!/NaN|undefined/.test(await page.locator('.map-atlas').textContent()));
   assert(await page.locator('#map').evaluate(svg=>[...svg.querySelectorAll('*')].every(el=>['x','y','x1','y1','x2','y2','cx','cy','r','width','height'].every(key=>!el.hasAttribute(key)||Number.isFinite(Number(el.getAttribute(key)))))));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.deepEqual(errors,[]);
   await page.close();console.log(`OK   atlas ${width}px: zoom, pan, reset, keyboard, city, route, location and expansion`);
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
