/* احتفال قصير قابل للتخطي؛ لا يغيّر سرعة الوقت أو الحالة المالية. */
const CELEBRATE_LINES = {
  first_country: () => 'وصلتَ إلى أول دولة جديدة؛ الأسواق تتسع لك.',
  first_ship: () => 'سفينتك الأولى جاهزة؛ دروب البحر بانتظارك.',
  market_lead: () => 'صرتَ زعيم السوق؛ أحسنتَ يا تاجر.',
  first_million: () => 'بلغتَ مليونك الأول؛ حصاد تعبك يستحق الفخر.',
  chapter_done: item => { const c = window.ContentMap?.CHAPTERS.find(c => c.n === item.arg); return c ? 'أتممتَ فصل «' + c.title + '»؛ واصلتَ دربك بثبات.' : ''; },
  retirement: () => 'أحسنتَ المسيرة؛ سلّمتَ الأمانة لجيل جديد.'
};
let celebration = null, celebrationFade, celebrationEnd;
function celebrateBusy() {
  const L = S && S.learn;
  if (!L || coverOn || learnNext() || fgOpen() || L.eq?.length || S.road || rcpt) return true;
  if (document.activeElement?.matches('input:not([type=button]):not([type=checkbox]),select,textarea')) return true;
  return [...document.querySelectorAll('[role=dialog],[aria-modal=true],dialog[open],[role=menu],#lesson,#modal,#dlg,#agingPanel,#profile,#rcpt,#alertPanel,.hmenu')]
    .some(el => !el.hidden && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
}
function closeCelebrate(immediate = false) {
  clearTimeout(celebrationFade); clearTimeout(celebrationEnd);
  const panel = $('celebrateLayer');
  if (!panel || !celebration) return;
  if (!immediate && !motionPreference.matches) {
    panel.classList.add('cel-leave');
    celebrationEnd = setTimeout(() => closeCelebrate(true), 150);
    return;
  }
  panel.hidden = true; panel.classList.remove('cel-leave'); celebration = null;
}
function renderCelebrate() {
  const L = S && S.learn;
  if (!E.CELEBRATE.on || !L) { closeCelebrate(true); return; }
  if (!celebration && !(L.celq && L.celq.length)) return;
  if (celebration && celebration.state !== S) closeCelebrate(true);
  if (celebrateBusy()) { closeCelebrate(true); return; }
  if (celebration && L.celq?.[0]?.id === 'retirement' && celebration.key !== 'retirement') closeCelebrate(true);
  if (celebration) return;
  const queue = L.celq, book = L.cel || (L.cel = {});
  if (!queue || !queue.length) return;
  const shown = book.shown || (book.shown = {});
  while (queue.length && shown[E.celebrateKey(queue[0].id, queue[0].arg)] != null) queue.shift();
  const item = queue[0];
  if (!item || !Object.prototype.hasOwnProperty.call(CELEBRATE_LINES, item.id)) return;
  const key = E.celebrateKey(item.id, item.arg), fired = book[key] == null ? S.day : book[key];
  const last = Math.max(L.lastMom ?? -99, book.lastShown ?? -99);
  if (item.id !== 'retirement' && E.SCHED.celebrate && S.day - last < E.SCHED.GAP_DAYS && S.day - fired < E.SCHED.MAX_HOLD) return;
  const line = CELEBRATE_LINES[item.id](item);
  if (!line) return;
  let panel = $('celebrateLayer');
  if (!panel) {
    panel = document.createElement('section'); panel.id = 'celebrateLayer'; panel.className = 'celebrate-layer';
    panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite'); panel.setAttribute('data-keep-mentor-name', '');
    panel.addEventListener('click', () => closeCelebrate()); document.body.append(panel);
  }
  const portrait = ART['hero/salem_expressions'] ? `<span class="pic av salem-portrait cutout" style="--salem-x:2;--salem-y:0"><img src="${ART['hero/salem_expressions']}" alt="عمّ سالم" draggable="false"></span>` : '';
  panel.innerHTML = `<button type="button" id="celebrateCard" class="celebrate-card" aria-label="تخطي الاحتفال"><img class="cel-scene" src="${ART['celebrate/' + item.id]}" alt="" draggable="false"><span class="cel-caption">${portrait}<span class="cel-words"><b>عمّ سالم</b><span class="celebrate-line">${esc(line)}</span></span><span class="cel-skip">المس للتخطي</span></span></button>`;
  panel.classList.remove('cel-leave'); panel.hidden = false;
  queue.shift(); shown[key] = S.day; book.lastShown = S.day;
  const record = celebration = { state: S, key };
  panel.querySelector('.cel-scene').addEventListener('error', event => { event.target.hidden = true; });
  persist(); // استهلاك الطابور وسجل العرض معاً، فلا يعاد بعد فتح الحفظ.
  document.dispatchEvent(new CustomEvent('celebrate:shown', { detail: { id: item.id, arg: item.arg, key, day: S.day } }));
  celebrationFade = setTimeout(() => { if (celebration === record && !motionPreference.matches) panel.classList.add('cel-leave'); }, 2850);
  celebrationEnd = setTimeout(() => { if (celebration === record) closeCelebrate(true); }, 3000);
}
new MutationObserver(() => renderCelebrate()).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'class', 'style'] });
document.addEventListener('focusout', () => requestAnimationFrame(renderCelebrate));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !celebration) return;
  if (celebrateBusy()) { closeCelebrate(true); return; }
  event.preventDefault(); event.stopImmediatePropagation(); closeCelebrate();
}, true);
