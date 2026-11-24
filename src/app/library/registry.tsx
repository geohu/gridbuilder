import {
  AlertCircle, AtSign, BookOpen, ChartNoAxesColumn, ChevronDown, Clock, FileText, Filter, Inbox, Info, LayoutList, ListTree, Mail, MessageCircle, MessagesSquare,
  NotebookPen, PanelLeft, PanelTop, Paperclip, Phone, Search, Send, Settings, Smile, SquareStack, Table2, Tags, TextCursorInput, UserRound, Users,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/hooks'
import type { Overflow } from '../store'

export type Category = 'Navigation' | 'Lists & data' | 'Conversation' | 'Customer' | 'Inputs' | 'Feedback'
export const CATEGORIES: Category[] = ['Navigation', 'Lists & data', 'Conversation', 'Customer', 'Inputs', 'Feedback']

export interface ComponentDef {
  id: string
  name: string
  category: Category
  icon: LucideIcon
  summary: string
  description: string
  useWhen: string[]
  anatomy: string[]
  /** Smallest size it reads well at, in px. In Scroll mode this is enforced. */
  min: { w: number; h: number }
  /**
   * `fill` components stretch to share the panel's free height in Responsive mode
   * (and scroll inside themselves); `content` components keep their natural height.
   */
  sizing: 'fill' | 'content'
  render: (p: { overflow: Overflow }) => ReactNode
}

/* ---------------- shared bits ---------------- */

/** In Responsive mode a fill component scrolls internally; in Scroll mode the panel does. */
const Body = ({ overflow, className, children }: { overflow: Overflow; className?: string; children: ReactNode }) => (
  <div className={cn(overflow === 'responsive' && 'scroll-thin min-h-0 flex-1 overflow-y-auto', className)}>{children}</div>
)
const Avatar = ({ t, size = 28, solid }: { t: string; size?: number; solid?: boolean }) => (
  <span
    className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', solid ? 'bg-inverse text-on-inverse' : 'bg-selected text-fg-2')}
    style={{ width: size, height: size, fontSize: size * 0.38 }}
  >
    {t}
  </span>
)
const Chip = ({ children, strong }: { children: ReactNode; strong?: boolean }) => (
  <span className={cn('inline-flex h-5 shrink-0 items-center rounded-[4px] px-1.5 text-[11px] font-medium', strong ? 'bg-inverse text-on-inverse' : 'text-fg-2 shadow-[inset_0_0_0_1px_var(--line-strong)]')}>
    {children}
  </span>
)
const Dot = ({ filled = true }: { filled?: boolean }) => (
  <span className={cn('size-2 shrink-0 rounded-full', filled ? 'bg-fg' : 'border border-fg-3')} />
)

const TICKETS = [
  ['MA', 'Charged twice for the annual plan', 'Maya Okafor', '2m', 'Urgent', true],
  ['JL', 'SSO redirect loops back to login', 'Jonah Lindqvist', '9m', 'High', true],
  ['PS', 'CSV export is missing columns', 'Priya Shah', '14m', 'Normal', false],
  ['LM', 'Order still shows processing', 'Leo Moreau', '22m', 'Normal', true],
  ['AC', 'Webhook retries flooding our endpoint', 'Amara Castillo', '31m', 'High', false],
  ['FN', 'New teammate never got the invite', 'Felix Novak', '48m', 'Low', false],
  ['NH', 'Refund hasn’t arrived yet', 'Noor Haddad', '1h', 'Normal', false],
  ['TB', 'Dashboard charts not loading', 'Theo Brennan', '1h', 'High', false],
  ['IS', 'Need to change the delivery address', 'Ines Sato', '2h', 'Low', false],
  ['KK', 'API returns 429 below our limit', 'Kai Keller', '3h', 'Normal', false],
  ['SD', 'Invoice shows the wrong VAT number', 'Sofia Duarte', '4h', 'Low', false],
  ['RM', 'Mobile app crashes on launch', 'Ravi Mensah', '5h', 'Urgent', false],
] as const

const MESSAGES = [
  ['customer', 'Maya Okafor', '9:12', 'Hi — I see two charges for the same renewal on our card. Can you reverse the duplicate?'],
  ['note', 'Bea Lund', '9:20', 'Customer is mid-renewal. Duplicate charge confirmed in billing logs.'],
  ['agent', 'You', '9:31', 'Thanks Maya — I can see the duplicate and I’ve refunded it. It’ll reach your card in 3–5 business days.'],
  ['customer', 'Maya Okafor', '9:44', 'Appreciate the quick reply. Will we get an updated invoice too?'],
  ['agent', 'You', '9:52', 'Yes — a corrected invoice is on its way to billing@northwind.com.'],
] as const

/* ---------------- components ---------------- */

function NavRail() {
  const items: [LucideIcon, string][] = [[Inbox, 'Inbox'], [Users, 'Customers'], [BookOpen, 'Knowledge'], [ChartNoAxesColumn, 'Reports']]
  const [active, setActive] = useState(0)
  return (
    <nav className="flex flex-1 flex-col items-center gap-1 py-3 @[11rem]:items-stretch @[11rem]:px-2">
      <span className="mb-2 flex size-8 shrink-0 items-center justify-center self-center rounded-[8px] bg-inverse font-mono text-[10px] font-bold text-on-inverse">CG</span>
      {items.map(([Icon, label], i) => (
        <button
          key={label}
          onClick={() => setActive(i)}
          aria-label={label}
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center gap-2.5 rounded-[8px] text-fg-3 hover:text-fg @[11rem]:w-auto @[11rem]:justify-start @[11rem]:px-2.5', i === active && 'bg-selected text-fg')}
        >
          <Icon size={17} strokeWidth={1.75} />
          <span className="hidden text-[13px] font-medium @[11rem]:inline">{label}</span>
        </button>
      ))}
      <button aria-label="Settings" className="mt-auto flex h-9 w-9 items-center justify-center self-center rounded-[8px] text-fg-3 hover:text-fg">
        <Settings size={17} strokeWidth={1.75} />
      </button>
    </nav>
  )
}

function PageHeader() {
  return (
    <div className="flex h-12 items-center gap-2 px-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">Charged twice for the annual plan</div>
        <div className="hidden truncate text-[11px] text-fg-3 @[22rem]:block">CS-20480 · via email · opened 9:12 AM</div>
      </div>
      <span className="hidden @[18rem]:inline-flex"><Chip strong>Urgent</Chip></span>
      <button className="h-7 shrink-0 rounded-[6px] px-2.5 text-[12px] font-medium shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover">Assign</button>
      <button className="hidden h-7 shrink-0 rounded-[6px] bg-inverse px-2.5 text-[12px] font-medium text-on-inverse @[26rem]:block">Resolve</button>
    </div>
  )
}

function TabsC() {
  const tabs = ['Overview', 'Activity', 'Orders', 'Notes']
  const [active, setActive] = useState(0)
  return (
    <div role="tablist" className="scroll-thin flex h-10 items-end gap-4 overflow-x-auto px-3">
      {tabs.map((t, i) => (
        <button
          key={t}
          role="tab"
          aria-selected={i === active}
          onClick={() => setActive(i)}
          className={cn('-mb-px h-9 shrink-0 border-b-2 text-[13px] font-medium', i === active ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg-2')}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function TicketList({ overflow }: { overflow: Overflow }) {
  const [sel, setSel] = useState(0)
  return (
    <Body overflow={overflow}>
      <ul>
        {TICKETS.map(([a, subject, name, ago, pri, unread], i) => (
          <li key={subject}>
            <button onClick={() => setSel(i)} className={cn('flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left', i === sel ? 'bg-selected' : 'hover:bg-hover')}>
              <span className="hidden @[16rem]:inline-flex"><Avatar t={a} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {unread && <Dot />}
                  <span className={cn('truncate text-[13px]', unread ? 'font-semibold' : 'font-medium')}>{subject}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-fg-3">{ago}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[12px] text-fg-3">
                  <span className="truncate">{name}</span>
                  <span className="ml-auto hidden @[20rem]:inline-flex"><Chip strong={pri === 'Urgent'}>{pri}</Chip></span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Body>
  )
}

function DataTable({ overflow }: { overflow: Overflow }) {
  return (
    <Body overflow={overflow} className="scroll-thin">
      <table className="w-full border-collapse text-left text-[12.5px]">
        <thead className="sticky top-0 bg-surface-2 text-[11px] font-semibold tracking-wide text-fg-3 uppercase">
          <tr className="border-b border-line">
            <th className="px-3 py-2 font-semibold">Subject</th>
            <th className="hidden px-3 py-2 font-semibold @[28rem]:table-cell">Customer</th>
            <th className="hidden px-3 py-2 font-semibold @[36rem]:table-cell">Priority</th>
            <th className="hidden px-3 py-2 font-semibold @[44rem]:table-cell">Channel</th>
            <th className="px-3 py-2 text-right font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {TICKETS.map(([, subject, name, ago, pri], i) => (
            <tr key={subject} className="border-b border-line hover:bg-hover">
              <td className="max-w-0 truncate px-3 py-2 font-medium">{subject}</td>
              <td className="hidden truncate px-3 py-2 text-fg-2 @[28rem]:table-cell">{name}</td>
              <td className="hidden px-3 py-2 @[36rem]:table-cell"><Chip strong={pri === 'Urgent'}>{pri}</Chip></td>
              <td className="hidden px-3 py-2 text-fg-2 @[44rem]:table-cell">{['Email', 'Chat', 'Phone'][i % 3]}</td>
              <td className="px-3 py-2 text-right font-mono text-[11px] text-fg-3">{ago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Body>
  )
}

function Details() {
  const rows = [['Plan', 'Enterprise'], ['Seats', '240'], ['Lifetime value', '$48,210'], ['Customer since', 'Mar 2021'], ['Region', 'EMEA'], ['Health', 'Watch']]
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 p-3 text-[12.5px] @[24rem]:grid-cols-[auto_1fr_auto_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-fg-3">{k}</dt>
          <dd className="truncate text-right font-medium @[24rem]:text-left">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Timeline({ overflow }: { overflow: Overflow }) {
  const events = [
    ['Refund issued', 'You', '9:52'], ['Replied to customer', 'You', '9:31'], ['Internal note added', 'Bea Lund', '9:20'],
    ['Assigned to you', 'Routing', '9:13'], ['Ticket created via email', 'Maya Okafor', '9:12'], ['Viewed pricing page', 'Maya Okafor', '8:40'],
  ]
  return (
    <Body overflow={overflow}>
      <ol className="relative m-3 flex flex-col gap-3 pl-4 before:absolute before:top-1 before:bottom-1 before:left-[3px] before:w-px before:bg-line-strong">
        {events.map(([what, who, at]) => (
          <li key={what} className="relative text-[12.5px]">
            <span className="absolute top-1.5 -left-4 size-[7px] rounded-full border border-fg-2 bg-surface" />
            <div className="font-medium">{what}</div>
            <div className="text-[11.5px] text-fg-3">{who} · {at}</div>
          </li>
        ))}
      </ol>
    </Body>
  )
}

function Thread({ overflow }: { overflow: Overflow }) {
  return (
    <Body overflow={overflow}>
      <ol className="mx-auto flex max-w-[44rem] flex-col gap-4 p-4">
        {MESSAGES.map(([kind, who, at, body], i) => (
          <li key={i} className="flex gap-3">
            <span className="hidden @[20rem]:inline-flex"><Avatar t={who === 'You' ? 'ME' : who.split(' ').map((w) => w[0]).join('')} solid={kind !== 'customer'} /></span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline gap-2 text-[12px]">
                <span className="font-semibold">{who}</span>
                {kind === 'note' && <span className="text-fg-3">Internal note</span>}
                <span className="text-fg-3">{at}</span>
              </div>
              <div
                className={cn(
                  'rounded-[8px] px-3 py-2 text-[13px] leading-relaxed',
                  kind === 'customer' && 'bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]',
                  kind === 'agent' && 'bg-selected',
                  kind === 'note' && 'border border-dashed border-line-strong text-fg-2',
                )}
              >
                {body}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Body>
  )
}

function Composer() {
  const [mode, setMode] = useState<'Reply' | 'Note'>('Reply')
  const [text, setText] = useState('')
  return (
    <div className="p-3">
      <div className={cn('flex flex-col gap-2 rounded-[10px] p-2.5 shadow-[inset_0_0_0_1px_var(--line-strong)]', mode === 'Note' && 'bg-surface-2')}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={mode === 'Reply' ? 'Reply to Maya…' : 'Add an internal note…'}
          className="w-full resize-none bg-transparent px-1 text-[13px] outline-none placeholder:text-fg-3"
        />
        <div className="flex items-center gap-1">
          {(['Reply', 'Note'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn('h-6 rounded-[5px] px-2 text-[11.5px] font-medium', m === mode ? 'bg-selected text-fg' : 'text-fg-3')}>
              {m}
            </button>
          ))}
          <span className="hidden @[20rem]:contents">
            <button aria-label="Attach" className="ml-1 flex size-6 items-center justify-center rounded-[5px] text-fg-3 hover:text-fg"><Paperclip size={13} /></button>
            <button aria-label="Emoji" className="flex size-6 items-center justify-center rounded-[5px] text-fg-3 hover:text-fg"><Smile size={13} /></button>
          </span>
          <button onClick={() => setText('')} disabled={!text.trim()} className="ml-auto flex h-7 items-center gap-1.5 rounded-[6px] bg-inverse px-2.5 text-[12px] font-medium text-on-inverse disabled:opacity-30">
            Send <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Notes({ overflow }: { overflow: Overflow }) {
  return (
    <div className={cn('flex flex-col p-3', overflow === 'responsive' && 'min-h-0 flex-1')}>
      <textarea
        placeholder="Notes about this customer…"
        defaultValue={'Mid-renewal — handle with care.\nPrefers email over phone.'}
        className={cn('w-full resize-none rounded-[8px] bg-surface-2 p-2.5 text-[13px] leading-relaxed shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--fg-3)]', overflow === 'responsive' ? 'min-h-0 flex-1' : 'min-h-32')}
      />
    </div>
  )
}

function ProfileCard() {
  return (
    <div className="flex items-center gap-3 p-3 @[20rem]:gap-4">
      <Avatar t="MO" size={40} solid />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">Maya Okafor</div>
        <div className="truncate text-[12px] text-fg-3">maya@northwind.com</div>
        <div className="mt-1.5 hidden gap-1.5 @[16rem]:flex">
          <Chip>Enterprise</Chip>
          <Chip>EMEA</Chip>
        </div>
      </div>
      <span className="hidden gap-1 @[24rem]:flex">
        {[Mail, Phone, AtSign].map((I, i) => (
          <button key={i} aria-label="Contact" className="flex size-7 items-center justify-center rounded-[6px] text-fg-3 shadow-[inset_0_0_0_1px_var(--line)] hover:text-fg"><I size={13} /></button>
        ))}
      </span>
    </div>
  )
}

function TagList() {
  const [tags, setTags] = useState(['billing', 'refund', 'renewal', 'vip', 'eu'])
  return (
    <div className="flex flex-wrap gap-1.5 p-3">
      {tags.map((t) => (
        <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))} title="Remove" className="h-6 rounded-full px-2.5 text-[12px] font-medium text-fg-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:line-through">
          {t}
        </button>
      ))}
      <button onClick={() => setTags([...tags, `tag-${tags.length + 1}`])} className="h-6 rounded-full border border-dashed border-line-strong px-2.5 text-[12px] text-fg-3 hover:text-fg">+ Tag</button>
    </div>
  )
}

function SearchBar() {
  return (
    <div className="p-2.5">
      <label className="flex h-8 items-center gap-2 rounded-[8px] bg-selected px-2.5 text-fg-3 focus-within:shadow-[inset_0_0_0_1px_var(--fg-3)]">
        <Search size={14} />
        <input placeholder="Search tickets, customers…" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3" />
        <kbd className="hidden font-mono text-[10px] @[16rem]:inline">⌘K</kbd>
      </label>
    </div>
  )
}

function FilterChips() {
  const opts = ['All', 'Mine', 'Urgent', 'Unassigned', 'Breaching SLA']
  const [on, setOn] = useState('All')
  return (
    <div className="scroll-thin flex items-center gap-1.5 overflow-x-auto px-3 py-2">
      <Filter size={13} className="shrink-0 text-fg-3" />
      {opts.map((o) => (
        <button key={o} onClick={() => setOn(o)} className={cn('h-6 shrink-0 rounded-full px-2.5 text-[12px] font-medium', o === on ? 'bg-inverse text-on-inverse' : 'text-fg-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover')}>
          {o}
        </button>
      ))}
    </div>
  )
}

function Form() {
  const field = 'h-8 w-full rounded-[6px] bg-surface-2 px-2.5 text-[13px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--fg-3)]'
  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid gap-3 p-3 @[28rem]:grid-cols-2">
      <label className="grid gap-1 text-[12px] text-fg-2">Subject<input className={field} defaultValue="Charged twice for the annual plan" /></label>
      <label className="grid gap-1 text-[12px] text-fg-2">
        Priority
        <span className="relative">
          <select className={cn(field, 'appearance-none')} defaultValue="Urgent"><option>Urgent</option><option>High</option><option>Normal</option><option>Low</option></select>
          <ChevronDown size={13} className="pointer-events-none absolute top-2.5 right-2.5 text-fg-3" />
        </span>
      </label>
      <label className="grid gap-1 text-[12px] text-fg-2">Assignee<input className={field} defaultValue="You" /></label>
      <label className="grid gap-1 text-[12px] text-fg-2">Customer email<input className={field} defaultValue="maya@northwind.com" /></label>
      <div className="flex justify-end gap-2 @[28rem]:col-span-2">
        <button type="button" className="h-7 rounded-[6px] px-2.5 text-[12px] font-medium shadow-[inset_0_0_0_1px_var(--line-strong)]">Cancel</button>
        <button className="h-7 rounded-[6px] bg-inverse px-2.5 text-[12px] font-medium text-on-inverse">Save</button>
      </div>
    </form>
  )
}

function Banner() {
  const [shown, setShown] = useState(true)
  if (!shown) return <button onClick={() => setShown(true)} className="m-3 text-[12px] text-fg-3 underline">Show banner</button>
  return (
    <div className="m-3 flex items-start gap-2.5 rounded-[8px] bg-selected p-2.5 text-[12.5px]">
      <AlertCircle size={15} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold">SLA breached 18m ago.</span> <span className="text-fg-2">First response was due at 9:30 AM.</span>
      </div>
      <button onClick={() => setShown(false)} className="shrink-0 text-[12px] font-medium text-fg-2 hover:text-fg">Dismiss</button>
    </div>
  )
}

function EmptyState({ overflow }: { overflow: Overflow }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 p-6 text-center', overflow === 'responsive' && 'min-h-0 flex-1')}>
      <span className="flex size-10 items-center justify-center rounded-full bg-selected"><Inbox size={18} strokeWidth={1.75} /></span>
      <div className="text-[14px] font-semibold">Inbox zero</div>
      <p className="max-w-[16rem] text-[12.5px] text-fg-3">No tickets match these filters. New conversations will show up here.</p>
      <button className="mt-1 h-7 rounded-[6px] px-2.5 text-[12px] font-medium shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover">Clear filters</button>
    </div>
  )
}

/* ---------------- registry ---------------- */

/** What the component does in each panel overflow mode, shown in the library. */
export const BEHAVIOUR: Record<string, Record<Overflow, string>> = {}

export const LIBRARY: ComponentDef[] = [
  {
    id: 'nav-rail', name: 'Navigation rail', category: 'Navigation', icon: PanelLeft,
    summary: 'Primary app sections as an icon rail.',
    description: 'Vertical navigation for top-level destinations. Collapses to icons in narrow panels and shows labels once there is room.',
    useWhen: ['The panel is a narrow column at the edge of the workspace', 'There are 3–7 top-level destinations'],
    anatomy: ['Logo', 'Destination buttons (icon + label)', 'Settings pinned to the bottom'],
    min: { w: 56, h: 240 }, sizing: 'fill', render: () => <NavRail />,
  },
  {
    id: 'page-header', name: 'Page header', category: 'Navigation', icon: PanelTop,
    summary: 'Title, metadata and primary actions.',
    description: 'Sits at the top of a panel to name what is shown and hold its main actions. Metadata and secondary actions drop away as the panel narrows.',
    useWhen: ['A panel shows a single record, like a ticket', 'Actions apply to the whole panel'],
    anatomy: ['Title', 'Metadata line', 'Priority badge', 'Secondary and primary actions'],
    min: { w: 240, h: 48 }, sizing: 'content', render: () => <PageHeader />,
  },
  {
    id: 'tabs', name: 'Tabs', category: 'Navigation', icon: SquareStack,
    summary: 'Switch between views in one panel.',
    description: 'A row of tabs for peer views of the same record. Scrolls sideways when the tabs outgrow the panel.',
    useWhen: ['A panel has 2–6 related views', 'Only one view is needed at a time'],
    anatomy: ['Tab list', 'Active indicator'],
    min: { w: 220, h: 40 }, sizing: 'content', render: () => <TabsC />,
  },
  {
    id: 'ticket-list', name: 'Ticket list', category: 'Lists & data', icon: LayoutList,
    summary: 'Selectable list of conversations.',
    description: 'The queue an agent works through. Rows show subject, customer and age; avatars and priority appear when the panel is wide enough.',
    useWhen: ['Agents triage or pick their next ticket', 'Items need a two-line summary, not columns'],
    anatomy: ['Row: unread dot, subject, age', 'Second line: customer, priority', 'Avatar (wide panels)'],
    min: { w: 240, h: 240 }, sizing: 'fill', render: ({ overflow }) => <TicketList overflow={overflow} />,
  },
  {
    id: 'data-table', name: 'Data table', category: 'Lists & data', icon: Table2,
    summary: 'Rows and columns for scanning and comparing.',
    description: 'Tabular data with a sticky header. In Responsive mode, lower-priority columns hide as the panel narrows; in Scroll mode all columns stay and the panel scrolls sideways.',
    useWhen: ['Users compare values across many records', 'The panel is wide (reports, supervisor views)'],
    anatomy: ['Sticky header', 'Columns: subject, customer, priority, channel, updated', 'Row hover'],
    min: { w: 640, h: 200 }, sizing: 'fill', render: ({ overflow }) => <DataTable overflow={overflow} />,
  },
  {
    id: 'details', name: 'Details', category: 'Lists & data', icon: ListTree,
    summary: 'Label–value pairs for a record.',
    description: 'Compact attributes of a customer or ticket. One column in narrow panels, two columns of pairs when wide.',
    useWhen: ['Showing a handful of fixed attributes', 'Values are short'],
    anatomy: ['Label', 'Value'],
    min: { w: 200, h: 130 }, sizing: 'content', render: () => <Details />,
  },
  {
    id: 'timeline', name: 'Activity timeline', category: 'Lists & data', icon: Clock,
    summary: 'Chronological events with actors.',
    description: 'Shows what happened and who did it, newest first. Good for audit trails and customer activity.',
    useWhen: ['Order of events matters', 'Mixing system and human events'],
    anatomy: ['Rail', 'Event marker', 'Event title', 'Actor and time'],
    min: { w: 220, h: 180 }, sizing: 'fill', render: ({ overflow }) => <Timeline overflow={overflow} />,
  },
  {
    id: 'thread', name: 'Message thread', category: 'Conversation', icon: MessagesSquare,
    summary: 'Customer, agent and internal messages.',
    description: 'The conversation itself. Distinguishes customer messages, agent replies and internal notes; avatars appear when there is room.',
    useWhen: ['The panel is the main working area for a ticket'],
    anatomy: ['Author and time', 'Message bubble', 'Internal-note style', 'Avatar (wide panels)'],
    min: { w: 300, h: 240 }, sizing: 'fill', render: ({ overflow }) => <Thread overflow={overflow} />,
  },
  {
    id: 'composer', name: 'Composer', category: 'Conversation', icon: MessageCircle,
    summary: 'Write a reply or internal note.',
    description: 'Text entry with a reply/note switch and send action. Attachment and emoji tools appear when wide enough. Usually placed under a message thread.',
    useWhen: ['Agents respond from this panel', 'Paired with a message thread'],
    anatomy: ['Text area', 'Reply / Note switch', 'Tools', 'Send button'],
    min: { w: 280, h: 110 }, sizing: 'content', render: () => <Composer />,
  },
  {
    id: 'notes', name: 'Notes', category: 'Conversation', icon: NotebookPen,
    summary: 'Free-text notes about the customer.',
    description: 'A plain notes field. In Responsive mode it grows to fill the panel’s spare height.',
    useWhen: ['Agents need to leave context for teammates'],
    anatomy: ['Text area'],
    min: { w: 200, h: 120 }, sizing: 'fill', render: ({ overflow }) => <Notes overflow={overflow} />,
  },
  {
    id: 'profile', name: 'Profile card', category: 'Customer', icon: UserRound,
    summary: 'Who the customer is, at a glance.',
    description: 'Name, email and key badges. Contact shortcuts appear in wide panels.',
    useWhen: ['Top of a customer context panel', 'Agents need to confirm identity quickly'],
    anatomy: ['Avatar', 'Name and email', 'Badges', 'Contact actions (wide)'],
    min: { w: 200, h: 72 }, sizing: 'content', render: () => <ProfileCard />,
  },
  {
    id: 'tags', name: 'Tag list', category: 'Customer', icon: Tags,
    summary: 'Labels that wrap to fit.',
    description: 'Editable tags that wrap onto new lines as the panel narrows.',
    useWhen: ['Categorising tickets or customers'],
    anatomy: ['Tag', 'Add tag'],
    min: { w: 160, h: 40 }, sizing: 'content', render: () => <TagList />,
  },
  {
    id: 'search', name: 'Search bar', category: 'Inputs', icon: TextCursorInput,
    summary: 'Find tickets and customers.',
    description: 'A full-width search field with a keyboard shortcut hint when there’s room.',
    useWhen: ['Above a list or table', 'In a header row'],
    anatomy: ['Icon', 'Input', 'Shortcut hint (wide)'],
    min: { w: 180, h: 48 }, sizing: 'content', render: () => <SearchBar />,
  },
  {
    id: 'filters', name: 'Filter chips', category: 'Inputs', icon: Filter,
    summary: 'Quick, single-choice filters.',
    description: 'A row of filter chips. Scrolls sideways rather than wrapping, to keep a single row.',
    useWhen: ['Above a list, for common views like Mine or Urgent'],
    anatomy: ['Filter icon', 'Chips (one active)'],
    min: { w: 200, h: 40 }, sizing: 'content', render: () => <FilterChips />,
  },
  {
    id: 'form', name: 'Form', category: 'Inputs', icon: FileText,
    summary: 'Edit fields of a record.',
    description: 'Labelled fields with actions. One column when narrow, two columns when wide.',
    useWhen: ['Creating or editing a ticket or customer'],
    anatomy: ['Label', 'Input / select', 'Cancel and Save'],
    min: { w: 240, h: 220 }, sizing: 'content', render: () => <Form />,
  },
  {
    id: 'banner', name: 'Banner', category: 'Feedback', icon: Info,
    summary: 'Inline status or warning.',
    description: 'A dismissible message at the top of a panel, for status that needs attention but not a modal.',
    useWhen: ['SLA warnings, outages, or account flags'],
    anatomy: ['Icon', 'Message', 'Dismiss'],
    min: { w: 220, h: 48 }, sizing: 'content', render: () => <Banner />,
  },
  {
    id: 'empty', name: 'Empty state', category: 'Feedback', icon: Inbox,
    summary: 'What to show when there’s nothing.',
    description: 'Explains why a panel is empty and offers a next step. Centres itself in the available space.',
    useWhen: ['A list or view has no results'],
    anatomy: ['Icon', 'Title', 'Explanation', 'Action'],
    min: { w: 200, h: 160 }, sizing: 'fill', render: ({ overflow }) => <EmptyState overflow={overflow} />,
  },
]

for (const c of LIBRARY)
  BEHAVIOUR[c.id] =
    c.sizing === 'fill'
      ? { responsive: 'Stretches to share the panel’s free height and scrolls inside itself.', scroll: `Renders at full length (min ${c.min.w} × ${c.min.h}px); the panel scrolls.` }
      : { responsive: 'Keeps its natural height; content reflows to the panel’s width.', scroll: `Keeps its natural size (min width ${c.min.w}px); the panel scrolls if it doesn’t fit.` }

const byId = new Map(LIBRARY.map((c) => [c.id, c]))
export const getComponent = (id: string) => byId.get(id)
