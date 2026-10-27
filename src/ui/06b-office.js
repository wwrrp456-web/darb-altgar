/* ---------- مكتب التاجر: ما يحتاج انتباهك الآن + قائمة المراقبة ----------
   بطاقات تُشتق من الحالة بدوال قراءة فقط (لا تشتري ولا تدفع ولا تحرّك وقتاً)، وكل زر يفتح موضع الإجراء ويترك القرار للاعب. */
const OFFICE_MAX = 5, WATCH_MAX = 3;
/* السعر المعلوم للاعب فقط: حيّ إن كانت قافلته أو دكانه هناك، وإلا آخر ما عرفه (بتاريخه). لا تُقرأ أسعار محجوبة. */
function knownPrice(cid, g) {
  const k = S.player.known && S.player.known[cid]; if (!S.cities[cid] || (!liveView(cid) && !k)) return null;
  const v = marketView(cid); return v && v.p[g] != null ? { p: v.p[g], age: v.age || 0 } : null;
}
const watchOf = () => S.watch || (S.watch = []);
const watchHit = w => { const k = knownPrice(w.c, w.g); return k ? (w.dir === 'above' ? k.p >= w.th : k.p <= w.th) : false; };
/* تقييم المراقبات: إشعار عند الانتقال من غير متحقق إلى متحقق فقط، فلا يتكرر مع كل رسم */
function officeTick() {
  try { fxNotice(); } catch (e) {}
  try { const L = S && S.learn; if (L && L.char && !sideAuto() && sidePending() && S.day - (L.sideRemind == null ? -99 : L.sideRemind) >= 3 && !learnNext()) { L.sideRemind = S.day; toast('🎓 دروس جانبية بانتظارك في المكتب'); } } catch (e) {}
  if (!S || !S.watch || !S.watch.length || !S.learn || !S.learn.char) return;
  S.watch.forEach(w => { const hit = watchHit(w); if (hit && !w.on) { w.on = true; w.seen = false; const k = knownPrice(w.c, w.g); toast('مراقبتك: ' + GD[w.g].name + ' في ' + cityName(w.c) + ' بلغ ' + f1(k.p)); } else if (!hit && w.on) { w.on = false; w.seen = false; } });
}
function officeCards(all) {
  const cr = main(), out = [], P = S.player;
  const items = GIDS.filter(g => Math.floor(cr.cargo[g] || 0) > 0).slice(0, 3).map(g => Math.floor(cr.cargo[g]) + ' ' + GD[g].name);
  if (cr.left > 0) out.push({ id: 'trip', ic: '🐪', w: 60, t: `قافلتك في الطريق إلى <b>${esc(cityName(cr.dest))}</b> · باقٍ ${dayAr(cr.left)}`, b: ['شاهد الرحلة', 'ofmap'] });
  else if (items.length) out.push({ id: 'cargo', ic: '🧺', w: 90, t: `قافلتك في <b>${esc(cityName(cr.city))}</b> وتحمل ${items.join('، ')}`, b: ['راجع البيع', 'ofcargo'] });
  try { const st = missionStep(); if (st && st.msg && !S.tut) out.push({ id: 'mission', ic: '🎯', w: 80, t: st.msg, b: ['افتح مهمتي', 'ofsalem'] }); } catch (e) {}
  try { const d = E.defectClaim(S); if (d) out.push({ id: 'defect', ic: '⚠️', w: 95, t: `بضاعة معيبة من ${esc(cityName(d.d.city))}: تبقى ${dayAr(Math.max(0, d.left))} للمطالبة`, b: [d.here ? 'اطلب الرد' : 'اذهب إلى ' + cityName(d.d.city), 'ofdefect'] }); } catch (e) {}
  { const Z = S.zakat; if (Z && Z.due && (!Z.defer || S.day >= Z.defer)) out.push({ id: 'zakat', ic: '🕌', w: 100, t: 'حال الحول: زكاة مستحقة تنتظر حسابك', b: ['احسب الزكاة', 'zopen'] }); }
  { const f = P.famDebt; if (f && f.left > 0 && f.due != null && f.due - S.day <= 7 && f.due - S.day >= -30) out.push({ id: 'debt', ic: '📒', w: 85, t: `قسط دَين الجد ${f.due - S.day >= 0 ? 'خلال ' + dayAr((f.due - S.day)) + '' : 'متأخر'}`, b: ['الدَّين والخطة', 'debt'] }); }
  try { // حال دكاكيني: سلع نفد مخزونها أو قاربت، وزر تعبئة فوري من المكتب
    const low = []; for (const city in P.props) { const pr = P.props[city]; for (const sh of pr.shops || []) for (const it of sh.items) { const have = pr.store[it.g] || 0; if (have < Math.max(1, it.target * 0.25)) low.push({ city, g: it.g, zero: have < 1 }); } }
    if (low.length) out.push({ id: 'shopstock', ic: '🏪', img: 'restock_crate', w: 96, t: `مخزون دكاكينك ناقص في <b>${low.length}</b> سلع${low.some(x => x.zero) ? ' (بعضها نفد: يتوقف البيع وتستمر الأجور)' : ''}: ${esc(low.slice(0, 3).map(x => gname(x.g) + ' (' + cityName(x.city) + ')').join('، '))}`, b: ['عبّئ دكاكيني', 'ofrestock'] });
  } catch (e) {}
  try { // مخزن ممتلئ: ينذر قبل أن يضيع الإنتاج أو يتوقف الشراء
    for (const city in P.props) { const cap = E.storeCap(S, city); if (cap > 0) { const ld = E.storeLoad(S, city); if (ld >= cap * 0.85) { out.push({ id: 'storefull:' + city, ic: '📦', w: 84, t: `مخزنك في <b>${esc(cityName(city))}</b> ${ld >= cap ? 'ممتلئ' : 'يقترب من الامتلاء'} (${Math.round(100 * ld / cap)}٪): بِع الراكد أو وسّع التخزين`, b: ['افتح العقارات', 'ofestate'] }); break; } } }
  } catch (e) {}
  { const la = S.lastAway; if (la && !S.awayReport && S.day - la.day <= 30) out.push({ id: 'lastaway', ic: '📒', img: 'away_report', w: S.day - la.day <= 2 ? 93 : 70, t: `${S.day - la.day <= 2 ? 'اكتمل حساب غيابك' : 'آخر غياب'} (${dayAr(la.days)}): الرصيد ${fmt(Math.round(la.change))} ريال${(la.empty || []).length ? ' · ' + la.empty.length + ' سلع نفدت' : ''}`, b: ['تقرير الغياب', 'ofaway'] }); }
  watchOf().forEach((w, i) => { if (w.on && !w.seen) { const k = knownPrice(w.c, w.g); if (k) out.push({ id: 'watch' + i, ic: '📒', w: 88, t: `${gi(w.g)} <b>${GD[w.g].name}</b> في ${esc(cityName(w.c))}: ${f1(k.p)} (${w.dir === 'above' ? 'بلغ' : 'نزل إلى'} حدّك ${f1(w.th)}) · معلومة قبل ${dayAr(k.age)}`, b: ['راجع الصفقة', 'ofwatch', i] }); } });
  try { if (zlPending() && !sideAuto()) out.push({ id: 'zlesson', ic: '🕌', w: 74, t: 'بلغ مالك <b>النصاب</b> فبدأ حولك: درس الزكاة جاهز في المعهد', b: ['افتح الدرس', 'zlopen'] }); } catch (e) {}
  try { const sp = sidePending(); if (sp && !sideAuto()) out.push({ id: 'sidelessons', ic: '🎓', w: 72, t: `عندك <b>${sp}</b> ${sp === 1 ? 'درس جانبي' : 'دروس جانبية'} من السوق: نفوذ وخبرة، افتحها متى شئت`, b: ['افتحها', 'sideopen'] }); } catch (e) {}
  try { // تنبيه السيولة: نقدك أقل من التزامات 7 أيام (أجور وإيجار وصيانة) فتتأخر الأجور وتتعثر الدكاكين
    const day = P.fixedEma || 0, liq = E.liquid(S);
    if (day >= 5 && liq < 7 * day) out.push({ id: 'cashlow', ic: '💰', img: 'cash_low', w: 97, t: `نقدك <b>${fmt(Math.round(liq))}</b> ريال لا يكفي التزامات <b>7</b> أيام (${fmt(Math.round(7 * day))}). اجمع نقداً قبل أن تتأخر الأجور.`, b: ['راجع التزاماتي', 'ofestate'] });
  } catch (e) {}
  try { // أصول فرص عمّ سالم: تشغّلها أو تبيعها (يدفع المشتري ذهباً أو فضة)
    for (const o of (P.oppAssets || []).filter(x => !x.kept).slice(0, 3)) {
      const nm = o.kind === 'shop' ? 'دكان' : o.kind === 'warehouse' ? 'مخزن' : 'حصة شراكة', metal = o.payIn === 'au' ? 'ذهب' : 'فضة', where = S.cities[o.city] ? cityName(o.city) : '';
      const val = o.kind === 'partnership' ? (o.stake || 0) * (1 - E.FIN.mud.fee) : (o.kind === 'shop' ? 1000 : 800) * (o.qty || 1) * 0.85, g = val / E.rateOf(S, o.payIn);
      out.push({ id: 'opp' + o.id, ic: '🤝', w: 88, t: `اغتنمتَ <b>${nm}</b> في ${esc(where)}: شغّله وانتفع منه، أو بِعه فيدفع لك المشتري <b>${metal}</b> (نحو ${fmt(Math.round(g * 100) / 100)} غرام).`, b: ['بِعه بال' + metal, 'oppsell', o.id], b2: ['أبقِه', 'oppkeep', o.id] });
    }
  } catch (e) {}
  try { // قرض الصديق: نتيجة السداد بصورة صاحبك، والقروض القائمة
    for (const f of ((S.learn && S.learn.fbq) || []).slice(0, 2)) out.push({ id: 'fb' + f.day, ic: '🤝', pic: pic('expressions/events/friend_' + (f.ok ? 'accepted' : 'reserved'), 'oic', 'صديقك'), w: 90, t: f.ok ? `ردّ صديقك قرضه: <b>${fmt(f.amt)}</b> ريال${f.amt > f.lent ? ' بزيادة شكر' : ''}. أُضيف إلى نفوذك وخبرتك.` : `ضاع قرض صديقك (<b>${fmt(f.lent)}</b> ريال). لا نفوذ لهذا القرض، والدرس أن تقرض من له ضمان وسمعة.`, b: ['حسناً', 'friendseen'] });
    for (const o of (P.loansOut || []).slice(0, 2)) out.push({ id: 'fl' + o.due, ic: '🤝', pic: pic('expressions/events/friend_thinking', 'oic', 'صديقك'), w: 40, t: `أقرضتَ صديقك <b>${fmt(o.amt)}</b> ريال، موعد السداد بعد <b>${Math.max(0, o.due - S.day)}</b> يوماً.` });
  } catch (e) {}
  try { // عقود الأصول المُبقاة: عائدها ومواعيده
    for (const o of (P.oppAssets || []).filter(x => x.kept).slice(0, 3)) {
      const t = E.oppTerms(S, o), where = S.cities[o.city] ? cityName(o.city) : '', ev = E.OPP_TERMS.every;
      const txt = t.type === 'rent' ? `مخزنك في ${esc(where)} مؤجَّر بعقد: يصلك <b>${fmt(t.per)}</b> ريال كل ${ev} يوماً (التالي بعد ${t.next} يوماً).`
        : t.type === 'mud' ? `شراكتك في ${esc(where)} (حصة ${fmt(Math.round(o.stake || 0))}): تُقبض أرباحها كل ${ev} يوماً، والمتوقع نحو <b>${fmt(t.per)}</b> ريال لكنه غير مضمون وقد يكون أقل أو صفراً (التالي بعد ${t.next} يوماً).`
        : `دكانك في ${esc(where)} يعمل: ${t.known ? `صافي إيراده نحو <b>${fmt(t.per)}</b> ريال كل ${ev} يوماً` : 'يكتمل تقدير صافي إيراده بعد أسبوع تشغيل'}، ويدخل نقدك مع مبيعاته اليومية.`;
      out.push({ id: 'oppk' + o.id, ic: '📜', w: 45, t: txt + (o.paid ? ` قبضتَ حتى الآن <b>${fmt(Math.round(o.paid))}</b>.` : ''), b: ['بِعه', 'oppsell', o.id] });
    }
  } catch (e) {}
  try { const mj = E.mjReady(S); if (mj && !S.learn.eq.length) out.push({ id: 'mjready', ic: '📜', w: 73, t: `مسألة جاهزة في <b>مجلس السوق</b>: «${esc(mj.title)}». افتحها متى شئت؛ فيها نفوذ وخبرة.`, b: ['افتح المسألة', 'mjnow'] }); } catch (e) {}
  try { const sp = seasonPrepCard(); if (sp) out.push(sp); } catch (e) {}
  out.sort((a, b) => b.w - a.w); return all ? out : out.slice(0, OFFICE_MAX);
}
function watchRows() {
  return watchOf().map((w, i) => { const k = knownPrice(w.c, w.g);
    return `<div class="kv"><span>${gi(w.g)} <b>${GD[w.g].name}</b> في ${esc(cityName(w.c))} ${w.dir === 'above' ? 'يبلغ' : 'ينزل إلى'} <b class="num">${f1(w.th)}</b></span><span class="small muted">${k ? 'آخر سعر معلوم ' + f1(k.p) + (k.age ? ' (قبل ' + dayAr(k.age) + ')' : '') : 'لا معلومة بعد'} <button class="sm" data-act="wdel" data-i="${i}" aria-label="احذف المراقبة">حذف</button></span></div>`; }).join('');
}
function watchForm() {
  if (watchOf().length >= WATCH_MAX) return `<div class="small muted">وصلت للحد (${WATCH_MAX} مراقبات). احذف واحدة لتضيف غيرها.</div>`;
  return `<details class="mdet"><summary>+ أضف مراقبة</summary><div class="row" style="margin:6px 0"><select id="wG" aria-label="السلعة">${GIDS.map(g => `<option value="${g}">${GD[g].name}</option>`).join('')}</select><select id="wC" aria-label="المدينة">${S.order.map(id => `<option value="${id}">${esc(cityName(id))}</option>`).join('')}</select><select id="wD" aria-label="الشرط"><option value="above">يبلغ أو يتجاوز</option><option value="below">ينزل إلى أو دون</option></select><input id="wT" type="number" inputmode="decimal" min="1" placeholder="السعر" aria-label="السعر بالريال للوحدة" style="width:90px"><button class="sm pri" data-act="wadd">أضف</button></div><div class="small muted">يُنبّهك داخل اللعبة حين يبلغ آخر سعر عرفتَه شرطك. التنبيه لا يشتري ولا يضمن ربحاً.</div></details>`;
}
function officeHTML() {
  if (!S.learn || !S.learn.char || NOLEARN) return '';
  const cards = officeCards();
  return `<section class="card office" aria-label="مكتب التاجر"><h2 style="margin-top:0">${ART['office/desk'] ? `<img class="oic" src="${ART['office/desk']}" alt="" width="34" height="34" style="vertical-align:middle;margin-inline-end:6px">` : ''}مكتب التاجر</h2>${cards.length ? cards.map(c => `<div class="row ofc" data-ofc="${c.id}" style="margin:6px 0"><span class="ic">${c.img && ART['office/' + c.img] ? `<img class="oic" src="${ART['office/' + c.img]}" alt="" width="40" height="40">` : c.pic || c.ic}</span><div style="flex:1;min-width:0">${c.t}</div>${c.b ? `<button class="sm pri" data-act="${c.b[1]}"${c.b[2] != null ? ` data-i="${c.b[2]}"` : ''}>${esc(c.b[0])}</button>` : ''}${c.b2 ? `<button class="sm" data-act="${c.b2[1]}"${c.b2[2] != null ? ` data-i="${c.b2[2]}"` : ''}>${esc(c.b2[0])}</button>` : ''}</div>`).join('') : '<div class="small muted">لا شيء يحتاج انتباهك الآن. اختر صفقة من «السوق».</div>'}${goalCard()}${favsHTML()}<details class="mdet" ${watchOf().length ? 'open' : ''}><summary><b>مراقبتي</b> <span class="small muted">(${watchOf().length}/${WATCH_MAX})</span></summary>${watchRows()}${watchForm()}</details></section>`;
}

/* شاشة «مكتب التاجر»: المرجع الأساسي لإدارة المشاريع والالتزامات المالية في مكان واحد */
function officeBadge() {
  try { if (!S || !S.learn || !S.learn.char || NOLEARN) return false; return (S.paymentDues || []).some(d => d.amount > 0) || officeCards(true).some(c => c.w >= 85); } catch (e) { return false; }
}
function officeHomeLink() {
  if (!S.learn || !S.learn.char || NOLEARN) return '';
  const n = officeCards(true).length, dues = (S.paymentDues || []).filter(d => d.amount > 0).length;
  return `<section class="card" aria-label="مكتب التاجر"><div class="row" style="margin:0"><span class="ic">${ART['office/desk'] ? `<img class="oic" src="${ART['office/desk']}" alt="" width="34" height="34">` : '📒'}</span><div style="flex:1"><b>مكتب التاجر</b><div class="small muted">${n ? n + ' بنود تحتاج انتباهك' : 'لا شيء يحتاج انتباهك'}${dues ? ' · ' + dues + ' مستحقات متأخرة' : ''}</div></div><button class="sm pri" data-go="office">افتح المكتب</button></div></section>`;
}
function screenOffice() {
  if (!S.learn || !S.learn.char || NOLEARN) return '<h2>مكتب التاجر</h2><p class="muted">يُفتح المكتب بعد اختيار شخصيتك.</p>';
  const dues = (S.paymentDues || []).filter(d => d.amount > 0), total = dues.reduce((n, d) => n + d.amount, 0), cash = S.player.gold;
  let h = officeHTML();
  h += `<section class="card office-dues" aria-label="المستحقات المتأخرة"><h3>المستحقات المتأخرة</h3>${dues.length ? `<p class="small">${dues.length} بنود بمجموع <b class="num">${fmt(Math.round(total))}</b> ريال، ونقدك <b class="num">${fmt(Math.round(cash))}</b>.</p><div class="row"><button class="sm pri" data-act="settleall" ${cash < 1 ? 'disabled' : ''}>سدّد كل ما أستطيع الآن</button></div>${paymentDuesHTML().replace('<details ', '<details open ')}` : '<p class="small muted">لا مستحقات متأخرة. ✓</p>'}</section>`;
  h += obligationsHTML();
  const cities = Object.keys(S.player.props).filter(c => { const q = E.regionalOfficeQuote(S, c); return q && q.ok; });
  if (cities.length) h += `<h3 style="margin-top:14px">سداد الأجور في مناطقك</h3><p class="small muted">لكل منطقة طريقة: تلقائي من رصيدك كل يوم، أو يدوي من هنا، أو عبر أمين المنطقة.</p>` + cities.map(c => officeCard(c)).join('');
  h += paymentHistoryHTML();
  return h;
}
