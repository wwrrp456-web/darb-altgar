'use strict';
// WP-05ب: ثوابت الاقتصاد ١–٣ على بذرتين وخمس سنوات لكل أسلوب (≈ ٧٠ ث): لا NaN ولا سالب، الثروة الوسيطة في السنة ٥ ضمن ±٣٠٪ من خط الأساس، السيولة ≥ ٥٪.
// خط الأساس: docs/review/ECONOMY_BASELINE_2610.json (scripts/measure-baseline.js). ما يفشل اليوم يُسجَّل في KNOWN ولا يُصلَح هنا.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const E = require('../src/engine.js'), eco = require('./lib/economy.js');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/review/ECONOMY_BASELINE_2610.json'), 'utf8'));
const SEEDS = [1, 2], YEARS = 5, TOL = 0.3, MIN_LIQ = 0.05;
const KNOWN = { banker: { liquidity: 'المصرفي يضع رأس ماله في المضاربة فتنفد سيولته (محفظته صفر عند السنة 5): لا يُصلَح هنا' } };
const med = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const failures = [];
for (const [style, scenario] of Object.entries(eco.STYLES)) {
  const nw = [], liq = [];
  for (const seed of SEEDS) {
    const S = eco.setup(E, seed, scenario);
    for (let y = 1; y <= YEARS; y++) {
      for (let d = 0; d < 354; d++) { eco.stepSector(E, S, scenario, d); E.tick(S, false); S.pause = false; }
      const w = S.player.wallet, n = E.netWorth(S);
      assert.ok([w.sar, w.usd, w.au, n].every(Number.isFinite), `${style} بذرة ${seed} سنة ${y}: قيمة غير عددية`);
      assert.ok([w.sar, w.usd, w.au].every(v => v > -1e-6), `${style} بذرة ${seed} سنة ${y}: رصيد سالب`);
      for (const id of S.order) for (const g of E.GIDS) { const v = S.cities[id].stock[g]; assert.ok(Number.isFinite(v) && v > -1e-6, `${style}: مخزون ${id}/${g} غير سليم`); }
      for (const car of S.player.caravans) for (const g in car.cargo) assert.ok(Number.isFinite(car.cargo[g]) && car.cargo[g] > -1e-6, `${style}: حمولة سالبة`);
    }
    nw.push(E.netWorth(S)); liq.push(E.liquid(S) / E.netWorth(S));
  }
  const ref = med(base.rows.find(r => r.style === style).rows.filter(r => SEEDS.includes(r.seed)).map(r => r.on.nw[YEARS - 1])), m = med(nw), dev = (m - ref) / ref;
  console.log(`${style}: ثروة السنة 5 الوسيطة ${Math.round(m)} مقابل خط الأساس ${Math.round(ref)} (${(100 * dev).toFixed(1)}%)، سيولة ${(100 * med(liq)).toFixed(1)}%`);
  assert.ok(Math.abs(dev) <= TOL, `${style}: انحراف الثروة ${(100 * dev).toFixed(1)}% عن خط الأساس يتجاوز ±30%`);
  if (med(liq) < MIN_LIQ) { if (KNOWN[style]?.liquidity) failures.push(`${style}: ${KNOWN[style].liquidity}`); else assert.fail(`${style}: السيولة ${(100 * med(liq)).toFixed(1)}% أقل من 5%`); }
  else if (KNOWN[style]?.liquidity) console.log(`  ملاحظة: ${style} كان في KNOWN وصار يجتاز السيولة؛ احذفه من القائمة`);
}
for (const f of failures) console.log('KNOWN ' + f);
console.log('OK economy-invariants: no NaN/negatives, wealth within ±30% of baseline, liquidity ≥ 5% except KNOWN');
