// WP-20: تصدير الدفعات واستيرادها بالأرقام (على نسخة مؤقتة من الملفات؛ لا يُكتب شيء في المستودع)
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), cp = require('node:child_process');
const repo = path.join(__dirname, '..'), ok = m => console.log('OK   ' + m);
const mkRoot = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rv-')); for (const f of ['src/tips.js', 'src/cards.js', 'src/review-flags.js', 'docs/review/registry.json']) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.copyFileSync(path.join(repo, f), path.join(d, f)); } fs.mkdirSync(path.join(d, 'docs/review'), { recursive: true }); fs.writeFileSync(path.join(d, 'docs/review/APPROVED_X.md'), 'x'); return d; };
const run = (tool, args, root) => cp.spawnSync('node', [path.join(repo, 'tools', tool), ...args, '--root', root, '--no-verify'], { encoding: 'utf8' });
const snap = d => Object.fromEntries(['src/tips.js', 'src/cards.js', 'src/review-flags.js', 'docs/review/registry.json'].map(f => [f, fs.readFileSync(path.join(d, f), 'utf8')]));
const exportIds = (d, name, ids) => { const r = run('review-export.js', [name, '--ids', ids], d); assert.equal(r.status, 0, r.stderr); return fs.readFileSync(path.join(d, 'docs/review/batches', name + '.md'), 'utf8'); };
const reply = (d, name, text) => { const p = path.join(d, name + '-reply.md'); fs.writeFileSync(p, text); return p; };
// T008: دفعة تجريبية من بندين معتمدين
{ const d = mkRoot(), t = exportIds(d, '99-test', 'H-01,H-02'); const ids = [...t.matchAll(/^\[([A-Z]-\d+)\]$/gm)].map(m => m[1]);
  assert.deepEqual(ids, ['H-01', 'H-02']); assert.ok(ids.length <= 30 && new Set(ids).size === ids.length); assert.equal((t.match(/^أين يظهر: /gm) || []).length, ids.length, 'لكل بند أين يظهر');
  assert.ok(!/[{}]|=>|src\/|\.js/.test(t), 'بلا شيفرة ولا مسارات'); assert.ok(t.includes('معتمد') && t.includes('يُحذف'), 'مقدمة الرد'); ok('التصدير: بندان، أرقام فريدة، أين يظهر، بلا شيفرة'); }
// SC-001: ذهاب وإياب بـ«معتمد» = صفر فروق
{ const d = mkRoot(), before = snap(d); exportIds(d, '99-test', 'H-01,H-02'); const r = run('review-import.js', [reply(d, '99-test', '[H-01] معتمد\n[H-02] معتمد\n'), '--batch', '99-test'], d); assert.equal(r.status, 0, r.stderr + r.stdout); assert.deepEqual(snap(d), before); ok('ذهاب وإياب بلا تعديل: صفر فروق'); }
// نص بديل يظهر بحرفه، ويبقى الملف صالحاً مع علامة تنصيص ورقم
{ const d = mkRoot(); exportIds(d, '99-test', 'H-01,H-02'); const rep = 'التاجر "الصدوق" الأمين \\ مع النبيين والصديقين';
  const r = run('review-import.js', [reply(d, '99-test', '[H-01]\n' + rep + '\n[H-02] معتمد\n'), '--batch', '99-test'], d); assert.equal(r.status, 0, r.stderr + r.stdout);
  const tipsFile = path.join(d, 'src/tips.js'), T = require(tipsFile).TIPS; assert.equal(T.find(x => x.id === 'sidq').text, rep, 'النص بحرفه بعد التحميل'); assert.equal(fs.readFileSync(tipsFile, 'utf8').split('رواه الترمذي').length > 1, true);
  const row = JSON.parse(fs.readFileSync(path.join(d, 'docs/review/registry.json'), 'utf8')).find(x => x.id === 'H-01'); assert.equal(row.status, 'approved'); assert.ok(row.find.includes('\\"الصدوق\\"'), 'find يحدَّث بالنص المهرَّب'); assert.ok(/نص بديل/.test(row.source));
  assert.equal(run('review-import.js', [reply(d, '99-test', '[H-01]\n' + rep + '\n[H-02] معتمد\n'), '--batch', '99-test'], d).status, 0, 'إعادة التطبيق على النص الجديد ممكنة'); ok('نص بديل يُستبدل بحرفه (مع تهريب التنصيص) ويحدَّث السجل'); }
// رفض: مكرر، مفقود، غريب، بند بلا رد: بلا كتابة
for (const [name, text, re] of [['dup', '[H-01] معتمد\n[H-01] معتمد\n[H-02] معتمد\n', /مكرر/], ['miss', '[H-01] معتمد\n', /مفقود/], ['alien', '[H-01] معتمد\n[H-02] معتمد\n[H-77] معتمد\n', /غير موجود/], ['empty', '[H-01]\n[H-02] معتمد\n', /بلا رد/]]) {
  const d = mkRoot(), before = snap(d); exportIds(d, '99-test', 'H-01,H-02'); const r = run('review-import.js', [reply(d, '99-test', text), '--batch', '99-test'], d); assert.notEqual(r.status, 0, name); assert.ok(re.test(r.stderr), name + ': ' + r.stderr); assert.deepEqual(snap(d), before, name + ': بلا كتابة'); }
ok('رفض الرقم المكرر والمفقود والغريب وبلا رد، بلا كتابة');
// رفض APPROVED_: صف ملفه APPROVED_ ومسار الرد
{ const d = mkRoot(), before = snap(d), a1 = JSON.parse(before['docs/review/registry.json']).find(x => /^A-/.test(x.id)).id; exportIds(d, '99-test', a1); const r = run('review-import.js', [reply(d, '99-test', '[' + a1 + ']\nنص مختلف\n'), '--batch', '99-test'], d);
  assert.notEqual(r.status, 0); assert.ok(/APPROVED_/.test(r.stderr)); assert.deepEqual(snap(d), before); fs.writeFileSync(path.join(d, 'APPROVED_BATCH_99.md'), '[' + a1 + '] معتمد\n'); const r2 = run('review-import.js', [path.join(d, 'APPROVED_BATCH_99.md'), '--batch', '99-test'], d); assert.notEqual(r2.status, 0); assert.ok(/APPROVED_/.test(r2.stderr)); ok('رفض الكتابة إلى APPROVED_* والاستيراد منها'); }
// صف متعدد الحقول: تطبيق يدوي بلا كتابة
{ const d = mkRoot(), before = snap(d); exportIds(d, '99-test', 'F-01'); const r = run('review-import.js', [reply(d, '99-test', '[F-01]\nنص بديل للبطاقة\n'), '--batch', '99-test'], d); assert.equal(r.status, 0, r.stderr); assert.ok(/تطبيق يدوي/.test(r.stdout)); assert.deepEqual(snap(d), before); ok('الصف متعدد الحقول: «تطبيق يدوي» بلا كتابة'); }
// يُحذف: يوضع في review-flags ولا يمس الشيفرة
{ const d = mkRoot(), before = snap(d); exportIds(d, '99-test', 'H-01,H-02'); const r = run('review-import.js', [reply(d, '99-test', '[H-01] يُحذف\n[H-02] معتمد\n'), '--batch', '99-test'], d); assert.equal(r.status, 0, r.stderr); const after = snap(d);
  assert.equal(after['src/tips.js'], before['src/tips.js'], 'لا حذف من الشيفرة'); assert.ok(/hidden: \['H-01'\]/.test(after['src/review-flags.js'])); assert.ok(/بن محمود/.test(r.stdout)); assert.equal(JSON.parse(after['docs/review/registry.json']).find(x => x.id === 'H-01').status, 'hidden'); ok('«يُحذف» يضع المعرّف في review-flags ويبلّغ ولا يحذف'); }
// --dry لا يكتب؛ و«معتمد» لبند معلّق يغيّر حالته فقط
{ const d = mkRoot(), before = snap(d); exportIds(d, '99-test', 'H-05'); const rp = reply(d, '99-test', '[H-05] معتمد\n'); const r = run('review-import.js', [rp, '--batch', '99-test', '--dry'], d); assert.equal(r.status, 0); assert.deepEqual(snap(d), before, '--dry بلا كتابة'); assert.ok(/ظاهر بلا اعتماد موثّق ← معتمد/.test(r.stdout));
  assert.equal(run('review-import.js', [rp, '--batch', '99-test'], d).status, 0); const after = snap(d); assert.equal(after['src/tips.js'], before['src/tips.js']); assert.equal(JSON.parse(after['docs/review/registry.json']).find(x => x.id === 'H-05').status, 'approved'); ok('--dry بلا كتابة، و«معتمد» لمعلّق يغيّر الحالة فقط'); }
// التصدير الافتراضي: ما ينتظر المراجعة، وإلا لا ملف
{ const d = mkRoot(); const r = run('review-export.js', ['98-pending'], d); assert.equal(r.status, 0); assert.ok(fs.readFileSync(path.join(d, 'docs/review/batches/98-pending.md'), 'utf8').includes('[H-05]'));
  const reg = JSON.parse(fs.readFileSync(path.join(d, 'docs/review/registry.json'), 'utf8')).map(x => Object.assign(x, { status: 'approved' })); fs.writeFileSync(path.join(d, 'docs/review/registry.json'), JSON.stringify(reg)); const r2 = run('review-export.js', ['97-none'], d); assert.ok(/لا شيء ينتظر المراجعة/.test(r2.stdout)); assert.ok(!fs.existsSync(path.join(d, 'docs/review/batches/97-none.md')), 'لا ملف'); ok('التصدير الافتراضي للمعلّق، و«لا شيء ينتظر المراجعة» بلا ملف'); }
console.log('\nreview-roundtrip: كلها ناجحة');
