#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const core = require('./coverage-core.cjs');
const root = path.resolve(__dirname, '..');
const mapPath = path.join(__dirname, 'map.coverage.json');
const metaPath = path.join(__dirname, 'map.coverage.meta.json');
const reportPath = path.join(root, 'docs/COVERAGE_MAP.md');
const seconds = () => Number(process.hrtime.bigint()) / 1e9;

function fingerprint(data, all) {
  const h = crypto.createHash('sha256').update(data.fingerprint);
  for (const f of ['test/all.sh', 'test/coverage-core.cjs', 'test/coverage-hook.cjs', ...all.map(n => 'test/' + n + '.test.js')]) h.update(f).update(fs.readFileSync(path.join(root, f)));
  return h.digest('hex');
}
function report(map, meta) {
  const unmeasured = meta.allTests.filter(n => !meta.measuredTests.includes(n));
  const uncovered = Object.keys(map).filter(f => map[f].length === 0);
  const examples = ['src/ui/10-screen-lords.js', 'src/engine/20-finance.js', 'src/babylon.js'];
  return `# خريطة الاختبارات من التنفيذ الفعلي

هذا ملف مولّد بواسطة \`node test/coverage-map.js\`. لا تغيّر الأداةُ الخريطةَ المعتمدة \`test/map.json\` ولا أي مصدر أو اختبار أو صفحة مبنية.

## التشغيل

\`node test/coverage-map.js\` يجمع الحزمة كاملة. \`node test/coverage-map.js lords market --jobs 2\` يعيد قياس هذين الاسمين بالضبط ويدمج النتيجة، مع إزالة روابطهما القديمة أولًا. الافتراضي أصغر القيمتين: أربع عمليات وعدد الأنوية. الملفات المساعدة الجديدة \`coverage-core.cjs\` و\`coverage-hook.cjs\` تعمل داخل العمليات دون اعتماديات خارجية إضافية. مسار Playwright هو مسار المشروع المعتمد.

الملفات الناتجة: \`test/map.coverage.json\` و\`test/map.coverage.meta.json\` وهذا التقرير. ملف البيانات الوصفية يحفظ الاختبارات المقاسة وبصمة المصدر والاختبارات وأداة الجمع؛ تُرفض الجولة الجزئية إن تغيرت البصمة أو غابت البيانات الوصفية، وتُطلب جولة كاملة. يمكن بدء جولة جزئية دون خريطة سابقة، لكن التقرير يعلن صراحةً الاختبارات غير المقاسة. لا يُعتمد ناتج جديد إذا أخفق اختبار أو تعذّر جمع تغطيته؛ تبقى الملفات السابقة كما هي.

## معنى التغطية والعتبة

العتبة: استدعاء دالة واحد على الأقل **بعد الإقلاع**، كما يثبته عداد دخول الدالة الموجب في V8، ويقع مداها داخل ملف مصدر واحد. تعريف الدالة وحده لا يكفي. يُهمل مدى السكربت الأعلى وأغلفة الوحدات المجهولة وأغلفة المحرك والواجهة العابرة للأجزاء. هذه تغطية دخول دوال وليست نسبة تغطية أسطر أو فروع؛ لا يقال إن كل سطر في الدالة نُفّذ.

قاعدة الغلاف المجهول محددة: يُهمل مدى الدالة غير المسماة الذي يغطي 90% أو أكثر من نص السكربت أو ملف المصدر. هذه قاعدة تحفظية لأغلفة الوحدات؛ قد تستبعد دالة مجهولة كبيرة مشروعة، ولذلك لا تُفسّر القائمة الفارغة وحدها كغياب اختبار.

في المتصفح تبدأ \`page.coverage.startJSCoverage\` بعد اكتمال \`goto/reload/setContent\`، وتُجمع قبل الإغلاق أو الانتقال. لذلك لا تُحتسب استدعاءات الإقلاع وتعريفات الثوابت. في Node يستعمل جامع مستقل \`inspector.Profiler\`؛ يحفظ العدادات قبل تحميل وحدة مصدر جديدة، ثم يصفر تنفيذ تحميلها، ويحتفظ بما يُستدعى بعدها. يُعامل تحميل الوحدات داخل VM بالطريقة نفسها. ملفات كل اختبار المؤقتة منفصلة في مجلد خاص بالجولة، ولا تتشارك العمليات ملفات تغطية أو سجلات.

تُراقَب أيضًا إعادة التحميل والانتقالات التي تطلقها اللعبة نفسها عبر أحداث CDP ومعرّفات السكربتات: تُحفظ استدعاءات المستند السابق، ويُستبعد إقلاع المستند الجديد، ثم يبدأ القياس مجددًا بعد تحميله. ويُمنع تشغيل جولتين كاتبتين للمستودع نفسه بقفل مؤقت خارج المستودع.

تُقرأ أجزاء المحرك والواجهة بترتيب أسماء ملفاتها، ويُتحقق من تطابقها مع المحرك المولّد والصفحة الحالية. الإزاحات بوحدات UTF-16 كما في V8 وسلاسل JavaScript، لا بايتات UTF-8؛ تُراعى العربية والرموز ذات الزوج البديل وتعويض \`__BUILD__\`. في المتصفح تُطابق بصمة المحتوى الحرفي داخل نص السكربت، وفي Node يُحوّل مدى \`src/engine.js\` إلى أجزائه الأصلية. لا تُحقن علامات ولا تُعدّل الصفحة. يُستبعد الملف المولّد من مفاتيح الناتج لتجنب ازدواج المصدر.

## نتيجة الجولة

- التاريخ: ${meta.date}.
- الاختبارات المقاسة: ${meta.measuredTests.length} من ${meta.allTests.length}؛ غير المقاسة: ${unmeasured.length}.
- آخر جولة: ${meta.lastRun.names.length} اختبارًا؛ ${meta.lastRun.seconds.toFixed(1)} ثانية؛ توازٍ ${meta.lastRun.jobs}.
- آخر توليد كامل: ${meta.fullRun ? meta.fullRun.seconds.toFixed(1) + ' ثانية، ' + meta.fullRun.names.length + ' اختبارًا.' : 'لم تُنفَّذ جولة كاملة بعد.'}
- ملفات المصدر: ${Object.keys(map).length}؛ لها استدعاءات مقاسة: ${Object.keys(map).length - uncovered.length}؛ بلا استدعاءات مقاسة: ${uncovered.length}.
- مهلة جمع التغطية ضعف مهلة المشغّل الحالي بسبب كلفة القياس، مع بقاء الاختبارات نفسها دون تعديل. نجاح الجمع لا يحل محل تشغيل الحزمة العادية بمهلها الأصلية.

## ملفات بلا استدعاءات دوال مقاسة

${uncovered.map(f => '- \`' + f + '\`').join('\n') || 'لا يوجد.'}

${unmeasured.length ? '**الجمع جزئي؛ القوائم الفارغة ليست دليلًا على غياب التغطية في الاختبارات غير المقاسة.**\n\nغير المقاسة: ' + unmeasured.map(n => '\`' + n + '\`').join('، ') : 'اكتملت الاختبارات المذكورة في قائمة الحزمة.'}

## أمثلة اختيار تغييرات تجريبية

القوائم التالية ناتجة عن المدى المنفّذ، ولا تُحقن فيها أسماء اختبارات بالتخمين. يصلح محاكاة تعديل في نسخة مؤقتة خارج المستودع ثم قراءة رابط المسار؛ لا يحتاج اختيار الاختبارات إلى تغيير الملف الحقيقي.

${examples.map(f => '- \`' + f + '\`: ' + (map[f]?.length ? map[f].map(n => '\`' + n + '\`').join('، ') : 'لم تُقَس له استدعاءات.')).join('\n')}

اسم جزء واجهة الزعماء الحالي هو \`10-screen-lords.js\`؛ ورد \`09-screen-lords.js\` في مثال التكليف، بينما الجزء 09 الفعلي للقافلة والعقارات.

## التحقق من الأداة

شغّل \`node test/coverage-map.test.js\` لاختبار الأداة نفسها في ملفات مؤقتة معزولة. يفحص ربط إزاحات العربية والرموز، واستبعاد التعريفات والإقلاع في Node والمتصفح، والجمع قبل إغلاق السياق، والانتقال وإعادة التحميل التلقائيين مع حفظ التنفيذ السابق واستبعاد الإقلاع الجديد، والدمج الجزئي مع حذف الروابط القديمة وحفظ نتائج الآخرين، وحفظ زمن الجولة الكاملة، ورفض البيانات القديمة وعدم استبدال الناتج عند فشل الاختبار. لا يدخل هذا الاختبار قائمة الحزمة تلقائيًا ولا يغيّر أي اختبار موجود.

## حدود الدقة

التغطية تثبت **التنفيذ** ولا تثبت أن الاختبار يتحقق من السلوك. تُحسب كذلك الدوال التي تستدعيها المؤقتات بعد الإقلاع؛ قد تكون الروابط واسعة. وفي المقابل، لا يرصد V8 قراءة خاصية بيانات أو نص ثابت؛ ملفات البيانات الخالصة وأجزاء تعريف العالم وملف HTML قد تكون فارغة رغم اعتماد الاختبارات عليها. لا يجوز دمج هذه القوائم الفارغة تلقائيًا بدل روابط أمان البيانات أو الواجهة. غياب الاستدعاء المقاس ليس حكمًا بعدم أهمية الملف.

تُستبعد عمدًا السلوكيات التي لا تُنفَّذ إلا أثناء التحميل، حتى إن تحقق الاختبار من ناتجها الأولي. التغطية هنا لدوال JavaScript؛ لا تثبت تغطية CSS أو DOM أو الصور. تنعكس المسارات والحالات التي جرّبتها الحزمة فقط. لا تُدمج الخريطة الجديدة في المشغّل الحالي؛ القرار لصاحب المشروع. سجلات التغطية الخام مؤقتة، ولا يُحفظ نص الشيفرة أو أي قيمة خاصة ضمن الناتج.
`;
}

async function main() {
  let jobs = Math.min(4, os.availableParallelism ? os.availableParallelism() : os.cpus().length || 1);
  const names = [];
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--jobs') {
      const value = process.argv[++i];
      if (!/^[1-9]\d*$/.test(value || '') || !Number.isSafeInteger(Number(value))) throw Error('عدد العمليات يجب أن يكون عددًا صحيحًا موجبًا.');
      jobs = Number(value);
    } else if (arg.startsWith('-')) throw Error('خيار غير معروف: ' + arg);
    else names.push(arg);
  }
  const loop = fs.readFileSync(path.join(__dirname, 'all.sh'), 'utf8').match(/^\s*for\s+t\s+in\s+([\s\S]*?);\s*do\b/m);
  if (!loop) throw Error('تعذّر استخراج قائمة الاختبارات.');
  const all = [...new Set(loop[1].trim().split(/\s+/))];
  if (all.some(n => !/^[\w-]+$/.test(n) || !fs.existsSync(path.join(__dirname, n + '.test.js')))) throw Error('قائمة الاختبارات غير صالحة.');
  if (names.some(n => !all.includes(n))) throw Error('اسم اختبار غير موجود في قائمة الحزمة.');
  const selected = names.length ? [...new Set(names)] : all;
  const data = core.catalog(root, true), stamp = fingerprint(data, all);
  const map = Object.fromEntries(data.files.map(f => [f, []]));
  let measured = [], fullRun = null;
  if (names.length && fs.existsSync(mapPath)) {
    if (!fs.existsSync(metaPath)) throw Error('الخريطة السابقة بلا بيانات وصفية؛ شغّل جولة كاملة.');
    const old = JSON.parse(fs.readFileSync(mapPath, 'utf8')), meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.fingerprint !== stamp) throw Error('تغيّر المصدر أو الاختبارات أو جامع التغطية؛ شغّل جولة كاملة.');
    fullRun = meta.fullRun || (meta.lastRun.names.length === all.length ? meta.lastRun : null);
    for (const [file, tests] of Object.entries(old)) {
      if (!(file in map) || !Array.isArray(tests) || tests.some(n => !all.includes(n))) throw Error('الخريطة السابقة غير صالحة.');
      map[file] = tests.filter(n => !selected.includes(n));
    }
    measured = meta.measuredTests.filter(n => !selected.includes(n));
  }
  const runSource = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
  const slowLiteral = runSource.match(/const\s+SLOW\s*=\s*\{([^}]*)\}/)?.[1] || '';
  const slow = Object.fromEntries([...slowLiteral.matchAll(/([\w-]+)\s*:\s*(\d+)/g)].map(m => [m[1], Number(m[2])]));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'darb-coverage-'));
  const start = seconds(), results = [], active = new Set(); let cursor = 0, interrupted = false;
  const stop = () => { interrupted = true; for (const child of active) child.kill('SIGTERM'); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  console.log('جمع تغطية ' + selected.length + ' اختبارًا بتوازٍ ' + Math.min(jobs, selected.length) + '.');
  async function run(name) {
    const dir = path.join(directory, name); fs.mkdirSync(dir);
    const target = path.join(dir, 'coverage.json'), log = path.join(dir, 'test.out');
    const fd = fs.openSync(log, 'w'), t = seconds(); let child;
    try {
      child = spawn('timeout', [String((slow[name] || 200) * 2), process.execPath, '--require', path.join(__dirname, 'coverage-hook.cjs'), path.join(__dirname, name + '.test.js')], { cwd: root, env: { ...process.env, DARB_COVERAGE_ROOT: root, DARB_COVERAGE_TEST: name, DARB_COVERAGE_OUT: target }, stdio: ['ignore', fd, fd] });
    } finally { fs.closeSync(fd); }
    active.add(child);
    const status = await new Promise(resolve => { let error; child.once('error', e => { error = e; }); child.once('close', code => resolve({ code, error })); });
    active.delete(child);
    const text = fs.readFileSync(log, 'utf8'); let coverage;
    try { coverage = JSON.parse(fs.readFileSync(target, 'utf8')); } catch { /* يُسجّل فشل جمع */ }
    const passed = !interrupted && !status.error && status.code === 0 && !/^FAIL|ERRORS:|pageerror/m.test(text) && coverage && coverage.fingerprint === data.fingerprint && coverage.name === name && Array.isArray(coverage.errors) && !coverage.errors.length && coverage.nodeSnapshots > 0;
    results.push({ name, passed: !!passed, coverage, seconds: seconds() - t });
    console.log((passed ? '✓ ' : '✗ ') + name + ' (' + (seconds() - t).toFixed(1) + ' ث)');
    if (!passed) {
      console.log('  فشل الاختبار أو جمع التغطية؛ سجلّه: ' + log);
      for (const error of coverage?.errors || []) console.log('  ' + error);
      for (const line of text.split(/\r?\n/).filter(l => /^FAIL|ERRORS|pageerror|Error/.test(l)).slice(0, 3)) console.log('  ' + line);
    }
  }
  const worker = async () => { while (!interrupted && cursor < selected.length) await run(selected[cursor++]); };
  try { await Promise.all(Array.from({ length: Math.min(jobs, selected.length) }, worker)); }
  finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
  if (interrupted || results.length !== selected.length || results.some(r => !r.passed)) throw Error('لم تكتمل جولة ناجحة؛ لم تُستبدل ملفات الناتج. السجلات: ' + directory);
  if (fingerprint(core.catalog(root, true), all) !== stamp) throw Error('تغيّرت المدخلات أثناء الجمع؛ لم تُحفظ خريطة مختلطة.');
  for (const r of results) for (const file of new Set([...r.coverage.nodeFiles, ...r.coverage.browserFiles])) {
    if (!(file in map)) throw Error('ورد مسار مصدر غير معروف في التغطية.');
    map[file].push(r.name);
  }
  for (const file of Object.keys(map)) map[file] = [...new Set(map[file])].sort();
  const meta = { version: 1, date: new Date().toISOString(), fingerprint: stamp, allTests: all.slice().sort(), measuredTests: [...new Set([...measured, ...selected])].sort(), lastRun: { names: selected.slice().sort(), seconds: seconds() - start, jobs: Math.min(jobs, selected.length) } };
  meta.fullRun = names.length ? fullRun : meta.lastRun;
  const outputs = [[mapPath, JSON.stringify(map, null, 2) + '\n'], [metaPath, JSON.stringify(meta, null, 2) + '\n'], [reportPath, report(map, meta)]];
  const staged = [];
  try {
    for (const [file, content] of outputs) { const temp = file + '.tmp-' + process.pid; fs.writeFileSync(temp, content); staged.push([temp, file]); }
    for (const [temp, file] of staged) fs.renameSync(temp, file);
  } finally { for (const [temp] of staged) if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  console.log('اكتمل الجمع: ' + selected.length + ' اختبارًا، ' + meta.lastRun.seconds.toFixed(1) + ' ثانية.');
  console.log('ملفات بلا استدعاءات مقاسة:');
  for (const f of Object.keys(map).filter(f => !map[f].length)) console.log('  ' + f);
  console.log('حُفظت الخريطة الجديدة والتقرير؛ لم تتغير الخريطة المعتمدة.');
}
async function exclusive() {
  const lock = path.join(os.tmpdir(), 'darb-coverage-lock-' + crypto.createHash('sha256').update(root).digest('hex').slice(0, 16));
  let fd;
  try {
    try { fd = fs.openSync(lock, 'wx'); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const pid = Number(fs.readFileSync(lock, 'utf8'));
      if (!Number.isSafeInteger(pid) || pid <= 0) throw Error('يوجد قفل جمع تغطية غير مكتمل: ' + lock);
      try { process.kill(pid, 0); throw Error('توجد جولة تغطية تعمل لهذا المستودع؛ انتظر اكتمالها.'); }
      catch (probe) { if (probe.code !== 'ESRCH') throw probe; }
      fs.unlinkSync(lock); fd = fs.openSync(lock, 'wx');
    }
    fs.writeFileSync(fd, String(process.pid));
    await main();
  } finally { if (fd !== undefined) { fs.closeSync(fd); fs.unlinkSync(lock); } }
}
module.exports = { report, fingerprint };
if (require.main === module) exclusive().catch(error => { console.error('خطأ: ' + error.message); process.exitCode = 1; });
