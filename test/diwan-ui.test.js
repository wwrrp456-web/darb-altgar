'use strict';
// 025 ناظر الديوان (واجهة): التوظيف هدفاً بشريط تقدّم، الخزينة، القائمة المنسدلة، «ما ينتظرك/ما فعلته عنك»؛ 390 و1100 بلا تمرير أفقي، والمفتاح.
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/diwan');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 5000000; };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
const large = () => { const g = __game, S = g.S, A = g.E.A;
  for (const city of ['riyadh', 'jeddah']) { A.buildShop(S, city); A.buildShop(S, city); A.buildWarehouse(S, city); for (const w of S.player.props[city].staff) { w.days = 120; w.free = 0; } }
  for (let i = 0; i < 30; i++) g.E.tick(S, false);
  for (const city of ['riyadh', 'jeddah']) { const pr = S.player.props[city]; A.promoteWorker(S, city, pr.staff.find(w => w.role === 'seller').id, 'shop', pr.shops[0].id); }
  for (let i = 0; i < 90; i++) g.E.tick(S, false);
  for (const city of ['riyadh', 'jeddah']) { A.auditCity(S, city); A.promoteSteward(S, city); }
  S.phase = 4; S.player.wallet.sar = 5000000; A.hireAgent(S, 'sa'); S.player.wallet.sar = 100000; };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async (w, setup) => { const p = await b.newPage({ viewport: { width: w, height: 950 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=21&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.evaluate(setup); await p.evaluate(clean); await p.evaluate(() => { __game.OFFICETABS.on = false; Object.assign(__game.ui.fold || (__game.ui.fold = {}), { 'of-diwan': 1, 'of-cchief': 1, 'of-portm': 1, 'of-rivals': 1 }); __game.go('office'); __game.renderAll(true); }); return p; };
  const noOverflow = async p => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
  const shot = async (p, sel, name) => { await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed' && /عمّ سالم/.test(el.textContent) && el.textContent.length < 400) el.style.display = 'none'; }); await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, name) }); };
  // 1) قبل التوظيف: هدفي الآن + بطاقة التوظيف بشريط تقدّم، ولا زر قبل تحقق الشروط
  for (const w of [390, 1100]) {
    const p = await open(w, large); const goal = p.locator('.ofgoal'); a(await goal.isVisible()); a.match(await goal.innerText(), /وظّف ناظر الديوان/); a.match(await goal.innerText(), /اجمع \S+ ريال أخرى/); a(await goal.locator('.bar').count() >= 1, 'شريط التقدم');
    const hire = p.locator('.diwan-hire'); a(await hire.isVisible()); a.equal(await p.locator('[data-act=diwanhire]').count(), 0, 'لا زر قبل تحقق الشروط'); a.match(await hire.innerText(), /150,000/);
    await shot(p, '.ofgoal', 'hire-goal-' + w + '.png'); await noOverflow(p); await p.close();
  }
  { // 2) التوظيف والخزينة والقواعد والتقرير (390)
    const p = await open(390, large); await p.evaluate(() => { __game.S.player.wallet.sar = 400000; __game.renderAll(true); }); a.equal(await p.locator('[data-act=diwanhire]').count() >= 1, true, 'الزر بعد تحقق الشروط');
    const nw0 = await p.evaluate(() => __game.S.player.wallet.sar); await p.locator('.diwan-hire [data-act=diwanhire]').click(); a(await p.evaluate(() => !!__game.S.player.diwan)); a.equal(nw0 - await p.evaluate(() => __game.S.player.wallet.sar), 150000);
    const card = p.locator('section.diwan:not(.diwan-hire)'); a(await card.isVisible()); a.match(await card.innerText(), /خزينة الديوان/); a.match(await card.innerText(), /ما ينتظرك/); a.match(await card.innerText(), /ما فعلته عنك/);
    await p.fill('#dwAmt', '50000'); await p.locator('[data-act=diwandep]').click(); a.equal(await p.evaluate(() => __game.S.player.diwan.box), 50000); a.match(await p.locator('[data-dwbox]').innerText(), /50,000/); await shot(p, '.diwan-box', 'box-390.png');
    await p.fill('#dwAmt', '20000'); await p.locator('[data-act=diwanwd]').click(); a.equal(await p.evaluate(() => __game.S.player.diwan.box), 30000);
    // القائمة المنسدلة: الافتراضيات ثم تغيير الوضع بالاختيار
    await p.locator('details[data-fold=diwan-rules] summary').click(); await p.waitForTimeout(100);
    const rules = () => p.evaluate(() => Object.fromEntries(Object.entries(__game.S.player.diwan.rules).map(([k, v]) => [k, v.mode]))); a.equal(JSON.stringify(await rules()), JSON.stringify({ pay: 'exec', fill: 'exec', sell: 'ask', herd: 'ask' }));
    a.equal(await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=wait]').count(), 1, 'المهلة تظهر مع «اسألني»'); a.equal(await p.locator('.diwan-rule[data-dwtype=pay] select[data-dwf=wait]').count(), 0);
    a.equal(await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=mode] option').count(), 3);
    await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=wait]').selectOption('7'); a.equal(await p.evaluate(() => __game.S.player.diwan.rules.sell.wait), 7);
    await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=mode]').selectOption('mine'); a.equal((await rules()).sell, 'mine'); a.equal(await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=wait]').count(), 0);
    await p.locator('.diwan-rule[data-dwtype=herd] input[data-dwf=max]').fill('7000'); await p.locator('.diwan-rule[data-dwtype=herd] input[data-dwf=max]').press('Tab'); a.equal(await p.evaluate(() => __game.S.player.diwan.rules.herd.max), 7000);
    await p.locator('.diwan-rule[data-dwtype=sell] select[data-dwf=mode]').selectOption('ask'); await shot(p, '.diwan-rule[data-dwtype=sell]', 'rules-390.png');
    // ما ينتظرك: أسئلة بزرّيها، وتذكير بحسناً
    await p.evaluate(() => { const g = __game, S = g.S, D = S.player.diwan; D.ask.push({ id: S.nextId++, type: 'sell', city: 'riyadh', text: 'مخزن الرياض شارف على الامتلاء: أبيع الراكد بالحد الأدنى الذي حددتَه؟', day: S.day, due: S.day + 3, remind: false }); D.ask.push({ id: S.nextId++, type: 'fill', city: 'jeddah', text: 'تذكير: مخزن جدة شارف على الامتلاء', day: S.day, remind: true });
      D.log.unshift({ d: S.day, kind: 'pay', city: 'riyadh', text: 'غطّيتُ أجور الرياض من الخزينة', amount: 84 }); D.log.unshift({ d: S.day, kind: 'sell', city: 'riyadh', text: 'بعتُ 40 وحدة راكدة من مخزن الرياض بحدٍّ أدنى 100٪ من كلفتها', amount: 677 }); S.zakat.start = S.day - (g.E.hawlLen(S, S.day) - 5); g.renderAll(true); });
    const wait = p.locator('.diwan-wait'); a.match(await wait.innerText(), /نفّذ عني/); a.match(await wait.innerText(), /سأتولاها/); a.match(await wait.innerText(), /حسناً/); a.match(await wait.innerText(), /يحول حول زكاتك/, 'موعد الزكاة'); a.match(await p.locator('.diwan-done').innerText(), /غطّيتُ أجور الرياض/); a.match(await p.locator('.diwan-done').innerText(), /بعتُ 40 وحدة/);
    await shot(p, '.diwan-wait', 'report-390.png'); await noOverflow(p);
    const sellQ = p.locator('.diwan-ask', { hasText: 'أبيع الراكد' }); const id = await sellQ.getAttribute('data-dwask'); await sellQ.locator('[data-a=mine]').click(); a.equal(await p.evaluate(i => __game.S.player.diwan.ask.some(x => x.id === +i), id), false, 'سأتولاها تزيل السؤال');
    await p.locator('.diwan-ask', { hasText: 'تذكير' }).locator('[data-a=mine]').click(); a.equal(await p.evaluate(() => __game.S.player.diwan.ask.length), 0);
    // التسريح يعيد الخزينة
    const w1 = await p.evaluate(() => __game.S.player.wallet.sar); await p.locator('[data-act=diwanfire]').click(); a.equal(await p.evaluate(() => __game.S.player.diwan), undefined); a.equal(await p.evaluate(() => __game.S.player.wallet.sar), w1 + 30000); await p.close();
  }
  { // 3) 1100: البطاقة كاملة
    const p = await open(1100, large); await p.evaluate(() => { const A = __game.E.A; __game.S.player.wallet.sar = 900000; A.hireDiwan(__game.S); A.diwanDeposit(__game.S, 100000); __game.renderAll(true); }); await shot(p, 'section.diwan:not(.diwan-hire)', 'diwan-1100.png'); await noOverflow(p); await p.close(); }
  { // 4) مفتاح الرجوع: لا بطاقة ولا هدف
    const p = await open(390, large); await p.evaluate(() => { __game.E.DIWAN.on = false; __game.renderAll(true); }); a.equal(await p.locator('section.diwan').count(), 0); a.doesNotMatch(await p.locator('.ofgoal').innerText(), /ناظر الديوان/); await p.close(); }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS diwan UI 390/1100: goal+progress, hire gating, treasury deposit/withdraw, dropdown rules (mode/wait/max), waiting asks + reminders, report, fire, off switch');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
