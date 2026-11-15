/* ---------- 035د كفاءة التجارة والنقل: القادة والنوخذة والحرس والطاقم وشيخ القوافل والشهبندر ----------
   المعادلات حرفاً من specs/035-management-skill/spec-d.md §2–§3. لا rnd جديد، ولا تغيير في الأجور ولا الميزانيات.
   SKT.on=false (أو SKILL.on=false) ⇒ لا يُقرأ ولا يُكتب شيء والسلوك السابق حرفاً. كل حقل جديد اختياري في الحفظ:
   cp.sk.tr / cp.sk.pl0 / cp.sk.t1 / cp.sk.t2 (قائد/نوخذة)، و car.gx / car.cx { g, xp } (حرس/طاقم)، و P.cchief.sk.pl0 / P.portm.sk.pl0، و P.sktAsk (إشعارات الترقية). */
const SKT = {
  on: true,
  cap: { t1: 120, t2: 360, max: 6 },
  gx: { need: [0, 12, 40], safe: 1, repel: 3, cut: [0, 0.15, 0.15], pow: [1, 1, 1.10] },
  cx: { need: [0, 60, 200], moraleCut: [0, 0.25, 0.25], supplyCut: [0, 0, 0.10] },
  chief: { moraleMin: [50, 55, 60], idleDays: [7, 6, 5], restDays: [5, 5, 4] }, // شيخ القوافل: درجات 3 و4 و5
  portm: { noDealDays: [2, 2, 1], fixCool: [30, 24, 18] }, // الشهبندر: درجات 3 و4 و5
  names: { gx: ['حرس مستجدّ', 'حرس مجرَّب', 'حرس محنَّك'], cx: ['طاقم جديد', 'طاقم معتاد على الدرب', 'طاقم أهل الدرب'] },
  open: { gx: ['', 'ينقص النهب 15٪ بعد الهزيمة', 'يقوى دفاع الحرس 10٪'], cx: ['', 'يتعب أقل: معنويات الطريق 0.6 بدل 0.8 يومياً', 'يستهلك مؤناً أقل 10٪'] },
};
const sktOn = () => !!(SKT.on && SKILL.on);
const sktGradeOf = (need, xp) => { let g = 1; for (let i = 1; i < need.length; i++) if (xp >= need[i]) g = i + 1; return g; };
/* ---- القادة والنوخذة: طبقة فوق سقف 5 ---- */
function sktBonus(cp) { if (!sktOn() || !cp || !cp.sk) return 0; const t = cp.sk.tr || 0; return t >= SKT.cap.t2 ? 2 : t >= SKT.cap.t1 ? 1 : 0; }
function sktEff(cp, k) { const b = sktBonus(cp); return b ? Math.min(SKT.cap.max, cp[k] + b) : cp[k]; }
const sktNextKey = e => (e && e.rules && e.rules.rest && e.rules.rescue ? 'cchief' : e && e.rules && e.rules.dock ? 'portm' : null);
const sktRoleKey = (S, cp) => (S.player.ships || []).some(s => s.captain === cp) ? 'sail' : 'trade';
function sktCapGrow(S, car, seaTrip) {
  if (!sktOn()) return;
  const list = []; if (car.captain) list.push(car.captain);
  if (seaTrip) { const sh = (S.player.ships || []).find(x => x.id === seaTrip.ship); if (sh && sh.captain && sh.captain !== car.captain) list.push(sh.captain); }
  for (const cp of list) {
    if (!cp.sk) skMake(cp, 'a', skClamp(Math.round(((cp.trade || 1) + (cp.nav || 1) + (cp.combat || 1)) / 3), 1, 3), null, sktRoleKey(S, cp));
    const k = cp.sk, pl = car.pl || 0, net = pl - (k.pl0 != null ? k.pl0 : pl); // ربح القافلة منذ آخر وصول لهذا القائد؛ أول مرة 0
    k.tr = (k.tr || 0) + skM(net); k.pl0 = pl; // لا ينقص أبداً
    for (const [flag, th, name] of [['t1', SKT.cap.t1, 1], ['t2', SKT.cap.t2, 2]]) if (!k[flag] && k.tr >= th) { k[flag] = 1; news(S, 'ترقّى القائد ' + (cp.name || '') + ': صار بمهارته «فعّالاً» أعلى بدرجة بعد ' + Math.round(k.tr) + ' رحلة', 'good'); }
  }
}
/* ---- الحرس: خبرة الفرقة car.gx (فوق الرتب لا بدلها) ---- */
function sktGx(car) { if (!sktOn() || !car || !(car.guards > 0) || !car.gx) return 0; return sktGradeOf(SKT.gx.need, car.gx.xp || 0); }
const sktGxCut = car => { const g = sktGx(car); return g ? SKT.gx.cut[g - 1] : 0; };
const sktGxPow = car => { const g = sktGx(car); return g ? SKT.gx.pow[g - 1] : 1; };
function sktGxXp(S, car, n) {
  if (!sktOn() || !car || !(car.guards > 0)) return; const x = car.gx || (car.gx = { g: 1, xp: 0 }), g0 = sktGradeOf(SKT.gx.need, x.xp || 0);
  x.xp = (x.xp || 0) + n; x.g = sktGradeOf(SKT.gx.need, x.xp); if (S && x.g > g0) sktPromote(S, 'gx:' + car.id, 'ترقّت خبرة حرس ' + car.name + ' إلى «' + SKT.names.gx[x.g - 1] + '»: ' + SKT.open.gx[x.g - 1] + '.', car.id);
}
/* ---- الطاقم: خبرة car.cx (معنويات ومؤن) ---- */
function sktCx(car) { if (!sktOn() || !car || !(car.crew >= 1) || !car.cx) return 0; return sktGradeOf(SKT.cx.need, car.cx.xp || 0); }
const sktCxMoraleMul = car => { const g = sktCx(car); return g ? 1 - SKT.cx.moraleCut[g - 1] : 1; };
const sktCxSupplyMul = car => { const g = sktCx(car); return g ? 1 - SKT.cx.supplyCut[g - 1] : 1; };
function sktCxGrow(S, car) {
  if (!sktOn() || !car || !(car.crew >= 1)) return; const x = car.cx || (car.cx = { g: 1, xp: 0 }), g0 = sktGradeOf(SKT.cx.need, x.xp || 0);
  x.xp = (x.xp || 0) + 1; x.g = sktGradeOf(SKT.cx.need, x.xp); if (x.g > g0) sktPromote(S, 'cx:' + car.id, 'ترقّت خبرة طاقم ' + car.name + ' إلى «' + SKT.names.cx[x.g - 1] + '»: ' + SKT.open.cx[x.g - 1] + '.', car.id);
}
/* ---- شيخ القوافل والشهبندر: عتبات بالدرجة (3 = اليوم حرفاً) ---- */
function sktChiefT(S, key) { const D = S && S.player && S.player.cchief, v = CHIEFC[key]; if (!sktOn() || !D || !D.sk || !SKT.chief[key] || D.sk.g < 4) return v; return SKT.chief[key][Math.min(5, D.sk.g) - 3]; }
function sktPortmT(S, key) { const D = S && S.player && S.player.portm, v = PORTM[key]; if (!sktOn() || !D || !D.sk || !SKT.portm[key] || D.sk.g < 4) return v; return SKT.portm[key][Math.min(5, D.sk.g) - 3]; }
/* ---- إشعار الترقية «المطلوب» معلوماتي لمرة واحدة، وخبر ---- */
function sktPromote(S, key, text, car) {
  const P = S.player, L = P.sktAsk = Array.isArray(P.sktAsk) ? P.sktAsk : []; news(S, text, 'good');
  if (L.some(x => x.key === key && x.day === S.day)) return; L.unshift({ key, day: S.day, text, car: car != null ? car : null }); if (L.length > 6) L.length = 6;
}
function sktDay(S) {
  if (!sktOn() || !S.player) return; const P = S.player;
  for (const [role, D, cars, home] of [['cchief', P.cchief, () => ccCars(S), 'trade'], ['portm', P.portm, () => pmLines(S), 'sail']]) {
    if (!D) continue; if (!D.sk) skMake(D, 'a', 3, null, home);
    if (S.day % 7 === 0) { // نمو أسبوعي بنتيجة قوافلهما فقط (قوافل القادة / قوافل الخطوط البحرية)
      const cs = cars(), tot = cs.reduce((s, c) => s + (c.pl || 0), 0), net = cs.length ? tot - (D.sk.pl0 != null ? D.sk.pl0 : tot) : 0;
      D.sk.m = skM(net); D.sk.pl0 = tot; D.sk.wk = 0;
    }
    const g0 = D.sk.g; skGrow(D, 'a', D.sk.m || 1, S, null);
    if (D.sk.g > g0) sktPromote(S, role + ':' + D.sk.g, (role === 'cchief' ? 'ترقّى شيخ القوافل إلى «' : 'ترقّى الشهبندر إلى «') + SKILL.grades.a[D.sk.g - 1] + '»: يتدخل ' + (role === 'cchief' ? 'أبكر ببعض الحالات (معنويات القادة وأيام الوقوف).' : 'أبكر في الخطوط (انتظار أقل وتعزيز أبكر).'), null);
  }
}
/* ما تعرضه الواجهة: يُحسب هنا لتبقى الواجهة بلا منطق */
function sktView(S, car) {
  if (!sktOn() || !car) return null; const gx = sktGx(car), cx = sktCx(car), cp = car.captain, eff = cp ? ['trade', 'nav', 'combat'].map(k => ({ k, raw: cp[k], eff: sktEff(cp, k) })) : null;
  const tr = cp && cp.sk ? cp.sk.tr || 0 : 0, nextTr = tr >= SKT.cap.t2 ? null : tr >= SKT.cap.t1 ? SKT.cap.t2 : SKT.cap.t1;
  const bar = (xp, need, g) => ({ g, xp: Math.round(xp * 10) / 10, need: need[g] == null ? null : need[g], prev: need[g - 1] });
  return {
    cp: cp ? { eff, tr: Math.round(tr * 10) / 10, nextTr, bonus: sktBonus(cp) } : null,
    gx: car.guards > 0 ? Object.assign({ name: SKT.names.gx[Math.max(1, gx) - 1], opens: SKT.open.gx[Math.max(1, gx) - 1], cut: sktGxCut(car) }, bar((car.gx || { xp: 0 }).xp || 0, SKT.gx.need, Math.max(1, gx))) : null,
    cx: car.crew >= 1 ? Object.assign({ name: SKT.names.cx[Math.max(1, cx) - 1], opens: SKT.open.cx[Math.max(1, cx) - 1] }, bar((car.cx || { xp: 0 }).xp || 0, SKT.cx.need, Math.max(1, cx))) : null,
  };
}
/* «افتح بطاقته»: يُغلق إشعار الترقية المعلوماتي (مرة واحدة) */
Object.assign(A, { sktSeen(S, key) { const L = S.player.sktAsk; if (!Array.isArray(L)) return NO('لا إشعار'); const i = L.findIndex(x => x.key === key); if (i < 0) return NO('لا إشعار'); L.splice(i, 1); if (!L.length) delete S.player.sktAsk; return OK('تم'); } });
