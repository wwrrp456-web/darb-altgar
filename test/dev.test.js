// وضع المطوّر: مخفي عن اللاعب، يُفعَّل بلمس الشعار ٧ مرات ثم رمز سري، وأدواته تعمل: node test/dev.test.js
// للتحقق من الرمز الحقيقي أعطِه عبر DEV_CODE=... (لا يُخزَّن في المستودع)؛ بدونه يُحاكى التفعيل بالبصمة المخزنة.
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path'), fs = require('fs'), crypto = require('crypto');
const E = require('../src/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
// SHA-256 يطابق المكتبة القياسية
for (const t of ['', 'abc', 'darb-dev-v1:X', 'درب التجّار ' + 'x'.repeat(300)]) if (E.sha256hex(t) !== crypto.createHash('sha256').update(t).digest('hex')) { ok(false, 'SHA-256 يطابق: ' + t.slice(0, 12)); }
ok(true, 'SHA-256 يطابق المكتبة القياسية على عدة مدخلات');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), HASH = (html.match(/DEV_HASH = '([0-9a-f]{64})'/) || [])[1];
ok(!!HASH && !/darb-dev-v1:[A-Z0-9]{12}/.test(html), 'البصمة في الصفحة والرمز نفسه غير موجود');
(async () => {
  const b = await chromium.launch(); const url = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
  let p = await b.newPage({ viewport: { width: 390, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(1200);
  const vis = sel => p.locator(sel).first().isVisible();
  ok(await vis('#b1') && !(await vis('#b2')) && await vis('#bPause') && !(await vis('#bNext')), 'اللاعب العادي: إيقاف وعادي ظاهران وأزرار التسريع مخفية');
  ok(!(await vis('#b3')) && !(await vis('#bDev')), 'اللاعب العادي: ⏭ والأدوات مخفيّة');
  await p.evaluate(() => { __game.go('cities'); }); await p.waitForTimeout(300);
  ok(await p.locator('[data-ct=test]').count() === 0, 'اللاعب العادي: لا تبويب «اختبار الاقتصاد»');
  // ٦ لمسات لا تكفي، والسابعة تفتح البوابة
  await p.evaluate(() => __game.go('home')); await p.waitForTimeout(300);
  const logo = '.home-brand h1';
  for (let i = 0; i < 6; i++) await p.locator(logo).click();
  ok(await p.locator('#devgate:not([hidden])').count() === 0, '٦ لمسات لا تفتح البوابة');
  await p.locator(logo).click(); await p.waitForTimeout(150);
  ok(await p.locator('#devgate:not([hidden]) #devcode').count() === 1, 'اللمسة السابعة تفتح خانة الرمز');
  // رمز خاطئ
  await p.fill('#devcode', 'WRONGCODE123'); await p.locator('[data-act=devcheck]').click(); await p.waitForTimeout(100);
  ok(/غير صحيح/.test(await p.locator('#devmsg').textContent()) && !(await vis('#b3')), 'رمز خاطئ: رفض وبقاء الوضع مغلقاً');
  for (let i = 0; i < 4; i++) { await p.fill('#devcode', 'BAD' + i); await p.locator('[data-act=devcheck]').click(); await p.waitForTimeout(60); }
  ok(/مقفل/.test(await p.locator('#devmsg').textContent()), 'بعد ٥ محاولات خاطئة يُقفل لبقية الجلسة');
  await p.close();
  // تفعيل: بالرمز الحقيقي إن أُعطي، وإلا بمحاكاة البصمة المخزنة
  p = await b.newPage({ viewport: { width: 390, height: 860 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(1000);
  if (process.env.DEV_CODE) {
    for (let i = 0; i < 7; i++) await p.locator('.home-brand h1').click(); await p.waitForTimeout(150);
    await p.fill('#devcode', process.env.DEV_CODE); await p.locator('[data-act=devcheck]').click(); await p.waitForTimeout(300);
    ok(await vis('#b3') && await p.evaluate(() => sessionStorage.getItem('darb-dev')) === HASH, 'الرمز الصحيح يفعّل الوضع ويحفظ البصمة فقط');
  } else {
    await p.evaluate(h => sessionStorage.setItem('darb-dev', h), HASH); await p.reload(); await p.waitForTimeout(1000);
    ok(true, '(لم يُعطَ DEV_CODE: حوكي التفعيل بالبصمة)');
  }
  ok(await vis('#b3') && await vis('#bDev'), 'وضع المطوّر: ⏭ وزر الأدوات ظاهران');
  await p.evaluate(() => { __game.go('cities'); }); await p.waitForTimeout(300);
  ok(await p.locator('[data-ct=test]').count() === 1, 'وضع المطوّر: تبويب اختبار الاقتصاد ظاهر');
  if (!(await vis('#dev'))) { await p.locator('#bDev').click(); await p.waitForTimeout(150); }
  ok(await vis('#dev'), 'لوحة المطوّر مفتوحة');
  await p.locator('#bDev').click(); await p.waitForTimeout(100); ok(!(await vis('#dev')), 'زر 🧪 يطويها'); await p.locator('#bDev').click(); await p.waitForTimeout(100);
  // أدوات: قفز المستوى
  await p.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.learn.sq.length = 0; __game.renderAll(true); }); await p.waitForTimeout(200);
  await p.selectOption('#devLv', '6'); await p.locator('[data-act=devlvl]').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __game.S.learn.level === 6 && __game.S.learn.intro === 6 && !__game.S.learn.rest), 'القفز إلى المستوى ٦ مع تخطّي المقدّمة والتمرين');
  await p.locator('[data-act=devunlock]').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __game.S.learn.tab.length === 14 && __game.S.learn.csec.length === 18), 'فتح كل الألواح والأسرار');
  await p.evaluate(() => { __game.S.learn.tq.length = 0; __game.renderAll(true); });
  await p.locator('[data-act=devdebt]').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __game.S.player.famDebt.left === 0), 'إنهاء دَين الجدّ');
  await p.evaluate(() => { const L = __game.S.learn; L.fq.length = 0; L.tq.length = 0; __game.renderAll(true); });
  const d0 = await p.evaluate(() => __game.S.day); await p.locator('[data-act=dev100]').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(d => __game.S.day >= d + 100, d0), 'تخطّي ١٠٠ يوم');
  await p.evaluate(() => { const L = __game.S.learn; ['tq', 'fq', 'eq', 'up', 'bq', 'csq'].forEach(k => L[k].length = 0); __game.renderAll(true); });
  await p.locator('[data-act=devoff]').click(); await p.waitForTimeout(300);
  ok(!(await vis('#b3')) && !(await vis('#dev')) && await p.evaluate(() => sessionStorage.getItem('darb-dev')) === null, 'إيقاف وضع المطوّر يعيد الحالة العادية');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.slice(0, 2).join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
