/* ---------- 3 السوق ---------- */
const tierName = t => (t === 'raw' ? 'خام' : t === 'spec' ? 'تخصصية' : t === 'live' ? 'مواشي' : 'مصنّعة');
const uw = gd => (GD[gd].live ? 'رأس' : 'وحدة');
const liveNote = gd => { const G = GD[gd]; return G.live ? `<div class="small muted">🌾 علف ${f1(G.fod)} قمح يومياً للرأس · نفوق ${(G.spoil * 100).toFixed(1)}٪ يومياً${G.hu ? ' · يمشي مع القطيع' : ' · يُنقل في الحمولة فقط'}</div>` : ''; };
function capStrip(mi, c) {
  const m = mi.all;
  return `<div class="sumbar"><div class="m"><div class="small muted">🐪 قافلتي</div><b class="num">${fmt(mi.carLoad)} / ${fmt(mi.carCap)}</b>${bar(mi.carLoad, mi.carCap, mi.carRoom < mi.carCap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.carRoom)} وزن</div></div>
  <div class="m"><div class="small muted">📦 مخزني في ${esc(c.name)}</div>${mi.store.has ? `<b class="num">${fmt(mi.store.load)} / ${fmt(mi.store.cap)}</b>${bar(mi.store.load, Math.max(1, mi.store.cap), mi.store.free < mi.store.cap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.store.free)} وزن</div>` : '<b>لا مخزن هنا</b><div class="small muted">ابنِ دكاناً ثم مخزناً من «العقارات»</div>'}</div>
  <div class="m"><div class="small muted">🏬 كل مخازني</div><b class="num">${fmt(m.load)} / ${fmt(m.cap)}</b>${bar(m.load, Math.max(1, m.cap))}<div class="small muted">${m.rows.length} مدينة · فارغ ${fmt(m.free)}</div></div>
  <div class="m"><div class="small muted">💰 رصيدك</div><b class="num">${fmt(S.player.gold)} ريال</b><div class="small muted">${fmt(S.player.wallet.sar)} ر.س · $${fmt(S.player.wallet.usd)} · ${S.player.wallet.au.toFixed(2)}غ</div></div></div>`;
}
const priceTag = r => r < 0.85 ? `<span class="pt g">🟢 فرصة شراء — أرخص بـ${Math.round((1 - r) * 100)}٪</span>` : r > 1.15 ? `<span class="pt r">🔴 غالية — لا تشترِ (أغلى بـ${Math.round((r - 1) * 100)}٪)</span>` : '<span class="pt n">⚪ سعر عادي</span>';
const refBar = r => `<i class="refbar" title="موضع السعر بالنسبة للمرجعي"><b style="inset-inline-start:${Math.round(Math.max(0, Math.min(1, (r - 0.6) / 0.8)) * 100)}%"></b></i>`;
const refLine = (ref, price, r) => `<div class="refline">السعر المرجعي (العادي): <b>${f1(ref)}</b> · اليوم: <b class="${r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : ''}">${f1(price)}</b></div><div>${priceTag(r)}</div>${refBar(r)}`;
const helpBtn = '<button class="helpbtn" data-act="help" aria-label="شرح مبسّط">؟</button>';
function helpHTML() {
  const c = S.cities[main().city], g = cheapestGood() || 'dates', price = E.unitPrice(c, g), ref = E.refPrice(c, g), r = price / ref;
  return `<div class="lbox"><div class="lhead"><span class="lnum">📘</span><div><div class="small muted">شرح مبسّط</div><h2 style="margin:0">دليل الأسعار والربح</h2></div></div>
  ${mentorSay('هذه أهم كلمتين في التجارة يا ولدي، وسأشرحهما بأبسط ما أستطيع.', 'teach')}
  <div class="card"><b>💰 السعر المرجعي</b><p>هو <b>السعر العادي الأساسي</b> للسلعة في السوق، السعر الذي يُفترض أن تُشترى به. مثال من سوقك: ${GD[g].name} مرجعيها ${f1(ref)} ريال، واليوم سعرها ${f1(price)} ريال.</p></div>
  <div class="card"><b>🟢🔴 الألوان</b><p>🟢 <b>خضراء</b>: أرخص من المرجعي بـ15٪ فأكثر → فرصة، اشترِ.<br>⚪ <b>عادية</b>: قريبة من المرجعي.<br>🔴 <b>حمراء</b>: أغلى منه بـ15٪ فأكثر → لا تشترِ.</p><p class="small muted">الآن ${GD[g].name}: ${priceTag(r)}</p></div>
  <div class="card"><b>📈 هامش الربح</b><p>يجيب عن سؤال واحد: <b>لكل 100 ريال تدفعها، كم تربح؟</b> إن اشتريت بـ100 وبعت بـ120 فربحك 20، وهامشك 20٪. كلما كبر الهامش كانت الصفقة أحسن، وأقل ما أنصحك به 15٪.</p></div>
  <div class="card"><b>🧾 المصاريف</b><p>نفقة الطريق والضريبة والجمارك تُخصم من ربحك، واللعبة تحسبها لك داخل «الربح المتوقع» فلا تنسَها.</p></div>
  <div class="card"><b>✅ القاعدة الذهبية</b><p>اشترِ حين تكون السلعة خضراء، وبِعها في سوق سعرها فيه أعلى، بهامش 15٪ فأكثر.</p></div>
  <button class="btn" data-act="lclose">فهمت</button></div>`;
}
/* ---------- السوق: أقسام وقوائم منسدلة وصفوف مضغوطة ---------- */
const FOODS = new Set(['wheat', 'dates', 'rice', 'sugar', 'honey', 'oliveoil', 'driedfish', 'cheese', 'raisins', 'jerky', 'eggs', 'tea', 'coffee', 'spice', 'saffron', 'salt']);
const MATS = new Set(['wood', 'iron', 'wool', 'cotton', 'leather', 'tools', 'paper', 'glass', 'papyrus', 'textile', 'soap']);
const catOf = g => (GD[g].live ? 'live' : FOODS.has(g) ? 'food' : MATS.has(g) ? 'mat' : 'lux');
const MCATS = [['food', '🌾', 'أطعمة'], ['mat', '🪵', 'خامات وأدوات'], ['lux', '💎', 'كماليات'], ['live', '🐑', 'مواشي']];
const MSORTS = [['cheap', 'الأرخص أولاً'], ['profit', 'الأربح أولاً'], ['stock', 'الأوفر أولاً'], ['name', 'بالاسم']];
let msort = ui.msort || 'cheap', mq = '', msub = 'all', detOpen = {};
// سمات الأصناف: أيقونة واسم ونجوم (1–5)، والمتوسط 3
const TRAITS = [['meat', 'trait_meat', 'لحم'], ['milk', 'trait_milk', 'لبن وبيض'], ['wool', 'trait_wool', 'صوف'], ['speed', 'trait_speed', 'سرعة'], ['endu', 'trait_endurance', 'تحمّل'], ['fert', 'trait_fertility', 'خصوبة']];
const ti = k => (ART['ui/' + k] ? `<img class="ti" src="${ART['ui/' + k]}" alt="">` : '');
const trOf = g => (GD[g].br ? GD[g].br.tr : null);
const stars = n => '●'.repeat(Math.round(n)) + '○'.repeat(5 - Math.round(n));
const traitLine = g => { const t = trOf(g); if (!t) return ''; return TRAITS.filter(([k]) => t[k] >= 4 && !(k === 'wool' && GD[g].sp !== 'sheep' && GD[g].sp !== 'goat') && !(k === 'speed' && !['horse', 'camel'].includes(GD[g].sp))).slice(0, 2).map(([k, , n]) => n + ' ' + t[k]).join(' · '); };
const breedCard = g => {
  const G = GD[g], t = trOf(g); if (!t) return '';
  const rows = TRAITS.filter(([k]) => !(k === 'wool' && !['sheep', 'goat'].includes(G.sp)) && !(k === 'speed' && !['horse', 'camel'].includes(G.sp))).map(([k, ic, n]) => `<div class="trow">${ti(ic)}<span class="tn">${k === 'milk' && ['chicken', 'duck'].includes(G.sp) ? 'بيض' : n}</span><span class="tbar num" aria-label="${t[k]} من 5">${stars(t[k])}</span></div>`).join('');
  return `<div class="card breedc"><b>صفات ${G.name}</b> <span class="pill">${['صنف مبتدئ', 'صنف متوسط', 'صنف متقدم'][G.br.tier]}</span><div class="tgrid">${rows}</div><div class="small muted">النجوم تقارن بالصنف البلدي (3 نجوم). التحمّل يقلّل النفوق، والخصوبة تزيد المواليد، واللحم والصوف واللبن تزيد غلّة المزرعة والذبح.</div></div>`;
};
const SPECIES = ['sheep', 'goat', 'cow', 'buffalo', 'camel', 'horse', 'chicken', 'duck'];
const qLabel = (cr, g) => { const q = E.qualOf(cr.basis, g); return q < 0.995 ? `<span class="pill" title="جودتها تضرب السعر">صنعة محلية ${Math.round(q * 100)}٪</span>` : ''; };
const holdOf = (cr, g) => Math.floor(cr.cargo[g] || 0) + Math.floor((cr.herd || {})[g] || 0);
const youngHold = (cr, g) => Math.floor(E.youngOf(cr, g));
function goodRow(gd, k) {
  const { c, v, cr } = k, G = GD[gd], price = v.p[gd], r = price / E.refPrice(c, gd), have = holdOf(cr, gd), sold = E.sells(c, gd), stock = sold ? Math.floor(v.st[gd]) : 0, none = stock < 1;
  const tone = r < 0.85 ? 'g' : r > 1.15 ? 'r' : 'n', tag = r < 0.85 ? `<span class="pill good">رخيص ${Math.round((1 - r) * 100)}٪</span>` : r > 1.15 ? `<span class="pill bad">غالٍ +${Math.round((r - 1) * 100)}٪</span>` : '';
  const sub = !sold ? 'بيع فقط' : none ? 'نفد' : fmt(stock) + ' ' + uw(gd) + (traitLine(gd) ? ' · ' + traitLine(gd) : '');
  return `<div class="card gcard grow ${none && !have ? 'locked' : r < 0.85 ? 'cheapc' : r > 1.15 ? 'dearc' : ''}" data-gd="${gd}"><div class="top"><span class="ic">${gi(gd)}</span><div style="flex:1;min-width:0"><b>${G.name}</b> ${tag}${c.sig === gd ? '<span class="pill good">منتج خاص</span>' : ''}<div class="small muted">${sub}${have ? ' · معك <b>' + have + '</b>' : ''}</div></div><div class="gprice ${tone}"><div class="price">${pr(price, c.country)}</div><div class="small muted pctline">${Math.round(r * 100)}٪ من المعتاد</div></div><span class="chev" aria-hidden="true">›</span></div></div>`;
}
function holdRow(gd, k) {
  const { c, cr, live } = k, G = GD[gd], n = holdOf(cr, gd), y = youngHold(cr, gd), herdN = Math.floor((cr.herd || {})[gd] || 0), cargoN = Math.floor(cr.cargo[gd] || 0);
  const q = live && n >= 1 ? E.quoteSell(S, sel, gd, n, E.qualOf(cr.basis, gd)) : null, avg = E.avgCost(cr.basis, gd), pl = q && avg != null ? q.net - avg * n : null;
  return `<div class="card gcard grow hold" data-gd="${gd}"><div class="top"><span class="ic">${gi(gd)}</span><div style="flex:1;min-width:0"><b>${G.name}</b> ${qLabel(cr, gd)} <span class="small muted">${cargoN ? cargoN + ' في الحمولة' : ''}${cargoN && herdN ? ' · ' : ''}${herdN ? herdN + ' في القطيع' : ''}${y ? ' · ' + y + ' صغيراً' : ''}</span><div class="small">${avg != null ? 'تكلفتك ' + f1(avg) + ' للوحدة' : ''}${pl != null ? ` · لو بعت هنا <b class="pl ${plCls(pl)} num">${sgn(pl)} ر.س</b>` : ''}</div></div><span class="chev" aria-hidden="true">›</span></div></div>`;
}
// ساحة المدينة: صورة المشهد بنقاط ضغط تفتح حواراً (للمدن التي لها مشهد في src/dialogs.js)
function plazaHTML(c, atHere) {
  const sc = E.DLG.SCENES[c.id], bg = sc && (art(sc.img) || art('city/' + c.id)); if (!sc || !bg) return null; // مدينة بلا ساحة مرسومة تستعمل صورتها العامة مؤقتاً
  return `<div class="plaza" role="group" aria-label="${sc.title}"><img class="plz-bg" src="${bg}" alt="${sc.title}">${sc.spots.map(sp => `<button class="spot ${atHere ? '' : 'far'}" style="left:${sp.x}%;top:${sp.y}%" data-act="spot" data-g="${sp.dlg}" aria-label="${sp.label}">${art(sp.icon) ? `<img src="${art(sp.icon)}" alt="">` : ''}<span>${sp.label}</span></button>`).join('')}<div class="plz-cap">${sc.title}${atHere ? ' · اضغط على من تريد محادثته' : ' · للتحدث عليك أن تصل المدينة بقافلتك'}</div></div>`;
}
// تنبيهات الصدمات: إشاعات قبل ثلاثة أيام وما يجري الآن
function seasonCard() {
  const n = E.seasonNow(S), x = E.seasonNext(S); if (!n && !x) return '';
  return `<div class="card season">${n && ART['scene/season_' + n.k] ? pic('scene/season_' + n.k, 'banner', n.name) : ''}${n ? `<div class="kv"><span class="good"><b>${ti('season_' + n.k) || ''} ${n.name}</b></span><span class="small muted">باقٍ ${n.left} يوماً</span></div><div class="small muted">${n.desc}.</div>` : ''}${x ? `<div class="kv"><span class="rumor">${ti('season_' + x.k) || ''} يقترب ${x.name}</span><span class="small muted">بعد ${x.in} أيام</span></div>` : ''}</div>`;
}
function shocksCard() {
  const list = (S.shocks || []); if (!list.length) return '';
  const text = sh => { const K = E.SHOCKS[sh.k]; let w = ''; if (sh.k === 'closure') w = ' بين ' + CD[sh.a].name + ' و' + CD[sh.b].name; else if (sh.city && S.cities[sh.city]) w = ' في ' + S.cities[sh.city].name; else if (sh.country) w = ' في ' + CD[sh.country].name; else if (sh.a && S.cities[sh.a]) w = ' بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name; return K.name + w; };
  return `<h2 style="margin-top:16px">تنبيهات السوق</h2><div class="card shocks">${list.map(sh => sh.st === 'rumor' ? `<div class="kv"><span class="rumor"><b>إشاعة:</b> ${esc(text(sh))}</span><span class="small muted">بعد ${Math.max(0, sh.start - S.day)} أيام</span></div>` : `<div class="kv"><span class="dear"><b>جارٍ:</b> ${esc(text(sh))}</span><span class="small muted">باقٍ ${Math.max(0, sh.end - S.day)} يوماً</span></div>`).join('')}</div>`;
}
function roadHTML() {
  const R = S.road, car = S.player.caravans.find(c => c.id === R.car) || S.player.caravans[0], def = E.defenseOf(car) + (R.k === 'pirates' ? E.seaExtra(S, R.to) : 0), ratio = def / R.B;
  const hint = ratio >= 1.2 ? 'تبدو قافلتك أقوى منهم بوضوح' : ratio >= 0.85 ? 'القوتان متكافئتان تقريباً' : 'يبدون أقوى منكم';
  const val = Math.round(E.valueOf(E.holdings(car)) * 0.08);
  const sea = R.k === 'pirates', ic = ART[sea ? 'map/sea_pirates' : 'map/road_bandits'];
  return `<div class="dlg-box" role="dialog" aria-label="${sea ? 'قراصنة' : 'قطاع طرق'}">${outImg(sea ? 'sea' : 'land', 'attack')}<div class="dlg-head">${mentorAv('worried')}${sea && ART['hero/sea_pirate_captain'] ? '<img class="seacap pirate" src="' + ART['hero/sea_pirate_captain'] + '" alt="قائد القراصنة">' : ''}<div><b>${ic ? '<img class="ti" src="' + ic + '" alt="">' : ''}${sea ? 'قراصنة!' : 'قطاع طرق!'}</b><div class="small muted">${sea ? 'قبل ميناء' : 'قرب'} ${esc(cityName(R.to))}</div></div></div><div class="dlg-say">${sea ? 'اقتربت من سفينتك زوارق قراصنة بأشرعة داكنة.' : 'اعترض الطريق رجال ملثمون.'} ${hint}. ${sea ? 'بحّارة ' + (((E.shipAt(S, R.to) || {}).crew) || 0) + '، ' : ''}حرّاسك ${car.guards} ورجالك ${car.crew}${car.insured ? '، وبضاعتك مؤمَّنة (خسارتها أخف)' : ''}. ماذا تفعل؟</div><div class="dlg-opts"><button data-act="roadopt" data-c="fight">${sea ? 'قاتل بطاقمك' : 'قاتل بحرّاسك'}</button><button data-act="roadopt" data-c="pay">ادفع جزية (≈ ${fmt(val)} ريال)</button><button data-act="roadopt" data-c="evade">${sea ? 'ناور وابتعد عنهم' : 'ناور والتفّ حولهم'}</button></div></div>`;
}
/* مدير الطبقات: بطاقة واحدة في المقدّمة، والأولوية للطريق ثم نتيجته ثم الحوار ثم الدروس. يجمّد الوقت ويقفل تمرير الخلفية */
let roadRes = null;
/* مشاهد نتائج المعارك (بر وبحر): لكل نتيجة عدّة مشاهد يُختار منها مشهد لا يطابق آخر ما عُرض، فلا يتكرر المشهد نفسه. تُحمَّل كسولاً من brand/lazy/scene؛ وإن لم توجد صورها يعود البناء إلى الأيقونة الصغيرة. */
const OUT_SCENES = { land: { attack: 8, repelled: 8, robbed: 8, paid: 8, evaded: 8 }, sea: { attack: 8, repelled: 8, robbed: 8, paid: 8, evaded: 8 } }; // الحد الأعلى لعدد المشاهد لكل نتيجة؛ يُستعمل ما وُجد منها فقط
const lastOut = {}, outBag = {};
function outScene(theatre, kind) {
  const n = (OUT_SCENES[theatre] || {})[kind] || 0, ids = []; for (let i = 1; i <= n; i++) { const k = 'scene/' + theatre + '_' + kind + '_' + i; if (ART[k]) ids.push(k); }
  if (!ids.length) return ''; const id = theatre + kind; let bag = (outBag[id] || []).filter(k => ids.includes(k));
  if (!bag.length) { bag = ids.slice().sort(() => Math.random() - 0.5); if (ids.length > 1 && bag[0] === lastOut[id]) bag.push(bag.shift()); } // حقيبة: تُعرض كلها قبل أن يتكرر أيّ منها
  const pick = bag.shift(); outBag[id] = bag; lastOut[id] = pick; return pick;
}
let outPick = {}; // المشهد المعروض لحدث الطريق الحالي (يثبت طوال ظهور البطاقة)
const outImg = (theatre, kind) => { const key = theatre + kind; if (!outPick[key]) outPick[key] = outScene(theatre, kind); return outPick[key] ? `<img class="outscene" src="${ART[outPick[key]]}" alt="">` : ''; };
const roadIcon = (o, sea) => (sea ? { paid: 'sea_pirates', evaded: 'sea_fair_wind', repelled: 'sea_pirate_repelled', robbed: 'sea_pirate_robbed', storm: 'sea_storm' } : { paid: 'road_block', evaded: 'road_oasis', repelled: 'road_bandits', robbed: 'road_storm' })[o] || 'road_bandits';
function roadResHTML() {
  const o = roadRes, th = o.sea ? 'sea' : 'land', ic = 'map/' + roadIcon(o.outcome, o.sea), good = o.outcome === 'evaded' || o.outcome === 'repelled';
  return `<div class="dlg-box road-res" role="dialog" aria-label="نتيجة الطريق">${(() => { const sc = o.outcome === 'storm' && ART['scene/sea_storm_scene'] ? '<img class="outscene" src="' + ART['scene/sea_storm_scene'] + '" alt="">' : outImg(th, o.outcome); return sc || ''; })()}<div class="dlg-head">${!outPick[th + o.outcome] && !(o.outcome === 'storm' && ART['scene/sea_storm_scene']) && ART[ic] ? '<img class="ti big" src="' + ART[ic] + '" alt="">' : ''}<div><b>${o.outcome === 'storm' ? 'عاصفة في البحر' : good ? (o.sea ? 'نجوتَ من القراصنة' : 'نجوتَ من الكمين') : o.outcome === 'paid' ? (o.sea ? 'مرّت السفينة' : 'مرّت القافلة') : o.sea ? 'خسرتَ جولة البحر' : 'خسرتَ جولة الطريق'}</b></div></div><div class="dlg-say">${esc(o.msg)}</div><div class="dlg-opts"><button data-act="roadok">حسناً</button></div></div>`;
}
function fgOpen() { return !!(S && (S.road || roadRes || (S.story && S.story.cur))); }
function fgSync() {
  const on = fgOpen() || !!(learnNext() && !NOLEARN && S.learn && S.learn.char);
  document.body.classList.toggle('ovl', on);
  ['top', 'screen', 'nav', 'journeyBar'].forEach(i => { const e = $(i); if (e) { if (on && !e.hasAttribute('inert')) e.setAttribute('inert', ''); else if (!on) e.removeAttribute('inert'); } });
  if (fgOpen() && speed) { fgSpeed = speed; speed = 0; clearTimeout(timer); renderHeader(); }
}
let fgSpeed = 0;
function renderDlg() {
  const el = $('dlg'); if (!el) return;
  const hide = () => { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; } delete el.dataset.k; };
  if (S && S.road) { const html = roadHTML(); if (el.dataset.k !== html) { el.dataset.k = html; el.innerHTML = html; } el.hidden = false; return fgSync(); }
  if (roadRes) { const html = roadResHTML(); if (el.dataset.k !== html) { el.dataset.k = html; el.innerHTML = html; } el.hidden = false; return fgSync(); }
  const v = S && S.story && S.story.cur ? E.dlgView(S) : null;
  if (!v) { hide(); return fgSync(); }
  const fk = 'talk/' + v.who + '_' + v.mood, bk = v.who.startsWith('boss_') ? 'boss/' + v.who.slice(5) : '', face = v.who === 'salem' ? mentorAv(v.mood) : (!art(fk) && bk && art(bk) ? pic(bk, 'dlg-face', v.name) : pic(fk, 'dlg-face', v.name));
  const html = `<div class="dlg-box" role="dialog" aria-label="${esc(v.name)}"><div class="dlg-head">${face}<div><b>${esc(v.name)}</b><div class="small muted">${esc(cityName(v.city))}</div></div><span class="spacer"></span><button class="sm" data-act="dlgclose">إغلاق</button></div><div class="dlg-say" data-act="dlgskip">${addr(v.say)}</div><div class="dlg-opts">${v.opts.map(o => `<button data-act="dlgopt" data-k="${o.i}">${esc(o.t)}</button>`).join('')}</div></div>`;
  if (el.dataset.k !== html) { el.dataset.k = html; el.innerHTML = html; startTyping(el); }
  el.hidden = false; fgSync();
}
/* كتابة الحوار حرفاً حرفاً كأنه يُكتب في اللحظة؛ النقر على النص يكمله. تتعطل مع تقليل الحركة وفي الاختبارات الآلية (إلا ?type=1) */
let typer = null;
const typeOn = () => { try { if (/[?&]type=1/.test(location.search)) return true; if (navigator.webdriver) return false; return !(matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
function endTyping() { if (typer) { clearInterval(typer.t); typer.done(); typer = null; } }
function startTyping(el) {
  endTyping(); const say = el.querySelector('.dlg-say, .msay .bub, .react-say'), opts = el.querySelector('.dlg-opts'); if (!say || !typeOn()) return;
  const nodes = []; const w = document.createTreeWalker(say, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nodes.push({ n, t: n.nodeValue });
  const total = nodes.reduce((a, x) => a + x.t.length, 0); if (!total) return;
  say.style.minHeight = say.offsetHeight + 'px'; nodes.forEach(x => { x.n.nodeValue = ''; }); if (opts) opts.classList.add('wait'); say.classList.add('typing');
  let shown = 0;
  const paint = () => { let left = shown; for (const x of nodes) { const k = Math.min(left, x.t.length); x.n.nodeValue = x.t.slice(0, k); left -= k; } };
  const done = () => { shown = total; paint(); say.classList.remove('typing'); say.style.minHeight = ''; if (opts) opts.classList.remove('wait'); };
  const t = setInterval(() => { shown += 1; paint(); if (shown >= total) endTyping(); }, 24);
  typer = { t, done };
}
function screenMarket() {
  const cr = main(), c = S.cities[sel], v = marketView(sel), live = liveView(sel), ct = CD[c.country];
  const atHere = cr.city === sel && cr.left === 0, ld = E.loadOf(cr);
  const mi = live ? E.marketInfo(S, sel, 1) : null, byG = {}; if (mi) mi.goods.forEach(x => byG[x.g] = x);
  const lvx = S.learn && S.learn.char ? lvlOf() : null, guided = !!(lvx && lvx.mode === 'guide');
  const dl = cr.left === 0 ? deals() : [], k = { c, v, cr, live, atHere, deals: dl };
  const det = (key, def, sum, body) => `<details class="mdet" data-dk="${key}" ${(detOpen[key] == null ? def : detOpen[key]) ? 'open' : ''}><summary>${sum}</summary>${body}</details>`;
  let h = `${plazaHTML(c, atHere) || pic(ART['city/' + c.id] ? 'city/' + c.id : 'scene/' + c.country, 'banner', c.name)}<div class="row mhead"><select id="mktCity" class="msel" aria-label="المدينة">${E.COUNTRIES.map(x => `<optgroup label="${x.flag} ${x.name}">${citiesOf(x.id).map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${id === cr.city ? '🐪 ' : ''}${esc(cityName(id))}</option>`).join('')}</optgroup>`).join('')}</select><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span>${live ? '<span class="pill good">أسعار حيّة</span>' : `<span class="pill bad">قبل ${v.age} يوم</span>`}${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${c.ev.left} يوم</span>` : ''}<span class="spacer"></span></div>`;
  const g = guideHTML(); if (g) h += `<div style="margin:10px 0">${g}</div>`;
  if (cr.left > 0) h += `<div class="card" style="margin-bottom:12px">القافلة في الطريق إلى ${cityTag(cr.dest)}.</div>`;
  else if (!atHere) {
    const dd = E.tripDays(S, cr, cr.city, sel), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    h += `<div class="card" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>قافلتك في <b>${cityTag(cr.city)}</b>. للتداول هنا عليك السفر.</span><span class="spacer"></span>${E.travelBlock(S, main(), sel) ? `<span class="small">🔒 مقفل: ${E.travelBlock(S, main(), sel)}</span>` : `<button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)} (${dd} أيام · خطر ${Math.round(rk * 100)}٪${cus ? ' · جمارك ' + Math.round(cus * 100) + '٪' : ''})</button>`}</div>`;
  }
  if (dl.length) h += det('deals', (S.learn && S.learn.char && S.learn.level < 11 && !S.learn.free) ? true : ui.dealsOpen != null ? !!ui.dealsOpen : !(S.learn && S.learn.char), `<b>أفضل الصفقات من ${cityTag(cr.city)}</b> ${helpBtn}`, `<div class="grid g3" style="margin:8px 0 14px">${dl.slice(0, 3).map(o => dealCard(o, true)).join('')}</div>`);
  h += defectCard();
  if (atHere) h += packCard(cr);
  const bs = bossStrip(c); if (bs) h += det('boss', false, `<b>👑 زعيم السوق</b>`, bs);
  if (mi) h += det('sum', false, `<b>ملخص سوق ${esc(c.name)}</b> <span class="pill good">متوفر ${mi.present} من ${mi.total}</span>${mi.missing.length ? `<span class="pill bad">ناقص ${mi.missing.length}</span>` : ''}`, `<div class="card" style="margin:8px 0">${mi.missing.length ? `<div class="small"><span class="dear">غير متوفر:</span> ${mi.missing.map(x => gi(x) + ' ' + GD[x].name).join('، ')}</div>` : ''}${capStrip(mi, c)}${atHere ? '' : '<p class="small muted" style="margin-bottom:0">هذه معلومات حيّة لأن لك عقاراً هنا. للتداول يجب أن تكون القافلة في المدينة.</p>'}</div>`);
  else h += `<div class="card" style="margin:10px 0"><h3 style="margin:0 0 4px">سوق ${esc(c.name)}</h3><p class="small muted" style="margin:0">معلوماتك عن هذا السوق قبل ${v.age} يوم. لترى ما فيه يجب أن تدخله بقافلتك أو أن تبني فيه دكاناً.</p></div>`;
  // السلع
  const soldHere = gd => E.sells(c, gd), lockedN = GIDS.filter(gd => soldHere(gd) && !E.breedOpen(S, gd)).length, shown = GIDS.filter(gd => (soldHere(gd) && E.breedOpen(S, gd)) || holdOf(cr, gd) >= 1 || youngHold(cr, gd) >= 1);
  const holds = shown.filter(gd => holdOf(cr, gd) >= 1 || youngHold(cr, gd) >= 1), cnt = id => shown.filter(gd => catOf(gd) === id).length;
  const fMf = guided ? 'all' : mf, fQ = guided ? '' : mq.trim();
  let list = shown.filter(gd => fMf === 'all' || fMf === 'hold' ? true : (fMf === 'here' ? (GD[gd].org || []).includes(c.country) : catOf(gd) === fMf));
  if (fMf === 'live' && msub !== 'all' && !guided) list = list.filter(gd => E.spOf(gd) === msub);
  if (fQ) list = list.filter(gd => GD[gd].name.includes(fQ));
  const best = {}; dl.forEach(o => { best[o.g] = Math.max(best[o.g] || -9, o.pct); });
  const cmp = { cheap: (a, b) => (soldHere(b) - soldHere(a)) || (v.p[a] / E.refPrice(c, a) - v.p[b] / E.refPrice(c, b)), profit: (a, b) => (best[b] || -9) - (best[a] || -9), stock: (a, b) => (v.st[b] || 0) - (v.st[a] || 0), name: (a, b) => GD[a].name.localeCompare(GD[b].name, 'ar') }[msort] || (() => 0);
  list = list.slice().sort(cmp);
  h += `<h2 style="margin-bottom:6px">السلع ${helpBtn}</h2><div class="chips mcats">${[['all', '🧺', 'الكل', shown.length]].concat(MCATS.map(([id, ic, n]) => [id, ic, n, cnt(id)])).concat([['hold', '📦', 'ما معي', holds.length]]).filter(x => x[3] > 0 || x[0] === 'all').map(([id, ic, n, nn]) => `<button data-mf="${id}" class="${fMf === id ? 'on' : ''}">${ic} ${n} <span class="small">${nn}</span></button>`).join('')}</div>`;
  if (!guided) h += `<div class="row mtools"><select id="mktSort" class="msel" aria-label="الترتيب">${MSORTS.map(([id, n]) => `<option value="${id}" ${msort === id ? 'selected' : ''}>${n}</option>`).join('')}</select>${fMf === 'live' ? `<select id="mktSub" class="msel" aria-label="النوع"><option value="all">كل المواشي</option>${SPECIES.filter(sp => shown.some(gd => GD[gd].live && E.spOf(gd) === sp)).map(sp => `<option value="${sp}" ${msub === sp ? 'selected' : ''}>${GD[sp].name} (${shown.filter(gd => E.spOf(gd) === sp).length})</option>`).join('')}</select>` : ''}<input id="mktQ" class="msearch" type="search" placeholder="ابحث عن سلعة" value="${esc(mq)}" aria-label="بحث"></div>`;
  const rowOf = gd => (fMf === 'hold' ? holdRow(gd, k) : goodRow(gd, k));
  if (fMf === 'hold') list = holds.filter(gd => list.includes(gd));
  if (!list.length) h += `<div class="card small muted">${fMf === 'hold' ? 'لا تحمل شيئاً الآن.' : 'لا سلع بهذا الاختيار في هذا السوق.'}</div>`;
  else if (fMf === 'all' || fMf === 'here') {
    if (holds.length && atHere && !fQ) h += det('hold', true, `<b>📦 ما معي</b> <span class="pill">${holds.length}</span>`, `<div class="row" style="margin:6px 0"><button class="sm" data-act="sellall">بِع كل ما معك هنا</button></div><div class="mlist">${holds.map(gd => holdRow(gd, k)).join('')}</div>`);
    MCATS.forEach(([id, ic, n]) => { const part = list.filter(gd => catOf(gd) === id); if (part.length) h += det('cat_' + id, true, `<b>${ic} ${n}</b> <span class="pill">${part.length}</span>`, `<div class="mlist">${part.map(rowOf).join('')}</div>`); });
  } else if (fMf === 'live') {
    SPECIES.forEach(sp => { const part = list.filter(gd => E.spOf(gd) === sp); if (part.length) h += det('sp_' + sp, true, `<b>${gi(sp)} ${GD[sp].name}</b> <span class="pill">${part.length}</span>`, `<div class="mlist">${part.map(rowOf).join('')}</div>`); });
    if (lockedN) h += `<div class="card small muted">🔒 ${lockedN} صنفاً آخر في هذا السوق يُفتح مع تقدّمك في مستويات التعلّم.</div>`;
  } else h += `<div class="mlist">${list.map(rowOf).join('')}</div>`;
  return h;
}
const pedTag = (h, g) => (E.spOf(g) === 'horse' && ((h.herd || {})[g] || 0) >= 1 ? ` · سلالة <b>${E.pedOf(h, g).toFixed(1)}</b> نجمة` : '');
const herdLine = (cr, g) => { const a = Math.floor((cr.herd || {})[g] || 0), m = Math.min(a, Math.floor(E.malesOf(cr, g))), y = Math.floor(E.youngOf(cr, g)); const pg = E.pregOf(cr, g); return `${gi(g)} ${GD[g].name}: <b>${a}</b> (ذكور ${m} · إناث ${a - m}${pg ? ` · حوامل ${pg}` : ''})${y ? ` + <b>${y}</b> صغيراً` : ''}${pedTag(cr, g)}`; };
// التزاوج والتهجين: لكل صنف إناث تختار أي ذكر من نوعها يلقّحها؛ إن اختلف الصنفان فالمولود هجين
function pairBox(where, key, h) {
  const herd = h.herd || {}, open = E.hybridOpen(S);
  const fs = Object.keys(herd).filter(g => (herd[g] || 0) >= 1 && E.BREED[g] && GD[g].hu && !GD[g].hyb && ((herd[g] || 0) - E.malesOf(h, g)) >= 1);
  const spp = new Set(fs.map(g => E.spOf(g))); const multi = Array.from(spp).filter(sp => Object.keys(herd).filter(g => (herd[g] || 0) >= 1 && E.spOf(g) === sp && !GD[g].hyb).length >= 2);
  if (!multi.length && !Object.keys(h.pair || {}).length) return '';
  let b = `<div class="pairbox"><div class="small"><b>${ti('pair')} التزاوج والتهجين</b>${open ? '' : ` <span class="pill">🔒 المستوى ${E.HYB_LV}</span>`}</div>`;
  if (!open) return b + `<div class="small muted">تلقيح ذكور صنف لإناث صنف آخر ينتج هجيناً بصفات الأبوين. يُفتح عند المستوى ${E.HYB_LV}.</div></div>`;
  fs.filter(g => multi.includes(E.spOf(g))).forEach(g => {
    const cur = (h.pair || {})[g] || g, opts = Object.keys(herd).filter(m => E.spOf(m) === E.spOf(g) && !GD[m].hyb && E.malesOf(h, m) >= 1);
    const cross = cur !== g && opts.includes(cur), tF = E.trHold(h, g), tM = cross ? E.trHold(h, cur) : null;
    const prev = cross ? TRAITS.filter(([k]) => !(k === 'wool' && !['sheep', 'goat'].includes(GD[g].sp)) && !(k === 'speed' && !['horse', 'camel'].includes(GD[g].sp))).map(([k, ic]) => `${ti(ic)} ${Math.min(5, (tF[k] + tM[k]) / 2 + (k === 'endu' || k === 'fert' ? 0.5 : 0)).toFixed(1)}`).join(' · ') : '';
    b += `<div class="itemrow" style="flex-wrap:wrap"><span>${gi(g)} إناث <b>${GD[g].name}</b> ← ذكور</span><select class="msel" data-pair="1" data-where="${where}" data-key="${key}" data-f="${g}" aria-label="ذكور التلقيح">${opts.map(m => `<option value="${m}" ${m === cur ? 'selected' : ''}>${GD[m].name}${m === g ? ' (نفس الصنف)' : ''}</option>`).join('')}</select>${cross ? `<div class="small muted" style="flex-basis:100%">${ti('hybrid')} المولود: ${GD[E.hybOf(E.spOf(g))].name} · ${prev}</div>` : ''}</div>`;
  });
  return b + '</div>';
}
function herdRow(gd, x, none, qo) {
  const G = GD[gd], cr = main(); if (!G.hu) return ''; const hv = (cr.herd || {})[gd] || 0, free = E.herdCap(cr) - E.herdUnits(cr);
  const q = qo != null ? qo : clampQ(QS['g:' + gd] == null ? 1 : QS['g:' + gd], 9999), n = Math.max(0, Math.min(q, Math.floor(free / G.hu), x ? Math.floor(x.stock || 0) : 0));
  let h = `<div class="herdbox"><div class="small"><b>🐑 القطيع الماشي:</b> <span class="num">${fmt(E.herdUnits(cr))}</span> من <span class="num">${fmt(E.herdCap(cr))}</span> وحدة${hv ? ` · عندك <b>${fmt(Math.floor(hv))}</b> ${uw(gd)} منها` : ''}</div>${hv || E.youngOf(cr, gd) >= 1 ? `<div class="small muted">${herdLine(cr, gd)}</div>` : ''}${E.BREED[gd] && hv >= 2 ? '<div class="small muted">تتكاثر على الطريق إن وُجد ذكر وأنثى وسعة للصغار</div>' : ''}`;
  if (!E.herdCap(cr)) h += '<div class="qnote soft">وظّف راعياً من شاشة القافلة ليسوق قطيعك (يمشي معها دون أن يأخذ حمولة)</div>';
  else if (!none && x) h += `<div class="small" style="margin-top:6px"><b>اشترِ ${n} للقطيع بتحديد الجنس:</b></div><div class="row sexrow" style="margin:4px 0 0">${[['m', 'sex_male', 'ذكر'], ['f', 'sex_female', 'أنثى'], ['p', 'pregnant', 'أنثى حامل']].map(([sx, ic, nm]) => `<button class="sm ${sx === 'f' ? 'pri' : ''}" data-act="buyherd" data-sex="${sx}" data-g="${gd}" data-q="${n}" ${n < 1 ? 'disabled' : ''}>${ti(ic)} ${nm} <span class="num small">${n ? fmt(Math.round(E.quoteBuy(S, sel, gd, n, null).cost * E.SEXF[sx])) : ''}</span></button>`).join('')}</div><div class="small muted">الحامل أغلى بـ${Math.round((E.SEXF.p - 1) * 100)}٪ لكنها تلد قريباً. تحتاج ذكراً واحداً لكل 6 إناث لتتكاثر القطيع.</div><div class="row" style="margin:4px 0 0">${hv >= 1 ? `<button class="sm" data-act="sellherd" data-g="${gd}" data-q="${Math.floor(hv)}">بِع كل القطيع (${Math.floor(hv)})</button>` : ''}</div>`;
  else if (hv >= 1) h += `<div class="row" style="margin:4px 0 0"><button class="sm" data-act="sellherd" data-g="${gd}" data-q="${Math.floor(hv)}">بِع كل القطيع (${Math.floor(hv)})</button></div>`;
  return h + '</div>';
}
// المساومة: قراءة مزاج التاجر واختيار الأسلوب الأنسب (من المستوى 4)
const HG_WORD = { pleased: 'مبتسم', neutral: 'هادئ', annoyed: 'منزعج' }, HG_CHOICE = { firm: 'أصرّ على السعر', ref: 'اذكر السعر المرجعي', praise: 'طيّب خاطره' };
const moodFace = m => (ART['ui/mood_' + m] ? `<img class="mface" src="${ART['ui/mood_' + m]}" alt="${HG_WORD[m]}">` : `<span class="mface mf-${m}">${HG_WORD[m]}</span>`);
function haggleBox(gd, qb, have) {
  const cr = main(); if (!(cr.city === sel && cr.left === 0) || !E.haggleOpen(S)) return '';
  const hg = S.player.hg, G = hg && hg.game && hg.game.g === gd && hg.game.city === sel ? hg.game : null, left = E.haggleLeft(S, sel), c = S.cities[sel], H = E.HAGGLE;
  let h = `<div class="card haggle"><div class="row" style="margin:0">${ti('haggle_scale')}<b>المساومة</b><span class="pill">${ti('haggle_timer')} المتبقي اليوم ${left}</span></div>`;
  [['buy', 'خصم'], ['sell', 'علاوة']].forEach(([sd, w]) => { const v = E.vouchOf(S, sel, gd, sd); if (v) h += `<div class="small"><span class="pill good">اتفاقك: ${w} ${Math.round(Math.abs(1 - v.mul) * 100)}٪ على ${fmt(Math.floor(v.left))} وحدة اليوم</span></div>`; });
  if (G && !G.done) {
    const m = G.moods[G.round];
    h += `<div class="hgface">${moodFace(m)}<div><b>التاجر ${HG_WORD[m]}</b><div class="small muted">${esc(G.culture || '')} · الجولة ${G.round + 1} من ${G.rounds || H.rounds} · أخطاء ${G.miss} من ${G.maxMiss || H.maxMiss}</div></div></div>`;
    const lg = G.log[G.log.length - 1]; if (lg) h += `<div class="small ${lg.right ? 'cheap' : 'dear'}">${lg.right ? 'أصبتَ' : 'أخطأتَ'}${lg.right ? '' : '. ' + esc((E.HG_CULT[G.cc] || {}).trait || '')}</div>`;
    h += `<div class="small muted">كيف تُقنعه؟</div><div class="row hgbtns">${Object.keys(HG_CHOICE).map(k => `<button class="sm" data-act="hgchoose" data-c="${k}">${HG_CHOICE[k]}</button>`).join('')}</div>`;
  } else if (G) {
    h += G.wins ? `<div class="small">${ti('haggle_win')} <b class="cheap">اتفقتما:</b> ${G.side === 'buy' ? 'خصم' : 'علاوة'} <b class="num">${Math.round(Math.abs(1 - G.mul) * 100)}٪</b> على ${fmt(G.qty)} وحدة اليوم في ${esc(c.name)}.</div>` : `<div class="small dear">${ti('haggle_fail')} لم يلن التاجر هذه المرة. لكل سوق طبعه، فتعلّم من الجولات.</div>`;
    { const cu = E.HG_CULT[G.cc] || E.HG_CULT.sa; h += `<div class="hglesson small"><b>ما تعلّمته عن ${esc(G.culture || '')}:</b>${G.log.map(l => `<div>${l.right ? '✓' : '✗'} التاجر ${HG_WORD[l.mood]}: الأنسب «${HG_CHOICE[l.best]}» — ${esc(cu.why[l.mood])}</div>`).join('')}</div>`; }
    h += `<div class="row"><button class="sm pri" data-act="hgclose">تمام</button></div>`;
  } else {
    const can = left >= 1, bq = qb && qb.n ? qb.n : 0;
    const cu = E.hgCult(S, sel), known = ((S.player.hgLore || {})[c.country]) || {};
    h += `<div class="small muted">اقرأ وجه التاجر واختر الأسلوب. في ${esc(cu.name)}: كل إصابة تحسّن السعر ${+(cu.step * 100).toFixed(1)}٪ حتى ${+(cu.step * cu.rounds * 100).toFixed(1)}٪ لهذه الكمية اليوم، و${cu.miss === 1 ? 'خطأ واحد ينهي' : cu.miss === 2 ? 'خطآن ينهيان' : cu.miss + ' أخطاء تنهي'} المساومة. ${esc(cu.trait)}</div>${Object.keys(known).length ? `<div class="small">${ti('haggle_scale')} <b>خبرتك هنا:</b> ${Object.keys(known).map(m => 'التاجر ' + HG_WORD[m] + ' ← «' + HG_CHOICE[known[m]] + '»').join(' · ')}</div>` : ''}<div class="row">`;
    if (E.sells(c, gd) && bq) h += `<button class="sm" data-act="haggle" data-side="buy" data-g="${gd}" data-q="${bq}" ${can && E.unitPrice(c, gd) * bq >= H.minValue ? '' : 'disabled'}>ساوم على شراء ${fmt(bq)}</button>`;
    if (have) h += `<button class="sm" data-act="haggle" data-side="sell" data-g="${gd}" data-q="${have}" ${can && E.unitPrice(c, gd) * have >= H.minValue ? '' : 'disabled'}>ساوم على بيع ${fmt(have)}</button>`;
    h += `</div>${can ? '' : '<div class="qnote">اكتفى تجّار هذه المدينة اليوم، عُد غداً.</div>'}<div class="small muted">تبدأ الصفقة من ${H.minValue} ريال.</div>`;
  }
  return h + '</div>';
}
const premTag = (c, gd) => { const p = (E.PREM[c.id] || {})[gd]; return p > 1.005 && !E.isOwn(c, gd) ? `<span class="pill" title="يغلو لأن مدينته الأصلية بعيدة">علاوة المسافة +${Math.round((p - 1) * 100)}٪</span>` : ''; };
const quotaBox = x => { if (!x || !x.quota) return ''; const q = x.quota; return `<div class="quota"><div class="small">🔑 حصتك من الزعيم اليوم: <b class="num">${fmt(Math.floor(q.left))}</b> من <b class="num">${fmt(Math.floor(q.cap))}</b> <span class="muted">(تتجدد ${fmt(Math.floor(q.perDay))} كل يوم)</span></div>${bar(q.left, q.cap, q.left < q.perDay * 0.5 ? 'red' : 'gold')}</div>`; };
function sellRow(gd, have, live) {
  if (have < 1) return `<div class="btns"><span class="lb">بِع</span><span class="small muted">لا تملك منها شيئاً</span></div>`;
  const key = 's:' + gd, q = clampQ(QS[key] == null ? 1 : QS[key], have), qs = live ? E.quoteSell(S, sel, gd, q, E.qualOf(main().basis, gd)) : null, avg = E.avgCost(main().basis, gd);
  const pl = qs && avg != null ? qs.net - avg * q : null;
  return `<div class="btns"><span class="lb">بِع</span></div>${stepper(key, q, have)}<div class="small">${qs ? `صافي ≈ <b class="num">${fmt(qs.net)}</b> ر.س${pl != null ? ` · <b class="pl ${plCls(pl)} num">${sgn(pl)}</b>` : ''}` : ''}</div>${q >= have ? '<div class="qnote soft">هذا كل ما تملكه من هذه السلعة</div>' : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="sell" data-g="${gd}" data-q="${q}">بِع ${q}</button><button class="sm" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button></div>`;
}
function agentRow(gd) {
  const key = 'a:' + gd, q0 = clampQ(QS[key] == null ? 10 : QS[key], 9999), aq = E.agentQuote(S, sel, gd, q0);
  const mx = Math.max(1, aq.cap || 1), q = clampQ(q0, mx), a2 = q === q0 ? aq : E.agentQuote(S, sel, gd, q);
  return `<div class="agentbox"><div class="btns"><span class="lb">🤝 اطلب عبر وكيلك دون سفر</span></div>${aq.cap != null || aq.ok ? stepper(key, q, mx) : ''}<div class="small">${a2.ok ? `تدفع ≈ <b class="num">${fmt(a2.total)}</b> ر.س (رسم الوكيل ${Math.round(a2.feeRate * 100)}٪) · تصل إلى مخزنك في <b>${esc(S.cities[a2.dest].name)}</b> بعد <b>${a2.days}</b> أيام` : esc(a2.msg || '')}</div>${a2.ok ? `<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="agent" data-g="${gd}" data-q="${q}">اطلب ${q}</button></div>` : ''}</div>`;
}
/* بطاقة مؤن السفر: شراء مسبق بأسهم الكمية، تُستهلك عند الانطلاق بمستوى «سريع» أو «أسرع» */
/* بطاقة البضاعة المعيبة: خيار العيب (الرد أو الأرش) عند البائع */
function defectCard() {
  const c = E.defectClaim(S); if (!c) return '';
  const d = c.d, cn = S.cities[d.city].name;
  const btns = c.here ? `<div class="row" style="margin:8px 0 0"><button class="pri sm" data-act="defret">طلب رد السلعة المعيبة (يعود لك ${fmt(c.refund)} ريال)</button><button class="sm" data-act="defarsh"${c.arshOk ? '' : ' disabled'}>طلب الأرش (${fmt(c.arsh)} ريال)</button></div>${c.arshOk ? '' : '<div class="qnote">الأرش برضا البائع، ولا يرضى بعد حتى يثق بك أكثر. الرد حقٌّ لك دائماً.</div>'}` : `<div class="qnote">ارجع إلى <b>${esc(cn)}</b> بقافلتك للمطالبة: الرد يكون عند البائع.</div>`;
  return `<div class="card defcard" style="margin-top:12px;border-color:var(--red)"><div class="row" style="margin:0"><b>⚠️ بضاعة معيبة: ${c.k} من ${esc(GD[d.g].name)}</b><span class="pill bad">تبقى ${Math.max(0, c.left)} يوماً</span></div><div class="small muted">اشتريتها من ${esc(cn)}، ثم ظهر فيها عيب كان مخفياً فنقصت قيمتها إلى النصف. لك خياران: أن تردّها وتسترد ثمنها، أو تُبقيها وتأخذ فرق القيمة (الأرش).</div>${btns}</div>`;
}
function packCard(cr) {
  const pr = E.packPrice(S, cr.city), have = cr.pack || 0, mx = Math.max(0, Math.min(E.PACE.packMax - have, Math.floor(S.player.gold / pr))), q = mx ? clampQ(QS.pk == null ? (QS.pk = 5) : QS.pk, mx) : 0;
  return `<div class="card packcard" style="margin-top:12px"><div class="row" style="margin:0"><b>مؤن السفر</b><span class="pill">معك ${have} من ${E.PACE.packMax}</span><span class="spacer"></span><span class="small muted">${pr} للوحدة هنا</span></div><div class="small muted">اختيارية: تختصر انتظارك الفعلي في الرحلات (من لوحة السفر في الخريطة). لا تشغل الحمولة، وتأتيك أيضاً جائزةً مع إتمام الدروس.</div>${mx ? `${stepper('pk', q, mx)}<div class="row" style="margin:6px 0 0"><button class="pri sm" data-act="buypack">اشترِ ${q} بـ ${fmt(q * pr)}</button><button class="sm" data-act="buypackmax">أقصى</button></div>` : `<div class="qnote">${have >= E.PACE.packMax ? 'مخزونك ممتلئ' : 'رصيدك لا يكفي'}</div>`}</div>`;
}
function buyRow(gd, x, none) {
  if (none || !x) return '';
  const mx = Math.max(0, x.canCar), key = 'g:' + gd;
  if (mx < 1) return `<div class="btns"><span class="lb">اشترِ</span></div><div class="qnote">${LIMNOTE[x.limit] || 'لا تستطيع الشراء الآن'}</div>`;
  const q = clampQ(QS[key] == null ? 1 : QS[key], mx), qb = E.quoteBuy(S, sel, gd, q, S.player.gold);
  return `<div class="btns"><span class="lb">اشترِ</span></div>${stepper(key, q, mx)}<div class="small">${qb && qb.n ? `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س` : ''}</div>${q >= mx ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="buy" data-g="${gd}" data-q="${q}">اشترِ ${q}</button></div>`;
}
/* ---------- لوحة تفصيل السلعة ---------- */
function renderModal() {
  const m = $('modal');
  if (cdg && !dg && screen === 'caravan') { m.innerHTML = cargoModalHTML(cdg); m.hidden = false; return; }
  if (!dg || screen !== 'market') { m.hidden = true; m.innerHTML = ''; return; }
  const gd = dg, G = GD[gd], c = S.cities[sel], cr = main(), v = marketView(sel), live = liveView(sel), atHere = cr.city === sel && cr.left === 0;
  const price = v.p[gd], ref = E.refPrice(c, gd), r = price / ref, hist = (S.hist.px[sel] || {})[gd] || [];
  const mi = live ? E.marketInfo(S, sel, 1) : null, x = mi && mi.goods.find(y => y.g === gd);
  const have = Math.floor(cr.cargo[gd] || 0), avg = E.avgCost(cr.basis, gd);
  const maxQ = x ? Math.max(1, x.canCar) : 100, q = dq === 'max' ? maxQ : +dq;
  const qb = live ? E.quoteBuy(S, sel, gd, q, S.player.gold) : null;
  const unitCost = have && avg != null ? avg : qb && qb.n ? qb.avg : price;
  const opts = E.sellOptions(S, sel, gd, Math.max(1, have || (qb ? qb.n : q)), unitCost), cur = E.curOf(c.country);
  let h = `<div class="mbox" role="dialog" aria-label="${G.name}"><div class="row" style="margin-top:0"><span style="font-size:40px">${gi(G.id)}</span><div><h2 style="margin:0">${G.name} ${qLabel(cr, gd)} <span class="pill">${tierName(G.tier)}</span>${G.org ? `<span class="pill">منشأ ${G.org.map(o => CD[o].flag + ' ' + CD[o].name).join('، ')}</span>` : '<span class="pill">خام عام</span>'}</h2><div class="small muted">وزن الوحدة ${G.w} · تلف ${G.spoil ? (G.spoil * 100).toFixed(1) + '٪ يومياً' : 'لا يتلف'} · ${G.ess ? 'ضرورية' : G.lux ? 'كمالية' : 'عادية'}</div></div><span class="spacer"></span><button data-act="gdclose" class="sm">✕ إغلاق</button></div>`;
  h += missionInline();
  h += breedCard(gd);
  h += `<div class="grid g2" style="margin-top:8px"><div class="card"><div class="small muted">سعر الوحدة في ${esc(c.name)} ${live ? '' : '(معلومة قديمة)'}</div><div style="font-size:26px;font-weight:800" class="${r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : ''}">${pr(price, c.country)}</div>${refLine(ref, price, r)}${premTag(c, gd)}${liveNote(gd)}${quotaBox(x)}<div style="color:var(--teal)">${spark(hist, 220, 40)}</div><div class="small muted">آخر ${hist.length} يوماً: من ${f1(Math.min(...hist, price))} إلى ${f1(Math.max(...hist, price))} ر.س</div></div>`;
  if (!E.sells(c, gd)) {
    h += `<div class="card"><b>بيع فقط في ${esc(c.name)}</b><p class="small">لا تُباع هذه السلعة هنا. تُشترى من: ${E.soldAt(S, gd).map(id => CD[S.cities[id].country].flag + ' ' + esc(S.cities[id].name)).join('، ')}.<br>اشترِها من هناك ثم بِعها هنا إن كان السعر أعلى.</p>${S.phase >= E.AGENT_PHASE ? '' : '<p class="small muted">🔒 الشراء عن بُعد عبر الوكيل يُفتح في الطور 3 (صاحب مصانع).</p>'}${atHere && (have || youngHold(cr, gd) >= 1) ? (GD[gd].hu ? herdRow(gd, x, true) : '') : ''}${atHere && have ? `<div class="row"><button class="${guideOn() ? 'gbig' : ''}" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button></div>${sellRow(gd, have, live)}` : ''}`; // الإغلاق يتمّ في السطر التالي (كان الإغلاق المبكر يُخرج بقية النافذة من الصندوق)
  } else {
  h += `<div class="card"><div class="small muted">كم أشتري؟</div><div class="chips" style="margin:6px 0">${(planOn() && planOn().g === gd && ![1, 10, 25, 100].includes(planOn().q) ? [1, 10, 25, 100, planOn().q].sort((a, b) => a - b) : [1, 10, 25, 100]).map(n => `<button data-dq="${n}" class="${String(dq) === String(n) ? 'on' : ''}">${n}${planOn() && planOn().g === gd && planOn().q === n ? ' (مقترح)' : ''}</button>`).join('')}<button data-dq="max" class="${dq === 'max' ? 'on' : ''}">أقصى (${fmt(maxQ)})</button></div>${x && x.canCar >= 1 ? stepper('m', clampQ(q, maxQ), maxQ) : ''}${x && q >= maxQ ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}`;
  if (qb) {
    h += `<div class="kv"><span>تدفع</span><b>${pr(qb.cost, c.country, 0)}</b></div><div class="kv"><span>متوسط الوحدة (مع انزلاق السعر)</span><b>${pr(qb.avg, c.country)}</b></div>${qb.n < q ? `<div class="small dear">تستطيع شراء ${qb.n} فقط من ${q}${x ? ' (الحدّ: ' + ({ gold: 'رصيدك', room: 'الحمولة', stock: 'المتوفر' }[x.limit]) + ')' : ''}</div>` : ''}`;
    h += `<div class="fitrow"><span class="fit ${x.carU >= q ? 'ok' : 'no'}">${x.carU >= q ? '✓ تكفي قافلتي' : '✗ قافلتي تتسع ' + fmt(x.carU)}</span><span class="fit ${mi.store.has && x.storeU >= q ? 'ok' : 'no'}">${mi.store.has ? (x.storeU >= q ? '✓ يكفي مخزني هنا' : '✗ مخزني يتسع ' + fmt(x.storeU)) : '✗ لا مخزن هنا'}</span></div>`;
    h += atHere ? `<div class="row"><button class="pri" data-act="buy" data-g="${gd}" data-q="${qb.n || 1}" ${qb.n ? '' : 'disabled'}>اشترِ ${qb.n}</button>${have ? `<button class="${guideOn() ? 'gbig' : ''}" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button>` : ''}</div>${GD[gd].hu ? herdRow(gd, x, !x || x.stock < 1, Math.max(1, Math.min(q, 9999))) : ''}${have ? sellRow(gd, have, live) : ''}` : `<div class="small muted">للشراء يجب أن تكون القافلة في هذه المدينة.</div>${S.phase >= E.AGENT_PHASE ? agentRow(gd) : ''}`;
  } else h += '<p class="small muted">لا أسعار حيّة هنا. السعر المعروض آخر ما عرفته.</p>';
  }
  h += `</div>${haggleBox(gd, qb, have)}</div>`;
  if (have) {
    const qs = live ? E.quoteSell(S, sel, gd, have, E.qualOf(main().basis, gd)) : null;
    h += `<div class="card" style="margin-top:10px"><b>معك ${have} وحدة</b><div class="kv"><span>تكلفتك للوحدة</span><b>${avg != null ? f1(avg) + ' ر.س' : '—'}</b></div>${qs ? `<div class="kv"><span>لو بعتها هنا (صافي بعد الضريبة)</span><b>${fmt(qs.net)} ر.س</b></div><div class="kv"><span>الربح/الخسارة</span><b class="pl ${plCls(qs.net - (avg || 0) * have)} num">${sgn(qs.net - (avg || 0) * have)} ر.س</b></div>` : ''}</div>`;
  }
  if (opts[0] && opts[0].profit > 0) { const n0 = Math.max(1, have || (qb ? qb.n : q)), cost0 = unitCost * n0, o0 = opts[0]; h += `<div class="card" style="margin-top:10px"><b>📈 مثال على هامش الربح</b><div class="small" style="margin-top:4px">تدفع ≈ <b>${fmt(Math.round(cost0))}</b> ريال، وتبيع في ${esc(cityName(o0.city))} فيبقى لك صافي ≈ <b>${fmt(Math.round(o0.net - o0.prov))}</b> ← تربح ≈ <b class="cheap">${fmt(Math.round(o0.profit))}</b>.<br>هامش الربح = ${fmt(Math.round(o0.profit))} ÷ ${fmt(Math.round(cost0))} = <b>${Math.round(o0.profit / cost0 * 100)}٪</b> (يعني لكل 100 ريال تدفعها تربح ${Math.round(o0.profit / cost0 * 100)}) ${helpBtn}</div></div>`; }
  h += `<h3 style="margin-top:14px">أين أبيع ${G.name}؟ <span class="small muted">(لـ ${fmt(Math.max(1, have || (qb ? qb.n : q)))} وحدة، بعد الضريبة والجمارك ونفقة الطريق)</span></h3><div class="optrow hd small muted"><span>المدينة</span><span>سعر البيع</span><span>الصافي</span><span>أيام</span><span>الربح/الخسارة</span><span></span></div>`;
  opts.slice(0, 8).forEach(o => {
    h += `<div class="optrow"><span>${cityTag(o.city)}${o.age ? `<span class="small muted"> (قبل ${o.age}ي)</span>` : ''}</span><span>${pr(o.price, o.country)}</span><span class="num">${fmt(o.net)} ر.س${o.customs ? `<span class="usd">جمارك ${fmt(o.customs)}</span>` : ''}</span><span class="num">${o.days} · ${Math.round(o.risk * 100)}٪</span><span class="pl ${plCls(o.profit)} num">${sgn(o.profit)} ر.س<span class="usd">${sgn(o.perUnit)}/وحدة</span></span><span>${atHere && cr.left === 0 && !E.travelBlock(S, cr, o.city) ? (have ? `<button class="sm pri" data-act="go" data-to="${o.city}">سافر</button>` : `<button class="sm pri" data-act="dealgo2" data-g="${gd}" data-d="${o.city}" data-q="${q}">اشترِ وسافر</button>`) : ''}</span></div>`;
  });
  const hist2 = S.player.trades.filter(t => t.g === gd).slice(0, 5);
  if (hist2.length) h += `<h3 style="margin-top:14px">صفقاتك الأخيرة في ${G.name}</h3>` + hist2.map(t => `<div class="kv small"><span>يوم ${t.day} · ${cityTag(t.city)} · ${t.side === 'shop' ? 'دكان' : 'بيع'} ${f1(t.q)}</span><b class="pl ${plCls(t.pl)} num">${sgn(t.pl)} ر.س</b></div>`).join('');
  m.innerHTML = h + `</div>`; m.hidden = false;
}

