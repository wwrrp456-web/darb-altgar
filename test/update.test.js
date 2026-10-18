// التحديث على الجهاز: شريط «نسخة جديدة» عند اختلاف version.json، وملف العمل يتجاوز الذاكرة المؤقتة: node test/update.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'); let verOverride = null; const hits = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'); let f = u.pathname === '/' ? '/index.html' : u.pathname; hits.push(f);
  if (f === '/version.json' && verOverride) { r.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'max-age=600' }); return r.end(JSON.stringify({ id: verOverride })); }
  const fp = path.join(root, f); if (!fp.startsWith(root) || !fs.existsSync(fp)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'max-age=600' }); r.end(fs.readFileSync(fp));
});
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const buildId = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/const BUILD_ID = '([0-9a-f]{10})'/);
ok(!!buildId && JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).id === buildId[1], 'معرّف النسخة في الصفحة يطابق version.json');
ok(/const V = 'darb-[0-9a-f]{10}'/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')), 'اسم ذاكرة ملف العمل يتغيّر مع كل بناء');
ok(/cache: 'no-store'/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')), 'ملف العمل يطلب الصفحة بتجاوز الذاكرة المؤقتة');
srv.listen(0, async () => {
  const port = srv.address().port, url = 'http://localhost:' + port + '/?learn=1&seed=5';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(2500);
  ok(await p.locator('#upd').count() === 0, 'لا شريط تحديث عندما تتطابق النسخة');
  verOverride = 'ffffffffff';
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForSelector('#upd', { timeout: 5000 }).catch(() => {});
  ok(await p.locator('#upd').count() === 1 && /نسخة جديدة/.test(await p.locator('#upd').innerText()), 'يظهر شريط «توجد نسخة جديدة» عند العودة للتطبيق');
  verOverride = null;
  const nav = p.waitForNavigation({ timeout: 8000 }).catch(() => null); await p.locator('#upd .pri').click(); await nav;
  await p.waitForTimeout(1500);
  ok(await p.locator('#upd').count() === 0, 'بعد «حدّث الآن» تُعاد الصفحة بلا شريط');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); srv.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
});
