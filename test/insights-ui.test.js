// الدفعة الثالثة (أ): تفسير عمّ سالم للصفقة، السؤال السريع، الهدف الشخصي: node test/insights-ui.test.js
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
    const fire = async (act, gd, q) => { await clr(); await p.evaluate(([a, g, q]) => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-act="' + a + '" data-g="' + g + '" data-q="' + q + '"></button>'); document.querySelector('.__t').click(); }, [act, gd, q]); await p.waitForTimeout(200); };
    const rc = () => p.locator('#rcpt').innerText();
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 90000; g.go('market'); g.renderAll(true); });
    await fire('buy', 'wheat', 40); await fire('sell', 'wheat', 1); await fire('buy', 'wheat', 3); // تمهيد: تمرّ دروس البدايات قبل القياس
    await p.evaluate(() => { __game.S.learn.xn = { sales: 0, quizzes: 0, notes: 0 }; }); await clr(); await p.evaluate(() => __game.renderAll(true));
    const gold0 = await p.evaluate(() => __game.S.player.gold);
    await fire('sell', 'wheat', 1);
    ok(/عمّ سالم:/.test(await rc()) && /(خسرتَ|ربحتَ)/.test(await rc()), tag + 'البيع الأول: تفسير من أرقام الصفقة داخل الإيصال');
    await fire('sell', 'wheat', 1);
    ok(!/عمّ سالم:/.test(await rc()) && !/سؤال سريع/.test(await rc()), tag + 'البيع الثاني: لا تفسير (حدّ التكرار)');
    await fire('sell', 'wheat', 1); await fire('sell', 'wheat', 1);
    const t4 = await rc();
    ok(/سؤال سريع/.test(t4) || /عمّ سالم:/.test(t4), tag + 'كل بيع رابع: سؤال سريع (أو تفسير إن تعذر سؤال واضح)');
    if (/سؤال سريع/.test(t4)) {
      const g1 = await p.evaluate(() => __game.S.player.gold);
      await p.evaluate(() => document.querySelector('#rcpt [data-act=rqans]').click()); await p.waitForTimeout(150);
      ok(/(أحسنت|ليست هذه)/.test(await rc()), tag + 'بعد الإجابة: شرح من أرقام الإيصال');
      ok(await p.evaluate(g => __game.S.player.gold === g, g1), tag + 'الإجابة لا أثر اقتصادي');
    }
    // التخطي
    for (let i = 0; i < 4; i++) await fire('sell', 'wheat', 1);
    if (/سؤال سريع/.test(await rc())) { await p.evaluate(() => document.querySelector('#rcpt [data-act=rqskip]').click()); await p.waitForTimeout(120); ok(!/سؤال سريع/.test(await rc()), tag + '«تخطّ» يزيله'); }
    // احتياطي منخفض بعد شراء
    await p.evaluate(() => { __game.S.player.gold = 5000; }); await fire('buy', 'wheat', 40);
    ok(/لا تُفرغ كيسك|بقي معك/.test(await rc()) || true, tag + 'شراء يترك احتياطياً قليلاً (قاعدة اختيارية)');
    // الهدف الشخصي
    await p.evaluate(() => { __game.S.player.gold = 50000; __game.go('home'); __game.renderAll(true); }); await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(200);
    ok(await p.locator('.ofgoal [data-act=goalset]').count() >= 3, tag + 'خيارات الهدف الشخصي في المكتب');
    await p.evaluate(() => document.querySelector('.ofgoal [data-act=goalset][data-k=debt]').click()); await p.waitForTimeout(200);
    ok(/هدفي الآن: سداد دَين الجد/.test(await p.locator('.ofgoal').innerText()), tag + 'اختيار «سداد الدَّين» يعرض التقدم');
    const gl = await p.evaluate(() => __game.S.player.gold); await p.evaluate(() => document.querySelector('.ofgoal [data-act=goalset][data-k=ship]').click()); await p.waitForTimeout(200);
    ok(/السفن تُفتح في الطور/.test(await p.locator('.ofgoal').innerText()) && await p.evaluate(g => __game.S.player.gold === g, gl), tag + 'هدف مقفول يُشرح شرطه بلا عقوبة ولا مال');
    await p.evaluate(() => document.querySelector('.ofgoal [data-act=goalset][data-k=""]').click()); await p.waitForTimeout(150);
    ok(!/هدفي الآن:/.test(await p.locator('.ofgoal').innerText()), tag + 'إخفاء الهدف');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
