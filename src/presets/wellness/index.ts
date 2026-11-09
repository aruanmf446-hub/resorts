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
    siteUrl: process.env.SITE_URL || 'https://ouren.example.com',
    titleTemplate: '%s · Ouren Sanctuary',
    defaultTitle: 'Ouren Sanctuary — Let the light settle',
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
    whatsappMessage: 'Hello Ouren. I would like to discuss the dates and rooms below. I understand this is a demonstration website.',
    phone: '+00 000 000 000',
    concierge: { label: 'Speak with a host', href: 'mailto:hosts@ouren.example.com' },
    hours: 'Demonstration contact details — replace before publishing.',
    social: [{ label: 'Instagram', href: 'https://instagram.com/' }],
  },
  booking: {
    mode: 'email',
    label: 'Request a stay',
    fields: { promo: false, children: false },
    limits: { maxAdults: 2, maxChildren: 0, minNights: 4, maxNights: 21, leadDays: 3 },
    note: 'Preview a personal stay request. This fictional sanctuary does not confirm reservations.',
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
    title: 'Let the light|*settle*',
    subtitle: 'Water holds the sky. Stone holds the warmth. Leave a little space between one moment and the next.',
    image: m('hero-1', "A still pool meeting soft hills", { srcMobile: '/media/wellness/hero-1-m.webp' }),
    frames: [m('hero-2', "Mist over the terraced hills with cypress trees"), m('hero-3', "Balanced stones on pale linen")],
    primary: { label: 'Begin', href: 'page:discover' },
    secondary: { label: 'Daily rituals', href: 'page:wellness' },
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
    { id: 'rituals', label: 'Daily rituals' },
    { id: 'movement', label: 'Movement' },
    { id: 'nourish', label: 'Nourishment' },
    { id: 'land', label: 'The land' },
  ],
  plannerInterests: [
    { id: 'relax', label: 'Rest' },
    { id: 'wellness', label: 'Balance' },
    { id: 'food', label: 'Nourishment' },
    { id: 'nature', label: 'Nature' },
    { id: 'romance', label: 'Together' },
  ],

  stays: [
    { slug: 'dawn-room', name: 'Dawn Room', category: 'Suite', tagline: "Mist at the window. Light on linen.", description: ['One wide window faces east. Morning light reaches the low bed, then crosses the pale wall.', 'Lime-washed walls, raw linen, a bed low to the ground.'], capacity: { adults: 2 }, area: { value: 54 }, view: 'East terraces', amenities: ['Meditation corner', 'Deep soaking tub', 'Herbal tea ritual'], cover: m('room-dawn', "Bedroom facing a wide window with misty cypress hills"), gallery: [m('room-dawn', "Bedroom facing a wide window with misty cypress hills"), m('hero-2', "Mist over the terraced hills with cypress trees"), m('exp-linen', "Leaf shadows across folded pale linen")], poi: 'dawn-rooms', featured: true },
    { slug: 'courtyard-house', name: 'Courtyard House', category: 'Residence', tagline: "A still pool. An open sky.", description: ['Walls gather around a quiet pool. Through the day, light traces the edge of the stone.'], capacity: { adults: 2 }, area: { value: 120 }, view: 'Private courtyard', amenities: ['Courtyard pool', 'Stone bath', 'Private yoga room'], cover: m('room-court', "Stone bath before a window to a reflecting pool"), gallery: [m('room-court', "Stone bath before a window to a reflecting pool"), m('vista-reflecting', "Still reflecting pool facing soft hills")], poi: 'courtyards', featured: true },
    { slug: 'garden-pavilion', name: 'Garden Pavilion', category: 'Pavilion', tagline: "Among olives. Beneath the cypress.", description: ['A pavilion at the edge of the grove. A narrow window frames the trees.'], capacity: { adults: 2 }, area: { value: 70 }, view: 'Olive grove', amenities: ['Outdoor shower', 'Reading bench', 'Garden'], cover: m('room-garden', "Pavilion with a narrow window to cypress and green hills"), gallery: [m('room-garden', "Pavilion with a narrow window to cypress and green hills")], poi: 'pavilions' },
  ],

  experiences: [
    { slug: 'sound-bath', title: 'Sound Bath', category: 'rituals', interests: ['wellness', 'relax'], summary: "Lie still while bronze bowls fill the room with sound.", description: ['Lie down in the stone hall. Let the sound rise, linger and fade.'], cover: m('exp-steam', "Steam rising above a stone bowl"), duration: '60 minutes', ages: '16+', poi: 'bathhouse', availability: 'Daily at dusk', timeOfDay: 'evening' },
    { slug: 'stone-and-breath', title: 'Stone & Breath', category: 'rituals', interests: ['wellness'], summary: "Warm stone against the skin. A slow breath. Time to rest.", description: ['A ritual of heated river stones and guided breath.'], cover: m('exp-stones', "Smooth stones balanced on a pale surface"), duration: '90 minutes', poi: 'bathhouse', availability: 'On request', timeOfDay: 'afternoon' },
    { slug: 'terrace-walk', title: 'Terrace Walk', category: 'land', interests: ['nature', 'relax', 'romance'], summary: "First light on dry stone. Footsteps between the olives.", description: ['Walk in silence with a host, ending with tea at the top terrace.'], cover: m('exp-walk', "A pale path through tall trunks in mist"), duration: '75 minutes', poi: 'olive-terraces', availability: 'Daily at sunrise', timeOfDay: 'morning' },
    { slug: 'morning-movement', title: 'Morning Movement', category: 'movement', interests: ['wellness'], summary: "A slow stretch beside still water. Space for the next breath.", description: ['Stretch slowly beside the water. Pause between movements.'], cover: m('exp-pool', "A pale deck over a still pool"), duration: '60 minutes', poi: 'reflecting-pool', availability: 'Daily', timeOfDay: 'morning' },
    { slug: 'garden-lunch', title: 'Garden Lunch', category: 'nourish', interests: ['food', 'romance'], summary: "Leaves, roots and a table open to the air.", description: ['Seasonal plant-led cooking from our garden.'], cover: m('dining-table', "Long dining table in warm evening light"), duration: '2 hours', availability: 'Daily', timeOfDay: 'afternoon' },
    { slug: 'dusk-stillness', title: 'Dusk Stillness', category: 'land', interests: ['relax', 'nature'], summary: "Sit with the hills as the light goes.", description: ['Sit at the terrace edge. Watch the last colour leave the hills.'], cover: m('exp-dusk', "Grass and soft hills at dusk"), duration: '30 minutes', availability: 'Daily', timeOfDay: 'evening' },
  ],

  dining: [
    { slug: 'the-table', name: 'The Table', kind: 'restaurant', cuisine: 'Plant-led, seasonal', summary: 'A long table. Vegetables, leaves and the colour of the season.', description: ['Breakfast, lunch and dinner served at a single shared table — or privately, if you prefer.'], cover: m('dining-table', "Long dining table in warm evening light"), gallery: [m('dining-table', "Long dining table in warm evening light"), m('dining-garden', "A calm room with a window to the garden")], hours: [{ label: 'Breakfast', value: '7:30 – 10:00' }, { label: 'Lunch', value: '12:30 – 14:30' }, { label: 'Dinner', value: '19:00 – 21:00' }], poi: 'kitchen-garden' },
    { slug: 'tea-room', name: 'Tea Room', kind: 'lounge', summary: 'Leaves steep in warm water. Light settles on the table.', cover: m('dining-garden', "A calm room with a window to the garden"), hours: [{ label: 'Daily', value: '7:00 – 21:00' }], poi: 'bathhouse' },
  ],

  wellness: {
    name: 'The Bathhouse',
    summary: 'Warm pools, steam, stone and silence — the centre of life at Ouren.',
    description: ['The Bathhouse is built half into the hillside. Pools step down from hot to cool, ending at the reflecting pool.', 'Move from water to rest. Let the pause last.'],
    cover: m('spa-bath', "A stone tub before a window onto still water"),
    gallery: [m('spa-bath', "A stone tub before a window onto still water"), m('exp-steam', "Steam rising above a stone bowl"), m('exp-stones', "Smooth stones balanced on a pale surface"), m('exp-pool', "A pale deck over a still pool")],
    rituals: [
      { name: 'The Ouren Ritual', kind: 'ritual', duration: '150 min', summary: 'Steam, salt, warm stones and a long massage.' },
      { name: 'Deep Rest Massage', kind: 'treatment', duration: '90 min', summary: 'Measured touch. A quiet room. Time to lie still.' },
      { name: 'Morning Movement', kind: 'yoga', duration: '60 min', summary: 'Slow movements beside the still water.' },
      { name: 'Sound Bath', kind: 'meditation', duration: '60 min', summary: 'Sound rises through the stone hall, then fades.' },
      { name: 'The Warm Pools', kind: 'space', summary: 'Warm water follows the slope of the stone terraces.' },
    ],
    hours: 'Daily, 7:00 – 21:00',
    cta: { label: 'Ask a host', href: 'mailto:hosts@ouren.example.com' },
  },

  pois: [
    { id: 'bathhouse', name: 'The Bathhouse', category: 'wellness', position: [-2, -6], structure: { type: 'spa', size: 1.5, rotation: 0.1 }, summary: 'Warm pools, steam and the stone hall.', image: m('spa-bath', "A stone tub before a window onto still water"), link: 'page:wellness' },
    { id: 'reflecting-pool', name: 'Reflecting Pool', category: 'water', position: [10, 8], structure: { type: 'pool', size: 1.6, rotation: 0.1 }, summary: 'Still water for movement and contemplation.', image: m('exp-pool', "A pale deck over a still pool"), link: 'experience:morning-movement' },
    { id: 'dawn-rooms', name: 'Dawn Rooms', category: 'stay', position: [24, -12], structure: { type: 'villa', count: 4, spread: 6, rotation: -0.5 }, summary: 'East-facing rooms on the upper terrace.', image: m('room-dawn', "Bedroom facing a wide window with misty cypress hills"), link: 'stay:dawn-room' },
    { id: 'courtyards', name: 'Courtyard Houses', category: 'stay', position: [-22, 10], structure: { type: 'villa', count: 3, spread: 8, rotation: 0.3 }, summary: 'Walled houses around private pools.', image: m('room-court', "Stone bath before a window to a reflecting pool"), link: 'stay:courtyard-house' },
    { id: 'pavilions', name: 'Garden Pavilions', category: 'stay', position: [-20, -22], structure: { type: 'bungalows', count: 4, spread: 6 }, summary: 'Pavilions among the olive trees.', image: m('room-garden', "Pavilion with a narrow window to cypress and green hills"), link: 'stay:garden-pavilion' },
    { id: 'kitchen-garden', name: 'Kitchen Garden', category: 'dining', position: [12, 26], structure: { type: 'garden', size: 1.3 }, summary: 'Terraced vegetable garden and The Table.', image: m('dining-table', "Long dining table in warm evening light"), link: 'page:dining' },
    { id: 'olive-terraces', name: 'Olive Terraces', category: 'nature', position: [30, 22], structure: { type: 'none' }, summary: 'Old olive trees on dry-stone terraces.', image: m('vista-terraces', "Stone terraces stepping down a hillside with cypress trees"), link: 'experience:terrace-walk' },
  ],

  pages: [
    {
      id: 'home', path: '', title: 'Return to stillness', description: "Meet Ouren through still water, warm stone and a little space between moments. Explore quiet rooms and gentle daily rituals.", nav: { show: false },
      sections: [
{ type: 'hero' },
{ type: 'manifesto', content: { text: 'A breath. A pool of light. The warmth of stone beneath your hand. Let your attention *rest here*.', signature: 'Ouren' } },
{ type: 'wellness', variant: 'showcase', theme: 'dark', content: { eyebrow: 'The Bathhouse', title: 'Water, *warmth* and stone', cta: { label: 'Daily rituals', href: 'page:wellness' } } },
{ type: 'architecture', content: { eyebrow: 'Architecture', title: 'Rooms made of *light*', body: ['Thick lime walls, small deep windows and courtyards open to the sky. Every room is designed around one view.', 'Materials are few: stone, lime, oak, linen.'], images: [m('arch-light', "Daylight through a deep window in a pale wall", { width: 1200, height: 1500 }), m('room-dawn', "Bedroom facing a wide window with misty cypress hills")], quote: 'Every room is designed around one view.' } },
{ type: 'accommodations', variant: 'editorial', theme: 'alt', content: { eyebrow: 'Rooms & houses', title: 'Room to *rest*', cta: { label: 'All rooms', href: 'page:stays' } } },
{ type: 'experiences', variant: 'explorer', content: { eyebrow: 'The days', title: 'Rituals, movement, *nourishment*' } },
{ type: 'planner', variant: 'teaser', theme: 'accent', content: { title: 'Shape your *rhythm*', intro: 'Choose what you need. We will suggest a gentle rhythm for your days.', cta: { label: 'Begin', href: 'page:planner' } } },
{ type: 'gallery', content: { eyebrow: 'Gallery', title: 'Quiet frames', images: [m('hero-2', "Mist over the terraced hills with cypress trees"), m('exp-stones', "Smooth stones balanced on a pale surface"), m('room-court', "Stone bath before a window to a reflecting pool"), m('vista-reflecting', "Still reflecting pool facing soft hills"), m('exp-linen', "Leaf shadows across folded pale linen")] } },
{ type: 'finalCta', content: { title: 'When you are *ready*', text: 'Write a few lines about the stay you have in mind. This is a demonstration; no reservation is confirmed.', image: m('vista-reflecting', "Still reflecting pool facing soft hills"), primary: { label: 'Request a stay', href: 'booking' } } },
],
    },
    {
      id: 'discover', path: 'sanctuary', title: 'The sanctuary', description: "Follow the stone terraces of Ouren. Courtyards hold the sky, deep windows frame the hills and pale walls gather the changing light.", nav: { order: 10, label: 'Sanctuary' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The sanctuary', title: 'Terraces, water, *silence*', image: m('vista-terraces', "Stone terraces stepping down a hillside with cypress trees") } },
        { type: 'introduction', content: { eyebrow: 'The place', title: 'Stone terraces, *quiet rooms*', body: ['Ouren occupies a hillside of dry-stone terraces, olive trees and cypress. Only twelve rooms share it.', 'There are no televisions, and phones are kindly asked to rest too.'], image: m('vista-terraces', "Stone terraces stepping down a hillside with cypress trees"), secondaryImage: m('arch-light', "Daylight through a deep window in a pale wall", { width: 1200, height: 1500 }), facts: [{ value: '12', label: 'Quiet rooms' }, { value: '3', label: 'Warm pools' }, { value: '0', label: 'Screens' }] } },
        { type: 'resortMap', theme: 'dark', content: { eyebrow: 'The grounds', title: 'Walk the *terraces*', intro: 'Change the light and explore each space.' } },
        { type: 'culture', theme: 'alt', content: { eyebrow: 'Principles', title: 'How we *care*', items: [{ title: "Room for silence", text: 'Quiet hours from dusk to breakfast.' }, { title: "Following the season", text: 'Rituals and food follow the land.' }, { title: "Time to listen", text: 'Room to listen. Time to notice.' }] } },
        { type: 'virtualTour', theme: 'dark', content: { eyebrow: '360°', title: 'From the *upper terrace*', panorama: '/media/wellness/panorama.webp', fallback: m('vista-terraces', "Stone terraces stepping down a hillside with cypress trees"), label: 'Panoramic view from the upper terrace' } },
      ],
    },
    { id: 'map', path: 'map', title: "Terrace map", description: "Explore the Ouren terrace model in changing light. Find the bathhouse, quiet rooms and paths between the garden and the water.", nav: { order: 15 }, sections: [{ type: 'resortMap', variant: 'full', theme: 'dark', content: { title: 'Ouren grounds' } }] },
    {
      id: 'stays', path: 'rooms', title: 'Rooms & houses', description: "A low bed, a pale wall, one view. Explore the rooms, courtyard houses and garden pavilions of Ouren, held between stone and light.", nav: { order: 20, label: 'Quiet rooms' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'Rooms & houses', title: 'Designed around *one view*', image: m('room-court', "Stone bath before a window to a reflecting pool") } },
        { type: 'accommodations', variant: 'index', content: { title: 'Quiet rooms' } },
        { type: 'accommodationHighlights', theme: 'alt', content: { title: 'In every room' } },
      ],
    },
    {
      id: 'wellness', path: 'rituals', title: 'Daily rituals', description: "Move from warm water to a quiet room. Discover the Ouren Bathhouse, its stone terraces and rituals of measured touch and sound.", nav: { order: 30 },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The Bathhouse', title: 'Water, *warmth* and stone', image: m('spa-bath', "A stone tub before a window onto still water") } },
        { type: 'wellness', variant: 'full', content: { title: 'Rituals & spaces' } },
        { type: 'pools', theme: 'alt', content: { eyebrow: 'Water', title: 'Three *warm* pools', image: m('exp-pool', "A pale deck over a still pool"), items: [{ title: 'Hot pool', text: '39°' }, { title: 'Warm pool', text: '34°' }, { title: 'Reflecting pool', text: 'Cool, still' }] } },
      ],
    },
    {
      id: 'experiences', path: 'days', title: 'The days', description: "Walk at first light, stretch beside water or listen as a bowl falls silent. Explore the gentle experiences imagined for Ouren.", nav: { order: 40, label: 'Days' },
      sections: [
        { type: 'hero', variant: 'page', content: { eyebrow: 'The days', title: 'A gentle *rhythm*', image: m('exp-walk', "A pale path through tall trunks in mist") } },
        { type: 'experiences', variant: 'index', content: { title: 'Gentle experiences' } },
        { type: 'romantic', theme: 'alt', content: { eyebrow: 'Together', title: 'Stillness, *shared*', image: m('vista-reflecting', "Still reflecting pool facing soft hills"), category: 'land' } },
      ],
    },
    { id: 'planner', path: 'planner', title: 'Your rhythm', description: "Leave space in the day. Choose a few Ouren experiences, arrange a gentle rhythm and share a wish list that does not reserve a stay.", nav: { order: 45 }, sections: [{ type: 'planner', variant: 'full', content: { eyebrow: 'Your rhythm', title: 'Shape your *rhythm*', intro: 'Choose what you need — and share it with your host.' } }] },
    { id: 'dining', path: 'table', title: 'The Table', description: "Leaves, roots and the colour of the season. Discover the shared table and quiet tea room imagined among the terraces of Ouren.", nav: { order: 50, label: 'Table' }, sections: [{ type: 'hero', variant: 'page', content: { eyebrow: 'Nourishment', title: 'From the *terraces*', image: m('dining-table', "Long dining table in warm evening light") } }, { type: 'gastronomy', variant: 'index', content: { title: 'Where we eat' } }] },
    { id: 'booking', path: 'request', title: 'Request a stay', description: "Write a few lines about the stay you have in mind. Preview an Ouren request in your e-mail app; the demonstration confirms no booking.", nav: { show: false }, sections: [{ type: 'booking', variant: 'page', content: { eyebrow: 'Arrivals', title: 'Request a *stay*', intro: 'Your e-mail app opens with a draft request. These demonstration contacts do not confirm a stay.' } }, { type: 'packages', theme: 'alt', content: { eyebrow: 'Programmes', title: 'Guided *stays*', image: m('exp-stones', "Smooth stones balanced on a pale surface"), items: [{ title: 'Seven-day reset' }, { title: 'Silent weekend' }], cta: { label: 'Ask a host', href: 'mailto:hosts@ouren.example.com' } } }] },
    { id: 'contact', path: 'contact', title: 'Contact Ouren', description: "Bring a question or a thought about your stay. Explore fictional Ouren contact details and sample arrival information to replace.", nav: { order: 90, group: 'secondary' }, sections: [{ type: 'contact', content: { eyebrow: 'Contact Ouren', title: 'Write to a *host*' } }, { type: 'location', theme: 'alt', content: { eyebrow: 'Arriving', title: 'The path to *Ouren*', text: 'Demonstration text — replace with real directions.', access: [{ mode: 'Car', text: 'Example only — replace with verified road and parking details.' }, { mode: 'Transfer', text: 'Example only — replace with verified transfer arrangements.' }] } }] },
  ],
  templates: { stay: { basePath: 'rooms' }, experience: { basePath: 'days' } },
};

export default config;
