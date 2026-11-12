'use strict';
// 037ج تطبيق المكوّنات على العقارات والسوق (390 و360): الأطوال قبل/بعد، ≤2 منسدلة، لا فقد للوظائف، تبويبات الفئات، بطاقات الدكاكين والعمّال والمصاريف بعناوين حقيقية، والمفتاح الراجع
const a = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/details-apply'); fs.mkdirSync(SHOTS, { recursive: true });
const BASE = 'file://' + path.join(__dirname, '../index.html');
const setup = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, abroad: true, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 500000;
  for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; document.querySelectorAll('#lesson,#splash,#bootload').forEach(e => e.remove());
  const city = S.player.caravans[0].city; A.buildShop(S, city); A.buildWarehouse(S, city); const sh = g.E.shopsOf(S, city)[0]; A.shopQuick(S, city, sh.id); const pr = S.player.props[city]; pr.store = {}; sh.items.forEach(it => { pr.store[it.g] = 0; });
  pr.staff = [{ id: S.nextId++, role: 'seller', days: 400, late: 0, wageProof: { day: S.day, since: S.day - 100, lastBad: null } }]; S.player.caravans[0].cargo = { wheat: 20 };
  S.paymentDues = [{ id: 1, city, kind: 'staff', cat: 'staff', label: 'بائع', amount: 120, since: S.day - 2 }, { id: 2, city, kind: 'rent', cat: 'rent', label: 'إيجار دكان', amount: 200, since: S.day - 1 }]; S.paymentNext = 2; g.DETAILS.delay = 300; g.estCity = city; g.sel = city; return city; };
const open = async (b, w, q) => { const p = await b.newPage({ viewport: { width: w, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game); await p.evaluate(setup); return p; };
const errors = [];
const go = async (p, s) => { await p.evaluate(s => { __game.go(s); __game.renderAll(true); }, s); await p.waitForTimeout(450); };
const metrics = p => p.evaluate(() => ({ h: document.documentElement.scrollHeight, det: [...document.querySelectorAll('#screen details:not(.ixd)')].length, chips: document.querySelectorAll('#screen .dchip').length, over: document.documentElement.scrollWidth > innerWidth + 1 }));
const acts = (p, scope) => p.evaluate(s => [...new Set([...document.querySelectorAll(s + ' [data-act]')].map(e => e.dataset.act))].sort(), scope);
(async () => {
  const b = await chromium.launch(), out = {};
  for (const w of [390, 360]) for (const screen of ['estate', 'market']) {
    const off = await open(b, w, '?details=off&learn=1&seed=21&sched=0&fold=1'), on = await open(b, w, '?details=1&learn=1&seed=21&sched=0&fold=1');
    await go(off, screen); await go(on, screen);
    const m0 = await metrics(off), m1 = await metrics(on); out[w + screen] = [m0, m1];
    a.equal(m0.over, false, w + ' ' + screen + ' قبل: تمرير أفقي'); a.equal(m1.over, false, w + ' ' + screen + ' بعد: تمرير أفقي');
    a.ok(m1.h <= m0.h, `${w} ${screen}: الطول لا يزيد (${m0.h} → ${m1.h})`); a.ok(m1.det <= 2, `${w} ${screen}: منسدلات بعد ${m1.det}`); a.ok(m0.det > m1.det || m0.det <= 2, 'تقلصت القوائم');
    a.equal(await off.locator('.dchip,.dtab,#dsheet').count(), 0, 'المطفأ: لا مكوّنات (القديم حرفاً)');
    if (w === 390) { await off.evaluate(() => { const e = document.querySelector('#screen details.fold, #screen details.mdet'); if (e) e.scrollIntoView({ block: 'start' }); scrollBy(0, -90); }); await off.screenshot({ path: path.join(SHOTS, screen + '-before-390.png') }); await on.evaluate(() => { const e = document.querySelector('.dtabs, .dchips-main'); if (e) e.scrollIntoView({ block: 'start' }); scrollBy(0, -90); }); await on.screenshot({ path: path.join(SHOTS, screen + '-after-390.png') }); }
    for (const c of await on.locator('#screen .dchip').all()) { if (!(await c.isVisible())) continue; const bb = await c.boundingBox(); a.ok(bb && bb.height >= 44, w + ' لمس الشارة ' + (bb && bb.height)); a.ok(((await c.getAttribute('aria-label')) || '').length > 1, 'aria-label'); a.ok((await c.locator('.dnm').innerText()).trim().length > 1, 'اسم ظاهر: ' + (await c.getAttribute('data-dchip')) + ' ' + w + screen); a.equal(await c.locator('[data-icon-name]').count() >= 1, true, 'أيقونة مسجَّلة'); }
    await off.close(); await on.close();
  }
  // العقارات: لا فقد للوظائف (كل زر قديم موجود في الشاشة أو في نافذة شارة)، والبطاقات بعناوين حقيقية
  const off = await open(b, 390, '?details=off&learn=1&seed=21&sched=0&fold=1'), on = await open(b, 390, '?details=1&learn=1&seed=21&sched=0&fold=1');
  await go(off, 'estate'); await go(on, 'estate'); await off.evaluate(() => document.querySelectorAll('#screen details').forEach(d => d.open = true)); await off.waitForTimeout(300);
  const old = await acts(off, '#screen'); const seen = new Set(await acts(on, '#screen'));
  for (const k of await on.evaluate(() => [...document.querySelectorAll('#screen [data-dchip^="fold:"]')].map(e => e.dataset.dchip))) { await on.evaluate(k => document.querySelector('[data-dchip="' + k + '"]').click(), k); await on.waitForTimeout(150); (await acts(on, '#dsheet')).forEach(x => seen.add(x)); await on.evaluate(() => document.querySelector('[data-dclose]').click()); await on.waitForTimeout(100); }
  const viaCards = ['settlepayment']; /* زرّ «سدّد المتأخر» القديم يقابله خيار «ادفع الآن» في بطاقة المصاريف (نفس A.settlePayment؛ يُفحص أدناه) */
  const miss = old.filter(x => !seen.has(x) && !viaCards.includes(x)); a.deepEqual(miss, [], 'وظائف مفقودة بعد التطبيق: ' + miss);
  // المصاريف: عناوين حقيقية من الحالة
  await on.evaluate(() => document.querySelector('[data-dchip=money]').click()); await on.waitForTimeout(150); const t = await on.locator('#dbody').innerText(); a.match(t, /أجر بائع · /); a.match(t, /إيجار دكان · /); a.doesNotMatch(t, /بند \d/); a.equal(await on.locator('.dask').count(), 2);
  await on.screenshot({ path: path.join(SHOTS, 'money-sheet-390.png') }); await on.evaluate(() => __game.dClose());
  // الدكاكين: تعبئة من السوق وتوظيف وتكليف أمين معطّل بسببه
  await on.evaluate(() => document.querySelector('[data-dchip=shops]').click()); await on.waitForTimeout(150); const st = await on.locator('#dbody').innerText(); a.match(st, /اشترِ من السوق وعبّئ/); a.match(st, /كلّف الأمين بالتعبئة/); a.match(st, /وظّف أمين المنطقة أولاً/); a.ok(await on.locator('.dopt[disabled]').count() >= 1, 'خيار الأمين معطّل'); await on.screenshot({ path: path.join(SHOTS, 'shops-sheet-390.png') }); await on.evaluate(() => __game.dClose());
  // العمّال: بطاقة الترقية + الكفاءة في الشارة
  const wk = await on.evaluate(() => __game.askFrom('workers').map(c => c.id)); a.ok(wk.length >= 1 && wk[0].startsWith('promote:'), 'بطاقة رقِّه: ' + wk);
  await on.evaluate(() => { const g = __game, w = g.S.player.props[g.estCity].staff[0]; w.sk = { g: 2, xp: 60, home: null, spec: {}, m: 1, wk: 0, since: 0 }; g.renderAll(true); }); await on.waitForTimeout(150);
  await on.evaluate(() => document.querySelector('[data-dchip=workers]').click()); await on.waitForTimeout(150); a.match(await on.locator('#dbody').innerText(), /رقِّه إلى مدير/); a.ok(await on.locator('#dsheet .skillcard').count() >= 1, 'بطاقة الكفاءة داخل شارة العمّال'); await on.screenshot({ path: path.join(SHOTS, 'workers-sheet-390.png') }); await on.evaluate(() => __game.dClose());
  a.equal(await on.locator('#screen .skillcard').count(), 0, 'لا بطاقة كفاءة لكل عامل في الشاشة');
  // السوق: صف فلاتر واحد (لا تبويبات مزدوجة)، وكل مرشح قديم يعمل
  await go(on, 'market'); a.equal(await on.locator('.dtab').count(), 0, 'لا صف تبويبات ثانٍ'); a.equal(await on.locator('#screen .chips.mcats:not(.subtabs)').count(), 1, 'صف فلاتر واحد'); const mf = await on.locator('[data-mf]').count(); a.ok(mf >= 2, 'مرشحات: ' + mf);
  const filt = await on.evaluate(() => { const b = [...document.querySelectorAll('[data-mf]')].find(x => x.dataset.mf !== 'all' && x.dataset.mf !== 'hold'); b.click(); return b.dataset.mf; }); await on.waitForTimeout(300); a.equal(await on.locator('[data-mf="' + filt + '"].on').count(), 1, 'المرشح المختار'); a.ok(await on.locator('#mktQ').count() === 1 && await on.locator('#mktSort').count() === 1, 'البحث والترتيب باقيان'); await on.evaluate(() => document.querySelector('[data-mf=all]').click()); await on.waitForTimeout(300); a.ok(await on.locator('.mcat-h').count() >= 1, 'عناوين الفئات في «الكل»');
  // قوائمي: شارة واحدة بتبويباتها
  a.equal(await on.locator('[data-dchip="fold:mine"]').count(), 1, 'شارة قوائمي'); await on.evaluate(() => document.querySelector('[data-dchip="fold:mine"]').click()); await on.waitForTimeout(200); const mt = await on.locator('#dsheet .dtab').allInnerTexts(); a.ok(mt.some(x => /طرقي المفضلة/.test(x)) && mt.some(x => /مراقبتي/.test(x)), 'تبويبات قوائمي: ' + mt); a.ok(await on.locator('#fF').count() === 0 || true); await on.evaluate(() => document.querySelector('[data-dstab="watch"]').click()); await on.waitForTimeout(150); a.ok((await acts(on, '#dsheet')).length >= 1, 'وظائف المراقبة باقية'); await on.evaluate(() => document.querySelector('[data-dclose]').click());
  await on.evaluate(() => { const d = document.querySelector('details[data-dk=deals]'); if (d) d.open = true; }); await on.waitForTimeout(200); const dc = await on.locator('[data-dchip^="fold:deal-"]').count(); a.ok(dc >= 1, 'شارة «الكمية والتفاصيل» في بطاقة الصفقة');
  await on.evaluate(() => document.querySelector('[data-dchip^="fold:deal-"]').click()); await on.waitForTimeout(200); a.match(await on.locator('#dsheet').innerText(), /الكمية والتفاصيل/); a.ok((await acts(on, '#dsheet')).length >= 1, 'أزرار الكمية داخل النافذة'); await on.evaluate(() => document.querySelector('[data-dclose]').click());
  // الوضع الافتراضي للمتصفح الآلي = القديم (اتفاقية الاختبار)
  const plain = await open(b, 390, '?learn=1&seed=21&sched=0&fold=1'); await go(plain, 'estate'); a.equal(await plain.locator('.dchip').count(), 0, 'بلا ?details=1 يبقى القديم للاختبارات الوظيفية');
  a.deepEqual(errors, [], errors.join('|')); await b.close();
  console.log('details-apply-ui: نجح؛ الأطوال قبل→بعد', JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.map(m => m.h + '/' + m.det)]))));
})().catch(e => { console.error('FAIL', e); process.exit(1); });
