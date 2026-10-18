// يدمج المحرك والواجهة في ملف HTML واحد: node build.js
const fs = require('fs'), path = require('path');
const d = __dirname, r = f => fs.readFileSync(path.join(d, f), 'utf8');
// الرسومات: brand/img → window.ART (base64)
const ART = {}; (function walk(dir, pre) { for (const f of fs.readdirSync(path.join(d, dir)).sort()) { const p = dir + '/' + f; if (fs.statSync(path.join(d, p)).isDirectory()) walk(p, pre + f + '/'); else if (/\.(jpe?g|png|webp)$/i.test(f)) { const k = pre + f.replace(/\.[^.]+$/, ''); ART[k] = 'data:image/' + (f.endsWith('.png') ? 'png' : f.endsWith('.webp') ? 'webp' : 'jpeg') + ';base64,' + fs.readFileSync(path.join(d, p)).toString('base64'); } } })('brand/img', '');
const html = r('src/template.html')
  .replace('<script>/*ART*/</script>', () => '<script>window.ART = ' + JSON.stringify(ART) + ';</script>')
  .replace('<script>/*LESSONS*/</script>', () => '<script>\n' + r('src/lessons.js') + '\n' + r('src/lore.js') + '\n' + r('src/babylon.js') + '\n</script>')
  .replace('<script>/*ENGINE*/</script>', () => '<script>\n' + r('src/engine.js') + '\n</script>')
  .replace('<script>/*WORLD_MAP*/</script>', () => '<script>\n' + r('src/world-map.js') + '\n</script>')
  .replace('<script>/*MAP3D*/</script>', () => '<script>\n' + r('src/map3d.js') + '\n</script>')
  .replace('<script>/*ICONS*/</script>', () => '<script>\n' + r('src/icons.js') + '\n</script>')
  .replace('<script>/*UI*/</script>', () => '<script>\n' + r('src/ui.js') + '\n</script>');
fs.writeFileSync(path.join(d, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(1) + 'KB');

// نسخة النشر كـ Artifact: بلا وسوم doctype/html/head/body (يضيفها النشر)
let a = html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
  .replace(/<!--PWA-->[\s\S]*?<!--\/PWA-->\s*/, '')
  .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
fs.writeFileSync(path.join(d, 'dist-artifact.html'), a);
console.log('dist-artifact.html', (a.length / 1024).toFixed(1) + 'KB');

// مجلد جاهز للاستضافة (يُرفع كما هو): الصفحة + ملفات التثبيت
fs.mkdirSync(path.join(d, 'site'), { recursive: true });
fs.copyFileSync(path.join(d, 'index.html'), path.join(d, 'site/index.html'));
for (const f of fs.readdirSync(path.join(d, 'pwa'))) fs.copyFileSync(path.join(d, 'pwa', f), path.join(d, 'site', f));
console.log('site/ جاهز للرفع');

// الاستضافة من الفرع مباشرة: ملفات التثبيت في الجذر بجوار index.html
for (const f of fs.readdirSync(path.join(d, 'pwa'))) fs.copyFileSync(path.join(d, 'pwa', f), path.join(d, f));
fs.writeFileSync(path.join(d, '.nojekyll'), '');
