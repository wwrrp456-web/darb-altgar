/* مفاتيح الاعتماد الشرعي (WP-20): hidden = معرّفات بنود docs/review/registry.json التي قرر بن محمود إخفاءها.
   لا يُضاف معرّف هنا إلا بقرار منه؛ وفيها الآن أهداف المواسم الدينية الستة (SG-01..06، WP-23) حتى يعتمدها المختص بالدفعة 08 ثم يقرر بن محمود رفعها من هنا؛ والاستيراد (tools/review-import.js) لا يخفي بنفسه. */
(function (root) {
'use strict';
const FLAGS = { hidden: ['SG-01', 'SG-02', 'SG-03', 'SG-04', 'SG-05', 'SG-06'] };
const API = { FLAGS, reviewHidden: id => FLAGS.hidden.includes(id) };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ReviewFlags = API;
})(typeof window !== 'undefined' ? window : globalThis);
