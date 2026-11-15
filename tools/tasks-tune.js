#!/usr/bin/env node
'use strict';
// 038د: ضبط المهام بالقياس (specs/038-tasks/spec-cd.md §6). الشخصيات الخمس × البذور 1..8 × سنتان، حالتان: on (TASKS.on وTASKS.c.on) وoff (TASKS.on=false).
// اللاعب الآلي محايد (لا يعرف المهام)؛ في on فقط يفتح المهام ويقبل واحدة من كل عرض. لا يعيد القياس إن لم يتغير المحرك (--force).
// الاستعمال: node tools/tasks-tune.js [--force] [--tag=اسم]  ← specs/038-tasks/tune-d.json وtune-d.md (لا يدخل test/run.js)
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), CHARS = ['trader', 'changer', 'leader', 'shopkeeper', 'negotiator'], SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], DAYS = 2 * 354;
function runOne(E, charId, seed, mode) {
  const A = E.A, S = E.newGame(seed); E.IDENTITY.goals = E.IDENTITY.perks = false; E.TASKS.on = E.TASKS.c.on = mode === 'on'; A.chooseStart(S, 'sa'); A.learnSetChar(S, charId); S.noLock = 1; S.noEvents = true; S.player.famDebt = null;
  const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; const home = E.START_CITY || S.startCity;
  const st = { offered: {}, picked: {}, done: {}, lapse: {}, pickNo: {}, days: {}, wk: {}, kinds: {} }, inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; }, seen = {}, prev = {};
  for (let d = 0; d < DAYS; d++) {
    const car = S.player.caravans[0];
    if (d % 6 === 3 && !car.left) { const c = S.cities[car.city], g = E.GIDS.find(x => E.sells(c, x) && !E.GD[x].sp && c.stock[x] > 30); if (g) { const r = A.haggleStart(S, g, 'buy', 20); if (r.ok) { let G = r.game; while (!G.done) { const best = G.best[G.moods[G.round]]; A.haggleChoose(S, (S.day + G.round) % 3 ? best : ['firm', 'ref', 'praise'].find(x => x !== best)); } } } }
    if (d % 30 === 10 && !car.left) for (const t of Object.keys(E.PACTS)) { if (A.signPact(S, car.city, t).ok) break; }
    E.botMain(S); if (d % 5 === 0) E.botBuild(S);
    E.tick(S, false); S.pause = false;
    if (mode === 'on') {
      const v = E.tasksView(S), T = S.player.tk2;
      for (const tier of ['short', 'week']) { const sl = T.slots[tier], p = prev[tier];
        if (p && !sl.pick) { const fin = sl.fin && sl.fin.id === p.id && sl.fin.d === S.day; if (fin) { inc(st.done, p.id); inc(st.days, p.id, S.day - p.since); const r = E.TK_T[p.id].reward, w = Math.floor(S.day / 7); st.wk[w] = st.wk[w] || { infl: 0, xp: 0 }; st.wk[w].infl += r.infl || 0; st.wk[w].xp += r.xp || 0; } else inc(st.lapse, p.id); }
        prev[tier] = sl.pick ? { id: sl.pick.id, since: sl.st.since } : null;
        if (sl.offer.length) { const key = tier + ':' + sl.until + ':' + sl.offer.map(o => o.id).join(); if (!seen[key]) { seen[key] = 1; for (const o of sl.offer) inc(st.offered, o.id); } }
        if (!sl.pick && sl.offer.length) { const i = S.day % sl.offer.length, id = sl.offer[i].id, r = A.tasksPick(S, tier, i); if (r.ok) { inc(st.picked, id); prev[tier] = { id, since: S.day }; } else inc(st.pickNo, id); } }
    }
  }
  return { char: charId, seed, mode, nw: Math.round(E.netWorth(S)), st };
}
module.exports = { runOne };
if (!isMainThread) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.char, workerData.seed, workerData.mode)); return; }
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'), OUTJ = path.join(ROOT, 'specs/038-tasks/tune-d.json'), OUTM = path.join(ROOT, 'specs/038-tasks/tune-d.md');
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), f2 = x => (Math.round(x * 100) / 100).toFixed(2);
function analyze(rows) {
  const E = require('../src/engine.js'), on = rows.filter(r => r.mode === 'on'), off = rows.filter(r => r.mode === 'off'), sum = k => { const o = {}; for (const r of on) for (const id in r.st[k]) o[id] = (o[id] || 0) + r.st[k][id]; return o; };
  const offered = sum('offered'), picked = sum('picked'), done = sum('done'), lapse = sum('lapse'), pickNo = sum('pickNo'), days = sum('days'), kindOf = id => E.TK_T[id].kind, tp = Object.values(picked).reduce((a, b) => a + b, 0);
  const share = {}; for (const id in picked) share[kindOf(id)] = (share[kindOf(id)] || 0) + picked[id] / tp;
  const raw = []; for (const r of on) for (const w in r.st.wk) raw.push(r.st.wk[w]); const pct = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(q * (s.length - 1))] : 0; };
  const weeks = on.length * Math.floor(DAYS / 7), W = Math.abs(avg(on.map(r => r.nw)) / avg(off.map(r => r.nw)) - 1);
  return { tpl: Object.keys(E.TK_T).map(id => ({ id, kind: kindOf(id), c: !!E.TK_T[id].c, offered: offered[id] || 0, picked: picked[id] || 0, done: done[id] || 0, lapse: lapse[id] || 0, pickNo: pickNo[id] || 0, rate: picked[id] >= 1 ? (done[id] || 0) / picked[id] : null, avgDays: done[id] ? days[id] / done[id] : null })),
    share, W, nwOn: avg(on.map(r => r.nw)), nwOff: avg(off.map(r => r.nw)), capHit: raw.filter(w => w.infl > E.TASKS.cap.infl).length / weeks, P75infl: pct(raw.map(w => w.infl), 0.75), P75xp: pct(raw.map(w => w.xp), 0.75), cap: E.TASKS.cap, mixMax: E.TASKS.mixMax, runs: rows.length };
}
function report(rows, key) {
  const a = analyze(rows); fs.writeFileSync(OUTJ, JSON.stringify({ key, rows, summary: a }));
  const md = ['# 038د: ضبط المهام بالقياس (مولَّد بـ tools/tasks-tune.js)', '', `التشغيلات: ${a.runs} (5 شخصيات × 8 بذور × حالتان × ${DAYS} يوماً). السقف الحالي ${JSON.stringify(a.cap)}، mixMax ${a.mixMax}.`, '',
    `- W = |ثروة on / ثروة off − 1| = **${f2(a.W)}** (on ${Math.round(a.nwOn)} / off ${Math.round(a.nwOff)})`, `- capHit = ${f2(a.capHit)}؛ P75 نفوذ = ${a.P75infl}؛ P75 خبرة = ${a.P75xp}`, '', '## حصص الأنواع (share)', '', '| النوع | الحصة |', '|---|---|', ...Object.entries(a.share).map(([k, v]) => `| ${k} | ${f2(v)} |`), '',
    '## القوالب', '', '| القالب | النوع | 038ج | عُرض | قُبل | أُنجز | انقضى | pickNo | rate | متوسط الأيام |', '|---|---|---|---|---|---|---|---|---|---|', ...a.tpl.map(t => `| ${t.id} | ${t.kind} | ${t.c ? '✓' : ''} | ${t.offered} | ${t.picked} | ${t.done} | ${t.lapse} | ${t.pickNo} | ${t.rate == null ? '-' : f2(t.rate)} | ${t.avgDays == null ? '-' : f2(t.avgDays)} |`), ''];
  fs.writeFileSync(OUTM, md.join('\n')); console.log(md.join('\n'));
}
async function main() {
  const key = sha(path.join(ROOT, 'src/engine.js')) + ':' + sha(__filename), prev = fs.existsSync(OUTJ) ? JSON.parse(fs.readFileSync(OUTJ, 'utf8')) : null;
  if (prev && prev.key === key && !process.argv.includes('--force')) { console.log('المحرك والأداة لم يتغيرا: استُعمل القياس المحفوظ.'); return report(prev.rows, key); }
  const jobs = ['on', 'off'].flatMap(mode => CHARS.flatMap(c => SEEDS.map(s => ({ char: c, seed: s, mode })))), rows = []; let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const j = jobs[next++]; rows.push(await new Promise((res, rej) => { const w = new Worker(__filename, { workerData: j }); w.once('message', res); w.once('error', rej); })); } }));
  report(rows, key);
}
main();
