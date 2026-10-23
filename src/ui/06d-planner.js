/* ---------- الدفعة الرابعة: مقارنة وجهتين، مقارنة ترقيات القافلة، دفتر الطرق المفضلة، مسيرتي بالتواريخ ----------
   كلها عروض قراءة من الحالة ودوال الاقتباس الحالية؛ لا تنفّذ شراءً ولا بيعاً ولا ترقية، ولا تكشف سعراً لم تعرفه. */
let cmpSel = { a: null, b: null };
/* مقارنة وجهتين لسلعة وكمية من تقدير sellOptions نفسه (سعر آخر معلوم بعمره، جمارك، نفقة طريق، خطر) */
function comparePlannerHTML(opts, n, payNow, gd) {
  if (!opts || opts.length < 2) return '';
  const byId = id => opts.find(o => o.city === id);
  const A = byId(cmpSel.a) || opts[0], B = byId(cmpSel.b) && byId(cmpSel.b) !== A ? byId(cmpSel.b) : opts.find(o => o !== A);
  const sel = (key, cur) => `<select data-cmp="${key}" aria-label="${key === 'a' ? 'الوجهة الأولى' : 'الوجهة الثانية'}">${opts.map(o => `<option value="${o.city}" ${o.city === cur.city ? 'selected' : ''}>${esc(cityName(o.city))}</option>`).join('')}</select>`;
  const row = (k, f) => `<div class="cmprow"><span class="muted small">${k}</span><b class="num">${f(A)}</b><b class="num">${f(B)}</b></div>`;
  return `<div class="card cmpcard" style="margin-top:12px"><b>قارن وجهتين لـ ${fmt(n)} وحدة</b><div class="small muted">تدفع الآن ≈ <b class="num">${fmt(Math.round(payNow))}</b> ريال. الأرقام تقدير من آخر أسعار عرفتها، وقد تتغير قبل وصولك؛ لا وعد بالربح.</div>`
    + `<div class="cmprow hd"><span></span>${sel('a', A)}${sel('b', B)}</div>`
    + row('عمر معلومة السعر', o => o.live || !o.age ? 'اليوم' : 'قبل ' + dayAr(o.age) + '')
    + row('سعر الوحدة', o => f1(o.price))
    + row('أيام الطريق', o => o.days)
    + row('خطر الطريق', o => Math.round(o.risk * 100) + '٪')
    + row('الجمارك', o => fmt(Math.round(o.customs)))
    + row('نفقة الطريق', o => fmt(Math.round(o.prov)))
    + row('صافي البيع المقدّر', o => fmt(Math.round(o.net)))
    + row('الربح التقديري', o => `<span class="${plCls(o.profit)}">${sgn(Math.round(o.profit))}</span>`)
    + `</div>`;
}
/* قبل/بعد لعربة وحارس لقافلتك: السعة وقوة الدفاع من المحرك، والثمن مرة واحدة، والأجر المتكرر. لا نسب نجاة مخترعة. */
function upgradeCompareHTML(cr) {
  try {
    const cartAfter = Object.assign({}, cr, { carts: (cr.carts || 0) + 1 }), guardAfter = Object.assign({}, cr, { guards: (cr.guards || 0) + 1 });
    const w = E.staffWage(S, 'guard'), cap0 = E.capOfCar(cr), def0 = E.defenseOf(cr);
    const col = (title, once, capT, defT, wageT) => `<div class="card" style="margin:0"><b>${title}</b><div class="kv small"><span>الثمن مرة واحدة</span><b class="num">${once}</b></div><div class="kv small"><span>السعة</span><b class="num">${capT}</b></div><div class="kv small"><span>قوة الدفاع</span><b class="num">${defT}</b></div><div class="kv small"><span>الأجر</span><b class="num">${wageT}</b></div></div>`;
    return `<div class="card" style="margin-top:12px"><b>قارن قبل أن تشتري: عربة أم حارس؟</b><div class="small muted">الحارس لا يضمن السلامة، والعربة لا تفيد قافلة قليلة المال؛ اختر بحسب حاجتك. لا يُنفَّذ شراء من هذه المقارنة.</div><div class="grid g2" style="margin-top:8px">${col('🛒 عربة', '600', fmt(cap0) + ' ← ' + fmt(E.capOfCar(cartAfter)), fmt(Math.round(def0)) + ' ← ' + fmt(Math.round(E.defenseOf(cartAfter))), 'لا أجر')}${col('🛡️ حارس', fmt(w.once || 300), fmt(cap0) + ' ← ' + fmt(cap0), fmt(Math.round(def0)) + ' ← ' + fmt(Math.round(E.defenseOf(guardAfter))), fmt(w.day) + ' يومياً أثناء السفر')}</div></div>`;
  } catch (e) { return ''; }
}
/* دفتر الطرق المفضلة: حتى خمسة طرق بملاحظة قصيرة؛ فتحها يعرض ظروف اليوم للمراجعة ولا يشتري ولا ينقل القافلة */
const FAV_MAX = 5, favsOf = () => S.favs || (S.favs = []);
function favCheck(f) {
  if (!S.cities[f.from] || !S.cities[f.to]) return 'مدينة لم تعد موجودة في هذه اللعبة';
  const m = main(); if (m.left > 0) return 'قافلتك في الطريق الآن';
  if (m.city !== f.from) return 'قافلتك في ' + cityName(m.city) + '، وبداية الطريق ' + cityName(f.from) + ' (لا ننقلها تلقائياً)';
  const tb = E.travelBlock(S, m, f.to); return tb || '';
}
function favsHTML() {
  const list = favsOf();
  const rows = list.map((f, i) => { const why = favCheck(f), ok = S.cities[f.from] && S.cities[f.to];
    return `<div class="row fav" style="margin:5px 0"><div style="flex:1;min-width:0"><b>${ok ? esc(cityName(f.from)) + ' ← ' + esc(cityName(f.to)) : 'طريق غير صالح'}</b>${f.g && GD[f.g] ? ' · ' + gi(f.g) + ' ' + GD[f.g].name : ''}${f.note ? `<div class="small muted">${esc(f.note)}</div>` : ''}${why ? `<div class="small dear">${esc(why)}</div>` : ''}</div>${ok ? `<button class="sm" data-act="favopen" data-i="${i}">راجع</button>` : ''}<button class="sm" data-act="favdel" data-i="${i}" aria-label="احذف الطريق">حذف</button></div>`; }).join('');
  const form = list.length >= FAV_MAX ? `<div class="small muted">وصلت للحد (${FAV_MAX} طرق). احذف واحداً لتضيف غيره.</div>` : `<details class="mdet"><summary>+ أضف طريقاً</summary><div class="row" style="margin:6px 0"><select id="fF" aria-label="من">${S.order.map(id => `<option value="${id}" ${id === main().city ? 'selected' : ''}>${esc(cityName(id))}</option>`).join('')}</select><select id="fT" aria-label="إلى">${S.order.map(id => `<option value="${id}">${esc(cityName(id))}</option>`).join('')}</select><select id="fG" aria-label="السلعة (اختيارية)"><option value="">بلا سلعة</option>${GIDS.map(g => `<option value="${g}">${GD[g].name}</option>`).join('')}</select><input id="fN" type="text" maxlength="60" placeholder="ملاحظة (اختيارية)" aria-label="ملاحظة" style="min-width:140px"><button class="sm pri" data-act="favadd">أضف</button></div><div class="small muted">يحفظ الطريق فقط؛ عند فتحه تُراجَع أسعار اليوم، ولا يُكرَّر شراء الأمس.</div></details>`;
  return `<details class="mdet" ${list.length ? 'open' : ''}><summary><b>طرقي المفضلة</b> <span class="small muted">(${list.length}/${FAV_MAX})</span></summary>${rows}${form}</details>`;
}
/* مسيرتي: الإنجازات المسجّلة بيومها الفعلي فقط، بتاريخ تقويم اللعبة (لا اختلاق لتواريخ قديمة) */
function timelineHTML() {
  const X = S.ach; if (!X || !X.got) return '';
  const rows = Object.keys(X.got).map(id => ({ id, day: X.got[id], d: E.ACHD.LIST.find(a => a.id === id) })).filter(r => r.d && r.day != null).sort((a, b) => b.day - a.day).slice(0, 30);
  if (!rows.length) return '';
  let year = '', h = '';
  rows.forEach(r => { const dt = E.dateOf(S, r.day); if (dt.yname !== year) { year = dt.yname; h += `<div class="small muted" style="margin-top:8px"><b>${esc(year)}</b></div>`; } h += `<div class="kv small"><span>${r.d.hid ? '(مخفي) ' : ''}${esc(r.d.name)}</span><span class="muted">${esc(dt.hs)}</span></div>`; });
  return `<details class="mdet" data-dk="timeline"><summary><b>مسيرتي بالتواريخ</b> <span class="small muted">(${rows.length})</span></summary>${h}</details>`;
}

/* زر «احفظ هذا الطريق» من لوحة المدينة في الخريطة: يحفظ البداية والوجهة فقط (بلا سلعة ولا ملاحظة) ويمكن إلغاؤه */
const favIdx = (a, b) => favsOf().findIndex(f => f.from === a && f.to === b);
function favHereHTML(from, to) {
  const i = favIdx(from, to);
  return `<div class="row" style="margin:6px 0 0">${i >= 0 ? `<button class="sm" data-act="favtoggle" data-from="${from}" data-to="${to}" aria-pressed="true">✓ محفوظ في طرقي (إلغاء)</button>` : favsOf().length >= FAV_MAX ? '<span class="small muted">طرقك المفضلة ممتلئة (خمسة)</span>' : `<button class="sm" data-act="favtoggle" data-from="${from}" data-to="${to}" aria-pressed="false">+ احفظ هذا الطريق</button>`}</div>`;
}

/* «مسار»: اختر وجهتك فترى السلع المتاحة من مدينتك مرتبة بسهم يلخّص سعرها في الوجهة (بعد الضريبة والجمارك)، ثم تفتح السلعة لترى ربحها. أداة بحث لا قرار جاهز: لا أرقام ولا ربح هنا */
let routeTo = null;
function routeHTML(cr) {
  const L = S.learn; if (L && L.char && L.level < 4) return '';
  const here = cr.city, hc = S.cities[here], hv = marketView(here);
  const dests = S.order.filter(d => d !== here && !E.travelBlock(S, cr, d));
  if (!dests.length) return '';
  if (!routeTo || !dests.includes(routeTo)) routeTo = null;
  const opts = `<option value="">اختر وجهتك…</option>` + dests.map(d => `<option value="${d}" ${d === routeTo ? 'selected' : ''}>${esc(cityName(d))} · ${dayAr(E.tripDays(S, cr, here, d))}</option>`).join('');
  let body = '<div class="small muted" style="margin-top:6px">اختر المدينة التي تريد الذهاب إليها لترى السلع المناسبة للطريق.</div>';
  if (routeTo) {
    const dc = S.cities[routeTo], dv = marketView(routeTo), cus = dc.country === hc.country ? 0 : CD[dc.country].customs;
    const rows = GIDS.filter(g => E.sells(hc, g) && !GD[g].sp && hv.st[g] >= 1 && dv.p[g] != null).map(g => {
      const cost = hv.p[g] * 1.02, rel = cost > 0 ? (dv.p[g] * (1 - dc.tax - cus) - cost) / cost : 0;
      return { g, rel, a: rel >= 0.08 ? ['▲', 'أغلى هناك', 'cheap'] : rel > -0.03 ? ['▬', 'متقارب', ''] : ['▼', 'أرخص هناك', 'dear'] };
    }).sort((x, y) => y.rel - x.rel);
    body = `<div class="small muted" style="margin:6px 0">${rows.length} سلعة تُشترى من ${cityTag(here)} · السهم يقارن سعرها في ${cityTag(routeTo)} بعد الضريبة والجمارك${dv.age ? ' (أسعارها قبل ' + dayAr(dv.age) + ')' : ''}. اضغط سلعة لترى ربحها.</div>`
      + `<div class="rgrid">${rows.map(r => `<button class="rchip" data-gd="${r.g}" data-rt="${routeTo}" aria-label="${GD[r.g].name}: ${r.a[1]}"><span class="ri">${gi(r.g)}</span><span class="rn">${GD[r.g].name}</span><span class="ra ${r.a[2]}">${r.a[0]} ${r.a[1]}</span></button>`).join('')}</div>`;
  }
  return `<div class="card route" style="margin-bottom:12px"><div class="row" style="margin:0"><b>🧭 مسار: إلى أين؟</b><span class="spacer"></span><select id="routeTo" class="msel" aria-label="الوجهة">${opts}</select></div>${body}</div>`;
}
