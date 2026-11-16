// 053ب (واجهة، 390 و1100، BAL.on = true): خطوة diffpick، وبطاقة الدفتر وقفلها وتأكيدها، وسطر الحرب، وبطاقة التحدّي، وبلا تمرير أفقي؛ والمطفأ بلا diffpick وببطاقة الدفتر القديمة حرفاً: node test/bal-b-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs'); const URL = 'file://' + path.join(__dirname, '../index.html');
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const digits = s => s.replace(/[^0-9]/g, '');
  const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  for (const w of [390, 1100]) for (const on of [true, false]) { // خطوة البدء
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto(URL + '?learn=1&seed=21&sched=0&fold=1&player=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(on => { __game.E.BAL.on = on; }, on);
    await p.waitForSelector('#coverGo'); await p.click('#coverGo'); await p.waitForSelector('[data-act=storygo]'); await p.click('[data-act=storygo]');
    await p.waitForSelector('#lesson [data-act=lskip]'); await p.click('#lesson [data-act=lskip]'); await p.waitForSelector('#lesson [data-act=lstart]'); await p.click('#lesson [data-act=lstart][data-g=sa]');
    const tag = w + 'px [' + (on ? 'مفعّل' : 'مطفأ') + ']: ';
    if (on) {
      await p.waitForSelector('#lesson [data-act=ldiff]'); const bv = await p.evaluate(() => { const g = __game; return g.E.balView(g.S); });
      ok(await p.locator('#lesson [data-act=ldiff]').count() === 3 && await p.locator('#lesson [data-act=ldiff].on').count() === 1 && await p.locator('#lesson [data-act=ldiff][aria-pressed=true]').count() === 1 && await p.locator('#lesson [data-act=ldiff][data-g=normal].on').count() === 1, tag + 'خطوة diffpick: ثلاثة أزرار، والمتوسط مظلَّل وحده (on + aria-pressed)');
      await p.waitForFunction(() => /مرة كل 30 يوماً/.test((document.querySelector('#lesson') || {}).textContent || ''), null, { timeout: 15000 }); const txt = await p.locator('#lesson').innerText();
      ok(/كيف تحب أن تكون الطريق يا ولدي؟ تستطيع تغييرها لاحقاً من دفتري، مرة كل 30 يوماً/.test(txt) && bv.every(x => digits(txt).includes(String(x.shop)) && txt.includes(x.name) && txt.includes('إيجار ' + x.rentPct + '٪') && txt.includes('الكوارث −' + x.hit + '٪') && txt.includes('التكافل ' + x.cover + '٪') && txt.includes('تفقد قيادة السوق دون ' + Math.round(x.lose * 100) + '٪') && /حرب كل /.test(txt)), tag + 'الوصف بأرقام balView لكل مستوى (أول دكان وإيجار وكوارث وحرب وتكافل وحدّ القيادة)');
      ok(await noOverflow(p), tag + 'لا تمرير أفقي في diffpick');
      await p.click('#lesson [data-act=ldiff][data-g=hard]'); await p.waitForSelector('#lesson #pname');
      ok(await p.evaluate(() => __game.S.diff === 'hard' && __game.S.diffDay === undefined), tag + 'ldiff hard: S.diff = hard بلا diffDay (اختيار البدء لا يبدأ المهلة)');
    } else {
      await p.waitForSelector('#lesson #pname'); ok(await p.locator('#lesson [data-act=ldiff]').count() === 0, tag + 'لا خطوة diffpick: يمضي إلى الاسم مباشرة');
    }
    await ctx.close();
  }
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
  const setup = async (w, on) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(URL + '?player=1&seed=5'); await p.waitForFunction(() => !!window.__game);
    if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
    await p.evaluate(on => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; E.BAL.on = on; S.phase = 3; S.player.gold = 5e5; S.noShocks = true; S.noEvents = true; S.diff = undefined; delete S.diffDay;
      if (!E.shopsOf(S, 'riyadh').length) E.A.buildShop(S, 'riyadh'); __game.go('home'); }, on); await p.waitForTimeout(500); return { ctx, p };
  };
  const openProfile = async p => { await p.evaluate(() => { const b = document.createElement('button'); b.id = '__op'; b.setAttribute('data-act', 'profile'); document.body.appendChild(b); b.click(); }); await p.waitForTimeout(400); };
  for (const w of [390, 1100]) {
    const { ctx, p } = await setup(w, true), tag = w + 'px: ';
    // بطاقة الدفتر: التأكيد ثم القفل
    await openProfile(p); const bv = await p.evaluate(() => __game.E.balView(__game.S));
    ok(await p.locator('[data-act=diff].on').count() === 1 && await p.locator('[data-act=diff][data-k=normal].on').count() === 1 && await p.locator('[data-act=diff]:disabled').count() === 0, tag + 'بطاقة الدفتر: المتوسط مظلَّل وحده ولا قفل قبل أي تغيير');
    await p.evaluate(() => { const { S } = __game; const id = S.order.find(i => S.bosses[i]); S.bosses[id].ruler = 'player'; S.bosses[id].p = 44; S.bosses[id].b = 56; }); // حصة 0.44: تضيع على المتوسط ولا تضيع على المبتدئ
    await p.locator('[data-act=diff][data-k=hard]').first().click(); await p.waitForTimeout(400);
    const sheet = await p.locator('#dsheet').innerText().catch(() => '');
    const pv = await p.evaluate(() => __game.E.balDiffPreview(__game.S, 'hard'));
    ok(sheet.includes('من متوسط إلى عالٍ') && digits(sheet).includes(String(bv[1].shop)) && digits(sheet).includes(String(bv[2].shop)) && sheet.includes('والإيجار ' + bv[2].rentPct + '٪') && sheet.includes('وتفقد قيادة ' + pv + ' سوقاً حالاً') && sheet.includes('ولا تغيّره بعدها 30 يوماً'), tag + 'نافذة التأكيد (ask 037): من متوسط إلى عالٍ، أول دكان X ← Y، الإيجار، عدد الأسواق المفقودة (' + pv + ')، والقفل');
    ok(await p.evaluate(() => __game.S.diff === undefined), tag + 'الضغط وحده لا يغيّر المستوى قبل التأكيد');
    await p.locator('[data-dopt="bal:diff"][data-oid=yes]').first().click(); await p.waitForTimeout(500);
    ok(await p.evaluate(() => __game.S.diff === 'hard' && __game.S.diffDay === __game.S.day), tag + 'التأكيد: S.diff = hard وdiffDay = اليوم');
    await p.evaluate(() => { __game.renderAll(true); }); await p.waitForTimeout(200); if (!await p.locator('[data-act=diff]').count()) await openProfile(p);
    const card = await p.locator('[data-act=diff]').first().locator('xpath=ancestor::div[contains(@class,"card")][1]').innerText();
    ok(await p.locator('[data-act=diff].on').count() === 1 && await p.locator('[data-act=diff][data-k=hard].on').count() === 1 && await p.locator('[data-act=diff]:disabled').count() === 2 && /تستطيع تغييره بعد 30 يوماً/.test(card) && digits(card).includes(String(bv[2].shop)), tag + 'بعد التغيير: عنصر on واحد، والبقية disabled، وسطر «بعد 30 يوماً»، والوصف بثمن العالي');
    ok(await p.evaluate(() => __game.E.A.setDiff(__game.S, 'calm').ok === false), tag + 'المحرك يرفض التغيير الثاني ضمن المهلة');
    ok(await noOverflow(p), tag + 'لا تمرير أفقي (بطاقة الدفتر)');
    await ctx.close();
  }
  for (const w of [390, 1100]) { // سطر الحرب وبطاقة التحدّي في «حال أعمالي»
    const { ctx, p } = await setup(w, true), tag = w + 'px: ';
    await p.evaluate(() => { const { S, E } = __game, A = E.A; A.buildShop(S, 'riyadh'); S.player.props.riyadh.store.wheat = 100; const sa = S.order.filter(id => S.cities[id].country === 'sa'), roads = [];
      for (const x of sa) for (const y of S.order) { const k = E.riskKey(x, y); if (x !== y && S.risk[k] != null && !(E.PORTS.includes(x) && E.PORTS.includes(y)) && !roads.some(r => r.includes(x) && r.includes(y))) roads.push([x, y]); }
      const wv = { id: S.nextId++, kind: 'country', a: 'sa', b: null, cities: sa, roads: [roads[0]], food: 0.4, st: 'rumor', warn: S.day, start: S.day, end: S.day + 30 }; S.wars = [wv]; E.balWarStart(S, wv); S.player.props.riyadh.hitLost = 4321; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(500);
    const row = p.locator('[data-dchip="fold:hs-war"]'); ok(await row.count() === 1, tag + 'صف الحرب في «حال أعمالي» (نقرة واحدة من الرئيسية)');
    if (await row.count()) { await row.first().click(); await p.waitForTimeout(400); const t = await p.locator('#dsheet').innerText(); const wv = await p.evaluate(() => __game.E.balWarView(__game.S));
      ok(t.includes('حرب في ') && t.includes('حتى اليوم ' + wv.end) && t.includes('مقطوع') && t.includes('الأقوات +40٪') && t.includes('دكاكينك هناك −' + wv.hit + '٪') && t.includes('خسرتَ منها 4,321'), tag + 'النافذة: «حرب في X حتى اليوم N: الطريق س–ص مقطوع · الأقوات +Z٪ · دكاكينك هناك −' + wv.hit + '٪ (خسرتَ منها 4,321)»');
      ok(!/جنود|معارك|قتل|نهب|قتال|دماء/.test(t), tag + 'النص بلا عنف'); await p.click('#dsheet [data-dclose]').catch(() => {}); await p.waitForTimeout(200); }
    ok(await noOverflow(p), tag + 'لا تمرير أفقي (سطر الحرب)');
    // التحدّي
    await p.evaluate(() => { const { S, E } = __game; S.wars = []; for (const id of S.order) if (S.cities[id].ev && S.cities[id].ev.k === 'war') S.cities[id].ev = null; const id = S.order.find(i => S.bosses[i]); S.bosses[id].ruler = 'player'; S.bosses[id].p = 70; S.bosses[id].b = 30; const c = S.cities[id];
      S.balCh = { city: id, who: 'منافس تجريبي', boost: 20, cost: Math.round(E.BAL.ch.cost[1] * 20 * c.size * E.foreignMul(S, c)), day: S.day, end: S.day + 10 }; window.__g0 = S.player.gold; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(500);
    const crow = p.locator('[data-dchip="hs:ch"]'); ok(await crow.count() === 1, tag + 'صف التحدّي في «حال أعمالي»');
    if (await crow.count()) { await crow.first().click(); await p.waitForTimeout(400); const t = await p.locator('#dsheet').innerText(), v = await p.evaluate(() => __game.E.balChView(__game.S));
      ok(t.includes('منافس تجريبي ينافسك في سوق ') && t.includes('فحصتك ' + Math.round(v.share * 100) + '٪ ← ' + Math.round(v.after * 100) + '٪') && digits(t).includes(String(v.cost)) && /باقٍ 10 أيام/.test(t) && t.includes('ثبّت') && t.includes('اتركه'), tag + 'بطاقة التحدّي بالحصتين والثمن والمهلة وزرّيها');
      await p.locator('[data-dopt="bal:ch"][data-oid=pay]').first().click(); await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({ ch: __game.S.balCh, d: window.__g0 - __game.S.player.gold })); ok(r.ch === null && Math.abs(r.d - v.cost) < 1e-6 || r.ch === null && r.d >= v.cost - 1, tag + 'النقر على «ثبّت» يخفي التحدّي ويخصم ' + v.cost + ' (خُصم ' + Math.round(r.d) + ')'); }
    ok(await noOverflow(p), tag + 'لا تمرير أفقي (التحدّي)');
    await ctx.close();
  }
  { // المطفأ: بطاقة الدفتر القديمة حرفاً
    const { ctx, p } = await setup(390, false); await openProfile(p); const card = await p.locator('[data-act=diff]').first().locator('xpath=ancestor::div[contains(@class,"card")][1]').innerText();
    ok(/هادئ/.test(card) && /عادي/.test(card) && /صعب/.test(card) && card.includes('التوازن المعتاد. يؤثر في تكرار الصدمات الاقتصادية وشدتها (إغلاق الحدود، اللصوص، الاحتكار…) ويمكنك تغييره متى شئت.') && await p.locator('[data-act=diff]:disabled').count() === 0 && await p.locator('[data-act=diff][aria-pressed]').count() === 0, 'المطفأ: بطاقة الصعوبة بنصها القديم حرفاً بلا aria-pressed ولا قفل');
    await p.locator('[data-act=diff][data-k=hard]').first().click(); await p.waitForTimeout(200); await p.locator('[data-act=diff][data-k=calm]').first().click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __game.S.diff === 'calm' && __game.S.diffDay === undefined) && !(await p.evaluate(() => document.body.innerText.includes('ولا تغيّره بعدها'))), 'المطفأ: التغيير المتتالي فوري بلا تأكيد ولا قفل ولا diffDay'); await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
