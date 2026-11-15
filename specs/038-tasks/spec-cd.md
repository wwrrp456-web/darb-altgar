# 038ج/د — كتالوج المهام الكامل وضبطه بالقياس (Opus، 2026-11-15)

**الأصل:** `spec.md` و`plan.md` (§6: 038ج «باقي الكتالوج + ترجيح الهوية + الألقاب والاحتفال»، و038د «الضبط بالقياس»)، و`tasks.md` (T020، T021، T030). **T031 ليس هنا**: انتقل إلى 051 (`specs/051-windows/spec.md` §4).
**يبني على (في main):** 038أ/ب (`src/engine/30i-tasks.js`، `src/ui/06r-tasks.js`)، 035ب (`24f-management.js`)، 036أ–هـ (`30h2*.js`)، 040هـ (`30i2-shopcond.js`)، 011 (`29c-identity.js`)، 009 (`29c-celebrate.js`).
**تُنفَّذ بعد دمج 051** (كلاهما يلمس `06r-tasks.js`؛ 051 يضع مجال `tasks` و`tkTopHTML`). حزمة واحدة في جلسة واحدة: 038ج أولاً ثم 038د على الفرع نفسه.
**ليست حساسة:** لا زكاة ولا شرط جزائي ولا حكم، ولا ذهب في أي مكافأة. الأثر المالي الوحيد ميزة الجمارك المؤقتة (≤ 10٪، ≤ 7 أيام) القائمة منذ 038أ (`tbMul`). **ولا تغيير في أي معادلة عقد أو ضرر**: القوالب تقرأ العقود ولا تكتب فيها، والخطّاف الوحيد في ملفات العقود سطر `tkNote` بلا أثر.

## 0) الحقائق في الشيفرة (قرأها Opus على `main` عند `82deea1`)
1. **القوالب الاثنا عشر** في `TK_T` (`30i-tasks.js`): tr1 tr2 tr3 ex1 ex3 lr1 lr2 mg1 (قصيرة) وrl1 rl2 ex2 bd2 (أسبوعية). المؤجَّلة من `texts.md`: tr5 mg2 mg3 ct1 ct2 bd1.
2. **العرض** `tkOffer`: الوزن `w = d.weight × (rc ? 0.3 : 1) × (kc ? 1 : 1.5)`، حاكم التنوع `mixMax = 0.30` على آخر 12 مقبولة، ثلاثة بأنواع مختلفة بـ`roll(S, 9000 + (tier==='week'?500:0) + k)`. لا يُستهلك `rnd`.
3. **المكافأة** `tkReward`: نفوذ وخبرة بسقف أسبوعي `TASKS.cap = {infl: 25, xp: 30}` عبر `bonusAward(S, 'tk2:'+id+':'+since, …)`؛ `r.trust` و`r.boost` (`tbGive`) و`r.title` (`achGrant` إن كان في `ACHD.LIST`) مدعومة ولم يستعملها قالب بعد.
4. **الإنجازات أربعون معتمدة** (`src/achievements.js`، واختبار `achievements.test.js` يثبّت 40). **فلا تُضاف ألقاب المهام إليها**؛ وتبقى `r.title` كما هي غير مستعملة.
5. **العقود:** سجل `P.agr` (القائمة فقط؛ المنتهية تُحذف بـ`agrDrop`). أنواعها في `AGR_KINDS` بحقل `fam` (`fin`، `mfg`، `road`، `rival` المخفي `hidden: true`؛ و`export`/`import` بلا `fam`، و`lane` ليس عقداً بل وصف الخط). **الوفاء بدورة** يظهر في عشرة مواضع `ag.ok++` في `30h2-influence.js` (2) و`30h2f-influence-fin.js` (3) و`30h2m-influence-mfg.js` (3) و`30h2r-influence-road.js` (2)؛ ولا ينقص `ok` أبداً.
6. **الخانات:** `slotsOf(S)` و`slotsUsed(S)` (`30h2-influence.js:14-15`).
7. **الإدارة:** `mgmtCity(S, id)` يعيد `workers.{seller,keeper,farmer}.missing` و`next` (`{to, ok, action:{act:'team-promote'|'steward-promote'}}`)؛ `hirePool(S, id)`؛ `MGMT_RANKS`؛ `MGMT.on`.
8. **البناء:** `buildShop` (شروطه: `lessonLock(S,'shop')`، الطور ≥ 2، `shopLimit(c)`، `rankSlots(S).shops`، `shopCost(S,c)`)، `buildWarehouse` (`pr.whs < pr.shops.length`، `whCost(S,c)`)، `buildFarm` (`FARM_PHASE`، `lessonLock(S,'farm')`، دكان في المدينة، لا مزرعة، `round(FARM_COST × foreignMul(S,c))`).
9. **القوافل:** `hireCaptain` (الطور ≥ 2، ≤ 6، `rankSlots(S).fleet`، `captainPool(S)[i].fee`)؛ `S.player.trips` يزيد مع كل وصول (`09-travel.js:137`).
10. **حالة الدكاكين:** `scQuote(S, city, id)` (`id` رقم دكان مملوك أو `'wh'`) يعيد `{cond, name, cost, can}` و`can = cond < SHOPCOND.repairBelow (65)`؛ و`SHOPCOND.start = 80`.
11. **الهوية:** خمس شخصيات `ID_DEF` (trader، changer، leader، shopkeeper، negotiator)؛ الهدف `S.learn.idGoal = {c, n, done}` و`ID_DEF[c].goal.{name, need}`؛ `idOn(S)`؛ `IDENTITY.goals`.
12. **الاحتفال:** `CELEBRATE_IDS` سبعة، و`celebrateKey` يضيف `:arg` لـ`chapter_done` و`feud_peace`؛ والواجهة (`02d-celebrate.js:5-9`، `:56`) تأخذ الصورة `celebrate/<id>` إلا `feud_peace` فتأخذ `market_lead`.

## 1) المفتاح والحالة
```
TASKS.c = { on: true, bdGold: 0.5, idMul: 1.4, titleInfl: 10, titleN: { tr: 10, ex: 10, rl: 10, mg: 10, ct: 10, lr: 10, bd: 5 } }
```
يُكتب في `30i-tasks.js` بعد تعريف `TASKS`. **`TASKS.c.on = false` ⇒ 038أ/ب حرفاً:** القوالب الثمانية الجديدة لا تُعرض (تُصفّى في `tkOffer` بـ`d.c && !TASKS.c.on`)، ولا ترجيح هوية، ولا ألقاب، ولا تُكتب الحقول `seen.ct` و`seen.kp` و`T.tt` و`T.kc`، و`tkNote(S,'kept',…)` لا يفعل شيئاً. و`TASKS.on = false` يطفئ كل شيء كما اليوم (مثبَّت أصلاً في `skill` و`skill-b`).
**الحقول الجديدة (اختيارية، داخل `P.tk2` الكسول فقط):** `T.seen.ct = {kind: 1}` (أنواع عقود جرّبها)، `T.seen.kp = {agId: n}` (دورات وفّاها لكل عقد)، `T.tt = {kind: day}` (ألقاب المهام)، `T.kc = {kind: n}` (عدد المنجَز لكل نوع، تراكمي). الحفظ القديم بلا هذه الحقول يعمل: تُنشأ في `tkState` عند `TASKS.c.on` فقط:
```
if (TASKS.c.on) { s.kp = s.kp || {}; if (!s.ct) { s.ct = {}; for (const a of P.agr || []) if (tkCtKind(a.kind)) s.ct[a.kind] = 1; for (const x of P.agrLog || []) if (tkCtKind(x.k)) s.ct[x.k] = 1; } T.tt = T.tt || {}; if (!T.kc) { T.kc = {}; for (const x of T.done) if (TK_T[x.id]) T.kc[TK_T[x.id].kind] = (T.kc[TK_T[x.id].kind] || 0) + 1; } }
```
ولأن `tk2` لا يُنشأ إلا حين يفتح اللاعب المهام، فلا يتغير حفظ autopilot ولا بصماته؛ ولا يلزم تثبيت `TASKS.c.on` في سكربتات الالتقاط (يُتحقق بالاختبار §6-7).

## 2) 038ج: القوالب الثمانية الجديدة (T020)
كل قالب يُضاف إلى `TK_T` بالحقل `c: 1` (علامة 038ج)، ونصوصه **حرفاً** من `texts.md` (القسم «038ج»). الدوال التالية **بحرفها** (الأسماء المساعدة الجديدة في آخر القسم). `p` معاملات `gen`، و`st` حالة الخانة (`since` و`base`).

### أ) tr5 · ثلاث رحلات رابحة (أسبوعية، وزن 2، `{xp: 10}`)
- **gen:** `S.player.caravans.length >= 1 && S.player.trips >= 3 ? {} : null`.
- **base:** `{ trips: S.player.trips }`.
- **done:** `g = tkTrips(S, st.since)`؛ `n = Math.min(S.player.trips − st.base.trips, g)`؛ `{ n, need: 3, ok: n >= 3 }`.
- `tkTrips(S, since)` = عدد المفاتيح المختلفة `t.city + ':' + t.day` في `tkSells(S, since)` التي `Σ t.pl` لمجموعتها `> 0`.

### ب) mg2 · وظّف حيث ينقص (أسبوعية، وزن 2، `{xp: 8}`)
- **gen:** إن `!MGMT.on || S.phase < 2` ⇒ `null`. لكل `id` في `S.order` بترتيبه وله `S.player.props[id]` و`hirePool(S, id) >= 1`: `m = mgmtCity(S, id)`؛ أول دور `r` في الترتيب `['seller', 'keeper', 'farmer']` يحقق `m.workers[r].missing > 0` ⇒ `{ c: id, r, 'مدينة': S.cities[id].name, 'دوراً': TKC_ROLE[r][0], 'دور': TKC_ROLE[r][1], 'ممتلك': TKC_ROLE[r][2] }`. وإلا `null`.
- `TKC_ROLE = { seller: ['بائعاً', 'بائع', 'دكانك'], keeper: ['أمين مخزن', 'أمين مخزن', 'مخزنك'], farmer: ['مزارعاً', 'مزارع', 'مزرعتك'] }`.
- **base:** `{ n: staffOf(S, p.c).filter(w => w.role === p.r).length }`.
- **done:** `n1` العدد نفسه الآن؛ `{ n: n1 > st.base.n ? 1 : 0, need: 1, ok: n1 > st.base.n }`.

### ج) mg3 · ترقية (أسبوعية، وزن 2، `{infl: 8}`)
- **gen:** إن `!MGMT.on` ⇒ `null`. أول `id` في `S.order` له `props` و`x = mgmtCity(S, id).next` يحقق `x && x.ok && x.action && (x.action.act === 'team-promote' || x.action.act === 'steward-promote')` ⇒ `{ c: id, to: x.to, 'مدينة': S.cities[id].name, 'درجة': MGMT_RANKS[x.to − 1] }`. وإلا `null`.
- **base:** `{ rank: tkRank(S, p.c) }` حيث `tkRank(S, id) = (S.player.props[id] && S.player.props[id].mgr) ? S.player.props[id].mgr.rank : 0`.
- **done:** `ok = tkRank(S, p.c) > st.base.rank`؛ `{ n: ok ? 1 : 0, need: 1, ok }`.

### د) ct1 · دفعة اتفاقية (أسبوعية، وزن 3، `{boost: {kind: 'customs', days: 7, mul: 0.9}}`)
- **gen:** `ag` = أول عقد في `S.player.agr || []` يحقق `tkCtKind(ag.kind) && ag.left > 0 && bossOf(S, ag.city)` ⇒ `{ id: ag.id, 'العقد': AGR_KINDS[ag.kind].name, 'الزعيم': bossOf(S, ag.city).name }`. وإلا `null`.
- **base:** `{ n: T.seen.kp[p.id] || 0 }`.
- **done:** `n1 = T.seen.kp[p.id] || 0`؛ `{ n: n1 > st.base.n ? 1 : 0, need: 1, ok: n1 > st.base.n }`.
- **الخطّاف:** بعد **كل** عبارة `ag.ok++` في `src/engine/30h2*.js` (العشرة في §0-5) يُكتب في العبارة نفسها: `ag.ok++; tkNote(S, 'kept', ag.id);`. وفي `tkNote` يُضاف قبل `if (what !== 'haggle') return;`:
  `if (what === 'kept') { if (TASKS.c.on) { const k = tkState(S).seen.kp; k[city] = (k[city] || 0) + 1; } return; }` (المعامل الثالث هنا رقم العقد). **لا يلمس أي متغير في العقد**، وبلا `P.tk2` أو بالمفتاح المطفأ لا يفعل شيئاً.
- **المكافأة:** `tbGive(S, 'customs', 7, 0.9)` القائمة (لا تتراكم، الأكبر يغلب، ≤ 10٪ و≤ 7 أيام). سطر المكافأة من `tkRewardLine`: «جمارك أقل 10٪ لمدة 7 أيام». **ولا نفوذ ولا خبرة** فلا تدخل السقف.

### هـ) ct2 · نوع عقد جديد (أسبوعية، وزن 2، `{infl: 10}`)
- `tkCtKind(k) = !!(AGR_KINDS[k] && k !== 'lane' && !AGR_KINDS[k].hidden)`.
- `tkCtOpen(S, k) = tkCtKind(k) && INFLU.on && (!AGR_KINDS[k].fam || INFLU.fam[AGR_KINDS[k].fam] !== false) && !(INFLU[k] && INFLU[k].on === false)`.
- `tkCtAll(S) = Object.keys(AGR_KINDS).filter(k => tkCtOpen(S, k))`.
- **gen:** إن `slotsUsed(S) >= slotsOf(S)` ⇒ `null`. `left = tkCtAll(S).filter(k => !T.seen.ct[k])`؛ إن لم يوجد `id` في `tkVisited(S)` له `bs = S.bosses[id]` و`bs.ruler !== 'player'` و`left.some(k => bs.trust >= AGR_KINDS[k].minTrust)` ⇒ `null`. وإلا `{ 'عدد': Object.keys(T.seen.ct).length, 'كل': tkCtAll(S).length }`.
- **tkScan (إضافة):** إن `TASKS.c.on`: `for (const a of S.player.agr || []) if (tkCtKind(a.kind)) T.seen.ct[a.kind] = 1;` (يُستدعى يومياً من `tasksDay`، وأقصر عقد أطول من يوم، فلا يفوت توقيع).
- **base:** `{ list: Object.keys(T.seen.ct) }`.
- **done:** `nw = Object.keys(T.seen.ct).filter(k => !st.base.list.includes(k))`؛ `{ n: nw.length ? 1 : 0, need: 1, ok: nw.length > 0, last: nw[0] && { 'اسم العقد': AGR_KINDS[nw[0]].name } }`.

### و) bd1 · ممتلك جديد (أسبوعية، وزن 2، `{infl: 12}`)
- **gen:** إن `S.phase < 2` ⇒ `null`. `g = S.player.gold`، `rs = rankSlots(S)`. لكل `id` في `S.order` له `pr = S.player.props[id]` و`c = S.cities[id]`، والأنواع بهذا الترتيب، **أول ما يتحقق**:
  1. مخزن: `pr.shops.length > 0 && pr.whs < pr.shops.length && whCost(S, c) <= TASKS.c.bdGold × g` ⇒ `k = 'wh'`.
  2. دكان: `!lessonLock(S, 'shop') && shopsOf(S, id).length < Math.min(shopLimit(c), rs.shops) && shopCost(S, c) <= TASKS.c.bdGold × g` ⇒ `k = 'shop'`.
  3. مزرعة: `S.phase >= FARM_PHASE && !lessonLock(S, 'farm') && pr.shops.length > 0 && !pr.farm && Math.round(FARM_COST × foreignMul(S, c)) <= TASKS.c.bdGold × g` ⇒ `k = 'farm'`.
  ⇒ `{ c: id, k, 'مدينة': c.name, 'نوع': TKC_BD[k][0], 'ممتلك': TKC_BD[k][1] }`. وإلا `null`.
- `TKC_BD = { wh: ['مخزناً', 'مخزن جديد'], shop: ['دكاناً', 'دكان جديد'], farm: ['مزرعة', 'مزرعة جديدة'] }`.
- **base:** `{ n: tkProps(S, p.c) }` حيث `tkProps(S, id) = (pr => pr ? pr.shops.length + (pr.whs || 0) + (pr.farm ? 1 : 0) : 0)(S.player.props[id])`.
- **done:** `ok = tkProps(S, p.c) > st.base.n`؛ `{ n: ok ? 1 : 0, need: 1, ok }`.
> `bdGold = 0.5`: لا يُقترح بناء يأكل أكثر من نصف رصيدك. المهمة اقتراح ولا تدفع شيئاً.

### ز) bd3 · رمّم دكاناً أو مخزناً (قصيرة، وزن 2، `{xp: 4}`)
- **gen:** إن `!SHOPCOND.on` ⇒ `null`. لكل `id` في `S.order` له `pr`، ثم لكل `x` في `[...pr.shops.map(s => s.id), 'wh']`: `q = scQuote(S, id, x)`؛ أول ما يحقق `q && q.can && q.cost <= TASKS.c.bdGold × S.player.gold` ⇒ `{ c: id, x, 'مدينة': S.cities[id].name, 'المكان': x === 'wh' ? 'مخزنك' : 'دكانك', 'حال': q.name }`. وإلا `null`.
- **base:** `{}`.
- **done:** `q = scQuote(S, p.c, p.x)`؛ `ok = !!q && q.cond >= SHOPCOND.start`؛ `{ n: ok ? 1 : 0, need: 1, ok, last: q && { 'حال': q.name } }`. (إن بيع الدكان صار `q = null` فلا إنجاز، والمهلة تنقضي بلا خسارة.)

### ح) mg4 · قافلة بقائد (أسبوعية، وزن 2، `{xp: 8}`)
- **gen:** `n = S.player.caravans.length`، `rs = rankSlots(S)`؛ إن `S.phase < 2 || n >= 6 || n >= rs.fleet` ⇒ `null`؛ إن `!captainPool(S).some(cd => cd.fee <= TASKS.c.bdGold × S.player.gold)` ⇒ `null`؛ وإلا `{ 'عدد': n }`.
- **base:** `{ n: S.player.caravans.length }`.
- **done:** `ok = S.player.caravans.length > st.base.n`؛ `{ n: ok ? 1 : 0, need: 1, ok }`.

### ط) ملاحظات الكتالوج
- **العدد:** 12 + 8 = **20 قالباً** + خانة الموسم (والدينية) = **22 بطاقة**، وهي الكتالوج النهائي لـ1.0 («نحو 24» في `spec.md`). لا قالب آخر في هذه الحزمة.
- **الأنواع:** يُضاف `ct: 'عقود'` إلى `TASKS.KIND`، و`ct: 'icons/pact'` إلى `TK_ICON` في `06r-tasks.js` (أيقونة قائمة؛ لا أيقونة جديدة).
- **ما يُمنع:** لا قالب يذكر الزكاة أو الصدقة أو القرض أو المرابحة أو الحصّالة، ولا قالب يدفع اللاعب إلى دَين. `tkCtAll` يستثني المخفي (`rmud`، `rpart`).
- **حدّ الصعوبة:** القوالب الثلاثة التي تقترح إنفاقاً (bd1، bd3، mg4) مشروطة بـ`≤ bdGold × الرصيد`.

## 3) 038ج: ترجيح الهوية (T021)
```
TKC_ID = { trader: ['tr', 'ex'], changer: ['tr', 'lr'], leader: ['ex', 'mg'], shopkeeper: ['bd', 'mg'], negotiator: ['rl', 'ct'] }
```
في `tkOffer`، الوزن يصير (سطر واحد يُضاف للضرب):
`w = d.weight × (rc ? 0.3 : 1) × (kc ? 1 : 1.5) × (TASKS.c.on && idOn(S) && (TKC_ID[S.learn.char] || []).includes(d.kind) ? TASKS.c.idMul : 1)`
**لا يحصره:** قاعدة «ثلاثة بأنواع مختلفة» وحاكم التنوع كما هما، فيظهر نوع خارج الهوية في كل عرض فيه ≥ 3 أنواع.
وفي `tasksView` لكل معروض حقل `id: true` إن كان نوعه من هوية اللاعب، وتُلحق الواجهة بسطر «لماذا اقترحتها» ` · يناسب شخصيتك` (حرفاً من `texts.md`).

## 4) 038ج: الألقاب والاحتفال (T021)
- **العدّ:** `T.done` يحفظ آخر 40 فقط، فالعدّ من `T.kc[k]` التراكمي: يزيد بواحد في `tkFinish` عند `why === 'ok'` (إن `TASKS.c.on`) لنوع القالب المنجَز. الحفظ القديم: `T.kc` غائب ⇒ يُزرع مرة من `T.done` (§1). و`T.tt[k]` = يوم نيل اللقب. وفي أول `tasksDay` بعد الزرع يُفحص المنح لكل نوع (فيُمنح لقب من بلغ العدد قبل الحزمة).
- **المنح** (في `tkFinish` بعد زيادة `kc`): إن `TASKS.c.on && TASKS.c.titleN[k] && T.kc[k] >= TASKS.c.titleN[k] && T.tt[k] == null`:
  `T.tt[k] = S.day; bonusAward(S, 'tkt:' + k, TASKS.c.titleInfl, 0, tkFill(TKC_TXT.title, { 'لقب': TKC_TITLE[k] })); celebrate(S, 'task_title', k);`
- **خارج السقف الأسبوعي** (يُمنح مرة واحدة لكل نوع، بمفتاح فريد). المجموع الأقصى: 7 × 10 = **70 نفوذاً** في اللعبة كلها.
- `TKC_TITLE` حرفاً من `texts.md` (§الألقاب): `tr` «التاجر المتجوّل»، `ex` «المستكشف»، `rl` «صديق الزعماء»، `mg` «المدبّر»، `ct` «صاحب العهود»، `bd` «البنّاء»، `lr` «طالب المعرفة».
- **الاحتفال:** يُضاف `'task_title'` إلى `CELEBRATE_IDS`، ويصير `celebrateKey` يضيف `:arg` له أيضاً (`id === 'chapter_done' || id === 'feud_peace' || id === 'task_title'`). في `02d-celebrate.js`: النص `task_title: item => E.tkTitleCel(item.arg)` (يعيد `tkFill(TKC_TXT.cel, {'لقب': TKC_TITLE[arg]})`)، والصورة `celebrate/chapter_done` (موجودة؛ لا رسم جديد). `celebrate` نفسه يمنع التكرار بـ`L.cel[key]`.
- **ليس صورياً:** اللقب يمنح 10 نفوذ فعلاً (يُصرف في المزايا)، ويظهر في رأس المهام (§5).

## 5) الواجهة ونقطة الوصول
- **رأس المهام** (بعد سطر الأسبوع؛ في `tkTopHTML` من 051 إن وُجد وإلا في `tkBodyHTML`): سطر واحد من `tasksView(S).titles`:
  - إن نال لقباً: `ألقابك: {لقب١} · {لقب٢}` ثم ` · التالي: {لقب} بعد {ن} مهام {نوع}` لأقرب لقب لم يُنل (أقل `titleN[k] − kc[k]`، والتعادل بترتيب `tr ex rl mg ct lr bd`).
  - إن لم ينل: `أول لقب: {لقب} بعد {ن} مهام {نوع}`.
  - `{نوع}` = `TASKS.KIND[k]`.
- `tasksView` يضيف: `titles: { got: [اسم…], next: {name, n, kind} | null }`، و`id` لكل معروض (§3). بلا حقل حين `TASKS.c.on = false`.
- **نقطة الوصول:** سطر «مهامك» في «حال أعمالي» (0 نقرة، ظاهر) ← النافذة (نقرة 1) فيها الرأس والمعروضات ← الاختيار (نقرة 2). ولا مكان جديد.

| ما يظهر | الرقم الذي يتغير | أين يراه | نقرات |
|---|---|---|---|
| قوالب 038ج الثمانية | خبرة/نفوذ (`L.bonus`) أو جمارك ×0.9 (`tbMul`) | بطاقة المعروض وبطاقة الإنجاز | 1–2 |
| «يناسب شخصيتك» | وزن العرض ×1.4 (أكثر ظهوراً) | سطر «لماذا اقترحتها» | 1 |
| ألقاب المهام | +10 نفوذ مرة لكل لقب | رأس المهام + خبر + احتفال | 1 |
| التالي من الألقاب | `titleN − kc` | رأس المهام | 1 |
| ميزة الجمارك (ct1) | جمارك الصفقة ×0.9 حتى `until` | سطر المكافأة؛ ويظهر الأثر في الجمارك المدفوعة | 1 |

## 6) 038د: الضبط بالقياس (T030)
### أ) الأداة `tools/tasks-tune.js` (جديدة؛ بنمط `tools/identity-measure.js`: عمّال، بذور ثابتة، لا يعيد إن لم يتغير المحرك)
- **التشغيلات:** الشخصيات الخمس × البذور `1..8` × `DAYS = 2 × 354` = 40 تشغيلاً لكل حالة، وحالتان: `on` (`TASKS.on = TASKS.c.on = true`) و`off` (`TASKS.on = false`).
- **البداية:** كبداية `runOne` في `identity-measure.js` حرفاً (`chooseStart(S,'sa')`، `learnSetChar`، `S.noLock = 1`، `S.noEvents = true`، `famDebt = null`، `L.level = 11`، `L.stage = 23`…)، و`IDENTITY.goals = IDENTITY.perks = false`.
- **اللاعب الآلي:** سلوك «قبل» المحايد من `identity-measure.js` (لا يعرف المهام)، ويُضاف في حالة `on` فقط بعد خطوة اليوم: يوم 0 `E.tasksView(S)`؛ ثم كل يوم لكل `tier` في `['short', 'week']`: إن `!sl.pick && sl.offer.length` ⇒ `A.tasksPick(S, tier, S.day % sl.offer.length)`.
- **ما يُسجَّل** (لكل قالب ولكل نوع، مجموعاً على الأربعين): `offered` (ظهوره في عرض)، `picked`، `done`، `lapse`، `pickNo` (رفض `tasksPick` لأن `gen` صار `null`)، متوسط أيام الإنجاز؛ ولكل أسبوع: النفوذ والخبرة **قبل السقف** (`raw`) وبعده؛ وثروة اليوم الأخير `netWorth(S)`.
- **الخرج:** `specs/038-tasks/tune-d.json` و`specs/038-tasks/tune-d.md` (جدول لكل قالب، ولكل نوع، والسقف، والثروة).

### ب) المقاييس (بحرفها)
- `share(k) = picked(k) / Σ picked` لكل نوع.
- `rate(t) = done(t) / picked(t)` لقالب فيه `picked(t) ≥ 10`.
- `W = |mean(nw_on) / mean(nw_off) − 1|`.
- `capHit = (أسابيع فيها raw.infl > cap.infl) / (كل الأسابيع)`.
- `P75infl` = المئين 75 من `raw.infl` الأسبوعي على كل الأسابيع (بالترتيب الصاعد، العنصر `floor(0.75 × (N − 1))`)؛ و`P75xp` مثله.

### ج) قواعد الضبط (تُطبَّق بهذا الترتيب، ثم يُعاد القياس مرة واحدة ويُكتب الخرج النهائي؛ ولا جولة ثالثة)
1. **السقف:** `cap.infl = clamp(5 × round(P75infl / 5), 20, 30)`، `cap.xp = clamp(5 × round(P75xp / 5), 25, 40)`.
2. **التنوع:** لكل نوع `share(k) > 0.40`: `weight × 0.7` لكل قوالبه (أدنى 1، يُقرَّب إلى عُشر). وإن بقي بعد إعادة القياس `> 0.40`: `TASKS.mixMax = 0.25`.
3. **الإنجاز الصعب** (`rate(t) < 0.25`): يُخفَّض المعامل الرقمي وحده بحسب الجدول، ولا يُمس غيره:

| القالب | المعامل | الحالي | بعد الخفض |
|---|---|---|---|
| tr1 | سقف `n` | `Math.min(30, …)` | `Math.min(20, …)` |
| tr2 | المضاعف | `avg × 1.5` | `avg × 1.3` |
| tr5 | `need` | 3 | 2 |
| rl1 | الهدف | `ceil((trust + 8) / 5) × 5` | `ceil((trust + 5) / 5) × 5` |
| غيرها | — | — | `weight × 0.7` فقط (أدنى 1) |

4. **الإنجاز السهل** (`rate(t) > 0.90` ومتوسط الأيام `≤ 1`): المكافأة −1 في رقمها الأكبر (نفوذ أو خبرة)، بحد أدنى `max(2, الحالي − 2)`. ct1 لا تُمس (ميزتها ثابتة).
5. **الثروة:** إن `W > 0.10`: تُلغى ميزة ct1 وتصير مكافأتها `{ infl: 6 }`، ويُعاد القياس. وإن بقي `W > 0.10` بعدها: يُوقف التنفيذ ويُكتب في التقرير لقرار Opus (لا يُضبط غير ذلك).
6. **المستحيل:** `pickNo > 0` لقالب أو `offered = 0` لقالب جديد على الأربعين ⇒ **خلل يُصلح في `gen`** (ليس ضبطاً)، ويُذكر في التقرير بالقالب والبذرة.
- **حدود لا تُتجاوز في أي قاعدة:** لا ذهب؛ لكل قالب نفوذ ≤ 12 وخبرة ≤ 10؛ الميزة ≤ 10٪ و≤ 7 أيام؛ `titleInfl` و`idMul` و`bdGold` لا تُضبط هنا.
- **القبول:** كل `share(k) ≤ 0.40`؛ `W ≤ 0.10`؛ `pickNo = 0`؛ كل قالب جديد `offered > 0`. والقيم النهائية تُكتب في `TASKS` بتعليق `// 038د: tune-d.md` وتنسخ في `tune-d.md` بالقديم والجديد.

## 7) الاختبارات
`test/tasks.test.js` (كتلة «038ج/د»؛ تبني الحالة يدوياً كما في كتلتي 038أ/ب):
1. **لكل قالب من الثمانية:** `gen` = `null` حين لا تتحقق حالته (حالة واحدة سالبة على الأقل لكل شرط مذكور في §2)، ويعيد معاملاته حين تتحقق؛ و`done` لا يصدق قبل الفعل، ويصدق بعد الفعل الحقيقي عبر `A.*` (`hireStaff`، `promoteWorker` أو `steward-promote`، `buildWarehouse`/`buildShop`، `shopRepair`، `hireCaptain`، سفر وبيع للرحلات، توقيع عقد، تسوية دورة موفاة).
2. **ct1 والخطّاف:** عدد `ag.ok++` في `src/engine/30h2*.js` = عدد `ag.ok++; tkNote(S, 'kept', ag.id);` (قراءة الملفات بـ`fs`، فلا موضع يُنسى)؛ وتشغيل دورة تصدير موفاة يزيد `seen.kp[id]` بواحد، ولا يغير أي حقل في `ag` ولا `P.gold` مقارنة بتشغيل `TASKS.c.on = false` (بصمة `JSON.stringify(ag)` و`P.gold` متطابقة).
3. **ct1 المكافأة:** `L.tb = {kind: 'customs', mul: 0.9, until: day + 7}`، و`tbMul(S,'customs') = 0.9` حتى `until` ثم 1.
4. **الهوية:** بشخصية `negotiator` وبذرة ثابتة على 200 عرض: حصة `rl`+`ct` أعلى من نفسها بـ`TASKS.c.on = false`؛ وكل عرض فيه ≥ 3 أنواع ما زال بثلاثة أنواع مختلفة.
5. **الألقاب:** 10 مهام `tr` منجزة ⇒ `T.tt.tr` يوم، و+10 نفوذ مرة واحدة (إعادة `tkFinish` أو إعادة التحميل لا تمنح ثانية)، و`L.cel['task_title:tr']`؛ والنفوذ خارج `T.cap.infl`. وحفظ قديم بـ`T.done` فيه 12 `tr` بلا `kc` ⇒ `kc.tr = 12` واللقب يُمنح عند أول `tasksDay`.
6. **المطفأ:** `TASKS.c.on = false` ⇒ لا قالب من الثمانية في أي عرض على 300 يوم، ولا `seen.ct`/`seen.kp`/`T.tt`/`T.kc` في الحفظ، ونتيجة `tasksView` مطابقة لما قبل الحزمة (بصمة على بذرة ثابتة تُلتقط من `main` قبل التعديل).
7. **الكسل:** لاعب لم يفتح المهام ⇒ لا `P.tk2` ولو جرت دورات عقود (الخطّاف لا يُنشئ الحالة).
8. **الحدود:** لا قالب `reward` فيه `gold`؛ كل نفوذ ≤ 12 وخبرة ≤ 10؛ ولا نص قالب جديد فيه «زكاة» أو «صدقة» أو «قرض» أو «ربا» (فحص نصي على `TK_T`).
9. **النصوص:** نصوص القوالب الثمانية والألقاب وعبارات 038ج تطابق `texts.md` حرفاً (الاختبار يقرأ الملف، كما في 038أ).
`test/tasks-ui.test.js`: رأس الألقاب في الحالتين (لا لقب / لقبان والتالي)، «يناسب شخصيتك»، بطاقة ct بأيقونة `icons/pact`، 390px بلا تمرير أفقي.
**الأداة:** تُشغَّل مرة على الفرع، ويُرفق خرجها (`tune-d.md`). لا تدخل `test/run.js`.

## 8) الحجم والسجل
- المتوقع: محرك نحو +9 آلاف حرف، وواجهة نحو +1.5 ألف؛ لا صورة جديدة. يُذكر حجم `index.html` قبل وبعد في التقرير.
- `docs/guide/CHANGELOG.md`:
  - `- [لاعب] 2026-11-15: 038ج: ثماني مهام جديدة (رحلات رابحة، توظيف، ترقية، عقود، بناء، ترميم، قافلة)، ومهام تناسب شخصيتك تظهر أكثر، وسبعة ألقاب للمهام لكل منها +10 نفوذ واحتفال.`
  - `- [مبرمج] 2026-11-15: 038ج/د: TASKS.c (مفتاح، off = 038أ/ب حرفاً)، خطّاف tkNote('kept') بعد كل ag.ok++، T.seen.ct/kp وT.tt/kc اختيارية، task_title في CELEBRATE_IDS؛ وضبط السقف والأوزان بأداة tools/tasks-tune.js (tune-d.md).`
- `test/map.json`: `30i-tasks.js` و`06r-tasks.js` و`30h2*.js` و`29c-celebrate.js` و`02d-celebrate.js` ← `tasks`، `tasks-ui`.
- التقرير `specs/038-tasks/report-cd.md` (≤ 40 سطراً)، وفيه «الحزمة الكاملة لم تُشغَّل».
