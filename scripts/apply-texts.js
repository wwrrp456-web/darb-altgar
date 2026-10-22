// يطبّق تعديلات نصية على ملفات البيانات: node scripts/apply-texts.js changes.json [--dry]
// changes.json: [{ id, old, new }] حيث old هو النص كما يقرؤه المحرك، فيُبحث عنه حرفياً بين علامتي اقتباس في الملفات.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const FILES = ['src/lessons.js', 'src/babylon.js', 'src/lore.js', 'src/dialogs.js'].map(f => path.join(root, f));
const dry = process.argv.includes('--dry');
const changes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const src = Object.fromEntries(FILES.map(f => [f, fs.readFileSync(f, 'utf8')]));
const esc = (s, q) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').split(q).join('\\' + q);
const report = { applied: [], missing: [], multi: [] };
for (const c of changes) {
  const hits = [];
  for (const f of FILES) for (const q of ["'", '"', '`']) {
    const lit = q + esc(c.old, q) + q; let i = -1, n = 0;
    while ((i = src[f].indexOf(lit, i + 1)) !== -1) n++;
    if (n) hits.push({ f, q, lit, n });
  }
  if (!hits.length) { report.missing.push(c.id); continue; }
  const total = hits.reduce((a, h) => a + h.n, 0);
  const dlg = /^DLG\./.test(c.id); // حوارات القالب تتكرر نصاً واحداً في أكثر من موضع
  if (total > 1 && !dlg) { report.multi.push(c.id); continue; }
  for (const h of hits) src[h.f] = src[h.f].split(h.lit).join(h.q + esc(c.new, h.q) + h.q);
  report.applied.push(c.id);
}
if (!dry) for (const f of FILES) fs.writeFileSync(f, src[f]);
console.log(JSON.stringify({ applied: report.applied.length, missing: report.missing.length, multi: report.multi.length }));
fs.writeFileSync('/tmp/apply-report.json', JSON.stringify(report));
