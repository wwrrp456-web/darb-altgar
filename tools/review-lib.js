'use strict';
// WP-20: أدوات مشتركة لتصدير الدفعات واستيرادها بالأرقام (السجل docs/review/registry.json)
const fs = require('node:fs'), path = require('node:path');
const REPO = path.join(__dirname, '..');
const argv = a => { const o = { _: [] }; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); if (['dry', 'no-verify'].includes(k)) o[k] = true; else o[k] = a[++i]; } else o._.push(a[i]); } return o; };
const paths = root => ({ root, registry: path.join(root, 'docs/review/registry.json'), batches: path.join(root, 'docs/review/batches'), flags: path.join(root, 'src/review-flags.js') });
const loadRegistry = root => JSON.parse(fs.readFileSync(paths(root).registry, 'utf8'));
const saveRegistry = (root, reg) => fs.writeFileSync(paths(root).registry, JSON.stringify(reg, null, 1) + '\n');
const ID = /^\[([A-Z]-\d+)\][ \t]*/;
const ST = { approved: 'معتمد', pending: 'ظاهر بلا اعتماد موثّق', hidden: 'مخفي بقرار BM' };
// تقطيع رد المختص: كل [رقم] يبدأ بنداً ونصه حتى الرقم التالي؛ قسم «Sources:» أو «المصادر:» في آخر الرد يُتجاهل (يبقى في ملف الرد)
const SOURCES_HEAD = /^\s*(Sources|المصادر)\s*[:：]?\s*$/i;
function parseReply(text) {
  const entries = []; let cur = null;
  for (const line of text.split('\n')) { const t = line.trim(); if (SOURCES_HEAD.test(t)) break; const m = ID.exec(t); if (m) { cur = { id: m[1], lines: [t.slice(m[0].length)] }; entries.push(cur); } else if (cur && t !== '---') cur.lines.push(line); }
  for (const e of entries) e.text = e.lines.join('\n').trim();
  return entries;
}
// «معتمد» تليها إشارات مصادر مثل [1][2] تُعدّ معتمداً لا نصاً بديلاً
const APPROVE = /^(معتمد|اعتماد|موافق)(\s*\[\d+\])*[.\s]*$/, DELETE = /^(يُحذف|يحذف|احذف)[.\s]*$/;
const D1 = 'docs/SHARIA_REVIEW.docx: أكّد بن محمود (2026-10-29) أنه أُرسل للمراجع واعتمده، وقراراته في docs/review/APPROVED_REVIEW_2026-10-24.md';
const FEAT = { F: 'بطاقات فقه التجارة', C: 'مسائل مجلس السوق', G: 'قاموس التاجر (مصطلح شرعي)', H: 'حِكم الطريق (حديث أو أثر)', A: 'نصوص معتمدة منقولة', M: 'نموذج التمويل', T: 'نموذج التكافل', Z: 'حساب الزكاة' };
// docs/review/STATUS.md يُولَّد من السجل وحده (الجرد والاستيراد يستعملانه معاً)
function writeStatus(root, out) {
  const cnt = s => out.filter(r => r.status === s && !r.gone).length, esc = s => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
  const Lg = ['# جدول الاعتماد الشرعي (WP-20)', '', '> مولَّد من `docs/review/registry.json` بـ `node tools/review-inventory.js` وبعد كل `node tools/review-import.js`؛ لا يُحرَّر يدوياً. الإخفاء لا يكون إلا بقرار بن محمود في `src/review-flags.js` (الافتراضي فارغ).', '',
    '**اعتماد الملف الشامل:** ' + D1 + '.', '', '## الملخص', '', '| الحالة | العدد |', '|---|---|', ...Object.keys(ST).map(s => '| ' + ST[s] + ' | ' + cnt(s) + ' |'), '| **المجموع** | **' + out.filter(r => !r.gone).length + '** |', ''];
  const pend = out.filter(r => r.status === 'pending' && !r.gone);
  Lg.push('## بنود ظاهرة بلا اعتماد موثّق', ''); if (pend.length) Lg.push(...pend.map(r => '- **' + r.id + '** (' + FEAT[r.feature] + '): ' + esc(r.show).slice(0, 110) + ' — ' + r.where)); else Lg.push('لا شيء.'); Lg.push('');
  const byF = {}; for (const r of out) if (!r.gone) (byF[r.feature] = byF[r.feature] || []).push(r);
  Lg.push('## الجدول', '', '| المعرّف | الميزة | أين يظهر | الحالة | المصدر |', '|---|---|---|---|---|');
  for (const f of Object.keys(FEAT)) for (const r of byF[f] || []) Lg.push('| ' + r.id + ' | ' + FEAT[f] + ' | ' + esc(r.where) + ' | ' + ST[r.status] + ' | ' + esc(r.source) + ' |');
  fs.writeFileSync(path.join(root, 'docs/review/STATUS.md'), Lg.join('\n') + '\n'); return { approved: cnt('approved'), pending: cnt('pending'), hidden: cnt('hidden') };
}
module.exports = { REPO, argv, paths, loadRegistry, saveRegistry, ID, ST, parseReply, APPROVE, DELETE, D1, FEAT, writeStatus };
