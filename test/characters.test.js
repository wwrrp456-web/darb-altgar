// Verify actual alpha, contextual expressions, actor identity and narrative placement.
const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async () => {
 const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }) /* الصور ملفات: نسمح بقراءة بكسلاتها من file:// */;
 try {
  let p = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errors=[]; p.on('pageerror',e=>errors.push(e.message));
  const url='file://'+path.join(__dirname,'../index.html');
  await p.goto(url);
  const alpha = await p.evaluate(async()=>{
   const keys=Object.keys(ART).filter(k=>k.startsWith('cutouts/')||k.startsWith('expressions/')||k.startsWith('story/')||k==='hero/salem_expressions');
   const failed=[];
   for(const k of keys){
    const img=new Image();img.src=ART[k];await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const cx=c.getContext('2d');cx.drawImage(img,0,0);
    const data=cx.getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;
    for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]>240)solid++;}
    if(clear<data.length/4*.03||solid<data.length/4*.03)failed.push(k);
   }
   return {failed,cutouts:keys.filter(k=>k.startsWith('cutouts/')).length,bosses:keys.filter(k=>k.startsWith('expressions/boss/')).length};
  });
  assert.deepEqual(alpha.failed,[],'Character assets have real alpha and visible artwork');
  assert.equal(alpha.cutouts,98);assert.equal(alpha.bosses,72);
  await p.evaluate(()=>{__game.S.phase=2;__game.S.player.wallet.sar=100000;__game.go('lords')});
  assert.equal(await p.locator('[data-art="expressions/boss/riyadh_neutral"]').count(),1);
  await p.click('[data-act=gift]');
  assert.equal(await p.locator('[data-art="expressions/boss/riyadh_accepted"]').count(),1,'Gift gets appreciative expression');
  await p.click('[data-act=lobby][data-q="5"]');
  assert.equal(await p.locator('[data-art="expressions/boss/riyadh_reserved"]').count(),1,'Influence campaign is not depicted as approval');
  await p.evaluate(()=>{__game.S.learn.char='negotiator';__game.S.bosses.riyadh.ruler='player';__game.renderAll(true)});
  assert.equal(await p.locator('[data-art="hero/c_negotiator"]').count(),1,'Ruler retains selected player identity');
  await p.close();
  p = await b.newPage({ viewport: { width: 390, height: 900 } });
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'?learn=1');
  const setEvent=async ev=>p.evaluate(ev=>{const {S,E}=__game;E.A.learnSetChar(S,'trader');const L=S.learn;L.level=8;L.intro=8;L.zseen=1;for(const k of ['up','sq','bq','fq','tq','csq'])L[k]=[];S.zakat.due=false;L.eq=[ev];__game.renderAll(true)},ev);
  await setEvent({id:'broker',dep:300});
  assert.equal(await p.locator('#lesson [data-art="expressions/events/broker_neutral"]').count(),1);
  await p.click('#lesson [data-act=evch][data-g=ask]');
  assert.equal(await p.locator('#react [data-art="expressions/events/broker_thinking"]').count(),1);
  for(const type of ['secure','worker','emotion']){
   await setEvent({id:'friend',type,amt:200});
   assert.equal(await p.locator('#lesson [data-art="expressions/events/friend_neutral"]').count(),1,'Loan category does not give a visual outcome hint');
  }
  await p.click('#lesson [data-act=evch][data-g=no]');
  await p.click('#hDebt');
  assert.equal(await p.locator('#lesson [data-art^="expressions/events/creditor_"]').count(),1);
  await p.click('#lesson [data-act=lclose]');
  await p.evaluate(()=>{const S=__game.S;S.learn.level=11;S.learn.eq=[];__game.go('academy')});
  assert(await p.locator('[data-art="story/grandpa"]').count()>0);
  assert(await p.locator('[data-art="story/saeed"]').count()>0);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(errors,[]);
  console.log('OK   98 cutouts, 72 boss portraits, alpha, contextual reactions, player identity and story cast');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
