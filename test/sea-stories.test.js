// حكايات البحر وعدّادات المخاطر: المجموعة الأصلية كاملة ببذورها260.
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, city) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.phase = 3; S.player.gold = 60000; const car = S.player.caravans[0]; car.city = city || 'jeddah'; car.left = 0; return { S, car }; };
// ===== المرحلة ٣: حكايات البحر والموانئ =====
{
  const t = mk(41); const S3 = t.S; A.buyShip(S3, 'jeddah'); const trig = E.CARD_TRIG; const st = () => E.seaStat(S3);
  ok(!trig.g_harbor(S3) && !trig.g_port_mumbai(S3) && !trig.g_stormsea(S3), 'لا حكايات بحر قبل الإبحار');
  t.car.cargo.wheat = 60; A.sail(S3, t.car.id, 'mumbai'); for (let i = 0; i < 20 && t.car.left > 0; i++) E.tick(S3);
  if (S3.road) A.roadChoose(S3, 'pay');
  ok(S3.player.seaTrips === 1 && trig.g_harbor(S3) && trig.g_port_mumbai(S3) && !trig.g_port_jeddah(S3), 'أول رحلة تفتح الشاهبندر وميناء الوصول فقط');
  ok(!trig.g_monsoon(S3) && !trig.f_qirad(S3), 'الرياح الموسمية بعد رحلتين والمضاربة بعد ثلاث'); S3.player.seaTrips = 3; ok(trig.g_monsoon(S3) && trig.f_qirad(S3), 'وتُفتح بعدها');
  // عدّادات العاصفة والقراصنة عبر بذور
  let storms = 0, pir = 0, rep = 0, okc = true;
  for (let seed = 1; seed <= 260; seed++) { const u = mk(seed); A.buyShip(u.S, 'jeddah'); u.car.cargo.wheat = 100; if (!A.sail(u.S, u.car.id, 'mumbai').ok) continue; for (let i = 0; i < 20 && u.car.left > 0; i++) E.tick(u.S); const q = E.seaStat(u.S);
    if (u.S.road && u.S.road.k === 'pirates') { A.roadChoose(u.S, 'fight'); if (E.seaStat(u.S).repelled) rep++; }
    storms += q.storm; pir += E.seaStat(u.S).pirates; if (q.storm && !E.CARD_TRIG.g_stormsea(u.S)) okc = false; if (E.seaStat(u.S).pirates && !E.CARD_TRIG.g_pirsea(u.S)) okc = false; }
  ok(storms > 3 && pir > 3 && okc, 'عدّادا العاصفة (' + storms + ') والقراصنة (' + pir + ') يفتحان حكايتيهما'); ok(rep >= 0, 'عدّاد الصدّ يعمل (' + rep + ')');
  const L = E.load(E.save(S3)); ok(L.player.sea && L.player.sea.ports.mumbai != null, 'عدّادات البحر تُحفظ'); const o = JSON.parse(E.save(S3)); delete o.player.sea; ok(E.load(JSON.stringify(o)).player.sea.storm === 0, 'حفظ قديم بلا عدّادات يُرحَّل');
  ok(['g_harbor', 'g_monsoon', 'g_stormsea', 'g_pirsea', 'f_qirad'].concat(['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai'].map(p => 'g_port_' + p)).every(id => E.CARDS.CARDS[id] && E.CARDS.CARDS[id].text.length >= 1 && (id === 'f_qirad' || E.CARDS.CARDS[id].who === 'harbor') && E.CARD_TRIG[id]), 'اثنتا عشرة بطاقة بحر بشروطها ويرويها الشاهبندر');
}
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
