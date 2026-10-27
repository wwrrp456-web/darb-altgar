/* ---------- المساومة: لعبة صغيرة، تقرأ مزاج التاجر وتختار الأسلوب الأنسب لكل جولة ----------
   مبتسم ← «أصرّ»، عادي ← «اذكر السعر المرجعي»، منزعج ← «طيّب خاطره». كل إصابة ±2٪ (والمفاوض 3٪) حتى ثلاث، وتُمنح قسيمة لكمية الصفقة في مدينتها ليوم واحد.
   خطآن يُنهيان المساومة. حدّ يومي لكل مدينة، وأدنى قيمة للصفقة، وتُفتح عند المستوى 4. */
const HAGGLE = { rounds: 3, step: 0.02, perDay: 2, minValue: 150, lv: 4, maxQty: 200, maxMiss: 2 };
const HG_BEST = { pleased: 'firm', neutral: 'ref', annoyed: 'praise' }, HG_MOODS = ['pleased', 'neutral', 'annoyed'];
/* ثقافة المساومة لكل دولة: المبدأ واحد (اقرأ مزاج التاجر واختر الأسلوب) لكن الأنسب لكل مزاج يختلف من سوق لسوق، فلا يكفي الحفظ.
   best: الأنسب لكل مزاج. rounds/miss/step: الجولات والأخطاء المسموحة وأثر الإصابة (مجموع الأثر الأقصى 6٪ في كل الأسواق). w: أوزان ظهور المزاج [مبتسم، عادي، منزعج].
   trait: ما يُقال للاعب عند الخطأ (وصف لطبع السوق دون كشف الجواب). why: سبب الجواب الصحيح، يُكشف بعد انتهاء المساومة ويُحفظ في خبرة اللاعب. */
const HG_CULT = {
  sa: { name: 'ضيافة الجزيرة', best: HG_BEST, rounds: 3, miss: 2, step: 0.02, w: [1, 1, 1], trait: 'أهل هذا السوق يقدّرون الصراحة والكرم والكلمة الطيبة.',
    why: { pleased: 'التاجر المبتسم يحترم من يثبت على رأيه بأدب، فأصرّ بلا غضب.', neutral: 'مع التاجر العادي تنفع الحقيقة: اذكر السعر المرجعي وهو يعرفه.', annoyed: 'الغاضب يلين بكلمة طيبة وتطييب للخاطر، لا بالجدال.' } },
  eg: { name: 'ظرف النيل', best: { pleased: 'praise', neutral: 'firm', annoyed: 'ref' }, rounds: 3, miss: 2, step: 0.02, w: [5, 3, 2], trait: 'أهل هذا السوق يحبون الحديث والمزاح، ولا يستعجلون الصفقة.',
    why: { pleased: 'المصري المبتسم يحب المجاملة والإطراء، فيزيد ودّه.', neutral: 'مع العادي أصرّ بهدوء ومزاح، فهو يعدّ الإصرار الهادئ ذكاءً.', annoyed: 'المنزعج يهدأ بالأرقام الواضحة: اذكر السعر المرجعي بهدوء.' } },
  ir: { name: 'أدب الشرق الفارسي', best: { pleased: 'ref', neutral: 'praise', annoyed: 'firm' }, rounds: 2, miss: 1, step: 0.03, w: [2, 5, 3], trait: 'أهل هذا السوق يرون التأدب والتأني أصلاً في البيع، ويعدّون الاستعجال قلة ذوق.',
    why: { pleased: 'الفارسي المبتسم يقدّر العارف بالقيمة: ذكر السعر المرجعي يُظهر خبرتك.', neutral: 'العادي يريد مقدّمة مهذبة قبل الثمن: طيّب خاطره أولاً.', annoyed: 'المنزعج هنا يحترم الثبات الهادئ لا التذلل: أصرّ.' } },
  in: { name: 'نَفَس الهند الطويل', best: { pleased: 'firm', neutral: 'praise', annoyed: 'ref' }, rounds: 4, miss: 3, step: 0.015, w: [3, 3, 4], trait: 'أهل هذا السوق يعدّون المساومة لعبة طويلة، ويحترمون من لا يسرع إلى التنازل.',
    why: { pleased: 'التاجر الهندي المبتسم يحب خصماً صلباً يسليه: أصرّ.', neutral: 'العادي يلين للإطراء الذي يطيل الحديث.', annoyed: 'المنزعج يهدأ بالمنطق والأرقام: السعر المرجعي يحسم النقاش.' } },
  cn: { name: 'حساب الشرق الأقصى', best: { pleased: 'ref', neutral: 'firm', annoyed: 'praise' }, rounds: 3, miss: 2, step: 0.02, w: [2, 6, 2], trait: 'أهل هذا السوق يزنون الكلام بالأرقام، ويقلّ إعجابهم بالمجاملة الكثيرة.',
    why: { pleased: 'التاجر الصيني المبتسم يقدّر الحجة الرقمية الواضحة: اذكر المرجع.', neutral: 'العادي يوازن بصبر؛ الثبات على السعر يقنعه.', annoyed: 'المنزعج يحتاج إلى احترام يحفظ ماء الوجه: طيّب خاطره.' } }
};
const hgCult = (S, city) => HG_CULT[S.cities[city].country] || HG_CULT.sa;
/* أوزان المزاج: تتأثر بثقة زعيم السوق بك (ثقة عالية ترفع المزاج الطيب) */
function hgWeights(S, city) {
  const cu = hgCult(S, city), w = cu.w.slice(), bs = S.bosses && S.bosses[city], tr = bs ? bs.trust : 0, sh = tr >= 15 ? 0.15 : tr <= -10 ? -0.15 : 0, tot = w[0] + w[1] + w[2];
  return [w[0] / tot + sh, w[1] / tot, Math.max(0.02, w[2] / tot - sh)];
}
const hgOf = S => S.player.hg || (S.player.hg = { day: 0, used: {}, vouch: null, game: null });
const haggleOpen = S => { const L = S.learn; return !(L && L.char) || L.level >= HAGGLE.lv; };
function haggleLeft(S, city) { const h = hgOf(S); if (h.day !== S.day) { h.day = S.day; h.used = {}; } return HAGGLE.perDay - (h.used[city] || 0); }
function vouchOf(S, city, g, side) { const v = S.player.hg && S.player.hg.vouch; return v && v.day === S.day && v.city === city && v.g === g && v.side === side && v.left >= 1 ? v : null; }
const vouchMul = (S, city, g, side) => { const v = vouchOf(S, city, g, side); return v ? v.mul : 1; };
const vouchLeft = (S, city, g, side) => { const v = vouchOf(S, city, g, side); return v ? Math.floor(v.left) : 0; };
function vouchUse(S, city, g, side, n) { const v = vouchOf(S, city, g, side); if (v) v.left -= n; }
function buyMul(S, c, g) {
  const hm = (c.id === (S.startCity || START_CITY) ? perkMul(S, 'homeBuy') : 1) * perkMul(S, 'buy_' + c.id) * (g && g === c.sig && pactIn(S, c.id, 'exclusive') ? 1.06 : 1);
  if (!bossActive(S)) return hm;
  const bs = bossOf(S, c.id); if (!bs) return hm;
  if (pactIn(S, c.id, 'supply')) return 0.92 * hm;
  return (bs.ruler === 'player' ? 0.97 : 1.04) * hm;
}
function pactTerms(S, city, type) {
  const c = S.cities[city], bs = bossOf(S, city), d = PACTS[type];
  const m = clamp(1 - bs.trust / 200, 0.6, 1.3) * perkMul(S, 'pact') * (bs.disc[type] && bs.disc[type] > S.day ? 0.8 : 1), sz = c.size;
  return { type, city, days: d.days, daily: Math.round(d.daily * sz * m), upfront: Math.round(d.upfront * sz * m), penalty: Math.round(d.penalty * sz), share: type === 'shop' ? +(0.15 * m).toFixed(3) : 0, negotiated: !!(bs.disc[type] && bs.disc[type] > S.day) };
}
function pactBlock(S, city, type) {
  const bs = bossOf(S, city); if (!bs) return 'لا زعيم في هذه المدينة';
  if (!bossActive(S)) return 'يُفتح في الطور 2';
  if (bs.ruler === 'player') return 'أنت حاكم هذا السوق';
  if (pactIn(S, city)) return 'بينكما عقد قائم';
  if (S.player.pacts.length >= MAX_PACTS) return 'بلغت أقصى عدد من العقود (' + MAX_PACTS + ')';
  if (bs.cd > S.day) return 'الزعيم غاضب منك، عُد بعد ' + (bs.cd - S.day) + ' أيام';
  if (type === 'exclusive') { if (!keyOn(S)) return 'يُفتح بعد المستوى 4'; if (!c0(S, city).sig) return 'لا منتج خاص في هذه المدينة'; }
  const d = PACTS[type]; if (bs.trust < d.minTrust) return 'ثقة الزعيم بك لا تكفي (يلزم ' + d.minTrust + ' وعندك ' + Math.round(bs.trust) + ')';
  if (d.presence && !hasPresence(S, city)) return 'يلزم دكان لك في ' + c0(S, city).name;
  return null;
}
const c0 = (S, id) => S.cities[id];
function bossesDay(S) {
  if (!S.bosses) return;
  const P = S.player;
  for (const id of S.order) {
    const bs = S.bosses[id], c = S.cities[id]; if (!bs) continue;
    const ns = shopsOf(S, id).length, nw = whsOf(S, id);
    let inflow = 0.35 * ns + 0.12 * nw + Math.min(2, bs.dsales / 1500);
    if (pactIn(S, id, 'alliance')) inflow += 0.5;
    inflow *= bossDayMul(S);
    bs.dsales = 0;
    bs.p = clamp(bs.p * 0.98 + inflow, 0, 100);
    const share0 = bossShare(bs);
    bs.b = clamp(bs.b + 0.05 * (bossB0(c) - bs.b) + (bs.ruler === 'boss' && share0 > 0.25 ? 0.4 : 0), 5, 120);
    const share = bossShare(bs);
    if (bs.ruler === 'boss' && share >= BOSS_TAKE) {
      bs.ruler = 'player'; bs.b = Math.min(bs.b, 20); bs.rulerSince = S.day; bonusAward(S, 'ruler:' + id, BONUS.ruler.infl, BONUS.ruler.xp, 'خلعتَ ' + bs.name + ' فكافأك سوق ' + c.name);
      const pc = pactIn(S, id);
      if (pc) {
        const pay = Math.min(pc.penalty, P.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
        P.pacts = P.pacts.filter(x => x !== pc); bs.trust = -50;
      }
      news(S, 'انقلبتَ على ' + bs.name + ' وصرتَ حاكم سوق ' + c.name + '!' + (pc ? ' (دفعت بند العقد الجزائي)' : ''), 'good'); S.pause = true;
    } else if (bs.ruler === 'player' && share < BOSS_LOSE) {
      bs.ruler = 'boss'; bs.rulerSince = null; bs.b = Math.max(bs.b, bossB0(c));
      news(S, 'استعاد ' + bs.name + ' السيطرة على سوق ' + c.name + ' بعد تراجع نفوذك.', 'bad'); S.pause = true;
    }
  }
  for (const id of S.order) { const bs = S.bosses[id]; if (bs && bs.ruler === 'player' && bs.rulerSince != null && S.day - bs.rulerSince >= BONUS.hold.days) bonusAward(S, 'hold:' + id, BONUS.hold.infl, BONUS.hold.xp, 'ثبّتَ حكمك في سوق ' + S.cities[id].name + ' ' + BONUS.hold.days + ' يوماً'); }
  // العقود
  for (const pc of P.pacts.slice()) {
    const bs = S.bosses[pc.city], c = S.cities[pc.city];
    if (bs.ruler === 'player') { P.pacts = P.pacts.filter(x => x !== pc); continue; }
    ctxFor(S, pc.city);
    if (pc.daily > 0) {
      if (P.gold < pc.daily) {
        const pay = Math.min(pc.penalty, P.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
        P.pacts = P.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust - 20, -100, 100); bs.cd = S.day + 10; repOf(P).broke++;
        news(S, 'عجزت عن دفع رسوم ' + PACTS[pc.type].name + ' مع ' + bs.name + ': انفسخ العقد ودُفع البند الجزائي.', 'bad'); S.pause = true; continue;
      }
      pPay(S, 'pact', pc.daily, true);
    }
    pc.left--; if (pc.left % 10 === 0) bs.trust = clamp(bs.trust + 1, -100, 100);
    if (pc.left <= 0) {
      P.pacts = P.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust + 8, -100, 100); repOf(P).done++;
      news(S, 'انتهى ' + PACTS[pc.type].name + ' مع ' + bs.name + ' بوفاء. ثقته بك ارتفعت.', 'good'); bonusAward(S, 'pact:' + pc.city + ':' + S.day, BONUS.pact.infl, BONUS.pact.xp, 'وفاؤك بالعقد رفع مقامك');
    }
  }
}

