// قوائم «كيف يعمل؟» المنسدلة في صفحة العقارات وتبويب التعليمات في دفتر عمّ سالم: node test/howto-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => {['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []);__game.renderAll(true);});
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.phase = 2; S.player.gold = 90000; g.go('estate'); g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    const st = () => p.evaluate(() => [...document.querySelectorAll('.howtos .howto')].map(d => [d.dataset.dk, d.open]));
    let h = await st();
    ok(h.length >= 3 && h.every(x => /^howto-/.test(x[0])), tag + 'قوائم التعليمات ظاهرة في صفحة العقارات (' + h.map(x => x[0].slice(6)).join(',') + ')');
    ok(h.find(x => x[0] === 'howto-shop')[1] === true, tag + 'تعليمات الدكان مفتوحة تلقائياً قبل بناء أي دكان (نقص)');
    ok(h.find(x => x[0] === 'howto-warehouse')[1] === false, tag + 'تعليمات المخزن مطوية افتراضياً');
    const txt = await p.locator('.howto[data-dk=howto-shop]').innerText();
    ok(/ما هذا/.test(txt) && /الخطوات/.test(txt) && /أين المشكلة/.test(txt) && /وأنت غائب/.test(txt), tag + 'كل قائمة فيها: ما هذا والخطوات والمشكلة وأنت غائب');
    const pay=p.locator('.howto[data-dk=howto-payments]');ok(await pay.count()===1,tag+'شرح مصدر دفع الأجور والإيجار متاح');await pay.locator('summary').click();const paymentText=await pay.innerText();ok(/الريال/.test(paymentText)&&/تلقائياً كل يوم/.test(paymentText)&&/5 أيام/.test(paymentText)&&/3 أيام/.test(paymentText),tag+'الشرح يحدد عملة الخصم ويفرق مهلة العامل والمدير');ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tag+'شرح الدفع دون تمرير أفقي');
    // إغلاق يُحفظ
    await p.evaluate(() => { const d = document.querySelector('.howto[data-dk=howto-shop]'); d.open = false; d.dispatchEvent(new Event('toggle', { bubbles: true })); }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => (JSON.parse(localStorage.getItem('darb-ui') || '{}').howto || {}).shop === false), tag + 'اختيار الإغلاق يُحفظ');
    await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(200);
    ok((await st()).find(x => x[0] === 'howto-shop')[1] === false, tag + 'ويبقى مطوياً بعد إعادة الرسم رغم النقص');
    // دفتر عمّ سالم
    await p.evaluate(() => document.querySelector('[data-act=salem]').click()); await p.waitForTimeout(300);
    await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-act="salemtab" data-g="journal"></button>'); document.querySelector('.__t').click(); document.querySelector('.__t').remove(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-act="jtab" data-g="help"></button>'); document.querySelector('.__t').click(); document.querySelector('.__t').remove(); }); await p.waitForTimeout(300);
    const n = await p.locator('#salemPanel .howto').count();
    ok(n >= 5 && !(await p.locator('#salemPanel .howto[open]').count()), tag + 'تبويب «التعليمات» في الدفتر: ' + n + ' قوائم مطوية');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
