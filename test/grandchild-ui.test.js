'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('/opt/node-tools/node_modules/playwright');
const OUT=path.join(__dirname,'../docs/shots/wp25'),KEY='darb-v3';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch(),errors=[],shots=[];
try{const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+path.join(__dirname,'../index.html')+'?player=1&seed=5');await p.waitForFunction(()=>!!window.__game);await p.locator('#coverGo').click();await wait(750);
await p.evaluate(()=>{__game.setSpeed(0);__game.renderAll(true);});
assert.equal(await p.locator('[data-act=grandchild-open]').count(),0,'لا خيار قبل التقاعد');
const message='يا ولدي: <b>بابل</b>\nلا تُبدّل كلماتي.';
await p.evaluate(message=>{const {S,E}=__game;E.CELEBRATE.on=false;E.A.chooseStart(S,'sa');E.A.learnSetChar(S,'trader');S.player.name='ناصر';S.player.gold=50000;S.day=70*354;Object.assign(S.learn,{level:11,stage:23,stageDone:Array.from({length:22},(_,i)=>i+1),stageIntro:99,intro:11,welcome:99,free:true,zseen:true,datePend:false});const r=E.A.retire(S,{name:'سهيل',will:message});if(!r.ok)throw Error(r.msg);__game.go('home');__game.renderAll(true);E.CELEBRATE.on=true;},message);
// لا تبقى أية كتابة مؤجلة من تجهيز الحالة عند مقارنة الإلغاء.
await wait(1500);
assert(await p.locator('.grandchild-retired [data-act=grandchild-open]').isVisible(),'الخيار في بطاقة التقاعد');
await p.evaluate(()=>{__game.E.GRANDCHILD.on=false;__game.renderAll(true);});assert.equal(await p.locator('[data-act=grandchild-open]').count(),0,'المفتاح يخفي كل المداخل');await p.evaluate(()=>{__game.E.GRANDCHILD.on=true;__game.renderAll(true);});await wait(500);
async function snap(name){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'لا تمرير أفقي');await p.screenshot({path:path.join(OUT,name+'-'+p.viewportSize().width+'.jpg'),type:'jpeg',quality:65});shots.push(name+'-'+p.viewportSize().width+'.jpg');}
const state=await p.evaluate(()=>__game.E.save(__game.S));const storage=await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
if(!(await p.locator('#hMenu').isVisible()))await p.locator('#topDrawer').click();await p.locator('#hMenu').click();assert(await p.locator('#hGrandchild').isVisible(),'الخيار في قائمة ⋯');await snap('option');await p.locator('#hGrandchild').click();assert(await p.locator('#grandchildConfirm').isVisible());await snap('confirm');
assert.match(await p.locator('#grandchildConfirm').innerText(),/ستبدأ لعبة جديدة وتُستبدل مسيرة الجد/);assert.equal(await p.locator('[name=grandchildPerk]:checked').count(),1);
assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')),storage[KEY],'فتح النافذة لا يكتب');await p.locator('[data-act=grandchild-cancel]').click();await wait(500);assert.equal(await p.evaluate(()=>__game.E.save(__game.S)),state);assert.deepEqual(await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),storage,'إلغاء لا يغيّر أي تخزين');
if(await p.evaluate(()=>document.body.classList.contains('hdr-open')))await p.locator('#topDrawer').click();await p.locator('.grandchild-retired [data-act=grandchild-open]').click();await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>__game.E.save(__game.S)),state);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')),storage[KEY]);
await p.locator('.grandchild-retired [data-act=grandchild-open]').click();
const download=await Promise.all([p.waitForEvent('download'),p.locator('[data-act=grandchild-export]').click()]).then(x=>x[0]);const file=await download.path(),envelope=JSON.parse(fs.readFileSync(file,'utf8'));const exported=await p.evaluate(async e=>{const r=window.SaveCode.decode(e.code);return JSON.parse(r.json);},envelope);assert.equal(exported.legacy.father.name,'ناصر');assert.equal(exported.legacy.will.text,message);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')),storage[KEY],'التصدير لا يستبدل المسيرة');
await p.locator('[data-act=grandchild-cancel]').click();assert.equal(await p.evaluate(()=>__game.E.save(__game.S)),state);
// فشل كتابة الحفظ: لا تبديل للحالة ولا لنسخة التراجع السابقة.
await p.evaluate(()=>{window.__storageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='darb-v3')throw new DOMException('full','QuotaExceededError');return __storageSet.call(this,k,v);};});
const beforeRollback=await p.evaluate(()=>localStorage.getItem('darb-save-before-restore'));
await p.locator('.grandchild-retired [data-act=grandchild-open]').click();await p.locator('[data-act=grandchild-start]').click();await p.waitForFunction(()=>document.querySelector('#grandchildStatus')?.textContent.includes('تعذرت الكتابة'));
assert.equal(await p.evaluate(()=>__game.E.save(__game.S)),state);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')),storage[KEY]);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-save-before-restore')),beforeRollback);await p.locator('[data-act=grandchild-cancel]').click();await p.evaluate(()=>{Storage.prototype.setItem=__storageSet;delete window.__storageSet;});
// إلغاء أثناء تجهيز الضغط غير المتزامن: لا كتابة متأخرة للحفيد.
await p.evaluate(()=>{
 window.__NativeCompression=window.CompressionStream;window.__compressionFinished=false;window.__compressionPause=new Promise(resolve=>window.__releaseCompression=resolve);
 window.CompressionStream=function(...args){
  const stream=new window.__NativeCompression(...args),reader=stream.readable.getReader();
  return {writable:stream.writable,readable:new ReadableStream({async pull(controller){
   await window.__compressionPause;const result=await reader.read();
   if(result.done){window.__compressionFinished=true;controller.close();}else controller.enqueue(result.value);
  }})};
 };
});
await p.locator('.grandchild-retired [data-act=grandchild-open]').click();await p.locator('[data-act=grandchild-start]').click();await p.locator('[data-act=grandchild-cancel]').click();await p.evaluate(()=>window.__releaseCompression());await p.waitForFunction(()=>window.__compressionFinished);assert.equal(await p.evaluate(()=>__game.E.save(__game.S)),state);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')),storage[KEY]);await p.evaluate(()=>{window.CompressionStream=__NativeCompression;delete window.__NativeCompression;delete window.__compressionPause;delete window.__releaseCompression;delete window.__compressionFinished;});
// بدء صريح ناجح، ثم إعادة تحميل فعلية وقراءة نسخة التراجع.
await p.locator('.grandchild-retired [data-act=grandchild-open]').click();await p.locator('[name=grandchildPerk][value=purse]').check();await p.locator('[data-act=grandchild-start]').click();await p.waitForFunction(()=>__game.S.ancestry?.name==='ناصر');
assert(await p.locator('.story-page').isVisible(),'الافتتاحية من البداية');assert(await p.locator('#rcpt').isHidden(),'لا إيصال من مسيرة الجد في الافتتاحية');assert.equal(await p.locator('.grandchild-message blockquote').innerText(),message);assert.equal(await p.locator('.grandchild-message b').innerText(),'عمّ سالم');assert(!/مات جد|وفاة|قسمة ميراث/.test(await p.locator('.story-page .story').innerText()),'لا وفاة أو قسمة في افتتاحية الحفيد');
const child=await p.evaluate(()=>({gold:__game.S.player.gold,day:__game.S.day,level:__game.S.learn.level,char:__game.S.learn.char,stage:__game.S.learn.stage,legacy:__game.S.legacy,props:__game.S.player.props}));assert.equal(child.gold,1000);assert.equal(child.day,0);assert.equal(child.level,1);assert.equal(child.char,null);assert.equal(child.legacy,undefined);assert.deepEqual(child.props,{});await snap('start');
const backup=await p.evaluate(()=>localStorage.getItem('darb-save-before-restore'));assert(backup);await p.locator('.story-page [data-act=backup-open]').click();await p.locator('[data-act=backup-undo]').click();await p.waitForFunction(()=>document.querySelector('.backup-preview')?.textContent.includes('سهيل'));assert.equal(await p.evaluate(()=>__game.S.ancestry.name),'ناصر','معاينة نسخة الجد لا تستبدل الحفيد');await p.locator('[data-act=backup-close]').click();await p.reload();await p.waitForFunction(()=>!!window.__game);await p.locator('#coverGo').click();await wait(750);assert.equal(await p.evaluate(()=>__game.S.ancestry.message),message);assert.equal(await p.locator('.grandchild-message blockquote').innerText(),message);
// الخطوات الأصلية: الحكاية، الترحيب، البلد، الاسم، الشخصية، ثم الدرس الأول.
await p.locator('[data-act=storygo]').click();for(let i=0;i<12 && !(await p.locator('[data-act=lstart][data-g=eg]').isVisible());i++){assert(!(await p.locator('#lesson').innerText()).includes('عظّم الله أجرك'));const reply=p.locator('#lesson [data-act=lrep]').first(),next=p.locator('#lesson [data-act=lnext]').first();if(await reply.isVisible())await reply.click();else{assert(await next.isVisible(),'خطوة افتتاحية فعلية');await next.click();}}
await p.locator('[data-act=lstart][data-g=eg]').click();await p.locator('#pname').fill('راشد');await p.locator('[data-act=lname]').click();for(let i=0;i<4 && !(await p.locator('[data-act=lchar][data-g=trader]').isVisible());i++)await p.locator('#lesson [data-act=lnext]').click();await p.locator('[data-act=lchar][data-g=trader]').click();
assert.equal(await p.evaluate(()=>__game.S.learn.stage),1);assert.deepEqual(await p.evaluate(()=>__game.S.learn.stageDone),[]);assert.equal(await p.evaluate(()=>__game.S.ancestry.message),message);
for(let i=0;i<40 && await p.evaluate(()=>!!__game.learnNext());i++){
 const date=p.locator('#lesson [data-act=datego]'),close=p.locator('#lesson [data-act=lclose]:not(:disabled)'),next=p.locator('#lesson [data-act=lnext]'),answer=p.locator('#lesson [data-act=lans]').first();
 if(await date.isVisible())await date.click();else if(await close.isVisible())await close.click();else if(await next.isVisible())await next.click();else if(await answer.isVisible())await answer.click();else throw Error('خطوة مقدمة غير متوقعة: '+JSON.stringify(await p.evaluate(()=>__game.learnNext())));
}
const receipt=p.locator('#rcpt:not([hidden]) [data-act=rcptclose]');if(await receipt.isVisible())await receipt.click();
assert.equal(await p.evaluate(()=>__game.learnNext()),null,'قُرئت مقدمة الدرس الأول بالنقرات');assert.equal(await p.evaluate(()=>__game.S.learn.stage),1);assert.deepEqual(await p.evaluate(()=>__game.S.learn.stageDone),[]);
const peek=p.locator('#salemPeek:not([hidden]) [data-act=peekclose]');if(await peek.isVisible())await peek.click();await p.locator('#toast.show').waitFor({state:'hidden'});
await p.locator('#hAvatar').click();await p.waitForFunction(()=>document.querySelector('#spot').hidden);assert(await p.locator('.grandchild-record').isVisible());assert((await p.locator('.grandchild-record').innerText()).includes('حفيد ناصر'));await p.locator('.grandchild-record details').evaluate(e=>e.open=true);assert.equal(await p.locator('.grandchild-record blockquote').innerText(),message);await p.locator('.grandchild-record').scrollIntoViewIfNeeded();await snap('record');await p.keyboard.press('Escape');
await p.locator('#fdock [data-act=fabtoggle]').click();await p.locator('#fdock [data-act=salem]').click();await p.locator('[data-act=salemtab][data-g=hist]').click();assert.equal(await p.locator('#salemPanel .grandchild-message blockquote').innerText(),message);await snap('journal');
await p.setViewportSize({width:1100,height:844});await p.evaluate(()=>__game.renderAll(true));assert(await p.locator('#hAncestry').isVisible());assert((await p.locator('#hAncestry').innerText()).includes('راشد · حفيد ناصر'));assert.equal(await p.locator('#hTitle').innerText(),await p.evaluate(()=>__game.E.titleOf(__game.E.netWorth(__game.S))));await snap('header');
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'QA.json'),JSON.stringify({screenshots:shots,errors,overflow:false},null,2)+'\n');console.log('PASS grandchild UI: gated options, exact cancellation/storage, real export, failed-write rollback, cancel during compression, explicit restart, reload, fresh introduction and exact story/journal/profile message');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
