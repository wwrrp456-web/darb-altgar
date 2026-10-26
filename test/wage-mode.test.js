'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},require:require('node:module').createRequire(require.resolve('../src/engine.js')),console};
vm.runInNewContext(fs.readFileSync('src/engine.js','utf8').replace('const API = { ','const API = { staffDay, rentDay, mgrDay, shipDay, playerDay, vaultLedger, '),box);const E=box.module.exports,near=(a0,b)=>a(Math.abs(a0-b)<1e-6,`${a0} != ${b}`);
const base=E.newGame(15);base.phase=4;base.player.wallet.sar=1e6;a(E.A.buildShop(base,'riyadh').ok);a(E.A.rentShop(base,'hail','stall').ok);for(const p of Object.values(base.player.props))for(const w of p.staff||[])w.free=0;
const fresh=()=>E.load(E.save(base)),runStaff=(S,city)=>E.staffDay(S,city,S.player.props[city],S.cities[city]);
let S=fresh(),auto=fresh(),money=S.player.wallet.sar,nw=E.netWorth(S);a(E.A.setWageMode(S,'riyadh','manual').ok);runStaff(S,'riyadh');runStaff(auto,'riyadh');
a.equal(S.player.wallet.sar,money);a(S.paymentDues.some(d=>d.city==='riyadh'&&d.deferredWages>0));near(E.netWorth(S),E.netWorth(auto));near(E.vaultLedger(S).profit,E.vaultLedger(auto).profit);a(E.netWorth(S)<nw,'الأجور المؤجلة ليست ثروة');const net=E.netWorth(S),profit=E.vaultLedger(S).profit,owed=E.regionalOfficeQuote(S,'riyadh').wageDue;
a(E.A.officePay(S,'riyadh','wages').ok);near(E.netWorth(S),net);near(E.vaultLedger(S).profit,profit);near(money-S.player.wallet.sar,owed);a(S.player.props.riyadh.staff.every(w=>!w.late));
// السياسة محلية؛ الإيجار لا يتوقف، ومغادرة العامل لا تسقط حقه.
S=fresh();E.A.setWageMode(S,'riyadh','manual');money=S.player.wallet.sar;runStaff(S,'hail');a(S.player.wallet.sar<money);E.A.setWageMode(S,'hail','manual');money=S.player.wallet.sar;E.rentDay(S,'hail',S.player.props.hail,S.cities.hail);a(S.player.wallet.sar<money);
for(let i=0;i<5;i++)runStaff(S,'riyadh');a.equal(S.player.props.riyadh.staff.length,0);a(E.regionalOfficeQuote(S,'riyadh').wageDue>0);a(E.A.officePay(S,'riyadh','all').ok);a.equal(E.deferredWages(S,'riyadh'),0);
// العودة للتلقائي لا تمحو الدين السابق ولا تدفعه مرتين.
S=fresh();E.A.setWageMode(S,'riyadh','manual');runStaff(S,'riyadh');const old=E.deferredWages(S);E.A.setWageMode(S,'riyadh','auto');money=S.player.wallet.sar;runStaff(S,'riyadh');a(S.player.wallet.sar<money);near(E.deferredWages(S),old);a(E.A.officePay(S,'riyadh','all').ok);near(E.deferredWages(S),0);
// المصنع والمدير وطاقم القافلة والسفينة: الصيانة تستمر والأجر وحده يؤجل.
S=fresh();E.A.setWageMode(S,'riyadh','manual');S.player.props.riyadh.mgr={lv:2,since:S.day,audit:S.day};E.mgrDay(S,'riyadh',S.player.props.riyadh);a(S.paymentDues.some(d=>d.kind==='manager'&&d.amount===E.MGR[2].wage));
const f={id:S.nextId++,city:'riyadh',recipe:'perfume',level:1,local:true};S.player.factories=[f];E.factoryDay(S,f);a(S.paymentDues.some(d=>d.kind==='factory'&&d.deferredWages>0));a(S.player.led.exp.upkeep>0);
S=fresh();E.A.setWageMode(S,'riyadh','manual');E.playerDay(S);a(S.paymentDues.some(d=>d.kind==='caravan'&&d.deferredWages>0));
S=fresh();a(E.A.buildShop(S,'jeddah').ok);a(E.A.buyShip(S,'jeddah').ok);a(E.A.hireSailor(S,E.shipsOf(S)[0].id).ok);E.A.setWageMode(S,'jeddah','manual');money=S.player.wallet.sar;E.shipDay(S);a(S.player.wallet.sar<money,'صيانة السفينة لا تتوقف');const shipDue=S.paymentDues.find(d=>d.kind==='ship');a(shipDue&&shipDue.deferredWages>0);near(shipDue.amount,shipDue.deferredWages);
// الترحيل، ومعاينة لا تغير الحالة، ورفض الرتب غير المتوفرة دون اختراع أمين.
let T=E.load(E.save(S));a.equal(E.wageMode(T,'jeddah'),'manual');near(E.deferredWages(T),E.deferredWages(S));T.player.props.jeddah.wageMode='bad';T.paymentDues[0].deferredWages=1e30;T=E.load(E.save(T));a.equal(E.wageMode(T,'jeddah'),'auto');a(T.paymentDues.every(d=>(d.deferredWages||0)<=d.amount));a(E.A.setWageMode(T,'jeddah','steward').ok);a.equal(E.wageMode(T,'jeddah'),'auto');a(T.news.some(n=>/لا أمين/.test(n.t)));let raw=E.save(T);a.equal(E.A.setWageMode(T,'jeddah','bad').ok,false);a.equal(E.save(T),raw);raw=E.save(T);E.regionalOfficeQuote(T,'jeddah');a.equal(E.save(T),raw);
console.log('PASS wage mode: default auto, local manual, real arrears/departure, no free wealth/profit, exact office settlement, old debt preserved, factory/manager/caravan/sea wages, upkeep, migration and no invented steward');
