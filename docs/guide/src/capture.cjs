'use strict';
const fs=require('fs'),path=require('path');
module.exports=async function(browser,url,root){
const shots=[],evidence={baseline:JSON.parse(fs.readFileSync(path.join(root,'src/meta.json'))).baseline,capturedAt:new Date().toISOString(),seed:37,start:'sa',character:'trader',actions:[]};
async function context(width,height){const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const p=await c.newPage();await p.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'||u.protocol==='data:'?r.continue():r.abort()});return [c,p];}
async function snap(p,name,caption){await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})))});await p.waitForFunction(()=>!document.querySelector('#toast.show'),null,{timeout:5000});await p.waitForTimeout(220);const raw='data:image/jpeg;base64,'+(await p.screenshot({type:'jpeg',quality:88,animations:'disabled'})).toString('base64');let data;for(const quality of [.8,.7,.6,.5]){const encoded=await p.evaluate(async o=>{const im=new Image();im.src=o.raw;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/webp',o.quality)},{raw,quality});data=Buffer.from(encoded.split(',')[1],'base64');if(data.length<=150000)break}if(data.length>150000)throw Error('لقطة أكبر من الحد: '+name);fs.writeFileSync(path.join(root,'img',name+'.webp'),data);shots.push({file:'img/'+name+'.webp',...p.viewportSize(),bytes:data.length,scenario:caption});}
// Photograph the real welcome flow, including choices before completing them.
{
 const [c,p]=await context(390,844);await p.goto(url+'?learn=1&cover=1&seed=37');await p.waitForFunction(()=>!!window.__game);await p.waitForSelector('#coverGo');await snap(p,'start-cover','الغلاف الحالي قبل الدخول إلى اللعبة');await p.locator('#coverGo').click();await p.waitForSelector('.story-page');await snap(p,'start-story','صفحة الحكاية الحالية قبل ظهور الشريط والأزرار الأخرى');const begin=p.locator('[data-act=storygo]');if(await begin.count())await begin.click();
 const seen=new Set();
 for(let n=0;n<90&&seen.size<4;n++){
  if(await p.locator('#lesson [data-act=lstart]').count()){if(!seen.has('country')){await snap(p,'start-country','اختيار دولة البداية في ترحيب عمّ سالم');seen.add('country')}await p.locator('#lesson [data-act=lstart][data-g=sa]').click();}
  else if(await p.locator('#lesson #pname').count()){await p.fill('#pname','راشد');if(!seen.has('name')){await snap(p,'start-name','كتابة اسم التاجر');seen.add('name')}await p.locator('#lesson [data-act=lname]').click();}
  else if(await p.locator('#lesson [data-act=lchar]').count()){await snap(p,'start-character','اختيار الشخصية من الشخصيات الخمس');seen.add('character');await p.locator('#lesson [data-act=lchar][data-g=trader]').click();await p.waitForSelector('#lesson [data-act=datego]');await snap(p,'start-date','اختيار تاريخ الانطلاق قبل بدء الرحلة');seen.add('date');}
  else if(await p.locator('#lesson [data-act=lnext]').count())await p.locator('#lesson [data-act=lnext]').first().click();
  else if(await p.locator('#lesson [data-act=lrep]').count())await p.locator('#lesson [data-act=lrep]').first().click();
  else await p.waitForTimeout(150);
 }
 if(seen.size!==4)throw Error('لم تُصوّر خطوات البداية كاملة');await c.close();
}
for(const size of [{width:390,height:844,label:'mobile'},{width:1280,height:900,label:'desktop'}]){
 const [c,p]=await context(size.width,size.height);await p.goto(url+'?seed=37');await p.waitForFunction(()=>!!window.__game);
 await p.evaluate(()=>{const g=__game;g.E.A.chooseStart(g.S,'sa');g.E.A.setName(g.S,'راشد');g.E.A.learnSetChar(g.S,'trader');g.E.A.setStart(g.S,g.E.CAL.MIN);g.setSpeed(0);g.go('market')});
 await snap(p,size.label+'-market','سوق الرياض، بداية عادية ببذرة37');
 if(size.label==='mobile'){
  const chosen=await p.evaluate(()=>{const {E,S}=__game,car=S.player.caravans[0],g='perfume',q=5,quote=E.quoteBuy(S,car.city,g,q,S.player.gold);const dest=E.sellOptions(S,car.city,g,quote.n,quote.avg,car).find(x=>!E.travelBlock(S,car,x.city)&&x.profit>0);if(!dest)throw Error('لا صفقة محلية مناسبة');return {good:g,goodName:E.GD[g].name,n:quote.n,buy:quote.cost,from:car.city,fromName:S.cities[car.city].name,to:dest.city,toName:S.cities[dest.city].name}});
  evidence.trade=chosen;evidence.actions.push({action:'buy',ok:true});
  const gd=p.locator('[data-gd="perfume"]');if(!await gd.count())throw Error('تفاصيل السلعة غير موجودة');await gd.first().click();await p.locator('#modal .qin[data-k=m]').fill('5');await p.locator('#modal .qin[data-k=m]').dispatchEvent('change');await snap(p,'first-buy','مراجعة كمية5عطور وثمنها قبل الشراء');await p.locator('#modal [data-act=buy][data-g=perfume]').first().click();await p.evaluate(()=>{if(__game.S.player.caravans[0].cargo.perfume!==5)throw Error('لم يتم الشراء الفعلي من الواجهة')});await p.keyboard.press('Escape');
  const trip=await p.evaluate(to=>{const g=__game,c=g.S.player.caravans[0],r=g.E.A.travel(g.S,c.id,to,0);if(!r.ok)throw Error(r.msg);g.go('map');return r},chosen.to);evidence.travel=trip;
  await p.locator('[data-mc=sa]').first().click();await p.evaluate(()=>{const e=document.querySelector('.map-atlas');scrollTo(0,scrollY+e.getBoundingClientRect().top-12)});await snap(p,'first-trip','رحلة برية حقيقية من '+chosen.fromName+' إلى '+chosen.toName+'، بالنمط العادي');
  const sale=await p.evaluate(()=>{const g=__game,{E,S}=g,c=S.player.caravans[0];let n=0;while(c.left>0&&n++<200)E.tick(S);if(c.left)throw Error('الرحلة لم تصل');const q=E.quoteSell(S,c.city,'perfume',c.cargo.perfume),r=E.A.sell(S,c.id,'perfume',999);if(!r.ok)throw Error(r.msg);g.go('market');return {result:r,quote:q,day:S.day,remaining:c.cargo.perfume||0,ledger:S.player.led.exp,net:q.net,profit:r.pl,expenses:{road:S.player.led.exp.provisions||0,wages:S.player.led.exp.wages||0,wear:S.player.led.exp.wear||0,customs:S.player.led.exp.customs||0}}});
  evidence.sale=sale;evidence.actions.push({action:'travel',ok:true},{action:'sell',ok:true});
  await snap(p,'first-sale','السوق بعد الوصول والبيع الفعلي؛ لم تعد العطور ضمن الحمولة');
 }
 // Controlled later-stage fixture: actual actions build its properties; no developer mode.
 const setup=await p.evaluate(()=>{const g=__game,{E,S}=g;S.learn.level=11;S.learn.intro=11;S.learn.rest=null;S.learn.abroad=true;S.player.gold=150000;E.tick(S);const city=S.player.caravans[0].city;const actions=[['buildShop',E.A.buildShop(S,city)],['buildWarehouse',E.A.buildWarehouse(S,city)],['buildFarm',E.A.buildFarm(S,city)]];g.setSpeed(0);return actions.map(([action,r])=>({action,ok:r.ok,msg:r.msg}))});
 if(setup.some(x=>!x.ok))throw Error('تعذر تجهيز حالة العقارات');if(size.label==='mobile')evidence.laterFixture={description:'حالة مضبوطة لتصوير الشاشات المتقدمة؛ ليست حفظًا متصلًا للمبتدئ',phase:4,level:11,actions:setup};
 for(const screen of ['home','map','caravan','estate','lords','empire','academy','cities']){await p.evaluate(s=>{__game.go(s);scrollTo(0,0)},screen);if(screen==='map'){if(size.label==='mobile')await p.locator('[data-mc=sa]').first().click();await p.evaluate(()=>{const e=document.querySelector('.map-atlas');scrollTo(0,scrollY+e.getBoundingClientRect().top-12)})}else if(screen!=='home'){await p.evaluate(()=>{const e=document.getElementById('screen');scrollTo(0,scrollY+e.getBoundingClientRect().top-110)})}await snap(p,size.label+'-'+screen,'شاشة '+screen+' في حالة متقدمة مضبوطة، دون تفعيل وضع المطور');}
 if(size.label==='mobile'){
  await p.evaluate(()=>__game.go('cities'));await p.locator('[data-ct=fx]').click();await snap(p,'mobile-fx','الصرافة الفعلية ومحافظ العملات والمعادن');
  await p.evaluate(()=>__game.go('market'));await p.locator('#hSar').click();await snap(p,'mobile-wallet','قائمة الريال المستقلة في الشريط العلوي');
 }
 await c.close();
}
fs.writeFileSync(path.join(root,'src','screenshots.json'),JSON.stringify(shots,null,2)+'\n');
fs.writeFileSync(path.join(root,'src','play-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
};
