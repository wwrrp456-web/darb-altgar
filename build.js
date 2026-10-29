// يدمج المحرك والواجهة في ملف HTML واحد: node build.js
const fs = require('fs'), path = require('path');
const d = __dirname, r = f => fs.readFileSync(path.join(d, f), 'utf8');
// الشيفرة مقسّمة حسب الميزة: src/engine/*.js وsrc/ui/*.js تُدمج بالترتيب الرقمي لأسمائها.
// src/engine.js ملف مولَّد (تحتاجه اختبارات Node عبر require)، فعدّل الأجزاء لا هو.
const cat = dir => fs.readdirSync(path.join(d, dir)).filter(f => f.endsWith('.js')).sort().map(f => r(dir + '/' + f)).join('');
fs.writeFileSync(path.join(d, 'src/engine.js'), cat('src/engine'));
// الرسومات: brand/img → window.ART. الصغيرة (دون ٨ كيلوبايت) وكل ما في brand وnav وicons وui تُدمج base64 لتظهر مع أول رسم، والباقي يُشار إليه برابط ملف brand/img/... (يُخزَّن في الجهاز عند أول طلب،
// ويحمل ?v=بصمة المحتوى فلا يُعاد تنزيله مع كل تحديث للعبة). نسخة الـArtifact (dist-artifact.html) تبقى كلها base64 لأنها ملف واحد.
const crypto = require('crypto'), INLINE_GROUPS = new Set(['brand', 'nav', 'icons', 'ui', 'office']), INLINE_MAX = 8000;
const ART = {}, ART_FULL = {}, EXT = []; (function walk(dir, pre) { for (const f of fs.readdirSync(path.join(d, dir)).sort()) { const p = dir + '/' + f; if (fs.statSync(path.join(d, p)).isDirectory()) walk(p, pre + f + '/'); else if (/\.(jpe?g|png|webp)$/i.test(f)) { const k = pre + f.replace(/\.[^.]+$/, ''), buf = fs.readFileSync(path.join(d, p)), uri = 'data:image/' + (f.endsWith('.png') ? 'png' : f.endsWith('.webp') ? 'webp' : 'jpeg') + ';base64,' + buf.toString('base64'); ART_FULL[k] = uri; if (INLINE_GROUPS.has(pre.split('/')[0]) || buf.length < INLINE_MAX) ART[k] = uri; else { ART[k] = p + '?v=' + crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8); EXT.push(p); } } } })('brand/img', '');
// الرسومات الثقيلة (مشاهد المدن وتعابير الزعماء): brand/lazy → ملفات img/ بجوار الصفحة تُحمَّل عند الحاجة وتُخزَّن للعمل دون اتصال، لا تُدمج base64 فتتضخم الصفحة
const LAZY = []; (function walkL(dir, pre) { if (!fs.existsSync(path.join(d, dir))) return; for (const f of fs.readdirSync(path.join(d, dir)).sort()) { const p = dir + '/' + f; if (fs.statSync(path.join(d, p)).isDirectory()) walkL(p, pre + f + '/'); else if (/\.(jpe?g|png|webp)$/i.test(f)) { const key = pre + f.replace(/\.[^.]+$/, ''); const v = '?v=' + crypto.createHash('sha1').update(fs.readFileSync(path.join(d, p))).digest('hex').slice(0, 8); ART[key] = ART_FULL[key] = 'img/' + pre + f + v; LAZY.push([p, 'img/' + pre + f]); } } })('brand/lazy', '');
// وجود الملف docs/guide/HOLD يُخفي الدليل (صفحة مؤقتة وزرّ مخفي) حتى بعد أن يجهّزه كودكس؛ يُحذف حين يعتمده المالك.
// دليل اللاعب: صفحة مثبّتة بأيقونتها. مصدرها docs/guide/player.html (من كودكس)، ولا يُنشر إلا إذا حمل العلامة guide-ready وإلا فصفحة مؤقتة لا يظهر زرّها في اللعبة
const GP = require('./pwa-guide/pack.js').pack(fs.existsSync(path.join(d, 'docs/guide/player.html')) && !fs.existsSync(path.join(d, 'docs/guide/HOLD')) ? r('docs/guide/player.html') : ''), GREADY = GP.ready, GVER = GP.ver;
let html = r('src/template.html')
  .replace('<script>/*GUIDE*/</script>', () => '<script>window.GUIDE = ' + JSON.stringify({ ready: GREADY, v: GVER }) + ';</script>')
  .replace('<script>/*ART*/</script>', () => '<script>window.ART = ' + JSON.stringify(ART) + ';</script>')
  .replace('<script>/*LESSONS*/</script>', () => '<script>\n' + r('src/lessons.js') + '\n' + r('src/lore.js') + '\n' + r('src/babylon.js') + '\n' + r('src/fiqh.js') + '\n' + r('src/tips.js') + '\n' + r('src/glossary.js') + '\n' + r('src/content-map.js') + '\n' + r('src/review-flags.js') + '\n' + r('src/stingers.js') + '\n' + r('src/quests-extra.js') + '\n' + r('src/dialogs.js') + '\n' + r('src/achievements.js') + '\n' + r('src/cards.js') + '\n</script>')
  .replace('<script>/*ENGINE*/</script>', () => '<script>\n' + r('src/engine.js') + '\n</script>')
  .replace('<script>/*WORLD_MAP*/</script>', () => '<script>\n' + r('src/world-map.js') + '\n</script>')
  .replace('<script>/*SOUND*/</script>', () => '<script>\n' + r('src/sound.js') + '\n</script>')
  .replace('<script>/*SAVECODE*/</script>', () => '<script>\n' + r('src/savecode.js') + '\n</script>')
  .replace('<script>/*ICONS*/</script>', () => '<script>\n' + r('src/icons.js') + '\n</script>')
  .replace('<script>/*UI*/</script>', () => '<script>\n' + cat('src/ui') + '\n</script>');
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
a = a.replace('window.ART = ' + JSON.stringify(ART) + ';', () => 'window.ART = ' + JSON.stringify(ART_FULL) + ';'); // الـArtifact ملف واحد: كل الرسومات مضمَّنة
fs.writeFileSync(path.join(d, 'dist-artifact.html'), a);
console.log('dist-artifact.html', (a.length / 1024).toFixed(1) + 'KB');

function copyPwa(f, to) { const src = path.join(d, 'pwa', f), dst = path.join(d, to, f); if (f === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(src, 'utf8').split('__BUILD__').join(BUILD)); else fs.copyFileSync(src, dst); }
// مجلد جاهز للاستضافة (يُرفع كما هو): الصفحة + ملفات التثبيت
fs.mkdirSync(path.join(d, 'site'), { recursive: true });
fs.copyFileSync(path.join(d, 'index.html'), path.join(d, 'site/index.html'));
for (const f of fs.readdirSync(path.join(d, 'pwa'))) copyPwa(f, 'site');
fs.copyFileSync(path.join(d, 'version.json'), path.join(d, 'site/version.json'));
for (const src of EXT) { const t = path.join(d, 'site', src); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(path.join(d, src), t); } // الاستضافة من الجذر تخدم brand/img مباشرة؛ و site/ تحتاج نسخة
for (const [src, dst] of LAZY) { for (const root of ['site', '.']) { const t = path.join(d, root, dst); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(path.join(d, src), t); } }
// دليل اللاعب: guide/ بجانب اللعبة (صفحة + manifest + خدمة تخزين + أيقونة مستقلة)
for (const root of ['site', '.']) require('./pwa-guide/pack.js').write(path.join(d, root, 'guide'), GP);
console.log('guide/ جاهز (' + (GREADY ? 'من docs/guide/player.html' : 'صفحة مؤقتة') + ' · ' + GVER + ')');
console.log('site/ جاهز للرفع');

// الاستضافة من الفرع مباشرة: ملفات التثبيت في الجذر بجوار index.html
for (const f of fs.readdirSync(path.join(d, 'pwa'))) copyPwa(f, '.');
fs.writeFileSync(path.join(d, '.nojekyll'), '');
