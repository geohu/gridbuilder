import { Plus, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/hooks'
import { SPRING } from '../chrome'
import { useApp } from '../store'
import { BEHAVIOUR, CATEGORIES, LIBRARY, type Category, type ComponentDef } from './registry'

/** Renders a component at a fixed "real" size and scales it to fit its box. */
function Preview({ def, w = 360, h = 220, className }: { def: ComponentDef; w?: number; h?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(Math.min(e.contentRect.width / w, e.contentRect.height / h)))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [w, h])
  return (
    <div ref={box} className={cn('relative shrink-0 overflow-hidden rounded-[8px] bg-canvas shadow-[inset_0_0_0_1px_var(--line)]', className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <div
        inert
        className="pane @container pointer-events-none absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden select-none"
        style={{ width: w, height: h, transform: `scale(${scale})` }}
      >
        <div className={cn('flex flex-col', def.sizing === 'fill' ? 'min-h-0 flex-1' : '')}>{def.render({ overflow: 'responsive' })}</div>
      </div>
    </div>
  )
}

export function LibraryModal() {
  const { open, target } = useApp((s) => s.library)
  const pane = useApp((s) => s.doc.areas.find((a) => a.id === s.library.target))
  const { set, addItem } = useApp.getState()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'All'>('All')
  const [focusId, setFocusId] = useState(LIBRARY[0].id)
  const gridRef = useRef<HTMLDivElement>(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return LIBRARY.filter((c) => (cat === 'All' || c.category === cat) && (!s || `${c.name} ${c.summary} ${c.category}`.toLowerCase().includes(s)))
  }, [q, cat])
  const focused = LIBRARY.find((c) => c.id === focusId) ?? list[0]

  useEffect(() => {
    if (open) {
      setQ('')
      setCat('All')
    }
  }, [open])
  useEffect(() => {
    if (list.length && !list.some((c) => c.id === focusId)) setFocusId(list[0].id)
  }, [list, focusId])
  useEffect(() => {
    gridRef.current?.querySelector(`[data-id="${focusId}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [focusId])

  const close = () => set({ library: { open: false, target: null } })
  const add = (def: ComponentDef) => {
    if (!target) return
    addItem(target, def.id)
    close()
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return close()
    const i = list.findIndex((c) => c.id === focusId)
    const cols = window.innerWidth >= 1100 ? 3 : 2
    const go = (d: number) => {
      e.preventDefault()
      const n = list[Math.max(0, Math.min(list.length - 1, i + d))]
      if (n) setFocusId(n.id)
    }
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowDown') go(cols)
    if (e.key === 'ArrowUp') go(-cols)
    if (e.key === 'Enter' && focused) (e.preventDefault(), add(focused))
  }

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c, LIBRARY.filter((x) => x.category === c).length])), [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--backdrop)] p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && close()}
          onKeyDown={onKey}
        >
          <motion.div
            role="dialog"
            aria-label="Component library"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } }}
            transition={SPRING}
            className="flex h-[min(760px,92vh)] w-[min(1180px,100%)] flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_0_0_1px_var(--line),0_40px_100px_-30px_rgb(0_0_0/0.5)]"
          >
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold">Component library</h2>
                <p className="truncate text-[12px] text-fg-3">{pane ? <>Adding to <b className="font-medium text-fg-2">{pane.name}</b> · {pane.overflow === 'scroll' ? 'Scroll' : 'Responsive'} panel</> : `${LIBRARY.length} components`}</p>
              </div>
              <label className="ml-auto flex h-8 w-full max-w-[18rem] items-center gap-2 rounded-[8px] bg-selected px-2.5 text-fg-3 focus-within:shadow-[inset_0_0_0_1px_var(--fg-3)]">
                <Search size={14} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search components" aria-label="Search components" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3" />
              </label>
              <button onClick={close} aria-label="Close" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-fg-3 hover:bg-hover hover:text-fg">
                <X size={16} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[180px_minmax(0,1fr)_360px]">
              {/* Categories */}
              <nav aria-label="Categories" className="hidden flex-col gap-0.5 overflow-y-auto border-r border-line p-2 lg:flex">
                {(['All', ...CATEGORIES] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={cn('relative flex h-8 items-center rounded-[7px] px-2.5 text-left text-[13px]', cat === c ? 'font-medium text-fg' : 'text-fg-2 hover:bg-hover')}
                  >
                    {cat === c && <motion.span layoutId="lib-cat" transition={SPRING} className="absolute inset-0 rounded-[7px] bg-selected" />}
                    <span className="relative">{c}</span>
                    <span className="relative ml-auto font-mono text-[11px] text-fg-3">{c === 'All' ? LIBRARY.length : counts[c]}</span>
                  </button>
                ))}
              </nav>

              {/* Grid */}
              <div className="flex min-h-0 flex-col">
                <div className="scroll-thin flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-3 py-2 lg:hidden">
                  {(['All', ...CATEGORIES] as const).map((c) => (
                    <button key={c} onClick={() => setCat(c)} className={cn('h-7 shrink-0 rounded-full px-3 text-[12px] font-medium', cat === c ? 'bg-inverse text-on-inverse' : 'text-fg-2 shadow-[inset_0_0_0_1px_var(--line-strong)]')}>
                      {c}
                    </button>
                  ))}
                </div>
                <div ref={gridRef} role="listbox" aria-label="Components" className="scroll-thin grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-3 xl:grid-cols-3">
                  {list.length === 0 && <p className="col-span-full p-10 text-center text-[13px] text-fg-3">No components match “{q}”.</p>}
                  {list.map((c) => (
                    // Not a <button>: the live preview contains the component's own buttons.
                    <div
                      key={c.id}
                      data-id={c.id}
                      role="option"
                      tabIndex={c.id === focused?.id ? 0 : -1}
                      aria-selected={c.id === focused?.id}
                      onClick={() => setFocusId(c.id)}
                      onFocus={() => setFocusId(c.id)}
                      onDoubleClick={() => add(c)}
                      className={cn(
                        'group flex cursor-pointer flex-col gap-2 rounded-[12px] p-2 text-left transition-shadow outline-none',
                        c.id === focused?.id ? 'shadow-[0_0_0_2px_var(--fg)]' : 'shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--line-strong)]',
                      )}
                    >
                      <Preview def={c} />
                      <span className="flex items-center gap-2 px-0.5">
                        <c.icon size={14} strokeWidth={1.75} className="shrink-0 text-fg-2" />
                        <span className="truncate text-[13px] font-medium">{c.name}</span>
                      </span>
                      <span className="line-clamp-2 px-0.5 text-[12px] leading-snug text-fg-3">{c.summary}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <aside aria-label="Component details" className="hidden min-h-0 flex-col border-l border-line md:flex">
                <AnimatePresence mode="popLayout" initial={false}>
                  {focused && (
                    <motion.div
                      key={focused.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={SPRING}
                      className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
                    >
                      <Preview def={focused} w={420} h={300} />
                      <div>
                        <p className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">{focused.category}</p>
                        <h3 className="text-[17px] font-semibold tracking-tight">{focused.name}</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{focused.description}</p>
                      </div>
                      <Detail title="In a panel set to">
                        <dl className="grid gap-2 text-[12.5px]">
                          {(['responsive', 'scroll'] as const).map((m) => (
                            <div key={m} className={cn('rounded-[8px] p-2.5', pane?.overflow === m ? 'bg-selected' : 'shadow-[inset_0_0_0_1px_var(--line)]')}>
                              <dt className="font-medium">{m === 'responsive' ? 'Responsive' : 'Scroll'}{pane?.overflow === m && <span className="font-normal text-fg-3"> · this panel</span>}</dt>
                              <dd className="text-fg-2">{BEHAVIOUR[focused.id][m]}</dd>
                            </div>
                          ))}
                        </dl>
                      </Detail>
                      <Detail title="Use when"><Bullets items={focused.useWhen} /></Detail>
                      <Detail title="Anatomy"><Bullets items={focused.anatomy} /></Detail>
                      <Detail title="Minimum size">
                        <p className="font-mono text-[12px] text-fg-2">{focused.min.w} × {focused.min.h}px</p>
                      </Detail>
                    </motion.div>
                  )}
                </AnimatePresence>
              </aside>
            </div>

            {/* Footer */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-t border-line px-4">
              <p className="hidden truncate font-mono text-[11px] text-fg-3 sm:block">↑↓←→ browse · ↵ add · double-click to add · esc close</p>
              <div className="ml-auto flex items-center gap-2">
                {!pane && <span className="text-[12px] text-fg-3">Open from a panel’s + to add components</span>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!pane || !focused}
                  onClick={() => focused && add(focused)}
                  className="flex h-9 items-center gap-1.5 rounded-[9px] bg-inverse px-3.5 text-[13px] font-semibold text-on-inverse disabled:opacity-30"
                >
                  <Plus size={14} /> {focused ? `Add ${focused.name}` : 'Add'}{pane ? ` to ${pane.name}` : ''}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Detail = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-fg-3 uppercase">{title}</h4>
    {children}
  </section>
)
const Bullets = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-1 text-[12.5px] text-fg-2">
    {items.map((x) => (
      <li key={x} className="flex gap-2"><span className="text-fg-3">–</span>{x}</li>
    ))}
  </ul>
)
