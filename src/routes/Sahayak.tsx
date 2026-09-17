import { AskPanel } from '../components/sahayak/AskPanel'
import { Icon } from '../components/ui/Icon'

export default function Sahayak() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.18em] text-accent uppercase">
          <Icon name="scale" size={14} /> IP-SAKTI Sahayak
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          IP and regulatory guidance for Ayurveda, with sources
        </h1>
        <p className="mt-3 text-[0.95rem] text-ink-soft">
          Ask about patents, geographical indications, trade marks, biodiversity approval, licensing, labelling or
          advertising. Indian law and international law are answered separately, and every answer cites the provision
          it relies on.
        </p>
      </header>
      <AskPanel />
    </div>
  )
}
