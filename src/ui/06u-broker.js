/* ---------- 030 السمسار التعليمي المولَّد: بطاقة «المطلوب» في المكتب والموجز، مجال brk «السماسرة» (العرض الحالي وسجل من تعاملتَ معهم) ----------
   مكوّنات 037/051 فقط (ask وdchip وdsheet وASK_SRC)؛ بلا <select> ولا <details> ولا طيّ ولا أيقونة جديدة. المفتاح BROKER.on؛ المطفأ = لا بطاقة ولا شارة ولا سطر.
   لا منطق هنا: كل رقم ونص من E.brokerView. ذاكرة عدم التكرار على الجهاز darb-broker-memory (خارج حفظ اللعبة). */
function brokerMemLoad() { try { const m = JSON.parse(localStorage.getItem('darb-broker-memory') || 'null'); if (m && Array.isArray(m.recent) && m.counts && typeof m.counts === 'object') E.brokerMemorySet(m); else E.brokerMemorySet(E.brokerMemoryNew()); } catch (e) { E.brokerMemorySet(E.brokerMemoryNew()); } }
function brokerMemSave() { if (!E.BROKER.memDirty) return; E.BROKER.memDirty = false; try { const m = E.brokerMemoryNow && E.brokerMemoryNow(); if (m) localStorage.setItem('darb-broker-memory', JSON.stringify(m)); } catch (e) {} }
brokerMemLoad();
const brkUiOn = () => { try { return !!(E.BROKER.on && DETAILS.on && S && S.learn && S.learn.char && S.brokers); } catch (e) { return false; } };
const brkSh = { n: 10 };
const brkSg = n => (n < 0 ? '−' : n > 0 ? '+' : '') + fmt(Math.abs(Math.round(n)));
function brkAskCards() {
  if (!brkUiOn()) return []; const v = E.brokerView(S); if (!v) return []; const out = [], o = v.offer;
  if (o) {
    const done = (opt, txt) => ({ ...opt, on: true, off: 'تمّ: ' + txt }), opts = [];
    const insp = { id: 'insp', icon: 'icons/scales', title: o.type === 'refer' ? 'زُر المورّد وعاين' : 'عاين البضاعة', effect: 'رسم ' + fmt(o.inspAmt) + (o.type === 'unseen' ? ' · النتيجة غداً' : ''), act: () => A.brokerInspect(S) };
    opts.push(o.inspDone ? done(insp, o.inspPending ? 'النتيجة غداً' : o.inspTxt) : !o.here ? { ...insp, off: o.hereMsg } : insp);
    const ak = { id: 'ask', icon: 'icons/book', title: 'اسأل عنه زعيم السوق', effect: E.BR_SH.SH05 + (o.askRepeat ? ' · يكلّفك ثقة 1' : ''), act: () => A.brokerAsk(S) };
    opts.push(o.askDone ? done(ak, o.askTxt) : !o.hasBoss ? { ...ak, off: 'لا زعيم لسوق هذه المدينة' } : ak);
    if (o.type !== 'refer') { const w = { id: 'warr', icon: 'icons/pact', title: 'اطلب مهلة ردّ مكتوبة', effect: 'إن قبل: تردّ ما خالف الوصف خلال 7 أيام وتسترد ثمنه', act: () => A.brokerWarranty(S) }; opts.push(o.warrDone ? done(w, o.warrTxt) : w); }
    opts.push({ id: 'acc', icon: 'ui-pay', title: 'اقبل', effect: 'تدفع ' + fmt(o.total) + (o.feeAmt ? ' منها أجرة ' + fmt(o.feeAmt) : ''), ...(o.offAcc ? { off: o.offAcc } : {}), act: () => A.brokerAccept(S) });
    opts.push({ id: 'no', icon: 'ui-decline', title: 'اعتذر', effect: 'لا تدفع شيئاً', act: () => A.brokerDecline(S) });
    out.push({ id: 'brk:' + o.id, icon: 'icons/cart', title: o.name + ' يعرض عليك ' + o.typeTxt, why: o.lines.join('\n'), state: 'open', prio: 2, keep: true, opts });
  }
  if (v.ret) {
    const r = v.ret;
    out.push({ id: 'brk:ret', icon: 'icons/pact', title: 'لك مهلة ردّ عند ' + r.name + ' · ' + dayAr(r.left), why: r.q + ' ' + r.g + ' · تسترد ' + fmt(r.refund) + ' ' + r.cur, prio: 1, state: 'open', opts: [
      { id: 'ret', icon: 'ui-sell', title: 'ردّ البضاعة واسترد ثمنها', ...(r.here ? {} : { off: 'ارجع إلى ' + r.city + ' أولاً' }), act: () => A.brokerReturn(S) },
      { id: 'keep', icon: 'ui-postpone', title: 'أبقِها عندي', effect: 'تنتهي المهلة الآن', act: () => A.brokerKeep(S) }] });
  }
  return out;
}
function brkLedgerHTML() {
  if (!brkUiOn()) return ''; const v = E.brokerView(S); if (!v || !v.ledger.length) return '';
  const rows = v.ledger.slice(0, brkSh.n).map(e => `<div class="kv" data-brk-row><span>${esc(e.name)}<small class="muted"> · عروض ${fmt(e.seen)} · قبلتَ ${fmt(e.acc)}${e.rev ? ' · صدق في ' + fmt(e.hon) + ' من ' + fmt(e.rev) : ''}</small></span><b class="num ${e.net < 0 ? 'dear' : e.net > 0 ? 'cheap' : ''}">${brkSg(e.net)}</b></div>`).join('');
  const more = v.ledger.length > brkSh.n ? `<button type="button" class="dchip" data-act="brkmore" style="min-height:44px"><span class="dnm">المزيد (${v.ledger.length - brkSh.n})</span></button>` : '';
  return `<div class="brk-ledger" data-brk-ledger><div class="small" data-brk-tot>عروض ${fmt(v.tot.offers)} · قبلتَ ${fmt(v.tot.acc)} · صافيك <b class="num ${v.tot.net < 0 ? 'dear' : 'cheap'}">${brkSg(v.tot.net)}</b> ريال</div>${rows}${more}</div>`;
}
dDomains.brk = { icon: 'icons/ledger', name: 'السماسرة', gen: brkAskCards, extra: brkLedgerHTML, sub: 'العرض الحالي ومن تعاملتَ معهم', noEmpty: true };
const brkChip = () => brkUiOn() && E.brokerChipOn(S) ? dchip({ id: 'brk', icon: 'icons/ledger', name: 'السماسرة', count: (S.brokers.offer ? 1 : 0) + (S.brokers.ret && S.brokers.ret.bad ? 1 : 0) }) : '';
function brkHsRow() {
  if (!brkUiOn()) return ''; const v = E.brokerView(S); if (!v || !(v.offer || v.ret)) return '';
  return hsRow('brk', 'icons/ledger', '<b>السماسرة</b><small>' + (v.offer ? 'عرض من ' + esc(v.offer.name) + ' · ' + (v.offer.left > 0 ? dayAr(v.offer.left) : 'آخر يوم') : 'مهلة ردّ عند ' + esc(v.ret.name) + ' · ' + dayAr(v.ret.left)) + '</small>');
}
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-act="brkmore"]'); if (!t) return;
  ev.stopImmediatePropagation(); brkSh.n += 10; dsh.keep = true; dRender();
}, true);
ASK_SRC.brk = brkAskCards; // 051
