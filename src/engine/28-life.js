/* العمر والمراحل: لا أثر على عوالم الضغط غير المختارة لشخصية. */
const AGE_YEAR = 354, RETIRE_AGE = 95;
const STAGE_BONUS_MAX = LS.STAGE_BONUS_MAX, STAGE_GAP_MIN = LS.STAGE_GAP_MIN, STAGE_FOUND = LS.STAGE_FOUND, STAGE_FOUND_GAP = LS.STAGE_FOUND_GAP_DAYS / AGE_YEAR;
const AWAY_SEC_PER_DAY = 3, AWAY_MAX_HOURS = 8, AWAY_YIELD = 0.8, AWAY_RISK = 0.85;
const STAGES = LS.buildStages(BAB);
function ageOf(S) { const L = S.learn; return L && L.char ? (S.legacy && S.legacy.retired ? S.legacy.heirAge : 25 + Math.max(0, S.day) / AGE_YEAR + (L.ageOffset || 0)) : 25; }
function stageOf(S) {
  const L = S.learn; if (!L || !L.char || !L.ageStages || L.level > 10 || (S.legacy && S.legacy.retired)) return null;
  const current = STAGES[(L.stage || 1) - 1];
  return current && current.source === L.level ? current : STAGES.find(x => x.source === L.level) || null;
}
function stageStatus(S) {
  const L = S.learn, st = stageOf(S); if (!st) return null;
  const profit = Math.max(0, (L.ev.profit || 0) - (L.stageProfit0 || 0) - 3);
  const bonus = Math.min(STAGE_BONUS_MAX, Math.floor(profit / 10));
  const previous = L.lastStageAge == null ? 25 : L.lastStageAge;
  const required = st.n === 1 ? 25 : st.n <= STAGE_FOUND ? previous + STAGE_FOUND_GAP : Math.max(previous + STAGE_GAP_MIN, st.age - bonus);
  const days = Math.max(0, Math.ceil((required - ageOf(S)) * AGE_YEAR - 1e-7));
  return { stage: st.n, required, age: ageOf(S), bonus, days, waiting: days > 0 };
}
/* نقاط المعهد (قرار المالك): الدروس الأساسية (المراحل الـ22 كلها) تركّز على الخبرة؛ والدروس الجانبية التي تأتي أثناء اللعب (بطاقات المسائل، مجلس السوق، أسرار الدول والمدن، فصول الزعماء، ألواح الحكمة) تمنح نفوذاً وقدراً من الخبرة.
   الجانبية تُشتق من حالة اللاعب (ما رآه فعلاً)، فلا منح مكرر ولا ترحيل يدوي؛ والأساسية تُسجَّل في taken. المحفوظ: ما صُرف فقط. (docs/CODEX_LESSONS_V2.md) */
/* القسمة: لكل نوع حصة كلية ثابتة تُقسَّم على عدد دروسه، فلا تتضخم النقاط بإضافة دروس جديدة. الأساسية 22 مرحلة (خبرة)، والجانبية تُحصى من المحتوى. */
const POOL = { core: { xp: 1320, infl: 220 }, side: { infl: 2400, xp: 700 } };
const SIDE_EVENTS = ['broker', 'friend:secure', 'friend:worker', 'friend:emotion', 'luck']; // أحداث السوق التي تُحتسب دروساً جانبية بعد أن يقرّر اللاعب فيها
const sideTotal = () => CARDS.LIST.length + FIQH.CASES.length + Object.keys(LS.SECRETS || {}).length + Object.keys(LORE.CITY_SECRETS || {}).length + Object.keys(BAB.TABLETS || {}).length + 3 * CITY_DEFS.length + SIDE_EVENTS.length;
function lessonValues() { const c = STAGES.length, s = Math.max(1, sideTotal()); return { core: { xp: POOL.core.xp / c, infl: POOL.core.infl / c }, side: { infl: POOL.side.infl / s, xp: POOL.side.xp / s }, coreCount: c, sideCount: s }; }
const FTA = { infl: 3, xp: 2 }; // مكافأة صغيرة لكل سؤال أُجيب صحيحاً من أول مرة (مرة واحدة لكل سؤال)
function firstTry(S, key) { const L = S.learn; if (!L || !L.char) return false; L.fta = L.fta || {}; if (L.fta[key]) return false; L.fta[key] = 1; return true; }
function lessonPts(L) { if (!L.pts) L.pts = { spent: { infl: 0, xp: 0 }, v: 3 }; if (!L.pts.spent) L.pts.spent = { infl: 0, xp: 0 }; return L.pts; }
function awardLesson(S, n) {
  const L = S.learn; if (!L || !L.char) return false; if (!Array.isArray(L.taken)) L.taken = []; if (!L.perks) L.perks = {};
  if (L.taken.includes(n)) return false; L.taken.push(n); return true;
}
function sideCount(S) {
  const L = S.learn; if (!L || !L.char) return 0; let n = 0;
  n += (L.cards || []).length + Object.keys((L.mj && L.mj.seen) || {}).length + (L.secrets || []).length + (L.csec || []).length + (L.tab || []).length + SIDE_EVENTS.filter(k => (L.evDone || {})[k]).length;
  for (const id in S.bosses || {}) n += Math.min(3, Math.max(0, (S.bosses[id].lore | 0)));
  return n;
}
function pointsEarned(S) {
  const L = S.learn, core = (L.taken || []).length, side = sideCount(S), v = lessonValues(), fta = Object.keys(L.fta || {}).length;
  return { infl: Math.round(core * v.core.infl + side * v.side.infl + fta * FTA.infl), xp: Math.round(core * v.core.xp + side * v.side.xp + fta * FTA.xp), core, side, fta };
}
const pointsLeft = (S, k) => { const p = lessonPts(S.learn); return Math.max(0, pointsEarned(S)[k] - p.spent[k]); };
/* شجرة المزايا: النفوذ عملة تُصرف (150/300/600 للمستويات الثلاثة)، والخبرة تتراكم فترفع الرتبة (كل 300 خبرة رتبة حتى 7). مفاتيح المزايا هي ما يقرؤه المحرك عبر perkMul. */
const PERK_COST = [150, 300, 600], XP_PER_RANK = 300, RANK_MAX = 7;
const PERK_TREE = [
  { id: 'customs', name: 'جمارك أقل', f: [0.95, 0.9, 0.85], t: ['5٪', '10٪', '15٪'] },
  { id: 'fxFee', name: 'رسم صرف أقل', f: [0.9, 0.8, 0.7], t: ['10٪', '20٪', '30٪'] },
  { id: 'prov', name: 'نفقة طريق أرخص', f: [0.95, 0.9, 0.85], t: ['5٪', '10٪', '15٪'] },
  { id: 'pact', name: 'عقود شراكة أرخص', f: [0.95, 0.9, 0.85], t: ['5٪', '10٪', '15٪'] },
  { id: 'banditLoss', name: 'خسائر نهب أقل', f: [0.9, 0.8, 0.7], t: ['10٪', '20٪', '30٪'] },
  { id: 'speed', name: 'قوافل أسرع', f: [1.03, 1.06, 1.09], t: ['3٪', '6٪', '9٪'] },
];
const perkTier = (S, id) => ((S.learn && S.learn.pk) || {})[id] | 0;
const traderRank = S => Math.min(RANK_MAX, Math.floor(pointsEarned(S).xp / XP_PER_RANK));
/* خانات الرتبة: الدكاكين في المدينة الواحدة وأسطول القوافل يتسعان بالخبرة. تسري في وضع التعلّم فقط، ولا تسحب ما يملكه اللاعب فعلاً */
const SLOT_SHOPS = [1, 2, 3, 3, 4, 5, 6, 99], SLOT_FLEET = [2, 2, 3, 3, 4, 5, 6, 6];
function rankSlots(S) { const L = S.learn; if (S.noLock || !L || !L.char) return { on: false, shops: 99, fleet: 6, rank: RANK_MAX }; const r = traderRank(S); return { on: true, rank: r, shops: SLOT_SHOPS[r], fleet: SLOT_FLEET[r] }; }
function applyPerkTree(S) { const L = S.learn; if (!L || !L.pk || !L.perks) return; PERK_TREE.forEach(p => { const t = L.pk[p.id] | 0; if (t > 0) L.perks[p.id] = (L.perks[p.id] || 1) * p.f[t - 1]; }); }
function pointsMigrate(S) {
  const L = S.learn; if (!L || !L.char) return; const p = lessonPts(L); if (!Array.isArray(L.taken)) L.taken = []; if (!L.perks) L.perks = {};
  (L.stageDone || []).forEach(n => awardLesson(S, n));
  delete p.infl; delete p.xp; p.v = 3; // نسخ سابقة خزّنت المجموع؛ صار يُحسب من الحالة، ويبقى ما صُرف
}
function stageCheck(S, silent) {
  const L = S.learn; if (!L || !L.char) return;
  if (!silent) { loreCheck(S); tabletCheck(S); wishCheck(S); if (S.player.gold < 60 && !hasCargo(S)) learnReact(S, 'broke', 20); }
  if (!L.abroad && L.level >= 4 && homeStatus(S).met) { L.abroad = true; if (!silent) news(S, 'فُتح السفر إلى الدولة المجاورة', 'good'); }
  const st = stageOf(S); if (!st) return;
  // قارئ الحفظ وأدوات الاختبار القديمة يسجلان أول درس للمفهوم في intro.
  if (STAGES.find(x => x.source === st.source).n === st.n && L.intro >= st.source) L.stageIntro = Math.max(L.stageIntro || 0, st.n);
  L.stage = st.n; L.rest = null; const status = stageStatus(S);
  if (status.waiting || (st.n > 1 && (L.stageIntro || 0) < st.n) || !st.goals(S).every(g => g[1])) return;
  L.stageDone = L.stageDone || []; if (L.stageDone.includes(st.n)) return;
  L.stageDone.push(st.n); awardLesson(S, st.n); L.done = st.n; L.doneDay = S.day; L.lastStageAge = ageOf(S);
  if (!silent) { S.player.gold += st.reward; packReward(S, st.reward / 50); (L.stageUp || (L.stageUp = [])).push(st.n); if (st.n <= 6) L.up.push(st.source); news(S, 'أتممتَ مرحلة «' + st.title + '»', 'good'); S.pause = true; }
  L.stage = st.n + 1; const next = STAGES[L.stage - 1]; L.level = next ? next.source : 11;
  L.stageProfit0 = L.ev.profit || 0; L.stageStartDay = S.day;
}
function lifeMigrate(S) {
  const L = S.learn; if (!L || !L.char) return;
  if (!L.ageStages) {
    const stage = STAGES.find(x => x.source === L.level);
    L.ageStages = 1; L.stage = stage ? stage.n : STAGES.length + 1;
    L.stageDone = STAGES.filter(x => x.source < L.level).map(x => x.n);
    L.done = L.stage - 1; L.doneDay = S.day; L.stageIntro = (L.intro >= L.level ? L.stage : L.stage - 1); L.stageUp = [];
    L.ageOffset = Math.min(92, 25 + S.day / AGE_YEAR) - (25 + S.day / AGE_YEAR);
    L.stageProfit0 = (L.ev && L.ev.profit) || 0; L.rest = null;
    // لا إعادة منح أي مكافأة سبق تحصيلها.
  }
  pointsMigrate(S);
  if (S.away && !Number.isFinite(S.away.t)) delete S.away;
  const j = S.awayJob, cap = AWAY_MAX_HOURS * 3600 / AWAY_SEC_PER_DAY;
  if (j && (!Number.isInteger(j.wanted) || j.wanted < 1 || j.wanted > cap || !Number.isInteger(j.remaining) || j.remaining < 0 || j.remaining > j.wanted || !Number.isFinite(j.first) || j.first > S.day || !Number.isFinite(j.before))) delete S.awayJob;
  agingMigrate(S);
}
function lifeDay(S) { agingDay(S); }
function setCaptainAuto(S, enabled) {
  if (!S.learn || !S.learn.char) return NO('اختر شخصيتك أولاً');
  if (enabled && !S.player.caravans.some(c => c.captain && c.route)) return NO('عيّن قائداً وحدد له مساراً أولاً');
  S.captainAuto = !!enabled; if (!enabled) delete S.away;
  return OK(enabled ? 'يعمل القادة على مساراتهم بالسرعة العادية' : 'توقف التشغيل التلقائي');
}
function awayStart(S, now) { if (S.captainAuto && S.learn && S.learn.char && !S.awayJob) { if (!S.away) S.away = { t: now == null ? Date.now() : now }; } }
function awayBegin(S, now) {
  if (S.awayJob) return S.awayJob;
  const mark = S.away; delete S.away;
  if (!mark || !Number.isFinite(mark.t) || !S.captainAuto || !S.learn || !S.learn.char) return null;
  const elapsed = Math.max(0, Math.min(AWAY_MAX_HOURS * 3600000, (now == null ? Date.now() : now) - mark.t));
  const wanted = Math.floor(elapsed / (AWAY_SEC_PER_DAY * 1000)); if (!wanted) return null;
  delete S.awayReport;
  return S.awayJob = { wanted, remaining: wanted, first: S.day, before: liquid(S), inc0: Object.assign({}, S.player.led.inc), exp0: Object.assign({}, S.player.led.exp) };
}
/* تقرير الغياب: أعمالك أولاً (دخل ومصروف بالبنود وسلع نفد مخزونها)، وأخبار العالم مطويّة. */
function awayReportOf(S, job) {
  const P = S.player, diff = (a, b) => Object.entries(a || {}).map(([k, v]) => [k, Math.round(v - ((b || {})[k] || 0))]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).slice(0, 6), empty = [];
  for (const city in P.props) { const pr = P.props[city]; for (const sh of pr.shops || []) for (const it of sh.items) if ((pr.store[it.g] || 0) < 1) empty.push({ city, g: it.g }); }
  return { days: S.day - job.first, change: liquid(S) - job.before, inc: diff(P.led.inc, job.inc0), exp: diff(P.led.exp, job.exp0), empty: empty.slice(0, 8), mgr: (P.mgrActions || []).filter(a => a.d > job.first).slice(0, 8), cash: Math.round(P.gold), reserve: Math.round(operatingReserve(S)), events: (S.news || []).filter(n => n.d > job.first).slice(0, 12).map(n => n.t) };
}
function awayAdvance(S, limit) {
  const job = S.awayJob; if (!job) return true; if (S.life && S.life.pending) return false; delete job.paused;
  S.awaySim = true;
  try { for (let n = 0; n < Math.min(1000, Math.max(1, limit || 25)) && job.remaining > 0; n++) {
    tick(S); job.remaining--; if (S.life && S.life.pending) { job.paused = true; break; } if (S.road) { job.remaining = 0; break; }
  } } finally { delete S.awaySim; }
  if (job.remaining > 0) return false;
  S.awayReport = awayReportOf(S, job);
  S.lastAway = JSON.parse(JSON.stringify(S.awayReport)); S.lastAway.day = S.day;
  delete S.awayJob; return true;
}
function awayResume(S, now) {
  if (!awayBegin(S, now)) return null;
  while (S.awayJob) { awayAdvance(S, 500); if (S.life && S.life.pending) break; }
  return S.awayReport;
}

/* نسخ جديدة للأعمار؛ الأصول الأصلية لا تُستبدل. */
const BOSS_ELDER_AGE = 85;
function charArtStage(S) { if (S.legacy && S.legacy.retired) return '_heir'; const a = ageOf(S); return a >= 70 ? '_old' : a >= 40 ? '_mid' : ''; }
function bossArtStage(S) { return S.legacy && S.legacy.retired ? '_heir' : ageOf(S) >= BOSS_ELDER_AGE ? '_old' : ''; }
function mentorOf(S) {
  const son = S && ((S.life && S.life.mentorSon) || (S.legacy && S.legacy.retired));
  return son ? { id: 'mentor2', name: 'عبد الله بن سالم', role: 'المرشد', img: 'hero/mentor2', tone: 'وقور' } : LS.MENTOR;
}
