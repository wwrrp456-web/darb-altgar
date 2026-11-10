/* ---------- 035أ كفاءة الإدارة: الأساس ----------
   حقل sk لكل موظف: { g: الدرجة 1..3 (عمال) أو 1..5 (إداريون)، xp: نقاط النمو، home: التخصص الأصلي، spec: {تخصص: قوة 0..1}, m: معامل الأسبوع, wk: تقدم الأسبوع }.
   النمو يومياً: xp += m، حيث m ∈ [0.6, 1.6] من صافي نتيجة الأسبوع؛ والنتيجة السيئة تبطّئ فقط (m لا ينزل عن 0.6) ولا تُنزل الدرجة أبداً.
   SKILL.on=false يعيد السلوك السابق حرفياً (لا يُقرأ sk ولا يُكتب). كل حقل اختياري في الحفظ (التهجير يملؤه). لا قرار حظ: كل شيء حتمي. */
const SKILL = {
  on: true,
  grades: { w: ['مبتدئ', 'ماهر', 'خبير'], a: ['مبتدئ', 'متمرّس', 'ماهر', 'خبير', 'شيخ الصنعة'] },
  need: { w: [0, 40, 120], a: [0, 60, 150, 320, 700] },
  mMin: 0.6, mMax: 1.6, scale: 150, // m = 1 + 0.6·tanh(صافي اليوم/150) ثم يُقصّ إلى [mMin, mMax]
  shrinkCut: [0, 0.25, 0.5], // أمين المخزن: ما يخفضه من تلف المخزن غير المغطّى بحسب درجته (مبتدئ، ماهر، خبير)
  second: 0.3, learn: 0.005, // التخصص الثاني يبدأ 0.3 ويرتفع 0.5٪ من الفرق إلى 1 كل يوم عمل (مضروباً في m)
  specNames: { sale: 'البيع', store: 'المستودع والتوريد', farm: 'الزراعة والرعي', make: 'التصنيع', trade: 'التجارة والتنقل', sail: 'الملاحة', guard: 'الحراسة' },
  roleSpec: { seller: 'sale', keeper: 'store', farmer: 'farm' }, assetSpec: { shop: 'sale', warehouse: 'store', farm: 'farm', butcher: 'farm', factory: 'make' },
  next: { // ما تفتحه الدرجة التالية (للبطاقة؛ كله مربوط بشيفرة موجودة)
    seller: ['ينقل نقاط البيع إلى 1.25', 'ينقل نقاط البيع إلى 1.5'], keeper: ['يخفض تلف المخزن غير المغطّى 25٪', 'يخفض تلف المخزن غير المغطّى 50٪'], farmer: ['يرفع نقاط الزراعة إلى 1.25', 'يرفع نقاط الزراعة إلى 1.5'],
    mgr: ['يزيل هدر المواد (10٪) عن المصنع', 'يتقن الصنعة أكثر', 'يرفع جودة المصنع غير المحلي 3٪', 'أعلى درجة'], steward: ['', '', 'يتقن التدبير أكثر', 'يرفع جودة المصنع 3٪', 'أعلى درجة'] },
};
const skG = (kind) => (kind === 'w' ? SKILL.grades.w : SKILL.grades.a);
const skGradeOf = (kind, xp) => { const n = SKILL.need[kind]; let g = 1; for (let i = 1; i < n.length; i++) if (xp >= n[i]) g = i + 1; return g; };
const skNeedNext = (kind, g) => SKILL.need[kind][g] == null ? null : SKILL.need[kind][g];
const skClamp = (x, a, b) => Math.max(a, Math.min(b, x));
/* نوع الموظف: w عامل (3 درجات) أو a إداري (5 درجات) */
function skKind(e) { return e && (e.role === 'seller' || e.role === 'keeper' || e.role === 'farmer') ? 'w' : 'a'; }
/* الدرجة الفعلية؛ المفتاح مطفأ أو لا sk فالقديم حرفياً */
function skGrade(e) { return SKILL.on && e && e.sk ? e.sk.g : null; }
/* ما يقابل lv القديم لمدير الممتلك/المصنع/الأمين: مدير المصنع القديم 1/2/3 ← 1/3/4، مدير الممتلك ← 1، الأمين ← 3 */
function skLegacyG(m) { return m.rank === 3 ? 3 : m.rank === 2 ? 1 : ({ 1: 1, 2: 3, 3: 4 })[m.lv] || 1; }
const skMgrG = m => (SKILL.on && m && m.sk ? m.sk.g : skLegacyG(m));
/* آثار المدير على المصنع (13-factories): هدر 10٪ للمبتدئ فقط، وجودة +3٪ للخبير فأعلى (مضروبة في ملاءمة التخصص) */
function skMgrWaste(m) { if (!SKILL.on || !m || !m.sk) return m && m.lv === 1 ? 0.10 : 0; return m.sk.g === 1 ? 0.10 : 0; }
function skMgrQual(m) { if (!SKILL.on || !m || !m.sk) return m && m.lv === 3 ? 0.03 : 0; return m.sk.g >= 4 ? 0.03 * skFit(m, 'make') : 0; }
/* ملاءمة التخصص: للأصلي 1، ولغيره spec (يبدأ 0.3)؛ بلا spec = 1 */
function skFit(e, field) { const k = e && e.sk; if (!SKILL.on || !k || !field || !k.home || k.home === field) return 1; return skClamp((k.spec && k.spec[field]) != null ? k.spec[field] : SKILL.second, 0, 1); }
/* أمين المخزن: أعلى درجة بين أمناء المدينة غير المتأخرين تخفض تلف المخزن غير المغطّى */
function skKeeperCut(S, city) {
  if (!SKILL.on) return 0; let g = 0;
  for (const w of staffOf(S, city)) if (w.role === 'keeper' && !(w.late > 0) && w.sk) g = Math.max(g, w.sk.g);
  return g ? SKILL.shrinkCut[Math.min(g, 3) - 1] : 0;
}
function skMake(e, kind, g0, xp0, home) {
  const g = g0 || 1; e.sk = { g, xp: xp0 != null ? xp0 : SKILL.need[kind][g - 1], home: home || null, spec: {}, m: 1, wk: 0, since: 0 };
  e.sk.g = skGradeOf(kind, e.sk.xp); if (e.sk.g < g) e.sk.g = g; return e.sk;
}
function skHomeOfMgr(m) { return m.rank === 2 && m.asset ? SKILL.assetSpec[m.asset.kind] || null : m.rank === 3 ? null : 'make'; }
/* التهجير: يملأ sk لمن لا يملكه؛ لا ينقص أحد شيئاً (الدرجة المهجَّرة تعادل ما يفعله اليوم). آمن للتكرار */
function skillMigrate(S) {
  if (!SKILL.on || !S.player) return;
  const P = S.player, day = S.day || 0;
  const mk = (e, kind, g, xp, home) => { if (e && typeof e === 'object' && !(e.sk && Number.isSafeInteger(e.sk.g) && Number.isFinite(e.sk.xp))) { skMake(e, kind, g, xp, home); e.sk.since = day; } else if (e && e.sk) { e.sk.spec = e.sk.spec && typeof e.sk.spec === 'object' ? e.sk.spec : {}; if (!(e.sk.m > 0)) e.sk.m = 1; } };
  for (const pr of Object.values(P.props || {})) {
    for (const w of pr.staff || []) { const d = Number.isFinite(w.days) ? w.days : 0; mk(w, 'w', null, d, SKILL.roleSpec[w.role]); if (w.sk) w.sk.g = Math.max(w.sk.g, skGradeOf('w', w.sk.xp)); }
    const m = pr.mgr; if (m) { if (m.rank === 3) mk(m, 'a', 3, null, null); else if (m.rank === 2) mk(m, 'a', 1, Number.isFinite(m.days) ? m.days : 0, skHomeOfMgr(m)); else mk(m, 'a', skLegacyG(m), null, 'make'); }
    if (pr.farmBoss) mk(pr.farmBoss, 'a', 3, null, 'farm');
  }
  for (const k of ['chiefs', 'regAgents']) for (const e of Object.values(P[k] || {})) mk(e, 'a', 3, null, k === 'chiefs' ? 'farm' : null);
  mk(P.diwan, 'a', 3, null, null); mk(P.cchief, 'a', 3, null, 'trade'); mk(P.portm, 'a', 3, null, 'sail');
  for (const car of P.caravans || []) { const cp = car.captain; if (cp) mk(cp, 'a', skClamp(Math.round(((cp.trade || 1) + (cp.nav || 1) + (cp.combat || 1)) / 3), 1, 3), null, 'trade'); if (!car.gx) car.gx = { g: 1, xp: 0 }; if (!car.cx) car.cx = { g: 1, xp: 0 }; }
  for (const sh of P.ships || []) { const cp = sh.captain; if (cp) mk(cp, 'a', skClamp(Math.round(((cp.nav || 1) + (cp.combat || 1)) / 2), 1, 3), null, 'sail'); }
}
/* معامل نمو الأسبوع: من صافي نتيجة المدينة/المزرعة؛ بلا دفتر ربح m=1 */
function skM(net) { if (!Number.isFinite(net)) return 1; return skClamp(1 + 0.6 * Math.tanh(net / SKILL.scale), SKILL.mMin, SKILL.mMax); }
function skCityM(S, city) { const h = shopPnl(S, city, 7); return h ? skM(h.net) : 1; }
function skGrow(e, kind, m, S, field) {
  const k = e.sk; k.m = m; k.xp += m; k.wk = (k.wk || 0) + m; const g = skGradeOf(kind, k.xp); if (g > k.g) k.g = g; // لا تنزل الدرجة أبداً
  if (field && k.home && field !== k.home) { const cur = k.spec[field] != null ? k.spec[field] : SKILL.second; k.spec[field] = Math.min(1, cur + (1 - cur) * SKILL.learn * m); }
}
/* يُستدعى مرة كل يوم (20-finance) بعد mgrDay: ينمّي العمال والمديرين ويملأ الجدد. الإداريون الآخرون: أيام فقط الآن (m=1) */
function skillDay(S) {
  if (!SKILL.on || !S.player) return;
  const P = S.player;
  for (const city of Object.keys(P.props || {})) {
    const pr = P.props[city], mc = skCityM(S, city);
    for (const w of pr.staff || []) {
      if (!w.sk) skMake(w, 'w', null, Math.max(0, (Number.isFinite(w.days) ? w.days : 0) - 1), SKILL.roleSpec[w.role]); // الجديد يُنشأ بعد أن عدّ اليوم أيامه؛ فيطابق من هُجِّر قبل اليوم
      skGrow(w, 'w', w.role === 'farmer' ? 1 : mc, S, SKILL.roleSpec[w.role]);
    }
    const m = pr.mgr; if (m) {
      if (!m.sk) skMake(m, 'a', m.rank === 3 ? 3 : m.rank === 2 ? 1 : skLegacyG(m), m.rank === 2 ? Math.max(0, (m.days || 0) - 1) : null, skHomeOfMgr(m));
      if (m.rank === 2) { const f = m.asset ? SKILL.assetSpec[m.asset.kind] : null; skGrow(m, 'a', mc, S, f); }
      else if (m.rank === 3) { if (m.sk.g < 3) { m.sk.g = 3; m.sk.xp = Math.max(m.sk.xp, SKILL.need.a[2]); } m.sk.xp += (typeof sbOn === 'function' && sbOn('steward') ? mc : 1); /* 035ب: نمو الأمين بنتيجة مدينته */ const g = skGradeOf('a', m.sk.xp); if (g > m.sk.g) m.sk.g = g; }
      else { m.sk.g = Math.max(m.sk.g, skLegacyG(m)); m.sk.xp = Math.max(m.sk.xp, SKILL.need.a[m.sk.g - 1]); } // مدير المصنع القديم: درجته تتبع مستواه المشترى
    }
  }
  if (S.day % 7 === 0) for (const e of skAll(S)) if (e.sk) e.sk.wk = 0;
}
/* الترقية إلى أمين منطقة: ماهر فوراً (كما كان lv=2) فلا يمرّ يوم بدرجة أدنى */
function skPromoteSteward(m) { if (!SKILL.on || !m) return; if (!m.sk) skMake(m, 'a', 3, null, null); if (m.sk.g < 3) { m.sk.g = 3; m.sk.xp = Math.max(m.sk.xp, SKILL.need.a[2]); } m.sk.home = null; }
function skAll(S) { const P = S.player, out = []; for (const pr of Object.values(P.props || {})) { out.push(...(pr.staff || [])); if (pr.mgr) out.push(pr.mgr); } return out; }
/* ما يُعرض في البطاقة الموحّدة: يُحسب هنا لتبقى الواجهة بلا منطق */
function skillView(S, e, role) {
  if (!SKILL.on || !e || !e.sk) return null;
  const k = e.sk, kind = skKind(e) === 'w' ? 'w' : 'a', names = skG(kind), nxt = skNeedNext(kind, k.g), cur = SKILL.need[kind][k.g - 1];
  const top = nxt == null, frac = top ? 1 : skClamp((k.xp - cur) / (nxt - cur), 0, 1), daysLeft = top ? 0 : Math.ceil((nxt - k.xp) / Math.max(SKILL.mMin, k.m || 1));
  const why = (k.m || 1) >= 1.15 ? 'يتقدم أسرع لأن ربح عمله جيد هذه الأيام.' : (k.m || 1) <= 0.85 ? 'يتقدم ببطء لأن نتيجة عمله ضعيفة هذه الأيام؛ لا تنزل درجته.' : 'يتقدم بالمعدل المعتاد من أيام عمله.';
  const nk = e.role || (e.rank === 3 ? 'steward' : 'mgr'), nt = (SKILL.next[nk] || [])[k.g - 1] || '';
  return { role, grade: k.g, gradeName: names[k.g - 1], top, frac, daysLeft, why, nextName: top ? '' : names[k.g], next: nt, home: k.home, homeName: k.home ? SKILL.specNames[k.home] : 'بلا تخصص واحد', spec: Object.keys(k.spec || {}).map(f => ({ f, name: SKILL.specNames[f], v: k.spec[f] })), week: Math.round((k.wk || 0) * 10) / 10 };
}
