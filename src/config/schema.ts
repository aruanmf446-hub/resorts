/**
 * THE WORLD BEYOND — configuration schema.
 *
 * Every client-specific value lives in a preset folder (src/presets/<id>) and is
 * validated against these schemas at build time. A malformed config fails the
 * build with a readable error instead of producing a broken page.
 */
import { z } from 'zod';
import { SECTION_TYPES } from './section-types';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export const ImageZ = z.object({
  src: z.string().min(1),
  /** Optional art-directed source for small screens (portrait crops). */
  srcMobile: z.string().optional(),
  alt: z.string(),
  width: z.number().int().positive().default(1600),
  height: z.number().int().positive().default(1000),
  caption: z.string().optional(),
  /** CSS object-position, e.g. "50% 70%". */
  position: z.string().optional(),
});
export type Image = z.infer<typeof ImageZ>;

export const VideoZ = z.object({
  src: z.string().min(1),
  srcMobile: z.string().optional(),
  webm: z.string().optional(),
  poster: ImageZ,
  /** WebVTT captions / description track. */
  captions: z.string().optional(),
  captionsLang: z.string().optional(),
  label: z.string(),
});
export type Video = z.infer<typeof VideoZ>;

/**
 * Links accept absolute URLs, mailto:, tel: or internal tokens:
 *  page:<pageId> · stay:<slug> · experience:<slug> · dining:<slug> · poi:<id> · booking
 * Tokens that point to disabled pages/items resolve to nothing and the link is hidden.
 */
export const LinkZ = z.object({
  label: z.string(),
  href: z.string(),
});
export type Link = z.infer<typeof LinkZ>;

const vec2 = z.tuple([z.number(), z.number()]);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const color = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use hex colors, e.g. #1f3b2d');

/* ------------------------------------------------------------------ */
/* Identity & integrations                                             */
/* ------------------------------------------------------------------ */

export const IdentityZ = z.object({
  name: z.string(),
  shortName: z.string(),
  /** Text wordmark used when no logo image is provided. */
  wordmark: z.string(),
  logo: z.object({ src: z.string(), alt: z.string(), invert: z.boolean().default(false) }).optional(),
  favicon: z.string(),
  tagline: z.string(),
  description: z.string(),
  location: z.object({
    label: z.string(),
    address: z.string(),
    locality: z.string(),
    region: z.string().optional(),
    country: z.string(),
    postalCode: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  /** Shown discreetly in the footer — required wording for fictional demos. */
  notice: z.string().optional(),
});

export const ContactsZ = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  /** Digits only, with country code — e.g. 5511999999999 */
  whatsapp: z.string().regex(/^\d{8,15}$/).optional(),
  whatsappMessage: z.string().default('Hello! I would like to know more about a stay.'),
  concierge: LinkZ.optional(),
  hours: z.string().optional(),
  social: z.array(LinkZ).default([]),
});

export const IntegrationsZ = z.object({
  ga4: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
  searchConsoleVerification: z.string().optional(),
  maps: z
    .object({
      googleMapsUrl: z.string().url().optional(),
      appleMapsUrl: z.string().url().optional(),
    })
    .default({}),
  /** External scheduling tools (spa, tables, tours) — plain links only. */
  scheduling: z.array(LinkZ.extend({ kind: z.string() })).default([]),
});

/* ------------------------------------------------------------------ */
/* Booking                                                             */
/* ------------------------------------------------------------------ */

export const BookingZ = z.object({
  mode: z.enum(['engine', 'redirect', 'direct', 'whatsapp', 'email', 'concierge', 'disabled']),
  label: z.string().default('Reserve'),
  fields: z
    .object({
      checkIn: z.boolean().default(true),
      checkOut: z.boolean().default(true),
      adults: z.boolean().default(true),
      children: z.boolean().default(true),
      accommodation: z.boolean().default(true),
      promo: z.boolean().default(false),
    })
    .default({}),
  limits: z
    .object({
      maxAdults: z.number().int().min(1).default(6),
      maxChildren: z.number().int().min(0).default(4),
      minNights: z.number().int().min(1).default(1),
      maxNights: z.number().int().min(1).default(30),
      /** Days from today before the first selectable check-in. */
      leadDays: z.number().int().min(0).default(0),
    })
    .default({}),
  engine: z
    .object({
      provider: z.enum(['cloudbeds', 'siteminder', 'synxis', 'custom']),
      url: z.string().url(),
      /** Query parameter names accepted by YOUR provider account. Leave a key out if unsupported. */
      params: z
        .object({
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
          nights: z.string().optional(),
          adults: z.string().optional(),
          children: z.string().optional(),
          accommodation: z.string().optional(),
          promo: z.string().optional(),
        })
        .default({}),
      dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY']).default('YYYY-MM-DD'),
      extra: z.record(z.string()).default({}),
      target: z.enum(['_blank', '_self']).default('_blank'),
      /** Set true only after testing the parameters with the provider. */
      verified: z.boolean().default(false),
    })
    .optional(),
  /** Used by "redirect" and as fallback for "direct" when an accommodation has no bookingUrl. */
  url: z.string().url().optional(),
  note: z.string().optional(),
  /** Optional standalone offers: day use, spa, dining, tours, events. External links / contact only. */
  offers: z
    .array(
      z.object({
        kind: z.enum(['dayuse', 'package', 'spa', 'dining', 'tour', 'event']),
        title: z.string(),
        summary: z.string(),
        cta: LinkZ,
      }),
    )
    .default([]),
});
export type Booking = z.infer<typeof BookingZ>;

/* ------------------------------------------------------------------ */
/* Visual identity                                                     */
/* ------------------------------------------------------------------ */

const FontZ = z.object({
  /** CSS family as loaded in src/styles/fonts.css */
  family: z.string(),
  fallback: z.string().default('serif'),
  weight: z.number().default(400),
  /** Variable font axes / extra settings, e.g. '"opsz" 144, "SOFT" 50' */
  variation: z.string().optional(),
});

export const ThemeZ = z.object({
  /** Art direction preset — drives composition defaults, not just colors. */
  artDirection: z.enum(['tropical', 'mountain', 'forest', 'desert', 'wellness']),
  colors: z.object({
    bg: color,
    bgAlt: color,
    ink: color,
    inkSoft: color,
    line: color,
    accent: color,
    accentInk: color,
    dark: color,
    darkInk: color,
    darkSoft: color,
  }),
  fonts: z.object({ display: FontZ, body: FontZ, accent: FontZ.optional() }),
  type: z
    .object({
      displayCase: z.enum(['none', 'uppercase']).default('none'),
      displayTracking: z.string().default('-0.03em'),
      displayLeading: z.number().default(0.92),
      /** Multiplier on the fluid type scale. */
      scale: z.number().min(0.7).max(1.4).default(1),
      /** Render emphasised words (<em>) in italic display. */
      italicEmphasis: z.boolean().default(true),
      eyebrowCase: z.enum(['none', 'uppercase']).default('uppercase'),
    })
    .default({}),
  layout: z
    .object({
      radius: z.number().min(0).max(40).default(0),
      rhythm: z.enum(['airy', 'balanced', 'dense']).default('balanced'),
      maxWidth: z.number().default(1680),
    })
    .default({}),
  nav: z
    .object({
      style: z.enum(['minimal', 'framed', 'split']).default('minimal'),
      /** "spatial" adds the resort map to the menu and area-based navigation. */
      mode: z.enum(['editorial', 'spatial']).default('editorial'),
    })
    .default({}),
  buttons: z.enum(['line', 'solid', 'frame']).default('line'),
  gallery: z.enum(['mosaic', 'filmstrip', 'stack']).default('mosaic'),
  heroComposition: z.enum(['center', 'bottom-left', 'split']).default('bottom-left'),
  imageTreatment: z
    .object({
      grain: z.boolean().default(true),
      tone: z.enum(['natural', 'warm', 'cool', 'muted']).default('natural'),
    })
    .default({}),
  motion: z
    .object({
      intensity: z.enum(['none', 'subtle', 'cinematic']).default('cinematic'),
      pageTransition: z.enum(['fade', 'veil', 'none']).default('veil'),
    })
    .default({}),
});
export type Theme = z.infer<typeof ThemeZ>;

/* ------------------------------------------------------------------ */
/* Sections & pages                                                    */
/* ------------------------------------------------------------------ */

export const SectionZ = z.object({
  type: z.enum(SECTION_TYPES),
  /** Anchor id; defaults to the type. */
  id: z.string().optional(),
  enabled: z.boolean().default(true),
  /** Optional explicit order. Sections without order keep their array position. */
  order: z.number().optional(),
  variant: z.string().optional(),
  content: z.record(z.any()).default({}),
  assets: z.record(z.any()).default({}),
  theme: z.enum(['light', 'alt', 'dark', 'accent']).optional(),
  animation: z.enum(['auto', 'none', 'subtle', 'cinematic']).default('auto'),
});
export type SectionConfig = z.infer<typeof SectionZ>;

export const PageZ = z.object({
  id: z.string(),
  /** URL path without slashes. '' is the home page. Nested paths allowed: 'resort/discover'. */
  path: z.string(),
  enabled: z.boolean().default(true),
  title: z.string(),
  description: z.string().optional(),
  nav: z
    .object({
      show: z.boolean().default(true),
      label: z.string().optional(),
      order: z.number().default(50),
      group: z.enum(['primary', 'secondary']).default('primary'),
    })
    .default({}),
  ogImage: z.string().optional(),
  sections: z.array(SectionZ).default([]),
});
export type PageConfig = z.infer<typeof PageZ>;

export const DetailTemplatesZ = z.object({
  stay: z
    .object({
      enabled: z.boolean().default(true),
      basePath: z.string().default('stays'),
      /** Sections appended after the accommodation story. */
      after: z.array(SectionZ).default([]),
    })
    .default({}),
  experience: z
    .object({
      enabled: z.boolean().default(true),
      basePath: z.string().default('experiences'),
      after: z.array(SectionZ).default([]),
    })
    .default({}),
});

/* ------------------------------------------------------------------ */
/* Resort data                                                         */
/* ------------------------------------------------------------------ */

export const StayZ = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  category: z.string(),
  tagline: z.string(),
  description: z.array(z.string()).min(1),
  capacity: z.object({ adults: z.number().int(), children: z.number().int().default(0), label: z.string().optional() }),
  area: z.object({ value: z.number(), unit: z.enum(['m²', 'ft²']).default('m²') }).optional(),
  view: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  cover: ImageZ,
  gallery: z.array(ImageZ).default([]),
  video: VideoZ.optional(),
  /** Illustrative layout only — label it as such unless it is the official plan. */
  floorplan: z.object({ image: ImageZ, note: z.string() }).optional(),
  tour360: z.object({ image: z.string(), label: z.string() }).optional(),
  model: z
    .object({
      /** GLB/GLTF path. If omitted, the procedural villa model is used. */
      src: z.string().optional(),
      scale: z.number().default(1),
      hotspots: z.array(z.object({ label: z.string(), text: z.string(), position: vec3 })).default([]),
    })
    .optional(),
  poi: z.string().optional(),
  /** Room/rate code understood by the booking engine. */
  bookingCode: z.string().optional(),
  bookingUrl: z.string().url().optional(),
  featured: z.boolean().default(false),
});
export type Stay = z.infer<typeof StayZ>;

export const ExperienceCategoryZ = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const ExperienceZ = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  category: z.string(),
  /** Planner interest tags (see plannerInterests). */
  interests: z.array(z.string()).default([]),
  summary: z.string(),
  description: z.array(z.string()).min(1),
  cover: ImageZ,
  gallery: z.array(ImageZ).default([]),
  video: VideoZ.optional(),
  duration: z.string().optional(),
  ages: z.string().optional(),
  conditions: z.array(z.string()).default([]),
  location: z.string().optional(),
  poi: z.string().optional(),
  /** Static, descriptive availability — never live data. */
  availability: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
  cta: LinkZ.optional(),
});
export type Experience = z.infer<typeof ExperienceZ>;

export const DiningZ = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  kind: z.enum(['restaurant', 'bar', 'lounge', 'private', 'thematic']),
  cuisine: z.string().optional(),
  summary: z.string(),
  description: z.array(z.string()).default([]),
  cover: ImageZ,
  gallery: z.array(ImageZ).default([]),
  hours: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  menuPdf: z.string().optional(),
  location: z.string().optional(),
  poi: z.string().optional(),
  cta: LinkZ.optional(),
});
export type Dining = z.infer<typeof DiningZ>;

export const WellnessZ = z.object({
  name: z.string(),
  summary: z.string(),
  description: z.array(z.string()).default([]),
  cover: ImageZ,
  gallery: z.array(ImageZ).default([]),
  rituals: z
    .array(
      z.object({
        name: z.string(),
        kind: z.enum(['treatment', 'ritual', 'yoga', 'meditation', 'space']),
        duration: z.string().optional(),
        summary: z.string(),
      }),
    )
    .default([]),
  hours: z.string().optional(),
  cta: LinkZ.optional(),
});

export const PoiZ = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  category: z.enum(['stay', 'dining', 'wellness', 'water', 'nature', 'leisure', 'arrival', 'sport', 'culture']),
  /** World coordinates (x, z) in the 3D map; terrain spans -50..50. */
  position: vec2,
  /** Optional override for the 2D illustrated map, in percent (x, y). */
  mapPosition: vec2.optional(),
  structure: z
    .object({
      type: z.enum(['villa', 'bungalows', 'overwater', 'pavilion', 'pool', 'spa', 'cabin', 'lodge', 'tower', 'deck', 'jetty', 'garden', 'none']),
      count: z.number().int().min(1).default(1),
      size: z.number().default(1),
      rotation: z.number().default(0),
      spread: z.number().default(4),
    })
    .default({ type: 'none' }),
  summary: z.string(),
  image: ImageZ.optional(),
  link: z.string().optional(),
});
export type Poi = z.infer<typeof PoiZ>;

/* ------------------------------------------------------------------ */
/* 3D world, atmosphere, sound                                         */
/* ------------------------------------------------------------------ */

export const WorldZ = z.object({
  enabled: z.boolean().default(true),
  /**
   * procedural — generated terrain/water/vegetation/architecture from this config
   * model      — load `model.src` (GLB/GLTF) and place hotspots on it
   * illustrated / image — 2D map image with hotspots (no WebGL)
   */
  mode: z.enum(['procedural', 'model', 'illustrated', 'image']).default('procedural'),
  model: z
    .object({
      src: z.string(),
      scale: z.number().default(1),
      position: vec3.default([0, 0, 0]),
      rotationY: z.number().default(0),
      /** Keep procedural water / sky around the model. */
      keepWater: z.boolean().default(true),
    })
    .optional(),
  seed: z.number().default(7),
  terrain: z.object({
    kind: z.enum(['island', 'valley', 'terraces', 'dunes']),
    height: z.number().default(10),
    contours: z.boolean().default(true),
    colors: z.object({ low: color, mid: color, high: color, shore: color, peak: color }),
  }),
  water: z
    .object({
      level: z.number().default(0),
      shallow: color,
      deep: color,
      kind: z.enum(['ocean', 'lake', 'none']).default('ocean'),
    }),
  vegetation: z.object({
    kind: z.enum(['palm', 'pine', 'broadleaf', 'cypress', 'none']),
    density: z.number().min(0).max(2).default(1),
    colors: z.record(z.enum(['summer', 'autumn', 'winter', 'spring']), color).default({}),
  }),
  architecture: z
    .object({
      color: color.default('#f2eee6'),
      accent: color.default('#b08a62'),
      windowGlow: color.default('#ffc98a'),
    })
    .default({}),
  atmosphere: z.object({
    times: z.array(z.enum(['dawn', 'day', 'dusk', 'night'])).min(1).default(['day', 'dusk', 'night']),
    defaultTime: z.enum(['dawn', 'day', 'dusk', 'night']).default('day'),
    seasons: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])).default([]),
    defaultSeason: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
    fog: z.number().min(0).max(1).default(0.35),
    clouds: z.boolean().default(true),
    particles: z.enum(['none', 'pollen', 'snow', 'mist', 'fireflies']).default('pollen'),
  }),
  camera: z
    .object({
      position: vec3.default([60, 48, 70]),
      target: vec3.default([0, 0, 0]),
      /** Opening flight start (cinematic arrival). */
      introFrom: vec3.default([140, 120, 160]),
      minDistance: z.number().default(18),
      maxDistance: z.number().default(150),
    })
    .default({}),
  /** 2D fallback (also used while WebGL boots). */
  fallback: ImageZ,
  /** Panorama fallback option (equirectangular). */
  panorama: z.string().optional(),
});
export type World = z.infer<typeof WorldZ>;

export const SoundZ = z.object({
  enabled: z.boolean().default(true),
  /** Synthesised in the browser (no files) or a licensed audio file. */
  kind: z.enum(['ocean', 'forest', 'wind', 'bowls', 'file']),
  src: z.string().optional(),
  volume: z.number().min(0).max(1).default(0.45),
  label: z.string().default('Ambient sound'),
});

export const HeroZ = z.object({
  mode: z.enum(['video', 'immersive3d', 'editorial']),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  image: ImageZ,
  /** Additional frames for the editorial mode (slow crossfade). */
  frames: z.array(ImageZ).default([]),
  video: VideoZ.optional(),
  primary: LinkZ.optional(),
  secondary: LinkZ.optional(),
  coordinates: z.string().optional(),
});
export type Hero = z.infer<typeof HeroZ>;

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export const ResortConfigZ = z.object({
  id: z.string(),
  locale: z.enum(['en', 'pt-BR', 'es']).default('en'),
  /** Other language editions of the same resort (separate builds/domains). */
  alternates: z.array(z.object({ locale: z.string(), href: z.string().url(), label: z.string() })).default([]),
  seo: z.object({
    siteUrl: z.string().url(),
    titleTemplate: z.string().default('%s'),
    defaultTitle: z.string(),
    ogImage: z.string(),
    robots: z.enum(['index', 'noindex']).default('index'),
    keywords: z.array(z.string()).default([]),
    priceRange: z.string().optional(),
  }),
  identity: IdentityZ,
  contacts: ContactsZ,
  integrations: IntegrationsZ.default({}),
  booking: BookingZ,
  theme: ThemeZ,
  hero: HeroZ,
  world: WorldZ.optional(),
  sound: SoundZ.optional(),
  /** Optional brand collection: other destinations of the same brand (each its own instance). */
  collection: z
    .object({
      label: z.string(),
      properties: z.array(z.object({ name: z.string(), location: z.string(), href: z.string().url(), image: ImageZ, current: z.boolean().default(false) })),
    })
    .optional(),
  experienceCategories: z.array(ExperienceCategoryZ).default([]),
  plannerInterests: z.array(z.object({ id: z.string(), label: z.string(), hint: z.string().optional() })).default([]),
  stays: z.array(StayZ).default([]),
  experiences: z.array(ExperienceZ).default([]),
  dining: z.array(DiningZ).default([]),
  wellness: WellnessZ.optional(),
  pois: z.array(PoiZ).default([]),
  pages: z.array(PageZ).min(1),
  templates: DetailTemplatesZ.default({}),
});

export type ResortConfigInput = z.input<typeof ResortConfigZ>;
export type ResortConfig = z.infer<typeof ResortConfigZ>;
