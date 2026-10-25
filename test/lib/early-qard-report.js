'use strict';
const a=require('node:assert/strict'),report=require('../../docs/review/EARLY_QARD_TASK25.json'),{fingerprint}=require('../../scripts/measure-early-qard');
module.exports=function(){
 a.equal(report.fingerprint,fingerprint(),'قياس القرض يطابق المحرك واقتراح الواجهة');a.deepEqual(report.seeds,[1,2,3,4,5,6,7,8]);a.equal(report.rows.length,8);
 for(const r of report.rows){for(const key of ['skilled','novice']){const x=r[key];a.equal(x.issued,1);a(x.trades>0);a(x.history.some(h=>h.onTime&&h.paidAt===x.firstPaid));a.equal(x.vault,2000,'لم تسدد الحصالة القرض');a.equal(x.paidIn90,x.firstPaid!==null&&x.firstPaid<=90);a(x.profit>0);}
 a.equal(r.twoLoans.issued,2);a.equal(r.twoLoans.history.length,2);a.equal(r.noLoan.issued,0);a.equal(r.twoLoans.startWorth,r.noLoan.startWorth);a.equal(r.twoLoans.days,354);a.equal(r.noLoan.days,354);a.equal(r.advantage,(r.twoLoans.endWorth-r.noLoan.endWorth)/Math.max(1,Math.abs(r.noLoan.endWorth)));
 }
 const skilled=report.rows.filter(r=>r.skilled.paidIn90).length/8,novice=report.rows.filter(r=>r.novice.paidIn90).length/8,mean=report.rows.reduce((s,r)=>s+r.advantage,0)/8;
 a.equal(report.skilledRate,skilled);a.equal(report.noviceRate,novice);a.equal(report.meanAdvantage,mean);a(skilled>=.9);a(novice>=.7);a(mean<=.15,'اختبار المتوسط المعلن فقط؛ ليس ضماناً لكل بذرة');
 console.log('PASS saved loan cohort: real trades, repayments, unchanged vault, paired capital,90%/70%, declared mean bound; per-seed dispersion remains documented');
};
