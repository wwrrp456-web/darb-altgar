/* واجهة البداية الاختيارية: الأرقام والمعاينة والتنفيذ من المحرك فقط. */
function tradeRestartButton(){return '<button class="sm" data-act="asset-restart-open">صفِّ أصولي وابدأ من جديد</button>';}
function tradeRestartCard(){
 return `<section class="card trade-restart-card"><h3>تصفية وبداية جديدة</h3><p>عاين بيع أصول المدن والأسطول الإضافي لتبدأ برصيدك المتبقي وقافلتك الرئيسية، مع حفظ شخصيتك وتعليمك وإنجازاتك.</p>${tradeRestartButton()}</section>`;
}
function tradeRestartBody(q,v,money,row){
 const kept=q.retained,car=S.player.caravans.find(c=>c.id===kept.carId),goods=[...(q.goods||[]).map(g=>`${cityName(g.city)} · ${GD[g.g].name}: ${money(g.q)} وحدة`),...(q.livestock||[]).map(g=>`${cityName(g.city)} · ${GD[g.g].name}: ${money(g.q)} ${g.age==='young'?'من الصغار':'من الكبار'}`)];
 let h=mentorSay(ASSET_SALE_TEXTS.restart,'teach')+'<p class="qnote">المعاينة لا تبيع شيئاً. يشمل التنفيذ أصول كل المدن وإيجاراتها، وبضاعة ومواشي القوافل، والقوافل الإضافية والسفن، وسحب المضاربات. تبقى القافلة الرئيسية في مكانها.</p>';
 if(q.items.length)h+=`<table class="restart-assets"><caption>ما ستتم تصفيته (${q.items.length})</caption><thead><tr><th scope="col">الأصل</th><th scope="col">المدينة</th><th scope="col">السعر الصافي (ريال)</th></tr></thead><tbody>${q.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(cityName(i.city))}</td><td class="num">${money(i.price)}</td></tr>`).join('')}</tbody></table>`;
 else h+='<p>لا مبانٍ أو أسطول إضافي للبيع؛ راجع البضاعة والمستحقات وأثر إعادة الطور أدناه.</p>';
 h+=`<p class="small muted">معامل بيع المباني والعربات الإضافية ${Math.round(q.factor*100)}٪ من قيمتها الحالية. للسفن والمركب سعر البيع القائم في اللعبة؛ لا تُرد رسوم التوظيف.</p>`;
 h+=row('حصيلة المباني وتجهيزات الأسطول',q.assetProceeds)+row('صافي البضاعة والمواشي المباعة',q.goodsNet)+row('صافي سحب المضاربات بعد الرسم',q.investmentReturn)+row('رسم السحب (محسوب في الصافي أعلاه)',q.investmentFees)+row('المستحقات المسجلة التي ستُسدّد',q.duesPaid)+row(q.net<0?'سيُخصم من رصيد الريال':'سيُضاف إلى رصيد الريال',Math.abs(q.net))+row('رصيد الريال بعد التصفية',q.cashAfter);
 if(q.net<0)h+='<p class="qnote">المستحقات تفوق الحصيلة؛ سيُغطّى الفارق من رصيد الريال. راجع الخصم قبل التأكيد.</p>';
 if(goods.length)h+=`<details><summary>تفصيل البضاعة والمواشي (${goods.length})</summary><ul>${goods.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></details>`;
 h+=`<section class="card restart-kept"><h3>ما يبقى معك</h3><p>${esc(car.name)} · ${esc(cityName(kept.city))}: ${car.carts} عربة، طاقم ${car.crew}، حراس ${car.guards}، رعاة ${car.herders||0}، ومؤن ${money(car.supplies||0)}${car.mount?'، والمركب المملوك':''}.</p><p>تُباع حمولة القافلة وقطيعها، وتبقى تجهيزاتها وطاقمها. تتوقف المسارات والتشغيل التلقائي للقادة؛ لا تبدأ رحلة تلقائياً.</p><p>تبقى شخصيتك واسمك وتعليمك وإنجازاتك وعمرك ويوم اللعب كما هي. لا تُمنح أموال أو مكافآت بداية جديدة.</p>${row('الحصّالة المحفوظة',kept.vault)}${row('الدين الشخصي المتبقي دون سداد تلقائي',kept.loans)}${row('دَين الجدّ المتبقي دون سداد تلقائي',kept.familyDebt)}<p class="small">تبقى العملات الأخرى: دولار <span class="num">${money(kept.wallet.usd)}</span> · ذهب <span class="num">${money(kept.wallet.au)}</span> غ · فضة <span class="num">${money(kept.wallet.ag||0)}</span> غ.</p></section>`;
 h+='<p class="qnote">يعاد الطور المالي إلى 1 عند التنفيذ. قد تفتح الأطوار المالية مجدداً مع مرور الوقت بحسب حدود الثروة المعتادة؛ مراحل التعليم المرتبطة بالعمر لا تعاد. تنتهي إدارات المدن واشتراكات تكافلها، ويغادر عمال الأصول وأطقم الأسطول الإضافي بعد تسوية المستحقات المقيدة.</p>';
 if(Object.values(S.player.props).some(p=>p.farm?.stable)||(S.player.ships||[]).some(s=>Object.values(s.up||{}).some(n=>n>0)))h+='<p class="small muted">التقييم الحالي لا يعطي الإسطبل الملحق أو ترقيات السفينة قيمة بيع منفصلة.</p>';
 h+=`<details class="asset-sale-zakat"><summary>بيع الأصول والزكاة</summary><p>${esc(ASSET_SALE_TEXTS.zakat)}</p></details>`;
 if(v.phase===1)h+='<p class="qnote" role="status">التأكيد الأخير: ستتم تصفية الأصول والبضاعة المذكورة وتسوية المستحقات، وإعادة الطور المالي إلى 1. راجع الحصيلة وما سيبقى قبل التنفيذ.</p>';
 return h;
}
