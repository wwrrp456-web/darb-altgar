/* ناظر الديوان (025): رأس سلّم الإدارة بعد وكيل الإقليم. لا يخترع أعمالاً: يحرّك الأدوات القائمة (تغطية الأمين من خزينته، وتعبئة الدكاكين وتصدير فائض المصانع،
   وبيع الراكد بالحد الأدنى، وتمويل صفقات كبير الرعاة) بقاعدة لكل نوع: exec «نفّذ وأخبرني» / ask «اسألني أولاً» (مهلة ثم ينفّذ) / mine «اتركه لي» (تذكير فقط).
   لا يصرف من المحفظة ولا يتجاوز الخزينة. مال الخزينة مال اللاعب: يدخل في الثروة والزكاة (zakatBase). DIWAN.on=false = السلوك السابق حرفياً.
   الثمن: قرار بن محمود 2026-11-05 (docs/economy/DECISION_2026-11-05.md، قسم «الرسوم»): رسم 150,000 ريال مرة واحدة يبلغه أي أسلوب لعب في 2–3 سنوات، وأجر 140 يومياً
   (= 2 × أجر وكيل الإقليم، 70 عند أمين بأجر 35). كان حساب D9 الأولي 720,000 (3 أشهر من صافي أفضل أسلوب) فخُفّض بالقرار. */
const DIWAN = { on: true, phase: 4, fee: 150000, wage: 140, lateQuit: 5, full: 0.85, waits: [1, 3, 7], hawlWarn: 10, debtWarn: 7, goalWarn: 30, boxWarn: 30, herdMax: 5000, logMax: 40, again: 7, suggestDays: 354, week: 7 };
const DIWAN_TYPES = { pay: { name: 'سداد الحقوق من الخزينة', mode: 'exec' }, fill: { name: 'امتلاء مخزن: تعبئة الدكاكين ثم تصدير فائض المصانع', mode: 'exec' }, sell: { name: 'امتلاء مخزن: بيع الراكد بالحد الأدنى الذي حددتَه', mode: 'ask' }, herd: { name: 'صفقة ممتازة لكبير الرعاة من الخزينة', mode: 'ask' } };
const DIWAN_DRAW = { name: 'سحب من المضاربة إلى الخزينة حين تنقص عن التزامات 14 يوماً', mode: 'ask' }; // 040و: قاعدة منفصلة عن DIWAN_TYPES (لا تدخل الافتراضيات)؛ تُنشأ حين يضبطها اللاعب
const DIWAN_MODES = { exec: 'نفّذ وأخبرني', ask: 'اسألني أولاً', mine: 'اتركه لي' };
const diwanOf = S => (DIWAN.on && S.player && S.player.diwan) || null;
function diwanDefaults() { const r = {}; for (const k of Object.keys(DIWAN_TYPES)) r[k] = { mode: DIWAN_TYPES[k].mode, wait: 3 }; r.herd.max = DIWAN.herdMax; return r; }
function diwanQuote(S) {
  const P = S.player, reasons = [];
  if (!DIWAN.on) return { ok: false, msg: 'غير متاح.', reasons: ['غير متاح.'] };
  if (P.diwan) return { ok: false, msg: 'عندك ناظر ديوان.', reasons: ['عندك ناظر ديوان.'], hired: true };
  if (S.phase < DIWAN.phase) reasons.push('يُفتح في الطور ' + DIWAN.phase);
  if (!Object.keys(P.regAgents || {}).length) reasons.push('وظّف وكيل إقليم أولاً');
  const cash = P.wallet.sar; if (cash < DIWAN.fee) reasons.push('اجمع ' + Math.ceil(DIWAN.fee - cash) + ' ريال أخرى (الرسم ' + DIWAN.fee + ')');
  return { ok: !reasons.length, msg: reasons[0] || '', reasons, fee: DIWAN.fee, wage: DIWAN.wage, have: Math.min(cash, DIWAN.fee), frac: Math.min(1, cash / DIWAN.fee), open: S.phase >= DIWAN.phase && Object.keys(P.regAgents || {}).length > 0 };
}
const diwanDaily = S => Object.keys(S.player.props).reduce((n, id) => { const q = regionalOfficeQuote(S, id); return n + (q && q.ok ? q.wages + q.rent : 0); }, 0);
const diwanSuggest = S => Math.round(DIWAN.suggestDays * diwanDaily(S));
function diwanLog(S, D, kind, city, text, amount) { D.log.unshift({ d: S.day, kind, city: city || null, text, amount: Math.round((amount || 0) * 100) / 100 }); if (D.log.length > DIWAN.logMax) D.log.length = DIWAN.logMax; }
/* أجور اليوم لعمال المدينة التي لم تُسدَّد بعد: تُحجز من الخزينة قبل الإيجار والصيانة (الأجور أولاً) */
function diwanWageReserve(S, city) { const pr = S.player.props[city], c = S.cities[city]; if (!pr || !c) return 0; return (pr.staff || []).filter(w => !(w.wageProof && w.wageProof.day >= S.day) && !(w.free > S.day)).reduce((n, w) => n + wkWage(S, c, w), 0); }
function diwanAsk(S, D, type, city, text, extra) {
  if (D.ask.some(a => a.type === type && a.city === city && (a.mail || null) === ((extra && extra.mail) || null))) return null;
  if ((D.cool[type + ':' + city] || -1) > S.day) return null;
  const rl = diwanRuleOf(D, type), wait = rl.wait, a = Object.assign({ id: S.nextId++, type, city, text, day: S.day, due: S.day + wait, remind: rl.mode === 'mine' }, extra || {});
  if (a.remind) delete a.due; D.ask.push(a); return a;
}
/* تغطية عجز الأمين أو الوكيل من الخزينة: الأجور ثم الإيجار ثم الصيانة؛ بقدر الموجود فقط ولا مساس بحدود الأمين */
function diwanCover(S, city, need, cat) {
  const D = diwanOf(S); if (!D || !(need > 1e-9)) return 0;
  const rule = D.rules.pay, prio = cat === 'wages' || cat === 'staff' ? 0 : cat === 'rent' ? 1 : 2;
  if (rule.mode !== 'exec') { diwanAsk(S, D, 'pay', city || '*', 'تغطية عجز السداد في ' + (S.cities[city] ? S.cities[city].name : 'مناطقك') + ' بنحو ' + Math.round(need) + ' ريال', { need: Math.round(need * 100) / 100 }); return 0; }
  const avail = D.box - (prio > 0 && S.cities[city] ? diwanWageReserve(S, city) : 0), amt = Math.max(0, Math.min(need, avail)); if (amt < 1e-9) return 0;
  D.box -= amt; S.player.wallet.sar += amt; D.covered = (D.covered || 0) + amt;
  diwanLog(S, D, 'pay', city, 'غطّيتُ ' + (cat === 'rent' ? 'إيجار' : cat === 'wages' || cat === 'staff' ? 'أجور' : 'صيانة') + (S.cities[city] ? ' ' + S.cities[city].name : '') + ' من الخزينة', amt);
  return amt;
}
function diwanOrder(S, list) { // ترتيب السداد المتأخر: الأجور ثم الإيجار ثم غيرهما، حين يعمل الناظر فقط (وإلا الترتيب كما كان)
  if (!diwanOf(S)) return list; const pr = d => d.cat === 'staff' || d.cat === 'wages' ? 0 : d.cat === 'rent' ? 1 : 2;
  return list.map((d, i) => [d, i]).sort((a, b) => pr(a[0]) - pr(b[0]) || a[1] - b[1]).map(x => x[0]);
}
function diwanBegin(S) { // أجر الناظر اليومي: من الخزينة أولاً ثم المحفظة؛ تأخره lateQuit أيام ⇒ يترك العمل ويعود ما في الخزينة إلى محفظتك
  const P = S.player, D = diwanOf(S); if (!D) return;
  if (D.wageDay === S.day) return; D.wageDay = S.day;
  const wage = DIWAN.wage;
  if (D.box + 1e-9 >= wage) { D.box -= wage; P.led.exp.diwan = (P.led.exp.diwan || 0) + wage; sink(S, 'diwan', wage); D.paid = (D.paid || 0) + wage; D.late = 0; return; }
  if (P.wallet.sar + 1e-9 >= wage) { const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'diwan', wage, true); S.ctxCur = c0; D.paid = (D.paid || 0) + wage; D.late = 0; return; }
  D.late = (D.late || 0) + 1;
  if (D.late >= DIWAN.lateQuit) { P.wallet.sar += D.box; delete P.diwan; news(S, 'ترك ناظر الديوان عمله لتأخر أجره، وعاد ما في خزينته إلى محفظتك.', 'bad'); }
}
function diwanFill(S, D, city) { // تعبئة الدكاكين من المخزن (تدوير الأصناف بأمين المدينة) ثم تصدير فائض المصانع
  const pr = S.player.props[city], m = stewardOf(S, city), W = { rotated: 0, sold: 0, earned: 0, herded: 0 }, said = [], parts = [];
  if (m && pr) { stewardRotate(S, city, pr, m, W, said, true); if (W.rotated) parts.push('دوّرتُ ' + W.rotated + ' صنفاً في دكاكينك'); }
  let ex = 0; if (STORAGE.export) for (const f of S.player.factories) if (f.city === city && f.export !== true) { f.export = true; ex++; }
  if (ex) parts.push('فعّلتُ تصدير فائض ' + ex + ' مصنع');
  if (parts.length) diwanLog(S, D, 'fill', city, parts.join('، ') + ' في ' + S.cities[city].name, 0);
  return parts.length > 0;
}
function diwanSell(S, D, city) { // بيع الراكد بالحد الأدنى الذي حدده اللاعب لأمينه (وإلا كلفتها)، بسقف يومي
  const pr = S.player.props[city], m = stewardOf(S, city), pct = m ? stewardMinPct(m.policy, 'sellStale') : 1;
  const W = { rotated: 0, sold: 0, earned: 0, herded: 0 }, said = [], left = { q: STEWARD_SMART.dayQty }, adapter = { idle: D.idle[city] || {}, policy: { minPrice: { sellStale: pct } } };
  const c0 = S.ctxCur; ctxFor(S, city); stewardSellStale(S, city, pr, adapter, W, said, left); S.ctxCur = c0;
  for (const g of Object.keys(adapter.idle)) { const e = adapter.idle[g], q = pr.store[g] || 0; if (q >= 1 && q < e.q) e.q = q; } // ما بقي بعد بيعه ما زال راكداً: لا تُصفَّر مدة ركوده بسبب بيع الناظر نفسه
  if (W.sold > 0) { diwanLog(S, D, 'sell', city, 'بعتُ ' + W.sold + ' وحدة راكدة من مخزن ' + S.cities[city].name + ' بحدٍّ أدنى ' + Math.round(pct * 100) + '٪ من كلفتها', W.earned); return true; }
  return false;
}
function diwanBuyHerd(S, D, mail) { // تمويل صفقة كبير الرعاة من الخزينة بقدر العجز فقط، ويُردّ ما لم يُستعمل
  const ch = chiefOf(S, mail.country), c = S.cities[mail.city]; if (!ch || !c || !farmOf(S, mail.city)) return NO('لم تعد الصفقة قائمة');
  const cap = (D.rules.herd.max || 0); if (!(cap > 0) || mail.est > cap) return NO('الصفقة فوق الحد الذي وضعتَه');
  const c0 = S.ctxCur; ctxFor(S, mail.city); const need = unitPrice(c, mail.g) * mail.qty * 1.05, g0 = S.player.gold, short = Math.max(0, need - g0);
  let amt = 0; if (short > 0) { if (S.ctxCur !== 'sar' || D.box + 1e-9 < short) { S.ctxCur = c0; return NO('الخزينة لا تكفي لهذه الصفقة'); } amt = short; D.box -= amt; S.player.wallet.sar += amt; }
  const r = chiefBuy(S, mail.city, mail.g, mail.qty);
  if (!r.ok) { if (amt) { D.box += amt; S.player.wallet.sar -= amt; } S.ctxCur = c0; return r; }
  const spent = r.cost, fromBox = Math.min(amt, Math.max(0, spent - g0)), refund = amt - fromBox; if (refund > 0) { D.box += refund; S.player.wallet.sar -= refund; }
  ch.mail = (ch.mail || []).filter(x => x.id !== mail.id); S.ctxCur = c0;
  diwanLog(S, D, 'herd', mail.city, 'اشتريتُ ' + r.n + ' ' + GD[mail.g].name + ' لمزرعة ' + c.name + (fromBox > 0 ? ' بتمويل من الخزينة' : ''), fromBox);
  return Object.assign(r, { fromBox });
}
function diwanExec(S, D, a) { // ينفّذ بنداً معلّقاً (بموافقتك أو بانتهاء مهلته)
  if (a.type === 'pay') { const amt = Math.min(a.need || 0, D.box); if (amt <= 0) return NO('لا شيء في الخزينة'); D.box -= amt; S.player.wallet.sar += amt; D.covered = (D.covered || 0) + amt; diwanLog(S, D, 'pay', a.city, 'غطّيتُ عجز السداد من الخزينة', amt); return OK('غُطّي العجز'); }
  if (a.type === 'draw') { const r = diwanDraw(S, D); return r > 0 ? OK('سُحب ' + Math.round(r) + ' ريال من المضاربة إلى الخزينة') : NO('لا سحب ممكن الآن'); }
  if (a.type === 'fill') return diwanFill(S, D, a.city) ? OK('نُفّذ') : NO('لا شيء يُفعل الآن');
  if (a.type === 'sell') return diwanSell(S, D, a.city) ? OK('نُفّذ') : NO('لا راكد يُباع بالحد الأدنى الآن');
  if (a.type === 'herd') { const ch = chiefOf(S, a.country), m = ch && (ch.mail || []).find(x => x.id === a.mail); if (!m) return NO('لم تعد الصفقة قائمة'); return diwanBuyHerd(S, D, m); }
  return NO('بند غير معروف');
}
function diwanUpdateIdle(S, D) {
  for (const city of Object.keys(S.player.props)) {
    const pr = S.player.props[city], idle = D.idle[city] || (D.idle[city] = {});
    for (const g of Object.keys(pr.store)) { const q = pr.store[g] || 0; if (q < 1) { delete idle[g]; continue; } const e = idle[g]; if (!e || Math.abs(e.q - q) > 1e-6) idle[g] = { q, since: S.day }; }
    for (const g of Object.keys(idle)) if ((pr.store[g] || 0) < 1) delete idle[g];
  }
  for (const city of Object.keys(D.idle)) if (!S.player.props[city]) delete D.idle[city];
}
const diwanRuleOf = (D, type) => D.rules[type] || (type === 'draw' ? { mode: DIWAN_DRAW.mode, wait: 3 } : null);
function diwanDraw(S, D) { const miss = liqNeed14(S) - D.box; if (!(miss > 1e-6)) return 0; const got = liqCover(S, miss, 'diwan', 'box'); if (got > 0) diwanLog(S, D, 'draw', null, 'سحبتُ من المضاربة إلى الخزينة', got); return got; }
function diwanDay(S) {
  const D = diwanOf(S); if (!D) return;
  if (D.day === S.day) return; D.day = S.day; const keep = S.ctxCur;
  // 1) مهلة «اسألني»: ينفّذ بعدها إن لم تردّ
  for (const a of D.ask.slice()) if (!a.remind && a.due != null && a.due <= S.day) { const r = diwanExec(S, D, a); D.ask = D.ask.filter(x => x !== a); diwanLog(S, D, 'ask', a.city, (r.ok === false ? 'انتهت مهلة سؤالك ولم يُمكن التنفيذ: ' : 'انتهت مهلة سؤالك فنفّذتُ: ') + a.text, 0); }
  // 2) المخازن: امتلاء ≥ 85٪
  for (const city of Object.keys(S.player.props)) {
    const cap = storeCap(S, city); if (!(cap > 0) || storeLoad(S, city) < cap * DIWAN.full) continue;
    for (const type of ['fill', 'sell']) {
      const rule = D.rules[type], nm = S.cities[city].name, txt = type === 'fill' ? 'مخزن ' + nm + ' شارف على الامتلاء: أعبّئ الدكاكين وأصدّر فائض المصانع؟' : 'مخزن ' + nm + ' شارف على الامتلاء: أبيع الراكد بالحد الأدنى الذي حددتَه؟';
      if (rule.mode === 'exec') { if (D.fillDay[type + ':' + city] === S.day) continue; D.fillDay[type + ':' + city] = S.day; if (type === 'fill') diwanFill(S, D, city); else diwanSell(S, D, city); } else diwanAsk(S, D, type, city, txt);
    }
  }
  // 3) صفقات كبير الرعاة الممتازة (فرص الشراء)
  for (const country of Object.keys(S.player.chiefs || {})) for (const m of (S.player.chiefs[country].mail || []).slice()) {
    if (m.type !== 'buy' || m.est > (D.rules.herd.max || 0)) continue; const rule = D.rules.herd;
    if (rule.mode === 'exec') { const r = diwanBuyHerd(S, D, m); if (r.ok) continue; } else diwanAsk(S, D, 'herd', m.city, 'فرصة ممتازة لكبير الرعاة في ' + S.cities[m.city].name + ': ' + GD[m.g].name + ' أرخص من المعتاد؛ أموّلها من الخزينة (نحو ' + m.est + ' ريال)؟', { mail: m.id, country, est: m.est });
  }
  // 3ب) السيولة (040و): الخزينة تنقص عن التزامات 14 يوماً ⇒ سحب من المضاربة بحد monthMax
  if (liqOn(S) && S.ctxCur === 'sar' && D.box < liqNeed14(S) - 1e-6 && liqDepTotal(S) > 0 && liqMonth(S).rem > 1e-9) { const rule = diwanRuleOf(D, 'draw'); if (rule.mode === 'exec') diwanDraw(S, D); else diwanAsk(S, D, 'draw', '*', 'خزينة الديوان تنقص عن التزامات ' + LIQ.horizon + ' يوماً: أسحب من المضاربة إلى الخزينة (حتى ' + Math.round(liqMonth(S).rem) + ' ريال ضمن حدّ الشهر)؟'); }
  diwanUpdateIdle(S, D); S.ctxCur = keep;
  // 4) المواعيد: أخبار مرة كل أسبوع لكل موعد
  for (const r of diwanReminders(S)) if (S.day - (D.said[r.k] == null ? -99 : D.said[r.k]) >= DIWAN.again) { D.said[r.k] = S.day; news(S, 'ناظر الديوان: ' + r.text, r.bad ? 'bad' : ''); }
}
function diwanReminders(S) { // مواعيد من الدوال القائمة؛ لا حساب جديد
  const D = diwanOf(S), P = S.player, out = [], push = (k, text, bad) => out.push({ k, text, bad: !!bad });
  const Z = S.zakat; if (Z && Z.start != null && !Z.due) { const left = hawlLen(S, Z.start) - (S.day - Z.start); if (left > 0 && left <= DIWAN.hawlWarn) push('zakat', 'يحول حول زكاتك بعد ' + left + ' يوماً؛ جهّز مالك.'); }
  const f = P.famDebt; if (f && f.left > 0 && f.due != null && f.due - S.day <= DIWAN.debtWarn && f.due - S.day >= 0) push('debt', 'قسط دَين الجد بعد ' + (f.due - S.day) + ' يوماً.', true);
  for (const l of P.bank.loans || []) if (Number.isFinite(l.due) && l.due - S.day <= DIWAN.debtWarn && l.due - S.day >= 0 && l.amt > 0) { push('loan' + (l.id || l.due), 'استحقاق قرض بعد ' + (l.due - S.day) + ' يوماً.', true); break; }
  try { for (const c of seasonGoalView(S).cur) if (c.left <= DIWAN.goalWarn && c.left > 0) push('season-' + c.k, 'مهلة هدف الموسم «' + (c.name || c.title || c.k) + '» بعد ' + c.left + ' يوماً.'); } catch (e) {}
  if (D) { const daily = diwanDaily(S) + DIWAN.wage; if (daily > 0 && D.box / daily < DIWAN.boxWarn) push('box', 'خزينة الديوان تكفي نحو ' + Math.floor(D.box / daily) + ' يوماً فقط؛ أودع فيها.', true); }
  return out;
}
function diwanView(S) {
  const D = diwanOf(S), q = diwanQuote(S); if (!D) return { hired: false, quote: q };
  const week = D.log.filter(l => S.day - l.d < DIWAN.week), daily = diwanDaily(S) + DIWAN.wage;
  return { hired: true, quote: q, box: D.box, daily, days: daily > 0 ? D.box / daily : Infinity, suggest: diwanSuggest(S), rules: LIQ.on && !D.rules.draw ? Object.assign({}, D.rules, { draw: diwanRuleOf(D, 'draw') }) : D.rules, ask: D.ask, did: week, reminders: diwanReminders(S), since: D.since, wage: DIWAN.wage, late: D.late || 0 };
}
function diwanMigrate(S) {
  const P = S.player; if (!P || P.diwan === undefined) return; const D = P.diwan;
  if (!D || typeof D !== 'object' || Array.isArray(D) || !Number.isFinite(D.box) || D.box < 0 || !Number.isSafeInteger(D.since) || D.since > S.day) { delete P.diwan; return; }
  const def = diwanDefaults(), r = D.rules && typeof D.rules === 'object' ? D.rules : {};
  D.rules = {}; for (const k of Object.keys(def)) { const x = r[k] || {}; D.rules[k] = { mode: ['exec', 'ask', 'mine'].includes(x.mode) ? x.mode : def[k].mode, wait: DIWAN.waits.includes(x.wait) ? x.wait : def[k].wait }; if (k === 'herd') D.rules[k].max = Number.isFinite(x.max) && x.max >= 0 && x.max <= 1e7 ? x.max : def.herd.max; }
  D.ask = (Array.isArray(D.ask) ? D.ask : []).filter(a => a && Number.isSafeInteger(a.id) && def[a.type] && Number.isSafeInteger(a.day) && a.day <= S.day && (a.due == null || Number.isSafeInteger(a.due)) && typeof a.text === 'string').slice(0, 20); for (const a of D.ask) S.nextId = Math.max(S.nextId || 1, a.id + 1);
  D.log = (Array.isArray(D.log) ? D.log : []).filter(l => l && Number.isSafeInteger(l.d) && l.d <= S.day && typeof l.text === 'string' && Number.isFinite(l.amount)).slice(0, DIWAN.logMax);
  D.cool = D.cool && typeof D.cool === 'object' && !Array.isArray(D.cool) ? Object.fromEntries(Object.entries(D.cool).filter(([, v]) => Number.isSafeInteger(v))) : {};
  D.said = D.said && typeof D.said === 'object' && !Array.isArray(D.said) ? Object.fromEntries(Object.entries(D.said).filter(([, v]) => Number.isSafeInteger(v) && v <= S.day)) : {};
  D.fillDay = {}; D.idle = {}; // مؤقتان يُعاد بناؤهما
  for (const k of ['late', 'paid', 'covered']) if (!Number.isFinite(D[k]) || D[k] < 0) D[k] = 0;
}
Object.assign(A, {
  hireDiwan(S) {
    const q = diwanQuote(S); if (!q.ok) return NO(q.msg);
    const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'hiring', DIWAN.fee, true); S.ctxCur = c0;
    S.player.diwan = { since: S.day, box: 0, rules: diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 };
    return OK('وظّفتَ ناظر الديوان بأجر ' + DIWAN.wage + ' ريال يومياً. أودع في خزينته ما تريد، واختر لكل نوع من يقرر.');
  },
  fireDiwan(S) { const D = diwanOf(S); if (!D) return NO('لا ناظر ديوان عندك'); S.player.wallet.sar += D.box; const b = D.box; delete S.player.diwan; return OK('سرّحتَ ناظر الديوان وعاد إلى محفظتك ما في خزينته (' + Math.round(b) + ' ريال).'); },
  diwanDeposit(S, amt) { const D = diwanOf(S); if (!D) return NO('لا ناظر ديوان عندك'); amt = Math.round(+amt * 100) / 100; if (!(amt > 0)) return NO('أدخل مبلغاً'); if (S.player.wallet.sar + 1e-9 < amt) return NO('ريالك في المحفظة لا يكفي'); S.player.wallet.sar -= amt; D.box += amt; return OK('أودعتَ ' + amt + ' ريال في خزينة الديوان.'); },
  diwanWithdraw(S, amt) { const D = diwanOf(S); if (!D) return NO('لا ناظر ديوان عندك'); amt = Math.round(+amt * 100) / 100; if (!(amt > 0)) return NO('أدخل مبلغاً'); if (D.box + 1e-9 < amt) return NO('الخزينة لا تكفي'); D.box -= amt; S.player.wallet.sar += amt; return OK('سحبتَ ' + amt + ' ريال إلى محفظتك.'); },
  diwanRule(S, type, mode, wait, max) {
    const D = diwanOf(S); if (!D) return NO('لا ناظر ديوان عندك'); if (!DIWAN_TYPES[type] && !(type === 'draw' && LIQ.on)) return NO('نوع غير معروف'); if (!DIWAN_MODES[mode]) return NO('اختر نفّذ أو اسألني أو اتركه لي');
    if (wait != null && !DIWAN.waits.includes(+wait)) return NO('المهلة 1 أو 3 أو 7 أيام'); if (type === 'herd' && max != null && !(Number.isFinite(+max) && +max >= 0 && +max <= 1e7)) return NO('راجع حد الصفقة');
    const r = D.rules[type] || (type === 'draw' ? (D.rules.draw = { mode: DIWAN_DRAW.mode, wait: 3 }) : null); if (!r) return NO('نوع غير معروف'); r.mode = mode; if (wait != null) r.wait = +wait; if (type === 'herd' && max != null) r.max = Math.round(+max);
    D.ask = D.ask.filter(a => !(a.type === type && (a.remind || mode === 'exec'))); return OK('حُفظت القاعدة: ' + (DIWAN_TYPES[type] || DIWAN_DRAW).name + ' ← ' + DIWAN_MODES[mode]);
  },
  diwanAnswer(S, id, ans) {
    const D = diwanOf(S); if (!D) return NO('لا ناظر ديوان عندك'); const a = D.ask.find(x => x.id === id); if (!a) return NO('السؤال لم يعد قائماً');
    if (ans === 'do' && !a.remind) { const r = diwanExec(S, D, a); D.ask = D.ask.filter(x => x !== a); return r.ok === false ? r : OK('نُفّذ عنك.'); }
    D.ask = D.ask.filter(x => x !== a); D.cool[a.type + ':' + a.city] = S.day + DIWAN.again; diwanLog(S, D, 'ask', a.city, 'تولّيتَ بنفسك: ' + a.text, 0); return OK('حسناً، أنت تتولاها.');
  },
});
