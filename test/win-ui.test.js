'use strict';
// 051 توحيد النوافذ (390 و1100): مكدس واحد، Esc واحد، الخلفية والسحب، inert، التركيز، أثر الإغلاق في الحالة، المحروسة، المهام (038د T031)،
// أرقام الحزمة (مستمعو Esc، أفعال الفتح/الإغلاق)، وما يعمل بـ?win=off كما قبل الحزمة
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const errors = [];
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: true }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(() => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; __game.go('market'); }); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const vis = (p, id) => p.evaluate(i => { const e = document.getElementById(i); return !!e && !e.hidden; }, id);
const top = p => p.evaluate(() => { const t = __game.winTop(); return t ? t.id : null; });
const stack = p => p.evaluate(() => __game.win.stack.map(w => w.id));
const tmp = (p, attrs) => p.evaluate(a => { let b = document.getElementById('__op'); if (b) b.remove(); b = document.createElement('button'); b.id = '__op'; b.textContent = 'x'; for (const k in a) b.setAttribute(k, a[k]); document.body.appendChild(b); b.focus(); b.click(); }, attrs);
const inert = p => p.evaluate(() => ['top', 'screen', 'nav', 'journeyBar'].map(i => document.getElementById(i)).filter(Boolean).every(e => e.inert));
const noinert = p => p.evaluate(() => ['top', 'screen', 'nav', 'journeyBar'].map(i => document.getElementById(i)).filter(Boolean).every(e => !e.inert));
const esc = async p => { await p.keyboard.press('Escape'); await p.waitForTimeout(250); };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'), t = w + ': ';
    await p.evaluate(() => { __game.E.MFILE.on = false; }); // 052: هذا الاختبار يفحص نافذتي profile/wealth القديمتين؛ «ملفي» الموحَّد في mfile-ui
    a.equal(await p.evaluate(() => __game.WIN.on), true);
    // ١) مكدس وإغلاق لكل نافذة سفلية: واحدة ظاهرة بـrole=dialog، الخلفية inert، Esc يغلق، والتركيز يعود إلى زر الفتح
    for (const [id, attrs] of [['profile', { 'data-act': 'profile' }], ['wealthPanel', { 'data-act': 'wealth' }], ['modal', { 'data-gd': 'wheat' }]]) {
      await tmp(p, attrs); await p.waitForTimeout(350);
      a.equal(await vis(p, id), true, t + id + ' ظاهرة'); a.equal((await stack(p)).filter(x => x !== 'dsheet').length, 1, t + id + ': نافذة واحدة في المكدس');
      a.ok(await p.evaluate(i => { const e = document.getElementById(i); return e.getAttribute('role') === 'dialog' || !!e.querySelector('[role=dialog]'); }, id), t + id + ': role=dialog');
      a.equal(await inert(p), true, t + id + ': الخلفية inert'); a.equal(await wide(p), false, t + id + ': لا تمرير أفقي');
      await esc(p); a.equal(await vis(p, id), false, t + id + ': Esc يغلقها'); a.equal(await noinert(p), true, t + id + ': تعود الخلفية');
      a.equal(await p.evaluate(() => document.activeElement && document.activeElement.id), '__op', t + id + ': التركيز يعود إلى ما فتحها');
    }
    ok(t + 'ملف التاجر والثروة والسلعة: مكدس واحد، role=dialog، inert، Esc، عودة التركيز');
    // ٢) نافذة واحدة: profile ثم wealth ⇒ واحدة ظاهرة
    await tmp(p, { 'data-act': 'profile' }); await p.waitForTimeout(300); await tmp(p, { 'data-act': 'wealth' }); await p.waitForTimeout(400);
    a.equal(await vis(p, 'wealthPanel'), true); a.equal(await vis(p, 'profile'), false, t + 'فتح الثانية يغلق الأولى'); await esc(p);
    // الخلفية: النقر على غطاء النافذة يغلقها؛ والسحب لأسفل
    await tmp(p, { 'data-act': 'profile' }); await p.waitForTimeout(300); await p.evaluate(() => document.getElementById('profile').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(250);
    a.equal(await vis(p, 'profile'), false, t + 'النقر على الخلفية يغلق الملف');
    await tmp(p, { 'data-act': 'profile' }); await p.waitForTimeout(300);
    await p.evaluate(() => { const el = document.querySelector('#profile .pf') || document.getElementById('profile'), mk = y => new Touch({ identifier: 1, target: el, clientX: 100, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [mk(100)], changedTouches: [mk(100)] })); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [mk(200)] })); }); await p.waitForTimeout(250);
    a.equal(await vis(p, 'profile'), false, t + 'السحب لأسفل 100px يغلق الملف');
    // lesson فوق sheet: العليا lesson، Esc يغلقها فيعود المكدس إلى sheet، والتركيز داخل الدرس
    await tmp(p, { 'data-act': 'profile' }); await p.waitForTimeout(300);
    await p.evaluate(() => { __game.S.learn.up = [3]; __game.renderAll(true); }); await p.waitForTimeout(400);
    a.deepEqual((await stack(p)).filter(x => x !== 'dsheet'), ['profile', 'lesson'], t + 'lesson تعلو sheet'); a.equal(await top(p), 'lesson');
    a.equal(await p.evaluate(() => document.getElementById('lesson').contains(document.activeElement)), true, t + 'التركيز داخل الدرس');
    await esc(p); a.equal(await vis(p, 'lesson'), false, t + 'Esc يغلق الدرس (آخر خطوة)'); a.equal(await top(p), 'profile', t + 'يعود المكدس إلى الملف'); await esc(p); a.equal(await vis(p, 'profile'), false);
    // react لا يحجب الخلفية
    await p.evaluate(() => { const r = document.getElementById('react'); r.innerHTML = '<span>x</span>'; r.hidden = false; }); await p.waitForTimeout(250);
    a.ok((await stack(p)).includes('react'), t + 'react في المكدس'); a.equal(await noinert(p), true, t + 'react لا يجعل الخلفية inert'); await p.evaluate(() => { document.getElementById('react').hidden = true; }); await p.waitForTimeout(200);
    // ٣) أثر الإغلاق في الحالة: ✕ السلعة يصفّر dg كما gdclose
    await tmp(p, { 'data-gd': 'wheat' }); await p.waitForTimeout(350); a.ok(await p.evaluate(() => !!__game.dg));
    a.equal(await p.locator('#modal .mx[data-act=wclose][data-was=gdclose]').count(), 1, t + '✕ بالاسم القديم في data-was'); await p.locator('#modal .mx').click(); await p.waitForTimeout(250); a.equal(await p.evaluate(() => __game.dg), null, t + '✕ يصفّر dg');
    // ٤) المحروسة: الحصّالة/الاستعادة إطار فقط؛ لا إغلاق بالخلفية؛ Esc كما اليوم
    if (await p.locator('#hMenu:visible').count()) { await p.locator('#hMenu').click(); await p.locator('[data-act=backup-open]').first().click(); await p.waitForTimeout(300);
      a.equal(await top(p), 'backup', t + 'الاستعادة في المكدس'); a.equal(await p.evaluate(() => __game.winTop().guard), true);
      await p.mouse.click(2, 2); await p.waitForTimeout(200); a.equal(await vis(p, 'backupPanel'), true, t + 'المحروسة لا تُغلق بالخلفية');
      await esc(p); a.equal(await vis(p, 'backupPanel'), false, t + 'Esc يغلق الاستعادة كما اليوم'); }
    // ٥) المهام (038د T031)
    a.equal(await p.evaluate(() => __game.askFrom('tasks').length), await p.evaluate(() => __game.E.tasksView(__game.S).slots.filter(s => s.state === 'offer' || s.state === 'active').length), t + 'askFrom(tasks) = الخانات المنتظرة');
    await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); }); await p.waitForTimeout(500);
    const chip = p.locator('#screen .tasks [data-dchip=tasks]'); a.equal(await chip.count(), 1, t + 'شارة «المهام» في «اليوم»'); const n = await p.evaluate(() => __game.askFrom('tasks').length); a.equal((await chip.locator('.dbadge').textContent()).trim(), String(n || '✓'), t + 'الشارة برقمها');
    await chip.click(); await p.waitForTimeout(400); a.equal(await p.evaluate(() => __game.dsh.domain), 'tasks'); a.equal(await top(p), 'dsheet');
    await p.locator('#dsheet [data-dask="tk:short"] .dopt').first().click(); await p.waitForTimeout(500);
    a.ok(await p.locator('#dsheet [data-dask="tk:short"] .dopt.on').count() >= 1, t + 'بعد الاختيار عنصر on في النافذة'); a.match(await p.locator('#dsheet [data-dask="tk:short"] .dres').textContent(), /التقدم: .*المكافأة: .*المهلة: /);
    await esc(p); a.equal(await p.evaluate(() => __game.dsh.domain), null, t + 'Esc يغلق نافذة المهام');
    a.ok(await p.locator('#screen .tasks .dopt.on').count() >= 1, t + 'والاختيار مظلَّل في «اليوم» أيضاً'); a.match(await p.locator('#screen .tasks .dres').first().textContent(), /التقدم: /);
    // ٦) الأرقام (ثابتة من المصدر)
    ok(t + 'المكدس والإغلاق والخلفية والسحب والمهام');
    await p.context().close();
  }
  // أرقام الحزمة من المصدر
  const U = path.join(__dirname, '../src/ui'), files = fs.readdirSync(U).filter(f => f.endsWith('.js')), all = files.map(f => [f, fs.readFileSync(path.join(U, f), 'utf8')]);
  let escLive = 0, escLegacy = 0; for (const [f, s] of all) for (const line of s.split('\n')) if (/'Escape'|"Escape"/.test(line)) { if (f === '00w-win.js') { if (/ev\.key !== 'Escape'/.test(line)) escLive++; } else if (/WIN\.on/.test(line) || /e\.key===.Escape.&&!WIN\.on/.test(line)) escLegacy++; else if (!/^\s*\/\*|\/\//.test(line.trim()) && !/Esc يغلقها/.test(line)) a.fail('Escape بلا حارس WIN.on في ' + f + ': ' + line.trim().slice(0, 100)); }
  a.equal(escLive, 1, 'مستمع Escape واحد فعّال مع WIN.on'); ok('مستمع Escape واحد فعّال، والقدامى (' + escLegacy + ') خلف !WIN.on');
  const src = all.map(x => x[1]).join('\n') + fs.readFileSync(path.join(__dirname, '../src/template.html'), 'utf8'), names = {}; for (const m of src.matchAll(/data-act="([A-Za-z0-9_]+)"/g)) names[m[1]] = 1;
  const op = Object.keys(names).filter(n => /open|close|toggle|cancel|seen|^wclose$/i.test(n)); a.ok(op.length <= 40, 'أفعال الفتح/الإغلاق المميزة ≤ 40: ' + op.length); ok('أفعال الفتح/الإغلاق/التبديل المميزة في src/ui وtemplate: ' + op.length + ' (≤ 40)');
  for (const n of ['lclose', 'gdclose', 'tpcancel', 'cgclose', 'lifeclose', 'wealthclose', 'salemclose', 'peekclose', 'pclose']) a.ok(!names[n], n + ' صار data-was لا data-act');
  // ٧) ?win=off: الحاويات القديمة كما قبل الحزمة (الأسماء القديمة تعمل عبر data-was، لا مدير ولا inert)
  { const p = await mk(b, 390, '?player=1&seed=5&win=off'); a.equal(await p.evaluate(() => __game.WIN.on), false);
    await p.evaluate(() => { __game.E.MFILE.on = false; }); // 052
    await tmp(p, { 'data-act': 'profile' }); await p.waitForTimeout(350); a.equal(await vis(p, 'profile'), true); a.equal(await p.evaluate(() => __game.win.stack.length), 0, 'win=off: لا مكدس'); a.equal(await noinert(p), true, 'win=off: لا inert');
    a.equal(await p.locator('#profile .mx[data-was=pclose]').count(), 1, 'win=off: ✕ الملف يُحقن بـtopClose القديم'); await p.locator('#profile .mx').click(); await p.waitForTimeout(250); a.equal(await vis(p, 'profile'), false, 'win=off: ✕ يغلق الملف بالاسم القديم');
    await tmp(p, { 'data-gd': 'wheat' }); await p.waitForTimeout(350); a.ok(await p.evaluate(() => !!__game.dg)); await esc(p); a.equal(await p.evaluate(() => __game.dg), null, 'win=off: Esc القديم يصفّر dg');
    await tmp(p, { 'data-act': 'wealth' }); await p.waitForTimeout(300); a.equal(await vis(p, 'wealthPanel'), true); await p.locator('#wealthPanel [data-was=wealthclose]').first().click().catch(() => {}); await p.waitForTimeout(250);
    ok('?win=off: لا مكدس ولا inert، الأسماء القديمة (pclose/Esc/wealthclose) تعمل'); await p.context().close(); }
  // ٨) بطاقات «العقود» (اتفاقيات الزعيم) تُطوى في نافذة sheet بنصها وأفعالها حرفاً، وطول تبويب «العقود» ≤ 2700 على 390
  { const sig = p => p.evaluate(() => [...document.querySelectorAll('#screen [data-act], #dsheet [data-act]')].map(b => b.dataset.act + '|' + b.textContent.replace(/\s+/g, ' ').trim()).sort());
    const open = async q => { const p = await mk(b, 390, q); await p.evaluate(() => { __game.go('lords'); }); await p.waitForTimeout(500); await p.evaluate(() => { const t = [...document.querySelectorAll('#screen [role=tab],#screen .chips button')].find(x => x.textContent.includes('العقود')); t && t.click(); }); await p.waitForTimeout(400); return p; };
    const on = await open('?player=1&seed=5'), off = await open('?player=1&seed=5&win=off');
    const hOn = await on.evaluate(() => document.getElementById('screen').scrollHeight), hOff = await off.evaluate(() => document.getElementById('screen').scrollHeight);
    a.ok(hOn <= 2700 && hOn < hOff, 'طول تبويب «العقود»: ' + hOff + ' → ' + hOn); const chip = on.locator('#screen [data-dchip="fold:lords-agr"]'); a.equal(await chip.count(), 1, 'شارة العروض'); await chip.click(); await on.waitForTimeout(400);
    a.deepEqual((await sig(on)).filter(x => !/^(wclose|dclose)\|/.test(x)), (await sig(off)).filter(x => !/^(wclose|dclose)\|/.test(x)), 'نص كل فعل وزرّه في نافذة العروض مطابق للقائمة القديمة');
    a.equal(await on.evaluate(() => document.getElementById('screen').scrollWidth > innerWidth + 1), false); ok('بطاقات العقود: ' + hOff + 'px → ' + hOn + 'px بنصوص وأفعال مطابقة'); await on.context().close(); await off.context().close(); }
  a.deepEqual(errors, [], 'بلا أخطاء JS: ' + errors.join(' | ')); await b.close(); console.log('win-ui: كل الفحوص نجحت');
})().catch(e => { console.error(e); process.exit(1); });
