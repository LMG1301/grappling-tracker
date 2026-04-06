import { ArrowLeft, Flame, Trophy } from 'lucide-react'
import { useMobilityStats, getWeeklyBreakdown } from '../../hooks/useMobilityStats'
import MobilityHeatmap from './MobilityHeatmap'

export default function MobilityStats({ onBack }) {
  const { streak, sessions, loading } = useMobilityStats()
  const weekly = getWeeklyBreakdown(sessions)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dojo-bg">
        <div className="w-6 h-6 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dojo-bg">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-dojo-text">Stats Mobilite</h2>
        </div>

        {/* Streak cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-dojo-border p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" fill="currentColor" />
            <p className="text-2xl font-bold text-dojo-text">{streak?.current_streak || 0}</p>
            <p className="text-[10px] text-dojo-muted">Streak actuel</p>
          </div>
          <div className="bg-white rounded-xl border border-dojo-border p-4 text-center">
            <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-dojo-text">{streak?.longest_streak || 0}</p>
            <p className="text-[10px] text-dojo-muted">Record</p>
          </div>
        </div>

        {/* Total sessions */}
        <div className="bg-white rounded-xl border border-dojo-border p-4 text-center">
          <p className="text-3xl font-bold text-dojo-text">{streak?.total_sessions || 0}</p>
          <p className="text-xs text-dojo-muted">Sessions totales</p>
        </div>

        {/* Weekly breakdown */}
        <div className="bg-white rounded-xl border border-dojo-border p-4">
          <p className="text-sm font-semibold text-dojo-text mb-3">Cette semaine</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-sm font-bold text-blue-700">{weekly.pre}</span>
              </div>
              <p className="text-[10px] text-dojo-muted">Pre</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-sm font-bold text-green-700">{weekly.post}</span>
              </div>
              <p className="text-[10px] text-dojo-muted">Post</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-sm font-bold text-amber-700">{weekly.morning}</span>
              </div>
              <p className="text-[10px] text-dojo-muted">Matin</p>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-dojo-border p-4">
          <p className="text-sm font-semibold text-dojo-text mb-3">Activite (12 semaines)</p>
          <MobilityHeatmap sessions={sessions} />
        </div>
      </div>
    </div>
  )
}
