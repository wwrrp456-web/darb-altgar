// دليل اللاعب المثبَّت: التجهيز والملفات والـmanifest وربط اللعبة (بلا متصفح): node test/guide.test.js
const fs = require('fs'), path = require('path'); const R = f => path.join(__dirname, '..', f);
const { pack } = require('../pwa-guide/pack.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const FX = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; base-uri \'none\'; connect-src \'none\'"><meta name="guide-ready" content="1"><meta name="guide-version" content="2026-10-22.1"><title>x</title></head><body><section id="whatsnew">جديد</section></body></html>';
// التجهيز
{ const p = pack(FX); ok(p.ready && p.ver === '2026-10-22.1', 'الصفحة الجاهزة: تُقرأ علامة الجاهزية والإصدار');
  ok(/connect-src 'self'/.test(p.page) && !/connect-src 'none'/.test(p.page) && /worker-src 'self'/.test(p.page) && /manifest-src 'self'/.test(p.page), 'سياسة الأمان تسمح بخدمة التخزين لنفس الموقع فقط');
  ok(/img-src data: 'self'/.test(p.page), 'الصورة المضمَّنة وأيقونة الصفحة (نفس الموقع) مسموحتان');
  ok(/default-src 'none'/.test(p.page) && /script-src 'unsafe-inline'/.test(p.page), 'ولا تُفتح بقية السياسة');
  ok(/rel="manifest" href="manifest.webmanifest"/.test(p.page) && /apple-touch-icon/.test(p.page) && /theme-color/.test(p.page), 'تُحقن وسوم التثبيت');
  ok(/serviceWorker/.test(p.page) && p.page.indexOf('serviceWorker') > p.page.indexOf('whatsnew'), 'يُحقن غلاف التحديث في آخر الصفحة');
  ok(!/__BUILD__/.test(p.sw) && p.sw.includes('guide-' + p.build), 'خدمة التخزين تحمل معرّف البناء');
  const p2 = pack(FX.replace('whatsnew">جديد', 'whatsnew">جديد جداً')); ok(p2.build !== p.build, 'يتغير معرّف البناء بتغير المحتوى (فتتحدث الخدمة)'); }
{ const p = pack('<html><head><title>ناقص</title></head><body>هيكل</body></html>'); ok(!p.ready && p.ver === 'placeholder' && /قيد الإعداد/.test(p.page), 'بلا علامة الجاهزية: صفحة مؤقتة (لا يُنشر هيكل ناقص)'); }
{ const p = pack(FX.replace('<meta name="guide-version" content="2026-10-22.1">', '')); ok(p.ready && /^g[0-9a-f]{8}$/.test(p.ver), 'بلا إصدار صريح: يُشتق من المحتوى'); }
// الملفات المبنية
const m = JSON.parse(fs.readFileSync(R('guide/manifest.webmanifest'), 'utf8')), gm = JSON.parse(fs.readFileSync(R('pwa/manifest.webmanifest'), 'utf8'));
ok(m.display === 'standalone' && m.dir === 'rtl' && m.lang === 'ar' && m.start_url === './' && m.scope === './', 'manifest الدليل: مستقل RTL نسبي');
ok(m.name !== gm.name && m.short_name !== gm.short_name, 'اسم الدليل غير اسم اللعبة');
ok(m.id === './' && m.icons.some(i => i.purpose === 'maskable') && m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'), 'أيقونات 192 و512 وقابلة للاقتطاع');
ok(m.icons.every(i => fs.existsSync(R('guide/' + i.src.split('?')[0]))), 'ملفات الأيقونات موجودة في guide/');
{ const eq = (a, b) => Buffer.compare(fs.readFileSync(R(a)), fs.readFileSync(R(b))) === 0; ok(!eq('guide/icon-512.png', 'pwa/icon-512.png') && !eq('guide/icon-192.png', 'pwa/icon-192.png'), 'أيقونة الدليل غير أيقونة اللعبة'); }
ok(fs.existsSync(R('guide/index.html')) && fs.existsSync(R('guide/sw.js')) && fs.existsSync(R('guide/version.json')) && fs.existsSync(R('site/guide/index.html')), 'guide/ (و site/guide/) مبنية');
{ const v = JSON.parse(fs.readFileSync(R('guide/version.json'), 'utf8')); ok(typeof v.v === 'string' && typeof v.build === 'string' && typeof v.ready === 'boolean', 'version.json: إصدار ومعرّف بناء وجاهزية'); }
ok(!/__BUILD__/.test(fs.readFileSync(R('guide/sw.js'), 'utf8')), 'sw.js المبني بلا رموز ناقصة');
// ربط اللعبة
{ const g = fs.readFileSync(R('index.html'), 'utf8'); const v = JSON.parse(fs.readFileSync(R('guide/version.json'), 'utf8'));
  ok(g.includes('window.GUIDE = ' + JSON.stringify({ ready: v.ready, v: v.v })), 'اللعبة تحمل حالة الدليل وإصداره');
  ok(/id="hGuide"[^>]*href="guide\/"[^>]*target="_blank"/.test(g) && /id="hGuide"[^>]*hidden/.test(g), 'زرّ الدليل في قائمة ⋯ مخفي افتراضياً ويفتح guide/ في تبويب'); }
console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
