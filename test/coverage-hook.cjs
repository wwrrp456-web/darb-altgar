'use strict';
// يُحمّل داخل عملية الاختبار فقط؛ لا يغيّر الاختبار أو الصفحة أو مصدر اللعبة.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const inspector = require('node:inspector');
const core = require('./coverage-core.cjs');
const root = process.env.DARB_COVERAGE_ROOT;
const output = process.env.DARB_COVERAGE_OUT;
if (!root || !output) throw Error('جامع التغطية يحتاج تشغيله من أداة التوليد.');
const data = core.catalog(root);
const nodeFiles = new Set(), browserFiles = new Set(), errors = [];
const session = new inspector.Session(); session.connect();
function post(method, params = {}) {
  let result, failure;
  session.post(method, params, (error, value) => { failure = error; result = value; });
  if (failure) throw failure;
  if (!result) throw Error('لم يكتمل أمر فحص التغطية.');
  return result;
}
post('Profiler.enable'); post('Debugger.enable');
post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
let pages = 0, browserSnapshots = 0, nodeSnapshots = 0, done = false, loading = 0;
const sourceCache = new Map();
function take(keep) {
  const entries = post('Profiler.takePreciseCoverage').result;
  if (!keep) return;
  nodeSnapshots++;
  for (const entry of entries) {
    let source;
    if (!entry.url && entry.functions.some(f => f.ranges[0]?.count > 0)) {
      if (!sourceCache.has(entry.scriptId)) {
        try { sourceCache.set(entry.scriptId, post('Debugger.getScriptSource', { scriptId: entry.scriptId }).scriptSource); } catch { sourceCache.set(entry.scriptId, ''); }
      }
      source = sourceCache.get(entry.scriptId);
    }
    for (const file of core.fromNode(entry, data, source)) nodeFiles.add(file);
  }
}
function write() {
  fs.writeFileSync(output, JSON.stringify({ name: process.env.DARB_COVERAGE_TEST, fingerprint: data.fingerprint, nodeFiles: [...nodeFiles].sort(), browserFiles: [...browserFiles].sort(), pages, browserSnapshots, nodeSnapshots, errors }));
}
const prepared = new WeakMap(), contexts = new WeakSet(), browsers = new WeakSet(), patched = new WeakSet(), live = new Set();
async function stopCapture(page, ids) {
  const state = prepared.get(page);
  if (!state?.started) return;
  state.started = false;
  try {
    const entries = await page.coverage.stopJSCoverage(); browserSnapshots++;
    for (const entry of entries) if (!ids || ids.has(entry.scriptId)) for (const file of core.fromBrowser(entry, data)) browserFiles.add(file);
  } catch { errors.push('تعذّر جمع تغطية صفحة قبل إغلاقها أو انتقالها.'); }
  write();
}
async function flush(page) {
  const state = prepared.get(page);
  if (!state) return;
  await state.pending;
  await stopCapture(page);
}
async function prepare(page) {
  if (prepared.has(page)) return page;
  const state = { started: false, manual: false, ids: new Set(), pending: Promise.resolve() }; prepared.set(page, state); live.add(page); pages++;
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Debugger.scriptParsed', event => state.ids.add(event.scriptId));
  cdp.on('Page.frameNavigated', ({ frame }) => {
    if (frame.parentId) return;
    const previous = state.ids; state.ids = new Set();
    if (!state.manual) state.pending = state.pending.then(() => stopCapture(page, previous)).catch(() => { errors.push('تعذّر فصل تغطية المستند السابق عن إعادة التحميل.'); });
  });
  cdp.on('Page.loadEventFired', () => {
    if (state.manual) return;
    state.pending = state.pending.then(async () => {
      if (state.started) return;
      await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true }); state.started = true;
    }).catch(() => { errors.push('تعذّر بدء التغطية بعد إعادة تحميل تلقائية.'); });
  });
  await cdp.send('Page.enable'); await cdp.send('Debugger.enable');
  for (const method of ['goto', 'reload', 'setContent']) {
    const original = page[method].bind(page);
    page[method] = async (...args) => {
      state.manual = true;
      try {
        await flush(page);
        const result = await original(...args);
        // نبدأ بعد اكتمال الإقلاع: لا تُحسب تعريفات البيانات أو الاستدعاءات الأولية.
        await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
        state.started = true;
        return result;
      } finally { state.manual = false; }
    };
  }
  for (const method of ['evaluate', 'waitForURL', 'waitForLoadState', 'waitForSelector', 'waitForFunction']) {
    const original = page[method].bind(page);
    page[method] = async (...args) => { await state.pending; const value = await original(...args); await state.pending; return value; };
  }
  const close = page.close.bind(page);
  page.close = async (...args) => { await flush(page); live.delete(page); return close(...args); };
  return page;
}
function context(ctx) {
  if (contexts.has(ctx)) return ctx; contexts.add(ctx);
  const create = ctx.newPage.bind(ctx), close = ctx.close.bind(ctx);
  ctx.newPage = async (...args) => prepare(await create(...args));
  ctx.close = async (...args) => { for (const p of ctx.pages()) await flush(p); return close(...args); };
  return ctx;
}
function patch(pw) {
  if (patched.has(pw)) return; patched.add(pw);
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = async (...args) => {
    const browser = await launch(...args);
    if (browsers.has(browser)) return browser; browsers.add(browser);
    const create = browser.newPage.bind(browser), createContext = browser.newContext.bind(browser), close = browser.close.bind(browser);
    browser.newPage = async (...a) => prepare(await create(...a));
    browser.newContext = async (...a) => context(await createContext(...a));
    browser.close = async (...a) => { for (const c of browser.contexts()) for (const p of c.pages()) await flush(p); return close(...a); };
    return browser;
  };
}
const load = Module._load;
Module._load = function (request, parent, isMain) {
  let resolved;
  try { resolved = Module._resolveFilename(request, parent); } catch { /* يتولى المحمّل الأصلي الخطأ */ }
  const fresh = typeof resolved === 'string' && resolved.startsWith(path.join(root, 'src') + path.sep) && !Module._cache[resolved];
  const outer = fresh && loading === 0;
  if (outer) take(true);
  if (fresh) loading++;
  let result;
  try { result = load.call(this, request, parent, isMain); }
  finally { if (fresh) loading--; if (outer) take(false); }
  if (request === '/opt/node-tools/node_modules/playwright' || (resolved && /[/\\]playwright[/\\](?:index|lib[/\\]index)\.(?:js|mjs)$/.test(resolved))) patch(result);
  return result;
};
// يغطي كذلك تحميل الوحدات داخل VM كما في اختبارات الصوت والحفظ.
const vm = require('node:vm');
for (const method of ['runInNewContext', 'runInContext', 'runInThisContext']) {
  const run = vm[method];
  vm[method] = function (code, ...args) {
    const startup = typeof code === 'string' && core.locate(code, data.groups).length > 0 && loading === 0;
    if (startup) take(true);
    try { return run.call(this, code, ...args); } finally { if (startup) take(false); }
  };
}
function finish() {
  if (done) return; done = true;
  try { take(true); } catch { errors.push('تعذّر جمع تغطية Node النهائية.'); }
  write(); session.disconnect();
}
const exit = process.exit.bind(process); let exiting = false;
process.exit = function (code) {
  if (exiting) return; exiting = true;
  Promise.all([...live].map(flush)).then(() => { finish(); exit(code); }, () => { errors.push('تعذّر إتمام تغطية المتصفح.'); finish(); exit(code || 1); });
};
process.once('exit', finish);
