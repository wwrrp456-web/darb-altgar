// WP-07: من أول فتح (?player=1) إلى أول بيع رابح: حكاية قصيرة، صفقة رابحة دائماً، بطاقة أول ربح. node test/first-profit.test.js
const path = require('node:path'), assert = require('node:assert/strict'), { chromium } = require('/opt/node-tools/node_modules/playwright'), measure = require('./lib/first-profit.js');
const MAX_PRESSES = 30, MAX_DAYS = 5; // بوضع اللاعب الكامل (WP-01ب) تشمل الضغطات زر التشغيل وإغلاق دفتر عمّ سالم: أقصى قياس ٢٧ على ٢٠ بذرة، والأيام ٤
const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch();
  try {
    for (const seed of [1, 3, 8, 13, 20]) {
      const r = await measure(b, seed);
      assert.deepEqual(r.errs, [], 'بذرة ' + seed + ': أخطاء JS');
      assert.equal(r.sold, true, 'بذرة ' + seed + ': لم يحدث بيع (' + (r.err || '') + ')');
      assert.ok(r.pl > 0, 'بذرة ' + seed + ': أول بيع لم يربح (' + r.pl + ')');
      assert.ok(r.presses <= MAX_PRESSES && r.days <= MAX_DAYS, `بذرة ${seed}: ضغطات ${r.presses} أيام ${r.days}`);
      assert.equal(r.road, false, 'لا لصوص قبل أول بيع'); assert.equal(r.shock, false, 'لا صدمات قبل أول بيع');
      assert.match(r.rcpt, /أول ربح/); assert.ok(r.rcpt.includes(String(Math.round(r.pl))), 'رقم الربح ظاهر في البطاقة'); assert.equal(r.rcptClosed, true, 'البطاقة تُغلق بلمسة');
      assert.ok(r.rcpt.length < 120, 'بطاقة قصيرة');
      ok(`بذرة ${seed}: ربح ${r.pl} ريال بعد ${r.presses} ضغطة و${r.days} أيام، وبطاقة أول ربح تُغلق بلمسة`);
      if (seed === 1) { assert.equal(r.dots, 7, 'الحكاية القصيرة: ٣ مقاطع + الدولة + الاسم + السؤال + الشخصية'); assert.equal(r.hist, true, 'المقطع المحذوف محفوظ في دفتر «ما قاله»'); ok('الحكاية القصيرة ٣ مقاطع قبل الدولة والاسم، والمحذوف في دفتر «ما قاله»'); }
    }
    const long = await measure(b, 1, { init: () => localStorage.setItem('darb-ui', JSON.stringify({ longStory: true })) });
    assert.equal(long.dots, 8, 'ui.longStory يعيد الحكاية كاملة (٤ مقاطع)'); assert.ok(long.sold && long.pl > 0); assert.equal(long.hist, false, 'الحكاية الكاملة لا تكرّر المقطع في الدفتر'); ok('ui.longStory يعيد الحكاية الكاملة');
    // التفتيش مرة واحدة: سفر يدوي إلى المدينة المقترحة لا يُعيد اقتراح التفتيش
    const sc = await measure(b, 3, { stopWhen: /صفقة مأمونة/, keepOpen: true }), g = sc.page; g.on('pageerror', e => errors.push(e.message));
    assert.equal(sc.stopped, true, 'بذرة 3 تقترح التفتيش');
    const info = await g.evaluate(() => { const { S, E } = __game, m = S.player.caravans[0], f = __game.tutScoutCity(); return { dest: f.d, from: m.city }; });
    await g.evaluate(d => { const { S, E } = __game, m = S.player.caravans[0]; if (!E.A.travel(S, m.id, d, 0).ok) throw Error('travel'); let n = 0; while (m.left > 0 && n++ < 30) { E.tick(S, false); S.pause = false; } __game.renderAll(true); }, info.dest);
    // نُفرغ مخزون مدينة الوصول كي لا توجد فيها صفقة؛ فلولا الحارس لعاد المرشد يقترح التفتيش (tutScoutCity ما زالت ترى سوقاً واعداً)
    await g.evaluate(() => { const { S, E } = __game; for (const x of E.GIDS) S.cities[S.player.caravans[0].city].stock[x] = 0; __game.renderAll(true); });
    assert.ok(await g.evaluate(() => !!__game.tutScoutCity()), 'شرط الاختبار: ما زال هناك سوق واعد يُقترح لولا الحارس');
    const after = await g.evaluate(() => ({ trips: __game.S.player.trips, city: __game.S.player.caravans[0].city, again: !!__game.tutScoutCity(), msg: (document.querySelector('#mission .bub') || {}).innerText || '' }));
    await g.evaluate(() => __game.salem(true, 'mission')); await g.waitForTimeout(150);
    const msg = await g.evaluate(() => (document.querySelector('#mission .bub') || {}).innerText || '');
    assert.equal(after.city, info.dest); assert.equal(after.trips, 1); assert.ok(!/صفقة مأمونة/.test(msg), 'لا تفتيش ثانٍ بعد السفر اليدوي: ' + msg.slice(0, 80));
    ok('سفر يدوي إلى مدينة التفتيش لا يُعيد اقتراحه (ولا يعود إلى ' + info.from + ')');
    await g.context().close();
    // بيع جزئي أول مرة: بطاقة أول ربح تحمل «تعذّر بيع» والحصّالة
    const q = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage(); q.on('pageerror', e => errors.push(e.message));
    await q.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3'); await q.waitForFunction(() => !!window.__game);
    await q.evaluate(() => { const { S, E } = __game; E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 11, intro: 11, stage: 23, stageIntro: 22, free: true, welcome: 99, datePend: false, stageUp: [] }); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq'].forEach(k => S.learn[k] = []); const m = S.player.caravans[0]; m.cargo = { wool: 3, sheep: 1 }; m.basis = { wool: { q: 3, c: 1 }, sheep: { q: 1, c: 1 } }; const sell = E.A.sell; E.A.sell = (S2, id, g2, k) => g2 === 'sheep' ? { ok: false, msg: 'ممنوع' } : sell.call(E.A, S2, id, g2, k); __game.go('market'); });
    await q.waitForTimeout(300); await q.locator('[data-act=sellall]').first().click(); await q.waitForTimeout(200);
    const card = await q.evaluate(() => document.getElementById('rcpt').innerText);
    assert.match(card, /أول ربح/); assert.match(card, /تعذّر بيع/); assert.match(card, /غنم/);
    ok('بيع جزئي أول مرة: بطاقة أول ربح تُظهر «تعذّر بيع: غنم»');
    await q.context().close();
    console.log('OK first-profit');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
