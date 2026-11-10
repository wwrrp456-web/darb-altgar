/* ---------- 035ب كفاءة الإدارة: الدكاكين والمستودع والأمين ----------
   قدرات بالدرجة: تدقيق التسعير (مدير الممتلك والأمين)، وعتبات الأمين (تدوير، راكد، حد يومي) مع مراعاة الموسم وتفسير السبب؛
   سجل الحاجات «طلب واحد لكل احتياج»؛ وضعا الدكان (اقترح عليّ الافتراضي / تصرّف ضمن حدودي) وميزانية تعليمية؛ تجربة رف واحد 14 يوم تشغيل مؤهل؛ واقتراح التوظيف اللطيف مرة واحدة.
   SKILLB.on=false (أو أي مفتاح قدرة) يعيد السلوك السابق حرفياً. كل حقل اختياري في الحفظ. لا قرار حظ، ولا تجاوز للميزانية، ولا بيع أصل، ولا حكم شرعي. */
const SKILLB = {
  on: true, caps: { price: true, steward: true, ledger: true, trial: true, hint: true },
  steward: { idleShop: [21, 17, 14, 10, 7], idleStore: [45, 37, 30, 21, 14], dayQty: [20, 30, 40, 60, 80], gap: [14, 10, 7, 7, 7] }, // الدرجة 3 (ماهر) = قيم 017 الحالية حرفياً
  price: { step: [0.05, 0.05, 0.05, 0.04, 0.03], min: [1.1, 1.1, 1.1, 1.05, 1.05] },
  trial: { days: 14, lock: 14, units: 20, share: 0.2, maxOpen: 1, base: 3 }, // يوم تشغيل مؤهل، وسقف وحدات التجربة، وحصة ميزانية التجربة من الفائض فوق الاحتياطي
  seasonAhead: 14, hire: { assets: 3 },
};
const sbOn = k => !!(SKILLB.on && SKILL.on && SKILLB.caps[k] !== false);
const sbGrade = m => (m && m.sk ? m.sk.g : 3);
const sbIdx = m => Math.max(0, Math.min(4, sbGrade(m) - 1));
const sbIdleShop = m => (sbOn('steward') ? SKILLB.steward.idleShop[sbIdx(m)] : STEWARD_SMART.idleShop);
const sbIdleStore = m => (sbOn('steward') ? SKILLB.steward.idleStore[sbIdx(m)] : STEWARD_SMART.idleStore);
const sbDayQty = m => (sbOn('steward') ? SKILLB.steward.dayQty[sbIdx(m)] : STEWARD_SMART.dayQty);
const sbRotateGap = m => (sbOn('trial') ? SKILLB.trial.lock : sbOn('steward') ? SKILLB.steward.gap[sbIdx(m)] : STEWARD_SMART.rotateWeek);
function sbPrice(m, step, min) { if (!sbOn('price') || !m) return { step, min }; const i = sbIdx(m); return { step: SKILLB.price.step[i], min: SKILLB.price.min[i] }; }
/* الموسم القريب لسلعة في مدينة (الأمين الماهر فأعلى يراعيه فلا يدوّر سلعة موسمها على الأبواب) */
function sbSeasonHold(S, c, g, m) {
  if (!sbOn('steward') || sbGrade(m) < 3 || typeof seasonsOn !== 'function' || !seasonsOn(S)) return null;
  for (let i = 1; i <= SKILLB.seasonAhead; i++) { // القادم فقط: الراكد في موسمه القائم ليس سبباً للإبقاء (سعره هو المشكلة)
    const now = seasonsAt(S, S.day + i), prev = i ? seasonsAt(S, S.day + i - 1) : [];
    for (const k of now) { if (i && prev.includes(k)) continue; const X = SEASONS[k]; if (X && X.goods && X.goods.includes(g) && X.where && X.where(c) && X.mul > 1) return { k, name: X.name, days: i }; }
  }
  return null;
}
/* ---- سجل الحاجات: P.needs [{id, kind, city, g, shopId, state: open|reserved|done|void, src, day, qty, cost, why}] ---- */
const sbNeeds = S => (S.player.needs = Array.isArray(S.player.needs) ? S.player.needs : []);
function sbNeedAdd(S, o) { const L = sbNeeds(S); const n = Object.assign({ id: S.nextId++, state: 'open', day: S.day, qty: 0, cost: 0 }, o); L.unshift(n); if (L.length > 60) L.length = 60; return n; }
function sbNeedFind(S, city, g, kind) { return sbNeeds(S).find(n => n.city === city && n.g === g && n.kind === kind && n.day === S.day && (n.state === 'reserved' || n.state === 'done')); }
/* طلب التعبئة: لا تُشترى الحاجة نفسها من مصدرين في اليوم نفسه (حالة done/reserved تمنع)، ويُعدّ المحجوز ولا تُعدّ الكمية مرتين */
function sbRestockBegin(S, city, g, src, force) {
  if (!sbOn('ledger')) return null;
  const ex = sbNeedFind(S, city, g, 'stock'); if (ex && ex.src !== src && !force) return { skip: true, by: ex.src };
  if (ex && ex.src === src && ex.state === 'reserved') return { skip: true, by: src };
  return { need: sbNeedAdd(S, { kind: 'stock', city, g, src, state: 'reserved' }) };
}
function sbRestockEnd(S, h, r) { if (!h || !h.need) return; if (!(r.n > 0)) { const L = sbNeeds(S), i = L.indexOf(h.need); if (i >= 0) L.splice(i, 1); return; } h.need.state = 'done'; h.need.qty = Math.round(r.n * 100) / 100; h.need.cost = Math.round(r.cost * 100) / 100; }
/* ---- الميزانية التعليمية: احتياطي = مستحقات 14 يوماً لا يمسّه الموظف؛ والباقي يُقسَّم تعبئةً وتجربةً باقتراح مشروح ---- */
function sbBudget(S, city) {
  const P = S.player, pr = P.props[city], reserve = Math.round(operatingReserve(S)), spend = Math.max(0, Math.round(P.gold - reserve));
  const suggestTrial = Math.round(Math.min(spend * SKILLB.trial.share, 2000)), set = pr && pr.budget && Number.isFinite(pr.budget.trial) ? pr.budget : null;
  const trial = set ? Math.max(0, Math.min(set.trial, spend)) : suggestTrial, fill = Math.max(0, spend - trial);
  const days = (P.fixedEma || 0) > 0 ? Math.round(reserve / P.fixedEma) : 0;
  return { reserve, spend, fill, trial, suggestTrial, accepted: !!set, days, why: `الاحتياطي ${reserve} ريال يغطي مستحقات ${SKILLB_RESERVE} يوماً فلا يُصرف. من الباقي (${spend}) أقترح ${suggestTrial} لتجربة رف واحد، والبقية للتعبئة.` };
}
const SKILLB_RESERVE = 14;
/* ---- وضعا الدكان ---- */
const sbMode = (sh, m) => (sh && (sh.mode === 'act' || sh.mode === 'suggest') ? sh.mode : (m && m.policy && m.policy.rotate ? 'act' : 'suggest'));
/* بديل الرف الراكد: المنطق نفسه الذي يستعمله التدوير (سلعة في المخزن بكمية كافية غير معروضة ومطلوبة) */
function sbAlt(S, city, pr, c, old) {
  const pool = GIDS.filter(g => g !== old.g && Object.hasOwn(pr.store, g) && (pr.store[g] || 0) >= STEWARD_SMART.rotateMin && !stewardShown(pr, g) && sells(c, g) && !GD[g].sp && !GD[g].live && !Object.hasOwn(BREED, g));
  return pool.sort((a, b) => c.dem[b] * unitPrice(c, b) - c.dem[a] * unitPrice(c, a) || GIDS.indexOf(a) - GIDS.indexOf(b))[0] || null;
}
function sbTrialCost(S, c, pr, g) { return Math.round(SKILLB.trial.units * unitPrice(c, g)); }
/* بدء تجربة رف: يبدّل الصنف الراكد بالبديل برسم أولي صغير (target=وحدات التجربة)، ويحفظ القديم كاملاً للرجوع؛ والبضاعة القديمة تبقى في المخزن */
function sbTrialStart(S, city, sh, old, g, how) {
  const r = A.shopSetItem(S, city, sh.id, g, SHOP_PRICE0, true); const i = sh.items.indexOf(old);
  if (!r.ok) return r;
  sh.items.splice(i, 1); const it = sh.items.find(x => x.g === g); if (it) { sh.items.splice(sh.items.indexOf(it), 1); sh.items.splice(Math.min(i, sh.items.length), 0, it); it.target = SKILLB.trial.units; it.pw = []; }
  const base = (old.pw || []).slice(-14), bn = base.length, units = (old.pu || []).slice(-14);
  sh.trial = { from: old.g, old: JSON.parse(JSON.stringify(old)), to: g, start: S.day, q: 0, net: 0, units: 0, skipped: { stock: 0, seller: 0 }, base: bn >= SKILLB.trial.base ? base.reduce((a, x) => a + x, 0) / bn : 0, baseUnits: units.length ? units.reduce((a, x) => a + x, 0) / units.length : 0, how: how || 'act', state: 'run' };
  sh.rotatedDay = S.day; return OK('بدأت تجربة ' + GD[g].name + ' بدل ' + GD[old.g].name);
}
/* التدوير بالدرجة والموسم والوضع والتجربة (يحلّ محل stewardRotate القديم حين تُفعَّل التجربة) */
function sbRotate(S, city, pr, m, w, said) {
  const c = S.cities[city], cfg = SKILLB.trial;
  for (const sh of pr.shops) {
    if (!stewardCovers(S, city, { kind: 'shop', id: sh.id })) continue;
    if (sh.trial && sh.trial.state === 'run') continue;
    if (Number.isSafeInteger(sh.trialLock) && S.day < sh.trialLock) continue;
    if (Number.isSafeInteger(sh.rotatedDay) && S.day - sh.rotatedDay < sbRotateGap(m)) continue;
    const old = sh.items.find(it => (it.idleDays || 0) >= sbIdleShop(m)); if (!old) continue;
    // نفاد المخزون أو غياب البائع لا يُعدّ ركوداً: الراكد هو ما كان متوفراً ومعه بائع
    if ((pr.store[old.g] || 0) < 1 || sellerPts(S, city) <= 0) continue;
    const hold = sbSeasonHold(S, c, old.g, m);
    if (hold) { m.holdSaid = m.holdSaid || {}; if (!(S.day - (m.holdSaid[old.g] || -99) < 7)) { m.holdSaid[old.g] = S.day; const txt = 'لم أدوّر ' + GD[old.g].name + ' لأن ' + hold.name + (' بعد ' + hold.days + ' يوماً'); said.push(txt); stewardLog(S, city, { kind: 'hold', amount: 0, g: old.g, why: txt }); } continue; }
    const g = sbAlt(S, city, pr, c, old); if (!g) continue;
    const cost = sbTrialCost(S, c, pr, g), B = sbBudget(S, city);
    const mode = sbMode(sh, m);
    if (cost > B.trial || cost > Math.max(0, S.player.gold - B.reserve)) { if (!(sh.noBudgetDay && S.day - sh.noBudgetDay < 7)) { sh.noBudgetDay = S.day; stewardLog(S, city, { kind: 'hold', amount: 0, g, why: 'أجّلتُ تجربة ' + GD[g].name + ' لأن ميزانية التجربة (' + B.trial + ') لا تكفي ' + cost + ' ولا أمس احتياطي المستحقات' }); } continue; }
    const why = GD[old.g].name + ' لم تُبَع ' + (old.idleDays || 0) + ' يوماً رغم أن عندنا منها ومعنا بائع؛ أقترح تجربة ' + GD[g].name + ' برف صغير (' + cfg.units + ' وحدة ≈ ' + cost + ' ريال) ' + cfg.days + ' يوم تشغيل، فإن لم تنجح أعدنا ' + GD[old.g].name;
    if (mode === 'suggest') {
      if (sbNeeds(S).some(n => n.kind === 'trial' && n.state === 'open' && n.city === city && n.shopId === sh.id)) continue;
      sbNeedAdd(S, { kind: 'trial', city, shopId: sh.id, g, from: old.g, cost, why, src: 'steward' }); said.push('اقترحتُ تجربة ' + GD[g].name + ' بدل ' + GD[old.g].name);
      stewardLog(S, city, { kind: 'propose', amount: 0, g, from: old.g, why: 'اقترحتُ: ' + why }); continue;
    }
    const r = sbTrialStart(S, city, sh, old, g, 'act'); if (!r.ok) continue;
    w.rotated++; said.push('جرّبتُ ' + GD[g].name + ' بدل ' + GD[old.g].name);
    stewardLog(S, city, { kind: 'rotate', amount: 0, g, from: old.g, why: 'جرّبتُ ' + GD[g].name + ' بدل ' + GD[old.g].name + ' (لم تُبَع ' + (old.idleDays || 0) + ' يوماً)؛ أقيّمها بعد ' + cfg.days + ' يوم تشغيل' });
  }
}
/* تسجيل يوم الصنف: الأيام المؤهلة فقط (مخزون وبائع)؛ وتُجمَّع نتائج التجربة */
function sbDay(S, sh, it, units, have0, price, tr, pr, g, sf) {
  if (!sbOn('trial')) return;
  const qual = have0 >= 1 && sf > 0, unitNet = price * (1 - tr) - (avgCost(pr.basis, g) || 0), profit = units * unitNet;
  if (qual) { it.pw = (it.pw || []).concat(profit).slice(-14); it.pu = (it.pu || []).concat(units).slice(-14); }
  const t = sh.trial; if (t && t.state === 'run' && t.to === g) { if (qual) { t.q++; t.net += profit; t.units += units; } else if (have0 < 1) t.skipped.stock++; else t.skipped.seller++; }
}
/* نهاية اليوم للدكان: تقييم التجربة حين تكتمل أيامها المؤهلة */
function sbShopDay(S, city, pr) {
  if (!sbOn('trial')) return;
  for (const sh of pr.shops) {
    const t = sh.trial; if (!t || t.state !== 'run' || t.q < SKILLB.trial.days) continue;
    const avg = t.net / t.q, uavg = t.units / t.q, win = avg >= t.base - 1e-9 || (t.baseUnits > 0 && uavg >= 1.5 * t.baseUnits);
    const nm = GD[t.to].name, om = GD[t.from].name, ex = t.skipped.stock + t.skipped.seller;
    const exs = ex ? ' (استُبعد ' + ex + ' يوماً غير مؤهل: ' + (t.skipped.stock ? t.skipped.stock + ' بلا مخزون' : '') + (t.skipped.stock && t.skipped.seller ? '، ' : '') + (t.skipped.seller ? t.skipped.seller + ' بلا بائع' : '') + ')' : '';
    const it = sh.items.find(x => x.g === t.to);
    if (win) { t.state = 'ok'; if (it) it.target = 60; sh.trialLock = S.day + SKILLB.trial.lock; stewardLog(S, city, { kind: 'trialEnd', amount: 0, g: t.to, why: 'نجحت تجربة ' + nm + ': ربح اليوم ' + Math.round(avg) + ' مقابل ' + Math.round(t.base) + ' للقديمة' + exs + '؛ أبقيتُها' }); news(S, 'نجحت تجربة ' + nm + ' في ' + S.cities[city].name + ' فأُبقيت.'); }
    else {
      t.state = 'failed'; sh.trialLock = S.day + SKILLB.trial.lock; const i = sh.items.findIndex(x => x.g === t.to);
      if (i >= 0) { sh.items.splice(i, 1); const old = t.old; old.idleDays = 0; old.lastSold = 0; sh.items.splice(Math.min(i, sh.items.length), 0, old); }
      stewardLog(S, city, { kind: 'trialEnd', amount: 0, g: t.from, why: 'لم تنجح تجربة ' + nm + ' (ربح اليوم ' + Math.round(avg) + ' مقابل ' + Math.round(t.base) + ')' + exs + '؛ أرجعتُ ' + om + ' ولم أُنقص بضاعتك' }); news(S, 'لم تنجح تجربة ' + nm + ' في ' + S.cities[city].name + '؛ أُرجعت ' + om + '.');
    }
  }
}
/* ---- اقتراح التوظيف اللطيف مرة واحدة ---- */
function sbHint(S) {
  if (!sbOn('hint') || !S.learn || !S.learn.char) return; const P = S.player; P.hints = P.hints && typeof P.hints === 'object' ? P.hints : {}; if (P.hints.hire) return;
  if (S.phase < STEWARD.phase || Object.values(P.props).some(p => p.mgr && p.mgr.rank)) return;
  let best = null; for (const city of Object.keys(P.props)) { const n = teamAssets(S, city).length; if (n >= SKILLB.hire.assets && (!best || n > best.n)) best = { city, n }; }
  if (!best) return; P.hints.hire = S.day;
  news(S, 'ثقل العمل في ' + S.cities[best.city].name + ' (' + best.n + ' ممتلكات): سيوفر عليك الأمين التعبئة والتسعير وتقرير كل أسبوع؛ اقرأ «هرم فريقي» في العقارات حين تحب.');
}
function sbMigrate(S) {
  const P = S.player; if (!P) return;
  if (!Array.isArray(P.needs)) delete P.needs; else P.needs = P.needs.filter(n => n && Number.isSafeInteger(n.id) && ['open', 'reserved', 'done', 'void'].includes(n.state) && typeof n.kind === 'string' && S.cities[n.city] && Number.isSafeInteger(n.day) && n.day <= S.day).slice(0, 60).map(n => (n.state === 'reserved' && n.day < S.day ? Object.assign(n, { state: 'void' }) : n));
  if (P.hints && typeof P.hints !== 'object') delete P.hints;
  for (const pr of Object.values(P.props || {})) {
    if (pr.budget && !(Number.isFinite(pr.budget.trial) && pr.budget.trial >= 0)) delete pr.budget;
    for (const sh of pr.shops || []) { if (sh.mode !== undefined && sh.mode !== 'act' && sh.mode !== 'suggest') delete sh.mode; const t = sh.trial; if (t && (!GD[t.to] || !GD[t.from] || !t.old || !Number.isFinite(t.q) || t.q < 0 || !['run', 'ok', 'failed'].includes(t.state))) delete sh.trial; }
  }
}
Object.assign(A, {
  /* وضع دكاكين المدينة: اقترح عليّ (الافتراضي) أو تصرّف ضمن حدودي */
  shopMode(S, city, mode) { const pr = S.player.props[city]; if (!pr || !pr.shops.length) return NO('لا دكاكين هنا'); if (mode !== 'act' && mode !== 'suggest') return NO('وضع غير معروف'); for (const sh of pr.shops) sh.mode = mode; return OK(mode === 'act' ? 'الأمين يتصرف ضمن حدودك: تجربة رف واحد بميزانية التجربة، ويرجع القديم إن لم تنجح.' : 'الأمين يقترح عليك ولا يغيّر رفاً إلا بموافقتك.'); },
  /* اعتماد اقتراح: يُراجَع الآن (الأمين والتغطية والمخزن والميزانية) ثم يُنفَّذ مرة واحدة */
  mgrApprove(S, id) {
    const n = sbNeeds(S).find(x => x.id === id); if (!n || n.state !== 'open' || n.kind !== 'trial') return NO('لا اقتراح مفتوح');
    const pr = S.player.props[n.city], sh = pr && pr.shops.find(s => s.id === n.shopId), m = pr && stewardOf(S, n.city), c = S.cities[n.city];
    const fail = msg => { n.state = 'void'; return NO(msg); };
    if (!sh || !m) return fail('تغيّر الحال: لا أمين أو لا دكان');
    const old = sh.items.find(it => it.g === n.from); if (!old) return fail('تغيّر الرف قبل موافقتك؛ لم يُعدَّل شيء');
    if (sh.trial && sh.trial.state === 'run') return fail('تجربة أخرى جارية في هذا الدكان');
    if ((pr.store[n.g] || 0) < STEWARD_SMART.rotateMin) return fail('نقصت كمية ' + GD[n.g].name + ' في المخزن؛ لم تُنفَّذ');
    const cost = sbTrialCost(S, c, pr, n.g), B = sbBudget(S, n.city); if (cost > B.trial || cost > Math.max(0, S.player.gold - B.reserve)) return fail('لا تكفي ميزانية التجربة الآن ولا يُمس احتياطي المستحقات');
    n.state = 'reserved'; const r = sbTrialStart(S, n.city, sh, old, n.g, 'approved'); if (!r.ok) return fail(r.msg); n.state = 'done'; n.qty = SKILLB.trial.units; n.cost = cost;
    stewardLog(S, n.city, { kind: 'rotate', amount: 0, g: n.g, from: n.from, why: 'بموافقتك: جرّبتُ ' + GD[n.g].name + ' بدل ' + GD[n.from].name }); return OK('بدأت التجربة بموافقتك');
  },
  mgrDecline(S, id) { const n = sbNeeds(S).find(x => x.id === id); if (!n || n.state !== 'open') return NO('لا اقتراح مفتوح'); n.state = 'void'; const sh = S.player.props[n.city] && S.player.props[n.city].shops.find(s => s.id === n.shopId); if (sh) sh.trialLock = S.day + SKILLB.trial.lock; return OK('لم يتغير شيء، ولن يُقترح هنا مجدداً قبل ' + SKILLB.trial.lock + ' يوماً'); },
  budgetAccept(S, city, trial) { const pr = S.player.props[city]; if (!pr) return NO('لا ممتلكات'); const B = sbBudget(S, city); const v = trial == null ? B.suggestTrial : Math.round(+trial); if (!(v >= 0) || v > B.spend) return NO('الميزانية المطلوبة أكبر من الفائض فوق الاحتياطي'); pr.budget = { trial: v, day: S.day }; return OK('اعتُمدت ميزانية تجربة ' + v + ' ريال؛ الاحتياطي ' + B.reserve + ' لا يُمس'); },
  hintDone(S) { S.player.hints = S.player.hints || {}; S.player.hints.hireDone = S.day; return OK('تم'); },
});
