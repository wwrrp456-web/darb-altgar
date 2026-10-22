'use strict';
const fs=require('fs'),path=require('path');
module.exports=async function(browser,dir){
const result={views:[],contrast:[],screenshots:[]};
for(const kind of ['player','dev']){
 const file=path.join(dir,kind==='dev'?'src/dev.html':'player.html'),html=fs.readFileSync(file,'utf8');
 if(Buffer.byteLength(html)>(kind==='player'?3000000:8*1024*1024))throw Error('حجم الدليل أكبر من الحد');
 if(/[\u0660-\u0669\u06f0-\u06f9]/.test(html))throw Error('أرقام غير لاتينية');
 for(const width of [320,360,390,760,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},offline:true,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.setContent(html,{waitUntil:'load'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()))});
  const check=await page.evaluate(()=>({rtl:document.documentElement.dir==='rtl',overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length,images:[...document.images].every(im=>im.complete&&im.naturalWidth>0),placeholder:/\[object Object\]|\bundefined\b/.test(document.querySelector('main').innerText),ready:document.querySelector('meta[name="guide-ready"]')?.content==='1',whatsnew:document.querySelector('#whatsnew')?.textContent||'',chapters:document.querySelectorAll('main > section').length}));
  if(!check.rtl||check.overflow||check.broken||!check.images||check.placeholder||errors.length||requests.length)throw Error('فحص العرض فشل: '+JSON.stringify({kind,width,check,errors,requests}));
  if(kind==='player'){
   if(check.chapters!==13||!check.whatsnew)throw Error('الفصول غير مكتملة');
   const titles=await page.locator('#welcome .lesson-intro li').allTextContents(),expected=JSON.parse(fs.readFileSync(path.join(dir,'src/facts.json'))).levels.map(x=>x.title);if(JSON.stringify(titles)!==JSON.stringify(expected))throw Error('ترتيب عناوين الدروس في المقدمة لا يطابق المصدر');
   const link=await page.locator('.pdf-download').getAttribute('href');if(link!=='player.pdf'||!fs.existsSync(path.join(dir,link)))throw Error('رابط PDF غير صالح');
   await page.locator('.mobile-nav').count();
   if(width<900){await page.selectOption('.mobile-nav','whatsnew');await page.waitForFunction(()=>{const r=document.getElementById('whatsnew').getBoundingClientRect(),h=document.querySelector('.top').getBoundingClientRect();return r.top>=h.bottom-2&&r.top<innerHeight-60});if(await page.evaluate(()=>location.hash)!=='#whatsnew')throw Error('فهرس الجوال لا يعمل');}
  }
  result.views.push({kind,width,...check,errors:errors.length,networkRequests:requests.length});await ctx.close();
 }
}
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),lum=h=>rgb(h).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
for(const [fg,bg] of [['#343f46','#fbf6ed'],['#343f46','#fffdf7'],['#304f60','#dce8ec'],['#ffffff','#476b7e'],['#815b2d','#fffdf7']]){const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)throw Error('التباين أقل من الحد');result.contrast.push({fg,bg,ratio:+ratio.toFixed(2)})}
for(const shot of JSON.parse(fs.readFileSync(path.join(dir,'src/screenshots.json')))){const bytes=fs.statSync(path.join(dir,shot.file)).size;if(bytes>150000)throw Error('لقطة أكبر من الحد');result.screenshots.push({file:shot.file,bytes,width:shot.width})}
fs.writeFileSync(path.join(dir,'src/quality.json'),JSON.stringify(result,null,2)+'\n');return result;
};
