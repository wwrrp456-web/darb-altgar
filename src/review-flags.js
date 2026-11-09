/* مفاتيح الاعتماد الشرعي (WP-20): hidden = معرّفات بنود docs/review/registry.json التي قرر بن محمود إخفاءها.
   لا يُضاف معرّف هنا إلا بقرار منه؛ مشاريع 015ب الأربعة الموسومة (P02 وP06 وP13 وP15) مخفية حتى يعتمدها المختص (الدفعة 09)؛ رُفع إخفاء أهداف المواسم بعد اعتماد الدفعة 08 وقرار بن محمود؛ واتفاقية الاستيراد CT-02 (036أ، معدَّلة بقرار المختص) مخفية حتى تُرفع بعد دفعة التأكيد 12؛ والاستيراد (tools/review-import.js) لا يخفي بنفسه. */
(function (root) {
'use strict';
const FLAGS = { hidden: ['PJ-01', 'PJ-02', 'PJ-03', 'PJ-04', 'CT-02'] };
const API = { FLAGS, reviewHidden: id => FLAGS.hidden.includes(id) };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ReviewFlags = API;
})(typeof window !== 'undefined' ? window : globalThis);
