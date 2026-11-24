import * as Tooltip from '@radix-ui/react-tooltip'
import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { useApp } from './app/store'
import { TopBar } from './app/TopBar'
import { Workspace } from './app/Workspace'

export default function App() {
  const theme = useApp((s) => s.theme)
  const mode = useApp((s) => s.mode)

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
        <div className="flex h-full flex-col bg-canvas">
          <TopBar />
          <Workspace />
        </div>
      </Tooltip.Provider>
    </MotionConfig>
  )
}
