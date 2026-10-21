// يجهّز دليل اللاعب للنشر: يحقن manifest وغلاف التحديث، ويعدّل سياسة الأمان لتسمح بخدمة التخزين، ويحسب إصدار الصفحة
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const G = __dirname, sha = t => crypto.createHash('sha1').update(t).digest('hex');
const HEAD = '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#476b7e"><link rel="icon" href="icon-192.png?v=1"><link rel="apple-touch-icon" href="apple-touch-icon.png?v=1"><meta name="apple-mobile-web-app-capable" content="yes">';
function pack(src) {
  const ready = /<meta name="guide-ready" content="1"/.test(src || '');
  const base = ready ? src : fs.readFileSync(path.join(G, 'placeholder.html'), 'utf8');
  const ver = (base.match(/<meta name="guide-version" content="([^"]+)"/) || [])[1] || (ready ? 'g' + sha(base).slice(0, 8) : 'placeholder');
  const shell = fs.readFileSync(path.join(G, 'shell.js'), 'utf8'), sw = fs.readFileSync(path.join(G, 'sw.js'), 'utf8');
  // السياسة الصارمة (connect-src 'none') تمنع خدمة التخزين وفحص النسخة: نسمح بنفس الموقع فقط
  const page = base.replace(/(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/i, (m, a, c, z) => a + c.replace("connect-src 'none'", "connect-src 'self'") + "; worker-src 'self'; manifest-src 'self'" + z)
    .replace(/<\/head>/i, () => HEAD + '</head>').replace(/<\/body>/i, () => '<script>' + shell + '</script></body>');
  const build = sha(page + shell + sw).slice(0, 10);
  return { ready, ver, page, build, sw: sw.split('__BUILD__').join(build), version: JSON.stringify({ v: ver, build, ready }) + '\n' };
}
// يكتب ملفات الدليل كاملة في مجلد
function write(out, pk) {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), pk.page); fs.writeFileSync(path.join(out, 'sw.js'), pk.sw); fs.writeFileSync(path.join(out, 'version.json'), pk.version);
  for (const f of fs.readdirSync(G)) if (/\.(png|webmanifest)$/.test(f)) fs.copyFileSync(path.join(G, f), path.join(out, f));
}
module.exports = { pack, write };
