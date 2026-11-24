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
export interface Area {
  id: string
  name: string
  c: number
  r: number
  w: number
  h: number
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

interface State {
  doc: Doc
  past: Doc[]
  future: Doc[]
  theme: Theme
  mode: Mode
  renamingId: string | null

  set: (patch: Partial<State>) => void
  commit: (fn: (d: Doc) => Doc) => void
  undo: () => void
  redo: () => void
  addArea: (a: Omit<Area, 'id' | 'name'> & { name?: string }) => string
  updateArea: (id: string, patch: Partial<Area>) => void
  removeArea: (id: string) => void
  insertTrack: (axis: Axis, at: number, track?: Partial<Track>) => void
  /** Remove `count` tracks starting at 0-based `index`, as one undo step. */
  removeTrack: (axis: Axis, index: number, count?: number) => void
  /** Split a pane in two along an axis; neighbouring panes stretch so no gaps appear. */
  split: (id: string, axis: Axis) => void
  setTracks: (axis: Axis, tracks: Track[]) => void
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
        get().commit((d) => ({ ...d, areas: [...d.areas, { name: `Panel ${d.areas.length + 1}`, ...a, id }] }))
        set({ renamingId: id })
        return id
      },
      updateArea: (id, patch) => get().commit((d) => ({ ...d, areas: d.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeArea: (id) => get().commit((d) => ({ ...d, areas: d.areas.filter((a) => a.id !== id) })),

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
              ? { id: uid('a'), name: `Panel ${d.areas.length + 1}`, c: a.c + a.w, r: a.r, w: 1, h: a.h }
              : { id: uid('a'), name: `Panel ${d.areas.length + 1}`, c: a.c, r: a.r + a.h, w: a.w, h: 1 }
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
    }),
    {
      name: 'crm-grid-product',
      version: 1,
      partialize: ({ doc, theme, mode }) => ({ doc, theme, mode }),
    },
  ),
)

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
    ...doc.areas.map((a, i) => `.${names[i]} { grid-area: ${named ? names[i] : `${a.r} / ${a.c} / span ${a.h} / span ${a.w}`}; }`),
  ].join('\n')
}
