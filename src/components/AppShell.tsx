import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useGarden } from '../store/useGarden'
import { Icon, type IconName } from './ui/Icon'
import { cx } from './ui/primitives'
import { CommandPalette } from './CommandPalette'
import { Walkthrough } from './Walkthrough'
import { PresentationMode } from './PresentationMode'
import { SahayakDrawer } from './sahayak/Drawer'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/garden', label: 'Garden', icon: 'map' },
  { to: '/rasashala', label: 'Rasashala', icon: 'flask' },
  { to: '/explore', label: 'Explore', icon: 'grid' },
  { to: '/atlas', label: 'Atlas', icon: 'layers' },
  { to: '/tours', label: 'Tours', icon: 'route' },
  { to: '/quiz', label: 'Quiz', icon: 'quiz' },
  { to: '/my-garden', label: 'My Garden', icon: 'bookmark' },
]

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Vanaspati home">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-moss-900 text-moss-300 transition-transform duration-500 group-hover:rotate-[-8deg]">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
          <path d="M8 24C8 24 6.5 14 12 9.5S25 6 25 6s1 10-4 15-13 3-13 3Z" fill="currentColor" />
          <path d="M8.5 24C11 19 15.5 13.5 24.5 6.5" stroke="#0e2f1d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-semibold tracking-[-0.02em]">Vanaspati</span>
        <span className="block text-[0.62rem] tracking-[0.18em] text-ink-faint uppercase">Virtual Herbal Garden</span>
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ *
 * The help menu gathers everything that shows a newcomer around:
 * the coach-mark walkthrough, the cinematic opening, and the
 * hands-free presentation reel.
 * ------------------------------------------------------------------ */

function HelpMenu({
  onWalkthrough,
  onPresent,
  onReplayIntro,
}: {
  onWalkthrough: () => void
  onPresent: () => void
  onReplayIntro: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const items: { icon: IconName; label: string; hint: string; kbd?: string; run: () => void }[] = [
    {
      icon: 'cursor',
      label: 'Guided walkthrough',
      hint: 'Nine stops across the whole site',
      run: onWalkthrough,
    },
    { icon: 'play', label: 'Presentation mode', hint: 'Hands-free narrated reel', kbd: 'P', run: onPresent },
    { icon: 'sparkle', label: 'Replay the opening', hint: 'The cinematic garden intro', run: onReplayIntro },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="How to use this site"
        aria-expanded={open}
        data-tour="help"
        className={cx(
          'grid size-9 place-items-center rounded-full border border-line bg-raised transition-colors',
          open ? 'text-accent' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Icon name="info" size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-3xl border border-line bg-raised shadow-[var(--shadow-lift)]"
          >
            <p className="border-b border-line px-4 py-2.5 text-[0.64rem] font-semibold tracking-[0.16em] text-ink-faint uppercase">
              Show me around
            </p>
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false)
                  item.run()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={item.icon} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.86rem] font-medium">{item.label}</span>
                  <span className="block text-[0.7rem] text-ink-faint">{item.hint}</span>
                </span>
                {item.kbd && (
                  <kbd className="rounded border border-line px-1.5 py-px font-mono text-[0.62rem] text-ink-faint">
                    {item.kbd}
                  </kbd>
                )}
              </button>
            ))}
            <div className="border-t border-line bg-sunken px-4 py-2.5 text-[0.68rem] text-ink-faint">
              <span className="font-mono">⌘K</span> search · <span className="font-mono">P</span> present ·{' '}
              <span className="font-mono">esc</span> exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useGarden((s) => s.theme)
  const toggleTheme = useGarden((s) => s.toggleTheme)
  const bookmarks = useGarden((s) => s.bookmarks.length)
  const setIntroSeen = useGarden((s) => s.setIntroSeen)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [walkthroughOpen, setWalkthroughOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [sahayakOpen, setSahayakOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  /* Routes that ARE the viewport: a canvas fills the window, owns its own
   * camera, and must not scroll. The doorway at '/' looks immersive but is
   * an ordinary document — a heading and two cards — so it is not one of
   * these; locking it to h-dvh with the overflow hidden was cutting the
   * second card off on any short window with no way to scroll down to it. */
  const immersive =
    location.pathname === '/garden' ||
    location.pathname === '/medicinal-garden' ||
    location.pathname === '/rasashala' ||
    location.pathname === '/workbench' ||
    location.pathname === '/quiz' ||
    location.pathname.startsWith('/tours/')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(input|textarea)$/i.test((e.target as HTMLElement)?.tagName ?? '')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      // The demo key. Deliberately a single press, so it works from a clicker.
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setPresenting((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startWalkthrough = () => {
    setPresenting(false)
    setWalkthroughOpen(true)
  }

  // The cinematic opening offers "Show me around"; it lives inside the
  // garden route, so it asks for the walkthrough by event rather than
  // by threading a callback down through the scene.
  useEffect(() => {
    const start = () => {
      setPresenting(false)
      setWalkthroughOpen(true)
    }
    window.addEventListener('vanaspati:walkthrough', start)
    return () => window.removeEventListener('vanaspati:walkthrough', start)
  }, [])

  // Any page or scene can call openSahayak(); the drawer reads the question and context.
  useEffect(() => {
    const open = () => {
      setPaletteOpen(false)
      setSahayakOpen(true)
    }
    window.addEventListener('sahayak:open', open)
    return () => window.removeEventListener('sahayak:open', open)
  }, [])

  const replayIntro = () => {
    setPresenting(false)
    setWalkthroughOpen(false)
    setIntroSeen(false)
    navigate('/garden')
  }

  return (
    <div className={cx('min-h-dvh', immersive ? 'h-dvh overflow-hidden' : '')}>
      <header className="glass fixed inset-x-0 top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[92rem] items-center gap-4 px-4 sm:px-6">
          <Wordmark />

          <nav className="ml-6 hidden items-center gap-1 md:flex" data-tour="nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/garden'}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-full px-3.5 py-2 text-[0.85rem] font-medium transition-colors duration-200',
                    isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-sunken"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                    {item.to === '/my-garden' && bookmarks > 0 && (
                      <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px text-[0.62rem] font-semibold text-[var(--surface-raised)] tabular-nums">
                        {bookmarks}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              data-tour="search"
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-raised px-3 text-[0.8rem] text-ink-faint transition-colors hover:border-line-strong hover:text-ink-soft"
            >
              <Icon name="search" size={15} />
              <span className="hidden sm:inline">Search plants</span>
              <kbd className="hidden rounded border border-line px-1.5 py-px font-mono text-[0.62rem] lg:inline">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSahayakOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full bg-moss-900 px-3 text-[0.8rem] font-medium text-moss-100 transition-colors hover:bg-moss-800"
            >
              <Icon name="scale" size={15} />
              <span className="hidden sm:inline">Ask Sahayak</span>
            </button>

            <HelpMenu onWalkthrough={startWalkthrough} onPresent={() => setPresenting(true)} onReplayIntro={replayIntro} />

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to daylight' : 'Switch to evening'}
              className="grid size-9 place-items-center rounded-full border border-line bg-raised text-ink-soft transition-colors hover:text-ink"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className={cx(immersive ? 'h-dvh pt-16' : 'pt-16 pb-24 md:pb-16')}>{children}</main>

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/garden'}
              className={({ isActive }) =>
                cx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6rem] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-faint',
                )
              }
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Walkthrough open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />
      <PresentationMode open={presenting} onClose={() => setPresenting(false)} />
      <SahayakDrawer open={sahayakOpen} onClose={() => setSahayakOpen(false)} />
    </div>
  )
}
