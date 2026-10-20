// الفضة وعملات الدول (محرك فقط): node test/silver.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
let S = E.newGame(11);
ok(S.player.wallet.ag === 0 && S.fx.silver > 2 && S.fx.silver < 6, 'محفظة فضة صفر وسعر غرام الفضة ' + S.fx.silver);
const ratios = []; for (let i = 0; i < 400; i++) { E.tick(S); ratios.push(S.fx.gold / S.fx.silver); }
ok(Math.min(...ratios) > 65 && Math.max(...ratios) < 105, 'نسبة الذهب إلى الفضة بين ' + Math.min(...ratios).toFixed(0) + ' و' + Math.max(...ratios).toFixed(0));
ok(S.fx.hs.length >= 2 && S.fx.hs.length <= 60, 'سجل سعر الفضة محدود');
// التحويل
S = E.newGame(12); S.player.wallet.sar = 1000; const r = A.exchange(S, 'sar', 'ag', 600), w = S.player.wallet;
ok(r.ok && near(w.ag, 600 * (1 - 0.015) / S.fx.silver, 1e-6) && near(w.sar, 400), 'ريال ← فضة برسم 1.5٪ (' + w.ag.toFixed(2) + ' غ)');
const liq = E.liquid(S); ok(near(liq, 400 + w.ag * S.fx.silver, 1e-6), 'السيولة تحسب الفضة بسعرها');
const back = A.exchange(S, 'ag', 'sar', w.ag); ok(back.ok && S.player.wallet.ag < 1e-9 && S.player.wallet.sar < 1000, 'فضة ← ريال برسم ثانٍ');
ok(E.feeOf('ag', 'sar') === 0.015 && E.feeOf('sar', 'usd') === 0.01, 'رسم المعدنين 1.5٪ والدولار 1٪');
// الدفع يستعمل الفضة عند نقص غيرها
S = E.newGame(13); S.player.wallet.sar = 0; S.player.wallet.ag = 100; const g0 = S.player.gold; S.player.gold = g0 - 50; ok(S.player.wallet.ag < 100 && S.player.wallet.ag > 0, 'خصم الريال المعادل يسحب من الفضة (' + S.player.wallet.ag.toFixed(2) + ')');
// ترحيل حفظ قديم بلا فضة
S = E.newGame(14); const old = JSON.parse(E.save(S)); delete old.player.wallet.ag; delete old.fx.silver; delete old.fx.hs; const L = E.load(JSON.stringify(old));
ok(L.player.wallet.ag === 0 && L.fx.silver > 0 && Array.isArray(L.fx.hs), 'حفظ قديم بلا فضة يُرحَّل: ' + L.fx.silver);
// الزكاة
S = E.newGame(15); A.learnSetChar(S, 'trader'); S.player.wallet.ag = 1000; const b = E.zakatBase(S);
ok(near(b.nisabAg, 595 * S.fx.silver, 1e-6) && b.cash >= 1000 * S.fx.silver, 'الزكاة: نصاب الفضة ' + Math.round(b.nisabAg) + ' ونقد يشمل الفضة');
ok(b.nisab > b.nisabAg * 5, 'نصاب الذهب أكبر كثيراً من نصاب الفضة (' + Math.round(b.nisab) + ' مقابل ' + Math.round(b.nisabAg) + ')');
// عملات الدول
ok(['sa', 'eg', 'ir', 'in', 'cn'].every(c => E.LOCAL[c] && E.LOCAL[c].unit), 'عملة لكل دولة');
ok(E.localRate({ day: 5 }, 'sa') === 1, 'الريال أساس الحساب');
for (const c of ['eg', 'ir', 'in', 'cn']) { const v = []; for (let d = 0; d < 800; d += 7) v.push(E.localRate({ day: d }, c)); const base = E.LOCAL[c].base; ok(Math.min(...v) > base * 0.9 && Math.max(...v) < base * 1.1 && new Set(v.map(x => x.toFixed(3))).size > 20, c + ': سعر صرف متحرك حول ' + base); }
// لا يمسّ العشوائية العامة
const a1 = E.newGame(21), a2 = E.newGame(21); for (let i = 0; i < 50; i++) { E.tick(a1); E.tick(a2); } ok(JSON.stringify(a1.fx) === JSON.stringify(a2.fx), 'الحركة حتمية لنفس البذرة');
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
