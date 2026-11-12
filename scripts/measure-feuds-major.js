#!/usr/bin/env node
'use strict';
// SC-007 (036ز): 12 بذرة × 360 يوماً بلاعب آلي (botMain): أثر الخصومات الكبرى في الأسعار (من الأرقام الفعلية)، وثروة اللاعب الآلي مع GRIEF.major مفعّلة ومطفأة (الخصومات العادية مفعّلة في الحالتين)؛ الوسيط = الوسط بعد ترتيب النسب.
const e = require('../test/lib/economy'), E = require('../src/engine.js'), N = 360, seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const run = (seed, on) => { E.GRIEF.major.on = on; const S = e.setup(E, seed, 'direct'); let sum = 0, n = 0, max = 0;
  for (let d = 0; d < N; d++) { E.botMain(S); E.tick(S, false); S.pause = false; if (on) E.feudView(S).filter(f => f.big).forEach(f => { sum += f.pct; n++; max = Math.max(max, f.pct); }); }
  return { nw: E.netWorth(S), sum, n, max, bigs: (S.feuds || []).filter(f => f.big).length }; };
const R = seeds.map(s => ({ s, on: run(s, true), off: run(s, false) })), ratios = R.map(r => r.on.nw / r.off.nw).sort((a, b) => a - b), mid = ratios.length % 2 ? ratios[(ratios.length - 1) / 2] : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2;
const sum = R.reduce((a, r) => a + r.on.sum, 0), n = R.reduce((a, r) => a + r.on.n, 0);
console.error(R.map(r => r.s + ':' + Math.round(r.on.nw) + '/' + Math.round(r.off.nw)).join(' '));
console.log(JSON.stringify({ seeds: seeds.length, days: N, bigPerSeed: R.map(r => r.on.bigs), avgPct: +(n ? sum / n : 0).toFixed(2), maxPct: Math.max(...R.map(r => r.on.max)), median: +mid.toFixed(3), mean: +(ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(3), inBand: ratios.filter(x => x >= 0.9 && x <= 1.1).length, ratios: ratios.map(x => +x.toFixed(3)) }));
