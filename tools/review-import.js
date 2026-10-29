#!/usr/bin/env node
'use strict';
// WP-20: يطبّق رد المختص بالأرقام فقط: node tools/review-import.js الرد.md [--batch NN-اسم|مسار] [--dry] [--root مجلد] [--no-verify]
// (أ) يرفض رقماً غير موجود في الدفعة أو مكرراً أو مفقوداً بتقرير ولا يكتب شيئاً. (ب) «معتمد» = الحالة فقط. (ج) نص بديل = يستبدل find في file مرة واحدة بالضبط (مع تهريب علامة التنصيص).
// (د) «يُحذف» = لا حذف من الشيفرة، يوضع المعرّف في src/review-flags.js (hidden) ويُبلَّغ بن محمود. لا كتابة إلى أي APPROVED_*. الصفوف متعددة الحقول (find=null) «تطبيق يدوي».
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), L = require('./review-lib.js');
const a = L.argv(process.argv.slice(2)), replyPath = a._[0], root = a.root || L.REPO, P = L.paths(root);
if (!replyPath) { console.error('الاستعمال: node tools/review-import.js الرد.md --batch NN-اسم [--dry]'); process.exit(2); }
const fail = msgs => { console.error('رُفض الاستيراد (لم يُكتب شيء):\n- ' + [].concat(msgs).join('\n- ')); process.exit(1); };
if (/APPROVED_/i.test(replyPath)) fail('لا يُستورد من ملف APPROVED_* ولا إليه');
const batchArg = a.batch || path.basename(replyPath, path.extname(replyPath)), batchFile = fs.existsSync(batchArg) ? batchArg : path.join(P.batches, batchArg.replace(/\.md$/, '') + '.md');
if (!fs.existsSync(batchFile)) fail('ملف الدفعة غير موجود: ' + batchArg + ' (استعمل --batch)');
const idsIn = (text, strict) => { const out = []; for (const line of text.split('\n')) { const m = L.ID.exec(line.trim()); if (m) out.push(m[1]); } return out; };
const batchIds = idsIn(fs.readFileSync(batchFile, 'utf8')), reply = fs.readFileSync(replyPath, 'utf8');
// تقطيع الرد: كل [رقم] يبدأ بند، ونصه حتى الرقم التالي
const entries = [], seen = new Set(), errs = []; let cur = null;
for (const line of reply.split('\n')) { const t = line.trim(), m = L.ID.exec(t); if (m) { cur = { id: m[1], lines: [t.slice(m[0].length)] }; entries.push(cur); } else if (cur && t !== '---') cur.lines.push(line); }
for (const e of entries) { e.text = e.lines.join('\n').trim(); if (seen.has(e.id)) errs.push('رقم مكرر في الرد: ' + e.id); seen.add(e.id); if (!batchIds.includes(e.id)) errs.push('رقم غير موجود في الدفعة: ' + e.id); if (!e.text) errs.push('بند بلا رد: ' + e.id); }
for (const id of batchIds) if (!seen.has(id)) errs.push('رقم مفقود من الرد: ' + id);
if (errs.length) fail(errs);
const reg = L.loadRegistry(root), touched = new Map(), report = [], flagAdds = [];
const read = f => { const p = path.join(root, f); if (!touched.has(p)) touched.set(p, { before: fs.readFileSync(p, 'utf8'), text: null }); const t = touched.get(p); return t.text == null ? t.before : t.text; };
const write = (f, s) => { read(f); touched.get(path.join(root, f)).text = s; };
const esc = (s, q) => q === "'" ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') : q === '"' ? s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') : s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const APPROVE = /^(معتمد|اعتماد|موافق)[.\s]*$/, DELETE = /^(يُحذف|يحذف|احذف)[.\s]*$/;
for (const e of entries) {
  const r = reg.find(x => x.id === e.id); if (!r) { errs.push('رقم غير موجود في السجل: ' + e.id); continue; }
  if (APPROVE.test(e.text)) { if (r.status !== 'approved') { report.push(e.id + ': ' + L.ST[r.status] + ' ← معتمد'); r.status = 'approved'; r.source = 'دفعة المراجعة ' + path.basename(batchFile) + ' (رد المختص عبر بن محمود)'; } else report.push(e.id + ': معتمد (لا تغيير)'); continue; }
  if (DELETE.test(e.text)) { report.push(e.id + ': يُحذف ← يوضع في review-flags.js (hidden) ويُبلَّغ بن محمود؛ لا حذف من الشيفرة'); flagAdds.push(e.id); r.status = 'hidden'; continue; }
  if (/APPROVED_/i.test(r.file)) { errs.push(e.id + ': الملف ' + r.file + ' من APPROVED_* فلا يُكتب إليه'); continue; }
  if (r.find == null) { report.push(e.id + ': تطبيق يدوي (صف متعدد الحقول)؛ النص البديل لم يُكتب. ضعه بيدك في ' + r.file); continue; }
  const src = read(r.file), at = src.indexOf(r.find);
  if (at < 0 || src.indexOf(r.find, at + 1) >= 0) { errs.push(e.id + ': النص الأصلي لا يقع في ' + r.file + ' مرة واحدة بالضبط'); continue; }
  const q = src[at - 1], q2 = src[at + r.find.length];
  if (!["'", '"', '`'].includes(q) || q !== q2) { report.push(e.id + ': تطبيق يدوي (النص ليس وحده بين علامتي تنصيص)؛ لم يُكتب'); continue; }
  const rep = esc(e.text, q); write(r.file, src.slice(0, at) + rep + src.slice(at + r.find.length));
  report.push(e.id + ': استُبدل النص في ' + r.file); r.find = rep; r.show = e.text; r.status = 'approved'; r.source = 'دفعة المراجعة ' + path.basename(batchFile) + ' (نص بديل من المختص عبر بن محمود)';
}
if (errs.length) fail(errs);
if (flagAdds.length) { const fl = fs.readFileSync(P.flags, 'utf8'), m = /hidden: \[([^\]]*)\]/.exec(fl); if (!m) fail('تعذّر قراءة src/review-flags.js'); const cur = m[1].split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean), all = [...new Set([...cur, ...flagAdds])]; touched.set(P.flags, { before: fl, text: fl.replace(m[0], 'hidden: [' + all.map(x => "'" + x + "'").join(', ') + ']') }); }
console.log((a.dry ? '[تجربة --dry: لا كتابة]\n' : '') + report.join('\n'));
if (a.dry) process.exit(0);
const regBefore = fs.readFileSync(P.registry, 'utf8'); for (const [p, t] of touched) if (t.text != null && t.text !== t.before) fs.writeFileSync(p, t.text); L.saveRegistry(root, reg);
const revert = why => { for (const [p, t] of touched) fs.writeFileSync(p, t.before); fs.writeFileSync(P.registry, regBefore); fail('أُعيدت الملفات كما كانت: ' + why); };
const changedSrc = [...touched.values()].some(t => t.text != null && t.text !== t.before);
if (changedSrc && !a['no-verify'] && root === L.REPO) {
  for (const cmd of [['node', ['build.js']], ['node', ['test/quran-prefix.test.js']], ['node', ['test/approved-batch05.test.js']]]) { const r = cp.spawnSync(cmd[0], cmd[1], { cwd: root, encoding: 'utf8' }); if (r.status !== 0) revert(cmd.join(' ') + ' فشل:\n' + (r.stdout + r.stderr).slice(-400)); }
}
if (flagAdds.length) console.log('تنبيه لبن محمود: وُضع في الإخفاء (review-flags.js) بناءً على «يُحذف»: ' + flagAdds.join('، ') + '. الحذف من الشيفرة قرار تنفيذ لاحق.');
