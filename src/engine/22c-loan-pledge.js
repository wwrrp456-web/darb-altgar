/* ---------- 041أ قرض الصديق بالرهن عند التعثر ----------
   النصوص والأحكام معتمدة حرفاً من docs/review/APPROVED_SECURED_LOAN_2026-11-10.md (الدفعة 13)؛ لا نص ولا حكم جديد.
   قرض secure الجديد يحمل o.pledge = { name, value } (قيمة أرض وبيت تبقى عند صاحبها ولا ينتفع بها اللاعب)، ويتعثر باحتمال defaultSecure عند الأجل (roll حتمي).
   عند التعثر تُدفع بطاقة قرار إلى L.eq (id: 'floan') بثلاثة خيارات لا رابع لها: إبراء، بيع الرهن (price/fee/take/back/rest)، إمهال مرة واحدة بلا زيادة.
   قرض secure القديم بلا pledge يردّ كاملاً كما كان. LOANPLEDGE.on=false: لا حقل جديد في الحفظ والسلوك السابق حرفياً (22-learn.js). */
const LOANPLEDGE = { on: true, defaultSecure: 0.25, pledgeMul: [3, 5], saleMul: [0.85, 1.0], saleFee: 0.03, wait: 30, restDays: 90, restPay: 0.6, cool: 120, coolMul: 0.7 };
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
function lpPledge(S, o, ev) {
  if (!LOANPLEDGE.on || ev.type !== 'secure') return; const P = S.player, ids = Object.keys(P.props).filter(id => S.cities[id]), cs = ids.length ? ids : [mainCar(S).city];
  o.id = S.nextId++; o.pledge = { name: 'أرض وبيت في ' + S.cities[cs[Math.floor(roll(S, 42) * cs.length)]].name, value: Math.round(o.amt * (LOANPLEDGE.pledgeMul[0] + (LOANPLEDGE.pledgeMul[1] - LOANPLEDGE.pledgeMul[0]) * roll(S, 41))) };
}
/* عند الأجل: يرجع true/false (يبقى/يُحذف) أو undefined ليكمل المسار القديم (ردّ كامل) */
function lpDue(S, o) {
  if (!lpUse(o)) return undefined; const L = S.learn;
  if (o.st !== 'insolvent') { if (roll(S, 300 + (o.day % 997) + (o.waited ? 1000 : 0)) >= LOANPLEDGE.defaultSecure) return undefined; o.st = 'insolvent'; }
  if (!L.eq.some(e => e.id === 'floan' && e.lid === o.id) && interruptOk(S, 'friend')) { L.eq.push({ id: 'floan', day: S.day, lid: o.id, amt: o.amt }); interrupt(S, 'friend'); }
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
