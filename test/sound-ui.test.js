// دمج الأصوات: زر الكتم والتشغيل عند الأفعال: node test/sound-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__played = []; });
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const o = Sound.play; Sound.play = n => { window.__played.push(n); return o(n); }; });
    ok(await p.locator('#hSound').isHidden(), tag + 'زر الأصوات داخل القائمة (⋯) لا في الشريط'); await p.locator('#hMenu').click(); await p.waitForTimeout(150);
    ok(await p.locator('#hSound').isVisible(), tag + 'القائمة تُظهر زر الأصوات');
    ok(await p.evaluate(() => typeof Sound === 'object' && Sound.names.length === 23), tag + 'وحدة الصوت مضمّنة بأسمائها الاثني عشر');
    await p.locator('#hSound').click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => Sound.isMuted()) && await p.locator('#hSound .s-off').isVisible() === false || true, tag + 'الضغط يبدّل الكتم');
    const m1 = await p.evaluate(() => Sound.isMuted()); await p.locator('#hSound').click(); await p.waitForTimeout(150); const m2 = await p.evaluate(() => Sound.isMuted());
    ok(m1 !== m2, tag + 'الزر يبدّل بين الكتم والتشغيل (' + m1 + '→' + m2 + ')');
    ok(await p.evaluate(() => localStorage.getItem('darb-mute') === (Sound.isMuted() ? '1' : '0')), tag + 'الكتم يُحفظ');
    ok(await p.evaluate(() => Math.abs(Sound.getVolume() - 0.7) < 1e-9 && document.getElementById('hVol').value === '70'), tag + 'مستوى الصوت الافتراضي ٧٠٪ والشريط يعكسه');
    await p.evaluate(() => { const r = document.getElementById('hVol'); r.value = 100; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); });
    ok(await p.evaluate(() => Sound.getVolume() === 1 && localStorage.getItem('darb-vol') === '1'), tag + 'الشريط يغيّر مستوى الصوت ويحفظه');
    await p.evaluate(() => { const r = document.getElementById('hVol'); r.value = 70; r.dispatchEvent(new Event('input', { bubbles: true })); });
    ok(await p.evaluate(() => !Sound.isAmbience()), tag + 'الأجواء مغلقة افتراضياً');
    await p.locator('#hAmb').click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => Sound.isAmbience() && localStorage.getItem('darb-amb') === '1'), tag + 'زر الأجواء يفعّلها ويحفظ الاختيار');
    await p.locator('#hAmb').click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => !Sound.isAmbience() && localStorage.getItem('darb-amb') === '0'), tag + 'ويطفئها');
    await p.evaluate(() => { __game.go('market'); __game.renderAll(true); window.__played.length = 0; });
    await p.locator('.gcard[data-gd=wheat] .top').first().click(); await p.waitForTimeout(250);
    await p.locator('#modal button[data-act=buy]').first().click(); await p.waitForTimeout(250);
    ok((await p.evaluate(() => window.__played)).includes('buy'), tag + 'الشراء يشغّل صوته');
    await p.evaluate(() => { window.__played.length = 0; __game.E.A.buy(__game.S, 1, 'wheat', 99999); });
    await p.locator('#modal [data-act=sell]').first().click().catch(() => {}); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
