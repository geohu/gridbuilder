import * as Tooltip from '@radix-ui/react-tooltip'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { DesignsView } from './app/DesignsView'
import { useApp } from './app/store'
import { TopBar } from './app/TopBar'
import { Workspace } from './app/Workspace'
import { LibraryModal } from './app/library/LibraryModal'

export default function App() {
  const view = useApp((s) => s.view)
  // The list uses the neutral Utility style; the builder shows the open design's style.
  const theme = useApp((s) => (s.view === 'list' ? 'utility' : s.theme))
  const mode = useApp((s) => (s.view === 'list' ? s.listMode : s.mode))

  // Theme tokens live on <html>; crossfade colors briefly when they change.
  useEffect(() => {
    const el = document.documentElement
    el.classList.add('theming')
    el.dataset.theme = theme
    el.dataset.mode = mode
    const t = setTimeout(() => el.classList.remove('theming'), 320)
    return () => clearTimeout(t)
  }, [theme, mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useApp.getState().view !== 'builder') return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        const s = useApp.getState()
        if (e.shiftKey) s.redo()
        else s.undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delayDuration={400} skipDelayDuration={150}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="h-full"
            initial={{ opacity: 0, scale: view === 'builder' ? 0.985 : 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: view === 'builder' ? 0.985 : 1.01 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            {view === 'list' ? (
              <DesignsView />
            ) : (
              <div className="flex h-full flex-col bg-canvas">
                <TopBar />
                <Workspace />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {view === 'builder' && <LibraryModal />}
      </Tooltip.Provider>
    </MotionConfig>
  )
}
