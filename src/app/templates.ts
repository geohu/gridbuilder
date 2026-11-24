import type { Area, Track } from './store'

let n = 0
const id = (p: string) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`
const px = (size: number): Track => ({ id: id('c'), size, unit: 'px' })
const fr = (size = 1): Track => ({ id: id('c'), size, unit: 'fr' })
const area = (name: string, c: number, r: number, w = 1, h = 1): Area => ({ id: id('a'), name, c, r, w, h })

type Layout = { columns: Track[]; rows: Track[]; areas: Area[] }

/** Content-free starting grids. The first is the default. */
export const TEMPLATES: { id: string; name: string; description: string; build: () => Layout }[] = [
  {
    id: 'support',
    name: 'Support inbox',
    description: 'Navigation, queue, conversation, context',
    build: () => ({
      columns: [px(64), px(320), fr(), px(320)],
      rows: [fr()],
      areas: [area('Navigation', 1, 1), area('Queue', 2, 1), area('Conversation', 3, 1), area('Context', 4, 1)],
    }),
  },
  {
    id: 'cockpit',
    name: 'Agent cockpit',
    description: 'Header row plus a stacked context column',
    build: () => ({
      columns: [px(64), px(320), fr(), px(320)],
      rows: [px(56), fr(), fr(), px(180)],
      areas: [
        area('Header', 1, 1, 4, 1),
        area('Navigation', 1, 2, 1, 3),
        area('Queue', 2, 2, 1, 3),
        area('Conversation', 3, 2, 1, 3),
        area('Customer', 4, 2),
        area('Assist', 4, 3),
        area('Macros', 4, 4),
      ],
    }),
  },
  {
    id: 'lite',
    name: 'Lite',
    description: 'Queue and conversation',
    build: () => ({ columns: [px(360), fr()], rows: [fr()], areas: [area('Queue', 1, 1), area('Conversation', 2, 1)] }),
  },
  {
    id: 'blank',
    name: 'Blank 3 × 2',
    description: 'Equal columns and rows, no areas',
    build: () => ({ columns: [fr(), fr(), fr()], rows: [fr(), fr()], areas: [] }),
  },
]
