// فصل الصور: الصفحة صغيرة، والرسومات الكبيرة روابط ملفات تُحمَّل فعلاً، والـArtifact مضمَّن كله، وملف العمل يحفظها في ذاكرة دائمة: node test/art-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const URL = 'file://' + path.join(root, 'index.html') + '?learn=1&seed=4';
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), art = fs.readFileSync(path.join(root, 'dist-artifact.html'), 'utf8');
ok(page.length < 4.7e6, 'صفحة اللعبة أصغر من ٤٫٧ ميغابايت (' + (page.length / 1e6).toFixed(2) + ')');
ok(art.length > 10e6, 'نسخة الـArtifact تبقى مضمَّنة بالكامل (' + (art.length / 1e6).toFixed(1) + ')');
const getArt = h => { const m = h.match(/window\.ART = (\{[\s\S]*?\});<\/script>/); return JSON.parse(m[1]); };
const A = getArt(page), AF = getArt(art), keys = Object.keys(A);
const ext = keys.filter(k => !/^data:/.test(A[k])), inl = keys.filter(k => /^data:/.test(A[k]));
// 044 (قرار بن محمود 2026-11-11): يصف التصميم القديم «أخرى مدمجة للأولى (inl > 100)» بدمج كل icons وui وoffice؛ والجديد يدمج مفاتيح الشاشة الأولى فقط (brand/inline.json) مع brand وnav.
// فيُستبدل الفحص بـ«كل مفاتيح الشاشة الأولى مدمجة» ويُضبط الحد الأدنى للعدد على ما ينتج (٣١ حالياً) دون حذف فحص الخارجي ولا الحد الأعلى للحجم.
const FIRST = JSON.parse(fs.readFileSync(path.join(root, 'brand/inline.json'), 'utf8')).filter(k => keys.includes(k));
ok(ext.length > 150 && FIRST.length >= 10 && FIRST.every(k => /^data:/.test(A[k])) && inl.length >= 25, 'رسومات مفصولة (' + ext.length + ') وكل مفاتيح الشاشة الأولى مدمجة (' + FIRST.length + ' من ' + inl.length + ' مدمجة)');
ok(ext.every(k => /\?v=[0-9a-f]{8}$/.test(A[k])), 'روابط الملفات تحمل بصمة المحتوى ?v=');
ok(ext.every(k => fs.existsSync(path.join(root, A[k].split('?')[0]))), 'كل رابط مفصول يقابله ملف في المستودع');
ok(ext.every(k => fs.existsSync(path.join(root, 'site', A[k].split('?')[0]))), 'ونسخة في site/ أيضاً');
// 044: «أيقونات الواجهة ui/ كلها مدمجة» كان وصفاً للتصميم القديم؛ الآن المدمج منها ما يظهر في الشاشة الأولى (الشريط العلوي) ويُجلب الباقي في الخلفية، وتغطّيه page-budget.test.js متصلاً ودون اتصال.
ok(keys.filter(k => k.startsWith('brand/') || k.startsWith('nav/') || FIRST.includes(k)).every(k => /^data:/.test(A[k])), 'الشعار وشريط القوائم وأيقونات الشاشة الأولى مدمجة (تظهر مع أول رسم)');
ok(Object.keys(AF).filter(k => /^data:/.test(AF[k])).length >= 500, 'الـArtifact: كل رسومات brand/img مضمَّنة data');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok(/IMG = 'darb-img'/.test(sw) && /k !== IMG/.test(sw), 'ملف العمل: ذاكرة دائمة للرسومات لا تُمسح مع التحديث');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message)); const bad = []; p.on('requestfailed', r => bad.push(r.url().slice(-40)));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => { /* 044: الصور الكسولة تحت الطيّ لا تُطلب حتى تقترب؛ فالمقصود «الظاهرة» فعلاً: داخل نافذة العرض الأولى وليست في قسم مطوي */ const im = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return i.src && !i.closest('[hidden]') && i.checkVisibility({ checkVisibilityCSS: true }) && r.width > 0 && r.bottom > 0 && r.top < innerHeight + 200; }); const ext = im.filter(i => !/^data:/.test(i.src)); return { n: im.length, ext: ext.length, loaded: ext.filter(i => i.complete && i.naturalWidth > 0).length }; });
    ok(st.ext > 0 && st.loaded === st.ext, tag + 'الصور المفصولة الظاهرة تُحمَّل كلها (' + st.loaded + ' من ' + st.ext + ')');
    ok(bad.length === 0, tag + 'لا طلبات فاشلة ' + bad.slice(0, 2).join('|'));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
