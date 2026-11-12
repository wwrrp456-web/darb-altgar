#!/usr/bin/env node
'use strict';
// 040ج: قياس حضور المنافسين المولَّدين. 12 بذرة × 720 يوماً (لاعب لا يفعل شيئاً: لا أثر منه على المنافسين).
// الاستعمال: node tools/rival-presence.js [--cont=off] [--seeds=12] [--days=720]
// «أسواق اللاعب» = مدن بلد البداية (يضاف إليها مدن ممتلكاته إن وُجدت). الأثر الفعّال = rv.fx حاضر وغير منقضٍ (أو مستمر cont).
const { E } = require('../test/lib/skill-sim.js');
const arg = (k, d) => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.slice(k.length + 3) : d; };
const CONT = arg('cont', 'on') !== 'off', SEEDS = +arg('seeds', 12), DAYS = +arg('days', 720);
const R = E.RIVALGEN; if ('cont' in R) R.cont = CONT; else if (CONT) { console.log('(لا مفتاح cont بعد: السلوك الحالي)'); }
const live = (S, rv) => rv.fx && (rv.fx.cont || rv.fx.until > S.day);
const rows = []; let bad = 0;
for (let seed = 1; seed <= SEEDS; seed++) {
  const S = E.newGame(seed); E.A.learnSetChar(S, 'trader'); S.noLock = 1;
  const home = E.START_OF[S.home] || S.order[0], mk = () => { const set = new Set(S.order.filter(id => S.cities[id].country === S.cities[home].country)); Object.keys(S.player.props || {}).forEach(c => set.add(c)); return set; };
  let prev = new Set(), ex2 = 0, bi2 = 0, fxDays = 0, anyDays = 0, aliveSum = 0, in3 = 0, zeroAfter200 = 0, maxAlive = 0, births0 = 0, minStock = Infinity;
  for (let d = 0; d < DAYS; d++) {
    E.tick(S, false); S.pause = false; if (S.road) S.road = null;
    const rv = S.rivals || [], M = mk(), n = rv.length, act = rv.filter(r => live(S, r));
    aliveSum += n; maxAlive = Math.max(maxAlive, n); if (n >= 3) in3++; if (S.day > 200 && n === 0) zeroAfter200++;
    if (act.some(r => r.fx.cities.some(c => M.has(c)))) fxDays++; if (act.length) anyDays++;
    const cur = new Set(rv.filter(r => r.out == null).map(r => r.id)); if (S.day > DAYS / 2) { for (const id of prev) if (!cur.has(id)) ex2++; for (const id of cur) if (!prev.has(id)) bi2++; } prev = cur;
    for (const r of rv) { if (r.fx && !(Math.abs(r.fx.mul) <= 1 && isFinite(r.fx.mul))) bad++; }
    for (const id of S.order) for (const g of Object.keys(S.cities[id].stock)) { const v = S.cities[id].stock[g]; if (!isFinite(v) || v < 0) bad++; minStock = Math.min(minStock, v); }
  }
  const births = (S.rivalGen && S.rivalGen.births) || 0, exits = births - (S.rivals || []).length;
  rows.push({ seed, fx: fxDays / DAYS, any: anyDays / DAYS, alive: aliveSum / DAYS, in3: in3 / DAYS, z: zeroAfter200, max: maxAlive, births: births * 360 / DAYS, exits: exits * 360 / DAYS, b2: bi2 * 360 / (DAYS / 2), e2: ex2 * 360 / (DAYS / 2) });
}
const avg = k => rows.reduce((a, r) => a + r[k], 0) / rows.length, pc = x => (x * 100).toFixed(1) + '٪';
console.log('rival-presence cont=' + (CONT ? 'on' : 'off') + ' seeds=' + SEEDS + ' days=' + DAYS);
for (const r of rows) console.log(`seed ${r.seed}: أثر-أسواقي ${pc(r.fx)} أثر-أي-مدينة ${pc(r.any)} أحياء(متوسط) ${r.alive.toFixed(1)} أيام≥3 ${pc(r.in3)} أيام-صفر>200 ${r.z} أقصى ${r.max} ولادات/360 ${r.births.toFixed(1)} خروجات/360 ${r.exits.toFixed(1)} | النصف الثاني: ولادات ${r.b2.toFixed(1)} خروجات ${r.e2.toFixed(1)}`);
console.log(`المتوسط: أثر في أسواق اللاعب ${pc(avg('fx'))} | أثر في أي مدينة ${pc(avg('any'))} | أحياء ${avg('alive').toFixed(2)} | أيام ≥3 أحياء ${pc(avg('in3'))} | أيام صفر بعد 200: ${rows.reduce((a, r) => a + r.z, 0)} | ولادات/360 ${avg('births').toFixed(2)} | خروجات/360 ${avg('exits').toFixed(2)} | النصف الثاني (مستقر) ولادات/360 ${avg('b2').toFixed(2)} خروجات/360 ${avg('e2').toFixed(2)} | قيم شاذة (NaN/سالب): ${bad}`);
