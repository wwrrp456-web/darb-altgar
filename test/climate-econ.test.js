'use strict';
// محفظة موزعة على الدول الخمس؛ المقبوضات الفعلية بعد رسوم البيع قبل مصاريف التشغيل.
const assert=require('node:assert/strict'),fs=require('node:fs'),economy=require('./lib/economy'),E=require('../src/engine.js');
(async()=>{const rows=await economy.cohort('portfolio',{seeds:economy.PORTFOLIO_SEEDS}),avg=economy.average(rows),report={metric:'twelve-year sales receipts after sales taxes',years:economy.YEARS,seeds:economy.PORTFOLIO_SEEDS,rows,average:avg};console.log(JSON.stringify(report));
 assert(rows.every(r=>Object.values(r.on).concat(Object.values(r.off)).every(n=>Number.isFinite(n)&&n>0)));
 for(const k of E.CLIMATE_SECTORS)assert(Math.abs(avg.drift[k])<=.05,k+': متوسط مقبوضات القطاع مع المناخ ضمن 5%');
 const total=(Object.values(avg.on).reduce((a,b)=>a+b)/Object.values(avg.off).reduce((a,b)=>a+b))-1;assert(Math.abs(total)<=.05);
 assert(rows.every(r=>r.std>(E.CLIMATE_MAX-E.CLIMATE_MIN)/10),'تبقى دورة المناخ متفاوتة فعلاً');
 if(process.env.ECONOMY_REPORT_PATH)fs.writeFileSync(process.env.ECONOMY_REPORT_PATH,JSON.stringify(report,null,2)+'\n');console.log('PASS each sector and total within 5% across twenty fixed seeds and twelve simulation years; no optional acceptance flag');
})().catch(e=>{console.error(e);process.exitCode=1});
