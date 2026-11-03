#!/usr/bin/env node
'use strict';
// 024 المرحلة أ (T002): منحنى الاقتصاد بثلاثة أساليب لاعب آلي يعيد استثمار أرباحه: تاجر قوافل، صاحب دكاكين، صاحب مصانع؛ × 12 بذرة × 12 سنة، مرة بالهرم مطفأ (PROSPER.pyramid=false) ومرة مفعّلاً.
// يسجّل الثروة سنوياً، ونسبة السيولة (E.liquid ÷ الثروة)، وأيام بلوغ درجات المشاريع (LADDER.md). لا يغيّر شيئاً في src/.
// الاستعمال: node tools/economy-curve.js [--years 12] [--seeds 12]  ← docs/economy/curve.json و CURVE.md (ما بعد الوسم <!-- PROPOSAL --> يُحفَظ كما هو)
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), STYLES = ['trader', 'shops', 'factory'], NAME = { trader: 'تاجر قوافل', shops: 'صاحب دكاكين', factory: 'صاحب مصانع' };
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const YEARS = arg('years', 12), NSEEDS = arg('seeds', 12), SEEDS = Array.from({ length: NSEEDS }, (_, i) => i + 1), TIERS = [250000, 1e6, 5e6, 25e6, 1e8];
const CITIES = ['riyadh', 'jeddah', 'mecca', 'medina', 'hail', 'jazan', 'cairo', 'alex', 'aswan', 'isfahan', 'shiraz', 'tabriz', 'delhi', 'mumbai', 'kolkata', 'xian', 'guangzhou', 'shanghai'];
function runOne(E, style, seed, pyr, years) {
  const eco = require('../test/lib/economy.js'), A = E.A; E.PROSPER.pyramid = !!pyr;
  const sc = style === 'trader' ? 'captain1' : style === 'shops' ? 'shops3' : 'factory', S = eco.setup(E, seed, sc), P = S.player, nw = [], liq = [], first = TIERS.map(() => null);
  const top = city => { const c = S.cities[city]; return E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4); };
  const stock = city => { for (const sh of E.shopsOf(S, city)) if (sh.items.length < 4) for (const g of top(city)) A.shopSetItem(S, city, sh.id, g, E.SHOP_PRICE0, true); A.hireFill(S, city); };
  function grow(d) {
    if (d % 7 !== 0) return;
    if (style === 'trader') { if (P.gold > 9000 && P.caravans.length < 6) { const r = A.hireCaptain(S); if (r.ok) { const c = P.caravans.at(-1); c.captain.role = 'indep'; c.captain.home = 'sa'; } } return; }
    if (style === 'shops') { for (const city of CITIES) { const pr = P.props[city], c = S.cities[city], n = pr ? pr.shops.length : 0; if (P.gold > E.shopCost(S, c) * 4 && n < E.shopLimit(c) && A.buildShop(S, city).ok) stock(city); if (pr && pr.whs < pr.shops.length && P.gold > 8000) A.buildWarehouse(S, city); } return; }
    if (style === 'factory' && d % 14 === 0 && P.gold > 40000) { const f = P.factories[0]; if (f && f.level < 3) A.buildFactory(S, f.city, f.recipe); }
  }
  for (let d = 0; d < 354 * years; d++) {
    grow(d); eco.stepSector(E, S, sc, d); E.tick(S, false); S.pause = false;
    if (d % 7 === 0) { const w = E.netWorth(S); TIERS.forEach((t, i) => { if (first[i] == null && w >= t) first[i] = d; }); }
    if ((d + 1) % 354 === 0) { const w = E.netWorth(S); nw.push(Math.round(w)); liq.push(w > 0 ? +(E.liquid(S) / w).toFixed(3) : 0); }
  }
  return { style, seed, pyr: !!pyr, nw, liq, first, shops: S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0), fact: P.factories.length, cars: P.caravans.length, pop3: +(S.order.reduce((a, c) => a + S.cities[c].pop[3], 0) / S.order.reduce((a, c) => a + E.popTotal(S.cities[c]), 0)).toFixed(3) };
}
module.exports = { runOne };
if (!isMainThread && workerData && workerData.__econ) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.style, workerData.seed, workerData.pyr, workerData.years)); return; }
if (require.main === module) {
  const tasks = []; for (const pyr of [false, true]) for (const style of STYLES) for (const seed of SEEDS) tasks.push({ __econ: 1, style, seed, pyr, years: YEARS }); const res = []; let next = 0, running = 0;
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const f0 = x => x == null ? '—' : Math.round(x).toLocaleString('en-US'), yrs = d => d == null ? 'لم يبلغ' : (d / 354).toFixed(1) + ' سنة';
  const done = () => {
    fs.mkdirSync(path.join(ROOT, 'docs/economy'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'docs/economy/curve.json'), JSON.stringify({ years: YEARS, seeds: SEEDS, rows: res }) + '\n');
    const out = ['# منحنى الاقتصاد (024، المرحلة أ): قياس «قبل»', '', `> مولَّد بـ \`node tools/economy-curve.js\`. ثلاثة أساليب لاعب آلي **يعيد استثمار أرباحه** (التاجر: يوظّف قباطنة مستقلين حتى 6 قوافل؛ صاحب الدكاكين: يبني دكاناً بعد دكان في المدن الثماني عشرة (حتى حدّ المدينة) ويجهّز ويبني مخازن؛ صاحب المصانع: مصنع عطور ويرفع مستواه إلى 3)، ${NSEEDS} بذرة × ${YEARS} سنة، بالهرم مطفأ ومفعّلاً. الأعداد وسيط البذور. لا يمسّ المستوى (الافتتاحية) لأن البداية هي مشاهد \`test/lib/economy.js\` نفسها.`, ''];
    for (const pyr of [false, true]) { out.push(`## الهرم ${pyr ? 'مفعّل (`PROSPER.pyramid=true`)' : 'مطفأ (الوضع الحالي)'}`, '', '### الثروة (ريال) وسيط البذور في نهاية كل سنة', '', '| الأسلوب | ' + Array.from({ length: YEARS }, (_, i) => 'س' + (i + 1)).join(' | ') + ' |', '|---|' + '---:|'.repeat(YEARS));
      for (const st of STYLES) { const rs = res.filter(r => r.style === st && r.pyr === pyr); out.push(`| ${NAME[st]} | ` + Array.from({ length: YEARS }, (_, i) => f0(med(rs.map(r => r.nw[i])))).join(' | ') + ' |'); }
      out.push('', '### النقد العاطل (السيولة ÷ الثروة) وسيط البذور، وأيام بلوغ درجات السلّم (وسيط)', '', '| الأسلوب | سيولة س3 | سيولة س8 | سيولة س12 | 250 ألفاً | مليون | 5 ملايين | 25 مليوناً | 100 مليون | الموسرون من السكان |', '|---|---:|---:|---:|---|---|---|---|---|---:|');
      for (const st of STYLES) { const rs = res.filter(r => r.style === st && r.pyr === pyr), q = i => (med(rs.map(r => r.liq[i])) * 100).toFixed(0) + '٪'; out.push(`| ${NAME[st]} | ${q(2)} | ${q(Math.min(7, YEARS - 1))} | ${q(YEARS - 1)} | ${TIERS.map((_, i) => `${yrs(med(rs.map(r => r.first[i])))}${rs.filter(r => r.first[i] != null).length < rs.length ? ` (${rs.filter(r => r.first[i] != null).length}/${rs.length})` : ''}`).join(' | ')} | ${(med(rs.map(r => r.pop3)) * 100).toFixed(0)}٪ |`); }
      out.push(''); }
    const prev = fs.existsSync(path.join(ROOT, 'docs/economy/CURVE.md')) ? fs.readFileSync(path.join(ROOT, 'docs/economy/CURVE.md'), 'utf8') : '', i = prev.indexOf('<!-- PROPOSAL -->');
    out.push(i >= 0 ? prev.slice(i) : '<!-- PROPOSAL -->\n## المقترح\n\n(يُكتب بعد القياس.)\n'); fs.writeFileSync(path.join(ROOT, 'docs/economy/CURVE.md'), out.join('\n')); console.log(out.slice(0, out.indexOf('<!-- PROPOSAL -->') >= 0 ? out.indexOf('<!-- PROPOSAL -->') : out.length).join('\n'));
  };
  const pump = () => { while (running < Math.max(1, os.cpus().length) && next < tasks.length) { const t = tasks[next++]; running++; const w = new Worker(__filename, { workerData: t }); w.once('message', m => { res.push(m); console.error('done', res.length + '/' + tasks.length); }); w.once('error', e => { console.error(e); process.exit(1); }); w.once('exit', () => { running--; if (res.length === tasks.length) done(); else pump(); }); } };
  pump();
}
