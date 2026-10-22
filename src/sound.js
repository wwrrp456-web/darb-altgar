/* مؤثرات قصيرة بلا ملفات أو موسيقى؛ يُستدعى unlock من تفاعل المستخدم. */
(function (root) {
'use strict';
let muted = false, context = null, master = null, unlocked = false, gestureUntil = 0;
const last = Object.create(null);
try { muted = /^(1|true)$/.test(root.localStorage.getItem('darb-mute')); } catch (_) {}
// [التردد، التأخير، المدة، السعة]؛ صفر التردد يعني نقرة ضوضاء ناعمة.
const cues = {
 click: [[0, 0, .075, .09]],
 buy: [[293.66, 0, .12, .12], [440, .08, .16, .1]],
 sell: [[392, 0, .12, .1], [587.33, .09, .18, .1]],
 coin: [[880, 0, .2, .1], [1760, 0, .12, .035]],
 success: [[392, 0, .14, .11], [523.25, .1, .14, .1], [659.25, .2, .18, .09]],
 fail: [[220, 0, .15, .09], [196, .11, .16, .08]],
 alert: [[392, 0, .12, .09], [392, .17, .12, .08]],
 levelup: [[293.66, 0, .15, .12], [392, .12, .16, .11], [440, .26, .22, .1]],
 caravan: [[587.33, 0, .2, .08], [880, .18, .2, .06]],
 haggleWin: [[440, 0, .14, .11], [587.33, .12, .2, .1]],
 haggleFail: [[293.66, 0, .15, .09], [220, .12, .17, .08]],
 tick: [[0, 0, .06, .05]],
 nav: [[0, 0, .06, .045]],
 open: [[523.25, 0, .07, .05], [659.25, .05, .09, .045]],
 close: [[440, 0, .06, .04]],
 alertHi: [[880, 0, .1, .1], [659.25, .13, .1, .1], [880, .26, .16, .1]],
 bell: [[1568, 0, .28, .06], [2093, .02, .2, .03]],
 horn: [[130.81, 0, .55, .1], [164.81, 0, .55, .07]],
 depart: [[1318.5, 0, .15, .06], [1568, .14, .22, .05]],
 register: [[1046.5, 0, .1, .08], [1318.5, .09, .1, .08], [1568, .18, .24, .09], [0, 0, .06, .05]],
 loss: [[196, 0, .2, .1], [146.83, .18, .3, .09]],
 build: [[0, 0, .07, .18], [0, .16, .07, .18], [0, .32, .1, .19]],
 magic: [[1174.66, 0, .22, .06], [1568, .1, .26, .05], [2349.3, .2, .38, .04]]
};
const metal = { coin: 1, caravan: 1, bell: 1, magic: 1, register: 1, depart: 1 };
const gap = { bell: 1500, tick: 120, nav: 80, click: 45 };
let voices = 0, ambOn = false, ambNode = null, ambMode = '';
try { ambOn = /^(1|true)$/.test(root.localStorage.getItem('darb-amb')); } catch (_) {}
const names = Object.freeze(Object.keys(cues));
function resume() {
 if (context && context.state !== 'running' && context.state !== 'closed') {
  const pending = context.resume();
  if (pending && typeof pending.catch === 'function') pending.catch(function () {});
 }
}
function ready() {
 if (!context) {
  const Audio = root.AudioContext || root.webkitAudioContext;
  if (!Audio) return false;
  const next = new Audio(), gain = next.createGain();
  gain.gain.value = muted ? 0 : .18;
  gain.connect(next.destination);
  context = next; master = gain;
 }
 resume();
 return true;
}
function gesture() {
 try {
  return unlocked || (gestureUntil > 0 && Date.now() <= gestureUntil) || !!(root.navigator && root.navigator.userActivation && root.navigator.userActivation.isActive);
 } catch (_) { return unlocked; }
}
// المتصفحات التي لا تعرض userActivation تستفيد من حدث الإدخال الموثوق نفسه.
try {
 if (root.document && root.document.addEventListener) {
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (type) {
   root.document.addEventListener(type, function (event) {
    if (event.isTrusted) gestureUntil = Date.now() + 1000;
   }, { capture: true, passive: true });
  });
 }
} catch (_) {}
function voice(note, metallic) {
 const start = context.currentTime + note[1], duration = note[2];
 const envelope = context.createGain();
 let source;
 if (note[0]) {
  source = context.createOscillator();
  source.type = metallic ? 'sine' : 'triangle';
  source.frequency.setValueAtTime(note[0], start);
 } else {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const samples = buffer.getChannelData(0);
  // ضوضاء مصفّاة حسابيًا، لا حدة في النقرات ولا حاجة لملف صوتي.
  let smooth = 0;
  for (let i = 0; i < samples.length; i++) { smooth = .75 * smooth + .25 * (Math.random() * 2 - 1); samples[i] = smooth; }
  source = context.createBufferSource(); source.buffer = buffer;
 }
 envelope.gain.setValueAtTime(.0001, start);
 envelope.gain.linearRampToValueAtTime(note[3], start + .008);
 envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
 source.connect(envelope); envelope.connect(master);
 source.onended = function () { voices = Math.max(0, voices - 1); try { source.disconnect(); envelope.disconnect(); } catch (_) {} };
 source.start(start); source.stop(start + duration);
}
function play(name) {
 try {
  if (muted || typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(cues, name) || !gesture()) return;
  const now = Date.now(), elapsed = now - last[name];
  if (elapsed >= 0 && elapsed < (gap[name] || 30)) return;
  if (!ready()) return;
  unlocked = true;
  last[name] = now;
  cues[name].forEach(function (note) { voice(note, !!metal[name]); });
 } catch (_) { /* الصوت اختياري؛ لا يوقف اللعب في أي بيئة. */ }
}

// الأجواء: ضوضاء مصفّاة مستمرة بلا ملفات (ريح الصحراء، همهمة السوق، سكون الدكان)؛ مغلقة افتراضياً
const AMB = { wind: [420, .7, .05], market: [1100, .9, .028], quiet: [240, .5, .012] };
function ambStop() { try { if (ambNode) { ambNode.g.gain.value = 0; ambNode.src.stop(); ambNode.src.disconnect(); ambNode.g.disconnect(); } } catch (_) {} ambNode = null; ambMode = ''; }
function ambience(mode) {
 try {
  if (!ambOn || muted || !AMB[mode] || (root.document && root.document.hidden)) { ambStop(); return; }
  if (mode === ambMode && ambNode) return;
  if (!gesture() || !ready() || !context.createBiquadFilter) return;
  ambStop(); unlocked = true;
  const n = Math.ceil(context.sampleRate * 2), buffer = context.createBuffer(1, n, context.sampleRate), d = buffer.getChannelData(0);
  let sm = 0; for (let i = 0; i < n; i++) { sm = .9 * sm + .1 * (Math.random() * 2 - 1); d[i] = sm * 3; }
  const src = context.createBufferSource(), f = context.createBiquadFilter(), g = context.createGain(), cfg = AMB[mode];
  src.buffer = buffer; src.loop = true; f.type = 'bandpass'; f.frequency.value = cfg[0]; f.Q.value = cfg[1]; g.gain.value = cfg[2];
  src.connect(f); f.connect(g); g.connect(master); src.start(); ambNode = { src: src, g: g }; ambMode = mode;
 } catch (_) {}
}
function setAmbience(value, mode) {
 ambOn = !!value; try { root.localStorage.setItem('darb-amb', ambOn ? '1' : '0'); } catch (_) {}
 if (!ambOn) ambStop(); else ambience(mode || ambMode || 'wind');
}
try { if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', function () { if (root.document.hidden) ambStop(); else if (ambOn) ambience(ambMode || 'wind'); }); } catch (_) {}
function setMuted(value) {
 if (value) ambStop();
 muted = !!value;
 try { if (master) master.gain.value = muted ? 0 : .18; } catch (_) {}
 try { root.localStorage.setItem('darb-mute', muted ? '1' : '0'); } catch (_) {}
}
function unlock() {
 try { unlocked = true; if (!muted) ready(); } catch (_) {}
}
const Sound = { ambience: ambience, setAmbience: setAmbience, isAmbience: function () { return ambOn; }, play: play, setMuted: setMuted, isMuted: function () { return muted; }, unlock: unlock, names: names };
root.Sound = Sound;
if (typeof module !== 'undefined' && module.exports) module.exports = Sound;
})(typeof globalThis !== 'undefined' ? globalThis : window);
