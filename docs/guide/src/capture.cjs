'use strict';
const fs=require('fs'),path=require('path');
module.exports=async function(browser,url,root){
const shots=[];
for(const size of [{width:390,height:844,label:'mobile'},{width:1280,height:900,label:'desktop'}]){
const context=await browser.newContext({viewport:{width:size.width,height:size.height},serviceWorkers:'block'});
const page=await context.newPage();
await page.route('**/*',function(route){const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||u.protocol==='data:'?route.continue():route.abort();});
await page.goto(url+'?seed=37');await page.waitForFunction(function(){return !!window.__game;});
await page.evaluate(function(){const g=window.__game;g.E.A.chooseStart(g.S,'sa');g.E.A.setName(g.S,'راشد');g.E.A.learnSetChar(g.S,'trader');g.setSpeed(0);g.go('market');});
await page.waitForTimeout(350);await page.evaluate(async function(){await Promise.all(Array.from(document.images).map(function(im){return im.decode().catch(function(){});}));});
const dest=path.join(root,'img',size.label+'-market.jpg');let data;
for(const quality of [76,65,54,42]){data=await page.screenshot({type:'jpeg',quality:quality,animations:'disabled'});if(data.length<=150000)break;}
if(data.length>150000)throw Error('لقطة أكبر من الحد');fs.writeFileSync(dest,data);
shots.push({file:'img/'+path.basename(dest),width:size.width,height:size.height,bytes:data.length,scenario:'سوق الرياض بعد اختيار التاجر المتجول، بذرة 37، دون تفعيل وضع المطور'});
await context.close();
}
fs.writeFileSync(path.join(root,'src','screenshots.json'),JSON.stringify(shots,null,2)+'\n');
};
