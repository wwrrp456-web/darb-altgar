// 055 تعديل الحصّالة (محرك): المطفأ حرفاً (بصمة من origin/main)، الوعاء الموسّع، الصكوك، دفتر قديم، «من كل ربح»، عدم الازدواج، الزكاة والملك: node test/vault-plus.test.js
const E = require('../src/engine.js'), A = E.A, crypto = require('node:crypto'), sim = require('./lib/vault-plus-sim.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; }, near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const mk = (x, pct = 10, mode = 'year') => { E.VAULT.x = x; const S = E.newGame(7); A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.noShocks = true; S.noEvents = true; S.player.wallet.sar = 10000; const r = A.savingsPlan(S, true, pct, mode); if (!r.ok) throw Error(r.msg); return S; };
const inc = (S, k, v) => { S.player.led.inc[k] = (S.player.led.inc[k] || 0) + v; };

// أ) المطفأ: بصمة مأخوذة من origin/main (c5fb096) قبل الحزمة
E.VAULT.x = false;
{ const o = sim(E), sha = crypto.createHash('sha1').update(o.save).digest('hex'), sv = JSON.parse(o.save);
  ok(o.vault === 209.91433351367536 && o.sar === 292768.6257304029 && sha === 'd6df0ab88a4d7c282f4da8b14ca2a6252b796bff', 'المطفأ: P.vault وP.wallet.sar وبصمة P.save مطابقة لـmain (' + o.vault + ' / ' + o.sar + ')');
  ok(!('mb' in sv) && !(sv.book && 'x' in sv.book), 'المطفأ: لا mb ولا book.x في الحفظ');
  const S = mk(false); ok(A.savingsPlan(S, true, 10, 'all').ok === false && /اختر نسبة وطريقة ادخار صحيحتين/.test(A.savingsPlan(S, true, 10, 'all').msg), 'المطفأ: الوضع all مرفوض بالرسالة الحالية');
  const S2 = mk(false); S2.player.save.mode = 'all'; ok(E.vaultQuote(S2).plan.mode === 'sale', 'المطفأ: mode all من حفظ مضاء يُقرأ sale'); }

// ب) الوعاء الموسّع
{ const a = mk(false), b = mk(true); for (const S of [a, b]) { inc(S, 'projectIncome', 1000); inc(S, 'oppRent', 200); }
  E.VAULT.x = false; const qa = E.vaultYearQuote(a, a.player.save); E.VAULT.x = true; const qb = E.vaultYearQuote(b, b.player.save);
  ok(near(qb.profit - qa.profit, 1200) && near(qb.proposed - qa.proposed, 120), 'الوعاء الموسّع: profit +1200 وproposed +120: ' + (qb.profit - qa.profit) + ' / ' + (qb.proposed - qa.proposed)); }

// ج) الصكوك بلا ازدواج
for (const x of [false, true]) { const S = mk(x), p0 = E.vaultYearQuote(S, S.player.save).profit; inc(S, 'sukukProfit', 300); inc(S, 'bonds', 5000);
  ok(near(E.vaultYearQuote(S, S.player.save).profit - p0, 300), 'الصكوك: الربح 300 يدخل مرة واحدة وinc.bonds لا يدخل (VAULT.x=' + x + ')'); }

// د) دفتر قديم
{ const S = mk(false); E.VAULT.x = true; const book = S.player.save.book; ok(book && !book.x, 'دفتر قديم بلا x'); inc(S, 'projectIncome', 5000);
  const n0 = book.net0, before = E.vaultYearQuote(S, S.player.save).profit; E.vaultMigrate(S);
  ok(near(S.player.save.book.net0 - n0, 5000) && S.player.save.book.x === 1, 'بعد التحميل: net0 +5000 وbook.x = 1');
  ok(near(E.vaultYearQuote(S, S.player.save).profit, before - 5000), 'profit بعد التهيئة بلا دخل المشاريع التاريخي'); }

// هـ) «من كل ربح»
function month(S) { const k0 = E.vaultMonthKey(S); for (let i = 0; i < 40 && E.vaultMonthKey(S) === k0; i++) { E.tick(S); S.pause = false; } return E.vaultMonthKey(S) !== k0; }
{ const S = mk(true, 10, 'all'), P = S.player; ok(!!P.save.mb && P.save.mode === 'all', 'فتح all يكتب mb'); P.wallet.sar = 10000;
  inc(S, 'realized', 500); inc(S, 'projectIncome', 500); P.led.exp.debtPaid = (P.led.exp.debtPaid || 0) + 100; const v0 = P.vault || 0, cnt = () => S.news.filter(n => /حصّالة الشهر/.test(n.t)).length, news0 = cnt();
  const q = E.vaultMonthQuote(S); ok(q.gain === 1000 && q.debt === 100 && near(q.amount, 90), 'معاينة الشهر: أرباح 1000 وسداد 100 ← 90');
  ok(month(S), 'انتقل الشهر'); const mb = P.save.mb;
  ok(near((P.vault || 0) - v0, 90, 1e-6) && mb.last && mb.last.gain === 1000 && mb.last.debt === 100 && near(mb.last.dep, 90) && mb.last.short === 0, 'إيداع (1000 − 100) × 10٪ = 90، و mb.last = ' + JSON.stringify(mb.last));
  ok(cnt() - news0 === 1, 'خبر واحد');
  const v1 = P.vault, n1 = cnt(); month(S); ok(P.vault === v1 && cnt() === n1, 'شهر بلا ربح: لا إيداع ولا خبر'); }
{ const S = mk(true, 10, 'all'), P = S.player; inc(S, 'realized', 1000); const v0 = P.vault || 0; P.save.mb.k -= 1; P.wallet.sar = 250; E.vaultMonthDay(S);
  ok(near((P.vault || 0) - v0, 50) && near(P.save.mb.last.short, 50), 'رصيد 250 ← dep 50: ' + (P.vault - v0) + ' و short ' + P.save.mb.last.short + ' (الربح 1000 ← due 100)'); }

// و) لا ازدواج
{ const S = mk(true, 10, 'all'), P = S.player, car = P.caravans[0], c = S.cities[car.city], g = E.GIDS.find(x => E.sells(c, x) && !E.GD[x].sp && !E.GD[x].live);
  P.wallet.sar = 50000; P.gold = 50000; const b = A.buy(S, car.id, g, 20); c.idx[g] = Math.min(1.25, c.idx[g] * 1.2); const r = A.sell(S, car.id, g, 20); ok(b.ok && r.ok, 'بيع يدوي أُجري');
  ok(!(r.saved > 0) && (P.vault || 0) === 0, 'all: البيع اليدوي لا يودع فوراً'); for (let d = 0; d < 360; d++) { E.tick(S); S.pause = false; }
  ok((P.save.years || []).length >= 1, 'سجل years يُكتب في all'); }

// ز) الزكاة والملك
{ const S = mk(true, 10, 'all'), P = S.player; P.wallet.sar = 10000; inc(S, 'realized', 1000); P.save.mb.k -= 1;
  const z0 = E.zakatBase(S).cash, nw0 = E.netWorth(S), sar0 = P.wallet.sar; E.vaultMonthDay(S);
  ok(P.vault > 0 && near(E.zakatBase(S).cash, z0) && near(E.netWorth(S), nw0), 'الإيداع: zakatBase.cash وnetWorth بلا تغيير (' + P.vault + ')');
  const w0 = P.wallet.sar, d = A.vaultDraw(S, P.vault); ok(d.ok && near(P.wallet.sar - w0, d.amount) && P.vault === 0, 'vaultDraw يعيد المال'); }
E.VAULT.x = true;
console.log(fails ? '\nFAILS: ' + fails : '\nكل الاختبارات نجحت'); process.exit(fails ? 1 : 0);
