// وكيل الإقليم: تقرير أسبوعي وحد موحّد وإنذار مبكر: node test/regional-agent.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 4; S.player.gold = 500000; S.noShocks = true;
const cities = ['riyadh', 'jeddah']; for (const c of cities) { A.buildShop(S, c); const pr = S.player.props[c]; pr.mgr = { id: S.nextId++, rank: 3, lv: 2, wage: 20, days: 100, policy: { pay: true, report: false, restock: false, pricing: false, limit: 0, every: 'daily' } }; }
a(E.stewardCitiesIn(S, 'sa').length === 2, 'أمينان');
const one = E.newGame(5); one.phase = 4; one.player.gold = 9e5; a(!A.hireAgent(one, 'sa').ok, 'يلزم أمينان');
a(!A.hireAgent(Object.assign(E.load(E.save(S)), { phase: 3 }), 'sa').ok, 'الطور 4');
const g0 = S.player.gold; a(A.hireAgent(S, 'sa').ok && g0 - S.player.gold === E.RA.fee, 'توظيف برسمه'); a(!A.hireAgent(S, 'sa').ok, 'لا تكرار');
const ra = E.agentOf(S, 'sa'); a(A.agentPolicy(S, 'sa', 1000, false).ok && ra.pool === 1000);
const l = c => S.player.props[c].mgr.policy.limit; const sum = l('riyadh') + l('jeddah'); a(sum > 0 && sum <= 1000 * E.RA.probationShare + 0.01, 'نصف الحد في فترة الاختبار: ' + sum);
const wage = E.agentWage(S, 'sa'); a(wage >= 2 * 1, 'أجر الوكيل ضعف أجر الأمين');
// خسارة ثلاثة أسابيع وغضب الزعيم
for (const c of cities) S.player.props[c].hist = Array.from({ length: 7 }, () => ({ rev: 10, net: -50 }));
S.bosses.riyadh.trust = -60;
const p0 = S.player.gold; for (let i = 0; i < 7 * E.RA.negWeeks + 1; i++) { S.day++; E.agentBegin(S); }
a(S.player.gold < p0, 'أجره اليومي يُدفع'); a(ra.mail.some(m => m.type === 'report'), 'تقرير أسبوعي'); a(ra.mail.some(m => m.type === 'warn' && /تخسر/.test(m.text)), 'إنذار الخسارة'); a(ra.mail.some(m => /غاضب/.test(m.text)), 'إنذار غضب الزعيم');
a(ra.mail.length <= E.RA.mailMax, 'سقف الرسائل');
a(A.agentSeen(S, ra.mail[0].id).ok);
// محفظة الدولار في دولة أجنبية
const T = E.newGame(5); A.learnSetChar(T, 'trader'); T.noLock = 1; T.phase = 4; T.player.gold = 5e5; T.player.wallet.sar = 5e5; T.player.wallet.usd = 0;
for (const c of ['cairo', 'alex']) { A.buildShop(T, c); T.player.props[c].mgr = { id: T.nextId++, rank: 3, lv: 2, wage: 20, days: 100, policy: { pay: true, report: false, restock: false, pricing: false, limit: 0, every: 'daily' } }; }
a(A.hireAgent(T, 'eg').ok); a(A.agentPolicy(T, 'eg', 5000, true).ok && E.agentOf(T, 'eg').usd); T.day++; E.agentBegin(T); a(T.player.wallet.usd > 0, 'عُبّئت محفظة الدولار');
a(!A.agentPolicy(S, 'sa', 100, true).ok === false && E.agentOf(S, 'sa').usd === false, 'لا دولار في السعودية');
// ترك العمل بتأخر الأجر أو بفقد الأمناء
S.player.wallet.sar = 0; for (let i = 0; i < E.RA.lateQuit + 1; i++) { S.day++; E.agentBegin(S); } a(!E.agentOf(S, 'sa'), 'يترك العمل لتأخر أجره');
delete T.player.props.cairo.mgr; T.day++; E.agentBegin(T); a(!E.agentOf(T, 'eg'), 'يترك العمل إذا نقص الأمناء');
a(E.load(E.save(S)).player.regAgents !== null, 'الحفظ');
console.log('PASS regional agent');
