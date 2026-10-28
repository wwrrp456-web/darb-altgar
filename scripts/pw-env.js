// تهيئة تشغيل الاختبارات في بيئة مسار Playwright فيها مختلف أو Chromium فيها مقيَّد، دون تعديل أي اختبار ولا شيفرة اللعبة:
//   node -r ./scripts/pw-env.js test/header-compact-ui.test.js
// أو للحزمة: NODE_OPTIONS="--require $PWD/scripts/pw-env.js" node test/run.js
// متغيرات اختيارية: PW_ROOT مسار مجلد playwright الفعلي (يُكتشف تلقائياً من المواضع المعروفة)، PW_ARGS وسائط Chromium إضافية مفصولة بمسافة.
const Module = require('module'), fs = require('fs'), path = require('path');
const WANT = '/opt/node-tools/node_modules/playwright';
const CANDIDATES = [process.env.PW_ROOT, WANT, '/workspace/cloud-tools/node_modules/playwright', path.join(process.cwd(), 'node_modules/playwright')].filter(Boolean);
const real = CANDIDATES.find(p => fs.existsSync(path.join(p, 'package.json')));
if (!real) { console.error('pw-env: لم أجد playwright في: ' + CANDIDATES.join(' ، ')); process.exit(2); }
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) { return orig.call(this, request === WANT || request.startsWith(WANT + '/') ? real + request.slice(WANT.length) : request, ...rest); };
// Chromium داخل حاويات مقيَّدة (setsockopt: Operation not permitted): بلا sandbox ولا ذاكرة مشتركة، ومن دون إجبار أي اختبار على وسائط
const extra = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'].concat((process.env.PW_ARGS || '').split(/\s+/).filter(Boolean));
try {
  const pw = require(real), ct = pw.chromium, launch = ct.launch.bind(ct);
  ct.launch = (opts = {}) => launch(Object.assign({}, opts, { args: Array.from(new Set((opts.args || []).concat(extra))) }));
} catch (e) { console.error('pw-env: تعذّر تحميل playwright:', e.message); process.exit(2); }
