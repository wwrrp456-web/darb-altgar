// مسارات القوافل: البري على اليابسة والبحري على الماء، وأيام السفر تتبع طول الطريق: node test/routes.test.js
const E = require('../src/engine.js'), A = E.A, { execFileSync } = require('child_process');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(3), ids = S.order, ports = E.PORTS, car = S.player.caravans[0];
const len = pl => pl.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pl[i][0], p[1] - pl[i][1]), 0);
let miss = 0, badEnds = 0;
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const a = ids[i], b = ids[j], pl = E.routePath(a, b, false), r = E.routePath(b, a, false);
  if (!pl || !r) { miss++; continue; }
  const A0 = S.cities[a], B0 = S.cities[b];
  if (Math.hypot(pl[0][0] - A0.x, pl[0][1] - A0.y) > 0.6 || Math.hypot(pl[pl.length - 1][0] - B0.x, pl[pl.length - 1][1] - B0.y) > 0.6 || Math.hypot(r[0][0] - B0.x, r[0][1] - B0.y) > 0.6) badEnds++;
}
ok(miss === 0, 'لكل زوج من المدن مسار بري (' + ids.length + ' مدينة)');
ok(badEnds === 0, 'المسار يبدأ من المدينة وينتهي عندها بالاتجاهين');
let sm = 0; for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) if (!E.routePath(ports[i], ports[j], true)) sm++;
ok(sm === 0, 'لكل زوج من الموانئ مسار بحري (' + ports.length + ' موانئ)');
ok(!E.routePath('riyadh', 'hail', true) && E.routePath('riyadh', 'hail', false), 'لا مسار بحري لمدينة داخلية');
// الأيام تتبع طول الطريق
const straight = (a, b) => Math.hypot(S.cities[a].x - S.cities[b].x, S.cities[a].y - S.cities[b].y);
ok(E.routeLen('aswan', 'jeddah', false) > straight('aswan', 'jeddah') * 2 && E.tripDays(S, { ...car, city: 'aswan' }, 'aswan', 'jeddah') > Math.ceil(straight('aswan', 'jeddah') / 60), 'أسوان ← جدة: الالتفاف حول البحر الأحمر يطيل البر (' + Math.round(E.routeLen('aswan', 'jeddah', false)) + ' مقابل ' + Math.round(straight('aswan', 'jeddah')) + ')');
ok(Math.abs(E.routeLen('riyadh', 'hail', false) - straight('riyadh', 'hail')) < 3, 'الرياض ← حائل يابسة متصلة فلا التفاف');
{ const t = E.newGame(4); A.learnSetChar(t, 'trader'); t.learn.level = 11; t.learn.abroad = true; t.phase = 3; t.player.gold = 60000; const c = t.player.caravans[0]; c.city = 'jeddah'; A.buyShip(t, 'jeddah');
  const sp = E.seaPlan(t, c, 'mumbai'), landD = E.tripDays(t, c, 'jeddah', 'mumbai'); ok(sp.ok && sp.days <= landD, 'جدة ← مومباي: البحر يعبر بحر العرب مباشرة ولا يتأخر عن البر (' + sp.days + ' مقابل ' + landD + ')');
  const k = { ...c, city: 'kolkata' }; ok(E.tripDays(t, { ...c, city: 'mumbai' }, 'mumbai', 'kolkata') < 12 && E.routeLen('kolkata', 'mumbai', true) > 2 * E.routeLen('kolkata', 'mumbai', false), 'مومباي ← كلكتا بحراً أطول كثيراً من البر لأن الهند يابسة متصلة'); }
// الفحص على صورة الخريطة: كل مقطع بري على اليابسة وكل مقطع بحري على الماء
try { const out = execFileSync('python3', ['scripts/gen-routes.py', '--check'], { cwd: require('path').join(__dirname, '..'), encoding: 'utf8', timeout: 120000 }); ok(/سليمة/.test(out), 'المسارات على اليابسة والماء كما في صورة الخريطة'); }
catch (e) { if (e.code === 'ENOENT' || /No module named/.test(String(e.stderr))) console.log('تخطّي فحص الصورة: بايثون أو Pillow غير متوفرين'); else ok(false, 'فحص الصورة: ' + String(e.stdout || e.stderr).slice(0, 300)); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
