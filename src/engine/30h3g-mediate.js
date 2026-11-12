/* ---------- 036ز الخصومات الكبرى والوساطة والتزكية (specs/036-influence-contracts/spec.md: FR-009 وFR-013 وFR-016..020 وFR-025) ----------
   الخصومات الكبرى (GRIEF.major.on): ثلاث ثابتة {a,b,k,big:1} في S.feuds بآلية 30h3-feuds.js نفسها (علاوة المسافة وتعبئة الرف) في الاتجاهين، لا تنتهي وحدها. تُضاف في لعبة جديدة وعند تحميل حفظ قديم (إن لم تكن إحدى مدينتيها في خصومة عادية قائمة؛ لا تتحول عادية).
   الوساطة (INFLU.mediate.on): P.med={k,st,lg,tries,wait} أربع مراحل بسفر قافلتك الرئيسية الفعلي (medArrive من arrive): مدينة الأول، مدينة الثاني، حمل الرسالتين (الأول ثم الثاني)، سوق محايد خارج دولتيهما. ثمنها وقت وسفر فقط: لا مال ولا بضاعة ولا هدية.
   الفشل عند المرحلة 4 بقرعة بذرية معلنة النسبة: تنقص ثقة الأقل ثقةً بك INFLU.mediate.fail وتعاود بعد مهلة. النجاح: تزول الخصومة للأبد، P.peace يحمل «عهد الصلح» (جمارك أقل وحصة أكبر)، وثقة الزعيمين تزيد، واحتفال (009).
   التزكية (INFLU.tazkiya.on): شفاعة بلا مقابل؛ تُفتح بثقة الزعيم بك؛ مرة لكل زعيم ثم مهلة؛ أثرها زيادة معلومة في ثقة أقرب زعماء آخرين. P.tz لا يُكتب إلا عند الاستعمال.
   المطفأ = السلوك السابق حرفياً وبلا حقل جديد في الحفظ. */
INFLU.mediate = { on: true, phase: 4, ruled: 1, gate: 20, base: 0.5, perTrust: 0.01, max: 0.95, fail: 8, win: 12, cd: 10, cust: 0.6, quota: 1.5 };
INFLU.tazkiya = { on: true, min: 40, base: 4, step: 15, max: 7, n: 3, cd: 120 };
const medOn = S => !!(INFLU.on && INFLU.mediate.on && fdMajor() && S && S.learn && S.learn.char);
const tzOn = S => !!(INFLU.on && INFLU.tazkiya.on && S && S.learn && S.learn.char);
const MED_TXT = {
  GR01: 'قال الله تعالى: ﴿إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ﴾؛ الإصلاح بين المتخاصمين من أعظم القُربات وأنبل خصال التجّار', // عبارة المختص حرفاً (GR-01)
  list: 'خصومات بين كبار التجار. ما دامت قائمة لا تدخل سلع أحدهما سوق الآخر، فتشحّ هناك ويغلو سعرها. من أصلح بينهما عادت السلع.',
  GF: {
    g1: { title: 'خصومة الميناءين', story: 'تنافس أبو سالم البحّار في جدة وسيد درويش الريّس في الإسكندرية سنين طويلة على من يستفيد من البضاعة العابرة بين البحرين. ثم ضاق كلٌّ بالآخر، فمنع كل منهما سلع صاحبه من دخول سوقه.', effect: 'لا يصل لؤلؤ جدة وبنّها إلى الإسكندرية، ولا يصل زجاج الإسكندرية وزيتها وصابونها إلى جدة.' },
    g2: { title: 'خصومة ميناءي الصين', story: 'تنافس السيد تشن هاو في كانتون والسيد لين فاي في شنغهاي على من يقود التصدير من بلادهم. اختلفا على الطرق والأسعار، فأغلق كل منهما سوقه في وجه سلع الآخر.', effect: 'لا يصل شاي كانتون وخشبها وصوفها إلى شنغهاي، ولا يصل خزف شنغهاي وأدواتها إلى كانتون.' },
    g3: { title: 'خصومة ساحلي الهند', story: 'كلٌّ من سيث راجيش شاه في بومباي وبابو ديباك داس في كلكتا يرى أنه الأحق بتجارة السواحل. وبعد خلاف طويل منع كل منهما سلع صاحبه من دخول سوقه.', effect: 'لا تصل أحجار بومباي وقطنها إلى كلكتا، ولا تصل توابل كلكتا وسكرها وأرزها إلى بومباي.' },
  },
  stage: [
    { t: 'اسمع الأول', x: (a, b, ca, cb) => 'زر ' + a + ' في ' + ca + ' واسمع شكواه كاملة.' },
    { t: 'اسمع الثاني', x: (a, b, ca, cb) => 'زر ' + b + ' في ' + cb + ' واسمع شكواه كاملة.' },
    { t: 'احمل الرسالتين', x: (a, b, ca, cb) => 'سافر إلى ' + ca + ' بشروط ' + b + ' ثم عد إلى ' + cb + ' بجواب ' + a + '.' }, // تعديل تشغيلي لترتيب نص المرحلة 3 لأن القافلة تكون في مدينة الثاني بعد المرحلة 2 (يراجعه Opus)
    { t: 'اجمعهما', x: () => 'اجمع الزعيمين في سوق محايد وقرّب بينهما بالكلام الطيب.' },
  ],
  win: (a, b) => 'اصطلح ' + a + ' و' + b + ' بفضل سعيك. عادت السلع بين السوقين، وفتحا لك «عهد الصلح».',
  stall: 'لم يطمئن أحدهما بعد. زد ثقته ثم عاود.',
  covenant: z => 'عقد لا يملكه غيرك مع ' + z + ': جمارك أقل وحصة أكبر من سلعه، مكافأةً لك على إصلاحك بينه وبين خصمه.',
  celTitle: 'أصلحتَ بين خصمين',
  celText: (ca, cb) => 'عاد التجار يتبادلون السلع بين ' + ca + ' و' + cb + '، وصار اسمك يُذكر في الأسواق.',
  tzDesc: 'يوصي بك الزعيم عند زعماء آخرين فتزداد ثقتهم بك.', tzObl: 'احتساباً بلا مقابل: لا مال ولا هدية ولا خدمة يشترطها عليك.',
  medDesc: 'تسعى بين زعيمين متخاصمين لإصلاح ما بينهما بالمساعي والتقريب.', medObl: 'وقتك وسفرك فقط. لا هدايا. وإن نجحت زادت ثقتهما بك، وإن فشلت قد تخسر ثقة أحدهما.',
  // نصوص تشغيلية جديدة (تُراجع عند Opus)
  how: 'تُحلّ بالوساطة: تحكم سوقاً على الأقل، وتبلغ الطور 4، وتكسب ثقة الزعيمين، ثم تسافر بقافلتك إليهما وإلى سوق محايد.',
  perm: 'خصومة كبرى: لا تنتهي وحدها ولا يُصلحها غيرك.',
  eff: (pct, a, b) => 'السلع الممنوعة بين ' + a + ' و' + b + (pct > 0 ? ' أغلى بنسبة ' + pct + '٪ عند أغلاها' : '') + ' ويمتلئ رفّها ببطء.',
  need: (ph, ru, ta, tb, na, nb, gate) => 'شروط الوساطة: الطور 4 (' + (ph ? 'تحقّق' : 'ناقص') + ') · سوق تحكمه (' + (ru ? 'تحقّق' : 'ناقص') + ') · ثقة ' + na + ' ' + ta + ' وثقة ' + nb + ' ' + tb + ' (يلزم ' + gate + ' لكل منهما)',
  offer: (a, b) => 'يمكنك الوساطة بين ' + a + ' و' + b, offerWhy: (c, t) => 'تسافر بقافلتك في أربع مراحل · فرصة النجاح ' + c + '٪ · ثقتهما ' + t,
  start: 'ابدأ الوساطة', startEff: 'وقت وسفر فقط، بلا مال ولا هدايا', cancel: 'تراجع عن الوساطة', cancelEff: 'تتوقف المراحل ويبقى ما كسبتَ من ثقة',
  go: (d) => 'وجهتك الآن: ' + d, neutral: 'أي سوق خارج دولتيهما',
  failed: (n, t, wait) => 'تعذّر الصلح: لم يطمئن ' + n + ' إلى الجمعة فنقصت ثقته بك ' + t + '. تعاود بعد ' + wait + ' أيام.',
  wait: d => 'تعاود بعد ' + d + ' أيام',
  peaceRow: (z, cu, q) => 'عهد الصلح مع ' + z + ': جمارك أقل ' + cu + '٪ · حصتك من سلعه ×' + q,
  tzTitle: z => 'يمكن أن يزكّيك ' + z, tzAsk: 'اطلب التزكية', tzEff: ts => 'ثقة ' + ts.map(t => t.name + ' +' + t.gain).join('، '),
  tzDone: (z, ts) => 'زكّاك ' + z + ' عند غيره: ' + ts.map(t => t.name + ' +' + t.gain).join('، ') + '.', tzCd: (z, d) => 'زكّاك ' + z + ' قبل أيام؛ تُطلب مرة أخرى بعد ' + d + ' يوماً',
};
const fdKey = (S, k) => (S.feuds || []).find(f => f.big && f.k === k) || null;
const peaceDone = (S, k) => !!(S.player && (S.player.peace || []).some(p => p.k === k));
const peaceAt = (S, city) => (INFLU.on && INFLU.mediate.on && S.player && S.player.peace ? S.player.peace.find(p => p.a === city || p.b === city) || null : null);
const peaceCust = (S, to) => (peaceAt(S, to) ? INFLU.mediate.cust : 1);
const peaceQuota = (S, city) => (peaceAt(S, city) ? INFLU.mediate.quota : 1);
// تُضاف الثلاث عند اللعبة الجديدة وعند تحميل حفظ قديم؛ لا تتحول خصومة عادية قائمة (تنتظر انتهاءها)، ولا تعود بعد صلح
function majorEnsure(S) {
  if (!fdMajor() || !S || !S.cities || !S.bosses || !S.player) return; let added = [];
  for (const m of GRIEF.major.list) {
    if (fdKey(S, m.k) || peaceDone(S, m.k) || !S.cities[m.a] || !S.cities[m.b]) continue;
    if ((S.feuds || []).some(f => !f.big && (f.a === m.a || f.b === m.a || f.a === m.b || f.b === m.b))) continue;
    (S.feuds = S.feuds || []).push({ a: m.a, b: m.b, s: S.day, e: 0, big: 1, k: m.k }); added.push(m);
  }
  if (added.length) { feudApply(S); if (S.day > 0 && S.learn && S.learn.char) added.forEach(m => news(S, MED_TXT.GF[m.k].story, 'rumor')); }
}
const medNeutral = (S, f) => S.order.filter(id => ![S.cities[f.a].country, S.cities[f.b].country].includes(S.cities[id].country));
const medMin = (S, f) => Math.min(S.bosses[f.a].trust, S.bosses[f.b].trust);
const medChance = (S, f) => clamp(INFLU.mediate.base + (medMin(S, f) - INFLU.mediate.gate) * INFLU.mediate.perTrust, INFLU.mediate.base, INFLU.mediate.max);
function medBlock(S, k) {
  if (!medOn(S)) return 'غير متاحة الآن'; const f = fdKey(S, k); if (!f) return 'لا خصومة كبرى بهذا الاسم'; const P = S.player, M = INFLU.mediate;
  if (P.med) return P.med.k === k ? 'وساطتك جارية' : 'لك وساطة جارية في خصومة أخرى';
  if (S.phase < M.phase) return 'تُفتح الوساطة في الطور ' + M.phase; if (agrRuled(S) < M.ruled) return 'يلزم أن تحكم سوقاً واحداً على الأقل';
  for (const c of [f.a, f.b]) { const bs = bossOf(S, c); if (!bs || bs.ruler !== 'boss') return 'لم يعد في ' + S.cities[c].name + ' زعيم يُصلَح بينه وبين خصمه'; if (bs.trust < M.gate) return 'ثقة ' + bs.name + ' بك لا تكفي (يلزم ' + M.gate + ' وعندك ' + Math.round(bs.trust) + ')'; }
  return null;
}
const medTarget = (S, m, f) => (m.st === 0 ? [f.a] : m.st === 1 ? [f.b] : m.st === 2 ? [m.lg ? f.b : f.a] : medNeutral(S, f));
function medArrive(S, to) { // قافلتك الرئيسية وصلت فعلاً إلى to
  const P = S.player, m = P.med; if (!m || !medOn(S) || (m.wait || 0) > S.day) return; const f = fdKey(S, m.k); if (!f) { delete P.med; return; }
  if (!medTarget(S, m, f).includes(to)) return;
  const M = INFLU.mediate, lo = [f.a, f.b].find(c => bossOf(S, c).trust < M.gate); if (lo || [f.a, f.b].some(c => bossOf(S, c).ruler !== 'boss')) { news(S, MED_TXT.stall, 'bad'); return; }
  if (m.st < 3) { if (m.st === 2 && !m.lg) m.lg = 1; else { m.st++; m.lg = 0; } return; }
  m.tries = (m.tries || 0) + 1; const ch = medChance(S, f), ki = GRIEF.major.list.findIndex(x => x.k === m.k);
  if (fdH(S, 21, S.day, ki, m.tries) < ch) return medWin(S, f);
  const lows = [f.a, f.b].sort((x, y) => bossOf(S, x).trust - bossOf(S, y).trust)[0], bs = bossOf(S, lows); bs.trust = clamp(bs.trust - M.fail, -100, 100);
  m.st = 0; m.lg = 0; m.wait = S.day + M.cd; news(S, MED_TXT.failed(bs.name, M.fail, M.cd), 'bad');
}
function medWin(S, f) {
  const P = S.player, M = INFLU.mediate, ba = bossOf(S, f.a), bb = bossOf(S, f.b), ca = S.cities[f.a].name, cb = S.cities[f.b].name;
  S.feuds = S.feuds.filter(x => x !== f); feudApply(S); ba.trust = clamp(ba.trust + M.win, -100, 100); bb.trust = clamp(bb.trust + M.win, -100, 100);
  (P.peace = P.peace || []).push({ k: f.k, a: f.a, b: f.b, d: S.day }); delete P.med;
  news(S, MED_TXT.win(ba.name, bb.name), 'good'); news(S, MED_TXT.GR01, 'good'); celebrate(S, 'feud_peace', f.k);
}
Object.assign(A, {
  medStart(S, k) { const why = medBlock(S, k); if (why) return NO(why); const f = fdKey(S, k); S.player.med = { k, st: 0, lg: 0, d: S.day, tries: 0 }; return OK('بدأت الوساطة بين ' + S.cities[f.a].name + ' و' + S.cities[f.b].name + ': ' + MED_TXT.stage[0].x(bossOf(S, f.a).name, bossOf(S, f.b).name, S.cities[f.a].name, S.cities[f.b].name)); },
  medCancel(S) { if (!S.player.med) return NO('لا وساطة جارية'); delete S.player.med; return OK('تراجعتَ عن الوساطة'); },
  tazkiya(S, city) {
    const why = tzBlock(S, city); if (why) return NO(why); const bs = bossOf(S, city), ts = tzTargets(S, city); ts.forEach(t => { const b = bossOf(S, t.city); b.trust = clamp(b.trust + t.gain, -100, 100); });
    (S.player.tz || (S.player.tz = {}))[city] = S.day; const m = MED_TXT.tzDone(bs.name, ts); news(S, m, 'good'); return OK(m);
  },
});
function tzGain(S, city) { const T = INFLU.tazkiya, bs = bossOf(S, city); return Math.min(T.max, T.base + Math.floor((bs.trust - T.min) / T.step)); }
function tzTargets(S, city) {
  const d0 = CITY_DEFS.find(d => d.id === city), g = tzGain(S, city);
  return S.order.filter(id => id !== city && bossOf(S, id) && bossOf(S, id).ruler === 'boss').map(id => { const d = CITY_DEFS.find(x => x.id === id); return { city: id, name: bossOf(S, id).name, dist: Math.hypot(d.x - d0.x, d.y - d0.y), trust: Math.round(bossOf(S, id).trust), gain: g }; })
    .sort((x, y) => x.dist - y.dist || (x.city < y.city ? -1 : 1)).slice(0, INFLU.tazkiya.n);
}
function tzBlock(S, city) {
  if (!tzOn(S)) return 'غير متاحة الآن'; const bs = bossOf(S, city), T = INFLU.tazkiya; if (!bs || bs.ruler !== 'boss') return 'لا زعيم يزكّيك في هذا السوق';
  if (bs.trust < T.min) return 'ثقة ' + bs.name + ' بك لا تكفي (يلزم ' + T.min + ' وعندك ' + Math.round(bs.trust) + ')';
  const last = S.player.tz && S.player.tz[city]; if (last != null && S.day - last < T.cd) return MED_TXT.tzCd(bs.name, T.cd - (S.day - last));
  return null;
}
// عرض القراءة للواجهة
function medView(S) {
  if (!medOn(S)) return { on: false, list: [], peace: [], active: null };
  const P = S.player, M = INFLU.mediate, m = P.med, list = (S.feuds || []).filter(f => f.big).map(f => {
    const A1 = bossOf(S, f.a), B1 = bossOf(S, f.b), ca = S.cities[f.a].name, cb = S.cities[f.b].name, why = medBlock(S, f.k), mine = !!(m && m.k === f.k);
    return { k: f.k, a: f.a, b: f.b, ca, cb, na: A1.name, nb: B1.name, ta: Math.round(A1.trust), tb: Math.round(B1.trust), can: !why, why, mine, chance: Math.round(100 * medChance(S, f)),
      ph: S.phase >= M.phase, ru: agrRuled(S) >= M.ruled, gate: M.gate, ...MED_TXT.GF[f.k] };
  });
  let active = null;
  if (m && fdKey(S, m.k)) {
    const f = fdKey(S, m.k), a = bossOf(S, f.a).name, b = bossOf(S, f.b).name, ca = S.cities[f.a].name, cb = S.cities[f.b].name, tg = medTarget(S, m, f);
    active = { k: m.k, st: m.st, lg: m.lg, tries: m.tries || 0, wait: Math.max(0, (m.wait || 0) - S.day), chance: Math.round(100 * medChance(S, f)), ta: Math.round(bossOf(S, f.a).trust), tb: Math.round(bossOf(S, f.b).trust), ca, cb, na: a, nb: b, gate: M.gate,
      dest: m.st === 3 ? MED_TXT.neutral : S.cities[tg[0]].name, destIds: tg, title: MED_TXT.GF[m.k].title,
      stages: MED_TXT.stage.map((s, i) => ({ n: i + 1, t: s.t, x: s.x(a, b, ca, cb), done: i < m.st, cur: i === m.st })) };
  }
  const peace = (P.peace || []).map(p => ({ k: p.k, a: p.a, b: p.b, ca: S.cities[p.a].name, cb: S.cities[p.b].name, d: p.d, cust: Math.round(100 * (1 - M.cust)), quota: M.quota }));
  return { on: true, list, peace, active };
}
function tzView(S) {
  if (!tzOn(S) || !S.bosses) return [];
  return S.order.filter(id => bossOf(S, id) && bossOf(S, id).ruler === 'boss' && bossOf(S, id).trust >= INFLU.tazkiya.min - 1e-9).map(id => {
    const bs = bossOf(S, id), why = tzBlock(S, id), last = S.player.tz && S.player.tz[id];
    return { city: id, cityName: S.cities[id].name, name: bs.name, trust: Math.round(bs.trust), can: !why, why, left: last != null ? Math.max(0, INFLU.tazkiya.cd - (S.day - last)) : 0, targets: tzTargets(S, id) };
  });
}
