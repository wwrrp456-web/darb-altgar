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
 tick: [[0, 0, .06, .05]]
};
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
 source.onended = function () { try { source.disconnect(); envelope.disconnect(); } catch (_) {} };
 source.start(start); source.stop(start + duration);
}
function play(name) {
 try {
  if (muted || typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(cues, name) || !gesture()) return;
  const now = Date.now(), elapsed = now - last[name];
  if (elapsed >= 0 && elapsed < 30) return;
  if (!ready()) return;
  unlocked = true;
  last[name] = now;
  cues[name].forEach(function (note) { voice(note, name === 'coin' || name === 'caravan'); });
 } catch (_) { /* الصوت اختياري؛ لا يوقف اللعب في أي بيئة. */ }
}
function setMuted(value) {
 muted = !!value;
 try { if (master) master.gain.value = muted ? 0 : .18; } catch (_) {}
 try { root.localStorage.setItem('darb-mute', muted ? '1' : '0'); } catch (_) {}
}
function unlock() {
 try { unlocked = true; if (!muted) ready(); } catch (_) {}
}
const Sound = { play: play, setMuted: setMuted, isMuted: function () { return muted; }, unlock: unlock, names: names };
root.Sound = Sound;
if (typeof module !== 'undefined' && module.exports) module.exports = Sound;
})(typeof globalThis !== 'undefined' ? globalThis : window);
