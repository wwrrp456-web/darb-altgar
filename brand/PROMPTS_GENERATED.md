# سجل برومتات التسليم الفني

## 2026-10-26 — المجموعة1: شخصيات الفريق

المهمة: docs/CODEX_ART_TODAY.md. المرجع اللوني IDENTITY.md ثم STYLE.md. التوليد بخيار transparent_background=true؛ مراجع الطلبات الأربعة الأولى: brand/img/cutouts/hero/trader.webp وbrand/next/char/citymanager.webp. لم تتغير الصور المرجعية.

السطر المشترك، يُلصق ثم وصف الشخصية حرفياً:

```
Create ONE full-body adult male character asset for the Arabian trade caravan game Darb al-Tujjar. Match the attached approved hand-painted 2D mobile strategy RPG characters: painterly soft shading, crisp readable silhouette, realistic-leaning stylized adult proportions, dignified believable face, not childish, not photorealistic, not 3D rendered. Color identity: ivory #fbf6ed, muted blue #476b7e, subdued gold #b98a43, sand and warm leather. Arabic neatly wrapped turban (imama) only: NO shemagh, ghutra, agal or black headband. Complete head, both hands, feet and all props inside 8 percent empty safe margins. Single standing figure centered, vertical 3:4 composition intended for a 390x520 game cutout. ACTUAL transparent alpha background, no scenery, ground, floor, shadow puddle, glow, vignette, checkerboard or framing. Physical clothes opaque. No writing, letters, numbers, text, logos, symbols of religion or politics, or watermark. Hands anatomically natural, five fingers when visible. 
```

### property_manager

```
An experienced property manager, early forties, short neat dark beard, medium build. Modest ivory tunic and a muted slate blue sleeveless vest with a narrow simple brass-gold trim, neatly wrapped ivory turban and leather sandals. Calm attentive expression. Hold ONE small closed plain brown leather account book securely against his ribs with his left arm; right hand rests naturally at waist with thumb tucked into a plain leather belt. No coin bag. Clearly competent but visually below the steward and agent; restrained inexpensive textiles.
```

### regional_steward

```
A distinguished regional steward, late fifties, upright tall posture, salt-and-pepper beard, thoughtful authoritative eyes and a restrained reassuring smile. Ivory ankle-length robe, medium-blue outer coat with modest elegant muted gold edging, neatly wrapped sand turban, quality plain leather slippers. Holds a large CLOSED plain brown leather ledger naturally against his left chest. Right arm rests loosely at his side, hand relaxed. Mature charisma and a sense of responsibility, higher rank than a property manager, no ceremonial ruler costume, no crown, no religious or state iconography.
```

### regional_agent

```
A senior regional trade agent, early sixties, tall dignified merchant executive with neat silver beard and confident calm expression, no exaggerated age. Finely woven ivory robe, layered muted midnight-blue long cloak with restrained embroidered gold edging, neatly wrapped ivory turban with a subtle blue fabric fold, polished brown leather footwear. Right hand rests over his chest in a poised greeting with natural fingers; left arm securely carries a closed plain leather folio. Richer fabric and more refined silhouette than the steward while remaining a working merchant, no throne, medals, crown, religious or political emblems.
```

### factory_worker

```
A skilled craft workshop worker in his thirties, sturdy average adult build, short dark beard, neatly wrapped sand turban. Rolled ivory sleeves, simple muted blue waistcoat beneath a worn brown leather apron, loose sand trousers and practical brown leather shoes. Holds a small traditional wooden-handled metal hammer in his lowered right hand with a clear natural grip, left hand rests naturally on the apron waist. Copper and leather craft details, no modern helmet, goggles, machinery, industrial uniform or weapons. Friendly composed professional, lower social rank than the managers, not a young boy.
```

### farmer — طلب تصحيح مرجع العامل الزراعي

استُبعد مرجع worker القديم للمزارع بسبب عصابة الرأس والعمر الظاهر؛ لم يُعلَن رفض الأصل القديم لجميع استعمالاته. المراجع: brand/next/char/worker.webp والصورة الخام الناتجة لعامل المصنع. البرومت الكامل:

```
Create ONE full-body adult male FARMER for Darb al-Tujjar, a hand-painted 2D Arabian trade-caravan strategy RPG. The first image is an older farm worker concept to improve: retain the clear useful idea of a produce crate, but make the man clearly 35-40 years old, sturdy and experienced with a short neat dark beard, dignified friendly expression, realistic-leaning stylized adult proportions matching the SECOND reference's craft worker. Replace the cloth forehead band completely with a neatly wrapped SAND ARAB TURBAN (imama), no shemagh, ghutra or agal, and no bare headband. Ivory rolled sleeves, a simple muted slate-blue cloth apron, loose sand trousers and practical brown leather shoes, visibly lower rank than managers. Carry one plain wooden crate containing wheat ears and a few fresh vegetables at his waist, both hands gripping the crate naturally with anatomically correct fingers. No writing or labels on the crate. Premium painterly soft shading, crisp silhouettes, muted blue #476b7e, ivory #fbf6ed, warm sand and brown leather, restrained lighting. Complete head, both hands and both feet fully inside generous safe margins. Centered vertical 3:4 standing figure, intended for a 390x520 cutout. ACTUAL TRANSPARENT ALPHA background, no ground, floor, drop shadow puddle, haze, checkerboard, backdrop or framing. Clothing opaque. No text, letters, numbers, logos, watermark, religious or political symbols. Not childish, not photographic, not 3D.
```

### shepherd — إعادة استعمال

أعيد تجهيز brand/next/char/herder.webp؛ مطابق للأسلوب والعمامة، دون استدعاء توليد مكرر. اقتصر التجهيز على هوامش شفافة وتوحيد390×520وتصديرWebP. لا إزالة خلفيات لونية أو تغيير الرسم.

### المراجعة والتسليم

5صور مولدة جديدة و1موجودة أعيد تجهيزها. الصور6بلا نص وبقناةalphaفعلية، وفُحصت الوجوه والأيدي والأطراف علىالعاجي والأزرق. سجل القياسbrand/next/chars/QA.json، ومعاينتاpreview-light.jpgوpreview-dark.jpgخلفيتان مركبتان للمراجعة فقط؛ أصولWebPشفافة. مقياس شبه المعتمalpha>=250يطابقalpha253الشائع في المراجع والمخرجات، والخلفية0تماماً. المقاس النهائي390×520وهوامش آمنة. status=readyيعني جاهزاً للدمج الفني، لا تفعيل الرتبة4فياللعبة.

