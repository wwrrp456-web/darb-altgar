/* ---------- 041أ قرض الصديق بالرهن عند التعثر ----------
   النصوص والأحكام معتمدة حرفاً من docs/review/APPROVED_SECURED_LOAN_2026-11-10.md (الدفعة 13)؛ لا نص ولا حكم جديد.
   قرض secure الجديد يحمل o.pledge = { name, value } (قيمة أرض وبيت تبقى عند صاحبها ولا ينتفع بها اللاعب)، ويتعثر باحتمال defaultSecure عند الأجل (roll حتمي).
   عند التعثر تُدفع بطاقة قرار إلى L.eq (id: 'floan') بثلاثة خيارات لا رابع لها: إبراء، بيع الرهن (price/fee/take/back/rest)، إمهال مرة واحدة بلا زيادة.
   قرض secure القديم بلا pledge يردّ كاملاً كما كان. LOANPLEDGE.on=false: لا حقل جديد في الحفظ والسلوك السابق حرفياً (22-learn.js). */
const LOANPLEDGE = { on: true, defaultSecure: 0.25, pledgeMul: [3, 5], saleMul: [0.85, 1.0], saleFee: 0.03, wait: 30, restDays: 90, restPay: 0.6, cool: 120, coolMul: 0.7,
  /* 041ب توثيق القرض قبل الإقراض: ask=false يعيد 041أ حرفياً (بلا حقل جديد في الحفظ) */
  ask: true, def: { worker: 0.2, emotion: 0.8, secure: 0.25 }, pl: { secure: 1, worker: 0.5, emotion: 0.1 }, plMul: [1.5, 2], su: { secure: 0.9, worker: 0.7, emotion: 0.3 }, suKnown: 0.1, knownTrust: 10, suMul: [2, 6], suCool: 120, suCoolMul: 0.8 };
const LP_TXT = {
  card: 'تعثّر صديقك عن سداد القرض في موعده (المبلغ {amt} ريال)، وعنده أرض مرهونة قيمتها أضعاف المبلغ. ما الذي تختاره؟',
  forgive: { title: 'سامحه وأبرئ ذمته', desc: 'تتنازل عن حقك، وهذا من عظيم الإحسان والأجر.', res: 'أبرأتَ ذمة صديقك من القرض. لك في ذلك أجر، وزادت ثقة الناس بك.' },
  sell: { title: 'بِع الرهن وخذ حقك', desc: 'تبيع الأرض المرهونة في السوق، وتأخذ حقك ونفقة البيع، وتردّ لصديقك ما بقي.', res: 'بِعتَ الأرض بـ{price} ريال. أخذتَ حقك {take} ونفقة البيع {fee}، وردَدتَ لصديقك {back}.', short: 'لم يكفِ الثمن، فبقي لك على صديقك {rest} ريال حتى يقدر.' },
  wait: { title: 'أمهله ثلاثين يوماً', desc: 'تنتظره شهراً، ولا يزيد عليه شيء. وإن تعثّر مرة أخرى عدتَ إلى الاختيار.', res: 'أمهلتَ صديقك ثلاثين يوماً.', why: 'أمهلتَه من قبل' },
  teach: 'الرهن وثيقة تحفظ الحق، لا وسيلة لأخذ أكثر منه. وإن كان المدين معسراً فالإنظار خير.',
};
const lpFill = (s, p) => s.replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? fmtN(p[k]) : m));
const lpUse = o => LOANPLEDGE.on && o && o.pledge;
/* نوع طلب الصديق: بالأوزان المتساوية كما كان؛ وبعد بيع رهن يقلّ وزن secure ×0.7 لمدة 120 يوماً (L.loanCool) */
function lpType(S, r) {
  const L = S.learn, T = ['secure', 'worker', 'emotion'];
  if (!(LOANPLEDGE.on && L && L.loanCool > S.day)) return T[Math.floor(r * 3)];
  const w = [LOANPLEDGE.coolMul, 1, 1], tot = w[0] + w[1] + w[2]; let x = r * tot; for (let i = 0; i < 3; i++) { x -= w[i]; if (x < 0) return T[i]; } return T[2];
}
/* عند قبول القرض: يُسجَّل الرهن لـ secure فقط */
function lpPledge(S, o, ev, mul) {
  if (!LOANPLEDGE.on || (!mul && ev.type !== 'secure')) return; mul = mul || LOANPLEDGE.pledgeMul; const P = S.player, ids = Object.keys(P.props).filter(id => S.cities[id]), cs = ids.length ? ids : [mainCar(S).city];
  o.id = S.nextId++; o.pledge = { name: 'أرض وبيت في ' + S.cities[cs[Math.floor(roll(S, 42) * cs.length)]].name, value: Math.round(o.amt * (mul[0] + (mul[1] - mul[0]) * roll(S, 41))) };
}
/* عند الأجل: يرجع true/false (يبقى/يُحذف) أو undefined ليكمل المسار القديم (ردّ كامل) */
function lpDue(S, o) {
  if (!(LOANPLEDGE.on && o && o.doc) && !lpUse(o)) return undefined; const L = S.learn;
  if (o.st !== 'insolvent') { if (roll(S, 300 + (o.day % 997) + (o.waited ? 1000 : 0)) >= (o.doc ? LOANPLEDGE.def[o.type] : LOANPLEDGE.defaultSecure)) return undefined; if (o.doc === 'trust') { o.lost = 1; return undefined; } o.st = 'insolvent'; }
  const id = o.doc === 'surety' ? 'fsur' : 'floan';
  if (!L.eq.some(e => e.id === id && e.lid === o.id) && interruptOk(S, 'friend')) { L.eq.push({ id, day: S.day, lid: o.id, amt: o.amt }); interrupt(S, 'friend'); }
  return true;
}
/* قرار اللاعب: forgive | sell | wait */
function lpDecide(S, ev, ch) {
  const L = S.learn, P = S.player, o = (P.loansOut || []).find(x => x.id === ev.lid); if (!o) { L.eq.shift(); return NO('لا قرض'); }
  L.fbq = L.fbq || []; const ln = loanStat(L), drop = () => { P.loansOut = P.loansOut.filter(x => x !== o); L.eq.shift(); };
  if (ch === 'wait') { if (o.waited) return NO(LP_TXT.wait.why); o.due = S.day + LOANPLEDGE.wait; o.waited = true; o.st = 'waited'; L.eq.shift(); return OK(LP_TXT.wait.res); }
  if (ch === 'forgive') { drop(); L.fbq.push({ day: S.day, amt: 0, lent: o.amt, ok: 2 }); learnReact(S, 'friendOk', 1); return OK(LP_TXT.forgive.res); }
  if (ch !== 'sell') return NO('اختر أحد الخيارات الثلاثة');
  const price = Math.round(o.pledge.value * (LOANPLEDGE.saleMul[0] + (LOANPLEDGE.saleMul[1] - LOANPLEDGE.saleMul[0]) * roll(S, 43))), fee = Math.round(price * LOANPLEDGE.saleFee), take = Math.min(o.amt, price - fee), back = price - fee - take, rest = o.amt - take;
  drop(); P.gold += take; P.led.inc.loanBack = (P.led.inc.loanBack || 0) + take; ln.repaid++; L.loanCool = S.day + LOANPLEDGE.cool;
  L.fbq.push({ day: S.day, amt: take, lent: o.amt, ok: 3, price, fee, back, rest });
  if (rest > 0) { P.loansOut.push({ due: S.day + LOANPLEDGE.restDays, amt: rest, type: 'rest', day: S.day }); return OK(lpFill(LP_TXT.sell.res, { price, take, fee, back }) + ' ' + lpFill(LP_TXT.sell.short, { rest })); }
  return OK(lpFill(LP_TXT.sell.res, { price, take, fee, back }));
}
function lpSaleText(f) { return lpFill(LP_TXT.sell.res, { price: f.price, take: f.amt, fee: f.fee, back: f.back }) + (f.rest > 0 ? ' ' + lpFill(LP_TXT.sell.short, { rest: f.rest }) : ''); }
/* تقدير البيع لاقتراح البطاقة: الصديق «قادر» إن كفى أقل ثمن متوقع الدين */
function lpAble(o) { const lo = o.pledge.value * LOANPLEDGE.saleMul[0]; return lo - lo * LOANPLEDGE.saleFee >= o.amt; }
function lpCard(S, ev) { const o = (S.player.loansOut || []).find(x => x.id === ev.lid); if (!o) return null; return { amt: o.amt, pledge: o.pledge, waited: !!o.waited, suggest: lpAble(o) ? 'sell' : 'forgive', text: lpFill(LP_TXT.card, { amt: o.amt }) }; }

/* ---------- 041ب توثيق القرض قبل الإقراض (الرهن والكفيل) ----------
   النصوص حرفاً من docs/review/APPROVED_LOAN_GUARANTEE_2026-11-10.md (الدفعة 14: T6–T10، وT8 على LN-07..LN-12). لا أجر للكفيل (T10): لا خيار يدفع له شيئاً.
   LOANPLEDGE.ask=false: يبقى حدث «صديق يطلب قرضاً» نعم/لا كما في 041أ بلا أي حقل جديد في الحفظ. القرض القائم بلا o.doc يُعامل «بثقتك» ولا يُرحَّل. */
const LG_TXT = {
  ask: 'صديقك يطلب قرضاً حسناً (المبلغ {amt} ريال) لثلاثين يوماً. ما رأيك؟',
  opts: { yes: 'أقرضه بثقتي', pledge: 'اطلب منه رهناً', surety: 'اطلب منه كفيلاً', no: 'اعتذر' },
  t7: { pledge: 'وافق صديقك على رهن {pledge} عندك. تبقى عنده ولا تنتفع بها.', surety: 'وافق {name} على كفالة صديقك، فإن تعثّر ضمن عنه.', noPledge: 'ليس عند صديقك ما يرهنه، فاعتذر.', noSurety: 'لم يجد صديقك من يكفله، فاعتذر.' },
  card: 'تعثّر صديقك عن سداد القرض في موعده (المبلغ {amt} ريال)، وكفيله {name} ضامن له. ما الذي تختاره؟',
  claim: { title: 'طالب الكفيل بحقك', desc: 'يؤدّي الكفيل ما ضمنه، وله أن يرجع على صديقك بما دفع.', res: 'أدّى {name} {amt} ريال عن صديقك.' },
  forgive: { title: 'سامح صديقك', desc: 'تتنازل عن حقك، وبراءة صديقك تبرئ كفيله معه، وهذا من عظيم الإحسان والأجر.', res: 'أبرأتَ ذمة صديقك، فبرئ كفيله معه. لك في ذلك أجر، وزادت ثقة الناس بك.' },
  wait: { title: 'أمهله ثلاثين يوماً' },
  lost: 'ضاع القرض الذي أقرضتَه بثقتك وحدك. الرهن والكفالة توثيق يحفظ الحق، وقد أرشد القرآن إلى توثيق الدين.',
  nopay: 'الكفالة معروف، ولا يأخذ الكفيل عليها أجراً.',
};
/* نص تشغيلي (غير ديني) للعرض: أسماء الكفلاء (3 معارف للاعب + 3 غيرهم) وأسطر التوثيق */
const LG_OPS = { folk: [['أبو سعيد', 1], ['الحاج راشد', 1], ['أبو ماجد', 1], ['أبو نايف', 0], ['عمّ حمدان', 0], ['أبو عبد الله', 0]], kinds: { trust: 'بثقتك', pledge: 'رهن', surety: 'كفيل' }, rest: 'وبقي لك على صديقك {rest} ريال.' };
const lgFill = (s, p) => s.replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? (typeof p[k] === 'number' ? fmtN(p[k]) : p[k]) : m));
const lgOn = () => !!(LOANPLEDGE.on && LOANPLEDGE.ask);
const lgCap = (S, sy) => { const c = ((S.learn && S.learn.suCool) || {})[sy.name]; return Math.max(0, sy.cap - (c && c.d > S.day ? c.u : 0)); };
/* اختيار الكفيل: قائمة ثابتة + زعيم مدينتك إن بلغت ثقته knownTrust؛ وزن من ضغطتَ عليه ×0.8 مدة 120 يوماً */
function lgSurety(S, amt, k) {
  const L = S.learn, city = mainCar(S).city, bs = S.bosses && S.bosses[city], cool = L.suCool || {}, list = LG_OPS.folk.map(f => ({ name: f[0], kin: f[1] }));
  if (bs && bs.name && bs.ruler !== 'player' && bs.trust >= LOANPLEDGE.knownTrust) list.push({ name: bs.name, kin: 1 });
  const w = list.map(x => (cool[x.name] && cool[x.name].d > S.day ? LOANPLEDGE.suCoolMul : 1)); let x = roll(S, 640 + k) * w.reduce((a, b) => a + b, 0), i = 0; for (; i < list.length - 1; i++) { x -= w[i]; if (x < 0) break; }
  return { name: list[i].name, kin: list[i].kin, city, cap: Math.round(amt * (LOANPLEDGE.suMul[0] + (LOANPLEDGE.suMul[1] - LOANPLEDGE.suMul[0]) * roll(S, 630 + k))) };
}
/* طلب اللاعب (yes|pledge|surety) في حدث friend: يرجع نتيجة، أو undefined ليكمل المسار القديم */
function lgAsk(S, ev, ch) {
  if (!lgOn() || !['yes', 'pledge', 'surety'].includes(ch)) return undefined; const P = S.player, L = S.learn, k = Math.round(ev.amt) % 997;
  if (liquid(S) < ev.amt) return NO('لا رصيد كافٍ');
  const lo = { due: S.day + 30, amt: ev.amt, type: ev.type, day: S.day, id: S.nextId++, doc: 'trust' }; let pre = '';
  if (ch === 'pledge') {
    if (!(ev.type === 'secure' || roll(S, 610 + k) < LOANPLEDGE.pl[ev.type])) { L.ev.friendNo = (L.ev.friendNo || 0) + 1; return OK(LG_TXT.t7.noPledge); }
    lo.doc = 'pledge'; lpPledge(S, lo, ev, ev.type === 'secure' ? LOANPLEDGE.pledgeMul : LOANPLEDGE.plMul); pre = lgFill(LG_TXT.t7.pledge, { pledge: lo.pledge.name }) + ' ';
  } else if (ch === 'surety') {
    const sy = lgSurety(S, ev.amt, k);
    if (!(roll(S, 620 + k) < LOANPLEDGE.su[ev.type] + (sy.kin ? LOANPLEDGE.suKnown : 0))) { L.ev.friendNo = (L.ev.friendNo || 0) + 1; return OK(LG_TXT.t7.noSurety); }
    lo.doc = 'surety'; lo.surety = sy; pre = lgFill(LG_TXT.t7.surety, { name: sy.name }) + ' ';
  }
  S.ctxCur = curOf(S.home); P.gold -= ev.amt; S.ctxCur = 'sar'; P.loansOut = P.loansOut || []; P.loansOut.push(lo); loanStat(L).given++;
  return Object.assign(OK(pre + 'أقرضتَ صديقك ' + ev.amt + ' ريال إلى ثلاثين يوماً. زاد نفوذك وخبرتك قليلاً، وسيصلك خبر السداد في مكتب التاجر.'), { lent: true });
}
/* ضياع قرض بثقة وحدها: T9 بعد رسالة الضياع */
function lgLost(S, o) {
  if (!(LOANPLEDGE.on && o && o.doc === 'trust')) return; const L = S.learn, f = L.fbq && L.fbq[L.fbq.length - 1]; if (f) f.nd = 1; news(S, LG_TXT.lost, 'bad');
}
/* بطاقة T8 */
function lgCard(S, ev) { const o = (S.player.loansOut || []).find(x => x.id === ev.lid); if (!o || !o.surety) return null; const sy = o.surety, eff = lgCap(S, sy); return { amt: o.amt, name: sy.name, cap: eff, waited: !!o.waited, suggest: 'claim', text: lgFill(LG_TXT.card, { amt: o.amt, name: sy.name }) }; }
/* قرار اللاعب في تعثر المكفول: claim | forgive | wait */
function lgDecide(S, ev, ch) {
  const L = S.learn, P = S.player, o = (P.loansOut || []).find(x => x.id === ev.lid); if (!o || !o.surety) { L.eq.shift(); return NO('لا قرض'); }
  L.fbq = L.fbq || []; const ln = loanStat(L), sy = o.surety, drop = () => { P.loansOut = P.loansOut.filter(x => x !== o); L.eq.shift(); };
  if (ch === 'wait') { if (o.waited) return NO(LP_TXT.wait.why); o.due = S.day + LOANPLEDGE.wait; o.waited = true; o.st = 'waited'; L.eq.shift(); return OK(LP_TXT.wait.res); }
  if (ch === 'forgive') { drop(); L.fbq.push({ day: S.day, amt: 0, lent: o.amt, ok: 2, g: sy.name }); learnReact(S, 'friendOk', 1); return OK(LG_TXT.forgive.res); }
  if (ch !== 'claim') return NO('اختر أحد الخيارات الثلاثة');
  const eff = lgCap(S, sy), paid = Math.min(eff, o.amt), rest = o.amt - paid; drop(); P.gold += paid; P.led.inc.loanBack = (P.led.inc.loanBack || 0) + paid; ln.repaid++;
  const c = (L.suCool = L.suCool || {}), cur = c[sy.name] && c[sy.name].d > S.day ? c[sy.name] : { d: 0, u: 0 }; c[sy.name] = { d: S.day + LOANPLEDGE.suCool, u: cur.u + paid };
  L.fbq.push({ day: S.day, amt: paid, lent: o.amt, ok: 4, g: sy.name, rest });
  if (rest > 0) P.loansOut.push({ due: S.day + LOANPLEDGE.restDays, amt: rest, type: 'rest', day: S.day });
  return OK(lgFill(LG_TXT.claim.res, { name: sy.name, amt: paid }) + (rest > 0 ? ' ' + lgFill(LG_OPS.rest, { rest }) : ''));
}
function lgClaimText(f) { return lgFill(LG_TXT.claim.res, { name: f.g, amt: f.amt }) + (f.rest > 0 ? ' ' + lgFill(LG_OPS.rest, { rest: f.rest }) : '') + ' ' + LG_TXT.claim.desc; }
