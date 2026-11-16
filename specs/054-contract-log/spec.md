# 054 — سجل العقود المنتهية (Opus، 2026-11-16)

**الأصل:** `docs/plan/COMMITMENTS.md` §3 البند 14 (بن محمود 2026-11-15)، والقياس `measure.md` في هذا المجلد (يُقرأ أولاً؛ أرقام المواضع منه).
**ليست حساسة:** عرض لما حدث. لا شرط جزائي ولا تعويض ولا زكاة جديدة، ولا نص ديني، **ولا تغيير لأي رقم في الاقتصاد**: كل ما يُضاف عدّادات تقرأ قيماً تُحسب أصلاً (§8 اختبار التطابق). قاعدة «لا قوائم منسدلة» بلا استثناء: لا `<select>` ولا `<details>` ولا طيّ في المكان. لا أيقونة جديدة.
**تعتمد على:** 037 (`dsheet`، `dchip`)، 042 (`hsView`، صف «حال أعمالي»)، 051 (`winScan`)، 040د (`rvpGet`). **لا تعتمد على 052/053**؛ وإن دخلتا `main` قبلها فلا تعارض (ملفاها `30l-*` و`06t-*`).

## 1) المفتاح والحقول
ملف محرك جديد `src/engine/30m-clog.js` (بعد `30l-*` وقبل `31-api.js`) وملف واجهة `src/ui/06u-clog.js` (بعد `06t-*`/`06s-brief.js`).
```
CLOG = { on:true, max:100, page:10, why:120 }
```
- **`CLOG.on = false` ⇒ السلوك الحالي حرفاً بلا حقل جديد في الحفظ:** الكنس والنداءات والعدّادات تعود فوراً، ولا صف في «حال أعمالي» ولا زرّ في الاتفاقيات. **`P.agrLog` و`mfgLog` لا يُمسّان في الحالتين** (واجهة 040د تقرؤهما).
- حقول الحفظ الجديدة (كلها مع المفتاح المضاء، تُنشأ عند أول حاجة، والحفظ القديم بلا ترحيل):
  - `P.clog` مصفوفة ≤ `CLOG.max` سطر (§2)، و`P.clogY` مجاميع سنوية دائمة (§4).
  - عدّادات على العقد **الحيّ** (تختفي بانتهائه): `svT, brk` (export)، `cg, vout` (import)، `gv` (salam)، `cb` (wakala)، `bk` (ist)، `vout` (raw)، `pd` (عقود الزعماء)، `cl0` (عقد قائم يوم أول تفعيل)؛ والجزء ب: `bn, tp, tq` (الزعماء)، `rq` (raw)، `tT, sT` (pass/fran).
- تُثبَّت `CLOG.on = false` في `test/skill.test.js` و`test/skill-b.test.js` و`scripts/capture-*.js` الثلاثة وأي اختبار بصمة قديم.
- التصدير في `31-api.js`: `CLOG, CL_GRP, CL_WHY, clogBegin, clogEnd, clogAct, clogLoan, clogRec, clogView, clogTot`؛ وسطر لكلٍّ من الملفين في `src/README.md`.

## 2) السطر الموحّد
```
{ k, c, h, w, d0, d, why, cap, out, in, n, u, o, g, tr, r }
k   : مفتاح النوع: مفتاح P.agr كما هو (export … book) | 'p:'+pc.type للزعماء | 'loan'
c,h : مدينة الطرف ومنزلك (ag.city, ag.home | pc.city, — | S.home)
w   : اسم الطرف إن لم يُشتق: ag.rname (rmud/rpart) | sy.name (كفيل) | غائب للباقي (يُشتق bossOf(S,c).name ثم BOSS_NAMES[c])
d0,d: يوم البدء (ag.since | pc.since | o.day) ويوم الانتهاء S.day
cap : رأس المال أو الالتزام (§3-أ)   out: ما دفعتَ   in: ما قبضتَ أو وفّرتَ
n   : in − out          (u = 1 ⇒ n = null: أثر غير مقيس بالريال، يُعرض «كلفة out»)
o   : 1 إن كان العقد قائماً يوم أول تفعيل (ag.cl0): «الأرقام منذ التفعيل»
g   : مفتاح السلعة إن وُجد (ag.goods)    tr: ما جرى للتجارة (§3-ب)    r: ag.led.why مقصوصاً إلى CLOG.why حرفاً
```
كل رقم `Math.round`. السنة لا تُحفظ في السطر: `y = dateOf(S, d).year` (`16b-calendar.js:25`).

## 3) المعادلات لكل نوع (حرفاً)
### أ) المال
| k | cap (وعنوانه) | out | in | العدّاد الجديد وموضعه (كلٌّ داخل `if (CLOG.on)`) |
|---|---|---|---|---|
| export | `qty × INFLU.periods` («التزمتَ») | `(ag.dmg‖0) + (ag.brk‖0)` | `ag.svT‖0` («وفّرتَ من الجمارك») | `agrCustomsNote` بعد سطر `ag.saved`: `ag.svT = (ag.svT‖0) + (full − now) × (natMul == null ? 1 : natMul)` بشرط `full > now`؛ و`breakAgr` بعد `payPenalty`: `ag.brk = pay` |
| import | `qty × INFLU.periods` | `ag.vout‖0` | `(ag.vout‖0) + (ag.cg‖0)` | `agrAccept` بعد `addBasis`: `ag.vout = (ag.vout‖0) + cost; ag.cg = (ag.cg‖0) + n × (unitPrice(c, ag.goods) − b.unit) − b.cust × (n / b.qty)` (بعد إنقاص المخزون، كمعادلة `raw.gain` القائمة) |
| salam | `ag.cap` («ثمن السلم») | `ag.cap` | `(ag.gv‖0) + ag.cap × (ag.qty − ag.got) / ag.qty` | `salamSettle` داخل `if (n > 0)` **قبل** `c.stock[g] -= n`: `ag.gv = (ag.gv‖0) + n × unitPrice(c, g)` |
| mud | `ag.cap` | `ag.cap` | `mudValue(ag)` | لا شيء |
| wakala | `ag.qty` («أقصى ما تضعه») | `ag.cb‖0` | `ag.proceeds` | `wakalaDay`: `const tb = takeBasis(ag.basis, g, res.n); ag.cb = (ag.cb‖0) + tb` (يستبدل النداء القائم بلا قيمة، **والنداء نفسه باقٍ مضاءً ومطفأً**)؛ و`wakalaEnd` قبل `sellUnits` الأخير: `const av = avgCost(ag.basis, g) ‖ 0` ثم بعده: `ag.cb = (ag.cb‖0) + res.n × av` |
| ist | `ag.price` («الثمن») | `ag.paid` | `ag.ref × ag.q × ag.got + (ag.bk‖0)` | `ag.bk = (ag.bk‖0) + X` حيث يُضاف إلى `P.gold`: الردّ لعدم المكان (`back`) في `istDeliver`، والتعويض `dmg` في `istDeliver`، و`Math.max(0, back)` في `istCancel`، و`back` في `mfgClose` |
| raw | `qty × INFLU.raw.periods` | `ag.vout‖0` | `(ag.vout‖0) + (ag.gain‖0)` | `rawAccept` (النمطان): `ag.vout = (ag.vout‖0) + cost`؛ وكل ردّ `back` في `rawDay` و`mfgClose`: `ag.vout = (ag.vout‖0) − back` |
| part, rpart | `ag.K` («رأس مال المصنع») | `ag.led.act` (ما دفعتَه لشراء حصة الشريك) | `ag.boss + Math.max(−ag.K, ag.pnl‖0)` | لا شيء. *(تخالف `agrLog` لـpart عمداً: measure §4)* |
| rmud | `ag.cap` | `ag.cap` | `ag.led.act` (ما عاد إليك) | لا شيء |
| pass, safe, fran, book | pass `ag.trips` («رحلات في الشهر»)، safe `ag.fee` («لكل رحلة»)، fran `ag.qty` («حد التعبئة»)، book `ag.cap` | `ag.tot.out` | `ag.tot.in` | لا شيء (`rdMove` يقيس كل ريال) |
| p:* (الزعماء) | `pc.daily × pc.total` («الرسوم المتفق عليها»؛ والمقدَّم داخل out) | `pc.pd‖0` | الجزء أ: `null` و`u = 1`؛ الجزء ب §7 | `signPact`: يُدفع الحقل مع السجل `pd: t.upfront > 0 ? t.upfront : 0`؛ `bossesDay` (`05-haggle.js:99`): `const pd = pPay(S, 'pact', pc.daily, true); pc.pd = (pc.pd‖0) + pd`؛ وكل `oldPactFine(S, pc)` (`05-haggle.js:77`، `:95`، `24-advisor-actions.js:717`): `pc.pd = (pc.pd‖0) + ` قيمته المعادة |
| loan | `o.amt` («أقرضتَ») | `f.lent` | `f.amt + (f.rest‖0)` | لا عدّاد؛ §5 |

`‖` تعني `||` في الشيفرة. **القرض لا ربح فيه أبداً** (`n ≤ 0`): الردّ الكامل `n = 0`، والضياع والإبراء `n = −lent`، وبيع الرهن `n = take + rest − lent = 0` لأن `rest = amt − take` ثم يُكتب للباقي `rest` سطر مستقل عند انتهائه.

### ب) ما جرى للتجارة `tr` (من حقول قائمة؛ ويُكمَّل في الجزء ب)
| k | tr | القالب (في الواجهة) |
|---|---|---|
| export | `q = Σ hist.exp, a = Σ hist.act, s = Σ max(0, exp − act)` | «التزمتَ {q} وحدة من {g}، بعتَ {a}، والناقص {s}» (يكفي `hist ≤ 6` لأن الأشهر 3) |
| import | `q = Σ hist.exp, a = Σ hist.act` | «عُرض عليك {q} وحدة، قبلتَ {a}» |
| salam, book, ist | `q = qty, a = got, s = qty − got` | «طلبتَ {q} وحدة من {g}، استلمتَ {a}»، وإن `s > 0`: «، ولم يُسلَّم {s} فرُدّ ثمنه» |
| wakala | `q = sent, a = sold, s = sent − sold` | «سلّمتَ وكيلك {q} وحدة، باع {a}، ورُدّ إلى مخزنك {s}» |
| mud, rmud | `q = ag.days, a = ag.up, s = ag.dn` | «{q} يوماً: صعدت الأسعار {a} يوماً وهبطت {s}» |
| part, rpart | `a = Math.round(Math.max(−K, pnl)), s = Math.round(share × 100)` | «ربح المصنع {a} (خسارته إن سالباً)، وحصة الشريك {s}٪» |
| safe | `q = ag.trips, a = ag.saves, s = ag.claims` | «{q} رحلة مشمولة، صدّ الحرّاس {a} مرة، وعوّضك الصندوق {s} مرة» |
| pass, fran, raw, p:* | الجزء ب §7 | — |
| loan | `q = lent, a = amt (المردود)` | «أقرضتَ {q}، ورُدّ إليك {a}» + `lpSaleText(f)` إن `ok = 3` |
وتحت القالب سطر `r` (آخر سبب كتبه العقد بنفسه) إن لم يكن فارغاً.

### ج) سبب الانتهاء `why` (رمز؛ النص في `CL_WHY`)
تُفحص بالترتيب، و`R` سبب ممرَّر من غلاف إجراء (§4):
1. `R` إن وُجد.
2. **الزعماء:** `pc.left ≤ 0` ⇒ `term`؛ وإلا `bossOf(S, pc.city).ruler === 'player'` ⇒ `ruled`؛ وإلا `fail` (عجز عن الرسم).
3. **P.agr:** (أ) `(part|rpart) && ag.gone` ⇒ `gone`؛ (ب) `RPK[k] && ag.left > 0 && (!rv || rv.out != null)` حيث `rv = rvpGet(S, ag.rid)` ⇒ `gone`؛ (ج) `ag.left > 0`: `!bossOf(S, ag.city)` ⇒ `gone`، و`!RPK[k] && bossOf(S, ag.city).ruler === 'player'` ⇒ `ruled`، و`ROAD_KINDS[k] && !roadLive(k)` ⇒ `off`، وإلا `other`؛ (د) `(salam|book|ist) && ag.got < ag.qty` ⇒ `fail`؛ (هـ) `term`.
4. **القرض** (§5): `ok` 1 ⇒ `paid`، 0 ⇒ `lost`، 2 ⇒ `forg`، 3 ⇒ `pledge`، 4 ⇒ `sur`.
```
CL_WHY = { term:'أتمّ أجله', brk:'فسختَه', buy:'اشتريتَ حصة الشريك قبل الأجل', wd:'سحبتَ مالك قبل الأجل',
  fail:'تعثّر التنفيذ', gone:'زال الطرف أو المصنع', ruled:'حكمتَ سوق الطرف الثاني', off:'أُوقف العقد', other:'انتهى',
  paid:'ردّ القرض', lost:'ضاع القرض', forg:'سامحتَ صديقك', pledge:'بِعتَ الرهن', sur:'دفع الكفيل' }
```

## 4) الكنس (كيف يُكتب كل سطر بلا مسّ نقاط الانتهاء)
```
const CL_LIVE = new WeakMap()                       // S → { a: Set(عقود P.agr), p: Set(P.pacts) } ؛ خارج S فلا يُحفظ
clogSweep(S, R):
  if (!CLOG.on || !S.player) return; const P = S.player, m = CL_LIVE.get(S)
  if (!m) { if (!P.clog) { P.clog = []; P.clogY = {}; for (const x of (P.agr‖[]).concat(P.pacts‖[])) x.cl0 = 1 }
            CL_LIVE.set(S, { a: new Set(P.agr‖[]), p: new Set(P.pacts‖[]) }); return }   // أول مرة: تهيئة بلا كتابة
  for (const ag of m.a) if (!(P.agr‖[]).includes(ag)) clogRec(S, ag, false, R)
  for (const pc of m.p) if (!(P.pacts‖[]).includes(pc)) clogRec(S, pc, true, R)
  m.a = new Set(P.agr‖[]); m.p = new Set(P.pacts‖[])
clogBegin(S) = clogSweep(S, null)   // أول سطر في tick (11-day.js:10) قبل S.day++
clogEnd(S)   = clogSweep(S, null)   // آخر سطر في tick بعد lifeDay(S)
```
- **أغلفة الإجراءات** (في `30m-clog.js` بعد تعريفها كلها): `breakAgr ⇒ 'brk'`، `breakPact ⇒ 'brk'`، `partBuyout ⇒ 'buy'`، `rvpWithdraw ⇒ 'wd'`. الغلاف: `const f = A[k]; A[k] = function (S) { clogSweep(S, null); const r = f.apply(null, arguments); clogSweep(S, r && r.ok === false ? null : R); return r; }` *(الكنس الأول يهيّئ إن لزم ويكتب ما سبق بسببه العام).*
- ما يُزال بإجراء غير مغلَّف يُكتب في `clogBegin` التالي بالتصنيف العام (§3-ج)، فلا يضيع عقد. ولا يُكنس داخل `tick` إلا مرتين.
- `clogRec(S, x, isPact, R)`: يبني السطر (§2، §3) ثم `clogPut`.
- `clogPut(S, rec)`: `P.clog.push(rec); if (P.clog.length > CLOG.max) P.clog.shift()`، ثم يضيف إلى المجاميع (§6).

## 5) القروض (نداء صريح؛ `L.fbq` يُمحى عند مشاهدته فلا يُكنس)
`clogLoan(S, o, f)` بعد كل `L.fbq.push(f)` في ستة مواضع: `22-learn.js:172` و`:173`، `22c-loan-pledge.js:42` و`:46` و`:108` و`:112`. السطر: `k:'loan', c:S.home, w: f.g (إن وُجد), d0:o.day, d:S.day, cap:o.amt, out:f.lent, in:f.amt + (f.rest‖0), why` من `f.ok` (§3-ج-4)، `tr:{q:f.lent, a:f.amt}`، و`r` = `lpSaleText(f)` إن `ok = 3`. وإن كان `L.fbq` لا يُكتب (مسار قديم بلا LOANPLEDGE) فالسطران `:172` و`:173` يغطيانه.

## 6) آخر 100 ثم المجاميع السنوية
```
clogTotAdd(S, rec):  y = dateOf(S, rec.d).year; Y = P.clogY[y] ‖= { p:0, l:0, c:0, u:0, g:{} }; G = Y.g[CL_GRP_OF(rec.k)] ‖= [0, 0, 0, 0]
  Y.c++; G[2]++
  if (rec.u) { Y.u += rec.out; G[3] += rec.out } else if (rec.n > 0) { Y.p += rec.n; G[0] += rec.n } else if (rec.n < 0) { Y.l += −rec.n; G[1] += −rec.n }
```
**المجاميع تُحدَّث لكل سطر ولا تُقص أبداً**، فتبقى صحيحة لكل السنوات بعد أن يُقص السطر الحادي بعد المئة.
**المجموعات (شرائح الأنواع، بكلمات بن محمود):**
```
CL_GRP = { boss:'الزعماء' [p:shop, p:guard, p:alliance, p:exclusive], supply:'التوريد' [p:supply, import, raw],
  export:'التصدير' [export, wakala], fran:'الامتياز' [fran], road:'الممر' [pass, safe], mud:'المضاربة' [mud],
  salam:'السلم' [salam, book], ist:'الاستصناع' [ist], part:'الشراكات' [part], rival:'شراكات المنافسين' [rmud, rpart],
  loan:'قروض الأصدقاء' [loan] }
```

## 7) الجزء ب: أثر عقود الزعماء وتجارة raw/pass/fran (يُنفَّذ بعد أ في الحزمة نفسها، أو جلسة تالية على الفرع نفسه)
| العقد | الأثر المقيس (حرفاً) | الموضع |
|---|---|---|
| p:supply | `pc.bn += cost × (b0 / 0.92 − 1)`، `b0 = bossOf(S, c.id).ruler === 'player' ? 0.97 : 1.04` | `buyUnits` (`08-trade.js:37`) داخل `if (n > 0)` و`isPlayer && bossActive(S)` و`pc = pactIn(S, c.id, 'supply')` (دقيق: `buyMul` خطّي فـ`cost' = cost × b0 / 0.92`) |
| p:shop | `shopPact.bn += (gross − tax − cost0) × (0.4 / 1.4) − gross × shopCut` | `shopsDay` (`19-player.js:85`) بجوار `franNote`، بشرط `shopPact` (نسق `franNote` القائم) |
| p:alliance | `pc.bn += base × (Math.min(1, m) − Math.min(0.5, m))`؛ `base = CD[to.country].customs × perkMul(S,'customs') × tbMul(S,'customs') × valueOf(cargo) × (natMul == null ? 1 : natMul)`، `m = Math.min(agrCustMul(S, to, cargo), passMul(S, to), peaceCust(S, to))` | أول `agrCustomsNote` قبل `return` المبكر، بشرط `bossActive(S)` واختلاف الدولتين و`pc = pactIn(S, to, 'alliance')` |
| p:guard | لا ريال؛ `pc.tp += 1` لكل وصول قافلة لك من `from` أو إلى `to` فيهما `pactIn(…, 'guard')` | `agrCustomsNote` |
| p:exclusive | لا ريال؛ `pc.tq += n` لما اشتريتَه من `c.sig` | `buyUnits` بشرط `g === c.sig && pactIn(S, c.id, 'exclusive')` |
| raw | `ag.rq = { o, a, r }`: `o += qty` عند عرض دفعة، `a += n` عند القبول، `r += 1` عند الرفض أو فوات المهلة | `rawDay`، `rawAccept`، `rawReject` |
| pass, fran | `ag.tT += m.trips; ag.sT += m.sold` قبل تصفير `ag.m` | `roadMonth` |
- `pc.bn = 0` عند `signPact` لـsupply/shop/alliance (وللقائم يوم أول تفعيل في `clogSweep`). السطر: `in = pc.bn`، `n = in − out`، و`u = 0`. guard وexclusive يبقيان `u = 1` دائماً، وtr: «{tp} رحلة محمية» / «اشتريتَ {tq} وحدة من {اسم c.sig} حصرياً».
- tr: raw «عُرض {o}، قبلتَ {a}، ورفضتَ أو فاتتك {r} دفعة»؛ pass «{tT} رحلة»؛ fran «بعتَ {sT} وحدة بالامتياز»؛ supply «وفّرتَ في الشراء {bn}»؛ shop «زاد ربح دكاكينك {bn} بعد حصته»؛ alliance «وفّرتَ من الجمارك {bn}».
- **تداخل:** دكان فيه عقد امتياز وشراكة دكان يُنسب لكلٍّ بمعامله (كـ`franNote`)؛ يُذكر في التقرير ولا يُصحَّح.

## 8) الواجهة (أنماط 037، `06u-clog.js`)
**المجال:** `dDomains.clog = { icon:'icons/ledger', name:'سجل عقودك', gen: () => [], extra: clogBody, sub:'كل عقد انتهى: ربحه أو خسارته وما جرى فيه' }`. حالة واجهة فقط (لا تُحفظ): `clsh = { y: سنة اليوم, g: 'all', n: CLOG.page, i: null }`، تُصفَّر عند `dOpen('clog')`.
**(١) بطاقة المجاميع** أعلى المحتوى، من `clogTot(S, y, g)` (من `P.clogY`، لا من الأسطر): «الربح {p}» بلون `cheap`، «الخسارة {l}» بلون `dear`، «الصافي {p − l}» بلونه، «{c} عقداً». وإن `u > 0`: سطر صغير «كلفة عقود أثرها لا يُقاس بالريال: {u}». `y = 'all'` ⇒ جمع كل السنوات.
**(٢) الشرائح** (`button.dchip.clog-f`، `on` + `aria-pressed="true"` للمختارة، ارتفاع ≥ 44px، تلتف ولا تمرير أفقي على 390px):
- السنوات: «الكل» ثم كل `y` في `P.clogY` تنازلياً، بنص `yearName(y)` القائم. `data-clog-y`.
- الأنواع: «الكل» ثم كل مجموعة لها `G[2] > 0` في السنة المختارة. `data-clog-g`.
- **سطر الملخّص** تحتها (قاعدة ظهور الاختيار): `«{اسم السنة أو كل السنوات} · {اسم المجموعة أو كل الأنواع}: {c} عقداً، صافي {±(p − l)} ريال»`.
**(٣) الصفوف** (الأحدث أولاً، المرشَّحة بـ`y` و`g`): `button.clog-row[data-clog-row=i]` سطر واحد (`white-space:nowrap`، الطرف بقطع `…`): `اسم النوع · الطرف · التاريخ المختصر · n` بلونه، أو «كلفة {out}» بـ`muted` إن `u`. أول `clsh.n` صفاً، ثم زرّ «المزيد ({الباقي})» `data-clog-more` يزيد `CLOG.page`. وإن كانت للسنة مجاميع بلا أسطر باقية: «تفاصيل هذه السنة لم تعد محفوظة؛ السجل يحفظ آخر {CLOG.max} عقد، وبقيت مجاميعها أعلاه».
**(٤) التفصيل** (ضغطة صف ⇒ `clsh.i = i` وتُعاد رسم النافذة نفسها `dRender()` مع `dsh.keep = false` ثم أعلاها): العنوان «{اسم النوع} مع {الطرف}»؛ ثم أسطر `kv`: الطرف والمدينة («{مدينة الطرف}، من سوقك {h}» إن وُجد)، المدة («{d − d0} يوماً: {تاريخ d0} ← {تاريخ d}»)، {عنوان cap} {cap}، ما دفعتَ {out}، {ما قبضتَ | وفّرتَ} {in} (أو «غير مقيس بالريال» إن `u`)، **النتيجة** {n} بلونه، **ما جرى للتجارة** (القالب §3-ب ثم `r`)، **سبب الانتهاء** `CL_WHY[why]`؛ وإن `o`: «بدأ قبل تفعيل السجل: الأرقام منذ التفعيل». وفي أسفلها ثلاثة أزرار: «السابق» و«التالي» (`data-clog-nav="-1|1"`، بين الصفوف المرشَّحة نفسها، `disabled aria-disabled="true"` عند الطرف) و«القائمة» (`data-clog-back`). لا إغلاق للنافذة بينها.
**الأحداث:** مستمع واحد في `06u-clog.js` على `[data-clog-y],[data-clog-g],[data-clog-row],[data-clog-nav],[data-clog-more],[data-clog-back]` يغيّر `clsh` ثم `dRender()`. CSS قليل في `template.html`: `.dchip.on` كـ`.dchip[aria-expanded=true]`، و`.clog-row`، و`.clog-tot`.

### نقطة الوصول (≤ نقرتين)
- **«حال أعمالي»:** `clogHomeRow()` بعد `pjHomeRow()` (`06q-home-status.js:63`، خارج حدّ `HOMEST.rows` كصفوف 040د/046) حين `P.clog.length > 0`: `hsRow('clog', 'icons/ledger', '<b>سجل عقودك</b><small>{c} عقداً هذه السنة · صافي {±}</small>')`. ضغطة ⇒ النافذة.
- **الاتفاقيات:** زرّ «سجل عقودك المنتهية ({P.clog.length})» `data-act="clogopen"` تحت سطر الخانات في `agrOffersHTML` (`10b-agreements.js:47`)، وفعله `dOpen('clog')` في `16-events.js`.
- `CLOG.on = false` ⇒ لا صف ولا زرّ ولا مجال.

## 9) الاختبارات
- `test/clog.test.js` (محرك): (أ) **التطابق:** بذرة واحدة، 400 يوم بسكربت يوقّع ويفسخ عقداً من كل نوع (يُبنى على مساعدات `influence-*` و`rival-partner` القائمة)، مضاءً ومطفأً: `JSON` الحالة متطابق بعد حذف `clog, clogY` وعدّادات §1؛ ومطفأً لا يظهر أيٌّ منها. (ب) لكل نوع سطر واحد بالضبط عند انتهائه، و`why` الصحيح لكل مسار في `measure.md` §2 (16 نوعاً × طرق انتهائها). (ج) المعادلات: سطر الطرق `n = roadNet(ag)` حرفاً؛ ورmud `n = back − cap`؛ ورpart يساوي `agrLog.n`؛ والقرض `n ≤ 0` دائماً. (د) 130 عقداً ⇒ `P.clog.length = 100` و`Σ P.clogY[y].c = 130` والمجاميع لا تتغير بالقص. (هـ) حفظ ثم تحميل ثم انتهاء عقد ⇒ سطر واحد (لا تكرار ولا فقد). (و) `agrLog` متطابق مضاءً ومطفأً.
- `test/clog-ui.test.js` (Playwright، نسق `rival-partner-ui.test.js`): الصف في «حال أعمالي» يفتح النافذة بنقرة؛ ضغطة شريحة سنة ونوع ⇒ عنصر `on` واحد في كل مجموعة وسطر الملخّص بالرقم الصحيح؛ 23 سطراً ⇒ 10 صفوف و«المزيد (13)» ثم 20؛ التفصيل والسابق/التالي يتنقلان بلا إغلاق ويُعطَّلان عند الطرفين؛ لا `select` ولا `details` في `#dsheet`؛ لا تمرير أفقي على 390px؛ مطفأً لا صف ولا زرّ.
- في `test/map.json`: `30m-clog` ⇒ `clog`، و`06u-clog` ⇒ `clog-ui`؛ وفي `test/all.sh`.

## 10) الحجم
100 سطر ≈ 20–26 ألف حرف في الحفظ (measure §6)؛ والشيفرة ≤ 8 آلاف حرف في الصفحة. يُذكر الرقمان المقيسان في التقرير مع `page-budget`.
