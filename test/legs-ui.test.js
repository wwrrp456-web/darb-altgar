// حركة أرجل الجمل والرجل على الخريطة أثناء السفر (حتى مع «تقليل الحركة»)، وزر حفظ الطريق من الخريطة: node test/legs-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const rm of ['no-preference', 'reduce']) for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = rm + ' ' + vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp, reducedMotion: rm })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 50000;
      const m = S.player.caravans[0]; const d = S.order.find(i => i !== m.city && S.cities[i].country === S.cities[m.city].country); E.A.travel(S, m.id, d); g.go('map'); g.renderAll(true); });
    await p.waitForTimeout(500);
    ok(await p.locator('#map .map-caravan.moving .camwalk').count() === 1, tag + 'القافلة المسافرة تعرض شريحة المشي');
    ok(await p.evaluate(() => document.getAnimations().some(a => a.animationName === 'camwalk' && a.playState === 'running')), tag + 'دورة الخطو تعمل فعلاً');
    // حدود SVG تضم عرض الشريط كله حتى مع overflow:hidden؛ نصوّر نافذة الإطار عبر CTM.
    const box = await p.evaluate(() => {
      document.querySelectorAll('body *').forEach(x => { if (getComputedStyle(x).position === 'fixed' && x.id !== 'nav') x.style.display = 'none'; });
      const e = document.querySelector('#map .camspr');
      const rect = () => { const v = e.viewBox.baseVal, m = e.getScreenCTM(), ps = [[v.x,v.y],[v.x+v.width,v.y],[v.x,v.y+v.height],[v.x+v.width,v.y+v.height]].map(([x,y]) => new DOMPoint(x,y).matrixTransform(m)); return {x:Math.min(...ps.map(p=>p.x)),y:Math.min(...ps.map(p=>p.y)),w:Math.max(...ps.map(p=>p.x))-Math.min(...ps.map(p=>p.x)),h:Math.max(...ps.map(p=>p.y))-Math.min(...ps.map(p=>p.y))}; };
      let r = rect(); window.scrollBy(0,r.y+r.h/2-innerHeight/2); r = rect();
      const x=Math.max(0,r.x-3),y=Math.max(0,r.y-3); return {x,y,w:Math.min(innerWidth,r.x+r.w+3)-x,h:Math.min(innerHeight,r.y+r.h+3)-y};
    });
    const firstTransform = await p.locator('#map .camwalk').evaluate(e => getComputedStyle(e).transform);
    await p.waitForFunction(t => getComputedStyle(document.querySelector('#map .camwalk')).transform !== t, firstTransform, {timeout:2500});
    ok(true, tag + 'الإطار يتحرك تلقائياً قبل أخذ اللقطات');
    // نوقف الحركة عند منتصف كل إطار: لا تزامن عرضي مع زمن التصوير ولا غبار يوهم بتغير الأرجل.
    await p.evaluate(() => { for(const a of document.getAnimations())a.pause(); window.__walk=document.getAnimations().find(a=>a.animationName==='camwalk'); });
    const shots=[];
    for(let f=0;f<8;f++){
      await p.evaluate(f=>{const a=window.__walk;a.currentTime=(f+.5)*a.effect.getTiming().duration/8;},f);
      shots.push((await p.screenshot({clip:{x:box.x,y:box.y,width:box.w,height:box.h}})).toString('base64'));
    }
    ok(new Set(shots).size === 8, tag + 'الإطارات الثمانية مختلفة بصرياً داخل نافذة القافلة (' + new Set(shots).size + ' من 8)');
    // زر حفظ الطريق من لوحة المدينة (والقافلة واقفة)
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; m.left = 0; m.city = m.dest || m.city; S.favs = []; const to = S.order.find(i => i !== m.city); window.__to = to; g.renderAll(true); g.go('map'); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-city="' + to + '"></button>'); document.querySelector('.__t').click(); }); await p.waitForTimeout(300);
    if (rm === 'no-preference') {
      ok(await p.locator('#screen [data-act=favtoggle]').count() === 1 && /احفظ هذا الطريق/.test(await p.locator('#screen [data-act=favtoggle]').innerText()), tag + 'لوحة المدينة: زر «احفظ هذا الطريق»');
      const g0 = await p.evaluate(() => ({ g: __game.S.player.gold, c: __game.S.player.caravans[0].city }));
      await p.evaluate(() => document.querySelector('#screen [data-act=favtoggle]').click()); await p.waitForTimeout(200);
      ok(await p.evaluate(() => __game.S.favs.length === 1 && __game.S.favs[0].to === window.__to), tag + 'حفظ الطريق (بداية ووجهة)');
      ok(/محفوظ في طرقي/.test(await p.locator('#screen [data-act=favtoggle]').innerText()) && await p.evaluate(g => __game.S.player.gold === g.g && __game.S.player.caravans[0].city === g.c, g0), tag + 'الزر يتحول لـ«محفوظ» دون مال ولا سفر');
      await p.evaluate(() => document.querySelector('#screen [data-act=favtoggle]').click()); await p.waitForTimeout(200);
      ok(await p.evaluate(() => __game.S.favs.length) === 0, tag + 'الضغط ثانية يلغي الحفظ');
    }
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
