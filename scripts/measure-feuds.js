#!/usr/bin/env node
'use strict';
// SC-007 (036و): 12 بذرة × 360 يوماً بلاعب آلي (botMain): عدد الخصومات، متوسط أثرها وأقصاه في السعر، وثروة اللاعب الآلي مع GRIEF مفعّلة ومطفأة.
const e = require('../test/lib/economy'), E = require('../src/engine.js'), N = 360, seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const run = (seed, on) => { E.GRIEF.on = on; const S = e.setup(E, seed, 'direct'); const seen = new Set(); let sum = 0, n = 0, max = 0, shelf = 0, shelfN = 0, maxW = 0, maxC = {};
  for (let d = 0; d < N; d++) { E.botMain(S); E.tick(S, false); S.pause = false;
    if (on) { const v = E.feudView(S); maxW = Math.max(maxW, v.length); const cc = {}; v.forEach(f => { new Set([f.a, f.b].map(id => S.cities[id].country)).forEach(k => { cc[k] = (cc[k] || 0) + 1; }); }); Object.values(cc).forEach(x => { maxC.v = Math.max(maxC.v || 0, x); });
      v.forEach(f => { seen.add(f.a + '>' + f.b + '@' + f.day); sum += f.pct; n++; max = Math.max(max, f.pct); }); } }
  return { nw: E.netWorth(S), births: seen.size, sum, n, max, maxW, maxC: maxC.v || 0 }; };
const R = seeds.map(s => ({ s, on: run(s, true), off: run(s, false) }));
const births = R.reduce((a, r) => a + r.on.births, 0), sum = R.reduce((a, r) => a + r.on.sum, 0), n = R.reduce((a, r) => a + r.on.n, 0), max = Math.max(...R.map(r => r.on.max));
const nwOn = R.reduce((a, r) => a + r.on.nw, 0) / R.length, nwOff = R.reduce((a, r) => a + r.off.nw, 0) / R.length;
console.error(R.map(r => r.s + ':' + Math.round(r.on.nw) + '/' + Math.round(r.off.nw)).join(' '));
console.log(JSON.stringify({ seeds: seeds.length, days: N, births, birthsPerSeed: +(births / seeds.length).toFixed(1), avgPct: +(n ? sum / n : 0).toFixed(2), maxPct: max, maxWorld: Math.max(...R.map(r => r.on.maxW)), maxCountry: Math.max(...R.map(r => r.on.maxC)), nwOn: Math.round(nwOn), nwOff: Math.round(nwOff), ratio: +(nwOn / nwOff).toFixed(3), medianSeedRatio: +(R.map(r => r.on.nw / r.off.nw).sort((a, b) => a - b)[5] / 2 + R.map(r => r.on.nw / r.off.nw).sort((a, b) => a - b)[6] / 2).toFixed(3), ratioWithout2: +(R.filter(r => r.s !== 2).reduce((a, r) => a + r.on.nw, 0) / R.filter(r => r.s !== 2).reduce((a, r) => a + r.off.nw, 0)).toFixed(3) }));
