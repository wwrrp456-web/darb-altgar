/* اختياري: لا اهتزاز قبل تفعيل اللاعب، ولا عند طلب تقليل الحركة. */
const HAPTIC_BUYS = new Set(['buy','buysex','buyherd','agent','buyship','buyshop','buycraft','buystud','buymount','buypack','buypackmax','cart','cartc','buildfarm','factory','buildbutcher','bshop','bwh']);
function hapticPulse(kind) {
  if (!ui.haptics || typeof navigator.vibrate !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { navigator.vibrate(kind === 'critical' ? [20, 35, 20] : 10); } catch (e) {}
}
function hapticAfterAction(result, action) {
  if (!result || result.ok !== true) return;
  if (HAPTIC_BUYS.has(action) || result.pl >= 1000) hapticPulse('trade');
}
function syncHaptics() {
  const b=$('hHaptics');if(!b)return;
  const available=typeof navigator.vibrate==='function',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.disabled=!available;b.setAttribute('aria-pressed',String(!!ui.haptics&&available));
  const text='اهتزاز خفيف: '+(!available?'غير متاح على هذا الجهاز':ui.haptics?(reduced?'موقوف بتقليل الحركة':'يعمل'):'متوقف');
  if(b.textContent!==text)b.textContent=text;
}
