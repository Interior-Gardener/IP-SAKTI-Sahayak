import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { UI_LANGUAGES, setUiLanguage, type UiLanguage } from '../i18n'
import { useSahayak } from '../store/useSahayak'
import { useWorkbench } from '../store/useWorkbench'
import { useGarden } from '../store/useGarden'
import { Icon, type IconName } from './ui/Icon'
import { cx } from './ui/primitives'
import { CommandPalette } from './CommandPalette'
import { Walkthrough } from './Walkthrough'
import { PresentationMode } from './PresentationMode'
import { SahayakDrawer } from './sahayak/Drawer'

/** `label` is a key into the i18n dictionary (src/i18n). `desktop` items are
 *  left off the phone tab bar, which has room for seven. */
const NAV: { to: string; label: string; icon: IconName; desktop?: boolean }[] = [
  { to: '/garden', label: 'nav.garden', icon: 'map' },
  { to: '/rasashala', label: 'nav.rasashala', icon: 'flask' },
  { to: '/registry-marg', label: 'nav.registryMarg', icon: 'compass', desktop: true },
  { to: '/workbench', label: 'nav.workbench', icon: 'flask', desktop: true },
  { to: '/explore', label: 'nav.explore', icon: 'grid' },
  { to: '/atlas', label: 'nav.atlas', icon: 'layers' },
  { to: '/tours', label: 'nav.tours', icon: 'route' },
  { to: '/quiz', label: 'nav.quiz', icon: 'quiz' },
  { to: '/my-garden', label: 'nav.myGarden', icon: 'bookmark' },
]

/** The interface language. Switching it also sets the language Sahayak
 *  answers in, which is what someone reading the site in Hindi wants. */
function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const setAnswerLanguage = useSahayak((s) => s.setLanguage)
  return (
    <select
      aria-label={t('header.language')}
      title={t('header.language')}
      value={i18n.language}
      onChange={(e) => {
        const code = e.target.value as UiLanguage
        setUiLanguage(code)
        setAnswerLanguage(code)
      }}
      className="h-9 min-w-[6.5rem] rounded-full border border-line bg-raised px-2.5 text-[0.78rem] text-ink-soft outline-none hover:text-ink focus:border-line-strong"
    >
      {UI_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}

function Wordmark() {
  const { t, i18n } = useTranslation()
  // Wide tracking and capitals are a Latin-script device; Devanagari and Tamil
  // set in them come apart into separate marks.
  const latin = i18n.language === 'en'
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={t('brand.home')}>
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-moss-900 text-moss-300 transition-transform duration-500 group-hover:rotate-[-8deg]">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
          <path d="M8 24C8 24 6.5 14 12 9.5S25 6 25 6s1 10-4 15-13 3-13 3Z" fill="currentColor" />
          <path d="M8.5 24C11 19 15.5 13.5 24.5 6.5" stroke="#0e2f1d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-semibold tracking-[-0.02em]">Vanaspati</span>
        <span className={cx('block whitespace-nowrap text-ink-faint', latin ? 'text-[0.62rem] tracking-[0.18em] uppercase' : 'text-[0.7rem]')}>
          {t('brand.subtitle')}
        </span>
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
  const { t } = useTranslation()
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
      label: t('help.walkthrough'),
      hint: t('help.walkthroughHint'),
      run: onWalkthrough,
    },
    { icon: 'play', label: t('help.present'), hint: t('help.presentHint'), kbd: 'P', run: onPresent },
    { icon: 'sparkle', label: t('help.intro'), hint: t('help.introHint'), run: onReplayIntro },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('header.help')}
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
              {t('help.title')}
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
  const { t } = useTranslation()
  const theme = useGarden((s) => s.theme)
  const toggleTheme = useGarden((s) => s.toggleTheme)
  const bookmarks = useGarden((s) => s.bookmarks.length)
  const benchItems = useWorkbench((s) => s.items.length)
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
    location.pathname === '/registry-marg' ||
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

          <nav className="ml-4 hidden items-center gap-0.5 md:flex xl:ml-6" data-tour="nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/garden'}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-full px-2.5 py-2 text-[0.82rem] font-medium whitespace-nowrap transition-colors duration-200 xl:px-3',
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
                    {t(item.label)}
                    {item.to === '/my-garden' && bookmarks > 0 && (
                      <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px text-[0.62rem] font-semibold text-[var(--surface-raised)] tabular-nums">
                        {bookmarks}
                      </span>
                    )}
                    {item.to === '/workbench' && benchItems > 0 && (
                      <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px text-[0.62rem] font-semibold text-[var(--surface-raised)] tabular-nums">
                        {benchItems}
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
              <span className="hidden whitespace-nowrap 2xl:inline">{t('header.search')}</span>
              <kbd className="hidden rounded border border-line px-1.5 py-px font-mono text-[0.62rem] 2xl:inline">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSahayakOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full bg-moss-900 px-3 text-[0.8rem] font-medium text-moss-100 transition-colors hover:bg-moss-800"
            >
              <Icon name="scale" size={15} />
              <span className="hidden whitespace-nowrap lg:inline">{t('header.ask')}</span>
            </button>

            <LanguageSwitch />

            <HelpMenu onWalkthrough={startWalkthrough} onPresent={() => setPresenting(true)} onReplayIntro={replayIntro} />

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('header.toDay') : t('header.toEvening')}
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
          {NAV.filter((item) => !item.desktop).map((item) => (
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
              {t(item.label)}
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
