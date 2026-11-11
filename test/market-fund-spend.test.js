'use strict';
// 040ز إنفاق صندوق السوق: الحاكم ينفق فوراً، التبرع لغرض، المطفأ حرفياً، قياس مدينتين متماثلتين
const a = require('node:assert/strict'), { E, load } = require('./lib/skill-sim.js'), A = E.A, M = E.MFUND;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; return S; };
const step = (S, n, ruled) => { for (let i = 0; i < n; i++) { for (const id of ruled || []) E.bossOf(S, id).ruler = 'player'; E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const KEYS = ['trade', 'urban', 'sci', 'lit', 'health', 'sec'];
a.equal(M.spend, true);
// 1) إنفاق يدوي: يخفض الرصيد بالمبلغ ويزيد fcare فوراً بـ amt/unitCost، ويُسجَّل
{ const S = game(5); step(S, 3); const id = S.order[0]; E.bossOf(S, id).ruler = 'player'; const f = E.A && S.cities[id].fund; f.bal = 9000; f.avg = 100; const p = E.prosEnsure(S, id); const c0 = (p.fcare || KEYS.map(() => 0))[2];
  a.equal(E.fundAvail(S, id), 8300, 'المتاح = الرصيد − 7 أيام من المتوسط');
  const r = A.fundSpend(S, id, 'sci', 5000); a(r.ok, r.msg); a(Math.abs(f.bal - 4000) < 1e-6, 'الرصيد ' + f.bal); a(Math.abs(S.cities[id].pros.fcare[2] - c0 - 50) < 0.02, 'fcare +50: ' + S.cities[id].pros.fcare[2]);
  a.equal(f.log.length, 1); a.equal(f.log[0].k, 'sci'); a.equal(f.log[0].amt, 5000); a.equal(f.log[0].t, 'أنفقتَ'); a(Math.abs(f.out - 5000) < 1e-6 || f.out >= 5000);
  a.equal(A.fundSpend(S, id, 'sci', 4000).ok, false, 'فوق المتاح (3300) مرفوض'); a.equal(f.bal, 4000, 'الرفض لا يمس الرصيد');
  a.equal(A.fundSpend(S, id, 'xx', 100).ok, false); a.equal(A.fundSpend(S, id, 'sci', 0).ok, false); a.equal(A.fundSpend(S, id, 'sci', NaN).ok, false);
  for (let i = 0; i < 30; i++) A.fundSpend(S, id, 'lit', 1); a(f.log.length <= 20, 'السجل آخر 20'); const v = E.fundView(S, id); a(v.log.length <= 3 && v.spendOn && v.avail >= 0 && v.next.days >= 1 && v.next.x >= 0 && Number.isFinite(v.next.x));
  const bs = E.bossOf(S, id); bs.ruler = 'x'; const b0 = f.bal; const r2 = A.fundSpend(S, id, 'sci', 100); a.equal(r2.ok, false); a(/الزعيم هو من ينفق/.test(r2.msg), r2.msg); a.equal(f.bal, b0, 'غير الحاكم: لا خصم'); }
// 2) التبرع لغرض: يُنفَق على بُعده وحده في الدورة التالية ولا يتجاوز ما جُمع
{ const S = game(6); step(S, 3); const id = S.order[1], bs = E.bossOf(S, id); bs.ruler = 'x'; S.player.gold = 20000; const f = S.cities[id].fund; f.bal = 0; f.avg = 0;
  a.equal(A.fundDonate(S, id, 1000, 'zz').ok, false, 'بُعد خاطئ'); const g0 = S.player.gold; const r = A.fundDonate(S, id, 3000, 'lit'); a(r.ok, r.msg); a.equal(S.player.gold, g0 - 3000); a.equal(f.earmark.lit, 3000); a(f.bal >= 3000 - 1e-6);
  const p = E.prosEnsure(S, id); p.fcare = KEYS.map(() => 0); const bal0 = f.bal; p.fundPend = null; const before = KEYS.map(k => p.care[k]);
  E.A.fundDonate(S, id, 100); a.equal(f.earmark.lit, 3000, 'بلا dim لا يمس الغرض');
  const day0 = S.day; step(S, 31 - (S.day % 30) + 1); const last = f.last; a(last && last.spent > 0, 'أُنفق في الدورة'); a(!f.earmark || (f.earmark.lit || 0) < 3000, 'الغرض خُفِّض بما أُنفق');
  const es = Math.min(3000, last.spent); a(es > 0); a(!f.earmark || f.earmark.lit >= 0);
  // الأدب نال الحصة الأكبر بلا منازع: نصيب lit من الرعاية ≥ es/unitCost
  a(p.fcare[3] >= es / M.unitCost * (1 - M.spendShare * 0) * 0.9 - 0.05, 'fcare[lit]=' + p.fcare[3] + ' es=' + es);
  for (const k of [0, 1, 2, 4, 5]) a(p.fcare[k] < p.fcare[3], 'بُعد آخر لم يأخذ أكثر من الأدب'); }
// 3) التبرع لغرض لا يتجاوز ما جُمع: الغرض ≤ الرصيد المنفَق
{ const S = game(7); step(S, 2); const id = S.order[2]; E.bossOf(S, id).ruler = 'x'; S.player.gold = 1e6; const f = S.cities[id].fund; f.bal = 0; f.avg = 0; A.fundDonate(S, id, 500, 'sec'); A.fundDonate(S, id, 700, 'sci'); a.equal(f.earmark.sec + f.earmark.sci, 1200);
  step(S, 62); for (const k of Object.keys(f.earmark || {})) a(f.earmark[k] >= 0 && Number.isFinite(f.earmark[k])); a(f.out >= 1200 * 0.4 || !f.earmark, 'أُنفق ما خُصِّص أو تبقى بحسبه'); }
// 4) المطفأ: يطابق «قبل» حرفياً، بلا حقول جديدة في الحفظ، وحفظ قديم يعمل
{ const run = on => { M.spend = on; try { const S = load('autopilot-23'); S.player.gold = 1e6; const id = S.order[0]; step(S, 95); return { S, id }; } finally { M.spend = true; } };
  const off = run(false), on = run(true); a.equal(JSON.stringify(off.S.cities[off.id].fund), JSON.stringify(on.S.cities[on.id].fund), 'بلا إنفاق ولا غرض: الصندوق متطابق مفتاحاً وبدونه'); a.equal(JSON.stringify(off.S.cities[off.id].pros), JSON.stringify(on.S.cities[on.id].pros));
  M.spend = false; try { const S = game(8); step(S, 3); const id = S.order[0]; E.bossOf(S, id).ruler = 'player'; S.cities[id].fund.bal = 9000; a.equal(A.fundSpend(S, id, 'sci', 100).ok, false, 'المطفأ: لا إنفاق'); S.player.gold = 9000; a(A.fundDonate(S, id, 500, 'sci').ok); const raw = E.save(S); a(!raw.includes('"earmark"') && !raw.includes('"log"'), 'لا حقول جديدة في الحفظ'); const v = E.fundView(S, id); a.equal(v.spendOn, undefined, 'العرض القديم حرفياً'); a.equal(v.log, undefined); } finally { M.spend = true; }
  const S = load('autopilot-23'); for (const id of S.order) { const f = S.cities[id].fund; if (f) { delete f.log; delete f.earmark; } } step(S, 35); for (const id of S.order) { const f = S.cities[id].fund; if (f) a(Number.isFinite(f.bal)); } }
// 5) القياس: مدينتان متماثلتان، إنفاق 5000 على «العلم» مقابل عدمه، بعد 90 يوماً
{ const S = game(3), [cA, cB] = [S.cities[S.order[0]], S.cities[S.order[1]]]; cB.pop = cA.pop.slice(); step(S, 1); for (const k of ['stock', 'prod', 'extra', 'dem']) cB[k] = JSON.parse(JSON.stringify(cA[k]));
  const pA = E.prosEnsure(S, cA.id), pB = E.prosEnsure(S, cB.id); for (const k of Object.keys(pA)) if (k !== 'care') pB[k] = JSON.parse(JSON.stringify(pA[k])); pB.care = JSON.parse(JSON.stringify(pA.care));
  cB.fund = JSON.parse(JSON.stringify(cA.fund)); for (const c of [cA, cB]) { c.fund.bal = 20000; c.fund.avg = 100; } const ruled = [cA.id, cB.id];
  a(A.fundSpend((E.bossOf(S, cA.id).ruler = 'player', S), cA.id, 'sci', 5000).ok); E.bossOf(S, cB.id).ruler = 'player';
  step(S, 90, ruled); const sci = c => c.pros.sci - c.pros.b.sci, dA = sci(cA), dB = sci(cB); a(dA > dB, 'العلم أعلى مع الإنفاق: ' + dA.toFixed(3) + ' مقابل ' + dB.toFixed(3));
  console.log('قياس 040ز: بعد 90 يوماً بُعد العلم فوق أساسه: المُنفِقة', dA.toFixed(3), '| الأخرى', dB.toFixed(3), '| الفرق', (dA - dB).toFixed(3), '| خبرة الطاقم ×', E.prosperityView(S, cA.id).eff.sci.toFixed(4), 'مقابل', E.prosperityView(S, cB.id).eff.sci.toFixed(4));
  for (const c of [cA, cB]) for (const k of KEYS) a(Number.isFinite(c.pros[k])); }
console.log('market-fund-spend: ok');
