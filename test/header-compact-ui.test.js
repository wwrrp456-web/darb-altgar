// الشريط العلوي المضغوط (النموذج ب): سطر ثابت + لوحة تنفتح: node test/header-compact-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&hdr=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 320, height: 640 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.wallet.sar = 111234; S.player.wallet.au = 101.55; g.go('home'); g.renderAll(true); });
    for (let i = 0; i < 5; i++) { await p.evaluate(() => { const x = document.querySelector('#lesson:not([hidden]) [data-act=lclose]'); x && x.click(); }); await p.waitForTimeout(100); }
    const bar = await p.evaluate(() => { const t = document.getElementById('top'), r = t.getBoundingClientRect(); return { h: Math.round(r.height), sticky: getComputedStyle(t).position, panel: getComputedStyle(document.getElementById('topPanel')).display, over: document.documentElement.scrollWidth > innerWidth, sar: document.querySelector('#hBarSar span').textContent.trim() }; });
    ok(bar.h <= 100, tag + 'ارتفاع الشريط المضغوط ' + bar.h); ok(bar.sticky === 'sticky', tag + 'الشريط ثابت'); ok(bar.panel === 'none', tag + 'اللوحة مغلقة افتراضياً'); ok(!bar.over, tag + 'بلا تمرير أفقي'); ok(/111/.test(bar.sar), tag + 'الريال في الشريط ' + bar.sar);
    const nw = await p.evaluate(() => ['hTitle', 'hNW'].map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return !(e.scrollWidth > e.clientWidth + 1) && r.right <= innerWidth + 1 && r.left >= -1; }));
    ok(nw.every(Boolean), tag + 'مربع اللقب لا يُقتطع');
    await p.evaluate(() => document.getElementById('topDrawer').click()); await p.waitForTimeout(250);
    const open = await p.evaluate(() => { const pn = document.getElementById('topPanel'), r = pn.getBoundingClientRect(); const vis = id => { const e = document.getElementById(id); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; }; return { d: getComputedStyle(pn).display, inside: r.left >= -1 && r.right <= innerWidth + 1, bottom: r.bottom <= innerHeight + 1, vis: ['hCal', 'hSar', 'hLoad', 'bPause', 'b1', 'hMenu'].map(vis), exp: document.getElementById('topDrawer').getAttribute('aria-expanded') }; });
    ok(open.d === 'block' && open.exp === 'true', tag + 'اللوحة تنفتح'); ok(open.inside && open.bottom, tag + 'اللوحة داخل الشاشة'); ok(open.vis.every(Boolean), tag + 'كل أدوات اللوحة ظاهرة ' + open.vis.join(','));
    await p.evaluate(() => document.getElementById('hMenu').click()); await p.waitForTimeout(250);
    const menu = await p.evaluate(() => { const r = document.getElementById('hmenuPanel').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.width > 100; }); ok(menu, tag + 'قائمة ⋯ داخل الشاشة');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150); await p.evaluate(() => { if (document.getElementById('hmenuPanel').classList.contains('show')) document.getElementById('hMenu').click(); });
    await p.evaluate(() => document.querySelector('#screen').click()); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !document.body.classList.contains('hdr-open')), tag + 'يُغلق بالنقر خارجه');
    await p.evaluate(() => document.getElementById('topDrawer').click()); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => !document.body.classList.contains('hdr-open')), tag + 'يُغلق بـ Esc');
    const sp = await p.evaluate(() => { const g = __game; return [g.S.day]; }); await p.evaluate(() => document.getElementById('hBarPlay').click()); await p.waitForTimeout(200);
    ok(await p.evaluate(() => ['⏸', '▶'].includes(document.getElementById('hBarPlay').textContent.trim())), tag + 'زر التشغيل/الإيقاف');
    { const dk = await p.evaluate(() => { const d = document.getElementById('fdock'), r = d.getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), t = document.getElementById('top').getBoundingClientRect(); return { hidden: d.hidden, acts: [...d.querySelectorAll('.fb')].map(x => x.dataset.act), inside: r.left >= 0 && r.right <= innerWidth && r.top >= t.bottom && (innerWidth > 760 || r.bottom <= n.top + 1) }; });
      ok(!dk.hidden && dk.acts.includes('salem') && dk.acts.includes('vault-open'), tag + 'الأزرار العائمة: عمّ سالم والحصّالة ' + dk.acts.join(',')); ok(dk.inside, tag + 'الأزرار داخل الشاشة لا تغطي الشريط ولا التنقل');
      await p.evaluate(() => document.querySelector('#fdock [data-act=salem]').click()); await p.waitForTimeout(300);
      ok(await p.evaluate(() => { const r = document.getElementById('salemPanel').getBoundingClientRect(); return !document.getElementById('salemPanel').hidden && r.left >= -1 && r.right <= innerWidth + 1; }), tag + 'زر عمّ سالم العائم يفتح دفتره');
      await p.evaluate(() => document.querySelector('#fdock [data-act=salem]').click()); await p.waitForTimeout(250);
      ok(await p.evaluate(() => document.getElementById('salemPanel').hidden), tag + 'ويغلقه بالضغطة الثانية');
      if (dk.acts.includes('alerts')) { await p.evaluate(() => document.querySelector('#fdock [data-act=alerts]').click()); await p.waitForTimeout(250); ok(await p.evaluate(() => { const r = document.getElementById('alertPanel').getBoundingClientRect(); return !document.getElementById('alertPanel').hidden && r.left >= -1 && r.right <= innerWidth + 1; }), tag + 'زر الإشعارات يفتح لوحته داخل الشاشة'); await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('#screen').click()); }
      await p.evaluate(() => document.querySelector('#fdock [data-act=vault-open]').click()); await p.waitForTimeout(300);
      ok(await p.evaluate(() => document.getElementById('vaultPanel').open), tag + 'زر الحصّالة العائم يفتحها'); await p.evaluate(() => { const d = document.getElementById('vaultPanel'); d.close && d.close(); __game.renderAll(true); }); }
    await p.evaluate(() => document.querySelector('.hud-nw').click()); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !document.getElementById('wealthPanel').hidden), tag + 'ضغط الثروة يفتح تقرير الثروة');
    await p.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|')); await b.close(); console.log(fails ? fails + ' فشل' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
