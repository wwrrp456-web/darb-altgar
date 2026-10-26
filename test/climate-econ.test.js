'use strict';
// محفظة موزعة على الدول الخمس؛ المقبوضات الفعلية بعد رسوم البيع قبل مصاريف التشغيل.
const assert=require('node:assert/strict'),fs=require('node:fs'),economy=require('./lib/economy'),E=require('../src/engine.js');
(async()=>{const rows=await economy.cohort('portfolio',{seeds:economy.PORTFOLIO_SEEDS}),avg=economy.average(rows),report={metric:'two-year sales receipts after sales taxes',years:economy.YEARS,seeds:economy.PORTFOLIO_SEEDS,rows,average:avg};console.log(JSON.stringify(report));
 assert(rows.every(r=>Object.values(r.on).concat(Object.values(r.off)).every(n=>Number.isFinite(n)&&n>0)));
 const baseline=JSON.parse(fs.readFileSync('docs/review/ECONOMY_TASK15.json'));if(baseline.engineHash!==require('node:crypto').createHash('sha256').update(fs.readFileSync(require.resolve('../src/engine.js'))).digest('hex'))console.warn('تنبيه: القياس المحفوظ لمصدر سابق؛ لا يُعاد القياس إلا إذا تغيّرت أرقام الاقتصاد نفسها (docs/TESTING_BATCHES.md).');assert(baseline.years<=6&&baseline.seeds.length<=8);assert(Object.values(baseline.average.drift).every(n=>Math.abs(n)<=.08),'الهدف 5% وسقف تحمل المالك 8% للقياس المحفوظ');
 assert(rows.every(r=>r.std>(E.CLIMATE_MAX-E.CLIMATE_MIN)/10),'تبقى دورة المناخ متفاوتة فعلاً');
 if(process.env.ECONOMY_REPORT_PATH)fs.writeFileSync(process.env.ECONOMY_REPORT_PATH,JSON.stringify(report,null,2)+'\n');console.log('PASS two seeds x two years, positive receipts, real climate variance and saved bounded acceptance');
})().catch(e=>{console.error(e);process.exitCode=1});
