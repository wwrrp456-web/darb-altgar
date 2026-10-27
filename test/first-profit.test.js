// WP-07: من أول فتح (?player=1) إلى أول بيع رابح: حكاية قصيرة، صفقة رابحة دائماً، بطاقة أول ربح. node test/first-profit.test.js
const assert = require('node:assert/strict'), { chromium } = require('/opt/node-tools/node_modules/playwright'), measure = require('./lib/first-profit.js');
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
    console.log('OK first-profit');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
