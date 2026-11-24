import { FilePlus2, Moon, MoreHorizontal, Search, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Segmented, Tip } from '../components/ui'
import { cn } from '../lib/hooks'
import { SPRING } from './chrome'
import { ago, ConfirmDialog, DesignPreview, type ConfirmState } from './common'
import { useApp, type SavedDesign } from './store'
import { TEMPLATES } from './templates'
import { Menu, MenuItem, MenuSep } from './Workspace'

type Sort = 'recent' | 'name'

/** Home screen: every saved configuration; each opens in the builder. */
export function DesignsView() {
  const designs = useApp((s) => s.designs)
  const listMode = useApp((s) => s.listMode)
  const { set, newDesign } = useApp.getState()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = designs.filter((d) => !s || d.name.toLowerCase().includes(s))
    return sort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [designs, q, sort])

  const askDelete = (d: SavedDesign) =>
    setConfirm({
      title: `Delete “${d.name}”?`,
      body: 'It will be removed from this browser. This can’t be undone.',
      actions: [{ label: 'Delete', primary: true, run: () => useApp.getState().deleteDesign(d.id) }],
    })

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-inverse font-mono text-[10px] font-bold text-on-inverse">CG</span>
        <span className="text-[14px] font-semibold tracking-tight">Gridbuilder</span>
        <div className="ml-auto flex items-center gap-1">
          <Tip label={listMode === 'light' ? 'Dark mode' : 'Light mode'} side="bottom">
            <button
              aria-label={listMode === 'light' ? 'Dark mode' : 'Light mode'}
              onClick={() => set({ listMode: listMode === 'light' ? 'dark' : 'light' })}
              className="flex size-8 items-center justify-center rounded-[8px] text-fg-2 hover:bg-hover hover:text-fg"
            >
              {listMode === 'light' ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
            </button>
          </Tip>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => newDesign()}
            className="ml-1 flex h-8 items-center gap-1.5 rounded-[8px] bg-inverse px-3 text-[13px] font-semibold text-on-inverse"
          >
            <FilePlus2 size={14} /> New design
          </motion.button>
        </div>
      </header>

      <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[84rem] flex-col gap-8 px-4 py-8 sm:px-8">
          <section aria-labelledby="quick-start" className="rounded-[16px] bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
            <div className="mb-4">
              <h2 id="quick-start" className="text-[15px] font-semibold tracking-tight">Quick Start</h2>
              <p className="text-[12.5px] text-fg-3">Begin from a template. Everything can be changed in the builder.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TEMPLATES.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: i * 0.03 }}
                  onClick={() => newDesign(t.id)}
                  className="group flex flex-col gap-2 rounded-[12px] bg-canvas p-2 text-left shadow-[0_0_0_1px_var(--line)] transition-shadow hover:shadow-[0_0_0_1px_var(--line-strong),0_8px_24px_-12px_rgb(0_0_0/0.25)]"
                >
                  <DesignPreview doc={t.build()} theme="utility" mode={listMode} className="rounded-[7px] shadow-[inset_0_0_0_1px_var(--line)]" />
                  <span className="px-1">
                    <span className="block text-[13px] font-medium">{t.name}</span>
                    <span className="block truncate text-[12px] text-fg-3">{t.description}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </section>

          <section aria-labelledby="saved" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 id="saved" className="text-[20px] font-semibold tracking-tight">
                Designs <span className="font-normal text-fg-3">{designs.length}</span>
              </h1>
              {designs.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <label className="flex h-8 w-56 items-center gap-2 rounded-[8px] bg-surface px-2.5 text-fg-3 shadow-[inset_0_0_0_1px_var(--line)] focus-within:shadow-[inset_0_0_0_1px_var(--fg-3)]">
                    <Search size={14} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs" aria-label="Search designs" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3" />
                  </label>
                  <Segmented<Sort> label="Sort" value={sort} onChange={setSort} options={[{ value: 'recent', label: 'Recent' }, { value: 'name', label: 'Name' }]} />
                </div>
              )}
            </div>

            {designs.length === 0 ? (
              <EmptyDesigns onNew={() => newDesign()} />
            ) : shown.length === 0 ? (
              <p className="py-16 text-center text-[13px] text-fg-3">No designs match “{q}”.</p>
            ) : (
              <motion.ul layout className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
                <AnimatePresence initial={false}>
                  {shown.map((d, i) => (
                    <DesignCard key={d.id} design={d} index={i} onDelete={() => askDelete(d)} />
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </section>
        </div>
      </main>
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}

function DesignCard({ design: d, index, onDelete }: { design: SavedDesign; index: number; onDelete: () => void }) {
  const { openDesign, duplicateDesign, renameDesign } = useApp.getState()
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const panels = d.doc.areas.length
  const components = d.doc.areas.reduce((n, a) => n + a.items.length, 0)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING, delay: Math.min(index, 8) * 0.03 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={SPRING}
      className={cn('group relative flex flex-col overflow-visible rounded-[14px] bg-surface shadow-[0_0_0_1px_var(--line)] transition-shadow hover:shadow-[0_0_0_1px_var(--line-strong),0_12px_32px_-14px_rgb(0_0_0/0.3)]', menu && 'z-10')}
    >
      {/* The whole card opens the design; actions sit above this layer. */}
      <button onClick={() => openDesign(d.id)} aria-label={`Open ${d.name}`} className="absolute inset-0 z-0 rounded-[14px]" />
      <div className="pointer-events-none p-2 pb-0">
        <DesignPreview doc={d.doc} theme={d.theme} mode={d.mode} className="rounded-[9px] shadow-[inset_0_0_0_1px_var(--line)]" />
      </div>
      <div className="flex items-start gap-2 p-3 pt-2.5">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              defaultValue={d.name}
              aria-label="Design name"
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => (renameDesign(d.id, e.currentTarget.value), setRenaming(false))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="relative z-10 -mx-1 h-7 w-full rounded-[6px] bg-selected px-1 text-[14px] font-semibold outline-none"
            />
          ) : (
            <h3 className="truncate text-[14px] font-semibold">{d.name}</h3>
          )}
          <p className="truncate text-[12px] text-fg-3">Updated {ago(d.updatedAt)}</p>
          <p className="truncate text-[12px] text-fg-3 tabular-nums">
            {d.doc.columns.length}×{d.doc.rows.length} grid · {panels} panels · {components} components
          </p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setMenu(!menu)}
            aria-label={`More actions for ${d.name}`}
            aria-expanded={menu}
            className={cn('flex size-7 items-center justify-center rounded-[6px] text-fg-3 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-fg focus-visible:opacity-100', menu && 'bg-selected text-fg opacity-100')}
          >
            <MoreHorizontal size={15} />
          </button>
          <Menu open={menu} onClose={() => setMenu(false)}>
            <MenuItem onClick={() => openDesign(d.id)}>Open</MenuItem>
            <MenuItem onClick={() => setRenaming(true)}>Rename</MenuItem>
            <MenuItem onClick={() => duplicateDesign(d.id)}>Duplicate</MenuItem>
            <MenuSep />
            <MenuItem onClick={onDelete}>Delete</MenuItem>
          </Menu>
        </div>
      </div>
      <span className="pointer-events-none absolute top-4 right-4 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-fg-2 capitalize opacity-0 shadow-[0_0_0_1px_var(--line)] transition-opacity group-hover:opacity-100">
        {d.theme} · {d.mode}
      </span>
    </motion.li>
  )
}

function EmptyDesigns({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-selected">
        <FilePlus2 size={19} strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[15px] font-semibold">No saved designs yet</p>
        <p className="mt-1 max-w-[22rem] text-[13px] text-fg-3">Pick a template in Quick Start above, or start a blank support grid. Save in the builder and your designs will appear here.</p>
      </div>
      <button onClick={onNew} className="mt-1 flex h-8 items-center gap-1.5 rounded-[8px] bg-inverse px-3 text-[13px] font-semibold text-on-inverse">
        <FilePlus2 size={14} /> New design
      </button>
    </div>
  )
}
