/* ---------- السيولة (040و): المال في الوديعة ملكك فيتحرك لسداد التزاماتك ضمن سياسة P.liq (اختيارية؛ الغائب = الافتراضي) ----------
   cover: عجز النقد عن التزام يُسحب من الودائع (الأقل ازدهاراً أولاً) برسم FIN.mud.fee عبر A.divest؛ monthMax: حد السحب التلقائي شهرياً نسبةً من الودائع؛ payout: أرباح المضاربة تصل النقد شهرياً.
   LIQ.on=false يعيد السلوك السابق حرفياً ولا يكتب حقلاً في الحفظ. */
const LIQ = { on: true, fee: FIN.mud.fee, monthMax: 0.4, warnDays: 7, horizon: 14, logMax: 40, month: 30 };
const liqOn = S => !!(LIQ.on && S && S.learn && S.learn.char && S.player && S.player.bank);
const liqPol = S => { const p = S.player.liq || {}; return { cover: p.cover !== false, monthMax: p.monthMax != null ? p.monthMax : LIQ.monthMax, payout: !!p.payout }; };
const liqDepTotal = S => Object.values(S.player.bank.dep).reduce((a, b) => a + (b > 0 ? b : 0), 0);
const liqProsp = c => clamp(((c.pop[2] + c.pop[3]) / popTotal(c)) * 2 * 0.5 + c.sat.food * 0.5, 0, 1);
// الودائع من الأقل عائداً (ازدهاراً) فالأعلى
const liqDeposits = S => Object.keys(S.player.bank.dep).filter(id => S.cities[id] && S.player.bank.dep[id] > 0).map(id => ({ city: id, amt: S.player.bank.dep[id], rate: liqProsp(S.cities[id]) })).sort((a, b) => a.rate - b.rate);
function liqMonth(S) { const m = Math.floor(S.day / LIQ.month), q = S.player.liqM, st = q && q.m === m ? q : { m, used: 0, base: liqDepTotal(S) }; return { m, used: st.used, base: st.base, cap: liqPol(S).monthMax * st.base, rem: Math.max(0, liqPol(S).monthMax * st.base - st.used) }; }
// التزامات الأيام القادمة: احتياطي التشغيل (14 يوماً من المصاريف الثابتة) + المتأخرات المسجلة
const liqDues = S => (S.paymentDues || []).reduce((a, d) => a + (d.amount > 0 ? d.amount : 0), 0);
const liqNeed14 = S => operatingReserve(S) + liqDues(S);
function liqView(S) {
  if (!liqOn(S)) return null; const P = S.player, pol = liqPol(S), m = liqMonth(S), dep = liqDepTotal(S), daily = P.fixedEma || 0, cash = P.wallet.sar, dues = liqDues(S), need = liqNeed14(S);
  return { cash, dep, depNet: dep * (1 - LIQ.fee), daily, days: daily > 0 ? cash / daily : Infinity, need, dues, pol, month: m, log: P.liqLog || [], low: daily > 0 && cash / daily < LIQ.warnDays && dep > 0, deposits: liqDeposits(S), diwan: S.player.diwan ? S.player.diwan.box : null };
}
function liqAlert(S, text) { const st = S.player.liqM || (S.player.liqM = { m: Math.floor(S.day / LIQ.month), used: 0, base: liqDepTotal(S) }); if (st.alert != null && S.day - st.alert < LIQ.month) return; st.alert = S.day; news(S, text, 'bad'); }
// يسحب من الودائع نقداً صافياً حتى need (بحد monthMax)؛ dest 'cash' (الافتراضي) أو 'box' (خزينة الديوان). يُرجع الصافي المحصَّل
function liqCover(S, need, why, dest) {
  if (!liqOn(S) || !(need > 1e-9) || S.ctxCur !== 'sar') return 0; const P = S.player, pol = liqPol(S); if (!pol.cover && why !== 'diwan') return 0;
  const mo = liqMonth(S); let rem = mo.rem, left = need, got = 0, used = mo.used; const f = LIQ.fee;
  for (const d of liqDeposits(S)) {
    if (left <= 1e-9 || rem <= 1e-9) break; const g = Math.min(d.amt, rem, left / (1 - f)); if (!(g > 0)) continue;
    const dep0 = P.bank.dep[d.city], r = A.divest(S, d.city, g); if (!r.ok) continue; const taken = dep0 - (P.bank.dep[d.city] || 0), fee = taken * f, net = taken - fee;
    got += net; left -= net; rem -= taken; used += taken; P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) - fee;
    (P.liqLog || (P.liqLog = [])).push({ d: S.day, why, city: d.city, amt: taken, fee }); while (P.liqLog.length > LIQ.logMax) P.liqLog.shift();
  }
  if (got > 0 || used !== mo.used) { const old = P.liqM && P.liqM.m === mo.m ? P.liqM : null; P.liqM = { m: mo.m, used, base: mo.base, alert: old ? old.alert : undefined }; if (P.liqM.alert === undefined) delete P.liqM.alert; }
  if (left > 1e-6 && rem <= 1e-9 && liqDepTotal(S) > 0) liqAlert(S, 'بلغ سحب السيولة التلقائي حدّه الشهري (' + Math.round(pol.monthMax * 100) + '٪ من الودائع) وبقي التزام دون تغطية: ارفع الحدّ من بطاقة السيولة أو اسحب بنفسك.');
  if (dest === 'box' && got > 0 && P.diwan) { P.wallet.sar -= got; P.diwan.box += got; }
  return got;
}
// أرباح المضاربة إلى النقد شهرياً بدل الوديعة (payout): تجمع في liqAcc وتُودَع في النقد كل 30 يوماً (أو فور إيقاف الخيار)
const liqPayout = S => liqOn(S) && liqPol(S).payout;
function liqPayoutDay(S) { const P = S.player; if (!(P.liqAcc > 0) || !liqOn(S)) return; if (S.day % LIQ.month === 0 || !liqPol(S).payout) { P.wallet.sar += P.liqAcc; P.liqAcc = 0; } }
Object.assign(A, {
  liqSet(S, key, val) {
    if (!liqOn(S)) return NO('غير متاح.'); const P = S.player; if (!['cover', 'monthMax', 'payout'].includes(key)) return NO('خيار غير معروف.');
    if (key === 'monthMax') { val = +val; if (!(val >= 0 && val <= 1)) return NO('الحد من 0 إلى 100٪.'); val = Math.round(val * 100) / 100; } else val = !!val;
    (P.liq || (P.liq = {}))[key] = val; return OK(key === 'cover' ? (val ? 'السحب التلقائي لسداد التزاماتك مفعّل.' : 'السحب التلقائي موقوف.') : key === 'payout' ? (val ? 'أرباح مضاربتك تصل نقدك شهرياً.' : 'أرباح مضاربتك تعود إلى الوديعة.') : 'حدّ السحب التلقائي الشهري ' + Math.round(val * 100) + '٪ من الودائع.');
  },
  liqDraw(S, city, amt) { // سحب يدوي مقترح من بطاقة السيولة: بلا حدّ شهري (حريتك)، برسم الوديعة نفسه ويُسجَّل
    if (!liqOn(S)) return NO('غير متاح.'); const P = S.player, d = P.bank.dep[city] || 0; amt = Math.min(+amt, d); if (!(amt > 0)) return NO('لا رصيد في هذه الوديعة.');
    const r = A.divest(S, city, amt); if (!r.ok) return r; const fee = amt * LIQ.fee; P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) - fee;
    (P.liqLog || (P.liqLog = [])).push({ d: S.day, why: 'manual', city, amt, fee }); while (P.liqLog.length > LIQ.logMax) P.liqLog.shift(); return r;
  }
});
