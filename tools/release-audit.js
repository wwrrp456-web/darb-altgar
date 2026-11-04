'use strict';
/* فحص الإصدار 1.0 (specs/029-release-audit): فحص فقط، لا يغيّر شيئاً في src/.
   الاستعمال: node tools/release-audit.js [perf|size|mobile|a11y|offline|clock|stability|all] [--shots]
   المخرج: docs/release/audit-data.json (أرقام قابلة للإعادة) ولقطات docs/shots/release-audit/. يقرأ index.html المبني، فشغّل node build.js أولاً. */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const root = path.join(__dirname, '..'), OUT = path.join(root, 'docs/release/audit-data.json'), SHOTS = path.join(root, 'docs/shots/release-audit');
const args = process.argv.slice(2), want = args.filter(a => !a.startsWith('--')), has = k => !want.length || want.includes('all') || want.includes(k);
const fx = n => JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures', n + '.json'), 'utf8'));
const PAGE = 'file://' + path.join(root, 'index.html');
const SCREENS = ['home', 'office', 'map', 'market', 'caravan', 'estate', 'lords', 'empire', 'academy', 'cities'];
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const r1 = n => Math.round(n * 10) / 10;
fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(path.dirname(OUT), { recursive: true });
const data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');

// الحفظات الأربعة: بداية، متوسط، متقدم، متقدم بكل الإداريين (يُوظَّفون عبر الواجهة البرمجية الفعلية بعد التحميل).
const SAVES = { start: 'guided-4', mid: 'guided-10', adv: 'autopilot-23', full: 'autopilot-23' };
async function open(b, key, { width = 390, height = 844, throttle = 1, query = '?learn=1&seed=5&fold=1', offline = false, raw } = {}) {
  const ctx = await b.newContext({ viewport: { width, height } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  let rawUse = raw || fx(SAVES[key]).raw;
  if (key === 'full') { // الإداريون الثلاثة يُحقنون في الحفظ مباشرة (شروط التوظيف الفعلية تحتاج وكيلاً وسفينة)؛ والتحميل يملأ القواعد الافتراضية
    const j = JSON.parse(rawUse), d = j.day || 0, pl = j.player; pl.diwan = { since: d - 60, box: 20000, rules: {}, ask: [], log: [], cool: {}, said: {}, late: 0, paid: 0, covered: 0 }; pl.cchief = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0 }; pl.portm = { since: d - 60, rules: {}, ask: [], log: [], cool: {}, late: 0, paid: 0, week: { day: -1, snap: {}, last: 0 } }; rawUse = JSON.stringify(j);
  }
  await p.addInitScript(r => localStorage.setItem('darb-v3', r), rawUse);
  const cdp = await ctx.newCDPSession(p); if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const t0 = Date.now(); await p.goto(PAGE + query); await p.waitForFunction(() => !!window.__game && document.body.dataset);
  const boot = Date.now() - t0;
  if (key === 'full') await p.evaluate(() => {
    const { S, E } = __game; let n = (S.rivals || []).length; for (let i = 0; i < 60 && n < 6; i++) { try { E.rivalGenBirth(S, null); } catch (e) { break; } n = (S.rivals || []).length; }
    window.__fullInfo = { rivals: n, diwan: !!S.player.diwan, cchief: !!S.player.cchief, portm: !!S.player.portm };
  });
  return { ctx, p, errs, boot };
}
const go = (p, s) => p.evaluate(s => { const g = __game; g.S.learn.free = true; g.S.noEvents = true; g.setSpeed(0); g.go(s); g.renderAll(true); }, s);

async function perf(b) {
  const out = {};
  for (const key of Object.keys(SAVES)) {
    const { ctx, p, errs, boot } = await open(b, key, { throttle: 4 });
    const m = await p.evaluate(({ SCREENS }) => {
      const g = __game, S = g.S, E = g.E, med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
      S.noEvents = true; g.setSpeed(0); S.learn.free = true;
      const ticks = []; for (let i = 0; i < 15; i++) { const t = performance.now(); E.tick(S); ticks.push(performance.now() - t); }
      const rows = {}; for (const s of SCREENS) { g.go(s); const rs = []; for (let i = 0; i < 5; i++) { const t = performance.now(); g.renderAll(true); rs.push(performance.now() - t); } rows[s] = med(rs); }
      return { day: S.day, tickMed: med(ticks), tickMax: Math.max(...ticks), render: rows, info: window.__fullInfo || null };
    }, { SCREENS });
    const worst = Math.max(...Object.values(m.render)), worstScreen = Object.keys(m.render).find(k => m.render[k] === worst);
    out[key] = { fixture: SAVES[key], bootMs: boot, day: m.day, tickMedMs: r1(m.tickMed), tickMaxMs: r1(m.tickMax), renderMs: Object.fromEntries(Object.entries(m.render).map(([k, v]) => [k, r1(v)])), worstScreen, tickPlusWorstRenderMs: r1(m.tickMed + worst), full: m.info, errs };
    await ctx.close();
  }
  // أول تفاعل: من التنقل حتى ظهور الشريط السفلي وزر قابل للنقر، على حفظ جديد فارغ.
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(), cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = Date.now(); await p.goto(PAGE + '?learn=1&seed=5'); await p.waitForSelector('#nav button', { state: 'visible' }); out.firstInteractionMs_emptySave = Date.now() - t0;
  const nav = await p.evaluate(() => { const e = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(e.domContentLoadedEventEnd), load: Math.round(e.loadEventEnd) }; }); out.nav = nav;
  await ctx.close(); data.perf = out; save(); return out;
}

async function size() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), out = { indexBytes: html.length };
  const uris = [...html.matchAll(/data:(image|font|audio)\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g)].map(m => ({ type: m[0].slice(5, m[0].indexOf(';')), bytes: Math.round(m[0].length * 3 / 4) }));
  out.embeddedAssets = { count: uris.length, bytes: uris.reduce((n, u) => n + u.bytes, 0) };
  const ref = [...html.matchAll(/(?:brand\/img|img)\/[A-Za-z0-9_./-]+\.(?:webp|jpg|png)/g)].length; out.externalImageRefs = ref;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const files = ['brand/img', 'img'].filter(d => fs.existsSync(path.join(root, d))).flatMap(d => walk(path.join(root, d))).map(f => ({ file: path.relative(root, f), bytes: fs.statSync(f).size }));
  out.imgFolder = { count: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0) };
  out.top10Embedded = uris.sort((a, b) => b.bytes - a.bytes).slice(0, 10);
  out.top10Files = files.sort((a, b) => b.bytes - a.bytes).slice(0, 10);
  const big = ['index.html', 'sw.js', 'version.json', 'dist-artifact.html', 'guide/index.html'].filter(f => fs.existsSync(path.join(root, f))).map(f => ({ file: f, bytes: fs.statSync(path.join(root, f)).size })); out.rootFiles = big;
  const sections = {}; const re = /<script[^>]*>([\s\S]*?)<\/script>/g; let m, i = 0; while ((m = re.exec(html))) sections['script#' + (i++)] = m[1].length; out.scripts = Object.entries(sections).sort((a, b) => b[1] - a[1]).slice(0, 3);
  data.size = out; save(); return out;
}

async function mobile(b) {
  const out = {};
  for (const width of [390, 360]) for (const key of ['start', 'adv', 'full']) {
    const { ctx, p, errs } = await open(b, key, { width }), rows = [];
    for (const s of SCREENS) {
      await go(p, s); await p.waitForTimeout(80);
      const m = await p.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden]'); };
        const tgt = [...document.querySelectorAll('button,select,input:not([type=hidden]),summary,[role=button],a[href]')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.width < 40 || r.height < 40; }).map(e => (e.id || e.dataset.act || e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 14));
        const clip = [...document.querySelectorAll('main *,#app *,section *')].filter(vis).filter(e => { const cs = getComputedStyle(e); return e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && e.children.length === 0 && (e.textContent || '').trim().length > 0; }).slice(0, 8).map(e => (e.id || e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 24));
        const wide = [...document.querySelectorAll('body *')].filter(vis).filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(e => (e.id || e.className || e.tagName).toString().slice(0, 40));
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, scrollW: document.documentElement.scrollWidth, small: tgt, clipped: clip, wide, pageH: Math.round(document.documentElement.scrollHeight) };
      });
      rows.push({ screen: s, ...m, smallCount: m.small.length, small: m.small.slice(0, 8) });
      if (width === 390 && (key === 'full' || key === 'start') && args.includes('--shots')) await p.screenshot({ path: path.join(SHOTS, `${key}-${s}-390.jpg`), type: 'jpeg', quality: 55, fullPage: s === 'office' });
    }
    // بطاقات المكتب: كل بطاقة على حدة.
    await go(p, 'office');
    const cards = await p.evaluate(() => [...document.querySelectorAll('.office > .card, .office > div, .office section, .office details')].map(e => { const r = e.getBoundingClientRect(); return { id: (e.id || e.className || e.tagName).toString().slice(0, 40), h: Math.round(r.height), over: r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 2 }; }).slice(0, 40));
    out[width + '/' + key] = { rows, officeCards: cards, errs };
    await ctx.close();
  }
  data.mobile = out; save(); return out;
}

async function a11y(b) {
  const out = {};
  for (const key of ['start', 'adv', 'full']) {
    const { ctx, p, errs } = await open(b, key), res = { iconOnly: {}, contrast: {}, focus: null };
    for (const s of SCREENS) {
      await go(p, s);
      res.iconOnly[s] = await p.evaluate(() => [...document.querySelectorAll('button,[role=button],summary,a[href]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); }).filter(e => !/[\p{L}\p{N}]/u.test(e.textContent || '') && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.title && !(e.querySelector('img[alt]:not([alt=""])'))).map(e => (e.id || e.dataset.act || e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 4)).slice(0, 10));
    }
    for (const theme of ['light', 'dark']) {
      const bad = {};
      for (const s of SCREENS) {
        await p.evaluate(t => { document.documentElement.dataset.theme = t; }, theme); await go(p, s);
        const r = await p.evaluate(() => {
          const lum = c => { const a = c.match(/[\d.]+/g).map(Number), v = a.slice(0, 3).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return { l: v[0] * .2126 + v[1] * .7152 + v[2] * .0722, a: a[3] === undefined ? 1 : a[3] }; };
          const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor, l = lum(c); if (l.a > .5) return c; } return 'rgb(255,255,255)'; };
          const seen = new Set(), fails = []; let total = 0;
          for (const e of document.querySelectorAll('body *')) {
            if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
            const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (r.width <= 0 || r.height <= 0 || cs.visibility === 'hidden' || e.closest('[hidden]') || +cs.opacity === 0) continue;
            const fg = lum(cs.color), bg = lum(bgOf(e)); const ratio = (Math.max(fg.l, bg.l) + .05) / (Math.min(fg.l, bg.l) + .05), size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
            total++; if (ratio < (large ? 3 : 4.5)) { const k = (e.className || e.tagName) + '|' + cs.color + '|' + bgOf(e); if (!seen.has(k)) { seen.add(k); fails.push({ el: (e.id || e.className || e.tagName).toString().slice(0, 40), ratio: Math.round(ratio * 100) / 100, text: e.textContent.trim().slice(0, 20) }); } }
          }
          return { total, fails: fails.slice(0, 12) };
        });
        bad[s] = r;
      }
      res.contrast[theme] = bad;
    }
    await p.evaluate(() => { delete document.documentElement.dataset.theme; });
    // ترتيب التركيز في قائمة ⋯: يدخل التركيز إليها ولا يتسرّب منها، ويغلقها Escape ويعيد التركيز.
    await go(p, 'home');
    res.focus = await p.evaluate(async () => {
      const btn = document.querySelector('#hMenu'); if (!btn) return { note: 'لا زر قائمة' }; btn.focus(); btn.click(); await new Promise(r => setTimeout(r, 120));
      const menu = document.querySelector('.hmenu.show,#hmenu.show,[role=menu]:not([hidden])') || document.querySelector('.hmenu'); const inside = () => menu && menu.contains(document.activeElement);
      return { menuFound: !!menu, ariaExpanded: btn.getAttribute('aria-expanded'), role: menu && (menu.getAttribute('role') || ''), focusInsideOnOpen: inside(), activeOnOpen: (document.activeElement.id || document.activeElement.tagName) };
    });
    for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
    res.focus.afterTabs = await p.evaluate(() => { const m = document.querySelector('.hmenu.show,#hmenu.show,[role=menu]:not([hidden])'); return { insideMenu: !!(m && m.contains(document.activeElement)), active: (document.activeElement.id || document.activeElement.tagName) }; });
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    res.focus.afterEsc = await p.evaluate(() => ({ expanded: document.querySelector('#hMenu')?.getAttribute('aria-expanded'), active: document.activeElement.id || document.activeElement.tagName }));
    res.errs = errs; out[key] = res; await ctx.close();
  }
  data.a11y = out; save(); return out;
}

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  const s = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(root, u.endsWith('/') ? u + 'index.html' : u); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(r); });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok(s)));
}
async function offline(b) {
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/', out = {};
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, fx('autopilot-23').raw);
    await p.goto(base + '?learn=1&seed=5'); await p.waitForFunction(() => !!window.__game);
    out.swRegistered = await p.evaluate(async () => { if (!navigator.serviceWorker) return false; const r = await navigator.serviceWorker.getRegistration(); return !!r; });
    out.swReady = await p.evaluate(async () => { try { await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(rej, 8000))]); return true; } catch (e) { return false; } });
    out.firstVisitCachedPage = await p.evaluate(async () => { const c = await caches.match(new Request(new URL('./', location.href).href)); return !!c; });
    await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => !!window.__game); await p.waitForTimeout(3000); // الفتحة الثانية تمر عبر ملف العمل فتُخزَّن الصفحة
    out.secondVisitCachedPage = await p.evaluate(async () => { const c = await caches.match(new Request(new URL('./', location.href).href)); return !!c; });
    out.cachedKeys = await p.evaluate(async () => { const ks = await caches.keys(), o = {}; for (const k of ks) o[k] = (await (await caches.open(k)).keys()).length; return o; });
    await ctx.setOffline(true);
    const t0 = Date.now(); let ok = false, why = '';
    try { await p.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForFunction(() => !!window.__game, null, { timeout: 30000 }); ok = true; } catch (e) { why = e.message.split('\n')[0]; }
    out.offlineReload = { ok, ms: Date.now() - t0, why };
    if (ok) { out.offlineDay = await p.evaluate(() => __game.S.day); out.offlinePlays = await p.evaluate(() => { try { const g = __game; g.setSpeed(0); const d = g.S.day; g.E.tick(g.S); return g.S.day > d; } catch (e) { return String(e); } }); }
    await ctx.setOffline(false);
    // تحديث الإصدار: النسخة المخزنة معرّفها، فإذا تغيّر version.json ظهر زر التحديث.
    const ver = await p.evaluate(async () => { try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); return await r.json(); } catch (e) { return null; } });
    out.versionJson = ver; out.buildIdInPage = await p.evaluate(() => typeof BUILD_ID !== 'undefined' ? BUILD_ID : (document.documentElement.dataset.build || null));
    out.errs = errs; await ctx.close();
  } finally { srv.close(); }
  data.offline = out; save(); return out;
}

async function clock(b) {
  const out = {};
  for (const key of ['start', 'mid', 'adv', 'full']) {
    const { ctx, p, errs } = await open(b, key, { query: '?learn=1&seed=5&idle=1' }), rows = [];
    for (const s of SCREENS) {
      await p.evaluate(s => { const g = __game; g.S.noEvents = false; g.go(s); g.renderAll(true); }, s); await p.waitForTimeout(350);
      // ضغطة واحدة على زر النافذة الظاهرة (حتى 6 نوافذ متتالية) يجب أن تفك الإيقاف.
      const before = await p.evaluate(() => ({ state: document.getElementById('hTimeState')?.dataset.clock, dlg: [...document.querySelectorAll('#lesson,#dlg,[role=dialog],.modal')].filter(e => !e.hidden && e.getClientRects().length).map(e => e.id || e.className).slice(0, 3) })); let clicks = 0; for (; clicks < 6; clicks++) { const st = await p.evaluate(() => document.getElementById('hTimeState')?.dataset.clock); if (st !== 'blocked') break; const bt = p.locator('#lesson button:visible, #dlg button:visible, [role=dialog] button:visible, .modal:not([hidden]) button:visible').first(); if (!await bt.count()) break; await bt.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(250); }
      const m0 = await p.evaluate(() => document.getElementById('hTimeState')?.dataset.clock); const m = await p.evaluate(() => {
        const g = __game, S = g.S, el = document.getElementById('hTimeState'), state = el && el.dataset.clock;
        const vis = e => !e.hidden && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
        const dlg = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,.overlay,#dlg,#react,.backup-panel,.hmenu.show,#alertPanel.show,#hdrop.show')].filter(vis);
        const causes = { learnNext: !!g.learnNext(), awayJob: !!S.awayJob, awayReport: !!S.awayReport, hidden: document.hidden, autoplay: document.body.classList.contains('autoplay') };
        return { state, label: el && el.textContent, dialogs: dlg.map(e => (e.id || e.className || e.tagName).toString().slice(0, 30)), buttons: dlg.map(e => e.querySelectorAll('button').length), causes };
      });
      const unexplained = m.state === 'blocked' && !m.dialogs.length;
      rows.push({ screen: s, ...m, before, clicksToUnblock: clicks, stateAfter: m0, unexplained });
    }
    out[key] = { rows, blockedNoDialog: rows.filter(r => r.unexplained).map(r => r.screen), blockedWithDialog: rows.filter(r => r.state === 'blocked' && r.dialogs.length).map(r => r.screen), errs };
    await ctx.close();
  }
  data.clock = out; save(); return out;
}

async function stability(b) {
  const out = { seeds: [] }, base = fx('autopilot-23'), N = 6;
  const jobs = Array.from({ length: N }, (_, i) => i);
  const runOne = async i => {
    const seedMul = 1000 + i * 7919, raw = JSON.parse(base.raw); raw.seed = (raw.seed + seedMul) >>> 0; raw.climateSeed = 5 + i * 13;
    const { ctx, p, errs } = await open(b, 'adv', { raw: JSON.stringify(raw) }); const t0 = Date.now();
    await p.evaluate(() => { const E = __game.E, t = E.tick; E.tick = S => t(S, false); __game.apStart({ mode: 'current', seed: 5, speed: 'max', target: 'y3', inject: true }); });
    let st = null; for (let k = 0; k < 1500; k++) { await p.waitForTimeout(400); st = await p.evaluate(() => { const g = __game, a = g.AP, s = g.S; return { fin: a.finished, stuck: a.stuck, reason: a.reason, day: s.day, yrs: s.yr ? s.yr.n : -1, elapsed: s.day - a.freeStart }; }); if (st.fin || st.stuck || Date.now() - t0 > 20 * 60 * 1000) break; }
    const nan = await p.evaluate(() => { const bad = []; const walk = (o, pth, d) => { if (d > 7 || o == null) return; if (typeof o === 'number') { if (!Number.isFinite(o)) bad.push(pth); return; } if (typeof o !== 'object') return; for (const k of Object.keys(o)) { walk(o[k], pth + '.' + k, d + 1); if (bad.length > 5) return; } }; walk(JSON.parse(__game.E.save(__game.S)), 'S', 0); try { walk(__game.S, 'live', 0); } catch (e) {} return bad; });
    await ctx.close(); return { i, seed: raw.seed, climateSeed: raw.climateSeed, ...st, years: r1((st.elapsed || 0) / 354), sec: Math.round((Date.now() - t0) / 1000), nan, errs: errs.slice(0, 3) };
  };
  for (let k = 0; k < jobs.length; k += 3) out.seeds.push(...await Promise.all(jobs.slice(k, k + 3).map(runOne)));
  // تحميل كل fixture قديم.
  out.fixtures = [];
  for (const f of fs.readdirSync(path.join(root, 'test/fixtures')).filter(n => n.endsWith('.json'))) {
    const j = fx(f.replace('.json', '')); const { ctx, p, errs } = await open(b, 'adv', { raw: j.raw }), r = await p.evaluate(() => { const g = __game; try { g.E.tick(g.S); g.renderAll(true); return { ok: true, day: g.S.day, stage: g.S.learn && g.S.learn.stage }; } catch (e) { return { ok: false, err: e.message }; } });
    out.fixtures.push({ file: f, ...r, errs }); await ctx.close();
  }
  data.stability = out; save(); return out;
}

(async () => {
  const b = await chromium.launch(); data.meta = { at: new Date().toISOString(), node: process.version, indexBytes: fs.statSync(path.join(root, 'index.html')).size, fixtures: SAVES };
  try {
    if (has('size')) console.log('size', JSON.stringify((await size()).embeddedAssets));
    if (has('perf')) { const r = await perf(b); for (const k of Object.keys(SAVES)) console.log('perf', k, r[k].tickMedMs, r[k].worstScreen, r[k].tickPlusWorstRenderMs); }
    if (has('mobile')) { const r = await mobile(b); for (const k of Object.keys(r)) console.log('mobile', k, 'overflow:', r[k].rows.filter(x => x.overflow).map(x => x.screen).join(',') || '-', 'small:', r[k].rows.reduce((n, x) => n + x.smallCount, 0)); }
    if (has('a11y')) { await a11y(b); console.log('a11y done'); }
    if (has('offline')) console.log('offline', JSON.stringify((await offline(b)).offlineReload));
    if (has('clock')) { const r = await clock(b); for (const k of Object.keys(r)) console.log('clock', k, 'blocked-no-dialog:', r[k].blockedNoDialog.join(',') || '-'); }
    if (has('stability')) { const r = await stability(b); console.log('stability', r.seeds.map(s => s.years + 'y' + (s.nan.length ? ' NaN' : '') + (s.errs.length ? ' ERR' : '')).join(' ')); }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
