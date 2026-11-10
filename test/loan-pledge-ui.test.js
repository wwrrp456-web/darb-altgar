'use strict';
// 041أ واجهة: بطاقة تعثر قرض الصديق (T1 والخيارات الثلاثة وT5) والإمهال المعطّل بسببه، و«من أقرضتَ» في المكتب؛ بلا تمرير أفقي على 390 ولا قائمة منسدلة
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); try { for (const width of [390, 1100]) {
  const p = await b.newPage({ viewport: { width, height: 850 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4'); await p.waitForTimeout(700);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.free = true; S.learn.intro = 11; S.phase = 3; S.player.gold = 90000; S.learn.eq = [];
    const o = { due: S.day, amt: 1000, type: 'secure', day: S.day - 30, id: S.nextId++, pledge: { name: 'أرض وبيت في الرياض', value: 3000 }, st: 'insolvent' }; S.player.loansOut = [o]; S.learn.eq.push({ id: 'floan', day: S.day, lid: o.id, amt: 1000 }); g.renderAll(true); });
  const txt = await p.evaluate(() => document.body.innerText);
  for (const t of ['تعثّر صديقك عن سداد القرض في موعده (المبلغ 1,000 ريال)', 'سامحه وأبرئ ذمته', 'تتنازل عن حقك، وهذا من عظيم الإحسان والأجر.', 'بِع الرهن وخذ حقك', 'أمهله ثلاثين يوماً', 'الرهن وثيقة تحفظ الحق، لا وسيلة لأخذ أكثر منه. وإن كان المدين معسراً فالإنظار خير.', 'أرض وبيت في الرياض']) assert.ok(txt.includes(t), 'يظهر: ' + t);
  assert.equal(await p.locator('[data-act=evch]:visible').count(), 3, 'ثلاثة خيارات لا رابع'); assert.equal(await p.locator('.floan-opts select').count(), 0, 'لا قائمة منسدلة');
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي');
  // الإمهال المعطّل بعد أن أُمهل من قبل
  await p.evaluate(() => { const S = __game.S, ev = S.learn.eq.shift(); __game.renderAll(true); S.player.loansOut[0].waited = true; S.learn.eq.push(ev); __game.renderAll(true); }); await p.waitForTimeout(300);
  assert.equal(await p.locator('[data-act=evch][data-g=wait]:visible').isDisabled(), true); assert.ok((await p.evaluate(() => document.body.innerText)).includes('أمهلتَه من قبل'));
  await p.locator('[data-act=evch][data-g=sell]:visible').click(); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const S = __game.S; return { n: S.player.loansOut.length, f: S.learn.fbq[0], eq: S.learn.eq.length }; }); assert.equal(r.n, 0); assert.equal(r.f.ok, 3); assert.equal(r.f.amt, 1000); assert.equal(r.eq, 0);
  // المكتب: القرض والرهن وحالته، وسجل القرار (سُوْمح / بِيع الرهن)
  const off = await p.evaluate(() => { const S = __game.S; S.learn.eq = []; S.player.loansOut = [{ due: S.day + 10, amt: 700, type: 'secure', day: S.day - 20, id: S.nextId++, pledge: { name: 'أرض وبيت في جدة', value: 2500 }, st: 'waited', waited: true }];
    S.learn.fbq = [{ day: S.day, amt: 0, lent: 1000, ok: 2 }, { day: S.day + 1, amt: 1000, lent: 1000, ok: 3, price: 2800, fee: 84, back: 1716, rest: 0 }]; __game.go('office'); __game.renderAll(true); return document.body.innerText; });
  for (const t of ['الرهن: أرض وبيت في جدة (2,500 ريال)', 'أُمهل', 'سُوْمح', 'أبرأتَ ذمة صديقك من القرض', 'بِيع الرهن', 'بِعتَ الأرض بـ2,800 ريال']) assert.ok(off.includes(t), 'في المكتب: ' + t);
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'المكتب بلا تمرير أفقي'); assert.deepEqual(errors, []); await p.close(); }
  console.log('PASS secured-loan default card (T1–T5), disabled wait and sale at 390/1100; no overflow'); } finally { await b.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
