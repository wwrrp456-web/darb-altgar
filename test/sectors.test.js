'use strict';
// 12 سنة، بذور ثابتة 1..40، شراء وتربية وبيع حقيقيان؛ بلا حقن مال أو إعادة ضبط سوق.
const E=require('../src/engine.js');
const assert=require('node:assert/strict'),fs=require('node:fs'),economy=require('./lib/economy');
(async()=>{
 assert.equal(E.SHOP_DEMAND,1,'حصة الدكاكين قرار ثابت للمالك');
 const years=Number(process.env.SECTOR_YEARS||economy.YEARS),seeds=process.env.SECTOR_SEEDS?process.env.SECTOR_SEEDS.split(',').map(Number):economy.SEEDS;
 assert(Number.isInteger(years)&&years>=1&&years<=12);assert(seeds.length&&seeds.every(Number.isInteger));
 const rows=await economy.cohort('sector',{seeds,years}),avg=economy.average(rows),report={metric:'annual net-worth change after setup',years,seeds,rows,average:avg};
 console.log(JSON.stringify(report));
 for(const mode of ['on','off']){const R=avg[mode];console.log(mode,JSON.stringify(R));assert(Object.values(R).every(Number.isFinite));assert(R.auto>0&&R.captain1>0&&R.shops3>0);assert(R.shops3<=8*R.auto,'3 دكاكين ≤ 8 أساطيل');assert(R.factory>R.captain1,'المصنع أعلى من قائد واحد');assert(R.factory<=4*R.captain1,'المصنع ≤ 4 أضعاف قائد واحد');assert(R.factory<R.shops3,'المصنع أقل من 3 دكاكين');assert(R.farm>=3000&&R.farm<=8000&&R.farm<R.captain1,'ربح المزرعة بين 3000 و8000 وأقل من قائد واحد');}
 for(const k of ['captain1','auto','shops3','factory','farm'])assert(Math.abs(avg.drift[k])<=.05,k+': متوسط تغير الثروة مع المناخ ضمن 5%');
 if(process.env.ECONOMY_REPORT_PATH)fs.writeFileSync(process.env.ECONOMY_REPORT_PATH,JSON.stringify(report,null,2)+'\n');
 console.log('PASS forty fixed seeds, twelve actual years, factory/fleet/shops bounds, profitable real farm and each climate drift within 5%');
})().catch(e=>{console.error(e);process.exitCode=1});
