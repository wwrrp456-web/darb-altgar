// التقويم وتاريخ البداية وقائمة السنوات (واجهة): node test/calendar-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const t = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    // اختيار الشخصية بالضغط الحقيقي على زرّ lchar
    await p.evaluate(() => { const bt = document.createElement('button'); bt.dataset.act = 'lchar'; bt.dataset.g = 'trader'; document.body.appendChild(bt); bt.click(); bt.remove(); }); await p.waitForTimeout(500);
    const txt = await p.locator('#lesson').innerText();
    ok(/متى تبدأ رحلتك/.test(txt) && /تاريخ اليوم على جهازك/.test(txt) && /هـ/.test(txt) && /م/.test(txt), t + 'بعد الشخصية تظهر شاشة تاريخ البداية بالهجري والميلادي');
    ok(await p.locator('#lesson [data-act=dsel]').count() === 4, t + 'أربعة خيارات: اليوم، أول محرم، أول رمضان، مخصص');
    ok(await p.evaluate(() => document.querySelector('#lesson [data-act=lclose]') === null), t + 'لا زرّ إغلاق: الاختيار لازم');
    const today = await p.evaluate(() => __game.E.CAL.jdStr(Math.max(__game.E.CAL.MIN, (() => { const d = new Date(); return __game.E.CAL.gregToJd(d.getFullYear(), d.getMonth() + 1, d.getDate()); })())));
    ok((await p.locator('#startPrev').innerText()).includes(today), t + 'الافتراضي تاريخ اليوم');
    // مخصّص: شهر ماضٍ في السنة الحالية غير مقبول
    await p.locator('#lesson [data-act=dsel][data-g=cust]').click(); await p.waitForTimeout(200);
    ok(await p.locator('#dhy').count() === 1 && await p.locator('#dhm').count() === 1 && await p.locator('#dhd').count() === 1, t + 'قوائم السنة والشهر واليوم');
    await p.selectOption('#dhm', '1'); await p.selectOption('#dhd', '1'); await p.waitForTimeout(200);
    ok(await p.locator('#lesson [data-act=datego]').isDisabled() && /من اليوم فصاعداً/.test(await p.locator('#startPrev').innerText()), t + 'تاريخ قديم مرفوض ويُعطَّل الزر');
    await p.selectOption('#dhy', { index: 3 }); await p.waitForTimeout(200);
    ok(await p.locator('#lesson [data-act=datego]').isEnabled(), t + 'تاريخ مستقبلي مقبول');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي في شاشة البداية');
    // أول رمضان القادم ثم الانطلاق
    await p.locator('#lesson [data-act=dsel][data-g=ram]').click(); await p.waitForTimeout(200);
    await p.locator('#lesson [data-act=datego]').click(); await p.waitForTimeout(500);
    const st = await p.evaluate(() => ({ h: __game.E.dateOf(__game.S, 0).h, set: __game.S.cal.set, pend: __game.S.learn.datePend }));
    ok(st.h.m === 9 && st.h.d === 1 && st.set && !st.pend, t + 'بدأت الرحلة في ١ رمضان');
    // إغلاق نوافذ الترحيب
    await p.evaluate(() => { const S = __game.S; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.learn.intro = S.learn.level; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(400);
    ok(/رمضان 1448 هـ/.test(await p.locator('#hDate').innerText()) && await p.locator('#hYear').innerText() === 'السنة الأولى' && await p.locator('#hDay').innerText() === '1', t + 'الشريط: التاريخ والسنة واليوم');
    ok(await p.evaluate(() => { const e = document.getElementById('hDate'); return e.scrollWidth <= e.clientWidth + 1; }), t + 'شريط التاريخ لا يُقتطع');
    // قائمة السنوات
    await p.locator('#hCal').click(); await p.waitForTimeout(400);
    let ct = await p.locator('#lesson').innerText();
    ok(/تقويم رحلتك/.test(ct) && /دفتر السنوات/.test(ct) && /السنة الأولى/.test(ct) && /الحالية/.test(ct) && /اليوم 1 من 35[45]/.test(ct) && /تقريبي/.test(ct) && /مواسم التجارة/.test(ct) && /شهر رمضان/.test(ct) && /موسم الحجيج/.test(ct) && /لماذا يتحرك رمضان/.test(ct) && /محاكاة لأسواق العرب/.test(ct), t + 'نافذة التقويم: السنة الحالية ودفتر السنوات والتنبيه');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'نافذة التقويم بلا تمرير أفقي');
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(300);
    // مرور سنة
    await p.evaluate(() => { const g = __game, S = g.S, len = g.E.dateOf(S, 0).yearLen; for (let i = 0; i < len + 1; i++) { g.E.tick(S); S.pause = false; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.learn.intro = S.learn.level; } g.renderAll(true); }); await p.waitForTimeout(500);
    ok(await p.locator('#hYear').innerText() === 'السنة الثانية', t + 'بعد سنة: السنة الثانية في الشريط');
    ok(await p.locator('#lesson [data-act=climateclose]').count() === 1, t + 'تقرير دخل السنة يظهر قبل العودة للتقويم');
    await p.locator('#lesson [data-act=climateclose]').click();
    ok(await p.evaluate(() => !__game.S.climate.pending.length && __game.S.climate.hist.length === 1), t + 'حفظ التقرير مرة واحدة في ملف التاجر');
    await p.locator('#hCal').click(); await p.waitForTimeout(400);
    ct = await p.locator('#lesson').innerText();
    ok(/السنة الثانية/.test(ct) && /انتهت/.test(ct) && /ثروتك في آخرها/.test(ct), t + 'قائمة السنوات: السنة الأولى منتهية بثروتها');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
