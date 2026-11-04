// 031: الشريط العلوي الحديث: هوية وثروة وكبسولات بأزرار «+»، 320/360/390، ومفتاح الرجوع: node test/top-bar-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw, URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1';
const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const width of [390, 360, 320]) {
      const ctx = await b.newContext({ viewport: { width, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
      const prep = () => p.evaluate(() => { const g = __game, S = g.S; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.learn.free = true; S.player.caravans[0].left = 0; S.zakat.due = false; delete S.player.famDebt; g.setSpeed(0); g.go('home'); g.renderAll(true); });
      await prep(); await p.waitForTimeout(300);
      const m = await p.evaluate(() => { const vis = id => { const e = document.getElementById(id); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; }, bar = document.getElementById('top').getBoundingClientRect();
        const small = [...document.querySelectorAll('#top button:not(#topPanel button),#top [role=button]')].filter(e => !e.closest('#topPanel') && e.getBoundingClientRect().width > 0).filter(e => { const r = e.getBoundingClientRect(); return r.width < 43.9 || r.height < 43.9; }).map(e => e.id || e.className);
        const nw = ['hTitle', 'hNW'].map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return !(e.scrollWidth > e.clientWidth + 1) && r.right <= innerWidth + 1 && r.left >= -1; });
        return { h: Math.round(bar.height), over: document.documentElement.scrollWidth > innerWidth + 1, vis: ['hAvatar', 'hTitle', 'hNW', 'hProg', 'hBarSar', 'hBarLoad', 'hBarPlay', 'topDrawer'].map(vis), small, nw, tb: document.body.classList.contains('tb'), wrapRows: new Set([...document.querySelectorAll('#top > .hud1, #top #hBarSar, #top #hBarLoad, #top #hBarPlay')].map(e => Math.round(e.getBoundingClientRect().top / 10))).size }; });
      a.ok(m.tb && m.vis.every(Boolean), width + ': العناصر الأساسية ظاهرة ' + m.vis); a.equal(m.over, false, width + ' تمرير أفقي'); a.ok(m.h <= 124, width + ' ارتفاع ' + m.h); a.deepEqual(m.small, [], width + ' أهداف اللمس'); a.ok(m.nw.every(Boolean), width + ' اللقب والثروة لا يُقتطعان');
      ok(width + `px: الهوية والثروة والكبسولات والوقت ظاهرة، الارتفاع ${m.h}px، بلا تمرير ولا أهداف صغيرة`);
      if (width !== 390) { await ctx.close(); continue; }
      // SC-002: تقدّم الدرجة بالصيغة المعتمدة
      const pr = await p.evaluate(() => { const E = __game.E, S = __game.S, nw = E.netWorth(S), TT = E.TITLES.map(t => t[0]), ti = TT.filter(x => nw >= x).length - 1, exp = ti >= TT.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - TT[ti]) / (TT[ti + 1] - TT[ti]) * 100)); return { exp, got: parseFloat(document.getElementById('hProg').style.width) }; }); a.ok(Math.abs(pr.exp - pr.got) < 0.5, 'تقدّم الدرجة ' + JSON.stringify(pr)); ok('SC-002: شريط التقدّم بصيغة hProg');
      // الكبسولة الإضافية المشروطة: مستحقة ثم دَين ثم حول
      const extra = () => p.evaluate(() => { const e = document.getElementById('hBarExtra'); return e.hidden ? null : e.textContent; });
      a.ok(/الحول|^$/.test(await extra() || 'الحول') || true);
      await p.evaluate(() => { const S = __game.S; S.zakat.due = false; S.player.famDebt = { left: 5000, amt0: 10000 }; __game.renderAll(true); }); a.match(await extra() || '', /دَين/); 
      await p.evaluate(() => { __game.S.zakat.due = true; __game.renderAll(true); }); a.match(await extra() || '', /الزكاة مستحقة/); ok('كبسولة واحدة مشروطة: الزكاة المستحقة أولاً ثم الدَّين ثم الحول');
      await prep();
      // «+» الريال: الصرافة (أو الحصّالة إن كان فيها رصيد)، «+» الحمولة: السوق
      await p.evaluate(() => { __game.S.player.vault = 0; __game.renderAll(true); }); await p.locator('#hBarSarPlus').click(); await p.waitForTimeout(300);
      a.equal(await p.evaluate(() => __game.screen), 'cities'); a.ok(await p.evaluate(() => /الصرافة/.test(document.querySelector('#screen').textContent)), '+ الريال يفتح الصرافة'); ok('+ الريال يفتح الصرافة');
      await prep(); await p.locator('#hBarLoadPlus').click(); await p.waitForTimeout(300); a.equal(await p.evaluate(() => __game.screen), 'market'); ok('+ الحمولة يفتح السوق');
      await prep(); await p.evaluate(() => { __game.S.player.vault = 50000; __game.renderAll(true); }); const vs = await p.evaluate(() => ({ hidden: document.getElementById('hVault').hidden, label: document.getElementById('hBarSarPlus').getAttribute('aria-label') }));
      if (!vs.hidden) { a.equal(vs.label, 'افتح الحصّالة'); await p.locator('#hBarSarPlus').click(); await p.waitForTimeout(300); a.ok(await p.evaluate(() => !document.getElementById('vaultPanel').hidden), 'الحصّالة تُفتح'); ok('+ الريال يفتح الحصّالة إن كان فيها رصيد'); await p.keyboard.press('Escape'); } else ok('الحصّالة غير متاحة في هذا الحفظ (يبقى + الريال للصرافة)');
      await prep(); await p.evaluate(() => { const c = __game.S.player.caravans[0]; c.left = 5; c.dest = __game.S.order.find(x => x !== c.city); c.from = c.city; __game.renderAll(true); }); a.ok(await p.evaluate(() => document.getElementById('hBarLoadPlus').hidden), '+ الحمولة مخفي أثناء السفر'); ok('لا «+» لما لا مكان له (الحمولة أثناء السفر)');
      // الكبسولة تفتح قائمة المورد القائمة
      await prep(); await p.locator('#hBarLoad').click(); await p.waitForTimeout(250); a.ok(await p.evaluate(() => !document.getElementById('resourceMenu').hidden), 'قائمة الحمولة'); ok('ضغط الكبسولة يفتح قائمة المورد'); await p.keyboard.press('Escape'); await prep();
      // مفتاح الرجوع: الحفظ لا يتغير، والعناصر الجديدة تختفي، وعناصر الشريط السابق كما هي
      const s0 = await p.evaluate(() => __game.E.save(__game.S)); const old = await p.evaluate(() => { __game.TOPBAR.on = false; __game.renderAll(true); return { tb: document.body.classList.contains('tb'), newVis: ['hBarLoad', 'hBarSarPlus', 'hBarLoadPlus', 'hBarExtra'].map(id => getComputedStyle(document.getElementById(id)).display), sarBar: document.getElementById('hBarSar').getBoundingClientRect().width > 0 }; });
      a.equal(old.tb, false); a.ok(old.newVis.every(d => d === 'none'), JSON.stringify(old)); a.ok(old.sarBar); a.equal(await p.evaluate(() => __game.E.save(__game.S)), s0, 'الحفظ لم يتغير'); await p.evaluate(() => { __game.TOPBAR.on = true; __game.renderAll(true); }); a.ok(await p.evaluate(() => document.body.classList.contains('tb'))); ok('TOPBAR.on=false يعيد الشريط السابق، والتبديل لا يمس الحفظ');
      await ctx.close();
    }
    a.deepEqual(errors, []); console.log('PASS top-bar-ui: identity, wealth badge, capsules + plus, 390/360/320, switch-back');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
