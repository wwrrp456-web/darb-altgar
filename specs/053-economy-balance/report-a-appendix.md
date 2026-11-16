# ملحق تقرير 053أ

## 1) تصنيف مخرجات `rg` (T4): `rg -n "1500|1200|4000|2500|FARM_COST|FARM_UP\b|MFG_COST\(|SAILOR_FEE|SAILOR_WAGE|WAGE\.(guard|crew)|cartCost\(|\.cost\b|cd\.fee|SHOP_UP_COST|WH_UP_COST" src/engine src/ui` (224 سطراً)
**مُحوَّل (يمرّ بدالة من `30l-balance.js` أو يقرؤها):**
- `06-estate.js`: `shopCost`، `whCost`، `cartCost(car, S)`، `upgradeWarehouse` ← `whUpCost`. `07-farm.js`: `rentOf` (الإيجار)، `netWorth`/`farmValue` (`balBk`)، الانصراف `balQuit`. `07a`: `farmUpQuote` ← `farmUpCost`.
- `24-advisor-actions.js`: `buyShip`/`sellShip`/`upgradeShip`/`hireSailor` ← `shipCost`/`shipBack`/`shipUpCost`/`hireCost`؛ `buyCart`، `upgradeShop` ← `shopUpCost`، `hireCrew`/`hireGuard` ← `hireCost`، `hireCaptain` ← `capFee`، `buildShop`/`buildWarehouse`/`buyShop`/`buildFarm`/`upgradeFarm`/`buildFactory` ← الدوال + `bk`، `shopQuick` ← `balPrice0`.
- `13-factories.js:16` `factoryValue` × `balBk`؛ `23a`: القيم الثلاث × `balBk`/`balWhBk`؛ `30h2m`: `partCost = factoryCost.cost`؛ `20-finance.js`/`02b-office.js:21,23`/`10-captains.js:87`/`09b-sea.js:35`: الأجور ← `balWage`؛ `24g3-deleg-b.js` ← `staffWage().once`/`hireCost`؛ `30i-tasks.js` ← `farmCost`/`capFee`؛ `06c-steward.js` و`30h3-skill-shops.js` ← `balPrice0`؛ `22-learn.js:77` و`06e-wealth-report.js` ← `balShopBook`/`balWhBook` (رقم واحد مع `netWorth`).
- الواجهة: `09-screen-caravan-estate.js:18,55,62,67`، `05-scenes-deals.js:76`، `06d-planner.js`، `10-screen-lords.js` (94 و161 و247 و266، بحذف الحسابات المكررة)، `11-screen-empire.js:43,67,69`، `10c-obligations.js:26,31`.
**خارج النطاق (السبب):**
- ثوابت المصدر نفسها (تبقى كما هي لاختبارَي `sectors` و`shopecon`): `01-data-world.js` `MFG_COST`، `06-estate.js`/`07-farm.js`/`20-finance.js`/`09b-sea.js` تعريفات `SHOP_UP_COST` و`WH_UP_COST` و`FARM_COST` و`FARM_UP` و`WAGE` و`SAILOR_*`.
- «ما لا يتغير» في §2: الإسطبل (`24-advisor-actions.js:349`، 2500)، رسم رئيس المزرعة (`07a:2`، 1200)، كبير الرعاة (`24b-chief-herder.js`، 1500)، ترقية الحرّاس (`30d-guards.js` `GR.fee` 500/1500)، قادة السفن، البسطة، الصيانة اليومية، رسوم الناظر (`24g-diwan.js`).
- مبالغ سوق أو قروض أو تعلّم لا أصول: `.cost` في `buyUnits`/المؤن/المرابحة (`20-finance.js:48`، `24-advisor-actions.js:131,175,386,547,625`، `10-captains.js:47,73`، `21-orders.js`، `23c-trade-restart.js`)، وحدود القروض والمؤشرات (`20-finance.js:8,12`، `22-learn.js:138–339`، `24-advisor-actions.js:37–38`)، وصندوق التكافل (`14-dialogs.js` `TK.seed`)، وفرص الخزنة (`23h`)، والمشاريع (`30b`، `30b2`)، والبذور (`07b-crops.js`)، ووكلاء الإقليم (`12-agents.js:43`)، وتحالف الزعيم (`04-bosses.js:14`).
- مركب القافلة `M.cost` (`24-advisor-actions.js:201`، `bs.mount`): غير مذكور في §2، فلم يُمسّ (يُقاس في 053ب إن لزم).
- `09-travel.js` سطر 131 و`09b-sea.js:93` ← `balCover` (تحويل لا خارج نطاق).

## 2) سجل المعايرة (المطفأ: ثوابت البصمة في `test/bal-a.test.js`؛ الخام: `measure-a.json`)
- **ط1 (solo، 3 بذور، price0=1.5):** تنصيف 8 تجارب لكل مستوى على `demand`: مبتدئ 0.525←0.2875←0.1688←0.1094←0.0797←0.0648←0.0574←0.0537 (Y: 2.82، 1.46، 0.89، 0.67، 0.44، 0.40، 0.44، 0.42) فاختير 0.065؛ متوسط 0.525←…←0.1242 (0.36) ثم 0.121؛ عالٍ …0.2244 (0.362). ضُبط `price0` على 1.5 لأن ط1ب لا تتحقق بـ1.3 (النسبة Y(2.2)/Y(1.3) = 2.6 بينما Y(2.2)/Y(1.5) ≈ 1.6–1.8).
- **ط2:** تنصيف `k.shop` (7 تجارب لكل مستوى، 12 بذرة، سنة): مبتدئ 3.29←70 يوماً، 3.58←84، 5.31←98، 7.63←161، 12.25←217 …؛ متوسط 5.31←105، 6.47←140، 7.63←154، 12.25←231، 21.5←350؛ عالٍ 12.83←217، 13.41←238، 14.56←245، 16.88←280، 21.5←329. القيمة الابتدائية 10/20/32 تعطي 196/322/525.
- **ط4:** فرق توأمين (`--skip farm`/`--skip factory`، متوسط، 12 بذرة): المزرعة 48,486 ريال سنوياً من 24,301 (استرداد 0.5 سنة)، والمصنع 121,745 من 24,327 (0.2). الفرق يشمل أثر إعادة استثمار الأرباح (ضجيج؛ بذرة واحدة سالبة).
- **ط3:** `rent` يستأجر اليوم 35 ويمتلك في اليوم 189/231/266 (A) أو 119/196/182 (B): خصم 377/1,306/3,087 (A) ودفع 14,640/28,694/45,008 من ثمن 15,000/30,000/48,000.
- **ط5:** الثروة بصدمات ÷ بلا صدمات: بذور 12 فرق ±30٪ بين السنوات (الإشارة تتبدل)، فلا يصلح مقياساً لضبط `hit/wet/road`؛ يلزم ≥ 50 بذرة أو لاعب آلي مستقر قبل الدكان.
- **ط6:** `neglect` ≡ `invest` (لا ترميم ولا مدير ولا تكافل)؛ الأسابيع الخاسرة من تجارة القافلة نفسها، و`drift` 0.6 (حدّ النطاق) لم يغيّر النتيجة (19.5٪ كلياً، 17.7٪ بعد أول دكان). لا مقبض في [0.16، 0.6] يدفعها إلى 10–20٪ للمتوسط.

## 3) الجولة الثانية (بعد حكم 2026-11-16b)
- **ط1:** تنصيف 8 تجارب لكل مستوى على [0.03، 1] بهدف Y = 52٪ عند price0 1.5: متوسط 0.515←…←0.0414 (Y 0.530)، عالٍ …0.0982 (0.524)، مبتدئ ينتهي عند 0.0338 بـ Y 1.03 فكُتب 0.03 (Y 0.71).
- **ط2:** بقي كما في B (k.shop 3.25/6.5/10.4)؛ التوحيد لا يغيّر `shopCost`، فخرج 70/140/182.
- **ط5 (متوسط):** hit 0.60 ← 3.33٪؛ + wet 0.15 ← 3.28٪؛ + road 2.4 ← 3.78٪ (كُتب hit فقط). **(عالٍ):** hit 0.9 ← 5.63٪؛ + wet 0.30 ← 7.32٪ ✓؛ + road 3 ← 6.30٪.
- **ط6:** كل الأنماط ≥ 0.98 للمبتدئ والمتوسط؛ العالي `invest` 0.61 و`neglect` 0.89.
