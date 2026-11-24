# Gridbuilder

A customer support workspace shown as the product, with no content, just its grid. It starts as the support layout (Navigation · Queue · Conversation · Context), and the user reshapes it in place.

```sh
npm install
npm run dev
```

## Using it

- **Resize**: drag the gutter between two panes. Pixel tracks snap to 4px; between two `fr` tracks it shifts the ratio. A tooltip shows both sizes while dragging.
- **Add a column or row**: hover a gutter or a workspace edge and click its `+` (at the top for columns, at the left for rows). New tracks are `1fr`.
- **Split a pane**: use Split right or Split down in its header. The pane's track is halved and neighbouring panes stretch, so no gaps appear.
- **Fill empty cells**: click "Add panel", or drag across several empty cells to make one spanning panel. An empty column or row can be removed from its cells.
- **Pane menu** (`⋯`): rename (or double-click the title), split, remove its columns or rows, or close the panel.
- **Top bar**: undo/redo (`⌘Z` / `⇧⌘Z`); a Layout menu with templates (Support inbox, Agent cockpit, Lite, Blank 3 × 2) and View CSS; Utility/Soft style; light/dark.

Utility uses hairline dividers with no gap; Soft uses floating panes with an 8px gap. The CSS output (`grid-template-columns/rows` and `grid-template-areas`) matches what's on screen.

## Code map

| Path | What |
|---|---|
| `src/app/store.ts` | Grid model (tracks, panes), insert/remove/split rules, undo history, track math, CSS output |
| `src/app/Workspace.tsx` | The grid: panes, empty cells, segmented gutters, resize and insert |
| `src/app/TopBar.tsx` | Product top bar, layout menu, CSS dialog |
| `src/app/templates.ts` | Starting layouts |

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · Motion · Radix Tooltip · Zustand
