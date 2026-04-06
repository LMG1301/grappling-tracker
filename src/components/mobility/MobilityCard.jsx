import { Check, ChevronRight } from 'lucide-react'
import { ROUTINE_META } from '../../lib/mobility/exercises'

export default function MobilityCard({ type, completedToday, onStart }) {
  const meta = ROUTINE_META[type]
  if (!meta) return null

  return (
    <button
      onClick={onStart}
      className={`w-full bg-white rounded-xl border ${completedToday ? 'border-green-300' : 'border-dojo-border'} p-4 flex items-center justify-between transition-all hover:shadow-sm active:scale-[0.98] text-left`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${meta.bgClass} flex items-center justify-center`}>
          {completedToday ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <span className={`text-sm font-bold ${meta.textClass}`}>
              {type === 'pre' ? 'P' : type === 'post' ? 'R' : 'M'}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-dojo-text text-sm">{meta.labelFr}</p>
          <p className="text-xs text-dojo-muted">{meta.duration}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {completedToday && (
          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Fait
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-dojo-muted" />
      </div>
    </button>
  )
}
