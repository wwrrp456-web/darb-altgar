// الدفعة 05 المعتمدة (docs/review/APPROVED_BATCH_05.md): ما في اللعبة يطابقها بالحرف: القاموس (G) ودرس الدكان (S) وعبارات عمّ سالم (M): node test/approved-batch05.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ok = m => console.log('OK   ' + m);
const doc = R('docs/review/APPROVED_BATCH_05.md'), paste = R('docs/review/batches/BATCH_05_PASTE.md');
const G = require('../src/glossary.js'), L = require('../src/lessons.js');
const line = k => { const m = new RegExp('^- ' + k + ': (.+)$', 'm').exec(doc); assert.ok(m, 'غاب في الملف المعتمد: ' + k); return m[1].trim(); };
// ---- G: القاموس ----
const GIDS = ['zakat', 'urud', 'nisab', 'hawl', 'vault', 'qard', 'mudaraba', 'suftaja', 'aib', 'murabaha', 'urbun', 'iqala', 'gharar', 'rahn', 'hawala', 'tadlis', 'sarf', 'taqsit', 'inzar', 'sukuk', 'riba'];
GIDS.forEach((id, i) => {
  const k = 'G-' + String(i + 1).padStart(2, '0'), t = G.TERMS.find(x => x.id === id); assert.ok(t, id);
  let name, def; const mod = new RegExp('^- (?:' + k + '|G-\\d+ إلى G-\\d+)[^\\n]*?(?:' + k + '[^:\\n]*)?: الاسم المبسّط: (.+?) — الشرح: (.+)$', 'm').exec(doc.split('\n').filter(l => l.startsWith('- ' + k)).join('\n'));
  if (mod) { name = mod[1].trim(); def = mod[2].replace(/\s*\[[^\]]*\]\s*$/, '').trim(); }
  else { const p = new RegExp('^' + k + ' \\|[^\\n]*\\n\\s+الاسم المبسّط: (.+)\\n\\s+الشرح: (.+)$', 'm').exec(paste); assert.ok(p, k); name = p[1].trim(); def = p[2].trim(); }
  assert.equal(t.name, name, k + ': الاسم المبسّط'); assert.equal(t.def, def, k + ': الشرح'); assert.ok(!t.hidden && !t.todo, k + ': يجب أن يظهر'); assert.equal(t.src, 'docs/review/APPROVED_BATCH_05.md', k + ': المصدر');
  assert.ok(!/\[[^\]]*\]/.test(t.def), k + ': إحالة بين قوسين ظاهرة');
});
ok('القاموس: ' + GIDS.length + ' تعريفاً (G-01..G-21) بالاسم والشرح المعتمدين، الصكوك والربا ظاهران بلا إحالات، والمصدر الملف المعتمد');
// ---- S: درس الدكان ----
const lv = L.LEVELS[6], S0 = { player: { props: {}, caravans: [] }, learn: { ev: {} } };
assert.equal(lv.intro, line('S-2')); ok('S-2 المقدمة');
['١', '٢', '٣'].forEach((n, i) => assert.equal(lv.lesson[i], line('S-3 الفقرة ' + n))); ok('S-3 الفقرات الثلاث');
const tm = /^- S-4: المهمة: (.+?) الهدف ١: (.+?) الهدف ٢: (.+?) الهدف ٣: (.+)$/m.exec(doc); assert.equal(lv.task, tm[1].trim()); assert.deepEqual(lv.goals(S0).map(g => g[0]), [tm[2].trim(), tm[3].trim(), tm[4].trim()]); ok('S-4 المهمة والأهداف');
assert.equal(L.REACT.noSeller.t, line('S-6')); ok('S-6 تنبيه «بلا بائع»');
const done5 = /S-5\) عبارة الإنجاز\n(.+?)\n\n/s.exec(paste)[1].trim(); assert.equal(lv.done, done5); const q8 = /S-8\) سؤال تحقق\nالسؤال: (.+?)\nالخيارات: (.+?)\nالجواب الصحيح: (.+?)\nالتعليل: (.+?)\n/s.exec(paste), quiz = lv.quiz[1]; assert.equal(quiz.q, q8[1].trim()); assert.equal(quiz.why, q8[4].trim()); assert.deepEqual(quiz.o, ['ألف ريال.', 'صفر.', 'ثلاثمئة ريال.']); assert.equal(quiz.ok, 1); ok('S-5 وS-8 (نص الدفعة المعتمد «كما هو»)');
const mission = R('src/ui/13-guide-mission.js'), s7 = doc.slice(doc.indexOf('- S-7:'), doc.indexOf('- S-8:')).split('\n').map(l => l.replace(/^\s*- /, '').trim()).filter(Boolean).slice(1);
assert.equal(s7.length, 5);
for (const [i, t] of s7.entries()) { if (i === 1) { const [a, b, c] = t.replace('، وتباع للناس بكذا.', '،|').split(/كذا/).length ? ['هذه سلعة سعر جملتها ', ' ريال، وتباع للناس بـ', ' ريال. اضغط البطاقة لتجهيز دكانك بها.'] : []; assert.ok(mission.includes(a) && mission.includes(b) && mission.includes(c), 'S-7 سطر 2'); assert.equal(t, 'هذه سلعة سعر جملتها كذا، وتباع للناس بكذا. اضغط البطاقة لتجهيز دكانك بها.'); } else assert.ok(mission.includes(t), 'S-7 سطر ' + (i + 1) + ': ' + t); }
ok('S-7 رسائل المهمة الخمس (والسطر 2 بأرقام السلعة الفعلية مكان «كذا»)');
// ---- M: عبارات عمّ سالم ----
const state = R('src/ui/00-state.js'), blk = /const MENTOR_B05 = \{([^}]+)\}/.exec(state)[1], uiAll = fs.readdirSync(path.join(__dirname, '../src/ui')).map(f => R('src/ui/' + f)).join('\n');
for (let n = 1; n <= 10; n++) {
  const k = 'M-' + String(n).padStart(2, '0'), t0 = new RegExp('^- ' + k + ': (.+)$', 'm').exec(doc)[1].trim();
  const src = t0.includes('«') ? t0 : paste.split('\n').find(l => l.startsWith(k + ' |')), want = /«(.+?)»/.exec(src)[1].trim(), key = 'm' + String(n).padStart(2, '0');
  const got = new RegExp(key + ": '([^']+)'").exec(blk); assert.ok(got, key); assert.equal(got[1], want, k + ': النص');
  assert.ok(new RegExp('MENTOR_B05\\.' + key + '\\b').test(uiAll), k + ': غير معروض في أي موضع');
}
ok('M-01..M-10: النصوص بالحرف وكلها معروضة في مواضعها');
assert.ok(/showReceipt\(\{title:'اغتنمتَ الفرصة'[^}]*MENTOR_B05\.m05/.test(R('src/ui/16-events.js')) && /q\.ok&&q\.missing>0/.test(R('src/ui/16-events.js')), 'M-05 غير مشروط بسحب فعلي'); ok('M-05 مشروط بأن يكون السحب من الحصّالة لصفقة فعلاً (q.missing > 0)');
assert.ok(!/TODO-REVIEW/.test(uiAll), 'بقي وسم TODO-REVIEW في الواجهة'); ok('لا TODO-REVIEW في الواجهة');
console.log('OK approved-batch05');
