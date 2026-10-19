// يدمج المحرك والواجهة في ملف HTML واحد: node build.js
const fs = require('fs'), path = require('path');
const d = __dirname, r = f => fs.readFileSync(path.join(d, f), 'utf8');
// الرسومات: brand/img → window.ART (base64)
const ART = {}; (function walk(dir, pre) { for (const f of fs.readdirSync(path.join(d, dir)).sort()) { const p = dir + '/' + f; if (fs.statSync(path.join(d, p)).isDirectory()) walk(p, pre + f + '/'); else if (/\.(jpe?g|png|webp)$/i.test(f)) { const k = pre + f.replace(/\.[^.]+$/, ''); ART[k] = 'data:image/' + (f.endsWith('.png') ? 'png' : f.endsWith('.webp') ? 'webp' : 'jpeg') + ';base64,' + fs.readFileSync(path.join(d, p)).toString('base64'); } } })('brand/img', '');
let html = r('src/template.html')
  .replace('<script>/*ART*/</script>', () => '<script>window.ART = ' + JSON.stringify(ART) + ';</script>')
  .replace('<script>/*LESSONS*/</script>', () => '<script>\n' + r('src/lessons.js') + '\n' + r('src/lore.js') + '\n' + r('src/babylon.js') + '\n' + r('src/dialogs.js') + '\n</script>')
  .replace('<script>/*ENGINE*/</script>', () => '<script>\n' + r('src/engine.js') + '\n</script>')
  .replace('<script>/*WORLD_MAP*/</script>', () => '<script>\n' + r('src/world-map.js') + '\n</script>')
  .replace('<script>/*MAP3D*/</script>', () => '<script>\n' + r('src/map3d.js') + '\n</script>')
  .replace('<script>/*SOUND*/</script>', () => '<script>\n' + r('src/sound.js') + '\n</script>')
  .replace('<script>/*SAVECODE*/</script>', () => '<script>\n' + r('src/savecode.js') + '\n</script>')
  .replace('<script>/*ICONS*/</script>', () => '<script>\n' + r('src/icons.js') + '\n</script>')
  .replace('<script>/*UI*/</script>', () => '<script>\n' + r('src/ui.js') + '\n</script>');
// معرّف النسخة: بصمة المحتوى نفسه، فلا يتغيّر إلا إذا تغيّرت اللعبة. يقرأه التطبيق ليعرف أن هناك نسخة أحدث
const BUILD = require('crypto').createHash('sha1').update(html).digest('hex').slice(0, 10);
html = html.split('__BUILD__').join(BUILD);
fs.writeFileSync(path.join(d, 'index.html'), html);
fs.writeFileSync(path.join(d, 'version.json'), JSON.stringify({ id: BUILD }) + '\n');
console.log('index.html', (html.length / 1024).toFixed(1) + 'KB');

// نسخة النشر كـ Artifact: بلا وسوم doctype/html/head/body (يضيفها النشر)
let a = html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
  .replace(/<!--PWA-->[\s\S]*?<!--\/PWA-->\s*/, '')
  .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
fs.writeFileSync(path.join(d, 'dist-artifact.html'), a);
console.log('dist-artifact.html', (a.length / 1024).toFixed(1) + 'KB');

function copyPwa(f, to) { const src = path.join(d, 'pwa', f), dst = path.join(d, to, f); if (f === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(src, 'utf8').split('__BUILD__').join(BUILD)); else fs.copyFileSync(src, dst); }
// مجلد جاهز للاستضافة (يُرفع كما هو): الصفحة + ملفات التثبيت
fs.mkdirSync(path.join(d, 'site'), { recursive: true });
fs.copyFileSync(path.join(d, 'index.html'), path.join(d, 'site/index.html'));
for (const f of fs.readdirSync(path.join(d, 'pwa'))) copyPwa(f, 'site');
fs.copyFileSync(path.join(d, 'version.json'), path.join(d, 'site/version.json'));
console.log('site/ جاهز للرفع');

// الاستضافة من الفرع مباشرة: ملفات التثبيت في الجذر بجوار index.html
for (const f of fs.readdirSync(path.join(d, 'pwa'))) copyPwa(f, '.');
fs.writeFileSync(path.join(d, '.nojekyll'), '');
