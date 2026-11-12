'use strict';
// 040ب صندوق السوق: حذف حدّ الثروة، تحويل الإيجار ونصف الضريبة ورسم المملوك إلى marketFee (والصيانة لا تُمسّ)، حفظ الرصيد، الإنفاق الشهري إلى الازدهار، مدينتان متماثلتان، التبرع والمحور، MFUND.on=false، الحفظ القديم
const a = require('node:assert/strict'), { E, load } = require('./lib/skill-sim.js'), A = E.A, M = E.MFUND, R = E.RIVALGEN;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
a.equal(M.on, true); a.equal(M.taxShare, 0.5); a.equal(M.rentShare, 1); a(M.ownFee > 0 && M.ownFee <= 1, 'رسم المملوك صغير');
// 1) حدّ الثروة: لا ضريبة تتغير بثروة اللاعب مع الصندوق؛ ومع MFUND.on=false يعود الحدّ
{ const S = load('autopilot-23'), c = S.cities[S.order[0]]; S.player.gold = 1000; const r1 = E.taxRate(S, c, true); S.player.gold = 5e7; const r2 = E.taxRate(S, c, true); a.equal(r1, r2, 'لا ضريبة بثروة اللاعب');
  M.on = false; try { S.player.gold = 1000; const o1 = E.taxRate(S, c, true); S.player.gold = 5e7; a(E.taxRate(S, c, true) - o1 > 0.04, 'مع الإطفاء يعود حدّ الثروة'); } finally { M.on = true; } }
// 2) الدفتر: الإيجار يتحول كله إلى marketFee، ورسم المملوك يُضاف، والصيانة لا تتغير عن حالة الإطفاء
{ const run = on => { M.on = on; try { const S = load('autopilot-23'); for (const id of Object.keys(S.cities)) delete S.cities[id].fund; /* البصمة المُلتقَطة بعد 040ب تحمل صناديق: نبدأ نظيفاً */ const city = Object.keys(S.player.props)[0], pr = S.player.props[city]; pr.shops.push({ id: S.nextId++, items: [], kind: 'rent', landlord: 'private', rent: 20, rentPaid: 0, arrears: 0, onTime: 0, since: S.day }); const L0 = Object.assign({}, S.player.led.exp); step(S, 10); const d = k => (S.player.led.exp[k] || 0) - (L0[k] || 0); return { S, city, rent: d('rent'), fee: d('marketFee'), upkeep: d('upkeep'), tax: d('tax') }; } finally { M.on = true; } };
  const off = run(false), on = run(true); a(off.rent >= 190 && off.rent <= 210, 'إيجار 10 أيام بلا صندوق: ' + off.rent); a.equal(off.fee, 0); a(on.rent < 1e-6, 'الإيجار كله إلى الصندوق: ' + on.rent); a(on.fee >= off.rent - 0.05, 'marketFee ≥ الإيجار الأصلي'); a(Math.abs(on.upkeep - off.upkeep) < 1e-6, 'الصيانة لم تتغير');
  const f = on.S.cities[on.city].fund, you = f.inc.you + (f.last ? f.last.inc.you : 0); a(f && Math.abs(you - on.fee) < 0.05, 'الداخل «أنت» يطابق marketFee: ' + you + ' مقابل ' + on.fee);
  a(off.S.cities[off.city].fund === undefined, 'MFUND.on=false: لا صندوق'); }
// 3) حفظ الرصيد والتطابق مع الدفتر: لا ينفق أكثر مما جُمع، ولا NaN، 360 يوماً
{ const S = game(3); step(S, 400); let withFund = 0; for (const id of S.order) { const f = S.cities[id].fund; if (!f) continue; withFund++; a(f.bal >= -1e-9, 'رصيد سالب'); a(Math.abs(f.tin - f.out - f.bal) < 0.05, 'الداخل − الخارج = الرصيد: ' + id); for (const k of ['bal', 'tin', 'out', 'avg']) a(Number.isFinite(f[k]), 'NaN'); a(f.inc.you + f.inc.rivals + f.inc.others >= 0); } a.equal(withFund, S.order.length); a(S.cities[S.order[0]].fund.out > 0, 'يُنفق شهرياً'); }
// 4) مدينتان متماثلتان: عند منافسة (rivalPresence ≥ 2) يكبر الصندوق ويزدهر السوق ويزيد السكان
{ const S = game(3), [cA, cB] = [S.cities[S.order[0]], S.cities[S.order[1]]]; cB.pop = cA.pop.slice(); step(S, 1); for (const k of ['stock', 'prod', 'extra', 'dem']) cB[k] = JSON.parse(JSON.stringify(cA[k]));
  const pA = E.prosEnsure(S, cA.id), pB = E.prosEnsure(S, cB.id); for (const k of Object.keys(pA)) if (k !== 'care') pB[k] = JSON.parse(JSON.stringify(pA[k])); pB.care = JSON.parse(JSON.stringify(pA.care));
  S.rivalGen = { seed: 1, births: 0, next: 1e9 }; const saveExit = R.exitBase; R.exitBase = 0;
  S.rivals = [0.9, 0.8, 0.7].map((st, i) => ({ id: 90 + i, name: 'ت' + i, path: 'الصاعد', pers: 'الجريء', idea: 'A01', str: st, born: S.day, fx: { kind: 'supply', cities: [cA.id], gs: [], mul: 0.1, start: S.day, until: S.day + 99999, cont: true } }));
  a(E.rivalPresence(S, cA.id) >= 2 && E.rivalPresence(S, cB.id) === 0); const pop0 = E.popTotal(cA);
  try { step(S, 360); } finally { R.exitBase = saveExit; }
  const fA = cA.fund, fB = cB.fund, up = p => E.A && ['trade', 'urban', 'sci', 'lit', 'health', 'sec'].reduce((t, k) => t + (p[k] - p.b[k]), 0);
  a(fA.tin > fB.tin * 1.2, 'صندوق أكبر: ' + fA.tin.toFixed(0) + ' مقابل ' + fB.tin.toFixed(0)); a(up(cA.pros) > up(cB.pros), 'ازدهار أعلى: ' + up(cA.pros).toFixed(2) + ' مقابل ' + up(cB.pros).toFixed(2)); a(cA.pros.popMul > cB.pros.popMul, 'مضاعف السكان المستهدف أعلى: ' + cA.pros.popMul.toFixed(4) + ' مقابل ' + cB.pros.popMul.toFixed(4));
  console.log('مدينتان: صندوق', fA.tin.toFixed(0), 'مقابل', fB.tin.toFixed(0), '| ازدهار', up(cA.pros).toFixed(2), 'مقابل', up(cB.pros).toFixed(2), '| مضاعف السكان', cA.pros.popMul.toFixed(4), 'مقابل', cB.pros.popMul.toFixed(4), '| سكان', pop0.toFixed(0), '←', E.popTotal(cA).toFixed(0), 'مقابل', E.popTotal(cB).toFixed(0)); }
// 5) التبرع والمحور
{ const S = game(4); step(S, 5); const id = S.order[0], f0 = E.fundView(S, id).bal, g0 = S.player.gold; a.equal(A.fundDonate(S, id, 10).ok, false, 'أقل من الحد'); S.player.gold = 5000; const r = A.fundDonate(S, id, 1000); a(r.ok, r.msg); a(E.fundView(S, id).bal >= f0 + 1000 - 1e-6); a(S.player.led.exp.marketDonation >= 1000); a.equal(A.fundDonate(S, id, 1e9).ok, false, 'لا يكفي الرصيد');
  a.equal(A.fundFocus(S, id, 'trade').ok, false, 'لست الحاكم');
  const bs = E.bossOf(S, id); if (bs) { bs.ruler = 'player'; a(A.fundFocus(S, id, 'sci').ok); a.equal(A.fundFocus(S, id, 'xx').ok, false); const f = S.cities[id].fund; f.bal += 5000; for (let i = 0; i < 31; i++) { E.bossOf(S, id).ruler = 'player'; step(S, 1); } // الحكم يُعاد حسابه يومياً؛ نثبّته لاختبار المحور
     E.bossOf(S, id).ruler = 'player'; a(f.last && f.last.spent >= 1 && E.fundView(S, id).dims.find(d => d.k === 'sci').share >= 0.6, 'محور الإنفاق 60٪'); } }
// 6) الحفظ القديم (بلا c.fund) يعمل، ويُنشأ الصندوق عند الحاجة، ولا NaN
{ const S = game(5); step(S, 100); const old = JSON.parse(E.save(S)); for (const id of Object.keys(old.cities)) delete old.cities[id].fund; const L = E.load(JSON.stringify(old)); a(L); step(L, 100); for (const id of L.order) { const f = L.cities[id].fund; a(f && f.bal >= 0 && Number.isFinite(f.tin)); } const V = E.fundView(L, L.order[0]); a(V && Number.isFinite(V.bal)); }
// 7) MFUND.on=false يطابق السلوك السابق: لا صندوق ولا marketFee
{ M.on = false; try { const S = game(6); step(S, 200); for (const id of S.order) a.equal(S.cities[id].fund, undefined); a.equal(S.player.led.exp.marketFee, undefined); a.equal(E.fundView(S, S.order[0]), null); } finally { M.on = true; } }
console.log('PASS market-fund: no wealth tax, ledger marketFee, conservation, monthly spend, twin cities, donate/focus, old save, off switch');
