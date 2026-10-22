// قفل السفر خارج دولة البداية واسم اللاعب: node test/abroad.test.js
const E = require('../src/engine.js'); const { A } = E;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const fresh = cc => { const S = E.newGame(5); A.chooseStart(S, cc); return S; };

{ // الاسم
  const S = E.newGame(5);
  ok(!A.setName(S, ' ').ok && !A.setName(S, 'ا').ok, 'اسم فارغ أو حرف واحد لا يُقبل');
  ok(A.setName(S, '  ياسر   <b>العلي</b>  ').ok && S.player.name === 'ياسر العلي', 'يُنظَّف الاسم من الوسوم والمسافات (' + S.player.name + ')');
  ok(A.setName(S, 'ا'.repeat(40)).ok && S.player.name.length === 16, 'يُقصّ الاسم إلى ١٦ حرفاً');
  ok(!/[<>&]/.test(S.player.name), 'لا رموز HTML في الاسم');
  A.learnSetChar(S, 'trader'); ok(!A.setName(S, 'خالد').ok, 'لا تغيير للاسم بعد اختيار الشخصية');
}
{ // القفل
  const S = fresh('sa'); A.learnSetChar(S, 'trader'); const car = S.player.caravans[0];
  const foreign = S.order.find(id => S.cities[id].country !== 'sa'), home2 = S.order.find(id => id !== car.city && S.cities[id].country === 'sa');
  S.player.gold = 5000;
  ok(!!E.travelBlock(S, car, foreign) && !A.travel(S, car.id, foreign).ok, 'السفر إلى دولة أخرى مقفل في البداية');
  ok(E.travelBlock(S, car, home2) === null && A.travel(S, car.id, home2).ok, 'السفر داخل بلد البداية مسموح');
  const hs = E.homeStatus(S); ok(hs.home === 'sa' && hs.total === 6 && hs.seen === 1 && !hs.met, 'حالة النفوذ: ' + JSON.stringify(hs));
  // اكتمال الشروط لا يفتح قبل م٤
  const L = S.learn; S.order.filter(id => S.cities[id].country === 'sa').forEach(id => { L.cv[id] = 1; L.cs[id] = 2000; });
  L.level = 3; E.learnCheck(S, true); ok(!L.abroad, 'لا يُفتح السفر قبل إتمام الدروس الثلاثة الأولى');
  L.level = 4; E.learnCheck(S, true); ok(L.abroad === true, 'يُفتح بعد الدروس + زيارة كل الأسواق + النفوذ');
  const c2 = S.player.caravans[0]; c2.left = 0; c2.city = home2; ok(E.travelBlock(S, c2, foreign) === null, 'بعد الفتح لا قفل');
}
{ // الشروط ناقصة
  const S = fresh('eg'); A.learnSetChar(S, 'trader'); const L = S.learn; L.level = 4;
  S.order.filter(id => S.cities[id].country === 'eg').forEach(id => { L.cv[id] = 1; });
  E.learnCheck(S, true); ok(!L.abroad, 'الزيارة وحدها لا تكفي بلا نفوذ');
}
{ // بلا نظام تعلّم (اختبارات/ضغط/لعب حر قديم) لا قفل
  const S = E.newGame(5), car = S.player.caravans[0]; const foreign = S.order.find(id => S.cities[id].country !== S.cities[car.city].country);
  ok(E.travelBlock(S, car, foreign) === null, 'قبل اختيار الشخصية لا قفل');
}
{ // حفظ قديم
  const S = fresh('sa'); A.learnSetChar(S, 'trader'); delete S.learn.abroad; S.learn.level = 6;
  const L = S.learn; if (L.abroad === undefined) L.abroad = L.level >= 4; ok(L.abroad === true, 'الحفظ القديم المتقدّم يبقى مفتوحاً');
}
{ // الفتح المتدرّج: المجاورة عند م٤ وبقية الدول عند م٦
  const S = fresh('sa'); A.learnSetChar(S, 'trader'); const L = S.learn, car = S.player.caravans[0];
  S.order.filter(id => S.cities[id].country === 'sa').forEach(id => { L.cv[id] = 1; L.cs[id] = 2000; });
  L.level = 4; E.learnCheck(S, true);
  const inCountry = cc => S.order.find(id => S.cities[id].country === cc);
  ok(E.travelBlock(S, car, inCountry('eg')) === null, 'م٤: المجاورة (مصر) مفتوحة للسعودية');
  ['ir', 'in', 'cn'].forEach(cc => ok(/المجاورة/.test(E.travelBlock(S, car, inCountry(cc)) || ''), 'م٤: ' + cc + ' مقفلة برسالة المجاورة'));
  L.level = 5; ok(!!E.travelBlock(S, car, inCountry('cn')), 'م٥: ما زالت الصين مقفلة');
  L.level = 6; ['eg', 'ir', 'in', 'cn'].forEach(cc => ok(E.travelBlock(S, car, inCountry(cc)) === null, 'م٦: ' + cc + ' مفتوحة'));
}
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
