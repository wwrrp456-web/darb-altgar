/* مؤثرات قصيرة بلا ملفات أو موسيقى؛ يُستدعى unlock من تفاعل المستخدم. */
(function (root) {
'use strict';
let muted = false, context = null, master = null, unlocked = false, gestureUntil = 0;
const last = Object.create(null);
const AMB_LEVEL = Object.freeze({ market: .035, sea: .075, wind: .05, quiet: .012 });
let ambVol = .6;
try { const v = parseFloat(root.localStorage.getItem('darb-ambvol')); if (v >= 0 && v <= 1) ambVol = v; } catch (_) {}
let vol = .7; // مستوى الصوت من 0 إلى 1؛ القمة 1 تعني تكبيراً بنحو 3 أضعاف الأساس القديم
try { const v = parseFloat(root.localStorage.getItem('darb-vol')); if (v >= 0 && v <= 1) vol = v; } catch (_) {}
function level() { return muted ? 0 : vol * .6; }
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
  gain.gain.value = level();
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

// الأجواء: طبقات ضوضاء مصفّاة بتموّج بطيء بلا ملفات؛ مغلقة افتراضياً
// طبقة: [نوع المرشح، التردد، Q، السعة، تردد التموّج بالهرتز، عمق التموّج]
const AMB = {
 market: { layers: [['bandpass', 380, .8, AMB_LEVEL.market, .13, .02], ['bandpass', 900, 1.1, AMB_LEVEL.market * 6 / 7, .21, .018], ['bandpass', 1700, 1.3, AMB_LEVEL.market * 16 / 35, .31, .01]], babble: { gap: [.25, .9], f: [160, 340], g: .014, len: [.18, .45] } },
 sea: { layers: [['lowpass', 420, .7, AMB_LEVEL.sea, .11, .06], ['highpass', 2400, .5, AMB_LEVEL.sea * .16, .11, .01], ['bandpass', 900, .9, AMB_LEVEL.sea * 2 / 15, .17, .008]], babble: { gap: [6, 13], f: [190, 280], g: .0084, len: [.5, .9] } },
 wind: { layers: [['bandpass', 520, .8, AMB_LEVEL.wind, .07, .03], ['bandpass', 1100, 1.2, AMB_LEVEL.wind * .36, .1, .012]], babble: { gap: [8, 15], f: [620, 900], g: .0042, len: [.8, 1.3], wh: 1 } },
 quiet: { layers: [['bandpass', 240, .5, AMB_LEVEL.quiet, .05, .004]] }
};
AMB.port = AMB.sea; AMB.desert = AMB.wind;
let ambNodes = [], ambTimer = 0, ambBuf = null, wantMode = 'wind';
function ambStop() {
 try { clearTimeout(ambTimer); } catch (_) {}
 ambNodes.forEach(function (n) { try { if (n.stop) n.stop(); n.disconnect(); } catch (_) {} });
 ambNodes = []; ambNode = null; ambMode = '';
}
function ambBabble(cfg, out) {
 function next() {
  try {
   if (!ambNode) return;
   const f0 = cfg.f[0] + Math.random() * (cfg.f[1] - cfg.f[0]), len = cfg.len[0] + Math.random() * (cfg.len[1] - cfg.len[0]), t = context.currentTime;
   const o = context.createOscillator(), e = context.createGain(), fl = context.createBiquadFilter();
   o.type = cfg.wh ? 'sine' : 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * (cfg.wh ? 1.35 : 1 + (Math.random() - .5) * .3), t + len);
   fl.type = 'bandpass'; fl.frequency.value = cfg.wh ? f0 : 650; fl.Q.value = 1.6;
   e.gain.setValueAtTime(.0001, t); e.gain.linearRampToValueAtTime(cfg.g, t + len * .3); e.gain.exponentialRampToValueAtTime(.0001, t + len);
   o.connect(fl); fl.connect(e); e.connect(out); o.start(t); o.stop(t + len + .05);
   o.onended = function () { try { o.disconnect(); fl.disconnect(); e.disconnect(); } catch (_) {} };
  } catch (_) {}
  ambTimer = setTimeout(next, (cfg.gap[0] + Math.random() * (cfg.gap[1] - cfg.gap[0])) * 1000);
 }
 next();
}
function ambience(mode) {
 try {
  if (mode) wantMode = mode;
  if (!ambOn || muted || !AMB[mode] || (root.document && root.document.hidden)) { ambStop(); return; }
  const cfg = AMB[mode], key = cfg === AMB.sea ? 'sea' : cfg === AMB.wind ? 'wind' : mode;
  if (key === ambMode && ambNode) return;
  if (!gesture() || !ready() || !context.createBiquadFilter) return;
  ambStop(); unlocked = true;
  if (!ambBuf || ambBuf.sampleRate !== context.sampleRate) {
   const n = Math.ceil(context.sampleRate * 3), buf = context.createBuffer(1, n, context.sampleRate), d = buf.getChannelData(0);
   let sm = 0; for (let i = 0; i < n; i++) { sm = .9 * sm + .1 * (Math.random() * 2 - 1); d[i] = sm * 3; }
   ambBuf = buf;
  }
  const out = context.createGain(); out.gain.value = ambVol; out.connect(master); ambNodes.push(out); ambNode = out; ambMode = key;
  cfg.layers.forEach(function (L) {
   const src = context.createBufferSource(), f = context.createBiquadFilter(), g = context.createGain(), lfo = context.createOscillator(), dp = context.createGain();
   src.buffer = ambBuf; src.loop = true; f.type = L[0]; f.frequency.value = L[1]; f.Q.value = L[2]; g.gain.value = L[3];
   lfo.frequency.value = L[4] * (.85 + Math.random() * .3); dp.gain.value = L[5];
   lfo.connect(dp); dp.connect(g.gain); src.connect(f); f.connect(g); g.connect(out);
   src.start(0, Math.random() * 2); lfo.start(); ambNodes.push(src, lfo, f, g, dp);
  });
  if (cfg.babble) ambBabble(cfg.babble, out);
 } catch (_) {}
}
function setAmbience(value, mode) {
 ambOn = !!value; try { root.localStorage.setItem('darb-amb', ambOn ? '1' : '0'); } catch (_) {}
 if (!ambOn) ambStop(); else ambience(mode || wantMode);
}
try { if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', function () { if (root.document.hidden) ambStop(); else if (ambOn) ambience(wantMode); }); } catch (_) {}
function setMuted(value) {
 if (value) ambStop();
 muted = !!value;
 try { if (master) master.gain.value = level(); } catch (_) {}
 try { root.localStorage.setItem('darb-mute', muted ? '1' : '0'); } catch (_) {}
}
function setAmbienceVolume(v) {
 ambVol = Math.max(0, Math.min(1, +v || 0));
 try { if (ambNode) ambNode.gain.setTargetAtTime(ambVol, context.currentTime, .05); } catch (_) { try { if (ambNode) ambNode.gain.value = ambVol; } catch (_) {} }
 try { root.localStorage.setItem('darb-ambvol', String(ambVol)); } catch (_) {}
}
function setVolume(v) {
 v = Math.max(0, Math.min(1, +v || 0)); vol = v;
 try { if (master) master.gain.value = level(); } catch (_) {}
 try { root.localStorage.setItem('darb-vol', String(v)); } catch (_) {}
}
function unlock() {
 try { unlocked = true; if (!muted) ready(); } catch (_) {}
}
const Sound = { setAmbienceVolume: setAmbienceVolume, getAmbienceVolume: function () { return ambVol; }, setVolume: setVolume, getVolume: function () { return vol; }, ambience: ambience, setAmbience: setAmbience, isAmbience: function () { return ambOn; }, play: play, setMuted: setMuted, isMuted: function () { return muted; }, unlock: unlock, names: names };
root.Sound = Sound;
if (typeof module !== 'undefined' && module.exports) module.exports = Sound;
})(typeof globalThis !== 'undefined' ? globalThis : window);
