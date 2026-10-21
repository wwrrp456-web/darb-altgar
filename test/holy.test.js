// مكة المكرمة والمدينة المنورة: بيانات المدينتين وزعيماهما وقصصهما وحواراتهما ومواسم الحج وعكاظ: node test/holy.test.js
const E = require('../src/engine.js'), A = E.A, Lore = require('../src/lore.js'), Dlg = require('../src/dialogs.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(3);
ok(S.order.length === 18 && S.cities.mecca && S.cities.medina && S.cities.mecca.country === 'sa' && S.cities.medina.country === 'sa', 'ثماني عشرة مدينة منها مكة والمدينة في السعودية');
ok(S.bosses.mecca && S.bosses.medina && /المكّي/.test(S.bosses.mecca.name) && /المدني/.test(S.bosses.medina.name), 'لكل مدينة زعيم سوق باسمه');
ok(!S.cities.mecca.sig && !S.cities.medina.sig, 'المدينتان بلا منتج خاص (لا سلعة جديدة)');
ok(E.sells(S.cities.medina, 'dates') && E.sells(S.cities.mecca, 'leather') && E.sells(S.cities.mecca, 'wheat'), 'ما تبيعه المدينتان');
// الموقع: مكة قرب جدة، والمدينة شمالها، وبين الاثنتين طريق بري قصير
const d = (a, b) => Math.hypot(S.cities[a].x - S.cities[b].x, S.cities[a].y - S.cities[b].y);
ok(d('mecca', 'jeddah') >= 10 && d('mecca', 'jeddah') <= 25 && S.cities.medina.y < S.cities.mecca.y && d('mecca', 'medina') > 40, 'مكة قرب جدة ومتباعدة عنها بما يكفي للرسم، والمدينة شمال مكة');
ok(E.routePath('mecca', 'medina', false) && E.routePath('jeddah', 'mecca', false) && !E.routePath('mecca', 'medina', true), 'طريق بري بين المدينتين ولا بحر (لا ميناء)');
const car = { ...S.player.caravans[0], city: 'jeddah' }; ok(E.tripDays(S, car, 'jeddah', 'mecca') <= 2, 'جدة ← مكة رحلة قصيرة (' + E.tripDays(S, car, 'jeddah', 'mecca') + ' يوم)');
// القصص والأسرار
for (const id of ['mecca', 'medina']) {
  const lo = Lore.BOSS_LORE[id], sc = Lore.CITY_SECRETS[id];
  ok(lo && lo.ch.length === 3 && lo.tip && lo.likes && lo.dislikes && ['gen', 'stern', 'patient'].includes(lo.style), id + ': قصة الزعيم بفصولها الثلاثة وطبعه');
  ok(sc && sc.title && sc.text && sc.lesson && /٪/.test(sc.perkText), id + ': سرّ السوق وفائدته');
  const g = Dlg.DIALOGS[id + '_boss'], opts = JSON.stringify(g.nodes.hub.opts);
  ok(g && Dlg.DIALOGS[id + '_trader'] && Dlg.DIALOGS[id + '_salem'] && !/نقل الصنعة/.test(opts) && !/undefined/.test(JSON.stringify(g)), id + ': الحوارات كاملة بلا خيار نقل صنعة ولا نصوص ناقصة');
}
ok(Dlg.DIALOGS.medina_boss.nodes.product.say.startsWith('تمر المدينة هو ما تشتهر به') && Dlg.DIALOGS.mecca_boss.nodes.product.say.startsWith('أسواق الحجيج هي ما تشتهر به'), 'مطابقة الضمير في حوار السوق (تمر المدينة هو، أسواق الحجيج هي)');
ok(Lore.CITY_SECRETS.mecca.text.includes('رحلة الشتاء والصيف'), 'سرّ مكة يذكر رحلة الشتاء والصيف');
// المواسم: الحج أشدّ في مكة والمدينة، وعكاظ قبله
function world(seed) { const T = E.newGame(seed); A.learnSetChar(T, 'trader'); T.learn.level = 6; T.player.gold = 50000; return T; }
{ const T = world(8); E.dateOf(T, 0); T.day = E.dayOfHijri(T, 12, 9, 0);
  const mm = E.seasonMul(T, T.cities.mecca, 'wheat'), rm = E.seasonMul(T, T.cities.riyadh, 'wheat'), dm = E.seasonMul(T, T.cities.medina, 'dates'), cm = E.seasonMul(T, T.cities.cairo, 'wheat');
  ok(mm > rm && rm > 1 && dm > rm && cm === 1, 'طلب الحج في مكة (' + mm.toFixed(2) + ') والمدينة (' + dm.toFixed(2) + ') أعلى من الرياض (' + rm.toFixed(2) + ') ولا أثر في القاهرة');
  T.day = E.dayOfHijri(T, 11, 10, 0); ok(E.seasonNow(T).k === 'ukaz' && E.seasonMul(T, T.cities.mecca, 'leather') > 1 && E.seasonMul(T, T.cities.riyadh, 'leather') === 1 && E.seasonMul(T, T.cities.cairo, 'camel') === 1, 'سوق عكاظ قبل الحج: يرفع الجلود والإبل في الحجاز وحده');
  const U = world(9); E.dateOf(U, 0); U.day = E.dayOfHijri(U, 12, 8, 0) - 3; for (let i = 0; i < 5; i++) E.tick(U); ok(U.news.some(n => /وصلت قوافل الحجيج من مصر والشام والعراق/.test(n.t)), 'خبر وصول قوافل الحجيج عند بدء الموسم'); }
// حفظ قديم بلا المدينتين: تُضافان عند التحميل وتعمل اللعبة
{ const T = E.newGame(5); A.learnSetChar(T, 'trader'); const old = JSON.parse(E.save(T)); for (const id of ['mecca', 'medina']) { delete old.cities[id]; old.order = old.order.filter(x => x !== id); delete old.bosses[id]; delete old.player.known[id]; for (const k of Object.keys(old.risk)) if (k.split('|').includes(id)) delete old.risk[k]; }
  const L = E.load(JSON.stringify(old)); ok(L && L.cities.mecca && L.cities.medina && L.order.length === 18 && L.bosses.mecca && L.player.known.mecca && L.risk['jeddah|mecca'] != null, 'تحميل حفظ من ١٦ مدينة يضيف مكة والمدينة بسوقهما وزعيميهما');
  const car = L.player.caravans[0]; car.city = 'jeddah'; L.player.gold = 5000; ok(E.A.travel(L, car.id, 'mecca').ok, 'السفر إلى مكة في اللعبة المحمّلة');
  for (let i = 0; i < 20; i++) E.tick(L); ok(car.city === 'mecca' && Object.values(L.cities.mecca.stock).every(Number.isFinite), 'الوصول واستقرار السوق بلا قيم فاسدة'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
