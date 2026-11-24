import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { SPRING } from '../app/chrome'
import { cn } from '../lib/hooks'

export function Segmented<T extends string | number>({
  value, options, onChange, label,
}: {
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (v: T) => void
  label?: string
}) {
  const uid = useId()
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 items-center rounded-[7px] bg-selected p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn('relative isolate h-6 rounded-[5px] px-2 text-[11.5px] font-medium whitespace-nowrap transition-colors', active ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
          >
            {active && (
              <motion.span
                layoutId={`seg-${uid}`}
                transition={SPRING}
                className="absolute inset-0 -z-10 rounded-[5px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--line)]"
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Tip({ label, children, side = 'top' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={side} sideOffset={6} className="z-50 rounded-[6px] bg-inverse px-2 py-1 text-[12px] font-medium text-on-inverse shadow-lg">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
