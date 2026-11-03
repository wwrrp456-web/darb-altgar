// 016: ازدهار المدن: أبعاد ستة بقيم أولية من بيانات قائمة، مساهمة بسقف +40، ذبول الإهمال ببطء، مساهمة المشاريع دائمة، آثار معتدلة، مفتاح رجوع، حفظ قديم
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
const { PROSPER, PR, PR_FX, PR_KEYS } = E;
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; return S; };
const tick = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const month = (S, id, n = 1, perm) => { for (let i = 0; i < n; i++) { S.day += 30; E.prosMonth(S, id, perm); } };
// ١) الأرقام كما في WORLD.md حرفياً
assert.deepEqual(PR_KEYS, ['trade', 'urban', 'sci', 'lit', 'health', 'sec']);
assert.deepEqual([PR.cap, PR.ease, PR.maxDrop, PR.decay, PR.idleDays, PR.idleDrop, PR.shopC, PR.shopMax, PR.factC, PR.staffPer, PR.pactC, PR.infl, PR.inflCap], [40, 0.08, 1.2, 0.04, 90, 3, 1.5, 3, 2, 10, 1, 0.3, 25]);
assert.deepEqual([PR_FX.trade, PR_FX.urban, PR_FX.sci, PR_FX.lit, PR_FX.health, PR_FX.sec, PR_FX.popUrban, PR_FX.popHealth, PR_FX.qual, PR_FX.giftLit, PR_FX.shopCost], [0.06, 0.10, 0.10, 0.08, 0.3, 0.2, 0.10, 0.03, 2, 0.10, 0.10]); ok('الثوابت مطابقة لـ WORLD.md القسم 1 حرفياً');
// ٢) القيم الأولية من بيانات قائمة، والحقل لا يُنشأ قبل أول شهر، ولا يُنشأ مطفأً
{ const S = mk(); tick(S, 29); assert.ok(S.order.every(id => !S.cities[id].pros), 'لا حقل قبل أول تحديث شهري'); tick(S, 2); const id = 'riyadh', c = S.cities[id], p = c.pros; assert.ok(p, 'حقل بعد الشهر الأول');
  assert.ok(Math.abs(p.b.trade - (30 + 15 * (c.size - 0.8))) < 1e-9 && Math.abs(p.b.urban - (35 + 10 * c.size)) < 1e-9 && Math.abs(p.b.sci - (20 + 5 * c.size)) < 1e-9 && p.b.lit === 20); assert.ok(p.b.health >= 30 && p.b.health <= 60 && p.b.sec > 80 && p.b.sec <= 100);
  for (const k of PR_KEYS) assert.ok(p[k] >= p.b[k] - 1e-9 && p[k] <= p.b[k] + 40 + 1e-9, k); ok('القيم الأولية من حجم المدينة وشبعها وخطر الطرق، ولا حقل قبل الشهر الأول');
  const S2 = mk(); PROSPER.on = false; try { tick(S2, 95); assert.ok(S2.order.every(i => !S2.cities[i].pros), 'مطفأ: لا حقل'); assert.equal(E.prosMul(S2, 'shop', { city: 'riyadh', g: 'dates' }), 1); assert.equal(E.prosperityView(S2, 'riyadh'), null); } finally { PROSPER.on = true; } ok('المفتاح مطفأ: لا حقل ولا أثر ولا عرض'); }
// ٣) المساهمة ترفع البُعد بقدرها وسقفها
{ const S = mk(); S.phase = 3; S.player.gold = 1e6; for (let i = 0; i < 4; i++) A.buildShop(S, 'riyadh'); const sh = S.player.props.riyadh.shops.length; assert.ok(sh >= 3, 'دكاكين'); E.prosEnsure(S, 'riyadh'); const p = S.cities.riyadh.pros, b = p.b.trade;
  month(S, 'riyadh', 1); assert.ok(Math.abs(p.care.trade - 4.5) < 1e-9, 'ثلاثة دكاكين كحد أقصى +4.5 شهرياً'); assert.ok(Math.abs(p.trade - (b + 0.08 * 4.5)) < 1e-9, 'حركة 8٪ من الفجوة');
  for (let i = 0; i < 200; i++) { p.last = S.day + 30; month(S, 'riyadh', 1); } assert.ok(p.trade <= b + 40 + 1e-9 && p.trade > b + 39, 'يقترب من السقف +40 ولا يتجاوزه'); assert.equal(p.urban, p.b.urban, 'لا مساهمة عمران بلا مصانع'); ok('المساهمة: +1.5 لكل دكان بحد 3، وحركة 8٪ شهرياً، وسقف +40'); }
// ٤) الإهمال يُضعف ببطء: 90 يوماً بلا زيارة ثم ذبول، وأسرع هبوط 1.2 شهرياً، ولا دون الأولي
{ const S = mk(); E.prosEnsure(S, 'jeddah'); const p = S.cities.jeddah.pros; for (const k of PR_KEYS) { p.care[k] = 100; p[k] = p.b[k] + 30; } p.last = S.day;
  month(S, 'jeddah', 1); const v1 = p.trade; assert.ok(v1 >= p.b.trade + 30 - 1e-9, 'مع نشاط قريب لا هبوط والهدف أعلى');
  p.last = S.day - 100; const c0 = p.care.trade; const t0 = p.trade; month(S, 'jeddah', 1); assert.ok(Math.abs(p.care.trade - (c0 * 0.96 - 3)) < 1e-9, 'ذبول 4٪ و3 نقاط بعد 90 يوماً'); assert.ok(t0 - p.trade <= 1.2 + 1e-9, 'لا هبوط فوق 1.2 شهرياً');
  for (const k of PR_KEYS) { p.care[k] = 0; p[k] = p.b[k] + 30; } p.last = S.day - 200; let m = 0, prev = p.trade; while (p.trade > p.b.trade + 0.5 && m < 100) { month(S, 'jeddah', 1); assert.ok(prev - p.trade <= 1.2 + 1e-9); prev = p.trade; m++; }
  assert.ok(m >= 25, 'من +30 إلى الأولي يحتاج أكثر من سنتين (' + m + ' شهراً)'); assert.ok(p.trade >= p.b.trade - 1e-9, 'لا دون الأولي'); ok('الإهمال: ذبول 4٪ و3 نقاط بعد 90 يوماً، وهبوط ≤ 1.2 شهرياً (' + m + ' شهراً من +30 إلى الأولي)، ولا دون الأولي'); }
// ٥) مساهمة المشاريع الكبرى دائمة لا تذبل، وتظهر في الازدهار
{ const S = mk(); S.player.gold = 5e6; S.projects = { peak: 1e7, paid: { P04: 3 }, until: {}, pick: { P04: 'jeddah' }, done: ['P04'], tier: 3 }; E.prosEnsure(S, 'jeddah'); const p = S.cities.jeddah.pros; p.last = S.day - 400;
  const perm = E.projectContrib(S).jeddah; assert.deepEqual(perm, { trade: 8, urban: 4 }); month(S, 'jeddah', 120, perm); assert.ok(Math.abs(p.trade - (p.b.trade + 8)) < 0.05, 'تبقى +8 رغم 400 يوم بلا زيارة'); assert.ok(Math.abs(p.urban - (p.b.urban + 4)) < 0.05);
  const v = E.prosperityView(S, 'jeddah'); assert.equal(v.dims.find(d => d.k === 'trade').perm, 8); assert.ok(v.dims.find(d => d.k === 'trade').up > 7.9); assert.equal(v.dims.find(d => d.k === 'sci').up, 0); assert.equal(v.projects.trade, 8);
  const S2 = mk(); S2.player.gold = 5e6; S2.projects = { peak: 1e7, paid: {}, until: {}, pick: {}, done: [], tier: 3 }; E.A.learnSetChar; S2.projects.paid.P04 = 2; S2.projects.pick.P04 = 'jeddah'; S2.projects.until.P04 = S2.day; S2.projects.paid.P04 = 3; tick(S2, 1); assert.ok(S2.projects.done.includes('P04')); assert.ok(S2.news.some(n => /اكتمل مشروعك/.test(n.t) && /يرتفع به ازدهار المدينة/.test(n.t) && /التجارة \+8/.test(n.t)), 'خبر الإتمام يذكر الازدهار');
  ok('مساهمة المشاريع دائمة (P04: التجارة +8 والعمران +4) وظاهرة في العرض وخبر الإتمام'); }
// ٦) الآثار بأرقام WORLD.md عند +40 وخطياً دونها
{ const S = mk(); const set = (id, k, up) => { E.prosEnsure(S, id); const p = S.cities[id].pros; p[k] = p.b[k] + up; };
  set('riyadh', 'trade', 40); assert.ok(Math.abs(E.prosMul(S, 'shop', { city: 'riyadh', g: 'wheat' }) - 1.06) < 1e-9); set('riyadh', 'trade', 20); assert.ok(Math.abs(E.prosMul(S, 'shop', { city: 'riyadh', g: 'wheat' }) - 1.03) < 1e-9, 'خطي');
  set('riyadh', 'lit', 40); const lux = E.GIDS.find(g => E.GD[g].lux), non = E.GIDS.find(g => !E.GD[g].lux); assert.ok(Math.abs(E.prosMul(S, 'shop', { city: 'riyadh', g: lux }) - 1.03 * 1.08) < 1e-9); assert.ok(Math.abs(E.prosMul(S, 'shop', { city: 'riyadh', g: non }) - 1.03) < 1e-9); assert.ok(Math.abs(E.prosMul(S, 'trustgrow', { city: 'riyadh' }) - 1.1) < 1e-9);
  set('riyadh', 'sci', 40); assert.ok(Math.abs(E.prosMul(S, 'xp', { city: 'riyadh' }) - 1.1) < 1e-9); assert.ok(Math.abs(E.projectAdd(S, 'qual', { city: 'riyadh' }) - 2) < 1e-9);
  set('riyadh', 'health', 40); assert.ok(Math.abs(E.prosMul(S, 'ev', { city: 'riyadh' }) - 0.7) < 1e-9); set('riyadh', 'sec', 40); set('jeddah', 'sec', 40); assert.ok(Math.abs(E.prosMul(S, 'risk', { from: 'riyadh', to: 'xian' }) - 0.8) < 1e-9); assert.ok(Math.abs(E.prosMul(S, 'risk', { from: 'riyadh', to: 'jeddah' }) - 0.64) < 1e-9);
  set('riyadh', 'urban', 40); assert.ok(Math.abs(E.prosMul(S, 'shopcost', { city: 'riyadh' }) - 1.1) < 1e-9); assert.equal(E.projectMul(S, 'xp', { city: 'riyadh' }), E.prosMul(S, 'xp', { city: 'riyadh' }), 'projectMul يضم الازدهار');
  const c = S.cities.riyadh, before = E.popTotal(c); for (let i = 0; i < 80; i++) { S.day += 30; const q = c.pros; q.last = S.day; q.care.urban = 100; q.care.health = 0; E.prosMonth(S, 'riyadh', {}); } const pm = c.pros.popMul; assert.ok(pm > 1.09 && pm <= 1.13 + 1e-6, 'سكان مستهدفون +10٪ من العمران (و+3٪ من الصحة كحد أقصى)'); assert.ok(E.popTotal(c) / before > 1.05, 'pop يتبع الهدف');
  ok('آثار الأبعاد الستة بأرقام WORLD.md (خطية وبسقفها)، والسكان يتبعون العمران'); }
// ٧) نفوذ التاجر بسقف +25 مجمعاً
{ const S = mk(); S.phase = 3; tick(S, 2); const id = 'jeddah', bs = S.bosses[id]; assert.ok(bs && bs.ruler !== 'player'); E.prosEnsure(S, id); const p = S.cities[id].pros; for (const k of PR_KEYS) p.care[k] = 100; const p0 = bs.p; month(S, id, 1); assert.ok(bs.p > p0 && bs.p - p0 <= PR.infl * 240 / 100 + 1e-9);
  for (let i = 0; i < 400; i++) { p.last = S.day + 30; for (const k of PR_KEYS) p.care[k] = 100; month(S, id, 1); } assert.ok(p.pInf <= 25 + 1e-9 && p.pInf > 24, 'سقف +25'); assert.ok(Math.abs(bs.p - p0 - p.pInf) < 1e-6 || bs.p >= 100); ok('نفوذ التاجر يزيد بمساهماته بسقف +25'); }
// ٨) الحفظ والمفتاح
{ const S = mk(); tick(S, 61); const L2 = E.load(E.save(S)); assert.deepEqual(L2.cities.riyadh.pros, S.cities.riyadh.pros); tick(L2, 40); assert.ok(L2.cities.riyadh.pros.m > S.cities.riyadh.pros.m - 1);
  const old = mk(); const O = E.load(E.save(old)); assert.ok(O.order.every(i => !O.cities[i].pros)); tick(O, 31); assert.ok(O.cities.riyadh.pros, 'الحفظ القديم يبدأ الازدهار عند أول شهر'); ok('الحفظ: يعود الحقل كما هو، والحفظ القديم بلا حقل يعمل');
  const a = mk(9), b = mk(9); PROSPER.on = false; try { tick(a, 120); } finally { PROSPER.on = true; } tick(b, 120); assert.equal(Math.round(a.player.gold), Math.round(b.player.gold) , 'بلا نشاط للاعب لا فرق في الذهب'); const sw = E.load(E.save(b)); PROSPER.on = false; try { tick(sw, 5); } finally { PROSPER.on = true; } tick(sw, 5); ok('التبديل بين المفتاحين لا يفسد الحفظ'); }
console.log('\nprosperity: كلها ناجحة');
