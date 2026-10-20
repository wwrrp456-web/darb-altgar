// المساومة تختلف من سوق لسوق: ثقافة لكل دولة (محرك فقط): node test/haggle-culture.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const cs = Object.keys(E.HG_CULT), M = ['pleased', 'neutral', 'annoyed'], St = ['firm', 'ref', 'praise'];
ok(cs.length === 5 && ['sa', 'eg', 'ir', 'in', 'cn'].every(c => cs.includes(c)), 'ثقافة لكل دولة من الخمس');
const key = c => M.map(m => E.HG_CULT[c].best[m]).join('/');
ok(new Set(cs.map(key)).size === cs.length, 'لا ثقافتين بجدول أنسب واحد: ' + cs.map(key).join(' | '));
ok(cs.every(c => new Set(M.map(m => E.HG_CULT[c].best[m])).size === 3 && M.every(m => St.includes(E.HG_CULT[c].best[m]))), 'في كل سوق لكل أسلوب مزاج واحد يناسبه');
ok(cs.every(c => Math.abs(E.HG_CULT[c].step * E.HG_CULT[c].rounds - 0.06) < 1e-9), 'أقصى أثر ٦٪ في كل الأسواق (التوازن)');
ok(cs.every(c => E.HG_CULT[c].trait && M.every(m => E.HG_CULT[c].why[m])), 'لكل سوق وصف طبع وسبب لكل مزاج');
ok(E.HG_CULT.sa.best === E.HG_BEST, 'السعودية تبقى الأصل الذي بدأ به اللاعب');
// الجولات والأخطاء تتبع السوق، والمزاج يتبع أوزانه
const city = { sa: 'riyadh', eg: 'cairo', ir: 'isfahan', in: 'delhi', cn: 'xian' };
for (const c of cs) {
  const S = E.newGame(7); A.learnSetChar(S, 'trader'); S.learn.level = 5; S.player.gold = 90000; const car = S.player.caravans[0]; const id = city[c]; if (!S.cities[id]) { ok(false, 'مدينة ' + id + ' غير موجودة'); continue; }
  car.city = id; car.left = 0; const g = E.GIDS.find(x => x !== 'wheat' && E.sells(S.cities[id], x)); S.cities[id].stock[g] = 900;
  const r = A.haggleStart(S, g, 'buy', 40); if (!r.ok) { ok(false, c + ': ' + r.msg); continue; }
  const G = r.game, cu = E.HG_CULT[c];
  ok(G.cc === c && G.rounds === cu.rounds && G.maxMiss === cu.miss && G.moods.length === cu.rounds && G.culture === cu.name, c + ': اللعبة تأخذ جولات السوق وقواعده (' + G.rounds + ' جولات، ' + G.maxMiss + ' أخطاء)');
  for (let i = 0; i < G.rounds && !G.done; i++) A.haggleChoose(S, cu.best[G.moods[G.round]]);
  ok(G.done && G.wins === G.rounds && Math.abs(G.mul - (1 - cu.step * G.rounds)) < 1e-9, c + ': الإجابات الصحيحة تعطي خصم ' + Math.round((1 - G.mul) * 100) + '٪');
  const lore = (S.player.hgLore || {})[c] || {}; ok(Object.keys(lore).length >= 1 && Object.keys(lore).every(m => lore[m] === cu.best[m]), c + ': تُحفظ خبرة اللاعب بما انكشف');
}
// جواب سوق آخر خاطئ هنا: يُخطئ من يحفظ جدول السعودية في مصر
{ const S = E.newGame(9); A.learnSetChar(S, 'trader'); S.learn.level = 5; S.player.gold = 90000; const car = S.player.caravans[0]; car.city = 'cairo'; car.left = 0; const g = E.GIDS.find(x => x !== 'wheat' && E.sells(S.cities.cairo, x)); S.cities.cairo.stock[g] = 900;
  const G = A.haggleStart(S, g, 'buy', 40).game; let wrong = 0; for (let i = 0; i < G.rounds && !G.done; i++) { const r = A.haggleChoose(S, E.HG_BEST[G.moods[G.round]]); if (!r.right) wrong++; }
  ok(wrong >= 1 || G.moods.every(m => E.HG_BEST[m] === E.HG_CULT.eg.best[m]), 'من يحفظ جدول السعودية يخطئ في مصر'); }
// أثر الثقة على المزاج
{ const S = E.newGame(5); A.learnSetChar(S, 'trader'); const w0 = E.hgWeights(S, 'riyadh'); S.bosses.riyadh.trust = 40; const w1 = E.hgWeights(S, 'riyadh'); ok(w1[0] > w0[0] && w1[2] < w0[2], 'الثقة العالية ترفع المزاج الطيب وتخفض المنزعج'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
