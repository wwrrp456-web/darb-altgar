'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
// كشف الدالة الخاصة للاختبار فقط: المقارنة مع الخصم الفعلي لا نسخة من معادلاته.
const box = { module: { exports: {} }, require: require("node:module").createRequire(require.resolve("../src/engine.js")), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { playerDay, '), box);
const E = box.module.exports, ui = { E };
vm.runInNewContext(fs.readFileSync('src/ui/10c-obligations.js', 'utf8'), ui);
const categories = ['rent', 'staff', 'wages', 'upkeep', 'wear', 'farm', 'takaful'];
const paid = S => categories.reduce((n, k) => n + (S.player.led.exp[k] || 0), 0);
for (const moving of [false, true]) for (const free of [false, true]) {
 const S = E.newGame(9); S.phase = 3; S.player.gold = 1e6;
 assert(E.A.buildShop(S, 'riyadh').ok); assert(E.A.rentShop(S, 'riyadh', 'stall').ok);
 assert(E.A.buildFarm(S, 'riyadh').ok);
 const pr = S.player.props.riyadh;
 pr.staff.forEach(w => {w.free = S.day + (free ? 2 : 1); w.days = 39;});
 pr.mgr = {lv: 2, since: S.day, audit: S.day}; pr.ins = {since:S.day};
 S.player.factories = [{city:'riyadh', recipe:'perfume', level:2, local:true}];
 // أزل المخزن للمصنع كي تقارن الأجر والصيانة وحدهما بلا شراء مواد.
 S.player.factories[0].city = 'jeddah';
 S.player.ships = [{type:'dhow', city:moving ? null : 'jeddah', crew:3, captain:{wage:12}}];
 const car = S.player.caravans[0]; car.guards = 2; car.herders = 1; car.mount = {kind:'horse'};
 car.left = moving ? 3 : 0; car.to = 'hail'; car.captain={trade:2,nav:3,combat:1,raise:0.1,role:'loyal',loyal:90};
 const before = JSON.stringify(S), report = ui.dailyObligations(S);
 assert.equal(JSON.stringify(S), before, 'قراءة البطاقة لا تغير الحالة أو العشوائية');
 const start = paid(S); S.day++; E.playerDay(S);
 assert(Math.abs(report.daily - (paid(S) - start)) < 1e-6, `التقدير يساوي الخصم: سفر=${moving} مجاني=${free}: ${report.daily} / ${paid(S)-start}`);
 assert.equal(report.monthly, report.daily*30);
 assert.equal(report.days, report.balance/report.daily);
}
const S=E.newGame(7);S.player.caravans=[];S.player.props={};S.player.factories=[];
assert.equal(ui.dailyObligations(S).days,null);
assert.equal(ui.dailyObligations(S).daily,0);
S.player.factories=[{city:'riyadh',recipe:'perfume',level:1,local:false,crisis:{day:S.day}}];
assert.equal(ui.dailyObligations(S).daily,0,'المصنع المتعثر لا يخصم أجراً أو صيانة');
console.log('PASS obligations match actual daily payments; free wages, travel, ships, factories, no state mutation');
