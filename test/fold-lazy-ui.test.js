// EXEC_TASK_03: طيّ كسول للمدن والمكتب والأكاديمية، وذاكرة السوق، ولا وظيفة تُفقد: node test/fold-lazy-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw0 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw;
const j = JSON.parse(raw0), d = j.day, pl = j.player; // الإداريون الثلاثة يُحقنون في الحفظ ثم يملأ التحميل قواعدهم
pl.diwan = { since: d - 60, box: 20000, rules: {}, ask: [], log: [], cool: {}, said: {}, late: 0, paid: 0, covered: 0 }; pl.cchief = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0 }; pl.portm = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0, week: { day: -1, snap: {}, last: 0 } };
const raw = JSON.stringify(j), URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1';
const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw);
    await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    const go = async s => { await p.evaluate(s => { const g = __game; g.S.noEvents = true; g.S.learn.free = true; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) g.S.learn[k] = []; g.S.learn.datePend = false; g.setSpeed(0); g.go(s); }, s); await p.waitForTimeout(300); };
    const H = () => p.evaluate(() => document.documentElement.scrollHeight), acts = () => p.evaluate(() => [...new Set([...document.querySelectorAll('#screen [data-act]')].map(e => e.dataset.act))].sort());
    const openAll = async () => { for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details.fold').forEach(x => { x.open = true; })); await p.waitForTimeout(350); } };
    // المدن: المطوي لا يُرسم محتواه، والطول قصير، والفتح يرسم ويُحفظ
    await go('cities'); a.ok(await H() < 3500, 'المدن قصيرة');
    const closed = await p.evaluate(() => { const ds = [...document.querySelectorAll('details[data-fold^="cities-"]')].filter(x => !x.open); return ds.length ? { n: ds.length, kids: ds[0].querySelectorAll('.citycard').length, key: ds[0].dataset.fold } : null; });
    a.ok(closed && closed.n >= 1 && closed.kids === 0, 'القسم المطوي بلا بطاقات: ' + JSON.stringify(closed));
    await p.evaluate(k => document.querySelector(`details[data-fold="${k}"] > summary`).click(), closed.key); await p.waitForTimeout(400);
    a.ok(await p.locator(`details[data-fold="${closed.key}"] .citycard`).count() > 0, 'يُرسم عند الفتح');
    a.equal(await p.evaluate(k => JSON.parse(localStorage.getItem('darb-ui')).fold[k], closed.key), 1, 'حالة الفتح محفوظة'); ok('المدن: كسول، قصير، والحالة تُحفظ');
    // لا وظيفة تُفقد: كل data-act مع فتح الكل = ما في وضع الفتح الكامل القديم (FOLDLAZY.on=false)
    await openAll(); const lazyActs = await acts();
    await p.evaluate(() => { document.querySelectorAll('#screen details.fold').forEach(x => { x.open = false; }); });
    const full = async s => { const c2 = await b.newContext({ viewport: { width: 390, height: 844 } }), q = await c2.newPage(); await q.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await q.goto(URL.replace('fold=1', 'fold=0')); await q.waitForFunction(() => !!window.__game); await q.evaluate(s => { const g = __game; g.S.noEvents = true; g.S.learn.free = true; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) g.S.learn[k] = []; g.S.learn.datePend = false; g.setSpeed(0); g.go(s); }, s); await q.waitForTimeout(400); const r = await q.evaluate(() => [...new Set([...document.querySelectorAll('#screen [data-act]')].map(e => e.dataset.act))].sort()); await c2.close(); return r; };
    const oldCities = await full('cities'); for (const x of oldCities) a.ok(lazyActs.includes(x), 'فُقد فعل في المدن: ' + x); ok('المدن: لا وظيفة تُفقد (' + oldCities.length + ' فعلاً)');
    // المكتب: الإداريون الثلاثة والمنافسون مطوية بملخص
    await go('office'); const hOff = await H(); a.ok(hOff < 5200, 'المكتب قصير: ' + hOff);
    const sums = await p.evaluate(() => ['diwan', 'cchief', 'portm', 'rivals'].map(k => { const d = document.querySelector(`details[data-fold="of-${k}"]`); return d ? { k, open: d.open, kids: d.querySelectorAll(':scope > :not(summary)').length, sum: d.querySelector('summary').textContent.trim().slice(0, 40) } : { k, missing: true }; }));
    for (const s of sums) a.ok(!s.missing && !s.open && s.kids === 0 && s.sum.length > 4, 'مطوي بملخص: ' + JSON.stringify(s)); ok('المكتب: ' + hOff + 'px، الأربع مطوية بملخص: ' + sums.map(s => s.sum).join(' | '));
    // سؤال ينتظر يفتح بطاقة الناظر تلقائياً
    await p.evaluate(() => { const g = __game, S = g.S, D = S.player.diwan; D.ask.push({ id: S.nextId++, type: 'sell', city: 'riyadh', text: 'سؤال اختبار؟', day: S.day, due: S.day + 3 }); g.renderAll(true); }); await p.waitForTimeout(300);
    const auto = await p.evaluate(() => { const d = document.querySelector('details[data-fold="of-diwan"]'); return { open: d.open, ask: !!d.querySelector('.diwan-ask'), sum: d.querySelector('summary').textContent }; });
    a.ok(auto.open && auto.ask && /ينتظرك/.test(auto.sum), 'السؤال يفتح البطاقة: ' + JSON.stringify(auto)); ok('المكتب: السؤال المعلّق يفتح بطاقة الناظر تلقائياً');
    await p.evaluate(() => { __game.S.player.diwan.ask.length = 0; __game.renderAll(true); });
    await openAll(); const lazyOff = await acts(); const oldOff = await full('office');
    for (const x of oldOff) if (!/^(dwask|ofhire)/.test(x)) a.ok(lazyOff.includes(x), 'فُقد فعل في المكتب: ' + x); ok('المكتب: لا وظيفة تُفقد (' + oldOff.length + ' فعلاً)');
    // الأكاديمية
    await p.evaluate(() => document.querySelectorAll('#screen details.fold').forEach(x => { x.open = false; })); await go('academy'); await p.evaluate(() => document.querySelectorAll('#screen details[data-fold^="academy-"]').forEach(x => { x.open = false; })); await p.waitForTimeout(300);
    const hAc = await H(); a.ok(hAc < 4000, 'الأكاديمية قصيرة: ' + hAc); await openAll(); const lazyAc = await acts(); const oldAc = await full('academy'); for (const x of oldAc) a.ok(lazyAc.includes(x), 'فُقد فعل في الأكاديمية: ' + x); ok('الأكاديمية: ' + hAc + 'px، لا وظيفة تُفقد (' + oldAc.length + ' فعلاً)');
    // السوق: ذاكرة تقدير البيع تعطي النتيجة نفسها وتتجدد بتغيّر اليوم
    await go('market'); const memo = await p.evaluate(() => { const g = __game; g.renderAll(true); const n1 = document.querySelector('#screen').innerHTML; const day = g.S.day; g.renderAll(true); const n2 = document.querySelector('#screen').innerHTML; return { same: n1 === n2, day }; });
    a.ok(memo.same, 'السوق ثابت بين رسمين'); ok('السوق: رسمان متتاليان متطابقان');
    a.equal(errors.length, 0, errors.join('\n')); await ctx.close();
    console.log('PASS fold-lazy-ui: cities/office/academy lazy folds, auto-open on pending ask, no function lost, market stable');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
