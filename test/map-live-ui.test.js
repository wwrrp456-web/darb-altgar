'use strict';
// 034 الخريطة الحية (الواجهة) على 390 و1100: الترتيب والنصوص §3، الشرائح (on واحدة + ملخص بالرقم + بقاء الطبقة)، الفتح على القافلة، + − «كل العالم»،
// سحب لا يفتح بطاقة ونقرة تفتحها، فقاعة مكة/جدة/المدينة، شفافية الإطار، بطاقة المدينة (خاناتها وأسطرها)، «سافر إليها» رحلة حقيقية مع المسار والسطر ✓،
// حركة القافلة بين يومين، mapcity من الرئيسية بنقرتين، لا تمرير أفقي، أحجام اللمس، وlocalStorage يرمي، و?maplive=off يعيد الخريطة القديمة
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/map-live'); fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; if (S.tut) S.tut.on = false; S.noShocks = true;
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; delete c.bm; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3; S.player.name = 'سعيد';
  c.cargo.textile = 40; c.basis.textile = { q: 40, c: 40 * E.mid('textile'), ql: 1 };
  for (let i = E.shopsOf(S, 'riyadh').length; i < 2; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); const sh = E.shopsOf(S, 'riyadh')[0]; sh.cond = 50; };
const mk = async (b, w, q, pre) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); if (pre) await p.addInitScript(pre); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => __game.go('map')); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const txt = (p, sel) => p.locator(sel).innerText().then(t => t.replace(/\s+/g, ' ').trim());
const pinBox = async (p, id) => { const bb = await p.locator(`#mlsv [data-c="${id}"] > circle`).first().boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, w: bb.width, h: bb.height }; };
const ML = p => p.evaluate(() => { const m = __game.ML; return { s: m.s, tx: m.tx, ty: m.ty, W: m.W, H: m.H, layer: m.layer, selCity: m.selCity, selCar: m.selCar }; });
const frameOp = p => p.evaluate(() => { const im = [...document.querySelectorAll('#mlsv > image')].pop(); return im ? +im.getAttribute('opacity') : null; });
const sheetTxt = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.innerText.replace(/\s+/g, ' ').trim() : null; });
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'), tag = w + ': ';
    // أ) الترتيب والنصوص حرفاً (§3)
    a.equal(await p.locator('#mlsv').count(), 1, tag + 'SVG واحد'); a.equal(await p.locator('#screen #map').count(), 0, tag + 'لا خريطة قديمة');
    const order = await p.evaluate(() => { const pg = document.querySelector('.mlpage'); return [...pg.children].map(e => e.id || e.className.split(' ')[0] || e.tagName); });
    a.deepEqual(order, ['H1', 'mlsub', 'mlchips', 'mlsum', 'vp', 'mlleg', 'mlbest'], tag + 'ترتيب العناصر ' + order);
    a.equal(await txt(p, '.mlpage h1'), 'الخريطة');
    const sub = await txt(p, '#mlsub'); a.match(sub, /^اليوم \d+ · (صيف|شتاء) · قافلتك «القافلة الرئيسية» في الرياض بـ40 نسيج$/, tag + sub);
    const chips = await p.evaluate(() => [...document.querySelectorAll('.mlchips [data-l]')].map(c => [c.dataset.l, c.textContent.trim(), c.querySelector('img') ? c.querySelector('img').getAttribute('src') : '']));
    a.deepEqual(chips.map(c => c.slice(0, 2)), [['cargo', 'حمولتي'], ['own', 'أملاكي'], ['risk', 'المخاطر والرياح'], ['riv', 'المنافسون']], tag + 'أربع شرائح بالترتيب'); a.ok(chips.every(c => c[2]), 'أيقونات الشرائح');
    a.equal(await p.locator('.mlchips').getAttribute('aria-label'), 'طبقات الخريطة'); a.equal(await p.locator('.mlchips').getAttribute('role'), 'group');
    const vp = await p.locator('#vp').boundingBox(); a.ok(vp.height <= 380 + 2 && vp.height >= 200, tag + 'ارتفاع النافذة ' + vp.height); a.equal(await p.locator('#vp').evaluate(e => getComputedStyle(e).touchAction), 'none');
    a.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.mlzb button')].map(x => x.getAttribute('aria-label'))), ['تكبير', 'تصغير', 'إلى قافلتي', 'كل العالم']);
    for (const bt of await p.locator('.mlzb button').all()) { const bb = await bt.boundingBox(); a.ok(bb.width >= 38 && bb.height >= 38, tag + 'أزرار التكبير ≥ 38px'); }
    // ب) الملخصات بالأرقام وشريحة on واحدة وبقاء الطبقة
    const E = await p.evaluate(() => { const g = __game, S = g.S, E = g.E, cv = E.mapCargoView(S), ow = E.mapOwnView(S), rk = E.mapRiskView(S), rv = E.mapRivView(S); return { best: cv.best && { city: S.cities[cv.best.city].name, profit: Math.round(cv.best.profit), days: cv.best.days, pd: Math.round(cv.best.perDay) }, own: { N: ow.N, M: ow.M, net: Math.round(ow.net), worst: ow.worst && S.cities[ow.worst.city].name }, risk: rk.shocks.length, wind: rk.wind, riv: rv.n, list: cv.list.slice(0, 3).map(x => S.cities[x.city].name) }; });
    const sum = () => txt(p, '#mlsum');
    let s = await sum(); a.ok(s.startsWith('طبقة حمولتي: 40 نسيج · أفضل سوق ' + E.best.city + ' +' + E.best.profit.toLocaleString('en-US') + ' في '), tag + s); a.ok(s.includes('(' + E.best.pd.toLocaleString('en-US') + ' في اليوم)'), s);
    for (const [k, test] of [['own', t => t.startsWith('طبقة أملاكي: ') && /صافي الشهر/.test(t) && /تنبيه: دكان الرياض متهالك \(50\)/.test(t)], ['risk', t => t.startsWith('طبقة المخاطر والرياح: لا خطر نشط على الطرق') && /الريح الموسمية تسرّع الإبحار (شرقاً|غرباً) 35٪ حتى اليوم \d+/.test(t)], ['riv', t => t.startsWith('طبقة المنافسون: ')], ['cargo', t => t.startsWith('طبقة حمولتي: ')]]) {
      await p.locator(`.mlchip[data-l="${k}"]`).click(); await p.waitForTimeout(150);
      a.equal(await p.locator('.mlchip.on').count(), 1, tag + 'شريحة on واحدة'); a.equal(await p.locator('.mlchip[aria-pressed="true"]').count(), 1); a.equal(await p.locator('.mlchip.on').getAttribute('data-l'), k);
      const t = await sum(); a.ok(test(t), tag + k + ': ' + t); a.equal(await p.locator('#mlleg span').count() > 0, true, 'مفتاح الطبقة');
      if (k === 'own') { a.ok(t.includes(E.own.N + ' ') && t.includes(' في ' + E.own.M + ' '), 'أرقام الأملاك ' + t); a.equal(await p.locator('#mlsv [data-c="riyadh"] rect').count(), 1, 'شارة أملاك الرياض'); } }
    // الطبقة باقية بعد إعادة التحميل (localStorage)
    await p.locator('.mlchip[data-l="risk"]').click(); await p.waitForTimeout(100); a.equal(await p.evaluate(() => localStorage.getItem('map.layer')), 'risk');
    await p.reload(); await p.waitForFunction(() => !!window.__game); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(700); } await p.evaluate(() => __game.go('map')); await p.waitForTimeout(400);
    a.equal(await p.locator('.mlchip.on').getAttribute('data-l'), 'risk', tag + 'الطبقة باقية بعد إعادة التحميل'); await p.evaluate(STATE); await p.evaluate(() => __game.go('map')); await p.waitForTimeout(300);
    await p.locator('.mlchip[data-l="cargo"]').click();
    // ج) الفتح على القافلة والمقياس والأزرار
    let m = await ML(p); const fit = Math.max(m.W / 2048, m.H / 1024) * 0.999; a.ok(Math.abs(m.s - fit * 1.5) < 1e-6 || m.s >= fit * 1.4, tag + 'المقياس الابتدائي fit×1.5: ' + m.s / fit);
    const car = await p.locator('#mlsv [data-k]').first().boundingBox(); a.ok(car.x >= vp.x - 5 && car.x + car.width <= vp.x + vp.width + 5 && car.y >= vp.y - 5 && car.y + car.height <= vp.y + vp.height + 5, tag + 'القافلة داخل النافذة عند الفتح: ' + JSON.stringify(car));
    const badge = () => txt(p, '#mlscl'); a.match(await badge(), /^تكبير ×\d+\.\d$/, tag + 'شارة المقياس'); const b0 = await badge();
    await p.locator('[data-act=mlzin]').click(); a.notEqual(await badge(), b0, tag + '+ تغيّر الشارة'); await p.locator('[data-act=mlzout]').click(); await p.locator('[data-act=mlzout]').click(); await p.locator('[data-act=mlzout]').click();
    await p.locator('[data-act=mlzall]').click(); a.equal(await badge(), 'كل العالم', tag + '«كل العالم»'); a.equal(await frameOp(p), 1, tag + 'الإطار شفافيته 1 في كل العالم');
    await p.locator('[data-act=mlzme]').click(); a.match(await badge(), /^تكبير ×/); a.equal(await frameOp(p), 0, tag + 'الإطار 0 بعد التكبير (قافلتي ≥ fit×2.2)');
    await p.locator('[data-act=mlzall]').click(); await p.locator('[data-act=mlzin]').click(); await p.locator('[data-act=mlzin]').click();
    { const mm = await ML(p), f = Math.max(mm.W / 2048, mm.H / 1024) * 0.999, want = Math.max(0, Math.min(1, 1 - (mm.s / f - 1) * 1.5)); a.ok(Math.abs((await frameOp(p)) - want) < 0.011, tag + 'شفافية الإطار = max(0,min(1,1−(s/fit−1)×1.5)): ' + want); a.ok((await frameOp(p)) < 1, tag + 'تتناقص بالتكبير'); }
    await p.locator('[data-act=mlzin]').click(); await p.locator('[data-act=mlzin]').click(); a.equal(await frameOp(p), 0, tag + 'الإطار 0 بعد التكبير');
    // د) فقاعة مكة/جدة/المدينة في التصغير ثم فكّها بالنقر
    await p.locator('[data-act=mlzall]').click(); a.ok(await p.locator('#mlsv [data-z]').count() >= 1, tag + 'فقاعة تجميع في كل العالم'); const z = await p.locator('#mlsv [data-z] > circle').first().boundingBox(); const s0 = (await ML(p)).s;
    await p.mouse.click(z.x + z.width / 2, z.y + z.height / 2); await p.waitForTimeout(200); a.ok((await ML(p)).s > s0 * 2, tag + 'النقر على الفقاعة يكبّر'); a.equal(await p.locator('#dsheet').count(), 0, tag + 'الفقاعة لا تفتح بطاقة');
    // هـ) سحب لا يفتح بطاقة ونقرة تفتحها
    await p.locator('[data-act=mlzme]').click(); await p.waitForTimeout(100); const box = await p.locator('#vp').boundingBox(), t0 = await ML(p);
    await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.45, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    const t1 = await ML(p); a.ok(Math.abs(t1.tx - t0.tx) + Math.abs(t1.ty - t0.ty) > 20, tag + 'السحب حرّك العرض'); a.equal(await p.locator('#dsheet').count(), 0, tag + 'السحب لا يفتح بطاقة');
    // السحب لا يتجاوز حدود اللوحة
    a.ok(t1.tx >= -1 && t1.tx <= 2048 * t1.s - t1.W + 1, tag + 'ضمن حدود اللوحة');
    await p.locator('[data-act=mlzall]').click(); await p.locator('[data-act=mlzin]').click(); await p.locator('[data-act=mlzin]').click(); await p.waitForTimeout(100);
    // و) نقرة على مدينة تفتح بطاقتها: خاناتها الأربع وأسطرها الثلاثة
    await p.evaluate(() => { const m = __game.ML, E = __game.E, id = 'riyadh'; m.s = Math.max(m.s, 1.2 * Math.max(m.W / 2048, m.H / 1024)); m.tx = E.BOARD_XY[id][0] * 2048 * m.s - m.W / 2; m.ty = E.BOARD_XY[id][1] * 1024 * m.s - m.H / 2; });
    await p.locator('[data-act=mlzin]').click(); await p.waitForTimeout(100);
    // اختر مدينة غير الرياض ظاهرة بعد التوسيط على الأفضل
    const target = await p.evaluate(() => __game.E.mapCargoView(__game.S).best.city); await p.locator('.mlrow').first().scrollIntoViewIfNeeded(); await p.locator('.mlrow').first().click(); await p.waitForTimeout(400);
    a.equal(await p.locator('#dsheet').count(), 1, tag + 'بطاقة المدينة'); const card = await sheetTxt(p), tname = await p.evaluate(id => __game.S.cities[id].name, target); a.ok(card.includes(tname), card);
    const labels = await p.evaluate(() => [...document.querySelectorAll('#dsheet .mlkv > div')].map(d => d.firstChild.textContent.trim())); a.equal(labels.length, 4); a.ok(/^ربح حمولتك \(40 نسيج\)$/.test(labels[0]) && /^المدة من الرياض$/.test(labels[1]) && labels[2] === 'خطر الطريق' && labels[3] === 'في اليوم', tag + labels);
    a.ok(/أملاكك:/.test(card) && /المنافس الأقوى:/.test(card) && /اشترِ منها للعودة:/.test(card), tag + 'ثلاثة أسطر'); a.equal(await p.locator('#dsheet .mlgo[data-act="go"]').count(), 1, tag + 'زر «سافر إليها»'); a.ok(/سافر إليها بـ«القافلة الرئيسية»/.test(card));
    a.equal(await p.locator('.mlrow.on').count(), 1, tag + 'الصف المختار on'); a.equal((await ML(p)).selCity, target);
    // ز) «سافر إليها» رحلة حقيقية، والمسار مظلَّل، وسطر ✓
    await p.locator('#dsheet .mlgo[data-act="go"]').click(); await p.waitForTimeout(500);
    const mv = await p.evaluate(() => { const c = __game.S.player.caravans[0]; return { left: c.left, dest: c.dest }; }); a.ok(mv.left > 0 && mv.dest === target, tag + 'رحلة حقيقية ' + JSON.stringify(mv));
    a.ok((await sum()).includes('✓ أُرسلت «القافلة الرئيسية» إلى ' + tname), tag + 'سطر ✓: ' + await sum()); a.ok(await p.locator('#mlsv path[stroke="#ffd56b"]').count() >= 1, tag + 'المسار المختار مظلَّل'); a.ok(/✓ أُرسلت/.test(await sheetTxt(p)), tag + 'الزر معطّل ✓');
    a.equal(await p.locator('#dsheet .mlgo[disabled]').count() >= 1, true);
    // ح) القافلة السائرة تتحرك بين يومين
    await p.locator('.mlx, #dsheet .dx').first().click().catch(() => {}); await p.waitForTimeout(200);
    const pos0 = await p.evaluate(() => { const c = __game.ML.cars.find(x => x.mine && x.moving); return c ? c.pos.slice(0, 2) : null; });
    await p.evaluate(() => { const g = __game; g.setSpeed(0); g.E.tick(g.S, false); g.S.pause = false; if (g.S.road) g.S.road = null; g.renderAll(true); }); await p.waitForTimeout(120);
    await p.waitForTimeout(700);
    const pos1 = await p.evaluate(() => { const m = __game.ML, c = m.cars.find(x => x.mine && x.moving); return c ? { p: c.pos.slice(0, 2), sh: m.shown[c.key] && m.shown[c.key].slice(0, 2) } : null; });
    if (pos1) { a.ok(Math.hypot(pos1.p[0] - pos0[0], pos1.p[1] - pos0[1]) > 1, tag + 'موضع القافلة تغيّر بين يومين'); a.ok(Math.hypot(pos1.sh[0] - pos1.p[0], pos1.sh[1] - pos1.p[1]) < 1, 'استقرّ عند الموضع الجديد'); }
    // ط) بطاقة القافلة واختيار قافلة
    await p.locator('#mlsv [data-k]').first().evaluate(e => { const r = e.querySelector('circle').getBoundingClientRect(); window.__kc = [r.x + r.width / 2, r.y + r.height / 2]; }); const kc = await p.evaluate(() => window.__kc); await p.mouse.click(kc[0], kc[1]); await p.waitForTimeout(300);
    a.ok(/قافلتك · على الطريق/.test((await sheetTxt(p)) || ''), tag + 'بطاقة القافلة السائرة'); a.equal(await p.locator('#dsheet [data-act=mlfollow]').count(), 1, 'زر «تابعها»'); await p.locator('#dsheet [data-act=mlfollow]').click(); await p.waitForTimeout(200); a.equal(await p.locator('#dsheet').count(), 0);
    // ي) بلا تمرير أفقي وأهداف اللمس ≥ 40
    a.equal(await wide(p), false, tag + 'لا تمرير أفقي'); await p.evaluate(() => __game.renderAll(true)); const pb = await pinBox(p, 'riyadh').catch(() => null); if (pb) a.ok(pb.w >= 40 && pb.h >= 40, tag + 'هدف المدينة ≥ 40px: ' + pb.w);
    await p.screenshot({ path: path.join(SHOTS, 'map-live-' + w + '.png'), fullPage: false });
    ok(tag + 'الترتيب والنصوص، الشرائح والملخصات والبقاء، الفتح على القافلة، + − كل العالم والإطار، الفقاعة، السحب والنقرة، بطاقة المدينة، سافر إليها، حركة القافلة، بطاقة القافلة، بلا تمرير أفقي');
    await p.context().close();
  }
  // mapcity من الرئيسية: نقرتان (يومي ← على الخريطة)
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { const g = __game, c = g.S.player.caravans[0]; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; g.go('home'); }); await p.waitForTimeout(400);
    await p.locator('#screen [data-bp="brief"]').click(); await p.waitForTimeout(500);
    const step = await p.locator('#briefPanel [data-act="mapcity"]').count(); a.equal(step, 1, 'زر «على الخريطة» في سطر الخطوة المقترحة');
    const dest = await p.locator('#briefPanel [data-act="mapcity"]').getAttribute('data-c'); await p.locator('#briefPanel [data-act="mapcity"]').click(); await p.waitForTimeout(600);
    a.equal(await p.evaluate(() => __game.screen), 'map', 'يفتح الخريطة'); a.equal(await p.locator('#dsheet').count(), 1, 'وبطاقة المدينة مفتوحة'); const m = await ML(p); a.equal(m.selCity, dest); a.equal(m.layer, 'cargo', 'طبقة حمولتي');
    a.ok((await sheetTxt(p)).includes(await p.evaluate(id => __game.S.cities[id].name, dest))); a.equal(await p.locator('.mlchip.on').getAttribute('data-l'), 'cargo');
    ok('mapcity من الرئيسية: نقرتان (يومي ← على الخريطة) تفتح الخريطة على المدينة المقترحة وبطاقتها وطبقة حمولتي');
    // تنبيه الطريق: mlroad يفتح طبقة المخاطر موسّطة على منتصف المسار
    await p.evaluate(() => { const g = __game; g.go('home'); const b = document.createElement('button'); b.id = 'tb'; b.dataset.act = 'mlroad'; b.dataset.from = 'riyadh'; b.dataset.to = 'cairo'; document.body.appendChild(b); });
    await p.evaluate(() => { __game.dClose(); document.getElementById('tb').click(); }); await p.waitForTimeout(600); const m2 = await ML(p); a.equal(m2.layer, 'risk'); a.equal(await p.evaluate(() => __game.screen), 'map');
    const mid = await p.evaluate(() => { const E = __game.E, pts = E.boardPath('riyadh', 'cairo', false), q = E.mapAlong(pts, 0.5), m = __game.ML; return [q[0] * m.s - m.tx, q[1] * m.s - m.ty, m.W, m.H]; }); a.ok(Math.abs(mid[0] - mid[2] / 2) < mid[2] * 0.3 && Math.abs(mid[1] - mid[3] / 2) < mid[3] * 0.3, 'موسّطة على منتصف المسار: ' + mid);
    ok('«اعرض على الخريطة» من تنبيه الطريق: طبقة المخاطر موسّطة على منتصف مسار الرحلة'); await p.context().close(); }
  // localStorage يرمي ⇒ تعمل بالافتراضي
  { const p = await mk(b, 390, '?player=1&seed=5', () => { Storage.prototype.getItem = function (k) { if (k === 'map.layer') throw Error('blocked'); return Object.getPrototypeOf(this) === Storage.prototype ? this[k] ?? null : null; }; const si = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'map.layer') throw Error('blocked'); return si.call(this, k, v); }; });
    a.equal(await p.locator('.mlchip.on').getAttribute('data-l'), 'cargo', 'الافتراضي حمولتي'); await p.locator('.mlchip[data-l="own"]').click(); await p.waitForTimeout(150); a.equal(await p.locator('.mlchip.on').getAttribute('data-l'), 'own', 'تعمل الشرائح رغم رمي localStorage'); ok('localStorage يرمي: الشرائح تعمل بالافتراضي'); await p.context().close(); }
  // ?maplive=off ⇒ الخريطة القديمة
  { const p = await mk(b, 390, '?player=1&seed=5&maplive=off'); a.equal(await p.locator('#mlsv').count(), 0); a.equal(await p.locator('#map').count(), 1); a.ok(await p.locator('#map [data-city]').count() >= 6, '#map و data-city'); a.equal(await p.evaluate(() => __game.mlOn()), false); ok('?maplive=off ⇒ DOM الخريطة القديمة (#map وdata-city)'); await p.context().close(); }
  await b.close();
  if (errors.length) { console.log('ERRORS: ' + errors.slice(0, 5).join(' | ')); process.exit(1); }
  console.log('map-live-ui: ALL OK');
})().catch(e => { console.error(e); process.exit(1); });
