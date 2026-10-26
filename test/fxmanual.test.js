// الصرف اليدوي من المستوى ٤ (المشتريات تُدفع بعملة السوق)، والصرف التلقائي برسم أعلى، والمبتدئ حرّ: node test/fxmanual.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, level, fix) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = level; S.learn.intro = Math.max(S.learn.intro, level); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); if (fix) fix(S); return S; };
const abroad = S => { const car = S.player.caravans[0], c = S.order.find(i => S.cities[i].country !== 'sa'); car.city = c; car.left = 0; return { car, c }; };
const w = (S, sar, usd) => { S.player.wallet.sar = sar; S.player.wallet.usd = usd; S.player.wallet.au = 0; S.player.wallet.ag = 0; };
// ١ المبتدئ (مستوى ١): تلقائي كما كان
{ const S = mk(11, 1); const { car } = abroad(S); w(S, 5000, 0); ok(E.fxMode(S) === 'free', 'مستوى ١: الوضع حرّ');
  const r = A.buy(S, car.id, 'wheat', 5); ok(r.ok && S.player.wallet.usd < 0.0001 && S.player.wallet.sar < 5000, 'المبتدئ يشتري في بلد أجنبي بالريال فقط (تحويل تلقائي)'); }
// ٢ المستوى ٤: يدوي
{ const S = mk(11, 4); const { car, c } = abroad(S); w(S, 5000, 0); ok(E.fxMode(S) === 'manual', 'مستوى ٤: الوضع يدوي');
  const mi = E.marketInfo(S, c, car.id).goods.find(x => x.g === 'wheat');
  ok(mi.limit === 'wallet' && mi.walletCur === 'usd' && mi.canCar === 0, 'في بلد أجنبي بلا دولار: الحدّ «محفظة» وعملتها الدولار');
  const sar0 = S.player.wallet.sar, r = A.buy(S, car.id, 'wheat', 5);
  ok(!r.ok && Math.abs(S.player.wallet.sar - sar0) < 1e-9, 'الشراء مرفوض ولا يُسحب الريال تلقائياً');
  ok(E.buyBudget(S, c) === 0, 'ميزانية الشراء هناك صفر');
  const ex = A.exchange(S, 'sar', 'usd', 1500); ok(ex.ok, 'يحوّل من الصرافة يدوياً');
  const r2 = A.buy(S, car.id, 'wheat', 5); ok(r2.ok && r2.n === 5, 'بعد التحويل يشتري');
  // السعودية بدولار فقط
  const home = S.order.find(i => S.cities[i].country === 'sa'); car.city = home; w(S, 0, 400);
  ok(E.marketInfo(S, home, car.id).goods.find(x => x.g === 'wheat').limit === 'wallet' && !A.buy(S, car.id, 'wheat', 2).ok, 'في السعودية بدولار فقط: يلزم تحويله إلى ريال'); }
// ٣ غير المشتريات تبقى تلقائية
{ const S = mk(11, 4); const { car } = abroad(S); const home = S.order.find(i => S.cities[i].country === 'sa'); car.city = home; w(S, 0, 400);
  const r = A.hireGuard(S, car.id); ok(r.ok, 'التوظيف (ليس شراء سلع) يبقى بالصرف التلقائي'); }
// ٤ الصرف التلقائي برسم أعلى
{ const mkAuto = (mode) => { const S = mk(11, 4, S0 => { if (mode === 'penalty') S0.learn.fxAuto = true; if (mode === 'free') S0.fxFree = true; }); const { car } = abroad(S); w(S, 5000, 0); const e0 = S.player.led.exp.exchange || 0; const r = A.buy(S, car.id, 'wheat', 20); return { r, fee: (S.player.led.exp.exchange || 0) - e0, mode: E.fxMode(S) }; };
  const f = mkAuto('free'), p = mkAuto('penalty');
  ok(f.mode === 'free' && p.mode === 'penalty' && f.r.ok && p.r.ok, 'الوضعان يشتريان تلقائياً');
  ok(p.fee > f.fee * 4 && p.fee < f.fee * 9, 'رسم التحويل الفوري في وضع «برسم» نحو ٥ أضعاف المعتاد (' + p.fee.toFixed(1) + ' مقابل ' + f.fee.toFixed(1) + ')'); }
// ٥ اللاعب الآلي حرّ
{ const S = mk(11, 7, S0 => { S0.fxFree = true; }); const { car } = abroad(S); w(S, 5000, 0); ok(E.fxMode(S) === 'free' && A.buy(S, car.id, 'wheat', 3).ok, 'علامة fxFree تعيد الوضع الحرّ'); }
// ٦ لعبة بلا شخصية (الضغط) حرّة
{ const S = E.newGame(5); ok(E.fxMode(S) === 'free', 'بلا شخصية: حرّ (لا يتأثر اختبار الضغط)'); }
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
