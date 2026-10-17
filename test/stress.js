const E = require('../src/engine.js');
const bot = process.argv[2] !== 'nobot';
const r = E.stressTest({ seeds: +process.argv[4] || 8, days: +process.argv[3] || 100, bot });
const R = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
console.log(JSON.stringify({ summary: r.summary, nan: r.nan, minRatio: +r.minRatio.toFixed(2), maxRatio: +r.maxRatio.toFixed(2), pop: r.pop.map(Math.round), playerNW: r.playerNW, countryFood: Object.fromEntries(Object.entries(r.countryFood).map(([k, v]) => [k, +v.toFixed(2)])), sinks: R(r.sinks), fauc: R(r.fauc) }, null, 1));
