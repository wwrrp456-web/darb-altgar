/* ---------- 1 الرئيسية ---------- */
const HB = ART['brand/cover'] || ART['scene/caravan'];
let newSure = false;
function newGameCard(inProfile) {
  if (!newSure) return `<button class="btn ghost sm" data-act="newask" style="margin-top:12px">لعبة جديدة</button>`;
  return `<div class="card" style="margin-top:12px;border-color:var(--bad-ink)"><b>هل أنت متأكد؟</b><p class="small">سيضيع كل تقدّمك الحالي ولا يمكن استرجاعه.</p><div class="row"><button class="btn" data-act="newgo" style="background:var(--bad-ink)">نعم، ابدأ من جديد</button><button class="btn ghost" data-act="newcancel">تراجع</button></div></div>`;
}
function newGameNow() {
  newSure = false; storyGo = storyGate(); S = E.newGame(Date.now() % 100000 + 1); sel = 'riyadh'; carSel = 1; mapC = 'all'; mapView = { zoom: 1, center: null }; mapListOpen = {}; dg = null; prof = false; seq = null; view = null; mhelp = null;
  try { localStorage.removeItem('darb-guide-off'); guideOff = false; } catch (e) {}
  S.tut = { on: false, i: 0, f: {} }; persist(); setSpeed(0); return go('home');
}
function screenHome() {
  const P = S.player, nw = E.netWorth(S), started = P.trips > 0 || S.day > 0, cr = main();
  const nextPh = S.phase < 4 ? E.PHASE_AT[S.phase] : null;
  const phNames = ['', 'تاجر متجول', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'];
  let h = `<section class="home-intro" aria-label="غلاف درب التجّار"><div class="home-brand"><h1>${ART['brand/wordmark'] ? `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">` : 'درب التجّار'}</h1><p>قافلة، وأسواق تتنفس، وإمبراطورية تمتد من مصر إلى الصين.</p></div><div class="hero">${HB ? `<img class="herobg" src="${HB}" alt="قافلة التاجر ومعالم دول التجارة">` : heroScene()}${HB ? '' : pic('hero/trader', 'trader', 'التاجر')}</div></section>`;
  if (oldSave) h = `<div class="guide" style="margin-bottom:12px">هذا إصدار جديد بعالم من خمس دول، ولا يقرأ حفظ الإصدار السابق. بدأت لك لعبة جديدة.</div>` + h;
  h += `<div class="grid g2" style="margin-top:12px"><div class="card"><h2>الحكاية</h2><p class="story">مات جدّك وترك لك قافلة صغيرة وثمانمئة ريال في ${esc(cityName(S.startCity || 'riyadh'))}. من هنا تبدأ دروب التجارة: بنجدٍ تمرٌ وقهوة، وبمصر قطنٌ وورق، وبفارس سجادٌ وزعفران، وبالهند توابلُ وأحجار، وبالصين حريرٌ وخزف. وعلى كل درب جمارك ولصوص وعواصف. اشترِ حيث الرخص، وبِع حيث الغلاء، ثم ابنِ دكاكين ومخازن ومصانع في مدن العالم… حتى يُقال عنك: <b>سيّد السوق</b>.</p><div class="row">${S.learn && !S.learn.char && !storyGo && !NOLEARN ? '<button class="pri big" data-act="storygo">🐪 ابدأ الرحلة</button>' : `<button class="pri big" data-go="${cr.left > 0 ? 'map' : 'market'}">${started ? '🐪 تابع الرحلة' : '🐪 ابدأ الرحلة'}</button>`}<button data-go="map">🗺️ الخريطة</button></div></div>`;
  h += `<div class="card"><h2>حالتك</h2><div class="kv"><span>اللقب</span><b>${E.titleOf(nw)}</b></div><div class="kv"><span>اليوم</span><b class="num">${S.day}</b></div><div class="kv"><span>السيولة (ريال معادل)</span><b class="num">${fmt(P.gold)}</b></div><div class="kv"><span>🇸🇦 ريال · 💵 دولار · 🥇 ذهب</span><b class="num">${fmt(P.wallet.sar)} · $${fmt(P.wallet.usd)} · ${P.wallet.au.toFixed(2)}غ</b></div><div class="kv"><span>الثروة الصافية</span><b class="num">${fmt(nw)}</b></div><div class="kv"><span>الطور</span><b>${S.phase} · ${phNames[S.phase]}</b></div>${nextPh ? `<div class="small muted" style="margin-top:8px">الطور ${S.phase + 1} عند ثروة ${fmt(nextPh)}</div>${bar(nw, nextPh, 'gold')}` : '<p class="small">وصلت إلى آخر طور. لا نهاية للعبة.</p>'}</div></div>`;
  const g = guideHTML(); if (g) h += `<div style="margin-top:12px">${g}</div>`;
  h += mentorCard() + installCard() + newGameCard();
  h += `<h2 style="margin-top:16px">كيف تلعب؟</h2><div class="grid g4">`;
  [['🛒', 'اشترِ', 'في «السوق» السعر الأخضر يعني رخيص. اشترِ منه.'], ['🧭', 'سافر', 'من «الخريطة» اختر مدينة غالية واضغط سافر.'], ['⏳', 'انتظر', 'يمضي الوقت وترى القافلة تتحرك. ⏸ يوقفه.'], ['💰', 'بِع', 'عند الوصول اضغط «بِع كل البضاعة». الفرق ربحك.']].forEach(([ic, t, d], i) => { h += `<div class="card step"><div class="n">${i + 1}</div><div><h3>${ic} ${t}</h3><div class="small muted">${d}</div></div></div>`; });
  h += `</div><h2 style="margin-top:16px">دول العالم</h2><div class="grid g3">` + E.COUNTRIES.map(ct => {
    const own = E.GOODS.filter(x => x.org && x.org.includes(ct.id));
    return `<div class="card"><div class="row" style="margin:0"><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">${citiesOf(ct.id).length} مدن</span><span class="pill">جمارك ${Math.round(ct.customs * 100)}٪</span></div><div class="small" style="margin-top:6px">تشتهر بـ: ${own.map(x => gi(x.id) + ' ' + x.name).join('، ')}</div></div>`;
  }).join('') + `</div>${seasonCard()}${shocksCard()}<h2 style="margin-top:16px">نشرة اليوم</h2><div class="card">${S.news.slice(0, 6).map(n => `<div class="kv"><span class="${n.k === 'good' ? 'cheap' : n.k === 'bad' ? 'dear' : n.k === 'rumor' ? 'rumor' : ''}">${n.k === 'rumor' ? 'إشاعة: ' : ''}${esc(n.t)}</span><span class="muted small">يوم ${n.d}</span></div>`).join('')}</div>`;
  return h;
}

