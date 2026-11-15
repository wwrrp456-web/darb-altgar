/* 051 مدير النوافذ: ثلاثة أنواع (sheet سفلية، lesson وسط الشاشة، react فقاعة) بإغلاق واحد؛ واجهة فقط بلا حقل حفظ.
   كل حاوية قائمة تُسجَّل في WREG بدالّة رؤية (تُشتق من حالتها) ودالّة إغلاق (= ما كان يفعله زرّها)؛ winScan() بعد كل رسم تبني المكدس وتحجب الخلفية وتدير التركيز.
   المحروسة (guard/own: الحصّالة، بيع الأصل، القرض الحسن المبكر، تأكيد الحفيد، استعادة النسخة): الإطار فقط، لا إغلاق بالخلفية ولا بالسحب، وتدير تركيزها بنفسها.
   WIN.on=false (?win=off): لا مدير، وتعمل المستمعات القديمة (الملفوفة بـ !WIN.on) حرفاً. */
const WIN = { on: !/[?&]win=off/.test(location.search), kinds: { sheet: 'نافذة سفلية', lesson: 'درس/لحظة', react: 'ردّ شخصية' }, toastMs: 2600 };
const win = { stack: [], opener: {}, busy: false };
const winOn = (el, ok) => !!el && !el.hidden && (ok == null || ok);
const winRender = () => { try { renderAll(true); } catch (e) {} };
/* السجل: id, kind, el(): العنصر, vis(): ظاهرة؟, close(): الإغلاق (يصفّر حالتها ويرسم), esc(): سلوك Esc (الافتراضي = close)،
   block:false = لا تحجب الخلفية, guard / own: انظر الأعلى، label: aria-label إن غاب */
const WREG = [
  { id: 'vault', kind: 'sheet', guard: true, own: true, el: () => $('vaultPanel'), vis: () => winOn($('vaultPanel')), close: () => closeVault() },
  { id: 'asset-sale', kind: 'sheet', guard: true, own: true, el: () => $('assetSalePanel'), vis: () => winOn($('assetSalePanel'), !!assetSaleView), close: () => closeAssetSale() },
  { id: 'early-qard', kind: 'sheet', guard: true, own: true, el: () => $('earlyQardPanel'), vis: () => winOn($('earlyQardPanel'), !!earlyQardView), close: () => closeEarlyQard() },
  { id: 'backup', kind: 'sheet', guard: true, own: true, el: () => $('backupPanel'), vis: () => winOn($('backupPanel')), close: () => backupClose() },
  { id: 'grandchild', kind: 'lesson', guard: true, own: true, el: () => $('agingPanel'), vis: () => winOn($('agingPanel'), !!grandchildPrompt), close: () => grandchildCancel() },
  { id: 'dsheet', kind: 'sheet', el: () => $('dsheet'), vis: () => !!$('dsheet'), close: () => dClose(), label: 'التفاصيل' },
  { id: 'profile', kind: 'sheet', el: () => $('profile'), vis: () => winOn($('profile')), close: () => { prof = false; winRender(); }, label: 'ملف التاجر' },
  { id: 'wealth', kind: 'sheet', el: () => $('wealthPanel'), vis: () => winOn($('wealthPanel')), close: () => { wealthOpen = false; winRender(); } },
  { id: 'modal', kind: 'sheet', el: () => $('modal'), vis: () => winOn($('modal')), label: 'التفاصيل',
    close: () => { if (tp) tp = null; else if (cdg && !dg && screen === 'caravan') cdg = null; else dg = null; winRender(); } },
  { id: 'salem', kind: 'sheet', block: false, el: () => $('salemPanel'), vis: () => winOn($('salemPanel')), close: () => salemSet(false) },
  { id: 'top', kind: 'sheet', block: false, el: () => $('topPanel'), vis: () => !!hdrOpen && !hdrStatic, close: () => setHdr(false) },
  { id: 'lesson', kind: 'lesson', el: () => $('lesson'), vis: () => winOn($('lesson')), label: 'درس',
    close: () => learnClose(), esc: () => { const b = $('lesson').querySelector('[data-act="wclose"][data-was="lclose"]'); if (b) learnClose(); } },
  { id: 'aging', kind: 'lesson', el: () => $('agingPanel'), vis: () => winOn($('agingPanel'), !grandchildPrompt), label: 'السجل',
    close: () => { agingView = ''; winRender(); }, esc: () => { if (agingView && !(S.life && S.life.pending)) { agingView = ''; winRender(); } } },
  { id: 'dlg', kind: 'lesson', el: () => $('dlg'), vis: () => winOn($('dlg')), label: 'حدث',
    close: () => { if (S && S.story && S.story.cur) { A.dlgClose(S); winRender(); } }, esc: () => { if (S && S.story && S.story.cur) { A.dlgClose(S); winRender(); } } },
  { id: 'celebrate', kind: 'lesson', block: false, el: () => $('celebrateLayer'), vis: () => !!celebration && winOn($('celebrateLayer')), close: () => closeCelebrate(), esc: () => { if (celebrateBusy()) closeCelebrate(true); else closeCelebrate(); } },
  { id: 'react', kind: 'react', el: () => $('react'), vis: () => winOn($('react')), close: () => { $('react').hidden = true; } },
  { id: 'peek', kind: 'react', el: () => $('salemPeek'), vis: () => winOn($('salemPeek')), close: () => { $('salemPeek').hidden = true; } },
];
const winEl = w => { try { return w.el(); } catch (e) { return null; } };
const winVis = w => { try { return !!w.vis(); } catch (e) { return false; } };
const winTop = () => win.stack.length ? win.stack[win.stack.length - 1] : null;
const winOpenAny = () => !!winTop() || fgOpen();
/* أعلى نافذة حاجبة أو غير حاجبة يُغلقها Esc: الفقاعة لا تسبق ما تحتها */
const winEscTarget = () => { for (let i = win.stack.length - 1; i >= 0; i--) if (win.stack[i].kind !== 'react') return win.stack[i]; return win.stack[win.stack.length - 1] || null; };
function winOpen(id, kind, opts) { /* تسجيل نافذة جديدة صراحةً: opts { el, label, close, guard, own, block } */
  opts = opts || {}; let w = WREG.find(x => x.id === id);
  if (!w) { w = { id, kind, el: () => opts.el, vis: () => winOn(opts.el), close: opts.close || (() => { if (opts.el) opts.el.hidden = true; winRender(); }), guard: !!opts.guard, own: !!opts.own, block: opts.block, label: opts.label }; WREG.push(w); }
  if (WIN.on) winScan(); return w;
}
function winClose(id) { const w = id ? win.stack.find(x => x.id === id) || WREG.find(x => x.id === id) : winEscTarget(); if (!w) return false; (w.close || (() => {}))(); return true; }
/* النافذة التي يقع فيها عنصر مضغوط (الأقرب أعلى المكدس) */
const winFor = node => { for (let i = win.stack.length - 1; i >= 0; i--) { const el = winEl(win.stack[i]); if (el && node && el.contains(node)) return win.stack[i]; } return null; };
const winFocusable = el => [...el.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(e => e.getClientRects().length);
/* ✕ أعلى النوافذ التي كانت تُحقن بـ topClose: يضعه المدير بعد كل رسم (المحتوى يُعاد بناؤه فيُعاد وضعه) */
const WBAR = '[data-was="gdclose"],[data-was="cgclose"],[data-was="tpcancel"],[data-was="pclose"],[data-act="hgclose"]';
function winBar(el) {
  if (!el || el.hidden || el.querySelector('.mx-bar')) return;
  const b = el.querySelector(WBAR), box = el.firstElementChild; if (!b || !box) return;
  box.insertAdjacentHTML('afterbegin', `<div class="mx-bar"><button class="mx" data-act="wclose" data-was="${b.dataset.was || b.dataset.act}" aria-label="إغلاق" title="إغلاق">✕</button></div>`);
}
function winSync() { /* الحجب: inert واحد للخلفية إن وُجدت نافذة حاجبة؛ ولا يمسّ ما يقرّره fgSync القائم (ovl) */
  const blockers = win.stack.filter(w => w.block !== false && !w.guard && (w.kind === 'sheet' || w.kind === 'lesson'));
  ['top', 'screen', 'nav', 'journeyBar'].forEach(i => { const e = $(i); if (!e || i === 'top' && document.body.classList.contains('vault-offer-focus')) return; /* عرض الحصّالة: الشريط يبقى حياً كما يقرّر fgSync */ const mine = e.dataset.wininert === '1';
    if (blockers.length && !blockers.some(w => { const el = winEl(w); return el && e.contains(el); })) { if (!e.inert) { e.inert = true; e.dataset.wininert = '1'; } }
    else if (mine) { if (!document.body.classList.contains('ovl')) e.inert = false; delete e.dataset.wininert; } });
}
function winScan() {
  if (!WIN.on || !S || win.busy) return;
  const vis = WREG.filter(winVis);
  win.stack = win.stack.filter(w => { if (vis.includes(w)) return true; const o = win.opener[w.id]; delete win.opener[w.id]; if (o && !w.own && w.block !== false && o.isConnected && !o.closest('[inert],[hidden]')) try { o.focus({ preventScroll: true }); } catch (e) {} return false; });
  const fresh = vis.filter(w => !win.stack.includes(w));
  fresh.sort((a, b) => ({ react: 0, sheet: 1, lesson: 2 }[a.kind] - { react: 0, sheet: 1, lesson: 2 }[b.kind]));
  for (const w of fresh) { const el = winEl(w); win.stack.push(w); const ae = document.activeElement; win.opener[w.id] = ae && ae !== document.body && el && !el.contains(ae) ? ae : null;
    if (el && w.kind !== 'react' && !w.own) { if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && w.label) el.setAttribute('aria-label', w.label); if (!el.getAttribute('role') && !el.querySelector('[role="dialog"]')) { el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', String(w.block !== false)); } } }
  /* نافذة سفلية واحدة ظاهرة في المرة: فتح ثانية يغلق الأقدم (إلا المحروسة وغير الحاجبة) */
  const sheets = win.stack.filter(w => w.kind === 'sheet' && !w.guard && w.block !== false && w.id !== 'dsheet'); // dsheet تفصيلٌ يُفتح فوق ما تحته (شارة داخل الملف مثلاً) فيبقى ما تحته كما كان
  if (sheets.length > 1) { win.busy = true; try { sheets.slice(0, -1).forEach(w => { w.close(); }); } finally { win.busy = false; } win.stack = win.stack.filter(w => winVis(w)); }
  for (const w of win.stack) if (w.id === 'modal' || w.id === 'profile' || w.id === 'wealth') winBar(winEl(w));
  /* السجل (lesson) أعلى المكدس: النوافذ تحته تُخفى كما كان maskAgingForeground يفعل */
  if (win.stack.some(w => w.id === 'aging' || w.id === 'grandchild')) for (const id of ['profile', 'modal', 'dlg', 'lesson', 'salemPanel']) { const e = $(id); if (e && !e.hidden) e.hidden = true; }
  winSync();
  const top = winTop(); if (top && (fresh.includes(top) || document.activeElement === document.body) && !top.own && top.block !== false && top.kind !== 'react') { /* الجديدة تنال التركيز؛ وإعادة بناء المحتوى تُفقده فيعود */ const el = winEl(top); if (el && !el.contains(document.activeElement)) { const f = winFocusable(el)[0]; if (f) try { f.focus({ preventScroll: true }); } catch (e) {} } }
}
/* مستمع Escape واحد: النافذة العليا بحسب نوعها، ثم ما ليس نافذة (قوائم صغيرة، أدوات المطوّر) */
if (WIN.on) document.addEventListener('keydown', ev => {
  if (ev.key === 'Tab') { const w = winTop(); if (!w || w.own || w.block === false || w.kind === 'react') return; const el = winEl(w); if (!el) return; const f = winFocusable(el); if (!f.length) return;
    if (!el.contains(document.activeElement) || ev.shiftKey && document.activeElement === f[0] || !ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); (ev.shiftKey ? f[f.length - 1] : f[0]).focus(); } return; }
  if (ev.key !== 'Escape') return;
  const tl = $('tlPanel'); if (tl && !tl.hidden) { ev.preventDefault(); ev.stopImmediatePropagation(); tl.hidden = true; return; }
  try { glossClose(); } catch (e) {}
  const w = winEscTarget(); if (w) { if (w.guard || w.own) { ev.preventDefault(); ev.stopImmediatePropagation(); } (w.esc || w.close)(); return; }
  if (hmenuOpen) setHmenu(false); else if (miniOpen) closeMini(); else if (resourceOpen) { ev.preventDefault(); closeResourceMenu(true); }
  if (typeof AP !== 'undefined' && AP.on) { AP.paused = true; apBar(); }
}, true);
/* مستمع الخلفية الواحد: النقر على غطاء النافذة السفلية غير المحروسة (الحاوية نفسها أو غطاء dsheet) */
if (WIN.on) document.addEventListener('click', ev => {
  const w = winTop(); if (!w || w.kind !== 'sheet' || w.guard || w.block === false) return; const el = winEl(w);
  if (ev.target === el && w.id !== 'dsheet' || ev.target.closest && ev.target.closest('[data-dscrim]') && w.id === 'dsheet') w.close();
});
/* مستمع السحب الواحد: السحب لأسفل 70px من أعلى المحتوى يغلق النافذة السفلية غير المحروسة */
if (WIN.on) (function () { let y0 = null, wi = null;
  document.addEventListener('touchstart', ev => { const w = winTop(); wi = null; y0 = null; if (!w || w.kind !== 'sheet' || w.guard || w.block === false) return; const el = winEl(w); if (el && ev.target.closest && el.contains(ev.target)) { y0 = ev.touches[0].clientY; wi = w; } }, { passive: true });
  document.addEventListener('touchend', ev => { if (y0 == null || !wi) return; const el = winEl(wi); const sc = el && el.scrollTop <= 0 && (!el.firstElementChild || el.firstElementChild.scrollTop <= 0); if (sc && ev.changedTouches[0].clientY - y0 > 70) wi.close(); y0 = null; wi = null; }, { passive: true }); })();
/* الفتح والإغلاق بلا رسم (حارس الخزنة، الاستعادة، الشاشات المحروسة تُخفي حاويتها فقط): نراقب hidden/open ونعيد المسح */
if (WIN.on) new MutationObserver(() => { try { winScan(); } catch (e) {} }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'open'] });
