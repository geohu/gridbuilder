import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../lib/hooks'
import { SPRING } from './chrome'
import { getComponent } from './library/registry'
import { resolveTracks, SPACING, type Doc, type Mode, type Theme } from './store'

/** Relative "updated" time for saved designs. */
export function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export interface ConfirmState {
  title: string
  body: string
  actions: { label: string; primary?: boolean; run: () => void }[]
}

export function ConfirmDialog({ state, onClose }: { state: ConfirmState | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[var(--backdrop)] px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            role="alertdialog"
            aria-label={state.title}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={SPRING}
            className="w-full max-w-[28rem] rounded-[14px] bg-surface p-5 shadow-[0_0_0_1px_var(--line),0_30px_80px_-20px_rgb(0_0_0/0.4)]"
          >
            <h2 className="text-[15px] font-semibold">{state.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{state.body}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={onClose} className="h-8 rounded-[8px] px-3 text-[13px] font-medium text-fg-2 hover:bg-hover hover:text-fg">Cancel</button>
              {[...state.actions].reverse().map((a) => (
                <button
                  key={a.label}
                  autoFocus={a.primary}
                  onClick={() => (onClose(), a.run())}
                  className={cn('h-8 rounded-[8px] px-3 text-[13px] font-semibold whitespace-nowrap', a.primary ? 'bg-inverse text-on-inverse' : 'text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover')}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Miniature of a design in its own style: panels placed with the same track math as the
 * workspace, labelled with their names and the components they hold.
 */
export function DesignPreview({ doc, theme, mode, className }: { doc: Doc; theme: Theme; mode: Mode; className?: string }) {
  const W = 1440
  const H = 900
  const sp = SPACING[theme]
  // Hairline gaps vanish at thumbnail size, so keep a visible minimum.
  const gap = Math.max(sp.gap, 14)
  const c = resolveTracks(doc.columns, W, gap, sp.padding).tracks
  const r = resolveTracks(doc.rows, H, gap, sp.padding).tracks
  const pct = (v: number, of: number) => `${(v / of) * 100}%`
  return (
    <div
      data-theme={theme}
      data-mode={mode}
      className={cn('relative aspect-[16/10] w-full overflow-hidden', className)}
      style={{ background: 'var(--shell-bg)', containerType: 'inline-size' }}
    >
      {doc.areas.length === 0 &&
        r.flatMap((y, ri) =>
          c.map((x, ci) => (
            <div
              key={`${ci}-${ri}`}
              className="absolute border border-dashed border-line-strong bg-canvas"
              style={{ left: pct(x.start, W), width: pct(x.size, W), top: pct(y.start, H), height: pct(y.size, H), borderRadius: sp.radius ? '2cqw' : 0 }}
            />
          )),
        )}
      {doc.areas.map((a) => {
        const x0 = c[a.c - 1]
        const x1 = c[a.c + a.w - 2]
        const y0 = r[a.r - 1]
        const y1 = r[a.r + a.h - 2]
        if (!x0 || !x1 || !y0 || !y1) return null
        return (
          <div
            key={a.id}
            className="pane absolute flex flex-col overflow-hidden"
            style={{
              left: pct(x0.start, W), width: pct(x1.start + x1.size - x0.start, W),
              top: pct(y0.start, H), height: pct(y1.start + y1.size - y0.start, H),
              borderRadius: sp.radius ? '4cqw' : 0,
              // Scales with the card: radius and type are in container units.
            }}
          >
            <span className="truncate border-b border-line px-[1.2cqw] py-[0.6cqw] text-[2.1cqw] font-semibold text-fg-2">{a.name}</span>
            <span className="flex flex-col gap-[0.6cqw] p-[1.2cqw]">
              {a.items.slice(0, 4).map((it) => {
                const def = getComponent(it.type)
                return def ? (
                  <span key={it.id} className="flex items-center gap-[0.6cqw] truncate text-[1.7cqw] text-fg-3">
                    <def.icon style={{ width: '1.9cqw', height: '1.9cqw' }} className="shrink-0" />
                    <span className="truncate">{def.name}</span>
                  </span>
                ) : null
              })}
              {a.items.length === 0 && <span className="h-[1cqw] w-1/2 rounded-full bg-line" />}
            </span>
          </div>
        )
      })}
    </div>
  )
}
