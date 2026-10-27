// الدفعة الرابعة: مقارنة وجهتين، مقارنة الترقيات، دفتر الطرق، مسيرتي بالتواريخ: node test/planner-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []));
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 50000; g.go('market'); g.renderAll(true); });
    await clr();
    // ١٠: مقارنة وجهتين في نافذة السلعة
    await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-gd="wheat"></button>'); document.querySelector('.__t').click(); }); await p.waitForTimeout(300);
    ok(await p.locator('#modal .cmpcard').count() === 1 && await p.locator('#modal .cmpcard select').count() === 2, tag + 'نافذة السلعة: بطاقة مقارنة وجهتين بقائمتين');
    const st0 = await p.evaluate(() => ({ g: __game.S.player.gold, c: JSON.stringify(__game.S.player.caravans[0].cargo), d: __game.S.day }));
    const second = await p.evaluate(() => [...document.querySelectorAll('#modal .cmpcard select')[1].options].map(o => o.value).slice(-1)[0]);
    await p.evaluate(v => { const s = document.querySelectorAll('#modal .cmpcard select')[1]; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, second); await p.waitForTimeout(250);
    ok(await p.evaluate(v => document.querySelectorAll('#modal .cmpcard select')[1].value === v, second), tag + 'تغيير الوجهة يحدّث المقارنة');
    ok(/لا وعد بالربح/.test(await p.locator('#modal .cmpcard').innerText()) && /عمر معلومة السعر/.test(await p.locator('#modal .cmpcard').innerText()), tag + 'فيها عمر المعلومة وتنبيه عدم وعد الربح');
    ok(await p.evaluate(s0 => __game.S.player.gold === s0.g && JSON.stringify(__game.S.player.caravans[0].cargo) === s0.c && __game.S.day === s0.d, st0), tag + 'المقارنة لا تغيّر مالاً ولا حمولة ولا يوماً');
    await p.evaluate(() => { __game.S.player.caravans[0].left = 0; __game.go('caravan'); __game.renderAll(true); }); await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(250);
    // ١٦: مقارنة الترقيات
    ok(/قارن قبل أن تشتري/.test(await p.locator('#screen').innerText()) && /الحارس لا يضمن السلامة/.test(await p.locator('#screen').innerText()), tag + 'القافلة: مقارنة عربة وحارس بتنبيه عدم ضمان السلامة');
    ok(/←/.test(await p.locator('#screen').innerText()), tag + 'فيها قبل/بعد من المحرك');
    const st1 = await p.evaluate(() => ({ g: __game.S.player.gold, car: JSON.stringify([__game.S.player.caravans[0].carts, __game.S.player.caravans[0].guards]) }));
    await p.evaluate(() => __game.renderAll(true));
    ok(await p.evaluate(s => __game.S.player.gold === s.g && JSON.stringify([__game.S.player.caravans[0].carts, __game.S.player.caravans[0].guards]) === s.car, st1), tag + 'المقارنة لا تشتري شيئاً');
    // ١٨: الطرق المفضلة
    await p.evaluate(() => { __game.go('office'); __game.renderAll(true); }); await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(200);
    const ids = await p.evaluate(() => { const S = __game.S; return { a: S.player.caravans[0].city, b: S.order.find(i => i !== S.player.caravans[0].city) }; });
    await p.evaluate(([a, b]) => { document.getElementById('fF').value = a; document.getElementById('fT').value = b; document.getElementById('fG').value = 'wheat'; document.getElementById('fN').value = '<img src=x onerror=alert(1)> أعجبني'; document.querySelector('[data-act=favadd]').click(); }, [ids.a, ids.b]); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.favs.length) === 1 && await p.locator('.office .fav').count() === 1, tag + 'إضافة طريق مفضل');
    ok(await p.locator('.office .fav img[src="x"]').count() === 0 && /<img/.test(await p.locator('.office .fav').innerText()), tag + 'نص الملاحظة يُهرَّب ولا يُنفَّذ');
    const g2 = await p.evaluate(() => ({ g: __game.S.player.gold, city: __game.S.player.caravans[0].city, left: __game.S.player.caravans[0].left }));
    await p.evaluate(() => document.querySelector('.office [data-act=favopen]').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) === '#map' && await p.evaluate(g => __game.S.player.gold === g.g && __game.S.player.caravans[0].city === g.city && __game.S.player.caravans[0].left === g.left, g2), tag + 'فتح الطريق يفتح الخريطة دون مال ولا نقل قافلة');
    await p.evaluate(() => { __game.S.favs.push({ from: 'zzz', to: 'riyadh', g: null, note: '' }); __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(/طريق غير صالح/.test(await p.locator('.office').innerText()), tag + 'مدينة غير صالحة من حفظ قديم: تُعرض غير صالحة بلا انهيار');
    for (let i = 0; i < 6; i++) await p.evaluate(([a, b]) => { const f = document.querySelector('[data-act=favadd]'); if (f) { document.getElementById('fF').value = a; document.getElementById('fT').value = b; f.click(); } }, [ids.a, ids.b]);
    ok(await p.evaluate(() => __game.S.favs.length) <= 5, tag + 'الحد الأقصى ٥ طرق');
    await p.evaluate(() => document.querySelector('.office [data-act=favdel]').click()); await p.waitForTimeout(150);
    ok(await p.evaluate(() => __game.S.favs.length) <= 4, tag + 'الحذف يعمل');
    // ٢١: مسيرتي بالتواريخ
    await p.evaluate(() => { const S = __game.S; S.ach = S.ach || { got: {}, q: [], n: {}, vis: {}, prev: {}, jt: {} }; S.ach.got.trade_first = 3; S.ach.got.trip_first = 9; __game.renderAll(true); });
    await p.evaluate(() => { document.querySelector('#hProfile, [data-act=profile]').click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { const d = document.querySelector('#profile .achc details[data-dk=timeline]'); if (d) d.open = true; });
    const tl = await p.evaluate(() => { const d = document.querySelector('#profile .achc details[data-dk=timeline]'); return d ? d.innerText : ''; });
    ok(/مسيرتي بالتواريخ/.test(tl) && /أول درب/.test(tl) && /أول صفقة/.test(tl) && tl.indexOf('أول درب') < tl.indexOf('أول صفقة'), tag + 'مسيرتي: الإنجازات المسجلة بتواريخها، الأحدث أولاً');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
