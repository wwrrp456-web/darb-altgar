/* ---------- الصدمات الاقتصادية (المرحلة 4): إشاعة قبل 3 أيام ثم أثر ثم نهاية. الشدة والتكرار بحسب الصعوبة (S.diff: calm/normal/hard) ---------- */
const DIFF = { calm: 0.6, normal: 1, hard: 1.4 }, diffOf = S => DIFF[S.diff] || 1;
const SHOCK_WARN = 3, SHOCK_RATE = 0.05, SHOCK_MAX = 3, PORTS = ['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai'];
const shocksOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const FOODISH = new Set(['rice', 'sugar', 'honey', 'oliveoil', 'dates', 'eggs', 'cheese', 'raisins', 'cotton']);
const MONO_NAMES = ['الحاج فيصل', 'أبو غانم', 'الشيخ رشاد', 'ابن سُميط', 'التاجر شاهين', 'سيّد المنصور'];
const pickOf = (S, arr) => arr[Math.floor(rndB(S) * arr.length)];
const shockProdMul = (c, g) => { const sh = c.sh; if (!sh) return 1; const food = GD[g].tier === 'raw' || GD[g].ess || FOODISH.has(g); if (!food) return 1; return sh.k === 'famine' && g !== 'wheat' ? 1 : 1 - sh.cut; };
const shortMul = (S, a, b) => { const x = S.shortcuts && S.shortcuts[riskKey(a, b)]; return x && x.end > S.day ? 0.7 : 1; };
const SHOCKS = {
  closure: { w: 1, name: 'إغلاق حدود', dur: [10, 15], make: S => { const a = pickOf(S, Object.keys(ADJ)); return { a, b: pickOf(S, ADJ[a]) }; },
    rumor: sh => 'إشاعة: قد تُغلَق الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' بعد ' + SHOCK_WARN + ' أيام. أتمم ما تريده قبلها.',
    start: (S, sh) => news(S, 'أُغلقت الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' نحو ' + (sh.end - sh.start) + ' يوماً: لا سفر بينهما حتى تُفتح.', 'bad'),
    end: (S, sh) => news(S, 'فُتحت الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' من جديد.', 'good') },
  banditwave: { w: 1.2, name: 'موجة لصوص', dur: [10, 16], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: قطاع الطرق يكثرون حول ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. حرّاس أكثر أو تأمين أسلم.',
    start: (S, sh) => { sh.sv = {}; S.order.forEach(id => { if (id === sh.city) return; const k = riskKey(sh.city, id); if (S.risk[k] == null) return; sh.sv[k] = S.risk[k]; S.risk[k] = Math.min(0.6, S.risk[k] * (1.5 + 0.4 * sh.sev)); }); news(S, 'موجة لصوص حول ' + S.cities[sh.city].name + ': الطرق منها وإليها أخطر بنحو ' + Math.round((0.5 + 0.4 * sh.sev) * 100) + '٪.', 'bad'); },
    end: (S, sh) => { for (const k in (sh.sv || {})) S.risk[k] = sh.sv[k]; news(S, 'هدأت موجة اللصوص حول ' + S.cities[sh.city].name + '.', 'good'); } },
  pirates: { w: 0.8, name: 'قراصنة', dur: [8, 12], make: S => ({ city: pickOf(S, PORTS.filter(id => S.cities[id])) }),
    rumor: (sh, S) => 'إشاعة: قراصنة يتربصون بالسفن قرب ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام.',
    start: (S, sh) => { sh.sv = {}; PORTS.forEach(id => { if (id === sh.city || !S.cities[id]) return; const k = riskKey(sh.city, id); if (S.risk[k] == null) return; sh.sv[k] = S.risk[k]; S.risk[k] = Math.min(0.6, S.risk[k] * (1.8 + 0.4 * sh.sev)); }); news(S, 'قراصنة قرب ' + S.cities[sh.city].name + ': طرق الموانئ منها أخطر.', 'bad'); },
    end: (S, sh) => { for (const k in (sh.sv || {})) S.risk[k] = sh.sv[k]; news(S, 'انكسرت شوكة القراصنة قرب ' + S.cities[sh.city].name + '.', 'good'); } },
  drought: { w: 1, name: 'جفاف', dur: [16, 24], make: S => ({ country: pickOf(S, COUNTRIES.map(c => c.id)) }),
    rumor: sh => 'إشاعة: جفاف يلوح في ' + CD[sh.country].name + ' بعد ' + SHOCK_WARN + ' أيام، فتغلو الأقوات والخامات.',
    start: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.country === sh.country) c.sh = { k: 'drought', end: sh.end, cut: Math.min(0.7, 0.35 + 0.1 * sh.sev) }; }); news(S, 'جفاف في ' + CD[sh.country].name + ': الغلال والخامات أقل بنحو ' + Math.round(Math.min(0.7, 0.35 + 0.1 * sh.sev) * 100) + '٪.', 'bad'); },
    end: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.sh && c.sh.k === 'drought' && c.country === sh.country) c.sh = null; }); news(S, 'انتهى الجفاف في ' + CD[sh.country].name + '.', 'good'); } },
  flood: { w: 0.7, name: 'فيضان', dur: [12, 18], make: S => ({ country: 'eg' }),
    rumor: sh => 'إشاعة: النيل يفيض بعد ' + SHOCK_WARN + ' أيام وقد يُتلف الزروع.',
    start: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.country === 'eg') c.sh = { k: 'flood', end: sh.end, cut: Math.min(0.6, 0.3 + 0.1 * sh.sev) }; }); news(S, 'فيضان في مصر: الزروع والخامات أقل بنحو ' + Math.round(Math.min(0.6, 0.3 + 0.1 * sh.sev) * 100) + '٪ حتى ينحسر الماء.', 'bad'); },
    end: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.sh && c.sh.k === 'flood') c.sh = null; }); news(S, 'انحسر الفيضان في مصر.', 'good'); } },
  famine: { w: 0.7, name: 'مجاعة', dur: [12, 18], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: القمح يشحّ في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. من يحمل القمح يربح.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.sh = { k: 'famine', end: sh.end, cut: Math.min(0.7, 0.45 + 0.1 * sh.sev) }; c.stock.wheat *= 0.4; news(S, 'قحط في ' + c.name + ': القمح نادر والأسعار تصعد.', 'bad'); },
    end: (S, sh) => { const c = S.cities[sh.city]; if (c.sh && c.sh.k === 'famine') c.sh = null; news(S, 'عاد القمح إلى أسواق ' + c.name + '.', 'good'); } },
  fair: { w: 1, name: 'معرض تجاري', dur: [8, 10], make: S => { const ids = S.order.filter(id => !S.cities[id].ev); return ids.length ? { city: pickOf(S, ids) } : null; },
    rumor: (sh, S) => 'إشاعة: معرض تجاري كبير في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام: الأسعار صاعدة والبيع رابح.',
    start: (S, sh) => { const c = S.cities[sh.city]; if (!c.ev) c.ev = { k: 'festival', left: sh.end - sh.start }; news(S, 'افتُتح المعرض التجاري في ' + c.name + ': بِع ما معك بأسعار أعلى.', 'good'); },
    end: () => {} },
  sickness: { w: 0.8, name: 'مرض في القافلة', dur: [1, 1], make: S => ({}),
    rumor: () => 'إشاعة: مرض يتفشى بين القوافل في الطرق، فخذ رجالاً أكثر وطعاماً جيداً.',
    start: (S, sh) => { const car = S.player.caravans[0]; if (!car) return; const n = Math.min(car.crew, Math.ceil(2 * sh.sev)); car.crew -= n; car.morale = Math.max(0, car.morale - 15); news(S, 'مرض في قافلتك: غاب ' + n + ' من رجالك وهبطت المعنويات. وظّف رجالاً وأرحهم.', 'bad'); },
    end: () => {} },
  fire: { w: 0.7, name: 'حريق مخزن', dur: [1, 1], make: S => { const ids = Object.keys(S.player.props).filter(id => S.player.props[id].whs && valueOf(S.player.props[id].store) > 400); return ids.length ? { city: pickOf(S, ids) } : null; },
    rumor: (sh, S) => 'إشاعة: حرائق تشتعل في مخازن ' + S.cities[sh.city].name + '. تفقّد مخزنك وأمينه.',
    start: (S, sh) => { const pr = S.player.props[sh.city]; if (!pr) return; const keeper = keeperHave(S, sh.city) >= keeperNeed(S, sh.city) && keeperNeed(S, sh.city) > 0; const f = clamp((0.12 + 0.13 * rndB(S)) * sh.sev * (keeper ? 0.5 : 1), 0.05, 0.5); let lost = 0; for (const g in pr.store) { const l = pr.store[g] * f; pr.store[g] -= l; lost += l * mid(g); takeBasis(pr.basis || (pr.basis = {}), g, l); } const comp = insOn(S, sh.city) ? tkClaim(S, lost, TK.cover) : 0; sink(S, 'fire', lost); news(S, 'حريق في مخزنك بـ' + S.cities[sh.city].name + ' التهم نحو ' + Math.round(f * 100) + '٪ من البضاعة (' + fmtN(lost) + ' ريال)' + (comp > 0 ? ' وعوّضك صندوق التكافل بـ' + fmtN(comp) + ' ريال.' : keeper ? ' لولا أمينك لكان أشدّ.' : '. أمين المخزن يخفف الخسارة.'), 'bad'); learnReact(S, 'shockFire'); },
    end: () => {} },
  taxraid: { w: 0.8, name: 'مداهمة ضريبية', dur: [1, 1], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: عمّال الضرائب يداهمون تجّار ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. من كان حسابه نظيفاً فلا يخاف.',
    start: (S, sh) => { const bad = (S.zakat && S.zakat.due && S.zakat.defer) || (repOf(S.player).broke || 0) > 0; if (bad) { const fine = Math.round(Math.max(200, S.player.gold * 0.04 * sh.sev)); ctxFor(S, sh.city); pPay(S, 'fine', fine, true); news(S, 'داهم عمّال الضرائب ' + S.cities[sh.city].name + ' ووجدوا عليك تقصيراً (زكاة مؤجَّلة أو عقداً مفسوخاً): غرامة ' + fmtN(fine) + ' ريال.', 'bad'); learnReact(S, 'shockTax'); } else news(S, 'داهم عمّال الضرائب ' + S.cities[sh.city].name + ' ومرّت حساباتك سليمة: سمعتك تشفع لك.', 'good'); },
    end: () => {} },
  dump: { w: 1, name: 'إغراق السوق', dur: [8, 10], make: S => { const c = S.cities[pickOf(S, S.order)], gs = GIDS.filter(g => !GD[g].live && !GD[g].fresh && GD[g].tier !== 'raw' && g !== 'wheat' && sells(c, g)); return gs.length ? { city: c.id, g: pickOf(S, gs) } : null; },
    rumor: (sh, S) => 'إشاعة: تجّار يُعدّون لإغراق سوق ' + S.cities[sh.city].name + ' بـ' + GD[sh.g].name + ' بعد ' + SHOCK_WARN + ' أيام.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = capG(c, sh.g) * 1.25; news(S, 'أُغرق سوق ' + c.name + ' بـ' + GD[sh.g].name + ': سعره يهبط، وفرصة لمن يشتري ويحمله إلى سوق آخر.', 'good'); },
    end: () => {} },
  monopoly: { w: 0.7, name: 'احتكار تاجر كبير', dur: [14, 20], make: S => { const c = S.cities[pickOf(S, S.order)], gs = GIDS.filter(g => !GD[g].live && !GD[g].fresh && GD[g].tier !== 'raw' && g !== 'wheat' && sells(c, g)); return gs.length ? { city: c.id, g: pickOf(S, gs), who: pickOf(S, MONO_NAMES) } : null; },
    rumor: (sh, S) => 'إشاعة: التاجر الكبير ' + sh.who + ' يشتري كل ' + GD[sh.g].name + ' في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام ليحتكره. من يحمل ' + GD[sh.g].name + ' إليه يربح، لكن احتكاره لا يدوم.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = Math.min(c.stock[sh.g], capG(c, sh.g) * 0.1); news(S, sh.who + ' اشترى كل ' + GD[sh.g].name + ' في ' + c.name + ': السعر يصعد. احمل إليه من سوق آخر وبِعه بسعره.', 'bad'); },
    day: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = Math.min(c.stock[sh.g], capG(c, sh.g) * 0.15); },
    end: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = capG(c, sh.g) * 1.3; news(S, 'انكسر احتكار ' + sh.who + ' لـ' + GD[sh.g].name + ' في ' + c.name + ' وأغرق السوق بما خزّنه: السعر يهبط.', 'good'); } },
  discovery: { w: 0.8, name: 'اكتشاف طريق', dur: [26, 32], make: S => { const a = pickOf(S, S.order); const b = pickOf(S, S.order.filter(x => x !== a)); return { a, b }; },
    rumor: (sh, S) => 'إشاعة: دليل يزعم طريقاً أقصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + '.',
    start: (S, sh) => { S.shortcuts = S.shortcuts || {}; S.shortcuts[riskKey(sh.a, sh.b)] = { end: sh.end }; news(S, 'اكتُشف طريق مختصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + ': الرحلة أقصر بنحو 30٪.', 'good'); },
    end: (S, sh) => { if (S.shortcuts) delete S.shortcuts[riskKey(sh.a, sh.b)]; news(S, 'ضاع الطريق المختصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + ' بفعل الرمال.', ''); } },
};
function shockDay(S) {
  S.shocks = S.shocks || [];
  for (const sh of S.shocks.slice()) {
    const K = SHOCKS[sh.k]; if (!K) { S.shocks = S.shocks.filter(x => x !== sh); continue; }
    if (sh.st === 'rumor' && S.day >= sh.start) { sh.st = 'on'; K.start(S, sh); }
    else if (sh.st === 'on' && S.day >= sh.end) { K.end(S, sh); S.shocks = S.shocks.filter(x => x !== sh); }
  }
  if (!shocksOn(S) || S.day < 15 || S.shocks.length >= SHOCK_MAX) return;
  if (rndB(S) >= SHOCK_RATE * diffOf(S)) return;
  const ks = Object.keys(SHOCKS), tot = ks.reduce((a, k) => a + SHOCKS[k].w, 0); let r = rndB(S) * tot, k = ks[0]; for (const x of ks) { r -= SHOCKS[x].w; if (r <= 0) { k = x; break; } }
  if (S.shocks.some(x => x.k === k)) return;
  const K = SHOCKS[k], par = K.make(S); if (!par) return;
  const dur = K.dur[0] + Math.floor(rndB(S) * (K.dur[1] - K.dur[0] + 1)), sh = Object.assign({ id: S.nextId++, k, st: 'rumor', warn: S.day, start: S.day + SHOCK_WARN, end: S.day + SHOCK_WARN + dur, sev: diffOf(S) }, par);
  S.shocks.push(sh); news(S, K.rumor(sh, S), 'rumor'); learnReact(S, 'shockRumor', 6);
}
// منع السفر عبر حدود مغلقة
function shockBlock(S, fromCity, dest) {
  for (const sh of (S.shocks || [])) if (sh.st === 'on' && sh.k === 'closure') {
    const a = S.cities[fromCity].country, b = S.cities[dest].country;
    if ((a === sh.a && b === sh.b) || (a === sh.b && b === sh.a)) return 'الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' مغلقة حتى اليوم ' + sh.end + '.';
  }
  return null;
}
/* حدث الطريق التفاعلي: قطاع طرق (قاتل / ادفع جزية / ناور) */
function roadResolve(S, choice) {
  const R = S.road; if (!R) return NO('لا حدث');
  const car = S.player.caravans.find(c => c.id === R.car) || S.player.caravans[0], to = R.to; S.road = null;
  if (choice === 'pay') {
    const val = valueOf(holdings(car)), t = Math.min(S.player.gold, Math.round(val * 0.08)); ctxFor(S, to); pPay(S, 'tribute', t, true); car.morale = Math.max(0, car.morale - 3);
    news(S, 'دفعتَ جزية ' + fmtN(t) + ' ريال لقطاع الطرق فتركوا قافلتك. أرخص من نهبها.', ''); learnReact(S, 'roadPaid', 20); return { ok: true, outcome: 'paid', msg: 'دفعتَ ' + fmtN(t) + ' ريال ومرّت القافلة' };
  }
  if (choice === 'evade') {
    const ch = clamp(0.3 + 0.03 * car.crew + (car.captain ? 0.05 * car.captain.nav : 0), 0.2, 0.8);
    if (rndB(S) < ch) { news(S, 'التفّت قافلتك حول الكمين ووصلت سالمة إلى ' + S.cities[to].name + '.', 'good'); return { ok: true, outcome: 'evaded', msg: 'التففتم حول الكمين بسلام' }; }
    const r = banditFight(S, car, to, R.B, 0.8); return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', msg: r.repelled ? 'اكتُشفتم لكن حرّاسك صدّوهم' : 'اكتُشفتم ونُهب نحو ' + Math.round(r.f * 100) + '٪' };
  }
  const r = banditFight(S, car, to, R.B, choice === 'fight' ? 1.15 : 1);
  return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', msg: r.repelled ? 'صدّ حرّاسك قطاع الطرق' : 'غلبكم قطاع الطرق ونهبوا نحو ' + Math.round(r.f * 100) + '٪' };
}
const roadAuto = S => { roadResolve(S, 'auto'); };
