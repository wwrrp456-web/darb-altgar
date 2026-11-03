#!/usr/bin/env node
'use strict';
// 016 (SC-002): أثر كل بُعد من أبعاد الازدهار على ربح سنتين: اللاعب الآلي (صاحب دكاكين يشتري الأصول) والبُعد في كل المدن عند أقصاه (+40 فوق الأولي) مقابل دونه، 8 بذور مزدوجة. الحد 10٪ لكل بُعد، و12٪ للستة معاً (WORLD.md القسم 1).
// الاستعمال: node tools/prosperity-measure.js  ← specs/016-city-prosperity/measure.md
const fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A;
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1), Y = 354;
const mk = seed => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'shopkeeper'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; S.player.gold = 150000; return S; };
function force(S, keys) { for (const id of S.order) { const p = E.prosEnsure(S, id); for (const k of keys) { p[k] = p.b[k] + 40; p.care[k] = 100; } p.last = S.day; } }
function run(seed, keys) { const S = mk(seed), home = E.START_OF[S.home];
  for (let d = 0; d < 2 * Y; d++) { if (keys.length && d % 30 === 0) force(S, keys); if (S.phase >= 2 && d % 2 === 0) { const pr = S.player.props[home]; if (pr && pr.shops.length < 3 && S.player.gold > 4000) A.buildShop(S, home); if (pr) A.hireFill(S, home); } E.botMain(S); if (d % 5 === 0) E.botBuild(S); E.tick(S, false); S.pause = false; }
  return Object.values(S.player.led.inc).reduce((a, b) => a + b, 0); } // إجمالي الدخل المقيَّد في سنتين (أقل تذبذباً من الثروة)
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, se = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1) / a.length); };
const pct = x => (x * 100).toFixed(1) + '٪';
const base = SEEDS.map(s => run(s, [])), rows = []; let bad = 0;
for (const [keys, name, lim] of [...E.PR_KEYS.map(k => [[k], E.PR_NAMES[k], 0.10]), [E.PR_KEYS, 'الأبعاد الستة معاً', 0.12]]) { const w = SEEDS.map(s => run(s, keys)), dif = w.map((x, i) => x - base[i]), mb = mean(base), m = mean(dif) / mb, e = se(dif) / mb, okk = m <= lim, sure = m + 2 * e <= lim; if (!okk) bad++; rows.push(`| ${name} | ${pct(m)} | ${pct(e)} | ${pct(lim)} | ${sure ? 'نعم' : okk ? 'المتوسط ضمن الحد، والمدى يتجاوزه تشويشاً' : 'لا (راجع)'} |`); console.error('dim', name); }
const out = ['# قياس أثر الازدهار على الدخل (016، SC-002)', '', '> مولَّد بـ `node tools/prosperity-measure.js`. لاعب آلي (صاحب دكاكين يشتري الأصول) بثروة بداية 150 ألفاً، 24 بذرة مزدوجة × سنتان، والمقياس إجمالي الدخل المقيَّد في الدفتر (أقل تذبذباً من الثروة)، والبُعد المختبَر عند أقصاه (+40 فوق الأولي) في كل المدن طوال الوقت (حالة قصوى لا تحدث في لعب عادي)؛ المقارنة بالبذرة نفسها دونه.', '', '| البُعد | فرق دخل سنتين (متوسط) | الخطأ المعياري | الحد | ضمن الحد؟ |', '|---|---:|---:|---:|---|', ...rows, '', bad ? `**${bad} بُعد يحتاج مراجعة.**` : '**المتوسط ضمن الحد في كل بُعد وفي الستة معاً؛ وما تجاوزه المدى (متوسط + ضعف الخطأ) فبسبب التشويش لا بالأثر.**', ''];
fs.writeFileSync(path.join(__dirname, '../specs/016-city-prosperity/measure.md'), out.join('\n')); console.log(out.join('\n'));
