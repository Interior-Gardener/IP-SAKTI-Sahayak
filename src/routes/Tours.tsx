import { Link } from 'react-router-dom'
import { tours } from '../data/tours'
import { getPlant } from '../data/plants'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'

export default function Tours() {
  const completed = useGarden((s) => s.completedTours)

  return (
    <div className="mx-auto max-w-[80rem] px-4 sm:px-6">
      <header className="py-8 sm:py-12">
        <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">Guided walks</p>
        <h1 className="mt-2 max-w-3xl font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          Six routes through the garden, each with a point to make.
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft text-balance-pretty">
          A tour walks you from plant to plant, moving the camera and narrating as it goes. They are built to
          teach a principle — why bitterness cools, why the part used matters, why a popular medicine can
          endanger its own species — not just to list species.
        </p>
      </header>

      <div className="grid gap-5 pb-20 sm:grid-cols-2" data-tour="tour-list">
        {tours.map((tour, index) => {
          const done = completed.includes(tour.id)
          const preview = tour.stops.map((s) => getPlant(s.plantId)).filter(Boolean)

          return (
            <Link
              key={tour.id}
              to={`/tours/${tour.id}`}
              className="group animate-fade-up relative overflow-hidden rounded-4xl border border-line bg-raised transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="grain relative flex h-40 items-end gap-1 overflow-hidden px-5 pb-3"
                style={{
                  background: `linear-gradient(160deg, color-mix(in srgb, ${tour.accent} 30%, transparent), color-mix(in srgb, ${tour.accent} 6%, var(--surface-sunken)))`,
                }}
              >
                {preview.map(
                  (plant, i) =>
                    plant && (
                      <BotanicalPlate
                        key={plant.id}
                        plant={plant}
                        className="h-32 flex-1 origin-bottom transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                        // A staggered rise on hover, like a row of specimens
                        style={{ transitionDelay: `${i * 40}ms` } as React.CSSProperties}
                      />
                    ),
                )}
                {done && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[0.68rem] font-semibold text-accent">
                    <Icon name="check" size={12} />
                    Completed
                  </span>
                )}
              </div>

              <div className="space-y-2.5 p-5">
                <div className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.1em] uppercase" style={{ color: tour.accent }}>
                  <Icon name="route" size={14} />
                  {tour.theme}
                </div>
                <h2 className="font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.015em]">
                  {tour.title}
                </h2>
                <p className="text-[0.88rem] leading-relaxed text-ink-soft text-balance-pretty">{tour.blurb}</p>
                <div className="flex items-center gap-4 pt-2 text-[0.76rem] text-ink-faint">
                  <span className="flex items-center gap-1.5">
                    <Icon name="leaf" size={14} />
                    {tour.stops.length} stops
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="sound" size={14} />≈{tour.minutes} min
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 font-medium text-ink transition-transform group-hover:translate-x-0.5">
                    Start
                    <Icon name="arrowRight" size={15} />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <section className="mb-20 rounded-4xl border border-line bg-sunken p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Prefer to wander?</h2>
        <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-ink-soft">
          The garden is always open. Walk the beds in any order, and the plants you have met are tracked in
          My Garden so you can see what is left.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/garden">
            <Button variant="primary" icon="map">
              Enter the garden
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="secondary" icon="grid">
              Browse the compendium
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
