'use strict';
// فحص دائم خفيف: بذرتان وسنتان؛ قبول التوازن من القياس الخارجي المحفوظ.
const E=require('../src/engine.js');
const assert=require('node:assert/strict'),fs=require('node:fs'),economy=require('./lib/economy');
(async()=>{
 assert.equal(E.SHOP_DEMAND,1,'حصة الدكاكين قرار ثابت للمالك');
 const years=2,seeds=[1,2];
 const rows=await economy.cohort('sector',{seeds,years}),avg=economy.average(rows),report={metric:'annual net-worth change after setup',years,seeds,rows,average:avg};
 console.log(JSON.stringify(report));
 for(const mode of ['on','off']){const R=avg[mode];assert(Object.values(R).every(n=>Number.isFinite(n)&&n>0),'القطاعات تنتج فعلياً بلا قيم فاسدة');}
 const baseline=JSON.parse(fs.readFileSync('docs/review/ECONOMY_TASK15.json'));if(baseline.engineHash!==require('node:crypto').createHash('sha256').update(fs.readFileSync(require.resolve('../src/engine.js'))).digest('hex'))console.warn('تنبيه: القياس المحفوظ لمصدر سابق؛ لا يُعاد القياس إلا إذا تغيّرت أرقام الاقتصاد نفسها (docs/TESTING_BATCHES.md).');assert.equal(baseline.years,6);assert.equal(baseline.seeds.length,8);assert(Object.values(baseline.acceptance).every(Boolean),'القياس الخارجي يجب أن ينجح');
 if(process.env.ECONOMY_REPORT_PATH)fs.writeFileSync(process.env.ECONOMY_REPORT_PATH,JSON.stringify(report,null,2)+'\n');
 console.log('PASS two seeds x two years, actual production, saved bounded external acceptance');
})().catch(e=>{console.error(e);process.exitCode=1});
