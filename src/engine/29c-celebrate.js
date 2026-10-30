/* لحظات الاحتفال (WP-26): سجل تجميلي اختياري، بلا مكافآت أو سحب عشوائي. */
const CELEBRATE = { on: true };
const CELEBRATE_IDS = ['first_country', 'first_ship', 'market_lead', 'first_million', 'chapter_done', 'retirement'];
const CELEBRATE_MAP = typeof module !== 'undefined' && module.exports ? require('./content-map.js') : root.ContentMap;
const celebrateKey = (id, arg) => id === 'chapter_done' ? id + ':' + arg : id;
const celebrateEnabled = S => !!(CELEBRATE.on && S && S.learn && S.learn.char && !S.shadowClone);
function celebrate(S, id, arg) {
  if (!celebrateEnabled(S) || !CELEBRATE_IDS.includes(id)) return false;
  if (id === 'chapter_done' && (!Number.isInteger(arg) || arg < 1 || arg > 7)) return false;
  if (arg != null && !['string', 'number'].includes(typeof arg)) return false;
  const L = S.learn, book = L.cel || (L.cel = {}), key = celebrateKey(id, arg);
  if (book[key] != null) return false; // اليوم0 سجل صالح، فلا يُختبر بالقيمة المنطقية.
  book[key] = S.day;
  L.celq = L.celq || [];
  schedQ(S, 'celq', { id, arg });
  return true;
}
function celebrateChapters(S) {
  if (!celebrateEnabled(S) || !CELEBRATE_MAP || !CELEBRATE_MAP.PIECES) return;
  const L = S.learn, book = L.cel || (L.cel = {});
  const sig = [L.stage || 0, L.level, (L.stageDone || []).join(',')].join('|');
  if (book.chapters && book.chapters.sig === sig) return;
  const states = Object.fromEntries(chapterJourney(S, CELEBRATE_MAP.PIECES).map(c => [c.n, c.state]));
  const previous = book.chapters && book.chapters.states;
  if (previous) for (const n of Object.keys(states)) {
    if (states[n] === 'done' && previous[n] !== 'done') celebrate(S, 'chapter_done', +n);
  }
  book.chapters = { sig, states };
}
function celebrateBaseline(S) {
  if (celebrateEnabled(S) && !(S.learn.cel && S.learn.cel.chapters)) celebrateChapters(S);
}
function celebrateProgress(S, worth) {
  if (!celebrateEnabled(S)) return;
  const book = S.learn.cel || (S.learn.cel = {});
  if (book.first_million == null && (worth == null ? netWorth(S) : worth) >= 1000000) celebrate(S, 'first_million');
  celebrateChapters(S);
  schedCelebrateRelease(S);
}
