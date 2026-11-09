/**
 * Typed content contracts for every section type. Validated at build time
 * (src/config/index.ts) — a missing title or malformed image fails the build.
 */
import { z } from 'zod';
import { ImageZ, LinkZ, VideoZ } from '../config/schema';
import type { SectionType } from '../config/section-types';

const head = {
  eyebrow: z.string().optional(),
  title: z.string(),
  intro: z.string().optional(),
};
const item = z.object({ title: z.string(), text: z.string().optional() });

const spotlight = z.object({
  ...head,
  text: z.string().optional(),
  image: ImageZ,
  secondaryImage: ImageZ.optional(),
  /** Experience category to list underneath (only existing experiences are shown). */
  category: z.string().optional(),
  items: z.array(item).default([]),
  cta: LinkZ.optional(),
});

const offering = z.object({
  ...head,
  image: ImageZ,
  items: z.array(item).default([]),
  cta: LinkZ.optional(),
  note: z.string().optional(),
});

const pillars = z.object({
  ...head,
  image: ImageZ.optional(),
  items: z.array(item).min(1),
});

export const sectionContentSchemas: Record<SectionType, z.ZodTypeAny> = {
  hero: z.object({
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    intro: z.string().optional(),
    image: ImageZ.optional(),
  }),
  manifesto: z.object({
    eyebrow: z.string().optional(),
    /** Use *asterisks* for emphasised words. */
    text: z.string(),
    signature: z.string().optional(),
    aside: z.string().optional(),
  }),
  introduction: z.object({
    ...head,
    body: z.array(z.string()).min(1),
    image: ImageZ,
    secondaryImage: ImageZ.optional(),
    facts: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    cta: LinkZ.optional(),
  }),
  landscape: z.object({
    ...head,
    chapters: z.array(z.object({ title: z.string(), text: z.string(), image: ImageZ })).min(2),
  }),
  resortMap: z.object({ ...head, cta: LinkZ.optional() }),
  discover: z.object({
    ...head,
    areas: z.array(z.object({ title: z.string(), text: z.string(), image: ImageZ, link: z.string().optional() })).min(2),
  }),
  accommodations: z.object({ ...head, slugs: z.array(z.string()).optional(), cta: LinkZ.optional() }),
  accommodationHighlights: z.object({ ...head, slugs: z.array(z.string()).optional() }),
  villaExplorer: z.object({ ...head, stay: z.string() }),
  experiences: z.object({ ...head, categories: z.array(z.string()).optional(), limit: z.number().optional(), cta: LinkZ.optional() }),
  planner: z.object({ ...head, cta: LinkZ.optional() }),
  pools: spotlight,
  beach: spotlight,
  adventure: spotlight,
  family: spotlight,
  romantic: spotlight,
  sports: spotlight,
  gastronomy: z.object({ ...head, slugs: z.array(z.string()).optional(), cta: LinkZ.optional() }),
  wellness: z.object({ ...head, cta: LinkZ.optional() }),
  sustainability: pillars,
  culture: pillars,
  architecture: z.object({
    ...head,
    body: z.array(z.string()).min(1),
    images: z.array(ImageZ).min(1).max(3),
    quote: z.string().optional(),
  }),
  facilities: z.object({ ...head, items: z.array(item).min(1) }),
  virtualTour: z.object({ ...head, panorama: z.string(), fallback: ImageZ, label: z.string() }),
  gallery: z.object({ ...head, images: z.array(ImageZ).min(3) }),
  video: z.object({ ...head, text: z.string().optional(), video: VideoZ }),
  location: z.object({
    ...head,
    text: z.string().optional(),
    access: z.array(z.object({ mode: z.string(), text: z.string() })).default([]),
    image: ImageZ.optional(),
  }),
  destinationMap: z.object({
    ...head,
    places: z
      .array(
        z.object({
          name: z.string(),
          kind: z.string(),
          distance: z.string(),
          text: z.string().optional(),
          /** Position on the stylised destination map, percent. */
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
        }),
      )
      .min(1),
  }),
  weddings: offering,
  corporate: offering,
  events: offering,
  packages: offering,
  testimonials: z.object({
    ...head,
    /** Only publish real, consented guest words. */
    items: z.array(z.object({ quote: z.string(), author: z.string(), source: z.string(), date: z.string().optional() })).min(1),
  }),
  awards: z.object({
    ...head,
    items: z.array(z.object({ name: z.string(), by: z.string(), year: z.string(), href: z.string().optional() })).min(1),
  }),
  concierge: z.object({ ...head, text: z.string().optional(), services: z.array(z.string()).default([]), image: ImageZ.optional() }),
  booking: z.object({ ...head }),
  contact: z.object({ ...head }),
  finalCta: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    text: z.string().optional(),
    image: ImageZ,
    primary: LinkZ.optional(),
    secondary: LinkZ.optional(),
  }),
};
