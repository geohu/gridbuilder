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
- **Add components**: click "Add component" in an empty pane, or `+` in a pane's header, to open the component library. Pick from 17 support components (navigation, lists and data, conversation, customer, inputs, feedback) with live previews, usage notes, anatomy and minimum sizes. Components stack in a pane; hover one to reorder or remove it.
- **Panel content behaviour** (pane `⋯` menu → Content):
  - **Responsive** (default): the panel never scrolls. List-like components stretch to share its height and scroll inside themselves, and content reflows to the panel's width (for example, a table hides lower-priority columns).
  - **Scroll**: components keep their natural size and minimum width, and the panel itself scrolls.
- **Pane menu** (`⋯`): add a component, rename (or double-click the title), set content behaviour, split, remove its columns or rows, or close the panel.
- **Designs list (home)**: every saved configuration as a card with a preview in its own style, grid size, panel and component counts. Click a card to open it in the builder; `⋯` to rename, duplicate or delete. Search and sort by recent or name. **Quick Start** creates a design from a template.
- **Saving**: name the design in the builder header, then Save (`⌘S`). The status shows Not saved, Unsaved changes or Saved. **Exit** (top right) returns to the list, offering to save or discard unsaved changes. Designs are stored in this browser (local storage).
- **Top bar**: undo/redo (`⌘Z` / `⇧⌘Z`); reset grid; Library (browse components); a Layout menu with templates (Support inbox, Agent cockpit, Lite, Blank 3 × 2) and View CSS; Utility/Soft style; light/dark.

Utility uses hairline dividers with no gap; Soft uses floating panes with an 8px gap. The CSS output (`grid-template-columns/rows` and `grid-template-areas`) matches what's on screen.

## Code map

| Path | What |
|---|---|
| `src/app/store.ts` | Grid model (tracks, panes), insert/remove/split rules, undo history, track math, CSS output |
| `src/app/Workspace.tsx` | The grid: panes, empty cells, segmented gutters, resize and insert |
| `src/app/DesignsView.tsx` | Designs list (home): saved configurations and templates |
| `src/app/TopBar.tsx` | Builder header: name, save, exit, layout menu, CSS dialog |
| `src/app/common.tsx` | Design preview, confirm dialog, relative time |
| `src/app/templates.ts` | Starting layouts |
| `src/app/library/registry.tsx` | Component library: metadata, details and responsive renders |
| `src/app/library/LibraryModal.tsx` | Library browser and add flow |

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · Motion · Radix Tooltip · Zustand
