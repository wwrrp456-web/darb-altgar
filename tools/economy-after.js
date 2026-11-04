#!/usr/bin/env node
'use strict';
// 024 قرار ب2 (القياس «بعد») وقياس ب3 (ربح رحلة القبطان المستقل، قياس فقط). 12 بذرة × 12 سنة، الهرم مفعّل.
// «بعد»: المحرك الحالي (مردود 1.50، كلفة المشاريع الكبرى ×1.5 للدرجات ≥ 3). ب3: نسخ معدّلة نصياً من المحرك (src/engtmp_*.js تُحذف بعد الانتهاء).
// الاستعمال: node tools/economy-after.js ← قسما «بعد» و«ب3» في docs/economy/CURVE.md (يُحفَظ ما بعد <!-- B3-PROPOSAL -->).
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), { runOne } = require('./economy-curve.js');
const SEEDS = Array.from({ length: +process.env.AF_SEEDS || 12 }, (_, i) => i + 1), YEARS = +process.env.AF_YEARS || 12;
const CITY_ORDER = ['riyadh', 'jeddah', 'mecca', 'medina', 'hail', 'jazan', 'cairo', 'alex', 'aswan', 'isfahan', 'shiraz', 'tabriz', 'delhi', 'mumbai', 'kolkata', 'xian', 'guangzhou', 'shanghai'];
function chainBot(E, S, d) {
  const A = E.A, P = S.player; if (d % 14 !== 0 || P.gold < 40000) return;
  for (const f of P.factories) if (f.level < 3 && P.gold > 45000 && A.buildFactory(S, f.city, f.recipe).ok) return;
  for (const city of CITY_ORDER) for (const r of Object.keys(E.RECIPES)) { const rc = E.RECIPES[r]; if (rc.closed || !E.factoryLocal(S.cities[city], rc) || P.factories.some(f => f.city === city && f.recipe === r)) continue;
    if (!P.props[city]) A.buildShop(S, city); if (!P.props[city]) continue; const res = A.buildFactory(S, city, r); if (res.ok) { const f = P.factories.at(-1); try { A.setFactoryExport(S, f.id, true); } catch (e) {} A.hireFill(S, city); return; } }
}
const P = (a, b) => [a, b];
const HAG = "1 + 0.015 * car.captain.trade, 'auto', car.basis[g]", BUD = "const d = bestDeal(S, car, P.gold * 0.4, 'auto');", BUD2 = "budget = { gold: Math.min(P.gold * 0.4, d.cost * 1.1) }";
const bud = k => [P(BUD, BUD.replace('0.4', k)), P(BUD2, BUD2.replace('0.4', k))], hag = k => [P(HAG, HAG.replace('0.015', k))];
const VARIANTS = [
  { id: 'a_trader', group: 'after', label: 'تاجر (قباطنة مستقلون)', style: 'trader' },
  { id: 'a_shops', group: 'after', label: 'صاحب دكاكين', style: 'shops' },
  { id: 'a_factory', group: 'after', label: 'صاحب مصنع (أساسي)', style: 'factory' },
  { id: 'a_chain', group: 'after', label: 'سلسلة مصانع', style: 'chain', chain: true },
  { id: 'a_proj', group: 'after', label: 'دكاكين + مشاريع', style: 'shops', opts: { projects: true } },
  { id: 'a_tchain', group: 'after', label: 'تاجر + مصنع (قباطنة مستقلون وسلسلة مصانع)', style: 'trader', chain: true },
  { id: 'old_tchain', group: 'old', label: 'تاجر + مصنع بالمساومة القديمة 0.015', style: 'trader', chain: true, patches: [P("1 + 0.10 * car.captain.trade, 'auto', car.basis[g]", "1 + 0.015 * car.captain.trade, 'auto', car.basis[g]")] },
  { id: 'b3_0', group: 'b3', label: 'تاجر: الوضع الحالي (حصة رأس المال 0.4، مساومة 0.015)', style: 'trader' },
  { id: 'b3_bud6', group: 'b3', label: 'حصة رأس مال الصفقة 0.4 ← 0.6', style: 'trader', patches: bud('0.6') },
  { id: 'b3_bud8', group: 'b3', label: 'حصة رأس مال الصفقة 0.4 ← 0.8', style: 'trader', patches: bud('0.8') },
  { id: 'b3_hag3', group: 'b3', label: 'مساومة المستقل 0.015 ← 0.03 لكل نقطة تجارة', style: 'trader', patches: hag('0.03') },
  { id: 'b3_hag5', group: 'b3', label: 'مساومة المستقل 0.015 ← 0.05 لكل نقطة تجارة', style: 'trader', patches: hag('0.05') },
  { id: 'b3_both', group: 'b3', label: 'الاثنان: حصة 0.6 + مساومة 0.03', style: 'trader', patches: [...bud('0.6'), ...hag('0.03')] },
  { id: 'b3_both2', group: 'b3', label: 'الاثنان: حصة 0.8 + مساومة 0.05', style: 'trader', patches: [...bud('0.8'), ...hag('0.05')] },
  { id: 'b3_hag8', group: 'b3', label: 'مساومة المستقل 0.015 ← 0.08 لكل نقطة تجارة', style: 'trader', patches: hag('0.08') },
  { id: 'b3_hag12', group: 'b3', label: 'مساومة المستقل 0.015 ← 0.12 لكل نقطة تجارة', style: 'trader', patches: hag('0.12') },
  { id: 'b3_hag16', group: 'b3', label: 'مساومة المستقل 0.015 ← 0.16 لكل نقطة تجارة', style: 'trader', patches: hag('0.16') },
  { id: 'b3_both3', group: 'b3', label: 'الاثنان: حصة 0.8 + مساومة 0.08', style: 'trader', patches: [...bud('0.8'), ...hag('0.08')] },
];
if (!isMainThread && workerData && workerData.__af) {
  const v = VARIANTS.find(x => x.id === workerData.id), E = require(workerData.eng), opts = Object.assign({}, v.opts || {}); if (v.chain) opts.chain = (E2, S, d) => chainBot(E2, S, d);
  parentPort.postMessage(Object.assign(runOne(E, v.style, workerData.seed, true, YEARS, opts), { id: v.id })); return;
}
if (require.main === module) {
  const eng = {}; for (const v of VARIANTS) { if (process.env.AF_ONLY && !process.env.AF_ONLY.split(',').includes(v.id)) continue; if (!v.patches) { eng[v.id] = path.join(ROOT, 'src/engine.js'); continue; }
    let src = fs.readFileSync(path.join(ROOT, 'src/engine.js'), 'utf8'); for (const [a, b] of v.patches) { if (!src.includes(a)) throw new Error('نمط مفقود في ' + v.id + ': ' + a.slice(0, 50)); src = src.split(a).join(b); }
    eng[v.id] = path.join(ROOT, 'src/engtmp_' + v.id + '.js'); fs.writeFileSync(eng[v.id], src); }
  const ONLY = process.env.AF_ONLY ? process.env.AF_ONLY.split(',') : null, jp = path.join(ROOT, 'docs/economy/after.json'), old = ONLY && fs.existsSync(jp) ? JSON.parse(fs.readFileSync(jp, 'utf8')).rows.filter(r => !ONLY.includes(r.id)) : [];
  const tasks = []; for (const v of VARIANTS) if (!ONLY || ONLY.includes(v.id)) for (const seed of SEEDS) tasks.push({ __af: 1, id: v.id, seed, eng: eng[v.id] }); const res = []; let next = 0, running = 0;
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const f0 = x => x == null ? '—' : Math.round(x).toLocaleString('en-US'), yrs = (rs, i) => { const n = rs.filter(r => r.first[i] != null).length, m = med(rs.map(r => r.first[i])); return (m == null ? 'لم يبلغ' : (m / 354).toFixed(1) + ' سنة') + (n < rs.length ? ` (${n}/${rs.length})` : ''); };
  const done = () => {
    for (const v of VARIANTS) if (v.patches && eng[v.id]) fs.rmSync(eng[v.id], { force: true }); res.push(...old);
    fs.writeFileSync(jp, JSON.stringify({ years: YEARS, seeds: SEEDS, rows: res }) + '\n');
    const out = ['<!-- AFTER -->', '## بعد قرار ب2 (القياس «بعد»)', '', `> مولَّد بـ \`node tools/economy-after.js\`: ${SEEDS.length} بذرة × ${YEARS} سنة، الهرم مفعّل، المحرك الحالي (مردود المصنع المحلي 1.50، كلفة المشاريع ×1.5 للدرجات ≥ 3). وسيط البذور. حصة الإنفاق = ما أُنفق على المشاريع ÷ (الثروة + ما أُنفق) في نهاية السنة 8.`, ''];
    out.push('| الأسلوب | س3 | س5 | س8 | س12 | 250 ألفاً | مليون | 5 ملايين | 25 مليوناً | سيولة س8 |', '|---|---:|---:|---:|---:|---|---|---|---|---:|');
    for (const v of VARIANTS.filter(x => x.group === 'after')) { const rs = res.filter(r => r.id === v.id), nw = i => f0(med(rs.map(r => r.nw[i]))); out.push(`| ${v.label} | ${nw(2)} | ${nw(4)} | ${nw(7)} | ${nw(YEARS - 1)} | ${yrs(rs, 0)} | ${yrs(rs, 1)} | ${yrs(rs, 2)} | ${yrs(rs, 3)} | ${(med(rs.map(r => r.liq[7])) * 100).toFixed(0)}٪ |`); }
    const pr = res.filter(r => r.id === 'a_proj'), share = pr.map(r => r.sp[7] / (r.nw[7] + r.sp[7])), ok = share.filter(x => x >= 0.6).length;
    out.push('', `**SC-002 (الجديد): حصة ما أُنفق على المشاريع من الثروة المتولّدة بحلول السنة 8** = وسيط ${(med(share) * 100).toFixed(0)}٪ (${ok}/${pr.length} بذرة ≥ 60٪)؛ المنفَق وسيطاً ${f0(med(pr.map(r => r.sp[7])))} ريال، والمنجَز ${f0(med(pr.map(r => r.projDone)))} مشروعاً.`, '');
    out.push('<!-- B3 -->', '## ب3: ربح رحلة القبطان المستقل للتاجر (قياس ما قبل التطبيق؛ طُبّق 0.10 بقرار بن محمود، وصفوف «بعد» أعلاه بالمحرك الحالي)', '', `> الهدف: أن يبلغ تاجر القباطنة المستقلين المليون في 5–7 سنوات. ${SEEDS.length} بذرة × ${YEARS} سنة، الهرم مفعّل. الثابتان في \`autoIndep\` (10-captains.js): حصة رأس المال لكل صفقة (0.4 من الذهب) ومعامل المساومة لكل نقطة تجارة (0.015).`, '');
    out.push('| التجربة | س3 | س5 | س8 | س12 | مليون | 5 ملايين |', '|---|---:|---:|---:|---:|---|---|');
    for (const v of VARIANTS.filter(x => x.group === 'b3')) { const rs = res.filter(r => r.id === v.id), nw = i => f0(med(rs.map(r => r.nw[i]))); out.push(`| ${v.label} | ${nw(2)} | ${nw(4)} | ${nw(7)} | ${nw(YEARS - 1)} | ${yrs(rs, 1)} | ${yrs(rs, 2)} |`); }
    out.push('');
    const cp = path.join(ROOT, 'docs/economy/CURVE.md'), prev = fs.readFileSync(cp, 'utf8'), a = prev.indexOf('<!-- AFTER -->'), k = prev.indexOf('<!-- B3-PROPOSAL -->'), base = a >= 0 ? prev.slice(0, a) : prev.replace(/\s*$/, '\n\n');
    fs.writeFileSync(cp, base + out.join('\n') + (k >= 0 ? prev.slice(k) : '<!-- B3-PROPOSAL -->\n### مقترح ب3\n\n(يُكتب بعد القياس.)\n')); console.log(out.join('\n'));
  };
  const pump = () => { while (running < Math.max(1, os.cpus().length) && next < tasks.length) { const t = tasks[next++]; running++; const w = new Worker(__filename, { workerData: t }); w.once('message', m => { res.push(m); console.error('done', res.length + '/' + tasks.length); }); w.once('error', e => { console.error(e); process.exit(1); }); w.once('exit', () => { running--; if (res.length === tasks.length) done(); else pump(); }); } };
  pump();
}
