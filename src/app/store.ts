import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TEMPLATES } from './templates'

export type Theme = 'utility' | 'soft'
export type Mode = 'light' | 'dark'
export type Unit = 'px' | 'fr'
export type Axis = 'col' | 'row'

export interface Track {
  id: string
  size: number
  unit: Unit
}

/** A named pane spanning grid cells. Placement is 1-based, in track indices. */
/** How a panel handles content larger than itself. */
export type Overflow = 'responsive' | 'scroll'

/** A component placed in a panel, by library type. */
export interface Item {
  id: string
  type: string
}

export interface Area {
  id: string
  name: string
  c: number
  r: number
  w: number
  h: number
  items: Item[]
  overflow: Overflow
}

export interface Doc {
  columns: Track[]
  rows: Track[]
  areas: Area[]
}

/** Spacing is part of the visual direction: hairline dividers vs floating panes. */
export const SPACING: Record<Theme, { gap: number; padding: number; radius: number }> = {
  utility: { gap: 1, padding: 0, radius: 0 },
  soft: { gap: 8, padding: 8, radius: 14 },
}

let seq = 0
export const uid = (p = 'x') => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`

const key = (axis: Axis) => (axis === 'col' ? 'columns' : 'rows') as 'columns' | 'rows'
const pos = (axis: Axis) => (axis === 'col' ? (['c', 'w'] as const) : (['r', 'h'] as const))

/** Insert a track before 0-based index `at`. Panes after it shift; panes spanning it grow. */
function insertTrackDoc(d: Doc, axis: Axis, at: number, track?: Partial<Track>): Doc {
  const k = key(axis)
  const [p, s] = pos(axis)
  const tracks = [...d[k]]
  tracks.splice(at, 0, { id: uid(axis), size: 1, unit: 'fr', ...track })
  const areas = d.areas.map((a) => {
    const start = a[p] - 1
    if (start >= at) return { ...a, [p]: a[p] + 1 }
    if (start + a[s] > at) return { ...a, [s]: a[s] + 1 }
    return a
  })
  return { ...d, [k]: tracks, areas }
}

/** Remove the track at 0-based `index`. Panes only in it close; spans shrink. */
function removeTrackDoc(d: Doc, axis: Axis, index: number): Doc {
  const k = key(axis)
  const [p, s] = pos(axis)
  if (d[k].length <= 1) return d
  const areas = d.areas.flatMap((a) => {
    const start = a[p] - 1
    if (index < start) return [{ ...a, [p]: a[p] - 1 }]
    if (index > start + a[s] - 1) return [a]
    return a[s] === 1 ? [] : [{ ...a, [s]: a[s] - 1 }]
  })
  return { ...d, [k]: d[k].filter((_, i) => i !== index), areas }
}

/** A named, saved configuration of the workspace. */
export interface SavedDesign {
  id: string
  name: string
  doc: Doc
  theme: Theme
  mode: Mode
  createdAt: number
  updatedAt: number
}

export const UNTITLED = 'Untitled design'

/** Everything a save captures, for comparing the workspace against its saved copy. */
const snapshot = (x: { name: string; doc: Doc; theme: Theme; mode: Mode }) => JSON.stringify([x.name.trim() || UNTITLED, x.doc, x.theme, x.mode])

/** Bring a doc saved by an older version of the app up to date. */
function upgradeDoc(doc: Doc): Doc {
  return { ...doc, areas: doc.areas.map((a) => ({ ...a, items: a.items ?? [], overflow: a.overflow ?? 'responsive' })) }
}

interface State {
  doc: Doc
  past: Doc[]
  future: Doc[]
  theme: Theme
  mode: Mode
  renamingId: string | null
  /** Component library modal: open, and the panel it adds to (null = browse only). */
  library: { open: boolean; target: string | null }
  /** Name of the design being edited (header field). */
  name: string
  /** Saved design this workspace was opened from / last saved as; null if never saved. */
  currentId: string | null
  designs: SavedDesign[]

  /** Which screen is showing: the list of saved designs, or the builder. */
  view: 'list' | 'builder'
  /** Light/dark for the designs list (each design keeps its own style). */
  listMode: Mode
  saveDesign: () => void
  saveAsCopy: () => void
  openDesign: (id: string) => void
  /** Start an unsaved design from a template (default: the support grid) and open the builder. */
  newDesign: (templateId?: string) => void
  renameDesign: (id: string, name: string) => void
  exitToList: () => void
  duplicateDesign: (id: string) => void
  deleteDesign: (id: string) => void

  set: (patch: Partial<State>) => void
  commit: (fn: (d: Doc) => Doc) => void
  undo: () => void
  redo: () => void
  addArea: (a: Omit<Area, 'id' | 'name' | 'items' | 'overflow'> & { name?: string }) => string
  addItem: (areaId: string, type: string) => void
  removeItem: (areaId: string, itemId: string) => void
  moveItem: (areaId: string, itemId: string, dir: -1 | 1) => void
  setOverflow: (areaId: string, overflow: Overflow) => void
  updateArea: (id: string, patch: Partial<Area>) => void
  removeArea: (id: string) => void
  insertTrack: (axis: Axis, at: number, track?: Partial<Track>) => void
  /** Remove `count` tracks starting at 0-based `index`, as one undo step. */
  removeTrack: (axis: Axis, index: number, count?: number) => void
  /** Split a pane in two along an axis; neighbouring panes stretch so no gaps appear. */
  split: (id: string, axis: Axis) => void
  setTracks: (axis: Axis, tracks: Track[]) => void
  /** Restore the default support grid (undoable). */
  resetGrid: () => void
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      doc: TEMPLATES[0].build(),
      past: [],
      future: [],
      theme: 'utility',
      mode: 'light',
      renamingId: null,
      library: { open: false, target: null },
      name: UNTITLED,
      currentId: null,
      designs: [],
      view: 'list',
      listMode: 'light',

      saveDesign: () => {
        const { name, doc, theme, mode, currentId, designs } = get()
        const now = Date.now()
        const clean = name.trim() || UNTITLED
        if (currentId && designs.some((d) => d.id === currentId)) {
          set({ name: clean, designs: designs.map((d) => (d.id === currentId ? { ...d, name: clean, doc, theme, mode, updatedAt: now } : d)) })
        } else {
          const id = uid('d')
          set({ name: clean, currentId: id, designs: [{ id, name: clean, doc, theme, mode, createdAt: now, updatedAt: now }, ...designs] })
        }
      },
      saveAsCopy: () => {
        const { name, doc, theme, mode, designs } = get()
        const now = Date.now()
        const id = uid('d')
        const copy = `${name.trim() || UNTITLED} copy`
        set({ name: copy, currentId: id, designs: [{ id, name: copy, doc, theme, mode, createdAt: now, updatedAt: now }, ...designs] })
      },
      openDesign: (id) => {
        const d = get().designs.find((x) => x.id === id)
        if (!d) return
        // A fresh history per design: undo shouldn't cross into another design.
        set({ doc: upgradeDoc(d.doc), theme: d.theme, mode: d.mode, name: d.name, currentId: d.id, past: [], future: [], renamingId: null, view: 'builder' })
      },
      newDesign: (templateId) => {
        const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0]
        set({ doc: t.build(), name: UNTITLED, currentId: null, past: [], future: [], renamingId: null, view: 'builder' })
      },
      renameDesign: (id, name) => {
        const clean = name.trim() || UNTITLED
        set((s) => ({
          designs: s.designs.map((d) => (d.id === id ? { ...d, name: clean, updatedAt: Date.now() } : d)),
          // Keep the builder's name in step if this design is the one loaded.
          name: s.currentId === id ? clean : s.name,
        }))
      },
      exitToList: () => set({ view: 'list', renamingId: null, library: { open: false, target: null } }),
      duplicateDesign: (id) => {
        const d = get().designs.find((x) => x.id === id)
        if (!d) return
        const now = Date.now()
        const copy = { ...d, id: uid('d'), name: `${d.name} copy`, createdAt: now, updatedAt: now }
        const designs = [...get().designs]
        designs.splice(designs.indexOf(d) + 1, 0, copy)
        set({ designs })
      },
      deleteDesign: (id) => set((s) => ({ designs: s.designs.filter((d) => d.id !== id), currentId: s.currentId === id ? null : s.currentId })),

      set: (patch) => set(patch),
      commit: (fn) => {
        const { doc, past } = get()
        const next = fn(doc)
        if (next === doc) return
        set({ doc: next, past: [...past.slice(-99), doc], future: [] })
      },
      undo: () => {
        const { past, doc, future } = get()
        if (past.length) set({ doc: past[past.length - 1], past: past.slice(0, -1), future: [doc, ...future] })
      },
      redo: () => {
        const { past, doc, future } = get()
        if (future.length) set({ doc: future[0], past: [...past, doc], future: future.slice(1) })
      },

      addArea: (a) => {
        const id = uid('a')
        get().commit((d) => ({ ...d, areas: [...d.areas, { name: `Panel ${d.areas.length + 1}`, items: [], overflow: 'responsive', ...a, id }] }))
        set({ renamingId: id })
        return id
      },
      updateArea: (id, patch) => get().commit((d) => ({ ...d, areas: d.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeArea: (id) => get().commit((d) => ({ ...d, areas: d.areas.filter((a) => a.id !== id) })),
      addItem: (areaId, type) =>
        get().commit((d) => ({ ...d, areas: d.areas.map((a) => (a.id === areaId ? { ...a, items: [...a.items, { id: uid('i'), type }] } : a)) })),
      removeItem: (areaId, itemId) =>
        get().commit((d) => ({ ...d, areas: d.areas.map((a) => (a.id === areaId ? { ...a, items: a.items.filter((i) => i.id !== itemId) } : a)) })),
      moveItem: (areaId, itemId, dir) =>
        get().commit((d) => ({
          ...d,
          areas: d.areas.map((a) => {
            if (a.id !== areaId) return a
            const i = a.items.findIndex((x) => x.id === itemId)
            const j = i + dir
            if (i < 0 || j < 0 || j >= a.items.length) return a
            const items = [...a.items]
            ;[items[i], items[j]] = [items[j], items[i]]
            return { ...a, items }
          }),
        })),
      setOverflow: (areaId, overflow) => get().updateArea(areaId, { overflow }),

      insertTrack: (axis, at, track) => get().commit((d) => insertTrackDoc(d, axis, at, track)),
      removeTrack: (axis, index, count = 1) =>
        get().commit((d) => {
          let next = d
          for (let k = 0; k < count; k++) next = removeTrackDoc(next, axis, index)
          return next
        }),
      split: (id, axis) =>
        get().commit((d) => {
          const a = d.areas.find((x) => x.id === id)
          if (!a) return d
          const k = key(axis)
          const [p, sz] = pos(axis)
          const at = a[p] - 1 + a[sz] // boundary after the pane (0-based track index)
          // The pane's last track is halved: half stays, half becomes the new track.
          const src = d[k][at - 1]
          const half = src.unit === 'px' ? Math.round(src.size / 2) : Math.round((src.size / 2) * 100) / 100
          const tracks = d[k].map((t, i) => (i === at - 1 ? { ...t, size: half } : t))
          tracks.splice(at, 0, { id: uid(axis), size: half, unit: src.unit })
          const pane: Area =
            axis === 'col'
              ? { id: uid('a'), name: `Panel ${d.areas.length + 1}`, c: a.c + a.w, r: a.r, w: 1, h: a.h, items: [], overflow: 'responsive' }
              : { id: uid('a'), name: `Panel ${d.areas.length + 1}`, c: a.c, r: a.r + a.h, w: a.w, h: 1, items: [], overflow: 'responsive' }
          // Other panes covering the halved track stretch across the new one; later panes shift.
          const areas = d.areas.map((x) => {
            const start = x[p] - 1
            const end = start + x[sz]
            if (start >= at) return { ...x, [p]: x[p] + 1 }
            if (x.id !== a.id && end >= at) return { ...x, [sz]: x[sz] + 1 }
            return x
          })
          set({ renamingId: pane.id })
          return { ...d, [k]: tracks, areas: [...areas, pane] }
        }),
      setTracks: (axis, tracks) => get().commit((d) => ({ ...d, [key(axis)]: tracks })),
      resetGrid: () => {
        get().commit((d) => (isDefaultGrid(d) ? d : TEMPLATES[0].build()))
        set({ renamingId: null })
      },
    }),
    {
      name: 'crm-grid-product',
      version: 3,
      partialize: ({ doc, theme, mode, name, currentId, designs, view, listMode }) => ({ doc, theme, mode, name, currentId, designs, view, listMode }),
      // v1 panes had no components or overflow setting; v3 added saved designs (defaults fill in).
      migrate: (state) => {
        const s = state as { doc?: Doc; designs?: SavedDesign[] }
        if (s?.doc) s.doc = upgradeDoc(s.doc)
        if (s?.designs) s.designs = s.designs.map((d) => ({ ...d, doc: upgradeDoc(d.doc) }))
        return s as never
      },
    },
  ),
)

/** Same structure as the default grid, ignoring generated ids. */
const shape = (d: Doc) =>
  JSON.stringify([d.columns.map((t) => [t.size, t.unit]), d.rows.map((t) => [t.size, t.unit]), d.areas.map((a) => [a.name, a.c, a.r, a.w, a.h, a.items.map((i) => i.type), a.overflow])])
const DEFAULT_SHAPE = shape(TEMPLATES[0].build())
export const isDefaultGrid = (d: Doc) => shape(d) === DEFAULT_SHAPE

/** True when the workspace differs from its saved copy (or has never been saved). */
export const useDirty = () =>
  useApp((s) => {
    const saved = s.designs.find((d) => d.id === s.currentId)
    return !saved || snapshot(s) !== snapshot(saved)
  })

/* ---------------- Track math ---------------- */

export interface Resolved {
  start: number
  size: number
}

/** Resolve tracks to pixels the way CSS Grid does for `px` + `minmax(0, Nfr)`. */
export function resolveTracks(tracks: Track[], total: number, gap: number, padding: number): { tracks: Resolved[]; frPx: number } {
  const inner = total - padding * 2 - gap * (tracks.length - 1)
  const fixed = tracks.reduce((s, t) => s + (t.unit === 'px' ? t.size : 0), 0)
  const fr = tracks.reduce((s, t) => s + (t.unit === 'fr' ? t.size : 0), 0)
  const frPx = fr > 0 ? Math.max(0, inner - fixed) / Math.max(fr, 1) : 0
  let x = padding
  return {
    frPx,
    tracks: tracks.map((t) => {
      const size = t.unit === 'px' ? t.size : t.size * frPx
      const r = { start: x, size }
      x += size + gap
      return r
    }),
  }
}

export const trackCss = (t: Track) => (t.unit === 'px' ? `${t.size}px` : `minmax(0, ${t.size}fr)`)
export const trackLabel = (t: Track) => `${t.size}${t.unit}`

/* ---------------- CSS output ---------------- */

const slug = (s: string, i: number) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `panel-${i + 1}`

export function toCss(doc: Doc, theme: Theme) {
  const { gap, padding } = SPACING[theme]
  const names = doc.areas.map((a, i) => slug(a.name, i))
  const map: (string | null)[][] = doc.rows.map(() => doc.columns.map(() => null))
  let overlap = false
  doc.areas.forEach((a, i) => {
    for (let r = a.r - 1; r < a.r - 1 + a.h; r++)
      for (let c = a.c - 1; c < a.c - 1 + a.w; c++) {
        if (map[r]?.[c] !== null) overlap = true
        else map[r][c] = names[i]
      }
  })
  // Named template areas need unique, non-overlapping names; otherwise use line numbers.
  const named = !overlap && new Set(names).size === names.length && doc.areas.length > 0
  const width = Math.max(1, ...names.map((n) => n.length))
  return [
    '.workspace {',
    '  display: grid;',
    `  grid-template-columns: ${doc.columns.map(trackCss).join(' ')};`,
    `  grid-template-rows: ${doc.rows.map(trackCss).join(' ')};`,
    ...(named ? ['  grid-template-areas:', ...map.map((row, i) => `    "${row.map((n) => (n ?? '.').padEnd(width)).join(' ')}"${i === map.length - 1 ? ';' : ''}`)] : []),
    `  gap: ${gap}px;`,
    `  padding: ${padding}px;`,
    '}',
    '',
    '/* Responsive panels fit their content; Scroll panels keep it at natural size and scroll. */',
    ...doc.areas.map((a, i) => {
      const area = named ? names[i] : `${a.r} / ${a.c} / span ${a.h} / span ${a.w}`
      const flow = a.overflow === 'scroll' ? 'overflow: auto;' : 'display: flex; flex-direction: column; min-height: 0; overflow: hidden;'
      return `.${names[i]} { grid-area: ${area}; ${flow} }`
    }),
  ].join('\n')
}
