/* ---------- إيقاع السفر (عرض فقط: أيام العالم والاقتصاد كما هي) ----------
   زمن الانتظار الفعلي للرحلة بالثواني يتبع المسافة، و«مؤن السفر» اختيارية تختصره. لا RNG هنا. */
const PACE = { base: 12, perDist: 0.055, min: 15, max: 50, seaMin: 10, packBase: 8, lv: [{ id: 0, name: 'عادي', cut: 0, rate: 0 }, { id: 1, name: 'سريع', cut: 0.2, rate: 0.5 }, { id: 2, name: 'أسرع', cut: 0.35, rate: 1.2 }] };
const cityHash = id => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973; return h / 9973; };
const landSec = (S, a, b) => clamp(PACE.base + PACE.perDist * dist(S, a, b), PACE.min, PACE.max);
// البحر أسرع من البر على الدرب نفسه بنسبة أيامه، فيبقى زمن اليوم الواحد كما في البر
function paceSec(S, car, a, b, days, sea) { const ls = landSec(S, a, b); return sea ? clamp(ls * days / Math.max(1, tripDays(S, car, a, b)), PACE.seaMin, PACE.max * 1.2) : ls; }
const packPrice = (S, cityId) => Math.round(PACE.packBase * (0.9 + 0.2 * cityHash(cityId)));
const packUnits = (lv, days, cap) => (lv ? Math.ceil(PACE.lv[lv].rate * days * (0.75 + 0.25 * cap / 100)) : 0);
function paceQuote(S, car, dest, sea) {
  let days, cap;
  if (sea) { const p = seaPlan(S, car, dest); if (!p.ok) return null; days = p.days; cap = p.cap; } else { days = tripDays(S, car, car.city, dest); cap = capOfCar(car); }
  const sec = paceSec(S, car, car.city, dest, days, sea), price = packPrice(S, car.city), have = car.pack || 0;
  return { days, sec: Math.round(sec), price, have, lv: PACE.lv.map(L => { const u = packUnits(L.id, days, cap), miss = Math.max(0, u - have); return { id: L.id, name: L.name, units: u, sec: Math.round(sec * (1 - L.cut)), miss, cost: miss * price }; }) };
}
// عند الانطلاق: يشتري الناقص من مؤن السفر إن أمكن (وإلا ينزل لأعلى مستوى يقدر عليه) ويحفظ زمن الانتظار على القافلة الرئيسية
function applyPace(S, car, days, sec, lv, cap) {
  car.pace = null; if (!car.main) return;
  const price = packPrice(S, car.city); let L = Math.max(0, Math.min(2, lv | 0));
  while (L > 0 && Math.max(0, packUnits(L, days, cap) - (car.pack || 0)) * price > S.player.gold) L--;
  const u = packUnits(L, days, cap), miss = Math.max(0, u - (car.pack || 0));
  if (miss) { pPay(S, 'packs', miss * price, true); car.pack = (car.pack || 0) + miss; }
  car.pack = (car.pack || 0) - u;
  const secF = Math.round(sec * (1 - PACE.lv[L].cut));
  car.pace = { lv: L, units: u, sec0: Math.round(sec), sec: secF, ms: Math.round(secF * 1000 / Math.max(1, days)), day: S.day };
  if (L > 0) car.morale = Math.min(100, car.morale + 4);
}
