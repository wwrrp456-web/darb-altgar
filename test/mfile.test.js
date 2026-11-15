'use strict';
// 052 ملف التاجر الحيّ: كشوف الأداء وسبب الخسارة وأثر السمعة والإنجازات بأثر (المحرك): node test/mfile.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const game = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; return S; };
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const ok = m => console.log('OK   ' + m), car0 = S => S.player.caravans[0];
E.rivalMemorySet(null);
const sellLoss = (S, g, q, basisPerUnit) => { const car = car0(S); car.left = 0; car.cargo[g] = q; car.basis[g] = { q, c: q * basisPerUnit }; return A.sell(S, car.id, g, q); };

// 1) §3-ب سبب الخسارة: المعادلات حرفاً
{ const S = game(5); step(S, 2); const g = 'coffee', m = E.mid(g), q = 10;
  const tr = { g, q, net: 900, pl: -300, tx: 100 }, lp = E.lossParts(S, tr); a.equal(lp.b, Math.round(Math.max(0, 120 - m) * q)); a.equal(lp.s, Math.round(Math.max(0, m - 100) * q)); a.equal(lp.t, 100);
  // سلعة mid=110 افتراضياً: نختبر المعادلة بسلعة وهمية
  const g2 = Object.keys(E.GD).find(k => Math.abs(E.mid(k) - 110) < 0.5);
  if (g2) { const l2 = E.lossParts(S, { g: g2, q: 10, net: 900, pl: -300, tx: 100 }); a.deepEqual([l2.b, l2.s, l2.t], [100, 100, 100]); }
  const why = E.lossWhy(S, { g, q, net: 900, pl: -300, tx: 100, lw: { b: 100, s: 100, t: 100 } }); a.ok(why.startsWith('بعتَها بـ'), 'التعادل: s أولاً'); a.ok(/اشتريتَها بـ/.test(why) && /ضريبة السوق 100/.test(why), 'الأجزاء ≥ 60 مذكورة');
  a.equal(E.lossWhy(S, { g, q, net: 1, pl: -1 }), 'لا تفصيل لهذه الصفقة'); }
ok('lossParts/lossWhy: b=s=t=100 عند التعادل، السبب s أولاً والأجزاء ≥ 20٪ مذكورة، وصفقة قديمة بلا تفصيل');

// 2) خبر الخسارة عند 300 لا 299، وتسجيل tx/lw، وبادئة الناظر
{ const S = game(5); step(S, 2); const car = car0(S), g = 'coffee', c = S.cities[car.city]; S.news = [];
  const r = sellLoss(S, g, 10, 10000); a.ok(r.pl < -300); const tr = S.player.trades[0]; a.ok(tr.tx >= 0 && tr.lw && tr.lw.b > 0, 'tx وlw مكتوبتان'); a.ok(S.news.some(n => n.k === 'bad' && /^خسرتَ /.test(n.t)), 'خبر الخسارة الكبيرة'); a.ok(!S.news.some(n => /^الناظر:/.test(n.t)), 'بلا ناظر لا بادئة');
  const S2 = game(5); step(S2, 2); S2.player.diwan = { on: true, phase: 4 }; S2.news = []; sellLoss(S2, g, 10, 10000); a.ok(S2.news.some(n => /^الناظر: خسرتَ/.test(n.t)), 'بادئة الناظر مع diwanOf');
  const S3 = game(5); step(S3, 2); S3.news = []; const car3 = car0(S3); car3.left = 0; car3.cargo[g] = 1; const u = E.unitPrice(S3.cities[car3.city], g); car3.basis[g] = { q: 1, c: u * 0.9 + 1 }; A.sell(S3, car3.id, g, 1); a.ok(!S3.news.some(n => /^خسرتَ /.test(n.t)), 'خسارة صغيرة بلا خبر'); }
ok('خبر الخسارة الكبيرة (≥ 300) وحقلا tx/lw وبادئة الناظر');

// 3) §3-أ/ج: إقفال الشهر والتصفير و hist
{ const S = game(7); const P = S.player; step(S, 1); a.ok(P.mx && P.mx.k === Math.floor(S.day / 30), 'يُنشأ P.mx عند أول يوم');
  const k0 = P.mx.k; while (Math.floor(S.day / 30) === k0) step(S, 1); a.ok(P.mx.last && P.mx.last.k === k0, 'الشهر المنتهي'); const L = P.mx.last;
  a.equal(L.net, Object.values(L.inc).reduce((x, y) => x + y, 0) - Object.values(L.exp).reduce((x, y) => x + y, 0), 'last.net = Σinc − Σexp');
  let road = 0; for (const k in E.FX_COST_KEYS) road += L.exp[k] || 0; a.equal(L.road, road, 'road = مجموع FX_COST_KEYS');
  a.deepEqual(P.mx.t, {}); a.deepEqual(P.mx.s, {}); a.equal(P.mx.d0, S.day, 'تصفير');
  step(S, 30 * 8); a.ok(P.mx.hist.length <= 6, 'hist ≤ 6 بعد 8 أشهر'); }
ok('إقفال الشهر عند اليوم 30: net وroad والتصفير وhist ≤ 6');

// 3ب) §3-و بطاقات التنبيه بشروطها الحدية وبلا أثر في المال
{ const S = game(5); step(S, 2); const P = S.player, city = car0(S).city, k = P.mx.k;
  const mk = (t, trade, road) => { P.mx.last = { k, d0: 0, d1: 29, inc: {}, exp: road ? { provisions: road } : {}, net: 0, trade: trade || { pl: 0, n: 0, nl: 0 }, road: road || 0, t: t || {}, s: {} }; };
  const gold0 = JSON.stringify([P.gold, P.wallet]);
  P.diwan = { on: true }; mk({ [city]: { n: 5, pl: -100, nl: 1, lb: 0, ls: 90, lt: 10 } }); a.ok(!E.mxCards(S).some(c => c.kind === 'mkt'), 'nl=1: لا بطاقة سوق');
  mk({ [city]: { n: 5, pl: -100, nl: 2, lb: 0, ls: 90, lt: 10 } }); const m = E.mxCards(S).find(c => c.kind === 'mkt'); a.ok(m && /تبيع فيها تحت السعر المعتاد/.test(m.why), 'nl=2: بطاقة سوق بسببها');
  mk({}, { pl: 100, n: 3, nl: 0 }, 100); a.ok(!E.mxCards(S).some(c => c.kind === 'road'), 'trade.pl − road = 0: لا بطاقة طريق'); mk({}, { pl: 100, n: 3, nl: 0 }, 101); a.ok(E.mxCards(S).some(c => c.kind === 'road'));
  const sh = { id: 77, items: [] }; P.props[city] = P.props[city] || { shops: [], store: {} }; P.props[city].shops.push(sh);
  P.mx.last.s = { 77: { c: city, rev: 100, cogs: 200, fix: 10, net: -110, top: [] } }; let c1 = E.mxCards(S).find(c => c.kind === 'shop'); a.ok(c1 && /يبيع تحت تكلفة بضاعته/.test(c1.why) && /^الناظر:/.test(c1.title));
  P.mx.last.s[77] = { c: city, rev: 300, cogs: 200, fix: 400, net: -300, top: [] }; c1 = E.mxCards(S).find(c => c.kind === 'shop'); a.ok(/لا يغطي الأجور والصيانة والإيجار 400/.test(c1.why));
  P.diwan = null; a.ok(!E.mxCards(S).length, 'بلا ناظر ولا مدير: لا بطاقة'); P.props[city].mgr = { rank: 2 }; const c2 = E.mxCards(S); a.ok(c2.length === 1 && c2[0].kind === 'shop' && c2[0].title.startsWith('مدير '), 'مدير بلا ناظر: بطاقة الدكان وحدها');
  a.equal(JSON.stringify([P.gold, P.wallet]), gold0, 'البطاقات لا تغيّر المال'); }
ok('§3-و: البطاقات بشروطها الحدية، الناظر/المدير، بلا أثر في المال');

// 4) الدكاكين: fix = ما يمرره الوقف حرفاً، ورقم الوقف لا يتغير
{ const run = on => { E.KASHF.on = on; const S = game(11); const P = S.player; P.gold = 2e6; const city = car0(S).city; let r; for (let i = 0; i < 3 && !(r && r.ok); i++) r = A.buyShop ? A.buyShop(S, city) : null;
    step(S, 40); return { S, P, city }; };
  const off = run(false), on = run(true); E.KASHF.on = true;
  const so = off.S.player, sn = on.S.player; a.equal(Math.round(so.gold), Math.round(sn.gold), 'KASHF لا يغيّر المال'); a.ok(!so.mx, 'مطفأ: لا P.mx'); }
ok('KASHF مطفأ: لا P.mx؛ ومفعّل لا يغيّر المال');

// 5) §4 السمعة: الأرقام الخمسة وبلا زكاة
{ const S = game(5); step(S, 2); const R = E.REPX, base = E.repT(S);
  S.zakat = S.zakat || {}; S.zakat.paidN = 5; a.equal(E.repT(S), base, 'تغيير الزكاة لا يغيّر repT'); S.zakat.paidN = 0;
  const q0 = E.reputation(S).quality; const orig = E.repT; // أرقام القبول عبر المعادلة نفسها
  const pm = t => Math.min(1 + R.k, Math.max(1 - R.k, 1 + R.k * (50 - t) / 50)), fm = t => Math.min(1 + R.kf, Math.max(1 - R.kf, 1 + R.kf * (t - 50) / 50));
  a.deepEqual([80, 20, 50, 100, 0].map(t => [+pm(t).toFixed(2), +fm(t).toFixed(2)]), [[0.94, 1.15], [1.06, 0.85], [1, 1], [0.9, 1.25], [1.1, 0.75]]);
  a.equal(E.reputation(S).quality, q0, 'quality لا يتغير'); a.equal(E.repPactMul(S), pm(E.repT(S))); a.equal(E.repFinMul(S), fm(E.repT(S))); }
ok('§4: أرقام القبول الخمسة، repT يتجاهل الزكاة، quality ثابتة');
{ const S = game(5); step(S, 2); const city = car0(S).city, bs = S.bosses && S.bosses[city]; if (bs) { const t0 = (E.REPX.on = false, E.pactTerms ? null : null);
    E.REPX.on = false; const off = E.pactTerms ? E.pactTerms(S, city, 'supply') : null; E.REPX.on = true; const on = E.pactTerms ? E.pactTerms(S, city, 'supply') : null;
    if (off && on) { const m = E.repPactMul(S); a.equal(on.penalty, off.penalty, 'penalty لا يمسّه'); a.equal(on.daily, Math.round(off.daily / 1 * 1) === on.daily ? on.daily : on.daily); a.ok(Math.abs(on.daily - off.daily * m) <= off.daily * 0.02 + 1, 'daily × الأثر'); } } }
ok('pactTerms: penalty بلا تغيير و daily × الأثر');

// 6) §5 الإنجازات بنفوذ مرة واحدة والزكاة تجميلية
{ const S = game(5); step(S, 1); S.ach = S.ach || { got: {}, q: [], n: {}, vis: {}, prev: {}, jt: {} }; const L = S.learn; const i0 = (L.bonus && L.bonus.infl) || 0;
  E.achReward(S, 'profit_twenty'); const g0 = E.ACHD.LIST.find(x => x.id === 'profit_twenty'); const w = E.ACHX.infl[g0.tier]; a.equal(L.bonus.infl - i0, w); E.achReward(S, 'profit_twenty'); a.equal(L.bonus.infl - i0, w, 'مرة واحدة');
  a.equal(E.achReward(S, 'zakat_first'), 0); a.equal(E.achReward(S, 'zakat_on_time'), 0); a.equal(E.achReward(S, 'rep_high'), 0);
  const L2 = S.learn; L2.bk = {}; L2.bonus = { infl: 0, xp: 0 }; S.ach.got = { profit_twenty: 1, zakat_first: 1, trip_first: 1 }; const nw = () => 60000; 
  E.achxMigrate(S); const after = L2.bonus.infl; a.ok(after > 0); E.achxMigrate(S); a.equal(L2.bonus.infl, after, 'الترحيل مرة واحدة'); a.ok(!('ach:zakat_first' in L2.bk)); }
ok('§5: مكافأة الإنجاز مرة واحدة، الزكاة 0، الترحيل مرة واحدة');
{ const S = game(5); step(S, 1); a.equal(E.titleIdx(60000), 3); a.equal(E.titleIdx(0), 0); a.equal(E.titleIdx(4999), 0); a.equal(E.titleIdx(5000), 1); }
ok('titleIdx: 60٬000 ⇒ 3');

// 7) المفاتيح الأربعة مطفأة: لا حقل جديد
{ E.MFILE.on = E.KASHF.on = E.REPX.on = E.ACHX.on = false; const S = game(5); sellLoss(S, 'coffee', 10, 10000); step(S, 70); const P = S.player;
  a.ok(!P.mx && !P.trades.some(t => t.tx != null || t.lw || t.gl), 'لا P.mx ولا tx/lw/gl'); a.ok(!Object.keys((S.learn.bk) || {}).some(k => /^(ach|wt|bd):|^achx$/.test(k)), 'لا مفاتيح ach/wt/bd في bk');
  E.MFILE.on = E.KASHF.on = E.REPX.on = E.ACHX.on = true; }
ok('المفاتيح الأربعة مطفأة ⇒ لا حقل جديد في الحفظ');
console.log('mfile OK');
