/* ---------- الرأس والتنقل ---------- */
function charImg() { const c = S.learn && S.learn.char; return (c && art('hero/c_' + c)) || art('hero/trader') || art('hero/c_trader'); }
const LV_SCREEN = ['market', 'market', 'map', 'map', 'market', 'cities', 'estate', 'lords', 'empire', 'cities'];
const hbar = f => `<i class="hb"><u style="width:${Math.max(3, Math.min(100, Math.round(f * 100)))}%"></u></i>`;
const resourceButton = key => $({sar:'hSar', usd:'hUsd', au:'hGold', ag:'hSilver', load:'hLoad'}[key]);
const resourceNumber = n => n.toLocaleString('en-US', {maximumFractionDigits:3});
function closeResourceMenu(restoreFocus = false) {
  if (!resourceOpen) return;
  const button = resourceButton(resourceOpen);
  resourceOpen = null; resourceSignature = ''; $('resourceMenu').hidden = true;
  button.setAttribute('aria-expanded', 'false');
  if (restoreFocus) button.focus({preventScroll:true});
}
function positionResourceMenu() {
  if (!resourceOpen) return;
  const menu = $('resourceMenu'), r = resourceButton(resourceOpen).getBoundingClientRect();
  if (r.bottom <= 0 || r.top >= innerHeight || !r.width) { closeResourceMenu(); return; }
  menu.style.maxHeight = Math.max(120, innerHeight - 24) + 'px';
  const group = $('hLoad').parentElement.getBoundingClientRect();
  const box = menu.getBoundingClientRect(), below = Math.max(r.bottom, group.bottom) + 8;
  const top = below + box.height <= innerHeight - 12 ? below : Math.min(r.top, group.top) - box.height - 8;
  menu.style.top = Math.max(12, Math.min(top, innerHeight - box.height - 12)) + 'px';
  menu.style.left = Math.max(12, Math.min(r.right - box.width, innerWidth - box.width - 12)) + 'px';
}
function renderResourceMenu() {
  if (!resourceOpen) return;
  const key = resourceOpen, menu = $('resourceMenu'), cr = main();
  let title, icon, content;
  if (key === 'load') {
    title = 'حمولة القافلة'; icon = 'crate';
    const load = E.loadOf(cr), capacity = E.capOfCar(cr), goods = GIDS.filter(g => cr.cargo[g] > 0.001);
    content = `<div class="resource-balance"><b dir="ltr">${resourceNumber(load)} / ${resourceNumber(capacity)}</b><span>وزن الحمولة</span></div>${bar(load, capacity)}<p class="small">المساحة المتبقية: <b>${resourceNumber(Math.max(0, capacity - load))}</b></p><div class="resource-cargo">${goods.length ? goods.map(g => `<div class="kv"><span>${gi(g)} ${GD[g].name}</span><b>${resourceNumber(cr.cargo[g])}</b></div>`).join('') : '<p class="small muted">القافلة فارغة حاليًا.</p>'}</div><p class="small muted">${cr.left > 0 ? `في الطريق إلى ${esc(cityName(cr.dest))} · متبقٍ ${Math.ceil(cr.left)} يوم` : `موجودة في ${esc(cityName(cr.city))}`}</p><div class="resource-actions"><button class="pri" data-go="caravan">إدارة القافلة</button><button data-go="${cr.left > 0 ? 'map' : 'market'}">${cr.left > 0 ? 'متابعة الرحلة' : 'الذهاب للسوق'}</button></div>`;
  } else {
    const cfg = {sar:['محفظة الريال','riyal','ريال'], usd:['محفظة الدولار','usd','دولار'], au:['رصيد الذهب','goldbar','غرام ذهب'], ag:['رصيد الفضة','goldbar','غرام فضة']}[key];
    [title, icon] = cfg;
    const rate = key === 'usd' ? S.fx.usd : key === 'au' ? S.fx.gold : key === 'ag' ? S.fx.silver : 1, balance = S.player.wallet[key];
    content = `<div class="resource-balance"><b dir="ltr">${resourceNumber(balance)}</b><span>${cfg[2]}</span></div>${key === 'sar' ? '<p class="small muted">عملة الشراء في الأسواق السعودية، وأساس مقارنة الأسعار.</p>' : `<div class="kv small"><span>القيمة التقريبية</span><b>${resourceNumber(balance * rate)} ريال</b></div><div class="kv small"><span>${key === 'au' ? 'سعر الغرام الآن' : 'سعر الدولار الآن'}</span><b>${resourceNumber(rate)} ريال</b></div>`}<div class="resource-actions"><button class="pri" data-act="resourcefx" data-f="${key}">${key === 'au' ? 'تحويل الذهب' : key === 'usd' ? 'تحويل الدولار' : 'تحويل الريال'}</button></div><p class="small muted resource-note">تختار المبلغ وتراجع الرسم في الصرافة قبل التحويل.</p>`;
  }
  const html = `<div class="resource-heading">${uic(icon)}<h2 id="resourceTitle">${title}</h2><button class="sm" data-act="resourceclose" aria-label="إغلاق قائمة الموارد">إغلاق</button></div>${content}`;
  if (html !== resourceSignature) {
    const active = document.activeElement, focused = menu.contains(active) && (active.dataset.act ? `[data-act="${active.dataset.act}"]` : active.dataset.go ? `[data-go="${active.dataset.go}"]` : null);
    menu.innerHTML = html; resourceSignature = html;
    if (focused) menu.querySelector(focused)?.focus({preventScroll:true});
  }
  menu.hidden = false; positionResourceMenu();
}
function toggleResourceMenu(key) {
  if (!['sar','usd','au','ag','load'].includes(key)) return;
  if (resourceOpen === key) { closeResourceMenu(true); return; }
  closeResourceMenu(); resourceOpen = key;
  resourceButton(key).setAttribute('aria-expanded', 'true');
  renderResourceMenu(); $('resourceMenu').scrollTop = 0; $('resourceMenu').focus({preventScroll:true});
}
window.addEventListener('resize', positionResourceMenu);
window.addEventListener('scroll', positionResourceMenu, {passive:true, capture:true});
document.addEventListener('focusin', ev => {
  if (resourceOpen && !ev.target.closest('#resourceMenu,.resource-trigger')) closeResourceMenu();
});
function renderHeader() {
  try { syncSound(); } catch (e) {}
  const w = S.player.wallet, L = S.learn, cr = main();
  [['sar','hud_riyal',w.sar,'ريال'], ['usd','hud_usd',w.usd,'دولار'], ['au','hud_goldbar',w.au,'غ ذهب'], ['ag','hud_goldbar',w.ag || 0,'غ فضة']].forEach(([key, icon, value, label]) => {
    const button = resourceButton(key);
    button.innerHTML = `${uic(icon)}<b>${key === 'usd' ? '$' : ''}${(key === 'au' || key === 'ag') && Math.abs(value) < 10000 ? value.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) : hudShort(value)}</b><small>${label}</small><i class="resource-chevron" aria-hidden="true"></i>`;
    button.title = `${resourceNumber(value)} ${label}`;
    button.setAttribute('aria-label', `${button.title}، عرض التفاصيل`);
  });
  { const lv6 = !L || !L.char || L.level >= 6 || L.free; $('hUsd').hidden = !(lv6 || w.usd > 0); $('hGold').hidden = !(lv6 || w.au > 0); $('hSilver').hidden = !(lv6 || (w.ag || 0) > 0); } // الدولار والذهب من فتح الصرافة (المستوى 6) أو عند وجود رصيد
  const ld = Math.round(E.loadOf(cr)), cap = E.capOfCar(cr);
  $('hLoad').innerHTML = `${uic('hud_cargo')}<b dir="ltr">${hudFmt(ld)}/${hudFmt(cap)}</b><small>الحمولة</small><i class="resource-chevron" aria-hidden="true"></i>`;
  $('hLoad').title = `حمولة القافلة: ${fmt(ld)} / ${fmt(cap)}`;
  $('hLoad').setAttribute('aria-label', $('hLoad').title + '، عرض التفاصيل');
  const fdb = S.player.famDebt, hd = $('hDebt');
  if (hd) { if (fdb && fdb.left > 0 && L && L.char) { hd.hidden = false; hd.innerHTML = `<b>${fmt(Math.round(fdb.left))}</b><small>💳 الدَّين</small>${hbar(1 - fdb.left / fdb.amt0)}`; } else hd.hidden = true; }
  const Z = S.zakat, zb = Z && L && L.char ? E.zakatBase(S) : null, hw = $('hHawl');
  if (zb) {
    const left = Z.start != null ? Math.max(0, E.ZAKAT.HAWL - (S.day - Z.start)) : null;
    hw.className = 'hudt zk' + (Z.due ? ' due' : ''); hw.hidden = false;
    hw.innerHTML = Z.due ? `<b>مستحقة</b><small>🕌 الزكاة</small>${hbar(1)}` : left != null ? `<b>${left} يوم</b><small>🕌 الحول</small>${hbar(1 - left / E.ZAKAT.HAWL)}` : `<b>${Math.round(zb.base / zb.nisab * 100)}٪</b><small>🕌 من النصاب</small>${hbar(zb.base / zb.nisab)}`;
  } else hw.hidden = true;
  if (hd && !hd.hidden) { if (Z && Z.due) hd.hidden = true; else hw.hidden = true; }
  $('hLoad').classList.toggle('solo', (!hd || hd.hidden) && hw.hidden); // الخانة الخامسة: الدَّين، وتأخذها الزكاة حين تُستحق
  $('hDay').textContent = S.day;
  { const ic = $('hNwIc'); if (ic && !ic.firstChild) ic.innerHTML = uic('hud_wealth'); }
  const nw = E.netWorth(S), TT = E.TITLES.map(t => t[0]), ti = TT.filter(a => nw >= a).length - 1, PA = E.PHASE_AT, pi = PA.filter(a => nw >= a).length - 1;
  $('hTitle').textContent = E.titleOf(nw); $('hNW').textContent = hudShort(nw);
  $('hNW').parentElement.parentElement.title = `الثروة: ${fmt(nw)} ريال`;
  $('hProg').style.width = (ti >= TT.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - TT[ti]) / (TT[ti + 1] - TT[ti]) * 100))) + '%';
  const av = $('hAvatar'), lv = L && L.char ? lvlOf() : null, gl = lv ? lv.goals(S) : [], pr = gl.length ? Math.round(gl.filter(g => g[1]).length / gl.length * 100) : 100;
  const img = charImg(), key = (L && L.char || 'trader') + '|' + img.length + '|' + (L ? L.level : 0) + '|' + pr;
  if (av.dataset.k !== key) { av.dataset.k = key; av.innerHTML = `${img ? `<span class="face-crop"><img class="face" src="${img}" alt=""></span>` : '👤'}<i class="ring" style="--p:${pr}"></i>${L && L.char ? `<b class="lvl">${L.level > 10 ? '🎓' : L.level}</b>` : ''}`; }
  [['bPause', 0], ['b1', 1], ['b2', 2], ['b3', 3]].forEach(([id, v]) => $(id).classList.toggle('on', speed === v));
  renderResourceMenu(); renderMini();
}
/* الشريط المصغّر المثبّت (الجوال): يظهر حين يخرج الشريط الكامل من الشاشة. القائمة المنسدلة تحمل الموارد والوقت والصوت */
let miniOn = false, miniOpen = false;
const MINI_KEY = () => { const w = S.player.wallet; return [S.day, speed, w.sar | 0, w.usd | 0, w.au | 0, w.ag | 0, Math.round(E.netWorth(S)), miniOpen, Sound && Sound.isMuted && Sound.isMuted(), S.learn && S.learn.char, document.getElementById('hAvatar').dataset.k].join('|'); };
let hmenuOpen = false;
function setHmenu(on) {
  const pn = $('hmenuPanel'), b = $('hMenu'); if (!pn || !b) return; hmenuOpen = !!on;
  if (on) { const r = b.getBoundingClientRect(); pn.style.top = Math.round(r.bottom + 6) + 'px'; pn.style.insetInlineStart = 'auto'; pn.style.left = Math.max(8, Math.min(innerWidth - 190, Math.round(r.left))) + 'px'; }
  pn.hidden = false; pn.classList.toggle('show', !!on); b.setAttribute('aria-expanded', String(!!on));
}
function closeMini() { if (!miniOpen) return; miniOpen = false; renderMini(true); }
function renderMini(force) {
  const m = $('hmini'), d = $('hdrop'); if (!m || !d || !S || !S.player) return;
  m.classList.toggle('show', miniOn); d.classList.toggle('show', miniOn && miniOpen);
  m.hidden = d.hidden = false;
  if (!miniOn) return;
  const key = MINI_KEY(); if (!force && m.dataset.k === key) return; m.dataset.k = key;
  const w = S.player.wallet, nw = E.netWorth(S), L = S.learn, img = charImg(), muted = (() => { try { return Sound.isMuted(); } catch (e) { return false; } })();
  m.innerHTML = `<button class="mav" data-act="profile" aria-label="ملف التاجر">${img ? `<img src="${img}" alt="">` : '👤'}</button><div class="mchip nw" title="الثروة ≈ ${fmt(nw)} ريال">${uic('hud_wealth')}<span>${hudShort(nw)}</span></div><div class="mchip" title="${fmt(w.sar)} ريال">${uic('hud_riyal')}<span>${hudShort(w.sar)}</span></div><div class="mchip day">${uic('hud_day')}<span>${S.day}</span></div><button class="mb" data-act="mspeed" data-g="${speed ? 0 : 1}" aria-label="${speed ? 'إيقاف الوقت' : 'تشغيل الوقت'}">${speed ? '⏸' : '▶'}</button><button class="mb" data-act="minidrop" aria-expanded="${miniOpen}" aria-label="تفاصيل الشريط">${miniOpen ? '⌃' : '⌄'}</button>`;
  const fdb = S.player.famDebt, Z = S.zakat, zb = Z && L && L.char ? E.zakatBase(S) : null;
  const note = fdb && fdb.left > 0 && L && L.char ? `<div class="dnote"><span>💳 دَين الجدّ</span><b>${fmt(Math.round(fdb.left))}</b></div>` : zb ? (Z.due ? '<div class="dnote"><span>🕌 الزكاة</span><b>مستحقة</b></div>' : Z.start != null ? `<div class="dnote"><span>🕌 الحول</span><b>${Math.max(0, E.ZAKAT.HAWL - (S.day - Z.start))} يوم</b></div>` : '') : '';
  const cr = main(), ld = Math.round(E.loadOf(cr)), cap = E.capOfCar(cr);
  d.innerHTML = `<div class="dnote"><span>${esc(E.titleOf(nw))}</span><b>${fmt(nw)} ريال</b></div><div class="drow"><div class="dt">${uic('hud_riyal')}<span>${hudShort(w.sar)}</span><small>ريال</small></div><div class="dt">${uic('hud_usd')}<span>$${hudShort(w.usd)}</span><small>دولار</small></div><div class="dt">${uic('hud_goldbar')}<span>${hudShort(w.au)}</span><small>غ ذهب</small></div><div class="dt">${uic('hud_cargo')}<span dir="ltr">${hudFmt(ld)}/${hudFmt(cap)}</span><small>الحمولة</small></div></div>${note}<div class="dctl"><button data-act="mspeed" data-g="0" class="${speed === 0 ? 'on' : ''}" aria-label="إيقاف">⏸</button><button data-act="mspeed" data-g="1" class="${speed === 1 ? 'on' : ''}" aria-label="عادي">▶</button><button data-act="mspeed" data-g="2" class="${speed === 2 ? 'on' : ''}" aria-label="أسرع">⏩</button><button data-act="mnext">+1 يوم</button><span class="sp"></span><button data-act="msound" aria-label="الأصوات">${muted ? '🔇' : '🔊'}</button>${L && L.char ? '<button data-act="msalem" aria-label="عمّ سالم">' + mentorAv('happy') + '</button>' : ''}</div>`;
}
(function initMini() {
  try {
    if (typeof IntersectionObserver !== 'function') return;
    const top = document.getElementById('top'); if (!top) return;
    new IntersectionObserver(es => { const out = !es[0].isIntersecting; if (out !== miniOn) { miniOn = out; if (!out) miniOpen = false; if (S && S.player) renderMini(true); } }, { threshold: 0 }).observe(top);
  } catch (e) {}
})();
const UIK = 'darb-ui'; let ui = { nav: false, top: false, full: false };
try { Object.assign(ui, JSON.parse(localStorage.getItem(UIK) || '{}')); } catch (e) {}
if (ui.mf) mf = ui.mf;
if (mapModeQuery === '3d') ui.mapMode = '3d';
const map3dWanted = () => mapModeQuery !== '2d' && !map3dFailed && ui.mapMode === '3d';
function applyUi() {
  document.body.classList.toggle('nav-off', !!ui.nav);
  const nt = $('navTog'); if (nt) { nt.textContent = ui.nav ? '☰' : '⌄'; nt.title = ui.nav ? 'فتح شريط القوائم' : 'طيّ شريط القوائم'; nt.setAttribute('aria-expanded', String(!ui.nav)); }
  placeSpot();
}
function saveUi() { try { localStorage.setItem(UIK, JSON.stringify(ui)); } catch (e) {} applyUi(); }
const navIcon = (id, fallback) => ART['nav/' + id] ? `<img class="nav-icon" src="${ART['nav/' + id]}" alt="" draggable="false">` : fallback;
function renderNav() {
  $('nav').innerHTML = SCREENS.filter(x => x[0] !== 'academy').map(([id, ic, name, ph, short]) => `<button data-go="${id}" class="${screen === id ? 'on' : ''}" aria-label="${name}" title="${name}" ${screen === id ? 'aria-current="page"' : ''}><span class="ic" aria-hidden="true">${navIcon(id, ic)}</span><span class="nav-label"><span class="full">${name}</span><span class="short">${short || name}</span></span>${S.phase < ph ? '<span class="lk" aria-hidden="true">🔒</span>' : ''}${id === 'map' && main().left > 0 ? '<span class="dot" aria-hidden="true"></span>' : ''}</button>`).join('');
}
function journeyBar() {
  const cr = main(), mc = '';
  if (cr.left <= 0 || screen === 'map') return mc;
  return mc + `<div class="card" style="margin-bottom:12px;padding:10px 14px"><div class="row" style="margin:0"><b>🐪 في الطريق إلى ${cityTag(cr.dest)}</b><span class="muted small">باقٍ ${cr.left} يوم</span><span class="spacer"></span>${speed ? '' : '<button class="sm pri" data-act="play">▶ شغّل الوقت</button>'}<button class="sm" data-go="map">شاهد الرحلة</button></div>${bar(cr.total - cr.left, cr.total, 'gold')}</div>`;
}

