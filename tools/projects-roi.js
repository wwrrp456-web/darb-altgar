#!/usr/bin/env node
'use strict';
// 046 معايرة المشاريع التشغيلية: 8 بذور × 3 سنوات لكل مشروع تشغيلي في موضع معتاد (أزحم طريق/مدينة/دولة/ميناء) وموضع ضعيف.
// الاستعمال: node tools/projects-roi.js [--seeds 8] [--years 3] [--json]. يطبع وسيط سنة الاسترداد وتكرار الأحداث؛ لا يكتب ملفاً.
const E = require('../src/engine.js'), A = E.A;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
const SEEDS = arg('--seeds', 8), YEARS = arg('--years', 3), OPS = ['P20', 'P01', 'P04', 'P09', 'P05', 'P14'];
const mk = seed => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; return S; };
const pop = (S, c) => E.popTotal(S.cities[c]);
// قياس الموضع: الحركة النموذجية pjTraffic عند اختيار هذا الموضع في بداية اللعبة (سكان + منافسون؛ بلا وصولات بعد)
function score(S, id, v) { const p = S.projects, old = p.pick[id], oldDone = p.done.includes(id); p.pick[id] = v; if (!oldDone) p.done.push(id); const t = E.pjTraffic(S, id); if (!oldDone) p.done.pop(); if (old == null) delete p.pick[id]; else p.pick[id] = old; return t; }
function options(S, id) { return E.projectPickOptions(S, id).map(o => o.v); } // خيارات اللاعب الفعلية (طرق من أماكنه ومجاورة)
// الشبكة (P14): الحركة المتحققة تتبع جغرافيا الوصولات لا السكان وحدهم، فيُقاس الموضع بسنة تسخين تُركَّب فيها الشبكة على كل الدول معاً
const warm = {};
function placeNet(seed, kind) {
  if (!warm[seed]) { const S = mk(seed); S.projects = { peak: E.PJ_TIERS[8], paid: {}, until: {}, pick: {}, done: [], tier: 9 }; const p = S.projects, cs = E.COUNTRIES.map(c => c.id).filter(c => S.order.some(x => S.cities[x].country === c)), keys = [];
    cs.forEach((c, i) => { const k = i ? 'P14#' + (i + 1) : 'P14'; p.paid[k] = 5; p.pick[k] = c; p.done.push(k); keys.push([k, c]); });
    for (let d = 0; d < 354; d++) { S.player.gold = 1e12; E.tick(S, false); S.pause = false; } warm[seed] = keys.map(([k, c]) => ({ c, t: E.pjTraffic(S, k) })).sort((a, b) => a.t - b.t); }
  const w = warm[seed]; return kind === 'weak' ? w[0].c : w[w.length - 1].c;
}
function place(S, id, kind, seed) { if (id === 'P14') return placeNet(seed, kind); const o = options(S, id).map(v => ({ v, s: score(S, id, v) })).sort((a, b) => a.s - b.s); return kind === 'weak' ? o[0].v : o[o.length - 1].v; }
function runOne(seed, kind) {
  const S = mk(seed); S.projects = { peak: E.PJ_TIERS[8], paid: {}, until: {}, pick: {}, done: [], tier: 9 }; const p = S.projects, picks = {};
  for (const id of OPS) { p.paid[id] = E.PROJECTS[id].stages.length; p.pick[id] = picks[id] = place(S, id, kind, seed); p.done.push(id); }
  const net = {}, inc = {}, ev = {}, rep = {}, evN = {}, tS = {}, tN = {}; for (const id of OPS) { evN[id] = 0; tS[id] = 0; tN[id] = 0; } for (const id of OPS) { net[id] = 0; inc[id] = 0; ev[id] = 0; rep[id] = 0; }
  for (let d = 0; d < YEARS * 354; d++) {
    S.player.gold = Math.max(S.player.gold, 1e12); E.tick(S, false); S.pause = false; if (d % 10 === 0) for (const id of OPS) { tS[id] += E.pjTraffic(S, id); tN[id]++; }
    if (S.day % 30 === 15) for (const id of OPS) { const q = E.pjQuote(S, id); if (q && q.can && q.cond < 65) { const g0 = S.player.gold; const r = A.projectRepair(S, id); if (r.ok !== false) rep[id] += g0 - S.player.gold; } }
    for (const id of OPS) { const o = S.projects.ops && S.projects.ops[id]; if (o && o.ev.length && o.ev[0].d === S.day) evN[id]++; }
  }
  for (const id of OPS) { const o = S.projects.ops[id]; inc[id] = o.rec; ev[id] = evN[id]; }
  return { S, picks, inc, rep, ev, T: Object.fromEntries(OPS.map(id => [id, tS[id] / tN[id]])) };
}
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
function run() {
  const out = {}; for (const id of OPS) out[id] = { usual: [], weak: [], evUsual: 0, months: 0, Tu: [], Tw: [] };
  for (let seed = 1; seed <= SEEDS; seed++) for (const kind of ['usual', 'weak']) {
    const r = runOne(seed, kind);
    for (const id of OPS) { const C = E.PROJECTS[id].stages.reduce((a, b) => a + b, 0), netYear = (r.inc[id] - r.rep[id]) / YEARS; out[id][kind].push(netYear > 0 ? C / netYear : Infinity); out[id][kind === 'usual' ? 'Tu' : 'Tw'].push(r.T[id]); if (kind === 'usual') { out[id].evUsual += r.ev[id]; out[id].months += YEARS * 354 / 30; } }
  }
  return out;
}
module.exports = { run, runOne, OPS, YEARS };
if (require.main === module) {
  const out = run(), rows = [];
  for (const id of OPS) { const pb = E.PJ_INV.pb[id], u = med(out[id].usual), w = med(out[id].weak); rows.push({ id, name: E.PROJECTS[id].name, PB: pb, usual: +u.toFixed(2), weak: w === Infinity ? 'خاسر' : +w.toFixed(2), okUsual: u >= pb - 0.5 && u <= pb + 1, weakSlower: w > u, ev: out[id].evUsual, Tu: +med(out[id].Tu).toFixed(2), Tw: +med(out[id].Tw).toFixed(2), evPerYear: +(out[id].evUsual / (SEEDS * YEARS)).toFixed(2) }); }
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows)); else { console.log('المشروع | PB | الاسترداد (معتاد) | (ضعيف) | ضمن [PB−0.5, PB+1] | الضعيف أبطأ | T معتاد | T ضعيف | أحداث/سنة'); for (const r of rows) console.log([r.id + ' ' + r.name, r.PB, r.usual, r.weak, r.okUsual ? 'نعم' : 'لا', r.weakSlower ? 'نعم' : 'لا', r.Tu, r.Tw, r.evPerYear].join(' | ')); }
}
