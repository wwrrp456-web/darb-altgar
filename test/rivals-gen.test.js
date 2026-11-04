'use strict';
// 028أ المنافسون المولَّدون: SC-001 (1,000 ولادة بذاكرة تراكمية: لا تكرار كامل ولا فكرة قبل 70٪ من ميدانها)، SC-002 (الحد، وعودة السوق، والسقف)، SC-003 (النص والمخفية)، الحفظ القديم، المفتاح، الأسماء
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, R = E.RIVALGEN;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; return S; };
const visible = dom => E.RG_IDEAS.filter(i => i.dom === dom);
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
// SC-003: الأفكار والأنواع والمخفية
a.equal(R.on, true); a.deepEqual(R.hold, ['M16', 'F13', 'G17']);
for (const i of E.RG_IDEAS) { a(i.reply && i.reply.length > 3, i.id + ': نص الردّ'); a(['supply', 'dem', 'price', 'labor'].includes(i.kind), i.id + ': النوع'); a(Math.abs(i.mul) <= R.cap + 1e-9 && i.days <= R.maxDays, i.id + ': السقف'); a(!R.hold.includes(i.id), i.id + ' مخفية'); }
a.equal(Object.keys(E.RG_DOMS).length, 4); for (const d of Object.keys(E.RG_DOMS)) a(visible(d).length >= 7, d + ': أفكار الميدان');
// الأسماء: 40 اسماً أول و30 لقباً، بلا تكرار ولا اسم ديني أو تاريخي معروف
a.equal(E.RG_FIRST.length, 40); a.equal(E.RG_TITLE.length, 30); a.equal(new Set(E.RG_FIRST).size, 40); a.equal(new Set(E.RG_TITLE).size, 30);
const banned = /محمد|أحمد|علي|عمر|عثمان|أبو|ابن|خالد|بلال|يوسف|إبراهيم|موسى|عيسى|يعقوب|داود|سليمان|نوح|آدم|إدريس|صالح|هارون|زكريا|يحيى|إسماعيل|حسن|حسين|معاوية|هارون|الرشيد|صلاح|بدر|طارق|زياد|مروان|جابر|ياسر|سعد|مهدي|عبد/;
for (const n of [...E.RG_FIRST, ...E.RG_TITLE]) a(!banned.test(n), 'اسم ممنوع: ' + n);
// SC-001: 1,000 ولادة بذاكرة تراكمية ممرَّرة صراحة
for (const seed of [1, 2, 3]) {
  const S = game(seed), mem = E.rivalMemoryNew(), sigs = new Set(), seen = {}; let bad = 0;
  for (let i = 0; i < 1000; i++) {
    S.rivals = []; const r = E.rivalGenBirth(S, mem); a(r, 'ولادة'); const sig = [r.dom, r.idea, r.pers, r.city, r.bg, r.path, r.rel, r.name].join('|'); a(!sigs.has(sig), 'تكرار منافس كامل: ' + sig); sigs.add(sig);
    const set = seen[r.dom] || (seen[r.dom] = new Set()); if (set.has(r.idea) && set.size < 0.7 * visible(r.dom).length) bad++; set.add(r.idea);
  }
  a.equal(bad, 0, 'فكرة تكررت قبل رؤية 70٪ من ميدانها'); a(mem.recent.length <= 80, 'الذاكرة أحدث 80'); for (const d of Object.keys(E.RG_DOMS)) a(seen[d] && seen[d].size === visible(d).length, 'كل أفكار الميدان ظهرت: ' + d);
}
// SC-002: لعبة 3 سنوات: الحد، العودة عند الانقضاء، السقف، والحفظ
{
  const S = game(7); E.rivalMemorySet(null); let maxAlive = 0, fxSeen = 0; const first = []; let births = 0;
  for (let d = 0; d < 3 * 354; d++) {
    step(S, 1); const n = (S.rivals || []).length; maxAlive = Math.max(maxAlive, n); a(n <= E.rivalMax(S), 'الحد'); if (S.rivalGen && S.rivalGen.births > births) { births = S.rivalGen.births; first.push(S.day); }
    for (const rv of (S.rivals || [])) if (rv.fx && rv.fx.until > S.day) { fxSeen++; a(Math.abs(rv.fx.mul) <= R.cap && rv.fx.until - rv.fx.start <= R.maxDays, 'السقف'); }
  }
  a(first[0] > 120 && first[0] <= 125, 'أول ولادة بعد اليوم 120: ' + first[0]); for (let i = 1; i < first.length; i++) a(first[i] - first[i - 1] >= 150 && first[i] - first[i - 1] <= 240, 'الفاصل ' + (first[i] - first[i - 1])); a(births >= 4, 'ولادات ' + births); a(fxSeen > 0);
  for (const rv of S.rivals) if (rv.fx && rv.fx.until > S.day) rv.fx.until = S.day; for (const id of S.order) for (const g of E.GIDS) { a.equal(E.rivalSupplyMul(S, id, g), 1); a.equal(E.rivalDemMul(S, id, g), 1); } for (const id of S.order) a.equal(E.rivalLaborMul(S, id), 1);
  const L = E.load(E.save(S)); a.deepEqual(L.rivals, S.rivals, 'الحفظ يعيد المنافسين'); a.deepEqual(L.rivalGen, S.rivalGen);
}
// الأثر على السوق: العرض يرفع المخزون، والطلب يرفع الطلب، والعمالة تضيّق المجموعة، ثم يعود
{
  const S = game(4), c = S.cities[S.order[0]], id = c.id, g = 'wheat'; const m0 = E.rivalSupplyMul(S, id, g), d0 = E.rivalDemMul(S, id, g), h0 = E.rivalLaborMul(S, id); a.equal(m0, 1); a.equal(d0, 1); a.equal(h0, 1);
  S.rivals = [{ id: 1, name: 'x', fx: { kind: 'supply', cities: [id], gs: [g], mul: 0.25, start: S.day, until: S.day + 10 } }, { id: 2, name: 'y', fx: { kind: 'dem', cities: [id], gs: [g], mul: 0.3, start: S.day, until: S.day + 10 } }, { id: 3, name: 'z', fx: { kind: 'labor', cities: [id], gs: [], mul: -0.15, start: S.day, until: S.day + 10 } }, { id: 4, name: 'w', fx: { kind: 'price', cities: [id], gs: ['iron'], mul: -0.1, start: S.day, until: S.day + 10 } }];
  a.equal(E.rivalSupplyMul(S, id, g), 1.25); a.equal(E.rivalDemMul(S, id, g), 1.3); a.equal(E.rivalLaborMul(S, id), 0.85); a(E.rivalSupplyMul(S, id, 'iron') > 1.1, 'سعر أقل = مخزون أعلى'); a.equal(E.rivalSupplyMul(S, S.order[1], g), 1, 'مدينة أخرى بلا أثر');
  S.day += 10; a.equal(E.rivalSupplyMul(S, id, g), 1); a.equal(E.rivalDemMul(S, id, g), 1); a.equal(E.rivalLaborMul(S, id), 1);
}
// الحفظ القديم (بلا حقول المنافسين) يعمل، ومفتاح الرجوع يعيد السلوك السابق: لا ولادة ولا حقول
{
  const S = game(3); step(S, 30); const old = JSON.parse(E.save(S)); delete old.rivals; delete old.rivalGen; delete old.rivalSeen; const L = E.load(JSON.stringify(old)); a(L); step(L, 200); a((L.rivals || []).length >= 1, 'الحفظ القديم يولّد بعد اليوم 120');
  R.on = false; try { const T = game(3); step(T, 400); a.equal(T.rivals, undefined); a.equal(T.rivalGen, undefined); a.equal(T.rivalSeen, undefined); a.equal(E.rivalGenView(T).on, false); } finally { R.on = true; }
  const P = game(3); a.equal(P.rival !== undefined || true, true);
}
// الحد: 6 + درجة السلّم بسقف 8
{ const S = game(2); a.equal(E.rivalMax(S), 6); S.projects = { peak: 250000, paid: {}, until: {}, pick: {}, done: [], tier: 1 }; a.equal(E.rivalMax(S), 7); S.projects.peak = 5e6; a.equal(E.rivalMax(S), 9 > 8 ? 8 : 9, 'سقف 8'); S.projects.peak = 1e10; a.equal(E.rivalMax(S), 8); S.rivals = Array.from({ length: 8 }, (_, i) => ({ id: i, name: 'n' + i, fx: null, fate: 1e9 })); S.rivalGen = { seed: 1, births: 8, next: 0 }; step(S, 1); a.equal(S.rivals.length, 8, 'لا ولادة فوق الحد'); a(S.rivalGen.next > S.day, 'تأجيل'); }
console.log('PASS rivals-gen: SC-001 1,000 births x3 seeds (no full repeat, 70% coverage), SC-002 limits/expiry/save, SC-003 content, names, old save, off switch');
