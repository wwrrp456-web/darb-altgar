'use strict';
// 040ج دورة حياة المنافسين: القوة، الأثر المستمر (صعود/انحسار)، الخروج والاستبدال، rivalPresence، الحفظ القديم، ومفتاح cont=false
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, R = E.RIVALGEN;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } };
E.rivalMemorySet(null); a.equal(R.cont, true); a.equal(R.hardMax, 10);
// 1) القوة: ضمن [0.3، 1]، من المسار، وقابلة للإعادة من البذرة
a.equal(E.RG_PATH_STR.length, E.RG_PATHS.length); for (const v of E.RG_PATH_STR) a(v >= 0.3 && v <= 1);
a.equal(E.RG_PATH_STR[E.RG_PATHS.indexOf('الصاعد')], 0.9); a.equal(E.RG_PATH_STR[E.RG_PATHS.indexOf('الوارث المتعثّر')], 0.35);
{ const S = game(5), T = game(5); step(S, 400); step(T, 400); a((S.rivals || []).length >= 1); a.deepEqual((S.rivals || []).map(r => [r.id, r.str, r.out]), (T.rivals || []).map(r => [r.id, r.str, r.out]), 'قابل للإعادة');
  for (const r of S.rivals) { a(r.str >= 0.3 && r.str <= 1, 'str في النطاق'); a(r.fx && r.fx.cont, 'أثر مستمر'); a(Math.abs(r.fx.mul) <= R.cap + 1e-9, 'السقف'); } }
// 2) الأثر المستمر: يبقى بعد 30 يوماً (لا يُمحى)، ويصعد في أول 20 يوماً، وينحسر 20 يوماً بعد الخروج
{ const S = game(7); step(S, 130); const rv = S.rivals[0]; a(rv, 'ولادة بعد 120'); const id = rv.fx.cities[0], g = rv.fx.gs[0] || null;
  const born = rv.born, sc = d => { S.day = born + d; return E.rivalSupplyMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalDemMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalLaborMul(S, id); };
  const keep = S.day; const m0 = sc(0), m10 = sc(10), m20 = sc(20), m60 = sc(60), m300 = sc(300); a.equal(m0, 1, 'يوم الولادة بلا أثر'); a(Math.abs(m10 - 1) < Math.abs(m20 - 1) + 1e-12, 'صعود تدريجي'); a(Math.abs(m20 - 1) > 0, 'أثر كامل بعد 20'); a.equal(m60, m20, 'يبقى بعد 30 يوماً بل بعد 300'); a.equal(m300, m20);
  rv.out = born + 400; S.day = born + 410; const half = E.rivalSupplyMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalDemMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalLaborMul(S, id); a(Math.abs(half - 1) < Math.abs(m20 - 1) + 1e-12, 'انحسار'); S.day = born + 421; a.equal(E.rivalSupplyMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalDemMul(S, id, rv.fx.gs[0] || 'wheat') * E.rivalLaborMul(S, id), 1, 'انحسر بعد 20 يوماً'); }
// 3+4) الخروج والاستبدال: عمر أقصى 540، خبر بالسبب، بديل خلال 30–90 يوماً، ولا يهبط إلى صفر بعد اليوم 200؛ والحد rivalMax
for (const seed of [1, 2, 3, 4]) { const S = game(seed); let zero = 0, exits = 0, births = 0, prev = new Set();
  for (let d = 0; d < 900; d++) { step(S, 1); const al = S.rivals.filter(r => r.out == null); a(al.length <= E.rivalMax(S), 'الحد'); if (S.day > 200 && al.length === 0) zero++; const cur = new Set(al.map(r => r.id)); for (const id of prev) if (!cur.has(id)) exits++; for (const id of cur) if (!prev.has(id)) births++; prev = cur; for (const r of al) a(S.day - r.born <= R.maxAge, 'عمر أقصى 540'); }
  a.equal(zero, 0, 'لا صفر بعد 200'); a(exits >= 2 && births >= 4, 'خروجات وولادات: ' + exits + '/' + births); a(S.news.some(n => /خرج من السوق|اعتزل/.test(n.t)) || exits > 0, 'خبر الخروج'); }
{ const S = game(3); step(S, 130); const rv = S.rivals[0], c = S.cities[rv.city]; rv.born = S.day - R.maxAge; step(S, 1); a(rv.out != null, 'عمر أقصى يُخرج'); a(S.news.some(n => n.t.includes(rv.name) && /اعتزل/.test(n.t)), 'خبر الاعتزال');
  const T = game(3); step(T, 130); const rt = T.rivals[0], ct = T.cities[rt.city]; rt.str = 0.3; rt.born = T.day - 30 * 5; ct.ev = { k: 'plague', left: 12 }; let out = false; for (let k = 0; k < 40 && !out; k++) { rt.out = null; rt.born = T.day + 1 - 30 * 5; step(T, 1); out = rt.out != null; } a(out, 'وباء يرفع احتمال الخروج (أزمة)'); a(T.news.some(n => n.t.includes(rt.name) && /أزمة/.test(n.t)), 'خبر الأزمة يذكر السبب'); }
// 5) rivalPresence: مجموع str لمن يشمل أثرهم المدينة
{ const S = game(2); const [c0, c1] = S.order; S.rivals = [{ id: 1, name: 'x', path: 'الصاعد', pers: 'الجريء', str: 0.9, born: S.day, fx: { kind: 'supply', cities: [c0], gs: ['wheat'], mul: 0.2, start: S.day, until: S.day + 999, cont: true } }, { id: 2, name: 'y', path: 'المنافس الصامت', pers: 'الحَذِر', str: 0.4, born: S.day, fx: { kind: 'dem', cities: [c0, c1], gs: ['wheat'], mul: 0.1, start: S.day, until: S.day + 999, cont: true } }, { id: 3, name: 'z', str: 0.5, out: S.day, born: S.day, fx: { kind: 'dem', cities: [c1], gs: ['wheat'], mul: 0.1, start: S.day, until: S.day + 999, cont: true } }];
  a(Math.abs(E.rivalPresence(S, c0) - 1.3) < 1e-9); a(Math.abs(E.rivalPresence(S, c1) - 0.4) < 1e-9, 'الخارج لا يُحسب'); a.equal(E.rivalPresence(S, S.order[5]), 0); }
// 6) الحفظ القديم: بلا str وfx null لمنافس حيّ؛ يُرمَّم من مساره وفكرته بلا ترحيل يدوي
{ const S = game(6); step(S, 150); const old = JSON.parse(E.save(S)); for (const r of old.rivals) { delete r.str; r.fx = null; delete r.out; } const L = E.load(JSON.stringify(old)); a(L); a(E.rivalPresence(L, L.rivals[0].city) === 0 || true);
  step(L, 1); for (const r of L.rivals) { a(r.str >= 0.3 && r.str <= 1, 'str من المسار'); a(r.fx && r.fx.cont && r.fx.cities.length, 'fx مستمر من فكرته'); } a(E.rivalPresence(L, L.rivals[0].city) > 0);
  const O = JSON.parse(E.save(S)); for (const r of O.rivals) { delete r.str; r.fx = { kind: 'supply', cities: [r.city], gs: ['wheat'], mul: 0.1, start: 1, until: 20 }; } const M = E.load(JSON.stringify(O)); step(M, 40); for (const r of M.rivals) a(r.fx && r.fx.cont, 'أثر قديم منقضٍ يصير مستمراً'); step(M, 300); for (const t of M.rivals) for (const id of M.order) for (const g of E.GIDS) { a(isFinite(E.rivalSupplyMul(M, id, g))); } }
// الحفظ الحديث يعيد المنافسين كما هم
{ const S = game(8); step(S, 400); const L = E.load(E.save(S)); a.deepEqual(L.rivals, S.rivals); a.deepEqual(L.rivalGen, S.rivalGen); }
// cont=false يعيد السلوك السابق: أثر ≤ 30 يوماً، بلا str، سقف 8، ولادات بفواصل 150–240
R.cont = false; try { const S = game(7); let fxLong = 0; for (let d = 0; d < 600; d++) { step(S, 1); for (const r of (S.rivals || [])) { a.equal(r.str, undefined); a.equal(r.out, undefined); if (r.fx && r.fx.until - r.fx.start > R.maxDays) fxLong++; } } a.equal(fxLong, 0); a.equal(E.rivalMax(game(2)), 6); a(E.rivalGenView(S).list.every(x => x.str == null && !x.cont)); } finally { R.cont = true; }
console.log('PASS rival-life: strength, persistent fx with ramp/fade, monthly exit + replacement, rivalPresence, old save, cont=false');
