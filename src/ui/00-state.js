/* درب التجّار v0.2 — الواجهة: سبع شاشات بحالة واحدة مشتركة وتوجيه بالـ hash */
(function () {
'use strict';
const E = Engine, A = E.A, GD = E.GD, GIDS = E.GIDS, CD = E.CD;
const $ = id => document.getElementById(id);
const KEY = 'darb-v3', KEY2 = 'darb-v2';
const PLAYER = /[?&]player=1/.test(location.search); // وضع اللاعب: المتصفح الآلي يرى واجهة اللاعب الحقيقية (غلاف وحكاية ودروس وبطاقات)
let S, sel = 'riyadh', screen = 'home', speed = 0, carSel = 1, timer = null, lastSave = 0, ct = 'cities', guideOff = false;
let landlord = 'private', pressing = false, dirty = false, mapC = 'all', mf = 'all', estC = 'sa', estCity = 'riyadh', empC = 'sa', oldSave = false, dg = null, dq = 10, fxFrom = 'sar', fxTo = 'usd';
let resourceOpen = null, resourceSignature = '';
const SPEEDS = { 0: 0, 1: 1100, 2: 450, 3: 140 };
try { guideOff = localStorage.getItem('darb-guide-off') === '1'; } catch (e) {}
const COAST = new Set(['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']);

const ART = window.ART || {};
const WM = window.WorldMap;
let mapView = { zoom: 1, center: null }, mapBase, mapVB, mapDrag = null, mapDragged = false, mapListOpen = {};
const gi = g => (ART['goods/' + g] || (GD[g].hyb && ART['goods/' + GD[g].sp]) ? `<img class="gi" src="${ART['goods/' + g] || ART['goods/' + GD[g].sp]}" alt="${GD[g].name}">` : GD[g].icon);
const uic = k => (ART['ui/' + k] ? `<img class="uic" src="${ART['ui/' + k]}" alt="">` : '');
const art = k => ART['cutouts/' + k] || ART[k] || '';
function pic(k, cls, alt, fallback) {
  const src=art(k)||art(fallback||'');if(!src)return '';
  const cutout=ART['cutouts/'+k]||k.startsWith('expressions/')||k.startsWith('story/')||k.startsWith('talk/');
  const safe=String(alt||'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
  const old=fallback&&art(fallback),lazy=src.startsWith('img/');
  return `<img class="pic ${cutout?'cutout':''} ${cls||''}" data-art="${k}" src="${src}" loading="${lazy?'lazy':'eager'}" decoding="async" ${old&&old!==src?`data-fallback="${old}"`:''} alt="${safe}">`;
}
document.addEventListener('error',ev=>{const im=ev.target;if(im?.tagName==='IMG'&&im.dataset.fallback&&!im.dataset.fallbackTried){im.dataset.fallbackTried='1';im.src=im.dataset.fallback;}},true);

/* أقسام مطوية تُحفظ حالتها في ui.fold (تبقى بعد إعادة التحميل). المفتاح بادئته الشاشة، والافتراضي لمن لم يغيّر اللاعب حالته */
/* المتصفح الآلي بلا ?player=1 ولا ?fold=1 يرى الأقسام مفتوحة (السلوك القديم لاختبارات الوظائف)؛ اختبار الطول والطيّ يستعمل ?player=1 */
const foldAuto = () => { try { return !!navigator.webdriver && !PLAYER && !/[?&]fold=1/.test(location.search); } catch (e) { return false; } };
const foldOpen = (key, def) => ui.fold && ui.fold[key] != null ? !!ui.fold[key] : (foldAuto() ? true : !!def);
const foldDet = (key, def, sum, body) => `<details class="mdet fold" data-fold="${key}" ${foldOpen(key, def) ? 'open' : ''}><summary>${sum}</summary>${body}</details>`;
/* عبارات عمّ سالم المعتمدة (الدفعة 05، docs/review/APPROVED_BATCH_05.md)؛ تُعرض بالحرف: الأمين، الحصّالة، القرض المبكر، الترقية */
const MENTOR_B05 = {
  m01: 'عرفتَ عمل مديرك وراجعتَ حسابه؛ فإن وسّعتَ أمانته فعيّن له حدود إذنه ونفقاته، وتابع تقريره',
  m02: 'أمينك يرفع إليك حساب يومه؛ انظر ما سدّد وما أبقى، ولا تؤخر القرار فيما احتاج إليك',
  m03: 'لو ادخرتَ في حصّالتك لاغتنمتَ هذه الصفقة الكبرى يا بني',
  m04: 'عندك في حصّالتك ما يكفي',
  m05: 'أفرغتَ الحصّالة في صفقة رابحة؛ والادخار يعود فيمتلئ بالتدبير',
  m06: 'راجع ما عليك وما تملكه أولاً يا ولدي؛ ثم انظر في القرض المتاح لك بكفالة جدّك',
  m07: 'اشترِ بها وسافر، وبادر بسداد القرض عند أول ربح؛ فهذه فرصة مقترحة والربح فيها تقدير',
  m08: 'اقترب موعد السداد يا ولدي؛ راجع المتبقي ورتّب ما تستطيع دفعه',
  m09: 'المبلغ باقٍ في ذمتك يا ولدي؛ رتّب سدادك، فلن يتاح لك قرض آخر حتى تفي بما عليك للمقرضين',
  m10: 'عاملُك اكتسب خبرة وأمانة؛ فإن احتجت مديراً فابدأ بمن عرفتَ صدقه، وحدد له صلاحياته وتابع عمل من بعده'
};
const fmt = n => Math.round(n).toLocaleString('en-US');
const hudFmt = n => {
  const v = Math.abs(n);
  const unit = v >= 1e9 ? [1e9, 'مليار'] : v >= 1e6 ? [1e6, 'مليون'] : v >= 1e4 ? [1e3, 'ألف'] : null;
  return unit ? `${(n / unit[0]).toLocaleString('en-US', { maximumFractionDigits: unit[0] === 1e3 ? 0 : 1 })} ${unit[1]}` : fmt(n);
};
/* اختصار المبالغ في الخانات الضيقة: 1.2K ألف، 3.5M مليون، 2B مليار (العدد الكامل في العنوان المنبثق) */
const hudShort = n => {
  const v = Math.abs(n), u = v >= 1e9 ? [1e9, 'B'] : v >= 1e6 ? [1e6, 'M'] : v >= 1e3 ? [1e3, 'K'] : null;
  if (!u) return fmt(n);
  const x = n / u[0], d = Math.abs(x) >= 100 ? 0 : 1, r = Math.round(Math.abs(x) * 10 ** d) / 10 ** d;
  return (n < 0 ? '-' : '') + r.toLocaleString('en-US', { maximumFractionDigits: d }) + u[1];
};
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const car = () => S.player.caravans.find(c => c.id === carSel) || S.player.caravans[0];
const main = () => S.player.caravans[0];
const cityName = id => S.cities[id].name;
const flag = id => CD[S.cities[id].country].flag;
const cityTag = id => flag(id) + ' ' + esc(cityName(id));
const bar = (v, mx, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, 100 * v / mx))}%"></i></div>`;
const EVN = { boom: 'ازدهار', bust: 'كساد', plague: 'وباء', festival: 'مهرجان', war: 'حرب وحصار' };
const evGood = k => k === 'boom' || k === 'festival';
function spark(arr, w, h) {
  if (!arr || arr.length < 2) return '';
  const mn = Math.min(...arr), mx = Math.max(...arr), rg = mx - mn || 1;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / rg * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" style="direction:ltr;vertical-align:middle"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
// الأصوات: نجاح الفعل يشغّل صوته، والرفض يشغّل «فشل». الاسم من الفعل الجاري (curAct)
function syncSound() { const av = $('hAmbVol'); if (av) { try { av.value = Math.round(Sound.getAmbienceVolume() * 100); } catch (e) {} } const tb = $('hType'); if (tb) { const off = !!(typeof ui !== 'undefined' && ui.typeOff); tb.setAttribute('aria-pressed', String(!off)); const tv = $('hTypeV'); if (tv) tv.textContent = off ? 'متوقفة' : 'تعمل'; } const vr = $('hVol'); if (vr) { try { vr.value = Math.round(Sound.getVolume() * 100); } catch (e) {} } const b = $('hSound'); if (!b) return; let m = false; try { m = Sound.isMuted(); } catch (e) {} b.setAttribute('aria-pressed', String(!m)); const on = b.querySelector('.s-on'), off = b.querySelector('.s-off'); if (on) on.hidden = m; if (off) off.hidden = !m; b.title = m ? 'الأصوات مكتومة' : 'الأصوات تعمل'; const a = $('hAmb'); if (a) { let on = false; try { on = Sound.isAmbience(); } catch (e) {} a.setAttribute('aria-pressed', String(on)); const x = a.querySelector('.s-on'), y = a.querySelector('.s-off'); if (x) x.hidden = !on; if (y) y.hidden = on; a.title = on ? 'الأجواء تعمل' : 'الأجواء مغلقة'; } }
const SND = { buy: 'buy', buyherd: 'buy', agent: 'buy', dealgo: 'depart', go: 'depart', sell: 'sell', sellall: 'sell', sellherd: 'sell', sellyoung: 'sell', farmsell: 'sell', cutmeat: 'sell', hgclose: 'click', zakatpay: 'coin', dep: 'coin', wd: 'coin', fxdo: 'coin', hiremgr: 'success', rescuefact: 'success', factory: 'success', buildbutcher: 'build', buildfarm: 'build', bshop: 'build', bwh: 'build', signpact: 'success' };
let curAct = null, lvSnd = null;
// صيغة العدد العربية للأيام والسنوات: 1 يوم، 2 يومان، 3 إلى 10 أيام، وما فوق يوماً
function dayAr(n) { const v = Math.round(+n); if (!isFinite(v)) return String(n) + ' يوماً'; const a = Math.abs(v); return a === 1 ? 'يوم' : a === 2 ? 'يومين' : a >= 3 && a <= 10 ? v + ' أيام' : v + ' يوماً'; }
function yearAr(n) { const v = Math.round(n * 2) / 2, w = Math.floor(v), half = v - w >= .5, base = w === 0 ? '' : w === 1 ? 'سنة' : w === 2 ? 'سنتين' : w <= 10 ? w + ' سنوات' : w + ' سنة'; return (base ? base + (half ? ' ونصف' : '') : (half ? 'نصف سنة' : 'أقل من نصف سنة')); }
function spanAr(days) { const d = Math.max(0, Math.round(days)); return d < 60 ? dayAr(d) : d < 354 ? (Math.round(d / 30) <= 2 ? (Math.round(d / 30) === 1 ? 'شهر' : 'شهرين') : Math.round(d / 30) <= 10 ? Math.round(d / 30) + ' أشهر' : Math.round(d / 30) + ' شهراً') : yearAr(d / 354); }
function ageFmt(a) { return String(Math.round(a * 10) / 10); }
const sfx = n => { try { if (typeof Sound !== 'undefined') Sound.play(n); } catch (e) {} };
function act(r) { tlTrade(r); if(r?.saved>0)r={...r,msg:(r.msg||'')+' · +'+r.saved.toLocaleString('en-US',{maximumFractionDigits:2})+' ريال إلى حصّالتك'}; hapticAfterAction(r,curAct); if (r && r.msg) toast(r.msg); if (r && r.ok === false) sfx('fail'); else if (r && r.pl >= 1000) sfx('register'); else if (r && r.pl < 0) sfx('loss'); else if (SND[curAct]) sfx(SND[curAct]); renderAll(true); }
const fx = () => S.fx;
const curBadge = c => ({ sar: '🇸🇦 ر.س', usd: '💵 $', au: '🥇 غ', ag: '🥈 غ' })[c];
// سعر بالريال أولاً، ومعه الدولار في الأسواق الأجنبية
function pr(sar, country, dec) { const d = dec == null ? 1 : dec; const v = (Math.round(sar * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); return `<b class="num">${v}</b> ر.س` + (country && country !== 'sa' ? `<span class="usd">$${(sar / fx().usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}${E.LOCAL[country] ? ' · ≈ ' + (sar * E.localRate(S, country)).toLocaleString('en-US', { maximumFractionDigits: E.LOCAL[country].base > 100 ? 0 : 1 }) + ' ' + E.LOCAL[country].unit : ''}</span>` : ''); }
// مبلغ بعملة سوق المدينة: دولار في الدول الأجنبية وريال في السعودية (المحرك يتعامل في كل بلد بعملته، وهذا للعرض). where: كائن مدينة أو معرّفها
function lm(sar, where, dec) {
  const city = typeof where === 'string' ? S.cities[where] : where, f = !!(city && city.country && city.country !== 'sa'), d = dec == null ? (f ? 2 : 0) : dec, v = f ? sar / fx().usd : sar;
  const t = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d });
  return f ? '$' + t : t + ' ريال';
}
const sgn = n => (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
const plCls = n => (n >= 0 ? 'up' : 'dn');
const citiesOf = cn => S.order.filter(id => S.cities[id].country === cn);


let tp = null; // بطاقة تجهيز الرحلة (اشترِ وسافر): {g, d, q, route:'land'|'sea'}
/* طبقة انتباه واحدة: لا تظهر رسالة عمّ سالم العائمة ولا إشعار الإنجاز وفوق اللاعب بطاقة مفتوحة أو درس أو رحلة جارية */
let peekWant = false;
const calmNow = () => { try { return !tp && !dg && !prof && !salemOpen && !learnNext() && !(S && S.road) && main().left === 0; } catch (e) { return true; } };
/* وصول القافلة الرئيسية: إشعار واحد يبقى حتى يقرأه اللاعب؛ والانتقال التلقائي للسوق لا يقطع كتابة كمية أو نافذة أو قراراً مفتوحاً */
let arr = null; // {id, city, day}
const arrivalBusy = () => { try { const ae = document.activeElement; return !!(tp || dg || cdg || prof || (S && S.road) || (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName) && $('screen') && $('screen').contains(ae))); } catch (e) { return false; } };
/* إيصال الصفقة: نتيجة الشراء/البيع الفعلية تبقى حتى يقرأها اللاعب أو تحلّ محلها صفقة أخرى (لا مؤقت يسابقه) */
let rcpt = null;
function showReceipt(r) { rcpt = r; renderReceipt(); }
function renderReceipt() {
  const el = $('rcpt'); if (!el) return;
  if (!rcpt) { el.hidden = true; el.innerHTML = ''; document.body.classList.remove('has-rcpt'); return; }
  el.innerHTML = `<div class="rt">${esc(rcpt.title)}</div>${rcpt.rows.map(([k, v, cls]) => `<div class="rrow"><span>${esc(k)}</span><b class="num ${cls || ''}">${esc(v)}</b></div>`).join('')}${rcpt.note ? `<div class="small muted">${esc(rcpt.note)}</div>` : ''}${rcpt.say ? `<div class="small rsay"><b>${esc(MEN.name)}:</b> ${esc(rcpt.say)}</div>` : ''}${rcpt.quiz ? quizHTML(rcpt.quiz) : ''}<div class="row"><span class="spacer"></span>${rcpt.next ? `<button class="sm pri" data-act="${rcpt.next[1]}">${esc(rcpt.next[0])}</button>` : ''}${rcpt.undo && undoLive() ? '<button class="sm" data-act="tradeundo">تراجع</button>' : ''}<button class="sm${rcpt.next ? '' : ' pri'}" data-act="rcptclose">${esc(rcpt.close || 'تم')}</button></div>`;
  el.hidden = false; document.body.classList.add('has-rcpt');
}
const rfmt = n => Math.round(n).toLocaleString('en-US');
/* أول ربح: بطاقة قصيرة بالرقم الواضح تُغلق بلمسة (تحلّ محل إيصال البيع في المرة الأولى فقط) */
const isFirstProfit = r => !!(r && r.pl > 0 && S.player.trades.filter(t => t.side === 'sell' && t.pl > 0).length === 1);
const firstProfitCard = (r, extra) => { const x = extra || {}; return { fp: 1, title: '🎉 أول ربح لك!', rows: [['ربحتَ', '+' + rfmt(r.pl) + ' ريال', 'cheap']].concat(x.saved > 0 ? [['إلى حصّالتك', '+' + x.saved.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ريال', 'cheap']] : []), note: x.left && x.left.length ? 'تعذّر بيع: ' + x.left.join('، ') : 'هكذا يبدأ كل تاجر كبير. استمرّ!', close: 'تابع' }; };
/* ينفّذ فعل شراء/بيع ويلتقط نتيجته الفعلية من فرق المال والحمولة (لا من تقدير سابق) */
function tradeWithReceipt(kind, g, fn) {
  const pre = tradeSnapOn() ? snapState() : null, day0 = S.day, fx0 = S.player.led.exp.exchange || 0, r = fn(), fxFee = (S.player.led.exp.exchange || 0) - fx0;
  if (r && r.ok && r.n) { // الأرقام من نتيجة المحرك نفسها، لا من فرق الرصيد (فقد يتزامن معها مكافأة درس)
    const name = GD[g].name;
    const rc = kind === 'buy' ? { title: 'اشتريت ' + r.n + ' ' + name, rows: [['دفعت', rfmt(r.cost) + ' ريال'], ['متوسط الوحدة', (r.cost / r.n).toFixed(1) + ' ريال']], note: 'البضاعة الآن في قافلتك', next: ['اختر وجهتك ← الخريطة', 'rcptmap'] }
      : { title: 'بعت ' + r.n + ' ' + name, rows: [['صافي البيع (بعد الرسوم)', rfmt(r.net) + ' ريال'], ['ربح البيع مقارنة بتكلفتك', (r.pl >= 0 ? '+' : '-') + rfmt(Math.abs(r.pl || 0)) + ' ريال', r.pl >= 0 ? 'cheap' : 'dear']] };
    if(kind==='sell'&&r.saved>0)rc.rows.push(['إلى حصّالتك', '+'+r.saved.toLocaleString('en-US',{maximumFractionDigits:2})+' ريال','cheap']);
    if (kind === 'buy' && fxFee > 0.5) { rc.rows.push(['رسم تحويل فوري', rfmt(fxFee) + ' ريال', 'dear']); rc.note = 'حوّلنا لك عملة تلقائياً فدفعتَ رسماً زائداً؛ حوّل مسبقاً من الصرافة لتدفع أقل.'; }
    if (!learnNext() && S.road == null) { try { salemTradeNote(kind, r, rc); } catch (e) {} } // لا تفسير فوق درس مفتوح أو حدث إلزامي
    if (kind === 'sell' && isFirstProfit(r)) { rc.title = '🎉 أول ربح لك! بعت ' + r.n + ' ' + name; rc.rows = [['ربحتَ', '+' + rfmt(r.pl) + ' ريال', 'cheap']].concat(rc.rows.filter(x => x[0] === 'إلى حصّالتك')); rc.close = 'تابع'; rc.fp = 1; rc.note = ''; rc.say = ''; rc.quiz = null; rc.next = null; }
    if (pre) { undoSnap = { pre, day: day0, t: Date.now() }; rc.undo = 1; clearTimeout(undoTm); undoTm = setTimeout(() => { undoSnap = null; if (rcpt && rcpt.undo) renderReceipt(); }, UNDO_MS + 50); }
    showReceipt(rc);
  }
  return r;
}
/* WP-11: تراجع 10 ثوانٍ عن آخر شراء/بيع بلقطة من الذاكرة فقط (لا تدخل الحفظ). تسقط بمرور اليوم أو بأي فعل آخر. الوضع القديم للأتمتة (webdriver بلا player) بلا لقطة ولا تأكيد */
const UNDO_MS = 10000; let undoSnap = null, undoTm = null, pendTrade = null;
const tradeSnapOn = () => { try { return !(navigator.webdriver && !PLAYER); } catch (e) { return true; } };
const snapState = () => { try { return E.save(S); } catch (e) { return null; } };
const undoLive = () => !!(undoSnap && S && S.day === undoSnap.day && Date.now() - undoSnap.t <= UNDO_MS);
function tradeUndo() {
  if (!undoLive()) { undoSnap = null; rcpt = null; renderReceipt(); return toast('مضى وقت التراجع.'); }
  const r = E.loadChecked(undoSnap.pre); undoSnap = null; rcpt = null;
  if (!r.ok) { renderReceipt(); return toast('تعذّر التراجع.'); }
  S = r.S; persist(); renderReceipt(); renderAll(true); toast('تراجعتَ عن الصفقة: عاد مالك وبضاعتك كما كانا.');
}
function doTrade(a, g, q, m) { const mg = missionGoal(), r = tradeWithReceipt(a, g, () => a === 'buy' ? A.buy(S, m.id, g, q) : A.sell(S, m.id, g, q)); if (a === 'buy') buyStumble(g, !!r.ok); act(r); if (r.ok && mg && mg.k === 'good' && mg.side === a) { dg = null; renderAll(true); } }
/* تأكيد قصير بالأرقام: شراء يتجاوز 30% من سيولتك، أو بيع بخسارة. لا يُسأل المبتدئ قبل أول ربح (الدروس ترشده) */
function tradeCheck(a, g, q, m) {
  if (!tradeSnapOn() || learnNext() || !S.player.trades.some(t => t.side === 'sell' && t.pl > 0) || !(q >= 1)) return null;
  const nm = GD[g].name;
  if (a === 'buy') { const qb = E.quoteBuy(S, m.city, g, q), gold = S.player.gold; if (qb && qb.n >= 1 && gold > 0 && qb.cost > gold * 0.3) return { title: 'تأكيد الشراء', rows: [['شراء ' + qb.n + ' ' + nm, rfmt(qb.cost) + ' ريال'], ['من سيولتك', Math.round(qb.cost / gold * 100) + '%', 'dear']], note: 'صفقة كبيرة من رصيدك. هل تريد المتابعة؟' }; return null; }
  const qs = E.quoteSell(S, m.city, g, q, E.qualOf(m.basis, g), null, 'trade', m.basis[g] || 0), avg = E.avgCost(m.basis, g), pl = qs && qs.n >= 1 && avg != null ? qs.net - avg * q : null;
  if (pl != null && pl < 0) return { title: 'تأكيد البيع بخسارة', rows: [['بيع ' + q + ' ' + nm, rfmt(qs.net) + ' ريال'], ['الخسارة مقارنة بتكلفتك', '-' + rfmt(Math.abs(pl)) + ' ريال', 'dear']], note: 'السعر هنا أقل من تكلفتك. هل تريد البيع؟' };
  return null;
}

/* مساعدة عند التعثر الفعلي: بعد ثلاث محاولات شراء مرفوضة لسبب واحد معروف (من المحرك لا من نص الرسالة) في المدينة نفسها، تُعرض مساعدة واحدة بعلاج السبب، وتُكتم إن رُفضت */
const STUMBLE_AT = 3; let stm = { key: '', n: 0 }; const stmMute = {};
const STUMBLE_HELP = {
  room: ['قافلتك ممتلئة، ولذلك يتعذر الشراء. راجع حمولتك: بِع شيئاً منها أو زد السعة.', ['افتح القافلة', 'rcptcaravan']],
  gold: ['رصيدك لا يكفي لهذه الكمية. خفّض الكمية، أو بِع شيئاً من بضاعتك أولاً.', ['بضاعتي', 'rcptcargo']],
  stock: ['نفد المتوفر من هذه السلعة هنا. جرّب سوقاً آخر.', ['افتح الخريطة', 'rcptmap']],
  quota: ['بلغتَ حصتك اليوم من منتج المدينة الخاص. ثقة الزعيم ترفعها.', ['زعماء الأسواق', 'rcptlords']]
};
function buyStumble(gd, ok) {
  if (ok) { stm = { key: '', n: 0 }; return; }
  let lim = null; try { const mi = E.marketInfo(S, sel, 1), x = mi && mi.goods.find(y => y.g === gd); lim = x && x.limit; } catch (e) {}
  if (!lim || !STUMBLE_HELP[lim]) return;
  const key = [main().id, sel, gd, lim].join(':'); stm = stm.key === key ? { key, n: stm.n + 1 } : { key, n: 1 };
  if (stm.n < STUMBLE_AT || stmMute[key] || (S && S.road)) return;
  stmMute[key] = true; stm.n = 0; const h = STUMBLE_HELP[lim];
  showReceipt({ title: 'هل تحتاج مساعدة؟', rows: [], note: h[0], next: h[1], close: 'لا شكراً' });
}

/* اسم الماشية مع بيان النوع: الصنف المسمّى (عربي، منغولي، نجدي…) يظهر باسمه، والنوع العام يُوسم «عادي» ليعرف اللاعب ما يحمله */
const gname = g => GD[g].name + (E.BREED[g] && !GD[g].sp ? ' (نوع عادي)' : '');
