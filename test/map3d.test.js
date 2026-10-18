// قبول المرحلة الأولى فقط: مجسّمات ثابتة وكاميرا؛ تتبع الرحلات والالتقاط على المجسّمات للمرحلة الثانية.
const assert=require('node:assert/strict');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const url='file://'+path.join(__dirname,'../index.html');
 const ready=page=>page.waitForFunction(()=>Map3D.diagnostics().active&&Map3D.diagnostics().ready&&Map3D.diagnostics().frames>0);
 const diag=page=>page.evaluate(()=>Map3D.diagnostics());
 try{
  for(const width of[320,390,760,1280]){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:3}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const network=[];page.on('request',r=>{if(!/^(file:|data:|http:\/\/127\.0\.0\.1)/.test(r.url()))network.push(r.url());});
   await page.goto(url+'?map=3d&seed=5#map');await ready(page);
   let d=await diag(page);
   assert.equal(d.landmarks.length,10);assert.equal(new Set(d.landmarks.map(c=>c.country)).size,5);
   assert.equal(d.landmarks.filter(c=>c.type==='castle').length,5);
   assert(d.dpr<=1.5&&d.drawcalls<30&&d.triangles<50000);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert(await page.locator('.map3d-label').evaluateAll(els=>{const visible=els.filter(e=>!e.hidden);return visible.length>0&&visible.every(e=>e.offsetWidth>=44&&e.offsetHeight>=44);}),'Visible city name touch targets fit fingers');
   const idle=d.totalFrames;await page.waitForTimeout(350);assert.equal((await diag(page)).totalFrames,idle,'No idle frame loop');
   await page.click('[data-act=mapzoom][data-d="1"]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom>1);
   const before=(await diag(page)).camera;
   const box=await page.locator('#map3d canvas').boundingBox();
   await page.mouse.move(box.x+box.width*.55,box.y+box.height*.62);await page.mouse.down();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.67,{steps:5});await page.mouse.up();await page.waitForTimeout(200);
   assert.notDeepEqual((await diag(page)).camera,before,'Drag moves camera after zoom');
   const yaw=(await diag(page)).camera.yaw;await page.click('[data-act=maprotate]');await page.waitForFunction(y=>Map3D.diagnostics().camera.yaw!==y,yaw);
   const pitch=(await diag(page)).camera.pitch;await page.click('[data-act=maptilt]');await page.waitForFunction(p=>Map3D.diagnostics().camera.pitch!==p,pitch);
   await page.locator('#map3d canvas').focus();await page.keyboard.press('+');await page.waitForTimeout(80);
   assert((await diag(page)).camera.zoom>before.zoom,'Keyboard zoom');
   await page.click('[data-act=mapreset]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom===1&&Map3D.diagnostics().camera.yaw===0);
   if(width===390){
    await page.locator('#map3d canvas').scrollIntoViewIfNeeded();
    const r=await page.locator('#map3d canvas').boundingBox(),cdp=await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    const touch=(x,y,id)=>({x:r.x+r.width*x,y:r.y+r.height*y,id});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(.35,.72,1),touch(.65,.72,2)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(.22,.64,1),touch(.78,.8,2)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);
    d=await diag(page);assert(d.camera.zoom>1&&Math.abs(d.camera.yaw)>.01,'Real two-finger input pinches and rotates');
    await page.click('[data-act=mapreset]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom===1);
   }
   for(const country of['sa','eg','ir','in','cn']){
    await page.click(`.map-filters [data-mc="${country}"]`);await ready(page);
    assert.equal(await page.locator('.map-cities button[data-city]').count(),await page.evaluate(c=>__game.S.order.filter(id=>__game.S.cities[id].country===c).length,country));
   }
   await page.evaluate(()=>{Object.assign(__game.S.learn,{char:'trader',start:'sa',level:11,intro:11,abroad:false});__game.renderAll(true);});await ready(page);
   await page.click('.map-filters [data-mc=eg]');await ready(page);
   await page.click('.map-cities [data-city=alex]');await ready(page);
   assert((await page.locator('.map-panel').textContent()).includes('الإسكندرية'));
   assert((await page.locator('.map-panel').textContent()).includes('🔒'),'Travel restriction stays in existing city panel');
   await page.click('[data-act=maphere]');await ready(page);assert.equal((await diag(page)).camera.zoom,2);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
   const hidden=(await diag(page)).totalFrames;await page.evaluate(()=>Map3D.command('rotate',1));await page.waitForTimeout(150);assert.equal((await diag(page)).totalFrames,hidden,'Hidden tab schedules no frames');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(80);
   const current=(await diag(page)).camel;
   await page.evaluate(()=>{__game.S.day++;__game.renderAll(true);});await ready(page);assert.deepEqual((await diag(page)).camel,current,'Prototype camel deliberately remains static');
   await page.evaluate(()=>__game.go('home'));const stopped=(await diag(page)).totalFrames;await page.waitForTimeout(150);
   assert.equal((await diag(page)).active,false);assert.equal((await diag(page)).totalFrames,stopped);
   for(let i=0;i<4;i++){await page.evaluate(()=>__game.go('map'));await ready(page);await page.evaluate(()=>__game.go('home'));}
   d=await diag(page);assert.equal(d.mounts,d.disposals,'All scenes disposed on leaving map');
   await page.evaluate(()=>__game.go('map'));await ready(page);
   await page.click('[data-act=mapmode][data-mode="2d"]');assert.equal(await page.locator('#map').count(),1);assert.equal((await diag(page)).active,false);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('darb-ui')).mapMode),'2d');
   assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
   await page.close();console.log(`OK map3d ${width}px: ten miniatures, camera, static camel, labels, locks, lifecycle and flat toggle`);
  }
  for(const failure of['forced','webgl','reduced','weak']){
   const page=await browser.newPage({viewport:{width:390,height:900}});
   if(failure==='webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:get.call(this,type,...args);};});
   if(failure==='reduced')await page.emulateMedia({reducedMotion:'reduce'});
   if(failure==='weak')await page.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>1}));
   await page.goto(url+`?map=${failure==='forced'?'2d':'3d'}#map`);await page.waitForSelector('#map');
   assert.equal((await diag(page)).active,false);assert.equal(await page.locator('#map [data-city]').count(),16);
   await page.click('.map-filters [data-mc=eg]');assert.equal(await page.locator('#map [data-city]').count(),3);
   await page.close();console.log('OK map3d fallback:',failure);
  }
  const page=await browser.newPage();await page.goto(url+'?map=3d#map');await ready(page);
  await page.evaluate(()=>document.querySelector('#map3d canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForSelector('#map');assert.equal((await diag(page)).active,false);
  await page.close();console.log('OK map3d context loss falls back');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
