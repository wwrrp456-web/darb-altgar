#!/usr/bin/env node
'use strict';
// 024 المرحلة ب2 (T005b): قياس فقط (12 بذرة × 12 سنة، الهرم مفعّل كما هو الآن) لأربعة أسئلة، بلا تطبيق أي ثابت: (1) سقف الأسطول 6/8/10 للتاجر؛ (2) ربح سلسلة المصانع (مردود المصنع المحلي) ؛
// (3) كلفة المشاريع الكبرى ×1 و×1.5 و×2 للدرجات ≥ 3 وأثرها على النقد العاطل؛ (4) كبح الدكاكين (حدّ الدكاكين في المدينة، ونمو سعر الدكان) وأيام بلوغ 25 مليوناً.
// كل تجربة تُنفَّذ على نسخة معدّلة نصياً من المحرك (src/engtmp_*.js تُحذف بعد الانتهاء). الاستعمال: node tools/economy-b2.js  ← قسم «ب2» في docs/economy/CURVE.md (يُحفَظ ما بعد <!-- B2-PROPOSAL -->)
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), { runOne } = require('./economy-curve.js');
const SEEDS = Array.from({ length: +process.env.B2_SEEDS || 12 }, (_, i) => i + 1), YEARS = +process.env.B2_YEARS || 12;
const CITY_ORDER = ['riyadh', 'jeddah', 'mecca', 'medina', 'hail', 'jazan', 'cairo', 'alex', 'aswan', 'isfahan', 'shiraz', 'tabriz', 'delhi', 'mumbai', 'kolkata', 'xian', 'guangzhou', 'shanghai'];
// سلسلة مصانع: مصانع محلية متتالية بمخرجات تُصدَّر آلياً، وترقية المستوى؛ مع احتياطي رأس مال
function chainBot(E, S, d) {
  const A = E.A, P = S.player; if (d % 14 !== 0 || P.gold < 40000) return;
  for (const f of P.factories) if (f.level < 3 && P.gold > 45000 && A.buildFactory(S, f.city, f.recipe).ok) return;
  for (const city of CITY_ORDER) for (const r of Object.keys(E.RECIPES)) { const rc = E.RECIPES[r]; if (rc.closed || !E.factoryLocal(S.cities[city], rc) || P.factories.some(f => f.city === city && f.recipe === r)) continue;
    if (!P.props[city]) A.buildShop(S, city); if (!P.props[city]) continue; const res = A.buildFactory(S, city, r); if (res.ok) { const f = P.factories.at(-1); try { A.setFactoryExport(S, f.id, true); } catch (e) {} A.hireFill(S, city); return; } }
}
const P = (a, b) => [a, b];
const VARIANTS = [
  { id: 'fleet6', group: 'fleet', label: 'تاجر: سقف الأسطول 6 (الحالي)', style: 'trader', opts: { fleetCap: 6 } },
  { id: 'fleet8', group: 'fleet', label: 'تاجر: سقف الأسطول 8', style: 'trader', opts: { fleetCap: 8 }, patches: [P("{ on: false, shops: 99, fleet: 6,", "{ on: false, shops: 99, fleet: 8,"), P("if (S.player.caravans.length >= 6) return NO('أقصى أسطول 6 قوافل');", "if (S.player.caravans.length >= 8) return NO('أقصى أسطول 8 قوافل');")] },
  { id: 'fleet10', group: 'fleet', label: 'تاجر: سقف الأسطول 10', style: 'trader', opts: { fleetCap: 10 }, patches: [P("{ on: false, shops: 99, fleet: 6,", "{ on: false, shops: 99, fleet: 10,"), P("if (S.player.caravans.length >= 6) return NO('أقصى أسطول 6 قوافل');", "if (S.player.caravans.length >= 10) return NO('أقصى أسطول 10 قوافل');")] },
  { id: 'chain1', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.45 (الحالي)', style: 'chain', chain: true },
  { id: 'chain18', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.8', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.8;")] },
  { id: 'chain22', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 2.2', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 2.2;")] },
  { id: 'fleet6c', group: 'fleet', label: 'تاجر: أسطول 6 مع عربات إضافية (حتى الحدّ)', style: 'trader', opts: { fleetCap: 6, carts: true } },
  { id: 'fleet10c', group: 'fleet', label: 'تاجر: أسطول 10 مع عربات إضافية', style: 'trader', opts: { fleetCap: 10, carts: true }, patches: [P("{ on: false, shops: 99, fleet: 6,", "{ on: false, shops: 99, fleet: 10,"), P("if (S.player.caravans.length >= 6) return NO('أقصى أسطول 6 قوافل');", "if (S.player.caravans.length >= 10) return NO('أقصى أسطول 10 قوافل');")] },
  { id: 'chain150', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.50', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.5;")] },
  { id: 'chain152', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.52', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.52;")] },
  { id: 'chain155', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.55', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.55;")] },
  { id: 'chain162', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.62', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.62;")] },
  { id: 'chain170', group: 'chain', label: 'سلسلة مصانع: مردود المحلي 1.7', style: 'chain', chain: true, patches: [P("LOCAL_FACTORY_YIELD = 1.45;", "LOCAL_FACTORY_YIELD = 1.7;")] },
  { id: 'proj1', group: 'proj', label: 'دكاكين + مشاريع: الكلفة ×1 (الحالية)', style: 'shops', opts: { projects: true }, costK: 1 },
  { id: 'proj15', group: 'proj', label: 'دكاكين + مشاريع: الكلفة ×1.5 (الدرجات ≥ 3)', style: 'shops', opts: { projects: true }, costK: 1.5 },
  { id: 'proj2', group: 'proj', label: 'دكاكين + مشاريع: الكلفة ×2 (الدرجات ≥ 3)', style: 'shops', opts: { projects: true }, costK: 2 },
  { id: 'shops0', group: 'brake', label: 'دكاكين: الوضع الحالي', style: 'shops' },
  { id: 'lim1', group: 'brake', label: 'دكاكين: حدّ الدكاكين في المدينة −1', style: 'shops', patches: [P("Math.floor(2 + 2 * c.size) + (c.tier - 1);", "Math.max(1, Math.floor(2 + 2 * c.size) + (c.tier - 1) - 1);")] },
  { id: 'lim2', group: 'brake', label: 'دكاكين: حدّ الدكاكين في المدينة −2', style: 'shops', patches: [P("Math.floor(2 + 2 * c.size) + (c.tier - 1);", "Math.max(1, Math.floor(2 + 2 * c.size) + (c.tier - 1) - 2);")] },
  { id: 'gr22', group: 'brake', label: 'دكاكين: نمو سعر الدكان التالي 1.5 ← 2.2', style: 'shops', patches: [P("Math.pow(1.5, shopsOf(S, c.id).length)", "Math.pow(2.2, shopsOf(S, c.id).length)")] },
  { id: 'gr30', group: 'brake', label: 'دكاكين: نمو سعر الدكان التالي 1.5 ← 3.0', style: 'shops', patches: [P("Math.pow(1.5, shopsOf(S, c.id).length)", "Math.pow(3, shopsOf(S, c.id).length)")] },
];
const ORDER = ['fleet6', 'fleet8', 'fleet10', 'fleet6c', 'fleet10c', 'chain1', 'chain150', 'chain152', 'chain155', 'chain162', 'chain170', 'chain18', 'chain22', 'proj1', 'proj15', 'proj2', 'shops0', 'lim1', 'lim2', 'gr22', 'gr30']; VARIANTS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
if (!isMainThread && workerData && workerData.__b2) {
  const v = VARIANTS.find(x => x.id === workerData.id), E = require(workerData.eng); if (v.costK) for (const id in E.PROJECTS) if (E.PROJECTS[id].tier >= 3) E.PROJECTS[id].stages = E.PROJECTS[id].stages.map(x => Math.round(x * v.costK));
  const opts = Object.assign({}, v.opts || {}); if (v.chain) opts.chain = (E2, S, d) => chainBot(E2, S, d);
  parentPort.postMessage(Object.assign(runOne(E, v.style, workerData.seed, null, YEARS, opts), { id: v.id })); return;
}
if (require.main === module) {
  const eng = {}; for (const v of VARIANTS) { if (process.env.B2_ONLY && !process.env.B2_ONLY.split(',').includes(v.id)) continue; if (!v.patches) { eng[v.id] = path.join(ROOT, 'src/engine.js'); continue; } let src = fs.readFileSync(path.join(ROOT, 'src/engine.js'), 'utf8'); for (const [a, b] of v.patches) { if (!src.includes(a)) throw Error('لا مطابقة للتعديل في ' + v.id + ': ' + a.slice(0, 50)); src = src.replace(a, b); } eng[v.id] = path.join(ROOT, 'src/engtmp_' + v.id + '.js'); fs.writeFileSync(eng[v.id], src); }
  const ONLY = process.env.B2_ONLY ? process.env.B2_ONLY.split(',') : null, jp = path.join(ROOT, 'docs/economy/b2.json'), old = ONLY && fs.existsSync(jp) ? JSON.parse(fs.readFileSync(jp, 'utf8')).rows.filter(r => !ONLY.includes(r.id)) : [];
  const tasks = []; for (const v of VARIANTS) if (!ONLY || ONLY.includes(v.id)) for (const seed of SEEDS) tasks.push({ __b2: 1, id: v.id, seed, eng: eng[v.id] }); const res = []; let next = 0, running = 0;
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const f0 = x => x == null ? '—' : Math.round(x).toLocaleString('en-US'), yrs = (rs, i) => { const n = rs.filter(r => r.first[i] != null).length, m = med(rs.map(r => r.first[i])); return (m == null ? 'لم يبلغ' : (m / 354).toFixed(1) + ' سنة') + (n < rs.length ? ` (${n}/${rs.length})` : ''); };
  const done = () => {
    for (const v of VARIANTS) if (v.patches && eng[v.id]) fs.rmSync(eng[v.id], { force: true }); res.push(...old);
    fs.writeFileSync(path.join(ROOT, 'docs/economy/b2.json'), JSON.stringify({ years: YEARS, seeds: SEEDS, rows: res }) + '\n');
    const out = ['<!-- B2 -->', '## ب2: قياس فقط (لا يُطبَّق شيء قبل الاعتماد)', '', `> مولَّد بـ \`node tools/economy-b2.js\`: ${SEEDS.length} بذرة × ${YEARS} سنة، الهرم مفعّل (بعد ب1)، وسيط البذور. كل صف تجربة على نسخة معدّلة من المحرك لا تُرفع.`, ''];
    const G = { fleet: ['### (أ) سقف الأسطول للتاجر', ['الثروة س5', 'الثروة س8', 'الثروة س12', 'مليون', '5 ملايين']], chain: ['### (أ) ربح سلسلة المصانع', ['الثروة س5', 'الثروة س8', 'الثروة س12', 'مليون', '5 ملايين']], proj: ['### (ب) كلفة المشاريع الكبرى: النقد العاطل (دكاكين + مشاريع)', ['الثروة س8', 'السيولة س8', 'السيولة س12', 'أُنفق على المشاريع (ريال)', 'مشاريع مُتمَّة']], brake: ['### (ج) كبح الدكاكين', ['الثروة س5', 'الثروة س8', 'الثروة س12', '25 مليوناً', '100 مليون']] };
    for (const g of Object.keys(G)) { out.push(G[g][0], '', '| التجربة | ' + G[g][1].join(' | ') + ' |', '|---|' + '---:|'.repeat(G[g][1].length));
      for (const v of VARIANTS.filter(x => x.group === g)) { const rs = res.filter(r => r.id === v.id), nw = i => f0(med(rs.map(r => r.nw[i]))), liq = i => (med(rs.map(r => r.liq[i])) * 100).toFixed(0) + '٪';
        const cells = g === 'proj' ? [nw(7), liq(7), liq(YEARS - 1), f0(med(rs.map(r => r.spent))), f0(med(rs.map(r => r.projDone)))] : g === 'brake' ? [nw(4), nw(7), nw(YEARS - 1), yrs(rs, 3), yrs(rs, 4)] : [nw(4), nw(7), nw(YEARS - 1), yrs(rs, 1), yrs(rs, 2)]; out.push(`| ${v.label} | ${cells.join(' | ')} |`); }
      out.push(''); }
    const cp = path.join(ROOT, 'docs/economy/CURVE.md'), prev = fs.readFileSync(cp, 'utf8'), a = prev.indexOf('<!-- B2 -->'), base = a >= 0 ? prev.slice(0, a) : prev + '\n', k = prev.indexOf('<!-- B2-PROPOSAL -->');
    fs.writeFileSync(cp, base + out.join('\n') + (k >= 0 ? prev.slice(k) : '<!-- B2-PROPOSAL -->\n### مقترح ب2\n\n(يُكتب بعد القياس.)\n')); console.log(out.join('\n'));
  };
  const pump = () => { while (running < Math.max(1, os.cpus().length) && next < tasks.length) { const t = tasks[next++]; running++; const w = new Worker(__filename, { workerData: t }); w.once('message', m => { res.push(m); console.error('done', res.length + '/' + tasks.length); }); w.once('error', e => { console.error(e); process.exit(1); }); w.once('exit', () => { running--; if (res.length === tasks.length) done(); else pump(); }); } };
  pump();
}
