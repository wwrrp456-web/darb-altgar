#!/usr/bin/env node
'use strict';
// WP-20: جرد النصوص الدينية والمالية في اللعبة بحالة اعتمادها ومصدره. الاستعمال: node tools/review-inventory.js
// يكتب docs/review/registry.json (لا يعيد ترقيم صف موجود: المفتاح key ثابت) وdocs/review/STATUS.md. لا يلمس أي APPROVED_* ولا نصاً في اللعبة.
const fs = require('node:fs'), path = require('node:path'), root = path.join(__dirname, '..'), R = f => path.join(root, f);
const REG = R('docs/review/registry.json'), OUT = R('docs/review/STATUS.md');
const CARDS = require('../src/cards.js').CARDS, FIQH = require('../src/fiqh.js'), GL = require('../src/glossary.js'), TIPS = require('../src/tips.js').TIPS, FLAGS = require('../src/review-flags.js').FLAGS;
const E = require('../src/engine.js');
const D1 = 'docs/SHARIA_REVIEW.docx: أكّد بن محمود (2026-10-29) أنه أُرسل للمراجع واعتمده، وقراراته في docs/review/APPROVED_REVIEW_2026-10-24.md';
const norm = s => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-ي0-9a-zA-Z]+/g, '');
const approvedFiles = fs.readdirSync(R('docs/review')).filter(f => /^APPROVED_.*\.md$/.test(f)).sort();
const approvedCorpus = norm(approvedFiles.map(f => fs.readFileSync(R('docs/review/' + f), 'utf8')).join('\n'));
const flat = o => JSON.stringify(o).replace(/[{}"]/g, '').replace(/:/g, '=').replace(/,/g, '، ');
const rows = [];
const add = (key, feature, file, find, show, where, status, source) => rows.push({ key, feature, file, find, show, where, status, source });
// 1) بطاقات فقه التجارة (track f): متعددة الحقول فتُطبَّق يدوياً
for (const id of Object.keys(CARDS).filter(i => CARDS[i].track === 'f')) { const c = CARDS[id];
  add('card:' + id, 'F', 'src/cards.js', null, [c.title, c.say, ...(c.text || []), ...(c.dalil || []).map(d => d.q + ' — ' + d.s), c.tip].filter(Boolean).join('\n'), 'بطاقة «' + c.title + '» في دفتر الدروس (تُفتح أثناء اللعب)', 'approved', D1); }
// 2) مسائل مجلس السوق
for (const c of FIQH.CASES) add('case:' + c.id, 'C', 'src/fiqh.js', null, [c.title, c.scene, ...c.opts, c.ruling, c.why, c.full && c.full.evidence].filter(Boolean).join('\n'), 'مسألة «' + c.title + '» في مجلس السوق (من المستوى 4)', 'approved', 'src/fiqh.js (رأسه: الأحكام والأدلة وصياغة الخلاف من المختص الشرعي)؛ ' + D1);
// 3) مصطلحات القاموس الشرعية (الظاهرة؛ ما فيه todo مخفي في المصدر فلا يُجرد ظاهراً)
for (const t of GL.TERMS.filter(t => t.k === 'shar')) add('term:' + t.id, 'G', 'src/glossary.js', null, t.name + ' — ' + t.term + ': ' + t.def, 'تلميح المصطلح «' + t.term + '» عند قراءة الدروس (قاموس التاجر)', t.todo ? 'pending' : 'approved', t.todo ? 'مخفي في المصدر (TODO-REVIEW)' : (t.src || 'docs/review/APPROVED_BATCH_05.md'));
// 4) الأحاديث والآثار في حِكم الطريق: تُطابَق بنصها على المعتمد (APPROVED_* أو بطاقات D1)
const sourcesDoc = fs.existsSync(R('docs/review/SOURCES.md')) ? fs.readFileSync(R('docs/review/SOURCES.md'), 'utf8') : '', srcLine = t => sourcesDoc.split('\n').find(l => norm(l).includes(norm(t.text.slice(0, 22))));
const srcNote = t => { const l = srcLine(t); return l ? 'توثيق مصدره في docs/review/SOURCES.md (رد المراجع 2026-10-22)' + (/المعتمد حرفياً/.test(l) ? ' ويصف مقتطفه «المعتمد حرفياً»' : '') + '، وليس ملف اعتماد' : ''; };
const d1corpus = norm(rows.map(r => r.show).join('\n')), tipsSrc = fs.readFileSync(R('src/tips.js'), 'utf8');
for (const t of TIPS.filter(t => t.kind === 'hadith' || t.kind === 'athar')) {
  const n = norm(t.text), inApproved = approvedCorpus.includes(n), inCards = d1corpus.includes(n), once = tipsSrc.split(t.text).length === 2;
  add('tip:' + t.id, 'H', 'src/tips.js', once ? t.text : null, t.text + ' — ' + t.s, 'سطر حكمة أسفل بطاقة رحلة القافلة (' + (t.kind === 'hadith' ? 'حديث' : 'أثر') + '، يُنسب في اللعبة: ' + t.s + ')', inApproved || inCards ? 'approved' : 'pending', inApproved ? 'نصه في APPROVED_*' : inCards ? 'نصه في بطاقة فقه معتمدة (' + 'docs/SHARIA_REVIEW.docx' + ')' : 'لا اعتماد مكتوب لهذا النص في APPROVED_* ولا في الملف الشامل' + (srcNote(t) ? '؛ ' + srcNote(t) : ''));
}
// 5) النصوص المنقولة من APPROVED_*: صف لكل ملف
for (const f of approvedFiles) add('approved:' + f, 'A', 'docs/review/' + f, null, 'نصوص الملف ' + f + ' كما اعتُمدت', 'النصوص المطبّقة من ' + f + ' في اللعبة', 'approved', 'docs/review/' + f);
// 6) معاملات النماذج: أرقام لا نصوص
add('model:TK', 'T', 'src/engine/', null, 'معاملات التكافل TK: ' + flat(E.TK), 'شروط التكافل (التأمين) في شاشة القافلة', 'approved', D1);
add('model:FIN', 'M', 'src/engine/', null, 'معاملات المضاربة والمرابحة والقرض والصكوك FIN: ' + flat(E.FIN), 'شروط التمويل (مضاربة ومرابحة وقرض وصكوك)', 'approved', D1);
add('model:ZAKAT', 'Z', 'src/engine/', null, 'معاملات الزكاة ZAKAT: ' + flat(E.ZAKAT), 'حساب الزكاة ونصابها في درس الزكاة', 'approved', D1);
// ترقيم ثابت: المفتاح الموجود يحتفظ بمعرّفه، والجديد يأخذ التالي في حرف ميزته
const old = fs.existsSync(REG) ? JSON.parse(fs.readFileSync(REG, 'utf8')) : [], byKey = new Map(old.map(r => [r.key, r])), maxN = {};
for (const r of old) { const m = /^([A-Z])-(\d+)$/.exec(r.id); if (m) maxN[m[1]] = Math.max(maxN[m[1]] || 0, +m[2]); }
const out = rows.map(r => { const prev = byKey.get(r.key); let id = prev && prev.id; if (!id) { maxN[r.feature] = (maxN[r.feature] || 0) + 1; id = r.feature + '-' + String(maxN[r.feature]).padStart(2, '0'); }
  const status = FLAGS.hidden.includes(id) ? 'hidden' : r.status; return { id, key: r.key, feature: r.feature, file: r.file, find: r.find, show: r.show, where: r.where, status, source: r.source }; });
// بنود سجلّت سابقاً ولم تعد في المصدر تبقى بمعرّفها (لا يُعاد ترقيم ولا يُحذف صف)
for (const r of old) if (!out.some(o => o.id === r.id)) out.push(Object.assign({}, r, { status: r.status === 'hidden' ? 'hidden' : r.status, gone: true }));
out.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(REG, JSON.stringify(out, null, 1) + '\n');
// STATUS.md
const FEAT = { F: 'بطاقات فقه التجارة', C: 'مسائل مجلس السوق', G: 'قاموس التاجر (مصطلح شرعي)', H: 'حِكم الطريق (حديث أو أثر)', A: 'نصوص معتمدة منقولة', M: 'نموذج التمويل', T: 'نموذج التكافل', Z: 'حساب الزكاة' };
const ST = { approved: 'معتمد', pending: 'ظاهر بلا اعتماد موثّق', hidden: 'مخفي بقرار BM' }, cnt = s => out.filter(r => r.status === s && !r.gone).length, esc = s => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
const L = ['# جدول الاعتماد الشرعي (WP-20)', '', '> مولَّد بـ `node tools/review-inventory.js` من مصادر اللعبة الحية؛ لا يُحرَّر يدوياً. السجل: `docs/review/registry.json`. الإخفاء لا يكون إلا بقرار بن محمود في `src/review-flags.js` (الافتراضي فارغ).', '',
  '**اعتماد الملف الشامل:** ' + D1 + '.', '', '## الملخص', '', '| الحالة | العدد |', '|---|---|', ...Object.keys(ST).map(s => '| ' + ST[s] + ' | ' + cnt(s) + ' |'), '| **المجموع** | **' + out.filter(r => !r.gone).length + '** |', ''];
const pend = out.filter(r => r.status === 'pending' && !r.gone);
L.push('## بنود ظاهرة بلا اعتماد موثّق', ''); if (pend.length) L.push(...pend.map(r => '- **' + r.id + '** (' + FEAT[r.feature] + '): ' + esc(r.show).slice(0, 110) + ' — ' + r.where)); else L.push('لا شيء.'); L.push('');
const byF = {}; for (const r of out) if (!r.gone) (byF[r.feature] = byF[r.feature] || []).push(r);
L.push('## الجدول', '', '| المعرّف | الميزة | أين يظهر | الحالة | المصدر |', '|---|---|---|---|---|');
for (const f of Object.keys(FEAT)) for (const r of byF[f] || []) L.push('| ' + r.id + ' | ' + FEAT[f] + ' | ' + esc(r.where) + ' | ' + ST[r.status] + ' | ' + esc(r.source) + ' |');
fs.writeFileSync(OUT, L.join('\n') + '\n');
console.log('registry: ' + out.length + ' بنداً (معتمد ' + cnt('approved') + '، بلا اعتماد موثّق ' + cnt('pending') + '، مخفي ' + cnt('hidden') + ')');
