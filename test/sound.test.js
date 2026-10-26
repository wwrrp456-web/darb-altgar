// node test/sound.test.js — اختبار Web Audio وهمي بلا متصفح.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../src/sound.js'), 'utf8');
const expected = ['click','buy','sell','vault','coin','success','fail','alert','levelup','caravan','haggleWin','haggleFail','tick','nav','open','close','alertHi','bell','horn','depart','register','loss','build','magic'];
function sandbox(options = {}) {
 let now = 1000;
 const counts = { contexts: 0, oscillators: 0, noise: 0, resumes: 0, starts: [], stops: [], levels: [], gains: [] };
 const stored = options.stored || {}, listeners = {};
 const parameter = (amplitude = true) => {
  let current = 0; const record = v => { if (amplitude) counts.levels.push(v); };
  return { get value() { return current; }, set value(v) { current = v; record(v); }, setValueAtTime: record, linearRampToValueAtTime: record, exponentialRampToValueAtTime: record };
 };
 const node = () => ({ connect() {}, disconnect() {}, start(t) { counts.starts.push(t); }, stop(t) { counts.stops.push(t); } });
 class Audio {
  constructor() { counts.contexts++; if (options.broken) throw Error('Unavailable'); this.state = options.interrupted ? 'interrupted' : 'suspended'; this.currentTime = now / 1000; this.sampleRate = 44100; this.destination = {}; }
  createGain() { const gain=parameter(); counts.gains.push(gain); return { ...node(), gain }; }
  createBiquadFilter() { return { ...node(), frequency: parameter(false), Q: parameter(false) }; }
  createOscillator() { counts.oscillators++; return { ...node(), frequency: parameter(false) }; }
  createBuffer(_, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { counts.noise++; return node(); }
  resume() { counts.resumes++; this.state = 'running'; return options.rejectResume ? Promise.reject(Error('Suspended')) : Promise.resolve(); }
 }
 const storage = { getItem(k) { return stored[k] || null; }, setItem(k, v) { stored[k] = v; } };
 const scope = { setTimeout() { return 1; }, clearTimeout() {}, module: { exports: {} }, Date: { now: () => now }, navigator: { userActivation: { isActive: false } }, document: { addEventListener(k, fn) { listeners[k] = fn; } }, localStorage: options.storage || storage };
 if (!options.noAudio) scope[options.webkit ? 'webkitAudioContext' : 'AudioContext'] = Audio;
 vm.runInNewContext(source, scope);
 return { sound: scope.module.exports, scope, counts, stored, listeners, advance(ms) { now += ms; } };
}
let t = sandbox();
assert.deepEqual(Array.from(t.sound.names), expected);
assert.equal(t.scope.Sound, t.sound);
assert.equal(t.counts.contexts, 0, 'Import must not create AudioContext');
t.sound.play('click'); assert.equal(t.counts.contexts, 0, 'No context before user input');
t.listeners.pointerdown({ isTrusted: false }); t.sound.play('click'); assert.equal(t.counts.contexts, 0);
t.listeners.pointerdown({ isTrusted: true }); t.sound.play('click'); assert.equal(t.counts.noise, 1, 'Trusted touch can enable first play');
t.advance(2000); t.sound.play('tick'); assert.equal(t.counts.noise, 2, 'Timed cues remain available after first gesture activation');
t = sandbox(); t.sound.unlock(); assert.equal(t.counts.contexts, 1); assert.equal(t.counts.resumes, 1);
for (const name of expected) {
 const before = t.counts.oscillators + t.counts.noise;
 t.sound.play(name);
 assert.ok(t.counts.oscillators + t.counts.noise > before, name + ': source created');
 t.advance(40);
}
assert.equal(t.counts.contexts, 1, 'Reuse a single context');
for (let i = 0; i < t.counts.starts.length; i++) {
 const ms = (t.counts.stops[i] - t.counts.starts[i]) * 1000;
 assert.ok(ms >= 59.99 && ms <= 600, 'Short bounded voice duration');
}
assert.ok(t.counts.levels.length > 0);
assert.ok(t.counts.levels.every(v => v >= 0 && v <= .6), 'Every gain value and envelope stays within the volume ceiling');
for (const name of expected) {
 const u = sandbox(); u.sound.unlock(); u.sound.play(name);
 assert.ok(u.counts.starts.length > 0);
 assert.ok(Math.max(...u.counts.stops) - Math.min(...u.counts.starts) <= .6 + 1e-9);
}
t = sandbox(); t.sound.setMuted(true); t.sound.unlock(); t.sound.play('coin');
assert.equal(t.sound.isMuted(), true); assert.equal(t.counts.oscillators + t.counts.noise, 0); assert.equal(t.stored['darb-mute'], '1');
const restored = sandbox({ stored: t.stored }); assert.equal(restored.sound.isMuted(), true);
t.sound.setMuted(false); t.sound.play('coin'); assert.ok(t.counts.oscillators > 0); assert.equal(t.stored['darb-mute'], '0');
t = sandbox(); t.sound.unlock(); t.sound.play('buy'); const before = t.counts.oscillators;
t.sound.play('buy'); t.advance(29); t.sound.play('buy'); assert.equal(t.counts.oscillators, before);
t.sound.play('sell'); assert.ok(t.counts.oscillators > before, 'Rate limit is per sound');
t.advance(1); const next = t.counts.oscillators; t.sound.play('buy'); assert.ok(t.counts.oscillators > next, 'Allowed at 30ms');
for (const options of [{ noAudio: true }, { broken: true }, { rejectResume: true }, { interrupted: true }, { webkit: true }, { storage: { getItem() { throw Error(); }, setItem() { throw Error(); } } }]) {
 const u = sandbox(options);
 assert.doesNotThrow(() => { u.sound.unlock(); u.sound.setMuted(false); for (const name of [...expected, 'unknown', null, {}, '__proto__']) u.sound.play(name); });
}
assert.ok(Buffer.byteLength(source) <= 14336, 'Module under 14KiB');
t = sandbox(); assert.equal(t.sound.getAmbienceVolume(), .6);
t.sound.setAmbienceVolume(.25); assert.equal(t.stored['darb-ambvol'], '0.25'); assert.equal(t.sound.getVolume(), .7);
assert.equal(sandbox({ stored: t.stored }).sound.getAmbienceVolume(), .25);
t.sound.setAmbienceVolume(-2); assert.equal(t.sound.getAmbienceVolume(), 0); t.sound.setAmbienceVolume(4); assert.equal(t.sound.getAmbienceVolume(), 1);
assert.equal(sandbox({ stored: { 'darb-ambvol': 'broken' } }).sound.getAmbienceVolume(), .6);
t = sandbox(); t.sound.unlock(); t.sound.setAmbience(true,'market');
assert.equal(t.counts.gains[1].value,.6,'ambient output starts at persisted default');
const starts=t.counts.starts.length; t.sound.setAmbienceVolume(.2);
assert.equal(t.counts.gains[1].value,.2,'slider updates active ambient output');
assert.equal(t.counts.starts.length,starts,'volume does not recreate sound layers');
assert.equal(t.sound.getVolume(),.7,'ambient slider leaves master preference alone');
t.sound.setAmbience(false);assert.ok(t.counts.stops.length>0,'ambient sources stop');
assert.equal(require('../src/sound.js').isMuted(), false, 'CommonJS entry works without browser');
setImmediate(() => console.log('OK sound: lazy input activation, all 12 cues, persistence, muting, envelopes, rate limit, browser fallbacks and failures'));
