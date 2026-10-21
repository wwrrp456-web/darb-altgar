/* ---------- العرض ---------- */
const RENDER = { home: screenHome, map: screenMap, market: screenMarket, caravan: screenCaravan, estate: screenEstate, empire: screenEmpire, lords: screenLords, cities: screenCities, academy: screenAcademy };
let lastLeft = null;
/* حركة القافلة على الخريطة المسطّحة: تنزلق من موضعها السابق إلى الجديد بدل القفز يوماً بيوم */
const capos = {};
function animateCaravans() {
  const reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  document.querySelectorAll('#map .map-caravan').forEach(el => {
    const id = el.dataset.caravan, x = +el.dataset.x, y = +el.dataset.y, p = capos[id]; capos[id] = { x, y };
    if (!p || reduce || !el.animate) return; const dx = p.x - x, dy = p.y - y; if (Math.hypot(dx, dy) < 0.5) return;
    const gm = glideMs(); el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0px,0px)' }], gm ? { duration: gm, easing: 'linear' } : { duration: Math.min(1100, 300 + Math.hypot(dx, dy) * 6), easing: 'ease-in-out' });
  });
}
/* مشهد الرحلة: ينزلق الجمل أو السفينة من موضع أمس إلى اليوم طوال زمن اليوم بدل القفز */
let jprev = null;
function glideJourney() {
  const el = document.querySelector('.camelMove'), m = main(); if (!el) { jprev = null; return; }
  const cur = parseFloat(el.style.right), key = m.from + ':' + m.dest, gm = glideMs();
  if (jprev && jprev.key === key && gm && cur > jprev.v && el.animate) el.animate([{ right: jprev.v + '%' }, { right: cur + '%' }], { duration: gm, easing: 'linear' });
  jprev = { key, v: cur };
}
function achToasts() {
  const q = S && S.ach && S.ach.q; if (!q || !q.length) return; const d = E.ACHD.LIST.find(a => a.id === q[q.length - 1]); const k = q.length; q.length = 0;
  if (d) { toast(k > 1 ? 'إنجازات جديدة: ' + k + ' (آخرها ' + d.name + ')' : 'إنجاز جديد: ' + d.name); sfx('success'); }
}
function renderAll(force) {
  if (S && !S.ach) E.achInit(S);
  { // وصول القافلة الرئيسية: الانتقال إلى سوق المدينة التي وصلتها
    const mc = main();
    if (lastLeft !== null && lastLeft > 0 && mc.left === 0) {
      sel = mc.city; dg = null; force = true; toast('وصلت إلى ' + S.cities[mc.city].name + ' 🏪'); sfx('caravan');
      if (screen !== 'market') { screen = 'market'; try { history.pushState(null, '', '#market'); } catch (e) { location.hash = 'market'; } window.scrollTo(0, 0); }
    }
    lastLeft = mc.left;
  }
  renderHeader();
  if (!force && (pressing || (screen === 'map' && Map3D.interacting()))) { dirty = true; return; }
  renderNav();
  const ae = document.activeElement, scr = $('screen');
  if (!force && ae && /^(SELECT|INPUT)$/.test(ae.tagName) && ae.type !== 'checkbox' && scr.contains(ae)) return;
  if (!force && screen === 'cities' && ct === 'test') return;
  if (!force && (screen === 'estate' || screen === 'empire') && ae && scr.contains(ae)) return;
  $('journeyBar').innerHTML = journeyBar();
  // تحديث الوقت لا يعيد إنشاء سياق الرسومات ولا يقطع سحب الخريطة أو تركيز لوحة المفاتيح.
  const keepMap = !force && screen === 'map' && map3dWanted() ? $('mapbox') : null;
  const keepFocus = keepMap && ae && keepMap.contains(ae);
  if (!keepMap) Map3D.destroy();
  scr.innerHTML = RENDER[screen]();
  if (keepMap) { $('mapbox').replaceWith(keepMap); if (keepFocus) ae.focus({preventScroll:true}); }
  else if (screen === 'map') mountMap3D();
  if (screen === 'map') { animateCaravans(); glideJourney(); }
  if (force || !dg) renderModal();
  renderProfile(); achToasts();
  document.body.classList.toggle('guide-simple', guideOn() && !ui.full);
  if (S.seaRes) { const sr = S.seaRes; S.seaRes = null; if (sr.k === 'storm') roadRes = { outcome: 'storm', msg: sr.msg, sea: true }; else if (sr.msg) toast(sr.msg); }
  renderSalem(); renderSpot(); renderLesson(); renderReact(); renderDlg();
  persistSoon();
  GameIcons.paint(document.body);
  dirty = false;
}
function scrollToTabs() {
  const el = document.querySelector('#screen .chips'); if (!el) return;
  const t = el.getBoundingClientRect().top;
  if (t < 0 || t > innerHeight * 0.45) window.scrollTo({ top: Math.max(0, t + scrollY - 12), behavior: 'smooth' });
}
function leaveTo(s) { screen = s; dg = null; try { history.pushState(null, '', '#' + s); } catch (e) {} window.scrollTo(0, 0); }

function dealGo(gd, to, want) {
  const m = main(), c0 = S.cities[m.city], cr0 = c0.country !== S.cities[to].country ? CD[S.cities[to].country].customs : 0;
  if (m.left > 0) return toast('القافلة في الطريق');
  { const tb = E.travelBlock(S, m, to); if (tb) return toast(tb); }
  const dd = E.tripDays(S, m, m.city, to), reserve = E.supplyNeed(m, dd) * E.unitPrice(c0, 'wheat') * 1.25 + 10;
  const room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[gd].w), afford = Math.floor((S.player.gold - reserve) / (E.unitPrice(c0, gd) * (1 + cr0 * 1.1)));
  const k = Math.max(0, Math.min(room, afford, want || 999));
  if (k < 1) return toast('رصيدك أو مساحة القافلة لا يكفي لهذه الصفقة');
  A.buy(S, m.id, gd, k);
  const r = A.travel(S, m.id, to);
  if (r.ok) { toast('اشتريت ' + k + ' ' + GD[gd].name + ' وانطلقت'); sel = m.city; dg = null; leaveTo('map'); setSpeed(speed || 1); } else act(r);
}
function fxPreview() {
  const el = $('fxPrev'); if (!el) return;
  const f = $('fxFrom').value, t = $('fxTo').value, amt = parseFloat($('fxAmt').value) || 0, w = S.player.wallet;
  if (f === t) { el.innerHTML = '<span class="dear">اختر عملتين مختلفتين</span>'; return; }
  const a = Math.min(amt, w[f]), val = a * E.rateOf(S, f), fee = val * E.feeOf(f, t), got = (val - fee) / E.rateOf(S, t);
  el.innerHTML = amt > w[f] ? `<span class="dear">رصيدك ${(f === 'au' || f === 'ag') ? w[f].toFixed(3) : fmt(w[f])} فقط</span>` : `تدفع ${(f === 'au' || f === 'ag') ? a.toFixed(3) : fmt(a)} ${E.CURS[f].name} ← تستلم <b>${(t === 'au' || t === 'ag') ? got.toFixed(3) : fmt(got)}</b> ${E.CURS[t].name} · رسم ${fmt(fee)} ريال (${(E.feeOf(f, t) * 100).toFixed(1)}٪)`;
}
document.addEventListener('input', ev => { if (ev.target.id === 'fxAmt') fxPreview(); if (ev.target.id === 'scIn') simpText = ev.target.value; });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (hmenuOpen) setHmenu(false); else if (miniOpen) closeMini(); else if (S && S.story && S.story.cur) { A.dlgClose(S); renderAll(true); } else if (salemOpen) { salemSet(false); } else if (resourceOpen) { ev.preventDefault(); closeResourceMenu(true); } else if (prof) { prof = false; renderAll(true); } else if (cdg) { cdg = null; renderAll(true); } else if (dg) { dg = null; renderAll(true); } } });

function moveMap(dx, dy) {
  if (!mapVB || !mapBase) return;
  mapView.center = [mapVB[0] + mapVB[2] / 2 + dx, mapVB[1] + mapVB[3] / 2 + dy];
  mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center);
  mapView.center = [mapVB[0] + mapVB[2] / 2, mapVB[1] + mapVB[3] / 2];
  if ($('map')) $('map').setAttribute('viewBox', mapVB.join(' '));
}
document.addEventListener('keydown', ev => {
  const target = ev.target.closest('#map'); if (!target) return;
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role=button]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
  if (dir) { ev.preventDefault(); moveMap(dir[0] * mapVB[2] * .15, dir[1] * mapVB[3] * .15); }
});
document.addEventListener('pointerdown', ev => {
  const svg = ev.target.closest('#map'); if (!svg || ev.button !== 0) return;
  mapDragged = false;
  mapDrag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, center: [mapVB[0]+mapVB[2]/2, mapVB[1]+mapVB[3]/2], width: svg.clientWidth, height: svg.clientHeight, box: mapVB.slice(), svg };
});
document.addEventListener('pointermove', ev => {
  if (!mapDrag || mapDrag.id !== ev.pointerId || mapView.zoom <= 1) return;
  const dx = ev.clientX - mapDrag.x, dy = ev.clientY - mapDrag.y;
  if (!mapDragged && Math.hypot(dx, dy) < 7) return;
  mapDragged = true;
  if (!mapDrag.svg.hasPointerCapture(ev.pointerId)) mapDrag.svg.setPointerCapture(ev.pointerId);
  mapView.center = [mapDrag.center[0] - dx / mapDrag.width * mapDrag.box[2], mapDrag.center[1] - dy / mapDrag.height * mapDrag.box[3]];
  mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center); mapDrag.svg.setAttribute('viewBox', mapVB.join(' '));
});
function endMapDrag() { if (!mapDrag) return; const dragged = mapDragged; mapDrag = null; pressing = false; if (dragged && screen === 'map') renderAll(true); setTimeout(() => { mapDragged = false; }, 100); }
document.addEventListener('pointerup', endMapDrag);
document.addEventListener('pointercancel', endMapDrag);
// لا تختار مدينة بالخطأ بعد سحب الخريطة.
document.addEventListener('click', ev => { if (mapDragged && ev.target.closest('#mapbox')) { mapDragged = false; ev.preventDefault(); ev.stopImmediatePropagation(); } }, true);
let mapResize;
window.addEventListener('resize', () => { clearTimeout(mapResize); mapResize = setTimeout(() => { if (screen === 'map') renderAll(true); }, 120); });
document.addEventListener('input', ev => {
  const t0 = ev.target; if (!t0 || t0.id !== 'mktQ') return;
  mq = t0.value; clearTimeout(document.__mq); document.__mq = setTimeout(() => { renderAll(true); const q = $('mktQ'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} } }, 250);
});
document.addEventListener('toggle', ev => {
  if (ev.target.matches && ev.target.matches('details[data-dk]')) detOpen[ev.target.dataset.dk] = ev.target.open; if (ev.target.dataset.dk === 'deals') { ui.dealsOpen = ev.target.open; saveUi(); } if (ev.target.matches('.map-cities') && ev.target.isConnected) mapListOpen[mapC] = ev.target.open; }, true);

