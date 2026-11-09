# Customization guide

Every resort is a single folder: `src/presets/<id>/index.ts`, plus its media in `public/media/<id>/`. You never need to touch components to launch a new instance.

```bash
cp -r src/presets/coastal src/presets/my-resort
```

```bash
mkdir -p public/media/my-resort
```

```bash
RESORT_PRESET=my-resort npm run dev
```

In the new `index.ts`, set `id: 'my-resort'` and replace `media('coastal')` with `media('my-resort')`. The editor autocompletes and type-checks every field (`ResortConfigInput`), and the build validates everything again with readable errors.

---

## 1. Change the brand

Edit `identity` in the preset:

```ts
identity: {
  name: 'Casa Aurora Resort', shortName: 'Aurora', wordmark: 'AURORA',
  logo: { src: '/media/my-resort/logo.svg', alt: 'Casa Aurora' }, // optional: replaces the text wordmark
  favicon: '/favicons/my-resort.svg',
  tagline: '…', description: '…',
  location: { label: '…', address: '…', locality: '…', country: '…', coordinates: { lat: 0, lng: 0 } },
  notice: undefined, // remove the demo notice for real clients
}
```

## 2. Change the colours

`theme.colors` holds ten tokens: `bg`, `bgAlt`, `ink`, `inkSoft`, `line`, `accent`, `accentInk`, `dark`, `darkInk` and `darkSoft`. They become CSS custom properties (`--c-bg`, …) on every page. Sections pick `light`, `alt`, `dark` or `accent` through their `theme` field, so contrast stays consistent. Keep `ink`/`bg` and `darkInk`/`dark` at WCAG AA contrast (4.5:1).

## 3. Change the typography

1. Install an open-licensed font: `npm i @fontsource-variable/<name>`.
2. Import it in `src/styles/fonts.css`.
3. Reference the family in `theme.fonts`:

```ts
fonts: {
  display: { family: 'Fraunces Variable', fallback: 'Georgia, serif', weight: 340, variation: '"opsz" 144' },
  body: { family: 'Manrope Variable', fallback: 'system-ui, sans-serif', weight: 400 },
  accent: { … } // optional, used for italic emphasis
},
type: { displayCase: 'uppercase' | 'none', displayTracking: '-0.03em', displayLeading: 0.92, scale: 1, italicEmphasis: true }
```

In any title, `*word*` renders as emphasis (italic accent font) and `|` forces a line break.

## 4. Replace images

Put files in `public/media/<id>/` and reference them in the preset:

```ts
{ src: '/media/my-resort/pool.webp', srcMobile: '/media/my-resort/pool-portrait.webp', alt: 'Describe the image', width: 1600, height: 1000, position: '50% 70%' }
```

- Use WebP or AVIF at about 1600–2400 px wide (≤ 300 KB), and portrait crops for `srcMobile` on heroes.
- Always write a meaningful `alt`. It is required by the schema.
- `npm run assets:art` regenerates the demo artwork. Delete it for real clients.

## 5. Insert videos

The hero (`hero.mode: 'video'`), the Video Storytelling section and accommodation pages take:

```ts
video: { src: '/media/x/film.mp4', webm: '/media/x/film.webm', srcMobile: '/media/x/film-portrait.mp4',
         poster: { src: '…', alt: '…' }, captions: '/media/x/film.vtt', captionsLang: 'en', label: 'What the film shows' }
```

Hero videos autoplay muted only when motion is allowed and Save-Data is off, and they include a visible play/pause control. Keep hero films at 8–15 s and ≤ 4 MB (H.264 CRF 24 + VP9). Always ship a WebVTT track for films with meaningful content.

## 6. Replace the 3D map

`world` controls the experience (or delete `world` to remove it entirely):

- **Procedural**, no assets needed: `mode: 'procedural'`. Tune `terrain.kind` (`island` | `valley` | `terraces` | `dunes`), `height`, `colors`, `water`, `vegetation`, `architecture` and `seed`.
- **Client model**: export the property as GLB (Draco-free or **Meshopt** compressed, ≤ 15 MB, textures ≤ 2K), place it in `public/models/` and set:

  ```ts
  world: { mode: 'model', model: { src: '/models/resort.glb', scale: 1, position: [0,0,0], rotationY: 0, keepWater: true }, … }
  ```

  Hotspots snap onto the model surface automatically. Compress with `npx gltfpack -i in.glb -o out.glb -cc -tc`.
- **No 3D**: `mode: 'illustrated'` or `'image'` shows `world.fallback` (an illustrated map or aerial photo) with the same places list.

`world.fallback` is always required. It is the no-WebGL and low-power view, and it is shown while 3D loads. `npm run build:<id> && npm run assets:renders <id>` renders it top-down from your procedural world. If you use your own illustrated map, set `mapPosition: [x%, y%]` on each POI.

## 7. Configure hotspots

Hotspots are `pois`:

```ts
{ id: 'spa', name: 'The Tide House', category: 'wellness',      // stay|dining|wellness|water|nature|leisure|arrival|sport|culture
  position: [-22, 16],                                             // world x,z (terrain spans -60…60)
  structure: { type: 'spa', size: 1.2, rotation: 0.5, count: 1, spread: 4 }, // procedural building (or 'none')
  summary: '…', image: { … }, link: 'page:wellness' }               // any link token
```

Stays, experiences and dining reference a POI by `poi: 'spa'`, which enables "On the map" links (spatial discovery). Deep link straight to a place with `/map/#poi-spa`.

## 8. Add accommodations

Append to `stays`. Each item becomes a page at `/<templates.stay.basePath>/<slug>/` automatically.

```ts
{ slug: 'ocean-villa', name: 'Ocean Villa', category: 'Villa', tagline: '…', description: ['…', '…'],
  capacity: { adults: 2, children: 1 }, area: { value: 160, unit: 'm²' }, view: 'Ocean', amenities: ['…'],
  cover: {…}, gallery: [{…}, {…}, {…}],              // 3+ images → gallery section
  video: {…}, floorplan: { image: {…}, note: 'Illustrative layout' },
  tour360: { image: '/media/x/pano.webp', label: '…' }, // equirectangular 2:1
  model: { src: '/models/villa.glb', hotspots: [{ label: 'Bedroom', text: '…', position: [x,y,z] }] },
  poi: 'cliff-villas', bookingCode: 'OCEAN', bookingUrl: 'https://…', featured: true }
```

Only label a floor plan as official if the client supplied it.

## 9. Add experiences

Append to `experiences`. Each experience gets a page, appears in the explorer, index and planner, and links to the map.

```ts
{ slug: 'sunset-sail', title: '…', category: 'water', interests: ['romance', 'relax'], summary: '…', description: ['…'],
  cover: {…}, duration: '3 hours', ages: '8+', conditions: ['…'], location: '…', poi: 'jetty',
  availability: 'Mornings, on request', // static text only, never live data
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any', cta: { label: 'Ask the concierge', href: 'mailto:…' } }
```

`category` must exist in `experienceCategories`, and each `interests` id must exist in `plannerInterests`. The build checks both. Only list activities the resort actually offers.

## 10. Remove sections

Set `enabled: false` on a section, or delete it from the `sections` array. Spacing, navigation, scroll animations and links adapt automatically. A section that needs data the resort does not have (dining, wellness, stays) renders nothing.

## 11. Reorganize pages

`pages` is an ordered list:

```ts
{ id: 'dining', path: 'gastronomy', title: 'Gastronomy', enabled: true,
  nav: { show: true, label: 'Dining', order: 50, group: 'primary' | 'secondary' },
  sections: [ … ] }
```

- Reorder sections by moving them in the array, or use `order: <number>`.
- Each section accepts `enabled`, `order`, `variant`, `content`, `assets`, `theme` (light/alt/dark/accent) and `animation` (auto/none/subtle/cinematic).
- `enabled: false` on a page removes the route, its nav entries and every token link to it.
- Page `id`s with special meaning are `home` (path `''`), `map`, `stays`, `experiences`, `dining`, `planner`, `booking` and `contact`.
- Detail routes are set by `templates.stay.basePath` and `templates.experience.basePath`, which can be renamed (for example to `acomodacoes`).

The section types and their content contracts are in `src/sections/schemas.ts`. Their components are listed in `src/sections/registry.ts`.

## 12. Change the visual preset

`theme.artDirection` (tropical, mountain, forest, desert, wellness) plus the structural switches:

| Field | Options |
|---|---|
| `nav.style` | `minimal` · `framed` · `split` |
| `nav.mode` | `editorial` · `spatial` (resort map in the menu) |
| `buttons` | `line` · `frame` · `solid` |
| `gallery` | `mosaic` · `filmstrip` · `stack` |
| `heroComposition` | `bottom-left` · `center` · `split` |
| `imageTreatment` | `grain`, `tone`: natural/warm/cool/muted |
| `motion` | `intensity`: none/subtle/cinematic, `pageTransition`: veil/fade/none |
| `layout` | `radius`, `rhythm` (airy/balanced/dense), `maxWidth` |
| `hero.mode` | `immersive3d` · `video` · `editorial` |

## 13. Change the booking engine

`booking.mode`:

| Mode | Behaviour |
|---|---|
| `engine` | Validated form → `engine.url` + mapped query params, opens in a new tab |
| `redirect` | Opens `booking.url` (when the provider does not accept parameters) |
| `direct` | Uses each stay's `bookingUrl` (fallback `booking.url`) |
| `whatsapp` | Composes a message with the dates and guests to `contacts.whatsapp` |
| `email` | Opens a pre-filled e-mail to `contacts.email` |
| `concierge` | Opens `contacts.concierge.href` |
| `disabled` | Reserve buttons point to the contact page |

```ts
engine: {
  provider: 'cloudbeds' | 'siteminder' | 'synxis' | 'custom',
  url: 'https://<provider booking URL for this property>',
  params: { checkIn: '<name>', checkOut: '<name>', nights?: '<name>', adults: '<name>', children: '<name>', accommodation: '<name>', promo: '<name>' },
  dateFormat: 'YYYY-MM-DD', extra: { lang: 'en' }, target: '_blank', verified: false,
}
```

**Parameter names differ between providers and between accounts.** Get the deep-link specification from the client's provider (Cloudbeds, SiteMinder, SynXis…), map only the supported keys, test a real search, then set `verified: true`. Leave out any parameter the provider does not support.

The site never processes bookings. Availability, rates, payment and confirmation always happen on the external system. `fields` toggles inputs, and `limits` sets the maximum guests, minimum and maximum nights, and lead days (validated in the browser). `booking.offers` adds day-use, spa, dining, tour, package and event calls to action, which are links only.

## 14. Configure contacts

`contacts`: `email`, `phone`, `whatsapp` (digits with country code), `whatsappMessage`, `concierge` ({label, href}), `hours` and `social`. These feed the footer, menu, contact page, booking hand-offs, experience calls to action and the planner share.

## 15. Change the language

- Set `locale: 'en' | 'pt-BR' | 'es'`. Interface strings come from `src/i18n/ui.ts`. Add a locale by copying a block (missing keys fall back to English).
- Write the content in the preset in that language. The Altvale preset is a complete pt-BR example.
- For several languages, build one instance per language (for example `my-resort-en` and `my-resort-pt`, each on its own domain or path) and cross-link them with `alternates: [{ locale, href, label }]`. This emits `hreflang` links and a language switch in the menu.

## 16. Configure SEO

```ts
seo: { siteUrl: 'https://www.resort.com', titleTemplate: '%s — Resort', defaultTitle: '…', ogImage: '/media/x/og.webp',
       robots: 'index', keywords: [], priceRange: '$$$$' }
integrations: { ga4: 'G-XXXXXXX', searchConsoleVerification: '<token>' }
```

This generates canonical URLs, Open Graph and Twitter tags, `sitemap-index.xml`, `robots.txt`, JSON-LD (`Resort` on home, `HotelRoom` and `BreadcrumbList` on accommodation pages) and per-page title and description (`pages[].title/description/ogImage`). GA4 loads only when an ID is set, and it records a `begin_checkout` event on booking hand-off.

## 17. Publish a new instance

```bash
RESORT_PRESET=my-resort npm run build
```

`dist/` is a static site.

- **Cloudflare Pages**: set the build command to `npm run build`, the output directory to `dist`, and the environment variable `RESORT_PRESET=my-resort`. `public/_headers` sets caching and security headers.
- **Vercel**: `vercel.json` is included. Add `RESORT_PRESET` in the project environment variables.

Before going live:

- [ ] `npm test` passes.
- [ ] `identity.notice` is removed, and all demo media and copy are replaced.
- [ ] Booking parameters are tested with the provider (`verified: true`).
- [ ] Real legal, privacy and cookie pages are added if analytics is enabled.
- [ ] Alt text and video captions are reviewed.
