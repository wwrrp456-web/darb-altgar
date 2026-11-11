'use strict';
// 044 ميزانية الصفحة: المدمج في index.html مفاتيح الشاشة الأولى فقط (brand/inline.json + brand + nav) وكل ما عداها ملف خارجي ?v=،
// الحجم ≤ 3.6 م حرف، نسخة الـArtifact مدمجة كاملة، INLINE_ALL=true يعيد القاعدة القديمة، والشاشات الثماني تكتمل صورها متصلاً ثم دون اتصال بعد التسخين.
const a = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { spawnSync } = require('node:child_process'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const root = path.join(__dirname, '..'), ok = m => console.log('OK   ' + m);
const getArt = h => JSON.parse(h.match(/window\.ART = (\{[\s\S]*?\});<\/script>/)[1]);
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), full = fs.readFileSync(path.join(root, 'dist-artifact.html'), 'utf8');
const A = getArt(page), AF = getArt(full), FIRST = JSON.parse(fs.readFileSync(path.join(root, 'brand/inline.json'), 'utf8'));
const isData = u => /^data:/.test(u), onDisk = k => ['webp', 'png', 'jpg', 'jpeg'].some(x => fs.existsSync(path.join(root, 'brand/img', k + '.' + x)));

// ١) الحجم والدمج
a.ok(page.length <= 3.6e6, 'حجم الصفحة ' + page.length + ' ≤ 3.6 مليون حرف'); ok('حجم الصفحة ' + (page.length / 1e6).toFixed(2) + ' م');
a.ok(page.length < 4.7e6, 'حد art-ui (4.7 م) لم يتغيّر'); a.ok(FIRST.length > 0, 'قائمة الشاشة الأولى غير فارغة');
for (const k of FIRST) if (onDisk(k)) a.ok(isData(A[k]), 'مفتاح الشاشة الأولى مدمج: ' + k);
const inl = Object.keys(A).filter(k => isData(A[k])), ext = Object.keys(A).filter(k => !isData(A[k]));
a.ok(inl.every(k => FIRST.includes(k) || /^(brand|nav)\//.test(k)), 'لا مدمج إلا من القائمة أو brand وnav: ' + inl.filter(k => !FIRST.includes(k) && !/^(brand|nav)\//.test(k)).slice(0, 3));
a.ok(Object.keys(A).filter(k => /^(brand|nav)\//.test(k)).every(k => isData(A[k])), 'brand وnav مدمجتان كاملتين');
a.ok(ext.length > 600 && ext.every(k => /\?v=[0-9a-f]{8}$/.test(A[k])), 'الخارجي يحمل ?v=: ' + ext.length);
a.ok(ext.every(k => fs.existsSync(path.join(root, A[k].split('?')[0]))), 'لكل خارجي ملف في المستودع');
a.ok(Object.keys(AF).filter(k => isData(AF[k])).length >= 500 && full.length > 10e6, 'نسخة الـArtifact ما زالت مدمجة كاملة');
ok('مدمج ' + inl.length + ' وخارجي ' + ext.length + ' (الأرقام للتقرير)');

// ٢) INLINE_ALL=true يعيد الحجم القديم حرفاً (بناء في مجلد مؤقت لا في الشجرة)
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-')); fs.cpSync(path.join(root, 'src'), path.join(tmp, 'src'), { recursive: true }); fs.cpSync(path.join(root, 'pwa'), path.join(tmp, 'pwa'), { recursive: true }); fs.cpSync(path.join(root, 'pwa-guide'), path.join(tmp, 'pwa-guide'), { recursive: true });
  fs.symlinkSync(path.join(root, 'brand'), path.join(tmp, 'brand')); fs.mkdirSync(path.join(tmp, 'docs/guide'), { recursive: true }); for (const f of ['player.html', 'HOLD']) if (fs.existsSync(path.join(root, 'docs/guide', f))) fs.copyFileSync(path.join(root, 'docs/guide', f), path.join(tmp, 'docs/guide', f));
  const bj = fs.readFileSync(path.join(root, 'build.js'), 'utf8'); a.ok(/const INLINE_ALL = false;/.test(bj), 'INLINE_ALL موجود وقيمته false'); fs.writeFileSync(path.join(tmp, 'build.js'), bj.replace('const INLINE_ALL = false;', 'const INLINE_ALL = true;'));
  const r = spawnSync('node', ['build.js'], { cwd: tmp, encoding: 'utf8' }); a.equal(r.status, 0, r.stderr);
  const old = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8'), OA = getArt(old); fs.rmSync(tmp, { recursive: true, force: true });
  a.ok(old.length > 4.4e6 && old.length - page.length > 1e6, 'INLINE_ALL=true يعيد الحجم القديم: ' + old.length);
  a.ok(['icons', 'ui', 'office'].every(g => Object.keys(OA).some(k => k.startsWith(g + '/') && isData(OA[k]))), 'والمجموعات القديمة (icons وui وoffice) مدمجة');
  ok('INLINE_ALL=true → ' + (old.length / 1e6).toFixed(2) + ' م');
}

// ٣) المتصفح: متصلاً ثم دون اتصال
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const u = new URL(q.url, 'http://x'), f = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname), fp = path.join(root, f); if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(fp).pipe(r); });
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-8.json'), 'utf8')).raw, SCREENS = ['home', 'market', 'caravan', 'estate', 'lords', 'office', 'empire', 'academy'];
const visit = async (p, tag, errs) => {
  for (const id of SCREENS) {
    await p.evaluate(id => { const g = __game; g.S.phase = 3; g.S.learn.level = 11; g.go(id); g.renderAll(true); }, id); await p.waitForTimeout(500);
    // كل نافذة عرض على امتداد الشاشة: الصور التي تقع فيها تكتمل (الكسولة تُطلب عند اقترابها)
    const probe = () => { const im = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && i.checkVisibility({ checkVisibilityCSS: true }); }); return { n: im.length, bad: im.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => (i.getAttribute('src') || '').slice(0, 60)), wide: document.documentElement.scrollWidth > innerWidth + 1 }; };
    let n = 0, bad = [], wide = false, H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(H, 9000); y += 600) {
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120);
      await p.waitForFunction(f => eval('(' + f + ')')().bad.length === 0, probe.toString(), { timeout: 4000 }).catch(() => {});
      const st = await p.evaluate(probe); n += st.n; bad.push(...st.bad); wide = wide || st.wide;
    }
    await p.evaluate(() => scrollTo(0, 0)); const st = { n, bad, wide };
    a.ok(st.n > 0 && st.bad.length === 0, tag + id + ': كل الصور الظاهرة تكتمل (' + st.n + ') ' + st.bad.slice(0, 3).join(' | ')); a.ok(!st.wide, tag + id + ': بلا تمرير أفقي');
  }
  a.equal(errs.length, 0, tag + 'أخطاء JS: ' + errs.join('|'));
};
srv.listen(0, async () => {
  const origin = 'http://localhost:' + srv.address().port; let code = 0; const b = await chromium.launch();
  try {
    // أول زيارة: عدد طلبات الصور الخارجية قبل ظهور الرئيسية
    { const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }), p = await ctx.newPage(); let n = 0; p.on('request', q => { if (/\/(brand\/img|img)\//.test(q.url())) { n++; if (process.env.PB_DEBUG) console.log('REQ', q.url().replace(/.*\/(brand\/img|img)\//, '')); } });
      await p.goto(origin + '/?learn=1&seed=5'); await p.waitForFunction(() => !!window.__game); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); } await p.waitForTimeout(1800);
      a.ok(n <= 10, 'طلبات الصور الخارجية قبل ظهور الرئيسية في أول زيارة: ' + n + ' ≤ 10'); ok('طلبات الشاشة الأولى: ' + n); await ctx.close(); }
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'allow' }), p = await ctx.newPage(), errs = [], failed = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', q => failed.push(q.url().slice(-50)));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw);
    await p.goto(origin + '/?seed=5'); await p.waitForFunction(() => !!window.__game); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(600); }
    await visit(p, 'متصلاً 390 · ', errs); a.equal(failed.length, 0, 'لا طلبات فاشلة متصلاً: ' + failed.slice(0, 3)); ok('متصلاً: الشاشات الثماني تكتمل');
    await p.evaluate(() => navigator.serviceWorker.ready);
    // التسخين: ينتظر حتى يضم مخزن darb-img كل الملفات الخارجية
    const total = new Set(ext.map(k => A[k])).size;
    await p.waitForFunction(async n => { const c = await caches.open('darb-img'); return (await c.keys()).filter(r => /\/brand\/img\//.test(r.url)).length >= n; }, total, { timeout: 170000, polling: 1000 });
    ok('التسخين ضمّ ' + total + ' ملفاً في darb-img');
    await ctx.setOffline(true); failed.length = 0; errs.length = 0;
    await p.reload(); await p.waitForFunction(() => !!window.__game, null, { timeout: 20000 }); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(600); }
    await visit(p, 'دون اتصال 390 · ', errs); ok('دون اتصال: الشاشات الثماني تكتمل بعد التسخين');
    console.log('PASS page-budget');
  } catch (e) { console.error(e); code = 1; } finally { await b.close(); srv.close(); process.exit(code); }
});
