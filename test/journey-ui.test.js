// رحلة الواجهة عبر المستويات العشرة: لكل مستوى حوار الدرس بأسئلته ثم الترقية فالحكاية، وبعد التخرّج المستشار: node test/journey-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=5')); await p.waitForTimeout(2300);
  await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.sq.length = 0; S.learn.zseen = 1; S.learn.intro = 0; __game.renderAll(true); });
  const L = p.locator('#lesson');
  const FIX = { 1: { buy: 1, sell: 1 }, 2: { profit15: 1 }, 3: { profit: 3 }, 4: { crossed: 1, profitCross: 1 }, 5: { mixed: 1 }, 6: { exchange: 1 }, 7: { buildShop: 1, toStore: 1 }, 8: { signPact: 1 }, 9: { agentBuy: 1 }, 10: { borrow: 1, repay: 1 } };
  for (let n = 1; n <= 10; n++) {
    // درس المستوى: حوار + أسئلة
    await p.evaluate(n => { const S = __game.S; S.learn.level = n; S.learn.intro = n - 1; S.learn.up.length = 0; __game.renderAll(true); }, n);
    await p.waitForTimeout(150);
    const title = await p.evaluate(n => __game.E.LS.LEVELS[n - 1].title, n);
    let guard = 0, quizzes = 0;
    while (!(await p.locator('#lesson [data-act=lclose]').count()) && guard++ < 14) {
      if (await p.locator('#lesson [data-act=lans]').count()) { const okIdx = await p.evaluate(({ n, q }) => __game.E.LS.LEVELS[n - 1].quiz.concat(__game.E.BAB.QUIZ[n] || [])[q].ok, { n, q: quizzes }); await p.locator('#lesson [data-act=lans][data-g="' + okIdx + '"]').click(); quizzes++; await p.waitForTimeout(80); }
      await p.locator('#lesson [data-act=lnext]').click(); await p.waitForTimeout(80);
    }
    ok((await L.textContent()).includes(title) && /مهمتك/.test(await L.textContent()) && quizzes >= 1, 'م' + n + ' «' + title + '»: الحوار والأسئلة (' + quizzes + ') ثم بطاقة المهمة');
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(120);
    ok(await p.evaluate(n => __game.S.learn.intro === n, n) && await p.locator('#lesson[hidden]').count() === 1, 'م' + n + ': تُغلق النافذة ويُسجَّل أنها عُرضت');
    // إنجاز المستوى بأفعاله ← نافذة الترقية والحكاية
    await p.evaluate(({ n, fx }) => { const S = __game.S; Object.assign(S.learn.ev, fx);
      if (n === 2) S.player.led.inc.realized = 500; if (n === 3) { S.player.trips = 3; S.player.led.exp.provisions = 5; } if (n === 5) S.learn.goods = ['dates', 'wool', 'iron']; if (n === 6) S.learn.secrets = ['sa', 'eg'];
      __game.E.learnCheck(S); __game.renderAll(true); }, { n, fx: FIX[n] });
    await p.waitForTimeout(150);
    const lv = await p.evaluate(() => __game.S.learn.level); const txt = await L.textContent();
    ok(lv === n + 1 && /أتممتَ المستوى/.test(txt) && /من ذكريات جدّك/.test(txt), 'م' + n + ': اكتمل ← نافذة الترقية والحكاية (المستوى الآن ' + lv + ')');
    if (n === 10) { ok(/مستشارك الخاص/.test(txt) && !/وداع|أودّعك|لن ألقاك/.test(txt), 'م١٠: يتحوّل عمّ سالم إلى مستشار ولا يودّع'); await p.screenshot({ path: '/tmp/shots/j-grad.png' }); }
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(150);
    await p.evaluate(() => { __game.S.learn.rest = null; __game.renderAll(true); }); await p.waitForTimeout(150);
    for (let k = 0; k < 6 && /لوح حكمة|خرجتَ حرّاً/.test(await L.textContent()); k++) { await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(150); }
    if (n < 10) { const nt = await p.evaluate(n => __game.E.LS.LEVELS[n].title, n); ok((await L.textContent()).includes(nt), 'م' + n + ': بعد الترقية يبدأ درس «' + nt + '» تلقائياً'); }
    else ok(await p.locator('#lesson[hidden]').count() === 1, 'م١٠: تُغلق نافذة الترقية ولا درس بعدها');
  }
  ok(await p.evaluate(() => __game.S.learn.level === 11), 'التخرّج: المستوى ١١');
  // المستشار
  ok(await p.locator('#advBtn:not([hidden])').count() === 1, 'يظهر زر 💬 المستشار بعد التخرّج');
  await p.screenshot({ path: '/tmp/shots/j-advbtn.png' });
  await p.click('#advBtn'); await p.waitForTimeout(200);
  ok(/مستشارك الخاص/.test(await L.textContent()) && await p.locator('#lesson .advtabs button').count() === 7, 'نافذة المستشار بسبعة أقسام');
  await p.screenshot({ path: '/tmp/shots/j-adv-deal.png' });
  for (const [tab, re] of [['market', /الأرخص هنا/], ['portfolio', /توزيع مالك/], ['risk', /الحراس/], ['zakat', /وعاؤك/], ['learn', /الزكاة/], ['set', /النصائح/]]) {
    await p.locator('#lesson [data-act=advtab][data-g=' + tab + ']').click(); await p.waitForTimeout(120);
    ok(re.test(await L.textContent()), 'المستشار: قسم «' + tab + '»');
  }
  await p.locator('#lesson [data-act=advtab][data-g=deal]').click(); await p.waitForTimeout(120);
  ok(/صفقة|الطريق|مجزية/.test(await L.textContent()), 'قسم الصفقة يعرض اقتراحاً أو سبب غيابه');
  await p.locator('#lesson [data-act=advtab][data-g=learn]').click(); await p.locator('#lesson [data-act=lview][data-g="2"]').click(); await p.waitForTimeout(150);
  ok(/هامش الربح/.test(await L.textContent()), 'من المستشار تُعاد قراءة درس سابق');
  await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(150);
  // نصيحة تلقائية
  await p.evaluate(() => { const S = __game.S; S.learn.up.length = 0; S.player.gold = 60000; S.day += 40; __game.E.tick(S); __game.renderAll(true); }); await p.waitForTimeout(300);
  const adv = await p.evaluate(() => { const S = __game.S; return S.learn.rseen.tipCash > 0 || S.learn.rseen.tipCheap > 0 || S.learn.rseen.tipSpike > 0; });
  ok(adv, 'يبادر المستشار بنصيحة حين تكثر السيولة');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
