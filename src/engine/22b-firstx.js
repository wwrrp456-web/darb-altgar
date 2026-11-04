/* ---------- تجربة البداية (032؛ ملاحظة بن محمود 26، قرارات 2026-11-04 البنود 1–8): specs/032-first-experience ----------
   مفتاح رجوع لكل تغيير في FIRSTX؛ كلها لا تعمل إلا مع شخصية مختارة (ftxOn)، وإطفاؤها يعيد السلوك السابق حرفياً.
   road: لا نهب ولا عاصفة (برية أو بحرية أو رملية) قبل تجاوز مرحلة التعلّم 4 (FIRSTX.stage=5)، وأول خسارة نحو 10٪، وتنبيه عمّ سالم قبل الطريق الخطر.
   summary: ملخص الرحلة (car.plan عند الانطلاق، وS.tripSum عند الوصول). moment: بطاقة كبير السوق عند الوصول نفسه (L.moment) وتنظيف البطاقات المتقادمة (L.fx).
   follow/sellAll/hint/name/load/skip: تغييرات واجهة (src/ui). الحقول اختيارية: L.fx، car.plan، S.tripSum. */
const FIRSTX = { road: true, stage: 5, firstLoss: 0.10, summary: true, moment: true, follow: true, sellAll: true, hint: true, name: true, load: true, skip: true, staleDays: 3 };
const ftxOn = (S, k) => !!(FIRSTX[k] && S && S.learn && S.learn.char);
const ftxStageNo = S => { const L = S.learn; return L.ageStages ? (L.stage || 1) : (L.level || 1); };
const ftxRoadOpen = S => !ftxOn(S, 'road') || ftxStageNo(S) >= FIRSTX.stage;
function ftxFirstLoss(S, car, f) {
  if (!ftxOn(S, 'road') || !car.main) return f; const L = S.learn, X = L.fx || (L.fx = {}); if (X.loss != null) return f;
  X.loss = S.day; return FIRSTX.firstLoss;
}
// تنبيه عمّ سالم قبل الانطلاق في طريق خطر (قرار لا مفاجأة)
function ftxRoadWarn(S, car, dest) {
  if (!ftxOn(S, 'road') || !ftxRoadOpen(S)) return null; const e = roadEstimate(S, car, dest); if (!e || e.guarded || e.level < 2) return null;
  return { level: e.level, text: 'هذا الطريق خطر على بضاعتك: قد يُنهب منها. القرار لك: قوِّ حراسك، أو احمل أقل، أو اختر طريقاً أهدأ.' };
}
const FX_COST_KEYS = { provisions: 'نفقة الطريق', wages: 'أجور الرحلة', wear: 'استهلاك العربات', customs: 'جمارك', bandits: 'نهب في الطريق', storm: 'عاصفة' };
// عند الانطلاق: الربح المتوقع للوجهة المختارة (ما تعرضه اللعبة قبل السفر) ولقطة من دفتر المصروفات
function ftxTripStart(S, car, dest) {
  if (!ftxOn(S, 'summary') || !car.main) return; let exp = 0;
  for (const g of GIDS) { const q = Math.floor(car.cargo[g] || 0); if (q < 1) continue; const o = sellOptions(S, car.city, g, q, avgCost(car.basis, g) || mid(g), car).find(x => x.city === dest); if (o) exp += o.profit; }
  car.plan = { day: S.day, from: car.city, to: dest, exp: Math.round(exp), led0: Object.assign({}, S.player.led.exp) };
}
// عند الوصول: ما كلّفته الرحلة فعلاً بالريال (فروق الدفتر)
function ftxTripArrive(S, car) {
  if (!ftxOn(S, 'summary') || !car.main || !car.plan) return; const p = car.plan;
  S.tripSum = { day: S.day, from: p.from, to: p.to, exp: p.exp, led0: p.led0 }; car.plan = null;
}
const ftxParts = (S, led0) => { const parts = []; for (const k in FX_COST_KEYS) { const d = (S.player.led.exp[k] || 0) - (led0[k] || 0); if (d >= 0.5) parts.push({ k, label: FX_COST_KEYS[k], amt: Math.round(d) }); } return parts; };
// للواجهة: الملخص مع الفعلي من سجل الصفقات منذ الوصول
function ftxTripView(S) {
  const T = S.tripSum; if (!T || !ftxOn(S, 'summary')) return null;
  const sells = S.player.trades.filter(t => t.side === 'sell' && t.day >= T.day && t.city === T.to), actual = sells.reduce((a, t) => a + t.pl, 0), parts = ftxParts(S, T.led0);
  return { from: T.from, to: T.to, exp: T.exp, parts, sold: sells.length > 0, actual: Math.round(actual) };
}
// البطاقة في لحظتها: عند الوصول يُحدَّد المكان؛ والتحية المتقادمة تُحذف، وبقية البطاقات تُوسَم بالتقادم
function ftxMoment(S, to) { if (ftxOn(S, 'moment')) { const L = S.learn; (L.fx || (L.fx = {})).moment = { c: to, day: S.day }; } }
function ftxMomentBoss(S, at) {
  if (!ftxOn(S, 'moment')) return null; const L = S.learn, m = L.fx && L.fx.moment; if (!m || m.c !== at || S.day - m.day > 2) return null;
  const b = (L.bq || []).find(x => x.c === at); return b ? { c: b.c, n: b.n } : null;
}
function ftxDay(S) {
  if (!ftxOn(S, 'moment')) return; const L = S.learn; if (!L.bq || !L.bq.length) return; const X = L.fx || (L.fx = {}), seen = X.seen || (X.seen = {}), here = mainCar(S).city;
  L.bq = L.bq.filter(b => { const k = b.c + ':' + b.n; if (seen[k] == null) seen[k] = S.day; const old = S.day - seen[k] > FIRSTX.staleDays && b.c !== here; if (old && b.n === 1) { delete seen[k]; return false; } if (old) b.stale = true; return true; });
}
