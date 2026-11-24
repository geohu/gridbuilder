import { Columns2, MoreHorizontal, Plus, Rows2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type RefObject } from 'react'
import { Tip } from '../components/ui'
import { cn } from '../lib/hooks'
import { SPRING } from './chrome'
import { resolveTracks, SPACING, trackCss, trackLabel, useApp, type Area, type Axis, type Resolved, type Track } from './store'

type Cell = { col: number; row: number }
type Rect = { c: number; r: number; w: number; h: number }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const place = (x: Rect): CSSProperties => ({ gridColumn: `${x.c} / span ${x.w}`, gridRow: `${x.r} / span ${x.h}` })
const rectFrom = (a: Cell, b: Cell): Rect => ({ c: Math.min(a.col, b.col), r: Math.min(a.row, b.row), w: Math.abs(a.col - b.col) + 1, h: Math.abs(a.row - b.row) + 1 })
const spanPx = (res: Resolved[], start: number, n: number) => {
  const a = res[start - 1]
  const b = res[start + n - 2]
  return a && b ? Math.round(b.start + b.size - a.start) : 0
}

function useSize(ref: RefObject<HTMLElement | null>) {
  const [s, setS] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setS({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current!)
    return () => ro.disconnect()
  }, [ref])
  return s
}

/** The product's layout: a CSS Grid of panes that the user reshapes in place. */
export function Workspace() {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const doc = useApp((s) => s.doc)
  const theme = useApp((s) => s.theme)
  const { addArea, setTracks } = useApp.getState()
  const sp = SPACING[theme]

  // Live tracks while a gutter is dragged; committed on release.
  const [live, setLive] = useState<{ axis: Axis; tracks: Track[]; i: number; x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<{ start: Cell; rect: Rect } | null>(null)

  const cols = live?.axis === 'col' ? live.tracks : doc.columns
  const rows = live?.axis === 'row' ? live.tracks : doc.rows
  const rc = resolveTracks(cols, size.w, sp.gap, sp.padding)
  const rr = resolveTracks(rows, size.h, sp.gap, sp.padding)
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: cols.map(trackCss).join(' '),
    gridTemplateRows: rows.map(trackCss).join(' '),
    gap: sp.gap,
    padding: sp.padding,
  }

  // Which pane owns each cell (or a unique key for empty cells).
  const owner = rows.map((_, r) => cols.map((_, c) => `empty-${r}-${c}`))
  for (const a of doc.areas) for (let r = a.r - 1; r < a.r - 1 + a.h; r++) for (let c = a.c - 1; c < a.c - 1 + a.w; c++) if (owner[r]?.[c]) owner[r][c] = a.id
  const occupied = owner.map((row) => row.map((o) => !o.startsWith('empty-')))
  const empties: Cell[] = []
  occupied.forEach((row, r) => row.forEach((o, c) => !o && empties.push({ col: c + 1, row: r + 1 })))
  const isFree = (x: Rect) => {
    for (let r = x.r - 1; r < x.r - 1 + x.h; r++) for (let c = x.c - 1; c < x.c - 1 + x.w; c++) if (occupied[r]?.[c]) return false
    return true
  }

  const indexAt = (res: Resolved[], v: number) => {
    for (let i = 0; i < res.length; i++) if (v < res[i].start + res[i].size + sp.gap / 2) return i + 1
    return res.length
  }
  const cellAt = (e: { clientX: number; clientY: number }): Cell => {
    const b = ref.current!.getBoundingClientRect()
    return { col: indexAt(rc.tracks, e.clientX - b.left), row: indexAt(rr.tracks, e.clientY - b.top) }
  }

  /* ---------- gutter resize ---------- */
  const drag = useRef<{ axis: Axis; i: number; start: number; orig: Track[]; frPx: number; moved: boolean } | null>(null)
  const startResize = (axis: Axis, i: number) => (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const orig = axis === 'col' ? doc.columns : doc.rows
    drag.current = { axis, i, start: axis === 'col' ? e.clientX : e.clientY, orig, frPx: (axis === 'col' ? rc : rr).frPx, moved: false }
  }
  const moveResize = (e: RPointerEvent) => {
    const D = drag.current
    if (!D) return
    const d = (D.axis === 'col' ? e.clientX : e.clientY) - D.start
    if (Math.abs(d) > 2) D.moved = true
    if (!D.moved) return
    const next = D.orig.map((t) => ({ ...t }))
    const a = D.orig[D.i - 1]
    const b = D.orig[D.i]
    const snap = (v: number) => Math.max(40, Math.round(v / 4) * 4)
    if (a.unit === 'px') next[D.i - 1].size = snap(a.size + d)
    else if (b.unit === 'px') next[D.i].size = snap(b.size - d)
    else if (D.frPx > 0) {
      const total = a.size + b.size
      const na = clamp(Math.round((a.size + d / D.frPx) * 20) / 20, 0.1, total - 0.1)
      next[D.i - 1].size = na
      next[D.i].size = Math.round((total - na) * 100) / 100
    }
    const b0 = ref.current!.getBoundingClientRect()
    setLive({ axis: D.axis, tracks: next, i: D.i, x: e.clientX - b0.left, y: e.clientY - b0.top })
  }
  const endResize = () => {
    const D = drag.current
    if (D && live) setTracks(D.axis, live.tracks)
    drag.current = null
    setLive(null)
  }

  /* ---------- drawing a pane across empty cells ---------- */
  const startDraft = (cell: Cell) => (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    ref.current!.setPointerCapture(e.pointerId)
    setDraft({ start: cell, rect: { c: cell.col, r: cell.row, w: 1, h: 1 } })
  }
  const moveDraft = (e: RPointerEvent) => {
    if (!draft) return
    const rect = rectFrom(draft.start, cellAt(e))
    if (isFree(rect) && (rect.c !== draft.rect.c || rect.r !== draft.rect.r || rect.w !== draft.rect.w || rect.h !== draft.rect.h)) setDraft({ ...draft, rect })
  }
  const endDraft = () => {
    if (draft) addArea(draft.rect)
    setDraft(null)
  }

  const ready = size.w > 0
  const instant = !!live

  return (
    <div
      ref={ref}
      className="relative min-h-0 flex-1 overflow-hidden"
      style={{ background: 'var(--shell-bg)' }}
      onPointerMove={draft ? moveDraft : undefined}
      onPointerUp={draft ? endDraft : undefined}
    >
      {ready && (
        <div className="absolute inset-0" style={grid}>
          {empties.map((cell) => (
            <EmptyCell key={`${cell.col}-${cell.row}-${cols.length}-${rows.length}`} cell={cell} radius={sp.radius} onPointerDown={startDraft(cell)} />
          ))}
          <AnimatePresence>
            {doc.areas.map((a) => (
              <Pane key={a.id} area={a} radius={sp.radius} instant={instant} dims={`${spanPx(rc.tracks, a.c, a.w)} × ${spanPx(rr.tracks, a.r, a.h)}`} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {draft && (
        <div className="pointer-events-none absolute inset-0 z-20" style={grid}>
          <motion.div layout transition={SPRING} style={{ ...place(draft.rect), borderRadius: sp.radius }} className="bg-fg/10 outline-2 -outline-offset-2 outline-fg" />
        </div>
      )}

      {ready &&
        (['col', 'row'] as Axis[]).flatMap((axis) => {
          const isCol = axis === 'col'
          const res = (isCol ? rc : rr).tracks
          const cross = (isCol ? rr : rc).tracks
          const total = isCol ? size.w : size.h
          const crossTotal = isCol ? size.h : size.w
          const along = (k: number) => (k === 0 ? 0 : cross[k].start - sp.gap / 2)
          const until = (k: number) => (k === cross.length - 1 ? crossTotal : cross[k].start + cross[k].size + sp.gap / 2)
          const out = [
            { key: `${axis}-start`, i: 0, at: 0, edge: true, from: 0, to: crossTotal },
            { key: `${axis}-end`, i: res.length, at: total, edge: true, from: 0, to: crossTotal },
          ]
          // Inner boundaries only where they separate two different panes/cells.
          for (let i = 1; i < res.length; i++) {
            let k = 0
            while (k < cross.length) {
              const sep = (j: number) => (isCol ? owner[j][i - 1] !== owner[j][i] : owner[i - 1][j] !== owner[i][j])
              if (!sep(k)) {
                k++
                continue
              }
              const k0 = k
              while (k + 1 < cross.length && sep(k + 1)) k++
              out.push({ key: `${axis}-${i}-${k0}`, i, at: res[i].start - sp.gap / 2, edge: false, from: along(k0), to: until(k) })
              k++
            }
          }
          return out.map((l) => (
            <Gutter
              key={l.key}
              axis={axis}
              at={l.at}
              from={l.from}
              to={l.to}
              edge={l.edge}
              active={live?.axis === axis && live.i === l.i}
              onInsert={() => useApp.getState().insertTrack(axis, l.i)}
              onPointerDown={l.edge ? undefined : startResize(axis, l.i)}
              onPointerMove={moveResize}
              onPointerUp={endResize}
            />
          ))
        })}

      <AnimatePresence>
        {live && (
          <motion.div
            key="size"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-40 flex items-center gap-1.5 rounded-[6px] bg-inverse px-2 py-1 font-mono text-[11px] whitespace-nowrap text-on-inverse shadow-lg"
            style={{ left: live.x + 14, top: live.y + 14 }}
          >
            <span>{trackLabel(live.tracks[live.i - 1])}</span>
            <span className="opacity-40">|</span>
            <span>{trackLabel(live.tracks[live.i])}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A boundary between tracks (or a workspace edge). Hovering reveals a line and a "+"
 * pinned at the start of the gutter (in the header strip for columns); dragging the
 * rest of an inner gutter resizes the neighbouring tracks.
 */
function Gutter({
  axis, at, from, to, edge, active, onInsert, onPointerDown, onPointerMove, onPointerUp,
}: {
  axis: Axis
  at: number
  from: number
  to: number
  edge: boolean
  active: boolean
  onInsert: () => void
  onPointerDown?: (e: RPointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: RPointerEvent) => void
  onPointerUp: () => void
}) {
  const [hover, setHover] = useState(false)
  const isCol = axis === 'col'
  const HIT = 10
  // Edge zones sit just inside the workspace so they stay reachable.
  const offset = edge ? (at === 0 ? 0 : -HIT) : -HIT / 2
  const noun = isCol ? 'column' : 'row'
  // Keep the button inside the workspace at the edges (it clips overflow).
  const plusAt = edge ? (at === 0 ? 2 : HIT - 24) : HIT / 2 - 11
  return (
    <div
      className={cn('group/g absolute z-30', !edge && (isCol ? 'cursor-col-resize' : 'cursor-row-resize'))}
      style={isCol ? { left: at + offset, width: HIT, top: from, height: to - from } : { top: at + offset, height: HIT, left: from, width: to - from }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span
        className={cn(
          'pointer-events-none absolute bg-fg transition-opacity',
          active ? 'opacity-70' : 'opacity-0 group-hover/g:opacity-40',
          isCol ? 'top-0 bottom-0 w-[2px]' : 'right-0 left-0 h-[2px]',
        )}
        style={isCol ? { left: edge ? (at === 0 ? 0 : HIT - 2) : HIT / 2 - 1 } : { top: edge ? (at === 0 ? 0 : HIT - 2) : HIT / 2 - 1 }}
      />
      <AnimatePresence>
        {hover && !active && (
          <motion.div
            key="plus"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING}
            className="absolute"
            style={isCol ? { top: 9, left: plusAt } : { left: 21, top: plusAt }}
          >
            <Tip label={`Add ${noun}`} side={isCol ? 'right' : 'bottom'}>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onInsert}
                aria-label={`Add ${noun} here`}
                className="flex size-[22px] items-center justify-center rounded-full bg-inverse text-on-inverse shadow-md transition-transform hover:scale-110"
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </Tip>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Pane({ area, radius, instant, dims }: { area: Area; radius: number; instant: boolean; dims: string }) {
  const renaming = useApp((s) => s.renamingId === area.id)
  const cols = useApp((s) => s.doc.columns.length)
  const rows = useApp((s) => s.doc.rows.length)
  const { set, updateArea, removeArea, split, removeTrack } = useApp.getState()
  const [menu, setMenu] = useState(false)

  const splitRight = () => split(area.id, 'col')
  const splitDown = () => split(area.id, 'row')
  // Removes every track this pane spans, as one undo step.
  const removeTracks = (axis: Axis) => (axis === 'col' ? removeTrack('col', area.c - 1, area.w) : removeTrack('row', area.r - 1, area.h))

  return (
    <motion.section
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
      transition={instant ? { duration: 0 } : SPRING}
      style={{ ...place(area), borderRadius: radius, zIndex: menu ? 20 : undefined }}
      className="pane group/pane @container relative z-10 flex min-h-0 min-w-0 flex-col"
      aria-label={area.name}
    >
      <header className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-2">
        {renaming ? (
          <input
            autoFocus
            defaultValue={area.name}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              const v = e.currentTarget.value.trim()
              if (v && v !== area.name) updateArea(area.id, { name: v })
              set({ renamingId: null })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') set({ renamingId: null })
            }}
            className="h-7 min-w-0 flex-1 rounded-[5px] bg-selected px-1.5 text-[13px] font-semibold outline-none"
          />
        ) : (
          <h2 onDoubleClick={() => set({ renamingId: area.id })} title="Double-click to rename" className="hidden min-w-0 flex-1 cursor-text truncate px-0.5 text-[13px] font-semibold @[7rem]:block">
            {area.name}
          </h2>
        )}
        <div className="ml-auto flex items-center opacity-0 transition-opacity group-hover/pane:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          <span className="hidden @[12rem]:contents">
            <HeaderButton label="Split right" onClick={splitRight}><Columns2 size={14} strokeWidth={1.75} /></HeaderButton>
            <HeaderButton label="Split down" onClick={splitDown}><Rows2 size={14} strokeWidth={1.75} /></HeaderButton>
          </span>
          <div className="relative">
            <HeaderButton label="More" onClick={() => setMenu(!menu)} expanded={menu}><MoreHorizontal size={15} strokeWidth={1.75} /></HeaderButton>
            <Menu open={menu} onClose={() => setMenu(false)}>
              <MenuItem onClick={() => set({ renamingId: area.id })}>Rename</MenuItem>
              <MenuItem onClick={splitRight}>Split right</MenuItem>
              <MenuItem onClick={splitDown}>Split down</MenuItem>
              <MenuSep />
              <MenuItem onClick={() => removeTracks('col')} disabled={area.w >= cols}>{area.w > 1 ? `Remove ${area.w} columns` : 'Remove column'}</MenuItem>
              <MenuItem onClick={() => removeTracks('row')} disabled={area.h >= rows}>{area.h > 1 ? `Remove ${area.h} rows` : 'Remove row'}</MenuItem>
              <MenuSep />
              <MenuItem onClick={() => removeArea(area.id)}>Close panel</MenuItem>
            </Menu>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
        <span className="truncate font-mono text-[11px] text-fg-3 opacity-0 transition-opacity group-hover/pane:opacity-100">{dims}</span>
      </div>
    </motion.section>
  )
}

function EmptyCell({ cell, radius, onPointerDown }: { cell: Cell; radius: number; onPointerDown: (e: RPointerEvent<HTMLDivElement>) => void }) {
  const cols = useApp((s) => s.doc.columns.length)
  const rows = useApp((s) => s.doc.rows.length)
  const colEmpty = useApp((s) => !s.doc.areas.some((a) => cell.col >= a.c && cell.col < a.c + a.w))
  const rowEmpty = useApp((s) => !s.doc.areas.some((a) => cell.row >= a.r && cell.row < a.r + a.h))
  const { addArea, removeTrack } = useApp.getState()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      onPointerDown={onPointerDown}
      style={{ gridColumn: cell.col, gridRow: cell.row, borderRadius: radius }}
      className="group/empty @container relative flex min-h-0 min-w-0 cursor-crosshair items-center justify-center bg-canvas outline-1 -outline-offset-4 outline-line-strong outline-dashed"
    >
      <button
        onClick={() => addArea({ c: cell.col, r: cell.row, w: 1, h: 1 })}
        aria-label="Add panel"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-fg-3 transition-colors group-hover/empty:bg-surface group-hover/empty:text-fg group-hover/empty:shadow-[0_0_0_1px_var(--line-strong)]"
      >
        <Plus size={13} /> <span className="hidden @[7rem]:inline">Add panel</span>
      </button>
      <span className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[11px] whitespace-nowrap text-fg-3 opacity-0 transition-opacity group-hover/empty:opacity-100 @[12rem]:block">
        or drag across empty cells
      </span>
      {(colEmpty && cols > 1) || (rowEmpty && rows > 1) ? (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover/empty:opacity-100">
          {colEmpty && cols > 1 && <SmallRemove label="Remove column" onClick={() => removeTrack('col', cell.col - 1)} />}
          {rowEmpty && rows > 1 && <SmallRemove label="Remove row" onClick={() => removeTrack('row', cell.row - 1)} />}
        </div>
      ) : null}
    </motion.div>
  )
}

const SmallRemove = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex h-6 items-center gap-1 rounded-[6px] bg-surface px-1.5 text-[11px] font-medium text-fg-2 shadow-[0_0_0_1px_var(--line-strong)] hover:text-fg">
    <X size={11} /> {label}
  </button>
)

function HeaderButton({ label, onClick, children, expanded }: { label: string; onClick: () => void; children: React.ReactNode; expanded?: boolean }) {
  return (
    <Tip label={label} side="bottom">
      <button
        aria-label={label}
        aria-expanded={expanded}
        onClick={onClick}
        className={cn('flex size-7 items-center justify-center rounded-[6px] text-fg-3 transition-colors hover:bg-hover hover:text-fg', expanded && 'bg-selected text-fg')}
      >
        {children}
      </button>
    </Tip>
  )
}

export function Menu({ open, onClose, children, align = 'right' }: { open: boolean; onClose: () => void; children: React.ReactNode; align?: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState({ x: align, up: false })

  // Before paint, flip to whichever side keeps the menu inside the viewport.
  useLayoutEffect(() => {
    const el = ref.current
    const anchor = el?.parentElement?.getBoundingClientRect()
    if (!open || !el || !anchor) return
    const M = 8
    const w = el.offsetWidth
    const h = el.offsetHeight
    let x = align
    if (x === 'right' && anchor.right - w < M) x = 'left'
    else if (x === 'left' && anchor.left + w > window.innerWidth - M) x = 'right'
    const up = anchor.bottom + 4 + h > window.innerHeight - M && anchor.top - 4 - h >= M
    setPlacement({ x, up })
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="menu"
          initial={{ opacity: 0, y: placement.up ? 4 : -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: placement.up ? 4 : -4, scale: 0.97, transition: { duration: 0.1 } }}
          transition={SPRING}
          onClick={(e) => (e.target as HTMLElement).closest('[role=menuitem]') && onClose()}
          className={cn(
            'absolute z-50 min-w-44 rounded-[10px] bg-surface p-1 shadow-[0_0_0_1px_var(--line),0_12px_32px_-8px_rgb(0_0_0/0.25)]',
            placement.up ? 'bottom-full mb-1' : 'top-full mt-1',
            placement.x === 'right' ? 'right-0' : 'left-0',
            placement.up ? (placement.x === 'right' ? 'origin-bottom-right' : 'origin-bottom-left') : placement.x === 'right' ? 'origin-top-right' : 'origin-top-left',
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const MenuItem = ({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <button role="menuitem" disabled={disabled} onClick={onClick} className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2.5 text-left text-[13px] hover:bg-hover disabled:opacity-35 disabled:hover:bg-transparent">
    {children}
  </button>
)
export const MenuSep = () => <div className="my-1 h-px bg-line" />
