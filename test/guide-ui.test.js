// دليل اللاعب المثبَّت (متصفح حقيقي عبر خادم محلي): يعمل دون اتصال، يتحدث وحده، وزرّه في اللعبة: node test/guide-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { pack, write } = require('../pwa-guide/pack.js');
const page = (ver, extra) => '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; base-uri \'none\'; connect-src \'none\'"><meta name="guide-ready" content="1"><meta name="guide-version" content="' + ver + '"><title>دليل</title></head><body><h1 id="h">دليل اللاعب ' + ver + '</h1>' + (extra || '') + '<section id="whatsnew"><h2>ما الجديد</h2><p>' + ver + '</p></section></body></html>';
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-')), gdir = path.join(dir, 'guide'); write(gdir, pack(page('v1')));
  const srv = http.createServer((q, s) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } const t = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream'; s.writeHead(200, { 'content-type': t, 'cache-control': 'max-age=3600' }); s.end(fs.readFileSync(f)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port + '/guide/';
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const t = vp.width + 'px: ';
    write(gdir, pack(page('v1')));
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(base); await p.waitForTimeout(500);
    await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !!navigator.serviceWorker.controller || true) && await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).scope.endsWith('/guide/')), t + 'خدمة التخزين مسجّلة بنطاق /guide/');
    const mf = await p.evaluate(async () => { const r = await fetch('manifest.webmanifest'); return r.ok ? (await r.json()).name : null; }); ok(mf === 'دليل درب التجّار', t + 'manifest يُقرأ');
    ok(await p.evaluate(async () => { const ks = await caches.keys(), k = ks.find(x => x.startsWith('guide-')); if (!k) return false; const c = await caches.open(k); return !!(await c.match('./index.html')) && !!(await c.match('./manifest.webmanifest')); }), t + 'الصفحة وmanifest مخزَّنان وقت التثبيت');
    ok(!(await p.locator('#guideBar').count()), t + 'لا شارة تحديث في أول زيارة');
    // دون اتصال
    await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(500);
    ok(/دليل اللاعب v1/.test(await p.locator('#h').innerText()), t + 'يفتح دون اتصال');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي');
    await ctx.setOffline(false);
    // صدور تحديث
    write(gdir, pack(page('v2', '<p id="new2">فقرة جديدة</p>'))); await p.waitForTimeout(200);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(700);
    ok(await p.locator('#guideBar').count() === 1 && /نسخة جديدة/.test(await p.locator('#guideBar').innerText()), t + 'عند العودة للتطبيق تظهر «نسخة جديدة متاحة»');
    await p.locator('#guideBar button', { hasText: 'حدّث الآن' }).click(); await p.waitForTimeout(1200);
    ok(/v2/.test(await p.locator('#h').innerText()) && await p.locator('#new2').count() === 1, t + 'التحديث يجلب الصفحة الجديدة رغم ذاكرة المتصفح المؤقتة');
    ok(await p.locator('#guideBar').count() === 1 && /تم تحديث الدليل/.test(await p.locator('#guideBar').innerText()), t + 'بعد التحديث تظهر «تم تحديث الدليل» مع زرّ ما الجديد');
    await p.locator('#guideBar button', { hasText: 'ما الجديد' }).click(); await p.waitForTimeout(300); ok(await p.locator('#guideBar').count() === 0, t + 'زرّ ما الجديد يغلق الشارة');
    await p.reload(); await p.waitForTimeout(400); ok(await p.locator('#guideBar').count() === 0, t + 'لا تتكرر الشارة بعد الاطلاع');
    await ctx.close();
  }
  // زرّ اللعبة
  const GURL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const t = vp.width + 'px (اللعبة): ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(GURL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 6; S.learn.intro = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.cal = { jd0: g.E.CAL.MIN, set: true, yr: 1 }; g.go('home'); g.renderAll(true); }); await p.waitForTimeout(400);
    const rdy = await p.evaluate(() => window.GUIDE.ready);
    await p.evaluate(() => document.getElementById('hMenu').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('hGuide').hidden) === !rdy, t + 'الزرّ مخفي ما لم يكن الدليل جاهزاً (الآن ready=' + rdy + ')');
    await p.evaluate(() => { window.GUIDE = { ready: true, v: 'vx' }; localStorage.removeItem('darb-guide-seen'); document.getElementById('hMenu').click(); document.getElementById('hMenu').click(); }); await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ hid: document.getElementById('hGuide').hidden, nw: !document.querySelector('#hGuide .gnew').hidden, badge: document.getElementById('hMenu').classList.contains('hasnew'), href: document.getElementById('hGuide').getAttribute('href'), tgt: document.getElementById('hGuide').target }));
    ok(!st.hid && st.nw && st.badge && st.href === 'guide/' && st.tgt === '_blank', t + 'إذا جاهز: الزرّ ظاهر بشارة «جديد» وعلى زرّ ⋯ إشارة، ويفتح guide/ في تبويب');
    await p.evaluate(() => { document.getElementById('hGuide').addEventListener('click', e => e.preventDefault(), true); document.getElementById('hGuide').click(); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => localStorage.getItem('darb-guide-seen')) === 'vx', t + 'الضغط يسجّل الاطلاع');
    await p.evaluate(() => { document.getElementById('hMenu').click(); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelector('#hGuide .gnew').hidden && !document.getElementById('hMenu').classList.contains('hasnew')), t + 'تختفي الشارة بعد الاطلاع');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); srv.close(); fs.rmSync(dir, { recursive: true, force: true }); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
