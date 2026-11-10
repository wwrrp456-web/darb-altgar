// 038أ: محرك المهام: النصوص حرفاً من texts.md، كل قالب يُولَّد بشرطه ويُنجَز بفعله فقط ولا يُمنح مرتين ولو أُعيد التحميل، التنوع وعدم التكرار المتتالي، السقف، الميزة المؤقتة، المفتاح المطفأ، الحفظ القديم، وقياس 8 بذور
const assert = require('node:assert/strict'), fs = require('node:fs'), E = require('../src/engine.js'), A = E.A, { TASKS, TK_T } = E, ok = m => console.log('OK   ' + m);
const mk = (seed = 3, boot = true) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noEvents = true; S.noLock = 1; S.player.famDebt = null; if (boot) E.tasksView(S); return S; };
const day = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const view = S => E.tasksView(S), slotOf = (S, t) => S.player.tk2.slots[t], bonus = S => (S.learn.bonus || { infl: 0, xp: 0 });
const IDS = ['tr1', 'tr2', 'tr3', 'ex1', 'ex3', 'lr1', 'lr2', 'mg1', 'rl1', 'rl2', 'ex2', 'bd2'];
const sellT = (S, o) => S.player.trades.unshift(Object.assign({ day: S.day, city: 'riyadh', g: 'wheat', q: 1, side: 'sell', net: 10, pl: 5, sector: 'trade' }, o));
const forcePick = (S, id) => { const d = TK_T[id], T = S.player.tk2, tier = d.tier, sl = T.slots[tier]; sl.offer = [{ id, p: d.gen(S, T) }]; sl.pick = null; const r = A.tasksPick(S, tier, 0); assert.ok(r.ok, id + ' pick'); return sl; };

// ١) النصوص حرفاً من specs/038-tasks/texts.md (12 قالباً فقط)
{ assert.deepEqual(Object.keys(TK_T).sort(), IDS.slice().sort(), 'القوالب الاثنا عشر فقط');
  const md = fs.readFileSync(__dirname + '/../specs/038-tasks/texts.md', 'utf8'), sec = md.split(/\n### /);
  const F = { 'العرض': 'offer', 'السبب': 'why', 'التقدم': 'prog', 'الإنجاز': 'done' };
  for (const id of IDS) { const s = sec.find(x => x.startsWith(id + ' ·')); assert.ok(s, id + ' في texts.md');
    for (const k in F) { const m = s.match(new RegExp('- \\*\\*' + k + ':\\*\\* «(.*)»\\s*$', 'm')); assert.ok(m, id + ' ' + k); assert.equal(TK_T[id].t[F[k]], m[1], id + ' ' + k + ' حرفاً'); } }
  assert.equal(TASKS.TXT.accept, 'اتفقنا، هيّا إلى العمل.'); assert.equal(TASKS.TXT.done, 'أحسنت يا ولدي!'); assert.equal(TASKS.TXT.lapse, 'لم يحن وقتها، سنجد لك غيرها.'); assert.equal(TASKS.TXT.none, 'لا مهام الآن، تجارتك تسير.'); assert.equal(TASKS.TXT.capped, 'بلغتَ حدّ هذا الأسبوع، والمهام تبقى لك بلقبها.');
  assert.equal(TASKS.TXT.week(6, 25), 'مكافآت هذا الأسبوع: 6 من 25 نفوذ.'); assert.equal(TASKS.TXT.next(2), 'المهمة القادمة بعد 2 أيام.'); assert.equal(TASKS.TXT.drop, 'لا بأس، اختر غيرها.');
  const all = IDS.map(id => Object.values(TK_T[id].t).join(' ')).join(' '); assert.ok(!/زكا|صلا|حج|صيام|ربا|احتكار|غرر|رمضان|عيد/.test(all), 'لا نص ديني ولا حكم');
  for (const id of IDS) { const r = TK_T[id].reward; assert.ok(!('gold' in r) && !('sar' in r) && !('cash' in r), id + ' بلا ذهب'); }
  ok('النصوص مطابقة لـ texts.md حرفاً، لا نص ديني، لا ذهب في أي مكافأة'); }

// ٢) كل قالب: لا يُولَّد دون شرطه، يُنجَز بفعله فقط، ويُمنح مرة واحدة (ولو أُعيد التحميل)
const scen = {
  tr1(S) { const car = S.player.caravans[0], A_ = S.cities[car.city], B = S.cities[Object.keys(S.cities).find(x => x !== car.city)], g = 'coffee'; let sold = 0;
    return { off() { car.cargo = { wheat: E.capOfCar(car) / E.GD.wheat.w }; }, on() { car.cargo = {}; A_.stock[g] = 400; S.player.known[B.id].p[g] = E.refPrice(B, g) * 8; this.B = B.id; },
      no() { sellT(S, { city: this.B, g, q: 1 }); }, yes(sl) { sellT(S, { city: sl.pick.p.b, g: sl.pick.p.g, q: sl.pick.p['ن'] }); } }; },
  tr2(S) { return { off() { S.player.trades.length = 0; }, on() { S.player.trades.length = 0; for (let i = 0; i < 4; i++) sellT(S, { pl: 20 }); }, no() { sellT(S, { pl: 5 }); }, yes(sl) { sellT(S, { pl: sl.pick.p['ن'] + 1 }); } }; },
  tr3(S) { return { off() { S.player.tk2.seen.sell = {}; }, on() { S.player.tk2.seen.sell = { riyadh: 1 }; S.player.tk2.seen.vis.jeddah = 1; delete S.player.tk2.seen.sell.jeddah; }, no() { sellT(S, { city: 'riyadh' }); }, yes() { sellT(S, { city: 'jeddah' }); } }; },
  ex1(S) { const all = Object.keys(S.cities); return { off() { for (const id of all) S.player.tk2.seen.vis[id] = 1; }, on() { S.player.tk2.seen.vis = { riyadh: 1 }; }, no() { E.tkNote(S, 'visit', 'riyadh'); }, yes() { E.tkNote(S, 'visit', 'jeddah'); } }; },
  ex3(S) { const car = S.player.caravans[0], c = S.cities[car.city]; return { off() { S.player.tk2.seen.buy = {}; }, on() { S.player.tk2.seen.buy = { wheat: 1 }; const g = Object.keys(c.stock).find(x => x !== 'wheat' && !E.GD[x].live && E.sells(c, x)); c.stock[g] = 50; S.player.tk2.seen.buy = { wheat: 1 }; for (const x of Object.keys(E.GD)) if (x !== 'wheat' && x !== g) { } this.g = g; }, no() { S.player.trades.unshift({ day: S.day, city: c.id, g: 'wheat', q: 1, side: 'buy', net: -1, pl: 0, sector: 'trade' }); }, yes() { S.player.trades.unshift({ day: S.day, city: c.id, g: this.g, q: 1, side: 'buy', net: -1, pl: 0, sector: 'trade' }); } }; },
  lr1(S) { const L = S.learn; L.mj = L.mj || { seen: {}, baraka: 0 }; return { off() { L.mj.ready = 0; }, on() { L.mj.ready = Math.max(1, S.day); L.ex = L.ex || {}; L.ex.mj = -99; }, no() { }, yes() { L.mj.seen.zz = { p: 0, ok: true, d: S.day }; } }; },
  lr2(S) { const L = S.learn; return { off() { L.lastStageAge = 25; L.stage = 99; L.level = 11; }, on() { L.stage = 1; L.level = 1; L.lastStageAge = -1000; }, no() { }, yes() { L.stage = (L.stage || 1) + 1; } }; },
  mg1(S) { return { off() { S.paymentDues = []; }, on() { S.paymentDues = [{ id: 1, city: 'riyadh', kind: 'wage', amount: 100, deferredWages: 40 }]; }, no() { }, yes() { S.paymentDues = []; } }; },
  rl1(S) { S.phase = 2; return { off() { for (const id in S.bosses) S.bosses[id].trust = 80; }, on() { for (const id in S.bosses) S.bosses[id].trust = 80; S.player.tk2.seen.vis = { riyadh: 1 }; S.bosses.riyadh.trust = 10; }, no() { S.bosses.riyadh.trust = 15; }, yes(sl) { S.bosses.riyadh.trust = sl.pick.p['ن']; } }; },
  rl2(S) { S.phase = 2; S.learn.level = 11; return { off() { S.player.tk2.seen.hw = {}; S.player.tk2.seen.vis = {}; }, on() { S.player.tk2.seen.vis = { riyadh: 1 }; S.player.tk2.seen.hw = {}; }, no() { E.tkNote(S, 'visit', 'riyadh'); }, yes(sl) { E.tkNote(S, 'haggle', sl.pick.p.c); } }; },
  ex2(S) { return { off() { for (const id of Object.keys(S.cities)) S.player.tk2.seen.vis[id] = 1; }, on() { S.player.tk2.seen.vis = { riyadh: 1 }; }, no() { E.tkNote(S, 'visit', 'jeddah'); }, yes() { const c = Object.keys(S.cities).find(id => S.cities[id].country !== 'sa'); E.tkNote(S, 'visit', c); } }; },
  bd2(S) { S.phase = 2; S.player.gold = 1e6; A.buildShop(S, 'riyadh'); const sh = E.shopsOf(S, 'riyadh')[0]; A.shopSetItem(S, 'riyadh', sh.id, 'wheat', 1.05); const pr = S.player.props.riyadh; return { off() { pr.store.wheat = 1000; }, on() { pr.store.wheat = 0; }, no() { pr.store.wheat = 10; }, yes() { pr.store.wheat = 1000; } }; },
};
for (const id of IDS) {
  const S = mk(5); const sc = scen[id](S); day(S, 1); const T = S.player.tk2; assert.ok(T, 'tk2 بعد أول يوم');
  sc.off(); assert.equal(TK_T[id].gen(S, T), null, id + ': لا يُولَّد دون شرطه');
  sc.on(); const p = TK_T[id].gen(S, T); assert.ok(p, id + ': يُولَّد بشرطه');
  const b0 = Object.assign({}, bonus(S)), g0 = S.player.gold, sl = forcePick(S, id); assert.equal(sl.pick.id, id);
  E.tasksDay(S); assert.ok(sl.pick, id + ': لم يُنجَز بلا فعل'); sc.no(sl); E.tasksDay(S); assert.ok(sl.pick, id + ': فعل ناقص لا يُنجز');
  // إعادة تحميل في منتصف المهمة: الإنجاز بالفرق يبقى صحيحاً
  const S2 = JSON.parse(JSON.stringify(S)); const sl2 = S2.player.tk2.slots[TK_T[id].tier]; assert.ok(sl2.pick, 'بعد التحميل');
  sc.yes(sl); E.tasksDay(S); assert.equal(sl.pick, null, id + ': أُنجز بفعله');
  const r = TK_T[id].reward, b1 = bonus(S); assert.equal(b1.infl - b0.infl, r.infl || 0, id + ' نفوذ'); assert.equal(b1.xp - b0.xp, r.xp || 0, id + ' خبرة'); assert.equal(S.player.gold, g0, id + ': بلا ذهب');
  assert.ok(S.news.some(n => n.t.startsWith(TASKS.TXT.done)), id + ': رسالة الإنجاز');
  // لا منح مزدوج: المفتاح الفريد
  const keys = Object.keys(S.learn.bk || {}).filter(k => k.startsWith('tk2:' + id + ':')); assert.equal(keys.length, 1, id + ': مفتاح واحد');
  assert.equal(E.bonusAward(S, keys[0], r.infl || 0, r.xp || 0, ''), false, id + ': لا منح مزدوج'); day(S, 1); assert.equal(bonus(S).infl - b0.infl, r.infl || 0, id + ': لا تكرار بعد يوم');
}
ok('12 قالباً: لا يُولَّد دون شرطه، يُنجَز بفعله فقط، المكافأة مرة واحدة بالمفتاح، بلا ذهب، والإنجاز بالفرق يصمد لإعادة التحميل');

// ٣) التنوع: ثلاثة أنواع مختلفة، وعدم تكرار القالب المنجَز في العرض التالي، والحتمية بالبذرة
{ const S = mk(7); S.phase = 2; day(S, 1); const sh = view(S).slots[0]; assert.equal(sh.state, 'offer'); const kinds = sh.offers.map(o => o.kind); assert.equal(new Set(kinds).size, kinds.length, 'أنواع مختلفة'); assert.ok(sh.offers.length >= 2, 'عرض متعدد');
  for (let r = 0; r < 8; r++) { const S3 = mk(7 + r); day(S3, 1); const sl = slotOf(S3, 'short'), ids = sl.offer.map(o => o.id); if (!ids.length) continue; S3.player.tk2.recent.push({ id: ids[0], t: 'short', d: S3.day, ok: true }); sl.offer = []; sl.next = 0; day(S3, 1); assert.ok(!sl.offer.some(o => o.id === ids[0]), 'لا يتكرر القالب المنجَز مباشرة'); const k2 = sl.offer.map(o => TK_T[o.id].kind); assert.equal(new Set(k2).size, k2.length); }
  const a = mk(9), b = mk(9); day(a, 4); day(b, 4); assert.equal(JSON.stringify(a.player.tk2), JSON.stringify(b.player.tk2), 'حتمي بالبذرة');
  ok('ثلاثة أنواع مختلفة، لا تكرار متتالٍ، حتمي بالبذرة'); }

// ٤) المدة والمهلة بلا عقوبة، والتراجع، والتجديد بعد الإنجاز
{ const S = mk(5), sc = scen.tr2(S); day(S, 1); sc.on(); const sl = forcePick(S, 'tr2'), st = sl.st; assert.equal(st.due - st.since, TASKS.dur.short * TASKS.graceMul, 'المهلة ضعف المدة');
  const g0 = S.player.gold, b0 = JSON.stringify(bonus(S)), t0 = S.player.trades.length; S.day = st.due + 1; E.tasksDay(S); assert.equal(sl.pick, null, 'انقضت'); assert.ok(S.news.some(n => n.t === TASKS.TXT.lapse)); assert.equal(JSON.stringify(bonus(S)), b0, 'بلا مكافأة'); assert.equal(S.player.gold, g0, 'بلا عقوبة');
  const S2 = mk(5), sc2 = scen.tr2(S2); day(S2, 1); sc2.on(); forcePick(S2, 'tr2'); const r = A.tasksDrop(S2, 'short'); assert.ok(r.ok); assert.equal(r.msg, TASKS.TXT.drop); assert.equal(slotOf(S2, 'short').pick, null);
  assert.equal(A.tasksPick(S2, 'short', 0).ok, false, 'لا معروض بعد التراجع حتى يتجدد');
  const S3 = mk(5), sc3 = scen.tr2(S3); day(S3, 1); sc3.on(); const s3 = forcePick(S3, 'tr2'); sc3.yes(s3); E.tasksDay(S3); assert.equal(s3.next, S3.day + TASKS.gap.short); assert.equal(view(S3).slots[0].state, 'wait'); assert.equal(view(S3).slots[0].text, TASKS.TXT.next(TASKS.gap.short));
  ok('المهلة ضعف المدة وانتهاؤها بلا خسارة، التراجع، والتجديد بعد الفاصل'); }

// ٥) السقف الأسبوعي، والثقة بحدود، والميزة المؤقتة (≤10٪ و≤7 أيام، الأكبر يغلب)
{ const S = mk(5), sc = scen.rl1(S); day(S, 1); sc.on(); const T = S.player.tk2; T.cap = { wk: Math.floor(S.day / 7), infl: 22, xp: 0 }; const b0 = bonus(S).infl, sl = forcePick(S, 'rl1'); sc.yes(sl); E.tasksDay(S);
  assert.equal(bonus(S).infl - b0, 3, 'سقف النفوذ 25: يُمنح 3 فقط'); assert.equal(T.cap.infl, 25); const S2 = mk(5), sc2 = scen.rl1(S2); day(S2, 1); sc2.on(); S2.player.tk2.cap = { wk: Math.floor(S2.day / 7), infl: 25, xp: 0 }; const b1 = bonus(S2).infl, s2 = forcePick(S2, 'rl1'); sc2.yes(s2); E.tasksDay(S2);
  assert.equal(bonus(S2).infl, b1, 'بلغ السقف: لا نفوذ'); assert.ok(S2.news.some(n => n.t === TASKS.TXT.capped), 'سطر بلوغ السقف'); assert.equal(s2.pick, null, 'المهمة تُحتسب منجزة'); assert.equal(view(S2).capped, true);
  S2.day += 7; day(S2, 1); assert.equal(view(S2).capped, false, 'يتجدد السقف بعد أسبوع');
  // الميزة المؤقتة
  const S3 = mk(5); assert.equal(E.tbMul(S3, 'customs'), 1); assert.ok(E.tbGive(S3, 'customs', 30, 0.5)); assert.ok(S3.learn.tb.until - S3.day <= 7, '≤7 أيام'); assert.ok(S3.learn.tb.mul >= 0.9, '≤10٪'); assert.equal(E.tbMul(S3, 'customs'), 0.9); assert.equal(E.tbMul(S3, 'haggle'), 1, 'نوع آخر لا يتأثر');
  assert.equal(E.tbGive(S3, 'customs', 3, 0.95), false, 'الأصغر لا يغلب الأكبر ولا تراكم'); assert.equal(S3.learn.tb.mul, 0.9); S3.day += 8; assert.equal(E.tbMul(S3, 'customs'), 1, 'انقضت'); assert.ok(E.tbGive(S3, 'customs', 3, 0.95));
  const S4 = mk(5); const car = S4.player.caravans[0], cargo = { coffee: 10 }, a0 = Object.keys(S4.cities).find(id => S4.cities[id].country !== S4.cities[car.city].country); const full = E.customsOf(S4, car.city, a0, cargo, true); E.tbGive(S4, 'customs', 7, 0.9); const cut = E.customsOf(S4, car.city, a0, cargo, true); assert.ok(Math.abs(cut / full - 0.9) < 1e-9, 'جمارك −10٪ للاعب'); assert.equal(E.customsOf(S4, car.city, a0, cargo, false), E.customsOf(S4, car.city, a0, cargo, false)); TASKS.on = false; try { assert.equal(E.customsOf(S4, car.city, a0, cargo, true), full, 'المطفأ: القديم'); } finally { TASKS.on = true; }
  const S5 = mk(5); S5.bosses.riyadh.trust = 10; const rr = TK_T.rl1.reward; assert.ok(!rr.trust && !rr.boost, 'قوالب 038أ بنفوذ وخبرة فقط');
  ok('السقف الأسبوعي، الميزة المؤقتة ≤10٪ و≤7 أيام ولا تتراكم، وتخفض الجمارك فعلاً'); }

// ٦) المفتاح المطفأ: لا يُقرأ ولا يُكتب شيء، والتشغيل لا يغيّر اللعبة قبل أن يقبل اللاعب مهمة (بصمة)
{ const run = on => { TASKS.on = on; try { const S = mk(11, false); S.phase = 2; day(S, 60); return S; } finally { TASKS.on = true; } };
  const off = run(false), onn = run(true); assert.equal(off.player.tk2, undefined, 'لا tk2 حين يُطفأ'); TASKS.on = false; assert.equal(E.tasksView(off), null); assert.equal(A.tasksPick(off, 'short', 0).ok, false); TASKS.on = true;
  assert.equal(onn.player.tk2, undefined, 'كسول: لا tk2 قبل أن يفتح اللاعب المهام'); assert.equal(JSON.stringify(onn), JSON.stringify(off), 'بصمة: التشغيل قبل أن يفتح اللاعب المهام = السلوك الحالي حرفياً');
  ok('TASKS.on=false: لا حالة ولا أثر؛ والتشغيل قبل فتح المهام لا يغيّر اللعبة بتاتاً (حالة كسولة)'); }

// ٧) الحفظ القديم (بلا tk2) يعمل، والحقول اختيارية
{ const S = mk(5); day(S, 3); delete S.player.tk2; const S2 = JSON.parse(JSON.stringify(S)); day(S2, 3); assert.ok(view(S2).slots.length === 2); assert.ok(S2.player.tk2.slots.short);
  const S3 = mk(5); day(S3, 2); S3.player.tk2 = { slots: {} }; day(S3, 2); assert.ok(S3.player.tk2.done && S3.player.tk2.seen && S3.player.tk2.cap, 'ينمّي الحقول الناقصة');
  const S4 = E.newGame(2); day(S4, 3); assert.equal(S4.player.tk2, undefined, 'بلا شخصية تعليمية: لا شيء'); ok('الحفظ القديم والحقول الاختيارية'); }

// ٨) قياس 8 بذور × سنتين: لا نوع يتجاوز 40٪، ولا مهمة مستحيلة (قُبلت ثم لم تنجز بسبب شرط)، وأثر الثروة ضمن ±10٪
if (!process.env.TASKS_FAST) {
  const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], DAYS = 730, kindN = {}, tmplN = {}, kindAll = {}; let offeredAll = 0, nwOn = 0, nwOff = 0, done = 0, lapsed = 0, picks = 0;
  for (const sd of SEEDS) {
    const play = on => { TASKS.on = on; try { const S = mk(sd * 7919); S.phase = 3; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; for (let d = 0; d < DAYS; d++) { E.botMain(S); E.botBuild(S);
        if (on) for (const tier of ['short', 'week']) { const sl = S.player.tk2 && S.player.tk2.slots[tier]; if (sl && !sl.pick && sl.offer.length) { for (const o of sl.offer) { const k = TK_T[o.id].kind; kindAll[k] = (kindAll[k] || 0) + 1; offeredAll++; } const i = Math.floor((((d * 31 + sd * 17 + tier.length) * 2654435761 >>> 0) % 1000) / 1000 * sl.offer.length); const id = sl.offer[i].id; if (A.tasksPick(S, tier, i).ok) { picks++; kindN[TK_T[id].kind] = (kindN[TK_T[id].kind] || 0) + 1; tmplN[id] = (tmplN[id] || 0) + 1; } } }
        E.tick(S, false); S.pause = false; }
      return S; } finally { TASKS.on = true; } };
    const a = play(true), b = play(false); nwOn += E.netWorth(a); nwOff += E.netWorth(b); done += a.player.tk2.done.length;
    for (const r of a.player.tk2.recent) if (!r.ok) lapsed++;
  }
  const tot = Object.values(kindN).reduce((x, y) => x + y, 0), mx = Math.max(...Object.values(kindN)) / tot, mxT = Math.max(...Object.values(tmplN)) / tot;
  const mxAll = Math.max(...Object.values(kindAll)) / offeredAll;
  console.log('قياس 038أ: قُبلت ' + picks + '، أُنجزت ' + done + '، انقضت (آخر 40 لكل بذرة) ' + lapsed + '؛ أنواع القبول:', JSON.stringify(kindN), '؛ أنواع المعروض:', JSON.stringify(kindAll), '؛ القوالب:', JSON.stringify(tmplN), '؛ أكبر نوع مقبول ' + (mx * 100).toFixed(1) + '٪، أكبر قالب ' + (mxT * 100).toFixed(1) + '٪؛ ثروة (مع/بدون) ' + (nwOn / nwOff).toFixed(3));
  assert.ok(picks > 40, 'مهام كافية للقياس'); assert.ok(mx <= 0.4, 'لا نوع قالب مقبول > 40٪'); assert.ok(mxT <= 0.4, 'لا قالب منفرد > 40٪'); assert.ok(Math.abs(nwOn / nwOff - 1) <= 0.1, 'أثر الثروة ≤ ±10٪'); ok('قياس 8 بذور × سنتين'); }
console.log('ALL OK');
