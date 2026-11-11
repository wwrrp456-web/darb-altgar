'use strict';
// التقاط البصمات مع E.HOMEST.on=false (قرار التكامل 040ز+042): لا تحمل الحفظات الجديدة P.hs ولا تتغير مساراتها.
// يُحمَّل من capture-autopilot.js وcapture-guided.js فقط؛ لا يغيّر الافتراضي في الشيفرة.
const { chromium } = require('/opt/node-tools/node_modules/playwright'), launch = chromium.launch.bind(chromium);
const init = () => { let g; Object.defineProperty(window, '__game', { configurable: true, get: () => g, set: v => { g = v; try { if (v && v.E && v.E.HOMEST) v.E.HOMEST.on = false; if (v && v.E && v.E.LOANPLEDGE) v.E.LOANPLEDGE.ask = false; if (v && v.E && v.E.DELEG) v.E.DELEG.on = false; } catch (e) {} } }); };
chromium.launch = async (...a) => { const b = await launch(...a), nc = b.newContext.bind(b); b.newContext = async (...x) => { const c = await nc(...x); await c.addInitScript(init); return c; }; const np = b.newPage.bind(b); b.newPage = async (...x) => { const pg = await np(...x); await pg.addInitScript(init); return pg; }; return b; };
