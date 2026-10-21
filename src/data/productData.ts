export type FinishId = 'matte-black' | 'bone-white' | 'signal-orange';

export interface FinishConfig {
  id: FinishId;
  name: string;
  code: string;
  tagline: string;
  cupHex: string;
  cupRoughness: number;
  cupMetalness: number;
  cushionHex: string;
  cushionRoughness: number;
  yokeHex: string;
  yokeMetalness: number;
  yokeRoughness: number;
  dialAccentHex: string;
  swatchHex: string;
  price: number;
  inStock: string;
}

export interface AssemblyPart {
  index: number;
  stepCode: string;
  id: string;
  name: string;
  materialSpec: string;
  toleranceSpec: string;
  weightGrams: number;
  replacementSku: string;
  replacementPrice: number;
  description: string;
  explodeVector: [number, number, number];
  explodeRotation: [number, number, number];
  cameraFocusPos: [number, number, number];
  cameraLookAt: [number, number, number];
}

export interface SpecRow {
  code: string;
  category: string;
  label: string;
  value: string;
  note: string;
}

export interface GalleryItem {
  id: string;
  indexCode: string;
  location: string;
  coordinates: string;
  caption: string;
  technicalNote: string;
  unsplashUrl: string;
  aspectClass: string;
  sceneTheme: 'berlin-console' | 'osaka-cnc' | 'tokyo-bar' | 'rotterdam-bench';
}

export interface ReviewItem {
  id: string;
  indexCode: string;
  author: string;
  role: string;
  city: string;
  hoursLogged: number;
  finishOwned: string;
  headline: string;
  body: string;
  criticalNote: string;
  ratingNumeric: string;
}

export interface CartItem {
  id: string;
  name: string;
  finishName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  swatchHex: string;
  isAccessory?: boolean;
}

export const PRODUCT_CONSTANTS = {
  BRAND: 'STUDIO KINETIC',
  MODEL: 'AURA ONE',
  ORIGIN_STAMP: 'EST. 2026 — OSAKA / BERLIN',
  BASE_PRICE: 349,
  SPARE_CUSHION_PRICE: 29,
  WEIGHT_GRAMS: 254,
  BATTERY_HOURS: 40,
  DRIVER_MM: 40,
  BLUETOOTH_VERSION: '5.4',
  WARRANTY_YEARS: 3,
  PARTS_GUARANTEE_YEARS: 10,
  SHIPPING_NOTE: 'Ships in 5–7 days from Rotterdam',
} as const;

export const FINISHES: Record<FinishId, FinishConfig> = {
  'matte-black': {
    id: 'matte-black',
    name: 'Matte Black',
    code: 'SK-A1-BLK',
    tagline: 'Bead-blasted Type III hard-anodized obsidian shell with charcoal lambskin pads.',
    cupHex: '#181818',
    cupRoughness: 0.62,
    cupMetalness: 0.45,
    cushionHex: '#121212',
    cushionRoughness: 0.85,
    yokeHex: '#2C2C2A',
    yokeMetalness: 0.88,
    yokeRoughness: 0.24,
    dialAccentHex: '#FF4D00',
    swatchHex: '#181818',
    price: 349,
    inStock: 'SHIPS IN 5–7 DAYS FROM ROTTERDAM',
  },
  'bone-white': {
    id: 'bone-white',
    name: 'Bone White',
    code: 'SK-A1-BNE',
    tagline: 'Micro-ceramic warm chalk coating over raw 6061-T6 aluminium with stone lambskin pads.',
    cupHex: '#ECE7DF',
    cupRoughness: 0.48,
    cupMetalness: 0.22,
    cushionHex: '#D8D2C7',
    cushionRoughness: 0.82,
    yokeHex: '#B5B2AA',
    yokeMetalness: 0.9,
    yokeRoughness: 0.2,
    dialAccentHex: '#FF4D00',
    swatchHex: '#ECE7DF',
    price: 349,
    inStock: 'SHIPS IN 5–7 DAYS FROM ROTTERDAM',
  },
  'signal-orange': {
    id: 'signal-orange',
    name: 'Signal Orange',
    code: 'SK-A1-ORG',
    tagline: 'RAL 2005 International Signal Orange anodized cup housings with matte obsidian cushions.',
    cupHex: '#FF4D00',
    cupRoughness: 0.38,
    cupMetalness: 0.35,
    cushionHex: '#161616',
    cushionRoughness: 0.86,
    yokeHex: '#262624',
    yokeMetalness: 0.9,
    yokeRoughness: 0.22,
    dialAccentHex: '#ECE7DF',
    swatchHex: '#FF4D00',
    price: 349,
    inStock: 'SHIPS IN 5–7 DAYS FROM ROTTERDAM',
  },
};

export const FINISH_LIST: FinishConfig[] = [
  FINISHES['matte-black'],
  FINISHES['bone-white'],
  FINISHES['signal-orange'],
];

export const ASSEMBLY_PARTS: AssemblyPart[] = [
  {
    index: 0,
    stepCode: '01 / 07',
    id: 'cnc-yoke',
    name: 'CNC aluminium yoke',
    materialSpec: '5-Axis Milled 6061-T6 Aerospace Aluminium',
    toleranceSpec: '±0.015mm Axial Runout',
    weightGrams: 38,
    replacementSku: 'SK-PRT-01',
    replacementPrice: 34,
    description:
      'Machined from a single billet in Osaka. Uses a phosphor-bronze friction sleeve instead of plastic ratchets, eliminating creaks after 10,000 adjustment cycles.',
    explodeVector: [-0.36, 0.20, 0.16],
    explodeRotation: [0.06, -0.14, 0.06],
    cameraFocusPos: [-0.65, 0.25, 4.35],
    cameraLookAt: [-0.35, 0.05, 0],
  },
  {
    index: 1,
    stepCode: '02 / 07',
    id: 'lambskin-cushion',
    name: 'Memory-foam lambskin cushion',
    materialSpec: 'Full-Grain Aniline Lambskin + 42kg/m³ Viscoelastic Foam',
    toleranceSpec: 'Magnetic 4-Lug Bayonet Mount',
    weightGrams: 44,
    replacementSku: 'SK-PRT-02',
    replacementPrice: 29,
    description:
      'No glue, no prying clips. Four neodymium alignment lugs snap the cushion onto the acoustic baffle with an audible mechanical click in under three seconds.',
    explodeVector: [0.24, -0.14, 0.42],
    explodeRotation: [0.04, 0.20, -0.03],
    cameraFocusPos: [0.55, -0.18, 4.25],
    cameraLookAt: [0.2, -0.2, 0.15],
  },
  {
    index: 2,
    stepCode: '03 / 07',
    id: 'biocellulose-driver',
    name: '40mm biocellulose driver',
    materialSpec: 'Acetobacter Grown Bacterial Cellulose Dome + N52 Magnet',
    toleranceSpec: '6Hz–38kHz (±0.5dB L/R Matched)',
    weightGrams: 52,
    replacementSku: 'SK-PRT-03',
    replacementPrice: 58,
    description:
      'Cultivated over 14 days for the stiffness of titanium with the internal damping of paper. Delivers transient attack without upper-midrange metallic ringing.',
    explodeVector: [-0.28, -0.12, 0.32],
    explodeRotation: [-0.06, 0.16, 0.08],
    cameraFocusPos: [-0.55, -0.22, 4.15],
    cameraLookAt: [-0.25, -0.25, 0.08],
  },
  {
    index: 3,
    stepCode: '04 / 07',
    id: 'anodized-cup',
    name: 'Machined anodized ear cup',
    materialSpec: 'Bead-Blasted Aluminium Acoustic Chamber + Dual Helmholtz Ports',
    toleranceSpec: '1.8mm Wall Thickness',
    weightGrams: 64,
    replacementSku: 'SK-PRT-04',
    replacementPrice: 45,
    description:
      'Lathed aluminum shells reject standing waves that plague injection-molded plastic enclosures. Three exposed Torx T6 screws grant full access to the battery bay.',
    explodeVector: [0.44, -0.14, -0.18],
    explodeRotation: [0.05, -0.16, -0.06],
    cameraFocusPos: [0.85, -0.22, 4.35],
    cameraLookAt: [0.38, -0.25, -0.05],
  },
  {
    index: 4,
    stepCode: '05 / 07',
    id: 'knurled-dial',
    name: 'Knurled gain & ANC dial',
    materialSpec: '316L Stainless Steel Optical Rotary Encoder',
    toleranceSpec: '24 Mechanical Detents / Rev',
    weightGrams: 14,
    replacementSku: 'SK-PRT-05',
    replacementPrice: 19,
    description:
      'Zero touch-capacitive swipe guesswork in the rain or with gloves. Rotate for 0.5dB stepped attenuation; press once to cycle Hybrid ANC, Transparency, or Pure Passive.',
    explodeVector: [0.52, -0.26, 0.28],
    explodeRotation: [0.16, 0.14, 0.12],
    cameraFocusPos: [0.95, -0.42, 4.05],
    cameraLookAt: [0.48, -0.42, 0.12],
  },
  {
    index: 5,
    stepCode: '06 / 07',
    id: 'spring-steel-headband',
    name: 'Spring-steel headband core',
    materialSpec: 'Sandvik Hardened Spring Steel + Medical-Grade Silicone',
    toleranceSpec: '3.2N Calibrated Clamping Force',
    weightGrams: 30,
    replacementSku: 'SK-PRT-06',
    replacementPrice: 32,
    description:
      'Calibrated to distribute 254 grams evenly across the cranial crown without temple pinch. The compression-molded silicone underside unzips via a hidden spline.',
    explodeVector: [0, 0.30, -0.12],
    explodeRotation: [-0.08, 0, 0],
    cameraFocusPos: [0, 0.65, 4.45],
    cameraLookAt: [0, 0.35, 0],
  },
  {
    index: 6,
    stepCode: '07 / 07',
    id: 'pogo-contact-ring',
    name: 'Gold-plated pogo contact ring',
    materialSpec: '24K Gold-Over-Nickel Spring Contacts + FR4 Isolator',
    toleranceSpec: '< 8 Milliohm Contact Resistance',
    weightGrams: 12,
    replacementSku: 'SK-PRT-07',
    replacementPrice: 22,
    description:
      'Eliminates fragile internal ribbon cables. Both the 820mAh LiFePO4 battery cell and the 40mm driver module seat onto spring-loaded gold pogo pins.',
    explodeVector: [0, -0.30, -0.28],
    explodeRotation: [0.12, -0.10, 0.04],
    cameraFocusPos: [0.18, -0.42, 4.25],
    cameraLookAt: [0, -0.28, -0.1],
  },
];

export const TECHNICAL_SPECS: SpecRow[] = [
  {
    code: 'SPEC_01',
    category: 'CHASSIS',
    label: 'Total Weight',
    value: '254g',
    note: 'Without cable; balanced 50/50 L-R distribution',
  },
  {
    code: 'SPEC_02',
    category: 'TRANSDUCER',
    label: 'Driver Architecture',
    value: '40mm Biocellulose',
    note: 'N52 neodymium magnet, CCAW voice coil',
  },
  {
    code: 'SPEC_03',
    category: 'ACOUSTICS',
    label: 'Frequency Response',
    value: '6Hz–38kHz',
    note: 'Tuned flat 200Hz–4kHz, +3dB sub-bass shelf below 60Hz',
  },
  {
    code: 'SPEC_04',
    category: 'WIRELESS',
    label: 'Bluetooth Core',
    value: 'Bluetooth 5.4',
    note: 'Multipoint dual-host connection + USB-C 24-bit/96kHz DAC',
  },
  {
    code: 'SPEC_05',
    category: 'CODECS',
    label: 'Supported Codecs',
    value: 'LDAC / AAC / SBC',
    note: 'Up to 990 kbps bit-perfect wireless transmission',
  },
  {
    code: 'SPEC_06',
    category: 'POWER',
    label: 'Battery Autonomy',
    value: '40h (ANC on)',
    note: '54h with ANC off; user-replaceable 820mAh module (2 screws)',
  },
  {
    code: 'SPEC_07',
    category: 'CHARGING',
    label: 'Rapid Replenish',
    value: '10 min = 5h',
    note: 'USB-C PD compatible; 0–100% full charge in 55 minutes',
  },
  {
    code: 'SPEC_08',
    category: 'LONGEVITY',
    label: 'Warranty & Spares',
    value: '3 Years + 10-Yr Parts',
    note: '3-year full coverage; 10-year guaranteed spare part availability',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-01',
    indexCode: 'FIG. 05.1',
    location: 'FUNKHAUS MASTERING ROOM B — BERLIN',
    coordinates: '52.4796° N, 13.5003° E',
    caption: 'AURA ONE Serial #0014 on the Studer A800 bridge during vinyl lacquer reference checks.',
    technicalNote: 'USB-C lossless DAC bypass engaged · 24-bit / 96kHz PCM',
    unsplashUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85',
    aspectClass: 'md:col-span-7 aspect-[16/10]',
    sceneTheme: 'berlin-console',
  },
  {
    id: 'gal-02',
    indexCode: 'FIG. 05.2',
    location: 'HIGASHI-OSAKA CNC MILLING CELL — OSAKA',
    coordinates: '34.6784° N, 135.6009° E',
    caption: 'Post-anodizing inspection of 6061-T6 aluminium yokes and 316L knurled encoder dials.',
    technicalNote: 'Mitutoyo micrometer verification · ±0.015mm tolerance pass',
    unsplashUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85',
    aspectClass: 'md:col-span-5 aspect-[4/3]',
    sceneTheme: 'osaka-cnc',
  },
  {
    id: 'gal-03',
    indexCode: 'FIG. 05.3',
    location: 'BAR MARTHA LISTENING BOOTH — NAKAMEGURO, TOKYO',
    coordinates: '35.6443° N, 139.6991° E',
    caption: 'Late-night A/B acoustic isolation testing against ambient 78dB room floor in Bone White finish.',
    technicalNote: 'Hybrid 4-mic feedforward/feedback ANC · -38dB attenuation',
    unsplashUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=85',
    aspectClass: 'md:col-span-5 aspect-[4/3]',
    sceneTheme: 'tokyo-bar',
  },
  {
    id: 'gal-04',
    indexCode: 'FIG. 05.4',
    location: 'KEILEWERF BENCH 04 — ROTTERDAM',
    coordinates: '51.9089° N, 4.4307° E',
    caption: 'Complete field-strip into 7 modular sub-assemblies using only the included Torx T6 L-key.',
    technicalNote: 'Average teardown time: 3 min 40 sec · Zero adhesive joints',
    unsplashUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85',
    aspectClass: 'md:col-span-7 aspect-[16/10]',
    sceneTheme: 'rotterdam-bench',
  },
];

export const REVIEWS: ReviewItem[] = [
  {
    id: 'rev-01',
    indexCode: 'LOG_06.1',
    author: 'Henrik Lindqvist',
    role: 'Mastering Engineer, Svenska Grammofonstudion',
    city: 'Gothenburg, SE',
    hoursLogged: 410,
    finishOwned: 'Matte Black (SK-A1-BLK)',
    headline: 'Flat enough to check reverb tails at 2 a.m., honest about bad mixes.',
    body: 'Most wireless ANC cans scoop 800Hz and hype 8kHz to fake detail. AURA ONE keeps the 300Hz–3kHz vocal pocket dead neutral. When I plug in via USB-C, the internal DAC bypasses Bluetooth compression cleanly.',
    criticalNote: 'Critical note: Clamping force out of the box is firm at 3.2N—it took about four days of wearing them over thick acetate glasses frames before the spring-steel headband relaxed slightly.',
    ratingNumeric: '4.7 / 5.0',
  },
  {
    id: 'rev-02',
    indexCode: 'LOG_06.2',
    author: 'Mireille Vance',
    role: 'Industrial Designer & Synth Builder',
    city: 'Antwerp, BE',
    hoursLogged: 285,
    finishOwned: 'Signal Orange (SK-A1-ORG)',
    headline: 'Finally a physical rotary encoder instead of phantom touch-swipe panels.',
    body: 'I commute by bicycle in wet weather and hated how my previous headphones triggered play/pause whenever my rain hood brushed the earcup. The 316L knurled dial has crisp mechanical detents you can feel through winter gloves.',
    criticalNote: 'Critical note: Because the ear cups are machined aluminium rather than hollow polycarbonate, you feel a brief cold-metal touch on the outer rim for the first ten seconds on winter mornings.',
    ratingNumeric: '4.8 / 5.0',
  },
  {
    id: 'rev-03',
    indexCode: 'LOG_06.3',
    author: 'Kenji Takahashi',
    role: 'Field Recording Archivist',
    city: 'Kyoto, JP',
    hoursLogged: 620,
    finishOwned: 'Bone White (SK-A1-BNE)',
    headline: 'Swapped a punctured cushion in the field in three seconds flat.',
    body: 'Snagged my left lambskin pad on a tripod latch in Hokkaido. Instead of shipping the whole unit to a service center for six weeks, I ordered a $29 replacement cushion pair and clicked the magnetic bayonet mount on at my hotel desk.',
    criticalNote: 'Critical note: The carrying case is a flat neoprene sleeve rather than a hard clamshell, so I keep the Torx T6 key in my camera bag pocket.',
    ratingNumeric: '4.6 / 5.0',
  },
];

/**
 * Pure function computing the explosion multiplier (0 = assembled, 1 = fully exploded)
 * and active focused part index (0..6) given normalized scroll progress [0..1].
 *
 * Scroll choreography:
 * - [0.00 -> 0.22]: Explodes from 0 to 1.0 (all 7 parts separate outward)
 * - [0.22 -> 0.85]: Steps through parts 01..07; each part reassembles back toward 0 as its step passes
 * - [0.85 -> 1.00]: All parts lock back into 0.0 (100% reassembled)
 */
export function computeAssemblyStateAtScroll(
  scrollProgress: number,
  partIndex: number
): {
  partExplosionFactor: number;
  globalExplosionFactor: number;
  activePartIndex: number;
  phaseLabel: 'ASSEMBLED' | 'EXPLODING' | 'INSPECTING & REASSEMBLING' | 'REASSEMBLED';
} {
  const p = Math.max(0, Math.min(1, scrollProgress));
  const totalParts = ASSEMBLY_PARTS.length; // 7

  if (p <= 0.03) {
    return {
      partExplosionFactor: 0,
      globalExplosionFactor: 0,
      activePartIndex: 0,
      phaseLabel: 'ASSEMBLED',
    };
  }

  if (p < 0.22) {
    const t = (p - 0.03) / (0.22 - 0.03);
    const smooth = t * t * (3 - 2 * t);
    return {
      partExplosionFactor: smooth,
      globalExplosionFactor: smooth,
      activePartIndex: 0,
      phaseLabel: 'EXPLODING',
    };
  }

  if (p <= 0.9) {
    // Across [0.22, 0.90], we inspect parts 0..6 and reassemble them piece by piece
    const inspectProgress = (p - 0.22) / (0.9 - 0.22); // 0..1
    const rawIndex = inspectProgress * totalParts;
    const activePartIndex = Math.min(totalParts - 1, Math.floor(rawIndex));

    // Part i stays exploded (1.0) until its window arrives, then glides back to 0.0
    const partStart = partIndex / totalParts;
    const partEnd = (partIndex + 0.95) / totalParts;

    let partExplosionFactor = 1;
    if (inspectProgress >= partEnd) {
      partExplosionFactor = 0;
    } else if (inspectProgress > partStart) {
      const localT = (inspectProgress - partStart) / (partEnd - partStart);
      const smoothReassemble = localT * localT * (3 - 2 * localT);
      partExplosionFactor = 1 - smoothReassemble;
    }

    const globalExplosionFactor = 1 - inspectProgress * 0.85;

    return {
      partExplosionFactor,
      globalExplosionFactor,
      activePartIndex,
      phaseLabel: 'INSPECTING & REASSEMBLING',
    };
  }

  // Final settle [0.90 -> 1.0]
  const tailT = (1 - p) / 0.1;
  const clampedTail = Math.max(0, Math.min(1, tailT));
  return {
    partExplosionFactor: partIndex === totalParts - 1 ? clampedTail * 0.15 : 0,
    globalExplosionFactor: clampedTail * 0.15,
    activePartIndex: totalParts - 1,
    phaseLabel: 'REASSEMBLED',
  };
}

export function addItemToCart(cart: CartItem[], finish: FinishConfig, quantity = 1): CartItem[] {
  const existingIndex = cart.findIndex((item) => item.id === finish.id);
  if (existingIndex > -1) {
    return cart.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
    );
  }
  return [
    ...cart,
    {
      id: finish.id,
      name: `AURA ONE — ${finish.name}`,
      finishName: finish.name,
      sku: finish.code,
      unitPrice: finish.price,
      quantity,
      swatchHex: finish.swatchHex,
    },
  ];
}

export function addSpareCushionToCart(cart: CartItem[]): CartItem[] {
  const accessoryId = 'spare-lambskin-cushion';
  const existingIndex = cart.findIndex((item) => item.id === accessoryId);
  if (existingIndex > -1) {
    return cart.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
    );
  }
  return [
    ...cart,
    {
      id: accessoryId,
      name: 'Memory-Foam Lambskin Cushion Pair',
      finishName: 'Magnetic Bayonet Spare Kit',
      sku: 'SK-PRT-02',
      unitPrice: PRODUCT_CONSTANTS.SPARE_CUSHION_PRICE,
      quantity: 1,
      swatchHex: '#2C2C2A',
      isAccessory: true,
    },
  ];
}

export function updateCartItemQuantity(
  cart: CartItem[],
  itemId: string,
  delta: number
): CartItem[] {
  return cart
    .map((item) =>
      item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    )
    .filter((item) => item.quantity > 0);
}

export function removeCartItem(cart: CartItem[], itemId: string): CartItem[] {
  return cart.filter((item) => item.id !== itemId);
}

export type SectionStageId =
  | 'HERO'
  | 'ASSEMBLY'
  | 'SOUND_DRIVER'
  | 'SPECS_PROFILE'
  | 'GALLERY_OFFSET'
  | 'REVIEWS_CLEAR'
  | 'BUY_FINALE';

export const SECTION_STAGE_ORDER: SectionStageId[] = [
  'HERO',
  'ASSEMBLY',
  'SOUND_DRIVER',
  'SPECS_PROFILE',
  'GALLERY_OFFSET',
  'REVIEWS_CLEAR',
  'BUY_FINALE',
];

export interface Master3DJourneyState {
  stage: SectionStageId;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  camX: number;
  camY: number;
  camZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  assemblyLocalProgress: number;
  driverExposeFactor: number;
  driverPulseIntensity: number;
  finaleContrastBoost: number;
}

function lerpNum(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return a + (b - a) * clamped;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Computes the pose for a single section stage given that section's own ScrollTrigger progress [0..1].
 * Every stage enforces a safe scale (~20-25% smaller than before) so the full headphone + exploded parts
 * fit inside their dedicated stage bay with margin on all 4 sides.
 */
export function computeSingleStagePose(
  stageIndex: number,
  localProgress: number,
  isMobile = false
): Master3DJourneyState {
  const idx = Math.max(0, Math.min(SECTION_STAGE_ORDER.length - 1, Math.round(stageIndex)));
  const p = Math.max(0, Math.min(1, localProgress));
  const xMult = isMobile ? 0 : 1;
  const stage = SECTION_STAGE_ORDER[idx];

  switch (stage) {
    case 'HERO': {
      return {
        stage: 'HERO',
        posX: 0.64 * xMult,
        posY: 0.0,
        posZ: 0,
        rotX: 0.14,
        rotY: lerpNum(-0.42, -0.78, p),
        rotZ: 0.02,
        scale: 0.48,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.6 : 5.0,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 0,
      };
    }

    case 'ASSEMBLY': {
      const asmP = Math.max(0.18, Math.min(0.88, 0.18 + p * 0.65));
      return {
        stage: 'ASSEMBLY',
        posX: -0.62 * xMult,
        posY: 0.0,
        posZ: 0,
        rotX: 0.14 + Math.sin(p * Math.PI) * 0.06,
        rotY: -0.42 + (p - 0.5) * 0.45,
        rotZ: 0,
        scale: 0.40,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.6 : 5.0,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: asmP,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 0,
      };
    }

    case 'SOUND_DRIVER': {
      const exposeCurve = Math.max(0.65, Math.sin(Math.max(0.15, Math.min(0.85, p)) * Math.PI));
      return {
        stage: 'SOUND_DRIVER',
        posX: 0.74 * xMult,
        posY: 0.0,
        posZ: 0.12,
        rotX: 0.12,
        rotY: lerpNum(-0.58, -0.78, p),
        rotZ: -0.04,
        scale: 0.50,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.3 : 4.65,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0.34 * exposeCurve,
        driverPulseIntensity: Math.max(0.6, exposeCurve),
        finaleContrastBoost: 0,
      };
    }

    case 'SPECS_PROFILE': {
      return {
        stage: 'SPECS_PROFILE',
        posX: -0.76 * xMult,
        posY: 0.0,
        posZ: 0,
        rotX: 0.12,
        rotY: lerpNum(Math.PI * 0.44, Math.PI * 0.58, p),
        rotZ: 0,
        scale: 0.48,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.6 : 5.0,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 0,
      };
    }

    case 'GALLERY_OFFSET': {
      return {
        stage: 'GALLERY_OFFSET',
        posX: 0.78 * xMult,
        posY: 0.0,
        posZ: -0.15,
        rotX: 0.16,
        rotY: lerpNum(-0.35, 0.35, p),
        rotZ: 0.04,
        scale: 0.44,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.7 : 5.1,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 0,
      };
    }

    case 'REVIEWS_CLEAR': {
      return {
        stage: 'REVIEWS_CLEAR',
        posX: 0.90 * xMult,
        posY: 0.0,
        posZ: -0.15,
        rotX: 0.14,
        rotY: lerpNum(0.35, 0.95, p),
        rotZ: -0.03,
        scale: 0.43,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.7 : 5.1,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 0,
      };
    }

    case 'BUY_FINALE':
    default: {
      const baseHeroAngle = -0.42;
      return {
        stage: 'BUY_FINALE',
        posX: 0.74 * xMult,
        posY: 0.0,
        posZ: 0.05,
        rotX: 0.14,
        rotY: baseHeroAngle + p * Math.PI * 2,
        rotZ: 0,
        scale: 0.48,
        camX: 0,
        camY: 0,
        camZ: isMobile ? 5.5 : 4.9,
        lookAtX: 0,
        lookAtY: 0,
        lookAtZ: 0,
        assemblyLocalProgress: 0,
        driverExposeFactor: 0,
        driverPulseIntensity: 0,
        finaleContrastBoost: 1,
      };
    }
  }
}

/**
 * Interpolates between stage keyframes driven directly by each section's own ScrollTrigger
 * (trigger = section element, start "top bottom", end "bottom top").
 */
export function computeSectionDriven3DJourney(
  activeStageIndex: number,
  stageLocalProgress: number,
  nextStageIndex: number = activeStageIndex,
  transitionBlend = 0,
  isMobile = false
): Master3DJourneyState {
  const poseA = computeSingleStagePose(activeStageIndex, stageLocalProgress, isMobile);
  const t = smoothstep(Math.max(0, Math.min(1, transitionBlend)));
  if (t <= 0.001 || activeStageIndex === nextStageIndex) {
    return poseA;
  }
  const poseB = computeSingleStagePose(nextStageIndex, 0.2, isMobile);
  return {
    stage: t < 0.5 ? poseA.stage : poseB.stage,
    posX: lerpNum(poseA.posX, poseB.posX, t),
    posY: lerpNum(poseA.posY, poseB.posY, t),
    posZ: lerpNum(poseA.posZ, poseB.posZ, t),
    rotX: lerpNum(poseA.rotX, poseB.rotX, t),
    rotY: lerpNum(poseA.rotY, poseB.rotY, t),
    rotZ: lerpNum(poseA.rotZ, poseB.rotZ, t),
    scale: lerpNum(poseA.scale, poseB.scale, t),
    camX: lerpNum(poseA.camX, poseB.camX, t),
    camY: lerpNum(poseA.camY, poseB.camY, t),
    camZ: lerpNum(poseA.camZ, poseB.camZ, t),
    lookAtX: lerpNum(poseA.lookAtX, poseB.lookAtX, t),
    lookAtY: lerpNum(poseA.lookAtY, poseB.lookAtY, t),
    lookAtZ: lerpNum(poseA.lookAtZ, poseB.lookAtZ, t),
    assemblyLocalProgress: lerpNum(poseA.assemblyLocalProgress, poseB.assemblyLocalProgress, t),
    driverExposeFactor: lerpNum(poseA.driverExposeFactor, poseB.driverExposeFactor, t),
    driverPulseIntensity: lerpNum(poseA.driverPulseIntensity, poseB.driverPulseIntensity, t),
    finaleContrastBoost: lerpNum(poseA.finaleContrastBoost, poseB.finaleContrastBoost, t),
  };
}

export function calculateCartTotals(cart: CartItem[]): {
  totalCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
} {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingCost = 0; // Express DHL / PostNL included from Rotterdam
  return {
    totalCount,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
}


