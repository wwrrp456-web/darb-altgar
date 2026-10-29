/* درب التجّار v0.2 — محرك المحاكاة (بلا واجهة، يعمل في المتصفح وفي Node).
   كل الحالة بيانات خام قابلة للحفظ JSON. الأرقام والصيغ في DESIGN.md */
(function (root) {
'use strict';

const VER = 3;
const LS = (typeof module !== 'undefined' && module.exports) ? require('./lessons.js') : root.Lessons;
const BAB = (typeof module !== 'undefined' && module.exports) ? require('./babylon.js') : root.Babylon;
const FIQH = (typeof module !== 'undefined' && module.exports) ? require('./fiqh.js') : root.Fiqh;
const LORE = (typeof module !== 'undefined' && module.exports) ? require('./lore.js') : root.Lore;
const ACHD = (typeof module !== 'undefined' && module.exports) ? require('./achievements.js') : root.Achievements;
const CARDS = (typeof module !== 'undefined' && module.exports) ? require('./cards.js') : root.Cards;
const DLG = (typeof module !== 'undefined' && module.exports) ? require('./dialogs.js') : root.Dialogs;
const REVF = (typeof module !== 'undefined' && module.exports) ? require('./review-flags.js') : root.ReviewFlags;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

