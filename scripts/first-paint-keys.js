// يولّد brand/inline.json: مفاتيح ART التي تظهر في الشاشة الأولى (تُدمج في الصفحة؛ ما عداها ملف خارجي). node scripts/first-paint-keys.js
// المواضع: (أ) التحميل (ب) أول تشغيل ?learn=1&seed=5 حتى الرئيسية (ج) الرئيسية بحفظ test/fixtures/guided-8.json (د) الشريطان العلوي والسفلي؛ بعرضَي 390 و1100.
// brand وnav كاملتان تُدمجان في build.js دائماً فلا تدخلان هنا. يعمل على أي بناء: يربط src أو background-image بالمفتاح عبر قيمة ART.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const BASE = 'file://' + path.join(root, 'index.html'), raw = JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/guided-8.json'), 'utf8')).raw;
// يرصد فقط ما يقع داخل نافذة العرض الأولى (دون تمرير): الصور تحت الطيّ تبقى خارجية وتُحمَّل كسولاً.
const WATCH = () => { window.__seen = new Set(); const add = s => { if (s) window.__seen.add(s); }, vis = e => { const r = e.getBoundingClientRect(); return e.checkVisibility({ checkVisibilityCSS: true }) && r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; };
  const sweep = () => { document.querySelectorAll('img').forEach(i => { if (vis(i) || i.closest('#top, #nav, #bootload, #splash')) add(i.getAttribute('src')); }); // الشريطان العلوي والسفلي بكل أيقوناتهما (حتى المخفية في الأدراج)
   document.querySelectorAll('body *').forEach(e => { if (!vis(e)) return; const bg = getComputedStyle(e).backgroundImage; if (bg && bg !== 'none') for (const m of bg.matchAll(/url\(["']?(.*?)["']?\)/g)) add(m[1]); }); };
  const loop = () => { try { sweep(); } catch (e) {} setTimeout(loop, 120); }; document.addEventListener('DOMContentLoaded', loop); window.__sweep = sweep; };
(async () => {
  const b = await chromium.launch(), seen = new Set(); let ART = null;
  const sweep = async (p, ms) => { for (let t = 0; t < ms; t += 150) { await p.evaluate(() => window.__sweep && window.__sweep()).catch(() => {}); await p.waitForTimeout(150); } };
  const collect = async p => { (await p.evaluate(() => [...window.__seen]).catch(() => [])).forEach(s => seen.add(s)); if (!ART) ART = await p.evaluate(() => window.ART).catch(() => null); };
  for (const w of [390, 1100]) for (const mode of ['learn', 'save']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); await p.addInitScript(WATCH);
    if (mode === 'save') await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw);
    await p.goto(BASE + (mode === 'learn' ? '?learn=1&seed=5' : '?seed=5')); await sweep(p, 600); await collect(p);
    await p.waitForFunction(() => !!window.__game, null, { timeout: 20000 });
    if (await p.locator('#coverGo').count()) { await sweep(p, 300); await p.locator('#coverGo').click().catch(() => {}); }
    await sweep(p, 3000); await collect(p); await ctx.close();
  }
  await b.close();
  const byVal = new Map(); for (const [k, v] of Object.entries(ART)) { if (!byVal.has(v)) byVal.set(v, []); byVal.get(v).push(k); }
  const onDisk = k => ['webp', 'png', 'jpg', 'jpeg'].some(x => fs.existsSync(path.join(root, 'brand/img', k + '.' + x))), keys = new Set();
  for (const s of seen) { const rel = /^(file|https?):/.test(s) ? decodeURIComponent((s.match(/(?:brand\/img|img)\/.*$/) || [''])[0]) : s; for (const k of byVal.get(rel) || []) if (!/^(brand|nav)\//.test(k) && onDisk(k)) keys.add(k); }
  const list = [...keys].sort(); fs.writeFileSync(path.join(root, 'brand/inline.json'), JSON.stringify(list, null, 1) + '\n');
  console.log('brand/inline.json: ' + list.length + ' مفتاحاً (صور ظاهرة مرصودة: ' + seen.size + ')');
})();
