// يلعب من أول فتح (?player=1) إلى أول بيع بزرّ «مهمة عمّ سالم» ويقيس الضغطات والأيام والربح الفعلي (WP-07)
const path = require('node:path');
const URL = seed => 'file://' + path.join(__dirname, '../../index.html') + '?player=1&seed=' + seed;
module.exports = async function measure(b, seed, { maxSteps = 400, init, keepOpen, stopWhen } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } }), p = await ctx.newPage(), errs = [];
  if (init) await p.addInitScript(init);
  await p.clock.install(); // الوقت في الصفحة يجري عادياً، ونقدّمه بـfastForward أثناء رحلات القافلة كي لا تطول التجربة بسرعة اللاعب الحقيقي
  p.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now(); let presses = 0;
  const click = async loc => { await loc.first().click(); presses++; await p.waitForTimeout(10); };
  const out = { seed, presses: 0, days: 0, secs: 0, sold: false, pl: null, beats: 0, dots: 0, errs };
  try {
    await p.goto(URL(seed)); await p.waitForFunction(() => !!window.__game);
    await click(p.locator('#coverGo')); await click(p.locator('[data-act=storygo]'));
    const first = () => p.evaluate(() => { const t = __game.S.player.trades.find(x => x.side === 'sell'); return t ? { pl: t.pl, day: __game.S.day } : null; });
    for (let step = 0; step < maxSteps; step++) {
      if (process.env.DBG === '2') console.log('step', step, JSON.stringify(await p.evaluate(() => ({ lesson: !document.getElementById('lesson').hidden && document.getElementById('lesson').dataset.kind, left: __game.S.player.caravans[0].left, day: __game.S.day, modal: !!document.querySelector('#modal .mbox'), rc: !document.getElementById('rcpt').hidden })))); 
      const sold = await first(); if (sold) { out.sold = true; out.pl = Math.round(sold.pl); out.hist = await p.evaluate(() => (__game.S.learn.hist || []).some(h => /لا تحزن/.test(h.t))); await p.waitForTimeout(200); out.rcpt = await p.evaluate(() => { const r = document.getElementById('rcpt'); return r && !r.hidden ? r.innerText : ''; }); out.road = await p.evaluate(() => __game.E.roadOn(__game.S)); out.shock = await p.evaluate(() => __game.E.shocksOn(__game.S)); if (process.env.DBG) { await p.screenshot({ path: '/tmp/fp-rcpt.png' }); out.all = await p.evaluate(() => [...document.querySelectorAll('[data-act=rcptclose]')].map(e => [e.className, e.innerText, e.getBoundingClientRect().toJSON(), e.parentElement.className, e.closest('#rcpt') ? 'in-rcpt' : 'out']).map(x => JSON.stringify(x)).join(' ## ')); }
        if (process.env.DBG) out.rc = await p.evaluate(() => { const b = document.querySelector('#rcpt [data-act=rcptclose]'), r = b && b.getBoundingClientRect(), top = r && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return JSON.stringify({ rect: r && [r.x, r.y, r.width, r.height], top: top && (top.id || top.className || top.tagName), vis: getComputedStyle(document.getElementById('rcpt')).display, anim: document.getAnimations().length }); });
        if (await p.locator('#rcpt [data-act=rcptclose]').count()) { await p.locator('#rcpt [data-act=rcptclose]').click(); out.rcptClosed = await p.evaluate(() => document.getElementById('rcpt').hidden); } if (process.env.DBG) out.trades = await p.evaluate(() => JSON.stringify(__game.S.player.trades.slice(0, 3)) + ' cargo=' + JSON.stringify(__game.S.player.caravans[0].cargo) + ' basis=' + JSON.stringify(__game.S.player.caravans[0].basis) + ' gold=' + __game.S.player.gold + ' msg=' + (document.querySelector('#mission .bub')?.innerText || '')); break; }
      await p.evaluate(() => { __game.setSpeed(0); __game.renderAll(true); });
      const L = p.locator('#lesson:not([hidden])');
      if (await L.count()) {
        if (!out.dots) out.dots = await p.locator('#lesson .dots i').count();
        if (await p.locator('#lesson [data-act=lstart][data-g=sa]').count()) { await click(p.locator('#lesson [data-act=lstart][data-g=sa]')); continue; }
        if (await p.locator('#lesson #pname').count()) { await p.fill('#pname', 'نواف'); await click(p.locator('#lesson [data-act=lname]')); continue; }
        if (await p.locator('#lesson [data-act=datego]').count()) { await click(p.locator('#lesson [data-act=datego]')); continue; }
        if (await p.locator('#lesson [data-act=lchar][data-g=trader]').count()) { await click(p.locator('#lesson [data-act=lchar][data-g=trader]')); continue; }
        if (await p.locator('#lesson [data-act=lans]:not([disabled])').count()) {
          const idx = await p.evaluate(() => { const t = document.querySelector('#lesson .bub b'), q = t && t.textContent, E = __game.E.LS, all = __game.E.STAGES.flatMap(l => l.quiz).concat(E.LEVELS.flatMap(l => l.quiz)); const f = all.find(x => q && q.includes(x.q)); return f ? f.ok : 0; });
          await click(p.locator('#lesson [data-act=lans][data-g="' + idx + '"]')); continue;
        }
        const nxt = p.locator('#lesson [data-act=lrep],#lesson [data-act=lnext],#lesson [data-act=lclose]');
        if (await nxt.count()) { out.beats++; await click(nxt); continue; }
        await p.keyboard.press('Escape'); continue;
      }
      if (await p.locator('#dlg [data-act=roadok]').count()) { await click(p.locator('#dlg [data-act=roadok]')); continue; }
      if (await p.locator('#modal .mbox').count()) { await p.keyboard.press('Escape'); continue; }
      const st = await p.evaluate(() => ({ left: __game.S.player.caravans[0].left }));
      if (st.left > 0) { // الرحلة جارية: اللاعب يغلق دفتر عمّ سالم ويضغط زر التشغيل إن كان الوقت متوقفاً ثم ينتظر الوصول
        for (let w = 0; w < 600; w++) {
          const c = await p.evaluate(() => ({ left: __game.S.player.caravans[0].left, state: document.getElementById('hTimeState')?.dataset.clock || '', salem: !document.getElementById('salemPanel').hidden }));
          if (!c.left || await p.locator('#lesson:not([hidden]),#dlg [data-act=roadok]').count()) break;
          if (c.salem) { await p.evaluate(() => __game.salem(false)); presses++; }
          else if (c.state === 'paused') { await click(p.locator('#hBarPlay')); }
          else { await p.clock.fastForward(2000); await p.waitForTimeout(30); }
        }
        continue;
      }
      await p.evaluate(() => __game.salem(true, 'mission'));
      const run = p.locator('#mission [data-act=mrun]');
      if (stopWhen && await run.count() && stopWhen.test((await p.locator('#mission .bub').first().innerText()).replace(/\s+/g, ' '))) { out.stopped = true; break; }
      if (await run.count()) { if (process.env.DBG) console.log('  mission:', (await p.locator('#mission .bub').first().innerText()).replace(/\s+/g, ' ').slice(0, 110)); await click(run); continue; }
      if (await p.locator('.tut-hl').count()) { await click(p.locator('.tut-hl')); continue; }
      await p.waitForTimeout(50);
    }
    out.days = await p.evaluate(() => __game.S.day);
  } catch (e) { out.err = String(e.message || e).split('\n')[0]; }
  out.presses = presses; out.secs = Math.round((Date.now() - t0) / 100) / 10;
  if (keepOpen) { out.page = p; return out; }
  await ctx.close(); return out;
};
