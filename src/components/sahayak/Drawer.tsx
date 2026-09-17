import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { OpenSahayakDetail } from '../../lib/sahayak/client'
import { Icon } from '../ui/Icon'
import { AskPanel } from './AskPanel'

/** Slide-over assistant, available on every page. Opened from the header button, the
 *  command palette, or any page via `openSahayak()`. Nothing here renders (or calls the
 *  API) until it is opened, so the garden pays nothing for it. */
export function SahayakDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [seed, setSeed] = useState<OpenSahayakDetail | undefined>()

  useEffect(() => {
    const onOpen = (e: Event) => setSeed((e as CustomEvent<OpenSahayakDetail>).detail)
    window.addEventListener('sahayak:open', onOpen)
    return () => window.removeEventListener('sahayak:open', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Sahayak assistant">
          <motion.button
            className="absolute inset-0 bg-[rgb(10_16_12/0.45)] backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Close assistant"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col border-l border-line bg-surface shadow-[var(--shadow-lift)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center gap-3 border-b border-line px-5 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-moss-900 text-moss-300">
                <Icon name="scale" size={18} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-[1.02rem] font-semibold">Sahayak</p>
                <p className="text-[0.68rem] text-ink-faint">IP &amp; regulatory guidance, with sources</p>
              </div>
              <Link to="/sahayak" onClick={onClose} className="ml-auto text-[0.74rem] text-ink-faint hover:text-ink">
                Full page
              </Link>
              <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full hover:bg-sunken">
                <Icon name="close" size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <AskPanel compact seed={seed} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
