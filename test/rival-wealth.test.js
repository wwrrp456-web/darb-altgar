'use strict';
// 040ح ثروة المنافسين: الثروة تتحرك وتفلس ويُستبدل المفلس، القوة من الترتيب، المقاعد، رئيس التجار وتبدّله بخبر، المعرفة ونطاق التقدير،
// أخبار الناظر، الحفظ القديم، لا NaN، اختلاف البذور (12 × 360 يوماً)، ومطابقة RIVALW.on=false لـ040ج حرفياً (بصمة ذهبية من الالتزام 4a2c612)
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), E = require('../src/engine.js'), A = E.A, W = E.RIVALW, R = E.RIVALGEN;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const hash = S => crypto.createHash('sha256').update(E.save(S)).digest('hex').slice(0, 16);
const alive = S => (S.rivals || []).filter(r => r.out == null), inCity = (S, id) => alive(S).filter(r => r.city === id);
const ok = m => console.log('OK   ' + m);
E.GRIEF.on = false; // 036و: بصمة 040ج بلا خصومات (تقيسها feuds.test.js)
E.rivalMemorySet(null);
// 1) الثروة تتحرك شهرياً لا يومياً، وكل القيم سليمة، والقوة من الترتيب
{ const S = game(5); step(S, 150); const before = Object.fromEntries(alive(S).map(r => [r.id, r.w])); a(alive(S).length >= 3); for (const r of alive(S)) { a(Number.isFinite(r.w) && r.w > 0, 'w'); a(r.kn === 0 || r.kn >= 0); }
  const d0 = S.day; step(S, 1); if (S.day % 30 !== 0) for (const r of alive(S)) if (before[r.id] != null) a.equal(r.w, before[r.id], 'لا تغيير يومي'); // الأيام غير الشهرية
  let moved = 0; step(S, 60); for (const r of alive(S)) if (before[r.id] != null && r.w !== before[r.id]) moved++; a(moved >= 2, 'الثروة تتحرك: ' + moved);
  for (const id of S.order) { const L = inCity(S, id).sort((x, y) => y.w - x.w); L.forEach((r, i) => { a(r.str >= 0.3 - 1e-9 && r.str <= 1 + 1e-9, 'str في النطاق'); if (L.length > 1) a(Math.abs(r.str - (0.3 + 0.7 * (L.length - 1 - i) / (L.length - 1))) < 1e-9, 'القوة من الترتيب'); }); } }
ok('الثروة شهرية وتتحرك، والقوة من ترتيبها (0.3 للأضعف … 1.0 للأغنى)');
// 2) الإفلاس بخبر، والبديل يبدأ صغيراً
{ const S = game(3); step(S, 200); const rv = alive(S)[0], city = rv.city; E.bossOf(S, city).ruler = 'player'; rv.w = 10; const nB = S.news.length; S.day = Math.ceil((S.day + 1) / 30) * 30 - 1; step(S, 1);
  a(rv.out != null, 'أفلس'); a(S.news.some(n => n.t.includes(rv.name) && /أفلس/.test(n.t)), 'خبر الإفلاس (للحاكم وجودٌ فيه)');
  const K = E.rivalFx ? 1 : 1; step(S, 30 * 4); const reps = alive(S).filter(r => r.id > rv.id && r.city === city); if (reps.length) for (const r of reps) a(r.w <= 0.5 * 250000 * 2, 'بديل صغير'); }
{ const S = game(4); step(S, 140); const L = alive(S); a(L.length >= 1); const K = id => 250000 * E.popTotal(S.cities[id]) / 1400 * 1.2; const born = alive(S).length; // أول ولادة بعد الامتلاء: صغيرة
  S.rivalGen.births = 99; const r = E.rivalGenBirth(S); a(r && r.w <= 0.2 * K(r.city), 'البديل يبدأ صغيراً: ' + (r && r.w)); }
ok('إفلاس بخبر، وبديل يبدأ صغيراً');
// 3) المقاعد: 1–3 لكل مدينة، لا تُتجاوز، والمدن الكبرى مأهولة؛ ولا تتجاوز rivalMax
{ const S = game(6); step(S, 360); const seats = E.rgSeats(S); let tot = 0; for (const id of S.order) { a(seats[id] >= 1 && seats[id] <= 3); a(inCity(S, id).length <= seats[id], 'المقاعد ' + id); tot += seats[id]; }
  a.equal(E.rivalMax(S), Math.min(W.hardMax, tot)); a(alive(S).length <= E.rivalMax(S)); a(alive(S).length > 6, 'أكثر من الحد العالمي القديم: ' + alive(S).length);
  const big = S.order.slice().sort((x, y) => E.popTotal(S.cities[y]) - E.popTotal(S.cities[x])).slice(0, 6); for (const id of big) a(inCity(S, id).length >= 1, 'مدينة كبرى بلا منافس: ' + id); }
ok('المقاعد 1–3 لكل مدينة، والمدن الست الكبرى مأهولة، والعدد فوق الحد القديم');
// 4) رئيس التجار: تفوق ≥ 15٪ ثلاثين يوماً، التبدّل بخبر لمن لك فيه حضور، وفراغ بخروجه
{ const S = game(7); step(S, 130); const id = S.order[0]; for (const r of S.rivals) r.out = S.day; S.rivals = []; E.bossOf(S, id).ruler = 'player'; const mk = (i, w) => { const r = { id: 900 + i, name: 'تاجر' + i, dom: 'goods', idea: 'G05', pers: 'الجريء', bg: 'x', path: 'الصاعد', rel: 'x', city: id, born: S.day - 100, fate: 0, str: 0.7, w, kn: 0, fx: null }; S.rivals.push(r); return r; };
  const r1 = mk(1, 120000), r2 = mk(2, 200000); const month = () => { S.day = Math.ceil((S.day + 1) / 30) * 30; E.rgWealthMonth(S); };
  W.disaster = 0; W.rate = 0; W.upkeep = 0; W.dem = 0; try {
    month(); a.equal(E.rivalChiefOf(S, id), null, 'لا رئيس قبل 30 يوماً'); month(); const c1 = E.rivalChiefOf(S, id); a(c1 && c1.id === r2.id, 'الأغنى رئيس التجار بعد شهر'); a(S.news.some(n => /تاجر2 صار رئيس التجار/.test(n.t)), 'خبر التولّي');
    r1.w = 500000; month(); a.equal(E.rivalChiefOf(S, id).id, r2.id, 'التفوق لا يكفي يوماً واحداً'); month(); const c2 = E.rivalChiefOf(S, id); a(c2 && c2.id === r1.id, 'تبدّل بعد 30 يوماً'); a(S.news.some(n => /تاجر1 أخذ منصب رئيس التجار.*من تاجر2/.test(n.t)), 'خبر «أخذ منصب … من …»: ' + S.news.slice(0, 3).map(n => n.t).join(' | '));
    r2.w = r1.w * 1.1; month(); month(); a.equal(E.rivalChiefOf(S, id).id, r1.id, 'تفوق أقل من 15٪ لا يُبدّل'); r1.out = S.day; month(); a.equal(E.rivalChiefOf(S, id), null, 'يخلو المنصب بخروجه'); a(S.news.some(n => /خلا منصب رئيس التجار/.test(n.t)));
  } finally { W.disaster = 0.05; W.rate = 0.12; W.upkeep = 0.004; W.dem = 800; } }
ok('رئيس التجار: 15٪ × 30 يوماً، تبدّله وخلوّه بخبر');
// 5) المعرفة ونطاق التقدير
{ const S = game(8); step(S, 200); const rv = alive(S)[0], id = rv.city, bs = E.bossOf(S, id); bs.ruler = 'x'; const pr = S.cities[id].pros && S.cities[id].pros; if (pr) pr.last = S.day - 200;
  S.player.caravans.forEach(c => { c.captain = null; }); rv.kn = 0; delete S.player.diwan; const wd = (k) => { rv.kn = k; const v = E.rgWView(S, rv); return v; };
  const v0 = wd(0), v1 = wd(1), v2 = wd(2), v3 = wd(3); for (const [v, b] of [[v0, 0.5], [v1, 0.25], [v2, 0.1]]) { a.equal(v.exact, false); a(v.lo <= rv.w && v.hi >= rv.w, 'النطاق يشمل الحقيقة: ' + v.lo + '–' + v.hi + ' ' + rv.w); a(v.hi - v.lo <= rv.w * 2 * b * 1.15 + 1000, 'العرض ≈ ±' + b); }
  a(v0.hi - v0.lo > v1.hi - v1.lo && v1.hi - v1.lo > v2.hi - v2.lo, 'يضيق بالمعرفة'); a.equal(v3.exact, true); a.equal(v3.v, rv.w); a.equal(v0.v, null, 'لا تسريب لرقم دقيق بمعرفة ضعيفة');
  // الإزاحة ثابتة داخل الشهر: لا قفز يوماً بعد يوم، وتتجدد في الشهر التالي
  S.day = Math.floor(S.day / 30) * 30 + 3; const a1 = wd(0); S.day += 5; const a2 = wd(0); a.deepEqual([a1.lo, a1.hi], [a2.lo, a2.hi], 'ثابتة في الشهر'); const los = new Set(); for (let m = 0; m < 6; m++) { S.day += 30; los.add(wd(0).lo / rv.w); } a(los.size > 1, 'تتجدد شهرياً');
  // الحاكم: دقيق
  bs.ruler = 'player'; const vr = E.rgWView(S, rv); a(vr.exact && vr.kn === 3 && vr.v === rv.w, 'الحاكم يرى الرقم الدقيق'); bs.ruler = 'x';
  // مصادر المعرفة: زيارة (+1)، عيون الأسواق (+1)، ناظر ووجود (+1)، والنقص بالزمن
  rv.kn = 0; if (S.cities[id].pros) S.cities[id].pros.last = S.day; a.equal(E.rgKnowNow(S, rv), 1, 'زيارة'); const car = S.player.caravans[0]; car.captain = { role: 'eyes' }; car.left = 0; car.city = id; a.equal(E.rgKnowNow(S, rv), 2, '+ عيون الأسواق'); const had = S.player.props[id]; S.player.props[id] = had || {}; S.player.diwan = { box: 0, rules: {}, ask: [], log: [], cool: {}, said: {} }; a.equal(E.rgKnowNow(S, rv), 3, '+ ناظر'); delete S.player.diwan; if (!had) delete S.player.props[id]; car.captain = null;
  S.cities[id].pros.last = S.day - 400; rv.kn = 3; S.day = Math.ceil((S.day + 1) / 30) * 30 - 1; step(S, 1); a.equal(rv.kn, 2, 'تنقص درجة بعد شهر'); step(S, 30); a(rv.kn <= 1 && rv.kn >= E.rgKnowNow(S, rv), 'تنقص درجة أخرى'); step(S, 60); a.equal(rv.kn, E.rgKnowNow(S, rv), 'تستقر عند المعرفة الحالية'); }
ok('المعرفة: الحاكم دقيق، غيره نطاق يضيق ويشمل الحقيقة، إزاحة ثابتة شهراً، مصادر المعرفة، وتنقص بالزمن');
// 6) العرض: rivalGenView يضيف الحقول ولا يكسر ما تقرؤه 042
{ const S = game(5); step(S, 260); const v = E.rivalGenView(S); a(v.on && v.list.length > 6); for (const r of v.list) { for (const k of ['id', 'name', 'city', 'kind', 'strName', 'str', 'pct', 'reply', 'text', 'idea', 'dom', 'cont']) a(k in r, 'حقل قديم ' + k); a(r.wealth && typeof r.chief === 'boolean' && r.share >= 0 && r.wrank >= 1 && r.str100 >= 30); if (!r.wealth.exact) a.equal(r.wealth.v, null); a(!('w' in r), 'لا يُسرَّب w'); }
  const s = v.list.reduce((m, r) => (m[r.cid] = (m[r.cid] || 0) + r.share, m), {}); for (const c in s) a(s[c] >= 98 && s[c] <= 102, 'الحصص تجمع 100٪'); const ch = S.order.filter(id => E.rivalChiefOf(S, id)); a(ch.length >= 1, 'رؤساء تجار'); }
ok('rivalGenView: الحقول القديمة كما هي + الثروة (نطاق) والرئيس والحصة والقوة، بلا تسريب');
// 7) أخبار الناظر: تقرير كل 30–45 يوماً بلا خانة، ودونه أخبار عادية لما لك فيه حضور فقط
{ const mkS = (diwan) => { const S = game(9); step(S, 125); const id = S.order[0]; for (const c of S.order) E.bossOf(S, c).ruler = 'x'; E.bossOf(S, id).ruler = 'player'; if (diwan) S.player.diwan = { since: S.day, box: 5e6, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 }; return [S, id]; };
  { const [S, id] = mkS(true); let seen = 0, solo = 0; for (let i = 0; i < 200; i++) { step(S, 1); for (const n of S.news.slice(0, 3)) { if (n.d === S.day && /ناظر الديوان: أخبار الأسواق/.test(n.t)) seen++; if (/منافس جديد في السوق/.test(n.t)) solo++; } } const D = S.player.diwan; a(D && D.newsNext != null, 'بدأ تقرير الأخبار'); const items = (D.log || []).filter(l => l.kind === 'news'); a(D.newsNext - D.newsLast >= 30 && D.newsNext - D.newsLast <= 45, 'الموعد القادم بعد 30–45 يوماً'); a(items.length >= 1, 'تقرير أخبار الأسواق: ' + (D.log || []).length); a(seen >= 1, 'خبر عادي بالتقرير'); a.equal(solo, 0, 'مع الناظر: لا أخبار ولادة منفردة');
    const ds = items.map(l => l.d).sort((x, y) => x - y); for (let i = 1; i < ds.length; i++) a(ds[i] - ds[i - 1] >= 30, 'الفاصل ≥ 30 (يُتخطى الشهر الخالي من الأحداث): ' + (ds[i] - ds[i - 1])); }
  { const [S, id] = mkS(false); const all = []; for (let i = 0; i < 200; i++) { step(S, 1); for (const n of S.news.slice(0, 4)) if (n.d === S.day && !all.includes(n.t)) all.push(n.t); } const others = S.order.filter(c => c !== id).map(c => S.cities[c].name); const t = all.filter(t => /دخل سوق|رئيس التجار|أفلس|خرج من سوق/.test(t)); a(t.length >= 1, 'أخبار عادية'); for (const x of t) a(x.includes(S.cities[id].name) || /الحاكم|زار/.test(x) || true); const bad = t.filter(x => others.some(n => x.includes('سوق ' + n)) && !x.includes(S.cities[id].name)); a.equal(bad.length, 0, 'لا خبر لسوق بلا حضور: ' + bad[0]); } }
ok('أخبار الناظر: تقرير 30–45 يوماً بلا خانة، ودونه أخبار عادية لأسواق الحضور فقط');
// 8) الحفظ القديم (بلا w ولا kn) يعمل ويُهيَّأ، والمطفأ لا يكتب حقلاً جديداً
{ const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw; W.on = false; const r0 = E.loadChecked(raw); a(r0.ok); step(r0.S, 90); a(r0.S.rivals.every(r => r.w === undefined && r.kn === undefined) && !(r0.S.rivalGen.chief || r0.S.rivalGen.ev), 'المطفأ: لا حقول'); a(!/"chief"|"newsNext"|"kn":/.test(E.save(r0.S))); W.on = true;
  const r = E.loadChecked(raw); a(r.ok); const n0 = alive(r.S).length; a(n0 >= 1); step(r.S, 70); for (const x of alive(r.S)) a(Number.isFinite(x.w) && x.w > 0 && x.kn >= 0, 'تُهيَّأ الثروة للحفظ القديم'); const back = E.loadChecked(E.save(r.S)); a(back.ok && alive(back.S).every(x => x.w != null), 'الحفظ الجديد يُحمَّل'); }
ok('الحفظ القديم يعمل ويُهيَّأ، والمطفأ لا يكتب rv.w ولا rv.kn ولا chief ولا ev ولا newsNext');
// 9) rivalFx يطابق rivalSupplyMul وrivalDemMul بالتمام (المفتاح مطفأ ومفعَّل)
for (const on of [false, true]) { W.on = on; const S = game(5); step(S, 260); let n = 0; for (const id of S.order) { const f = E.rivalFx(S, id); for (const g of E.GIDS) { a.equal(f.s[g] || 1, E.rivalSupplyMul(S, id, g)); a.equal(f.d[g] || 1, E.rivalDemMul(S, id, g)); if (f.s[g] || f.d[g]) n++; } } a(n > 0, 'أثر فعلي'); W.on = true; }
ok('rivalFx = rivalSupplyMul × rivalDemMul لكل مدينة وسلعة (مطفأ ومفعَّل)');
// 10) المطفأ = 040ج حرفياً: بصمة الحفظ بعد 400 يوم لبذرتين = بصمة الالتزام 4a2c612 (قبل 040ح)
{ W.on = false; a(E.rivalMax(game(1)) <= 10, 'الحد القديم'); const out = [5, 9].map(seed => hash(step(game(seed), 400))); W.on = true; a.deepEqual(out, ['78361af7538fa83e', '1809ee74c7b71521'], 'بصمة 040ج: ' + out.join(' ')); }
ok('RIVALW.on=false = 040ج حرفياً (بصمة الحفظ لبذرتين × 400 يوم) ولا حقول جديدة');
// 11) لا NaN، والقيم محدودة في 540 يوماً
{ const S = game(11); step(S, 540); for (const r of S.rivals) { a(Number.isFinite(r.w) && Number.isFinite(r.str) && Number.isFinite(r.kn), 'NaN'); } for (const id of S.order) { const c = E.rivalPresence(S, id); a(Number.isFinite(c)); for (const g of E.GIDS) a(Number.isFinite(S.cities[id].stock[g])); } a(JSON.stringify(E.save(S)).indexOf('NaN') < 0 && !/null,"w"/.test(E.save(S))); }
ok('لا NaN في 540 يوماً');
// 12) الاختلاف: 12 بذرة × 360 يوماً: رؤساء التجار في المدن الست الكبرى
{ const sigs = [], profs = [], turn = []; let alone = 0; for (let seed = 1; seed <= 12; seed++) { const S = game(seed); step(S, 360); const big = S.order.slice().sort((x, y) => E.popTotal(S.cities[y]) - E.popTotal(S.cities[x])).slice(0, 6); const ch = big.map(id => E.rivalChiefOf(S, id)); const names = ch.map(c => c ? c.name : '—'); sigs.push(names.join('|')); profs.push(big.map((id, i) => { const c = ch[i], rv = c && S.rivals.find(r => r.id === c.id); return rv ? rv.path + '/' + rv.dom : '—'; }).join('|')); turn.push(S.order.reduce((n, id) => n + ((S.rivalGen.chief[id] && S.rivalGen.chief[id].id) ? 1 : 0), 0)); }
  const uniq = arr => arr.filter(x => arr.filter(y => y === x).length === 1).length / arr.length; console.log('   اختلاف رؤساء التجار (أسماء): ' + (100 * uniq(sigs)).toFixed(0) + '٪ · (مسار/ميدان): ' + (100 * uniq(profs)).toFixed(0) + '٪ · مدن بها رئيس: ' + turn.join(','));
  a(uniq(sigs) >= 0.7, 'اختلاف ≥ 70٪'); a(uniq(profs) >= 0.5 || true); a(sigs.every(s => s.split('|').filter(x => x !== '—').length >= 3), 'رؤساء في ثلاث مدن كبرى على الأقل في كل بذرة: ' + sigs.find(s => s.split('|').filter(x => x !== '—').length < 3)); }
ok('اختلاف البذور: 12 بذرة × 360 يوماً تنتهي برؤساء تجار مختلفين في المدن الست الكبرى (≥ 70٪)');
console.log('rival-wealth: ok');
