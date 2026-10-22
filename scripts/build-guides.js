'use strict';
const fs=require('fs'),path=require('path'),http=require('http');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'docs/guide'),SRC=path.join(DIR,'src');
const read=f=>fs.readFileSync(path.join(SRC,f),'utf8'),json=f=>JSON.parse(read(f));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function playwright(){for(const p of [process.env.GUIDE_PLAYWRIGHT_PATH,'/opt/node-tools/node_modules/playwright',path.join(ROOT,'node_modules/playwright'),'/workspace/cloud-tools/node_modules/playwright'].filter(Boolean)){try{return require(p);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}}throw Error('يلزم Playwright المتاح في البيئة؛ حدّد GUIDE_PLAYWRIGHT_PATH');}
function mime(f){return /\.webp$/i.test(f)?'image/webp':/\.jpe?g$/i.test(f)?'image/jpeg':'image/png';}
const encoded=new Map();
function data(f){const p=path.resolve(ROOT,f);if(!p.startsWith(ROOT+path.sep)||!fs.existsSync(p))throw Error('صورة غير موجودة: '+f);if(!encoded.has(p))encoded.set(p,'data:'+mime(p)+';base64,'+fs.readFileSync(p).toString('base64'));return encoded.get(p);}
function asset(s){return data(s.startsWith('img/')?'docs/guide/'+s:s);}
async function prepareArt(browser){
const refs=new Set(['brand/img/brand/cover.webp','brand/img/brand/wordmark.webp','brand/img/brand/emblem.webp']);
for(const f of fs.readdirSync(SRC).filter(f=>f.endsWith('.json'))){for(const m of fs.readFileSync(path.join(SRC,f),'utf8').matchAll(/\{\{asset:(brand\/[^}]+)\}\}/g))refs.add(m[1]);}
const page=await browser.newPage();const report=[];
for(const ref of refs){const raw=data(ref),max=ref.includes('/brand/cover')?960:ref.includes('/brand/wordmark')?700:ref.includes('/brand/emblem')?192:ref.includes('/scene/')?960:ref.includes('/city/')?300:ref.includes('/hero/')||ref.includes('/boss/')?260:128;
const result=await page.evaluate(async function(o){const im=new Image();im.src=o.raw;await im.decode();const k=Math.min(1,o.max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);return {url:c.toDataURL('image/webp',.82),width:c.width,height:c.height};},{raw:raw,max:max});
const name='art-'+ref.replace(/^brand\//,'').replace(/\//g,'-').replace(/\.[^.]+$/,'.webp');const binary=Buffer.from(result.url.split(',')[1],'base64');fs.writeFileSync(path.join(DIR,'img',name),binary);encoded.set(path.resolve(ROOT,ref),result.url);report.push({source:ref,file:'img/'+name,width:result.width,height:result.height,bytes:binary.length});
}
await page.close();fs.writeFileSync(path.join(SRC,'images.json'),JSON.stringify(report,null,2)+'\n');
}

function table(head,rows){return '<div class="table-wrap"><table><thead><tr>'+head.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function flow(labels,title){const w=760,h=150,cw=labels.length>4?128:165,boxw=cw-12,start=(w-labels.length*cw)/2;
const wide='<svg class="diagram diagram-wide" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+labels.map((t,i)=>{const x=w-start-(i+1)*cw;return '<rect x="'+x+'" y="35" width="'+boxw+'" height="65" rx="12" fill="#dce8ec" stroke="#476b7e"/><text x="'+(x+boxw/2)+'" y="74" text-anchor="middle">'+esc(t)+'</text>'+(i<labels.length-1?'<path d="M '+(x-2)+' 67 h -10 l 5 -5 m -5 5 l 5 5" fill="none" stroke="#476b7e" stroke-width="2"/>':'');}).join('')+(title==='حلقة اللعب'?'<path d="M 80 106 V 130 H 680 V 106 M 675 112 L 680 106 L 685 112" fill="none" stroke="#476b7e" stroke-width="2"/>':'')+'</svg>';
const height=labels.length*82+18;
const mobile='<svg class="diagram diagram-mobile" viewBox="0 0 330 '+height+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+labels.map((t,i)=>{const y=18+i*82;return '<rect x="60" y="'+y+'" width="230" height="54" rx="12" fill="#dce8ec" stroke="#476b7e"/><text x="175" y="'+(y+34)+'" text-anchor="middle">'+esc(t)+'</text>'+(i<labels.length-1?'<path d="M 175 '+(y+58)+' v 20 m -5 -5 l 5 5 l 5 -5" fill="none" stroke="#476b7e" stroke-width="2"/>':'');}).join('')+(title==='حلقة اللعب'?'<path d="M 58 '+(45+(labels.length-1)*82)+' H 25 V 45 H 58 m -5 -5 l 5 5 l -5 5" fill="none" stroke="#476b7e" stroke-width="2"/>':'')+'</svg>';
return wide+mobile;}
function expand(s,facts,modules,baseline){
const tags={
'module-map':table(['الملف','المسؤولية'],modules.map(x=>[x.path,x.role])),
'economy-baseline':table(['المقياس','النتيجة في التشغيل الفعلي'],[['البذور والأيام','8 بذور × 100 يوم'],['متوسط ثروة اللاعب',baseline.result.summary.avgPlayerNW],['متوسط رصيد التاجر الآلي',baseline.result.summary.avgAgentGold],['قيم غير صالحة',baseline.result.nan],['نسبة فراغ المخزون',baseline.result.summary.floorPct+'%'],['نسبة التخمة',baseline.result.summary.ceilPct+'%']]),
'levels-intro':'<ol class="lesson-intro">'+facts.levels.map(x=>'<li>'+esc(x.title)+'</li>').join('')+'</ol>',
'levels':table(['المستوى','الموضوع','المهمة الفعلية'],facts.levels.map(x=>[x.n,x.title,x.task])),
'characters':table(['الشخصية','الميزة'],facts.characters.map(x=>[x.name,x.perksText.join('؛ ')])),
'cities':table(['المدينة','الدولة','معرّفها'],facts.cities.map(x=>[x.name,facts.countries.find(c=>c.id===x.country).name,x.id])),
'flow-build':flow(['أجزاء المصدر','دمج وبناء','اختبارات','main وPages'],'مسار البناء والاختبار والنشر'),
'flow-code':flow(['بيانات ونصوص','محرك E.A','واجهة وعرض','حالة S'],'حدود الشيفرة والحالة المشتركة'),
'flow-loop':flow(['اقرأ السوق','اشتر بحساب','سافر','بع وراجع'],'حلقة اللعب'),
'flow-deal':flow(['سعر الشراء','الطريق والرسوم','صافي البيع','الربح المحقق'],'مسار الصفقة وتكلفتها'),
'flow-stages':flow(['تجارة متنقلة','دكاكين','صناعة وبحر','إمبراطورية'],'تدرج أطوار اللعبة')
};
s=s.replace(/\[\[([a-z-]+)\]\]/g,(_,k)=>{if(!(k in tags))throw Error('وسم غير معروف: '+k);return tags[k];});
s=s.replace(/\{\{asset:([^}]+)\}\}/g,(_,p)=>asset(p));
return s;
}
async function main(){
require(path.join(SRC,'verify.cjs'))(ROOT);
const pw=playwright();const executable=process.env.GUIDE_CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await pw.chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
let server;
try{
if(process.argv.includes('--shoot')){
server=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const f=path.resolve(ROOT,'.'+rel);if(f!==ROOT&&!f.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}const file=fs.statSync(f,{throwIfNoEntry:false})?.isDirectory()?path.join(f,'index.html'):f;if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.html$/.test(file)?'text/html; charset=utf-8':/\.json$/.test(file)?'application/json':/\.js$/.test(file)?'application/javascript':/\.css$/.test(file)?'text/css':/\.svg$/.test(file)?'image/svg+xml':mime(file));fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));await require(path.join(SRC,'capture.cjs'))(browser,'http://127.0.0.1:'+server.address().port+'/',DIR);
}
await prepareArt(browser);
const meta=json('meta.json'),facts=json('facts.json'),modules=json('modules.json'),baseline=json('economy-baseline.json');
const css=read('theme.css'),js=read('print.js')+'\n'+read('reader.js');
const reports={};
const changes=fs.readFileSync(path.join(DIR,'CHANGELOG.md'),'utf8').split(/\r?\n/).map(l=>l.match(/^- \[(لاعب|مبرمج)\] (\d{4}-\d{2}-\d{2}): (.+)$/)).filter(Boolean);
const changeSection=kind=>({id:kind==='player'?'whatsnew':'dev-changes',title:kind==='player'?'ما الجديد':'ما تغيّر',html:'<ul>'+changes.filter(c=>c[1]===(kind==='player'?'لاعب':'مبرمج')).slice(-20).reverse().map(c=>'<li><bdi>'+esc(c[2])+'</bdi>: '+esc(c[3])+'</li>').join('')+'</ul>'});
for(const kind of ['dev','player']){
const files=kind==='dev'?['dev-core.json','dev-systems.json','dev-tools.json','dev-stages.json']:['player.json'];
const sections=files.filter(f=>fs.existsSync(path.join(SRC,f))).flatMap(json);sections.push(changeSection(kind));
if(kind==='player'&&meta.ready&&sections.length!==13)throw Error('فصول دليل اللاعب غير مكتملة');
if(!sections.length)throw Error('لا محتوى للدليل');const ids=new Set();sections.forEach(s=>{if(ids.has(s.id))throw Error('معرّف مكرر');ids.add(s.id);(s.sources||[]).forEach(f=>{if(!fs.existsSync(path.join(ROOT,f)))throw Error('مصدر مفقود: '+f);});});
const title=kind==='dev'?'دليل المبرمج':'دليل اللاعب',toc=sections.map((s,i)=>'<li><a href="#'+s.id+'">'+(i+1)+'. '+esc(s.title)+'</a></li>').join('');
const body=sections.map((s,i)=>'<section class="guide-section" id="'+s.id+'"><h2><span class="section-number">'+(i+1)+'.</span> '+esc(s.title)+'</h2>'+expand(s.html,facts,modules,baseline)+(kind==='dev'&&s.sources?.length&&!s.html.includes('اختبارات مرتبطة')?'<div class="source"><b>مصادر الشيفرة:</b> '+s.sources.map(f=>'<code>'+esc(f)+'</code>').join(' ')+'</div>':'')+'</section>').join('');
const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+(kind==='player'?'<meta name="guide-version" content="'+esc(meta.version)+'">'+(meta.ready?'<meta name="guide-ready" content="1">':''):'')+'<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; base-uri \'none\'; connect-src \'none\'"><title>'+title+' — درب التجّار</title><style>'+css+'</style></head><body class="'+kind+'-guide"><header class="top"><img src="'+asset('brand/img/brand/emblem.webp')+'" alt=""><strong>'+title+'</strong><select class="mobile-nav" aria-label="انتقل إلى فصل">'+sections.map((s,i)=>'<option value="'+s.id+'">'+(i+1)+'. '+esc(s.title)+'</option>').join('')+'</select>'+(kind==='player'?'<a class="pdf-download" href="player.pdf" download>حمّل نسخة PDF</a>':'<button type="button" data-print>طباعة</button>')+'</header><div class="layout"><nav class="toc" aria-label="فهرس الدليل"><strong>فهرس الدليل</strong><ol>'+toc+'</ol></nav><main><div class="cover"><img class="cover-art" src="'+asset('brand/img/brand/cover.webp')+'" alt="قافلة درب التجّار"><div class="cover-info"><img class="wordmark" src="'+asset('brand/img/brand/wordmark.webp')+'" alt="درب التجّار"><p class="eyebrow">تجارة • رحلة • معرفة</p><h1>'+title+'</h1><p>'+(kind==='dev'?'مرجع عملي لبنية المشروع وأنظمته وأدوات اختباره.':'رفيقك في أول صفقة، ثم في دروب التجارة.')+'</p><p class="version-note">مبني على النسخة: <bdi>'+esc(meta.baseline)+'</bdi> · تاريخ البناء: <bdi>'+esc(meta.date)+'</bdi></p></div></div>'+body+'</main></div><script>'+js+'</script></body></html>';
if(Buffer.byteLength(html)>=(kind==='player'?3000000:8*1024*1024))throw Error('حجم HTML يتجاوز الحد');fs.writeFileSync(kind==='dev'?path.join(SRC,'dev.html'):path.join(DIR,'player.html'),html);
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.context().setOffline(true);await page.setContent(html,{waitUntil:'load'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(im=>im.decode()));});await page.emulateMedia({media:'print'});
const report=await page.evaluate(()=>window.prepareGuidePrint());if(report.overflow.length)throw Error('صفحات طباعة متجاوزة: '+report.overflow.join(','));
await page.evaluate(async()=>{for(const im of document.querySelectorAll('.print-document .shot img,.print-document .cover-art')){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);im.src=c.toDataURL('image/jpeg',.86);await im.decode();}});
await page.pdf({path:path.join(DIR,kind+'.pdf'),format:'A4',preferCSSPageSize:true,printBackground:true,tagged:true,outline:true});
if(errors.length)throw Error(errors.join('\n'));reports[kind]={...report,htmlBytes:Buffer.byteLength(html),pdfBytes:fs.statSync(path.join(DIR,kind+'.pdf')).size};await page.close();
}
fs.writeFileSync(path.join(SRC,'build-report.json'),JSON.stringify(reports,null,2)+'\n');if(process.argv.includes('--check'))await require(path.join(SRC,'check.cjs'))(browser,DIR);const inventory=[];function walkInventory(dir,prefix){for(const f of fs.readdirSync(dir).sort()){const file=path.join(dir,f),rel=prefix+f;if(fs.statSync(file).isDirectory())walkInventory(file,rel+'/');else inventory.push({file:rel,bytes:rel==='src/inventory.json'?null:fs.statSync(file).size});}}walkInventory(DIR,'');if(!inventory.some(x=>x.file==='src/inventory.json'))inventory.push({file:'src/inventory.json',bytes:null});inventory.push({file:'../../scripts/build-guides.js',bytes:fs.statSync(__filename).size});fs.writeFileSync(path.join(SRC,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');console.log(JSON.stringify(reports));
}finally{if(server)await new Promise(r=>server.close(r));await browser.close();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
