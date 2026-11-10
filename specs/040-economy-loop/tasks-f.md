# مهام 040و
- [ ] T1 قراءة: `02a-payments.js` (payObligation)، `20-finance.js` (أسطر المضاربة وdiwanCover)، `24g-diwan.js`، `24-advisor-actions.js` (divest/invest ~617)، بطاقات المكتب (`06b-office.js`)، `test/economy-invariants.test.js`.
- [ ] T2 قياس «قبل» لسيناريو المصرفي (ودائع كبيرة ونقد ~0) في `docs/economy/LIQUIDITY_040f.md`.
- [ ] T3 `LIQ` و`P.liq` و`liqCover` وربطها في `payObligation` بعد `diwanCover`.
- [ ] T4 `payout` لأرباح المضاربة.
- [ ] T5 قاعدة الناظر `draw`.
- [ ] T6 بطاقة السيولة وإعداداتها (بنمط 037).
- [ ] T7 `liquidity.test.js` + حذف استثناء KNOWN banker من `economy-invariants` + CHANGELOG + جدول «لا صوري» + قياس «بعد».
- [ ] T8 `node build.js` ثم `node test/run.js --changed` فقط.
- [ ] ⛔ توقف: `report-f.md` (≤ 40 سطراً).
