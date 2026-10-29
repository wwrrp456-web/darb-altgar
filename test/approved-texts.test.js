// WP-19أ (D7): نصوص APPROVED_* المعنية تظهر بالحرف في مصادر اللعبة، ولا يحمل أي منها حقل short (طبقة الناشئ لا تمسّ المعتمد)
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), root = path.join(__dirname, '..'), ok = m => console.log('OK   ' + m);
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const files = []; (function walk(d) { for (const f of fs.readdirSync(path.join(root, d))) { const p = d + '/' + f; if (fs.statSync(path.join(root, p)).isDirectory()) { if (f !== 'node_modules') walk(p); } else if (/\.js$/.test(f) && p !== 'src/engine.js') files.push(p); } })('src');
const src = files.map(f => [f, read(f)]), corpus = src.map(x => x[1]).join('\n');
const lines = (name, pick) => { const out = pick(read('docs/review/' + name).split('\n')); assert.ok(out.length > 0, name + ': لا نصوص مستخرجة'); return out; };
const sets = {
  'APPROVED_AGING_TEXTS.md': L => L.map(l => l.trim()).filter(l => l && !/^#/.test(l) && !/^\d+\.\s/.test(l) && !/^(المصدر|ملاحظة)/.test(l) && !/^[-*>|]/.test(l)),
  'APPROVED_CLIMATE_TEXTS.md': L => L.map(l => /^\d+\. (.*\{sector\}.*)$/.exec(l.trim())).filter(Boolean).map(m => m[1]),
  'APPROVED_STAGE_LINKS.md': L => L.filter(l => /^\| \d+ \|/.test(l)).flatMap(l => l.split('|').slice(2, 4).map(x => x.trim())),
};
let total = 0;
for (const [name, pick] of Object.entries(sets)) for (const t of lines(name, pick)) {
  total++; assert.ok(corpus.includes(t), name + ': النص المعتمد غير موجود حرفياً في مصادر اللعبة: ' + t.slice(0, 60));
  // لا يقع النص قيمةً لحقل short أو xxxShort
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); assert.ok(!new RegExp('[sS]hort\\w*["\']?\\s*:\\s*["\'`][^"\'`]*' + esc.slice(0, 40)).test(corpus), name + ': نص معتمد حامل لـshort: ' + t.slice(0, 60));
}
ok('كل نص معتمد (' + total + ') يظهر بالحرف في مصادر اللعبة ولا يحمل short');
// لا حقل short في أي ملف تحكمه المراجعة الشرعية
for (const f of ['src/fiqh.js']) assert.ok(!/[sS]hort\s*:/.test(read(f)), f + ': لا short في نصوص المختص');
for (const r of JSON.parse(read('docs/review/registry.json')).filter(x => x.find)) { const i = corpus.indexOf(r.find); assert.ok(i < 0 || !/[sS]hort\w*["']?\s*:\s*["'`]/.test(corpus.slice(Math.max(0, i - 220), i)), r.id + ': بند السجل حامل لـshort'); }
ok('لا short في fiqh.js ولا في بنود السجل ذات النص الواحد');
console.log('\napproved-texts: كلها ناجحة');
