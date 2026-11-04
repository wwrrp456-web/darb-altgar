/* الشهبندر (027): رئيس التجار في الميناء. يشغّل «خطاً بحرياً» لسفينة راسية بقافلة مستأجرة بين ميناءين: يبيع الحمولة، ويشتري أفضل صفقة إلى الميناء الآخر
   (bestDeal بوجهة محددة)، ويُبحر بـ startSail القائم (الرسم والمؤن والمخاطر نفسها)، ويعود. لا يُبحر خط ضد الريح إلا إن اختار اللاعب «كل المواسم».
   الإبحار القائم بلا تغيير في قواعده؛ الجديد الوحيد هو الخط. القواعد كما في 025: exec / ask (مهلة) / mine. فتح الخط وإلغاؤه وشراء السفن وبيعها للاعب وحده.
   الثمن: قرار بن محمود 2026-11-05 (docs/economy/DECISION_2026-11-05.md، قسم «الرسوم»): رسم 100,000 مرة واحدة وأجر 80 يومياً. وحمولة الخط (قرار 027): qty=100 وحدة في الرحلة (كانت 30 كحد bestDeal؛ القافلة البرية تبقى 30) فالخط الافتراضي 1.16 من البرية. PORTM.on=false = السلوك السابق حرفياً. */
const PORTM = { on: true, fee: 100000, wage: 80, qty: 100, lateQuit: 5, noDealDays: 2, incidents: 2, incWindow: 90, fixCool: 30, budgetShare: 0.4, topUp: 3000, logMax: 40, waits: [1, 3, 7], week: 7, again: 7 };
const PORTM_TYPES = { dock: { name: 'الإرساء والإطلاق مع الموسم', mode: 'exec' }, run: { name: 'تشغيل خط قائم', mode: 'exec' }, fix: { name: 'تقوية سفينة وتوظيف بحّارة', mode: 'ask' } };
const portmOf = S => (PORTM.on && S.player && S.player.portm) || null;
const pmLines = S => S.player.caravans.filter(c => c.line && c.captain && !c.main);
const pmShip = (S, line) => shipsOf(S).find(x => x.id === line.ship) || null;
const pmUser = { on: false };
function pmDefaults() { const r = {}; for (const k of Object.keys(PORTM_TYPES)) r[k] = { mode: PORTM_TYPES[k].mode, wait: 3 }; return r; }
function portmQuote(S) {
  const P = S.player, reasons = [], ships = shipsOf(S).length, trips = P.seaTrips || 0;
  if (!PORTM.on) return { ok: false, msg: 'غير متاح.', reasons: ['غير متاح.'] };
  if (P.portm) return { ok: false, msg: 'عندك شهبندر.', reasons: ['عندك شهبندر.'], hired: true };
  if (trips < 1) reasons.push('أتمّ رحلة بحرية واحدة أولاً'); if (ships < 1) reasons.push('اشترِ سفينة أولاً');
  const cash = P.wallet.sar; if (cash < PORTM.fee) reasons.push('اجمع ' + Math.ceil(PORTM.fee - cash) + ' ريال أخرى (الرسم ' + PORTM.fee + ')');
  return { ok: !reasons.length, msg: reasons[0] || '', reasons, fee: PORTM.fee, wage: PORTM.wage, have: Math.min(cash, PORTM.fee), frac: Math.min(1, cash / PORTM.fee), open: trips >= 1 && ships >= 1 };
}
function pmLog(S, D, kind, text, amount) { D.log.unshift({ d: S.day, kind, text, amount: Math.round((amount || 0) * 100) / 100 }); if (D.log.length > PORTM.logMax) D.log.length = PORTM.logMax; }
function pmAsk(S, D, type, key, text, extra) {
  if (D.ask.some(a => a.type === type && a.key === key)) return null; if ((D.cool[type + ':' + key] || -1) > S.day) return null;
  const rule = D.rules[type], a = Object.assign({ id: S.nextId++, type, key, text, day: S.day, due: S.day + rule.wait, remind: rule.mode === 'mine' }, extra || {});
  if (a.remind) delete a.due; D.ask.push(a); return a;
}
/* بعد كم يوماً يفتح موسم الإبحار بين الميناءين (يمسح الأيام القادمة دون تغيير الحالة) */
function portmOpensIn(S, from, to) {
  if (monsoonOf(S, from, to).fair) return 0; const d0 = S.day;
  try { for (let d = 1; d <= 400; d++) { S.day = d0 + d; if (monsoonOf(S, from, to).fair) return d; } } finally { S.day = d0; } return null;
}
function pmCash(S, car, msg) { // عجز النقد: ينتظر ويرفع للناظر إن وُجد (FR-003)
  if (/رصيدك لا يكفي/.test(msg || '') && typeof diwanOf === 'function' && diwanOf(S)) diwanCover(S, null, PORTM.topUp, 'wages');
}
function pmSell(S, car) { // بيع الحمولة في الميناء (منطق autoRoute نفسه)
  const P = S.player, c = S.cities[car.city]; ctxFor(S, car.city); const haggle = 1 + 0.015 * (car.captain ? car.captain.trade : 0);
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) { const res = sellUnits(S, P, c, g, Math.floor(car.cargo[g]), car.cargo, true, haggle, 'auto', car.basis[g]); if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); const rec = logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost, 'auto'); car.pl = (car.pl || 0) + rec.pl; } }
}
/* خطة اليوم للخط من الميناء الحالي (D5 + قرار ب3): العبور مع الموسم؛ وفي انتظاره يعمل الخط على الساحل بين موانئ بحره نفسه (SEA_REGION واحد، الرياح فيها هادئة)،
   ثم يعود إلى ميناء العبور قبل الفتح بمدة رحلة الساحل ليعبر عند الفتح. kind: cross | coast | return | wait */
function pmPlan(S, car, L, ship, here) {
  const T = SHIPS[ship.type], rh = SEA_REGION[here], crossHere = SEA_REGION[L.a] === rh ? L.a : SEA_REGION[L.b] === rh ? L.b : null; if (!crossHere) return { kind: 'wait' };
  const cross = crossHere === L.a ? L.b : L.a, fair = monsoonOf(S, crossHere, cross).fair;
  if (L.allSeasons || fair) return here === crossHere ? { kind: 'cross', dest: cross } : { kind: 'return', dest: crossHere };
  const opens = portmOpensIn(S, crossHere, cross), days = (x, y) => seaDays(S, car, T, x, y, ship), ports = PORTS.filter(p => SEA_REGION[p] === rh && p !== here);
  if (here !== crossHere && opens != null && opens <= days(here, crossHere) + 1) return { kind: 'return', dest: crossHere }; // يقترب الفتح: ارجع لتعبر
  let best = null;
  for (const p of ports) { if (opens != null && opens <= days(here, p) + days(p, crossHere)) continue; const d = bestDeal(S, car, S.player.gold * PORTM.budgetShare, 'auto', p, PORTM.qty); if (d && (!best || d.pct > best.pct)) best = { dest: p, pct: d.pct }; }
  if (best) return { kind: 'coast', dest: best.dest };
  return here === crossHere ? { kind: 'wait', opens } : { kind: 'return', dest: crossHere };
}
function portmDepart(S, car, destOverride) { // شراء أفضل صفقة إلى الوجهة ثم الإبحار
  const L = car.line, D = portmOf(S), P = S.player, here = car.city, ship = pmShip(S, L); if (!D || !ship) return NO('لا خط');
  const plan = destOverride ? { dest: destOverride, kind: destOverride === L.a || destOverride === L.b ? 'cross' : 'coast' } : pmPlan(S, car, L, ship, here); if (!plan.dest) return NO('لا وجهة');
  const other = plan.dest, c = S.cities[here]; ctxFor(S, here);
  const d = bestDeal(S, car, P.gold * PORTM.budgetShare, 'auto', other, PORTM.qty);
  if (d) { const shipRoom = SHIPS[ship.type].cap - loadOf(car), room = Math.min(capOfCar(car) - loadOf(car), shipRoom), budget = { gold: Math.min(P.gold * PORTM.budgetShare, d.cost * 1.1) }, res = buyUnits(S, budget, c, d.g, Math.min(d.q, room / GD[d.g].w), room, car.cargo, true); if (res.n >= 1) { P.gold -= res.cost; addBasis(car.basis, d.g, res.n, res.cost); L.noDeal = 0; } else L.noDeal = (L.noDeal || 0) + 1; }
  else L.noDeal = (L.noDeal || 0) + 1;
  if (plan.kind !== 'coast' && (L.noDeal || 0) > 0 && (L.noDeal || 0) < PORTM.noDealDays && loadOf(car) < 1) { car.waiting = 'لا صفقة مجزية الآن'; return NO('لا صفقة مجزية الآن'); } // يومان قبل الإبحار فارغاً لتجد صفقة في الميناء الآخر
  const snap = seaStat(S).storm + seaStat(S).pirates, r = startSail(S, car, other, undefined);
  if (!r.ok) { car.waiting = r.msg; pmCash(S, car, r.msg); return NO(r.msg); }
  car.waiting = null; L.noDeal = 0; L.wasWait = false; L.snap = snap; L.sails = (L.sails || 0) + 1; if (plan.kind === 'coast') L.coast = (L.coast || 0) + 1; return OK('أبحرت ' + car.name + ' إلى ' + S.cities[other].name);
}
function autoLine(S, car) { // يومياً لقافلة على خط، راسية في ميناء الخط أو في ميناء ساحل أحد بحريه (تُستدعى من حلقة القادة)
  const L = car.line, D = portmOf(S); if (!D) return;
  const ship = pmShip(S, L); if (!ship || !isPort(L.a) || !isPort(L.b)) { delete car.line; news(S, 'أُلغي خط ' + car.name + ' لأن سفينته لم تعد لك.', 'bad'); return; }
  const here = car.city; if (!isPort(here) || (SEA_REGION[here] !== SEA_REGION[L.a] && SEA_REGION[here] !== SEA_REGION[L.b])) { car.waiting = 'خارج الخط: عُد إلى ' + S.cities[L.a].name + ' أو ' + S.cities[L.b].name; return; }
  if (ship.city !== here) { car.waiting = 'السفينة ليست في ' + S.cities[here].name; return; }
  pmSell(S, car); const plan = pmPlan(S, car, L, ship, here);
  if (plan.kind === 'wait') { const crossHere = SEA_REGION[L.a] === SEA_REGION[here] ? L.a : L.b, cross = crossHere === L.a ? L.b : L.a, d = portmOpensIn(S, crossHere, cross); L.wasWait = true; car.waiting = 'تنتظر الموسم: يفتح بعد ' + (d == null ? '؟' : d) + ' يوماً'; return; }
  const type = plan.kind === 'cross' && L.wasWait ? 'dock' : 'run', rule = D.rules[type]; if (plan.kind === 'cross' || plan.kind === 'return') L.wasWait = L.wasWait && plan.kind === 'cross';
  if (rule.mode === 'exec') { portmDepart(S, car, plan.dest); return; }
  car.waiting = rule.mode === 'ask' ? 'بانتظار ردّك على سؤال الشهبندر' : 'جاهزة للإبحار: بانتظارك';
  pmAsk(S, D, type, String(car.id), (plan.kind === 'cross' && L.wasWait ? 'فتح الموسم: ' : plan.kind === 'coast' ? 'على الساحل في انتظار الموسم: ' : '') + 'أُبحر بـ' + car.name + ' من ' + S.cities[here].name + ' إلى ' + S.cities[plan.dest].name + '؟', { car: car.id, dest: plan.dest });
}
function pmExec(S, D, a) {
  if (a.type === 'run' || a.type === 'dock') { const car = pmLines(S).find(c => c.id === a.car); if (!car || car.left > 0 || ((car.restUntil || 0) > S.day)) return NO('لم يعد لازماً'); return portmDepart(S, car, a.dest); }
  if (a.type === 'fix') { const sh = shipsOf(S).find(x => x.id === a.ship); if (!sh || !sh.city) return NO('السفينة ليست راسية'); const hull = shipUp(sh, 'hull') < 2, r = ccActingFix(() => hull ? A.upgradeShip(S, sh.id, 'hull') : A.hireSailor(S, sh.id)); if (r.ok === false) return r; pmLog(S, D, 'fix', (hull ? 'قوّيتُ هيكل ' : 'وظّفتُ بحّاراً في ') + sh.name + ' لكثرة العواصف والقراصنة على خطها', 0); return OK('نُفّذ'); }
  return NO('بند غير معروف');
}
const ccActingFix = fn => fn(); // أفعال الصيانة القائمة بلا ختم خاص
function portmBegin(S) { // أجر الشهبندر اليومي من المحفظة بالريال؛ تأخره lateQuit أيام يتركه فتُلغى الخطوط
  const D = portmOf(S); if (!D) return; if (D.wageDay === S.day) return; D.wageDay = S.day; const P = S.player;
  if (P.wallet.sar + 1e-9 >= PORTM.wage) { const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'portm', PORTM.wage, true); S.ctxCur = c0; D.paid = (D.paid || 0) + PORTM.wage; D.late = 0; return; }
  D.late = (D.late || 0) + 1; if (D.late >= PORTM.lateQuit) { for (const c of P.caravans) delete c.line; delete P.portm; news(S, 'ترك الشهبندر عمله لتأخر أجره وأُلغيت خطوطه.', 'bad'); }
}
function portmDay(S) { // قبل حلقة القوافل
  const D = portmOf(S); if (!D || D.day === S.day) return; D.day = S.day; const lines = pmLines(S);
  // مهلة «اسألني»
  for (const a of D.ask.slice()) if (!a.remind && a.due != null && a.due <= S.day) { const r = pmExec(S, D, a); D.ask = D.ask.filter(x => x !== a); pmLog(S, D, 'ask', (r.ok === false ? 'انتهت مهلة سؤالك ولم يُمكن التنفيذ: ' : 'انتهت مهلة سؤالك فنفّذتُ: ') + a.text, 0); }
  // حوادث الخطوط (عاصفة أو قراصنة عند الوصول) ⇒ صيانة السفينة
  for (const car of lines) { const L = car.line; if (L.snap != null && car.left === 0) { if (seaStat(S).storm + seaStat(S).pirates > L.snap) (L.hist = L.hist || []).push(S.day); L.snap = null; } L.hist = (L.hist || []).filter(d => S.day - d <= PORTM.incWindow);
    if (L.hist.length >= PORTM.incidents) { const sh = pmShip(S, L); if (sh && sh.city && (shipUp(sh, 'hull') < 2 || shipCrew(sh) < SHIPS[sh.type].slots)) { const rule = D.rules.fix, k = 'fix:' + sh.id; if ((D.cool[k] || -1) <= S.day) { if (rule.mode === 'exec') { if (pmExec(S, D, { type: 'fix', ship: sh.id }).ok !== false) D.cool[k] = S.day + PORTM.fixCool; } else if (pmAsk(S, D, 'fix', String(sh.id), 'كثرت العواصف والقراصنة على خط ' + car.name + ' (' + L.hist.length + ' في ' + PORTM.incWindow + ' يوماً): أقوّي هيكل ' + sh.name + ' أو أوظّف بحّاراً؟', { ship: sh.id })) D.cool[k] = S.day + PORTM.fixCool; } } } }
  // التقرير الأسبوعي: أرباح البحر
  if (S.day % PORTM.week === 0 && D.week.day !== S.day) { const snap = D.week.snap || {}; let tot = 0; const next = {}; for (const car of lines) { const pl = car.pl || 0; tot += pl - (snap[car.id] != null ? snap[car.id] : pl); next[car.id] = pl; } D.week = { day: S.day, snap: next, last: Math.round(tot) }; if (lines.length) { pmLog(S, D, 'report', 'أرباح البحر هذا الأسبوع ' + Math.round(tot) + ' ريال', tot); news(S, 'الشهبندر: أرباح البحر هذا الأسبوع ' + Math.round(tot) + ' ريال.', tot < 0 ? 'bad' : ''); } }
}
function portmView(S) {
  const D = portmOf(S), q = portmQuote(S); if (!D) return { hired: false, quote: q };
  const lines = pmLines(S).map(car => { const L = car.line, sh = pmShip(S, L), here = car.left > 0 ? null : car.city, other = here ? (here === L.a ? L.b : L.a) : null, fair = here && other ? monsoonOf(S, here, other).fair : null;
    return { car: car.id, name: car.name, ship: sh ? sh.name : null, shipId: L.ship, a: L.a, b: L.b, allSeasons: !!L.allSeasons, at: here, moving: car.left > 0, dest: car.left > 0 ? car.dest : null, left: car.left, waiting: car.waiting || null, opens: here && other && !fair && !L.allSeasons ? portmOpensIn(S, here, other) : 0, sails: L.sails || 0, pl: Math.round(car.pl || 0) }; });
  return { hired: true, quote: q, rules: D.rules, ask: D.ask, did: D.log.filter(l => S.day - l.d < PORTM.week), lines, wage: PORTM.wage, weekPl: D.week.last || 0, late: D.late || 0 };
}
function portmPanel(S, city) { // لوحة ميناء: السفن الراسية والقادمة وموعد فتح الموسم
  if (!isPort(city)) return null; const ships = shipsOf(S), docked = ships.filter(x => x.city === city).map(x => ({ id: x.id, name: x.name, line: pmLines(S).find(c => c.line.ship === x.id) || null }));
  const incoming = ships.filter(x => x.dest === city).map(x => { const car = S.player.caravans.find(c => c.sea && c.sea.ship === x.id); return { id: x.id, name: x.name, from: car ? car.sea.from : null, left: car ? car.left : null, cargo: car ? Object.keys(car.cargo).filter(g => (car.cargo[g] || 0) >= 1).sort((a, b) => car.cargo[b] * mid(b) - car.cargo[a] * mid(a)).slice(0, 2) : [] }; });
  const waits = pmLines(S).filter(c => c.city === city && c.left === 0 && c.waiting && /الموسم/.test(c.waiting)).map(c => { const o = c.line.a === city ? c.line.b : c.line.a; return { car: c.name, opens: portmOpensIn(S, city, o) }; });
  return { city, docked, incoming, waits };
}
function portmMigrate(S) {
  const P = S.player; if (!P) return;
  for (const car of P.caravans || []) { if (car.line === undefined) continue; const L = car.line;
    if (!L || typeof L !== 'object' || !Number.isSafeInteger(L.ship) || !PORTS.includes(L.a) || !PORTS.includes(L.b) || L.a === L.b || !car.captain || car.main) { delete car.line; continue; }
    L.allSeasons = !!L.allSeasons; for (const k of ['noDeal', 'sails']) if (!(Number.isFinite(L[k]) && L[k] >= 0)) L[k] = 0; L.wasWait = !!L.wasWait; if (!Number.isFinite(L.snap)) L.snap = null; L.hist = (Array.isArray(L.hist) ? L.hist : []).filter(d => Number.isSafeInteger(d) && d <= S.day).slice(-10); }
  if (P.portm === undefined) return; const D = P.portm;
  if (!D || typeof D !== 'object' || Array.isArray(D) || !Number.isSafeInteger(D.since) || D.since > S.day) { delete P.portm; for (const c of P.caravans || []) delete c.line; return; }
  const def = pmDefaults(), r = D.rules && typeof D.rules === 'object' ? D.rules : {}; D.rules = {}; for (const k of Object.keys(def)) { const x = r[k] || {}; D.rules[k] = { mode: ['exec', 'ask', 'mine'].includes(x.mode) ? x.mode : def[k].mode, wait: PORTM.waits.includes(x.wait) ? x.wait : def[k].wait }; }
  D.ask = (Array.isArray(D.ask) ? D.ask : []).filter(a => a && Number.isSafeInteger(a.id) && def[a.type] && typeof a.key === 'string' && Number.isSafeInteger(a.day) && a.day <= S.day && (a.due == null || Number.isSafeInteger(a.due)) && typeof a.text === 'string').slice(0, 20); for (const a of D.ask) S.nextId = Math.max(S.nextId || 1, a.id + 1);
  D.log = (Array.isArray(D.log) ? D.log : []).filter(l => l && Number.isSafeInteger(l.d) && l.d <= S.day && typeof l.text === 'string' && Number.isFinite(l.amount)).slice(0, PORTM.logMax);
  D.cool = D.cool && typeof D.cool === 'object' && !Array.isArray(D.cool) ? Object.fromEntries(Object.entries(D.cool).filter(([, v]) => Number.isSafeInteger(v))) : {};
  const w = D.week && typeof D.week === 'object' ? D.week : {}; D.week = { day: Number.isSafeInteger(w.day) && w.day <= S.day ? w.day : -1, snap: w.snap && typeof w.snap === 'object' && !Array.isArray(w.snap) ? Object.fromEntries(Object.entries(w.snap).filter(([, v]) => Number.isFinite(v))) : {}, last: Number.isFinite(w.last) ? w.last : 0 };
  for (const k of ['late', 'paid']) if (!Number.isFinite(D[k]) || D[k] < 0) D[k] = 0;
}
// حواجز: قافلة على خط لا يغيّر اللاعب وضعها بغير إلغاء الخط؛ والسفينة المربوطة لا تُستعمل لغير خطها
for (const k of ['setRoute', 'captainSupply']) { const f = A[k]; A[k] = function (S, carId, ...a) { const car = carById(S, carId); if (PORTM.on && car && car.line) return NO('هذه القافلة على خط بحري؛ ألغِ الخط أولاً'); return f.call(A, S, carId, ...a); }; }
{ const f = A.captainMode; A.captainMode = function (S, carId, mode, days) { const car = carById(S, carId); if (PORTM.on && car && car.line && mode !== 'rest') return NO('هذه القافلة على خط بحري؛ ألغِ الخط أولاً'); return f.call(A, S, carId, mode, days); }; }
Object.assign(A, {
  hirePortM(S) {
    const q = portmQuote(S); if (!q.ok) return NO(q.msg); const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'hiring', PORTM.fee, true); S.ctxCur = c0;
    S.player.portm = { since: S.day, rules: pmDefaults(), ask: [], log: [], cool: {}, late: 0, paid: 0, week: { day: -1, snap: {}, last: 0 } };
    return OK('وظّفتَ الشهبندر بأجر ' + PORTM.wage + ' ريال يومياً. افتح له خطاً بحرياً بين ميناءين بسفينة وقافلة مستأجرة.');
  },
  firePortM(S) { if (!portmOf(S)) return NO('لا شهبندر عندك'); for (const c of S.player.caravans) delete c.line; delete S.player.portm; return OK('سرّحتَ الشهبندر وأُلغيت خطوطه.'); },
  portmOpenLine(S, carId, shipId, a, b, allSeasons) {
    const D = portmOf(S); if (!D) return NO('لا شهبندر عندك'); const car = carById(S, carId), ship = shipsOf(S).find(x => x.id === shipId);
    if (!car || !car.captain || car.main) return NO('الخط لقافلة يقودها قائد مستأجر، لا لقافلتك الرئيسية'); if (car.line) return NO('هذه القافلة على خط بالفعل'); if (!ship) return NO('اختر سفينة'); if (pmLines(S).some(c => c.line.ship === shipId)) return NO('السفينة مربوطة بخط آخر');
    if (!isPort(a) || !isPort(b) || a === b) return NO('اختر ميناءين مختلفين'); if (car.left > 0) return NO('القافلة في الطريق'); if (car.city !== a && car.city !== b) return NO('يبدأ الخط والقافلة في أحد ميناءيه (الآن في ' + S.cities[car.city].name + ')'); if (ship.city !== car.city) return NO('السفينة ليست راسية في ' + S.cities[car.city].name);
    car.line = { ship: shipId, a, b, allSeasons: !!allSeasons, noDeal: 0, sails: 0, wasWait: false, snap: null, hist: [] }; car.route = null; car.free = false; car.sup = null; car.waiting = null;
    return OK('فُتح خط ' + car.name + ' بين ' + S.cities[a].name + ' و' + S.cities[b].name + ' بسفينة ' + ship.name + (allSeasons ? ' (يُبحر في كل المواسم)' : ' (يلتزم موسم الرياح)') + '.');
  },
  portmCloseLine(S, carId) { const car = carById(S, carId); if (!car || !car.line) return NO('لا خط'); delete car.line; car.waiting = null; return OK('أُلغي الخط؛ القافلة والسفينة حرّتان.'); },
  portmAllSeasons(S, carId, on) { const car = carById(S, carId); if (!car || !car.line) return NO('لا خط'); car.line.allSeasons = !!on; return OK(on ? 'سيُبحر الخط في كل المواسم (مخاطرة أعلى)' : 'سيلتزم الخط موسم الرياح'); },
  portmRule(S, type, mode, wait) {
    const D = portmOf(S); if (!D) return NO('لا شهبندر عندك'); if (!PORTM_TYPES[type]) return NO('نوع غير معروف'); if (!DIWAN_MODES[mode]) return NO('اختر نفّذ أو اسألني أو اتركه لي'); if (wait != null && !PORTM.waits.includes(+wait)) return NO('المهلة 1 أو 3 أو 7 أيام');
    const r = D.rules[type]; r.mode = mode; if (wait != null) r.wait = +wait; D.ask = D.ask.filter(a => !(a.type === type && (a.remind || mode === 'exec'))); return OK('حُفظت القاعدة: ' + PORTM_TYPES[type].name + ' ← ' + DIWAN_MODES[mode]);
  },
  portmAnswer(S, id, ans) {
    const D = portmOf(S); if (!D) return NO('لا شهبندر عندك'); const a = D.ask.find(x => x.id === id); if (!a) return NO('السؤال لم يعد قائماً');
    if (ans === 'do' && !a.remind) { const r = pmExec(S, D, a); D.ask = D.ask.filter(x => x !== a); return r.ok === false ? r : OK('نُفّذ عنك.'); }
    D.ask = D.ask.filter(x => x !== a); D.cool[a.type + ':' + a.key] = S.day + PORTM.again; pmLog(S, D, 'ask', 'تولّيتَ بنفسك: ' + a.text, 0); return OK('حسناً، أنت تتولاها.');
  },
});
