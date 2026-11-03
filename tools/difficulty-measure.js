#!/usr/bin/env node
'use strict';
// 021 (FR-002): لاعب آلي ثري يقود الأسواق بالمناورة (lobby حتى نفوذ 100) دولةً دولة؛ نقيس يوم إتمام قيادة كل دولة، وهل تُقاد الخامسة خلال 3 سنوات بعد الرابعة،
// بالصعوبة مفعّلة (DIFFICULTY.on) ومطفأة، 12 بذرة. الاستعمال: node tools/difficulty-measure.js  ← specs/021-difficulty/measure.md
const fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A;
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, f0 = x => Math.round(x);
const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1), Y = 354, DWELL = 40, ORDER = ['sa', 'eg', 'ir', 'in', 'cn'];
const mk = seed => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 3; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; S.player.gold = 5e8; return S; };
const led = (S, id) => S.cities[id].owner === 'player' || (S.bosses[id] && S.bosses[id].ruler === 'player');
function run(seed, on) {
  E.DIFFICULTY.on = on; try { const S = mk(seed), done = {}, bst = {}; let maxD = 1;
    for (let d = 0; d < 10 * Y && Object.keys(done).length < 5; d++) {
      const cur = ORDER.find(co => !done[co]), ready = cur && (cur === ORDER[0] || d - done[ORDER[ORDER.indexOf(cur) - 1]] >= DWELL);
      if (d % 2 === 0 && ready) { if (bst[cur] == null) bst[cur] = mean(S.order.filter(id => S.cities[id].country === cur).map(id => S.bosses[id].b)); for (const id of S.order.filter(id => S.cities[id].country === cur)) { const bs = S.bosses && S.bosses[id]; if (!bs || bs.ruler === 'player') continue; const need = Math.ceil(100 - bs.p); if (need > 0) A.lobby(S, id, need); } }
      if (d % 5 === 0) for (const id of S.order) { if (!led(S, id) || S.cities[id].owner === 'player') continue; for (let i = 0; i < 3; i++) A.buildShop(S, id); } // يثبّت القيادة بدكاكين في كل سوق مقاد (يُشترط حضورك لتبقى)
      E.tick(S, false); S.pause = false; maxD = Math.max(maxD, E.diffD(S));
      for (const co of ORDER) if (!done[co] && S.order.filter(id => S.cities[id].country === co).every(id => led(S, id))) done[co] = S.day;
    }
    const days = ORDER.map(c => done[c]); return { days, maxD, k: E.diffK(S), bst: ORDER.map(c => bst[c]), lobby: S.player.led.exp.lobby || 0 }; } finally { E.DIFFICULTY.on = true; }
}

const off = SEEDS.map(s => run(s, false)), on = SEEDS.map(s => run(s, true));
const gap = r => (r.days[4] != null && r.days[3] != null ? r.days[4] - r.days[3] : null), okAll = on.every(r => gap(r) != null && gap(r) <= 3 * Y), all = r => r.days.every(d => d != null);
const row = (nm, rs) => `| ${nm} | ${ORDER.map((_, i) => f0(mean(rs.filter(r => r.days[i] != null).map(r => r.days[i])) || 0)).join(' | ')} | ${f0(mean(rs.map(r => gap(r) || 0)))} | ${rs.filter(all).length} من ${rs.length} | ${mean(rs.map(r => r.maxD)).toFixed(2)} |`;
const brow = (nm, rs) => `| ${nm} | ${ORDER.map((_, i) => mean(rs.filter(r => r.bst[i] != null).map(r => r.bst[i])).toFixed(1)).join(' | ')} | ${f0(mean(rs.map(r => r.lobby)))} |`;
const out = ['# قياس صعوبة السيطرة (021، FR-002)', '', '> مولَّد بـ `node tools/difficulty-measure.js`. لاعب آلي بـ500 مليون يقود الأسواق بالمناورة حتى نفوذ 100 دولةً دولة بالتتابع (السعودية فمصر ففارس فالهند فالصين)، ويبني ثلاثة دكاكين في كل سوق يقوده ليثبت فيه، وينتظر 40 يوماً بعد كل دولة ليبلغ نفوذ الزعماء مستقرّه (أقسى حالة)، 12 بذرة. الأعمدة: متوسط يوم إتمام قيادة كل دولة.', '', '| الحالة | السعودية | مصر | فارس | الهند | الصين | أيام بين الرابعة والخامسة | أتمّت الخمس | أقصى D |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|', row('الصعوبة مطفأة', off), row('الصعوبة مفعّلة', on), '', '## نفوذ الزعماء (b) عند بدء قيادة كل دولة، وكلفة المناورة', '', 'يحتاج اللاعب نفوذاً p ≥ 1.22 × b ليخلع الزعيم (سقف p = 100، أي b ≤ 81.8).', '', '| الحالة | السعودية | مصر | فارس | الهند | الصين | إنفاق المناورة (ريال) |', '|---|---:|---:|---:|---:|---:|---:|', brow('الصعوبة مطفأة', off), brow('الصعوبة مفعّلة', on), '', `**صمّام الأمان (قيادة الخامسة خلال ${3 * Y} يوماً بعد الرابعة):** ${okAll ? 'متحقق في كل البذور' : 'غير متحقق في بعض البذور'}.`, ''];
fs.writeFileSync(path.join(__dirname, '../specs/021-difficulty/measure.md'), out.join('\n')); console.log(out.join('\n'));
