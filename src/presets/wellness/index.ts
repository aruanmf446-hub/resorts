/**
 * PRESET 03 — WELLNESS SANCTUARY
 * "Ouren" is a FICTIONAL wellness sanctuary created to demonstrate the template.
 */
import type { ResortConfigInput } from '../../config/schema';
import { media } from '../_helpers';

const m = media('wellness');

const config: ResortConfigInput = {
  id: 'wellness',
  locale: 'en',
  seo: {
    siteUrl: 'https://ouren.example.com',
    titleTemplate: '%s · Ouren Sanctuary',
    defaultTitle: 'Ouren Sanctuary — Return to stillness',
    ogImage: '/media/wellness/hero-1.webp',
    keywords: ['wellness retreat', 'spa sanctuary', 'meditation retreat', 'minimalist architecture'],
  },
  identity: {
    name: 'Ouren Sanctuary',
    shortName: 'Ouren',
    wordmark: 'Ouren',
    favicon: '/favicons/wellness.svg',
    tagline: 'Return to stillness.',
    description: 'A fictional sanctuary of terraces, water and light, devoted to rest — a demonstration of THE WORLD BEYOND resort template.',
    location: { label: 'The Terraced Hills · Demonstration', address: 'Terraced Hills Road', locality: 'Terraced Hills', country: 'Demonstration' },
    notice: 'Ouren is a fictional sanctuary created to demonstrate this template. Images are original generated artwork.',
  },
  contacts: {
    email: 'arrivals@ouren.example.com',
    phone: '+00 000 000 000',
    concierge: { label: 'Speak with a host', href: 'mailto:hosts@ouren.example.com' },
    hours: 'Hosts are available from 7 am to 9 pm.',
    social: [{ label: 'Instagram', href: 'https://instagram.com/' }],
  },
  booking: {
    mode: 'email',
    label: 'Request a stay',
    fields: { promo: false, children: false },
    limits: { maxAdults: 2, maxChildren: 0, minNights: 4, maxNights: 21, leadDays: 3 },
    note: 'Ouren hosts every stay personally. Requests are answered within one day.',
    offers: [
      { kind: 'dayuse', title: 'A day of stillness', summary: 'Bathhouse, lunch and one ritual — for guests from the region.', cta: { label: 'Request a day', href: 'mailto:arrivals@ouren.example.com?subject=Day%20of%20stillness' } },
      { kind: 'package', title: 'Seven-day reset', summary: 'A guided programme of rest, movement and nourishment.', cta: { label: 'Ask a host', href: 'mailto:hosts@ouren.example.com?subject=Seven-day%20reset' } },
    ],
  },
  theme: {
    artDirection: 'wellness',
    colors: {
      bg: '#f3efe8',
      bgAlt: '#e9e3d8',
      ink: '#3a352d',
      inkSoft: '#6e675b',
      line: '#d8d0c2',
      accent: '#8a9a82',
      accentInk: '#fbfaf6',
      dark: '#2f2c27',
      darkInk: '#efe9df',
      darkSoft: '#b4ac9d',
    },
    fonts: {
      display: { family: 'Cormorant Garamond', fallback: 'Garamond, serif', weight: 300 },
      body: { family: 'Jost Variable', fallback: 'system-ui, sans-serif', weight: 350 },
      accent: { family: 'Cormorant Garamond', fallback: 'Garamond, serif', weight: 300 },
    },
    type: { displayTracking: '-0.01em', displayLeading: 1.0, scale: 1.12, italicEmphasis: true, eyebrowCase: 'none' },
    layout: { radius: 2, rhythm: 'airy', maxWidth: 1520 },
    nav: { style: 'split', mode: 'editorial' },
    buttons: 'solid',
    gallery: 'stack',
    heroComposition: 'split',
    imageTreatment: { grain: false, tone: 'muted' },
    motion: { intensity: 'subtle', pageTransition: 'fade' },
  },
  hero: {
    mode: 'editorial',
    eyebrow: 'A sanctuary for rest',
    title: 'Return to *stillness*',
    subtitle: 'Terraces of olive and stone, warm water and long silences. Ouren is a place to put everything down.',
    image: m('hero-1', 'A still pool meeting soft hills', { srcMobile: '/media/wellness/hero-1-m.webp' }),
    frames: [m('hero-2', 'Mist over the terraced hills with cypress trees'), m('hero-3', 'Balanced stones on pale linen')],
    primary: { label: 'Begin', href: 'page:discover' },
    secondary: { label: 'Rituals', href: 'page:wellness' },
  },
  world: {
    mode: 'procedural',
    seed: 23,
    terrain: { kind: 'terraces', height: 12, contours: true, colors: { low: '#b9b190', mid: '#a3a37f', high: '#8f8a70', shore: '#d9cfbb', peak: '#c9bfa8' } },
    water: { kind: 'lake', level: 0, shallow: '#b6c8c0', deep: '#6d8a82' },
    vegetation: { kind: 'cypress', density: 0.8, colors: { summer: '#5e6a4c' } },
    architecture: { color: '#f1ece2', accent: '#b9a688', windowGlow: '#ffd9a8' },
    atmosphere: { times: ['dawn', 'day', 'dusk'], defaultTime: 'dawn', seasons: [], fog: 0.55, clouds: false, particles: 'pollen' },
    camera: { position: [56, 40, 62], target: [0, 3, 0], introFrom: [110, 90, 140], minDistance: 22, maxDistance: 130 },
    fallback: { src: '/media/wellness/map-illustrated.webp', alt: 'Illustrated map of the Ouren terraces', width: 1600, height: 1600 },
  },
  sound: { enabled: true, kind: 'bowls', volume: 0.35, label: 'Singing bowls' },

  experienceCategories: [
    { id: 'rituals', label: 'Rituals' },
    { id: 'movement', label: 'Movement' },
    { id: 'nourish', label: 'Nourishment' },
    { id: 'land', label: 'The land' },
  ],
  plannerInterests: [
    { id: 'relax', label: 'Rest' },
    { id: 'wellness', label: 'Healing' },
    { id: 'food', label: 'Nourishment' },
    { id: 'nature', label: 'Nature' },
    { id: 'romance', label: 'Together' },
  ],

  stays: [
    { slug: 'dawn-room', name: 'Dawn Room', category: 'Suite', tagline: 'Wake to mist rising from the terraces.', description: ['East-facing rooms with a single, wide window and nothing to distract from the morning.', 'Lime-washed walls, raw linen, a bed low to the ground.'], capacity: { adults: 2 }, area: { value: 54 }, view: 'East terraces', amenities: ['Meditation corner', 'Deep soaking tub', 'Herbal tea ritual'], cover: m('room-dawn', 'Bedroom facing a wide window with misty cypress hills'), gallery: [m('room-dawn', 'Dawn Room'), m('hero-2', 'Morning mist'), m('exp-linen', 'Linen')], poi: 'dawn-rooms', featured: true },
    { slug: 'courtyard-house', name: 'Courtyard House', category: 'Residence', tagline: 'A private courtyard pool, open to the sky.', description: ['A walled house around a still pool. Light moves across the stone through the day.'], capacity: { adults: 2 }, area: { value: 120 }, view: 'Private courtyard', amenities: ['Courtyard pool', 'Stone bath', 'Private yoga room'], cover: m('room-court', 'Stone bath before a window to a reflecting pool'), gallery: [m('room-court', 'Courtyard House'), m('vista-reflecting', 'Reflecting pool')], poi: 'courtyards', featured: true },
    { slug: 'garden-pavilion', name: 'Garden Pavilion', category: 'Pavilion', tagline: 'Among olives and cypress, alone.', description: ['Freestanding pavilions at the edge of the olive grove.'], capacity: { adults: 2 }, area: { value: 70 }, view: 'Olive grove', amenities: ['Outdoor shower', 'Reading bench', 'Garden'], cover: m('room-garden', 'Pavilion with a narrow window to cypress and green hills'), gallery: [m('room-garden', 'Garden Pavilion')], poi: 'pavilions' },
  ],

  experiences: [
    { slug: 'sound-bath', title: 'Sound Bath', category: 'rituals', interests: ['wellness', 'relax'], summary: 'Lie still while bronze bowls fill the room with sound.', description: ['A guided hour of resonance in the stone hall.'], cover: m('exp-steam', 'Soft steam rising from a stone bowl'), duration: '60 minutes', ages: '16+', poi: 'bathhouse', availability: 'Daily at dusk', timeOfDay: 'evening' },
    { slug: 'stone-and-breath', title: 'Stone & Breath', category: 'rituals', interests: ['wellness'], summary: 'Warm stones, slow breathing and a long rest.', description: ['A ritual of heated river stones and guided breath.'], cover: m('exp-stones', 'Balanced stones'), duration: '90 minutes', poi: 'bathhouse', availability: 'On request', timeOfDay: 'afternoon' },
    { slug: 'terrace-walk', title: 'Terrace Walk', category: 'land', interests: ['nature', 'relax', 'romance'], summary: 'A silent walk along the olive terraces at first light.', description: ['Walk in silence with a host, ending with tea at the top terrace.'], cover: m('exp-walk', 'A pale path through tall trunks in mist'), duration: '75 minutes', poi: 'olive-terraces', availability: 'Daily at sunrise', timeOfDay: 'morning' },
    { slug: 'morning-movement', title: 'Morning Movement', category: 'movement', interests: ['wellness'], summary: 'Gentle yoga and stretching above the reflecting pool.', description: ['For every level, every morning.'], cover: m('exp-pool', 'A pale deck over a still pool'), duration: '60 minutes', poi: 'reflecting-pool', availability: 'Daily', timeOfDay: 'morning' },
    { slug: 'garden-lunch', title: 'Garden Lunch', category: 'nourish', interests: ['food', 'romance'], summary: 'Vegetables from the terraces, served at a long table outdoors.', description: ['Seasonal plant-led cooking from our garden.'], cover: m('dining-table', 'A long table at golden hour'), duration: '2 hours', availability: 'Daily', timeOfDay: 'afternoon' },
    { slug: 'dusk-stillness', title: 'Dusk Stillness', category: 'land', interests: ['relax', 'nature'], summary: 'Sit with the hills as the light goes.', description: ['A guided sitting meditation at the edge of the terraces.'], cover: m('exp-dusk', 'Grass and soft hills at dusk'), duration: '30 minutes', availability: 'Daily', timeOfDay: 'evening' },
  ],

  dining: [
    { slug: 'the-table', name: 'The Table', kind: 'restaurant', cuisine: 'Plant-led, seasonal', summary: 'One long table, one menu, ingredients from the terraces.', description: ['Breakfast, lunch and dinner served at a single shared table — or privately, if you prefer.'], cover: m('dining-table', 'Long table at dusk'), gallery: [m('dining-table', 'The Table'), m('dining-garden', 'Garden room')], hours: [{ label: 'Breakfast', value: '7:30 – 10:00' }, { label: 'Lunch', value: '12:30 – 14:30' }, { label: 'Dinner', value: '19:00 – 21:00' }], poi: 'kitchen-garden' },
    { slug: 'tea-room', name: 'Tea Room', kind: 'lounge', summary: 'Herbal infusions and quiet, all day.', cover: m('dining-garden', 'A calm room with a window to the garden'), hours: [{ label: 'Daily', value: '7:00 – 21:00' }], poi: 'bathhouse' },
  ],

  wellness: {
    name: 'The Bathhouse',
    summary: 'Warm pools, steam, stone and silence — the centre of life at Ouren.',
    description: ['The Bathhouse is built half into the hillside. Pools step down from hot to cool, ending at the reflecting pool.', 'Every stay includes daily access and a personal ritual programme.'],
    cover: m('spa-bath', 'A stone tub before a window onto still water'),
    gallery: [m('spa-bath', 'Bathhouse'), m('exp-steam', 'Steam'), m('exp-stones', 'Stones'), m('exp-pool', 'Reflecting pool')],
    rituals: [
      { name: 'The Ouren Ritual', kind: 'ritual', duration: '150 min', summary: 'Steam, salt, warm stones and a long massage.' },
      { name: 'Deep Rest Massage', kind: 'treatment', duration: '90 min', summary: 'Slow, quiet, unhurried.' },
      { name: 'Morning Movement', kind: 'yoga', duration: '60 min', summary: 'Above the reflecting pool.' },
      { name: 'Sound Bath', kind: 'meditation', duration: '60 min', summary: 'Bronze bowls in the stone hall.' },
      { name: 'The Warm Pools', kind: 'space', summary: 'Three pools stepping down the hill.' },
    ],
    hours: 'Daily, 7:00 – 21:00',
    cta: { label: 'Ask a host', href: 'mailto:hosts@ouren.example.com' },
  },

  pois: [
    { id: 'bathhouse', name: 'The Bathhouse', category: 'wellness', position: [-2, -6], structure: { type: 'spa', size: 1.5, rotation: 0.1 }, summary: 'Warm pools, steam and the stone hall.', image: m('spa-bath', 'Bathhouse'), link: 'page:wellness' },
    { id: 'reflecting-pool', name: 'Reflecting Pool', category: 'water', position: [10, 8], structure: { type: 'pool', size: 1.6, rotation: 0.1 }, summary: 'Still water for movement and contemplation.', image: m('exp-pool', 'Reflecting pool'), link: 'experience:morning-movement' },
    { id: 'dawn-rooms', name: 'Dawn Rooms', category: 'stay', position: [24, -12], structure: { type: 'villa', count: 4, spread: 6, rotation: -0.5 }, summary: 'East-facing rooms on the upper terrace.', image: m('room-dawn', 'Dawn Room'), link: 'stay:dawn-room' },
    { id: 'courtyards', name: 'Courtyard Houses', category: 'stay', position: [-22, 10], structure: { type: 'villa', count: 3, spread: 8, rotation: 0.3 }, summary: 'Walled houses around private pools.', image: m('room-court', 'Courtyard House'), link: 'stay:courtyard-house' },
    { id: 'pavilions', name: 'Garden Pavilions', category: 'stay', position: [-20, -22], structure: { type: 'bungalows', count: 4, spread: 6 }, summary: 'Pavilions among the olive trees.', image: m('room-garden', 'Garden Pavilion'), link: 'stay:garden-pavilion' },
    { id: 'kitchen-garden', name: 'Kitchen Garden', category: 'dining', position: [12, 26], structure: { type: 'garden', size: 1.3 }, summary: 'Terraced vegetable garden and The Table.', image: m('dining-table', 'The Table'), link: 'page:dining' },
    { id: 'olive-terraces', name: 'Olive Terraces', category: 'nature', position: [30, 22], structure: { type: 'none' }, summary: 'Old olive trees on dry-stone terraces.', image: m('vista-terraces', 'Terraces'), link: 'experience:terrace-walk' },
  ],

  pages: [
    {
      id: 'home', path: '', title: 'Return to stillness', nav: { show: false },
      sections: [
        { type: 'hero' },
        { type: 'manifesto', content: { text: 'Rest is not the absence of activity. It is *the presence of attention* — to breath, to water, to the slow movement of light across a wall.', signature: 'Ouren' } },
        { type: 'wellness', variant: 'showcase', theme: 'alt', content: { eyebrow: 'The Bathhouse', title: 'Water, *warmth* and stone', cta: { label: 'Rituals', href: 'page:wellness' } } },
        { type: 'architecture', content: { eyebrow: 'Architecture', title: 'Rooms made of *light*', body: ['Thick lime walls, small deep windows and courtyards open to the sky. Every room is designed around one view.', 'Materials are few: stone, lime, oak, linen.'], images: [m('arch-light', 'A single window of light in a pale wall', { width: 1200, height: 1500 }), m('room-dawn', 'Dawn Room')], quote: 'Every room is designed around one view.' } },
        { type: 'accommodations', variant: 'editorial', theme: 'alt', content: { eyebrow: 'Rooms & houses', title: 'A place to *put everything down*', cta: { label: 'All rooms', href: 'page:stays' } } },
        { type: 'experiences', variant: 'explorer', content: { eyebrow: 'The days', title: 'Rituals, movement, *nourishment*' } },
        { type: 'planner', variant: 'teaser', theme: 'accent', content: { title: 'Shape your *rhythm*', intro: 'Choose what you need. We will suggest a gentle rhythm for your days.', cta: { label: 'Begin', href: 'page:planner' } } },
        { type: 'gallery', content: { eyebrow: 'Gallery', title: 'Quiet frames', images: [m('hero-2', 'Mist'), m('exp-stones', 'Stones'), m('room-court', 'Courtyard'), m('vista-reflecting', 'Reflecting pool'), m('exp-linen', 'Linen')] } },
        { type: 'finalCta', content: { title: 'When you are *ready*', text: 'Write to us with your preferred dates. A host will reply personally.', image: m('vista-reflecting', 'Reflecting pool at dusk'), primary: { label: 'Request a stay', href: 'booking' } } },
      ],
    },
    {
      id: 'discover', path: 'sanctuary', title: 'The sanctuary', nav: { order: 10, label: 'Sanctuary' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The sanctuary', title: 'Terraces, water, *silence*', image: m('vista-terraces', 'Terraces') } },
        { type: 'introduction', content: { eyebrow: 'The place', title: 'Twelve rooms on an *old hillside*', body: ['Ouren occupies a hillside of dry-stone terraces, olive trees and cypress. Only twelve rooms share it.', 'There are no televisions, and phones are kindly asked to rest too.'], image: m('vista-terraces', 'Terraces'), secondaryImage: m('arch-light', 'Window', { width: 1200, height: 1500 }), facts: [{ value: '12', label: 'Rooms' }, { value: '3', label: 'Warm pools' }, { value: '0', label: 'Screens' }] } },
        { type: 'resortMap', theme: 'dark', content: { eyebrow: 'The grounds', title: 'Walk the *terraces*', intro: 'Change the light and explore each space.' } },
        { type: 'culture', theme: 'alt', content: { eyebrow: 'Principles', title: 'How we *care*', items: [{ title: 'Silence', text: 'Quiet hours from dusk to breakfast.' }, { title: 'Season', text: 'Rituals and food follow the land.' }, { title: 'Attention', text: 'Hosts, not staff — personal care.' }] } },
        { type: 'virtualTour', theme: 'dark', content: { eyebrow: '360°', title: 'From the *upper terrace*', panorama: '/media/wellness/panorama.webp', fallback: m('vista-terraces', 'Terraces'), label: 'Panoramic view from the upper terrace' } },
      ],
    },
    { id: 'map', path: 'map', title: 'Map', nav: { order: 15 }, sections: [{ type: 'resortMap', variant: 'full', theme: 'dark', content: { title: 'Ouren grounds' } }] },
    {
      id: 'stays', path: 'rooms', title: 'Rooms & houses', nav: { order: 20, label: 'Rooms' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'Rooms & houses', title: 'Designed around *one view*', image: m('room-court', 'Courtyard House') } },
        { type: 'accommodations', variant: 'index', content: { title: 'Rooms' } },
        { type: 'accommodationHighlights', theme: 'alt', content: { title: 'In every room' } },
      ],
    },
    {
      id: 'wellness', path: 'rituals', title: 'Rituals', nav: { order: 30 },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The Bathhouse', title: 'Water, *warmth* and stone', image: m('spa-bath', 'Bathhouse') } },
        { type: 'wellness', variant: 'full', content: { title: 'Rituals & spaces' } },
        { type: 'pools', theme: 'alt', content: { eyebrow: 'Water', title: 'Three *warm* pools', image: m('exp-pool', 'Reflecting pool'), items: [{ title: 'Hot pool', text: '39°' }, { title: 'Warm pool', text: '34°' }, { title: 'Reflecting pool', text: 'Cool, still' }] } },
      ],
    },
    {
      id: 'experiences', path: 'days', title: 'The days', nav: { order: 40, label: 'Days' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The days', title: 'A gentle *rhythm*', image: m('exp-walk', 'Morning walk') } },
        { type: 'experiences', variant: 'index', content: { title: 'Experiences' } },
        { type: 'romantic', theme: 'alt', content: { eyebrow: 'Together', title: 'Stillness, *shared*', image: m('vista-reflecting', 'Reflecting pool'), category: 'land' } },
      ],
    },
    { id: 'planner', path: 'planner', title: 'Planner', nav: { order: 45 }, sections: [{ type: 'planner', variant: 'full', content: { eyebrow: 'Planner', title: 'Shape your *rhythm*', intro: 'Choose what you need — and share it with your host.' } }] },
    { id: 'dining', path: 'table', title: 'The Table', nav: { order: 50, label: 'Table' }, sections: [{ type: 'hero', variant: 'page', content: { eyebrow: 'Nourishment', title: 'From the *terraces*', image: m('dining-table', 'The Table') } }, { type: 'gastronomy', variant: 'index', content: { title: 'Where we eat' } }] },
    { id: 'booking', path: 'request', title: 'Request a stay', nav: { show: false }, sections: [{ type: 'booking', variant: 'page', content: { eyebrow: 'Arrivals', title: 'Request a *stay*', intro: 'Your request opens in your e-mail app. A host replies within a day.' } }, { type: 'packages', theme: 'alt', content: { eyebrow: 'Programmes', title: 'Guided *stays*', image: m('exp-stones', 'Stones'), items: [{ title: 'Seven-day reset' }, { title: 'Silent weekend' }], cta: { label: 'Ask a host', href: 'mailto:hosts@ouren.example.com' } } }] },
    { id: 'contact', path: 'contact', title: 'Contact', nav: { order: 90, group: 'secondary' }, sections: [{ type: 'contact', content: { eyebrow: 'Contact', title: 'Write to a *host*' } }, { type: 'location', theme: 'alt', content: { eyebrow: 'Arriving', title: 'Ninety minutes from the *coast*', text: 'Demonstration text — replace with real directions.', access: [{ mode: 'Car', text: 'Private parking at the lower gate.' }, { mode: 'Transfer', text: 'Arranged by your host.' }] } }] },
  ],
  templates: { stay: { basePath: 'rooms' }, experience: { basePath: 'days' } },
};

export default config;
