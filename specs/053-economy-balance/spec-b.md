# 053ب: الحرب حدثاً، والمنافسة بعد القيادة، ومُختار الصعوبة عند البدء (Opus، 2026-11-16)

**المصدر:**
- `measure.md`: §5 (لا شيء يستردّ السوق)، و§7، و§8.3 (الحرب والأهداف)، و§8.4 (المنافسة)، و§11 (القراران 3 و4).
- `spec-a.md`: القرارات المعتمدة و§5.
- `docs/plan/COMMITMENTS.md` §3 البند 13 (هـ، و، ز).

**تعتمد على 053أ مدموجة:** `BAL` و`balLv` و`balHit` و`balHitMul` و`balStoreLoss` و`balRisk` و`balView` من `src/engine/30l-balance.js`. لا تبدأ قبل وجودها في `main`.

**حساسة (مال):** تمر بمراجعة Opus قبل التكامل.
- لا نص ديني ولا حكم جديد.
- الحرب **بلا قتال ولا مشاهد عنف ولا صور جديدة**. نصوصها اضطراب وقطع طرق وغلاء فقط. لا «جنود» ولا «معارك» ولا «قتلى» ولا «نهب جيوش».

## القرارات المعتمدة (Opus)
1. **المفتاح نفسه `BAL.on`** (لا مفتاح جديد).
   - **`BAL.on = false` = السلوك الحالي حرفاً:**
     - لا حرب جديدة، ولا تحدٍّ.
     - لا قفل للمستوى، ولا مُختار عند البدء.
     - `cityDay` يُنشئ حدث `war` القديم كما هو.
     - `BOSS_LOSE` و`DF` و`inflow` بلا تغيير.
   - **لا حقل جديد في الحفظ:** `S.wars` و`S.balWar` و`S.balCh` و`S.diffDay` و`c.ev.food` لا تُكتب.
   - **لا سحب عشوائي جديد.**
   - يبقى المفتاح `false` بعد هذه الحزمة. تفعيله لجلسة التكامل بعد لعب بن محمود.
2. **المستوى من `S.diff` القائم** (`balLv`؛ والمتوسط يُخزَّن `undefined` كما يفعل `16-events.js:282` اليوم). لا حقل مستوى جديد.
3. **الحرب الجديدة تحلّ محلّ حدث `war` العشوائي القديم تحت `BAL.on`:**
   - **السبب:** القديم يقع نحو `0.012 × 1/5 × 18 مدينة` ≈ 0.04 في اليوم، أي قرابة 10 «حروب» مدينية في السنة، فلا يتحقق «مرة في السنة».
   - **التنفيذ:** يبقى سحب `k` في `cityDay` كما هو. فإن خرج `war` وكان `BAL.on`، لا يُنشأ حدث (لا سحب بعده).
   - **ما يُعاد استعماله:** الحرب الجديدة تضع `c.ev = { k: 'war', … }` في مدنها، فيعمل كل أثر قائم لـ`war` بلا كود جديد:
     - الأدوات ×1.6 والحديد ×1.3 في `evMul`؛
     - طلب الأدوات في `02-core-world.js:41`؛
     - الذهب في `fxDay`؛
     - `balHit` و`balRisk` من 053أ.
4. **أثر الحرب على أصول اللاعب يمرّ بمسارات 053أ وحدها:** `balHit` ← `balHitMul` (المبيعات)، و`balStoreLoss(S, id, 'war')` (المخزن والتكافل)، و`balRisk` (الطريق). الإضافة الوحيدة نسبة مبيعات خاصة بالحرب `BAL.war.hit` داخل `balHitMul` نفسها، لأن القياس §8.3 كتب «نصف مبيعاتها».
5. **الحرب تتقدّم في `balHit`:** إن اجتمع جفاف وحرب في مدينة فالسبب المعروض والنسبة للحرب.
6. **التحدّي يُردّ بالمال في صندوق السوق** (`fundDonate` القائم في `15c-market-fund.js`)، فللمال مقابل ظاهر في خدمات السوق، **لا «رشوة» لزعيم**. فإن كان الصندوق مطفأً (`!mfOn(S)`) فالدفع «حملة عروض للزبائن» بفئة دفتر جديدة `marketDefend`. ويستطيع اللاعب أن يتركه فيرى رقم ما سيخسره قبل أن يختار.
7. **تغيير المستوى لا يعيد تقييم شيء** (قرار 053أ رقم 5):
   - الحرب المجدولة تبقى في موعدها، والتالية بفاصل المستوى الجديد.
   - حدّ فقد القيادة ونسبة التحدّي يتبعان المستوى الحالي فوراً.
   - لذلك يُعرض قبل التأكيد عدد الأسواق التي تنزل حصتها عن الحدّ الجديد (§4).
8. **اختيار البدء لا يبدأ المهلة؛ كل تغيير بعده يبدؤها:** `S.diffDay = S.day` عند كل تغيير ناجح أثناء اللعب، والمهلة `BAL.lock = 30` يوماً.
9. **يُعدَّل `docs/goals/WORLD.md` §3** («بلا حروب») بسطر الاستثناء المقيّد، كما قرّر بن محمود في البند 13(ز). ويُصحَّح تعليق `30f-difficulty.js` («بلا حروب») بالإحالة إليه.

## 1) المقابض (تُضاف إلى `BAL` نفسه في `30l-balance.js`، حرفاً)
```js
Object.assign(BAL, {
  war: {
    from: YEAR + 1,            // لا حرب في السنة الأولى (الأيام 1..354)
    gap: [708, 354, 177],      // متوسط الأيام بين بدء حربين: مرة/سنتين، مرة/سنة، مرتان/سنة (معتمد §11)
    spread: 0.5,               // الفاصل منتظم على [1 − 0.5، 1 + 0.5] × gap
    warn: 5,                   // أيام الإشاعة قبل البدء
    dur: [20, 40],             // أيام الحرب (§8.3)
    food: [0.30, 0.60],        // غلاء الأقوات في مدنها (§8.3)
    roads: [1, 2],             // الطرق المقطوعة
    hit: [0.35, 0.50, 0.65]    // نقص مبيعات دكاكين اللاعب في مدنها (المتوسط = النصف §8.3)
  },
  ch: {
    p: [0.025, 0.06, 0.12],    // احتمال تحدٍّ في الشهر لكل وحدة من k (diffK)
    pMax: 0.9,
    boost: [15, 25],           // ما يضيفه التحدّي إلى نفوذ الزعيم bs.b (§8.4)
    cost: [250, 500, 800],     // ريال لكل نقطة boost × حجم المدينة × foreignMul
    days: 10,                  // مهلة الردّ
    lose: [0.40, 0.45, 0.50]   // يفقد اللاعب القيادة إذا نزلت حصته عن هذا (§8.4؛ BOSS_LOSE = 0.40)
  },
  pres: [0, 1, 1.5],           // نفوذ الحضور ÷ D^pres (§8.4: كما هو / ÷D / ÷D^1.5)
  df: { per: [0.10, 0.15, 0.20], cap: [1.4, 2.0, 2.6] }, // بدل DF.per وDF.cap (§8.4)؛ DF.bCap = 72 لا يتغير
  lock: 30                     // مهلة تغيير المستوى (معتمد §11)
});
```
**انحراف واحد عن §8.4 بقصد: `ch.p`.** الجدول كتب 5٪/10٪/18٪ × k في الشهر. وعند `k = 3` (بعد الدولة الثالثة) يعطي ذلك 1.8 و3.6 و6.5 تحدياً في السنة، فيتجاوز أهداف §8.4 نفسها (0–1 / 1–3 / 3–5). القيم أعلاه تعطي `12 × p × 3` = 0.9 و2.2 و4.3، داخل الأهداف. ويُضبط `ch.p` بالقياس (ب7).

## 2) الحرب
### أ) الجدولة (`balWarDay(S)`، تُستدعى في `tick` بعد `shockDay(S)` بسطر `if (BAL.on) balWarDay(S);`)
```js
const balGap = S => BAL.war.gap[balLv(S)] * (1 - BAL.war.spread + 2 * BAL.war.spread * rndB(S));
function balWarDay(S) {
  if (!BAL.on || !shocksOn(S)) return;
  const W = S.balWar || (S.balWar = { next: Math.max(BAL.war.from, S.day) + Math.round(BAL.war.gap[balLv(S)] * rndB(S)) });
  S.wars = S.wars || [];
  for (const w of S.wars.slice()) {
    if (w.st === 'rumor' && S.day >= w.start) balWarStart(S, w);
    else if (w.st === 'on' && S.day >= w.end) balWarEnd(S, w);
  }
  if (S.day < BAL.war.from || S.day < W.next - BAL.war.warn || S.wars.length) return;
  const w = balWarMake(S); W.next = S.day + BAL.war.warn + Math.round(balGap(S));
  if (w) { S.wars.push(w); news(S, balWarRumor(S, w), 'rumor'); }
}
```
- حرب واحدة في وقت واحد (`S.wars.length` شرط).
- **المتوسط:** أول حرب بعد اليوم 354 بمتوسط `gap/2`، وما بعدها بمتوسط `gap`. فالمعدّل البعيد `354 / gap` = 0.5 / 1 / 2 في السنة.
- **أقصر فاصل** `0.5 × 177 = 88` يوماً أطول من أطول حرب مع إشاعتها (45 يوماً)، فلا تتداخل حربان.
- `shocksOn` شرط، كالصدمات: لا حرب قبل المستوى 4 ولا مع `S.noShocks`.

### ب) المنطقة (`balWarMake(S)`، السحوب بهذا الترتيب حرفاً)
```js
const BAL_LAND = (S, x, y) => S.risk[riskKey(x, y)] != null && !(PORTS.includes(x) && PORTS.includes(y));
function balWarMake(S) {
  const border = rndB(S) < 0.5;                                       // سحب 1
  const a = pickOf(S, COUNTRIES.map(c => c.id));                     // سحب 2
  const b = border ? pickOf(S, ADJ[a]) : null;                        // سحب 3 (للحدّ وحده)
  const roads = [];
  for (const x of S.order) for (const y of S.order) if (x < y && BAL_LAND(S, x, y)) {
    const cx = S.cities[x].country, cy = S.cities[y].country;
    if (border ? (cx === a && cy === b) || (cx === b && cy === a) : (cx === a) !== (cy === a)) roads.push([x, y]);
  }
  if (!roads.length) return null;
  const n = Math.min(roads.length, BAL.war.roads[0] + (rndB(S) < 0.5 ? 0 : BAL.war.roads[1] - BAL.war.roads[0])); // سحب 4
  const cut = []; while (cut.length < n) { const i = Math.floor(rndB(S) * roads.length); cut.push(roads.splice(i, 1)[0]); } // سحب لكل طريق
  const [lo, hi] = BAL.war.food, food = Math.round((lo + (hi - lo) * rndB(S)) * 100) / 100;      // سحب
  const dur = BAL.war.dur[0] + Math.floor(rndB(S) * (BAL.war.dur[1] - BAL.war.dur[0] + 1));      // سحب
  const cities = border ? [...new Set(cut.flat())] : S.order.filter(id => S.cities[id].country === a);
  const start = S.day + BAL.war.warn;
  return { id: S.nextId++, kind: border ? 'border' : 'country', a, b, cities, roads: cut, food, st: 'rumor', warn: S.day, start, end: start + dur };
}
```
- **المدن المصابة:** في الحرب على الدولة كل مدنها، وفي الحرب على الحدّ طرفا كل طريق مقطوع وحدهما.
- **الطرق المرشّحة:** في الدولة كل طريق برّي يخرج منها، وفي الحدّ كل طريق برّي بين الدولتين. فإن لم يوجد طريق تُلغى الحرب ويُحسب الفاصل التالي (`return null`).

### ج) البدء والنهاية
```js
function balWarStart(S, w) {
  w.st = 'on';
  for (const id of w.cities) S.cities[id].ev = { k: 'war', left: w.end - w.start, food: w.food };
  for (const id of w.cities) if (S.player.props[id]) balStoreLoss(S, id, 'war');   // 053أ §5ج: الخبر والتكافل و«أين أخسر؟»
  news(S, balWarNews(S, w), 'bad'); interrupt(S, 'balWar');
}
function balWarEnd(S, w) {
  for (const id of w.cities) { const c = S.cities[id]; if (c.ev && c.ev.k === 'war') c.ev = null; }
  S.wars = S.wars.filter(x => x !== w);
  news(S, 'هدأ الاضطراب في ' + balWarWhere(S, w) + ' بعد ' + (w.end - w.start) + ' يوماً، وفُتحت الطرق.', 'good');
}
```
- `c.ev` يُستبدل إن كان فيه حدث آخر (ازدهار أو كساد). وخبر نهاية المبيعات (`pr.hitLost`) يأتي من 053أ §5أ بلا كود جديد.
- **`interrupt` بمفتاح جديد `balWar`:** يُضاف إلى `INTERRUPT_CLASS` بصنف `bossRegain` نفسه.

### د) الآثار (كلها معادلات حرفية)
| الأثر | الموضع | المعادلة |
|---|---|---|
| غلاء الأقوات | `evMul` (`03-prices.js`) | فرع `war`: `G.id === 'tools' ? 1.6 : G.id === 'iron' ? 1.3 : (BAL.on && e.food && (G.ess \|\| G.id === 'wheat' \|\| FOODISH.has(G.id)) ? 1 + e.food : 1)`. بلا `e.food` = الحالي حرفاً |
| قطع الطريق | `shockBlock(S, fromCity, dest)` | بعد حلقة الإغلاق القائمة: `if (BAL.on) for (const w of S.wars ‖ []) if (w.st === 'on') for (const [x, y] of w.roads) if (balOnPath(S, fromCity, dest, x, y)) return 'الطريق بين ' + S.cities[x].name + ' و' + S.cities[y].name + ' مقطوع للاضطراب حتى اليوم ' + w.end + '.';` |
| المسار | `balOnPath` **جديدة** | `const p = routePath(S, from, dest) ‖ [from, dest];` ثم `true` إن وُجد زوج متتالٍ `{p[i], p[i+1]} = {x, y}`. فإن لم تُعِد `routePath` مصفوفة مدن، يُفحص الزوج المباشر وحده ويُذكر ذلك في التقرير |
| مبيعات الدكاكين | `balHitMul` (053أ) | `const k = balHit(S, city); return k ? 1 − (k === 'war' ? BAL.war.hit : BAL.hit)[balLv(S)] : 1;` |
| ترتيب السبب | `balHit` (053أ) | يُنقل سطر `c.ev` إلى أول الدالة **للحرب وحدها**: `if (c.ev && c.ev.k === 'war') return 'war';` ثم بقيتها كما هي |
| تلف المخزن | `balStoreLoss(S, id, 'war')` | كما في 053أ: `BAL.wet[lv]` = 5/10/20٪، والتكافل `balCover` |
| خطر القوافل | `balRisk` (053أ) | ×1.3 / ×1.6 / ×2، بسقف 0.8، من مدينة مصابة أو إليها |
| الحدث القديم | `cityDay` (`11-day.js`) | بعد سطر `const k = …`: `if (BAL.on && k === 'war') {} else { /* الكتلة القائمة كما هي */ }` |

### هـ) النصوص (حرفاً، بلا عنف)
- `balWarWhere(S, w)` = `w.kind === 'border' ? 'الحدّ بين ' + CD[w.a].name + ' و' + CD[w.b].name : CD[w.a].name`.
- **الإشاعة:** «إشاعة: اضطراب يلوح في [المكان] بعد 5 أيام: قد تُقطع طرق وتغلو الأقوات. أتمم ما تريده هناك قبلها.»
- **البدء (`balWarNews`):** «حرب في [المكان] حتى اليوم [end]: انقطع الطريق [س–ص][ و[س–ص]]، وغلت الأقوات [food×100]٪، ومبيعات الدكاكين هناك أقل [hit×100]٪، وطرقها أخطر ×[road].» ويُضاف إليه، إن كان للاعب فيها دكان أو مخزن: « لك فيها: [أسماء المدن].»

## 3) المنافسة بعد القيادة
### أ) نفوذ الحضور ÷ D (`bossesDay`، `05-haggle.js:65`)
```js
let inflow = 0.35 * ns + 0.12 * nw + Math.min(2, bs.dsales / 1500);
if (BAL.on && BAL.pres[balLv(S)] > 0) inflow /= Math.pow(diffD(S), BAL.pres[balLv(S)]);
if (pactIn(S, id, 'alliance')) inflow += 0.5;        // التحالف لا يُقسَم (يبقى طريقاً للتوسع)
```
- السطر الأوسط وحده جديد. `D = diffD(S)` القائمة، ومعها خصم التحالفات (`DF.ally`).
- **الحساب:** النفوذ المستقر `50 × inflow`. فعلى المتوسط عند `D = 2`: ثلاثة دكاكين وثلاثة مخازن ومبيعات كاملة تعطي `50 × 3.41 / 2 ≈ 85`، أي دون عتبة الخلع 88 أمام زعيم نفوذه 72. فيحتاج ما بعد الدولة الأولى مناورة أو تحالفاً أو اتفاقيات (§8.4).

### ب) `D` بالمستوى (`diffD`، `30f-difficulty.js`)
- `raw = Math.min(BAL.on ? BAL.df.cap[lv] : DF.cap, 1 + (BAL.on ? BAL.df.per[lv] : DF.per) × diffK(S))`، والباقي كما هو.
- ويُطبَّق الاستبدال نفسه في `difficultyView` (`raw` و`capped`).
- `DF.bCap` و`DF.react` و`diffTrustExtra` بلا تغيير، وسقفها `trustMax = 12` يبقى.

### ج) حدّ فقد القيادة
- `balLose(S) = BAL.on ? BAL.ch.lose[balLv(S)] : BOSS_LOSE`.
- يحلّ محل `BOSS_LOSE` في شرط `bs.ruler === 'player' && share < BOSS_LOSE` (`05-haggle.js:81`) وحده.
- ويُضاف إلى خبر الاستعادة القائم حين `BAL.on`: « (نزلت حصتك إلى X٪، والحدّ Y٪)».

### د) التحدّي الشهري (`balChDay(S)`، يُستدعى في `bossesDay` بعد حلقة المدن: `if (BAL.on) balChDay(S);`)
```js
function balChDay(S) {
  const C = S.balCh;
  if (C && S.day >= C.end) return balChSettle(S, 'leave', true);                 // انقضت المهلة = تركه
  if (C || S.day <= 0 || S.day % 30 !== 0 || !dfOn(S)) return;
  const led = S.order.filter(id => S.bosses[id] && S.bosses[id].ruler === 'player');
  if (!led.length) return;
  const lv = balLv(S), p = Math.min(BAL.ch.pMax, BAL.ch.p[lv] * diffK(S));
  if (rndB(S) >= p) return;                                                        // سحب 1
  const city = led[Math.floor(rndB(S) * led.length)], c = S.cities[city], bs = S.bosses[city];   // سحب 2
  const [lo, hi] = BAL.ch.boost, boost = Math.round(lo + (hi - lo) * rndB(S));     // سحب 3
  const cost = Math.round(BAL.ch.cost[lv] * boost * c.size * foreignMul(S, c));
  S.balCh = { city, who: balChWho(S, city), boost, cost, day: S.day, end: S.day + BAL.ch.days };
  news(S, balChNews(S), 'bad'); interrupt(S, 'balCh');
}
```
- `balChWho(S, city)`: اسم أول منافس حيّ في المدينة (`(S.rivals ‖ []).find(r => r.out == null && r.city === city).name`)، وإلا `S.rival.name`، وإلا `S.bosses[city].name`. **يتحقق المنفّذ** من اسم الحقل في `15b-rival-gen.js`.
- `interrupt` بمفتاح `balCh`، بصنف `bossRegain`.

### هـ) الردّ (`A.balChAnswer(S, how)`، `how ∈ {'pay', 'leave'}`)
```js
function balChSettle(S, how, auto) {
  const C = S.balCh; if (!C) return NO('لا تحدّي قائماً.');
  const bs = S.bosses[C.city], c = S.cities[C.city];
  if (how === 'pay') {
    ctxFor(S, C.city); if (S.player.gold + 1e-9 < C.cost) return NO('رصيدك لا يكفي (' + fmtN(C.cost) + ').');
    const r = mfOn(S) ? fundDonate(S, C.city, C.cost) : (pPay(S, 'marketDefend', C.cost, true), OK(''));
    if (r.ok === false) return r;
    S.balCh = null; news(S, 'ثبّتَّ سوق ' + c.name + ' أمام ' + C.who + ': ' + fmtN(C.cost) + (mfOn(S) ? ' في صندوق السوق.' : ' حملة عروض للزبائن.'), 'good');
    return OK('ثبّتَّ السوق.');
  }
  const s0 = bossShare(bs); bs.b = clamp(bs.b + C.boost, 5, 120); const s1 = bossShare(bs); S.balCh = null;
  news(S, (auto ? 'انقضت مهلة الردّ: ' : '') + C.who + ' نافسك في سوق ' + c.name + ': حصتك ' + Math.round(s0 * 100) + '٪ ← ' + Math.round(s1 * 100) + '٪' + (s1 < balLose(S) ? '، دون حدّ القيادة ' + Math.round(balLose(S) * 100) + '٪.' : '.'), 'bad');
  return OK('تركتَه.');
}
A.balChAnswer = (S, how) => balChSettle(S, how === 'pay' ? 'pay' : 'leave', false);
```
- فقد القيادة نفسه يقع في `bossesDay` التالي بالشرط القائم (§3ج)، فلا مسار ثانٍ.
- ويتراجع `bs.b` بعدها نحو هدفه بـ5٪ يومياً كما هو.
- **الحساب** (سوق حجمها 1.3، متوسط، `boost = 20`): `cost = 500 × 20 × 1.3 = 13,000` ريال. وإن كان `p = 100` و`b = 80`: الحصة `100/180 = 56٪` تصير `100/200 = 50٪`، فتبقى القيادة على المتوسط (0.45) وتضيع على العالي (0.50). وإن كان `p = 85` (بعد §3أ): `85/185 = 46٪` تصير `85/205 = 41٪`، فتضيع على المتوسط.
- **فئة `marketDefend`:** تضاف إلى فئات الدفتر و`LN` (`12-screen-cities.js`) بنص «تثبيت سوق أمام منافس».

## 4) مُختار الصعوبة عند البدء وتغييره أثناء اللعب
### أ) المحرك
```js
const BAL_DIFFS = ['calm', 'normal', 'hard'];
const balDiffLeft = S => BAL.on && S.diffDay != null ? Math.max(0, BAL.lock - (S.day - S.diffDay)) : 0;
function balDiffPreview(S, k) {                       // الأسواق التي تنزل حصتها عن حدّ المستوى k
  const lose = BAL.ch.lose[BAL_DIFFS.indexOf(k)];
  return S.order.filter(id => { const bs = S.bosses && S.bosses[id]; return bs && bs.ruler === 'player' && bossShare(bs) < lose; }).length;
}
A.setDiff = (S, k) => {
  if (!BAL_DIFFS.includes(k)) return NO('مستوى غير معروف.');
  if (!BAL.on) { S.diff = k === 'normal' ? undefined : k; return OK(''); }     // المطفأ = السطر القائم في 16-events.js:282 حرفاً
  const cur = S.diff || 'normal'; if (k === cur) return OK('');
  const start = !(S.learn && S.learn.char);                                    // قبل اختيار الشخصية = اختيار البدء
  const left = start ? 0 : balDiffLeft(S);
  if (left > 0) return NO('تستطيع تغيير المستوى بعد ' + left + ' يوماً (اليوم ' + (S.diffDay + BAL.lock) + ').');
  S.diff = k === 'normal' ? undefined : k; if (!start) S.diffDay = S.day;
  return OK('المستوى الآن: ' + BAL_LV[BAL_DIFFS.indexOf(k)] + '.');
};
```
- `balView(S)` (053أ) يُوسَّع لكل مستوى: `war: 354 / BAL.war.gap[lv]` (حرب في السنة)، و`chYear: 12 × BAL.ch.p[lv] × 3` (تحديات في السنة بعد الدولة الثالثة)، و`lose: BAL.ch.lose[lv]`.
- وتُصدَّر كل الدوال في `31-api.js`.

### ب) الواجهة
- **عند البدء:** في `beatsOf` (`02-learn.js:96`) تُضاف خطوة `{ diffpick: true }` بعد `{ startpick: true }` **حين `BAL.on` فقط**. وفي `beatHTML` بطاقتها:
  - قول عمّ سالم: «كيف تحب أن تكون الطريق يا ولدي؟ تستطيع تغييرها لاحقاً من دفتري، مرة كل 30 يوماً.»
  - ثلاث بطاقات `char` بأسماء `BAL_LV`، في كل منها من `balView`: «أول دكان X · إيجار Y٪ في السنة · الكوارث −Z٪ من مبيعات المدينة · حرب كل N · التكافل W٪ · تفقد قيادة السوق دون V٪».
  - وزر `data-act="ldiff" data-g="calm|normal|hard"` يستدعي `A.setDiff` ثم `lseq(s => { s.i++; })` كما يفعل `lstart`.
  - **المبدئي المظلَّل:** `normal`.
- **أثناء اللعب:** بطاقة «مستوى الصعوبة» القائمة (`02-learn.js:488`) حين `BAL.on`:
  - الأسماء من `BAL_LV`؛
  - والوصف من `balView` للمستوى المختار؛
  - وسطر القفل: «تستطيع تغييره بعد N يوماً» حين `balDiffLeft > 0`، والأزرار الأخرى `disabled`.
- **التأكيد:** الضغط على مستوى آخر يفتح `ask` (037) بنص: «من [الحالي] إلى [الجديد]: أول دكان X ← Y، والإيجار Y٪، وتفقد قيادة N سوقاً حالاً (`balDiffPreview`). ولا تغيّره بعدها 30 يوماً.» ثم `A.setDiff`.
- **المطفأ:** البطاقة والنص والسلوك القائم حرفاً، و`case 'diff'` يستدعي `A.setDiff` الذي يعيد السطر القديم نفسه، والتوست كما هو.
- **اللاعب الآلي** (`17-dev-autopilot.js`): يضغط `ldiff` بـ`normal` إن ظهرت.

## 5) العرض: كل رقم ومكانه (لا صوري، والوصول ≤ نقرتين)
| ما يظهر | الرقم | أين يراه اللاعب |
|---|---|---|
| إشاعة الحرب، وبدؤها بأرقامها، ونهايتها | `w.food`، `w.roads`، `BAL.war.hit`، `BAL.road`، `w.end` | الأخبار، وتنبيه `balWar` |
| سطر «حرب في X حتى اليوم N: الطريق س–ص مقطوع · الأقوات +Z٪ · دكاكينك هناك −50٪ (خسرتَ منها Y)» | `balWarView(S)` **جديدة**: `{ where, end, roads, food, hit, mine: [{ city, lost: pr.hitLost }] }` | «حال أعمالي» في الرئيسية (`hsView` يضيف `war`)، سطر يُضغط فيفتح المدينة: نقرة |
| رفض السفر «الطريق بين س وص مقطوع للاضطراب حتى اليوم N» | `shockBlock` | زر السفر في صفحة القافلة (المسار القائم لرسالة الإغلاق) |
| تلف المخزن والتكافل | `balStoreLoss` | الخبر و«أين أخسر؟» (`LN.war` من 053أ) |
| بطاقة التحدّي: «[المنافس] ينافسك في سوق X: إن تركتَه فحصتك A٪ ← B٪ (تفقد القيادة دون C٪). ثبّته بـY في صندوق السوق. باقٍ N أيام» وزرّا «ثبّت (Y)» و«اتركه» | `balChView(S)` **جديدة**: `{ city, name, who, boost, cost, left, share, after, lose, fund: mfOn(S) }`، و`after = p / (p + min(120, b + boost))` | «حال أعمالي» ← «المطلوب» (نقرة)، وتنبيه `balCh` |
| خبر الردّ أو انقضاء المهلة، وفئة `marketDefend` | `balChSettle` | الأخبار، و«أين أخسر؟» |
| خبر فقد القيادة بالحصة والحدّ | `balLose` | الخبر القائم، و`interrupt('bossRegain')` القائم |
| `D` وحدّه في بطاقة الصعوبة 021 | `difficultyView.raw/D/capped` بـ`BAL.df` | مكانها القائم |
| مُختار البدء ووصف المستويات | `balView` | خطوة `diffpick` في البداية |
| مستوى الصعوبة والقفل وأثر التغيير | `balView`، `balDiffLeft`، `balDiffPreview` | بطاقة الدفتر القائمة (الرئيسية ← الملف: نقرة) |

**قاعدة ظهور الاختيار:** في المُختارين يظلَّل الزر المختار (`on` + `aria-pressed="true"`)، ويُعاد رسم الوصف بأرقامه بعد كل نقر.

## 6) خطة القياس والضبط (`tools/balance-measure.js`)
**توسيع الأداة** (بعد توسيع 053أ؛ لا تغيّر `src/`):
- **`--war on|off`:** المطفأ يجعل `balWarDay` لا يعمل في الأداة وحدها بـ`E.BAL.war.from = Infinity`، للمقارنة.
- **`--ch pay|leave|mix`:** سياسة اللاعب الآلي في التحدّي.
  - `pay`: يدفع إن كان `gold − res ≥ cost`؛
  - `leave`: لا يردّ؛
  - `mix`: يدفع إن كان `after < lose`، وإلا يترك.
- **`--switch hard@D`:** تغيير المستوى في اليوم `D` بـ`A.setDiff`. يخرج رفض التغيير الثاني قبل 30 يوماً وقبوله بعدها.
- **المخرجات الجديدة لكل بذرة:**
  - الحروب: العدد في كل سنة، وأيامها، والطرق المقطوعة.
  - خسائر الحرب: `hitLost` في مدنها، و`led.exp.war`، وتعويض التكافل.
  - رحلات رُفضت بسبب الحرب.
  - التحديات: العدد في كل سنة، وما دُفع وما تُرك.
  - الأسواق المفقودة في كل سنة.
  - يوم أول سوق مقاد، ويوم أول دولة كاملة، ويوم الدول الخمس.
  - حلقات التراجع ≥10٪ و≥20٪.
- **`--years 8`** لأهداف الدول الخمس، و**`--years 5`** لما سواها.

**الأهداف** (12 بذرة لكل مستوى، `BAL.on`، بعد ضبط 053أ). كل رقم يُكتب في `report-b.md`:

| # | المقياس | مبتدئ | متوسط | عالٍ | المقبض |
|---|---|---|---|---|---|
| ب1 | حروب في السنة (السنوات 2–5، كل البذور) | 0.35–0.65 | 0.8–1.2 | 1.6–2.4 | لا يُضبط (`gap` معتمد)؛ خروجه = خلل في الجدولة |
| ب1أ | حروب في السنة الأولى | 0 | 0 | 0 | — |
| ب2 | أثر الصدمات والحرب على دخل السنة، دولة واحدة بلا تكافل (`invest` مفعّلة ÷ مطفأة − 1) | −1 إلى −4٪ | −3 إلى −8٪ | −6 إلى −15٪ | `BAL.war.hit` ثم `BAL.war.food` (±50٪ من قيمهما) |
| ب2أ | الأثر نفسه، موزَّع على 3 دول بتكافل | ≈ نصف ب2 (0.3–0.7 منه) | ≈ نصف ب2 | ≈ نصف ب2 | لا يُضبط؛ يُبلَّغ |
| ب3 | بذور فيها حلقة تراجع ≥10٪ في 5 سنوات | يُبلَّغ | ≥ 7 من 12 | ≥ 7 من 12 بحلقة ≥20٪ | `BAL.war.hit` و`ch.boost` |
| ب4 | يوم أول سوق مقاد (وسيط) | 120–180 | 200–300 | 300–450 | `BAL.pres[lv]` ثم `BAL.df.per[lv]` |
| ب5 | يوم أول دولة كاملة (وسيط) | ≤ 354 | 355–708 | 709–1062 | `BAL.df.per[lv]` و`BAL.df.cap[lv]` |
| ب6 | بذور بلغت الدول الخمس (8 سنوات) | كلها بنهاية س3 | بين س5 وس6 في الوسيط | ≤ 3 من 12 (بلا مناورة) | `BAL.pres[lv]` |
| ب7 | تحديات في السنة بعد الدولة الثالثة (`--ch leave`) | 0–1 | 1–3 | 3–5 | `BAL.ch.p[lv]` |
| ب8 | أسواق مفقودة في السنة بعد الدولة الثالثة: `leave` ÷ `pay` | يُبلَّغ | `pay` ≤ 0.3 من `leave` | يُبلَّغ | `BAL.ch.cost` (إن لم يستطع الدفع) |
| ب9 | التحدّي مدفوع ÷ ثروة السنة (`--ch pay`) | يُبلَّغ | 1–5٪ | يُبلَّغ | `BAL.ch.cost[lv]` |
| مؤشر | النقد العاطل ÷ الثروة في س5 | يُبلَّغ | يُبلَّغ | يُبلَّغ | — |

**ترتيب الضبط** (كل خطوة بعد استقرار ما قبلها):
1. ب1 (تحقق فقط).
2. ب4، ثم ب5، ثم ب6.
3. ب7، ثم ب8 وب9.
4. ب2، ثم ب3.

**قواعد الضبط:**
- لا يُمسّ رقم معتمد في §11: `gap` و`lock` و`from`، ونسب 053أ المعتمدة.
- **النطاقات المسموحة:** `pres` في [0، 2]؛ `df.per` في [0.08، 0.30]؛ `df.cap` في [1.3، 3]؛ `ch.p` في [0.01، 0.25]؛ `ch.cost` ±50٪؛ `war.hit` في [0.25، 0.75]؛ `war.food` في [0.2، 0.8].
- إن احتاج مقبض أن يخرج من نطاقه، يتوقف المنفّذ ويكتب السبب، ولا يُكمل.
- القيم النهائية تُكتب في `BAL`، والناتج الخام في `specs/053-economy-balance/measure-b.json`.
- **الوقت:** 3 مستويات × 12 بذرة × 5 سنوات بالتوازي، ثم 8 سنوات لـب6 مرة واحدة على القيم النهائية.

## 7) القبول
**`test/bal-b.test.js` (جديد، محرك):**
- **(أ) المطفأ:**
  - `newGame(7)` + 420 يوماً بـ`BAL.on = false` ولكل `S.diff`: `netWorth` و`gold` وعدد الأخبار = بصمة تُلتقط من `main` قبل التعديل. والمدة تتجاوز `BAL.war.from` وأربعة عشر شهراً من التحدّي.
  - `JSON.stringify(save)` بلا `wars` ولا `balWar` ولا `balCh` ولا `diffDay` ولا `food`.
  - `A.setDiff(S, 'hard')` ثم `'calm'` في اليوم نفسه: كلاهما ينجح، كما اليوم.
  - مدينة فيها `c.ev = { k: 'war', left: 5 }` (القديم): `evMul` كما اليوم.
- **(ب) الجدولة:**
  - بـ`BAL.on` و`shocksOn`: لا حرب تبدأ قبل اليوم 355.
  - على بذرة ثابتة 10 سنوات لكل مستوى: عدد الحروب ÷ 9 سنوات في [0.3، 0.7] / [0.7، 1.3] / [1.5، 2.5].
  - لا حربان في وقت واحد قط.
- **(ج) آثار الحرب** على حرب مصنوعة باليد (`S.wars = [w]` و`balWarStart`):
  - `evMul` للقمح = `1 + w.food`، وللحرير 1، وللأدوات 1.6.
  - `shockBlock` يرفض الطريق المقطوع ويقبل غيره.
  - `balHitMul` = `1 − BAL.war.hit[lv]`.
  - نقص المخزن = `BAL.wet[lv]` بالضبط، وخبره ومعه `led.exp.war`.
  - `roadEstimate.attack` = `min(0.8, raw × BAL.road[lv])`.
  - وبعد `balWarEnd`: `c.ev = null` والطريق مفتوح.
- **(د) الحضور:** مدينة بدكان واحد ومخزن واحد، و`D = 2` مصنوع بأسواق مقادة:
  - `bs.p` بعد يوم = `p0 × 0.98 + 0.47 / 2^pres[lv]` (±1e-9، بلا مبيعات ولا تحالف، و`bossDayMul = 1`).
  - ومع تحالف: يضاف `0.5` غير مقسوم.
- **(هـ) الحدّ:** حصة 0.47: تبقى القيادة على مبتدئ ومتوسط، وتضيع على عالٍ في `bossesDay` التالي.
- **(و) التحدّي:**
  - بإجبار `rndB` (حقن دالة في الاختبار): يُنشأ في يوم مضاعف لـ30 فقط، ولا يُنشأ بلا سوق مقادة.
  - `cost` = معادلته.
  - `pay` بلا رصيد يُرفض. و`pay` برصيد: الصندوق يزيد `cost` (أو الدفتر `marketDefend`)، و`bs.b` بلا تغيير.
  - `leave`: `bs.b` يزيد `boost` (بسقف 120)، والخبر يحمل الحصتين.
  - انقضاء المهلة = `leave`.
- **(ز) المستوى:**
  - قبل اختيار الشخصية: يتغير بلا `diffDay`.
  - بعده: الأول ينجح ويكتب `diffDay`، والثاني قبل 30 يوماً يُرفض بالرسالة وعدد الأيام، وفي اليوم 30 ينجح.
  - الضغط على المستوى نفسه لا يكتب شيئاً.
  - `balDiffPreview` يعدّ الأسواق تحت الحدّ.
  - **لا إعادة تقييم:** شراء ثم تغيير، فلا يتغير `bk` ولا الرصيد.
- **(ح) لا سحب عشوائي جديد بالمطفأ:** عدد استدعاءات `rnd/rndB` في 420 يوماً بالمطفأ = بلا الجزء.

**`test/bal-b-ui.test.js` (390 و1100، `BAL.on = true`):**
- خطوة `diffpick` تظهر بعد اختيار الدولة. بعد النقر عنصر `on` واحد، والوصف يحمل ثمن أول دكان للمستوى.
- بطاقة الدفتر تُظهر القفل بعد تغيير، والأزرار `disabled`، ونص «بعد N يوماً».
- سطر الحرب في «حال أعمالي» بأرقامه.
- بطاقة التحدّي بالحصتين والثمن، والنقر على «ثبّت» يخفيها ويخصم الرقم.
- لا تمرير أفقي.
- وبـ`BAL.on = false`: لا خطوة `diffpick`، وبطاقة الدفتر بنصها القديم حرفاً.

**المفاتيح:**
- `BAL.on = false` مثبَّت (من 053أ) في `skill` و`skill-b` وسكربتات الالتقاط.
- `test/difficulty*` (021) ناجحة بلا تعديل في أرقامها.

**ناجحة بلا تعديل في أرقامها:**
- قائمة 053أ كلها.
- `bal-a`.
- `difficulty`.
- `shocks` (إن وُجد).
- `bosses`.
- `market-fund`.
- `rival-gen`.
- `home-status-ui`.

**أخرى:**
- **حجم الصفحة** في التقرير.
- **`CHANGELOG`:** `- [مبرمج] 2026-11-16: 053ب الحرب حدثاً إقليمياً بلا قتال، وتحدّي المنافسين للأسواق المقادة، ونفوذ الحضور ÷ D، ومُختار الصعوبة عند البدء ومهلة 30 يوماً، خلف BAL.on (مطفأ).`
- **`docs/goals/WORLD.md` §3:** سطر الاستثناء (القرار 9).

## خارج النطاق (053ج إن لزم، بقرار)
- إصلاح `botMain`.
- أجور القادة وصيانة المباني.
- البسطة.
- دخل المصانع والمزارع في المدينة المصابة.
- ردّ التحدّي بالخدمة أو بنقاط النفوذ (المتاح هنا: المال أو الترك، أو رفع الحضور والتحالف بالأدوات القائمة).
- أي صورة جديدة للحرب.
- أي نص ديني.
- أي تغيير في صيغة التمليك أو الزكاة أو الشرط الجزائي.
