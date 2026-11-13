/* 040د شراكات المنافسين عند حكم السوق: نافذة العرض (زر «اعرض شراكة» في بطاقة المنافسين)، عروضهم الواردة بطاقات «المطلوب»، وتقرير العقود (سطر «حال أعمالي»)؛ فوق dsheet وask والأزرار الموجودة فقط.
   نقطة الوصول: الرئيسية ← سطر «شراكات المنافسين» في «حال أعمالي» (نقرة) ← التقرير؛ والعرض الوارد بطاقة «المطلوب» تصل دون بحث. كل الأرقام من E.rvpView/E.rvpTerms؛ الأفعال A.rvp* فقط.
   قاعدة ظهور الاختيار: كل خيار on + aria-pressed="true" مع سطر ملخّص بالرقم، والنافذة تُعاد رسمها بعد كل ضغطة. E.RIVP.on=false ⇒ لا زر ولا سطر. */
const rvpUi = { rid: null, kind: 'rmud', ci: 1, days: 30, share: 0.6, recipe: null, f: 0.35, res: '' };
const rvpUiOn = () => { try { return !!(E.rvpOn(S) && DETAILS.on && dLive()); } catch (e) { return false; } };
const rvpSg = n => (n < 0 ? '−' : '+') + fmt(Math.abs(Math.round(n)));
const rvpRecipeName = r => (r && E.RECIPES[r] ? E.RECIPES[r].name : '');
// زر «اعرض شراكة» داخل بطاقة المنافس (يظهر في مدينة تحكمها فقط) بسبب التعطيل ظاهراً
function rvpOfferBtn(r) {
  if (!rvpUiOn() || !r.cid) return ''; const bs = E.bossOf(S, r.cid); if (!bs || bs.ruler !== 'player') return ''; const rv = E.rvpGet(S, r.id); if (!rv) return '';
  const a1 = E.rvpBlock(S, rv, 'rmud', null), a2 = E.rvpBlock(S, rv, 'rpart', null), why = a1 && a2 ? a1 : '';
  return `<div class="row" data-rvp-btn="${r.id}"><button type="button" class="sm pri" data-act="rvpopen" data-rid="${r.id}"${why ? ' disabled aria-disabled="true"' : ''} style="min-height:44px">اعرض شراكة</button></div>${why ? `<div class="small muted" data-rvp-why>${esc(why)}</div>` : ''}`;
}
function rvpDraft(rv) { // الخيارات الصالحة الآن للتاجر ومحاذاة المسودة معها
  const caps = E.rvpCapOptions(S, rv), recs = E.partRecipes(S, rv.city).filter(x => E.rvpShareFits(S, rv, E.partCost(S, rv.city, x)).length), d = rvpUi;
  const kinds = [caps.length ? 'rmud' : null, recs.length ? 'rpart' : null].filter(Boolean); if (!kinds.includes(d.kind)) d.kind = kinds[0] || 'rmud';
  if (!(d.ci >= 0 && d.ci < caps.length)) d.ci = Math.min(1, Math.max(0, caps.length - 1)); if (!E.INFLU.mud.days.includes(d.days)) d.days = E.INFLU.mud.days[0]; if (!E.INFLU.mud.shares.includes(d.share)) d.share = E.INFLU.mud.shares[1];
  if (!recs.includes(d.recipe)) d.recipe = recs[0] || null; const fits = d.recipe ? E.rvpShareFits(S, rv, E.partCost(S, rv.city, d.recipe)) : []; if (!fits.includes(d.f)) d.f = fits[Math.min(1, fits.length - 1)] || E.INFLU.part.shares[1];
  const o = d.kind === 'rmud' ? { cap: caps[d.ci], days: d.days, share: d.share } : { recipe: d.recipe, f: d.f }; return { caps, recs, fits, kinds, o };
}
const rvpOpt = (act, k, v, title, effect, on, off) => `<button type="button" class="dopt${on ? ' on' : ''}"${on ? ' aria-pressed="true"' : ' aria-pressed="false"'} data-act="${act}" data-k="${k}" data-v="${esc(String(v))}"${off ? ' disabled aria-disabled="true"' : ''} style="min-height:44px">${dIc('ui-pay')}<span class="dot">${esc(title)}</span><span class="dos">${esc(off || effect || '')}</span></button>`;
const rvpGrp = html => `<div class="rvp-grp" style="display:grid;gap:6px;margin:4px 0">${html}</div>`;
function rvpOfferBody() {
  const rv = E.rvpGet(S, rvpUi.rid); if (!rv || rv.out != null) return '<p class="small muted">لم يعد هذا التاجر في السوق.</p>';
  const dr = rvpDraft(rv), d = rvpUi, K = E.AGR_KINDS[d.kind], T = E.rvpTerms(S, rv, d.kind, dr.o), W = E.rgWView(S, rv), T0 = E.rvpT(S, rv);
  const kinds = rvpGrp(['rmud', 'rpart'].map(k => rvpOpt('rvpset', 'kind', k, E.AGR_KINDS[k].name, k === 'rmud' ? 'مالك يعمل في تجارته، وربحك يتبع حركة ثروته' : 'مصنع تبنيه ويدفع جزءاً من كلفته نقداً', d.kind === k, dr.kinds.includes(k) ? '' : E.rvpBlock(S, rv, k, null) || 'غير متاح')).join(''));
  let form;
  if (d.kind === 'rmud') form = `<div class="small muted">رأس المال:</div>${rvpGrp(dr.caps.map((c, i) => rvpOpt('rvpset', 'ci', i, fmt(c) + ' ريال', 'سقفه ' + fmt(E.rvpCapMax(S, rv)), d.ci === i)).join(''))}<div class="small muted">المدة:</div>${rvpGrp(E.INFLU.mud.days.map(x => rvpOpt('rvpset', 'days', x, dayAr(x), '', d.days === x)).join(''))}<div class="small muted">نسبة ربحك:</div>${rvpGrp(E.INFLU.mud.shares.map(x => rvpOpt('rvpset', 'share', x, Math.round(x * 100) + '٪', 'له ' + Math.round((1 - x) * 100) + '٪', d.share === x)).join(''))}`;
  else form = `<div class="small muted">المصنع:</div>${rvpGrp(dr.recs.slice(0, 8).map(x => rvpOpt('rvpset', 'recipe', x, rvpRecipeName(x), 'الكلفة ' + fmt(E.partCost(S, rv.city, x)) + ' ريال', d.recipe === x)).join(''))}<div class="small muted">حصة المنافس النقدية:</div>${rvpGrp(E.INFLU.part.shares.map(x => rvpOpt('rvpset', 'f', x, Math.round(x * 100) + '٪', '', d.f === x, dr.fits.includes(x) ? '' : 'ثروته لا تتسع لها')).join(''))}`;
  const sendOff = T.why || (d.kind === 'rmud' ? !dr.o.cap : !dr.o.recipe) && 'أكمل شروط العرض';
  return `<div class="rvp-offer" data-rvp-offer="${rv.id}">${roleHead('characters/rival-generic-goods', rv.name, `<h4 class="dsec" style="margin:0">عرض شراكة على ${esc(rv.name)}</h4>`)}<div class="small muted">${esc(E.RIVP_TXT.other(rv.name))} · ثروته ${esc(rvMoney(W))} · ثقته بك ${Math.round(T0)} من 100</div>
    <div class="small muted">النوع:</div>${kinds}${form}
    <p class="small" data-rvp-sum><b>${esc(T.sum)}</b></p><div class="kv"><span>احتمال قبوله</span><b data-rvp-chance>${esc(T.chance)}</b></div>
    <div class="small"><b>${esc(K.name)}:</b> ${esc(K.desc)}</div><div class="small">${esc(K.obl)}</div><div class="small muted" data-rvp-zakat>${esc(E.INFLU_TXT.zakat)}</div>
    <button type="button" class="sm pri" data-act="rvpsend" style="width:100%;min-height:44px;margin-top:8px"${sendOff ? ' disabled aria-disabled="true"' : ''}>أرسل العرض</button>${sendOff ? `<div class="small dear" data-rvp-block>${esc(sendOff)}</div>` : ''}${rvpUi.res ? `<div class="dres" data-rvp-res>${esc(rvpUi.res)}</div>` : ''}</div>`;
}
// العروض الواردة: بطاقة «المطلوب» لكل عرض؛ القبول مضمون بعد إعادة الفحص
function rvpAskCards() {
  if (!rvpUiOn()) return []; const v = E.rvpView(S), out = [];
  for (const o of v.off) {
    const rv = E.rvpGet(S, o.rid); if (!rv) continue; const t = o.terms, T = E.rvpTerms(S, rv, o.kind, o.kind === 'rmud' ? t : { recipe: t.recipe, f: t.f }), blk = E.rvpBlock(S, rv, o.kind, o.kind === 'rmud' ? t : { recipe: t.recipe, f: t.f }, { off: o.id, incoming: true });
    out.push({ id: 'rvp:off:' + o.id, icon: 'ui-pay', title: rv.name + ' يعرض عليك ' + E.AGR_KINDS[o.kind].name, why: T.sum + (o.kind === 'rpart' ? ' · ' + rvpRecipeName(t.recipe) : '') + ' · ينتهي بعد ' + dayAr(Math.max(0, o.days)), state: 'open', prio: 2, mark: true, opts: [
      blk ? { id: 'ok', icon: 'ui-pay', title: 'اقبل العرض', off: blk } : { id: 'ok', icon: 'ui-pay', title: 'اقبل العرض', effect: T.sum + ' · القبول مضمون · يخفّ ضغطه على الأسعار ويزيد صندوق السوق', best: true, act: () => A.rvpAccept(S, o.id) },
      { id: 'no', icon: 'ui-postpone', title: 'ارفضه', effect: 'يزول العرض بلا كلفة', act: () => A.rvpDecline(S, o.id) }] });
  }
  return out;
}
function rvpReportBody() {
  const v = E.rvpView(S), log = (S.player.agrLog || []).filter(x => x.k === 'rmud' || x.k === 'rpart').slice(-4).reverse();
  const items = v.list.length ? v.list.map(x => {
    const mud = x.kind === 'rmud', m = x.months.slice(-4).map(p => (p < 0 ? '−' : '+') + Math.abs(p) + '٪').join('، ');
    return `<div class="card rvp-c" data-rvp-c="${x.id}"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><b class="small">${esc(x.name)} · ${esc(x.rname)}</b><span class="pill${x.orphan ? '' : ' good'}">${x.orphan ? 'يتيمة' : 'قائمة'}</span></div>
      <div class="kv"><span>ثروته الآن</span><b class="num">${x.wealth == null ? '—' : fmt(x.wealth)}</b></div><div class="kv"><span>ما دفعتَه</span><b class="num">${fmt(x.paid)}</b></div>
      <div class="kv"><span>${mud ? 'قيمة مالك الآن' : 'قيمة حصتك الآن'}</span><b class="num">${fmt(x.val)}</b></div><div class="kv"><span>${mud ? 'القيد المتراكم' : 'ربح المصنع المتراكم'}</span><b class="num ${x.pnl < 0 ? 'dear' : 'cheap'}">${rvpSg(x.pnl)}</b></div>
      ${mud && m ? `<div class="small muted">نسب آخر الشهور: ${esc(m)}</div>` : ''}<div class="kv"><span>المتبقي</span><b>${dayAr(Math.max(0, x.left))} من ${dayAr(x.total)}</b></div>${bar(Math.max(0, x.total - x.left), x.total, 'gold')}
      ${x.orphan ? `<div class="small muted">${esc(x.orphanWhy)}</div>` : `<div class="small" data-rvp-effect>ضغطه على الأسعار أخفّ ${x.relief}٪ وصندوق السوق يزيد ${fmt(x.fundDay)} ريالاً يومياً</div>`}
      ${mud ? `<button type="button" class="sm" data-act="rvpwd" data-id="${x.id}" style="min-height:44px;margin-top:6px">اسحب مالك (تستردّ ${fmt(x.back)} ريال الآن)</button>` : '<div class="small muted">شراكة المصنع لا تُفسخ قبل أجلها</div>'}</div>`;
  }).join('') : '<p class="small muted">لا عقود مع منافسين الآن. اضغط «اعرض شراكة» في بطاقة منافس في سوق تحكمه.</p>';
  const hist = log.length ? log.map(e => `<div class="kv small"><span>${esc(E.dateOf(S, e.d).hs)} · ${esc(E.AGR_KINDS[e.k].name)} · ${esc(S.cities[e.c] ? S.cities[e.c].name : '')}</span><span class="num ${e.n < 0 ? 'dear' : 'cheap'}">${rvpSg(e.n)}</span></div>`).join('') : '<div class="small muted">لم ينتهِ عقد بعد.</div>';
  return `<div class="rvp-report"><div class="kv"><span>صافي هذا الشهر</span><b class="num ${v.net < 0 ? 'dear' : 'cheap'}" data-rvp-net>${rvpSg(v.net)}</b></div><div class="small muted">الربح والخسارة يتبعان حركة ثروة المنافس الفعلية، ولا ضمان لربح ولا لرأس المال.</div><h4 class="dsec">عقودك</h4>${items}<h4 class="dsec">آخر الحصائل</h4>${hist}</div>`;
}
function rvpHomeRow() {
  if (!rvpUiOn()) return ''; const v = E.rvpView(S); if (!v.n && !v.off.length) return '';
  return hsRow('hs:rvp', 'ui-pay', `<b>شراكات المنافسين</b><small>${v.n} ${v.n === 1 ? 'عقد' : 'عقود'} · صافي هذا الشهر <b class="num ${v.net < 0 ? 'dear' : 'cheap'}">${rvpSg(v.net)}</b> ريال · ${v.off.length} ${v.off.length === 1 ? 'عرض ينتظرك' : 'عروض تنتظرك'}</small>`, v.off.length > 0);
}
dDomains['hs:rvp'] = { icon: 'ui-pay', name: 'شراكات المنافسين', gen: rvpAskCards, extra: rvpReportBody, sub: 'عروضهم الواردة، ثم عقودك بأرقامها' };
function rvpOpenOffer(rid) {
  rvpUi.rid = +rid; rvpUi.res = ''; const rv = E.rvpGet(S, rvpUi.rid); if (!rv) return; dsh.folds['rvp-offer'] = { sum: `<b>شراكة مع ${esc(rv.name)}</b>`, body: rvpOfferBody, def: false };
  if (dsh.domain === 'fold:rvp-offer') dClose(); dOpen('fold:rvp-offer');
}
function rvpAct(d) { // يُستدعى من 16-events: كل ضغط يُعاد معه رسم النافذة
  let r = null;
  if (d.act === 'rvpopen') return rvpOpenOffer(d.rid);
  if (d.act === 'rvpset') { const k = d.k, v = d.v; if (k === 'kind') rvpUi.kind = v; else if (k === 'recipe') rvpUi.recipe = v; else rvpUi[k] = +v; rvpUi.res = ''; }
  else if (d.act === 'rvpsend') { const rv = E.rvpGet(S, rvpUi.rid); if (rv) { const dr = rvpDraft(rv); r = A.rvpOffer(S, rv.id, rvpUi.kind, dr.o); rvpUi.res = r && r.msg || ''; } }
  else if (d.act === 'rvpwd') r = A.rvpWithdraw(S, +d.id);
  if (r) { act(r); if (r.ok) { try { persist(); } catch (e) {} } if (d.act === 'rvpsend' && r.accepted) { dsh.keep = false; dClose(); return; } } dsh.keep = true; dRender();
}
