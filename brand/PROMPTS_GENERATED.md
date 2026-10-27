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


## المجموعة 2 — درجات المرافق — 2026-10-27

مرجع مرئي: brand/img/scene/shop.webp؛ 5 لوحات 2×2، فصلت تقنياً إلى 19 أصلاً 640×360. الخلية الفارغة الأخيرة غير مسلّمة. البرومت المشترك ثم وصف كل لوحة أدناه.

```text
Create a professional production asset sheet for Darb al-Tujjar, a hand-painted Arabian caravan trade strategy game. LANDSCAPE 16:9 canvas divided EXACTLY into 2 columns and 2 rows of equal rectangular panels, no gutters, no borders or panel labels; each panel is a separate complete 16:9 environment illustration. Keep important content away from panel edges and central seams. Match the attached approved in-game painterly shop reference: hand-painted 2D soft shading, clear warm timber and mud-brick architecture, crisp readable silhouettes, mature premium mobile strategy art, NOT 3D, NOT photorealistic or childish. Warm ivory sand, muted slate blue #476b7e cloth and shaded wood, subdued gold #b98a43 accents, balanced daylight; avoid dark green backgrounds. No people or animals in this sheet; facility architecture and merchandise only. No electricity or modern machinery. No text, letters, numbers, writing, logos, political or religious symbols anywhere. Do not put signs above shops. Maintain consistent eye-level three-quarter camera, daylight, building geometry and framing across each level pair. Fill each panel with an opaque complete painted scene, not a transparent cutout. 
```

### retail
```text
TOP LEFT: humble small single wooden market stall under a simple sand cloth awning, a few date baskets and cloth rolls. TOP RIGHT: same stall developed into a small single-room mud-brick storefront, blue cloth awning, tidy counter with baskets and two shelves, modest stock. BOTTOM LEFT: same shop further upgraded, wider well-maintained wooden frontage, elegant muted blue awning and wooden shelves filled with trade goods, carved trim, same humble location now prosperous. BOTTOM RIGHT: empty mud-brick warehouse interior, open wooden door, intact bare shelves and swept floor, just two empty wooden pallets; bright readable doorway light, no goods.
```

### farm
```text
TOP LEFT: full well-organized mud-brick warehouse interior with open wooden door, neat wooden shelves loaded with grain sacks, wooden crates, folded textiles and barrels; clear central walking aisle. TOP RIGHT: humble Arabian oasis farm level one, small mud-brick hut left, short wooden fenced empty pen right, two palms and a small cultivated patch; no livestock. BOTTOM LEFT: same oasis farm same viewpoint level two: repaired larger hut left, expanded sturdy fence right, covered trough and more planted rows, palms and simple stone well; no livestock. BOTTOM RIGHT: same farm level three same layout and viewpoint, handsome expanded mud-brick farmstead left, larger well-maintained pens with shaded shelter right, lush organized crop rows, palm grove and clear water channel; no livestock. Farm progression should be immediately clear at thumbnail size, not a completely different location.
```

### perfume_textile
```text
TOP LEFT: small traditional perfume workshop seen from open front, copper alembic still, roses in baskets, plain unlabelled glass perfume bottles on simple bench, mud brick walls. TOP RIGHT: same perfume workshop upgraded with larger copper distillation equipment, orderly extra wooden shelves of unlabelled bottles and blossom baskets, refined blue arch details. BOTTOM LEFT: small traditional textile weaving workshop, a single wooden loom with unpatterned ivory-and-blue fabric on it, wool and cotton baskets, simple mud brick room. BOTTOM RIGHT: same textile workshop upgraded with two well-crafted wooden looms and neatly stored bolts of plain woven textiles, wider open-front workshop with muted blue trim. Keep pair architecture/camera recognizably same, factories readable by distinctive equipment.
```

### carpet_jewelry
```text
TOP LEFT: small carpet weaving workshop open front, vertical wooden carpet loom holding a geometric blue and ochre rug, yarn skeins in baskets, no textlike ornament. TOP RIGHT: same carpet workshop upgraded, larger matching vertical rug looms, more ornate geometric carpets and tidy yarn shelves, broader stone-and-timber frontage. BOTTOM LEFT: small goldsmith jewelry workshop, simple wooden bench, brass balance, hand tools, small gold bracelets and gem trays, mud brick walls and plain blue cloth. BOTTOM RIGHT: same jewelry workshop upgraded, polished wooden workbenches, orderly gem trays, more elaborate necklaces displayed on simple stands, refined blue and gold arch trim. No humans, no body shaped mannequins. Jewelry must be identifiable as finished necklaces and bracelets, no floating icons. Same camera for pairs.
```

### tools_butcher
```text
TOP LEFT: small traditional hand-tool forge open front, stone charcoal hearth with contained warm glow, wooden-handled hammers, iron hoes and simple anvil, no weapons. TOP RIGHT: same forge upgraded with sturdy stone hearth, larger anvil, orderly racks of agricultural hand tools and workbenches, same camera and recognizable layout. BOTTOM LEFT: clean welcoming traditional butcher stall without people, sand mud-brick shop with muted blue and ivory awning, plain wooden counter, wrapped pale cloth food parcels and a few neatly displayed cuts of meat on trays, brass scale; family friendly, NO blood, gore, carcasses or heads, no religious architecture. BOTTOM RIGHT: a completely plain warm ivory color blank panel, no objects. It is unused, do not invent a fourth scene.
```

مراجعة ذاتية: الأسلوب والدرجات واضحة، بلا نص ظاهر. تحويل WebP جودة88، alpha غير مطلوبة للمشاهد. لا تعديل لمصدر اللعبة أو صورها الأصلية.

## المجموعة 3 — المكتب والحصالة — 2026-10-27

مرجع: brand/img/ui/crate.webp. توليد8أيقونات، وإعادة تجهيز3: تقرير الغياب منicons/scroll، التعبئة منui/crate، الفرصة منnext/ui/exclusive.
```text
Production asset sheet: EXACTLY 8 independent game icons in an even 4 columns by 2 rows grid, landscape 2:1 canvas. Each subject centered in its own square cell with at least 15% transparent margin all around, NO touching adjacent cells. ACTUAL TRANSPARENT ALPHA BACKGROUND everywhere outside the physical objects; no painted white/black background or checkerboard, no ground plane, no glow, no drop shadow. Match attached reference hand-painted 2D Arabian trade strategy game item art, soft painterly shading, crisp outlines and readable simple silhouettes at 128px. Ivory parchment, sand and warm brown timber/leather, muted slate blue #476b7e, subdued gold #b98a43; no dark green. NO text, letters, digits, labels, money symbols, logos, watermarks or religious/political symbols. No people or hands. Cells left to right top to bottom: TOP1 a small wooden office writing desk with a closed plain muted blue ledger and feather quill, desk completely visible. TOP2 small nearly empty open leather coin pouch with only TWO plain gold coins beside it, suggests low cash; no arrows or warning mark. TOP3 EMPTY savings chest: small traditional wooden merchant coffer with plain brass corners, hinged lid standing open, cutaway low front lip showing the completely EMPTY wooden interior. TOP4 the EXACT SAME open chest same size/angle, with a LOW single layer of plain gold coins filling one quarter of interior depth. BOTTOM1 SAME chest filled HALF depth with plain gold coins. BOTTOM2 SAME chest filled THREE QUARTERS of depth, higher pile of coins. BOTTOM3 SAME chest filled TO THE BRIM with coins, no spilled coins. BOTTOM4 a dignified generic rank badge: three ascending layered subdued gold chevrons mounted on muted blue cloth diamond-shaped backing, no crown, no naval anchor or symbols. The five chests must share IDENTICAL exterior design, footprint, camera angle, lid position, lighting, only coin height increases progressively; do not change chest size. All physical objects are opaque. Keep complete subjects within cells.

```
تصدير128×128بهوامش9pxعلى الأقل وبشفافية فعلية، دون حذف خلفية لونية. المراجعة على خلفيتين، QA.json للبصمات والأبعاد.

## المجموعة 4 — المحاصيل — 2026-10-27

27أصلاً جديداً192×192؛ مرجعا القمح ومزرعة المستوى2. ثلاث لوحات فُصلت بحدود تكيفية للرسم، لا بافتراض خلايا متطابقة رغم طلبها في البرومت. لا تعديل للرسم أو حذف خلفيات لونية؛ alpha الأصلية محفوظة.
```text
Production art sheet of independent crop icons for Darb al-Tujjar, hand-painted 2D Arabian trade strategy RPG item art, same soft painterly shading and crisp clean silhouettes as the attached wheat and farm references. Mature premium strategy style, not childish, not photos or 3D. Muted natural green plants, warm sand soil, ivory, slate blue #476b7e cloth ties and restrained gold harvest. ACTUAL TRANSPARENT ALPHA background, no solid backdrop, no checkerboard, no floor or shadow puddle, no grid lines or borders. Objects opaque. No text, digits, letters, labels, arrows, stage numbers, logos, religious or political symbols. No people, hands or animals. Each object entirely inside its own cell with at least 12% transparent margin, do not bleed into neighboring cells. EXACT regular grid and equal cells. Stages within a row have same scale of soil base and recognizably same crop, with strong visual progression. 
```

### grain_rice_palms
```text
Landscape 4:3 canvas, EXACT 4 columns x 3 rows =12 icons, each cell square. Read LEFT TO RIGHT per row as SEED, GROWING, RIPE, HARVESTED. ROW1 grains: first a small isolated brown soil patch with several golden grain seeds and two tiny shoots; second same patch with young green wheat/barley blades; third mature golden wheat/barley ears and one small corn cob among them on same patch; fourth a harvested tied sheaf of golden wheat and barley with one corn cob, no soil. ROW2 rice: first small dark wet soil patch with pale rice seeds and tiny shoots; second green rice shoots in same wet soil patch; third ripe drooping golden rice panicles growing from same patch; fourth harvested rice panicles tied as a bundle with a small shallow woven basket of white rice grains. Water stays INSIDE tiny soil patch not a background. ROW3 date palms: first tiny sandy patch with date pits and a tiny sprouting palm seedling; second small young palm with simple fan leaves on same patch; third a short adult date palm with clearly visible ripe amber date clusters hanging under crown, contained fully within cell; fourth a shallow woven basket of harvested ripe dates with one cut palm frond. No isolated tall tree clipped by panel edge.
```

### cane_orchard_vegetables
```text
Landscape 4:3 canvas, EXACT 4 columns x 3 rows =12 icons, each cell square. LEFT TO RIGHT in each row: SEED, GROWING, RIPE, HARVESTED. ROW1 sugar cane AND cotton family, show both together in every stage: first sandy soil patch with small cotton seeds and short cane planting cuttings; second same patch with small green cane stalks and a young cotton plant; third same patch with mature jointed cane stalks and white cotton bolls on shrub, entire plants inside margins; fourth harvested tied short sugar-cane segments beside fluffy white cotton in a shallow woven basket. ROW2 vines AND orchards family: first small soil patch with grape seeds and a tiny fruit sapling; second young grape vine on a small wooden trellis beside young orchard sapling on same patch; third a compact grape vine bearing purple grape clusters next to a small leafy orchard branch bearing ripe apples on same patch; fourth woven harvest basket holding grapes and apples with a couple green leaves, no soil. ROW3 vegetables family: first small soil patch with tiny vegetable seeds and two small shoots; second same patch with young green leafy vegetable plants; third mature tomato plant with red tomatoes next to leafy carrot tops on same patch, entire plant visible; fourth harvested carrots and tomatoes in a shallow wicker basket, no soil.
```

### tools
```text
ULTRAWIDE 3:1 canvas, EXACTLY 3 columns x 1 row, THREE icons in square cells. LEFT: isolated small isometric rectangular patch of freshly plowed brown soil, four clear parallel furrows, complete rectangular earth slab visible with no scenery. CENTER: small traditional round stone irrigation well with simple wooden crossbeam, rope and wooden bucket, complete object visible, tiny blue water visible inside well opening, no surrounding field or ground shadow. RIGHT: a single curved iron harvesting sickle with a simple wooden handle, diagonally posed with complete blade and handle inside margins, no crossed weapons, no person or hand.
```
