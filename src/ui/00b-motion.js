/* عند تغيير تفضيل الجهاز أثناء الحركة، نثبت الموضع النهائي فوراً.
   كتابة الحوار بمؤقتات JavaScript تبقى مستقلة عن حركة العناصر. */
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
motionPreference.addEventListener?.('change', event => {
  if(event.matches && typeof document.getAnimations==='function')for(const animation of document.getAnimations())animation.cancel();
  if(typeof ui!=='undefined')syncHaptics();
});
