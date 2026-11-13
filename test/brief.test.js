'use strict';
// 050 «يومك في 30 ثانية» + «بِع في أفضل سوق» + مسار التاجر + سباق الرئاسة (المحرك): node test/brief.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const ok = m => console.log('OK   ' + m), car0 = S => S.player.caravans[0], snap = (S, c) => JSON.stringify({ gold: S.player.gold, w: S.player.wallet, cargo: c.cargo, basis: c.basis, left: c.left, city: c.city, bm: c.bm, day: S.day });
E.rivalMemorySet(null);

// 1) ماذا حدث: لقطة ثم فرق الدفتر، تقرير الغياب، ترتيب الأخبار
{ const S = game(5); step(S, 12); a.equal(E.briefView(S).first, true, 'أول مرة: لا لقطة'); a.equal(E.briefView(S).any, false);
  E.briefSeen(S); a.equal(S.brief.seen, S.day); const P = S.player; P.led.inc.shops = (P.led.inc.shops || 0) + 4900; P.led.exp.staff = (P.led.exp.staff || 0) + 1960; S.day += 3;
  let v = E.briefView(S); a.equal(v.net, 2940, 'صافي 4900 − 1960'); a.equal(v.days, 3); a.deepEqual(v.topInc, { k: 'shops', v: 4900 }); a.deepEqual(v.topExp, { k: 'staff', v: 1960 }); a.equal(v.first, false);
  S.awayReport = { days: 3, change: 2140.4, inc: [['shops', 4900], ['realized', 100]], exp: [['staff', 1960]], events: [] }; v = E.briefView(S);
  a.equal(v.net, 2140, 'مع تقرير الغياب تُؤخذ أرقامه'); a.equal(v.hasAway, true); a.deepEqual(v.topInc, { k: 'shops', v: 4900 }); delete S.awayReport;
  const d = S.day; S.news = [{ d, t: 'خبر عادي', k: '' }, { d: d - 1, t: 'خبر سيئ', k: 'bad' }, { d, t: 'خبر جيد', k: 'good' }, { d, t: 'خبر سيئ', k: 'bad' }, { d: d - 20, t: 'قديم', k: 'bad' }];
  v = E.briefView(S); a.equal(v.events.length, 2, 'سطران للأخبار'); a.deepEqual(v.events.map(e => e.t), ['خبر سيئ', 'خبر جيد'], 'bad ثم good، بلا مكرر ولا قديم');
  S.news.unshift({ d, t: 'تقدّمتَ في سباق', k: 'good', race: 1 }); v = E.briefView(S); a.equal(v.events[0].t, 'تقدّمتَ في سباق', 'خبر السباق يتقدّم'); a.equal(v.events[1].t, 'خبر سيئ');
  S.news = []; a.equal(E.briefView(S).events.length, 0, 'لا أخبار'); }
ok('«ماذا حدث»: صافي الدفتر من اللقطة (+2940)، تقرير الغياب، ترتيب الأخبار (bad قبل good، خبر السباق أولاً، بلا مكرر)');

// 2) خطوتك المقترحة والخطر
{ const S = game(5), car = car0(S); let st = E.bestStep(S); a.ok(st && st.kind === 'load' && st.qBuy === st.q && st.q >= 3, 'واقفة فارغة: حمّل وسافر'); a.ok(E.bestMarkets(S, car, st.g, st.q, E.unitPrice(S.cities[car.city], st.g) * 1.04).some(o => o.city === st.dest));
  car.cargo.coffee = 20; car.basis.coffee = { q: 20, c: 20 * 9 }; st = E.bestStep(S);
  if (st) { a.equal(st.kind, 'cargo', 'واقفة تحمل بضاعة: بِع'); a.equal(st.qBuy, 0); a.equal(st.q, 20); a.ok(st.o.profit > 0); }
  car.cargo = { coffee: 2 }; a.equal(E.bestStep(S), null, 'أقل من الحد الأدنى للكمية: لا خطوة');
  car.cargo = {}; car.left = 2; a.equal(E.bestStep(S), null, 'في الطريق: لا خطوة'); car.left = 0;
  a.equal(E.brRiskName(0.05), 'منخفض'); a.equal(E.brRiskName(0.08), 'متوسط'); a.equal(E.brRiskName(0.12), 'عالٍ');
  const S2 = game(5); S2.noLock = 0; const cc = car0(S2), opts = E.bestMarkets(S2, cc, 'coffee', 9, 9);
  a.ok(opts.length <= E.BESTM.n && opts.every(o => o.profit > 0), 'ربح > 0 وبحد 3');
  const foreign = S2.order.filter(id => S2.cities[id].country !== S2.cities[cc.city].country);
  a.ok(foreign.some(id => E.sellOptions(S2, cc.city, 'coffee', 9, 9, cc).find(o => o.city === id && o.profit > 0) && E.travelBlock(S2, cc, id)), 'القفل يحجب وجهات رابحة في sellOptions (فحص غير فارغ)');
  a.ok(opts.every(o => !E.travelBlock(S2, cc, o.city)), 'المحجوب لا يُقترح أبداً'); }
ok('الخطوة: الحالات والأولوية، والمحجوب بـtravelBlock لا يُقترح، وكلمة الخطر (0.05/0.08/0.12)');

// 3) مسار التاجر
{ const S = game(5), setNW = v => { S.player.wallet.sar += v - E.netWorth(S); S.player.gold = S.player.wallet.sar; return E.netWorth(S); };
  a.ok(Math.abs(setNW(12600) - 12600) < 1); let v = E.progView(S, []); a.equal(v.title, 'وكيل تجاري'); a.equal(v.next, 'صاحب مصانع'); a.ok(Math.abs(v.pct - 0.5067) < 0.001, 'pct ' + v.pct); a.equal(v.left, 7400); a.equal(v.last, false);
  setNW(5000000); v = E.progView(S, []); a.equal(v.title, 'سلطان الدروب'); a.equal(v.last, true); a.equal(v.pct, 1); a.equal(v.left, 0); a.equal(v.next, null);
  S.learn.bonus = S.learn.bonus || { infl: 0, xp: 0 }; S.learn.bonus.xp += 750 - E.pointsEarned(S).xp; v = E.progView(S, []); a.equal(v.rk, 2); a.equal(v.xpLeft, 150, 'بقي 900 − 750'); a.equal(v.pj, 0); a.equal(v.pjNext, 250000); a.ok(v.ch >= 1); }
ok('مسار التاجر: وكيل تجاري عند 12600 (pct 0.5067، بقي 7400)، أعلى لقب عند 5 ملايين، والرتبة 2 وبقي 150 خبرة');

// 4) بِع في أفضل سوق: الفحوص المسبقة بلا أي تغيير، النجاح، الوصول، البيع والخبر، حذف الخطة
{ const S = game(5), car = car0(S), st = E.bestStep(S), before = snap(S, car), gold0 = S.player.gold;
  const fails = [['وجهة هي المدينة نفسها', () => A.bestRun(S, car.id, st.g, st.qBuy, car.city)], ['كمية فوق الرصيد', () => A.bestRun(S, car.id, st.g, 9999, st.dest)], ['سلعة مجهولة', () => A.bestRun(S, car.id, 'xx', 3, st.dest)]];
  for (const [n, f] of fails) { const b = snap(S, car), r = f(); a.equal(r.ok, false, n); a.equal(snap(S, car), b, n + ': بلا أي تغيير في الذهب والحمولة والخطة'); }
  { const S3 = game(5), c3 = car0(S3); S3.player.gold = 1e7; S3.player.wallet.sar = 1e7; const b = snap(S3, c3), r = A.bestRun(S3, c3.id, st.g, 5000, st.dest); a.equal(r.ok, false, 'كمية فوق السعة'); a.equal(snap(S3, c3), b); }
  const S2 = game(5); S2.noLock = 0; const c2 = car0(S2), fb = S2.order.find(id => S2.cities[id].country !== S2.cities[c2.city].country); { const b = snap(S2, c2), r = A.bestRun(S2, c2.id, 'coffee', 5, fb); a.equal(r.ok, false, 'وجهة محجوبة'); a.equal(snap(S2, c2), b); }
  car.left = 2; { const b = snap(S, car); a.equal(A.bestRun(S, car.id, st.g, st.qBuy, st.dest).ok, false); a.equal(snap(S, car), b, 'في الطريق'); } car.left = 0;
  const r = A.bestRun(S, car.id, st.g, st.qBuy, st.dest); a.equal(r.ok, true, r.msg); a.ok(S.player.gold < gold0, 'اشترى'); a.equal(Math.floor(car.cargo[st.g]), st.qBuy); a.ok(car.left > 0, 'سافر'); a.equal(car.bm.dest, st.dest); a.equal(car.bm.g, st.g); a.equal(car.bm.q, st.qBuy); a.ok(isFinite(car.bm.est));
  a.ok(car.plan && car.plan.to === st.dest, 'ملخص رحلة 032 (car.plan) لم يُمَسّ');
  a.equal(E.planArrived(S), null, 'لا بطاقة وصول قبل الوصول'); step(S, car.left);
  const pa = E.planArrived(S); a.ok(pa && pa.city === st.dest && pa.q === st.qBuy && pa.g === st.g, 'بطاقة الوصول'); a.equal(pa.est, car.bm.est); a.ok(isFinite(pa.now));
  const half = Math.floor(pa.q / 2); let r1 = A.sell(S, car.id, pa.g, half); a.equal(r1.ok, true); a.ok(car.bm, 'بيع جزئي: الخطة باقية'); a.equal(S.news.filter(n => n.t.includes('ربح رحلة')).length, 0, 'لا خبر ربح قبل نفاد السلعة');
  const r2 = A.sell(S, car.id, pa.g, 999); a.equal(car.bm, undefined, 'بعد البيع تُحذف الخطة'); const real = Math.round(r1.pl) + Math.round(r2.pl); const tn = S.news.filter(n => n.t.includes('ربح رحلة')); a.equal(tn.length, 1); a.ok(tn[0].t.includes(String(Math.abs(real))), 'خبر بالربح الفعلي: ' + tn[0].t + ' / ' + real); a.ok(tn[0].t.includes('قدّرناه ' + pa.est)); }
{ const S = game(5), car = car0(S), st = E.bestStep(S); A.bestRun(S, car.id, st.g, st.qBuy, st.dest); step(S, car.left); a.ok(car.bm); const other = S.order.find(id => id !== car.city && !E.travelBlock(S, car, id)); a.equal(A.travel(S, car.id, other).ok, true); a.equal(car.bm, undefined, 'مغادرة إلى غير الوجهة تحذف الخطة'); }
{ const S = game(5), car = car0(S), st = E.bestStep(S); A.bestRun(S, car.id, st.g, st.qBuy, st.dest); step(S, car.left); a.ok(car.bm); car.cargo = {}; step(S, 1); a.equal(car.bm, undefined, 'نفاد السلعة يحذف الخطة'); }
{ const S = game(5), car = car0(S), st = E.bestStep(S); A.bestRun(S, car.id, st.g, st.qBuy, st.dest); const J = JSON.parse(E.save(S)); a.ok(J.player.caravans[0].bm && J.player.caravans[0].plan, 'الحفظ يحمل الخطتين'); const L = E.loadChecked(E.save(S)); a.ok(L.ok && L.S.player.caravans[0].bm.dest === st.dest, 'يُستعاد بعد التحميل'); }
ok('«بِع في أفضل سوق»: كل فحص مسبق يفشل بلا أي تغيير، النجاح يشتري ويسافر ويكتب الخطة (car.bm؛ car.plan لملخص 032 باقٍ)، الوصول يُظهر البطاقة، البيع يحذف الخطة ويكتب الخبر بالربح الفعلي، والمغادرة/النفاد يحذفانها');

// 5) سباق الرئاسة
const raceGame = () => { const S = game(5); step(S, 200); a.ok(S.race && S.race.cid, 'سوقك مختار'); return S; };
{ const S = game(5), P = S.player, car = car0(S); S.phase = 4; P.gold = 400000; P.wallet.sar = 400000; const cid = E.A && Object.keys(S.cities).find(id => S.cities[id].size === 2) || car.city; car.city = cid; S.cities[cid].owner = 'none';
  A.buildShop(S, cid); A.buildShop(S, cid); A.buildWarehouse(S, cid); const pr = P.props[cid]; pr.store = {}; pr.store.wheat = 1000 / E.mid('wheat'); const rk = Object.keys(E.RECIPES || {})[0]; P.factories.push({ id: S.nextId++, recipe: rk, city: cid, level: 2, stock: {}, out: {} });
  if (S.bosses[cid]) S.bosses[cid].ruler = 'player'; const exp = 2000 + 800 + E.valueOf(pr.store) + 4000 + 4000 * S.cities[cid].size + (P.bank.dep[cid] || 0) + E.farmValue(pr) + (S.cities[cid].owner === 'player' ? 30000 : 0);
  a.ok(Math.abs(E.valueOf(pr.store) - 1000) < 1, 'بضاعة 1000'); a.ok(Math.abs(E.raceMarketW(S, cid) - exp) < 1, 'مجموع الأجزاء ' + E.raceMarketW(S, cid) + ' مقابل ' + exp); if (S.cities[cid].size === 2 && S.bosses[cid]) a.ok(Math.abs(E.raceMarketW(S, cid) - 15800) < 1, '2000+800+1000+4000+8000 = 15800: ' + E.raceMarketW(S, cid));
  const R = E.wealthReport(S); a.ok(Math.abs(R.rows.reduce((t, r) => t + r.value, 0) - E.netWorth(S)) < 1, 'wealthReport ما زال مجموعه netWorth'); }
{ const S = raceGame(), cid = S.race.cid, P = S.player, rv = (S.rivals || []).filter(r => r.out == null && r.city === cid && r.w != null), setMW = w => { P.bank.dep[cid] = w - (E.raceMarketW(S, cid) - (P.bank.dep[cid] || 0)); };
  a.ok(rv.length >= 1); rv[0].w = 100000; if (rv[1]) rv[1].w = 100000; setMW(100000); let r = E.raceRank(S, cid); a.equal(r.rk, 1, 'التعادل: id أصغر (أنت −1) أولاً'); a.equal(r.L[0].me, true);
  setMW(99999); r = E.raceRank(S, cid); a.equal(r.rk, 2); a.equal(r.L[0].id, rv[0].id < (rv[1] || { id: 1e9 }).id ? rv[0].id : rv[1].id); a.equal(Math.round(r.gapUp), 1); setMW(0); a.equal(E.raceRank(S, cid).rk, 1 + rv.length);
  // المنصب: ثلاثون يوماً بالضبط لا 29
  const by = {}; by[cid] = rv.slice().sort((x, y) => y.w - x.w || x.id - y.id); const st = () => E.rgChiefSt(S, cid), L0 = S.learn.bonus ? S.learn.bonus.infl : 0; by[cid].forEach(x => { x.w = 100000; }); setMW(130000);
  const stage = d => { S.day = d; E.rgChiefMonth(S, by); }; stage(300); a.equal(st().cand, -1, 'مرشّح'); a.equal(st().cd, 300); stage(329); a.notEqual(st().id, -1, '29 يوماً لا تكفي'); stage(330); a.equal(st().id, -1, 'ثلاثون يوماً بالضبط'); a.equal(E.rivalChiefOf(S, cid), null, 'لا منافس رئيس');
  a.ok(S.news[0].t.includes('صرتَ رئيس التجار'), S.news[0].t); const infl = () => (S.learn.bonus ? S.learn.bonus.infl : 0); a.equal(infl() - L0, E.RACE.inflWin, '+15 أول مرة'); stage(331 + 29); a.equal(infl() - L0, E.RACE.inflWin + E.RACE.inflMonth, '+2 للشهر الجديد'); const k = infl(); E.rgChiefMonth(S, by); a.equal(infl(), k, 'مفتاح الشهر فريد: لا تكرار');
  // يفقده حين يسبقه منافس بـ15٪ ثلاثين يوماً
  setMW(10000); by[cid][0].w = 400000; stage(400); a.equal(st().id, -1, 'لم يُفقد بعد'); a.equal(st().cand, by[cid][0].id); stage(430); a.equal(st().id, by[cid][0].id, 'سبقه منافس ثلاثين يوماً'); a.ok(S.news[0].t.includes('منك'));
  // يستعيده فلا +15 ثانية
  by[cid][0].w = 100000; setMW(130000); const k2 = infl(); stage(460); stage(490); a.equal(st().id, -1, 'استعاده'); a.equal(infl(), k2 + 0, 'لا +15 مرة ثانية ولا +2 في شهر الفوز'); }
ok('السباق: raceMarketW بأرقام ثابتة، wealthReport سليم، الترتيب والتعادل بـid، المنصب بعد 30 يوماً لا 29، يُفقد بالقاعدة نفسها، +15 مرة واحدة و+2 لكل شهر (مفتاح فريد)، rivalChiefOf = null');
{ const S = raceGame(), cid = S.race.cid, P = S.player, rv = S.rivals.filter(r => r.out == null && r.city === cid && r.w != null), setMW = w => { P.bank.dep[cid] = w - (E.raceMarketW(S, cid) - (P.bank.dep[cid] || 0)); };
  rv[0].w = 100000; if (rv[1]) rv[1].w = 5000; setMW(150000); S.day = Math.ceil(S.day / 7) * 7; S.race.rk = 2; S.race.wk = -1; const nr = () => S.news.filter(n => n.race).length; S.news = []; E.raceDay(S); a.equal(S.race.rk, 1); a.equal(nr(), 1); a.ok(S.news[0].t.includes('تقدّمتَ') && S.news[0].k === 'good' && S.news[0].race === 1, S.news[0].t);
  S.day += 7; E.raceDay(S); a.equal(nr(), 1, 'لا خبر إن لم يتغير'); setMW(1); S.day += 7; E.raceDay(S); a.ok(S.news[0].t.includes('تأخّرتَ') && S.news[0].k === 'bad' && S.news[0].t.includes(rv[0].name.slice(0, 3)), S.news[0].t); const n1 = nr(); S.day += 3; E.raceDay(S); a.equal(nr(), n1, 'لا خبر في غير يوم الأسبوع'); }
ok('الخبر الأسبوعي: تقدّم/تأخّر عند التغير فقط، ويتقدّم «ماذا حدث»');
{ const S = raceGame(), v = E.raceView(S); a.ok(v && v.rows.length >= 2 && v.rows.length <= 4 && v.rows.some(r => r.me)); for (const r of v.rows) a.ok(r.view && (r.view.exact || (r.view.lo <= r.view.hi)), 'ثروة المنافس من rgWView (نطاق أو دقيقة)'); a.ok(v.rows.filter(r => !r.me).every(r => r.view.exact === (E.rgWView(S, S.rivals.find(x => x.id === r.id)).exact)), 'يحترم المعرفة');
  a.ok(v.rows.every(r => r.bar > 0 && r.bar <= 1)); a.equal(v.n >= v.rows.length, true); }
ok('raceView: صفوف بالمعرفة، وأقصاها أربعة');

// 6) المفاتيح: كلٌّ مطفأ = بلا حقول جديدة في الحفظ
for (const K of ['BRIEF', 'BESTM', 'RACE']) { E[K].on = false; try { const S = game(5), car = car0(S); step(S, 130); const st = E.bestStep(S); if (K === 'BESTM') a.equal(st, null); if (K === 'BRIEF') a.equal(E.briefView(S), null);
    if (K === 'BESTM') a.equal(A.bestRun(S, car.id, 'coffee', 3, 'medina').ok, false, 'الفعل مطفأ');
    const j = E.save(S); a.ok(!({ BRIEF: /"brief"/, BESTM: /"bm":/, RACE: /"race"|"race:|"racem:/ }[K]).test(j), K + ': لا حقل جديد في الحفظ'); if (K === 'RACE') { a.equal(S.race, undefined); a.equal(E.raceView(S), null); } } finally { E[K].on = true; } }
ok('كل مفتاح مطفأ = لا S.brief ولا car.bm ولا S.race في الحفظ');
console.log('PASS brief');
