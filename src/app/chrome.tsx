import { motion } from 'motion/react'

/** One spring for all UI motion: quick, critically damped. */
export const SPRING = { type: 'spring', stiffness: 520, damping: 42 } as const

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${checked ? 'bg-inverse' : 'bg-line-strong'}`}
    >
      <motion.span animate={{ x: checked ? 15 : 2 }} transition={SPRING} className="absolute top-[2px] left-0 size-[14px] rounded-full bg-surface shadow-sm" />
    </button>
  )
}
