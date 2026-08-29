# Pink Gloves Cleaning — landing page

Single-page marketing site for a UK home cleaning business. Static, no backend.
Built as a Vite vanilla project; deploys as plain files to one.com shared hosting.

---

## Commands

```bash
npm install       # first time
npm run dev       # localhost:5173, HMR
npm run build     # -> dist/
npm run preview   # check the build before uploading
```

Deploy: upload the **contents** of `dist/` to the one.com web root (not the folder
itself). `base: './'` in `vite.config.js` makes all built paths relative so it
works at root or in a subfolder.

---

## Structure

```
index.html          # all markup, one page, anchor-linked sections
style.css           # all styles, token-driven, ordered by stage
main.js             # several independent IIFE-ish blocks (menu, tier disclosure,
                     # build-your-request, reviews carousel, gallery + lightbox, glove)
vite.config.js      # base:'./', outDir dist, + the gallery-manifest plugin
public/img/
  logo.png          # 600×240, wordmark + gloves on a line
  glove.png         # 520×780, glove holding a sponge (the draggable one)
  mopping.png       # Basic Clean card background
  cleaningwindow.png# Deep Clean card background
  folding.png       # Move In / Out card background
  gallery/          # see "Gallery photos" below
    living-room/
    kitchen/
    bathroom/
    oven/
    bedroom/
    reviews/        # for the "Reviews from clients" gallery tile
```

`public/` is copied verbatim into `dist/`. Reference public assets with a
leading slash (`/img/logo.png`) — Vite rewrites those against `base` at build.
Do **not** use bare relative paths like `img/logo.png`; Vite will try to resolve
them as source imports and fail.

### Gallery photos

Photos live in `public/img/gallery/<category>/`. Drop image files
(`.jpg/.jpeg/.png/.webp/.avif`) straight into the matching folder — no code
changes needed. Each gallery card's `.shot-bento` fills with a small
bento/mosaic preview (up to 4 thumbnails) and its pill button opens a swipeable
lightbox with every photo in that category. An empty category just shows the
pink gradient placeholder; nothing breaks.

**`import.meta.glob` does not work here** — Vite copies `public/` verbatim
without running it through the module graph, so a glob over it always comes
back empty. (This silently emptied the gallery once already.) Instead, the
`gallery-manifest` plugin in `vite.config.js` reads the folder with `fs` and
serves the listing to `main.js` as `virtual:gallery`.

Two consequences worth remembering:

- The manifest is built when the dev server starts, so **restart `npm run dev`
  after adding photos** (a plain browser refresh won't pick them up). `npm run
  build` always reads fresh.
- Manifest paths are stored without a leading slash (`img/gallery/…`) and get
  `import.meta.env.BASE_URL` prefixed at runtime, which is what keeps them
  working under `base: './'`. A hardcoded `/img/...` string in JS would *not*
  be rewritten against `base` the way HTML/CSS references are, and would break
  in a subfolder.

There is no framework, no bundling of third-party libs, no CSS preprocessor.
Fonts come from the Google Fonts CDN in `<head>`. Keep it that way unless there's
a concrete reason — the whole point is that the output is three files.

---

## The business

- **Name:** Pink Gloves Cleaning
- **Tagline:** "Clean home. Calm mind. More you."
- **Secondary tagline (from print material):** "Care in every detail"
- **Phone:** +44 7493 662647 (used in `tel:` and `wa.me/447493662647`)
- **Currency:** GBP. British spellings and date formats.
- **Current promo:** £5 off first Basic Clean, £10 off first Deep Clean, "only on next week"

### Services — these are cumulative, and that matters

The source flyer says "includes everything in Basic Clean, plus" and "includes
everything in Deep Clean, plus". The UI encodes that: tiers 2 and 3 have an
expandable "Everything in X, plus:" disclosure listing the inherited items.
Don't flatten this into three independent feature lists — the nesting is the
one structurally honest thing about the section.

1. **Basic Clean** — maintenance, regularly kept homes. Grouped by room
   (Kitchen / Bathrooms / Bedrooms / Living areas & throughout).
2. **Deep Clean** — first-time clients or a full reset. Marked "Most booked".
   Adds baseboards, cabinet fronts, doors/frames, vents, buildup, inside oven,
   inside fridge.
3. **Move In / Out Clean** — empty home. Adds inside all cabinets and drawers,
   inside closets, interior fridge/oven, full bathroom + kitchen reset, trim
   detailed, floors fully done, interior windows (inside only).

**Extras** (rendered as chips): Ironing, Change bed linen, Clothes folding
(wardrobe organising), Clothes folding from dryer, Couch cleaning, Interior
fridge, Interior oven, Window cleaning (inside only), Laundry (wash & fold),
Dishes.

---

## Design system

All colour and radius decisions go through CSS custom properties at the top of
`style.css`. Don't hardcode hex values in component rules.

```css
--pink:#E12A7F        /* primary, buttons, accents */
--pink-deep:#A8135C   /* headings inside cards, hover text */
--pink-soft:#FCE1EC   /* avatars, gradient stops */
--pink-tint:#FFF7FA   /* section backgrounds, chips */
--blush:#FFFBFC       /* page background */
--ink:#2A1F25         /* body text, promo tag background */
--muted:#7E6B74       /* secondary text */
--line:#F4D3E1        /* all borders */
--r:18px              /* card radius */
--shadow: 0 1px 2px …, 0 18px 40px -28px rgba(168,19,92,.45)
```

**Type**
- `Great Vibes` — script, class `.script`. Used only for "More you." in the H1
  and nothing else. Restraint is deliberate; the logo already carries the script.
- `Jost` 400/500/600 — all headings, buttons, numbers, eyebrows, nav links.
- `Inter` 400/500 — body copy only.

**Conventions**
- `.eyebrow` = 12px, 600, `.28em` tracking, uppercase, pink. Every section opens
  with one.
- `.btn` = pastel pink pill (`--pink-soft` fill, `--pink-deep` text); hover
  deepens the tint rather than brightening, which would wash a pastel out.
  `.btn-ghost` = same shape, inset 1.5px pink border.
- `.wrap` = max-width 1120px, 22px side padding. Every section uses it.
- `section` padding: `clamp(56px,8vw,92px) 0`.
- Alternating section backgrounds: blush → pink-tint → blush → pink-tint → blush.
  Clients carries the tint (it sits second); services runs on the page blush.
  Reordering sections means re-checking this, or two tinted ones end up adjacent.

---

## Sections (table is page order; the Stage column is build order, so it no
longer runs 1-2-3 — Clients was moved above Services later on)

| Stage | Section | id |
|---|---|---|
| 0 | Navbar (sticky) | — |
| 1 | Hero: promo band + H1 + CTAs + draggable glove | — |
| 3 | Clients: 4 audience cards | `#clients` |
| 2 | Services: 3 cumulative tiers + extras chips | `#services` |
| 4 | Reviews: rating bar + 3 review cards | `#reviews` |
| 5 | Gallery: 6-tile grid, first spans 2×2 | `#gallery` |
| 0 | CTA band + footer | `#book` |

---

## Interactive pieces (all in `main.js`)

### 1. Mobile menu
Burger toggles `.open` on `#navlinks`, syncs `aria-expanded`, closes on any link
click. Below 720px the drawer also carries a "Call +44 7493 662647" link, because
the header call button is hidden at that width.

### 2. Draggable glove — the signature element
Pointer Events, not mouse/touch. Key behaviours:

- `setPointerCapture` + `touch-action:none` on `.glove`, so dragging on a phone
  doesn't scroll the page.
- **Rotation follows swing direction** via horizontal velocity:
  `rot = clamp(rot * 0.86 + vx * 0.75, -22, 22)`. The `0.86` carry-over makes it
  lag behind the hand. **These numbers have been tuned down twice by the client —
  it was `0.72 / 1.9 / ±38` and felt too twitchy. Don't raise them.**
- **Bubble trail**: `.bubble` spans spawned at the pointer while moving, rate
  limited to one per 55ms, randomised size (7–24px), drift, scale and duration
  via CSS custom properties; each removes itself on `animationend`. Nothing
  accumulates in the DOM.
- **Release**: springs home with `cubic-bezier(.18,.89,.32,1.28)` (the overshoot
  reads as a swing settling), then picks up the `.idle` sway animation.
- `prefers-reduced-motion` disables bubbles and the idle sway; drag still works.
- `.glove-stage` is `pointer-events:none` with only the image re-enabled, so the
  headline and buttons underneath stay clickable while the glove floats over them
  at `z-index:50`.

### 3. Tier disclosure
`.inherits` buttons toggle `.open` on the matching `.inherited` list via
`data-toggle`, syncing `aria-expanded`. Chevron rotates via the attribute
selector, no JS class needed.

### 4. Build-your-request
Selecting a tier (`.choose-tier`) highlights that `.tier` card, reveals `#quote`,
and scrolls to the extras chips. Chips are real `<button>`s toggled via
`aria-pressed`; clicking one before a tier is chosen shows the shared toast
("Pick main service first") instead of selecting anything. `#quote` live-builds
a plain-text message (service + extras + blank address/date/questions lines)
into a readonly textarea, with a `mailto:` link and a clipboard-copy button
(execCommand fallback) for pasting into Facebook Messenger. The `#tierHint`
pill ("Try to select one of our Services") occupies the same slot as `#quote`
and is shown/hidden by the same `render()` — clicking it scrolls back to
`#services`.

### 5. Reviews carousel
One review slide at a time inside `.review-window` (`overflow:hidden`), sliding
via `transform:translateX()` on `#reviewGrid`. Auto-advances every 6s, sliding
to 2s while an arrow is hovered/focused. Arrows (`.car-arrow`) are absolutely
positioned *inside* the window so they overlay the card — semi-transparent
until hover/press, `:hover` scoped to `@media(hover:hover)` so a mobile tap
doesn't leave it stuck glowing. Swipeable via Pointer Events. **Gotcha:** the
window's own `pointerdown` (for drag/swipe) must bail out early when
`e.target.closest('.car-arrow')` — otherwise `setPointerCapture` redirects the
arrow's `click` event to the window and the buttons silently stop working. The
gallery lightbox below uses the identical pattern and needs the same guard.

### 6. Gallery + lightbox
See "Gallery photos" above for how images are discovered. Each `.shot` card's
`.ph-pill` button opens `#lightbox` (a fixed-position overlay) showing every
photo in that category as a `.lb-track` slide deck — same
translateX-on-a-flex-track approach as the reviews carousel, with overlaid
`.lb-arrow` buttons (same pointer-capture-vs-click gotcha applies) plus
swipe, ←/→ keys, Escape, and backdrop-click to close. Clicking a pill for a
category with zero photos shows the shared toast instead of opening an empty
lightbox.

---

## Breakpoints

- **1100px+** — glove at its largest (345px), pulled furthest right
- **721–1100px** — glove absolutely positioned top-right at 305px, copy capped
  at 70% width so lines never run under it
- **≤940px** — service tiers, reviews and footer go single column
- **≤720px** — full mobile. Everything centres (`text-align:center` across hero,
  cards, reviews, footer). Service list bullet dots are hidden, since centred
  text with a left dot looks broken. Glove shrinks to 158px, sits top-right
  inside the hero. Promo band stacks but the **£5 / or / £10 row stays
  horizontal** — the client asked for this specifically.

---

## Placeholders that must be replaced before launch

| What | Current value |
|---|---|
| Instagram | `https://instagram.com/pinkglovescleaning` |
| Facebook | `https://facebook.com/pinkglovescleaning` |
| Google review link | `https://g.page/r/YOUR_GOOGLE_ID/review` (×3: nav, footer socials, footer list) |
| Email | `hello@pinkglovescleaning.co.uk` — **invented, unconfirmed** |
| Opening hours | "Mon–Sat, 8am–6pm" — **invented, unconfirmed** |
| Reviews | All three testimonials are written copy, not real clients |
| Gallery | Six categories (incl. "Reviews from clients"), populated with real photos. Add more by dropping files into `public/img/gallery/<category>/`. See "Gallery photos" above. |

The Google review short link comes from Google Business Profile → "Ask for
reviews". Better than linking the Maps listing, where users have to hunt for the
button.

---

## Google Reviews integration (researched, not yet wired)

A commented `loadGoogleReviews()` function sits at the bottom of `main.js`.
Constraints established:

- **Places API returns a maximum of 5 reviews**, no pagination, no sorting, and
  you don't choose which 5. This has been the case since 2015.
- More than 5 requires the **Google Business Profile API** — own verified
  business only, OAuth, multi-round approval, 2–4 week wait. Needs a server;
  impossible on pure static.
- **The REST endpoint has no CORS headers.** Browser `fetch` to
  `maps.googleapis.com` is blocked. The only browser-side route is the **Maps
  JavaScript API Places library** (`google.maps.importLibrary("places")` →
  `new Place({id}).fetchFields(...)`), which is what the commented code uses.
- **The key is public** in a static site. Lock it in Cloud Console: HTTP referrer
  restriction to the domain, API restriction to Maps JavaScript API only.
- **Caching Places content is prohibited** by Google's policy. Fetching once and
  pasting into a JSON file breaks the terms. `place_id` is exempt and can be
  stored indefinitely — hardcode it.
- **Attribution is mandatory**: author name, photo, link, and the Google logo
  when shown without a map.
- Billing account required; the `reviews` field sits in the most expensive Place
  Details tier.

If the client ever wants more than 5 reviews or wants the key hidden, the
smallest step is a single Cloudflare Worker or Netlify Function — one file, free
tier, and it stops being a pure static site.

---

## Rejected approaches (don't re-propose)

- **Pretext.js** — evaluated and declined. It's a real library (Cheng Lou, March
  2026) that computes text layout without DOM reflow, but it targets virtualised
  lists, canvas typography and per-frame reflow. This page has ~40 static text
  blocks. It would add a dependency for zero measurable gain. The client wanted
  "text that moves without moving the other divs" — that's just `transform`,
  which doesn't trigger reflow.
- **Base64-inlined images** — was done temporarily so the single-file preview
  worked in the Claude artifact viewer. Reverted for the Vite project. Keep
  images as files.

---

## Client working style

- Terse, direct instructions. Wants concise, actionable replies — not essays.
- Works in numbered stages and says which stage is next.
- Iterates on feel, especially motion and sizing: "smaller", "lower", "less
  sensitive". Make the change, state the numbers that moved, and offer the dial
  to turn if it's still off.
- Sends screenshots with annotations to show placement.
- Based in Sweden; the business and its copy are UK.

---

## Not yet built

- Scroll-reveal animation (agreed in principle: `IntersectionObserver` +
  `opacity`/`translateY` transition, staggered on hero, tiers and reviews.
  Transform-based so nothing reflows).
- Booking form — would need Formspree / Web3Forms, since there's no backend.
- Service area / coverage section.
- Favicon, OG tags, `robots.txt`, sitemap.
- Live Google reviews (see above).
