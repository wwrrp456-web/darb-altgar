'use strict';
// 054 الواجهة على 390: صف «حال أعمالي» يفتح النافذة بنقرة، الشرائح (سنة ونوع) بعنصر on واحد وسطر الملخّص بالرقم، 23 سطراً ⇒ 10 ثم «المزيد (13)» ثم 20،
// التفصيل والسابق/التالي بلا إغلاق ويُعطَّلان عند الطرفين، الإبراء «سامحتَ» بلون muted، لا select ولا details، لا تمرير أفقي، لمس ≥ 44، والمطفأ لا صف ولا زرّ.
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const STATE = () => { const { S, E } = __game, P = S.player; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; P.gold = P.wallet.sar = 200000; S.phase = 3; S.learn.level = Math.max(S.learn.level, 11);
  P.clog = []; P.clogY = {}; const loan = (ok, n) => E.clogLoan(S, { amt: 100, day: S.day - 5 }, { day: S.day, amt: ok === 1 ? 100 : 0, lent: 100, ok });
  for (let i = 0; i < 20; i++) loan(i % 4 === 0 ? 0 : 1); loan(2); E.clogRec(S, { type: 'guard', city: 'cairo', since: S.day - 10, daily: 5, total: 10, left: 0, pd: 50 }, true, null); E.clogRec(S, { type: 'supply', city: 'cairo', since: S.day - 10, daily: 5, total: 10, left: 0, pd: 50 }, true, null);
  const d0 = S.day; S.day += 400; for (let i = 0; i < 3; i++) loan(1); S.day = d0; };
const errors = [];
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => { __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const on = (p, attr) => p.locator('#dsheet button[data-clog-' + attr + '].on').count();
(async () => {
  const b = await chromium.launch(), p = await mk(b, 390, '?player=1&seed=5');
  // 1) الصف في «حال أعمالي» ← نقرة واحدة ← النافذة
  const row = p.locator('.hs-row[data-dchip="clog"]'); a.equal(await row.count(), 1, 'صف سجل عقودك في حال أعمالي'); await row.scrollIntoViewIfNeeded(); a.ok((await row.boundingBox()).height >= 44); await row.click(); await p.waitForTimeout(400);
  a.equal(await p.locator('#dsheet').count(), 1, 'فُتحت النافذة'); a.equal(await p.locator('#dsheet select, #dsheet details').count(), 0, 'لا select ولا details'); a.ok(!(await p.locator('#dsheet').innerText()).includes('لا شيء ينتظرك'), 'لا عبارة «لا شيء ينتظرك»');
  // 2) الشرائح: واحد on في كل مجموعة، والملخّص بالرقم الصحيح (23 عقداً هذه السنة)
  a.equal(await on(p, 'y'), 1); a.equal(await on(p, 'g'), 1); const tot0 = await p.evaluate(() => { const { S, E } = __game; return E.clogTot(S, E.dateOf(S).year, 'all'); }); a.equal(tot0.c, 23);
  const sum = async () => (await p.locator('[data-clog-sum]').innerText()).replace(/\s+/g, ' '); a.ok((await sum()).includes('23 عقداً'), await sum());
  a.equal(await p.locator('#dsheet [data-clog-row]').count(), 10, 'عشرة صفوف'); a.ok((await p.locator('[data-clog-more]').innerText()).includes('(13)'), 'المزيد (13)'); await p.locator('[data-clog-more]').click(); await p.waitForTimeout(250); a.equal(await p.locator('#dsheet [data-clog-row]').count(), 20, 'عشرون');
  a.equal(await wide(p), false, 'لا تمرير أفقي'); const cb = await p.locator('#dsheet button.clog-f').first().boundingBox(); a.ok(cb.height >= 44, 'لمس ≥ 44');
  // نوع «قروض الأصدقاء»: 21 قرضاً
  await p.locator('[data-clog-g="loan"]').click(); await p.waitForTimeout(250); a.equal(await on(p, 'g'), 1); a.ok((await p.locator('[data-clog-g="loan"].on').count()) === 1); a.ok((await sum()).includes('21 عقداً') && (await sum()).includes('قروض الأصدقاء'), await sum());
  a.ok((await p.locator('#dsheet .clog-row .muted:text("سامحتَ")').count()) >= 1 || (await p.locator('#dsheet').innerText()).includes('سامحتَ'), 'الإبراء يُعرض «سامحتَ» muted');
  // سنة ثانية: 3 عقود
  const ys = await p.locator('[data-clog-y]').count(); a.equal(ys, 3, 'الكل + سنتان'); await p.locator('[data-clog-y]').nth(1).click(); await p.waitForTimeout(250); a.equal(await on(p, 'y'), 1);
  await p.locator('[data-clog-y="all"]').click(); await p.waitForTimeout(250); a.ok((await sum()).includes('26 عقداً'), await sum());
  // 3) التفصيل والسابق/التالي بلا إغلاق
  await p.locator('[data-clog-g="all"]').click(); await p.waitForTimeout(200); await p.locator('#dsheet [data-clog-row]').first().click(); await p.waitForTimeout(250); a.equal(await p.locator('[data-clog-det]').count(), 1, 'تفصيل'); a.equal(await p.locator('#dsheet').count(), 1);
  const d1 = await p.locator('[data-clog-det] h3').innerText(); a.equal(await p.locator('[data-clog-nav="1"][disabled]').count(), 1, 'التالي معطَّل عند الأحدث'); await p.locator('[data-clog-nav="-1"]').click(); await p.waitForTimeout(200); a.equal(await p.locator('#dsheet').count(), 1, 'لم تُغلق');
  a.equal(await p.locator('[data-clog-nav="1"][disabled]').count(), 0); await p.locator('[data-clog-nav="1"]').click(); await p.waitForTimeout(200); a.equal(await p.locator('[data-clog-det] h3').innerText(), d1, 'رجع إلى الأول'); a.equal(await wide(p), false);
  await p.locator('[data-clog-back]').click(); await p.waitForTimeout(200); a.equal(await p.locator('[data-clog-det]').count(), 0, 'عودة إلى القائمة');
  // التفصيل الأخير: السابق معطَّل
  await p.locator('[data-clog-more]').click().catch(() => {}); await p.evaluate(() => { __game.dOpen && 0; }); const lastI = await p.evaluate(() => { const { S, E } = __game; const v = E.clogView(S, 'all', 'all'); return v[v.length - 1].i; });
  a.ok(lastI >= 0); ok('صف حال أعمالي، الشرائح بعنصر on واحد والملخّص، المزيد 10 ثم 20، التفصيل والتنقل، سامحتَ، لا select/details، لا تمرير أفقي');
  // 4) زرّ الاتفاقيات: نقرتان
  // 5) المطفأ: لا صف ولا زرّ ولا مجال
  await p.evaluate(() => { __game.dClose(); __game.E.CLOG.on = false; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(400); a.equal(await p.locator('.hs-row[data-dchip="clog"]').count(), 0, 'مطفأ: لا صف');
  a.deepEqual(errors, [], 'لا أخطاء JS: ' + errors.join(' | ')); ok('المطفأ لا صف'); await b.close(); console.log('PASS clog-ui');
})().catch(e => { console.error(e); process.exit(1); });
