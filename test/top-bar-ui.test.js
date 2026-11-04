// 031 (docs/design/TOPBAR_SPEC.md): سطران بارتفاع 96px، هوية ← ثروة ← تاريخ ← وقت، وكبسولات بزر «+» داخلها: node test/top-bar-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const fx = n => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/' + n + '.json'), 'utf8')).raw, URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1';
const ok = m => console.log('OK   ' + m);
const SAVES = { start: 'guided-4', mid: 'guided-10', adv: 'autopilot-23' };
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    // الافتراضي: مطفأ والشريط القديم ظاهر
    { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, fx('autopilot-23')); await p.goto(URL); await p.waitForFunction(() => !!window.__game); await p.waitForTimeout(300);
      a.equal(await p.evaluate(() => __game.TOPBAR.on), false, 'مطفأ افتراضياً'); a.equal(await p.evaluate(() => document.body.classList.contains('tb2on')), false); a.equal(await p.evaluate(() => getComputedStyle(document.getElementById('tb2')).display), 'none'); a.ok(await p.evaluate(() => document.getElementById('hBarSar').getBoundingClientRect().width > 0), 'الشريط القديم ظاهر'); ok('الافتراضي TOPBAR.on=false: الشريط القديم ظاهر والجديد مخفي'); await p.context().close(); }
    for (const [key, f] of Object.entries(SAVES)) for (const theme of ['light', 'dark']) for (const width of [390, 360, 1100]) {
      const ctx = await b.newContext({ viewport: { width, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, fx(f)); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(([key, theme]) => { const g = __game, S = g.S; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.player.caravans[0].left = 0;
        if (key === 'adv') { const w = S.player.wallet; w.sar = 88e6; w.usd = 12500; w.au = 350.5; w.ag = 1200; S.player.famDebt = { left: 42000, amt0: 80000 }; S.player.vault = 90000; }
        document.documentElement.dataset.theme = theme; g.TOPBAR.on = true; g.setSpeed(0); g.go('home'); g.renderAll(true); }, [key, theme]); await p.waitForTimeout(350);
      const m = await p.evaluate(() => { const t = document.getElementById('top'), vis = id => { const e = document.getElementById(id); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; };
        const texts = [...document.querySelectorAll('#tb2 .tb-rank,#tb2 .tb-n,#tb2 .tb-date b,#tb2 .tb-date small,#tb2 .tb-more b')].filter(e => e.getBoundingClientRect().width).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className + ':' + e.textContent);
        const small = [...document.querySelectorAll('#tb2 button')].filter(e => e.getBoundingClientRect().width > 0).filter(e => { const r = e.getBoundingClientRect(); return r.width < 43.9 || r.height < 43.9; }).map(e => e.id || e.className);
        const rows = new Set([...document.querySelectorAll('#tb2 .tb-r1 > *')].map(e => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.bottom) / 2 / 10); })), caps = [...document.querySelectorAll('#tbRes .tb-cap:not([hidden])')].map(e => e.dataset.cap), res = document.getElementById('tbRes'), rr = res.getBoundingClientRect(), capsOk = [...res.querySelectorAll('.tb-cap:not([hidden]),.tb-more:not([hidden])')].every(e => e.getBoundingClientRect().right <= rr.right + 12 && e.getBoundingClientRect().left >= rr.left - 12);
        const lum = c => { const k = /^color\(/.test(c) ? 255 : 1, v = c.match(/[\d.]+/g).map(Number).slice(0, 3).map(x => x * k).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return v[0] * .2126 + v[1] * .7152 + v[2] * .0722; };
        const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor, al = (c.match(/[\d.]+/g) || [])[3]; if (al === undefined || +al > .5) return c; } return 'rgb(255,255,255)'; };
        const ratios = [...document.querySelectorAll('#tb2 .tb-rank,#tb2 .tb-n,#tb2 .tb-date b,#tb2 .tb-date small')].filter(e => e.getBoundingClientRect().width).map(e => { const f = lum(getComputedStyle(e).color), g = lum(bgOf(e)); return +((Math.max(f, g) + .05) / (Math.min(f, g) + .05)).toFixed(2); });
        return { h: Math.round(t.getBoundingClientRect().height), over: document.documentElement.scrollWidth > innerWidth + 1, need: ['tbAv', 'tbRank', 'tbProg', 'tbNw', 'tbDate', 'tbPlay', 'tbRes', 'tbDrawer'].map(vis), texts, small, onerow: rows.size === 1, caps, capsOk, minRatio: Math.min(...ratios), ids: ['hSar', 'hLoad', 'hDebt', 'hHawl', 'hAvatar', 'hNW', 'hProg', 'hMenu', 'hTimeState', 'topDrawer'].filter(id => !document.getElementById(id)) }; });
      const tag = `${key}/${theme}/${width}`; a.equal(m.h, 96, tag + ' الارتفاع'); a.equal(m.over, false, tag + ' تمرير أفقي'); a.ok(m.need.every(Boolean), tag + ' عناصر ' + m.need); a.deepEqual(m.texts, [], tag + ' نصوص مقصوصة'); a.deepEqual(m.small, [], tag + ' أهداف اللمس'); a.ok(m.onerow, tag + ' السطر الأول'); a.ok(m.capsOk, tag + ' الكبسولات داخل السطر'); a.ok(m.caps[0] === 'sar', tag + ' الريال أولاً ' + m.caps); a.ok(m.minRatio >= 4.5, tag + ' التباين ' + m.minRatio); a.deepEqual(m.ids, [], tag + ' المعرّفات (FR-003)');
      if (width === 1100 && theme === 'light') ok(`${key}: 96px، بلا قصّ ولا تمرير، كبسولات ${m.caps.join('/')}، تباين ≥ ${m.minRatio}`);
      if (key === 'adv' && theme === 'light' && width === 390) {
        // تنسيق الأرقام §6، وترتيب الكبسولات، والفيض بكبسولة «+n»، وأهداف اللمس
        const nums = await p.evaluate(() => [8450, 9999, 10000, 45678, 999999, 1000000, 1234567, 9999999, 10000000, 15500000, 1.2e9, 15e9, -45678].map(__game.tbNum || (() => '')));
        const fmt = await p.evaluate(() => typeof tbNum === 'function'); 
        a.ok(m.caps.length >= 1); const more = await p.evaluate(() => { const e = document.querySelector('#tbRes .tb-more'); return { shown: !e.hidden, txt: e.textContent.trim() }; }); a.ok(more.shown && /\+\d/.test(more.txt), 'كبسولة الفيض ' + JSON.stringify(more)); ok('الفيض: كبسولة «⋯ +n» بدل التفاف أو تمرير');
        // «+»: الصرافة أو الحصّالة، والسوق
        await p.evaluate(() => { __game.S.player.vault = 0; __game.renderAll(true); }); await p.evaluate(() => document.querySelector('#tbRes [data-cap=sar] .tb-plus').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => __game.screen), 'cities'); a.ok(await p.evaluate(() => /الصرافة/.test(document.querySelector('#screen').textContent))); ok('+ الريال يفتح الصرافة');
        await p.evaluate(() => { __game.go('home'); __game.renderAll(true); }); await p.evaluate(() => document.querySelector('#tbRes [data-cap=load] .tb-plus').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => __game.screen), 'market'); ok('+ الحمولة يفتح السوق');
        await p.evaluate(() => { __game.go('home'); __game.renderAll(true); });
        // ضغط الكبسولة يفتح قائمة المورد، والثروة «أين أقف»
        await p.locator('#tbRes [data-cap=load] .tb-cbody').click(); await p.waitForTimeout(250); a.ok(await p.evaluate(() => !document.getElementById('resourceMenu').hidden)); ok('ضغط الكبسولة يفتح قائمة المورد'); await p.keyboard.press('Escape');
        // التمرير: يُطوى السطر الثاني
        await p.evaluate(() => { document.body.style.minHeight = '3000px'; window.scrollTo(0, 400); }); await p.waitForTimeout(200); await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(400); a.ok(await p.evaluate(() => document.body.classList.contains('tb-min') && document.getElementById('top').getBoundingClientRect().height < 70), 'يُطوى السطر الثاني'); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); a.equal(await p.evaluate(() => Math.round(document.getElementById('top').getBoundingClientRect().height)), 96, 'يعود'); ok('التمرير يطوي السطر الثاني ويعيده');
        // مفتاح الرجوع: الحفظ لا يتغير
        const s0 = await p.evaluate(() => __game.E.save(__game.S)); await p.evaluate(() => { __game.TOPBAR.on = false; __game.renderAll(true); }); a.equal(await p.evaluate(() => getComputedStyle(document.getElementById('tb2')).display), 'none'); a.ok(await p.evaluate(() => document.getElementById('hBarSar').getBoundingClientRect().width > 0)); a.equal(await p.evaluate(() => __game.E.save(__game.S)), s0); ok('TOPBAR.on=false يعيد الشريط القديم بلا مس بالحفظ');
      }
      await ctx.close();
    }
    // تنسيق الأرقام §6 مباشرة (دالة صرف)
    const p0 = await (await b.newContext()).newPage(); await p0.addInitScript(r => localStorage.setItem('darb-v3', r), fx('guided-4')); await p0.goto(URL); await p0.waitForFunction(() => !!window.__game);
    const got = await p0.evaluate(() => { const f = __game.tbNum; return [8450, 9999, 10000, 45678, 999999, 1000000, 1234567, 9999999, 10000000, 15500000, 1.2e9, 15e9].map(f); });
    a.deepEqual(got, ['8,450', '9,999', '10K', '45K', '999K', '1.0M', '1.2M', '9.9M', '10M', '15M', '1.2B', '15B']); ok('تنسيق الأرقام §6: ' + got.join(' '));
    a.deepEqual(errors, []); console.log('PASS top-bar-ui: 3 saves × light/dark × 390/360/1100: 96px, no clipping, caps order, plus targets, overflow chip, scroll collapse, switch');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
