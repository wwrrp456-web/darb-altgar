// حركة أرجل الجمل والرجل على الخريطة أثناء السفر (حتى مع «تقليل الحركة»)، وزر حفظ الطريق من الخريطة: node test/legs-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const rm of ['no-preference', 'reduce']) for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = rm + ' ' + vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp, reducedMotion: rm })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 50000;
      const m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city && S.cities[i].country === S.cities[m.city].country); E.A.travel(S, m.id, d); g.go('map'); g.renderAll(true); });
    await p.waitForTimeout(500);
    ok(await p.locator('#map .map-caravan.moving .camwalk').count() === 1, tag + 'القافلة المسافرة تعرض شريحة المشي');
    ok(await p.evaluate(() => document.getAnimations().some(a => a.animationName === 'camwalk' && a.playState === 'running')), tag + 'دورة الخطو تعمل فعلاً');
    // الإطارات تتغير بصرياً
    const box = await p.evaluate(() => { document.querySelectorAll('body *').forEach(x => { if (getComputedStyle(x).position === 'fixed' && x.id !== 'nav') x.style.display = 'none'; }); const e = document.querySelector('#map .map-caravan'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2; return { x: Math.max(0, cx - 60), y: Math.max(0, cy - 40), w: 120, h: 80 }; });
    await p.waitForTimeout(200);
    const shots = []; const gaps = [170, 310, 130, 260, 90]; for (let i = 0; i < 5; i++) { shots.push((await p.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h } })).toString('base64')); await p.waitForTimeout(gaps[i]); } // فترات غير منتظمة كي لا تتزامن مع زمن الإطار
    ok(new Set(shots).size >= 2, tag + 'إطارات الأرجل تتبدّل بصرياً (' + new Set(shots).size + ' مختلفة من 5)');
    // زر حفظ الطريق من لوحة المدينة (والقافلة واقفة)
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; m.left = 0; m.city = m.dest || m.city; S.favs = []; const to = S.order.find(i => i !== m.city); window.__to = to; g.renderAll(true); g.go('map'); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-city="' + to + '"></button>'); document.querySelector('.__t').click(); }); await p.waitForTimeout(300);
    if (rm === 'no-preference') {
      ok(await p.locator('#screen [data-act=favtoggle]').count() === 1 && /احفظ هذا الطريق/.test(await p.locator('#screen [data-act=favtoggle]').innerText()), tag + 'لوحة المدينة: زر «احفظ هذا الطريق»');
      const g0 = await p.evaluate(() => ({ g: __game.S.player.gold, c: __game.S.player.caravans[0].city }));
      await p.evaluate(() => document.querySelector('#screen [data-act=favtoggle]').click()); await p.waitForTimeout(200);
      ok(await p.evaluate(() => __game.S.favs.length === 1 && __game.S.favs[0].to === window.__to), tag + 'حفظ الطريق (بداية ووجهة)');
      ok(/محفوظ في طرقي/.test(await p.locator('#screen [data-act=favtoggle]').innerText()) && await p.evaluate(g => __game.S.player.gold === g.g && __game.S.player.caravans[0].city === g.c, g0), tag + 'الزر يتحول لـ«محفوظ» دون مال ولا سفر');
      await p.evaluate(() => document.querySelector('#screen [data-act=favtoggle]').click()); await p.waitForTimeout(200);
      ok(await p.evaluate(() => __game.S.favs.length) === 0, tag + 'الضغط ثانية يلغي الحفظ');
    }
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
