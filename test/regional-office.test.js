'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},require:require('node:module').createRequire(require.resolve('../src/engine.js')),console};
vm.runInNewContext(fs.readFileSync('src/engine.js','utf8').replace('const API = { ','const API = { rentDay, staffDay, '),box);const E=box.module.exports;
const S=E.newGame(12);S.phase=3;S.player.wallet.sar=1e5;
a(E.A.rentShop(S,'riyadh','stall').ok);a(E.A.rentShop(S,'hail','stall').ok);
for(const pr of Object.values(S.player.props))for(const w of pr.staff||[])w.free=0;
let raw=E.save(S),q=E.regionalOfficeQuote(S,'riyadh');a(q.ok&&q.present&&q.wages>0&&q.rent>0);a.equal(E.save(S),raw,'معاينة المكتب قراءة فقط');a.equal(E.regionalOfficeQuote(S,'__proto__').ok,false);
S.player.wallet.sar=0;for(const city of ['riyadh','hail']){const pr=S.player.props[city];E.rentDay(S,city,pr,S.cities[city]);E.staffDay(S,city,pr,S.cities[city]);}
q=E.regionalOfficeQuote(S,'riyadh');a(q.due>0&&q.wageDue>0&&q.rentDue>0);const outside=E.regionalOfficeQuote(S,'hail').due;
S.player.wallet.usd=10000;raw=E.save(S);a.equal(E.A.officePay(S,'riyadh','all').ok,false);a.equal(E.save(S),raw,'لا تحويل منUSDولا خصم جزئي عند نقصSAR');
S.player.wallet.sar=10000;raw=E.save(S);a.equal(E.A.officePay(S,'hail','all').ok,false);a.equal(E.save(S),raw,'لا سداد من مكتب بعيد');
const balance=S.player.wallet.sar,usd=S.player.wallet.usd;S.ctxCur='usd';let r=E.A.officePay(S,'riyadh','wages');a(r.ok);a(Math.abs(S.player.wallet.sar-(balance-q.wageDue))<1e-6);a.equal(S.player.wallet.usd,usd);a.equal(S.ctxCur,'sar');a.equal(E.regionalOfficeQuote(S,'hail').due,outside);
a.equal(E.regionalOfficeQuote(S,'riyadh').wageDue,0);a.equal(E.regionalOfficeQuote(S,'riyadh').rentDue,q.rentDue);raw=E.save(S);a.equal(E.A.officePay(S,'riyadh','wages').ok,false);a.equal(E.save(S),raw,'لا تكرار السداد');
a(E.A.officePay(S,'riyadh','rent').ok);a.equal(E.regionalOfficeQuote(S,'riyadh').due,0);const history=E.regionalPaymentHistory(S,'riyadh');a(Math.abs(history[0].via.office-q.due)<1e-6);a.equal(E.regionalPaymentHistory(S,'hail')[0].via.office,undefined);
let T=E.load(E.save(S));a.equal(JSON.stringify(E.regionalPaymentHistory(T,'riyadh')),JSON.stringify(history));a.equal(T.player.props.riyadh.shops[0].arrears,0);a(T.player.props.riyadh.staff.every(w=>!w.late));
// المبالغ التلقائية تبقى كما هي وتُنسب إلى مدينتها دون إضافتها ثانيةً إلى الإجمالي.
T.player.wallet.sar=1e5;T.ctxCur='sar';const before=T.player.wallet.sar,pr=T.player.props.hail,sh=pr.shops[0],prior=E.paymentHistory(T)[0].paid.rent||0;
E.rentDay(T,'hail',pr,T.cities.hail);a.equal(before-T.player.wallet.sar,sh.rent);a.equal(E.paymentHistory(T)[0].paid.rent-prior,sh.rent);a.equal(E.regionalPaymentHistory(T,'hail')[0].via.auto,sh.rent);
// لا اختلاق لتفصيل قديم، وترحيل البنى الفاسدة، وبقاء حد60يوماً.
T.paymentBook.days[0].regions.unknown={paid:{staff:100},via:{office:100}};T.paymentBook.days[0].regions.riyadh.paid.bad=123;
T=E.load(E.save(T));a.equal(T.paymentBook.days[0].regions.unknown,undefined);a.equal(T.paymentBook.days[0].regions.riyadh.paid.bad,undefined);
for(let d=1;d<=70;d++){T.day=d;E.rentDay(T,'hail',T.player.props.hail,T.cities.hail);}
a(T.paymentBook.days.length<=60);a(E.regionalPaymentHistory(T,'hail').length<=30);a.equal(E.regionalPaymentHistory(E.newGame(7),'riyadh').length,0);
console.log('PASS office: real local dues, readonly estimates, wages/rent filters, SAR only, atomic refusal, presence, duplicate prevention, regional ledger, auto debit unchanged, migration and bounded history');
