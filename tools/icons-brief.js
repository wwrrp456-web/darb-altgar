#!/usr/bin/env node
'use strict';
// يولّد docs/CODEX_ICONS_FULL.md من brand/ICON_REGISTRY.md: الأيقونات «جديد» فقط، بالاسم ومكان الاستعمال والمقاس (دفعتان P وF).
const fs = require('node:fs'), path = require('node:path'), root = path.join(__dirname, '..');
const reg = fs.readFileSync(path.join(root, 'brand/ICON_REGISTRY.md'), 'utf8'), rows = [];
for (const l of reg.split('\n')) { const c = l.split('|').map(s => s.trim()); if (c.length < 6 || c[1] === 'الملف/الأصل' || /^-+$/.test(c[1])) continue; if (c[4] === 'جديد') rows.push({ file: c[1].replace(/`/g, ''), name: c[2], use: c[3], batch: c[5] }); }
const by = b => rows.filter(r => r.batch === b), tbl = a => '| # | الملف | الاسم الظاهر | يُستعمل في |\n|---|---|---|---|\n' + a.map((r, i) => `| ${i + 1} | \`brand/img/icons/${r.file}.webp\` | ${r.name} | ${r.use} |`).join('\n');
const out = `# مهمة كودكس: باكج أيقونات نظام التفاصيل (037) — مولَّد من \`brand/ICON_REGISTRY.md\` (لا تعدّله يدوياً)

**الحجم:** ${rows.length} أيقونة جديدة فقط (الباقي مرسوم أصلاً). **الاسم ظاهر دائماً بجانب الأيقونة** في اللعبة، فلا تكتب نصاً داخل الأيقونة. اقرأ \`brand/ICONS.md\` و\`brand/ICON_TRANSPARENCY.md\` و\`brand/IDENTITY.md\`، وانظر أيقونات اللعبة الموجودة (\`brand/img/icons/\` و\`brand/img/ui/\`) لتنسجم معها.

## المواصفات المشتركة
WebP **شفاف فعلي (alpha)** 128×128، شبه واقعي مرسوم بألوان الذهبي والفيروزي والرمل والعاج، بلا ظل مستطيل ولا خلفية، تُقرأ واضحة عند 28 و44 و68 بكسل. لا تستعمل مسار تصدير JPG في \`crop_sheets.py\`. لا تربطها بـ\`src/icons.js\` (الربط من Sonnet بعد المراجعة).

## الدفعة P (${by('P').length}، تجريبية؛ تفاصيل رسمها في \`docs/CODEX_ICONS_PILOT.md\`)
${tbl(by('P'))}

## الدفعة F (${by('F').length}، بعد اعتماد أسلوب P)
${tbl(by('F'))}

## التسليم
\`node build.js\` وأضف الصور والملفات المولَّدة للالتزام، واختبار \`icons\` فقط، وتقرير \`docs/CODEX_ICONS_REPORT.md\` (ما رُسم وما تُرك وكم استهلكت من حدّك)، وادفع إلى main وتحقق بـ\`git ls-tree origin/main\`. ثم توقف قبل الخريطة.
`;
fs.writeFileSync(path.join(root, 'docs/CODEX_ICONS_FULL.md'), out); console.log('ولّدتُ docs/CODEX_ICONS_FULL.md: ' + rows.length + ' أيقونة (P=' + by('P').length + '، F=' + by('F').length + ')');
