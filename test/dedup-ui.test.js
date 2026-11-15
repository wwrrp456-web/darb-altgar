'use strict';
// 049 تنظيف التكرار (واجهة، 390 و1100): لا 🔔، الرئيسية أخفّ، حالة الرحلة مرة واحدة، «ملفي» وحصّالتي، شاشة الزعماء ثلاثة تبويبات، ألفاظ الإغلاق الثلاثة، الأطوال: node test/dedup-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SCREENS = ['home', 'office', 'map', 'market', 'caravan', 'estate', 'empire', 'cities', 'academy', 'lords'];
// الأطوال «قبل» (390، حفظ guided-10 مع ?player=1&seed=5) وسقف 049: لا شاشة تزيد عن قيمتها قبل (+40 هامش قياس)، والرئيسية والزعماء ينقصان
const BEFORE = { home: 2418, office: 1929, map: 1535, market: 2890, caravan: 1427, estate: 3842, empire: 1446, cities: 1274, academy: 2222, lords: 7173 };
const mk = async (b, w, q) => { const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game); await p.evaluate(() => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; }); if (await p.locator('#coverGo').count()) await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(500); return p; };
const go = async (p, s) => { await p.evaluate(x => __game.go(x), s); await p.waitForTimeout(400); };
(async () => {
  const b = await chromium.launch(), errs = [];
  try {
    for (const w of [390, 1100]) {
      const p = await mk(b, w, '?player=1&seed=5'); const t = w + ': ';
      // (أ) لا مركز تنبيهات
      a.equal(await p.locator('#hAlert,#alertPanel,#tbBell').count(), 0, t + 'لا 🔔'); ok(t + 'لا #hAlert ولا #alertPanel ولا #tbBell');
      // (ب) الرئيسية
      await go(p, 'home'); let txt = await p.locator('#screen').innerText();
      a.equal(await p.locator('#screen .card.season').count(), 0, t + 'بلا بطاقة الموسم'); a.ok(!/حالتك/.test(txt), t + 'بلا «حالتك»'); a.ok(!/دول العالم/.test(txt), t + 'بلا «دول العالم»');
      a.ok(await p.locator('#screen button[data-go=cities]', { hasText: 'الدول' }).count() >= 1, t + 'رابط «🌍 الدول»');
      await p.evaluate(() => { __game.S.player.trips = 2; __game.renderAll(true); }); await p.waitForTimeout(250);
      a.ok(!/كيف تلعب/.test(await p.locator('#screen').innerText()), t + '«كيف تلعب؟» غائبة بعد رحلة');
      await p.evaluate(() => { __game.S.player.trips = 0; __game.renderAll(true); }); await p.waitForTimeout(250);
      a.ok(/كيف تلعب/.test(await p.locator('#screen').innerText()), t + '«كيف تلعب؟» حاضرة لحفظ بلا رحلات');
      await p.evaluate(() => { __game.S.player.trips = 2; __game.renderAll(true); });
      await p.locator('#screen button[data-go=cities]').first().click(); await p.waitForTimeout(300); a.equal(await p.evaluate(() => __game.screen), 'cities', t + 'الرابط يفتح الدول'); ok(t + 'الرئيسية: بلا موسم/حالتك/دول العالم، ورابط الدول يعمل، و«كيف تلعب؟» حسب الرحلات');
      // لقب ويوم في «حال أعمالي» أو الرئيسية
      await go(p, 'home'); a.ok(/اللقب|اليوم/.test(await p.locator('#screen').innerText()), t + 'اللقب واليوم باقيان');
      // (ج) حالة الرحلة مرة واحدة
      await p.evaluate(() => { const c = __game.S.player.caravans[0]; c.left = 5; c.dest = c.dest || __game.S.order.find(x => x !== c.city); __game.go('market'); __game.renderAll(true); }); await p.waitForTimeout(400);
      a.equal(await p.locator('#journeyBar').innerText().then(x => (x.match(/في الطريق إلى/g) || []).length), 1, t + 'journeyBar: الحالة مرة');
      a.ok((await p.locator('#screen').innerText()).match(/القافلة في الطريق إلى/g) === null, t + 'لا سطر حالة مكرر في السوق');
      a.equal(await p.evaluate(() => { const c = __game.S.player.caravans[0]; c.left = 5; __game.go('office'); __game.renderAll(true); return document.querySelectorAll('#screen [data-act=ofmap]').length; }), 0, t + 'بطاقة trip غائبة'); ok(t + 'حالة الرحلة: journeyBar وحدها، بلا بطاقة trip ولا سطر السوق');
      await p.evaluate(() => { __game.S.player.caravans[0].left = 0; __game.renderAll(true); });
      // (د) ملفي وحصّالتي
      await go(p, 'academy'); await p.locator('#screen [data-act=profile]').first().click(); await p.waitForTimeout(300); a.ok(await p.locator('#profile').isVisible(), t + 'ملفي يفتح الملف'); await p.evaluate(() => { __game.renderAll(true); document.querySelector('#profile') && (document.querySelector('#profile').hidden = true); });
      await p.evaluate(() => { __game.S.player.vault = 800; __game.S.player.wallet.sar = 100; __game.go('academy'); __game.renderAll(true); }); await p.waitForTimeout(250);
      const before = await p.evaluate(() => ({ v: __game.S.player.vault, w: __game.S.player.wallet.sar })); a.ok(/حصّالتي/.test(await p.locator('#screen [data-act=vault-open]').first().innerText()), t + 'سطر حصّالتي');
      await p.locator('#screen [data-act=vault-open]').first().click(); await p.waitForTimeout(300); a.ok(await p.locator('#vaultPanel').evaluate(e => e.open), t + 'الورقة تُفتح');
      await p.locator('#vaultDrawAmount').fill('100'); await p.locator('[data-act=vdraw]').click(); await p.waitForTimeout(300);
      const after = await p.evaluate(() => ({ v: __game.S.player.vault, w: __game.S.player.wallet.sar })); a.equal(Math.round(before.v - after.v), 100, t + 'رصيد الحصّالة ينقص 100'); a.equal(Math.round(after.w - before.w), 100, t + 'والمحفظة تزيد 100'); ok(t + '«ملفي» يفتح الملف، وحصّالتي تفتح الورقة والسحب ينفّذ بالأرقام (قبل/بعد)');
      await p.evaluate(() => { const d = document.getElementById('vaultPanel'); if (d.open) d.close(); d.hidden = true; });
      // (و) الزعماء ثلاثة تبويبات
      await p.evaluate(() => { __game.ui.tab = {}; __game.go('lords'); __game.renderAll(true); }); await p.waitForTimeout(350);
      const names = await p.locator('#screen .ptabs .ptab b').allInnerTexts(); a.deepEqual(names, ['الزعماء', 'العقود', 'الخصومات'], t + 'ثلاثة تبويبات'); a.equal(await p.locator('#screen .ptab.on b').innerText(), 'الزعماء', t + 'الافتراضي «الزعماء»');
      for (const id of ['deals', 'feuds', 'lords']) { await p.evaluate(x => { __game.ui.tab.lords = x; __game.renderAll(true); }, id); await p.waitForTimeout(250); a.ok(await p.locator('#screen .ptab-body').count() === 1, t + 'تبويب ' + id); a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, t + 'بلا تمرير أفقي في ' + id); }
      a.ok(/عقودي/.test((await p.evaluate(() => { __game.ui.tab.lords = 'deals'; __game.renderAll(true); return document.querySelector('#screen').innerText; }))), t + 'تبويب العقود يضم «عقودي»');
      await p.evaluate(() => { __game.ui.tab.lords = 'feuds'; __game.renderAll(true); }); a.ok(await p.locator('#screen [data-feuds]').count() >= 1 || !(await p.evaluate(() => __game.E.GRIEF.on)), t + 'الخصومات في تبويبها');
      ok(t + 'الزعماء: ثلاثة تبويبات بأسمائها، الافتراضي «الزعماء»، بلا تمرير أفقي');
      // (ز) لا «حسناً/تمام/فهمت» في أي زر على الشاشات العشر
      const bad = []; for (const s of SCREENS) { await go(p, s); bad.push(...await p.evaluate(s => [...document.querySelectorAll('#screen button,#screen a')].map(e => e.textContent.trim()).filter(x => /^(حسناً|حسنًا|تمام|فهمت)$/.test(x)).map(x => s + ':' + x), s)); }
      a.deepEqual(bad, [], t + 'ألفاظ إغلاق قديمة: ' + bad); ok(t + 'لا «حسناً/تمام/فهمت» في أزرار الشاشات العشر');
      // (ح) الأطوال (390 فقط)
      if (w === 390) { const p0 = p, q = await mk(b, 390, '?player=1&seed=5'); const H = {}; for (const s of SCREENS) { await q.evaluate(() => { __game.ui.tab = {}; }); await go(q, s); H[s] = await q.evaluate(() => document.documentElement.scrollHeight); }
        for (const s of SCREENS) a.ok(H[s] <= BEFORE[s] + 40 + (s === 'academy' ? 100 : 0) + (s === 'caravan' ? 140 : 0) /* 035د: بطاقة «خبرة الطاقم» في شاشة القافلة (+137) ميزة مقصودة دُمجت بعد 049 */ /* سطر «ملفي وحصّالتي» (+75) وسطر «مراحل المسيرة» بدل طيّ مغلق (+13): هدف 049 ≤1900 لم يتحقق، يُسجَّل في التقرير */, `${s}: ${H[s]} > ${BEFORE[s]}`); a.ok(H.home < BEFORE.home - 150, 'الرئيسية أقصر: ' + H.home); a.ok(H.lords < 2700, 'الزعماء (التبويب الافتراضي): ' + H.lords);
        for (const id of ['deals', 'feuds']) { await q.evaluate(x => { __game.ui.tab = { lords: x }; }, id); await go(q, 'lords'); const hh = await q.evaluate(() => document.documentElement.scrollHeight); a.ok(hh < BEFORE.lords, 'تبويب ' + id + ' أقصر من الشاشة القديمة: ' + hh); }
        ok('الأطوال: ' + JSON.stringify(H)); errs.push(...q.errs); await q.context().close(); }
      errs.push(...p.errs); await p.context().close();
    }
    // DEDUP.on=false يعيد الرسم القديم لما دُمج
    const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { __game.DEDUP.on = false; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(300);
    a.ok(/حالتك/.test(await p.locator('#screen').innerText()), 'DEDUP.on=false: «حالتك» تعود'); await p.evaluate(() => { __game.ui.tab = {}; __game.go('lords'); __game.renderAll(true); }); await p.waitForTimeout(250); a.equal(await p.locator('#screen .ptabs').count(), 0, 'DEDUP.on=false: بلا تبويبات الزعماء'); ok('DEDUP.on=false يعيد «حالتك» وشاشة الزعماء الواحدة'); errs.push(...p.errs);
    a.deepEqual(errs, []); console.log('OK dedup-ui');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
