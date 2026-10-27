const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const width of [320,390,760,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.join(__dirname,'../index.html'));
   assert.equal(await page.locator('#nav .nav-icon').count(),9);
   assert.equal(await page.locator('#nav .lk').count(),2,'Locked stages keep their badges');
   const icons=await page.evaluate(async()=>{
    const results=[];
    for(const img of document.querySelectorAll('#nav .nav-icon')){
     await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const cx=c.getContext('2d');cx.drawImage(img,0,0);const d=cx.getImageData(0,0,c.width,c.height).data;
     let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>240)solid++;}
     const r=img.getBoundingClientRect(),b=img.closest('button').getBoundingClientRect();
     results.push(clear>100&&solid>100&&r.width>=(innerWidth<=760?34:44)&&r.left>=b.left-1&&r.right<=b.right+1);
    }return results;
   });
   assert(icons.every(Boolean),'Icons have real alpha, visible art and fit their tabs');
   await page.evaluate(()=>{__game.S.phase=4;__game.renderAll(true)});
   const ids=await page.locator('#nav button').evaluateAll(buttons=>buttons.map(b=>b.dataset.go));
   for(const id of ids){await page.click(`#nav [data-go="${id}"]`);assert.equal(await page.evaluate(()=>location.hash),'#'+id);assert.equal(await page.locator('#nav [aria-current=page]').getAttribute('data-go'),id);}
   assert.equal(await page.locator('#nav .lk').count(),0);
   await page.evaluate(()=>{const c=__game.S.player.caravans[0];c.left=5;c.total=10;c.dest='jeddah';__game.go('home')});
   assert.equal(await page.locator('#nav [data-go=map] .dot').count(),1,'Journey badge survives icon replacement');
   await page.click('#navTog');assert.equal(await page.locator('#nav').isVisible(),false);
   await page.click('#navTog');assert.equal(await page.locator('#nav').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.deepEqual(errors,[]);
   await page.close();console.log(`OK   navigation ${width}px: eight alpha icons, tabs, selection, locks, travel, collapse`);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
