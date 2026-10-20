const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch();
 try {
  for(const width of [320,390,760,1280]) {
   const page=await browser.newPage({viewport:{width,height:1000}}), errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.join(__dirname,'../index.html?seed=5'));
   const inventory=[];
   const segmenter=new Intl.Segmenter('ar',{granularity:'grapheme'});
   for(const file of ['ui','template','engine','lessons','lore','babylon']) {
    const source=file==='ui'?fs.readdirSync(path.join(__dirname,'../src/ui')).sort().map(f=>fs.readFileSync(path.join(__dirname,'../src/ui/'+f),'utf8')).join(''):fs.readFileSync(path.join(__dirname,'../src/'+file+(file==='template'?'.html':'.js')),'utf8');
    for(const {segment}of segmenter.segment(source)) if(/\p{Extended_Pictographic}/u.test(segment))inventory.push(segment.replace(/\uFE0F/g,''));
   }
   const missing=await page.evaluate(tokens=>tokens.filter(t=>!GameIcons.registry[t]),[...new Set(inventory)]);
   assert.deepEqual(missing,[],'Every pictographic token in game content has a branded replacement');
   assert(await page.evaluate(async()=>{
    const keys=[...new Set(Object.values(GameIcons.registry))];
    for(const key of keys){if(key.startsWith('@'))continue;if(!ART[key])return false;const img=new Image();img.src=ART[key];await img.decode();}
    return true;
   }),'All referenced artwork exists and decodes');
   const opaque=await page.evaluate(async()=>{
    const failures=[];
    for(const [key,url] of Object.entries(ART)) {
     if(!/^(goods|ui|nav|icons|map)\//.test(key) && !/^brand\/(emblem|wordmark)$/.test(key))continue;
     if(key==='map/world'||key==='map/dust')continue; // terrain is a scene; dust is a translucent effect sheet
     const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
     const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
     let clear=0,solid=0;for(let i=3;i<pixels.length;i+=4){clear+=pixels[i]===0;solid+=pixels[i]>240;}
     const corners=[3,(c.width-1)*4+3,(c.height-1)*c.width*4+3,pixels.length-1];
     if(clear<c.width*c.height*.2 || solid<c.width*c.height*.03 || corners.some(i=>pixels[i]>8)) failures.push(key);
    }
    return failures;
   });
   assert.deepEqual(opaque,[],'Every item, UI, navigation, map and brand sprite has a clear background and visible artwork');
   await page.evaluate(()=>{const {S,E}=__game;S.phase=4;S.learn.level=11;S.learn.char='trader';S.learn.intro=11;S.learn.tab=Object.keys(E.babFor(S).TABLETS);S.learn.csec=S.order.slice();S.learn.secrets=E.COUNTRIES.map(c=>c.id);S.learn.lore=Object.fromEntries(S.order.map(id=>[id,3]));});
   for(const screen of ['home','map','market','caravan','estate','lords','empire','academy','cities']) {
    await page.evaluate(s=>__game.go(s),screen);
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,screen+' fits viewport');
    const raw=await page.evaluate(()=>{
     const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),found=[];
     while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('script,style,textarea,pre,code,.game-icon,.game-icon-svg'))continue;if(/\p{Extended_Pictographic}/u.test(node.nodeValue))found.push(node.nodeValue);}
     return found;
    });
    assert.deepEqual(raw,[],screen+' has no platform emoji in content or native selectors');
    const backplates=await page.locator('img.gi,img.uic,.game-icon>img').evaluateAll(images=>images.filter(img=>getComputedStyle(img).backgroundColor!=='rgba(0, 0, 0, 0)').length);
    assert.equal(backplates,0,screen+' does not add a CSS background to transparent icons');
   }
   await page.click('[data-ct=fx]');
   await page.selectOption('#fxFrom','usd');
   assert.equal(await page.locator('#fxFrom').evaluate(s=>s.previousElementSibling.dataset.icon),'ui/usd','Currency selector artwork follows its selected value');
   await page.click('#nav [data-go=market]');
   await page.click('#screen [data-act=help]');
   assert(await page.locator('#lesson .game-icon').count()>0,'Help window uses themed icons');
   await page.click('#lesson [data-act=lclose]');
   assert.equal(await page.locator('#b1 .game-icon').count(),1);
   await page.click('#b1');await page.click('#bPause');
   assert.deepEqual(errors,[]);
   await page.close();console.log(`OK   icons ${width}px: source coverage, all screens, unlocked stories, artwork, selectors, help and time controls`);
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
