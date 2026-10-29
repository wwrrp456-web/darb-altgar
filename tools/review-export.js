#!/usr/bin/env node
'use strict';
// WP-20: يُخرج دفعة مراجعة شرعية جاهزة للنسخ: node tools/review-export.js NN-اسم [--ids Z-01,Z-02 | --status pending] [--root مجلد]
// الافتراضي --status pending (ما هو «ظاهر بلا اعتماد موثّق»)؛ وإن لم يوجد شيء يطبع «لا شيء ينتظر المراجعة» ولا يُنشئ ملفاً. الحد الأقصى 30 بنداً.
const fs = require('node:fs'), path = require('node:path'), L = require('./review-lib.js');
const a = L.argv(process.argv.slice(2)), name = a._[0], root = a.root || L.REPO, P = L.paths(root), MAX = 30;
if (!name) { console.error('الاستعمال: node tools/review-export.js NN-اسم [--ids ...|--status pending]'); process.exit(2); }
const reg = L.loadRegistry(root).filter(r => !r.gone);
const sel = a.ids ? a.ids.split(',').map(x => x.trim()).filter(Boolean).map(id => { const r = reg.find(x => x.id === id); if (!r) { console.error('معرّف غير موجود في السجل: ' + id); process.exit(1); } return r; }) : reg.filter(r => r.status === (a.status || 'pending'));
if (!sel.length) { console.log('لا شيء ينتظر المراجعة'); process.exit(0); }
if (sel.length > MAX) { console.error('أكثر من ' + MAX + ' بنداً (' + sel.length + '): قسّمها بـ --ids'); process.exit(1); }
const intro = ['# دفعة مراجعة شرعية: ' + name, '', 'السلام عليكم ورحمة الله. هذه نصوص من اللعبة تُعرض على اللاعب كما هي. لكل نص رقم بين قوسين مربعين وسطر «أين يظهر».', '',
  'الرجاء الرد بسطر لكل رقم، بالصيغة نفسها دون تغيير الأرقام:', '- `[الرقم] معتمد` إن كان النص صحيحاً كما هو.', '- `[الرقم]` ثم النص البديل كاملاً إن لزم تعديله.', '- `[الرقم] يُحذف` إن لا يصلح عرضه.', '', '---', ''];
const body = sel.map(r => '[' + r.id + ']\nأين يظهر: ' + r.where + '\n' + (r.find != null ? r.find : r.show) + '\n').join('\n');
fs.mkdirSync(P.batches, { recursive: true }); const out = path.join(P.batches, name + '.md');
if (/APPROVED_/i.test(out)) { console.error('مسار الإخراج لا يكون APPROVED_*'); process.exit(1); }
fs.writeFileSync(out, intro.join('\n') + body); console.log('كُتب ' + path.relative(root, out) + ' (' + sel.length + ' بنداً)');
