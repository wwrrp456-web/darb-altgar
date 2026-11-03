/* ---------- رتب حرّاس القوافل وخطر الطريق المتدرّج (019، ملاحظة بن محمود 17) ----------
   لا تتغير نسبة النهب (15–40٪) ولا احتمال الهجوم ولا خسائر القوافل الصغيرة؛ ما يتغير القوة المطلوبة للصد:
   (1) رتب: حارس (دفاع 1.5) · متمرّس (2.5) · رئيس الحرس (4، واحد لكل قافلة ويرفع المعنويات الفعلية +10)؛ الأجر ×1 و×1.5 و×2.5.
       الترقية مجاناً بعد خدمة رحلات محروسة بلا هزيمة (6 ثم 12) أو بالدفع (500 ثم 1500 ريال). الحقل الاختياري car.gr = { v, c, svc }.
   (2) قوة العصابة B تُضرب في معامل بقيمة الحمولة: 1 + 0.15 × log2(القيمة ÷ 5000) بين 1 و1.6؛ فقيمة ≤ 5000 بلا تغيير. السحب العشوائي نفسه (rr مرة واحدة) فلا يتغير مسار العشوائية.
   مفتاحا الرجوع: GUARDS.ranks وGUARDS.scale؛ مطفآن ⇒ السلوك القديم حرفياً. */
const GUARDS = { ranks: true, scale: true };
const GR = { def: [1.5, 2.5, 4], wage: [1, 1.5, 2.5], fee: [500, 1500], svc: [6, 12], chiefMorale: 10, V0: 5000, k: 0.15, cap: 1.6 };
const GR_NAMES = ['حارس', 'حارس متمرّس', 'رئيس الحرس'];
function gRanks(car) { const n = car.guards || 0; if (!GUARDS.ranks || !car.gr) return { n, v: 0, c: 0, p: n }; const c = Math.min(n, car.gr.c || 0), v = Math.min(n - c, car.gr.v || 0); return { n, v, c, p: n - v - c }; }
function guardPower(car) { const r = gRanks(car); return r.p * GR.def[0] + r.v * GR.def[1] + r.c * GR.def[2]; }
const guardWageUnits = car => { const r = gRanks(car); return r.p * GR.wage[0] + r.v * GR.wage[1] + r.c * GR.wage[2]; };
const guardMorale = car => GUARDS.ranks && gRanks(car).c ? Math.min(100, car.morale + GR.chiefMorale) : car.morale;
// قوة العصابة بقدر الغنيمة (لوغاريتمياً بسقف)
function banditScale(car, extra) { if (!GUARDS.scale) return 1; const V = valueOf(holdings(car)) + (extra || 0); return V <= GR.V0 ? 1 : Math.min(GR.cap, 1 + GR.k * Math.log2(V / GR.V0)); }
// خدمة الرحلات: تُحسب للقوافل المحروسة عند الوصول سالمة، وتُصفَّر بالهزيمة
function guardServed(car) { if (!GUARDS.ranks || !(car.guards > 0)) return; const g = car.gr || (car.gr = { v: 0, c: 0, svc: 0 }); g.svc = (g.svc || 0) + 1; }
function guardDefeat(car) { if (car.gr) car.gr.svc = 0; }
// تقدير الطريق للجميع: مستوى الخطر وقوة الدفاع مقابل المتوقع، وأثر الأمن والخانات (015 و016)
function roadEstimate(S, car, dest, extra) {
  if (!car || !S.cities[dest]) return null; const from = car.left > 0 ? car.from : car.city, key = riskKey(from, dest), guarded = bossActive(S) && (pactIn(S, from, 'guard') || pactIn(S, dest, 'guard'));
  const raw = (S.risk[key] || 0) * sacredMul(S, from, dest) * climateRisk(S, 'trade', dest), secMul = projectMul(S, 'risk', { from, to: dest }), attack = guarded ? 0 : raw * secMul;
  const m = banditScale(car, extra), lo = 4 * m, hi = 16 * m, D = defenseOf(car), pDef = Math.max(0, Math.min(1, (hi - D) / (hi - lo))), loss = attack * pDef;
  return { attack, loss, level: loss < 0.04 ? 0 : loss < 0.12 ? 1 : 2, defense: D, lo, hi, scale: m, secMul, guarded, repel: 1 - pDef };
}
A.promoteGuard = function (S, carId, to) {
  if (!GUARDS.ranks) return NO('الرتب غير متاحة الآن'); const car = carById(S, carId); if (!car) return NO('لا قافلة'); if (car.left > 0) return NO('رقِّ الحراس والقافلة واقفة');
  const r = gRanks(car), g = car.gr || (car.gr = { v: 0, c: 0, svc: 0 }), svc = g.svc || 0;
  if (to === 'vet') { if (r.p < 1) return NO('لا حارس عادي ليُرقّى'); const free = svc >= GR.svc[0]; if (!free) { if (S.player.gold < GR.fee[0]) return NO('الترقية بالدفع تحتاج ' + GR.fee[0] + ' ريال'); pPay(S, 'hiring', GR.fee[0], true); } g.v = r.v + 1; g.svc = 0; return OK('رُقّي حارس إلى «' + GR_NAMES[1] + '» ' + (free ? 'بخدمته' : 'بـ ' + GR.fee[0] + ' ريال') + ': دفاعه ' + GR.def[1] + ' وأجره ×' + GR.wage[1] + '.'); }
  if (to === 'chief') { if (r.c >= 1) return NO('للقافلة رئيس حرس واحد'); if (r.v < 1) return NO('يُرقّى رئيس الحرس من الحرّاس المتمرّسين'); const free = svc >= GR.svc[1]; if (!free) { if (S.player.gold < GR.fee[1]) return NO('الترقية بالدفع تحتاج ' + GR.fee[1] + ' ريال'); pPay(S, 'hiring', GR.fee[1], true); } g.v = r.v - 1; g.c = 1; g.svc = 0; return OK('رُقّي حارس متمرّس إلى «' + GR_NAMES[2] + '» ' + (free ? 'بخدمته' : 'بـ ' + GR.fee[1] + ' ريال') + ': دفاعه ' + GR.def[2] + ' ويرفع معنويات القافلة، وأجره ×' + GR.wage[2] + '.'); }
  return NO('رتبة غير معروفة');
};
function guardView(S, car) { const r = gRanks(car), g = car.gr || {}, svc = g.svc || 0; return { on: GUARDS.ranks, r, names: GR_NAMES, svc, vetFree: svc >= GR.svc[0], chiefFree: svc >= GR.svc[1], need: GR.svc, fee: GR.fee, power: guardPower(car), defense: defenseOf(car), unitWage: WAGE.guard, wageUnits: guardWageUnits(car), canVet: r.p >= 1 && car.left === 0, canChief: r.c < 1 && r.v >= 1 && car.left === 0, scale: banditScale(car) }; }
