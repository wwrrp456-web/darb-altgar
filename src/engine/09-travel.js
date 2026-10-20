/* ---------- رحلات ---------- */
function dist(S, a, b) { const A = S.cities[a], B = S.cities[b]; return Math.hypot(A.x - B.x, A.y - B.y); }
const navOf = car => (car.captain ? car.captain.nav : 0);
function tripDays(S, car, a, b) {
  const hu = herdUnits(car), sp = SPEED * perkMul(S, 'speed') * (1 + 0.06 * navOf(car)) * (1 - 0.03 * (car.carts - 1)) * (car.morale < 40 ? 0.85 : 1) * (1 + (mountOf(car) ? mountOf(car).speed : 0)) * (hu > 0 ? 1 - Math.min(0.25, 0.15 + 0.1 * hu / 100) : 1);
  return Math.max(1, Math.ceil(dist(S, a, b) / sp * shortMul(S, a, b)));
}
/* القطيع الماشي: مواشٍ تمشي مع القافلة ولا تأخذ مكاناً في الحمولة، يرعاها رعاة بأجر (راعٍ لكل 20 وحدة قطيع). يُبطئ القافلة ويزيد علفها ونفوقها أقل من الحمولة */
const HERD_PER = 20, MAX_HERDERS = 5, HERDER_WAGE = 6, HERDER_FEE = 40;
const herdOf = car => car.herd || (car.herd = {});
/* التكاثر: كل نوع من مواشي القطيع ذكور وإناث وصغار. دورة الولادة T يوماً بحجم L، ويكبر الصغير في M يوماً. على الطريق يُنتج نصف السرعة وبشرط أن تكون القافلة سائرة وغير جائعة */
const BREED = { chicken: { T: 8, L: 5, M: 20, fu: 0.1 }, duck: { T: 8, L: 5, M: 20, fu: 0.1 }, sheep: { T: 40, L: 1.2, M: 40, fu: 1 }, goat: { T: 40, L: 1.3, M: 40, fu: 1 }, cow: { T: 70, L: 1, M: 80, fu: 2 }, buffalo: { T: 75, L: 1, M: 80, fu: 2 }, camel: { T: 100, L: 1, M: 120, fu: 2 }, horse: { T: 90, L: 1, M: 100, fu: 2 } };
const YOUNG_VAL = 0.5, YOUNG_SELL = 0.5, ROAD_BREED = 0.5, ROAD_YMORT = 3;
// الأصناف ترث جداول النوع، معدّلة بسماتها: خصوبة ← حجم الولادة، لحم ← غلّة الذبح، لبن/صوف ← غلّة المزرعة
const spOf = g => GD[g].sp || g;
BREEDS.forEach(b => {
  const B0 = BREED[b.sp]; BREED[b.id] = Object.assign({}, B0, { L: B0.L * (0.7 + 0.1 * b.tr.fert) });
  if (MEAT[b.sp]) MEAT[b.id] = MEAT[b.sp] * (0.7 + 0.1 * b.tr.meat);
  if (PRODUCT[b.sp]) { const p0 = PRODUCT[b.sp]; PRODUCT[b.id] = [p0[0], p0[1] * (0.7 + 0.1 * b.tr[b.sp === 'sheep' ? 'wool' : 'milk']), p0[2]]; }
});
for (const sp in HYB_NAMES) { BREED[sp + '_h'] = Object.assign({}, BREED[sp]); if (MEAT[sp]) MEAT[sp + '_h'] = MEAT[sp]; if (PRODUCT[sp]) PRODUCT[sp + '_h'] = PRODUCT[sp].slice(); }
const NEUTRAL = { meat: 3, milk: 3, wool: 3, speed: 3, endu: 3, fert: 3 }, HYB_LV = 5;
const trHold = (h, g) => (GD[g].hyb ? ((h.hx || {})[g] || {}).tr || NEUTRAL : GD[g].br ? GD[g].br.tr : NEUTRAL);
const pfHold = (h, g) => (GD[g].hyb ? ((h.hx || {})[g] || {}).pf || 1 : GD[g].pf || 1);
const hyMul = (h, g, k) => (GD[g].hyb ? 0.7 + 0.1 * trHold(h, g)[k] : 1);
const hyPf = (h, g) => (GD[g].hyb ? pfHold(h, g) : 1);
const spoilMul = (h, g) => (GD[g].hyb ? 1.3 - 0.1 * trHold(h, g).endu : 1);
const hybOf = sp => sp + '_h';
const hybridOpen = S => { const L = S.learn; return !(L && L.char) || L.level >= HYB_LV; };
function hybMove(src, dst, dstTotal, n) {
  if (!src.tr) return; if (!dst.tr || dstTotal <= 0) { dst.tr = Object.assign({}, src.tr); dst.pf = src.pf; return; }
  BR_KEYS.forEach(k => dst.tr[k] = (dst.tr[k] * dstTotal + src.tr[k] * n) / (dstTotal + n)); dst.pf = (dst.pf * dstTotal + src.pf * n) / (dstTotal + n);
}
// صنف مغلق على اللاعب حتى يبلغ مستوى فتحه (من لا تعليم عنده: مفتوح)
const breedOpen = (S, g) => { const lv = GD[g].lv; if (!lv) return true; const L = S.learn; return !(L && L.char) || L.level >= lv; };
const hxOf = (h, g) => { h.hx = h.hx || {}; return h.hx[g] || (h.hx[g] = { m: Math.round(((h.herd || {})[g] || 0) * 0.25), y: 0, b: 0, mq: 1, fq: 1, yq: 1 }); };
// سلالة الخيل: نجوم 1–5 للذكور (mq) والإناث (fq) والصغار (yq)؛ السعر × (0.8 + 0.2 × النجوم). المهر = متوسط الأبوين + تحسّن (أكبر في إسطبل المزرعة)
const pedMul = q => 0.8 + 0.2 * q;
const pedOf = (h, g) => { const x = (h.hx || {})[g]; if (!x) return 1; const a = (h.herd || {})[g] || 0, m = Math.min(x.m, a), f = a - m; return a > 0 ? ((x.mq || 1) * m + (x.fq || 1) * f) / a : 1; };
const pedMulOf = (h, g) => (spOf(g) === 'horse' ? pedMul(pedOf(h, g)) : 1) * hyPf(h, g);
const youngOf = (h, g) => (((h.hx || {})[g] || {}).y || 0);
const malesOf = (h, g) => Math.min((h.herd || {})[g] || 0, ((h.hx || {})[g] || {}).m || 0);
function herdScale(h, g, before) { const x = (h.hx || {})[g]; if (x && before > 0) { const k = Math.max(0, (h.herd || {})[g] || 0) / before; x.m *= k; if (x.p) x.p *= k; } }
// الحمل: الحوامل x.p تلد بعد مدة حمل G (نصف دورة الولادة)، ثم تعود للتلقيح. عند الاستقرار تبقى معدلات الولادة كما كانت (إناث × الحجم ÷ الدورة)
const gestOf = g => BREED[g].T * 0.5;
const pregOf = (h, g) => Math.floor(Math.min(((h.hx || {})[g] || {}).p || 0, Math.max(0, ((h.herd || {})[g] || 0) - malesOf(h, g))));
const SEXF = { m: 1, f: 1, p: 1.35 }; // سعر الشراء بحسب الجنس: ذكر، أنثى، أنثى حامل
function herdAdd(h, g, n, before) { const x = hxOf(h, g); x.m += n >= 2 ? Math.max(1, Math.round(n * 0.25)) : 0; }
function breedStep(S, h, g, mul, room, per, ymort) {
  const B = BREED[g], x = hxOf(h, g), a = (h.herd || {})[g] || 0; if (!B) return 0;
  if (x.y > 0) {
    x.y -= x.y * GD[g].spoil * spoilMul(h, g) * 1.5 * (ymort || 1); const mat = x.y / B.M; x.y -= mat;
    if (spOf(g) === 'horse' && mat > 0) { const m0 = Math.min(x.m, a), f0 = a - m0, nm = mat * 0.5, yq = x.yq || 1; if (m0 + nm > 0) x.mq = ((x.mq || 1) * m0 + yq * nm) / (m0 + nm); if (f0 + nm > 0) x.fq = ((x.fq || 1) * f0 + yq * nm) / (f0 + nm); }
    h.herd[g] = a + mat; x.m += mat * 0.5;
  }
  const A = (h.herd || {})[g] || 0, m = Math.min(x.m, A), f = A - m; let born = 0;
  // التزاوج: ذكور صنف آخر من النوع نفسه يلقّحون إناث هذا الصنف فيُنتجون هجيناً
  const pg = (h.pair || {})[g], cross = !!(pg && pg !== g && GD[pg] && spOf(pg) === spOf(g) && ((h.herd || {})[pg] || 0) >= 1), mm = cross ? malesOf(h, pg) : m;
  const G = gestOf(g); x.p = Math.min(x.p || 0, f);
  if (mul > 0 && mm >= 1) x.p += Math.max(0, Math.min(f, mm * 6) - x.p) * mul / (B.T - G);
  if (x.p > 0 && mul > 0) { const bn = x.p / G; x.p -= bn; x.b += bn * B.L * hyMul(h, g, 'fert'); }
  if (x.b > 0) {
    const n = Math.min(Math.floor(x.b), per > 0 ? Math.max(0, Math.floor(room / per)) : 0);
    if (n >= 1) {
      if (cross) {
        const H = hybOf(spOf(g)), hx = hxOf(h, H), tF = trHold(h, g), tM = trHold(h, pg), t = {}, tot = ((h.herd || {})[H] || 0) + hx.y, pf = (pfHold(h, g) + pfHold(h, pg)) / 2 * 1.05;
        BR_KEYS.forEach(k => t[k] = Math.min(5, (tF[k] + tM[k]) / 2 + (k === 'endu' || k === 'fert' ? 0.5 : 0)));
        if (!hx.tr || tot <= 0) { hx.tr = t; hx.pf = pf; } else { BR_KEYS.forEach(k => hx.tr[k] = (hx.tr[k] * tot + t[k] * n) / (tot + n)); hx.pf = (hx.pf * tot + pf * n) / (tot + n); }
        h.herd[H] = h.herd[H] || 0; hx.y += n; hx.firstDay = hx.firstDay || (S.day || 1);
      } else {
        if (spOf(g) === 'horse') { const nq = Math.min(5, Math.max(1, ((x.mq || 1) + (x.fq || 1)) / 2 + (h.stable ? 0.2 : 0.05) * (0.5 + rnd(S)))); x.yq = ((x.yq || 1) * x.y + nq * n) / (x.y + n); }
        x.y += n;
      }
      x.b -= n; born = n; if (cross) achFlag(S, 'hybrid_first'); achFlag(S, 'first_birth');
    } else if (x.b > 3) x.b = 3;
  }
  return born;
}
const herdUnits = car => { let u = 0; for (const g in (car.herd || {})) u += ((car.herd[g] || 0) + 0.5 * youngOf(car, g)) * (GD[g].hu || 0); return u; };
const herdCap = car => (car.herders || 0) * HERD_PER;
const holdings = car => { const h = Object.assign({}, car.cargo); for (const g in (car.herd || {})) h[g] = (h[g] || 0) + car.herd[g] + YOUNG_VAL * youngOf(car, g); return h; };
// علف المواشي يدخل في مؤن الرحلة: قمح يومياً لكل رأس في الحمولة أو في القطيع
const fodderDay = car => { let f = 0; for (const g in car.cargo) if (GD[g].fod) f += (car.cargo[g] || 0) * GD[g].fod; if (car.herd) for (const g in car.herd) if (GD[g].fod) f += ((car.herd[g] || 0) + 0.5 * youngOf(car, g)) * GD[g].fod; return f; };
const supplyNeed = (car, days) => Math.ceil((car.crew * 0.12 + fodderDay(car)) * days);
const customsOf = (S, from, to, cargo) => (S.cities[from].country === S.cities[to].country ? 0 : CD[S.cities[to].country].customs * perkMul(S, 'customs') * valueOf(cargo) * (bossActive(S) && pactIn(S, to, 'alliance') ? 0.5 : 1));
function startTrip(S, car, dest) {
  if (car.left > 0) return { ok: false, msg: 'القافلة في الطريق' };
  { const tb = travelBlock(S, car, dest); if (tb) return { ok: false, msg: tb }; }
  { const sb = car.main ? shockBlock(S, car.city, dest) : null; if (sb) return { ok: false, msg: sb }; }
  if (dest === car.city) return { ok: false, msg: 'أنت في هذه المدينة' };
  const c = S.cities[car.city]; ctxFor(S, car.city);
  const days = tripDays(S, car, car.city, dest), need = supplyNeed(car, days), cost = need * unitPrice(c, 'wheat') * perkMul(S, 'prov');
  let prem = car.insured ? valueOf(holdings(car)) * TK.tripRate : 0;
  car.hungry = false;
  if (S.player.gold < cost + prem) {
    if (S.player.gold < cost * 0.3) return { ok: false, msg: 'رصيدك لا يكفي حتى لأقل مؤن (' + Math.ceil(cost * 0.3) + ')' };
    car.hungry = true; prem = 0; if (car.main) learnReact(S, 'hungry', 15);
  }
  pPay(S, 'provisions', Math.min(cost, S.player.gold), true);
  if (prem) tkContribute(S, pPay(S, 'takaful', prem));
  c.stock.wheat = Math.max(0, c.stock.wheat - need);
  car.supplies = need;
  car.from = car.city; car.dest = dest; car.left = days; car.total = days;
  return { ok: true, days, cost: Math.ceil(cost) };
}
/* قطاع الطرق: قتال بالدفاع مقابل قوة الجماعة B؛ الهزيمة تنهب 15–40٪ (أقل بالتأمين). في اللعبة البشرية يختار اللاعب الأسلوب (S.road) وإلا فالقتال الافتراضي */
const roadOn = S => !!(S.learn && S.learn.char && S.learn.level >= 3 && !S.noEvents);
const defenseOf = car => (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
function banditFight(S, car, to, B, defMul) {
  const defense = defenseOf(car) * defMul;
  if (defense >= B) { if (car.main) { news(S, 'صدّ حرّاسك قطاع طرق في الطريق إلى ' + S.cities[to].name + '!', 'good'); learnReact(S, 'banditsRepel', 30); } return { repelled: true }; }
  let f = rr(S, 0.15, 0.4) * perkMul(S, 'banditLoss');
  let lost = 0;
  for (const g in car.cargo) { const l = Math.floor(car.cargo[g] * f); car.cargo[g] -= l; lost += l * mid(g); }
  for (const g in (car.herd || {})) { const b0 = car.herd[g], l = Math.floor(b0 * f); car.herd[g] -= l; lost += l * mid(g); herdScale(car, g, b0); const x = (car.hx || {})[g]; if (x) x.y -= Math.floor(x.y * f); }
  car.morale = Math.max(0, car.morale - 15);
  const comp = car.insured ? tkClaim(S, lost, TK.cover) : 0;
  learnReact(S, 'bandits', 20); sink(S, 'bandits', lost); S.player.led.exp.bandits = (S.player.led.exp.bandits || 0) + lost;
  news(S, (car.main ? '' : car.name + ': ') + 'نهب قطاع الطرق نحو ' + Math.round(f * 100) + '٪ من البضاعة قرب ' + S.cities[to].name + '.', 'bad');
  S.pause = true; syncBasis(car);
  return { repelled: false, f, lost };
}
function arrive(S, car) {
  const to = car.dest; car.city = to; car.dest = null; car.trips++; S.player.trips++; ctxFor(S, to); learnArrive(S, car, to);
  const natH = capRole(car) === 'native' ? car.captain.home : null, cu = customsOf(S, car.from, to, holdings(car)) * (natH && S.cities[to].country === natH ? 0.7 : 1), val0 = valueOf(car.cargo);
  if (cu > 0) {
    let paid = pPay(S, 'customs', cu, true), short = cu - paid, seized = 0;
    for (const g in car.cargo) { if (short <= 0) break; const n = Math.min(Math.floor(car.cargo[g]), Math.ceil(short / mid(g))); if (n > 0) { car.cargo[g] -= n; short -= n * mid(g); seized += n * mid(g); } }
    const totCu = paid + seized; if (val0 > 0) for (const g in car.basis) car.basis[g].c += totCu * (car.basis[g].q * mid(g)) / val0;
    if (seized > 0) { sink(S, 'customs', seized); S.player.led.exp.customs = (S.player.led.exp.customs || 0) + seized; }
    if (car.main) news(S, 'جمارك ' + Math.round(paid + seized) + ' عند دخول ' + CD[S.cities[to].country].name + (seized > 0 ? ' (صودرت بضاعة لتغطية ما نقص من رصيدك)' : '') + '.', seized > 0 ? 'bad' : '');
  }
  const key = riskKey(car.from, to);
  const defense = (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
  const guarded = bossActive(S) && (pactIn(S, car.from, 'guard') || pactIn(S, to, 'guard'));
  const natMul = natH && (S.cities[car.from].country === natH || S.cities[to].country === natH) ? 0.8 : 1;
  if (capRole(car) === 'envoy') { const bs = S.bosses && S.bosses[to]; if (bs && bs.trust < 50 && S.day - (bs.envDay == null ? -99 : bs.envDay) >= 5) { bs.trust = Math.min(50, bs.trust + 1.5); bs.envDay = S.day; if (S.learn && S.learn.char) news(S, car.captain.name + ' مهّد لك عند ' + bs.name + ': زادت ثقته بك.', 'good'); } }
  if (!guarded && rnd(S) < S.risk[key] * natMul) {
    const B = rr(S, 4, 16);
    if (car.main && roadOn(S) && !S.road) { S.road = { k: 'bandits', day: S.day, car: car.id, to, from: car.from, B }; S.pause = true; learnReact(S, 'roadBandits'); }
    else banditFight(S, car, to, B, 1);
  }
  syncBasis(car); snapshotKnown(S, [to]);
  if (car.captain) { car.captain.xp++; if (car.captain.xp % 6 === 0) { const sk = ['trade', 'nav', 'combat'][Math.floor(rnd(S) * 3)]; if (car.captain[sk] < 5) car.captain[sk]++; } }
  if (car.main) { news(S, 'وصلت قافلتك إلى ' + S.cities[to].name + '.'); S.pause = true; }
}
function snapshotKnown(S, ids) {
  ids.forEach(id => {
    const c = S.cities[id], p = {}, st = {};
    GIDS.forEach(g => { p[g] = Math.round(unitPrice(c, g) * 10) / 10; st[g] = Math.round(c.stock[g]); });
    S.player.known[id] = { day: S.day, p, st };
  });
}

