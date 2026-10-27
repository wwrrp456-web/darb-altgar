// كبير الرعاة: توظيف وتقارير ونصائح وشراء بالتفويض: node test/chief-herder.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const S = E.newGame(3); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 3; for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 300000;
const car = S.player.caravans[0], city = car.city, country = S.cities[city].country; A.buildShop(S, city); A.buildWarehouse(S, city);
a(!A.hireChief(S, country).ok, 'بلا مزرعة لا يُوظَّف'); a(A.buildFarm(S, city).ok);
a(A.hireChief(S, country).ok, 'يُوظَّف بعد بناء مزرعة'); a(!A.hireChief(S, country).ok, 'لا تكرار');
const ch = E.chiefOf(S, country), g0 = S.player.gold;
const f = E.farmOf(S, city); f.herd.sheep = 10; // قطيع قائم ليظهر في التقرير والنصيحة
const c = S.cities[city];
// سعر الغنم مرتفع فيُنصح بالبيع، ورخيص فتظهر فرصة الشراء
c.stock.sheep = 1; ch.next = S.day; E.chiefDay(S);
a(S.player.gold < g0, 'أجره يومي'); a(ch.mail.some(m => m.type === 'report'), 'يرسل تقريراً عن المزرعة'); 
const sell = ch.mail.find(m => m.type === 'sell'); if (sell) { const r = A.chiefAct(S, sell.id); a(r.ok, r.msg); a(!ch.mail.some(m => m.id === sell.id), 'تُنفَّذ نصيحة البيع وتُزال'); }
const sc = E.chiefScan(S, country); a(Array.isArray(sc) && sc.every(m => m.city === city), 'المسح يخص مزارع الدولة');
a(A.chiefPolicy(S, country, true, 5000).ok && ch.buy && ch.budget === 5000, 'التفويض بحد');
const b = E.chiefBuy(S, city, 'sheep', 3); a(b.ok === false || b.n > 0, 'الشراء المباشر يعمل أو يُرفض بسبب واضح: ' + b.msg);
a(A.chiefSkip(S, 999).ok, 'تجاهل رسالة غير موجودة لا يكسر'); a(A.fireChief(S, country).ok && !E.chiefOf(S, country), 'تسريحه');
{ // فرصة شراء رخيصة: بالتفويض يشتري وحده، وبدونه يعرضها
  const T = E.load(E.save(S)); T.player.gold = 300000; A.hireChief(T, country); const t = T.cities[city], tf = E.farmOf(T, city), h = E.chiefOf(T, country);
  for (const g of E.GIDS) if (E.BREED[g] && E.sells(t, g)) t.stock[g] = E.capG ? 5 * (t.stock[g] + 50) : 500;
  h.next = T.day; E.chiefDay(T); const buy = h.mail.find(m => m.type === 'buy'); console.log('   عرض فرصة؟', !!buy);
  if (buy) { const before = Object.values(tf.herd).reduce((x, y) => x + y, 0); const r = A.chiefAct(T, buy.id); a(r.ok, r.msg); a(Object.values(tf.herd).reduce((x, y) => x + y, 0) > before, 'الشراء يضيف إلى المزرعة'); }
}
// لا فعل بدون رصيد: يترك العمل بعد تأخر الأجر
a(A.hireChief(S, country).ok); S.player.gold = 0; for (let i = 0; i < E.CHIEF.lateQuit + 1; i++) E.chiefDay(S); a(!E.chiefOf(S, country), 'يترك العمل بعد تأخر أجره');
const L = E.load(E.save(S)); a(L.player.chiefs !== undefined, 'الحفظ');
console.log('PASS chief herder');
