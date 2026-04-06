import { useMemo } from 'react'
import { buildHeatmapData } from '../../hooks/useMobilityStats'

export default function MobilityHeatmap({ sessions }) {
  const heatmap = useMemo(() => buildHeatmapData(sessions), [sessions])

  // Generate last 12 weeks of dates
  const weeks = useMemo(() => {
    const result = []
    const today = new Date()
    for (let w = 11; w >= 0; w--) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(today.getDate() - (w * 7 + (6 - d)))
        week.push(date.toISOString().split('T')[0])
      }
      result.push(week)
    }
    return result
  }, [])

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  function getCellColor(dateStr) {
    const entry = heatmap[dateStr]
    if (!entry) return 'bg-dojo-surface'
    if (entry.completed) return 'bg-green-400'
    return 'bg-amber-300'
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        <div className="w-4 flex flex-col gap-0.5">
          {dayLabels.map((d, i) => (
            <div key={i} className="h-3.5 flex items-center">
              <span className="text-[8px] text-dojo-muted">{d}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1">
              {week.map((dateStr) => (
                <div
                  key={dateStr}
                  className={`h-3.5 rounded-[2px] ${getCellColor(dateStr)}`}
                  title={dateStr}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 justify-end">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-dojo-surface" />
          <span className="text-[9px] text-dojo-muted">Vide</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-300" />
          <span className="text-[9px] text-dojo-muted">Partiel</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-green-400" />
          <span className="text-[9px] text-dojo-muted">Complet</span>
        </div>
      </div>
    </div>
  )
}
