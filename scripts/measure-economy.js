#!/usr/bin/env node
'use strict';
// قياس خارجي محدود بأمر المالك: مرة واحدة لكل مصدر، 8 بذور و6 سنوات كحد أقصى.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/review/ECONOMY_TASK15.json'),engine=path.join(root,'src/engine.js');
(async()=>{
 if(process.argv.length>2)throw Error('القياس ثابت: 8 بذور و6 سنوات، بلا خيارات توسعة.');
 const engineHash=crypto.createHash('sha256').update(fs.readFileSync(engine)).digest('hex');
 const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 if(previous?.engineHash===engineHash){console.log('المصدر لم يتغير؛ استُعمل القياس المحفوظ دون إعادة المحاكاة.');process.exitCode=previous.acceptance?.drift&&previous.acceptance?.factory&&previous.acceptance?.farm?0:1;return;}
 const e=require('../test/lib/economy'),seeds=[1,2,3,4,5,6,7,8],years=6,rows=await e.cohort('sector',{seeds,years}),average=e.average(rows);
 const acceptance={drift:Object.values(average.drift).every(v=>Math.abs(v)<=.08),factory:['on','off'].every(k=>average[k].factory>average[k].captain1&&average[k].factory<average[k].shops3&&average[k].factory<=4*average[k].captain1),farm:['on','off'].every(k=>average[k].farm>=3000&&average[k].farm<=8000&&average[k].farm<average[k].captain1)};
 const report={task:16,engineHash,measuredAt:new Date().toISOString(),metric:'annual net-worth change after setup',years,seeds,rows,average,targetDrift:.05,toleratedDrift:.08,acceptance,previousMeasurements:previous?[previous]:[]};
 // لا تُقبل نتيجة مصدر تغيّر أثناء القياس.
 if(crypto.createHash('sha256').update(fs.readFileSync(engine)).digest('hex')!==engineHash)throw Error('تغيّر المصدر أثناء القياس؛ لم تُحفظ نتيجة مختلطة.');
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({average,acceptance}));if(!Object.values(acceptance).every(Boolean))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
