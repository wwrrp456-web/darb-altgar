'use strict';
// 042 «حال أعمالي» (المحرك): اللقطات الأسبوعية P.hs، أرقام hsView تطابق مصادرها، السطر بلا بيانات يُخفى، والإطفاء بلا أي حقل جديد
const a = require('node:assert/strict'), { E, load, rich, run, hash } = require('./lib/skill-sim.js'), H = E.HOMEST, A = E.A;
const ok = m => console.log('OK   ' + m), hs0 = H.on, sum = o => Object.values(o).reduce((x, y) => x + y, 0);
try {
  a.deepEqual({ on: H.on, rows: H.rows, snapDays: H.snapDays, ring: H.ring }, { on: true, rows: 5, snapDays: 7, ring: 5 });
  // ١) المطفأ: لا P.hs، وحالة اللعبة بعد 60 يوماً مطابقة حرفياً للمفتوح بعد حذف P.hs منه (لا أثر جانبي آخر)
  { H.on = false; const S = run(rich(load()), 60), j = E.save(S); a.ok(!('hs' in JSON.parse(j).player), 'لا P.hs في الحفظ'); a.equal(S.player.hs, undefined); a.equal(E.hsView(S), null, 'hsView null عند الإطفاء');
    H.on = true; const T = run(rich(load()), 60); a.ok(Array.isArray(T.player.hs) && T.player.hs.length > 0, 'مفتوح: اللقطات تُكتب'); delete T.player.hs; a.equal(hash(T), hash(S), 'المفتوح بلا P.hs = المطفأ حرفياً'); }
  ok('HOMEST.on=false: لا P.hs ولا أثر جانبي (بصمة 60 يوماً)');
  // ٢) اللقطات: أسبوعية، حلقة ≤ ring، تقيس إجمالي الدفتر، والحفظ القديم (بلا P.hs) يعمل ويبدأ فارغاً
  { H.on = true; const S0 = load(); a.equal(S0.player.hs, undefined, 'الحفظ القديم بلا P.hs'); const S = run(S0, 70), hs = S.player.hs;
    a.ok(hs.length === H.ring, 'الحلقة ممتلئة: ' + hs.length); a.ok(hs.every(s => s.d % 7 === 0), 'لقطات أيام مضاعفات 7'); a.deepEqual(hs.map(s => s.d), hs.map(s => s.d).slice().sort((x, y) => x - y)); a.equal(hs[1].d - hs[0].d, 7);
    const last = hs[hs.length - 1]; a.ok(Math.abs(sum(last.inc) - (Object.values(last.inc).reduce((x, y) => x + y, 0))) < 1e-9); a.ok(last.d <= S.day);
    const R = E.loadChecked(E.save(S)); a.ok(R.ok); a.deepEqual(R.S.player.hs, hs, 'يُحفظ ويُحمَّل'); run(R.S, 8); a.ok(R.S.player.hs.length <= H.ring); }
  ok('اللقطات الأسبوعية: حلقة ' + H.ring + '، تُحفظ، والحفظ القديم يبدأ فارغاً');
  // ٣) «آخر 30 يوماً»: الصافي = الدخل − المصروف بفرق لقطة؛ وقبل اكتمالها «منذ البداية»
  { const S = load(); delete S.player.hs; let v = E.hsLedger(S); a.equal(v.since, 'start'); a.equal(v.days, null); const L = S.player.led;
    a.ok(Math.abs(v.inc - sum(L.inc)) < 1e-6 && Math.abs(v.exp - sum(L.exp)) < 1e-6 && Math.abs(v.net - (sum(L.inc) - sum(L.exp))) < 1e-6, 'منذ البداية = إجمالي الدفتر');
    run(S, 40); const hs = S.player.hs, snap = hs.filter(s => S.day - s.d >= 28).pop(); a.ok(snap, 'لقطة بعمر ≥ 28'); v = E.hsLedger(S); a.equal(v.since, 'days'); a.equal(v.days, S.day - snap.d); a.ok(v.days >= 28 && v.days <= 34);
    const L2 = S.player.led, inc = sum(L2.inc) - sum(snap.inc), exp = sum(L2.exp) - sum(snap.exp); a.ok(Math.abs(v.net - (inc - exp)) < 1, 'الصافي بفرق اللقطة'); a.ok(Math.abs(v.inc - inc) < 1 && Math.abs(v.exp - exp) < 1);
    a.ok(v.rows.length <= 6 && v.rows.every((r, i, ar) => !i || Math.abs(ar[i - 1].v) >= Math.abs(r.v)), 'أكبر ستة بنود مرتبة'); const top = v.rows[0], k = top.k; a.ok(Math.abs(top.v - (top.side === 'inc' ? 1 : -1) * ((L2[top.side][k] || 0) - (snap[top.side][k] || 0))) < 1, 'البند من مصدره');
    a.ok(Math.abs(v.rows.reduce((t, r) => t + r.v, 0) + v.other - v.net) < 1, 'البنود + غيرها = الصافي'); }
  ok('الدفتر: الصافي بفرق لقطتين ومنذ البداية قبل الاكتمال، وأكبر ستة بنود مجموعها مع «غيرها» = الصافي');
  // ٤) الأسطر تطابق مصادرها، والسطر بلا بيانات يُخفى
  { const S = run(rich(load()), 20); const v = E.hsView(S); a.ok(v);
    const fv = E.fundView(S, v.fund.city); a.equal(v.fund.bal, fv.bal); a.equal(v.fund.ruler, fv.ruler); a.ok(E.shopsOf(S, v.fund.city).length > 0 || v.fund.mine);
    const sm = E.scSummary(S); a.equal(v.shops.list.length, sm.n); a.equal(v.shops.good, sm.good); a.equal(v.shops.good + v.shops.bad + v.shops.mid, sm.n); a.equal(v.liq, null, 'بلا ودائع: لا سطر سيولة');
    const P = S.player; P.bank.dep = { hail: 50000 }; const lv = E.liqView(S), v2 = E.hsView(S); a.ok(v2.liq); a.equal(v2.liq.days, lv.days); a.equal(v2.liq.low, lv.low); a.equal(v2.liq.cash, lv.cash);
    const rv = E.rivalGenView(S), mine = Object.keys(P.props), want = rv.list.filter(r => (S.rivals.find(x => x.id === r.id).fx.cities || []).some(c => mine.includes(c))).length; a.equal(v.rivals ? v.rivals.list.length : 0, want, 'المنافسون في مدنك');
    if (v.rivals) a.ok(v.rivals.list.every(r => r.str <= v.rivals.top.str + 1e-9), 'الأول هو الأقوى');
    S.rivals = []; a.equal(E.hsView(S).rivals, null, 'بلا منافسين: لا سطر');
    P.bank.dep = {}; S.player.props.hail.shops = []; a.equal(E.hsView(S), null, 'بلا دكان ولا وديعة: لا بطاقة'); }
  ok('كل سطر يطابق مصدره (صندوق، دكاكين، سيولة، منافسون) والسطر الفارغ يُخفى والبطاقة تُخفى قبل أول دكان/وديعة');
  // ٥) الدكان المتهالك: الحالة من 040هـ، والترميم الفعلي يغيّر الحالة والذهب ويختفي من «متهالك»
  { const S = run(rich(load()), 5), P = S.player, city = Object.keys(P.props)[0], sh = P.props[city].shops.find(x => E.shKind(x) === 'own'); sh.cond = 52; let v = E.hsShops(S); a.equal(v.bad, 1); const x = v.list.find(y => y.id === sh.id); a.equal(x.cond, 52); a.equal(x.name, 'مقبولة'); a.equal(x.cost, E.scQuote(S, city, sh.id).cost); a.ok(x.can);
    const g0 = P.gold; const r = A.shopRepair(S, city, sh.id); a.ok(r.ok); v = E.hsShops(S); a.equal(v.bad, 0); a.equal(v.list.find(y => y.id === sh.id).cond, E.SHOPCOND.repairTo); a.ok(Math.abs(g0 - P.gold - x.cost) < 1e-6, 'الذهب نقص بالتكلفة'); }
  ok('الدكان المتهالك: العدّ من الحالة، والترميم يغيّر الحالة والذهب');
  // ٦) الأداء: لا حلقة يومية سوى اللقطة؛ hsView لا يغيّر الحالة
  { const S = run(rich(load()), 30), j0 = E.save(S); E.hsView(S); E.hsLedger(S); a.equal(E.save(S), j0, 'القراءة لا تكتب'); }
  ok('hsView قراءة فقط');
} finally { H.on = hs0; }
console.log('home-status: كل الفحوص نجحت');
