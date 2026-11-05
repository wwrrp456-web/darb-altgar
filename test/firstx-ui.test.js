'use strict';
// 032 تجربة البداية (واجهة، 390): شريط التحميل، حارس الصور، تخطّي الحكاية، «اسمك في اللعبة»، التلميح، بطاقة الوصول وملخص الرحلة و«بِع بضاعتي»، بطاقة كبير السوق في لحظتها، والمهمة تتبع الصفقة، ومفاتيح الرجوع
const a = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/first-experience'); fs.mkdirSync(SHOTS, { recursive: true });
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'); a(/id="bootload"/.test(html) && /جارٍ تحميل اللعبة/.test(html), 'شريط التحميل في الصفحة قبل السكربت');
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 400000; };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async (q, setup, w = 390) => { const p = await b.newPage({ viewport: { width: w, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + (q || '?learn=1&seed=21&sched=0&fold=1')); await p.waitForFunction(() => !!window.__game); await p.evaluate('window.__base = ' + base.toString()); if (setup) await p.evaluate(setup); return p; };
  const noOverflow = async p => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
  { // 1) التحميل: الشريط يزول بعد الإقلاع، ولا صور مكسورة في الشاشات العشر
    const p = await open(null, () => __base()); await p.waitForTimeout(700); a.equal(await p.locator('#bootload').count(), 0, 'الشريط أُزيل');
    for (const s of ['home', 'office', 'map', 'market', 'caravan', 'estate', 'lords', 'empire', 'academy', 'cities']) { await p.evaluate(s => { __game.go(s); __game.renderAll(true); }, s); await p.waitForTimeout(150); }
    await p.waitForTimeout(2500); const broken = await p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc && !i.currentSrc.startsWith('data:')).map(i => i.currentSrc)); a.deepEqual(broken, [], 'صور مكسورة: ' + broken.join(' | ')); a.deepEqual(await p.evaluate(() => window.__imgFail), [], 'أخطاء صور'); await p.close();
  }
  { // 2) الترحيب: «اسمك في اللعبة» وزر «تخطَّ الحكاية» ينقل إلى اختيار الدولة ويحفظ ما فات
    const p = await open('?learn=1&seed=21&sched=0&fold=1&player=1'); await p.waitForSelector('#coverGo'); await p.click('#coverGo'); await p.waitForSelector('[data-act=storygo]'); await p.click('[data-act=storygo]');
    await p.waitForSelector('#lesson [data-act=lskip]'); a.equal(await p.locator('#lesson [data-act=lskip]').count(), 1); await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'skip-390.png') });
    await p.click('#lesson [data-act=lskip]'); await p.waitForSelector('#lesson [data-act=lstart]'); a.equal(await p.locator('#lesson [data-act=lskip]').count(), 0, 'لا زر تخطٍّ بعد الوصول إلى الاختيار'); a(await p.evaluate(() => (__game.S.learn.hist || []).length >= 1), 'ما فات محفوظ في «ما قاله»');
    await p.click('#lesson [data-act=lstart][data-g=sa]'); await p.waitForSelector('#lesson #pname'); await p.waitForFunction(() => /اسمك في اللعبة/.test(document.querySelector('#lesson').textContent), null, { timeout: 15000 }); a.doesNotMatch(await p.locator('#lesson').innerText(), /اسمك الحقيقي/); await p.close();
    const q = await open('?learn=1&seed=21&sched=0&fold=1&player=1', () => { __game.E.FIRSTX.skip = false; __game.E.FIRSTX.name = false; }); await q.waitForSelector('#coverGo'); await q.click('#coverGo'); await q.waitForSelector('[data-act=storygo]'); await q.click('[data-act=storygo]'); await q.waitForSelector('#lesson .msay'); a.equal(await q.locator('[data-act=lskip]').count(), 0, 'مطفأ: لا زر'); await q.close();
  }
  { // 3) التلميح: جواب خاطئ يُظهر «ليس … هو الصحيح» وتلميحاً من الشرح؛ ومطفأً لا شيء
    const setup = () => { const g = __game; g.E.A.learnSetChar(g.S, 'trader'); g.S.noLock = 1; g.S.learn.intro = 0; g.S.learn.datePend = false; g.S.learn.welcome = 99; for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) g.S.learn[q] = []; g.renderAll(true); };
    for (const on of [true, false]) {
      const p = await open(null, setup); if (!on) await p.evaluate(() => { __game.E.FIRSTX.hint = false; }); await p.waitForSelector('#lesson'); let done = false;
      for (let i = 0; i < 40 && !done; i++) { if (await p.locator('#lesson .opt').count()) { const ok = await p.evaluate(() => __game.E.LS.LEVELS[0].quiz[0].ok), n = await p.locator('#lesson .opt').count(); await p.locator('#lesson .opt').nth((ok + 1) % n).click(); const t = await p.locator('#lesson').innerText(); if (on) { a.match(t, /ليس «/); a.match(t, /تلميح/); await p.screenshot({ path: path.join(SHOTS, 'hint-390.png') }); } else { a.doesNotMatch(t, /تلميح/); a.match(t, /فكّر مرة أخرى/); } done = true; } else if (await p.locator('#lesson [data-act=lnext]').count()) await p.locator('#lesson [data-act=lnext]').first().click(); else await p.waitForTimeout(100); }
      a(done, 'وصل إلى السؤال'); await p.close();
    }
  }
  { // 4) الوصول: ملخص الرحلة، و«بِع بضاعتي» يبيع فعلاً (الحمولة تنقص والرصيد يرتفع)، والمهمة تتبع الوجهة
    const p = await open(null, () => { __base(); const g = __game, { S, E } = g, A = E.A; S.learn.level = 1; S.learn.stage = 1; S.learn.ageStages = 1; S.player.gold = 5000; const c = S.player.caravans[0]; A.buy(S, c.id, 'perfume', 20); const o = E.sellOptions(S, c.city, 'perfume', 20, E.avgCost(c.basis, 'perfume'), c).filter(x => !E.travelBlock(S, c, x.city) && x.profit > 0); window.__o = o.map(x => x.city); });
    const dests = await p.evaluate(() => window.__o); a(dests.length >= 2, 'وجهتان على الأقل');
    const m0 = await p.evaluate(() => { const g = __game; const x = g.missionStep(); return x ? x.msg : ''; }); a.match(m0, /سافر إلى/); const first = await p.evaluate(() => __game.S.learn.m && __game.S.learn.m.dest); a(first, 'اقترحت المهمة وجهة'); const other = dests.find(d => d !== first) || dests[0];
    await p.evaluate(to => { const g = __game, { S, E } = g, c = S.player.caravans[0]; E.A.travel(S, c.id, to, 0); g.renderAll(true); let n = 0; while (c.left > 0 && n++ < 80) { E.tick(S, false); S.pause = false; } g.setSpeed(0); g.renderAll(true); }, other);
    const m1 = await p.evaluate(() => __game.missionStep().msg); if (other !== first) { a.doesNotMatch(m1, new RegExp('سافر إلى <b>' + await p.evaluate(c => __game.S.cities[c].name, first))); a.match(m1, /وصلتَ|بِع/); }
    await p.evaluate(() => { const g = __game; for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) g.S.learn[q] = []; document.querySelectorAll('#lesson').forEach(e => e.remove()); g.renderAll(true); }); const card = p.locator('.arrcard'); a(await card.count() >= 1, 'بطاقة الوصول'); a.equal(await p.locator('[data-tripsum]').count(), 1, 'ملخص الرحلة'); a.match(await p.locator('[data-tripsum]').innerText(), /الربح المتوقع قبل السفر كان/); await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'arrival-390.png') });
    const before = await p.evaluate(() => ({ g: __game.S.player.gold, q: __game.S.player.caravans[0].cargo.perfume || 0 })); await p.click('[data-act=arrsell]'); const after = await p.evaluate(() => ({ g: __game.S.player.gold, q: Math.floor(__game.S.player.caravans[0].cargo.perfume || 0) })); a(after.q < before.q, 'الحمولة نقصت'); a(after.g > before.g, 'الرصيد ارتفع'); a.match(await p.locator('[data-tripsum]').innerText(), /ربحك الفعلي من البيع/);
    await p.close();
    const q = await open(null, () => { __base(); const g = __game, { S, E } = g; E.FIRSTX.sellAll = false; S.player.gold = 5000; const c = S.player.caravans[0]; E.A.buy(S, c.id, 'perfume', 5); g.go('market'); g.renderAll(true); window.__arr = 1; }); await q.close();
  }
  { // 5) بطاقة كبير السوق في لحظتها: عند الوصول تتقدم على بقية الطابور
    const p = await open(null, () => { __base(); const g = __game, { S, E } = g, L = S.learn; L.level = 4; L.stage = 4; L.ageStages = 1; const c = S.player.caravans[0], city = c.city; L.bq = [{ c: 'cairo', n: 1 }, { c: city, n: 1 }]; L.fx = { moment: { c: city, day: S.day } }; g.go('market'); g.renderAll(true); });
    const nx = await p.evaluate(() => __game.learnNext()); a.equal(nx && nx.k, 'boss'); a.equal(nx.c, await p.evaluate(() => __game.S.player.caravans[0].city), 'كبير سوق المدينة الحالية أولاً'); await p.evaluate(() => { __game.E.FIRSTX.moment = false; }); const nx2 = await p.evaluate(() => __game.learnNext()); a.notEqual(nx2 && nx2.k, 'boss', 'مطفأ: لا يتقدم على الطابور'); await p.close();
  }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS firstx UI 390: loader, image guard, skip story, name text, hint, arrival summary + sell all, mission follows deal, boss at arrival, switches');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
