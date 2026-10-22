// الصرف اليدوي في الواجهة: سبب النقص ومعه «افتح الصرافة» بعملة السوق مختارة، ثم التحويل والشراء؛ وإشعار البداية مرة واحدة؛ والصرف التلقائي برسم: node test/fxmanual-ui.test.js
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
    const fire = async (html) => { await clr(); await p.evaluate(h => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', h); document.querySelector('.__t').click(); }, html); await p.waitForTimeout(250); };
    const city = await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 4; S.learn.intro = 4; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []);
      const m = S.player.caravans[0], c = S.order.find(i => S.cities[i].country !== 'sa'); m.city = c; m.left = 0; S.player.wallet.sar = 5000; S.player.wallet.usd = 0; S.player.wallet.au = 0; S.player.wallet.ag = 0; g.go('market'); g.renderAll(true); return c; });
    await p.waitForTimeout(400);
    ok(await p.locator('#rcpt:not([hidden])').count() === 1 && /الصرف صار يدوياً/.test(await p.locator('#rcpt').innerText()), tag + 'إشعار «الصرف صار يدوياً» عند بدايته');
    await p.evaluate(() => document.querySelector('#rcpt [data-act=rcptclose]').click()); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(200);
    ok(await p.locator('#rcpt:not([hidden])').count() === 0, tag + 'لا يتكرر بعد قراءته');
    await fire('<button class="__t" data-gd="wheat"></button>');
    const t = await p.locator('#modal').innerText();
    ok(/محفظتك من .{2,20} لا تكفي لهذه الكمية/.test(t) && await p.locator('#modal [data-act=openfxneed]').count() >= 1, tag + 'نقص دولار في بلد أجنبي: السبب ومعه «افتح الصرافة»');
    await p.evaluate(() => document.querySelector('#modal [data-act=openfxneed]').click()); await p.waitForTimeout(400);
    ok(await p.evaluate(() => location.hash) === '#cities' && await p.evaluate(() => document.getElementById('fxTo').value) === 'usd' && await p.evaluate(() => document.getElementById('fxFrom').value) === 'sar', tag + 'تفتح الصرافة بالتحويل من الريال إلى الدولار');
    ok(/الصرف يدوي/.test(await p.locator('#screen').innerText()), tag + 'بطاقة وضع الصرف: يدوي');
    await p.evaluate(() => { document.getElementById('fxAmt').value = '1500'; document.querySelector('[data-act=fxdo]').click(); }); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.wallet.usd) > 300, tag + 'التحويل اليدوي نجح (' + Math.round(await p.evaluate(() => __game.S.player.wallet.usd)) + ' دولار)');
    await p.evaluate(c => { const S = __game.S; S.player.caravans[0].city = c; __game.go('market'); __game.renderAll(true); }, city); await clr();
    await fire('<button class="__t" data-act="buy" data-g="wheat" data-q="5"></button>');
    ok(await p.evaluate(() => Math.floor(__game.S.player.caravans[0].cargo.wheat || 0)) >= 1, tag + 'بعد التحويل يشتري بعملة السوق');
    // الصرف التلقائي برسم
    await p.evaluate(() => { __game.go('cities'); __game.renderAll(true); }); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('[data-act=fxauto]').click()); await p.waitForTimeout(200);
    ok(/برسم أعلى/.test(await p.locator('#screen').innerText()), tag + 'التبديل إلى الصرف التلقائي برسم أعلى');
    await p.evaluate(c => { const S = __game.S; S.player.wallet.usd = 0; S.player.wallet.sar = 5000; S.player.caravans[0].city = c; __game.go('market'); __game.renderAll(true); }, city); await clr();
    await fire('<button class="__t" data-act="buy" data-g="wheat" data-q="20"></button>');
    ok(/رسم تحويل فوري/.test(await p.locator('#rcpt').innerText()), tag + 'الإيصال يُظهر رسم التحويل الفوري');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
