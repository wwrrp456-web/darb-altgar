/* النصوص حرفياً من docs/review/APPROVED_REVIEW_2026-10-24.md. */
const ASSET_SALE_TEXTS = {
 zakat: 'عقاراتك ومصانعك الثابتة لا زكاة في أصل قيمتها؛ فإذا بعتها دخل ثمنها في رصيد نقدك لتزكيه مع أموالك عند تمام الحول',
 restart: 'العثار ليس نهاية الدرب يا بني؛ والتاجر الحصيف من جعل من كل بدايةٍ جديدة درساً ونجاحاً',
 move: 'تبديل الوجهة ونقل المتاع من حكمة التجارة لا من الهزيمة؛ فالرزق واسع والبلاد عامرة'
};
function recordAssetSaleLesson(city) {
 const L=S.learn;if(!L||L.assetSaleLesson)return;
 L.assetSaleLesson={day:S.day,city,pending:true};
 const hist=L.hist||(L.hist=[]);hist.unshift({d:S.day,t:ASSET_SALE_TEXTS.zakat,m:'teach',who:MEN.name});if(hist.length>25)hist.length=25;
}
function assetSaleLessonHTML() {
 if(!S.learn?.assetSaleLesson?.pending||!['home','estate','map'].includes(screen))return '';
 return `<section class="card asset-sale-lesson" aria-label="إرشاد بيع الأصول"><h3>عن بيع الأصول</h3>${mentorSay(ASSET_SALE_TEXTS.zakat,'teach')}<p>يمكنك الرجوع إلى شرح البيع من دفتر المرشد، في تبويب التعليمات.</p><div class="row"><button class="sm" data-act="asset-lesson-help">كيف يعمل بيع الأصول؟</button><button class="sm" data-act="asset-lesson-close">فهمت</button></div></section>`;
}
function closeAssetSaleLesson() {
 if(S.learn?.assetSaleLesson)S.learn.assetSaleLesson.pending=false;
 persist();renderAll(true);
}
