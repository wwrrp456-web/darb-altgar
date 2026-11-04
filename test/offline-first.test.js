'use strict';
// EXEC 04 (بند 7 من فحص 1.0): أول زيارة تُخزَّن فيها الصفحة بعد تفعيل ملف العمل، فتعمل اللعبة دون اتصال من الفتحة الأولى (قبل أي إعادة تحميل).
const a = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const root = path.join(__dirname, '..'), mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const u = new URL(q.url, 'http://x'); const f = u.pathname === '/' ? '/index.html' : u.pathname, fp = path.join(root, f); if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'max-age=600' }); r.end(fs.readFileSync(fp)); });
srv.listen(0, async () => {
  const port = srv.address().port, url = 'http://localhost:' + port + '/?learn=1&seed=5', b = await chromium.launch(); let code = 0;
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(url); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => navigator.serviceWorker.ready);
    // الصفحة تُخزَّن عند تفعيل ملف العمل (دون إعادة تحميل)
    await p.waitForFunction(async origin => { for (const k of await caches.keys()) { if (k === 'darb-img') continue; if (await (await caches.open(k)).match(origin + '/')) return true; } return false; }, 'http://localhost:' + port, { timeout: 15000 });
    a.ok(true, 'الصفحة مخزَّنة بعد الزيارة الأولى');
    await ctx.setOffline(true); await p.reload(); await p.waitForFunction(() => !!window.__game, null, { timeout: 15000 });
    const d0 = await p.evaluate(() => __game.S.day); a.ok(Number.isFinite(d0), 'اللعبة تعمل دون اتصال من أول فتحة');
    a.equal(errs.length, 0, errs.join('|')); console.log('PASS offline-first: page cached on first visit, reload offline works');
  } catch (e) { console.error(e); code = 1; } finally { await b.close(); srv.close(); process.exit(code); }
});
