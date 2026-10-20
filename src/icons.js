/* رموز دلالية موحّدة؛ بيانات المحرك والنصوص المحفوظة تبقى نصاً خاماً. */
(function (root) {
'use strict';
const registry = {};
function add(tokens, art) { tokens.split(' ').forEach(token => { registry[token.replace(/\uFE0F/g, '')] = art; }); }
add('🏠', 'nav/home'); add('🗺', 'nav/map'); add('🏪', 'nav/market'); add('🐪', 'map/caravan');
add('🏬', 'nav/estate'); add('🏛 🏯 🗼', 'map/fort'); add('🌍 🏙', 'nav/cities');
add('🕌', 'map/city'); add('🧭', 'map/compass'); add('📦', 'ui/crate');
add('💵', 'ui/usd'); add('🥇', 'ui/goldbar'); add('🥈 🥉 🌟 🎉', 'icons/medal');
add('💰', 'icons/purse'); add('🎓', 'icons/academy'); add('🛡', 'icons/shield'); add('🤝', 'icons/pact');
add('🔒', 'icons/lock'); add('🎁', 'icons/gift'); add('🏦', 'icons/bank'); add('💱', 'icons/exchange');
add('🏭', 'icons/factory'); add('🚚', 'icons/cart'); add('🛒 🧺', 'icons/cart');
add('🧮 🧾 📋 📒 💳 💼', 'icons/ledger'); add('📈', 'icons/scales'); add('⚙ 🔧', 'icons/settings');
add('🔔 🔕', 'icons/bell'); add('📅', 'icons/calendar'); add('👑', 'icons/crown');
add('📜', 'icons/scroll'); add('📖 📘 💡 🔍', 'icons/book'); add('✍', 'icons/quill');
add('⚓', 'icons/anchor'); add('🚢', 'icons/ship'); add('🌹', 'icons/rose'); add('🌴', 'icons/palm');
add('🏞', 'icons/mountain'); add('🏺 🧱', 'icons/tablet'); add('🌱 🌅', 'icons/sprout');
add('👤 🧔 🧓 🧑‍🌾 😊 😔 🤔 😟', 'icons/person'); add('📲', 'icons/install');
add('🎯 🏋 💪', 'icons/target'); add('💬 🗣 📣', 'icons/scroll'); add('🕊 🧿', 'icons/shield');
add('🗝', 'nav/estate'); add('🔑', 'icons/pact'); add('⏳', 'icons/calendar'); add('🪵', 'goods/wood'); add('⛏', 'goods/iron');
add('🛂', 'icons/scroll');
add('👆', 'icons/guide-hand');
add('🐑', 'goods/wool'); add('☁', 'goods/cotton'); add('☕', 'goods/coffee'); add('🪔', 'goods/incense');
add('🦪', 'goods/pearls'); add('🔮', 'goods/glass'); add('🌺', 'goods/saffron'); add('💎', 'goods/turquoise');
add('🌶', 'goods/spice'); add('💠', 'goods/gems'); add('🎀', 'goods/silk'); add('🍵', 'goods/tea');
add('🧴', 'goods/perfume'); add('🧵', 'goods/textile'); add('🧶', 'goods/carpet'); add('💍', 'goods/jewelry');
add('🛠', 'goods/tools'); add('🌾', 'goods/wheat');
add('🐔', 'goods/chicken'); add('🦆', 'goods/duck'); add('🐏', 'goods/sheep'); add('🐐', 'goods/goat'); add('🐄', 'goods/cow'); add('🐃', 'goods/buffalo'); add('🐫', 'goods/camel'); add('🐎', 'goods/horse');
add('🍖', 'goods/meat'); add('🧂', 'goods/salt'); add('🍚', 'goods/rice'); add('🍬', 'goods/sugar'); add('🍯', 'goods/honey'); add('🫒', 'goods/oliveoil'); add('🐟', 'goods/driedfish'); add('👜', 'goods/leather'); add('🧀', 'goods/cheese'); add('🍇', 'goods/raisins'); add('📄', 'goods/paper'); add('🧼', 'goods/soap'); add('🌿', 'goods/herbs'); add('🥩', 'goods/jerky'); add('🥚', 'goods/eggs');
// رموز التحكم صغيرة وواضحة، مرسومة كمتجهات بنفس الذهبي والفيروزي.
const paths = {
 play:'M10 7L22 16 10 25Z', pause:'M10 8H14V24H10ZM19 8H23V24H19Z',
 fast:'M5 8L16 16 5 24ZM17 8L28 16 17 24Z', next:'M5 8L16 16 5 24ZM16 8L26 16 16 24ZM27 8H29V24H27Z',
 check:'M7 16L13 22 25 9', close:'M9 9L23 23M23 9L9 23',
 up:'M8 20L16 12 24 20', down:'M8 12L16 20 24 12', menu:'M7 9H25M7 16H25M7 23H25',
 warning:'M16 6L28 26H4ZM16 12V18M16 22V23', pin:'M16 28C13 23 7 18 7 12A9 9 0 1 1 25 12C25 18 19 23 16 28ZM16 10V15',
 dot:'M11 16A5 5 0 1 0 21 16A5 5 0 1 0 11 16',
 info:'M16 14V24M16 8V9',
 test:'M12 5H20M14 5V13L7 24Q6 27 10 27H22Q26 27 25 24L18 13V5M11 20H21',
 sound:'M7 12H11L17 7V25L11 20H7ZM21 12Q24 16 21 20M24 9Q29 16 24 23', muted:'M7 12H11L17 7V25L11 20H7ZM21 12L28 20M28 12L21 20'
};
const controlTokens = { '🔊':'sound','🔇':'muted','▶':'play','⏸':'pause','⏩':'fast','⏭':'next','✅':'check','✓':'check','✗':'close','✕':'close','⚠':'warning','☰':'menu','⌃':'up','▲':'up','⌄':'down','▼':'down','📍':'pin','🟢':'success','🔴':'danger','⚪':'neutral','⬜':'neutral','🧪':'test','ℹ':'info' };
const controls = {};
for (const [token,id] of Object.entries(controlTokens)) {
 const color = id === 'danger' ? '#ad3828' : id === 'success' ? '#23734e' : id === 'neutral' ? '#8a8473' : '#476b7e';
 const path = paths[id] || paths.dot;
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#f8f3e9" stroke="#9d7a41" stroke-width="1.5"/><path d="${path}" fill="${['play','pause','fast','next','success','danger','neutral'].includes(id) ? color : 'none'}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 controls[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
 registry[token] = '@'+id;
}
// رموز الشريط العلوي: طقم موحّد (ريال/دولار/ذهب/حمولة/يوم/ثروة والتحكم) يحلّ محل المتجهات والرموز القديمة.
Object.assign(registry, { '⏸': 'ui/hud_pause', '▶': 'ui/hud_play', '⏩': 'ui/hud_fast', '⌃': 'ui/hud_collapse', '⌄': 'ui/hud_expand', '🔊': 'ui/hud_sound', '📅': 'ui/hud_day' });
const escaped = Object.keys(registry).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const pattern = new RegExp('(?:'+escaped.join('|')+')\\uFE0F?', 'gu');
const src = key => key[0] === '@' ? controls[key.slice(1)] : (root.ART || {})[key];
const labels = { 'ui/hud_pause':'إيقاف الوقت','ui/hud_play':'تشغيل الوقت','ui/hud_fast':'تسريع الوقت','ui/hud_collapse':'طيّ','ui/hud_expand':'فتح','ui/hud_sound':'الأصوات','ui/hud_day':'اليوم', '@sound':'الأصوات تعمل','@muted':'الأصوات مكتومة','@play':'تشغيل الوقت','@pause':'إيقاف الوقت','@fast':'تسريع الوقت','@next':'السرعة القصوى','@close':'إغلاق','@check':'تم','@up':'طيّ','@down':'فتح','@menu':'القوائم','@warning':'تنبيه','@test':'أدوات العرض','icons/settings':'الإعدادات','icons/bell':'الإشعارات','icons/lock':'مقفل' };
function matches(text) { pattern.lastIndex=0;return [...text.matchAll(pattern)]; }
function paint(container) {
 if (!container || !container.isConnected) return;
 container.querySelectorAll('select').forEach(select=>{
  for(const option of select.options) {
   const found=matches(option.textContent);if(!found.length)continue;
   option.dataset.icon=registry[found[0][0].replace(/\uFE0F/g,'')];
   option.textContent=option.textContent.replace(pattern,'').trim();
  }
  paintSelect(select);
 });
 const walker = document.createTreeWalker(container,NodeFilter.SHOW_TEXT), nodes=[];
 while(walker.nextNode()) {
  const node=walker.currentNode, p=node.parentElement;
  if(!p || p.closest('script,style,noscript,textarea,option,pre,code,.game-icon,.game-icon-svg,[data-keep-symbols]')) continue;
  if(matches(node.nodeValue).length) nodes.push(node);
 }
 for(const node of nodes) {
  if(!node.isConnected) continue;
  const p=node.parentElement;
  // علامات SVG الزخرفية القديمة (الإبل والنخيل والمباني) تُرسم كصور، لا كخط Emoji.
  if(p.namespaceURI==='http://www.w3.org/2000/svg') { paintSvg(p);continue; }
  const text=node.nodeValue, fragment=document.createDocumentFragment();let last=0;
  for(const m of matches(text)) {
   const token=m[0].replace(/\uFE0F/g,''), key=registry[token], url=src(key);if(!url)continue;
   fragment.append(document.createTextNode(text.slice(last,m.index)));
   const wrap=document.createElement('span');wrap.className='game-icon';wrap.dataset.icon=key;wrap.setAttribute('aria-hidden','true');
   if(token==='🔕')wrap.dataset.state='muted';
   const button=p.closest('button');
   if(button && !button.hasAttribute('aria-label') && !button.hasAttribute('title') && !button.textContent.replace(pattern,'').trim()) button.setAttribute('aria-label',labels[key] || 'تفاصيل');
   const img=document.createElement('img');img.src=url;img.alt='';img.draggable=false;
   const original=document.createElement('span');original.className='icon-token';original.textContent=m[0];
   wrap.append(img,original);fragment.append(wrap);last=m.index+m[0].length;
  }
  fragment.append(document.createTextNode(text.slice(last)));node.replaceWith(fragment);
 }
}
function paintSelect(select) {
 const key=select.selectedOptions[0]?.dataset.icon, url=key && src(key);
 let icon=select.previousElementSibling;
 if(!icon?.classList.contains('select-icon')) { if(!url)return;icon=document.createElement('span');icon.className='game-icon select-icon';icon.setAttribute('aria-hidden','true');icon.append(document.createElement('img'));select.before(icon); }
 icon.hidden=!url;
 if(url && icon.dataset.icon!==key) { icon.dataset.icon=key;icon.firstChild.src=url;icon.firstChild.alt='';icon.firstChild.draggable=false; }
}
function paintSvg(text) {
 if(text.tagName!=='text')return;
 const value=text.textContent, found=matches(value);if(!found.length)return;
 const ns='http://www.w3.org/2000/svg', group=document.createElementNS(ns,'g');group.classList.add('game-icon-svg');group.setAttribute('aria-hidden','true');
 const size=parseFloat(text.getAttribute('font-size') || text.parentElement.getAttribute('font-size')) || 16;
 const x=Number(text.getAttribute('x'))||0,y=Number(text.getAttribute('y'))||0;
 let pos=x-(text.getAttribute('text-anchor')==='end' ? size*found.length : text.getAttribute('text-anchor')==='middle' || text.parentElement.getAttribute('text-anchor')==='middle' ? size/2 : 0),last=0;
 for(const m of found) {
  if(m.index>last) { const prefix=document.createElementNS(ns,'text');prefix.setAttribute('x',pos);prefix.setAttribute('y',y);prefix.setAttribute('font-size',size);prefix.textContent=value.slice(last,m.index);group.append(prefix);pos+=size; }
  const key=registry[m[0].replace(/\uFE0F/g,'')], url=src(key);if(!url)continue;
  const img=document.createElementNS(ns,'image');img.setAttribute('href',url);img.setAttribute('x',pos);img.setAttribute('y',y-size*.85);img.setAttribute('width',size);img.setAttribute('height',size);group.append(img);pos+=size;last=m.index+m[0].length;
 }
 const original=text.cloneNode(true);original.classList.add('icon-token');original.style.display='none';group.append(original);text.replaceWith(group);
}
let observer, pending=false;
function start() {
 paint(document.body);
 if(observer)return;
 observer=new MutationObserver(records=>{
  if(pending || !records.some(r=>!r.target.parentElement?.closest('.game-icon,.game-icon-svg') && (r.type==='characterData' || [...r.addedNodes].some(n=>n.nodeType===3 || (n.nodeType===1 && !n.matches('.game-icon,.game-icon-svg'))))))return;
  pending=true;queueMicrotask(()=>{pending=false;paint(document.body);});
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 document.addEventListener('change',ev=>{if(ev.target.tagName==='SELECT')paintSelect(ev.target);});
}
root.GameIcons={registry,controls,paint,start,matches};
})(window);
