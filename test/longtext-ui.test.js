const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async()=>{const b=await chromium.launch();try{
 const ctx=await b.newContext({viewport:{width:390,height:850}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'../index.html')+'?learn=1&seed=4');await p.waitForTimeout(900);
 await p.evaluate(()=>{const g=__game,S=g.S;g.E.A.learnSetChar(S,'trader');S.learn.level=11;S.learn.free=true;S.learn.intro=11;['tq','eq','bq','csq','fq','up','sq','rq','cq'].forEach(k=>S.learn[k]=[]);g.renderAll(true);});
 // درس حقيقي: لا إعادة كتابة للنص عند الطي، ولا مساس بحوار المرشد.
 await p.evaluate(()=>{const e=document.createElement('button');e.dataset.act='lview';e.dataset.g='6';document.body.append(e);e.click();e.remove();});
 // الدرس الحالي قصير، فلا يطوى. نضيف فقرة اختبار طويلة لقياس حد العرض دون تعديل بيانات اللعبة.
 assert.equal(await p.locator('#lesson .long-read').count(),0);
 await p.evaluate(()=>{const e=document.querySelector('#lesson .lesson'),p=document.createElement('p');p.textContent='فقرة اختبار للقراءة على شاشة صغيرة. '.repeat(25);e.append(p);__game.renderAll(true);});
 const el=p.locator('#lesson .long-read').first();assert.ok(await el.count(),'long lesson folded');
 const paragraphs=await el.locator('.long-full p').allTextContents();const full=paragraphs.join('');assert.ok(full.length>600);assert.equal(await el.locator('.long-toggle').getAttribute('aria-expanded'),'false');
 await el.locator('.long-toggle').click();for(const text of paragraphs) assert.ok((await el.innerText()).includes(text.trim()));
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('darb-ui')).longTextOpen),true);
 await el.locator('.long-toggle').click();assert.equal(await el.locator('.long-full').isVisible(),false);
 // آلية مشتركة للأب والتقرير: فقرات وعناصر SVG تبقى عقدها الأصلية بعد الفتح.
 await p.evaluate(()=>{const e=document.createElement('section');e.dataset.history='';e.id='test-history';const p=document.createElement('p');p.textContent='حفظ النص الكامل للاعب. '.repeat(40);e.append(p);document.body.append(e);window.__originalTextNode=p;__game.renderAll(true);});
 assert.equal(await p.locator('#test-history .long-toggle').getAttribute('aria-expanded'),'false');
 await p.locator('#test-history .long-toggle').evaluate(e=>e.click());
 assert.equal(await p.evaluate(()=>document.querySelector('#test-history .long-full p')===window.__originalTextNode),true);
 assert.ok((await p.locator('#test-history').innerText()).includes('حفظ النص الكامل للاعب. '.repeat(40).trim()));
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.setViewportSize({width:1100,height:850});assert.ok(await p.locator('#lesson .long-full').first().isVisible());
 assert.equal(await p.locator('#lesson .long-toggle').first().isVisible(),false);
 await p.setViewportSize({width:390,height:850});
 await p.evaluate(()=>{const d=document.createElement('details');d.className='card';d.id='test-details';d.open=true;d.innerHTML='<summary>عنوان القائمة</summary><p>'+ 'نص قائمة مطولة. '.repeat(60)+'</p>';document.querySelector('#lesson .lbox').append(d);__game.renderAll(true);});
 assert.equal(await p.locator('#test-details > summary').count(),1,'native summary stays direct child');
 assert.equal(await p.locator('#test-details .long-toggle').count(),1);
 assert.deepEqual(errors,[]);await ctx.close();console.log('OK longtext-ui: real lesson, 600 characters, complete text, original nodes, preference, responsive width');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
