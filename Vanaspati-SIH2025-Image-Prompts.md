# Image prompts for the Vanaspati SIH 2025 deck

Four image placeholders are in the deck (dashed green boxes, named
`IMAGE PLACEHOLDER - IMAGE n` in the Selection Pane). Generate each one, send them
back, and they can be dropped into the exact boxes.

**House style — paste this into every prompt**, so the four images look like one set:

> Muted sage-and-forest-green palette with turmeric-gold and terracotta accents on a
> warm cream background (#F7F8F4). Matte finish, soft diffused light, gentle ambient
> shadows. Clean and uncluttered with generous negative space. No text, no watermark,
> no logos, no UI chrome.

---

## IMAGE 1 — Title slide hero
**Slot:** slide 1 · 5.93 × 3.62 in · **generate at 1920 × 1172 px (≈ 1.64 : 1)**

> Isometric three-quarter aerial view of a stylised virtual botanical garden in clean
> low-poly 3D: six circular planting beds arranged around a small central stone plaza
> with a round water basin, joined by pale sandstone paths crossing a soft green lawn.
> Each bed holds four or five distinct Indian medicinal plants — a small neem tree with
> pinnate fronds, a bushy tulsi with slender purple flower spikes, a spiky aloe rosette,
> tall arching lemongrass blades, a giloy vine twining up a stake, a turmeric clump with
> broad ribbed leaves. Stylised botanical-illustration look rather than photoreal, as if
> rendered from a WebGL scene. Soft warm morning light. No people.
>
> *[house style]*

**Negative prompt:** photorealistic, text, labels, watermark, logos, people, harsh
saturation, dark background, cluttered detail.

---

## IMAGE 2 — Plant viewer with part hotspots
**Slot:** slide 2 · 4.76 × 2.46 in · **generate at 1920 × 992 px (≈ 1.94 : 1)**

> A single stylised tulsi plant (holy basil: square stem, opposite ovate toothed leaves,
> a slender purple flower spike) standing centred in soft studio light, rendered in matte
> low-poly 3D on a cream background. Four small circular pin markers with thin leader
> lines and rounded white label chips point to different parts of the plant. A thin
> vertical dimension line with a small chip runs beside the plant like a scale bar.
> Product-shot framing, airy, lots of negative space.
>
> *[house style]*

**Negative prompt:** photorealistic, browser window, buttons, menus, watermark, dense
foliage, dark background.

> **Tip:** AI models garble small text. Ask for the label chips **blank** — the labels
> ("Leaf", "Flower", "Seed", "Root") can be typed over them in PowerPoint, which will
> look sharper anyway.

---

## IMAGE 3 — Wireframe leaf resolving into a shaded one
**Slot:** slide 3 · 4.76 × 2.62 in · **generate at 1920 × 1057 px (≈ 1.82 : 1)**

> Technical illustration on a pale cream background showing one botanical leaf in three
> stages, left to right: (1) a thin green wireframe mesh of the leaf surface with a
> visible quad grid and a parametric outline; (2) the same leaf half wireframe, half
> shaded; (3) the finished leaf — matte green, darker midrib, lateral veins arching
> toward a finely toothed margin. Hairline construction marks, small tick marks and a
> faint grid behind. Flat-modern scientific-diagram style, thin elegant lines.
>
> *[house style]*

**Negative prompt:** text, dimensions, numbers, annotations, photorealistic, 3D render,
heavy shading, dark background.

---

## IMAGE 4 — Students using it
**Slot:** slide 5 · 3.31 × 2.30 in · **generate at 1440 × 1000 px (≈ 1.44 : 1)**

> Three Indian college students gathered around a tablet held by one of them, in a bright
> classroom or under a tree in a campus garden, leaning in and pointing at the screen
> with interest. Soft daylight, shallow depth of field, screen content indistinct.
> Candid documentary feel.
>
> *[house style]*

**Negative prompt:** logos, brand marks, readable text on screen, stock-photo posing,
watermark, harsh flash lighting.

> If you would rather keep the deck fully illustrated, swap the first line for:
> *"Flat vector illustration of three students around a tablet…"* and keep the rest.

---

## Not AI — the QR code
Slide 6 has a small `QR CODE PLACEHOLDER` square (0.90 × 0.90 in). Generate a real QR
from the deployed URL with any QR tool and drop it in — an AI-drawn QR will not scan.

---

## Dropping the images in

Each placeholder sits at an exact position, so a generated image can be matched to it
precisely (Picture Format → Size & Position):

| Image | Slide | Left | Top | Width | Height |
| --- | --- | --- | --- | --- | --- |
| IMAGE 1 | 1 | 7.06" | 1.52" | 5.93" | 3.62" |
| IMAGE 2 | 2 | 8.05" | 1.16" | 4.76" | 2.46" |
| IMAGE 3 | 3 | 8.05" | 4.10" | 4.76" | 2.62" |
| IMAGE 4 | 5 | 9.50" | 4.04" | 3.31" | 2.30" |

Insert the picture, set those four numbers, then delete the dashed placeholder box and
its caption text underneath. Send the four files over instead and this can be scripted
in one pass, including a soft rounded-corner crop to match the cards.
