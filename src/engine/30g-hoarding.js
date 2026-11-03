/* ---------- الاحتكار المحرّم كما عرّفه المختص (022): docs/review/APPROVED_MONOPOLY_2026-11-03.md، ويحلّ محل قياس «الحصة» في WORLD.md §5 ----------
   الاحتكار = حبس سلعة يحتاجها الناس في معاشهم وقت ضيق المدينة تربّصاً للغلاء (MO-01). **الحصة الكبيرة بحسن التجارة مباحة، لا عقوبة ولا تنبيه عليها (MO-02).**
   سلع الحاجة: قمح، أرز، تمر، سمك مجفف، جبن، عسل، لحم مجفف (أقوات)؛ أعشاب طبية (دواء)؛ صوف ونسيج (كسوة)؛ خشب (وقود).
   يُعدّ اللاعب محتكراً في مدينة إذا اجتمع 14 يوماً متصلة: (1) ضيق المدينة: مخزون السوق من السلعة < 30٪ من حاجتها (طلب 30 يوماً) وسعرها ≥ 1.4 المرجعي؛
   (2) الحبس: في مخزنه بالمدينة ما يسدّ نصف النقص على الأقل ولم يبع منها شيئاً في المدة. بعد 7 أيام تنبيه لطيف في المكتب. العقوبة: النص المعتمد حرفياً مرة لكل حادثة،
   وشريط ثقة الزعماء −1.2 يومياً (حتى 40 نقطة) وثقة زعيم المدينة −1.5 يومياً حتى −40 ما دام الحبس. التعافي: بيع ما يسدّ نصف النقص بسعر ≤ 1.1 المرجعي فيعود الشريط +0.8 يومياً.
   الحقل الاختياري S.hoard = { rec } وP.rep.hp لخصم الشريط؛ HOARD.on=false يعيد القديم حرفياً (لا حقل ولا عقوبة ولا تنبيه). */
const HOARD = { on: true, needDays: 30, shortPct: 0.3, ratioMin: 1.4, warnDays: 7, hoardDays: 14, storeShare: 0.5, fair: 1.1, repDay: 1.2, bossDay: 1.5, bossFloor: -40, hpCap: 40, recDay: 0.8 };
const HOARD_GOODS = { wheat: 'قوت', rice: 'قوت', dates: 'قوت', driedfish: 'قوت', cheese: 'قوت', honey: 'قوت', jerky: 'قوت', herbs: 'دواء', wool: 'كسوة', textile: 'كسوة', wood: 'وقود' };
const HOARD_TEXT = '⚠️ تنبيه تجاري وشرعي: وقعتَ في الاحتكار المحرّم! قال رسول الله ﷺ: «لا يحتكر إلا خاطئ». لقد قمتَ بحبس أقوات الناس وحاجاتهم الأساسية وقت الضيق لتربص الغلاء؛ وهذا استغلال يضر بالعامة ويحرمه الشرع، مما أدى إلى انهيار سمعتك في السوق وفقدان ثقة الناس بتجارتك. (قم بطرح البضاعة بسعر عادل لتستعيد مكانتك ونماء تجارتك).';
const hdOn = S => !!(HOARD.on && S && S.learn && S.learn.char);
const hdRec = (S, city, g) => { const H = S.hoard || (S.hoard = { rec: {} }), k = city + '|' + g; return H.rec[k] || (H.rec[k] = { n: 0, warned: false, pun: false, def: 0, fair: 0, since: null }); };
// حال سلعة الحاجة في مدينة: ضيق السوق، وما في مخزن اللاعب
function hdState(S, city, g) {
  const c = S.cities[city], pr = S.player.props[city]; if (!c || !HOARD_GOODS[g] || c.stock[g] == null) return null;
  const need = (c.dem[g] || 0) * HOARD.needDays, stock = c.stock[g], r = ratio(c, g), short = need > 0 && stock < HOARD.shortPct * need && r >= HOARD.ratioMin, deficit = Math.max(0, need - stock), held = pr ? pr.store[g] || 0 : 0;
  return { need, stock, ratio: r, short, deficit, held, hoarding: short && deficit > 0 && held >= HOARD.storeShare * deficit };
}
// كل بيع للاعب في مدينة (سوق أو دكان) يقطع المدة؛ وبعد الحادثة يُحسب البيع العادل (≤ 1.1 المرجعي) نحو التعافي
function hoardSale(S, city, g, q, net) {
  if (!hdOn(S) || !HOARD_GOODS[g] || !S.hoard) return; const rec = S.hoard.rec[city + '|' + g]; if (!rec) return;
  if (rec.pun) { const c = S.cities[city]; if (q > 0 && net / q <= HOARD.fair * refPrice(c, g)) rec.fair += q; } else { rec.n = 0; rec.warned = false; }
}
function hdEnd(rec) { rec.pun = false; rec.n = 0; rec.warned = false; rec.since = null; rec.fair = 0; }
function hoardDay(S) {
  if (!hdOn(S)) return; const P = S.player, R = repOf(P); let active = false;
  for (const city of Object.keys(P.props)) {
    for (const g in HOARD_GOODS) {
      const st = hdState(S, city, g); if (!st) continue; const has = S.hoard && S.hoard.rec[city + '|' + g]; if (!has && !st.hoarding) continue; const rec = hdRec(S, city, g);
      if (st.hoarding) {
        rec.n++;
        if (!rec.pun && rec.n === HOARD.warnDays && !rec.warned) { rec.warned = true; news(S, 'أهل ' + S.cities[city].name + ' في ضيق من ' + GD[g].name + ' وعندك منها في مخزنك؛ اطرحها بسعر عادل.', 'bad'); }
        if (!rec.pun && rec.n >= HOARD.hoardDays) { rec.pun = true; rec.def = st.deficit; rec.fair = 0; rec.since = S.day; S.hoard.last = { day: S.day, city, g }; news(S, HOARD_TEXT, 'bad'); }
      } else if (rec.pun) { hdEnd(rec); } else { rec.n = 0; rec.warned = false; }
      if (rec.pun && rec.fair >= HOARD.storeShare * rec.def) { hdEnd(rec); continue; }
      if (rec.pun) { active = true; const bs = S.bosses && S.bosses[city]; if (bs && bs.trust > HOARD.bossFloor) bs.trust = Math.max(HOARD.bossFloor, bs.trust - HOARD.bossDay); }
    }
  }
  if (active) R.hp = Math.min(HOARD.hpCap, (R.hp || 0) + HOARD.repDay); else if (R.hp) R.hp = Math.max(0, R.hp - HOARD.recDay);
}
// للواجهة: تنبيهات المكتب وحال المدينة
function hoardView(S) {
  if (!hdOn(S)) return { on: false, items: [], hp: 0 }; const items = [], H = S.hoard;
  if (H) for (const k in H.rec) { const rec = H.rec[k]; if (!(rec.pun || rec.warned)) continue; const [city, g] = k.split('|'); items.push({ city, g, name: GD[g].name, cityName: S.cities[city].name, pun: rec.pun, days: rec.n }); }
  return { on: true, items, hp: S.player.rep ? S.player.rep.hp || 0 : 0, text: HOARD_TEXT };
}
function hoardCity(S, city) {
  if (!hdOn(S) || !S.cities[city]) return []; const out = [];
  for (const g in HOARD_GOODS) { const st = hdState(S, city, g); if (!st || !st.short) continue; const rec = S.hoard && S.hoard.rec[city + '|' + g]; out.push({ g, name: GD[g].name, kind: HOARD_GOODS[g], held: Math.floor(st.held), mine: st.held >= 1, hoarding: st.hoarding, pun: !!(rec && rec.pun), days: rec ? rec.n : 0 }); }
  return out;
}
