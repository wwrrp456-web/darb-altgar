'use strict';
// قص تقني للمعاينات المعتمدة؛ لا يغير الأصول في brand/img.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'brand/lazy/city');
const sheets={riyadh:[0,320,657,1024],jeddah:[0,343,684,1024]};
const variants=['dawn','noon','dusk','night','ramadan','eid'];
(async()=>{fs.mkdirSync(out,{recursive:true});for(const [city,rows]of Object.entries(sheets))for(let i=0;i<6;i++){
 const row=Math.floor(i/2),file=city+'_'+variants[i]+'.webp';
 await sharp(path.join(root,'docs/review/city-previews',city+'-sheet.webp')).extract({left:(i%2)*768+2,top:rows[row]+2,width:764,height:rows[row+1]-rows[row]-4}).resize(768,329,{fit:'cover'}).webp({quality:83}).toFile(path.join(out,file));
 console.log(file);
}})().catch(e=>{console.error(e);process.exitCode=1;});
