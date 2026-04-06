import { PHASE_CONFIG } from '../../lib/mobility/periodization'

export default function PhaseIndicator({ phase }) {
  const config = PHASE_CONFIG[phase]
  if (!config) return null

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  )
}
