#!/usr/bin/env node
'use strict';
// 019 (FR-002): (أ) احتمال هزيمة الحراسة عند الهجوم حسب قيمة الحمولة والحراسة، قبل (B بين 4 و16 والحراس بلا رتب) وبعد (B بقدر الغنيمة والرتب)؛
// (ب) اللاعب الآلي: ثروة 3 سنوات ونهب القوافل بالمفتاحين مطفأين ومفعّلين (12 بذرة مزدوجة)؛ الحد ±10٪.
// الاستعمال: node tools/guards-measure.js  ← specs/019-guards/measure.md
const fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A;
const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1), Y = 354, VALUES = [3000, 10000, 40000, 160000];
const mk = seed => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = false; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; return S; };
const pct = x => (x * 100).toFixed(1) + '٪', f0 = x => Math.round(x).toLocaleString('en-US');
// (أ) تحليلي: B ~ U[4,16] × m (الاحتمال = حصة B فوق الدفاع)
const pDef = (D, m) => Math.max(0, Math.min(1, (16 * m - D) / (12 * m)));
const S0 = mk(1), car = S0.player.caravans[0]; car.morale = 100; car.guards = 0; car.crew = car.crew || 2;
const D = cfg => { car.guards = cfg.g; car.gr = cfg.r ? { v: cfg.r[0], c: cfg.r[1], svc: 0 } : undefined; return E.defenseOf(car); };
const CFG = [['بلا حراس', { g: 0 }], ['4 حراس عاديين', { g: 4 }], ['8 حراس عاديين', { g: 8 }], ['8 حراس: رئيس + 3 متمرّسين', { g: 8, r: [3, 1] }], ['8 حراس: رئيس + 7 متمرّسين', { g: 8, r: [7, 1] }]];
const rows = [];
for (const v of VALUES) { car.cargo = { wheat: v / E.mid('wheat') }; car.herd = {}; const m = E.banditScale(car); for (const [nm, cfg] of CFG) { const d = D(cfg); const before = pDef(d - 0, 1), after = pDef(d, m); rows.push(`| ${f0(v)} | ×${m.toFixed(2)} | ${nm} | ${d.toFixed(1)} | ${pct(before)} | ${pct(after)} |`); } }
// (ب) اللاعب الآلي
function run(seed, on) { E.GUARDS.ranks = E.GUARDS.scale = on; try { const S = mk(seed); S.player.gold += 150000; const c0 = S.player.caravans[0]; for (let i = 0; i < E.CART_MAX; i++) A.buyCart(S, c0.id); for (let i = 0; i < 4; i++) A.hireGuard(S, c0.id); for (let d = 0; d < 3 * Y; d++) { E.botMain(S); if (d % 5 === 0) E.botBuild(S); E.tick(S, false); S.pause = false; } return { nw: E.netWorth(S), loot: S.player.led.exp.bandits || 0 }; } finally { E.GUARDS.ranks = E.GUARDS.scale = true; } }
const off = SEEDS.map(s => run(s, false)), on = SEEDS.map(s => run(s, true)), mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const dn = mean(on.map(r => r.nw)) / mean(off.map(r => r.nw)) - 1, dl = mean(on.map(r => r.loot)) - mean(off.map(r => r.loot));
const se = (() => { const d = on.map((r, i) => r.nw - off[i].nw), m = mean(d); return Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1) / d.length) / mean(off.map(r => r.nw)); })();
const out = ['# قياس رتب الحراس وخطر الطريق (019، FR-002)', '', '> مولَّد بـ `node tools/guards-measure.js`.', '', '## 1) احتمال هزيمة الحراسة عند وقوع الهجوم', '', 'قبل: العصابة 4 إلى 16 دائماً والحراس بلا رتب. بعد: العصابة ×المعامل بقيمة الحمولة (1 + 0.15 × log2(القيمة ÷ 5000) بسقف 1.6) والرتب (1.5 / 2.5 / 4 ورئيس الحرس يرفع المعنويات +10). نسبة النهب عند الهزيمة (15–40٪) لم تتغير.', '', '| قيمة الحمولة | معامل العصابة | الحراسة | قوة الدفاع | الهزيمة قبل | الهزيمة بعد |', '|---|---:|---|---:|---:|---:|', ...rows, '',
  '## 2) اللاعب الآلي (12 بذرة مزدوجة × 3 سنوات، المفتاحان معاً)', '', '| | بلا الميزة | بها |', '|---|---:|---:|', `| متوسط الثروة | ${f0(mean(off.map(r => r.nw)))} | ${f0(mean(on.map(r => r.nw)))} |`, `| متوسط نهب القوافل (ريال) | ${f0(mean(off.map(r => r.loot)))} | ${f0(mean(on.map(r => r.loot)))} |`, '', `**فرق الثروة: ${pct(dn)} ± ${pct(se)}** (الحد ±10٪): ${Math.abs(dn) <= 0.10 ? 'ضمن الحد' : 'خارج الحد'}. فرق النهب ${dl >= 0 ? '+' : ''}${f0(dl)} ريال في المتوسط. (اللاعب الآلي يبدأ بـ150 ألفاً وعربات كاملة وأربعة حراس عاديين ولا يرقّيهم، ليحمل قوافل كبيرة؛ وبلا حراس تُنهب القافلة دائماً فلا أثر لقوة العصابة.)`, ''];
fs.writeFileSync(path.join(__dirname, '../specs/019-guards/measure.md'), out.join('\n')); console.log(out.join('\n'));
