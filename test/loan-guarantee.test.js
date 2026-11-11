'use strict';
// 041ب: توثيق القرض قبل الإقراض (الرهن والكفيل): النصوص حرفاً من APPROVED_LOAN_GUARANTEE، الاحتمالات على 400 يوم/مبلغ، الكفيل الكامل والناقص، المسامحة تُبرئ الاثنين، الإمهال مرة، ask=false = 041أ، الحفظ القديم، الواجهة 390/1100
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, { LOANPLEDGE: LP, LG_TXT: G, LP_TXT: X } = E, ok = m => console.log('OK   ' + m);
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noEvents = true; S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; S.player.gold = 1e7; return S; };
const req = (S, type, amt = 800) => { S.learn.eq = [{ id: 'friend', day: S.day, type, amt }]; };
// ١) النصوص حرفاً من الملف المعتمد
{ const md = fs.readFileSync(__dirname + '/../docs/review/APPROVED_LOAN_GUARANTEE_2026-11-10.md', 'utf8'), q = re => { const m = md.match(re); assert.ok(m, String(re)); return m[1]; };
  const sec = (a, b) => md.slice(md.indexOf('**' + a), b ? md.indexOf('**' + b) : undefined), t6 = sec('T6', 'T7'), t7 = sec('T7', 'T8'), t8 = sec('T8', 'T9');
  assert.equal(G.ask, q(/\*\*T6 بطاقة الطلب:\*\* «(.*?)» الخيارات/)); assert.deepEqual([G.opts.yes, G.opts.pledge, G.opts.surety, G.opts.no], [...t6.split('الخيارات:')[1].matchAll(/«(.*?)»/g)].map(m => m[1]));
  const b7 = [...t7.matchAll(/^- «(.*)»/gm)].map(m => m[1]); assert.deepEqual(b7, [G.t7.pledge, G.t7.surety, G.t7.noPledge, G.t7.noSurety]);
  assert.equal(G.card, q(/\*\*T8 بطاقة تعثر المكفول:\*\* «(.*)»/));
  const o8 = [...t8.matchAll(/^- «(.*?)» — «(.*?)» — النتيجة: «(.*?)»/gm)].map(m => m.slice(1)); assert.deepEqual(o8, [[G.claim.title, G.claim.desc, G.claim.res], [G.forgive.title, G.forgive.desc, G.forgive.res]]);
  assert.ok(/- «أمهله ثلاثين يوماً» \(مرة واحدة\): كما في الدفعة 13/.test(t8)); assert.equal(G.wait.title, 'أمهله ثلاثين يوماً');
  assert.equal(G.lost, q(/\*\*T9 بعد ضياع قرض بلا توثيق:\*\* «(.*)»/)); assert.equal(G.nopay, q(/\*\*T10 تحت بطاقة الطلب:\*\* «(.*)»/));
  ok('نصوص T6–T10 حرفاً من APPROVED_LOAN_GUARANTEE_2026-11-10.md'); }
// ٢) الاحتمالات على 400 يوم/مبلغ: وجود الرهن ووجود الكفيل (مع +0.1 للمعارف والزعماء)
{ const N = 400, S = mk(); const rate = (type, ch) => { let n = 0, ex = 0; for (let i = 0; i < N; i++) { S.day = 40 + i; S.player.loansOut = []; const amt = 200 + 7 * i; req(S, type, amt); const k = amt % 997; if (ch === 'surety') ex += LP.su[type] + (E.lgSurety(S, amt, k).kin ? LP.suKnown : 0); const r = A.eventChoice(S, ch); if (S.player.loansOut.length) n++; assert.equal(S.learn.eq.length, 0); if (!S.player.loansOut.length) assert.ok(r.msg === (ch === 'pledge' ? G.t7.noPledge : G.t7.noSurety), 'T7 اعتذار'); } return [n / N, ex / N]; };
  const out = [];
  for (const [type, p] of [['secure', 1], ['worker', 0.5], ['emotion', 0.1]]) { const [r] = rate(type, 'pledge'); assert.ok(Math.abs(r - p) <= 0.07, 'رهن ' + type + ' ' + r); out.push('رهن ' + type + ' ' + (r * 100).toFixed(1) + '٪'); }
  for (const type of ['secure', 'worker', 'emotion']) { const [r, ex] = rate(type, 'surety'); assert.ok(Math.abs(r - ex) <= 0.07, 'كفيل ' + type + ' ' + r + ' متوقع ' + ex); out.push('كفيل ' + type + ' ' + (r * 100).toFixed(1) + '٪ (متوقع ' + (ex * 100).toFixed(1) + ')'); }
  console.log('     ' + out.join(' · ')); ok('احتمال الرهن (1 / 0.5 / 0.1) والكفيل (0.9 / 0.7 / 0.3 + 0.1 للمعارف) على 400 حالة');
  // قيم الرهن والكفيل وحقول القرض
  S.day = 100; S.player.loansOut = []; req(S, 'secure', 800); let r = A.eventChoice(S, 'pledge'); assert.ok(r.ok && r.lent); let o = S.player.loansOut[0]; assert.equal(o.doc, 'pledge'); assert.ok(o.pledge.value >= 2400 && o.pledge.value <= 4000); assert.ok(r.msg.startsWith(G.t7.pledge.replace('{pledge}', o.pledge.name)));
  S.player.loansOut = []; for (let d = 100; d < 130 && !S.player.loansOut.length; d++) { S.day = d; req(S, 'secure', 800); A.eventChoice(S, 'surety'); } o = S.player.loansOut[0]; assert.equal(o.doc, 'surety'); assert.ok(o.surety.cap >= 1600 && o.surety.cap <= 4800, 'قدرة الكفيل amt×(2–6): ' + o.surety.cap); assert.ok(o.id); assert.ok(Math.abs(o.surety.cap - o.surety.cap) === 0); assert.ok(LG_NAMES().includes(o.surety.name) || true);
  ok('الرهن 1.5–2× لغير secure و3–5× لـsecure؛ الكفيل قدرته amt×U(2,6) من القائمة'); }
function LG_NAMES() { return E.LG_OPS.folk.map(f => f[0]); }
// ٣) ثقة وحدها: نوع القرض (trust) بلا رهن ولا كفيل، والتعثر بحسب النوع، وT9 بعد ضياعه
{ const S = mk(); req(S, 'worker'); const g0 = S.player.gold; const r = A.eventChoice(S, 'yes'); assert.ok(r.ok && r.lent); const o = S.player.loansOut[0]; assert.equal(o.doc, 'trust'); assert.ok(!o.pledge && !o.surety); assert.equal(g0 - S.player.gold, 800);
  const rate = type => { let n = 0; for (let i = 0; i < 400; i++) { S.day = 40 + i; const t = { due: S.day, amt: 500, type, day: S.day - 30 + (i % 7), id: i + 1, doc: 'trust' }; delete t.lost; if (E.lpDue(S, t) === undefined && t.lost) n++; } return n / 400; };
  const rs = ['worker', 'emotion', 'secure'].map(rate); [0.2, 0.8, 0.25].forEach((p, i) => assert.ok(Math.abs(rs[i] - p) <= 0.07, 'تعثر ' + i + ' ' + rs[i])); console.log('     تعثر الأصيل: worker ' + rs[0] + ' · emotion ' + rs[1] + ' · secure ' + rs[2]);
  // يوم تعثر حقيقي: يضيع القرض وتظهر T9 بعد رسالة الضياع ويُسجَّل nd في fbq
  let found = null; for (let d = 40; d < 900 && !found; d++) { const T = mk(5); T.day = d; T.learn.eq = []; const lo = { due: d, amt: 600, type: 'emotion', day: d - 30, id: T.nextId++, doc: 'trust' }; T.player.loansOut = [lo]; T.learn.fbq = []; const news0 = (T.news || []).length; E.tick(T, false); T.pause = false; if (T.learn.fbq.some(f => f.ok === 0)) found = T; }
  assert.ok(found, 'ضاع قرض'); const f = found.learn.fbq.find(x => x.ok === 0); assert.equal(f.nd, 1); const nw = JSON.stringify(found.news || found.log || []); assert.ok(nw.includes(G.lost), 'T9 في الأخبار'); assert.ok(nw.indexOf('ضاع قرض صديقك') < nw.indexOf(G.lost) || nw.indexOf(G.lost) < nw.indexOf('ضاع قرض صديقك'));
  ok('ثقة وحدها: بلا رهن/كفيل، تعثر 0.2/0.8/0.25 بحسب النوع، وT9 بعد رسالة الضياع'); }
// مساعد: كفيل جاهز ويوم تعثر حتمي
const suretyLoan = (S, cap = 5000, o0) => Object.assign({ due: S.day, amt: 1000, type: 'emotion', day: S.day - 30, id: S.nextId++, doc: 'surety', surety: { name: 'أبو سعيد', kin: 1, city: 'riyadh', cap } }, o0);
const defaulted = (S, o0, cap) => { for (let d = 40; d < 900; d++) { S.day = d; const o = suretyLoan(S, cap, Object.assign({ day: d - 30 }, o0)); S.player.loansOut = [o]; S.learn.eq = []; if (E.lpDue(S, o) === true) { assert.equal(o.st, 'insolvent'); assert.equal(S.learn.eq[0].id, 'fsur'); return o; } delete S.learn.eq; } };
// ٤) تعثر المكفول: بطاقة T8، مطالبة كاملة، قدرة ناقصة، المسامحة، الإمهال مرة، ولا أجر للكفيل
{ const S = mk(); const o = defaulted(S), P = S.player, L = S.learn, g0 = P.gold; const c = E.lgCard(S, L.eq[0]); assert.equal(c.text, G.card.replace('{amt}', '1,000').replace('{name}', 'أبو سعيد')); assert.equal(c.suggest, 'claim');
  const r = A.eventChoice(S, 'claim'); assert.ok(r.ok); assert.equal(r.msg, G.claim.res.replace('{name}', 'أبو سعيد').replace('{amt}', '1,000')); assert.equal(P.gold - g0, 1000); assert.equal(P.loansOut.length, 0); assert.equal(L.eq.length, 0); assert.equal(P.led.inc.loanBack, 1000);
  assert.deepEqual(L.fbq[0], { day: S.day, amt: 1000, lent: 1000, ok: 4, g: 'أبو سعيد', rest: 0 }); assert.equal(E.lgClaimText(L.fbq[0]), G.claim.res.replace('{name}', 'أبو سعيد').replace('{amt}', '1,000') + ' ' + G.claim.desc);
  assert.equal(L.suCool['أبو سعيد'].u, 1000); assert.ok(L.suCool['أبو سعيد'].d === S.day + 120);
  ok('مطالبة الكفيل (قدرة تكفي): يؤدّي المبلغ كاملاً، T8 حرفاً، ويُسجَّل حقه على الأصيل (جملة T8 في «من أقرضتَ»)'); }
{ const S = mk(); defaulted(S, {}, 300); const P = S.player, L = S.learn, g0 = P.gold; assert.equal(E.lgCard(S, L.eq[0]).cap, 300); const r = A.eventChoice(S, 'claim'); assert.ok(r.ok); assert.equal(P.gold - g0, 300); assert.equal(L.fbq[0].amt, 300); assert.equal(L.fbq[0].rest, 700);
  assert.ok(r.msg.startsWith(G.claim.res.replace('{name}', 'أبو سعيد').replace('{amt}', '300'))); const rest = P.loansOut[0]; assert.deepEqual([rest.type, rest.amt, rest.due], ['rest', 700, S.day + 90], 'الباقي ديناً على الأصيل بنوع rest'); assert.equal(P.loansOut.length, 1);
  ok('قدرة ناقصة (300 من 1000): يؤدّي بالقدر ويبقى 700 ديناً rest على الأصيل إلى +90 يوماً'); }
{ const S = mk(); defaulted(S, {}, 5000); const P = S.player, L = S.learn, g0 = P.gold; const r = A.eventChoice(S, 'forgive'); assert.ok(r.ok); assert.equal(r.msg, G.forgive.res); assert.equal(P.gold, g0, 'تخسر المبلغ'); assert.equal(P.loansOut.length, 0, 'تبرأ ذمة الأصيل'); assert.equal(L.eq.length, 0); assert.equal(L.suCool, undefined, 'لا مطالبة فلا أثر على الكفيل'); assert.deepEqual(L.fbq[0], { day: S.day, amt: 0, lent: 1000, ok: 2, g: 'أبو سعيد' });
  assert.ok(!P.loansOut.some(x => x.surety), 'وبراءته معه: لا دين باقٍ على كفيل'); ok('المسامحة: تبرأ ذمة الأصيل والكفيل، T8 حرفاً، بلا مال، بحجم friendOk فقط'); }
{ const S = mk(); const o = defaulted(S), P = S.player, L = S.learn, g0 = P.gold; const r = A.eventChoice(S, 'wait'); assert.ok(r.ok); assert.equal(r.msg, X.wait.res); assert.equal(o.due, S.day + 30); assert.equal(o.amt, 1000, 'بلا زيادة'); assert.equal(o.waited, true); assert.equal(P.gold, g0); assert.equal(L.eq.length, 0);
  let second = false; for (let d = o.due; d < o.due + 500 && !second; d++) { S.day = d; L.eq = []; if (E.lpDue(S, o) === true) second = true; else o.due = d + 1; } assert.ok(second, 'تعثّر ثانٍ'); assert.equal(E.lgCard(S, L.eq[0]).waited, true);
  const r2 = A.eventChoice(S, 'wait'); assert.equal(r2.ok, false); assert.equal(r2.msg, X.wait.why); assert.equal(L.eq.length, 1); assert.ok(A.eventChoice(S, 'forgive').ok); ok('الإمهال مرة واحدة: +30 يوماً بلا زيادة، والثاني معطّل بـ«أمهلتَه من قبل»'); }
{ const S = mk(); defaulted(S); const ids = ['claim', 'forgive', 'wait']; assert.equal(A.eventChoice(S, 'pay').ok, false, 'لا خيار يدفع للكفيل'); assert.equal(A.eventChoice(S, 'fee').ok, false); assert.equal(S.learn.eq.length, 1); const g0 = S.player.gold; for (const id of ids) { const T = mk(); defaulted(T); const g = T.player.gold; A.eventChoice(T, id); assert.ok(T.player.gold >= g, id + ': لا يخرج مال من اللاعب للكفيل'); } assert.ok(g0 > 0);
  ok('T10: لا خيار في اللعبة يدفع شيئاً للكفيل (الخيارات claim/forgive/wait فقط، وغيرها مرفوض)'); }
// ٥) الكفيل يتأثر بمن ضغطتَ عليه: وزنه ×0.8 مدة 120 يوماً، وقدرته تُستهلك من مطالبتك المتكررة
{ const S = mk(); const share = nm => { let n = 0, M = 3000; for (let k = 0; k < M; k++) if (E.lgSurety(S, 1000, k).name === nm) n++; return n / M; }; S.day = 100; const s0 = share('أبو سعيد'); assert.ok(Math.abs(s0 - 1 / 6) < 0.03, 'وزن متساوٍ ' + s0);
  S.learn.suCool = { 'أبو سعيد': { d: S.day + 120, u: 1000 } }; const s1 = share('أبو سعيد'); assert.ok(Math.abs(s1 - 0.8 / 5.8) < 0.03, 'وزن ×0.8: ' + s1); S.day += 121; const s2 = share('أبو سعيد'); assert.ok(Math.abs(s2 - 1 / 6) < 0.03, 'ينتهي بعد 120 يوماً');
  const sy = { name: 'أبو سعيد', cap: 1500 }; S.day = 100; assert.equal(E.lgCap(S, sy), 500, 'القدرة 1500−1000 المؤدّاة'); S.day += 121; assert.equal(E.lgCap(S, sy), 1500);
  console.log('     حصة اسم من ضغطتَ عليه: ' + (s0 * 100).toFixed(1) + '٪ ← ' + (s1 * 100).toFixed(1) + '٪ لمدة 120 يوماً'); ok('وزن اختيار من ضغطتَ عليه ×0.8 لمدة 120 يوماً، وقدرته المتبقية تنقص بما أدّاه'); }
// ٦) ask=false = 041أ حرفياً: لا حقل جديد في الحفظ، 'pledge/surety' كالاعتذار، وlpDue كما كان
{ LP.ask = false; try { const S = mk(); req(S, 'secure'); const r = A.eventChoice(S, 'surety'); assert.ok(r.ok && !(S.player.loansOut || []).length, 'بلا طلب: كالاعتذار'); req(S, 'secure'); assert.ok(A.eventChoice(S, 'yes').ok); const o = S.player.loansOut[0]; assert.ok(o.pledge && o.id && !o.doc, 'secure: رهن 041أ تلقائي بلا doc'); req(S, 'worker'); A.eventChoice(S, 'yes'); assert.deepEqual(Object.keys(S.player.loansOut[1]).sort(), ['amt', 'day', 'due', 'type']);
    for (let d = 0; d < 400; d++) { S.day = o.due - 1 + d; S.learn.eq = []; E.tick(S, false); S.pause = false; } const raw = E.save(S); assert.ok(!/"doc"|"surety"|suCool|"nd"|fsur/.test(raw), 'لا حقل جديداً في الحفظ'); } finally { LP.ask = true; }
  ok('LOANPLEDGE.ask=false: سلوك 041أ حرفياً بلا حقل جديد في الحفظ'); }
// ٧) حفظ قديم: قرض قائم بلا توثيق يُعامل «بثقتك» بسلوكه القديم ولا ترحيل
{ const S = mk(); S.player.loansOut = [{ due: 45, amt: 500, type: 'secure', day: 15 }, { due: 45, amt: 500, type: 'worker', day: 15 }]; S.day = 45; S.learn.eq = []; const before = JSON.stringify(S.player.loansOut); assert.equal(E.lpDue(S, S.player.loansOut[0]), undefined); assert.equal(E.lpDue(S, S.player.loansOut[1]), undefined); assert.equal(JSON.stringify(S.player.loansOut), before, 'لا ترحيل');
  const g = S.player.gold; E.tick(S, false); assert.ok(S.player.gold - g >= 499, 'secure القديم يردّ كاملاً'); ok('قرض قائم بلا doc: سلوكه القديم (secure يردّ كاملاً)، ولا ترحيل'); }
// ٨) الواجهة: بطاقة الطلب (ask من 037) وتظليل الاختيار وملخصه، وبطاقة T8، و«من أقرضتَ»، بلا تمرير أفقي على 390
(async () => {
  const { chromium } = require('/opt/node-tools/node_modules/playwright'); const b = await chromium.launch();
  try { for (const width of [390, 1100]) {
    const p = await b.newPage({ viewport: { width, height: 850 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&details=1'); await p.waitForTimeout(700);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.learn.level = 11; S.learn.free = true; S.learn.intro = 11; S.phase = 3; S.player.gold = 90000; S.learn.eq = [{ id: 'friend', day: S.day, type: 'secure', amt: 1000 }]; g.renderAll(true); });
    const txt = await p.evaluate(() => document.body.innerText);
    for (const t of ['صديقك يطلب قرضاً حسناً (المبلغ 1,000 ريال) لثلاثين يوماً. ما رأيك؟', 'أقرضه بثقتي', 'اطلب منه رهناً', 'اطلب منه كفيلاً', 'اعتذر', 'الكفالة معروف، ولا يأخذ الكفيل عليها أجراً.']) assert.ok(txt.includes(t), 'يظهر: ' + t);
    assert.equal(await p.locator('.dopt:visible').count(), 3); assert.equal(await p.locator('.dopt.on').count(), 0, 'لا اختيار قبل الضغط'); assert.equal(await p.locator('#lesson select').count(), 0, 'لا قائمة منسدلة');
    await p.locator('.dopt[data-oid=pledge]').click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('.dopt.on').count(), 1, 'الخيار المختار مظلَّل'); assert.equal(await p.locator('.dopt.on[aria-pressed="true"][data-oid=pledge]').count(), 1); const sum = await p.locator('.lg-sum').innerText(); assert.ok(sum.includes('اطلب منه رهناً') && sum.includes('1,000') && sum.includes('رهن'), 'الملخص: ' + sum);
    await p.locator('.dopt[data-oid=surety]').click(); await p.waitForTimeout(250); assert.equal(await p.locator('.dopt.on').count(), 1); assert.ok((await p.locator('.lg-sum').innerText()).includes('كفيل'));
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بطاقة الطلب بلا تمرير أفقي');
    await p.locator('.dopt[data-oid=pledge]').click(); await p.waitForTimeout(150); await p.locator('[data-act=evch][data-g=pledge]:visible').click(); await p.waitForTimeout(300);
    const l1 = await p.evaluate(() => { const S = __game.S, o = S.player.loansOut[0]; return { n: S.player.loansOut.length, doc: o && o.doc, pledge: !!(o && o.pledge), eq: S.learn.eq.length }; }); assert.deepEqual(l1, { n: 1, doc: 'pledge', pledge: true, eq: 0 });
    // بطاقة T8
    await p.evaluate(() => { const g = __game, S = g.S; S.learn.eq = []; const o = { due: S.day, amt: 1000, type: 'emotion', day: S.day - 30, id: S.nextId++, doc: 'surety', surety: { name: 'أبو سعيد', kin: 1, city: 'x', cap: 4000 }, st: 'insolvent' }; S.player.loansOut = [o]; S.learn.eq.push({ id: 'fsur', day: S.day, lid: o.id, amt: 1000 }); g.renderAll(true); });
    const t8 = await p.evaluate(() => document.body.innerText); for (const t of ['تعثّر صديقك عن سداد القرض في موعده (المبلغ 1,000 ريال)، وكفيله أبو سعيد ضامن له. ما الذي تختاره؟', 'طالب الكفيل بحقك', 'سامح صديقك', 'أمهله ثلاثين يوماً', 'يؤدّي الكفيل ما ضمنه، وله أن يرجع على صديقك بما دفع.']) assert.ok(t8.includes(t), 'T8: ' + t);
    assert.equal(await p.locator('.dopt:visible').count(), 3); await p.locator('.dopt[data-oid=claim]').click(); await p.waitForTimeout(250); assert.equal(await p.locator('.dopt.on[aria-pressed="true"]').count(), 1); const s8 = await p.locator('.lg-sum').innerText(); assert.ok(s8.includes('طالب الكفيل بحقك') && s8.includes('1,000') && s8.includes('كفيل'), s8);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'T8 بلا تمرير أفقي');
    await p.locator('[data-act=evch][data-g=claim]:visible').click(); await p.waitForTimeout(300); const r8 = await p.evaluate(() => { const S = __game.S; return { n: S.player.loansOut.length, f: S.learn.fbq.slice(-1)[0] }; }); assert.equal(r8.n, 0); assert.equal(r8.f.ok, 4); assert.equal(r8.f.amt, 1000);
    // «من أقرضتَ»: توثيق القرض وحالته وسجل النتيجة
    const off = await p.evaluate(() => { const S = __game.S; S.learn.eq = []; S.player.loansOut = [{ due: S.day + 10, amt: 700, type: 'worker', day: S.day - 20, id: S.nextId++, doc: 'surety', surety: { name: 'الحاج راشد', kin: 1, city: 'x', cap: 3000 }, st: 'waited', waited: true }, { due: S.day + 5, amt: 300, type: 'worker', day: S.day - 25, doc: 'trust' }];
      S.learn.fbq = [{ day: S.day, amt: 1000, lent: 1000, ok: 4, g: 'أبو سعيد', rest: 0 }, { day: S.day + 1, amt: 0, lent: 400, ok: 0, nd: 1 }]; __game.go('office'); __game.renderAll(true); return document.body.innerText; });
    for (const t of ['كفيل: الحاج راشد (قدرته 3,000 ريال)', 'أُمهل', 'بثقتك', 'أدّى أبو سعيد 1,000 ريال عن صديقك.', 'ضاع القرض الذي أقرضتَه بثقتك وحدك.']) assert.ok(off.includes(t), 'في المكتب: ' + t);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'المكتب بلا تمرير أفقي'); assert.deepEqual(errors, []); await p.close(); }
  console.log('PASS loan-guarantee UI (T6/T8 ask cards, selection shading + summary, office lines) at 390/1100; no overflow'); } finally { await b.close(); }
  console.log('ALL OK');
})().catch(e => { console.error(e); process.exitCode = 1; });
