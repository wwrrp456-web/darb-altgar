// صفحة الانطلاق لأول لاعب: بطاقة الحكاية وحدها ثم «ابدأ الرحلة»: node test/story-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&cover=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 320, height: 640 }, { width: 360, height: 640 }, { width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const t = vp.width + 'x' + vp.height + ': ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1500);
    ok(await p.locator('#coverGo').count() === 1, t + 'الغلاف أولاً: «ادخل اللعبة»');
    await p.locator('#coverGo').click(); await p.waitForTimeout(1200);
    const st = await p.evaluate(() => { const vis = id => { const e = document.getElementById(id); return !!(e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'); }; const bt = document.querySelector('[data-act=storygo]'); const r = bt ? bt.getBoundingClientRect() : null; return { sf: document.body.classList.contains('story-first'), top: vis('top'), nav: vis('nav'), tog: vis('navTog'), card: !!document.querySelector('.story-page .sp-card'), txt: (document.querySelector('.story-page .story') || {}).textContent || '', btn: !!bt, btnTop: r ? r.top : 0, sw: document.documentElement.scrollWidth, iw: innerWidth, lesson: !document.getElementById('lesson').hidden }; });
    ok(st.sf && st.card && st.btn, t + 'اللاعب الجديد يرى صفحة الحكاية');
    ok(/مات جدّك وترك لك قافلة صغيرة وثمانمئة ريال في الرياض/.test(st.txt) && /سيّد السوق/.test(st.txt), t + 'بطاقة الحكاية بنصها');
    ok(!st.top && !st.nav && !st.tog, t + 'بلا الشريط العلوي ولا شريط التنقل ولا زرّ الطيّ');
    ok(!st.lesson, t + 'لا مقدمة عمّ سالم قبل الضغط');
    ok(st.btnTop < vp.height, t + 'زرّ «ابدأ الرحلة» يبدأ ظاهراً داخل الشاشة (' + Math.round(st.btnTop) + ' من ' + vp.height + ')');
    ok(st.sw <= st.iw + 1, t + 'بلا تمرير أفقي');
    await p.locator('[data-act=storygo]').click(); await p.waitForTimeout(900);
    const after = await p.evaluate(() => ({ sf: document.body.classList.contains('story-first'), top: document.getElementById('top').offsetParent !== null, lesson: !document.getElementById('lesson').hidden, kind: document.getElementById('lesson').dataset.kind || '' }));
    ok(!after.sf && after.top, t + 'بعد «ابدأ الرحلة» تظهر اللعبة بشريطها');
    ok(after.lesson && /char/.test(after.kind), t + 'وتبدأ مقدمة عمّ سالم (' + after.kind + ')');
    await ctx.close();
  }
  { // لاعب عائد لا يرى الصفحة
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1500); await p.locator('#coverGo').click(); await p.waitForTimeout(800);
    await p.evaluate(() => { const g = __game; g.E.A.learnSetChar(g.S, 'trader'); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => g.S.learn[k] = []); g.S.learn.intro = g.S.learn.level; g.S.cal = { jd0: g.E.CAL.MIN, set: true, yr: 1 }; g.renderAll(true); }); await p.waitForTimeout(500);
    ok(await p.evaluate(() => !document.body.classList.contains('story-first') && document.getElementById('top').offsetParent !== null), 'من اختار شخصيته لا يرى صفحة الحكاية');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
