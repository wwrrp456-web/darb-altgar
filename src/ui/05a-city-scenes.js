/* أوقات المشهد بصرية فقط؛ لا تغيّر أسعاراً أو تقويماً أو مدة سفر. */
const CITY_TIMES=['dawn','noon','dusk','night'];
function citySceneArt(c,fallbackKey){
  const base=fallbackKey||'city/'+c.id,old=ART[base]||ART['city/'+c.id]||ART['scene/'+c.country];
  const season=E.seasonNow(S),h=season&&E.dateOf(S).h;
  const variant=h?.m===9?'ramadan':h&&((h.m===10&&h.d<=3)||(h.m===12&&h.d>=10&&h.d<=13))?'eid':CITY_TIMES[((Math.floor(S.day)%4)+4)%4];
  const key='city/'+c.id+'_'+variant;
  return {key:ART[key]?key:base,src:ART[key]||old,fallback:old,variant:ART[key]?variant:'original'};
}
function citySceneImage(c,cls,fallbackKey){
  const a=citySceneArt(c,fallbackKey);if(!a.src)return '';
  return `<img class="${cls} city-time-image" data-scene-city="${c.id}" data-scene-variant="${a.variant}" data-art="${a.key}" src="${a.src}" ${a.fallback&&a.fallback!==a.src?`data-fallback="${a.fallback}"`:''} loading="lazy" decoding="async" width="768" height="329" alt="${esc(c.name)}">`;
}
function captureCityImages(){
  return new Map([...$('screen').querySelectorAll('.city-time-image')].filter(im=>im.complete&&im.naturalWidth).map(im=>[im.dataset.sceneCity,im.currentSrc||im.src]));
}
function fadeCityImages(previous){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  $('screen').querySelectorAll('.city-time-image').forEach(im=>{
    const old=previous.get(im.dataset.sceneCity);if(!old||new URL(im.src,location.href).href===old)return;
    const ghost=document.createElement('img');ghost.className='city-fade-previous';ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.src=old;im.before(ghost);
    const cleanup=()=>ghost.remove();
    const start=()=>{if(!im.isConnected||!im.animate)return cleanup();im.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-out'}).finished.then(cleanup,cleanup);};
    if(im.complete&&im.naturalWidth)start();else{im.addEventListener('load',start,{once:true});im.addEventListener('error',cleanup,{once:true});}
  });
}
