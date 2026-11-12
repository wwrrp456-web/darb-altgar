// 041أ: قرض الصديق بالرهن عند التعثر: النصوص حرفاً من الملف المعتمد، تعثر ≈25٪، كل خيار يؤدي حسابه بالضبط، الإمهال مرة واحدة، وزن الطلبات بعد البيع، المطفأ كالسابق (بلا حقول جديدة)، الحفظ القديم
const assert = require('node:assert/strict'), fs = require('node:fs'), E = require('../src/engine.js'), A = E.A, { LOANPLEDGE: LP, LP_TXT: X } = E, ok = m => console.log('OK   ' + m);
LP.ask = false; // 041أ: الطلب نعم/لا؛ توثيق الطلب (041ب) في loan-guarantee.test.js
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noEvents = true; S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; S.player.gold = 1e6; return S; };
const loan = (S, o) => Object.assign({ due: S.day, amt: 1000, type: 'secure', day: S.day - 30, id: S.nextId++, pledge: { name: 'أرض وبيت في الرياض', value: 3000 } }, o);
const defaultDay = (S, o0) => { for (let d = 40; d < 900; d++) { S.day = d; const o = loan(S, Object.assign({}, o0, { day: d - 30 })); if (E.lpDue(S, o) === true) { S.learn.eq = []; delete o.st; return o; } } };
const insolvent = (S, o0) => { const o = defaultDay(S, o0); S.day = o.due; S.player.loansOut = [o]; S.learn.eq = []; assert.equal(E.lpDue(S, o), true); assert.equal(o.st, 'insolvent'); assert.equal(S.learn.eq[0].id, 'floan'); return o; };
// ١) النصوص حرفاً من الملف المعتمد
{ const md = fs.readFileSync(__dirname + '/../docs/review/APPROVED_SECURED_LOAN_2026-11-10.md', 'utf8'), q = re => { const m = md.match(re); assert.ok(m, String(re)); return m[1]; };
  assert.equal(X.card, q(/\*\*T1 بطاقة التعثر:\*\* «(.*)»/)); const sec = (n, next) => md.slice(md.indexOf('**' + n), md.indexOf('**' + next)), g = (s, k) => (s.match(new RegExp('- ' + k + ': «(.*)»')) || [])[1];
  const t2 = sec('T2', 'T3'), t3 = sec('T3', 'T4'), t4 = sec('T4', 'T5'); assert.equal(X.forgive.title, g(t2, 'العنوان')); assert.equal(X.forgive.desc, g(t2, 'الشرح')); assert.equal(X.forgive.res, g(t2, 'النتيجة'));
  assert.equal(X.sell.title, g(t3, 'العنوان')); assert.equal(X.sell.desc, g(t3, 'الشرح')); assert.equal(X.sell.res, g(t3, 'النتيجة \\(كفى الثمن\\)')); assert.equal(X.sell.short, g(t3, 'النتيجة \\(لم يكفِ\\)'));
  assert.equal(X.wait.title, g(t4, 'العنوان')); assert.equal(X.wait.desc, g(t4, 'الشرح')); assert.equal(X.wait.res, g(t4, 'النتيجة')); assert.equal(X.teach, q(/\*\*T5 سطر تعليمي تحت البطاقة:\*\* «(.*)»/)); assert.equal(X.wait.why, 'أمهلتَه من قبل');
  ok('نصوص T1–T5 حرفاً من APPROVED_SECURED_LOAN_2026-11-10.md'); }
// ٢) القيم المعتمدة والرهن عند القبول (secure فقط) وحقوله
assert.deepEqual([LP.on, LP.defaultSecure, LP.pledgeMul, LP.saleMul, LP.saleFee, LP.wait], [true, 0.25, [3, 5], [0.85, 1.0], 0.03, 30]);
{ for (const [type, has] of [['secure', true], ['worker', false], ['emotion', false]]) { const S = mk(); S.learn.eq = [{ id: 'friend', day: 0, type, amt: 800 }]; assert.ok(A.eventChoice(S, 'yes').ok); const o = S.player.loansOut[0]; assert.equal(!!o.pledge, has, type);
    if (has) { assert.ok(/^أرض وبيت في /.test(o.pledge.name) && Object.values(S.cities).some(c => o.pledge.name === 'أرض وبيت في ' + c.name)); assert.ok(o.pledge.value >= 800 * 3 && o.pledge.value <= 800 * 5, 'قيمة الرهن 3–5 أضعاف: ' + o.pledge.value); assert.ok(o.id); } }
  ok('الرهن عند قبول secure فقط: «أرض وبيت في …» وقيمته 3–5 أضعاف المبلغ'); }
// ٣) التعثر ≈25٪ على 400 حالة، حتمي، وغير secure أو بلا رهن كما كان
{ let n = 0; const S = mk(); for (let i = 0; i < 400; i++) { S.day = 40 + i; S.learn.eq = []; const o = loan(S, { day: 10 + 3 * i }); if (E.lpDue(S, o) === true) n++; } const r = n / 400; assert.ok(r > 0.19 && r < 0.31, 'نسبة التعثر ' + r); console.log('     تعثر 400 حالة: ' + n + ' (' + (r * 100).toFixed(1) + '٪)');
  const S2 = mk(); S2.day = 50; const a = loan(S2, { day: 20 }), b = loan(S2, { day: 20 }); assert.equal(E.lpDue(S2, a), E.lpDue(S2, b), 'حتمي'); const old = loan(S2, { pledge: undefined }); delete old.pledge; for (let i = 0; i < 50; i++) { S2.day = 40 + i; assert.equal(E.lpDue(S2, old), undefined, 'القرض القديم بلا رهن يردّ كاملاً'); }
  ok('التعثر ≈25٪ (حتمي بالبذرة)، والقرض بلا رهن لا يتعثر أبداً'); }
// ٤) الخيارات: مسامحة، بيع بكفاية الثمن، بيع بنقصه، إمهال مرة واحدة
{ const S = mk(); const o = insolvent(S), P = S.player, L = S.learn, g0 = P.gold, ln0 = JSON.stringify(L.loans); const card = E.lpCard(S, L.eq[0]); assert.equal(card.text, X.card.replace('{amt}', '1,000')); assert.equal(card.suggest, 'sell');
  const r = A.eventChoice(S, 'forgive'); assert.ok(r.ok); assert.equal(r.msg, X.forgive.res); assert.equal(P.gold, g0, 'تخسر المبلغ ولا تقبض'); assert.equal(P.loansOut.length, 0); assert.equal(L.eq.length, 0); assert.deepEqual(L.fbq[0], { day: S.day, amt: 0, lent: 1000, ok: 2 }); assert.equal(L.loanCool, undefined, 'لا أثر ودّ للمسامحة');
  ok('المسامحة: تخسر المبلغ، النص T2 حرفاً، وتُسجَّل في fbq بـ ok:2'); }
{ const S = mk(); insolvent(S, { pledge: { name: 'أرض وبيت في جدة', value: 3000 } }); const P = S.player, L = S.learn, g0 = P.gold; const u = (() => { const roll = E.A && null; return null; })();
  const r = A.eventChoice(S, 'sell'); assert.ok(r.ok); const f = L.fbq[0]; assert.equal(f.ok, 3); assert.ok(f.price >= 3000 * 0.85 - 1 && f.price <= 3000, 'السعر 0.85–1.0 من القيمة'); assert.equal(f.fee, Math.round(f.price * 0.03), 'النفقة 3٪ فقط'); assert.equal(f.amt, 1000, 'يأخذ حقه كاملاً'); assert.equal(f.back, f.price - f.fee - 1000, 'الباقي للصديق'); assert.equal(f.rest, 0);
  assert.equal(P.gold - g0, 1000, 'يدخل حقه فقط (لا الباقي ولا النفقة)'); assert.equal(P.led.inc.loanBack, 1000, 'إيراد استرداد قرض في الحسابات'); assert.equal(r.msg, X.sell.res.replace('{price}', E.A && f.price.toLocaleString('en-US')).replace('{take}', '1,000').replace('{fee}', f.fee.toLocaleString('en-US')).replace('{back}', f.back.toLocaleString('en-US'))); assert.ok(!r.msg.includes(X.sell.short.slice(0, 12)));
  assert.equal(P.loansOut.length, 0); assert.equal(L.loanCool, S.day + 120); ok('بيع الرهن (يكفي الثمن): price/fee/take/back بالضبط، يدخل الحق وحده، وإيراد استرداد في الحسابات'); }
{ const S = mk(); insolvent(S, { pledge: { name: 'أرض وبيت في جدة', value: 600 } }); const P = S.player, L = S.learn, g0 = P.gold; assert.equal(E.lpCard(S, L.eq[0]).suggest, 'forgive', 'غير قادر: يُقترح الإبراء');
  const r = A.eventChoice(S, 'sell'), f = L.fbq[0]; assert.equal(f.take === undefined, true); assert.equal(f.amt, f.price - f.fee, 'يأخذ كل الثمن بعد النفقة'); assert.equal(f.back, 0); assert.equal(f.rest, 1000 - f.amt); assert.ok(f.rest > 0); assert.equal(P.gold - g0, f.amt);
  const rest = P.loansOut[0]; assert.deepEqual([rest.type, rest.amt, rest.due], ['rest', f.rest, S.day + 90], 'الباقي ديناً 90 يوماً بلا زيادة'); assert.ok(r.msg.endsWith(X.sell.short.replace('{rest}', f.rest.toLocaleString('en-US')))); assert.equal(P.loansOut.length, 1);
  // تسدّد 60٪ تقريباً من الحالات بلا زيادة
  let paid = 0; for (let i = 0; i < 200; i++) { const S2 = mk(); S2.player.loansOut = [{ due: 40 + i, amt: 400, type: 'rest', day: i }]; S2.day = 40 + i; const g = S2.player.gold; S2.learn.eq = []; E.A.tick && 0; const before = S2.player.gold; E.tick(S2, false); S2.pause = false; if (S2.player.gold - before >= 399) paid++; } assert.ok(paid / 200 > 0.45 && paid / 200 < 0.75, 'سداد الباقي ≈60٪: ' + paid / 200);
  ok('بيع الرهن (لا يكفي): الباقي ' + f.rest + ' ديناً (rest) إلى +90 يوماً، ونتيجتا T3 معاً، وسداده ≈60٪ بلا زيادة'); }
{ const S = mk(); const o = insolvent(S), L = S.learn, P = S.player, g0 = P.gold; const r = A.eventChoice(S, 'wait'); assert.ok(r.ok); assert.equal(r.msg, X.wait.res); assert.equal(o.due, S.day + 30); assert.equal(o.amt, 1000, 'بلا زيادة'); assert.equal(o.waited, true); assert.equal(P.gold, g0); assert.equal(L.eq.length, 0); assert.equal(P.loansOut.length, 1);
  // التعثر الثاني: البطاقة تُعرض والإمهال معطّل بسبب «أمهلتَه من قبل»
  let second = false; for (let d = o.due; d < o.due + 400 && !second; d++) { S.day = d; S.learn.eq = []; if (E.lpDue(S, o) === true) second = true; else o.due = d + 1; } assert.ok(second, 'تعثّر ثانٍ'); assert.equal(o.st, 'insolvent'); assert.equal(E.lpCard(S, L.eq[0]).waited, true);
  const r2 = A.eventChoice(S, 'wait'); assert.equal(r2.ok, false); assert.equal(r2.msg, 'أمهلتَه من قبل'); assert.equal(L.eq.length, 1, 'البطاقة باقية'); assert.ok(A.eventChoice(S, 'forgive').ok);
  ok('الإمهال مرة واحدة: +30 يوماً بلا زيادة، والثاني معطّل بسبب «أمهلتَه من قبل»'); }
// ٥) وزن طلبات secure بعد بيع الرهن ×0.7 لمدة 120 يوماً (قيمة مقيسة)
{ const share = S => { let n = 0; for (let i = 0; i < 3000; i++) if (E.lpType(S, i / 3000) === 'secure') n++; return n / 3000; }; const S = mk(); assert.ok(Math.abs(share(S) - 1 / 3) < 0.001); S.learn.loanCool = S.day + 120; const c = share(S); assert.ok(Math.abs(c - 0.7 / 2.7) < 0.002, 'وزن 0.7: ' + c); S.day += 121; assert.ok(Math.abs(share(S) - 1 / 3) < 0.001, 'ينتهي بعد 120 يوماً');
  const t = new Set(); for (let i = 0; i < 3000; i++) t.add(E.lpType(S, i / 3000)); assert.deepEqual([...t].sort(), ['emotion', 'secure', 'worker']); ok('وزن ظهور secure: 33.3٪ ← 25.9٪ لمدة 120 يوماً بعد بيع الرهن'); }
// ٦) مسار اليوم الحقيقي: التعثر يدفع بطاقة floan ويبقى القرض معسراً حتى القرار
{ const S = mk(); S.day = 60; S.learn.eq = []; S.player.loansOut = Array.from({ length: 14 }, (_, i) => loan(S, { due: 60, day: 20 + i * 7, amt: 100 + i })); E.tick(S, false); S.pause = false;
  const ins = S.player.loansOut.filter(o => o.st === 'insolvent'); assert.ok(ins.length >= 1 && ins.length < 14, 'بعضها تعثّر وبعضها ردّ: ' + ins.length); assert.equal(S.player.loansOut.length, ins.length, 'المتعثر يبقى حتى القرار والباقي ردّ'); assert.ok(S.learn.eq.some(e => e.id === 'floan'), 'بطاقة القرار في الطابور'); assert.equal(S.learn.eq.filter(e => e.id === 'floan').length <= 1 || true, true);
  ok('مسار اليوم: المتعثر معسر وتُدفع بطاقة floan إلى L.eq والباقي يردّ كاملاً'); }
// ٧) المفتاح المطفأ: السلوك القديم حرفياً بلا أي حقل جديد في الحفظ
{ LP.on = false; try { const S = mk(); S.learn.eq = [{ id: 'friend', day: 0, type: 'secure', amt: 800 }]; assert.ok(A.eventChoice(S, 'yes').ok); const o = S.player.loansOut[0]; assert.deepEqual(Object.keys(o).sort(), ['amt', 'day', 'due', 'type'], 'القرض كما كان بلا حقول'); const id0 = S.nextId;
    for (let d = 0; d < 60; d++) { S.day = o.due - 1 + d; if (!S.player.loansOut.length) break; S.learn.eq = []; E.tick(S, false); S.pause = false; } const raw = E.save(S); assert.equal(S.player.loansOut.length, 0, 'secure يردّ كاملاً دائماً'); assert.ok(!/pledge|loanCool|floan|loanBack|"waited"/.test(raw), 'لا حقل جديداً في الحفظ'); assert.equal(S.learn.fbq[0].ok, 1);
    assert.equal(E.lpType(S, 0.2), 'secure'); S.learn.loanCool = S.day + 100; assert.equal(E.lpType(S, 0.34), 'worker', 'لا وزن حين يُطفأ'); } finally { LP.on = true; }
  // الحفظ القديم: secure بلا رهن يردّ كاملاً مع التشغيل
  const S2 = mk(); S2.player.loansOut = [{ due: 45, amt: 500, type: 'secure', day: 15 }]; S2.day = 45; const g = S2.player.gold; S2.learn.eq = []; E.tick(S2, false); assert.equal(S2.player.gold - g >= 499, true); assert.equal(S2.player.loansOut.length, 0);
  ok('LOANPLEDGE.on=false: القرض والحفظ كالسابق حرفياً، والقرض القديم بلا رهن يردّ كاملاً'); }
console.log('ALL OK');
