/* أوضاع قوافل القادة المستأجرين: بمسار، حرّ (يتاجر بنفسه وتنتظر الدخل)، راحة (أيام بنصف أجر ومعنويات تتعافى أسرع)، متوقف */
const CAP_REST = { min: 2, max: 10, def: 5, wage: 0.5, morale: 12 };
Object.assign(A, {
  captainMode(S, carId, mode, days) {
    const car = carById(S, carId); if (!car || !car.captain || car.main) return NO('هذا لقوافل يقودها قائد مستأجر');
    if (mode === 'free') { car.free = true; car.route = null; car.restUntil = 0; car.waiting = null; return OK('صار ' + car.name + ' يتاجر بحرية: يختار أفضل صفقة بنفسه ويصلك دخله، وتدفع أجره اليومي.'); }
    if (mode === 'rest') {
      if (car.left > 0) return NO('ينتظر وصول القافلة أولاً لتُريحه'); const n = Math.max(CAP_REST.min, Math.min(CAP_REST.max, Math.round(days || CAP_REST.def)));
      car.restUntil = S.day + n; return OK('أرحتَ قائد ' + car.name + ' ' + n + ' أيام بنصف أجر، وتتعافى معنوياته أسرع، ثم يعود إلى عمله السابق.');
    }
    if (mode === 'stop') { car.route = null; car.free = false; car.restUntil = 0; car.waiting = null; return OK('أوقفتَ ' + car.name + ': يقف في مكانه (وأجره يخفّ إلى الربع).'); }
    return NO('وضع غير معروف');
  },
});
