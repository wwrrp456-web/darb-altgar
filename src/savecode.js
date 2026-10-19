/* DT1: UTF-8، ثم LZ77 وHuffman اختياري، وإطار نسخة وحجم وCRC32. */
(function (root) {
'use strict';
const MAX = 5 * 1024 * 1024, RAW_MAX = MAX * 2 + 2, CODE_MAX = MAX * 4 + 1024;
const BAD = 'الرمز ناقص أو تالف.', LIMIT = 'حجم الحفظ أكبر من الحد المسموح (5 ميغابايت).';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const crcTable = new Uint32Array(256), digits = new Int16Array(128);
digits.fill(-1);
for (let i = 0; i < 256; i++) {
 let c = i;
 for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
 crcTable[i] = c >>> 0;
 if (i < 64) digits[alphabet.charCodeAt(i)] = i;
}
function fail(msg) { return { ok: false, msg: msg }; }
function broken() { throw Error(BAD); }
function put32(b, at, n) { for (let i = 0; i < 4; i++) b[at + i] = n >>> (i * 8); }
function get32(b, at) { return (b[at] | b[at + 1] << 8 | b[at + 2] << 16 | b[at + 3] << 24) >>> 0; }
function crc(bytes, header) {
 let c = 0xffffffff;
 for (let i = 0; i < 12; i++) c = crcTable[(c ^ header[i]) & 255] ^ (c >>> 8);
 for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 255] ^ (c >>> 8);
 return (c ^ 0xffffffff) >>> 0;
}
// نافذة 64KiB؛ كل مجموعة ثمانية رموز تبدأ ببايت أعلام، والمطابقة ثلاثة بايتات.
function lzPack(src) {
 const out = new Uint8Array(src.length + Math.ceil(src.length / 8));
 const heads = new Int32Array(65536), links = new Int32Array(65536);
 heads.fill(-1); links.fill(-1);
 const hash = p => ((src[p] * 251 + src[p + 1]) * 31 + src[p + 2]) & 65535;
 function insert(p) { if (p + 2 < src.length) { const h = hash(p); links[p & 65535] = heads[h]; heads[h] = p; } }
 let p = 0, n = 0;
 while (p < src.length) {
  const flagAt = n++; let flags = 0;
  for (let bit = 0; bit < 8 && p < src.length; bit++) {
   let best = 3, distance = 0;
   if (p + 3 < src.length) {
    let candidate = heads[hash(p)], tries = 24;
    const end = Math.min(259, src.length - p);
    while (candidate >= 0 && candidate < p && p - candidate <= 65535 && tries-- > 0) {
     if (src[candidate + best] === src[p + best]) {
      let len = 0;
      while (len < end && src[candidate + len] === src[p + len]) len++;
      if (len > best) { best = len; distance = p - candidate; if (len === end) break; }
     }
     const next = links[candidate & 65535];
     if (next >= candidate) break;
     candidate = next;
    }
   }
   if (distance) {
    flags |= 1 << bit; out[n++] = distance & 255; out[n++] = distance >>> 8; out[n++] = best - 4;
    const stop = p + best; while (p < stop) insert(p++);
   } else { out[n++] = src[p]; insert(p++); }
  }
  out[flagAt] = flags;
 }
 return out.subarray(0, n);
}
function lzUnpack(src, size) {
 const out = new Uint8Array(size); let i = 0, n = 0;
 while (i < src.length) {
  const flags = src[i++]; let used = 0;
  if (i === src.length) broken();
  for (; used < 8 && i < src.length; used++) {
   if (flags & (1 << used)) {
    if (i + 2 >= src.length) broken();
    const offset = src[i] | src[i + 1] << 8, length = src[i + 2] + 4; i += 3;
    if (!offset || offset > n || n + length > size) broken();
    for (let k = 0; k < length; k++) { out[n] = out[n - offset]; n++; }
   } else { if (n >= size) broken(); out[n++] = src[i++]; }
  }
  if (i === src.length && (flags >>> used)) broken();
 }
 if (n !== size) broken();
 return out;
}
// ترتيب التعادل ثابت لضمان التوافق بين Node والمتصفحات دون حفظ الشجرة نفسها.
function tree(frequencies) {
 const q = []; let serial = 256;
 for (let i = 0; i < 256; i++) if (frequencies[i]) q.push({ f: frequencies[i], id: i, symbol: i });
 while (q.length > 1) {
  q.sort((a, b) => b.f - a.f || b.id - a.id);
  const left = q.pop(), right = q.pop();
  q.push({ f: left.f + right.f, id: serial++, symbol: -1, left: left, right: right });
 }
 return q[0];
}
function huffPack(src) {
 if (src.length <= 1024) return null;
 const freq = new Uint32Array(256), codes = new Uint32Array(256), lengths = new Uint8Array(256);
 for (const b of src) freq[b]++;
 const top = tree(freq); let bits = 0, deepest = 0;
 function visit(node, code, depth) {
  if (node.symbol >= 0) { codes[node.symbol] = code; lengths[node.symbol] = depth; bits += node.f * depth; deepest = Math.max(deepest, depth); }
  else { visit(node.left, code * 2, depth + 1); visit(node.right, code * 2 + 1, depth + 1); }
 }
 visit(top, 0, 0);
 const size = 1024 + Math.ceil(bits / 8);
 if (deepest > 31 || size >= src.length) return null;
 const out = new Uint8Array(size);
 for (let i = 0; i < 256; i++) put32(out, i * 4, freq[i]);
 let at = 1024, value = 0, count = 0;
 for (const b of src) {
  for (let k = lengths[b] - 1; k >= 0; k--) {
   value = value << 1 | (codes[b] >>> k & 1);
   if (++count === 8) { out[at++] = value; value = 0; count = 0; }
  }
 }
 if (count) out[at] = value << (8 - count);
 return out;
}
function huffUnpack(src, limit) {
 if (src.length < 1024) broken();
 const freq = new Uint32Array(256); let total = 0;
 for (let i = 0; i < 256; i++) { freq[i] = get32(src, i * 4); total += freq[i]; if (total > limit) broken(); }
 if (!total) broken();
 const top = tree(freq), out = new Uint8Array(total);
 if (top.symbol >= 0) { if (src.length !== 1024) broken(); out.fill(top.symbol); return out; }
 let at = 1024, bit = 7;
 for (let n = 0; n < total; n++) {
  let node = top;
  while (node.symbol < 0) {
   if (at >= src.length) broken();
   node = src[at] >>> bit & 1 ? node.right : node.left;
   if (--bit < 0) { bit = 7; at++; }
  }
  out[n] = node.symbol;
 }
 if (bit !== 7) { if (src[at] & ((1 << (bit + 1)) - 1)) broken(); at++; }
 if (at !== src.length) broken();
 return out;
}
// حشو بتات قبل base64url: نهرب sextet 62/63 إلى 63 ثم 0/1.
// لذلك لا تظهر شرطة داخل الحمولة، ويمكن تجاهل أي شرطات يضيفها الناس عند النسخ.
function base64url(bytes) {
 const chunks = []; let text = '', total = 0, value = 0, count = 0;
 function emit(d) {
  const part = d < 62 ? alphabet[d] : '_' + (d === 62 ? 'A' : 'B');
  text += part; total += part.length;
  if (text.length >= 8192) { chunks.push(text); text = ''; }
 }
 for (const b of bytes) {
  value = value << 8 | b; count += 8;
  while (count >= 6) { count -= 6; emit(value >>> count & 63); }
 }
 if (count) emit(value << (6 - count) & 63);
 text += 'A'.repeat((4 - total % 4) % 4);
 chunks.push(text); return chunks.join('');
}
function reader(text) {
 let at = 0, value = 0, count = 0;
 function read() {
  while (count < 8) {
   if (at >= text.length) broken();
   const char = text.charCodeAt(at++); let d = char < 128 ? digits[char] : -1;
   if (d < 0) broken();
   if (d === 63) { const e = text[at++]; if (e !== 'A' && e !== 'B') broken(); d = e === 'A' ? 62 : 63; }
   value = value << 6 | d; count += 6;
  }
  count -= 8; return value >>> count & 255;
 }
 read.finish = function () {
  if (count && (value & ((1 << count) - 1))) broken();
  const padding = (4 - at % 4) % 4;
  for (let i = 0; i < padding; i++) if (text[at++] !== 'A') broken();
 };
 return read;
}
function encode(json) {
 try {
  if (typeof json !== 'string') return fail('الحفظ يجب أن يكون نص JSON.');
  if (json.length > MAX) return fail(LIMIT);
  if (!json.trim()) return fail('نص الحفظ فارغ.');
  try { JSON.parse(json); } catch (_) { return fail('محتوى الحفظ ليس JSON صالحًا.'); }
  const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = encoder.encode(json), flags = 0;
  if (bytes.length > MAX) return fail(LIMIT);
  // JSON.stringify يحفظ وحدات UTF-16 المنفردة؛ لا نستبدلها بمحرف بديل بصمت.
  if (decoder.decode(bytes) !== json) { bytes = encoder.encode(JSON.stringify(json)); flags = 1; }
  let packed = lzPack(bytes);
  const huffman = huffPack(packed);
  if (huffman) { packed = huffman; flags |= 2; }
  const frame = new Uint8Array(16 + packed.length);
  frame.set([68, 84, 1, flags]); put32(frame, 4, bytes.length); put32(frame, 8, packed.length); put32(frame, 12, crc(packed, frame)); frame.set(packed, 16);
  return { ok: true, code: 'DT1-' + base64url(frame) };
 } catch (_) { return fail('تعذر إنشاء رمز الحفظ.'); }
}
function decode(code) {
 try {
  if (typeof code !== 'string') return fail('رمز الحفظ يجب أن يكون نصًا.');
  if (code.length > CODE_MAX) return fail('حجم رمز الحفظ أكبر من الحد المسموح.');
  if (!code.replace(/[\s-]/g, '')) return fail('رمز الحفظ فارغ.');
  const compact = code.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\s\u00ad]/g, ''), prefix = /DT(\d+)-/.exec(compact);
  if (!prefix) return fail('رمز الحفظ لا يبدأ بالبادئة DT1-.');
  if (prefix[1] !== '1') return fail('نسخة رمز الحفظ غير معروفة.');
  const read = reader(compact.slice(prefix.index + prefix[0].length).replace(/-/g, ''));
  const header = new Uint8Array(16); for (let i = 0; i < 16; i++) header[i] = read();
  if (header[0] !== 68 || header[1] !== 84) broken();
  if (header[2] !== 1) return fail('نسخة رمز الحفظ غير معروفة.');
  const flags = header[3], size = get32(header, 4), packedSize = get32(header, 8), checksum = get32(header, 12);
  if (flags > 3 || !size || !packedSize) broken();
  if (size > ((flags & 1) ? RAW_MAX : MAX)) return fail(LIMIT);
  const lzLimit = size + Math.ceil(size / 8);
  if (packedSize > lzLimit + 1024) broken();
  let packed = new Uint8Array(packedSize); for (let i = 0; i < packedSize; i++) packed[i] = read();
  read.finish();
  if (crc(packed, header) !== checksum) broken();
  if (flags & 2) packed = huffUnpack(packed, lzLimit);
  const bytes = lzUnpack(packed, size);
  let json = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (flags & 1) { try { json = JSON.parse(json); } catch (_) { broken(); } }
  if (typeof json !== 'string') broken();
  if (json.length > MAX || new TextEncoder().encode(json).length > MAX) return fail(LIMIT);
  try { JSON.parse(json); } catch (_) { return fail('محتوى الرمز ليس JSON صالحًا.'); }
  return { ok: true, json: json };
 } catch (_) { return fail(BAD); }
}
const SaveCode = { encode: encode, decode: decode };
root.SaveCode = SaveCode;
if (typeof module !== 'undefined' && module.exports) module.exports = SaveCode;
})(typeof globalThis !== 'undefined' ? globalThis : window);
