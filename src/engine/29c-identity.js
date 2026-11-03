/* ---------- هويات اللعب (WP-24، المقترح المعتمد docs/identities/PROPOSAL.md): لكل شخصية هدف جانبي اختياري ومزية ظاهرة تعمل بمعلومة لا بنسبة خفية.
   النسب الحالية في CHARS لا تُمس. الجائزة نفوذ وخبرة بلا ذهب (bonusAward، مرة واحدة). الحقل الاختياري L.idGoal = { c, n, done, ... }.
   مفتاحا الرجوع: IDENTITY.goals (لا هدف ولا حقل) وIDENTITY.perks (لا مزايا ولا سجل دكاكين)؛ إطفاؤهما يعيد السلوك القديم حرفياً ---------- */
const IDENTITY = { goals: true, perks: true };
const ID_REWARD = { infl: 30, xp: 12 }, ID_FX_DAYS = 14, ID_SHOP_DAYS = 30, ID_LOG = 30;
const ID_DEF = {
  trader: { goal: { id: 'map', name: 'ابنِ خريطتك', text: 'زُر 8 مدن في 3 دول', need: 8, countries: 3 }, perk: { name: 'عين الطريق', text: 'سعر اليوم لسلعة تختارها في أي مدينة زرتَها، من شاشة الخريطة' } },
  changer: { goal: { id: 'fx', name: 'ربح الصرف', text: 'أعد عملة حوّلتَها خلال 14 يوماً وعندك أكثر مما بدأت، 3 مرات', need: 3 }, perk: { name: 'بوصلة الصرف', text: 'اتجاه الدولار والذهب غداً في شاشة الصرافة: اتجاه متوقع لا ضمان' } },
  leader: { goal: { id: 'road', name: 'الدرب الآمن', text: 'أكمل 10 رحلات متتالية بلا خسارة بضاعة من النهب', need: 10 }, perk: { name: 'تقدير الطريق', text: 'نسبة خطر قطاع الطرق على كل مسار قبل الانطلاق' } },
  shopkeeper: { goal: { id: 'shops', name: 'دكانان رابحان', text: 'دكانان في مدينتك صافي كل منهما موجب خلال 30 يوماً', need: 2 }, perk: { name: 'دفتر الدكان', text: 'صافي كل دكان اليوم والأسبوع على بطاقة الدكان' } },
  negotiator: { goal: { id: 'haggle', name: 'سيد المساومة', text: 'انتزع خصماً في 3 مساومات متتالية', need: 3 }, perk: { name: 'قراءة الطبع', text: 'مزاج الجولة القادمة في المساومة قبل أن تختار' } },
};
const idOn = S => !!(S && S.learn && S.learn.char && ID_DEF[S.learn.char]);
function idg(S) { if (!IDENTITY.goals || !idOn(S)) return null; const L = S.learn; if (!L.idGoal || L.idGoal.c !== L.char) L.idGoal = { c: L.char, n: 0, done: null }; return L.idGoal; }
const idPerk = (S, c) => IDENTITY.perks && idOn(S) && S.learn.char === c;
function idDone(S) { const g = idg(S); if (!g || g.done != null) return; g.done = S.day; g.n = ID_DEF[g.c].goal.need; bonusAward(S, 'identity:' + g.c, ID_REWARD.infl, ID_REWARD.xp, 'أتممتَ هدف «' + ID_DEF[g.c].goal.name + '»: نفوذ وخبرة إضافيان'); }
function idBump(S, n) { const g = idg(S); if (!g || g.done != null) return; g.n = n; if (g.n >= ID_DEF[g.c].goal.need) idDone(S); }
// التاجر المتجول: مدن مزورة (L.cv) ودولها
function idArrive(S) {
  const g = idg(S); if (!g || g.c !== 'trader' || g.done != null) return; const L = S.learn, vis = Object.keys(L.cv || {}).filter(id => L.cv[id] > 0 && S.cities[id]), cc = new Set(vis.map(id => S.cities[id].country));
  g.n = Math.min(vis.length, ID_DEF.trader.goal.need); g.cc = cc.size; if (vis.length >= ID_DEF.trader.goal.need && cc.size >= ID_DEF.trader.goal.countries) idDone(S);
}
// الصرّاف: دورة = تحويل ثم إعادة إلى العملة الأصلية خلال 14 يوماً بما يزيد على المعادل بعد الرسم
function idFx(S, r) {
  const g = idg(S); if (!g || g.c !== 'changer' || g.done != null || !r || r.ok === false || r.got == null) return; const o = g.open;
  if (o && r.from === o.to && r.to === o.from && S.day - o.day <= ID_FX_DAYS && r.amt > 0 && o.got > 0) { const base = o.amt * Math.min(1, r.amt / o.got); if (r.got > base + 1e-9) idBump(S, g.n + 1); g.open = null; return; }
  g.open = { from: r.from, to: r.to, amt: r.amt, got: r.got, day: S.day };
}
// قائد القوافل: رحلات متتالية بلا خسارة نهب (النهب والفدية يصفّران العدّاد)
function idLoss(S) { const g = idg(S); if (g && g.c === 'leader') g.lost = true; }
function idLeaderTrip(S, safe) { const g = idg(S); if (!g || g.c !== 'leader' || g.done != null) return; if (safe && !g.lost) idBump(S, g.n + 1); else g.n = 0; g.lost = false; }
// المفاوض: مساومات متتالية فيها جولة رابحة واحدة على الأقل
function idHaggle(S, wins) { const g = idg(S); if (!g || g.c !== 'negotiator' || g.done != null) return; if (wins > 0) idBump(S, g.n + 1); else g.n = 0; }
const idHome = S => START_OF[S.home] || S.order[0];
// سجل صافي كل دكان (للمزية والهدف): صافي البيع بعد الضريبة وتكلفة البضاعة، آخر 30 يوماً؛ لصاحب الدكان وحده
const idShopLog = S => (IDENTITY.goals || IDENTITY.perks) && idOn(S) && S.learn.char === 'shopkeeper';
function idShopDay(S, city, shops, nets) { if (!idShopLog(S)) return; for (const sh of shops) { const a = sh.idn || (sh.idn = []); a.push({ d: S.day, n: Math.round(nets[sh.id] || 0) }); if (a.length > ID_LOG) a.shift(); } }
const idShopSum = (sh, from) => (sh.idn || []).filter(x => x.d >= from).reduce((t, x) => t + x.n, 0);
function idShopBook(S, city) { const pr = S.player.props[city]; if (!idPerk(S, 'shopkeeper') || !pr) return []; return pr.shops.map(sh => ({ id: sh.id, day: idShopSum(sh, S.day - 1), week: idShopSum(sh, S.day - 7) })); }
function identityDay(S) {
  const g = idg(S); if (!g) return; if (g.c === 'trader' && g.done == null) idArrive(S);
  if (g.c === 'shopkeeper' && g.done == null && S.day % 7 === 0) {
    const pr = S.player.props[idHome(S)], ok = pr ? pr.shops.filter(sh => (sh.idn || []).length >= 14 && idShopSum(sh, S.day - ID_SHOP_DAYS) > 0).length : 0; idBump(S, Math.min(ok, ID_DEF.shopkeeper.goal.need));
  }
}
/* ما يعرضه اللاعب: الهدف وتقدّمه والمزية */
function idView(S) {
  const g = idg(S), d = idOn(S) ? ID_DEF[S.learn.char] : null; if (!d) return null;
  return { goal: IDENTITY.goals ? Object.assign({ n: g ? g.n : 0, done: g ? g.done : null, cc: g && g.cc || 0 }, d.goal) : null, perk: IDENTITY.perks ? d.perk : null, reward: ID_REWARD };
}
// المزايا (معلومات فقط؛ لا تغيّر سعراً ولا ذهباً)
function fxTrend(S) {
  if (!idPerk(S, 'changer')) return null; const f = S.fx; let war = 0, boom = 0; for (const id of S.order) { const e = S.cities[id].ev; if (e && e.k === 'war') war++; if (e && e.k === 'boom') boom++; }
  const du = 0.05 * (FX0.usd - f.usd), dg = 0.02 * (FX0.gold - f.gold) + f.gold * (0.0006 * war - 0.0003 * boom), sg = (x, t) => x > t ? 1 : x < -t ? -1 : 0;
  return { usd: sg(du, 0.004), gold: sg(dg, 0.001 * f.gold) };
}
function idRoadRisk(S, car, dest) {
  if (!idPerk(S, 'leader') || !car || !S.cities[dest]) return null; const from = car.left > 0 ? car.from : car.city, key = riskKey(from, dest), guarded = bossActive(S) && (pactIn(S, from, 'guard') || pactIn(S, dest, 'guard'));
  const base = guarded ? 0 : (S.risk[key] || 0) * sacredMul(S, from, dest) * climateRisk(S, 'trade', dest) * projectMul(S, 'risk', { from, to: dest }), repel = clamp((defenseOf(car) - 4) / 12, 0, 1);
  return { attack: base, repel, loss: base * (1 - repel) };
}
function idEye(S, city, g) { if (!idPerk(S, 'trader') || !S.cities[city] || !(S.learn.cv && S.learn.cv[city] > 0) || !GD[g]) return null; return Math.round(unitPrice(S.cities[city], g) * 10) / 10; }
