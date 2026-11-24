import { Blocks, Check, Code2, Copy, LayoutGrid, Moon, Redo2, RotateCcw, Save, Sun, Undo2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Segmented, Tip } from '../components/ui'
import { cn } from '../lib/hooks'
import { SPRING } from './chrome'
import { isDefaultGrid, resolveTracks, toCss, UNTITLED, useApp, useDirty, type Doc, type Theme } from './store'
import { TEMPLATES } from './templates'
import { Menu, MenuSep } from './Workspace'
import { ConfirmDialog, type ConfirmState } from './common'

export function TopBar() {
  const theme = useApp((s) => s.theme)
  const mode = useApp((s) => s.mode)
  const canUndo = useApp((s) => s.past.length > 0)
  const canRedo = useApp((s) => s.future.length > 0)
  const counts = useApp((s) => `${s.doc.columns.length} × ${s.doc.rows.length}`)
  const isDefault = useApp((s) => isDefaultGrid(s.doc))
  const { set, undo, redo, resetGrid } = useApp.getState()
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [cssOpen, setCssOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const name = useApp((s) => s.name)
  const dirty = useDirty()
  const saved = useApp((s) => s.designs.some((d) => d.id === s.currentId))
  // Nothing to lose: a brand-new design that hasn't been touched.
  const hasWork = useApp((s) => dirty && !(s.currentId === null && s.name === UNTITLED && isDefaultGrid(s.doc)))

  const save = () => {
    useApp.getState().saveDesign()
    setJustSaved(true)
  }
  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 1600)
    return () => clearTimeout(t)
  }, [justSaved])
  // ⌘S saves from anywhere, including while typing in the name field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** Back to the designs list, offering to save unsaved work first. */
  const exit = () => {
    const leave = () => useApp.getState().exitToList()
    if (!hasWork) return leave()
    setConfirm({
      title: 'Exit to designs?',
      body: `“${useApp.getState().name.trim() || UNTITLED}” has unsaved changes.`,
      actions: [
        { label: 'Save and exit', primary: true, run: () => (save(), leave()) },
        { label: 'Discard changes', run: leave },
      ],
    })
  }

  return (
    <header className="relative z-40 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
      <button onClick={exit} aria-label="Back to designs" title="Back to designs" className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-inverse font-mono text-[10px] font-bold text-on-inverse">CG</button>
      <input
        value={name}
        onChange={(e) => set({ name: e.target.value })}
        onBlur={(e) => !e.target.value.trim() && set({ name: UNTITLED })}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        onFocus={(e) => name === UNTITLED && e.currentTarget.select()}
        aria-label="Design name"
        placeholder={UNTITLED}
        spellCheck={false}
        className="h-8 max-w-[16rem] min-w-[6rem] rounded-[7px] bg-transparent px-2 text-[14px] font-semibold tracking-tight outline-none [field-sizing:content] hover:bg-hover focus:bg-selected"
      />
      <SaveStatus dirty={dirty} saved={saved} justSaved={justSaved} />
      <span className="hidden font-mono text-[11px] text-fg-3 lg:inline">{counts} grid</span>

      <div className="ml-auto flex items-center gap-1">
        <IconBtn label="Undo (⌘Z)" onClick={undo} disabled={!canUndo}><Undo2 size={15} strokeWidth={1.75} /></IconBtn>
        <IconBtn label="Redo (⇧⌘Z)" onClick={redo} disabled={!canRedo}><Redo2 size={15} strokeWidth={1.75} /></IconBtn>
        <IconBtn label={isDefault ? 'Grid is at default' : 'Reset grid'} onClick={resetGrid} disabled={isDefault}><RotateCcw size={15} strokeWidth={1.75} /></IconBtn>
        <span className="mx-1 h-5 w-px bg-line" />
        <button
          onClick={() => set({ library: { open: true, target: null } })}
          className="flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-fg-2 hover:bg-hover hover:text-fg"
        >
          <Blocks size={15} strokeWidth={1.75} /> <span className="hidden sm:inline">Library</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setLayoutOpen(!layoutOpen)}
            aria-expanded={layoutOpen}
            className={cn('flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-fg-2 hover:bg-hover hover:text-fg', layoutOpen && 'bg-selected text-fg')}
          >
            <LayoutGrid size={15} strokeWidth={1.75} /> Layout
          </button>
          <Menu open={layoutOpen} onClose={() => setLayoutOpen(false)}>
            <div className="w-72 p-1.5">
              <p className="px-1 pb-2 text-[11px] font-semibold tracking-wide text-fg-3 uppercase">Start from</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map((t) => {
                  const layout = t.build()
                  return (
                    <button
                      key={t.id}
                      role="menuitem"
                      title={t.description}
                      onClick={() => useApp.getState().commit(() => t.build())}
                      className="group flex flex-col gap-1.5 rounded-[8px] p-1.5 text-left hover:bg-hover"
                    >
                      <Thumb doc={layout} />
                      <span className="px-0.5 text-[12px] font-medium text-fg-2 group-hover:text-fg">{t.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <MenuSep />
            <button role="menuitem" onClick={() => setCssOpen(true)} className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2.5 text-[13px] hover:bg-hover">
              <Code2 size={14} className="text-fg-3" /> View CSS
            </button>
          </Menu>
        </div>
        <Segmented<Theme>
          label="Style"
          value={theme}
          onChange={(t) => set({ theme: t })}
          options={[{ value: 'utility', label: 'Utility' }, { value: 'soft', label: 'Soft' }]}
        />
        <IconBtn label={mode === 'light' ? 'Dark mode' : 'Light mode'} onClick={() => set({ mode: mode === 'light' ? 'dark' : 'light' })}>
          {mode === 'light' ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
        </IconBtn>
        <Tip label="Save (⌘S)" side="bottom">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={save}
            disabled={saved && !dirty}
            className="ml-1 flex h-8 items-center gap-1.5 rounded-[8px] bg-inverse px-3 text-[13px] font-semibold text-on-inverse disabled:opacity-35"
          >
            <Save size={14} strokeWidth={2} /> Save
          </motion.button>
        </Tip>
        <span className="mx-1 h-5 w-px bg-line" />
        <Tip label="Back to designs" side="bottom">
          <button
            onClick={exit}
            className="flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-fg-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover hover:text-fg"
          >
            <X size={14} strokeWidth={2} /> Exit
          </button>
        </Tip>
      </div>
      <CssDialog open={cssOpen} onClose={() => setCssOpen(false)} />
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </header>
  )
}

function SaveStatus({ dirty, saved, justSaved }: { dirty: boolean; saved: boolean; justSaved: boolean }) {
  const label = justSaved ? 'Saved' : !saved ? 'Not saved' : dirty ? 'Unsaved changes' : 'Saved'
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={SPRING}
        role="status"
        className="hidden items-center gap-1.5 text-[12px] whitespace-nowrap text-fg-3 md:flex"
      >
        {justSaved ? <Check size={13} className="text-fg" /> : dirty && <span className="size-1.5 rounded-full bg-fg" />}
        {label}
      </motion.span>
    </AnimatePresence>
  )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tip label={label} side="bottom">
      <button aria-label={label} disabled={disabled} onClick={onClick} className="flex size-8 items-center justify-center rounded-[8px] text-fg-2 hover:bg-hover hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent">
        {children}
      </button>
    </Tip>
  )
}

/** Proportional mini-render of a layout, using the same track math as the workspace. */
function Thumb({ doc }: { doc: Doc }) {
  const W = 1440
  const H = 900
  const c = resolveTracks(doc.columns, W, 24, 24).tracks
  const r = resolveTracks(doc.rows, H, 24, 24).tracks
  const box = (x: number, y: number, w: number, h: number) => ({
    x: c[x - 1].start, y: r[y - 1].start,
    width: c[x + w - 2].start + c[x + w - 2].size - c[x - 1].start,
    height: r[y + h - 2].start + r[y + h - 2].size - r[y - 1].start,
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[5px] bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]">
      {doc.areas.length === 0
        ? r.flatMap((_, y) => c.map((_, x) => <rect key={`${x}${y}`} {...box(x + 1, y + 1, 1, 1)} rx={30} fill="none" stroke="var(--fg-3)" strokeWidth={10} strokeDasharray="30 24" />))
        : doc.areas.map((a) => <rect key={a.id} {...box(a.c, a.r, a.w, a.h)} rx={30} fill="var(--line-strong)" />)}
    </svg>
  )
}

function CssDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const doc = useApp((s) => s.doc)
  const theme = useApp((s) => s.theme)
  const [copied, setCopied] = useState(false)
  const css = open ? toCss(doc, theme) : ''
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--backdrop)] px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <motion.div
            role="dialog"
            aria-label="Layout CSS"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={SPRING}
            className="flex max-h-[70vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_0_0_1px_var(--line),0_30px_80px_-20px_rgb(0_0_0/0.4)]"
          >
            <div className="flex h-12 items-center gap-2 border-b border-line px-4">
              <h2 className="text-[14px] font-semibold">Layout CSS</h2>
              <button
                autoFocus
                onClick={() => {
                  navigator.clipboard?.writeText(css)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1400)
                }}
                className="ml-auto flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium text-fg-2 hover:bg-hover hover:text-fg"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded-[6px] text-fg-3 hover:bg-hover hover:text-fg">
                <X size={15} />
              </button>
            </div>
            <pre className="scroll-thin overflow-auto p-4 font-mono text-[12px] leading-relaxed text-fg-2">{css}</pre>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
