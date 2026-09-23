import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AppShell } from './components/AppShell'
import { Icon } from './components/ui/Icon'
import { useCalmMotion } from './components/motion/Reveal'

// The 3D routes carry three.js; keep them out of the initial bundle.
const Gateway = lazy(() => import('./routes/Gateway'))
const Garden = lazy(() => import('./routes/Garden'))
const MedicinalGarden = lazy(() => import('./routes/MedicinalGarden'))
const Rasashala = lazy(() => import('./routes/Rasashala'))
const RegistryMarg = lazy(() => import('./routes/RegistryMarg'))
const Workbench = lazy(() => import('./routes/Workbench'))
const TourPage = lazy(() => import('./routes/TourPage'))
const PlantPage = lazy(() => import('./routes/PlantPage'))
const MaterialPage = lazy(() => import('./routes/MaterialPage'))
const Explore = lazy(() => import('./routes/Explore'))
const Tours = lazy(() => import('./routes/Tours'))
const MyGarden = lazy(() => import('./routes/MyGarden'))
const Atlas = lazy(() => import('./routes/Atlas'))
const Compare = lazy(() => import('./routes/Compare'))
const Quiz = lazy(() => import('./routes/Quiz'))
const Sahayak = lazy(() => import('./routes/Sahayak'))
const Sources = lazy(() => import('./routes/Sources'))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Icon name="seedling" size={28} className="animate-float" />
      <p className="font-display text-sm tracking-wide">Growing the garden…</p>
    </div>
  )
}

/* The 3D routes own the full viewport and run their own camera moves, so
 * a crossfade on top of them only muddies the picture. The doorway is here
 * too, not because it fills the viewport — it scrolls like any other page —
 * but because it already brings its own header and cards in on arrival, and
 * a page fade over the top of that is one animation too many. Everything
 * else gets a short rise-and-fade between pages. */
function skipsPageFade(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/garden' ||
    pathname === '/medicinal-garden' ||
    pathname === '/rasashala' ||
    pathname === '/registry-marg' ||
    pathname === '/workbench' ||
    pathname === '/quiz' ||
    pathname.startsWith('/tours/')
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const calm = useCalmMotion()
  const noFade = skipsPageFade(location.pathname)
  /* Only the canvas routes want the wrapper pinned to the viewport; the
   * doorway has to be free to grow past it and scroll. */
  const fillsViewport = noFade && location.pathname !== '/'

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={noFade ? 'immersive' : location.pathname}
        className={fillsViewport ? 'h-full' : undefined}
        initial={calm || noFade ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={calm || noFade ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            {/* The doorway: two gardens, and you pick one. */}
            <Route path="/" element={<Gateway />} />
            <Route path="/garden" element={<Garden />} />
            <Route path="/medicinal-garden" element={<MedicinalGarden />} />
            <Route path="/rasashala" element={<Rasashala />} />
            <Route path="/registry-marg" element={<RegistryMarg />} />
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/plant/:id" element={<PlantPage />} />
            <Route path="/material/:id" element={<MaterialPage />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/tours/:id" element={<TourPage />} />
            <Route path="/my-garden" element={<MyGarden />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/sahayak" element={<Sahayak />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    // Served from /<repo>/ on GitHub Pages and from / everywhere else; Vite
    // hands whichever it is to the bundle as BASE_URL.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </BrowserRouter>
  )
}
