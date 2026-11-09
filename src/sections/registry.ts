/**
 * Typed component registry: every one of the 38 section types maps to a component.
 * Related types share an art-directed component (e.g. pools/beach/family → Spotlight)
 * and are differentiated by content, variant and theme.
 */
import type { SectionType } from '../config/section-types';
import Hero from './Hero.astro';
import Manifesto from './Manifesto.astro';
import Introduction from './Introduction.astro';
import Landscape from './Landscape.astro';
import ResortMap from './ResortMap.astro';
import Discover from './Discover.astro';
import Accommodations from './Accommodations.astro';
import AccommodationHighlights from './AccommodationHighlights.astro';
import VillaExplorer from './VillaExplorer.astro';
import Experiences from './Experiences.astro';
import Planner from './Planner.astro';
import Spotlight from './Spotlight.astro';
import Gastronomy from './Gastronomy.astro';
import Wellness from './Wellness.astro';
import Pillars from './Pillars.astro';
import Architecture from './Architecture.astro';
import Facilities from './Facilities.astro';
import VirtualTour from './VirtualTour.astro';
import Gallery from './Gallery.astro';
import VideoStory from './VideoStory.astro';
import Location from './Location.astro';
import DestinationMap from './DestinationMap.astro';
import Offerings from './Offerings.astro';
import Testimonials from './Testimonials.astro';
import Awards from './Awards.astro';
import Concierge from './Concierge.astro';
import Booking from './Booking.astro';
import Contact from './Contact.astro';
import FinalCta from './FinalCta.astro';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (props: any) => any;

export const registry: Record<SectionType, AstroComponent> = {
  hero: Hero,
  manifesto: Manifesto,
  introduction: Introduction,
  landscape: Landscape,
  resortMap: ResortMap,
  discover: Discover,
  accommodations: Accommodations,
  accommodationHighlights: AccommodationHighlights,
  villaExplorer: VillaExplorer,
  experiences: Experiences,
  planner: Planner,
  pools: Spotlight,
  beach: Spotlight,
  gastronomy: Gastronomy,
  wellness: Wellness,
  adventure: Spotlight,
  family: Spotlight,
  romantic: Spotlight,
  sports: Spotlight,
  sustainability: Pillars,
  culture: Pillars,
  architecture: Architecture,
  facilities: Facilities,
  virtualTour: VirtualTour,
  gallery: Gallery,
  video: VideoStory,
  location: Location,
  destinationMap: DestinationMap,
  weddings: Offerings,
  corporate: Offerings,
  events: Offerings,
  packages: Offerings,
  testimonials: Testimonials,
  awards: Awards,
  concierge: Concierge,
  booking: Booking,
  contact: Contact,
  finalCta: FinalCta,
};
