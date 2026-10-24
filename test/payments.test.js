'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},require:require('node:module').createRequire(require.resolve('../src/engine.js')),console};
vm.runInNewContext(fs.readFileSync('src/engine.js','utf8').replace('const API = { ','const API = { pPay, rentDay, staffDay, mgrDay, paymentRecord, '),box);
const E=box.module.exports;
function fresh(){const S=E.newGame(3);S.phase=3;S.player.gold=1e5;assert(E.A.rentShop(S,'riyadh','stall').ok);delete S.paymentBook;return S;}
let S=fresh(),pr=S.player.props.riyadh,sh=pr.shops[0];
S.player.gold=sh.rent/2;E.rentDay(S,'riyadh',pr,S.cities.riyadh);
assert.equal(S.paymentDues[0].amount,sh.rent/2);assert.equal(S.paymentBook.days[0].paid.rent,sh.rent/2);
assert.equal(E.A.settlePayment(S,S.paymentDues[0].id).ok,false,'الرصيد الناقص لا يخصم شيئاً');
const due={...S.paymentDues[0]},rentPaid=sh.rentPaid;S.player.gold=1000;
const res=E.A.settlePayment(S,due.id);assert(res.ok);assert.match(res.msg,/دفعت/);
assert.equal(S.player.gold,1000-due.amount);assert.equal(sh.rentPaid,rentPaid+sh.rent/2);assert.equal(sh.arrears,0);
assert.equal(E.A.settlePayment(S,due.id).ok,false,'لا خصم ثانياً');
assert.equal(S.paymentBook.days[0].paid.rent,sh.rent);
// مبلغ المتأخر لا يتغير عندما يرتقي العامل ويتغير أجره.
S=fresh();pr=S.player.props.riyadh;const w=pr.staff[0];w.free=0;w.days=38;S.player.gold=0;
E.staffDay(S,'riyadh',pr,S.cities.riyadh);const first=S.paymentDues[0].amount;
E.staffDay(S,'riyadh',pr,S.cities.riyadh);const second=S.paymentDues[0].amount-first;assert(second>first);
const workerDue=S.paymentDues[0].id,total=S.paymentDues[0].amount;
S=E.load(E.save(S));assert.equal(S.paymentDues[0].amount,total);
S.player.props.riyadh.staff=[];S.player.gold=1000;assert(E.A.settlePayment(S,workerDue).ok);assert.equal(S.player.gold,1000-total,'يبقى الدين بعد مغادرة العامل');
// لا نخترع مبلغاً للتأخر المحفوظ قديماً.
S=fresh();pr=S.player.props.riyadh;sh=pr.shops[0];sh.arrears=2;S.player.gold=0;E.rentDay(S,'riyadh',pr,S.cities.riyadh);
assert.equal(S.paymentDues[0].amount,sh.rent);assert.equal(S.paymentDues[0].unknownPast,true);
S.player.gold=1000;assert.match(E.A.settlePayment(S,S.paymentDues[0].id).msg,/للتأكد/);assert.equal(sh.arrears,3);
// تاريخ المبالغ الفعلية محدد بـ60يوماً، والواجهة تطلب30؛ شراء الأصل ليس ضمن هذا الكشف.
S=fresh();S.player.gold=1e6;
for(let day=0;day<80;day++){S.day=day;E.paymentRecord(S,'rent',0);E.pPay(S,'staff',2.5,true);E.pPay(S,'assets',5);}
assert.equal(S.paymentBook.days.length,60);assert.equal(E.paymentHistory(S).length,30);assert.equal(E.paymentHistory(S)[0].paid.staff,2.5);
assert(!('assets' in E.paymentHistory(S)[0].paid));assert.equal(S.paymentBook.days[0].day,20);
S.day=100;E.paymentRecord(S,'rent',0);assert.equal(E.paymentHistory(S).length,30);assert.equal(Object.keys(E.paymentHistory(S)[1].paid).length,0);
const loaded=E.load(E.save(S));assert.equal(JSON.stringify(loaded.paymentBook),JSON.stringify(S.paymentBook));
assert(Buffer.byteLength(JSON.stringify(S.paymentBook))<10000);
// المدير والمصنع يحتفظان بمطالبات مستقلة، والسداد يعالج تأخر الطرف الصحيح.
S=fresh();pr=S.player.props.riyadh;pr.mgr={lv:2,since:S.day,audit:S.day};S.player.gold=0;
E.mgrDay(S,'riyadh',pr);const managerDue=S.paymentDues.find(d=>d.kind==='manager');assert.equal(managerDue.amount,E.MGR[2].wage);
const f={city:'jeddah',recipe:'perfume',level:2,local:true};S.player.factories=[f];E.factoryDay(S,f);
const factoryDue=S.paymentDues.find(d=>d.kind==='factory');assert.equal(factoryDue.amount,E.RECIPES.perfume.wage*2);
S.player.gold=1000;assert(E.A.settlePayment(S,managerDue.id).ok);assert.equal(pr.mgr.late,0);assert(S.paymentDues.some(d=>d.id===factoryDue.id));
assert(E.A.settlePayment(S,factoryDue.id).ok);assert.equal(S.paymentDues.length,0);
// عند الإخلاء لا تختفي المطالبة؛ تبقى في البطاقة الموحدة.
S=fresh();pr=S.player.props.riyadh;S.player.gold=0;
for(let d=0;d<E.EVICT_DAYS;d++)E.rentDay(S,'riyadh',pr,S.cities.riyadh);
assert.equal(pr.shops.length,0);const departed={...S.paymentDues[0]};S.player.gold=1000;
assert(E.A.settlePayment(S,departed.id).ok);assert.equal(S.player.gold,1000-departed.amount);
// ترحيل دفتر قديم طويل لا يتجاوز السقف ولا يعرض قيماً فاسدة.
S=fresh();S.day=100;S.paymentBook={since:0,days:Array.from({length:101},(_,day)=>({day,paid:{rent:2,bad:-1}}))};
S=E.load(E.save(S));assert.equal(S.paymentBook.days.length,60);assert(!('bad' in S.paymentBook.days[0].paid));
console.log('PASS actual ledger, bounded history, partial payment, exact arrears, promotion, save, departed worker, legacy uncertainty and duplicate prevention');
