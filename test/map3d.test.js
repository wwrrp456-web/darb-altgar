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
   assert(d.landmarks.every(c=>c.rendering==='painted'),'Architecture uses the requested illustrated identity');
   assert.equal(d.camel.rendering,'painted','Camel matches the illustrated architecture');
   assert.equal(d.terrain.rendering,'painted-relief');assert(d.terrain.maxHeight>.2&&d.terrain.maxHeight<=5.8,'Subtle relief preserves the painted ground without tall obstructions');
   assert(d.dpr<=1.5&&d.drawcalls<30&&d.triangles<50000);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert(await page.locator('.map3d-label').evaluateAll(els=>{const visible=els.filter(e=>!e.hidden);return visible.length>0&&visible.every(e=>e.offsetWidth>=44&&e.offsetHeight>=44);}),'Visible city name touch targets fit fingers');
   const idle=d.totalFrames;await page.waitForTimeout(350);assert.equal((await diag(page)).totalFrames,idle,'No idle frame loop');
   await page.click('[data-act=mapzoom][data-d="1"]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom>1);
   const before=(await diag(page)).camera;
   await page.locator('#map3d canvas').scrollIntoViewIfNeeded();
   const box=await page.locator('#map3d canvas').boundingBox();
   await page.mouse.move(box.x+box.width*.55,box.y+box.height*.62);await page.mouse.down();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.67,{steps:5});await page.mouse.up();await page.waitForTimeout(200);
   assert.notDeepEqual((await diag(page)).camera,before,'Drag moves camera after zoom');
   if(width===390){
    await page.evaluate(()=>window.mapCanvasBeforeTick=document.querySelector('#map3d canvas'));
    await page.mouse.move(box.x+box.width*.55,box.y+box.height*.55);await page.mouse.down();await page.waitForTimeout(1650);
    await page.evaluate(()=>{__game.S.day++;__game.renderAll(false);});
    assert(await page.evaluate(()=>document.querySelector('#map3d canvas')===window.mapCanvasBeforeTick),'Long drag survives a clock tick after the general pressing timeout');
    await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55,{steps:3});await page.mouse.up();await page.waitForTimeout(150);
    const mounts=(await diag(page)).mounts;
    await page.evaluate(()=>{__game.renderAll(false);__game.renderAll(false);});
    assert.equal((await diag(page)).mounts,mounts,'Routine clock refreshes retain the renderer');
    assert(await page.evaluate(()=>document.querySelector('#map3d canvas')===window.mapCanvasBeforeTick));
   }
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
   await page.locator('#map3d canvas').scrollIntoViewIfNeeded();
   const castle=await page.locator('.map3d-label[data-city=cairo]').boundingBox();
   await page.mouse.move(castle.x+castle.width/2,castle.y+castle.height+24);await page.mouse.down();await page.mouse.move(castle.x+castle.width/2+10,castle.y+castle.height+24,{steps:3});await page.mouse.up();await page.waitForTimeout(100);
   assert.equal(await page.locator('.map-panel .citycard .title').first().textContent(),'الإسكندرية','Dragging over a castle does not select it');
   await page.mouse.click(castle.x+castle.width/2,castle.y+castle.height+24);await ready(page);
   assert.equal(await page.locator('.map-panel .citycard .title').first().textContent(),'القاهرة','Clicking the painted castle selects its city');
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
  // لا تجعل رفض WebGL أو تقدير إمكانات الجهاز يختفي معه الرسم الذي اختاره اللاعب.
  for(const failure of['forced','webgl','reduced','weak','memory','shader','upload','draw','legacy','canvas-failed','image']){
   const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(['webgl','canvas-failed','legacy'].includes(failure))await page.addInitScript(kind=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)||(kind==='canvas-failed'&&type==='2d')?null:get.call(this,type,...args);};},failure);
   if(failure==='reduced')await page.emulateMedia({reducedMotion:'reduce'});
   if(failure==='weak')await page.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2}));
   if(failure==='memory')await page.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{get:()=>2}));
   if(failure==='shader')await page.addInitScript(()=>WebGLRenderingContext.prototype.getShaderParameter=()=>false);
   if(failure==='upload')await page.addInitScript(()=>{const upload=WebGLRenderingContext.prototype.texImage2D;WebGLRenderingContext.prototype.texImage2D=function(...args){if(args.length===6)throw Error('Simulated texture upload failure');return upload.apply(this,args);};});
   if(failure==='draw')await page.addInitScript(()=>WebGLRenderingContext.prototype.drawArrays=()=>{throw Error('Simulated GPU draw failure');});
   if(failure==='legacy')await page.addInitScript(()=>{delete window.ResizeObserver;const media=window.matchMedia;window.matchMedia=function(...args){const result=media.apply(this,args);result.addEventListener=undefined;result.removeEventListener=undefined;return result;};});
   await page.goto(url+`?map=2d#map`);
   if(failure!=='forced'){
    // افتح عبر زر اللاعب العادي؛ الرابط الصريح ?map=2d وحده يجب أن يبقى مسطحاً.
    await page.goto(url+'#map');
    if(failure==='image')await page.evaluate(()=>{const mount=Map3D.mount;Map3D.mount=(el,state)=>mount(el,{...state,camelArt:'data:image/webp;base64,aW52YWxpZA=='});});
    await page.click('[data-act=mapmode][data-mode="3d"]');
   }
   if(['forced','canvas-failed','image'].includes(failure)){
    await page.waitForSelector('#map');assert.equal((await diag(page)).active,false);assert.equal(await page.locator('#map [data-city]').count(),16);
    if(failure!=='forced')assert(await page.locator('#map-renderer-status').isVisible(),'Final flat fallback retains its explanation');
    await page.click('.map-filters [data-mc=eg]');assert.equal(await page.locator('#map [data-city]').count(),3);
   }else{
    await ready(page);let d=await diag(page);assert.equal(d.renderer,'canvas');assert(d.dpr<=1.25,'Compatible mode limits raster work on weak devices');assert.equal(d.landmarks.length,10);assert.equal(d.camel.rendering,'painted');assert.equal(d.buffers,0);assert.equal(d.textures,0);
    assert(await page.locator('#map-renderer-status').isVisible());
    assert(await page.locator('#map3d canvas').evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data,colors=new Set();for(let i=0;i<pixels.length;i+=64)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);return colors.size>80;}),'The compatible renderer paints actual artwork, not a blank canvas');
    const frames=d.totalFrames;await page.waitForTimeout(180);assert.equal((await diag(page)).totalFrames,frames,'Compatible renderer is idle between interactions');
    const mounts=d.mounts;await page.evaluate(()=>__game.renderAll(false));assert.equal((await diag(page)).mounts,mounts,'Clock updates preserve the compatible renderer too');
    await page.click('[data-act=mapzoom][data-d="1"]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom>1);
    await page.click('[data-act=maprotate]');await page.waitForFunction(()=>Map3D.diagnostics().camera.yaw!==0);
    await page.click('.map-filters [data-mc=eg]');await ready(page);assert.equal((await diag(page)).renderer,'canvas');
    await page.click('.map-cities [data-city=alex]');await ready(page);assert((await page.locator('.map-panel').textContent()).includes('الإسكندرية'));
    await page.locator('#map3d canvas').scrollIntoViewIfNeeded();
    const castle=await page.locator('.map3d-label[data-city=cairo]').boundingBox();
    await page.mouse.click(castle.x+castle.width/2,castle.y+castle.height+24);await ready(page);
    assert.equal(await page.locator('.map-panel .citycard .title').first().textContent(),'القاهرة','Compatible castle also selects its city');
    await page.evaluate(()=>__game.go('home'));d=await diag(page);assert.equal(d.active,false);assert.equal(d.mounts,d.disposals);
    await page.waitForTimeout(100);assert.equal((await diag(page)).totalFrames,d.totalFrames);
   }
   assert.deepEqual(errors,[]);await page.close();console.log('OK map3d compatibility:',failure);
  }
  const page=await browser.newPage();await page.goto(url+'?map=3d#map');await ready(page);
  await page.click('[data-act=mapzoom][data-d="1"]');await page.click('[data-act=maprotate]');await page.waitForFunction(()=>Map3D.diagnostics().camera.zoom>1&&Map3D.diagnostics().camera.yaw!==0);
  const pose=(await diag(page)).camera;
  await page.evaluate(()=>document.querySelector('#map3d canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>Map3D.diagnostics().renderer==='canvas'&&Map3D.diagnostics().ready);
  const restored=(await diag(page)).camera;for(const key of Object.keys(pose))assert(Math.abs(restored[key]-pose[key])<1e-9,'Context loss retains camera '+key);
  await page.evaluate(()=>__game.go('home'));const stopped=await diag(page);assert.equal(stopped.mounts,stopped.disposals);
  await page.close();console.log('OK map3d context loss continues in compatible illustrated renderer');

 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
