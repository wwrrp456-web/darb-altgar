'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fileURLToPath } = require('node:url');

function catalog(root, verify = false) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const parts = dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js')).sort().map(f => dir + '/' + f);
  const engine = parts('src/engine'), ui = parts('src/ui');
  const singles = fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js') && f !== 'engine.js').sort().map(f => 'src/' + f);
  const id = JSON.parse(read('version.json')).id;
  const sources = [...engine, ...ui, ...singles];
  const original = Object.fromEntries(sources.map(file => [file, read(file)]));
  const compiled = Object.fromEntries(sources.map(file => [file, original[file].split('__BUILD__').join(id)]));
  function group(files, compiledMode) {
    let offset = 0;
    const ranges = files.map(file => { const text = (compiledMode ? compiled : original)[file], start = offset; offset += text.length; return { file, start, end: offset }; });
    return { text: files.map(f => (compiledMode ? compiled : original)[f]).join(''), ranges };
  }
  const groups = [group(engine, true), group(ui, true), ...singles.map(f => group([f], true))];
  if (verify) {
    if (read('src/engine.js') !== group(engine, false).text) throw Error('المحرك المولّد لا يطابق أجزاءه؛ يلزم بناء مطابق قبل جمع التغطية.');
    const html = read('index.html');
    for (const g of groups) if (!html.includes(g.text)) throw Error('الصفحة المبنية لا تطابق المصدر؛ يلزم بناء مطابق قبل جمع التغطية.');
  }
  const fingerprint = crypto.createHash('sha256').update(read('build.js')).update(read('index.html')).update(read('src/template.html')).update(read('version.json'));
  for (const f of sources) fingerprint.update(f).update(original[f]);
  const node = new Map([[path.join(root, 'src/engine.js'), group(engine, false)], ...singles.map(f => [path.join(root, f), group([f], false)])]);
  return { root, files: [...sources, 'src/template.html'].sort(), groups, node, fingerprint: fingerprint.digest('hex') };
}

function locate(source, groups) {
  const result = [];
  for (const group of groups) {
    const start = source.indexOf(group.text);
    if (start < 0) continue;
    if (source.indexOf(group.text, start + 1) >= 0) throw Error('موضع مصدر مكرر؛ لا يمكن ربط الإزاحات بدقة.');
    for (const r of group.ranges) result.push({ file: r.file, start: start + r.start, end: start + r.end });
  }
  return result;
}

function executed(functions, spans, sourceLength) {
  const files = new Set();
  for (let i = 0; i < functions.length; i++) {
    const fn = functions[i], outer = fn.ranges[0];
    if (!outer || outer.count <= 0) continue;
    // المدى الأعلى ليس استدعاء دالة. وأغلفة الوحدات المجهولة ليست ميزة مُختبَرة.
    if (i === 0 && !fn.functionName && outer.startOffset === 0) continue;
    if (!fn.functionName && outer.endOffset - outer.startOffset >= sourceLength * 0.9) continue;
    const hit = spans.filter(p => outer.startOffset >= p.start && outer.endOffset <= p.end);
    // دوال الميزات تقع داخل جزء واحد؛ غلاف المحرك/الواجهة العابر للأجزاء يُهمل.
    if (hit.length === 1) {
      if (!fn.functionName && outer.endOffset - outer.startOffset >= (hit[0].end - hit[0].start) * 0.9) continue;
      files.add(hit[0].file);
    }
  }
  return files;
}

function fromBrowser(entry, data) {
  if (typeof entry.source !== 'string') return new Set();
  return executed(entry.functions || [], locate(entry.source, data.groups), entry.source.length);
}

function fromNode(entry, data, source) {
  let file;
  try { file = entry.url.startsWith('file:') ? fileURLToPath(entry.url) : entry.url; } catch { return new Set(); }
  const group = data.node.get(file);
  if (group) return executed(entry.functions || [], group.ranges, group.text.length);
  return source ? fromBrowser({ source, functions: entry.functions }, data) : new Set();
}

module.exports = { catalog, locate, executed, fromBrowser, fromNode };
