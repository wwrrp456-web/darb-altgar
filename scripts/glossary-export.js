// يصدّر قاموس التاجر إلى docs/GLOSSARY.md للمراجعة (نص سهل النسخ): node scripts/glossary-export.js
const fs = require('fs'), path = require('path'), G = require('../src/glossary.js');
const row = t => `### ${t.term}\n- **الاسم البسيط:** ${t.name}\n- **الشرح:** ${t.def}\n` + (t.ex ? `- **مثال:** ${t.ex}\n` : t.k === 'shar' ? '- **مثال:** (بعد المراجعة الشرعية)\n' : '') + (t.src ? `- **المصدر:** ${t.src}\n` : '') + `- **صيغ المطابقة:** ${t.m.join('، ')}\n`;
const fin = G.visible().filter(t => t.k === 'fin'), shar = G.visible().filter(t => t.k === 'shar'), hid = G.TERMS.filter(t => t.hidden);
const out = `# قاموس التاجر (للمراجعة)\n\nمولَّد من \`src/glossary.js\` بـ\`node scripts/glossary-export.js\`؛ لا يُعدَّل يدوياً.\n\n## مصطلحات مالية عامة (${fin.length})\n\n${fin.map(row).join('\n')}\n## مصطلحات شرعية، تعريفها حرفي من نص معتمد (${shar.length})\n\n${shar.map(row).join('\n')}\n## مخفية بانتظار المراجعة الشرعية \`TODO-REVIEW\` (${hid.length})\n\n${hid.map(t => `- ${t.term} (${t.id}): لا نص معتمد بعد`).join('\n')}\n`;
fs.writeFileSync(path.join(__dirname, '../docs/GLOSSARY.md'), out); console.log('docs/GLOSSARY.md', fin.length + shar.length, 'مصطلحاً ظاهراً،', hid.length, 'مخفي');
