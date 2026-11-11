'use strict';
// 043أ إطار تفويض ناظر الديوان: السعة بالدرجة (8→30)، الخانات تمتلئ وتتحرر، التقرير لا يشغل خانة، المحوّلان ينفذان فعلاً ويسجلان،
// التجميد والتراجع، الأجر +wageStep لكل خانة، الأسئلة الستة، الحفظ القديم، والمفتاح مطفأً = السلوك السابق بلا حقول جديدة.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { staffDay, mgrDay, '), box);
const E = box.module.exports, A = E.A, near = (x, y, m) => a(Math.abs(x - y) < 1e-6, (m || '') + ` ${x} != ${y}`);
function game() { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 5e6; S.noEvents = true; S.noShocks = true; return S; }
function withSteward(S, city) {
  for (let i = 0; i < 2; i++) a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok);
  const pr = S.player.props[city]; for (const w of pr.staff) { w.days = 120; w.free = 0; }
  const d0 = S.day; for (let day = d0 + 1; day <= d0 + 30; day++) { S.day = day; E.staffDay(S, city, pr, S.cities[city]); }
  a(A.promoteWorker(S, city, pr.staff[0].id, 'shop', pr.shops[0].id).ok);
  { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, city, pr); } }
  a(A.auditCity(S, city).ok); a(A.promoteSteward(S, city).ok); return pr;
}
function hired() { const S = game(); withSteward(S, 'riyadh'); withSteward(S, 'jeddah'); S.phase = 4; a(A.hireAgent(S, 'sa').ok); a(A.hireDiwan(S).ok); return S; }
const shops = (S, city) => S.player.props[city].shops.filter(sh => E.shKind(sh) === 'own');
const SF = (o = {}) => Object.assign({ kind: 'shopfix', type: 'once', scope: 'riyadh', limits: { below: 55 }, mode: 'exec' }, o);
const BR = { kind: 'brief', type: 'report', scope: '*', limits: {}, mode: 'exec' };

// 1) السعة تتبع الدرجة: من أيام الخدمة 90/180/360/720 (حقل sk للناظر يبدأ عند 3 فلا يُعتمد)
{
  const S = hired(), D = S.player.diwan; a.equal(E.delegGrade(S), 1); a.equal(E.delegCap(S), 8); a.equal(E.delegUsed(S), 0);
  const caps = []; for (const d of [89, 90, 180, 360, 720, 5000]) { D.since = S.day - d; caps.push(E.delegCap(S)); } a.deepEqual(caps, [8, 14, 20, 25, 30, 30]);
  D.since = S.day; D.sk = { g: 3 }; a.equal(E.delegCap(S), 8, 'حقل sk (يبدأ عند 3 بعد التحميل) لا يرفع السعة الأولى'); delete D.sk;
  a.equal(E.delegView(S).nextCap, 14);
}
// 2) الخانات تمتلئ وتتحرر؛ التقرير لا يشغل؛ رسالة الرفض بسببها
{
  const S = hired(); for (const c of ['riyadh', 'jeddah']) for (const sh of shops(S, c)) sh.cond = 90; // لا شيء يُرمَّم: تبقى المهام الدائمة قائمة
  let n = 0; for (const c of ['riyadh', 'jeddah']) for (let i = 0; i < 4; i++) { const r = A.delegAdd(S, SF({ type: 'standing', scope: c, limits: { below: [45, 55, 65][i % 3], pct: 5 } })); if (r.ok) n++; }
  a.equal(n, 8); a.equal(E.delegUsed(S), 8); const full = A.delegAdd(S, SF({ type: 'standing', limits: { below: 55, pct: 5 } })); a.equal(full.ok, false); a.equal(full.msg, 'الخانات ممتلئة (8/8): أنجز مهمة أو ألغِ واحدة');
  a.equal(A.delegAdd(S, BR).ok, true, 'التقرير يُقبل والخانات ممتلئة'); a.equal(E.delegUsed(S), 8, 'التقرير لا يشغل خانة'); a.equal(A.delegAdd(S, BR).ok, false, 'تقرير واحد');
  const id = S.player.diwan.tasks.find(t => t.type === 'standing').id; a.equal(A.delegCancel(S, id).ok, true); a.equal(E.delegUsed(S), 7); a.equal(A.delegAdd(S, SF({ type: 'standing', limits: { below: 55, pct: 5 } })).ok, true, 'الإلغاء حرّر الخانة'); a.equal(E.delegUsed(S), 8);
  a.equal(A.delegCancel(S, 99999).ok, false);
  // المنجزة تتحرر تلقائياً: مهمة مرة واحدة بلا شيء يُرمَّم تنتهي في اليوم نفسه
  const S2 = hired(); for (const sh of shops(S2, 'riyadh')) sh.cond = 90; a(A.delegAdd(S2, SF()).ok); a.equal(E.delegUsed(S2), 0, 'لا شيء تحت الحد فأنجزت وتحرّرت'); a(S2.player.diwan.tlog.some(e => /أنجزتُ/.test(e.text)));
}
// 3) ترميم الدكان: المفوَّض يطابق اليدوي في الأثر والتكلفة، ويسجَّل بالمبلغ ويُوسم غير قابل للتراجع
{
  const S = hired(), M = hired(); for (const X of [S, M]) { const sh = shops(X, 'riyadh'); sh[0].cond = 50; sh[1].cond = 85; } // واحد تحت 55 وآخر سليم
  const h = shops(M, 'riyadh')[0], g0 = M.player.gold; a(A.shopRepair(M, 'riyadh', h.id).ok); const manualCost = g0 - M.player.gold, manualCond = h.cond; a(manualCost > 0);
  const gS = S.player.gold; const r = A.delegAdd(S, SF()); a.equal(r.ok, true, r.msg); const d = shops(S, 'riyadh');
  a.equal(d[0].cond, manualCond, 'نفس الحالة'); near(gS - S.player.gold, manualCost, 'نفس التكلفة'); a.equal(d[1].cond, 85, 'السليم لم يُمسّ');
  const e = S.player.diwan.tlog.find(x => x.kind === 'shopfix' && x.amount > 0); a(e, 'مسجَّل'); near(e.amount, manualCost); a.equal(e.irrev, true); a.match(e.text, /لا يُعكس/); a.equal(E.delegUsed(S), 0, 'أنجزت فتحررت'); a.equal(A.delegUndo(S, S.player.diwan.tlog.indexOf(e)).ok, false); a.match(A.delegUndo(S, S.player.diwan.tlog.indexOf(e)).msg, /غير قابل للتراجع/);
}
// 4) القاعدة الدائمة: ميزانية شهرية نسبية من الرصيد، تتوقف عند سقفها وتتجدد بعد 30 يوماً
{
  const S = hired(), sh = shops(S, 'riyadh'); sh[0].cond = 40; sh[1].cond = 40;
  const q0 = E.scQuote(S, 'riyadh', sh[0].id); a(q0.cost > 0); S.player.wallet.sar = Math.round(q0.cost * 1.5 / 0.02); const pct = 2, cap = Math.round(S.player.gold * pct / 100); a(cap >= q0.cost && cap < 2 * q0.cost, 'السقف يكفي دكاناً واحداً فقط: ' + cap + ' / ' + q0.cost);
  a(A.delegAdd(S, SF({ type: 'standing', limits: { below: 45, pct } })).ok); const T = S.player.diwan.tasks[0];
  a.equal(sh.filter(x => x.cond > 40).length, 1, 'رُمّم دكان واحد فقط ضمن السقف'); near(T.win.spent, q0.cost); a.equal(E.delegUsed(S), 1, 'القاعدة تبقى خانتها');
  const day0 = S.day; for (let i = 1; i <= 5; i++) { S.day = day0 + i; S.player.diwan.dd = 0; E.delegDay(S); } a.equal(sh.filter(x => x.cond > 40).length, 1, 'لا ترميم فوق السقف داخل الشهر');
  S.day = day0 + 31; S.player.wallet.sar = Math.round(q0.cost * 1.5 / 0.02); S.player.diwan.dd = 0; E.delegDay(S); a.equal(sh.filter(x => x.cond > 40).length, 2, 'نافذة شهر جديدة ترمّم الثاني');
}
// 5) أوضاع ask وmine: ask يسأل ثم ينفّذ بعد المهلة، والرد «سأتولاها» لا ينفّذ، وmine تذكير فقط
{
  const S = hired(); const sh = shops(S, 'riyadh'); sh[0].cond = 50; const g0 = S.player.gold;
  a(A.delegAdd(S, SF({ mode: 'ask' })).ok); const T = S.player.diwan.tasks[0]; a(T.pend && T.pend.due === S.day + E.DELEG.wait); a.equal(sh[0].cond, 50, 'لم ينفّذ قبل الرد'); a.equal(S.player.gold, g0);
  S.day += E.DELEG.wait; S.player.diwan.dd = 0; E.delegDay(S); a.equal(sh[0].cond, 90, 'نفّذ بعد المهلة'); a.equal(E.delegUsed(S), 0);
  const S2 = hired(); shops(S2, 'riyadh')[0].cond = 50; a(A.delegAdd(S2, SF({ mode: 'ask' })).ok); const id = S2.player.diwan.tasks[0].id; a(A.delegAnswer(S2, id, 'mine').ok); a.equal(shops(S2, 'riyadh')[0].cond, 50); a.equal(E.delegUsed(S2), 0, 'مرة واحدة تولّاها اللاعب: تحررت');
  const S3 = hired(); shops(S3, 'riyadh')[0].cond = 50; a(A.delegAdd(S3, SF({ mode: 'ask' })).ok); a(A.delegAnswer(S3, S3.player.diwan.tasks[0].id, 'do').ok); a.equal(shops(S3, 'riyadh')[0].cond, 90, 'نفّذ عني');
  const S4 = hired(); shops(S4, 'riyadh')[0].cond = 50; a(A.delegAdd(S4, SF({ mode: 'mine', type: 'standing', limits: { below: 55, pct: 5 } })).ok); a(S4.player.diwan.tasks[0].pend.remind); for (let i = 1; i < 10; i++) { S4.day += 1; S4.player.diwan.dd = 0; E.delegDay(S4); } a.equal(shops(S4, 'riyadh')[0].cond, 50, 'mine لا ينفّذ أبداً');
}
// 6) التقرير بأرقام حقيقية وأسبوعياً، ولا يشغل
{
  const S = hired(); shops(S, 'riyadh')[0].cond = 40; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; const n0 = S.news.length; a(A.delegAdd(S, BR).ok); const e = S.player.diwan.tlog.find(x => x.kind === 'brief' && /الصافي/.test(x.text)); a(e, 'سُجّل');
  const L = E.hsLedger(S); a(e.text.includes(Math.abs(Math.round(L.net)).toLocaleString('en-US')), 'الرقم هو صافي الدفتر: ' + e.text); a(S.news.length > n0, 'خبر'); a.match(S.news[0].t, /^ناظر الديوان:/);
  const k = S.player.diwan.tlog.length; for (let i = 1; i <= 6; i++) { S.day += 1; S.player.diwan.dd = 0; E.delegDay(S); } a.equal(S.player.diwan.tlog.length, k, 'لا تقرير قبل أسبوع'); S.day += 1; S.player.diwan.dd = 0; E.delegDay(S); a(S.player.diwan.tlog.length > k, 'تقرير بعد أسبوع');
}
// 7) التجميد يوقف دون حذف، والاستئناف يعيد
{
  const S = hired(); const sh = shops(S, 'riyadh'); sh[0].cond = 90; a(A.delegAdd(S, SF({ type: 'standing', limits: { below: 55, pct: 5 } })).ok); a(A.delegFreeze(S, true).ok); a.equal(A.delegFreeze(S, true).ok, false); sh[0].cond = 40;
  for (let i = 1; i <= 3; i++) { S.day += 1; S.player.diwan.dd = 0; E.delegDay(S); } a.equal(sh[0].cond, 40, 'مجمَّد: لا ترميم'); a.equal(E.delegUsed(S), 1, 'المهمة باقية'); a.equal(E.delegView(S).frozen, true);
  a(A.delegFreeze(S, false).ok); S.day += 1; S.player.diwan.dd = 0; E.delegDay(S); a.equal(sh[0].cond, 90, 'استؤنف فرمّم'); a.equal(A.delegFreeze(S, false).ok, false);
}
// 8) التراجع: إطار عام لمحوّل يعكس فعله ≤ 3 أيام (محوّل تجريبي مسجَّل)
{
  const S = hired(); let reverted = 0; E.DELEG_KINDS.t1 = { id: 't1', name: 'تجريبي', types: ['once'], check: () => ({ ok: true }), norm: () => ({}), plan: () => ({ n: 1, text: 'x' }), run: (S0, t) => ({ done: true, did: 'فعلتُ تجريبياً', cost: 10, u: { x: 1 } }), undo: () => { reverted++; return { ok: true }; } };
  a(A.delegAdd(S, { kind: 't1', type: 'once', scope: '*', limits: {}, mode: 'exec' }).ok); const D = S.player.diwan, i = D.tlog.findIndex(x => x.kind === 't1' && x.u); a(i >= 0 && !D.tlog[i].irrev);
  S.day += 4; a.match(A.delegUndo(S, i).msg, /مضت مهلة التراجع/); S.day -= 4; a(A.delegUndo(S, i).ok); a.equal(reverted, 1); a.equal(A.delegUndo(S, i).ok, false); delete E.DELEG_KINDS.t1;
}
// 9) الأجر: +wageStep لكل خانة مستعملة (قياس لا ادعاء)، والتقرير لا يزيده
{
  const S = hired(), D = S.player.diwan; for (const sh of shops(S, 'riyadh')) sh.cond = 90; D.box = 1e6; S.player.wallet.sar = 1e6;
  const paid = k => { const b = D.box; D.wageDay = -1; E.diwanBegin(S); return b - D.box; }; near(paid(), E.DIWAN.wage, 'بلا مهام: الأجر الأساسي');
  a(A.delegAdd(S, SF({ type: 'standing', limits: { below: 55, pct: 5 } })).ok); a(A.delegAdd(S, SF({ type: 'standing', scope: 'jeddah', limits: { below: 55, pct: 5 } })).ok); a(A.delegAdd(S, BR).ok);
  near(paid(), E.DIWAN.wage + 2 * E.DELEG.wageStep, 'خانتان: +2 × wageStep'); near(E.delegView(S).wage, E.DIWAN.wage + 2 * E.DELEG.wageStep);
}
// 10) الأسئلة الستة تُجاب من بيانات فعلية وتنتهي بأزرار فعل
{
  const S = hired(); const sh = shops(S, 'riyadh'); sh[0].cond = 40; S.player.led.exp.upkeep = 9000; S.player.led.exp.rent = 5000; S.player.led.exp.staff = 7000; S.player.led.exp.purchases = 99999; S.player.led.inc.shops = 50000;
  for (const [q] of E.DELEG_QS) { const r = E.delegAsk(S, q); a(r && r.lines.length && r.acts.length, q); a(r.acts.some(x => x.kind === 'go'), q + ': تصرّف بنفسك'); }
  a.equal(E.DELEG_QS.length, 6); a.equal(E.delegAsk(S, 'nope'), null);
  const loss = E.delegAsk(S, 'loss'); a(loss.lines[1].includes('upkeep') && loss.lines[1].includes('9,000')); a(loss.lines[2].includes('rent') || loss.lines[2].includes('staff')); a(!loss.lines.some(l => l.includes('purchases')), 'المشتريات ليست خسارة'); a.equal(loss.lines.length, 4, 'عنوان + ثلاثة');
  const ng = E.delegAsk(S, 'neglect'); a(ng.lines.some(l => /دكاكين تحت 60: 1/.test(l)), ng.lines.join('|'));
  const sg = E.delegAsk(S, 'suggest'); a(sg.lines[0].includes('0 من 8')); a(sg.lines.some(l => l.includes('ترميم دائم') && l.includes('خانة 1 من 8'))); const add = sg.acts.find(x => x.kind === 'add' && x.spec.kind === 'shopfix'); a(add && !add.off); a(A.delegAdd(S, add.spec).ok); a.equal(E.delegUsed(S), 1, 'الزر المقترح يفوّض فعلاً');
  const st = E.delegAsk(S, 'status'); a(st.lines[0].startsWith('الصافي')); a.equal(E.delegAsk(S, 'rival').lines.length >= 1, true);
  for (let i = 0; i < 7; i++) A.delegAdd(S, SF({ type: 'standing', scope: 'jeddah', limits: { below: 55, pct: 5 } })); shops(S, 'riyadh')[1].cond = 40; a(E.delegAsk(S, 'suggest').acts.some(x => x.kind === 'add' && /ممتلئة/.test(x.off)), 'عند الامتلاء يظهر السبب على الزر');
  const nw = hired(); nw.news.unshift({ d: nw.day, t: 'قافلة وصلت إلى الرياض', k: '' }); a(E.delegAsk(nw, 'news').lines.some(l => l.includes('قافلة وصلت إلى الرياض')));
}
// 11) الحفظ القديم بلا ترحيل، وحفظ بمهام يعود كما هو، والمعطوب يُنقّى
{
  const S = hired(); a(!('tasks' in S.player.diwan) && !('tlog' in S.player.diwan) && !('frozen' in S.player.diwan), 'ناظر بلا tasks: لا حقول جديدة'); const raw = E.save(S); a(!/"tasks"|"tlog"|"frozen"/.test(raw), 'الحفظ القديم بلا حقول تفويض'); const L0 = E.load(raw); a.equal(E.delegUsed(L0), 0); a.equal(E.delegCap(L0), 8);
  shops(S, 'riyadh')[0].cond = 90; a(A.delegAdd(S, SF({ type: 'standing', limits: { below: 55, pct: 5 } })).ok); a(A.delegFreeze(S, true).ok); const L1 = E.load(E.save(S)); a.equal(E.delegUsed(L1), 1); a.equal(L1.player.diwan.frozen, true); a.equal(L1.player.diwan.tasks[0].limits.below, 55);
  const bad = JSON.parse(E.save(S)); bad.player.diwan.tasks = [{ id: 'x' }, null, { id: 5, type: 'zzz', kind: 'a', scope: '*', limits: {}, mode: 'exec', since: 0 }]; bad.player.diwan.tlog = 'x'; bad.player.diwan.frozen = 3; const L2 = E.load(JSON.stringify(bad)); a.equal(E.delegUsed(L2), 0); a(!('tasks' in L2.player.diwan) && !('tlog' in L2.player.diwan) && !('frozen' in L2.player.diwan));
}
// 12) DELEG.on=false = قبل: لا مهام ولا أجر زائد ولا حقول، ولا تفويض
{
  E.DELEG.on = false; try {
    const S = hired(); a.equal(E.delegCap(S), 0); a.equal(E.delegView(S).on, false); a.equal(A.delegAdd(S, BR).ok, false); a.equal(A.delegFreeze(S, true).ok, false);
    const D = S.player.diwan, b = D.box = 1e6; D.wageDay = -1; E.diwanBegin(S); near(b - D.box, E.DIWAN.wage); E.delegDay(S); a(!/"tasks"|"tlog"|"frozen"|"dd"/.test(E.save(S)), 'لا حقول جديدة في الحفظ');
  } finally { E.DELEG.on = true; }
}
console.log('OK   deleg: السعة 8→30 بالدرجة، الخانات والتقرير، المحوّلان (الترميم يطابق اليدوي)، ask/mine، التجميد والتراجع، الأجر +wageStep، الأسئلة الستة، الحفظ، والمطفأ = قبل');
