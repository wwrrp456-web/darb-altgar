#!/usr/bin/env node
'use strict';
// 040و: سيناريو «المصرفي»: ودائع ≈ 1 مليون، نقد ≈ 0، 4 دكاكين بعمال، 360 يوماً بلا لاعب نشط.
// الاستعمال: node tools/liquidity-measure.js [--liq=off] [--cash=rich]   (--liq=off = قبل؛ --cash=rich = «النقد وفير»)
const { E, load, rich, run } = require('../test/lib/skill-sim.js');
const arg = k => ((process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3));
if (E.LIQ && arg('liq') === 'off') E.LIQ.on = false;
let W = 0, F = 0; { const d0 = E.A.divest; E.A.divest = (S, c, amt) => { const b = S.player.bank.dep[c] || 0, r = d0(S, c, amt); const t = b - (S.player.bank.dep[c] || 0); W += t; F += t * (E.LIQ ? E.LIQ.fee : 0.01); return r; }; }
const S = rich(load('autopilot-23')), P = S.player, city = Object.keys(P.props)[0], pr = P.props[city];
while (pr.shops.length < 4) pr.shops.push({ id: S.nextId++, items: [], kind: 'own', since: S.day });
for (let i = 0; i < 2; i++) for (const role of ['seller', 'keeper']) pr.staff.push({ id: S.nextId++, role, days: 20, late: 0, free: 0 });
const rich$ = arg('cash') === 'rich';
for (const k of Object.keys(P.wallet)) P.wallet[k] = 0; P.wallet.sar = rich$ ? 2e6 : 50;
const cities = S.order.slice(0, 5); for (const c of cities) P.bank.dep[c] = 2e5; P.bank.dep = Object.fromEntries(cities.map(c => [c, 2e5]));
const staff0 = () => Object.values(P.props).reduce((n, p) => n + (p.staff ? p.staff.length : 0), 0), s0 = staff0(), dep0 = Object.values(P.bank.dep).reduce((a, b) => a + b, 0), nw0 = E.netWorth(S);
let maxDue = 0, dueDays = 0, minCash = 1e18; const led0 = { ...P.led.exp }, inc0 = { ...P.led.inc };
for (let d = 0; d < 360; d++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; const due = (S.paymentDues || []).reduce((a, x) => a + (x.amount || 0), 0); maxDue = Math.max(maxDue, due); if (due > 0) dueDays++; minCash = Math.min(minCash, P.wallet.sar); }
const dep1 = Object.values(P.bank.dep).reduce((a, b) => a + b, 0), log = P.liqLog || [], drawn = W, fees = F, nw1 = E.netWorth(S);
const dues = (S.paymentDues || []).reduce((a, x) => a + (x.amount || 0), 0);
console.log(JSON.stringify({ liq: E.LIQ ? E.LIQ.on : 'غير موجود', cash: rich$ ? 'وفير' : '≈0', 'ودائع أولية': Math.round(dep0), 'ودائع نهائية': Math.round(dep1), 'عمال أول/آخر': [s0, staff0()], 'متأخرات نهاية': Math.round(dues), 'أقصى متأخرات': Math.round(maxDue), 'أيام فيها متأخرات': dueDays, 'أدنى نقد': Math.round(minCash), 'نقد نهائي': Math.round(P.wallet.sar), 'مسحوب': Math.round(drawn), 'رسوم': Math.round(fees * 100) / 100, 'رسوم/مسحوب': drawn ? +(fees / drawn).toFixed(4) : 0, 'سحوبات (آخر 40 في السجل)': log.length, 'ثروة أول/آخر': [Math.round(nw0), Math.round(nw1)], 'أجور مدفوعة': Math.round((P.led.exp.staff || 0) - (led0.staff || 0)), 'صيانة': Math.round((P.led.exp.upkeep || 0) - (led0.upkeep || 0)), 'أرباح مضاربة': Math.round((P.led.inc.mudaraba || 0) - (inc0.mudaraba || 0)) }, null, 1));
