'use strict';
// 037ب مكوّنات التفاصيل (المنطق): نافذة واحدة، الإغلاق، اكتمال البطاقة من الحالة وبقاؤه بعد إعادة التحميل، خيار معطّل بسببه، المفتاح، والتأجيل
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, abroad: true, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 500000;
  for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; document.querySelectorAll('#lesson,#splash,#bootload').forEach(e => e.remove());
  const city = S.player.caravans[0].city; A.buildShop(S, city); const sh = g.E.shopsOf(S, city)[0]; A.shopQuick(S, city, sh.id); const pr = S.player.props[city]; pr.store = {}; sh.items.forEach(it => { pr.store[it.g] = 0; }); pr.staff = [];
  S.paymentDues = [{ id: 1, city, kind: 'staff', cat: 'staff', label: 'أجر العمال', amount: 100, since: S.day - 1 }]; S.paymentNext = 1; g.DETAILS.delay = 300; g.renderAll(true); return city; };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async () => { const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?details=lab&learn=1&seed=21&sched=0&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.waitForTimeout(200); return p; };
  const p = await open(), G = f => p.evaluate(f);
  // الشارات ظاهرة بالاسم والرقم
  await G(() => __game.dOpen && 0); await G(() => document.querySelector('[data-dchip="shops"]').click()); await p.waitForTimeout(100);
  a.equal(await p.locator('.dsheet').count(), 1, 'نافذة واحدة');
  let ids = await G(() => __game.askFrom('shops').map(c => c.id)); a.ok(ids.some(i => i.startsWith('restock:')) && ids.some(i => i.startsWith('seller:')), 'بطاقتا التعبئة والبائع من الحالة: ' + ids);
  // نافذة واحدة فقط: فتح شارة أخرى يستبدل النافذة
  await G(() => document.querySelector('[data-dchip="money"]').click()); await p.waitForTimeout(50);
  a.equal(await p.locator('.dsheet').count(), 1, 'نافذة واحدة بعد شارة ثانية'); a.equal(await G(() => __game.dsh.domain), 'money'); a.equal(await p.locator('.dsheet').getAttribute('aria-label'), 'المصاريف');
  // الإغلاق: ✕ والخلفية وEsc والسحب لأسفل
  for (const how of ['x', 'scrim', 'esc', 'swipe']) {
    await G(() => __game.dClose()); await G(() => document.querySelector('[data-dchip="money"]').click()); await p.waitForTimeout(30); a.equal(await p.locator('.dsheet').count(), 1, how + ' افتح');
    if (how === 'x') await G(() => document.querySelector('[data-dclose]').click()); if (how === 'scrim') await G(() => document.querySelector('[data-dscrim]').click()); if (how === 'esc') await p.keyboard.press('Escape');
    if (how === 'swipe') await G(() => { const sh = document.getElementById('dsheet'), mk = (t, y) => new TouchEvent(t, { bubbles: true, touches: t === 'touchend' ? [] : [new Touch({ identifier: 1, target: sh, clientY: y })], changedTouches: [new Touch({ identifier: 1, target: sh, clientY: y })] }); sh.dispatchEvent(mk('touchstart', 300)); sh.dispatchEvent(mk('touchend', 420)); });
    await p.waitForTimeout(30); a.equal(await p.locator('.dsheet').count(), 0, how + ' يغلق');
  }
  // بطاقة واحدة مفتوحة في كل مرة
  await G(() => document.querySelector('[data-dchip="shops"]').click()); await p.waitForTimeout(30);
  a.equal(await p.locator('.dask.open').count(), 1, 'الأولى مفتوحة'); const cards = await p.locator('.dask').count(); a.ok(cards >= 2);
  await p.locator('.dask:not(.open) .dhd').first().click(); await p.waitForTimeout(30); a.equal(await p.locator('.dask.open').count(), 1, 'واحدة فقط بعد الضغط');
  // خيار معطّل بسببه: لا أمين
  await G(() => document.querySelector('[data-dclose]').click());
  await G(() => document.querySelector('[data-dchip="money"]').click()); await p.waitForTimeout(30);
  const dis = await p.locator('.dopt[disabled]'); a.equal(await dis.count(), 1, 'خيار الأمين معطّل'); a.match(await dis.innerText(), /كلّف الأمين بالسداد/); a.match(await dis.innerText(), /وظّف أمين المنطقة أولاً/, 'سببه ظاهر');
  a.equal(await dis.evaluate(e => e.getAttribute('aria-disabled')), 'true'); a.ok(await p.locator('.dopt.best .drec').count() === 1, 'مقترح واحد');
  const before = await G(() => __game.S.player.gold);
  // الإكمال من الحالة: ادفع → تُسدَّد الدفعة فتصير البطاقة منجزة بسطر نتيجة ثم تغيب
  await p.locator('.dopt.best').click(); await p.waitForTimeout(50);
  a.equal(await G(() => (__game.S.paymentDues || []).length), 0, 'سُدّد المستحق في المحرك'); a.ok(await G(() => __game.S.player.gold) < before);
  a.equal(await p.locator('.dask[data-state=done] .dres').count(), 1, 'بطاقة منجزة بسطر نتيجة'); await p.waitForTimeout(900);
  a.equal(await p.locator('.dask').count(), 0, 'انطوت'); a.match(await p.locator('#dbody').innerText(), /لا شيء ينتظرك/);
  // الاستمرار بعد إعادة التحميل: لا بطاقة مدفوعة
  const saved = await G(() => __game.E.save(__game.S));
  const p2 = await b.newPage({ viewport: { width: 390, height: 844 } }); p2.on('pageerror', e => errors.push(e.message)); await p2.goto('file://' + path.join(__dirname, '../index.html') + '?details=lab&learn=1&seed=21&sched=0&fold=1'); await p2.waitForFunction(() => !!window.__game);
  const again = await p2.evaluate(s => { const S2 = __game.E.load(s); __game.S.paymentDues = S2.paymentDues; return { dues: (S2.paymentDues || []).length, money: __game.askFrom('money').length }; }, saved); a.equal(again.dues, 0); a.equal(again.money, 0, 'لا بطاقة بعد إعادة التحميل: الاكتمال مشتق من الحالة');
  // التأجيل: يختفي ثم يعود بعد المهلة (حالة ui اختيارية)
  await G(() => { const g = __game; g.S.paymentDues = [{ id: 2, city: g.S.player.caravans[0].city, kind: 'staff', cat: 'staff', label: 'أجر', amount: 50, since: g.S.day }]; g.dClose(); g.dOpen('money'); }); await p.waitForTimeout(30);
  await p.locator('.dopt', { hasText: 'أجّل' }).click(); await p.waitForTimeout(50); a.equal(await G(() => __game.askFrom('money').length), 0, 'مؤجَّل'); a.equal(await G(() => __game.S.paymentDues.length), 1, 'المستحق باقٍ في المحرك كما هو');
  await G(() => { __game.S.day += 8; }); a.equal(await G(() => __game.askFrom('money').length), 1, 'يعود بعد المهلة');
  // إخفاء زائد: أكثر من ثلاث بطاقات → «+ N أخرى»
  await G(() => { const g = __game, c = g.S.player.caravans[0].city; g.S.paymentDues = [1, 2, 3, 4, 5].map(i => ({ id: 10 + i, city: c, kind: 'staff', cat: 'staff', label: 'بند ' + i, amount: 10 * i, since: g.S.day })); g.dClose(); g.dOpen('money'); }); await p.waitForTimeout(30);
  a.equal(await p.locator('.dask').count(), 3, 'ثلاث ظاهرة'); a.match(await p.locator('.dmore').innerText(), /\+ 2 أخرى/);
  // المفتاح: DETAILS.on=false لا يُرسم شيء
  await G(() => { __game.DETAILS.on = false; __game.dClose(); }); a.equal(await G(() => __game.dchip({ id: 'x', icon: 'ui-shops', count: 1 }) + __game.askFrom('shops').length), '0', 'مطفأ'); a.equal(await p.locator('.dchip,.dsheet,.dlab').count(), 0);
  a.deepEqual(errors, [], 'أخطاء: ' + errors.join('|')); await b.close(); console.log('details: كل الفحوص نجحت');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
