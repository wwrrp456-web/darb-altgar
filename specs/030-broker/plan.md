# Implementation Plan: السمسار التعليمي المولَّد (030)

**تحديث Opus 2026-11-16** على `main` عند `0b0fb8d`. كل ثابت ومعادلة وترتيب سحب هنا **حرفي**؛ والمنفّذ لا يجتهد (قاعدة المعادلة). ما لم يُذكر يبقى كما هو.

## 0) الحقائق في الشيفرة (قرأها Opus)
1. **السمسار القديم:** `scaleAmt`/`brokerOffer` (`src/engine/22-learn.js:154–162`)؛ الدفع `babEventDay` السطر 179: `if (taught(L) >= 6 && S.day - L.ex.broker >= 75 && roll(S, 1) < 0.05 && liq >= 600) return push('broker', brokerOffer(S, liq));` و`push` يمرّ بـ`interruptOk`/`interrupt` (نافذة توقف الوقت، `01a-interrupts.js:9`)؛ القرار `eventChoice` السطور 208–216 (`roll(S, 11) < 0.15`)؛ الدرسان `src/lessons.js:183–184`؛ النافذة `src/ui/02-learn.js:257,274,304`. يعتمد عليه: `L.ev.brokerNo` (لوح `law5` في `22-learn.js:257`، و`29-aging.js:179`)، و`L.evDone.broker` (`SIDE_EVENTS` في `28-life.js:49`)، و`L.ex.broker` (`23h-vault-opportunities.js:91`). واختبارات: `babylon.test.js:72–76`، `first-try.test.js:11–17`، `characters.test.js:40–43`، `interrupts.test.js:11,23–26`.
2. **مولّد 028** (`src/engine/15b-rival-gen.js`): `rgRng(S)` (السطر 84) **يزيد `S.rivalGen.k`**، فاستدعاؤه من السمسار يغيّر مجرى المنافسين ⇒ **ممنوع**؛ و`rgPick` (السطر 87) يقرأ `rgCount` أي **ذاكرة المنافسين** ⇒ لا يصلح كما هو. `RG_FIRST` (40 اسماً، السطر 74)، `rgTier(S)` (0..9، السطر 90). الذاكرة في الواجهة: `src/ui/06l-rivals.js:1–4` (`darb-rival-memory`) والحفظ بعد كل `tick` في `src/ui/03-time-routing.js:67` (`rivalMemSave()`).
3. **خيار العيب** (`DEFECT`، `22-learn.js:103–152`): نمط الجودة بـ`addBasis(b, g, q, c, ql)` (`08-trade.js:3`) و`takeBasis`، والردّ في مدينة البائع. نعيد استعمال `addBasis/takeBasis` لا آلية `S.defects` (حتى لا يتشابك سجلّان).
4. **مكوّنات 037/051** (`src/ui/06o-details.js`): `ask(card)` بالشكل `{id, icon, title, why, opts:[{id, icon, title, effect, act, on?, off?, best?}], state, prio, keep?}`، و`dchip`، و`dDomains` و`dOpen`، و`ASK_SRC` (السطر 220) يسجّل فيه كل مصدر سطراً، و`officeCards` (`06b-office.js:55–125`) تضيف `ASK_SRC.x()` إلى «المطلوب»، و`briefCards` (`06s-brief.js:18`) تقرأ `officeCards`. «حال أعمالي»: `hsHomeHTML` (`06q-home-status.js:55`) و`hsRow`. **قاعدة «لا قوائم منسدلة»** (COMMITMENTS §2): لا `<select>` ولا `<details>` ولا طيّ في المكان.
5. **أسماء الملفات:** `15c-` محجوز (`15c-market-fund.js`) و`06m-` محجوز (`06m-page-tabs.js`) ⇒ الملفان الجديدان **`src/engine/15d-broker.js`** و**`src/ui/06u-broker.js`**.
6. **BAL (053):** غير مدموج على `main` بعد (`grep BAL src/` فارغ). **قرار Opus: السمسار لا يعتمد على `BAL`.** الأجرة نسبة معلومة ثابتة من الثمن (SH-01، عقد لا مقبض صعوبة)، وحجم الصفقة نسبة من السيولة فيتبع غلاء الأثمان وحده. قياس FR-005 يُعاد مع `BAL.on=true` (المتوسط) إن دُمج 053أ قبل تكامل 030 (§10).

## 1) الملفات
| الملف | ما فيه |
|---|---|
| `src/engine/15d-broker.js` (جديد) | `BROKER`، البيانات §3، `BR_SH`، المولّد §4، الدورة §5، الأفعال §6، النتائج §7، `brokerView` |
| `src/engine/15b-rival-gen.js` | إعادة هيكلة بلا أثر §11-أ (`rgStream`، ومعامل `cnt` في `rgPick`) |
| `src/engine/22-learn.js` | شرط واحد في السطر 179 §11-ب |
| `src/engine/11-day.js` | `brokerDay(S);` بعد `rivalGenDay(S);` (السطر 16) |
| `src/engine/01a-interrupts.js` | `brokerGen: 'office'` في `INTERRUPT_CLASS` (عدّاد بلا إيقاف) |
| `src/engine/31-api.js` | تصدير `BROKER`, `BR_SH`, `brokerDay`, `brokerGen`, `brokerView`, `brokerMemorySet/New/Now`؛ وفي `A`: `brokerInspect`, `brokerAsk`, `brokerWarranty`, `brokerAccept`, `brokerDecline`, `brokerReturn`, `brokerKeep` |
| `src/lessons.js` | خمسة مفاتيح `brk*` §8-ب حرفاً |
| `src/ui/06u-broker.js` (جديد) | الذاكرة، البطاقات، المجال `brk`، السجل، الشارة، سطر «حال أعمالي» §9 |
| `src/ui/03-time-routing.js` | `brokerMemSave();` بعد `rivalMemSave();` (السطر 67) |
| `src/ui/06b-office.js`، `06m-page-tabs.js`، `06q-home-status.js` | سطر لكل منها §9 |
| `src/README.md`، `docs/INTERRUPTS.md`، `test/map.json`، `test/all.sh` | أسطر الملفات الجديدة |

## 2) المفتاح والثوابت (حرفاً، في `15d-broker.js`)
```js
const BROKER = {
  on: true,                       // false = السلوك الحالي حرفاً (لا حقول، والسمسار القديم كما هو)
  minLevel: 6, minLiq: 600, minQ: 5,
  gap: [20, 40], retry: 7,        // أيام بين العروض؛ وإعادة المحاولة إن تعذّر العرض
  life: [5, 10], rushLife: 3, lifeMin: 3, lifeMax: 12,
  share: 0.25, min: 300,          // حجم الصفقة نسبة من السيولة (ريال)، وأدناه
  cap: [1500, 3000, 6000, 12000, 25000, 50000, 100000, 200000, 400000, 800000], // سقف بالريال لكل rgTier(S) = 0..9
  fee: [0.03, 0.035, 0.04, 0.045, 0.05], // أجرة السمسرة في الدلالة (SH-01): نسبة معلومة تُسحب عند الإنشاء
  honest: [0.90, 0.75, 0.55, 0.40, 0.15], // احتمال الصدق بالسمعة الحقيقية BR_REP
  relBonus: [0, 0, 0.10, 0.05], honestMax: 0.95, // بالعلاقة BR_REL
  uHonest: [0.78, 0.92],          // السعر ÷ السوق للصادق
  uBad: [[0.55, 0.92], [0.65, 0.92], [0.72, 0.92]], // للغاشّ بحسب brBand(S)
  tooGood: 0.75,                  // دونه «أحسن من أن يكون حقيقياً»
  v: [0.60, 0.80],                // جودة بضاعة الغاشّ = u × v
  noise: [0.25, 0.30, 0.35],      // ضجيج الصادق بحسب brBand(S)
  noInsp: 0.40,                   // الغاشّ يرفض المعاينة
  wHonest: 0.90, wBad: 0.30, wMin: 0.05, wMax: 0.95, // قبول كتابة مهلة الردّ
  inspFee: 0.01, inspMin: 10, inspMax: 200, // رسم المعاينة من ثمن الصفقة (بعملة السوق)
  askCool: 14, askTrust: 1,       // السؤال الثاني عند الزعيم نفسه خلال 14 يوماً يكلّف ثقة 1
  retDays: 7, reveal: 2,          // مهلة الردّ المكتوبة؛ وأيام ظهور النتيجة بعد القرار
  recent: 80, stylePow: 8, claimX: 1.5, ledgerMax: 40, logMax: 20,
  memDirty: false
};
const brBand = S => Math.min(2, Math.floor(rgTier(S) / 3));
const brLerp = (a, x) => a[0] + (a[1] - a[0]) * x;
const brRate = (S, cur) => cur === 'sar' ? 1 : S.fx.usd;   // ريال لكل وحدة من عملة السوق
const brR2 = x => Math.round(x * 100) / 100;
```

## 3) البيانات (حرفاً)
```js
const BR_TYPE = { good: 'بضاعة حاضرة بسعر حسن', unseen: 'بضاعة لم تُرَ', refer: 'دلالة على مورّد بعمولة' };
const BR_STYLE = { full: 'يعرض الأرقام كاملة', exagg: 'يبالغ', rush: 'يستعجل', secret: 'يتكتم على المصدر', others: 'يستشهد بآخرين' };
const BR_REP = ['معروف بالصدق', 'طيب السمعة قليل المعرفة', 'مجهول', 'سجله مختلط', 'سيئ السمعة'];
const BR_REL = ['غريب', 'سبق التعامل معه', 'أوصى به زعيم', 'قريب أحد عمّالك'];
const BR_PERS = [ // life: أيام تُضاف لمدة العرض · w: يُضاف لاحتمال قبول المهلة · insp: مضاعف رسم المعاينة
  { n: 'هادئ يفصّل', life: 0, w: 0.05, insp: 0.5 }, { n: 'متحمس', life: 2, w: 0, insp: 1 },
  { n: 'متكتم', life: 0, w: -0.05, insp: 1 },        { n: 'ودود', life: 1, w: 0.05, insp: 1 },
  { n: 'متعجّل', life: -2, w: 0, insp: 1 },          { n: 'متواضع', life: 0, w: 0.05, insp: 1 },
  { n: 'مدّعٍ', life: 0, w: -0.05, insp: 1 },        { n: 'دقيق', life: 1, w: 0, insp: 0.5 },
  { n: 'مجامل', life: 1, w: -0.05, insp: 1 },        { n: 'صريح', life: 0, w: 0.10, insp: 1 } ];
const BR_TITLE = ['الحدّاد', 'الخشّاب', 'الطحّان', 'الخبّاز', 'الحلواني', 'الدبّاغ', 'السلّال', 'المبيّض', 'الكوّاز', 'الرفّاء',
  'الحائك', 'الشمّاع', 'الصبّان', 'الدهّان', 'الحمّال', 'البقّال', 'الفاكهاني', 'اللبّان', 'المكاري', 'الخضّار',
  'الحجّار', 'الطيّان', 'الحصّاد', 'الحرّاث', 'الصوّاف', 'الفانوسي', 'الفرّان', 'الحطّاب', 'الصيّاد', 'الزرّاع']; // لا تكرار مع RG_TITLE؛ لمراجعة بن محمود
/* النصوص الشرعية المعتمدة حرفاً (docs/review/APPROVED_BROKER_2026-11-16.md)؛ لا نص شرعي غيرها في الحزمة */
const BR_SH = {
  SH01: 'أجرة السمسرة (أو الجعالة): نسبة معلومة من ثمن الصفقة عند إتمامها',
  SH03: 'ادعاء رغبة المشترين كذباً لخداع المشتري ورفع السعر محرّم (وهو من النجش والغش)',
  SH04: 'البَيِّعَانِ بِالخِيَارِ مَا لَمْ يَتَفَرَّقَا، فَإِنْ صَدَقَا وَبَيَّنَا بُورِكَ لَهُمَا فِي بَيْعِهِمَا، وَإِنْ كَتَمَا وَكَذَبَا مُحِقَتْ بَرَكَةُ بَيْعِهِمَا',
  SH05: 'المستشار مؤتمن، وسؤال أهل الخبرة نصيحة تحفظ الحقوق'
};
const BR_HADITH = 'قال رسول الله ﷺ: '; // صيغة التقديم المعتمدة في src/fiqh.js (تُراجَع في البرومت ٦)
```

## 4) المولّد والحقيقة (`brokerGen(S, mem)`) — ترتيب السحب حرفاً
**المولّد والذاكرة:**
```js
let BR_MEM = null;
const brokerMemoryNew = () => ({ recent: [], counts: {} });
function brokerMemorySet(m) { BR_MEM = m && typeof m === 'object' ? (m.recent && m.counts ? m : Object.assign(m, brokerMemoryNew(), m)) : null; }
const brokerMemoryNow = () => BR_MEM;
const brState = S => S.brokerGen || (S.brokerGen = { seed: (((S.seed >>> 0) ^ 0x5BD1E995) >>> 0) || 1, n: 0, k: 0, next: null });
const brRng = S => { const G = brState(S); return rgStream((G.seed + Math.imul(G.n + 1, 0x9E3779B1) + Math.imul((G.k = (G.k || 0) + 1), 0x85EBCA6B)) | 0); };
const brCount = (S, dim, v) => { const m = BR_MEM || S.brokerSeen; return (m && m.counts && m.counts[dim] && m.counts[dim][v]) || 0; };
const brPick = (S, r, dim, list, pow) => rgPick(S, r, dim, list, pow, brCount);
const brSig = x => [x.name, x.type, x.style, x.pers, x.ri, x.rel].join('|');
```
**الإنشاء** (يُستدعى من `brokerDay` فقط، والقافلة الرئيسية واقفة في مدينة: `car = mainCar(S)`, `car.left === 0`):
1. `if (mem) brokerMemorySet(mem)`. `G = brState(S)`, `r = brRng(S)`, `cid = car.city`, `c = S.cities[cid]`, `cur = curOf(c.country)`, `rate = brRate(S, cur)`, `band = brBand(S)`.
2. **الحجم:** `amt = Math.round(Math.min(BROKER.share * liquid(S), BROKER.cap[rgTier(S)]) / 10) * 10` (ريال). إن `amt < BROKER.min` ⇒ `return null`.
3. **السلع:** `goods = GIDS.filter(g => !GD[g].live && sells(c, g) && (c.stock[g] || 0) >= 10)`؛ فارغة ⇒ `null`.
4. **العلاقات المتاحة:** `rels = ['غريب']`؛ `+ 'سبق التعامل معه'` إن وُجد في `S.brokers.ledger` اسم آخر ظهور له `last <= S.day - 60`؛ `+ 'أوصى به زعيم'` إن `bossOf(S, cid)`؛ `+ 'قريب أحد عمّالك'` إن `Object.values(S.player.props).some(p => (p.staff || []).length)`.
5. **حلقة حتى 40 محاولة**، بهذا الترتيب:
   - `type = brPick(S, r, 'type', ['good', 'unseen', 'refer'])`
   - `style = brPick(S, r, 'pat:' + type, ['full', 'exagg', 'rush', 'secret', 'others'], BROKER.stylePow)`
   - `pers = brPick(S, r, 'pers', BR_PERS.map(x => x.n))`
   - `rel = brPick(S, r, 'rel', rels)`
   - إن `rel === 'سبق التعامل معه'`: `name = brPick(S, r, 'old', الأسماء المؤهلة)`، `ri = ledger[name].ri`. وإلا: `fn = brPick(S, r, 'fn', RG_FIRST)`, `ep = brPick(S, r, 'ep', BR_TITLE)`, `name = fn + ' ' + ep`, `ri = BR_REP.indexOf(brPick(S, r, 'rep', BR_REP))`؛ و`continue` إن كان الاسم في `ledger` أو اسماً لمنافس حيّ (`(S.rivals || []).some(o => o.out == null && o.name === name)`).
   - `g = brPick(S, r, 'g', goods)`
   - `continue` إن `brSig({name, type, style, pers, ri, rel})` في `(BR_MEM || S.brokerSeen || {}).recent`.
   - **الحقيقة** (سحبات بهذا الترتيب، كلها من `r`):
     `pH = Math.min(BROKER.honestMax, BROKER.honest[ri] + BROKER.relBonus[BR_REL.indexOf(rel)])`؛ `honest = r() < pH`؛
     `m = unitPrice(c, g)` (سعر شراء السوق الآن بعملته)؛ `u = brR2(brLerp(honest ? BROKER.uHonest : BROKER.uBad[band], r()))`؛ `p = brR2(m * u)`؛
     `q = Math.floor(amt / rate / p)`؛ إن `q < BROKER.minQ` ⇒ `return null`؛
     `qd = honest ? 1 : brR2(u * brLerp(BROKER.v, r()))`؛
     `noise = honest && r() < BROKER.noise[band] ? (r() < 0.5 ? 'rush' : 'warranty') : null`؛
     `noInsp = !honest && r() < BROKER.noInsp`؛
     `P = BR_PERS.find(x => x.n === pers)`؛ `wOk = type === 'refer' ? null : noise === 'warranty' ? false : r() < Math.min(BROKER.wMax, Math.max(BROKER.wMin, (honest ? BROKER.wHonest : BROKER.wBad) + P.w))`؛
     `fee = type === 'refer' ? BROKER.fee[Math.floor(r() * BROKER.fee.length)] : 0`؛
     `life = style === 'rush' || noise === 'rush' ? BROKER.rushLife : Math.min(BROKER.lifeMax, Math.max(BROKER.lifeMin, BROKER.life[0] + Math.floor(r() * (BROKER.life[1] - BROKER.life[0] + 1)) + P.life))`.
   - **العرض:** `o = { id: G.n + 1, day: S.day, until: S.day + life, life, city: cid, cur, name, type, style, pers, rel, ri, g, q, p, m, fee, claim: style === 'exagg' ? Math.round(q * (m - p) * BROKER.claimX) : 0, t: { honest, qd, wOk, noInsp, noise }, seen: {}, st: 'open' }`؛ `G.n++`؛ `G.k = 0`.
   - **الذاكرة:** لكل `M` من `[S.brokerSeen = S.brokerSeen || brokerMemoryNew(), BR_MEM]` إن وُجد: `M.recent.push({name, type, style, pers, ri, rel})` وقصّه إلى `BROKER.recent`؛ وزيادة `M.counts[dim][v]` للأبعاد: `type`، `'pat:' + type` (= style)، `pers`، `rel`، `rep` (`BR_REP[ri]`)، `g`، و`fn`/`ep` (للاسم الجديد) أو `old` (للعائد). `BROKER.memDirty = true`.
   - **السجل:** `ledger[name] = ledger[name] || { ri, seen: 0, acc: 0, rev: 0, hon: 0, net: 0, last: S.day }`؛ `seen++`؛ `last = S.day`؛ وإن زاد عدد الأسماء على `BROKER.ledgerMax` يُحذف أقدمها `last`.
   - `return o`.
6. بعد 40 محاولة بلا نجاح ⇒ `null`.

**مشتقات العرض** (تُحسب ولا تُحفظ): `cost = brR2(o.p * o.q)`؛ `feeAmt = Math.round(o.fee * cost)`؛ `total = cost + feeAmt`؛ `inspAmt = Math.round(Math.min(BROKER.inspMax, Math.max(BROKER.inspMin, Math.round(cost * BROKER.inspFee))) * (o.style === 'secret' ? 2 : 1) * P.insp)`؛ `pct = Math.round((1 - o.p / o.m) * 100)`؛ `tooGood = o.p / o.m < BROKER.tooGood`.

**ضمانة FR-003 بالبناء:** لكل `!honest`: إما `noInsp` (الرفض قرينة) وإما `qd ≤ u × 0.80 < u` فتكشف المعاينة «جودتها نحو `qd×100`٪ مما وصف». و`qd < 1` دائماً للغاشّ.

## 5) الدورة والحفظ
`S.brokers = { offer: null, ret: null, pend: [], ledger: {}, log: [], ask: {} }` (يُنشأ بـ`brData(S)` عند أول مرور على شرط المستوى فقط)، `S.brokerGen` (§4)، `S.brokerSeen` (بديل الذاكرة). **لا يُنشأ أي منها حين `BROKER.on = false`.**
```
function brokerDay(S) {
  if (!BROKER.on || S.shadowClone) return;
  const L = S.learn; if (!L || !L.char || taught(L) < BROKER.minLevel) return;
  const B = brData(S), G = brState(S);
  if (G.next == null) { const r = brRng(S); G.next = S.day + BROKER.gap[0] + Math.floor(r() * (BROKER.gap[1] - BROKER.gap[0] + 1)); }
  B.pend = B.pend.filter(x => { if (x.d > S.day) return true; brResolve(S, x.o); return false; });   // §7
  if (B.ret && S.day > B.ret.until) { const R = B.ret; B.ret = null; if (R.bad) brFinal(S, R.o, 0); }
  if (B.offer && S.day > B.offer.until) { news(S, 'انصرف السمسار ' + B.offer.name + ' بعرضه.', ''); brLog(S, B.offer, 'gone', 0, 0); B.offer = null; }
  if (!B.offer && S.day >= G.next) {
    const car = mainCar(S), can = liquid(S) >= BROKER.minLiq && !(L.eq && L.eq.length) && !B.ret && car && car.left === 0;
    const o = can ? brokerGen(S) : null, r = brRng(S);
    G.next = S.day + (o ? BROKER.gap[0] + Math.floor(r() * (BROKER.gap[1] - BROKER.gap[0] + 1)) : BROKER.retry);
    if (o) { B.offer = o; (L.ex = L.ex || { broker: -99, friend: -99, luck: -99 }).broker = S.day;
      news(S, 'سمسار في سوق ' + S.cities[o.city].name + ': ' + o.name + ' يعرض عليك ' + BR_TYPE[o.type] + '. عرضه في مكتب التاجر ' + dayAr(o.life) + '.', 'rumor');
      interrupt(S, 'brokerGen'); }   // 'office': عدّاد فقط، لا إيقاف
  }
}
```
الحفظ القديم: لا تطبيع لازم (الحقول اختيارية وتُنشأ كسولاً). حدث `broker` قديم في `L.eq` يُكمَل بـ`eventChoice` القديم كما هو.

## 6) الأفعال (كلها `OK/NO`، ولا سحب عشوائي فيها)
شرط مشترك `brHere(S, o)`: `car = mainCar(S)`, `car.city === o.city && car.left === 0`، وإلا `NO('ارجع إلى ' + S.cities[o.city].name + ' أولاً')`. والعرض `S.brokers.offer` بحالة `open`.
- **`brokerInspect(S)`** (مرة واحدة، `o.seen.insp`): `brHere`. إن `o.t.noInsp`: `o.seen.insp = { d: S.day, refused: 1 }` ⇒ `OK('رفض ' + o.name + ' أن تعاين البضاعة')` بلا رسم. وإلا: `S.ctxCur = o.cur`؛ إن `P.gold < inspAmt` ⇒ `S.ctxCur = 'sar'`, `NO('رصيدك لا يكفي لرسم المعاينة')`؛ `P.gold -= inspAmt`؛ `P.led.exp.agent = (P.led.exp.agent || 0) + inspAmt`؛ `S.ctxCur = 'sar'`؛ `o.seen.insp = { d: S.day + (o.type === 'unseen' ? 1 : 0), q: o.t.qd, fee: inspAmt }`. الرسالة: للحاضرة والدلالة النتيجة فوراً (§8-أ)، و«لم تُرَ»: `OK('دفعتَ ' + inspAmt + ' رسماً. تصلك نتيجة المعاينة غداً')`، وتظهر النتيجة في البطاقة متى `S.day >= o.seen.insp.d`.
- **`brokerAsk(S)`** (مرة واحدة، `o.seen.ask`): `b = bossOf(S, o.city)`؛ لا زعيم ⇒ `NO('لا زعيم لسوق هذه المدينة')`. **لا يشترط الحضور.** إن `S.day - (S.brokers.ask[o.city] ?? -99) < BROKER.askCool` ⇒ `b.trust = Math.max(0, (b.trust || 0) - BROKER.askTrust)`. `S.brokers.ask[o.city] = S.day`؛ `o.seen.ask = { d: S.day, txt: brBossTxt(S, o) }` (§8-أ). `OK('سألتَ زعيم السوق عن ' + o.name)`.
- **`brokerWarranty(S)`** (مرة واحدة، لا للدلالة: `NO('لا مهلة ردّ في الدلالة: أنت تشتري من المورّد نفسه')`): `o.seen.warr = { d: S.day, ok: o.t.wOk }`. `OK(o.t.wOk ? 'كتب لك ' + o.name + ' مهلة ردّ ' + dayAr(BROKER.retDays) : 'رفض ' + o.name + ' أن يكتب لك مهلة ردّ')`.
- **`brokerAccept(S)`**: `brHere`. `room = Math.floor((capOfCar(car) - loadOf(car)) / GD[o.g].w)`؛ إن `room < o.q` ⇒ `NO('لا مكان في قافلتك لـ' + o.q + ' ' + GD[o.g].name + ' (يتسع ' + Math.max(0, room) + ')')`. `S.ctxCur = o.cur`؛ إن `P.gold + 1e-9 < total` ⇒ `S.ctxCur = 'sar'`, `NO('رصيدك بـ' + CURS[o.cur].name + ' لا يكفي: تحتاج ' + fmtN(total))`. `P.gold -= total`؛ `P.led.exp.purchases = (… || 0) + cost`؛ `if (feeAmt) P.led.exp.agent = (… || 0) + feeAmt`؛ `S.ctxCur = 'sar'`. `car.cargo[o.g] = (car.cargo[o.g] || 0) + o.q`؛ `addBasis(car.basis, o.g, o.q, total, o.t.qd)`. `o.st = 'acc'`, `o.car = car.id`, `o.accDay = S.day`. **المهلة:** إن `o.type !== 'refer' && o.seen.warr && o.seen.warr.ok` ⇒ `S.brokers.ret = { o, until: S.day + BROKER.retDays, bad: false }`. `(L.evDone = L.evDone || {}).broker = 1`؛ `S.brokers.pend.push({ d: S.day + BROKER.reveal, o })`؛ `S.brokers.offer = null`. `OK('اشتريتَ ' + o.q + ' ' + GD[o.g].name + ' من ' + o.name + ' بـ' + fmtN(total) + ' ' + CURS[o.cur].name + (feeAmt ? ' (منها أجرة السمسرة ' + fmtN(feeAmt) + ')' : ''))`. **(الجودة `qd` تدخل الأساس فوراً، فلا مهرب منها ببيع سريع.)**
- **`brokerDecline(S)`**: `o.st = 'no'`؛ `L.ev.brokerNo = (L.ev.brokerNo || 0) + 1` (يحفظ `law5`)؛ `(L.evDone = L.evDone || {}).broker = 1`؛ `pend.push({ d: S.day + BROKER.reveal, o })`؛ `offer = null`. `OK('اعتذرتَ من ' + o.name + '. ستسمع بعد أيام ما كان من أمر عرضه')`.
- **`brokerReturn(S)`**: `R = S.brokers.ret`؛ يلزم `R && R.bad` وإلا `NO('لا شيء تردّه الآن')`. `car = carById(S, R.o.car)`؛ في `R.o.city` و`left === 0` وإلا `NO('ارجع إلى ' + … + ' أولاً: الردّ عند السمسار')`. `k = Math.min(R.o.q, Math.floor(car.cargo[R.o.g] || 0))`؛ `k < 1` ⇒ `NO('لم يبقَ من البضاعة شيء تردّه')`. `takeBasis(car.basis, R.o.g, k)`؛ `car.cargo[g] -= k` (يُحذف إن ≤ 0)؛ `refund = brR2(R.o.p * k)`؛ `S.ctxCur = R.o.cur; P.gold += refund; S.ctxCur = 'sar'`؛ `S.brokers.ret = null`؛ `brFinal(S, R.o, k, refund)`. `OK('ردّ ' + R.o.name + ' ' + fmtN(refund) + ' ' + CURS[R.o.cur].name + ' وأخذ بضاعته')`. (لا ردّ للأجرة: لا مهلة في الدلالة أصلاً.)
- **`brokerKeep(S)`**: `R && R.bad` ⇒ `S.brokers.ret = null`؛ `brFinal(S, R.o, 0)`؛ `OK('أبقيتَ البضاعة وانتهت المهلة')`.

## 7) النتائج والتعلّم والسجل
`fee(o) = Math.round(o.fee * brR2(o.p * o.q))`. **الصافي بسعر السوق يوم العرض:** `r = Math.round((o.q - k) * (o.m * o.t.qd - o.p) - fee(o))` (`k` = المردود، 0 إن لم يُردّ).
- **`brResolve(S, o)`** (بعد `BROKER.reveal` يوم من القرار):
  - `o.st === 'no'`: `brLog(S, o, 'no', 0, 1)`؛ `learnReact(S, o.t.honest ? 'brkMissed' : 'brkDodged', 1, …)` (§8-ب).
  - `o.st === 'acc' && o.t.honest`: `brLog(S, o, 'acc', r(k=0), 1)`؛ `learnReact(S, 'brkOk', 1, …)`؛ وإن `S.brokers.ret && S.brokers.ret.o === o` ⇒ `ret = null` و`news(S, 'جاءت بضاعة ' + o.name + ' كما وُصفت، فلا حاجة إلى مهلة الردّ.', 'good')`.
  - `o.st === 'acc' && !o.t.honest`: `news(S, 'تبيّن أن ' + o.q + ' ' + GD[o.g].name + ' من ' + o.name + ' جودتها نحو ' + Math.round(o.t.qd * 100) + '٪ مما وصف.' + (ret ? ' ومعك مهلة ردّ مكتوبة ' + dayAr(ret.until - S.day) + ': ارجع إلى ' + city + ' وردّها.' : ''), 'bad')`؛ إن كانت مهلة ⇒ `ret.bad = true` (النتيجة النهائية عند الردّ أو «أبقِها» أو انقضاء المهلة)، وإلا `brFinal(S, o, 0)`.
- **`brFinal(S, o, k, refund)`**: `brLog(S, o, 'acc', r(k), 1)`؛ `learnReact(S, k > 0 ? 'brkRet' : 'brkLost', 1, …)`.
- **`brLog(S, o, st, r, rev)`**: `S.brokers.log.push({ d: S.day, name, type, st, honest: rev ? o.t.honest : null, r, cur: o.cur })` وقصّه إلى `logMax`؛ وفي `ledger[o.name]`: `if (rev) { rev++; hon += o.t.honest ? 1 : 0; }`، `if (st === 'acc') acc++` (مرة لكل عرض: عند الحلّ النهائي)، `net += Math.round(r * brRate(S, o.cur))` (بالريال)، `last = S.day`.
- **لا `learnReact` في أي موضع آخر** (FR-008)، ولا شيء قبل `brResolve`.

## 8) النصوص غير الشرعية (كتبها Opus؛ تُنسخ حرفاً)
### أ) البطاقة والأفعال
- **الادعاء عن نفسه** بـ`ri`: `0` «يقول إنه معروف بالصدق» · `1` «يقول إن قليلاً من التجار يعرفونه» · `2` و`3` «لا تعرفه» · `4` «يقول إنه معروف بالصدق».
- **العلاقة:** «سبق أن تعاملتَ معه: صدق في H من R» · «يقول إن زعيم السوق أوصى به» · «يقول إنه قريب أحد عمّالك».
- **الأسلوب:** `full` (نسبة الخصم في سطر السعر) · `exagg` «يقول إنك ستربح منها CLAIM» · `rush` «يريد جوابك سريعاً» · `secret` «لا يذكر من أين جاء بها» · `others` «يقول إن تجاراً آخرين يطلبونها».
- **«لم تُرَ»:** «لم تَرَها: موصوفة بالصفة والكمية والسعر، في خانٍ خارج السوق».
- **الدلالة:** `BR_SH.SH01 + ' · ' + (o.fee * 100) + '٪ = ' + fmtN(feeAmt) + ' ' + cur`، وسطر «يدلّك على مورّد يبيع بـP للوحدة».
- **نتيجة المعاينة:** صادق «البضاعة كما وُصفت» · غاشّ «جودتها نحو X٪ مما وصف» · رفض «رفض أن تعاين البضاعة».
- **جواب الزعيم `brBossTxt`:** بـ`ri`: `0` «معروف بالصدق عندنا» · `1` «طيب السمعة، لكن قليلاً من التجار يعرفونه» · `2` «لا أعرفه» · `3` «سجله مختلط: صدق مرة ولم يصدق أخرى» · `4` «سمعته سيئة عندنا»؛ + إن `others`: «، وما يقوله عن مشترين آخرين » + (`honest` ? «صحيح» : «لا أثر له في السوق»)؛ + إن كان في السجل `rev > 0`: «. وسجلك معه: صدق في H من R».
- **الضمان:** «كتب لك مهلة ردّ 7 أيام» / «رفض أن يكتب لك مهلة ردّ».
### ب) تعليقات عمّ سالم (`src/lessons.js`، بجانب `brokerNo/brokerLost`)
```js
brkOk:     { m: 'proud', always: true, t: 'كان السمسار صادقاً: {p}. ما فحصتَه قبل أن تقبل هو الذي جعل هذا الربح قراراً لا حظاً.' },
brkLost:   { m: 'sad',   always: true, t: 'خسرتَ في صفقة السمسار {p}' },
brkRet:    { m: 'proud', always: true, t: 'أحسنتَ: المهلة المكتوبة حفظت مالك، فرددتَ البضاعة واستعدتَ {p}' },
brkDodged: { m: 'proud', always: true, t: 'أحسنتَ برفضك: لم يكن السمسار صادقاً. {p}' },
brkMissed: { m: 'teach', always: true, t: 'كان السمسار صادقاً هذه المرة، وفاتك ربح نحو {p}. ليست كل قرينة غشاً؛ افحص ثم احكم.' },
```
**المعامل `{p}`** (يبنيه المحرك):
- `brClues(o)` (القرائن الفعلية من `o.t`، مفصولة بـ«، »، بهذا الترتيب): `tooGood` ⇒ «السعر أقل من السوق بـ`pct`٪، وهذا أحسن من أن يكون حقيقياً» · `o.life === BROKER.rushLife` ⇒ «استعجلك بـ3 أيام فقط» · `noInsp` ⇒ «رفض أن تعاين البضاعة»، وإلا للغاشّ «المعاينة كانت ستكشف أن جودتها نحو X٪ مما وصف» · `wOk === false` ⇒ «رفض أن يكتب لك مهلة ردّ» · `ri === 3 || ri === 4` ⇒ «زعيم السوق يعرف أن » + (`ri === 4` ? «سمعته سيئة» : «سجله مختلط») · `others` ⇒ «ادّعى أن تجاراً آخرين يطلبونها» + (`honest` ? « وكان صادقاً» : « ولا أثر لذلك في السوق»).
- `brTail(o)` = `'كانت القرينة: ' + brClues(o) + '.' + (o.style === 'others' && !o.t.honest ? ' «' + BR_SH.SH03 + '».' : '') + (!o.t.honest ? ' ' + BR_HADITH + '«' + BR_SH.SH04 + '»' : '')`.
- `brkOk`: `'صافيك نحو ' + fmtN(r) + ' ' + cur + ' بسعر السوق يوم العرض'` · `brkLost`: `'نحو ' + fmtN(-r) + ' ' + cur + '. ' + brTail(o)` · `brkRet`: `fmtN(refund) + ' ' + cur + '. ' + brTail(o)` · `brkDodged`: `brTail(o)` · `brkMissed`: `fmtN(o.q * (o.m - o.p) - fee(o)) + ' ' + cur + '. ' + (inn ? 'وما أخافك كان بريئاً: ' + inn : 'ولم يكن في عرضه ما يريب')`، حيث `inn` = قائمة من «استعجل لأمر عنده» (`noise === 'rush'` أو `style === 'rush'`) و«اكتفى بكلمته عن الكتابة» (`wOk === false`) و«لا تعرفه» (`ri === 2`).
- `cur` = `CURS[o.cur].name`.

## 9) الواجهة (`src/ui/06u-broker.js`) — مكوّنات 037/051 فقط
1. **الذاكرة:** `brokerMemLoad()`/`brokerMemSave()` نسخة من `06l-rivals.js:2–4` بالمفتاح `darb-broker-memory` و`E.BROKER.memDirty`؛ و`brokerMemSave()` في `03-time-routing.js:67`.
2. **`brkUiOn()`** = `E.BROKER.on && DETAILS.on && S && S.learn && S.learn.char && S.brokers`.
3. **`brkAskCards()`** (و`ASK_SRC.brk = brkAskCards;` في آخر الملف): (أ) بطاقة العرض `{ id: 'brk:' + o.id, icon: 'icons/cart', title: o.name + ' يعرض عليك ' + نوع الصفقة, why: الأسطر §8-أ مفصولة بـ`'\n'` (السعر والسوق؛ «لم تُرَ» أو الأجرة؛ الادعاء والطبع والعلاقة؛ الأسلوب؛ «يبقى عرضه N أيام»؛ ونتائج ما فُحص: «المعاينة: …»، «سؤال الزعيم: …»، «الضمان: …»؛ حدّ 8 أسطر), state: 'open', prio: 2, keep: true, opts }` و`opts` بهذا الترتيب **بلا `best`**:
   - `insp`: `icons/scales`، «عاين البضاعة» (الدلالة: «زُر المورّد وعاين»)، `effect: 'رسم ' + fmt(inspAmt) + (unseen ? ' · النتيجة غداً' : '')`.
   - `ask`: `icons/book`، «اسأل عنه زعيم السوق»، `effect: BR_SH.SH05 + (تكرار خلال 14 يوماً ? ' · يكلّفك ثقة 1' : '')`؛ `off: 'لا زعيم لسوق هذه المدينة'` إن لم يوجد.
   - `warr` (لا للدلالة): `icons/pact`، «اطلب ضماناً: مهلة ردّ مكتوبة»، `effect: 'إن قبل: تردّ ما خالف الوصف خلال 7 أيام وتسترد ثمنه'`.
   - `acc`: `ui-pay`، «اقبل»، `effect: 'تدفع ' + fmt(total) + (feeAmt ? ' منها أجرة ' + fmt(feeAmt) : '')`؛ `off` برسالة `brHere` أو المكان أو الرصيد إن تعذّر.
   - `no`: `ui-decline`، «اعتذر»، `effect: 'لا تدفع شيئاً'`.
   - **ظهور الاختيار:** ما فُحص يصير `{ ...opt, on: true, off: 'تمّ: ' + النتيجة }`؛ ونتيجة «لم تُرَ» قبل يومها: `off: 'النتيجة غداً'`.
   (ب) بطاقة المهلة حين `ret && ret.bad`: `{ id: 'brk:ret', icon: 'icons/pact', title: 'لك مهلة ردّ عند ' + name + ' · ' + dayAr(until - S.day), why: q + ' ' + سلعة + ' · تسترد ' + fmt(p × k), prio: 1, opts: [{ id: 'ret', icon: 'ui-sell', title: 'ردّ البضاعة واسترد ثمنها', act: A.brokerReturn, off: إن لم تكن هناك }, { id: 'keep', icon: 'ui-postpone', title: 'أبقِها عندي', effect: 'تنتهي المهلة الآن', act: A.brokerKeep }] }`.
   سطر `why` متعدد: قاعدة CSS `white-space: pre-line` على سطر `why` في `.dask[data-dask^="brk:"]` فقط.
4. **المجال `brk`** في `dDomains` (يُضاف من `06u` بـ`dDomains.brk = {…}`): `{ icon: 'icons/ledger', name: 'السماسرة', gen: brkAskCards, extra: brkLedgerHTML, sub: 'العرض الحالي ومن تعاملتَ معهم' }`. **`brkLedgerHTML()`**: سطر مجاميع «عروض N · قبلتَ A · صافيك ±X ريال» ثم صفوف `kv` لأحدث 10 أسماء بـ`last` (الاسم · «عروض s · قبلتَ a · صدق h من r» · الصافي بفئة `cheap`/`dear`) وزر «المزيد» (`data-act="brkmore"` يزيد عدّاداً في الذاكرة بـ10). **لا `<select>` ولا `<details>`.**
5. **التنبيه (نقرة 1):** في `officeCards` (`06b-office.js`، بعد سطر `ASK_SRC.mx`): `try { if (brkUiOn()) for (const k of ASK_SRC.brk()) out.push({ id: k.id, ic: '', w: k.prio === 1 ? 74 : 62, t: esc(k.title), ask: k, todo: k.why.split('\n')[0] }); } catch (e) {}` ⇒ يظهر في المكتب وفي موجز الرئيسية.
6. **الشارة (نقرتان):** `brkChip()` = `brkUiOn() && (S.brokers.offer || S.brokers.ret || Object.keys(S.brokers.ledger).length) ? dchip({ id: 'brk', icon: 'icons/ledger', name: 'السماسرة', count: (S.brokers.offer ? 1 : 0) + (S.brokers.ret && S.brokers.ret.bad ? 1 : 0) }) : ''` في صف شارات تبويب «اليوم» (`06m-page-tabs.js`، بجانب العدّ في السطر 63).
7. **«حال أعمالي»:** في `hsHomeHTML` بعد سطر المنافسين: `if (typeof brkHsRow === 'function') { const x = brkHsRow(); if (x) rows.push(x); }` حيث `brkHsRow()` = `hsRow('brk', 'icons/ledger', '<b>السماسرة</b><small>عرض من ' + esc(name) + ' · ' + dayAr(until - S.day) + '</small>')` حين عرض أو مهلة.
8. لا تغيير في نافذة الحدث القديم (`02-learn.js`)؛ تبقى للمسار القديم.

## 10) قياس FR-005 (`tools/broker-measure.js` ← `specs/030-broker/measure.md`)
- اللاعب: `test/lib/skill-sim.js` (`E.botMain`/`E.botBuild` كما في `tools/econ-baseline.js:10`)، من `E.newGame(seed)` + `A.chooseStart(S, 'sa')` + `A.learnSetChar(S, 'trader')` + `S.learn.level = 6`، 12 بذرة × `3 × 354` يوماً، `BROKER.on = true`.
- السياسات (تُطبَّق كل يوم على `S.brokers.offer` و`ret`): **الرافض** يعتذر دائماً (الأساس)؛ **المتهور** يقبل كل عرض حين يكون هناك (ولا يطلب ضماناً ولا يردّ)؛ **الحذر**: يعاين (وينتظر نتيجة «لم تُرَ»)، ويسأل، ويطلب المهلة؛ يقبل إن (المعاينة «كما وُصفت») و(`!tooGood`) و(المهلة مقبولة أو النوع دلالة)؛ وإلا يعتذر؛ ويردّ في المهلة إن انكشف عيب.
- الدخل `I = netWorth(نهاية الرافض) − netWorth(بداية الرافض)`. **الحدّ:** `0 < ΔW(الحذر) ≤ 0.03 × I` و`−0.05 × I ≤ ΔW(المتهور) < 0` لكل بذرة في المتوسط، والمتهور أسوأ من الحذر في 10/12 على الأقل.
- **إن خالف:** يُخفَّض `BROKER.share` بخطوة 0.05 (أدناه 0.10)، ثم تُقسم `BROKER.cap` على 2 مرة واحدة، **ولا شيء غيرهما**؛ وكل تعديل وأرقامه في `measure.md` والتقرير. (وإن دُمج 053أ قبل التكامل: جولة ثانية بـ`BAL.on = true` والمستوى المتوسط.)

## 11) الدمج مع القائم (حرفاً)
- **أ) `15b-rival-gen.js` بلا أثر:** `const rgStream = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };` و`function rgRng(S) { const G = rgState(S); return rgStream((G.seed + Math.imul(G.births + 1, 0x9E3779B1) + Math.imul((G.k = (G.k || 0) + 1), 0x85EBCA6B)) | 0); }`؛ و`rgPick(S, r, dim, list, pow, cnt)` يستعمل `(cnt || rgCount)(S, dim, v)`. اختبار: مخرجات `rgRng` لألف سحب وولادات 3 بذور × 1000 يوم مطابقة لما قبل.
- **ب) `22-learn.js:179`:** `if (!BROKER.on && taught(L) >= 6 && S.day - L.ex.broker >= 75 && roll(S, 1) < 0.05 && liq >= 600) return push('broker', brokerOffer(S, liq));` (`roll` دالة يوم لا مجرى، فتخطيه لا يغيّر غيره).
- **ج) اختبارات السلوك القديم** تثبّت `E.BROKER.on = false` في أولها: `babylon.test.js`، `first-try.test.js`، `characters.test.js`؛ و**اختبارات البصمة** `skill`, `skill-b` وكل اختبار بصمة قديم، و**سكربتات الالتقاط** (`scripts/capture-*.js` وما يلتقط autopilot/guided) بالقاعدة الدائمة (COMMITMENTS §1).
- **د) الأيقونات:** `icons/cart`, `icons/scales`, `icons/book`, `icons/pact`, `icons/ledger`, `ui-pay`, `ui-decline`, `ui-sell`, `ui-postpone` قائمة كلها؛ **لا أيقونة جديدة**.

## Constitution Check
الشرع ✅ (أربعة نصوص حرفاً في `BR_SH` + اختبار؛ لا حكم من المنفّذ) · الحفظ ✅ (اختياري + `BROKER.on`) · الاختبار ✅ (SC-001..006) · لعب لا محاضرة ✅ (عمّ سالم بعد النتيجة فقط) · البساطة ✅ (يعيد `rgStream`/`rgPick`/`addBasis`/`ask`/`ASK_SRC`).

## المخاطر
- **الرفض الآلي:** يعالجه ضجيج الصادقين (SC-002) وربح الحذر الموجب (FR-005)، و`brkMissed` يعلّم أن القرينة ليست حكماً.
- **تضخم البطاقة:** حدّ 8 أسطر قصيرة، و`keep: true` يبقيها مفتوحة بعد الفحص.
- **خلط مع 05-haggle:** لا مساومة؛ السعر ثابت والفحص يكشف فقط.
- **عملة السوق:** الحجم بالريال ثم يُقسم على `brRate`؛ الدفع والاسترداد بعملة السوق؛ السجل بالريال.
