/* شيخ القوافل (026): يحرّك أوضاع قوافل القادة المستأجرين القائمة (راحة، حرّ، تموين) بقراءة شاملة ولا يخترع أعمالاً. لا يشتري قافلة ولا يفصل قائداً ولا يمس قافلة يقودها اللاعب
   ولا قافلة غيّر اللاعب وضعها خلال آخر 7 أيام. القواعد نفسها في 025: exec «نفّذ وأخبرني» / ask «اسألني أولاً» (مهلة ثم ينفّذ) / mine «اتركه لي» (تذكير فقط).
   الثمن: قرار بن محمود 2026-11-05 (docs/economy/DECISION_2026-11-05.md، قسم «الرسوم»): رسم 80,000 مرة واحدة وأجر 15 يومياً (خُفّض من 60 بقرار ب2، البند 5: في أسطول سليم كان أجره 21,600 سنوياً أكبر من نفعه 4–6 آلاف؛ والرسم هو الحاجز). CHIEFC.on=false = السلوك السابق حرفياً. */
const CHIEFC = { on: true, minCars: 3, fee: 80000, wage: 15, lateQuit: 5, moraleMin: 50, idleDays: 7, userGrace: 7, restDays: 5, cashLow: 2000, topUp: 3000, short: 0.2, budget: 5000, target: 60, logMax: 40, waits: [1, 3, 7], week: 7, again: 7 };
const CHIEFC_TYPES = { rest: { name: 'الراحة بالتناوب', mode: 'exec' }, rescue: { name: 'إنقاذ القافلة الواقفة', mode: 'exec' }, supply: { name: 'تموين مخزن بسلعة ناقصة', mode: 'ask' } };
const ccActing = { on: false };
const cchiefOf = S => (CHIEFC.on && S.player && S.player.cchief) || null;
const ccCars = S => S.player.caravans.filter(c => c.captain && !c.main);
function ccDefaults() { const r = {}; for (const k of Object.keys(CHIEFC_TYPES)) r[k] = { mode: CHIEFC_TYPES[k].mode, wait: 3 }; r.supply.budget = CHIEFC.budget; r.supply.target = CHIEFC.target; return r; }
function cchiefQuote(S) {
  const P = S.player, reasons = [], n = ccCars(S).length;
  if (!CHIEFC.on) return { ok: false, msg: 'غير متاح.', reasons: ['غير متاح.'] };
  if (P.cchief) return { ok: false, msg: 'عندك شيخ قوافل.', reasons: ['عندك شيخ قوافل.'], hired: true };
  if (n < CHIEFC.minCars) reasons.push('تحتاج ' + CHIEFC.minCars + ' قوافل بقادة مستأجرين (عندك ' + n + ')');
  const cash = P.wallet.sar; if (cash < CHIEFC.fee) reasons.push('اجمع ' + Math.ceil(CHIEFC.fee - cash) + ' ريال أخرى (الرسم ' + CHIEFC.fee + ')');
  return { ok: !reasons.length, msg: reasons[0] || '', reasons, fee: CHIEFC.fee, wage: CHIEFC.wage, have: Math.min(cash, CHIEFC.fee), frac: Math.min(1, cash / CHIEFC.fee), cars: n, open: n >= CHIEFC.minCars };
}
function ccLog(S, D, kind, text, amount) { D.log.unshift({ d: S.day, kind, text, amount: Math.round((amount || 0) * 100) / 100 }); if (D.log.length > CHIEFC.logMax) D.log.length = CHIEFC.logMax; }
/* ما فعله اللاعب بيده خلال آخر أسبوع لا يُمسّ (car.userDay يُختم عند أفعاله هو لا عند أفعال الشيخ) */
const ccUserTouched = (S, car) => Number.isFinite(car.userDay) && S.day - car.userDay < CHIEFC.userGrace;
const ccAct = fn => { ccActing.on = true; try { return fn(); } finally { ccActing.on = false; } };
function ccAsk(S, D, type, key, text, extra) {
  if (D.ask.some(a => a.type === type && a.key === key)) return null; if ((D.cool[type + ':' + key] || -1) > S.day) return null;
  const rule = D.rules[type], a = Object.assign({ id: S.nextId++, type, key, text, day: S.day, due: S.day + rule.wait, remind: rule.mode === 'mine' }, extra || {});
  if (a.remind) delete a.due; D.ask.push(a); return a;
}
const ccIdleNow = (S, car) => !car.line && !laneCar(S, car) && car.left === 0 && !((car.restUntil || 0) > S.day) && (!!car.waiting && car.waiting !== 'المخزن مكتفٍ' || !(car.route || car.free || capRole(car) === 'indep' || car.sup));
function ccRest(S, D, car) {
  const r = ccAct(() => A.captainMode(S, car.id, 'rest', CHIEFC.restDays)); if (r.ok === false) return false;
  ccLog(S, D, 'rest', 'أرحتُ قائد ' + car.name + ' ' + CHIEFC.restDays + ' أيام لأن معنوياته ' + Math.round(car.morale) + '؛ يعود بعدها إلى عمله', 0); return true;
}
function ccRescue(S, D, car) {
  const cash = car.waiting === 'تعذّر الشراء' && S.player.gold < CHIEFC.cashLow;
  if (cash) {
    const dw = typeof diwanOf === 'function' ? diwanOf(S) : null;
    if (dw) { const amt = diwanCover(S, null, CHIEFC.topUp, 'wages'); if (amt > 0) { ccLog(S, D, 'rescue', 'رفعتُ أمر ' + car.name + ' (تعذّر الشراء لنقص النقد) إلى ناظر الديوان فغطّاه من الخزينة', amt); car.idleDays = 0; return true; } return false; }
    const k = 'cash:' + car.id; if (!D.ask.some(a => a.key === k)) { D.ask.push({ id: S.nextId++, type: 'rescue', key: k, text: car.name + ' واقف لنقص النقد (تعذّر الشراء)؛ أودع نقداً في محفظتك أو وظّف ناظر الديوان', day: S.day, remind: true }); }
    car.idleDays = 0; return false;
  }
  const r = ccAct(() => A.captainMode(S, car.id, 'free')); if (r.ok === false) return false;
  ccLog(S, D, 'rescue', 'أعدتُ ' + car.name + ' الواقفة منذ ' + CHIEFC.idleDays + ' أيام إلى العمل حرّة تتاجر بنفسها', 0); car.idleDays = 0; return true;
}
function ccShortages(S) { // سلع تبيعها دكاكين مدن أمنائك وقلّت من المخزن (أقل من 20٪ من هدف تعبئتها)؛ الأشد نقصاً أولاً
  const out = [];
  for (const city of Object.keys(S.player.props)) { const pr = S.player.props[city]; if (!stewardOf(S, city) || !(pr.whs > 0)) continue;
    for (const sh of pr.shops) for (const it of sh.items) { const have = pr.store[it.g] || 0, tgt = Math.max(1, it.target || CHIEFC.target); if (!GD[it.g] || GD[it.g].live || have >= tgt * CHIEFC.short || out.some(o => o.city === city && o.g === it.g)) continue; out.push({ city, g: it.g, frac: have / tgt }); } }
  return out.sort((a, b) => a.frac - b.frac);
}
function ccFreeCar(S, city, g) { // قافلة حرّة أو واقفة فقط (لا يقطع مساراً رابحاً) ولها مصدر لهذه السلعة
  return ccCars(S).filter(c => c.left === 0 && !((c.restUntil || 0) > S.day) && !c.sup && !ccUserTouched(S, c) && !c.line && !laneCar(S, c) && (c.free || capRole(c) === 'indep' || !c.route || ccIdleNow(S, c)) && supplySource(S, c, { wh: city, g })).sort((a, b) => (a.idleDays || 0) - (b.idleDays || 0) || a.id - b.id).pop() || null;
}
function ccSupply(S, D, car, city, g) {
  const rule = D.rules.supply, target = Math.max(1, Math.min(rule.target || CHIEFC.target, Math.floor(storeCap(S, city) / GD[g].w))), budget = Math.max(CAP_SUP.minBudget, rule.budget || CHIEFC.budget);
  const r = ccAct(() => A.captainSupply(S, car.id, city, g, target, budget)); if (r.ok === false) return r;
  ccLog(S, D, 'supply', 'وجّهتُ ' + car.name + ' لجلب ' + GD[g].name + ' إلى مخزن ' + S.cities[city].name + ' لأن دكاكينها قلّت منه', 0); return OK('وُجّهت قافلة التموين');
}
function ccExec(S, D, a) { // بند معلّق (بموافقتك أو بانتهاء مهلته)
  if (a.type === 'rest') { const car = ccCars(S).find(c => c.id === a.car); if (!car || car.left > 0 || ccUserTouched(S, car) || car.morale >= CHIEFC.moraleMin) return NO('لم يعد لازماً'); return ccRest(S, D, car) ? OK('أُريح') : NO('تعذّر'); }
  if (a.type === 'rescue') { const car = ccCars(S).find(c => c.id === a.car); if (!car || ccUserTouched(S, car) || !ccIdleNow(S, car)) return NO('لم تعد واقفة'); return ccRescue(S, D, car) ? OK('أُنقذت') : NO('تعذّر'); }
  if (a.type === 'supply') { if (!ccShortages(S).some(x => x.city === a.city && x.g === a.g)) return NO('لم يعد النقص قائماً'); const car = ccFreeCar(S, a.city, a.g); if (!car) return NO('لا قافلة حرّة أو واقفة الآن'); return ccSupply(S, D, car, a.city, a.g); }
  return NO('بند غير معروف');
}
function cchiefBegin(S) { // أجر الشيخ اليومي من المحفظة بالريال؛ تأخره lateQuit أيام يتركه
  const D = cchiefOf(S); if (!D) return; if (D.wageDay === S.day) return; D.wageDay = S.day;
  const P = S.player; if (P.wallet.sar + 1e-9 >= CHIEFC.wage) { const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'cchief', CHIEFC.wage, true); S.ctxCur = c0; D.paid = (D.paid || 0) + CHIEFC.wage; D.late = 0; return; }
  D.late = (D.late || 0) + 1; if (D.late >= CHIEFC.lateQuit) { delete P.cchief; news(S, 'ترك شيخ القوافل عمله لتأخر أجره.', 'bad'); }
}
function cchiefDay(S) { // قبل حركة القوافل في playerDay
  const D = cchiefOf(S); if (!D || D.day === S.day) return; D.day = S.day;
  const cars = ccCars(S);
  if (cars.length < 1) return;
  // 1) عدّاد الوقوف
  for (const c of cars) c.idleDays = ccIdleNow(S, c) ? (c.idleDays || 0) + 1 : 0;
  // 2) مهلة «اسألني»
  for (const a of D.ask.slice()) if (!a.remind && a.due != null && a.due <= S.day) { const r = ccExec(S, D, a); D.ask = D.ask.filter(x => x !== a); ccLog(S, D, 'ask', (r.ok === false ? 'انتهت مهلة سؤالك ولم يُمكن التنفيذ: ' : 'انتهت مهلة سؤالك فنفّذتُ: ') + a.text, 0); }
  // 3) الراحة بالتناوب: لا يرتاح أكثر من ثلث القوافل معاً
  const maxRest = Math.floor(cars.length / 3); let resting = cars.filter(c => (c.restUntil || 0) > S.day).length;
  for (const c of cars.filter(c => c.left === 0 && !((c.restUntil || 0) > S.day) && c.morale < CHIEFC.moraleMin && !ccUserTouched(S, c)).sort((a, b) => a.morale - b.morale || a.id - b.id)) {
    if (resting >= maxRest) break; const rule = D.rules.rest;
    if (rule.mode === 'exec') { if (ccRest(S, D, c)) resting++; } else if (ccAsk(S, D, 'rest', String(c.id), 'قائد ' + c.name + ' متعب (معنوياته ' + Math.round(c.morale) + '): أُريحه ' + CHIEFC.restDays + ' أيام؟', { car: c.id })) resting++;
  }
  // 4) إنقاذ الواقف
  for (const c of cars) if ((c.idleDays || 0) >= CHIEFC.idleDays && !ccUserTouched(S, c)) { const rule = D.rules.rescue; if (rule.mode === 'exec') ccRescue(S, D, c); else ccAsk(S, D, 'rescue', String(c.id), 'قافلة ' + c.name + ' واقفة منذ ' + c.idleDays + ' أيام: أُعيدها إلى العمل حرّة؟', { car: c.id }); }
  // 5) سدّ النقص: تموين واحد في اليوم من قافلة حرّة أو واقفة
  const sup = D.rules.supply;
  for (const s of ccShortages(S)) {
    if (supplyOf(S, s.city, s.g)) continue; const car = ccFreeCar(S, s.city, s.g); if (!car) continue;
    if (sup.mode === 'exec') { if (ccSupply(S, D, car, s.city, s.g).ok !== false) break; } else if (ccAsk(S, D, 'supply', s.city + ':' + s.g, 'دكاكين ' + S.cities[s.city].name + ' قلّ عندها ' + GD[s.g].name + ': أوجّه ' + car.name + ' لجلبه إلى المخزن؟', { city: s.city, g: s.g })) break;
  }
}
function cchiefView(S) {
  const D = cchiefOf(S), q = cchiefQuote(S); if (!D) return { hired: false, quote: q };
  return { hired: true, quote: q, rules: D.rules, ask: D.ask, did: D.log.filter(l => S.day - l.d < CHIEFC.week), wage: CHIEFC.wage, cars: ccCars(S).length, resting: ccCars(S).filter(c => (c.restUntil || 0) > S.day).length, late: D.late || 0 };
}
function cchiefMigrate(S) {
  const P = S.player; if (!P) return;
  for (const car of P.caravans || []) { if (car.idleDays !== undefined && !(Number.isFinite(car.idleDays) && car.idleDays >= 0)) delete car.idleDays; if (car.userDay !== undefined && !(Number.isSafeInteger(car.userDay) && car.userDay >= 0 && car.userDay <= S.day)) delete car.userDay; }
  if (P.cchief === undefined) return; const D = P.cchief;
  if (!D || typeof D !== 'object' || Array.isArray(D) || !Number.isSafeInteger(D.since) || D.since > S.day) { delete P.cchief; return; }
  const def = ccDefaults(), r = D.rules && typeof D.rules === 'object' ? D.rules : {}; D.rules = {};
  for (const k of Object.keys(def)) { const x = r[k] || {}; D.rules[k] = { mode: ['exec', 'ask', 'mine'].includes(x.mode) ? x.mode : def[k].mode, wait: CHIEFC.waits.includes(x.wait) ? x.wait : def[k].wait }; if (k === 'supply') { D.rules[k].budget = Number.isFinite(x.budget) && x.budget >= CAP_SUP.minBudget && x.budget <= 1e7 ? x.budget : def.supply.budget; D.rules[k].target = Number.isSafeInteger(x.target) && x.target >= 1 && x.target <= 10000 ? x.target : def.supply.target; } }
  D.ask = (Array.isArray(D.ask) ? D.ask : []).filter(a => a && Number.isSafeInteger(a.id) && def[a.type] && typeof a.key === 'string' && Number.isSafeInteger(a.day) && a.day <= S.day && (a.due == null || Number.isSafeInteger(a.due)) && typeof a.text === 'string').slice(0, 20); for (const a of D.ask) S.nextId = Math.max(S.nextId || 1, a.id + 1);
  D.log = (Array.isArray(D.log) ? D.log : []).filter(l => l && Number.isSafeInteger(l.d) && l.d <= S.day && typeof l.text === 'string' && Number.isFinite(l.amount)).slice(0, CHIEFC.logMax);
  D.cool = D.cool && typeof D.cool === 'object' && !Array.isArray(D.cool) ? Object.fromEntries(Object.entries(D.cool).filter(([, v]) => Number.isSafeInteger(v))) : {};
  for (const k of ['late', 'paid']) if (!Number.isFinite(D[k]) || D[k] < 0) D[k] = 0;
}
// ختم ما يفعله اللاعب بيده على القوافل (احترام قراره أسبوعاً)
for (const k of ['setRoute', 'captainMode', 'captainSupply']) { const f = A[k]; A[k] = function (S, carId, ...a) { const r = f.call(A, S, carId, ...a); if (r && r.ok !== false && !ccActing.on) { const car = carById(S, carId); if (car) car.userDay = S.day; } return r; }; }
Object.assign(A, {
  hireCChief(S) {
    const q = cchiefQuote(S); if (!q.ok) return NO(q.msg);
    const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'hiring', CHIEFC.fee, true); S.ctxCur = c0;
    S.player.cchief = { since: S.day, rules: ccDefaults(), ask: [], log: [], cool: {}, late: 0, paid: 0 };
    return OK('وظّفتَ شيخ القوافل بأجر ' + CHIEFC.wage + ' ريال يومياً. اختر لكل نوع من يقرر.');
  },
  fireCChief(S) { if (!cchiefOf(S)) return NO('لا شيخ قوافل عندك'); delete S.player.cchief; return OK('سرّحتَ شيخ القوافل.'); },
  cchiefRule(S, type, mode, wait, budget, target) {
    const D = cchiefOf(S); if (!D) return NO('لا شيخ قوافل عندك'); if (!CHIEFC_TYPES[type]) return NO('نوع غير معروف'); if (!DIWAN_MODES[mode]) return NO('اختر نفّذ أو اسألني أو اتركه لي');
    if (wait != null && !CHIEFC.waits.includes(+wait)) return NO('المهلة 1 أو 3 أو 7 أيام'); if (type === 'supply' && budget != null && !(Number.isFinite(+budget) && +budget >= CAP_SUP.minBudget && +budget <= 1e7)) return NO('الحد الأدنى لميزانية الرحلة ' + CAP_SUP.minBudget + ' ريال'); if (type === 'supply' && target != null && !(Number.isSafeInteger(+target) && +target >= 1 && +target <= 10000)) return NO('راجع الكمية المستهدفة');
    const r = D.rules[type]; r.mode = mode; if (wait != null) r.wait = +wait; if (type === 'supply') { if (budget != null) r.budget = Math.round(+budget); if (target != null) r.target = +target; }
    D.ask = D.ask.filter(a => !(a.type === type && (a.remind || mode === 'exec'))); return OK('حُفظت القاعدة: ' + CHIEFC_TYPES[type].name + ' ← ' + DIWAN_MODES[mode]);
  },
  cchiefAnswer(S, id, ans) {
    const D = cchiefOf(S); if (!D) return NO('لا شيخ قوافل عندك'); const a = D.ask.find(x => x.id === id); if (!a) return NO('السؤال لم يعد قائماً');
    if (ans === 'do' && !a.remind) { const r = ccExec(S, D, a); D.ask = D.ask.filter(x => x !== a); return r.ok === false ? r : OK('نُفّذ عنك.'); }
    D.ask = D.ask.filter(x => x !== a); D.cool[a.type + ':' + a.key] = S.day + CHIEFC.again; ccLog(S, D, 'ask', 'تولّيتَ بنفسك: ' + a.text, 0); return OK('حسناً، أنت تتولاها.');
  },
});
