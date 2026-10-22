// الدفعة الثانية (أ): تجربة الكمية، ملخص العودة، مساعدة التعثر: node test/help-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []));
    const fire = (act, gd, q) => p.evaluate(([a, g, q]) => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" ' + (a ? 'data-act="' + a + '" ' : '') + 'data-g="' + g + '" ' + (a ? '' : 'data-gd="' + g + '" ') + 'data-q="' + q + '"></button>'); document.querySelector('.__t').click(); }, [act, gd, q]);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 50000; g.go('market'); g.renderAll(true); });
    await clr();
    // ١٥: المال والمساحة بعد الشراء
    await fire(null, 'wheat', 1); await p.waitForTimeout(300);
    const mt = await p.locator('#modal').innerText();
    ok(/يبقى من مالك بعد الشراء/.test(mt) && /المساحة المتبقية في قافلتك/.test(mt), tag + 'نافذة السلعة تعرض المال والمساحة بعد الشراء');
    const before = await p.evaluate(() => ({ g: __game.S.player.gold, c: JSON.stringify(__game.S.player.caravans[0].cargo) }));
    await p.evaluate(() => { const b = document.querySelector('#modal [data-dq="25"]'); if (b) b.click(); }); await p.waitForTimeout(200);
    ok(await p.evaluate(b0 => __game.S.player.gold === b0.g && JSON.stringify(__game.S.player.caravans[0].cargo) === b0.c, before), tag + 'تغيير الكمية لا يغيّر المال ولا الحمولة (تجربة فقط)');
    // ٢٢: مساعدة بعد ٣ محاولات مرفوضة لسبب واحد
    await p.evaluate(() => { const S = __game.S; S.player.gold = 0.5; __game.renderAll(true); });
    for (let i = 0; i < 2; i++) { await fire('buy', 'wheat', 5); await p.waitForTimeout(150); }
    ok(await p.locator('#rcpt:not([hidden])').count() === 0, tag + 'بعد محاولتين فاشلتين: لا مساعدة بعد');
    await fire('buy', 'wheat', 5); await p.waitForTimeout(250);
    ok(await p.locator('#rcpt:not([hidden])').count() === 1 && /هل تحتاج مساعدة/.test(await p.locator('#rcpt').innerText()) && /رصيدك لا يكفي/.test(await p.locator('#rcpt').innerText()), tag + 'بعد ٣: مساعدة تشرح السبب الحقيقي (الرصيد)');
    ok(/لا شكراً/.test(await p.locator('#rcpt').innerText()), tag + 'فيها «لا شكراً»');
    await p.evaluate(() => document.querySelector('#rcpt [data-act=rcptclose]').click());
    for (let i = 0; i < 4; i++) { await fire('buy', 'wheat', 5); await p.waitForTimeout(120); }
    ok(await p.locator('#rcpt:not([hidden])').count() === 0, tag + 'بعد رفضها لا تتكرر لنفس السبب');
    // نجاح بين المحاولات يعيد العدّاد
    await p.evaluate(() => { __game.S.player.gold = 50000; }); await fire('buy', 'wheat', 1); await p.waitForTimeout(200);
    ok(await p.evaluate(() => /اشتريت/.test(document.getElementById('rcpt').innerText)), tag + 'النجاح يعرض إيصاله لا مساعدة');
    // ١٧: ملخص العودة
    await clr();
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; window.__s0 = { day: S.day, gold: S.player.gold }; S.learn.rq = ['back']; g.go('home'); g.renderAll(true); });
    await p.waitForTimeout(600);
    const rt = await p.evaluate(() => document.getElementById('react').innerText);
    ok(/أهلاً بعودتك/.test(rt) && /قافلتك في/.test(rt), tag + 'ملخص العودة فيه موضع القافلة (' + rt.slice(0, 60).replace(/\n/g, ' ') + ')');
    ok(/تحمل/.test(rt) || /فارغة/.test(rt), tag + 'وفيه حالة الحمولة');
    ok(await p.evaluate(() => __game.S.day === window.__s0.day && __game.S.player.gold === window.__s0.gold), tag + 'الملخص لا يغيّر اليوم ولا الرصيد');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
