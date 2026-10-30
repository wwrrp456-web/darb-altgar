/* مفاتيح الاعتماد الشرعي (WP-20): hidden = معرّفات بنود docs/review/registry.json التي قرر بن محمود إخفاءها.
   لا يُضاف معرّف هنا إلا بقرار منه؛ رُفع إخفاء أهداف المواسم بعد اعتماد الدفعة 08 وقرار بن محمود؛ والاستيراد (tools/review-import.js) لا يخفي بنفسه. */
(function (root) {
'use strict';
const FLAGS = { hidden: [] };
const API = { FLAGS, reviewHidden: id => FLAGS.hidden.includes(id) };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ReviewFlags = API;
})(typeof window !== 'undefined' ? window : globalThis);
