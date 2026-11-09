/* ---------- الشريط العلوي الحديث (031، docs/design/TOPBAR_SPEC.md) ----------
   سطران بارتفاع 96px: هوية ← ثروة ← تاريخ ← وقت، ثم كبسولات موارد بزر «+» داخلها. TOPBAR.on=false (الافتراضي حتى الاعتماد) يُبقي الشريط القديم وحده. */
/* تنسيق الأرقام (§6): دون 10,000 كاملاً؛ 10K–999K صحيحاً؛ 1M–9.9M برقم عشري؛ 10M فأكثر صحيحاً؛ وكذلك B؛ التقريب إلى الأدنى */
function tbNum(n) {
  const v = Math.abs(n), sg = n < 0 ? '-' : '';
  if (v < 1e4) return sg + Math.floor(v).toLocaleString('en-US');
  for (const [d, u] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (v >= d) { const x = v / d; return sg + (d === 1e3 || x >= 10 ? Math.floor(x) : (Math.floor(x * 10) / 10).toFixed(1)) + u; }
}
const tbSvg = { moon: '<svg class="money-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor" stroke="none"/></svg>', debt: '<svg class="money-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M7.5 12h9"/></svg>' };
/* وجهة «+» بالسياق: الريال ← الحصّالة إن كان فيها رصيد وإلا الصرافة (قبل المستوى 6 السوق)؛ الحمولة ← السوق (لا «+» أثناء السفر) */
function plusTarget(key) {
  const L = S.learn, cr = main(), vaultOk = !!$('hVault') && !$('hVault').hidden && (S.player.vault || 0) > 0, fxOk = !L || !L.char || L.level >= 6 || L.free;
  if (key === 'load') return cr.left > 0 ? null : { go: 'market', label: 'افتح السوق' };
  return vaultOk ? { vault: true, label: 'افتح الحصّالة' } : fxOk ? { go: 'cities', fx: true, label: 'افتح الصرافة' } : { go: 'market', label: 'افتح السوق' };
}
const tbReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
let tbPrev = {}, tbKey = '', tbMin = false;
/* الكبسولات بترتيب الأولوية (النموذج المعتمد): الريال، الدولار، الحمولة، الحول، ثم الذهب والفضة والدَّين غير الصفرية؛ وعملة المدينة الحالية بإطار ذهبي */
function tbCaps() {
  const w = S.player.wallet, L = S.learn, cr = main(), out = [], ld = Math.round(E.loadOf(cr)), cap = E.capOfCar(cr), fdb = S.player.famDebt, Z = S.zakat, zb = Z && L && L.char ? E.zakatBase(S) : null;
  const ctry = S.cities[cr.city] && S.cities[cr.city].country, cur = ctry === 'sa' || !ctry ? 'sar' : 'usd';
  out.push({ id: 'sar', ic: uic('hud_riyal'), val: w.sar, txt: tbNum(w.sar), res: 'sar', plus: plusTarget('sar'), label: 'الريال', full: fmt(w.sar) + ' ريال', cur: cur === 'sar' });
  out.push({ id: 'usd', ic: uic('hud_usd'), val: w.usd, txt: tbNum(w.usd), res: 'usd', plus: plusTarget('sar'), label: 'الدولار', full: '$' + resourceNumber(w.usd), cur: cur === 'usd' });
  out.push({ id: 'load', ic: uic('hud_cargo'), val: ld, txt: tbNum(ld) + '/' + tbNum(cap), res: 'load', plus: plusTarget('load'), label: 'الحمولة', full: fmt(ld) + ' من ' + fmt(cap) });
  if (zb) { const left = Z.due ? 0 : Z.start != null ? Math.max(0, E.hawlLen(S, Z.start) - (S.day - Z.start)) : null; if (Z.due || left != null) out.push({ id: 'hawl', ic: tbSvg.moon, txt: Z.due ? 'مستحقة' : dayAr(left), act: 'profile', label: Z.due ? 'الزكاة مستحقة' : 'حول الزكاة', full: Z.due ? 'الزكاة مستحقة' : 'حول الزكاة: باقٍ ' + dayAr(left), due: !!Z.due }); }
  const fx = (id, key, icon, v, label, unit) => { if (v > 0.0001) out.push({ id, ic: uic(icon), val: v, txt: v < 100 ? (Math.floor(v * 10) / 10).toString() : tbNum(v), res: key, label, full: resourceNumber(v) + ' ' + unit }); };
  fx('au', 'au', 'hud_goldbar', w.au, 'الذهب', 'غرام ذهب'); fx('ag', 'ag', 'hud_goldbar', w.ag || 0, 'الفضة', 'غرام فضة');
  if (fdb && fdb.left > 0 && L && L.char) out.push({ id: 'debt', ic: tbSvg.debt, val: fdb.left, txt: tbNum(Math.round(fdb.left)), act: 'debt', label: 'دَين الجدّ', full: 'دَين الجدّ ' + fmt(Math.round(fdb.left)) });
  return out;
}
function tbCapHTML(c) {
  const body = `<button class="resource-info" ${c.res ? `data-act="resource" data-resource="${c.res}" aria-controls="resourceMenu" aria-expanded="false" aria-haspopup="dialog"` : `data-act="${c.act}"`} data-full="${c.full}" aria-label="${c.label}: ${c.full}"><span class="icon">${c.ic}</span><span class="num" data-v="${c.val != null ? c.val : ''}">${c.txt}</span></button>`;
  const plus = c.plus ? `<button class="plus" data-act="tbplus" data-k="${c.res === 'load' ? 'load' : 'sar'}" aria-label="${c.plus.label}" title="${c.plus.label}">+</button>` : '';
  return `<div class="pill${c.cur ? ' current-currency' : ''}${c.due ? ' due' : ''}${c.id === 'load' ? ' load-pill' : ''}" data-cap="${c.id}">${body}${plus}</div>`;
}
/* عدّاد سريع 300ms ووميض أخضر للزيادة وأحمر للنقص على الرقم فقط (يُحترم تقليل الحركة) */
function tbAnimate(el, from, to, txt) {
  if (tbReduced() || from == null || from === to || !isFinite(from)) { el.textContent = txt(to); return; }
  el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(to > from ? 'up' : 'down'); const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 300); el.textContent = txt(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); else setTimeout(() => el.classList.remove('up', 'down'), 500); }; requestAnimationFrame(step);
}
/* عدد الكبسولات الظاهرة بحسب العرض: 390 (الريال والدولار والحمولة) ثم «⋯ +n»؛ وعلى 360 كبسولتان؛ وعلى الشاشات العريضة الأكثر */
const tbLimit = () => { const w = ($('top') || document.body).clientWidth; return w < 375 ? 2 : w < 700 ? 3 : 6; };
function renderTopBar2() {
  const root = $('tb2'); if (!root || !S || !S.player) return;
  const L = S.learn, nw = E.netWorth(S), dt = E.dateOf(S), img = charImg(), TT = E.TITLES.map(t => t[0]), ti = TT.filter(a => nw >= a).length - 1;
  const prog = ti >= TT.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - TT[ti]) / (TT[ti + 1] - TT[ti]) * 100)), lvl = L && L.char ? (E.stageOf(S)?.n || L.level) : '';
  const hm = String(dt.hs).match(/^(\S+)\s+(\S+)\s+(\S+)/), dayMonth = hm ? hm[1] + ' ' + hm[2] : dt.hs, hy = hm ? hm[3] + ' هـ' : '';
  const av = $('tbAv'), akey = (L && L.char || '') + '|' + img + '|' + lvl; if (av.dataset.k !== akey) { av.dataset.k = akey; av.innerHTML = `<span class="face">${img ? `<img src="${img}" alt="">` : ''}</span>${lvl !== '' ? `<i class="level">${lvl}</i>` : ''}`; }
  const rank = $('tbRank'), rt = E.titleOf(nw), wasW = tbPrev.w; if (rank.textContent !== rt || wasW !== innerWidth) { rank.textContent = rt; rank.classList.remove('s'); if (rank.scrollWidth > rank.clientWidth + 1) rank.classList.add('s'); }
  $('tbProg').style.width = prog + '%';
  { const an = $('hAncestry'), tn = $('tbAnc'), tx = an ? an.textContent.trim() : ''; if (tn) { tn.hidden = !tx; if (tn.textContent !== tx) tn.textContent = tx; } } // سلسلة النسب (حفيد فلان) تظهر على الشاشات العريضة
  { const wi = $('tbNw').querySelector('.icon'); if (!wi.firstChild) wi.innerHTML = uic('hud_wealth'); }
  const nb = $('tbNw').querySelector('.num'); if (tbPrev.nw !== nw) { tbAnimate(nb, tbPrev.nw, nw, tbNum); tbPrev.nw = nw; } $('tbNw').dataset.full = fmt(Math.round(nw)) + ' ريال'; $('tbNw').setAttribute('aria-label', 'الثروة ' + fmt(Math.round(nw)) + ' ريال، أين أقف');
  const d1 = $('tbDate').querySelector('.date-day'), d2 = $('tbDate').querySelector('.date-year'); if (d1.textContent !== dayMonth) d1.textContent = dayMonth; if (d2.textContent !== hy) d2.textContent = hy; $('tbDate').setAttribute('aria-label', 'التاريخ ' + dt.hs + '، التقويم');
  const pl = $('tbPlay'); pl.dataset.g = speed ? 0 : 1; pl.dataset.run = speed ? '1' : '0'; pl.setAttribute('aria-pressed', String(!speed)); pl.setAttribute('aria-label', speed ? 'إيقاف الوقت' : 'تشغيل الوقت');
  const all = tbCaps(), lim = tbLimit(), vis = all.length > lim ? all.slice(0, lim) : all, hidden = all.length - vis.length, row = $('tbRes');
  const key = vis.map(c => c.id + (c.plus ? c.plus.label : '') + (c.due ? '!' : '') + (c.cur ? '*' : '')).join('|') + '|' + hidden + '|' + (L && L.char);
  const pulse = id => { if (tbReduced()) return; const el = row.querySelector(`[data-cap="${id}"]`); if (el) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); } };
  const vault = S.player.vault || 0; if (tbPrev.vault != null && vault > tbPrev.vault) pulse('sar'); tbPrev.vault = vault;
  const sar = all[0].val; if (tbPrev.sar != null && sar - tbPrev.sar >= Math.max(10000, tbPrev.sar * 0.05)) pulse('sar'); tbPrev.sar = sar;
  if (key !== tbKey) { tbKey = key; row.innerHTML = vis.map(tbCapHTML).join('') + (hidden ? `<button class="pill overflow-pill" data-act="hdrtoggle" data-full="${all.slice(lim).map(c => c.label + ': ' + c.full).join(' · ')}" aria-label="فتح ${hidden} موارد إضافية"><span>⋯</span> <span class="num">+${hidden}</span></button>` : ''); for (const c of all) tbPrev['c' + c.id] = c.val; }
  else for (const c of vis) { const el = row.querySelector(`[data-cap="${c.id}"] .num`); if (!el) continue; const pv = tbPrev['c' + c.id]; if (el.textContent !== c.txt) { if (c.val != null && pv != null && pv !== c.val && c.id !== 'load') tbAnimate(el, pv, c.val, v => tbNum(v)); else el.textContent = c.txt; } if (c.val != null) tbPrev['c' + c.id] = c.val; const b = row.querySelector(`[data-cap="${c.id}"] .resource-info`); if (b) { b.dataset.full = c.full; b.setAttribute('aria-label', c.label + ': ' + c.full); } }
  tbPrev.w = innerWidth;
  const al = $('hAlert'), bb = al && al.querySelector('.abadge'), n = bb && !bb.hidden ? bb.textContent.trim() : '', bell = $('tbBell'); if (bell) { bell.hidden = !(al && !al.hidden); const bd = bell.querySelector('.badge'); bd.hidden = !n; bd.textContent = n; bell.setAttribute('aria-label', n ? 'التنبيهات: ' + n : 'التنبيهات'); }
}
/* تلميح بالمبلغ الكامل عند الضغط المطوّل على أي رقم في الشريط (§6) */
(function () { let t = null, tip = null; const hide = () => { clearTimeout(t); if (tip) { tip.remove(); tip = null; } };
  document.addEventListener('pointerdown', ev => { const e = ev.target.closest && ev.target.closest('#tb2 [data-full]'); hide(); if (!e) return; t = setTimeout(() => { tip = document.createElement('div'); tip.id = 'tbTip'; tip.setAttribute('role', 'tooltip'); tip.textContent = e.dataset.full; document.body.appendChild(tip); const r = e.getBoundingClientRect(); tip.style.top = Math.round(r.bottom + 8) + 'px'; tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px'; setTimeout(hide, 2500); }, 500); });
  document.addEventListener('pointerup', () => clearTimeout(t)); document.addEventListener('pointercancel', hide); })();
/* عند التمرير لأسفل يُطوى سطر الموارد ويعود عند التمرير لأعلى */
(function () { let y0 = window.scrollY; window.addEventListener('scroll', () => { const y = window.scrollY, dn = y > y0 + 4, up = y < y0 - 4; if (dn && y > 60 && !tbMin) { tbMin = true; document.body.classList.add('tb-min'); } else if ((up || y < 20) && tbMin) { tbMin = false; document.body.classList.remove('tb-min'); } y0 = y; }, { passive: true }); })();
/* ضغط مطوّل على زر الوقت يفتح لوحة التفاصيل (فيها السرعات) */
document.addEventListener('pointerdown', ev => { const b = ev.target.closest && ev.target.closest('#tbPlay'); if (!b) return; b.dataset.lp = ''; clearTimeout(b._lp); b._lp = setTimeout(() => { b.dataset.lp = '1'; setHdr(true); renderAll(true); }, 550); });
document.addEventListener('pointerup', () => { const b = $('tbPlay'); if (b) clearTimeout(b._lp); });
