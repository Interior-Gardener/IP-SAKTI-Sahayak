# Vanaspati — Virtual Herbal Garden

<div align="center">

  <p>
    <img src="https://img.shields.io/badge/Virtual-Herbal%20Garden-2E7D32?style=for-the-badge" alt="Virtual Herbal Garden" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-Ready-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </p>

  <h3>Explore medicinal plants through a living 3D herbal garden</h3>

  <p>
    <a href="https://tushar-surti.github.io/virtual-herbal-garden/">🌿 Live Demo</a>
    &nbsp;•&nbsp;
    <a href="#a-quick-look">✨ Highlights</a>
    &nbsp;•&nbsp;
    <a href="#running-it">🚀 Run Locally</a>
  </p>

</div>

An interactive 3D garden of AYUSH medicinal plants. Twenty-five species, six themed beds,
six guided tours, and a compendium written the way a vaidya would describe a plant —
rasa, guna, virya, vipaka, the part that carries the medicine, and the cautions that matter.

> 🌿 Step into the experience: [Live Demo](https://tushar-surti.github.io/virtual-herbal-garden/)

## A quick look

<div align="center">

<table>
  <tr>
    <td><strong>25</strong><br/>Medicinal species</td>
    <td><strong>6</strong><br/>Themed garden beds</td>
    <td><strong>6</strong><br/>Guided tours</td>
    <td><strong>3D</strong><br/>Interactive plant exploration</td>
  </tr>
</table>

</div>

## Features at a glance

| 🌱 Explore | 🔍 Discover | 📚 Learn | 🎧 Listen |
| --- | --- | --- | --- |
| Walk through the 3D herbal garden and inspect plants up close. | Search by names, uses, parts, and conservation details. | Read botanical and Ayurvedic knowledge side by side. | Use narration and guided tours for a more immersive experience. |

### Why this project stands out

- Beautiful, immersive garden-style interface inspired by a living herbarium
- Procedurally generated botanical forms driven by structured plant data
- Ayurvedic insights visualized alongside botanical information
- Search, compare, tours, atlas, and personal garden features in one place
- Built for learning, exploration, and presentation

Built for the Smart India Hackathon problem statement on a Virtual Herbal Garden.

---

## The idea that makes it work

**Every plant in this garden is grown at run time from its botanical description.**
There is not a single downloaded 3D model, texture, or photograph in the project.

A plant's morphology — leaf shape, phyllotaxy, branching order, inflorescence type,
whether the stem is square — is written as data:

```ts
model: {
  archetype: 'herb',
  height: 0.62,
  stem: { color: '#6a7f4a', radius: 0.012, square: true },   // Lamiaceae tell
  branching: { levels: 2, count: 5, angle: 42, startAt: 0.25 },
  leaf: { shape: 'ovate', arrangement: 'opposite', serration: 0.55, … },
  flower: { form: 'spike', color: '#a06fb8', petals: 5, … },
}
```

…and a generator turns that into geometry. The same numbers also drive the 2D specimen
plates on every card, so a plant's silhouette is recognisably itself in both places.

This matters for three reasons:

1. **It scales.** Adding a plant is thirty lines of data, not a week in Blender.
2. **It's honest.** The model is derived from the botany, so an opposite-leaved square-stemmed
   mint really looks like one, and a pinnate neem frond really has 9–19 leaflets.
3. **It's tiny.** The entire garden — 25 species, ground plan, grass — downloads as code.
   No asset pipeline, no CDN, works offline after first load.

---

## What's in it

| Requirement | How it's met |
| --- | --- |
| Interactive 3D models | Orbit, zoom and inspect any plant; procedurally generated with wind, venation and bark shading |
| Detailed information | Botanical + family + names in six languages, habitat, morphology, parts used, Ayurvedic profile, classical preparations, cultivation calendar, precautions |
| Multimedia | Four botanical plates per species (habit, leaf study, inflorescence, medicinal part), four audio-description tracks, animated 3D specimen |
| Search & filter | Weighted fuzzy search over names, symptoms and Sanskrit synonyms; facets for use, plant type, part used, region, AYUSH system and conservation status |
| Virtual tours | Six themed walks that fly the camera bed to bed with narration, in a letterboxed story mode |
| User interaction | Bookmarks, autosaving study notes, progress tracking, native share sheet, social links, downloadable study sheet |
| Data visualisation | An Atlas that reads the whole compendium as charts, and a comparison bench for putting herbs side by side |

### The Grand Walk

The main way through the garden. It opens outside a **walled** garden: a boundary wall
runs the whole perimeter and the gate's two leaves are shut, so there is nothing to see
but the entrance. Pressing **Open the gate** swings both leaves inward on their hinges,
and the camera glides under the lintel into a garden you have not seen yet.

**Every stop then happens in that same scene.** The camera flies to each plant where it
actually stands and frames it close, its medicinal parts labelled with hotspots on the
living specimen — no studio, no second copy of the model, and the beds and plaza stay
visible behind. Everything the compendium holds opens around the edges of the frame at
the same time:

| Where | What is on it |
| --- | --- |
| Left | Habit, family and conservation status; the full entry prose; grow difficulty, systems and range; the names in six languages; how to recognise it in the field |
| Centre | The living specimen, framed close, parts labelled in place — still draggable |
| Right | The rasa hexagon, the virya scale, the doshic effect, the medicinal part, guna, and the complaints it is filed under |
| Below | A dossier: what it treats · how it is given · how to grow it · cautions · the four botanical plates · worth knowing · your own notes |

The dossier expands to half the screen for proper reading, and notes save to the device
as you type. **There is deliberately no link out to a flat page** — everything the plant
entry carries is readable here, inside the garden.

**Every panel has its own Listen button**, and "Walk it for me" reads each plant aloud and
moves on by itself when the reading is done — the whole thing runs hands-free. Arrow keys
change stop, space plays and pauses, escape leaves, dragging still looks around mid-stop,
and clicking any other plant in the scene jumps the walk to it. The URL tracks the current
plant, so a walk can be resumed or linked to from the middle.

The wall is raised only for the walk: the bed views used by the garden and the themed tours
stand further out than the wall does, and would be looking at masonry instead of planting.

### Showing a newcomer around

Three more ways in, all replayable from the **?** menu in the header:

- **A cinematic opening.** Titles play over the live garden while the camera flies a
  scripted route through it. Skipping leaves you exactly where the camera stopped —
  there is no separate splash screen to escape from.
- **A guided walkthrough.** Nine spotlit stops that cross the whole site: beds,
  daylight, search, facets, the Ayurvedic fingerprint, the 3D specimen, the Atlas,
  tours, and where progress is saved. Steps name the page and the element they point
  at, and fall back to a centred card if a viewport hides the target.
- **Presentation mode** (press **P**). A hands-free reel of eleven scenes that drives
  the real app — real routes, real camera moves, no screenshots — and narrates itself.
  Space pauses, arrows scrub, escape leaves. Built for talking to a room.

### Reading a plant as shapes

Ayurvedic pharmacology is usually printed as a list of five properties. Every plant
page draws it instead:

- a **shad-rasa hexagon** for the six tastes, with the dominant one weighted;
- a **virya scale** from shita to ushna, nudged by the gunas, so a sharp heating herb
  sits further along than a merely warm one;
- **vipaka**, the taste that survives digestion;
- a centre-anchored **doshic bar** per dosha — pacifies grows one way, aggravates the other.

None of this is a second copy of the data. `src/lib/ayurveda.ts` parses the same prose
the compendium already carries ("Pacifies Kapha and Vata; may aggravate Pitta"), so the
charts cannot drift away from the text beside them.

### The Atlas

One route that reads all twenty-five species at once: a schematic map of where they grow,
a force-laid graph of every plant against every complaint it treats, the distribution of
tastes and potencies, and a conservation ladder that marks which at-risk plants are
harvested for root, bark or heartwood — the parts that do not grow back. Every number on
the page is derived from the plant data at load time, so it cannot fall out of step with
the collection.

### The comparison bench

Two or three plants on one set of axes: taste hexagons overlaid, potencies on a shared
scale, doshic effects in a grid, and the properties lined up row by row. The bench state
lives in the URL, so a comparison is a link.

### Beyond the brief

- **A day-night cycle.** One clock value from before dawn to night drives the sky gradient,
  fog, sun colour and angle, ambient bounce and tone-mapping exposure. After sunset the
  fireflies come out. `src/three/daylight.ts` holds the whole table, so the sky and the
  shadows can never disagree about what time it is. The theme toggle moves the sun too —
  daylight opens the garden in late afternoon, dark opens it at dusk — so the chrome and
  the scene always agree; the slider overrides both.
- **A horizon.** The garden sits under a gradient dome and on open country that recedes
  into haze, rather than floating in a flat field of background colour. The lawn dissolves
  by alpha into that country, so there is no plate edge to catch the eye at any hour.
- **Labelled part hotspots** on the 3D model — tap "Bark" and see where on the tree it comes from.
- **A real scale bar**, so a 14 cm creeper and a 3 m tree are not silently drawn the same size.
- **Conservation framing** — one whole tour is about why guggulu is Critically Endangered,
  because the medicinal part is the part that kills the plant.
- **Offline-first**: no network calls after load. Narration uses the browser's own speech synthesis.
- **Everything is a link**: a bed, a plant, a plant's Ayurvedic tab, a region filter, a
  three-way comparison — all addressable, all survive a hard refresh.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run lint
```

Node 20+ recommended (developed on Node 25).

Deploying to any static host works; `public/_redirects` and `vercel.json` are included so
client-side routes such as `/plant/tulsi` survive a hard refresh.

---

## Tech

- **React 19** + **TypeScript** + **Vite 8**
- **three.js** via **@react-three/fiber** and **@react-three/drei**
- **Tailwind CSS v4** with a semantic token layer for light/dark
- **Zustand** (persisted to `localStorage`) for bookmarks, notes and settings
- **React Router 7**
- **Motion** for page transitions, the opening, and the chart animations

Every chart is hand-drawn SVG. There is no charting library in the dependency list —
a hexagon, a spring layout and a stacked bar are less code than the adapter would be.

No backend. Everything a visitor saves lives on their own device.

---

## How the garden is put together

```
src/
  data/            25 plants, 6 beds, 6 tours — the compendium
  types/plant.ts   the schema that drives both the prose and the geometry
  three/
    procedural/
      leaf.ts      parametric blade: a profile function per botanical leaf shape
      plant.ts     archetype skeletons, phyllotaxy, flowers, fruit, merging
      rng.ts       seeded PRNG, so a plant always grows the same way
    materials.ts   one shader for the whole garden: wind, venation, bark
    gardenTexture.ts   the garden plan, painted once to a canvas
    GardenScene.tsx    beds, plaza, instanced planting, camera rig
    PlantViewer.tsx    single-specimen viewer with part hotspots
  lib/
    plate.ts       the same leaf maths, projected to SVG specimen plates
    search.ts      weighted index + fuzzy fallback
    speech.ts      audio descriptions via SpeechSynthesis
  lib/ayurveda.ts  rasa, virya, vipaka and dosha parsed out of the compendium's prose
  three/daylight.ts  one clock value → sky, sun, fog, ambient, exposure, fireflies
  components/
    GardenIntro.tsx     the cinematic opening, played over the live scene
    Walkthrough.tsx     cross-route spotlight tour, driven by `data-tour` handles
    PresentationMode.tsx  the hands-free demo reel
    viz/                radar, fingerprint, map, constellation, conservation ladder
  three/GardenGate.tsx  the torana you come in through
  routes/          Garden · Walk · Explore · Atlas · Compare · PlantPage · Tours · TourPage · MyGarden
```

### Performance notes

Rendering twenty-five distinct plants without instancing would be hopeless, so:

- Each plant merges into **at most six geometries** — one per material — instead of hundreds of meshes.
- **Mesh resolution and leaf count are separate knobs.** A garden seen from ten metres needs many
  leaves of few triangles; a specimen under inspection needs the opposite.
- A **leaf budget** with an up-front census keeps branching from exploding, and thins the whole
  plant evenly rather than spending everything on the first limb.
- Lawn and bed planting are **two instanced meshes**, roughly 2,600 tufts in two draw calls.
- Foliage cards take the **ground's normal**, the standard trick that stops vertical quads
  going black.
- All foliage shares **one compiled shader program**, via `customProgramCacheKey`.
- Quality is auto-detected from device capability and overridable in Settings.

The whole garden is about 60k triangles on the light preset and builds in under 100 ms.

---

## About the plant data

Botanical descriptions, Ayurvedic properties and cultivation notes follow the conventions of
the Ayurvedic Pharmacopoeia of India and standard field floras. Conservation statuses reflect
IUCN Red List and Indian regulatory listings.

**This is an educational resource, not medical advice.** Every plant page carries its
contraindications, and several — sarpagandha and liquorice especially — are genuinely
dangerous when self-prescribed. Consult a registered AYUSH practitioner.

---

## Keyboard

| Key | Does |
| --- | --- |
| `⌘K` / `/` | Search |
| `space` | Start or pause the Grand Walk |
| `P` | Presentation mode |
| `space` | Pause the reel, or play/pause a tour |
| `← →` | Move between scenes, tour stops or walkthrough steps |
| `esc` | Leave whatever is running |

---

## Known limits

- Speech narration depends on the browser's installed voices; quality varies, and it is
  unavailable in a few browsers. The UI disables the control rather than failing silently.
- Models are botanically faithful in structure, not photoreal. That is a deliberate trade:
  a stylised plant that is *correct* teaches better than a pretty one that is not.
- Fifteen of the twenty-five species have flowers modelled; the rest flower rarely in
  cultivation and are shown vegetative, which is how you would actually find them.
- The India in the Atlas is a **schematic**, drawn by hand to place the climatic regions
  in roughly the right relationship to each other. It is labelled as such on the page. It
  is not survey data and should not be read as a statement about boundaries.
