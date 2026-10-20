/* ---------- الوقت ---------- */
function setSpeed(n) { speed = n; clearInterval(timer); if (n) timer = setInterval(step, SPEEDS[n]); renderHeader(); renderAll(true); }
function step() {
  if (fgOpen()) return;
  E.tick(S);
  if (S.pause) { speed = 0; clearInterval(timer); }
  if (S.day - lastSave >= 5) { persist(); lastSave = S.day; }
  renderAll(false);
}

/* ---------- التوجيه ---------- */
const SCREENS = [['home', '🏠', 'الرئيسية', 1], ['map', '🗺️', 'الخريطة', 1], ['market', '🏪', 'السوق', 1], ['caravan', '🐪', 'القافلة', 1], ['estate', '🏬', 'العقارات', 2], ['lords', '🤝', 'الزعماء', 1], ['empire', '🏛️', 'الإمبراطورية', 2], ['academy', '🎓', 'الأكاديمية', 1], ['cities', '🏙️', 'الدول والدفتر', 1, 'الدول']];
function go(s) {
  closeResourceMenu();
  if (!SCREENS.some(x => x[0] === s)) s = 'home';
  if (s === 'market' && main().left === 0 && screen !== 'market') sel = main().city;
  screen = s; dg = null; prof = false; if (S.tut) { S.tut.f[s] = true; if (s === 'cities' && ct === 'fx') S.tut.f.fx = true; }
  if (location.hash !== '#' + s) { try { history.pushState(null, '', '#' + s); } catch (e) { location.hash = s; } }
  window.scrollTo(0, 0); renderAll(true);
}
window.addEventListener('popstate', () => { closeResourceMenu(); const h = location.hash.replace('#', ''); if (SCREENS.some(x => x[0] === h)) { screen = h; renderAll(true); } });

