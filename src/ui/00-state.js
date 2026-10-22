/* درب التجّار v0.2 — الواجهة: سبع شاشات بحالة واحدة مشتركة وتوجيه بالـ hash */
(function () {
'use strict';
const E = Engine, A = E.A, GD = E.GD, GIDS = E.GIDS, CD = E.CD;
const $ = id => document.getElementById(id);
const KEY = 'darb-v3', KEY2 = 'darb-v2';
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
const pic = (k, cls, alt) => (art(k) ? `<img class="pic ${ART['cutouts/' + k] || k.startsWith('expressions/') || k.startsWith('story/') || k.startsWith('talk/') ? 'cutout' : ''} ${cls || ''}" data-art="${k}" src="${art(k)}" alt="${alt || ''}">` : '');
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
function syncSound() { const b = $('hSound'); if (!b) return; let m = false; try { m = Sound.isMuted(); } catch (e) {} b.setAttribute('aria-pressed', String(!m)); const on = b.querySelector('.s-on'), off = b.querySelector('.s-off'); if (on) on.hidden = m; if (off) off.hidden = !m; b.title = m ? 'الأصوات مكتومة' : 'الأصوات تعمل'; }
const SND = { buy: 'buy', buyherd: 'buy', agent: 'buy', dealgo: 'caravan', go: 'caravan', sell: 'sell', sellall: 'sell', sellherd: 'sell', sellyoung: 'sell', farmsell: 'sell', cutmeat: 'sell', hgclose: 'click', zakatpay: 'coin', dep: 'coin', wd: 'coin', fxdo: 'coin', hiremgr: 'success', rescuefact: 'success', factory: 'success', buildbutcher: 'success', buildfarm: 'success', bshop: 'success', bwh: 'success', signpact: 'success' };
let curAct = null, lvSnd = null;
const sfx = n => { try { if (typeof Sound !== 'undefined') Sound.play(n); } catch (e) {} };
function act(r) { if (r && r.msg) toast(r.msg); if (r && r.ok === false) sfx('fail'); else if (SND[curAct]) sfx(SND[curAct]); renderAll(true); }
const fx = () => S.fx;
const curBadge = c => ({ sar: '🇸🇦 ر.س', usd: '💵 $', au: '🥇 غ', ag: '🥈 غ' })[c];
// سعر بالريال أولاً، ومعه الدولار في الأسواق الأجنبية
function pr(sar, country, dec) { const d = dec == null ? 1 : dec; const v = (Math.round(sar * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); return `<b class="num">${v}</b> ر.س` + (country && country !== 'sa' ? `<span class="usd">$${(sar / fx().usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}${E.LOCAL[country] ? ' · ≈ ' + (sar * E.localRate(S, country)).toLocaleString('en-US', { maximumFractionDigits: E.LOCAL[country].base > 100 ? 0 : 1 }) + ' ' + E.LOCAL[country].unit : ''}</span>` : ''); }
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
  el.innerHTML = `<div class="rt">${esc(rcpt.title)}</div>${rcpt.rows.map(([k, v, cls]) => `<div class="rrow"><span>${esc(k)}</span><b class="num ${cls || ''}">${esc(v)}</b></div>`).join('')}${rcpt.note ? `<div class="small muted">${esc(rcpt.note)}</div>` : ''}${rcpt.say ? `<div class="small rsay"><b>عمّ سالم:</b> ${esc(rcpt.say)}</div>` : ''}${rcpt.quiz ? quizHTML(rcpt.quiz) : ''}<div class="row"><span class="spacer"></span>${rcpt.next ? `<button class="sm pri" data-act="${rcpt.next[1]}">${esc(rcpt.next[0])}</button>` : ''}<button class="sm${rcpt.next ? '' : ' pri'}" data-act="rcptclose">${esc(rcpt.close || 'تم')}</button></div>`;
  el.hidden = false; document.body.classList.add('has-rcpt');
}
const rfmt = n => Math.round(n).toLocaleString('en-US');
/* ينفّذ فعل شراء/بيع ويلتقط نتيجته الفعلية من فرق المال والحمولة (لا من تقدير سابق) */
function tradeWithReceipt(kind, g, fn) {
  const r = fn();
  if (r && r.ok && r.n) { // الأرقام من نتيجة المحرك نفسها، لا من فرق الرصيد (فقد يتزامن معها مكافأة درس)
    const name = GD[g].name;
    const rc = kind === 'buy' ? { title: 'اشتريت ' + r.n + ' ' + name, rows: [['دفعت', rfmt(r.cost) + ' ريال'], ['متوسط الوحدة', (r.cost / r.n).toFixed(1) + ' ريال']], note: 'البضاعة الآن في قافلتك', next: ['اختر وجهتك ← الخريطة', 'rcptmap'] }
      : { title: 'بعت ' + r.n + ' ' + name, rows: [['صافي البيع (بعد الرسوم)', rfmt(r.net) + ' ريال'], ['ربح البيع مقارنة بتكلفتك', (r.pl >= 0 ? '+' : '-') + rfmt(Math.abs(r.pl || 0)) + ' ريال', r.pl >= 0 ? 'cheap' : 'dear']] };
    if (!learnNext() && S.road == null) { try { salemTradeNote(kind, r, rc); } catch (e) {} } // لا تفسير فوق درس مفتوح أو حدث إلزامي
    showReceipt(rc);
  }
  return r;
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
