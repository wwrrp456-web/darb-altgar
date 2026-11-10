// 035ب: بطاقات الأمين على 390: وضع الدكاكين (الوضعان)، الاقتراح بأزرار، الميزانية ⓘ، حالة التجربة، تلميح التوظيف: node test/skill-b-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/skill-save-a23.json'), 'utf8')).raw, URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1', ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/skill-b');
(async () => {
  const b = await chromium.launch(), errors = []; fs.mkdirSync(SHOTS, { recursive: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.noShocks = true; S.learn.free = true; S.learn.level = 11; g.setSpeed(0); S.player.caravans[0].left = 0;
      const city = Object.keys(S.player.props).find(c => S.player.props[c].shops.length), pr = S.player.props[city]; S.player.caravans[0].city = city; window.__city = city;
      pr.mgr = { rank: 3, lv: 2, id: S.nextId++, wage: 40, days: 200, span: 6, since: S.day - 200, audit: S.day, late: 0, policy: { pay: false, report: true, restock: false, pricing: false, rotate: false, sellStale: false, herd: false, minPrice: { sellStale: 1, herd: 1 }, limit: 0, every: 'daily' } };
      pr.whs = Math.max(1, pr.whs || 0); pr.store.wool = 60; pr.store.wheat = 80; pr.store.dates = 80; pr.shops[0].items = [{ g: 'wool', price: 3, auto: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 20, lastSold: 0 }]; delete pr.shops[0].mode; E.skillMigrate(S); g.tick && 0;
      E.tick(S, false); pr.shops[0].items[0].idleDays = 20; E.tick(S, false); g.go('office'); g.ui.tab = { office: 'mgmt' }; g.renderAll(true); });
    const open = async () => { for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250); } };
    await p.waitForTimeout(400); await open();
    // الوضع الافتراضي: اقترح عليّ + اقتراح بأزرار + ميزانية بشرح
    const s1 = await p.evaluate(() => { const e = document.querySelector('.sb-box'); return e ? { txt: e.textContent, prop: !!e.querySelector('.sb-prop [data-act=mgrapprove]') && !!e.querySelector('.sb-prop [data-act=mgrdecline]'), bud: !!e.querySelector('[data-act=budgetok]'), info: e.querySelectorAll('.ixd').length, over: e.scrollWidth > e.clientWidth + 1 } : null; });
    a.ok(s1, 'صندوق الأمين'); a.match(s1.txt, /اقترح عليّ/); a.ok(s1.prop, 'اقتراح بزري اعتمد/لا شكراً'); a.ok(s1.bud, 'ميزانية مقترحة'); a.ok(s1.info >= 2, 'علامتا ⓘ للوضع والميزانية'); a.equal(s1.over, false); a.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'بلا تمرير أفقي');
    a.equal(await p.evaluate(() => document.querySelectorAll('.sb-box details:not(.ixd)').length), 0, 'لا قوائم منسدلة جديدة سوى ⓘ');
    await p.locator('.sb-box').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'suggest-mode-390.jpg'), type: 'jpeg', quality: 55 }); ok('وضع «اقترح عليّ»: سطر الوضع + اقتراح بزرّين + ميزانية، وعلامتا ⓘ فقط، بلا تمرير أفقي');
    // اعتماد الميزانية ثم الموافقة على الاقتراح
    await p.evaluate(() => document.querySelector('.sb-box [data-act=budgetok]').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => /معتمدة/.test(document.querySelector('.sb-box').textContent)), true, 'الميزانية معتمدة');
    await p.evaluate(() => document.querySelector('.sb-prop [data-act=mgrapprove]').click()); await p.waitForTimeout(400); await open();
    a.equal(await p.evaluate(() => document.querySelectorAll('.sb-prop').length), 0, 'اختفى الاقتراح بعد الاعتماد'); a.equal(await p.evaluate(() => /تجربة .* من 14 يوماً مؤهلاً/.test(document.querySelector('.sb-box').textContent)), true, 'سطر حالة التجربة');
    // الوضع الثاني: تصرّف ضمن حدودي
    await p.evaluate(() => document.querySelector('.sb-box [data-act=shopmode]').click()); await p.waitForTimeout(300); const s2 = await p.evaluate(() => document.querySelector('.sb-box').textContent); a.match(s2, /تصرّف ضمن حدودي/);
    await p.locator('.sb-box').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'act-mode-390.jpg'), type: 'jpeg', quality: 55 }); a.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); ok('الموافقة تبدأ التجربة بسطر حالتها، والوضع الثاني «تصرّف ضمن حدودي» بلا تمرير أفقي');
    // تلميح التوظيف في «اليوم»
    await p.evaluate(() => { const S = __game.S, pr = S.player.props[window.__city]; pr.mgr = null; S.player.hints = { hire: S.day }; __game.ui.tab = { office: 'today' }; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(300);
    a.equal(await p.evaluate(() => /ثقل العمل/.test(document.querySelector('#screen').textContent)), true, 'بطاقة التلميح'); await p.evaluate(() => document.querySelector('[data-act=hintdone]').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => /ثقل العمل/.test(document.querySelector('#screen').textContent)), false, 'تختفي بعد «فهمت»'); ok('تلميح التوظيف يظهر مرة في «اليوم» ويختفي بعد «فهمت»');
    // مفتاح الرجوع
    await p.evaluate(() => { const S = __game.S, pr = S.player.props[window.__city]; pr.mgr = { rank: 3, lv: 2, id: S.nextId++, wage: 40, days: 200, span: 6, since: 0, audit: S.day, late: 0, policy: { pay: false, report: true, restock: false, pricing: false, rotate: false, sellStale: false, herd: false, minPrice: { sellStale: 1, herd: 1 }, limit: 0, every: 'daily' } }; __game.E.skillMigrate(S); __game.E.SKILLB.on = false; __game.ui.tab = { office: 'mgmt' }; __game.go('office'); __game.renderAll(true); });
    await p.waitForTimeout(300); a.equal(await p.evaluate(() => document.querySelectorAll('.sb-box').length), 0, 'المطفأ بلا صندوق'); ok('SKILLB.on=false يخفي الصندوق');
    a.deepEqual(errors, []); console.log('PASS skill-b-ui: modes, proposal, budget ⓘ, trial line, hint card, 390 no horizontal scroll');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
