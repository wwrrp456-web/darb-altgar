// 035أ: البطاقة الموحّدة للموظف (3 أدوار) على 390 بلا تمرير أفقي: node test/skill-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/autopilot-23.json'), 'utf8')).raw, URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5&fold=1&hdr=1', ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/skill');
(async () => {
  const b = await chromium.launch(), errors = []; fs.mkdirSync(SHOTS, { recursive: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; S.learn.datePend = false; S.noEvents = true; S.learn.free = true; S.player.caravans[0].left = 0; g.setSpeed(0);
      const city = Object.keys(S.player.props).find(c => S.player.props[c].shops.length), pr = S.player.props[city];
      pr.staff = [{ id: S.nextId++, role: 'seller', days: 80, late: 0, free: 0 }, { id: S.nextId++, role: 'keeper', days: 10, late: 0, free: 0 }, { id: S.nextId++, role: 'farmer', days: 130, late: 0, free: 0 }];
      pr.mgr = { rank: 2, lv: 1, id: S.nextId++, asset: { kind: 'shop', id: pr.shops[0].id }, wage: 20, days: 30, since: S.day - 30, audit: S.day, late: 0 };
      E.skillMigrate(S); pr.mgr.sk.xp = 30; pr.mgr.sk.m = 0.6; window.__city = city; S.player.caravans[0].city = city; S.learn.level = 11; g.go('estate'); g.renderAll(true); });
    await p.waitForTimeout(400);
    // عمّال: ثلاث بطاقات (بائع، أمين مخزن، مزارع) داخل بطاقة الطاقم في العقارات
    await p.evaluate(() => { __game.go('market'); __game.go('estate'); __game.renderAll(true); }); await p.waitForTimeout(300);
    for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250); }
    const cards = await p.evaluate(() => [...document.querySelectorAll('#screen .skillcard')].map(e => ({ role: e.dataset.skill, txt: e.textContent, bar: !!e.querySelector('[role=progressbar]'), over: e.scrollWidth > e.clientWidth + 1 })));
    const roles = cards.map(c => c.role); for (const r of ['بائع', 'أمين مخزن', 'مزارع']) a.ok(roles.includes(r), 'بطاقة ' + r + ': ' + roles);
    for (const c of cards) { a.ok(c.bar, c.role + ' شريط التقدم'); a.ok(/التخصص:/.test(c.txt) && /تقدم هذا الأسبوع/.test(c.txt) && /(التقدم نحو|بلغ أعلى)/.test(c.txt), c.role + ' محتوى البطاقة'); a.equal(c.over, false, c.role + ' بلا تمرير داخلي'); }
    a.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'بلا تمرير أفقي (العقارات)');
    const card = p.locator('#screen .skillcard').first(); await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'workers-estate-390.jpg'), type: 'jpeg', quality: 55 });
    ok('بطاقات العمّال (بائع وأمين مخزن ومزارع) في العقارات: الدور والتخصص والدرجة وشريط التقدم والسبب والأسبوع، بلا تمرير أفقي (' + cards.length + ' بطاقات)');
    // مدير الممتلك في المكتب (تبويب الإدارة)
    await p.evaluate(() => { __game.ui.tab = { office: 'mgmt' }; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400);
    for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250); }
    const mg = await p.evaluate(() => { const e = [...document.querySelectorAll('#screen .skillcard')].find(x => x.dataset.skill === 'مدير الممتلك'); return e ? { txt: e.textContent, why: /بطء|ضعيفة/.test(e.textContent) } : null; });
    a.ok(mg, 'بطاقة مدير الممتلك في تبويب الإدارة'); a.ok(mg.why, 'سطر السبب يشرح التباطؤ بنتيجة ضعيفة دون عقوبة'); a.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'بلا تمرير أفقي (المكتب)');
    await p.locator('#screen .skillcard').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'manager-office-390.jpg'), type: 'jpeg', quality: 55 }); ok('بطاقة مدير الممتلك في المكتب/الإدارة: تشرح التبطيء بلا عقوبة');
    // أمين المنطقة
    await p.evaluate(() => { const S = __game.S, pr = S.player.props[window.__city]; pr.mgr = { rank: 3, lv: 2, id: S.nextId++, wage: 40, days: 200, span: 6, since: S.day - 200, audit: S.day, late: 0 }; delete pr.mgr.sk; __game.E.skillMigrate(S); __game.renderAll(true); }); await p.waitForTimeout(400);
    for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelectorAll('#screen details').forEach(x => { x.open = true; })); await p.waitForTimeout(250); }
    const st = await p.evaluate(() => { const e = [...document.querySelectorAll('#screen .skillcard')].find(x => x.dataset.skill === 'أمين المنطقة'); return e ? e.textContent : null; });
    a.ok(st && /ماهر/.test(st), 'بطاقة الأمين ماهر'); a.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); await p.locator('#screen .skillcard').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'steward-office-390.jpg'), type: 'jpeg', quality: 55 }); ok('بطاقة الأمين (ماهر) في المكتب');
    // مفتاح الرجوع: المطفأ لا يُظهر بطاقات
    await p.evaluate(() => { __game.E.SKILL.on = false; __game.renderAll(true); }); a.equal(await p.evaluate(() => document.querySelectorAll('#screen .skillcard').length), 0, 'المطفأ بلا بطاقات'); ok('SKILL.on=false يخفي البطاقات');
    a.deepEqual(errors, []); console.log('PASS skill-ui: unified card for 3 worker roles + manager + steward, 390, no horizontal scroll');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
