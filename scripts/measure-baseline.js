#!/usr/bin/env node
'use strict';
// قياس يدوي لخط الأساس الاقتصادي (WP-05ب): أربعة أساليب × ٨ بذور × ١٠ سنوات، كل عالم مع مناخ القطاعات ودونه. نحو ٦ دقائق بالتوازي.
// الأمر: node scripts/measure-baseline.js   (يكتب docs/review/ECONOMY_BASELINE_2610.json ويطبع جدولاً)
const fs = require('node:fs'), path = require('node:path'), { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..'), OUT = path.join(root, 'docs/review/ECONOMY_BASELINE_2610.json');
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], YEARS = 10, STYLES = { caravan: 'captain1', shops: 'shops3', farm: 'farm', banker: 'banker' };
function world(E, eco, seed, scenario, climate) {
  const S0 = eco.setup(E, seed, scenario), S = climate ? S0 : (() => { const T = E.load(E.save(S0)); T.noClimate = true; delete T.climate; E.climateInit(T); return T; })();
  const out = { nw: [], liq: [], bad: [] };
  const check = y => { const w = S.player.wallet; if (![w.sar, w.usd, w.au].every(Number.isFinite) || [w.sar, w.usd, w.au].some(v => v < -1e-6)) out.bad.push('y' + y + ':wallet'); for (const id of S.order) { const c = S.cities[id]; for (const g of E.GIDS) if (!Number.isFinite(c.stock[g]) || c.stock[g] < -1e-6) { out.bad.push('y' + y + ':stock:' + id + ':' + g); break; } } for (const car of S.player.caravans) for (const g in car.cargo) if (!Number.isFinite(car.cargo[g]) || car.cargo[g] < -1e-6) out.bad.push('y' + y + ':cargo:' + g); if (!Number.isFinite(E.netWorth(S))) out.bad.push('y' + y + ':nan'); };
  for (let y = 1; y <= YEARS; y++) {
    for (let d = 0; d < 354; d++) { eco.stepSector(E, S, scenario, d); E.tick(S, false); S.pause = false; }
    const nw = E.netWorth(S); out.nw.push(Math.round(nw)); out.liq.push(nw > 0 ? +(E.liquid(S) / nw).toFixed(3) : 0); check(y);
  }
  return out;
}
if (process.argv[2] === '--style') { // عملية فرعية لأسلوب واحد
  const E = require('../src/engine.js'), eco = require('../test/lib/economy.js'), style = process.argv[3], rows = [];
  for (const seed of SEEDS) rows.push({ seed, on: world(E, eco, seed, STYLES[style], true), off: world(E, eco, seed, STYLES[style], false) });
  process.stdout.write(JSON.stringify({ style, rows }));
} else {
  const med = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  Promise.all(Object.keys(STYLES).map(style => new Promise((res, rej) => { let buf = ''; const p = spawn(process.execPath, [__filename, '--style', style], { stdio: ['ignore', 'pipe', 'inherit'] }); p.stdout.on('data', d => buf += d); p.on('exit', c => c ? rej(Error(style + ' exit ' + c)) : res(JSON.parse(buf))); }))).then(all => {
    const summary = {};
    for (const { style, rows } of all) {
      const nw5 = rows.map(r => r.on.nw[4]), nw5off = rows.map(r => r.off.nw[4]), nw10 = rows.map(r => r.on.nw[9]);
      const eff = rows.map(r => (r.on.nw[4] - r.off.nw[4]) / r.off.nw[4]);
      summary[style] = { medianNW5: Math.round(med(nw5)), medianNW5off: Math.round(med(nw5off)), medianNW10: Math.round(med(nw10)), effect5: +(100 * (med(nw5) - med(nw5off)) / med(nw5off)).toFixed(2), effectMeanOfSeeds5: +(100 * eff.reduce((a, b) => a + b, 0) / eff.length).toFixed(2), minNW5: Math.min(...nw5), maxNW5: Math.max(...nw5), medianLiq5: +med(rows.map(r => r.on.liq[4])).toFixed(3), minLiq: Math.min(...rows.flatMap(r => r.on.liq)), bad: rows.flatMap(r => [...r.on.bad.map(b => r.seed + ':on:' + b), ...r.off.bad.map(b => r.seed + ':off:' + b)]) };
    }
    const report = { task: '05b', measuredAt: new Date().toISOString(), seeds: SEEDS, years: YEARS, metric: 'net worth at end of year 5; effect = (with sector climate - without) / without', summary, rows: all };
    fs.writeFileSync(OUT, JSON.stringify(report, null, 1) + '\n');
    console.log(JSON.stringify(summary, null, 1));
  }).catch(e => { console.error(e.message); process.exitCode = 1; });
}
