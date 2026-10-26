/* ---------- التعليم: الشخصية والمستويات والمساعد ---------- */
/* رصيد البركة (يزيد بالإجابة الصحيحة في مجلس السوق): ثلاث درجات تقلّل احتمال تعرّض قافلتك لقطاع الطرق، بحدٍّ أقصى 12٪ */
const BARAKA_TIERS = [5, 12, 25];
const barakaTier = S => { const b = S.learn && S.learn.mj ? S.learn.mj.baraka : 0; return BARAKA_TIERS.filter(t => b >= t).length; };
const barakaGuard = S => 0.04 * barakaTier(S);
function learnNew() { return { char: null, level: 1, ev: {}, goods: [], secrets: [], up: [], sq: [], intro: 0, perks: {}, rq: [], rseen: {}, eq: [], lore: {}, cv: {}, cs: {}, csec: [], csq: [], bq: [], abroad: false }; }
function learnPerks(S) { const L = S.learn; L.perks = LS.perksOf(L.char, L.secrets); (L.csec || []).forEach(id => { L.perks['buy_' + id] = 0.98; }); if (L.free) L.perks.pact = (L.perks.pact || 1) * 0.97; const pf = (L.ev && L.ev.profit) || 0; if (pf >= 60) L.perks.prov = (L.perks.prov || 1) * 0.94; else if (pf >= 20) L.perks.prov = (L.perks.prov || 1) * 0.97; }
/* قصص الزعماء وأسرار الأسواق (src/lore.js) */
/* الدرس الذي شُرح فعلاً: أثناء فترة التمرين يكون المستوى التالي مفتوحاً لكن مقدّمته لم تُعرض بعد، فلا يُطلق أي حدث مرتبط بدرسه قبل أن يرويه عمّ سالم */
const taught = L => (L.rest ? L.level - 1 : L.level);
function loreFix(L) { L.mj = L.mj || { seen: {}, baraka: 0 }; L.eq = L.eq || []; L.tab = L.tab || []; L.tq = L.tq || []; L.fq = L.fq || []; L.lore = L.lore || {}; L.cv = L.cv || {}; L.cs = L.cs || {}; L.csec = L.csec || []; L.csq = L.csq || []; L.bq = L.bq || []; L.hist = L.hist || []; if (L.abroad === undefined) L.abroad = L.level >= 4; }
function loreCheck(S) {
  const L = S.learn; if (!L || !L.char || taught(L) < 3) return; loreFix(L);
  for (const id in S.bosses || {}) {
    const lo = LORE.BOSS_LORE[id], bs = S.bosses[id]; if (!lo) continue;
    const want = !(L.cv[id] > 0) ? 0 : (bs.trust >= 35 || bs.pacted) ? 3 : (bs.trust >= 10 || bs.gift > -99) ? 2 : 1;
    let n = L.lore[id] || 0; while (n < want) { n++; L.bq.push({ c: id, n }); if (n === 3) news(S, 'تعرّفتَ على حكاية ' + bs.name, 'good'); }
    L.lore[id] = n;
  }
  for (const id in LORE.CITY_SECRETS) {
    if (L.csec.includes(id) || (L.cv[id] || 0) < 2 || (L.cs[id] || 0) < 1000) continue;
    L.csec.push(id); L.csq.push(id); learnPerks(S); news(S, 'سرّ سوق جديد في ' + S.cities[id].name + ': ' + LORE.CITY_SECRETS[id].title, 'good');
  }
}
function learnCountry(S, cc) {
  const L = S.learn; if (!L || L.secrets.includes(cc)) return;
  L.secrets.push(cc); if (LS.SECRETS[cc]) { L.sq.push(cc); learnPerks(S); news(S, 'سرّ جديد: ' + LS.SECRETS[cc].title, 'good'); }
}
/* دَين الجدّ وخطة ظافر (70/20/10) والحصّالة */
const famDebtOn = S => !!(S.player.famDebt && S.player.famDebt.left > 0);
function debtSpend(S, amt) { S.ctxCur = curOf(S.home); S.player.gold -= amt; S.ctxCur = 'sar'; }
function debtApply(S, amt) {
  const fd = S.player.famDebt; amt = Math.min(amt, fd.left); if (amt <= 0) return 0;
  fd.left -= amt; fd.paid += amt; fd.mPaid = (fd.mPaid || 0) + amt; S.player.led.exp.debtPaid = (S.player.led.exp.debtPaid || 0) + amt;
  if (fd.left <= 0.5) { fd.left = 0; const L = S.learn; L.free = true; L.fq.push('debtfree'); learnPerks(S); news(S, 'سدّدتَ دَين جدّك كاملاً: ' + BAB.DEBT.free.title, 'good'); S.pause = true; }
  return amt;
}
function debtCut(S, pl) {
  if(S.player.famDebt?.plan&&S.player.bank.loans.some(l=>l.src==='salem'&&l.amt>0))return earlyQardDebtCut(S,pl);
  const P = S.player, fd = P.famDebt; if (!fd || !fd.plan) return;
  const toD = fd.left > 0 ? Math.min(fd.left, Math.max(0, Math.min(pl * BAB.DEBT.cutDebt, P.gold))) : 0, toV = Math.max(0, Math.min(pl * BAB.DEBT.cutVault, P.gold - toD));
  if (toD > 0) { debtSpend(S, toD); debtApply(S, toD); }
  if (toV > 0) { debtSpend(S, toV); vaultCredit(S, toV); }
}
function debtDay(S) {
  const P = S.player, fd = P.famDebt, L = S.learn; if (!fd || !L || !L.char || fd.left <= 0) return;
  if (fd.due == null) { if (fd.plan || taught(L) >= 4) { fd.due = S.day + 30; fd.mPaid = 0; } return; }
  const need = Math.min(fd.left, Math.round(fd.amt0 * BAB.DEBT.installPct));
  if (fd.due - S.day === 5 && (fd.mPaid || 0) < need) learnReact(S, 'instSoon', 3);
  if (S.day < fd.due) return;
  if ((fd.mPaid || 0) >= need) { fd.patience = Math.min(100, fd.patience + 10); learnReact(S, 'instOk', 5); }
  else {
    fd.patience -= 25; learnReact(S, 'instLate', 5);
    if (fd.patience <= 0) {
      const take = Math.max(0, Math.min(fd.left, Math.round(P.gold * 0.25), P.gold - 200));
      if (take > 0) { debtSpend(S, take); debtApply(S, take); news(S, 'ضاق صبر ' + BAB.DEBT.creditor + ' فاستوفى ' + Math.round(take) + ' ريالاً من رصيدك.', 'bad'); S.pause = true; }
      fd.patience = 50;
    } else news(S, 'تأخّرتَ عن قسط ' + BAB.DEBT.creditor + ': صبره ' + fd.patience + '٪', 'bad');
  }
  fd.due = S.day + 30; fd.mPaid = 0;
}
/* مؤشرات بابل: الذهب العامل، رصيد الطوارئ، قوة الأسوار */
function wealthStats(S) {
  const P = S.player; let work = 0; const goods = new Set(); const hold = {};
  P.caravans.forEach(c => { work += valueOf(c.cargo); for (const g in c.cargo) if (c.cargo[g] >= 1) hold[g] = (hold[g] || 0) + c.cargo[g] * mid(g); });
  for (const k in P.props) { const p = P.props[k]; work += ownShops(p) * 1000 + p.whs * 800 + valueOf(p.store) + farmValue(p); for (const g in p.store) if (p.store[g] >= 1) hold[g] = (hold[g] || 0) + p.store[g] * mid(g); }
  P.factories.forEach(f => { work += 2000 * f.level; });
  for (const k in P.bank.dep) work += P.bank.dep[k]; P.bank.bonds.forEach(b => { work += b.amt; });
  const idle = liquid(S), vault = P.vault || 0, tot = Object.values(hold).reduce((a, v) => a + v, 0), top = Object.values(hold).reduce((m, v) => Math.max(m, v), 0);
  const tripCost = 200 + 0.03 * work, trips = Math.floor((idle + vault) / tripCost);
  const walls = { div: Object.keys(hold).length >= 3 || (tot > 0 && top / tot < 0.55 && Object.keys(hold).length >= 2), prot: P.caravans.some(c => c.insured || c.guards >= 1), res: trips >= 2 };
  return { work, idle, vault, pctW: work / Math.max(1, work + idle), trips, tripCost, walls, score: +walls.div + +walls.prot + +walls.res };
}
const masteryOf = L => { const n = (L && L.ev && L.ev.profit) || 0; return n >= 60 ? { tier: 2, name: 'خبير', next: null, n } : n >= 20 ? { tier: 1, name: 'ماهر', next: 60, n } : { tier: 0, name: 'مبتدئ', next: 20, n }; };
/* الرغبة المحددة */
function wishCheck(S) {
  const L = S.learn; if (!L || !L.wish) return;
  if (netWorth(S) >= L.wish.amt) { const a = L.wish.amt; L.wish = null; L.wishDone = (L.wishDone || 0) + 1; S.player.gold += 100; learnReact(S, 'wishDone', 1); news(S, 'حقّقتَ رغبتك المحددة: ثروة ' + a + ' ريال! +100 ريال', 'good'); }
}
const A_setWish = function (S, amt) { const L = S.learn; amt = Math.floor(+amt || 0); if (!L || amt < 500) return NO('اكتب رقماً محدداً لا يقل عن 500 ريال'); L.wish = { amt, since: S.day }; return OK('رغبتك: ثروة ' + amt + ' ريال. الرغبة المحددة نصف الطريق.'); };
/* رحلة الحرية: يغطي الدخل السلبي مصروف القافلة */
const FREE_DAILY = 40;
const passiveCum = S => { const i = S.player.led.inc; return (i.shops || 0) + (i.mudaraba || 0) + (i.bonds || 0) + (i.governor || 0); };
function freedomDay(S) {
  const L = S.learn; if (!L || !L.char) return; L.fh = L.fh || []; L.fh.push(passiveCum(S)); if (L.fh.length > 31) L.fh.shift();
  if (!L.freedom && L.fh.length >= 31 && L.fh[30] - L.fh[0] >= FREE_DAILY * 30) { L.freedom = true; learnReact(S, 'freedom', 1); news(S, 'دخلك السلبي يغطي مصروفك: أنت حرّ مالياً!', 'good'); }
}
const passivePerDay = S => { const fh = (S.learn || {}).fh || []; return fh.length < 2 ? 0 : (fh[fh.length - 1] - fh[0]) / (fh.length - 1); };
/* أحداث بابل: سمسار الثراء السريع، صديق يطلب قرضاً، فرصة الحظ */
const roll = (S, k) => { const x = Math.imul((S.day + 1) * 2654435761 + k * 40503, 0x9E3779B1) >>> 0; return (x % 1000) / 1000; };
/* البضاعة المعيبة (خيار العيب): للاعب الذي اختار شخصية فقط، من المستوى 4. بعد شراء بعض السلع قد يتبيّن بعد يومين عيب خفي في الكمية كلها: تنقص جودتها إلى النصف، وله خلال مهلة قصيرة وهو في مدينة البائع طلب الرد (استرداد الثمن) أو الأرش (فرق القيمة برضا البائع). لا أثر على الروبوتات */
const DEFECT = { chance: 0.06, minQty: 5, reveal: 2, grace: 12, gap: 25, q: 0.5, arshTrust: 10 };
function defectOpen(S) { return (S.defects || []).find(d => d.st === 'hidden' || d.st === 'found') || null; }
function defectMaybe(S, car, g, n, cost) {
  const L = S.learn; if (!L || !L.char || taught(L) < 4 || n < DEFECT.minQty || GD[g].live) return;
  if (defectOpen(S) || S.day - (S.defectLast == null ? -99 : S.defectLast) < DEFECT.gap) return;
  S.defectSeq = ((S.defectSeq || 0) + 1) % 997; if (roll(S, 60 + S.defectSeq) >= DEFECT.chance) return;
  S.defects = S.defects || []; S.defectLast = S.day;
  S.defects.push({ id: S.nextId++, car: car.id, city: car.city, g, n, cost, day: S.day, st: 'hidden' });
}
/* البيع بعد ظهور العيب (علماً به) تصرفُ المالك ورضاً بالعيب: يسقط حق الرد والأرش (اعتمده المختص) */
function defectSettle(S) {
  const d = defectOpen(S); if (!d || d.st !== 'found') return;
  const car = carById(S, d.car); if (!car || d.held == null || (car.cargo[d.g] || 0) >= d.held) return;
  d.st = 'forfeit'; news(S, 'بعتَ من بضاعة ' + GD[d.g].name + ' بعد أن علمتَ بعيبها، فسقط حقك في الرد والأرش لأن البيع بعد العلم رضاً بالعيب.', 'bad');
}
function defectDay(S) {
  defectSettle(S); const d = defectOpen(S); if (!d) return;
  const car = carById(S, d.car);
  if (d.st === 'hidden' && S.day >= d.day + DEFECT.reveal) {
    const b = car && car.basis[d.g], k = b ? Math.min(d.n, b.q) : 0;
    if (!(k > 0)) { d.st = 'gone'; return; }
    b.w = (b.w === undefined ? b.q : b.w) - k * (1 - DEFECT.q); d.st = 'found'; d.k = k; d.held = car.cargo[d.g] || 0;
    news(S, 'تبيّن في ' + k + ' من ' + GD[d.g].name + ' اشتريتها من ' + S.cities[d.city].name + ' عيب كان مخفياً، فنقصت قيمتها. لك خيار العيب: ارجع إلى البائع قبل أن تنتهي المهلة.', 'bad');
    mjWant(S, 'aib'); learnReact(S, 'defectFound', 1); S.pause = true;
  } else if (d.st === 'found') {
    const have = car ? Math.min(d.k, car.cargo[d.g] || 0) : 0;
    if (have <= 0) { d.st = 'gone'; news(S, 'لم يبقَ من البضاعة المعيبة شيء لتطالب به.', ''); }
    else if (S.day > d.day + DEFECT.grace) { d.st = 'late'; news(S, 'انقضى وقت المطالبة المعتاد؛ والتأخير الطويل في رد البضاعة يُعدّ في عُرف السوق رِضاً بها، فبادر بالرد فور اكتشاف العيب في المرات القادمة.', 'bad'); }
  }
}
/* حالة الطلب الآن: لا بد أن تكون القافلة في مدينة البائع */
function defectClaim(S) {
  defectSettle(S); const d = defectOpen(S); if (!d || d.st !== 'found') return null;
  const car = carById(S, d.car), here = !!car && car.left === 0 && car.city === d.city, k = car ? Math.min(d.k, car.cargo[d.g] || 0) : 0;
  const b = bossOf(S, d.city), trust = b && b.trust != null ? b.trust : 99;
  return { d, here, k, refund: Math.round(d.cost * k / d.n), arsh: Math.round(d.cost * k / d.n * (1 - DEFECT.q)), arshOk: trust >= DEFECT.arshTrust, left: d.day + DEFECT.grace - S.day };
}
function defectReturn(S) {
  const c = defectClaim(S); if (!c) return NO('لا بضاعة معيبة الآن');
  if (!c.here) return NO('ارجع إلى ' + S.cities[c.d.city].name + ' أولاً: الرد يكون عند البائع');
  const car = carById(S, c.d.car), g = c.d.g; takeBasis(car.basis, g, c.k); car.cargo[g] -= c.k; if (car.cargo[g] <= 0) delete car.cargo[g];
  S.cities[c.d.city].stock[g] = (S.cities[c.d.city].stock[g] || 0) + c.k; S.player.gold += c.refund; c.d.st = 'returned';
  learnReact(S, 'defectRet', 1); return OK('ردّ البائع ' + c.refund + ' ريال وأخذ ' + c.k + ' ' + GD[g].name + ' المعيبة');
}
function defectArsh(S) {
  const c = defectClaim(S); if (!c) return NO('لا بضاعة معيبة الآن');
  if (!c.here) return NO('ارجع إلى ' + S.cities[c.d.city].name + ' أولاً');
  if (!c.arshOk) return NO('لم يرضَ البائع بالأرش لأنه لا يثق بك بعد. يمكنك ردّ البضاعة أو تنمية الثقة');
  const car = carById(S, c.d.car), b = car.basis[c.d.g]; if (b) b.c = Math.max(0, b.c - c.arsh);
  S.player.gold += c.arsh; c.d.st = 'arsh'; learnReact(S, 'defectArsh', 1); return OK('أخذتَ ' + c.arsh + ' ريال أرشاً وأبقيتَ البضاعة');
}
function babEventDay(S) {
  const L = S.learn, P = S.player; if (!L || !L.char || taught(L) < 4) return;
  L.ex = L.ex || { broker: -99, friend: -99, luck: -99 }; L.mj = L.mj || { seen: {}, baraka: 0 }; L.eq = L.eq || []; P.loansOut = P.loansOut || [];
  P.loansOut = P.loansOut.filter(o => {
    if (S.day < o.due) return true;
    const back = o.type === 'secure' ? o.amt * 1.05 : o.type === 'worker' ? (roll(S, 7) < 0.8 ? o.amt : 0) : (roll(S, 9) < 0.2 ? o.amt : 0);
    if (back > 0) { P.gold += back; learnReact(S, 'friendOk', 1); news(S, 'ردّ صديقك قرضه (' + Math.round(back) + ' ريال). حسن اختيارك.', 'good'); }
    else { learnReact(S, 'friendLost', 1); news(S, 'ضاع قرض صديقك (' + o.amt + ' ريال). تذكّر قاعدة صادق.', 'bad'); }
    return false;
  });
  if (L.eq.length) return;
  const car = mainCar(S), liq = liquid(S);
  const push = (id, extra) => { L.eq.push(Object.assign({ id, day: S.day }, extra)); L.ex[id] = S.day; S.pause = true; };
  if (taught(L) >= 6 && S.day - L.ex.broker >= 75 && roll(S, 1) < 0.05 && liq >= 600) return push('broker', { dep: clamp(Math.round(liq * 0.15), 300, 1500) });
  if (taught(L) >= 8 && S.day - L.ex.friend >= 60 && roll(S, 2) < 0.05 && liq >= 1000) { const t = ['secure', 'worker', 'emotion'][Math.floor(roll(S, 3) * 3)]; return push('friend', { type: t, amt: clamp(Math.round(liq * 0.15), 200, 1200) }); }
  if (taught(L) >= 4 && S.day - L.ex.luck >= 45 && car.left === 0 && roll(S, 4) < 0.06 && liq >= 800) {
    const c = S.cities[car.city], gs = GIDS.filter(g => g !== 'wheat' && sells(c, g) && c.stock[g] >= 20); if (!gs.length) return;
    return push('luck', { city: car.city, g: gs[Math.floor(roll(S, 5) * gs.length)] });
  }
  // مجلس السوق: مسألة من كتاب البيوع كل 30 إلى 45 يوماً، من المستوى 4، بصعوبة تتدرج مع المستوى
  if (taught(L) >= 4 && S.day - (L.ex.mj == null ? -99 : L.ex.mj) >= 30 + Math.floor(roll(S, 13) * 16)) {
    const c = mjNext(S); if (c) { L.mj.ann = false; return push('mj', { c: c.id }); }
  }
  // مسألة الأسبوع: خبر قبل موعد المجلس بنحو ست أيام، ويمكن قراءتها من دفتر الأحكام قبل موعدها
  if (taught(L) >= 4 && !L.mj.ann && S.day - (L.ex.mj == null ? -99 : L.ex.mj) >= 24 && S.day - (L.ex.mj == null ? -99 : L.ex.mj) < 99) { const c = mjNext(S); if (c) { L.mj.ann = true; news(S, 'مسألة تُناقش قريباً في مجلس السوق: ' + c.title + '. يمكنك قراءتها الآن من دفتر الأحكام في الأكاديمية.', 'rumor'); } }
}
/* المسألة التالية: ما طلبه حدث حقيقي في اللعبة (إن كان بصعوبة مسموحة) وإلا أول مسألة لم تُعرض بصعوبة مسموحة */
function mjNext(S) {
  const L = S.learn, cap = FIQH.allowed(taught(L)), w = L.mj.want && FIQH.CASES.find(x => x.id === L.mj.want);
  if (w && !L.mj.seen[w.id] && w.diff <= cap) return w;
  return FIQH.CASES.find(x => x.diff <= cap && !L.mj.seen[x.id]) || null;
}
function mjWant(S, id) { const L = S.learn; if (L && L.char && L.mj && !L.mj.seen[id]) L.mj.want = id; }
function mjNow(S) {
  const L = S.learn; if (!L || !L.char || taught(L) < 4) return NO('يُفتح مجلس السوق من المستوى 4');
  if (L.eq.length) return NO('أنهِ الحدث الحالي أولاً'); const c = mjNext(S); if (!c) return NO('لا مسألة جديدة الآن');
  L.eq.push({ id: 'mj', day: S.day, c: c.id }); L.ex.mj = S.day; L.mj.ann = false; S.pause = true; return OK('فُتحت مسألة «' + c.title + '»');
}
function eventChoice(S, ch) {
  const L = S.learn, P = S.player, ev = L && L.eq && L.eq[0]; if (!ev) return NO('لا حدث');
  const done = () => { L.eq.shift(); };
  if (ev.id === 'broker') {
    if (ch === 'yes') {
      if (liquid(S) < ev.dep) { done(); return NO('لا رصيد كافٍ'); }
      S.ctxCur = curOf(S.home); P.gold -= ev.dep; S.ctxCur = 'sar'; done();
      if (roll(S, 11) < 0.15) { P.gold += ev.dep * 1.2; return OK('كسبتَ هذه المرة (20٪)، لكنها مخاطرة لا تُعاد.'); }
      learnReact(S, 'brokerLost', 1); return NO('احتال عليك السمسار وضاع المقدّم (' + ev.dep + ' ريال). لا تستشر صانع الطوب في الجواهر.');
    }
    L.ev.brokerNo = (L.ev.brokerNo || 0) + 1; done(); learnReact(S, 'brokerNo', 1);
    return OK(ch === 'ask' ? 'سألتَ أهل الاختصاص فأنقذتَ مالك: الربح المضمون السريع خدعة.' : 'رفضتَ عرض الثراء السريع. حكمة!');
  }
  if (ev.id === 'friend') {
    if (ch === 'yes') {
      if (liquid(S) < ev.amt) { done(); return NO('لا رصيد كافٍ'); }
      S.ctxCur = curOf(S.home); P.gold -= ev.amt; S.ctxCur = 'sar'; P.loansOut = P.loansOut || []; P.loansOut.push({ due: S.day + 30, amt: ev.amt, type: ev.type }); done();
      return OK('أقرضتَ صديقك ' + ev.amt + ' ريال إلى ثلاثين يوماً.');
    }
    L.ev.friendNo = (L.ev.friendNo || 0) + 1; done(); return OK('اعتذرتَ بلطف. (القرض بلا ضمان أو سمعة ضياعٌ للمال).');
  }
  if (ev.id === 'mj') { // مجلس السوق: اختيار الحكم ثم عرضه، فإغلاق
    const cs = FIQH.CASES.find(x => x.id === ev.c); if (!cs) { done(); return NO('مسألة غير معروفة'); }
    if (ch === 'close') { done(); return OK('أُضيفت المسألة إلى دفتر الأحكام'); }
    if (ev.pick != null) return NO('اخترتَ من قبل');
    const k = +String(ch).replace('p', ''); if (!(k >= 0 && k < cs.opts.length)) return NO('اختيار غير صحيح');
    ev.pick = k; ev.right = k === cs.ok; L.mj.seen[cs.id] = { p: k, ok: ev.right, d: S.day };
    if (ev.right) { L.mj.baraka++; }
    return ev.right ? OK('أصبتَ! زادت بركتك.') : NO('ليس هذا الحكم، اقرأ التوضيح.');
  }
  if (ev.id === 'luck') {
    if (ch !== 'yes') { done(); return OK('تركتَ الفرصة تمرّ. الحظ لمن استعدّ وبادر.'); }
    const car = mainCar(S), c = S.cities[ev.city]; if (car.city !== ev.city || car.left > 0) { done(); return NO('غادرتَ المدينة وفاتت الفرصة'); }
    const price = unitPrice(c, ev.g) * 0.75, room = Math.floor((capOfCar(car) - loadOf(car)) / GD[ev.g].w), q = Math.max(0, Math.min(room, Math.floor(liquid(S) * 0.4 / price), Math.floor(c.stock[ev.g] * 0.5)));
    if (q < 1) { done(); return NO('لا مكان أو رصيد كافٍ لاقتناص الفرصة'); }
    S.ctxCur = curOf(c.country); P.gold -= price * q; S.ctxCur = 'sar'; c.stock[ev.g] -= q; car.cargo[ev.g] = (car.cargo[ev.g] || 0) + q; addBasis(car.basis, ev.g, q, price * q); done();
    L.ev.luckGot = (L.ev.luckGot || 0) + 1; return OK('اقتنصتَ ' + q + ' ' + GD[ev.g].name + ' بخصم 25٪!');
  }
  done(); return NO('حدث غير معروف');
}
function tabletCheck(S) {
  const L = S.learn, P = S.player; if (!L || !L.char || !L.tab || taught(L) < 1) return;
  const nw = netWorth(S), props = Object.values(P.props), shops = props.reduce((a, p) => a + p.shops.length, 0), ev = L.ev;
  const C = {
    cure1: () => (P.vault || 0) > 0, cure2: () => taught(L) >= 2, cure3: () => nw >= 3000,
    cure4: () => P.caravans.some(c => c.insured || c.guards >= 1), cure5: () => shops >= 1,
    cure6: () => shops >= 2 || Object.keys(P.bank.dep).some(k => P.bank.dep[k] > 0) || P.bank.bonds.length > 0,
    cure7: () => (ev.profit || 0) >= 20, law1: () => (P.vault || 0) >= 300, law2: () => (L.goods || []).length >= 3,
    law3: () => (ev.signPact || 0) >= 1, law4: () => (ev.loss || 0) >= 1, law5: () => (ev.brokerNo || 0) >= 1 || taught(L) >= 9, free: () => !!L.free, freedom: () => !!L.freedom,
  };
  // لا يُمنح لوح قبل أن يروي عمّ سالم الدرس الذي يخصّه
  const MINL = { cure1: 1, cure2: 2, cure3: 3, cure4: 4, cure5: 7, cure6: 9, cure7: 10, law1: 3, law2: 5, law3: 8, law4: 4, law5: 6 };
  for (const id in BAB.TABLETS) if (!L.tab.includes(id) && C[id] && taught(L) >= (MINL[id] || 1) && C[id]()) { L.tab.push(id); L.tq.push(id); P.gold += BAB.TABLETS[id].reward; packReward(S, BAB.TABLETS[id].reward / 100); }
}
/* فترة تمرين بين المراحل: يكرر اللاعب الصفقات الصغيرة (في دولة البداية قبل أول عبور للحدود) ثم يأتي الدرس التالي */
const REST_K = [3, 4, 4, 3, 3, 3, 3, 3, 2], REST_GOLD = { 2: 1500, 3: 2500 };
function restNew(S, n) { const L = S.learn; return { n, k: REST_K[n - 1] || 3, w: 0, home: n <= 3 ? (L.start || S.home) : null, gold: REST_GOLD[n] || 0, infl: n === 3, plan: n === 2 && !!S.player.famDebt && S.player.famDebt.left > 0 }; }
const restDone = (S, rs) => (!rs.infl || S.learn.abroad) && rs.w >= rs.k && S.player.gold >= rs.gold && (!rs.plan || !S.player.famDebt || S.player.famDebt.plan || S.player.famDebt.left <= 0);
function learnCheck(S, silent) {
  if (S.learn && S.learn.ageStages && S.learn.char) return stageCheck(S, silent);
  const L = S.learn; if (!L || !L.char) return; if (!silent) { loreCheck(S); tabletCheck(S); wishCheck(S); }
  if (!L.abroad && L.level >= 4 && homeStatus(S).met) { L.abroad = true; if (!silent) { learnReact(S, 'abroadOpen', 1); news(S, 'فُتح لك السفر إلى بقية الدول', 'good'); } }
  if (L.rest) { if (!restDone(S, L.rest)) return; L.rest = null; learnReact(S, 'restDone', 1); }
  if (!silent && S.player.gold < 60 && !hasCargo(S)) learnReact(S, 'broke', 20);
  while (L.level <= 10) {
    if (L.hold === L.level && L.intro < L.level) break;
    const lv = LS.LEVELS[L.level - 1]; if (!lv.goals(S).every(g => g[1])) break;
    if (!silent) { S.player.gold += lv.reward; const pk = packReward(S, lv.reward / 50); L.up.push(L.level); news(S, 'أتممتَ درس «' + lv.title + '» · +' + lv.reward + ' ريال و' + pk + ' من مؤن السفر', 'good'); S.pause = true; }
    L.level++;
    if (!silent && L.level <= 10) { L.rest = restNew(S, L.level - 1); L.hold = L.level; learnReact(S, 'restStart', 1); break; }
  }
}
/* قفل السفر خارج دولة البداية: يُفتح بعد دروس م1–م3 وزيارة كل أسواق بلدك واكتساب نفوذ فيها (حجم مبيعاتك فيها) */
const INFL_NEED = 2000;
const NEIGHBOR = { sa: 'eg', eg: 'sa', ir: 'in', in: 'ir', cn: 'in' }, ALL_ABROAD_LV = 6; // الدولة المجاورة عند المستوى 4 وبقية الدول عند 6
function homeStatus(S) {
  const L = S.learn, home = (L && L.start) || S.home, ids = S.order.filter(id => S.cities[id].country === home);
  const seen = ids.filter(id => L && L.cv && L.cv[id] > 0).length, infl = ids.reduce((t, id) => t + ((L && L.cs && L.cs[id]) || 0), 0);
  return { home, total: ids.length, seen, infl: Math.round(infl), need: INFL_NEED, met: seen >= ids.length && infl >= INFL_NEED, lessons: !!L && L.level >= 4 };
}
function travelBlock(S, car, dest) {
  if (car && car.main) { const sb = shockBlock(S, car.city, dest); if (sb) return sb; }
  const L = S.learn; if (!L || !L.char || !car || !car.main) return null;
  const home = L.start || S.home, cc = S.cities[dest].country; if (cc === home) return null;
  if (!L.abroad) return 'السفر خارج ' + CD[home].name + ' مقفل الآن: تُفتح الدولة المجاورة عند درس الجمارك (المستوى 4) بعد أن تكوّن ثروتك في أسواق بلدك (زُر كل أسواقها وابلغ نفوذاً ' + INFL_NEED + ' ريال من المبيعات فيها)';
  if (L.level < ALL_ABROAD_LV && cc !== NEIGHBOR[home]) return 'الدولة المجاورة فقط مفتوحة الآن (' + CD[NEIGHBOR[home]].name + '). تُفتح بقية الدول عند درس العملات والصرف (المستوى ' + ALL_ABROAD_LV + ')';
  return null;
}
function learnMigrate(S) { // حفظ قديم: شخصية التاجر ومستوى يوافق الطور
  const L = S.learn = learnNew(); L.char = 'trader'; learnPerks(S);
  L.level = [1, 1, 4, 7, 9][S.phase] || 1; L.abroad = true; L.intro = L.level; learnCheck(S, true);
}
function chooseStart(S, cc) {
  const L = S.learn; if (!START_OF[cc]) return NO('دولة غير معروفة');
  if (!L || L.char || S.day > 0 || (S.player.trades && S.player.trades.length)) return NO('لا يمكن تغيير دولة البداية الآن');
  const city = START_OF[cc], car = mainCar(S), w = S.player.wallet, total = liquid(S);
  S.home = cc; S.startCity = city; L.start = cc; car.city = city;
  w.sar = 0; w.usd = 0; w.au = 0; w.ag = 0; if (curOf(cc) === 'sar') w.sar = total; else w.usd = total / S.fx.usd;
  S.news = []; news(S, 'ورثتَ قافلة جدّك في ' + S.cities[city].name + ' بـ 800 ريال. اشترِ رخيصاً وبِع غالياً، وكوّن ثروتك هنا أولاً ثم امضِ إلى بقية الدول.', 'good');
  snapshotKnown(S, S.order);
  return OK('تبدأ من ' + CD[cc].name + ' (' + S.cities[city].name + ')');
}
function learnSetChar(S, id) {
  const L = S.learn; if (!LS.CHARS.some(c => c.id === id)) return NO('شخصية غير معروفة');
  L.char = id; if (S.captainAuto == null) S.captainAuto = false; if (!L.ageStages) { L.ageStages = 1; L.stage = L.level; L.stageDone = []; L.stageIntro = 0; L.stageUp = []; L.doneDay = S.day; L.stageProfit0 = (L.ev.profit || 0); } learnPerks(S); learnCountry(S, S.cities[mainCar(S).city].country); loreFix(L); L.cv[mainCar(S).city] = 1;
  if (!S.player.famDebt) { S.player.famDebt = { amt0: BAB.DEBT.amt, left: BAB.DEBT.amt, plan: false, patience: 100, due: null, mPaid: 0, paid: 0 }; S.player.vault = 0; } L.tab = L.tab || []; L.tq = L.tq || []; L.fq = L.fq || [];
  return OK('اخترتَ ' + LS.CHARS.find(c => c.id === id).name);
}
function learnArrive(S, car, to) {
  const L = S.learn; if (!L || !L.char || !car.main) return;
  if (S.cities[car.from].country !== S.cities[to].country) { L.ev.crossed = (L.ev.crossed || 0) + 1; learnReact(S, 'crossed'); }
  learnCountry(S, S.cities[to].country); learnReact(S, 'arrive', 6); loreFix(L); L.cv[to] = (L.cv[to] || 0) + 1;
}
function learnReact(S, key, cool, param) {
  const L = S.learn; if (!L || !L.char) return;
  const n = L.rseen[key] || 0; L.rday = L.rday || {};
  if (n && (!cool || S.day - (L.rday[key] || 0) < cool)) return;
  L.rseen[key] = n + 1; L.rday[key] = S.day; L.rq.push(key); if (param != null) { L.rp = L.rp || {}; L.rp[key] = param; }
}
function productStory(S, g) {
  const L = S.learn, st = LORE.PSTORY[g]; if (!st) return; L.pst = L.pst || []; if (L.pst.includes(g)) return;
  L.pst.push(g); news(S, 'حكاية منتج جديدة في دفترك: ' + st.t, 'good'); learnReact(S, 'productStory', 8);
}
function learnEvent(S, k, args, r, pre) {
  const L = S.learn; if (!L || !L.char) return;
  if ((k === 'buy' || k === 'sell') && r && r.ok !== false && typeof args[1] === 'string') productStory(S, args[1]);
  const bump = n => { L.ev[n] = (L.ev[n] || 0) + 1; learnReact(S, n, LS.REACT[n] && LS.REACT[n].cool); };
  if (k === 'buy') { bump('buy'); if (pre && pre.cheap) bump('buyCheap'); }
  else if (k === 'sell') {
    { const sc = carById(S, args[0]); if (sc) { loreFix(L); L.cs[sc.city] = (L.cs[sc.city] || 0) + Math.max(0, r.net || 0); } }
    bump('sell'); L.sells = (L.sells || 0) + 1; if (L.stallAt !== L.level) { L.stallAt = L.level; L.stallN = 0; } L.stallN++; if (L.stallN >= 4 && L.level <= 3) learnReact(S, 'stall', 4); if (r.pl < 0) learnReact(S, 'loss', 15);
    if (r.pl > 0) debtCut(S, r.pl);
    if (r.pl < 0) L.ev.loss = (L.ev.loss || 0) + 1;
    if (r.pl > 0 && L.rest) { const sc2 = carById(S, args[0]); if (sc2 && (!L.rest.home || S.cities[sc2.city].country === L.rest.home)) L.rest.w++; }
    if (r.pl > 0) {
      bump('profit'); if (L.ev.profit === 20 || L.ev.profit === 60) { learnPerks(S); news(S, 'ارتقت حرفتك: ' + (L.ev.profit === 60 ? 'خبير' : 'ماهر') + ' (مؤن أرخص)', 'good'); } const cost = r.net - r.pl; if (cost > 0 && r.pl / cost >= 0.1) bump('profit10'); if (cost > 0 && r.pl / cost >= 0.15) bump('profit15'); if (cost > 0 && r.pl / cost >= 0.25) learnReact(S, 'bigProfit', 12);
      if (pre && pre.cross) bump('profitCross');
      if (!L.goods.includes(args[1])) L.goods.push(args[1]);
    }
  } else if (k === 'travel') { if (pre && pre.mixed) bump('mixed'); }
  else if (k === 'invest' || k === 'buySukuk') bump(k);
  else bump(k);
}
function learnPre(S, k, a) {
  const car = (k === 'buy' || k === 'sell' || k === 'travel') ? carById(S, a[0]) : null; if (!car) return null;
  const c = S.cities[car.city];
  if (k === 'buy') return { cheap: sells(c, a[1]) && ratio(c, a[1]) < 0.97 };
  if (k === 'sell') return { cross: !!car.from && S.cities[car.from].country !== c.country };
  return { mixed: Object.keys(car.cargo).filter(g => car.cargo[g] >= 1).length >= 2 };
}


/* مؤن السفر جائزة مع كل مكافأة مهمة: تدعم اللاعب ليختصر انتظار رحلاته */
function packReward(S, n) { const car = S.player.caravans[0], k = Math.max(1, Math.round(n)); car.pack = (car.pack || 0) + k; return k; }
