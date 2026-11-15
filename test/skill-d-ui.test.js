// 035د: بطاقة القائد وسطرا الحرس والطاقم وبطاقتا الشيخ والشهبندر وإشعار الترقية على 390 بلا تمرير أفقي: node test/skill-d-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw, URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1', ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/skill-d');
(async () => {
  const b = await chromium.launch(), errors = []; fs.mkdirSync(SHOTS, { recursive: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    const noH = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E, A = E.A; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.noShocks = true; S.learn.free = true; S.learn.level = 11; S.phase = 3; g.setSpeed(0);
      S.player.gold = 400000; S.player.wallet.sar = 400000; for (let i = 0; i < 3; i++) { A.hireCaptain(S); const c = S.player.caravans.at(-1); c.captain.role = 'loyal'; c.captain.home = 'sa'; c.route = null; c.free = false; c.left = 0; }
      const car = S.player.caravans[1]; car.guards = 3; car.crew = 6; car.gx = { g: 1, xp: 15 }; car.cx = { g: 1, xp: 70 }; car.captain.trade = 5; car.captain.nav = 3; car.captain.combat = 5; car.captain.sk = { g: 2, xp: 100, tr: 130, t1: 1, home: 'trade', spec: {}, m: 1, wk: 0, pl0: 0 };
      A.hireCChief(S); E.sktDay(S); window.__car = car.id; g.go('caravan'); window.carSel = car.id; g.renderAll(true); });
    await p.waitForTimeout(300); await p.evaluate(() => { __game.E.A; }); await p.evaluate(() => { document.querySelector('[data-act=selcar][data-id="' + window.__car + '"]')?.click(); }); await p.waitForTimeout(300);
    // شاشة القافلة: سطرا الحرس والطاقم وبطاقة القائد ظاهرة بلا طيّ
    const t = await p.evaluate(() => { const q = s => [...document.querySelectorAll('#screen ' + s)].map(e => e.textContent); return { gx: q('.sk-gx'), cx: q('.sk-cx'), cap: q('.sk-cap'), vis: [...document.querySelectorAll('#screen .sk-gx,#screen .sk-cx,#screen .sk-cap')].every(e => !e.closest('details:not([open])')) }; });
    a.equal(t.gx.length, 1, 'سطر الحرس'); a.ok(/خبرة الحرس/.test(t.gx[0]) && /حرس مجرَّب/.test(t.gx[0]) && /15 \/ 40/.test(t.gx[0]) && /ينقص النهب 15٪/.test(t.gx[0]), 'الحرس: الاسم والتقدم والأثر بالأرقام: ' + t.gx[0]);
    a.equal(t.cx.length, 1, 'سطر الطاقم'); a.ok(/طاقم معتاد على الدرب/.test(t.cx[0]) && /70 \/ 200/.test(t.cx[0]) && /0.6/.test(t.cx[0]), 'الطاقم: ' + t.cx[0]);
    a.equal(t.cap.length, 1, 'بطاقة القائد'); a.ok(/المهارة الفعّالة/.test(t.cap[0]) && /تجارة 6/.test(t.cap[0]) && /نحو التمييز: 130 \/ 360/.test(t.cap[0]) && /مميَّز \+1/.test(t.cap[0]), 'القائد: ' + t.cap[0]); a.ok(t.vis, 'بلا طيّ (نقرة واحدة من الرئيسية)'); a.ok(await noH(), 'بلا تمرير أفقي (القافلة)');
    await p.locator('#screen .sk-gx').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'caravan-390.jpg'), type: 'jpeg', quality: 55 });
    ok('القافلة: خبرة الحرس والطاقم بأرقامها وما تفتحه، وبطاقة القائد بالمهارة الفعّالة وشريط التمييز، ظاهرة بلا طيّ وبلا تمرير أفقي');
    // الأسطول (الإمبراطورية): بطاقة القائد
    await p.evaluate(() => { __game.go('empire'); __game.renderAll(true); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250);
    a.ok(await p.evaluate(() => [...document.querySelectorAll('#screen .sk-cap')].some(e => /نحو التمييز/.test(e.textContent))), 'بطاقة القائد في الأسطول'); a.ok(await noH(), 'بلا تمرير أفقي (الأسطول)'); ok('الأسطول: بطاقة القائد بشريط التمييز');
    // الشيخ: شارة الدرجة ظاهرة في المكتب/الإدارة (نقرتان) وبطاقته كاملة بعد الفتح
    await p.evaluate(() => { __game.ui.tab = { office: 'mgmt' }; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400);
    const badge = await p.evaluate(() => [...document.querySelectorAll('#screen summary')].map(e => e.textContent).find(x => /شيخ القوافل/.test(x)) || ''); a.ok(/الكفاءة · ماهر/.test(badge), 'شارة الشيخ مرئية بلا فتح: ' + badge);
    for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250); }
    const cc = await p.evaluate(() => { const e = [...document.querySelectorAll('#screen .skillcard')].find(x => x.dataset.skill === 'شيخ القوافل'); return e ? e.textContent : null; }); a.ok(cc && /ماهر/.test(cc) && /تفتح الدرجة التالية/.test(cc) && /معنويات 55/.test(cc), 'بطاقة الشيخ: ' + cc); a.ok(await noH(), 'بلا تمرير أفقي (المكتب)');
    ok('شيخ القوافل: شارة درجته ظاهرة في المكتب وبطاقته بما تفتحه الدرجة (معنويات 55)');
    // إشعار «المطلوب»: ترقية حرس ⇒ بطاقة معلوماتية بزر «افتح بطاقته» تُغلق عند الضغط
    await p.evaluate(() => { const S = __game.S, E = __game.E, car = S.player.caravans.find(c => c.id === window.__car); car.gx.xp = 39.5; E.sktGxXp(S, car, 1); __game.ui.tab = { office: 'today' }; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400);
    const ask = await p.evaluate(() => { const e = document.querySelector('[data-ofc^="skt:"]'); return e ? e.textContent : null; }); a.ok(ask && /حرس محنَّك/.test(ask) && /افتح بطاقته/.test(ask) && /دفاع الحرس 10٪/.test(ask), 'بطاقة المطلوب: ' + ask);
    await p.click('[data-ofc^="skt:"] [data-act=sktopen]'); await p.waitForTimeout(400);
    a.equal(await p.evaluate(() => (__game.S.player.sktAsk || []).length), 0, 'الإشعار يُغلق'); a.ok(await p.evaluate(() => !!document.querySelector('#screen .sk-gx')), 'يفتح بطاقة القافلة'); a.ok(await noH(), 'بلا تمرير أفقي');
    ok('إشعار الترقية: بطاقة «المطلوب» معلوماتية لمرة واحدة، زرها يفتح بطاقة القافلة ويُغلقها');
    // المفتاح مطفأ: لا بطاقات
    await p.evaluate(() => { __game.E.SKT.on = false; __game.go('caravan'); __game.renderAll(true); }); await p.waitForTimeout(300);
    a.equal(await p.evaluate(() => document.querySelectorAll('#screen .sk-gx,#screen .sk-cx,#screen .sk-cap').length), 0, 'المطفأ بلا بطاقات'); ok('SKT.on=false يخفي البطاقات');
    a.deepEqual(errors, [], 'لا أخطاء: ' + errors.join('|'));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
