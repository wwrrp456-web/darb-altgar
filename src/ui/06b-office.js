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
    if (low.length) out.push({ id: 'shopstock', ic: '🏪', w: 96, t: `مخزون دكاكينك ناقص في <b>${low.length}</b> سلع${low.some(x => x.zero) ? ' (بعضها نفد: يتوقف البيع وتستمر الأجور)' : ''}: ${esc(low.slice(0, 3).map(x => gname(x.g) + ' (' + cityName(x.city) + ')').join('، '))}`, b: ['عبّئ دكاكيني', 'ofrestock'] });
  } catch (e) {}
  { const la = S.lastAway; if (la && !S.awayReport && S.day - la.day <= 30) out.push({ id: 'lastaway', ic: '📒', w: 70, t: `آخر غياب (${dayAr(la.days)}): الرصيد ${fmt(Math.round(la.change))} ريال${(la.empty || []).length ? ' · ' + la.empty.length + ' سلع نفدت' : ''}`, b: ['تقرير الغياب', 'ofaway'] }); }
  watchOf().forEach((w, i) => { if (w.on && !w.seen) { const k = knownPrice(w.c, w.g); if (k) out.push({ id: 'watch' + i, ic: '📒', w: 88, t: `${gi(w.g)} <b>${GD[w.g].name}</b> في ${esc(cityName(w.c))}: ${f1(k.p)} (${w.dir === 'above' ? 'بلغ' : 'نزل إلى'} حدّك ${f1(w.th)}) · معلومة قبل ${dayAr(k.age)}`, b: ['راجع الصفقة', 'ofwatch', i] }); } });
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
  return `<section class="card office" aria-label="مكتب التاجر"><h2 style="margin-top:0">مكتب التاجر</h2>${cards.length ? cards.map(c => `<div class="row ofc" data-ofc="${c.id}" style="margin:6px 0"><span class="ic">${c.ic}</span><div style="flex:1;min-width:0">${c.t}</div><button class="sm pri" data-act="${c.b[1]}"${c.b[2] != null ? ` data-i="${c.b[2]}"` : ''}>${esc(c.b[0])}</button></div>`).join('') : '<div class="small muted">لا شيء يحتاج انتباهك الآن. اختر صفقة من «السوق».</div>'}${goalCard()}${favsHTML()}<details class="mdet" ${watchOf().length ? 'open' : ''}><summary><b>مراقبتي</b> <span class="small muted">(${watchOf().length}/${WATCH_MAX})</span></summary>${watchRows()}${watchForm()}</details></section>`;
}
