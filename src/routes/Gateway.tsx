import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { plants, gardenBeds } from "../data/plants";
import { BED_PLOTS, PLAQUE } from "../data/medicinalGarden";
import { materials } from "../data/materials";
import { BotanicalPlate } from "../components/BotanicalPlate";
import { Icon, type IconName } from "../components/ui/Icon";
import { useCalmMotion } from "../components/motion/Reveal";
import type { Plant } from "../types/plant";

/* ------------------------------------------------------------------ *
 * The doorway.
 *
 * There are two gardens, and they are not the same kind of object.
 * Vanaspati we drew: the medicine organises the ground, and it exists
 * here and nowhere else. The medicinal garden is laid out like a working
 * Ayurvedic herb garden — gate, spine, kerbed beds and a lily pond.
 *
 * A visitor arriving cold cannot guess that difference, and getting it
 * wrong in either direction is bad — either the designed garden reads
 * as the other. So
 * each card says which kind it is on its face, and the walkable one carries
 * enough of the actual place to stand on its own.
 * ------------------------------------------------------------------ */

interface Door {
  to: string;
  /** The badge over the plate — which *kind* of garden this is. */
  kind: string;
  kindIcon: IconName;
  eyebrow: string;
  title: string;
  sub?: string;
  body: string;
  facts: string[];
  /** Only the walkable garden carries one. */
  note?: string;
  accent: string;
  plants: Plant[];
  /** Shown in place of the plates by a door that holds no plants. */
  motifs?: { icon: IconName; label: string }[];
}

export default function Gateway() {
  const calm = useCalmMotion();

  const doors = useMemo<Door[]>(() => {
    const sample = (ids: string[]) =>
      ids
        .map((id) => plants.find((p) => p.id === id))
        .filter((p): p is Plant => Boolean(p));
    return [
      {
        to: "/garden",
        kind: "Learning garden",
        kindIcon: "layers",
        eyebrow: "Designed for learning",
        title: "Vanaspati",
        body: "A garden we laid out ourselves, arranged by what the plants treat — digestion, immunity, the mind — so that walking it walks you through the medicine. It exists here and nowhere else.",
        facts: [
          `${plants.length} species in ${gardenBeds.length} themed beds`,
          "Beds arranged by ailment, not by any map",
          "Guided tours and a narrated opening",
        ],
        accent: "#5c8a4a",
        plants: sample(["tulsi", "turmeric", "ashwagandha"]),
      },
      {
        to: "/medicinal-garden",
        kind: "Walkable garden",
        kindIcon: "map",
        eyebrow: "Walk it in 3D",
        title: PLAQUE.title,
        sub: PLAQUE.devanagari,
        body: "A working-style Ayurvedic herb garden, laid out as a real one would be — the south gate, the central spine, the kerbed beds, the lily pond, and the pylons overhead. Walk it gate to pond and read each bed's board as you pass.",
        facts: [
          "A walkable Ayurvedic herb garden",
          "Named in Sanskrit, as the classical texts name them",
          `${BED_PLOTS.length} beds rebuilt — walkable, gate to pond`,
        ],
        note: "A virtual reconstruction made for study, not survey data.",
        accent: "#8a6a2f",
        plants: sample(["neem", "bael", "arjuna"]),
      },
      {
        to: "/rasashala",
        kind: "Pharmacy and lab",
        kindIcon: "flask",
        eyebrow: "Everything that is not a plant",
        title: "Rasashala",
        sub: "रसशाला",
        body: "Ayurveda is not only herbs. The pharmacy holds what the garden cannot: the microbes that carry a fermentation, the animal-derived materials, and the metals and minerals of rasa shastra — each with the law that reaches it.",
        facts: [
          `${materials.length} microbial, animal and mineral sources`,
          "Four areas: fermentation, culture vault, animal shelf, rasa shelf",
          "Two of them named in Schedule E(1) of the Drugs and Cosmetics Rules",
        ],
        note: "Descriptive only — no preparation methods and no doses.",
        accent: "#7b5ea7",
        plants: [],
        motifs: [
          { icon: "drop", label: "Fermentation" },
          { icon: "shield", label: "Culture vault" },
          { icon: "leaf", label: "Animal shelf" },
          { icon: "sparkle", label: "Rasa shelf" },
        ],
      },
    ];
  }, []);

  /* overflow-x-clip, not overflow-hidden: the ground wash needs containing
   * sideways, but hiding the vertical overflow too meant that on a short or
   * narrow window — where the two doors stack — everything past the fold was
   * simply cut off, with no way to scroll to it. */
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {/* A quiet ground so neither door has to fight a photograph. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 62%)",
        }}
        aria-hidden
      />

      {/* Centred when it fits, top-aligned when it does not: plain centring
          pushes overflow off both ends, and the half above the viewport can
          never be scrolled back to. */}
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center-safe px-4 py-10 sm:px-6 sm:py-16">
        <motion.header
          initial={calm ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">
            Vanaspati · virtual herbal garden
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.03em]">
            Two gardens and a pharmacy.
          </h1>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft text-balance-pretty">
            One garden we designed, arranged by what the plants treat. One
            walkable Ayurvedic herb garden, laid out bed by bed in 3D. And the
            Rasashala, where the microbial, animal and mineral sources are kept.
            Pick the door you want to come in by — you can cross between them
            whenever you like.
          </p>
        </motion.header>

        <div className="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-3">
          {doors.map((door, i) => (
            <motion.div
              key={door.to}
              initial={calm ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.12 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                to={door.to}
                className="group flex h-full flex-col overflow-hidden rounded-4xl border border-line bg-raised transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
              >
                <div
                  className="grain relative flex h-44 items-end gap-2 overflow-hidden px-5 pb-4 sm:h-52"
                  style={{
                    background: `radial-gradient(120% 100% at 50% 110%, color-mix(in srgb, ${door.accent} 32%, transparent) 0%, color-mix(in srgb, ${door.accent} 9%, var(--surface-sunken)) 60%, var(--surface-sunken) 100%)`,
                  }}
                >
                  {door.plants.map((plant, n) => (
                    <BotanicalPlate
                      key={plant.id}
                      plant={plant}
                      className="h-32 flex-1 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05] sm:h-40"
                      style={{ transitionDelay: `${n * 40}ms` }}
                    />
                  ))}

                  {/* A door with no plants says what it holds instead — the
                      pharmacy's four areas, in the order they are walked. */}
                  {door.motifs?.map((motif, n) => (
                    <span
                      key={motif.label}
                      className="mb-2 flex flex-1 flex-col items-center gap-1.5 text-center transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1"
                      style={{ transitionDelay: `${n * 40}ms`, color: door.accent }}
                    >
                      <Icon name={motif.icon} size={26} />
                      <span className="text-[0.62rem] font-semibold tracking-[0.08em] text-ink-soft uppercase">
                        {motif.label}
                      </span>
                    </span>
                  ))}

                  {/* Which kind of garden this is, said before anything else
                      is read — it is the one thing you cannot infer from the
                      plates, since both doors hold the same plants. */}
                  <span
                    className="absolute top-4 left-5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold tracking-[0.11em] uppercase backdrop-blur-sm"
                    style={{
                      color: door.accent,
                      borderColor: `color-mix(in srgb, ${door.accent} 38%, transparent)`,
                      background: `color-mix(in srgb, ${door.accent} 13%, var(--surface-raised))`,
                    }}
                  >
                    <Icon name={door.kindIcon} size={12} />
                    {door.kind}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p
                    className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase"
                    style={{ color: door.accent }}
                  >
                    {door.eyebrow}
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl leading-none font-semibold tracking-[-0.02em]">
                    {door.title}
                    {door.sub && (
                      <span className="ml-2 text-lg font-normal text-ink-soft">
                        {door.sub}
                      </span>
                    )}
                  </h2>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-soft text-balance-pretty">
                    {door.body}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {door.facts.map((fact) => (
                      <li
                        key={fact}
                        className="flex items-start gap-2 text-[0.8rem] text-ink-faint"
                      >
                        <span
                          className="mt-[0.42rem] size-1.5 shrink-0 rounded-full"
                          style={{ background: door.accent }}
                        />
                        {fact}
                      </li>
                    ))}
                  </ul>

                  {/* Pushed to the foot of the card so the two doors line
                      their Enter up with each other despite unequal prose. */}
                  <div className="mt-auto">
                    {door.note && (
                      <p className="mt-5 border-t border-line pt-3 text-[0.73rem] leading-relaxed text-ink-faint text-balance-pretty">
                        {door.note}
                      </p>
                    )}

                    <span
                      className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold transition-transform duration-300 group-hover:translate-x-0.5"
                      style={{ color: door.accent }}
                    >
                      Enter
                      <Icon name="arrowRight" size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
