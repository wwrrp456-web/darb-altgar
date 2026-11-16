// 053أ موازنة الاقتصاد (واجهة، 390 و1100، BAL.on = true): كل ثمن معروض = دالة المحرك، وسطور الإيجار والتمليك والمدينة المصابة وسبب الطريق والتكافل والمُختار: node test/bal-a-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const digits = s => s.replace(/[^0-9]/g, '');
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.MFILE.on = false; g.E.BAL.on = true; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; S.learn.level = 5; S.phase = 4; S.player.gold += 3e6; S.noShocks = true; S.noEvents = true; g.go('estate'); g.renderAll(true); });
    for (const [d, i] of [['calm', 0], ['normal', 1], ['hard', 2]]) {
      const tag = vp.width + 'px [' + d + ']: ';
      await p.evaluate(dd => { const g = __game; g.S.diff = dd === 'normal' ? undefined : dd; g.go('estate'); g.renderAll(true); }, d);
      await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(250);
      const cost = await p.evaluate(() => { const g = __game; return g.E.shopCost(g.S, g.S.cities.riyadh); });
      const btn = p.locator('[data-act=bshop]').first();
      ok(await btn.count() > 0 && digits(await btn.innerText()).includes(String(cost)), tag + 'زر «ابنِ دكاناً» يعرض E.shopCost = ' + cost);
      ok(/% |٪/.test(await p.locator('.rentbox').first().innerText()) && await p.locator('[data-bal=rent]').first().innerText().then(t => t.includes(String([15, 20, 25][i]))), tag + 'سطر «الإيجار ≈ ' + [15, 20, 25][i] + '٪ من ثمنه في السنة»');
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    }
    // بطاقة المستأجر: price وdisc وpay وسطر زيادة الدخل
    await p.evaluate(() => { const g = __game; g.S.diff = undefined; g.E.A.rentShop(g.S, 'riyadh', 'shop', 'private'); g.S.player.props.riyadh.shops[0].rentPaid = 18105; g.go('estate'); g.renderAll(true); });
    await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(250);
    const card = await p.locator('.shopbox').first().innerText(), q = await p.evaluate(() => { const g = __game; return g.E.shopBuyQuote(g.S, 'riyadh', g.S.player.props.riyadh.shops[0].id); });
    ok(digits(card).includes(String(q.pay)) && digits(card).includes(String(q.price)) && digits(card).includes(String(Math.round(q.disc))), vp.width + 'px: بطاقة المستأجر تعرض price ' + q.price + ' وdisc ' + Math.round(q.disc) + ' وpay ' + q.pay);
    ok(card.includes('ويزيد دخلك منه نحو ' + q.rent + ' ريال يومياً بزوال الإيجار') && card.includes('مخصوماً منه') && card.includes('مما دفعتَه إيجاراً'), vp.width + 'px: سطر زيادة الدخل بزوال الإيجار');
    // مدينة مصابة: سطر المبيعات برقمه
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.rentShop; S.cities.riyadh.sh = { k: 'famine', end: S.day + 20, cut: 0.3 }; S.player.props.riyadh.hitLost = 1234; S.player.props.riyadh.hitK = 'famine'; g.go('estate'); g.renderAll(true); });
    await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(250);
    const hit = await p.locator('[data-hit=riyadh]').first().innerText();
    ok(/أقل 60٪: مجاعة حتى اليوم/.test(hit) && hit.includes('فاتك من المبيعات نحو 1,234'), vp.width + 'px: «مبيعاتك في الرياض أقل 60٪: مجاعة حتى اليوم N · خسرتَ منها 1,234»');
    // سبب خطر الطريق
    const html = await p.evaluate(() => { const g = __game; return g.roadEstHTML(g.S.player.caravans[0], 'jeddah'); });
    ok(/data-roadbal/.test(html) && /×1\.6/.test(html) && /مجاعة في/.test(html), vp.width + 'px: تقدير الطريق يذكر السبب «الخطر ×1.6 (مجاعة في …)»');
    // التكافل (بطاقة الصندوق في «الأعمال»)
    await p.evaluate(() => { const g = __game; g.S.cities.riyadh.sh = null; g.E.A.buildShop(g.S, 'riyadh'); g.go('empire'); g.renderAll(true); }); await p.waitForTimeout(300);
    ok(/يعوّض التكافل 50٪ من تلف المال؛ نقص المبيعات لا يدخل فيه/.test(await p.evaluate(() => [...document.querySelectorAll('.insc')].map(e => e.textContent).join(' '))) && /والفيضان والحرب في هذه المدينة \(النهب والعاصفة بتكافل الرحلة\)/.test(await p.evaluate(() => [...document.querySelectorAll('.insc')].map(e => e.textContent).join(' '))), vp.width + 'px: بطاقة التكافل تذكر النسبة وأن نقص المبيعات خارجها');
    // المُختار في الدفتر: عنصر on واحد، والوصف يحمل ثمن أول دكان
    await p.evaluate(() => { const b = document.createElement('button'); b.id = '__op'; b.setAttribute('data-act', 'profile'); document.body.appendChild(b); b.click(); }); await p.waitForTimeout(400);
    const bvs = await p.evaluate(() => { const g = __game; return g.E.balView(g.S).map(x => x.shop); });
    for (const [k, price] of [['hard', bvs[2]], ['calm', bvs[0]], ['normal', bvs[1]]]) {
      await p.locator('[data-act=diff][data-k=' + k + ']').first().click(); await p.waitForTimeout(250);
      const on = await p.locator('[data-act=diff].on').count(), pr = await p.locator('[data-act=diff][aria-pressed=true]').count(), txt = await p.locator('[data-act=diff]').first().locator('xpath=ancestor::div[contains(@class,"card")][1]').innerText();
      ok(on === 1 && pr === 1 && await p.locator('[data-act=diff][data-k=' + k + '].on').count() === 1 && digits(txt).includes(String(price)), vp.width + 'px: المُختار ' + k + ': عنصر on واحد والوصف يحمل أول دكان ' + price);
    }
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), vp.width + 'px: لا تمرير أفقي');
    await ctx.close();
  }
  // «حال أعمالي» ← مدن مصابة (نقرة واحدة من الرئيسية): من حفظة guided-10 كما في home-status-ui
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
  for (const w of [390, 1100]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL.replace('?seed=3', '?player=1&seed=5')); await p.waitForFunction(() => !!window.__game);
    if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
    await p.evaluate(() => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; E.BAL.on = true; S.phase = 3; S.player.gold = 2e5; S.noShocks = true; S.noEvents = true;
      if (!E.shopsOf(S, 'riyadh').length) E.A.buildShop(S, 'riyadh'); const pr = S.player.props.riyadh; S.cities.riyadh.sh = { k: 'famine', end: S.day + 20, cut: 0.3 }; pr.hitK = 'famine'; pr.hitLost = 777; __game.go('home'); }); await p.waitForTimeout(500);
    const row = p.locator('[data-dchip="fold:hs-hit"]');
    ok(await row.count() === 1, w + 'px: صف «مدن مصابة» في «حال أعمالي»');
    if (await row.count()) { await row.first().click(); await p.waitForTimeout(400); const t = await p.locator('#dsheet').innerText(); ok(/مبيعاتك في .* أقل 60٪: مجاعة حتى اليوم/.test(t) && t.includes('فاتك من المبيعات نحو 777'), w + 'px: النافذة تعرض «أقل 60٪: مجاعة حتى اليوم N · خسرتَ منها 777» (نقرة واحدة)'); }
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), w + 'px: لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
