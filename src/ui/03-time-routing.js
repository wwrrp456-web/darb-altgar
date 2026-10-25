/* سرعة الوقوف يختارها اللاعب وتُحفظ؛ السفر يحتفظ بإيقاعه. */
const IDLE_SEC_PER_DAY = 35;
const IDLE_SPEED_SECONDS = [35, 15, 7, 3];
const idleSeconds = () => IDLE_SPEED_SECONDS.includes(ui.idleSeconds) ? ui.idleSeconds : IDLE_SEC_PER_DAY;
let manualTimePause=false, clockKey='';
const idleEnabled=()=>!navigator.webdriver||/[?&]idle=1(?:&|$)/.test(location.search);
function clockBlocked(){
  if(!S||!S.learn?.char||coverOn||storyFirst()||document.hidden||fgOpen()||learnNext()||salemOpen||S.awayJob||S.awayReport||document.body.classList.contains('autoplay'))return true;
  return [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,.overlay,#dlg,#react,.backup-panel,.hmenu.show,#alertPanel.show,#hdrop.show')].some(el=>!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
}
function clockState(){if(manualTimePause)return'paused';if(idleEnabled()&&clockBlocked())return'blocked';if(!speed)return'paused';return main().left>0?'travel':'idle';}
function renderClockState(){
 const state=clockState(),labels={paused:'الوقت متوقف',blocked:'الوقت متوقف أثناء القراءة',travel:'القافلة في الطريق',idle:'الوقت يمضي · يوم كل '+idleSeconds()+(idleSeconds()<11?' ثوانٍ':' ثانية')},label=labels[state],n=$('hTimeState');
 if(n){if(n.textContent!==label)n.textContent=label;n.dataset.clock=state;}
 for(const b of document.querySelectorAll('#bPause,#b1,#b2,#hmini [data-act=mspeed]')){b.dataset.clock=state;b.title=label;}
 const choice=$('hIdleSpeed');if(choice&&choice.value!==String(idleSeconds()))choice.value=String(idleSeconds());
 const t=$('hIdle');if(t){t.setAttribute('aria-pressed',String(!ui.idleOff));const text='الوقت يمضي وأنا واقف: '+(ui.idleOff?'متوقف':'يعمل');if(t.textContent!==text)t.textContent=text;}
}
function nextDelay(){
 const m=S&&main();
 if(idleEnabled()&&speed>0&&speed<3&&m&&m.left===0)return idleSeconds()*1000;
 if(speed>=1&&speed<3&&m&&m.left>0&&m.pace&&m.pace.ms)return Math.max(200,Math.round(m.pace.ms*SPEEDS[speed]/SPEEDS[1]));
 return SPEEDS[speed];
}
function glideMs(){const m=S&&main();return speed>=1&&speed<3&&m&&m.left>0&&m.pace?nextDelay():0;}
function schedule(){
 if(idleEnabled()&&clockBlocked()){clearTimeout(timer);timer=null;clockKey='';renderClockState();return;}
 if(idleEnabled()&&!manualTimePause&&!ui.idleOff&&!speed){speed=1;renderHeader();}
 if(!speed){clearTimeout(timer);timer=null;clockKey='';if(idleEnabled())renderClockState();return;}
 const delay=nextDelay(),key=speed+':'+delay;
 if(!timer||clockKey!==key){clearTimeout(timer);clockKey=key;timer=setTimeout(tickLoop,delay);}
 if(idleEnabled())renderClockState();
}
function tickLoop(){timer=null;step();schedule();}
function setSpeed(n){
 if(n&&fgOpen()){try{toast('الوقت متوقف: '+fgWhy());renderDlg();}catch(e){}}
 manualTimePause=n===0;speed=n;clearTimeout(timer);timer=null;clockKey='';schedule();renderHeader();renderAll(true);
}
/* مراقبة فتح وإغلاق النوافذ دون إعادة بدء مهلة اليوم عند كل نقرة. */
if(idleEnabled()){
 new MutationObserver(()=>{if(S)schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 document.addEventListener('visibilitychange',()=>{if(S)schedule();});
}
/* مشاهد عابرة (حتى مشهدين في الرحلة) وشائعة سوق صادقة: عرض فقط، بلا RNG */
const AMB_LAND = ['مرّت بكم قافلة صغيرة في الاتجاه المعاكس، وتبادل الحداة التحية.', 'لاحت من بعيد واحة خضراء، فسقى الطاقم الجمال واستراحوا قليلاً.', 'هبّت ريح باردة مع الغروب فانتعش الطاقم.', 'مرّ راعٍ بقطيعه قرب الدرب وأشار لكم بيده.', 'رأى الدليل آثار قافلة سبقتكم، فاطمأن إلى سلامة الطريق.', 'غنّى أحد الحداة لحناً قديماً يخفف طول الطريق.'];
const AMB_SEA = ['حلّقت طيور بحرية حول السفينة.', 'مرّ بكم مركب صيد صغير، ولوّح الصيادون.', 'عبرت سفينة تجارية في الأفق البعيد.', 'هدأ الموج قليلاً وانتعش البحارة.', 'قفزت أسماك لامعة بجانب السفينة.', 'قرأ الربّان النجوم ليلة أمس وأكد أن الاتجاه سليم.'];
let ambNow = null, ambDone = { k: '', n: [] };
function marketRumor(m) {
  const lst = [];
  S.order.forEach(d => { if (d === m.city || d === m.dest) return; GIDS.forEach(g => { if (GD[g].live || GD[g].sp) return; const r = E.ratio(S.cities[d], g); if (r >= 1.15) lst.push({ d, g, r }); }); });
  if (!lst.length) return null; lst.sort((a, b) => b.r - a.r || (a.d + a.g < b.d + b.g ? -1 : 1));
  const x = lst[(S.day * 7) % Math.min(5, lst.length)]; return 'يتردد بين القوافل أن ' + GD[x.g].name + ' مرتفعة السعر في ' + cityName(x.d) + '.';
}
function ambientAt(m) {
  const key = m.pace.day + ':' + m.dest; if (ambDone.k !== key) ambDone = { k: key, n: [] };
  const T = m.total, slots = T >= 3 ? [Math.max(1, Math.floor(T * 0.35)), Math.floor(T * 0.7)] : T === 2 ? [1] : [], p = m.total - m.left, i = slots.indexOf(p);
  if (i < 0 || ambDone.n.includes(i)) return; ambDone.n.push(i);
  const L = m.sea ? AMB_SEA : AMB_LAND; let t = null;
  if (i === slots.length - 1) t = marketRumor(m);
  ambNow = { t: t || L[(S.day * 7 + m.dest.length) % L.length], rumor: !!t };
  toast(ambNow.t);
}
function shopRevNow() { let t = 0; try { Object.keys(S.player.props).forEach(c => { t += S.player.props[c].rev || 0; (S.player.props[c].shops || []).forEach(sh => (sh.items || []).forEach(i => { t += i.sold || 0; })); }); } catch (e) {} return t; }
function step() {
  if (fgOpen() || idleEnabled() && clockBlocked()) return;
  const m0 = main(), l0 = m0.left;
  const rev0 = shopRevNow(); E.tick(S); backupSnapshot();
  if (speed < 3 && shopRevNow() > rev0) sfx('bell');
  if (l0 > 0 && m0.left > 0 && m0.left < l0 && m0.pace && S.learn && S.learn.char) ambientAt(m0);
  if (m0.left === 0) ambNow = null;
  if (S.pause) { speed = 0; clearTimeout(timer); }
  if (S.day - lastSave >= 5) { persist(); lastSave = S.day; }
  renderAll(false);
}

/* ---------- التوجيه ---------- */
const SCREENS = [['home', '🏠', 'الرئيسية', 1], ['map', '🗺️', 'الخريطة', 1], ['market', '🏪', 'السوق', 1], ['caravan', '🐪', 'القافلة', 1], ['estate', '🏬', 'العقارات', 2], ['lords', '🤝', 'الزعماء', 1], ['empire', '🏛️', 'الإمبراطورية', 2], ['academy', '🎓', 'الأكاديمية', 1], ['cities', '🏙️', 'الدول والدفتر', 1, 'الدول']];
/* موضع التمرير لكل شاشة (ولكل مدينة في السوق): يُستعاد عند الرجوع بالتنقل المعتاد، ويبدأ من الأعلى عند فتح سياق جديد عمداً */
const scrollMem = {}, scrollKey = () => screen + (screen === 'market' ? ':' + sel : '');
const AMB_PORTS = ['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai'], AMB_DESERT = ['riyadh', 'hail', 'mecca', 'medina', 'aswan'];
function ambFor(s) { s = s || screen; return s === 'market' ? (AMB_PORTS.includes(sel) ? 'sea' : AMB_DESERT.includes(sel) ? 'desert' : 'market') : s === 'estate' ? 'quiet' : 'wind'; }
function go(s, keep) {
  closeAssetSale(false);
  closeEarlyQard(false);
  if (s !== screen) { sfx('nav'); try { Sound.ambience(ambFor(s)); } catch (e) {} }
  try { if (screen) scrollMem[scrollKey()] = window.scrollY; } catch (e) {}
  if (rcpt && s !== screen) { rcpt = null; renderReceipt(); }
  if (arr && screen === 'market' && sel === arr.city && s !== 'market') arr = null; // قرأ اللاعب إشعار الوصول وانتقل
  closeResourceMenu();
  if (!SCREENS.some(x => x[0] === s)) s = 'home';
  if (s === 'market' && main().left === 0 && screen !== 'market') sel = main().city;
  if (s === 'estate' && main().left === 0 && screen !== 'estate' && S.cities[main().city]) { estC = S.cities[main().city].country; estCity = main().city; } // العقارات تبدأ بمدينة قافلتك
  screen = s; dg = null; prof = false; if (S.tut) { S.tut.f[s] = true; if (s === 'cities' && ct === 'fx') S.tut.f.fx = true; }
  if (location.hash !== '#' + s) { try { history.pushState(null, '', '#' + s); } catch (e) { location.hash = s; } }
  renderAll(true); const mem = keep ? scrollMem[scrollKey()] : null; window.scrollTo(0, 0); if (mem > 0) requestAnimationFrame(() => window.scrollTo(0, mem));
}
window.addEventListener('popstate', () => { closeResourceMenu(); const h = location.hash.replace('#', ''); if (SCREENS.some(x => x[0] === h)) { screen = h; renderAll(true); } });

