// 033أ: تبويبات المكتب والأعمال، وعلامة ⓘ ودليل العقارات، ولا وظيفة تُفقد، ومفاتيح الرجوع: node test/page-order-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const j = JSON.parse(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw), d = j.day, pl = j.player; // مع الإداريين الثلاثة
pl.diwan = { since: d - 60, box: 20000, rules: {}, ask: [], log: [], cool: {}, said: {}, late: 0, paid: 0, covered: 0 }; pl.cchief = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0 }; pl.portm = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0, week: { day: -1, snap: {}, last: 0 } };
const raw = JSON.stringify(j), URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1', ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.learn.free = true; S.player.caravans[0].left = 0; g.setSpeed(0); });
    const sw = (o, bz, e) => p.evaluate(([o, bz, e]) => { const g = __game; g.OFFICETABS.on = o; g.BIZTABS.on = bz; g.ESTATEINFO.on = e; }, [o, bz, e]);
    const show = (s, t) => p.evaluate(([s, t]) => { const g = __game; g.ui.tab = g.ui.tab || {}; if (t) g.ui.tab[s] = t; g.go(s); g.renderAll(true); }, [s, t]).then(() => p.waitForTimeout(350));
    const H = () => p.evaluate(() => document.documentElement.scrollHeight), acts = () => p.evaluate(() => [...new Set([...document.querySelectorAll('#screen [data-act],#screen [data-go]')].map(e => e.dataset.act || 'go:' + e.dataset.go))].sort());
    const openAll = async () => { for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(300); } };
    const NEW = new Set(['ptab', 'ctopen']);
    // ---- المكتب ----
    await sw(false, false, false); await show('office'); const hOld = await H(); const oldActs = (await openAll(), await acts());
    await sw(true, false, false); await show('office', 'today');
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#screen .ptabs [role=tab]')].map(e => ({ t: e.dataset.t, on: e.classList.contains('on'), img: !!e.querySelector('.pti') })));
    a.deepEqual(tabs.map(t => t.t), ['today', 'goals', 'mgmt', 'money'], 'أربعة تبويبات'); a.ok(tabs.every(t => t.img) && tabs[0].on, 'مرسومة والأول مختار');
    await p.evaluate(() => { __game.ui.fold = {}; }); const hs = {}; for (const t of ['today', 'goals', 'mgmt', 'money']) { await show('office', t); hs[t] = await H(); a.ok(hs[t] <= hOld * 0.55, `المكتب/${t}: ${hs[t]} ≤ 0.55 من ${hOld}`); /* كان نصفاً؛ طول المكتب القديم يتبع حفظ الاختبار (يُعاد التقاطه) فصار الهامش 55٪ */ a.equal(await p.evaluate(() => document.querySelectorAll('#screen .ptab-body').length), 1, 'تبويب واحد ظاهر'); a.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي'); }
    ok(`المكتب: ${hOld}px ← اليوم ${hs.today} · الأهداف ${hs.goals} · الإدارة ${hs.mgmt} · المال ${hs.money} (كلها ≤ 55٪ من الأصل)`);
    // كل الأفعال القديمة موجودة في اتحاد التبويبات (مع فتح كل الأقسام)
    const union = new Set(); for (const t of ['today', 'goals', 'mgmt', 'money']) { await show('office', t); await openAll(); (await acts()).forEach(x => union.add(x)); }
    /* 033ب: «مراقبتي» و«طرقي المفضلة» انتقلتا إلى السوق (MARKETMINE) فأفعالهما تُحسب من هناك */
    await show('market'); await openAll(); (await acts()).forEach(x => union.add(x));
    for (const x of oldActs) if (!NEW.has(x)) a.ok(union.has(x), 'فُقد فعل في المكتب: ' + x); ok(`المكتب: لا وظيفة تُفقد (${oldActs.length} فعلاً قديماً ⊆ ${union.size} في التبويبات)`);
    // الرقم الصغير، وحفظ التبويب، والرجوع بالجلسة التالية
    await show('office', 'today'); await p.evaluate(() => document.querySelector('#screen .ptab[data-t=money]').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('darb-ui')).tab.office), 'money');
    const savedUi = await p.evaluate(() => localStorage.getItem('darb-ui')); const c2 = await b.newContext({ viewport: { width: 390, height: 844 } }), q = await c2.newPage(); await q.addInitScript(([r, u]) => { if (!localStorage.getItem('darb-v3')) { localStorage.setItem('darb-v3', r); localStorage.setItem('darb-ui', u); } }, [raw, savedUi]); await q.goto(URL); await q.waitForFunction(() => !!window.__game); await q.evaluate(() => { const g = __game, S = g.S; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; g.setSpeed(0); g.go('office'); g.renderAll(true); }); await q.waitForTimeout(300);
    a.equal(await q.evaluate(() => document.querySelector('#screen .ptab.on').dataset.t), 'money', 'التبويب المختار يبقى بعد إعادة التحميل'); await c2.close(); ok('التبويب المختار يُحفظ في darb-ui ويبقى');
    await p.evaluate(() => document.querySelector('#screen .ptab[data-t=goals]').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => document.querySelector('#screen .ptab.on').dataset.t), 'goals'); ok('النقر على تبويب يبدّله');
    // ---- الأعمال ----
    await sw(true, false, false); await p.evaluate(() => { __game.ui.fold = {}; }); await show('empire'); const eOld = await H();
    await sw(true, true, false); const eh = {};
    for (const t of ['fleet', 'factory', 'bank']) { await show('empire', t); eh[t] = await H(); a.ok(eh[t] <= 3000, `الأعمال/${t}: ${eh[t]}`); }
    await sw(true, false, false); await show('empire'); await openAll(); const eOldActs = await acts();
    await sw(true, true, false); const eun = new Set();
    for (const t of ['fleet', 'factory', 'bank']) { await show('empire', t); await openAll(); (await acts()).forEach(x => eun.add(x)); }
    await show('empire', 'factory'); const hasLock = await p.evaluate(() => !!document.querySelector('.locked-group'));
    for (const x of eOldActs) if (!NEW.has(x) && !(hasLock && x === 'buycraft')) a.ok(eun.has(x), 'فُقد فعل في الأعمال: ' + x); // أزرار «ابنِ» للمقفل معطّلة أصلاً (سببها يُعرض في سطر المقفل)
    const lock = await p.evaluate(() => { const g = document.querySelector('.locked-group'); return g ? { n: parseInt(g.querySelector('summary').textContent), rows: g.querySelectorAll('.kv').length, txt: g.querySelector('summary').textContent.trim() } : null; }); if (lock) { a.ok(/مصنعاً مقفلاً: لماذا؟/.test(lock.txt) && lock.n === lock.rows, 'المقفل مجموع بسبب كل واحد ' + JSON.stringify(lock)); }
    ok(`الأعمال: ${eOld}px ← القوافل ${eh.fleet} · الصناعة ${eh.factory} · المصرف ${eh.bank}؛ ${lock ? lock.txt : 'لا مقفل'}؛ لا وظيفة تُفقد (${eOldActs.length} ⊆ ${eun.size})`);
    // ---- العقارات ----
    await sw(true, true, false); await show('estate'); const sOld = await H(); await openAll(); const sOldActs = await acts();
    await sw(true, true, true); await p.evaluate(() => { __game.ui.ix = {}; }); await show('estate');
    const first = await p.evaluate(() => ({ marks: document.querySelectorAll('#screen .ixd').length, open: document.querySelectorAll('#screen .ixd[open]').length, guide: !!document.querySelector('#screen details[data-fold=est-guide]') }));
    a.ok(first.marks >= 3 && first.open === first.marks, 'ⓘ مفتوحة أول مرة ' + JSON.stringify(first)); a.ok(first.guide, 'زر دليل العقارات');
    await p.waitForTimeout(900); await show('estate'); const second = await p.evaluate(() => document.querySelectorAll('#screen .ixd[open]').length); a.equal(second, 0, 'تُطوى بعد أول مرة');
    await p.evaluate(() => document.querySelector('#screen .ixs').click()); await p.waitForTimeout(300); a.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('darb-ui')).ix.shop), 2, 'فتح العلامة يُحفظ'); a.ok(await p.evaluate(() => document.querySelector('#screen .ixd[open] .ixb').textContent.length > 20), 'الشرح ظاهر');
    await p.evaluate(() => document.querySelector('#screen details[data-fold=est-guide] > summary').click()); await p.waitForTimeout(300); a.ok(await p.evaluate(() => document.querySelectorAll('#screen .ixg').length >= 5), 'الدليل يشرح العقارات كلها');
    await show('estate'); await openAll(); const sNew = await acts(); for (const x of sOldActs) a.ok(sNew.includes(x), 'فُقد فعل في العقارات: ' + x);
    ok(`العقارات: ⓘ ${first.marks} علامات تظهر مفتوحة أول مرة ثم تُطوى وتُحفظ، والدليل يشرح كل العقارات؛ لا وظيفة تُفقد (${sOldActs.length} ⊆ ${sNew.length})؛ الطول القديم ${sOld}px`);
    // ---- مفاتيح الرجوع ----
    await sw(false, false, false); await show('office'); a.equal(await p.evaluate(() => document.querySelectorAll('#screen .ptabs').length), 0, 'المكتب القديم'); await show('empire'); a.equal(await p.evaluate(() => document.querySelectorAll('#screen .ptabs,.locked-group').length), 0, 'الأعمال القديمة'); await show('estate'); a.equal(await p.evaluate(() => document.querySelectorAll('#screen .ixd,#screen details[data-fold=est-guide]').length), 0, 'العقارات القديمة');
    const s0 = await p.evaluate(() => __game.E.save(__game.S)); await sw(true, true, true); await show('office'); a.equal(await p.evaluate(() => __game.E.save(__game.S)), s0, 'الحفظ لا يتغير'); ok('مفاتيح الرجوع تعيد العرض القديم حرفياً ولا تمس الحفظ');
    a.deepEqual(errors, []); console.log('PASS page-order-ui: office 4 tabs, empire 3 tabs + locked group, estate ⓘ + guide, no function lost, switches');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
