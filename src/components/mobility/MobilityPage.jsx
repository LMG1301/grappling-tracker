import { useState, useEffect } from 'react'
import { Flame, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getPhase, PHASE_CONFIG } from '../../lib/mobility/periodization'
import { fetchStreak, fetchWeeklyCompletion } from '../../lib/mobility/streaks'
import PhaseIndicator from './PhaseIndicator'
import StreakBadge from './StreakBadge'
import MobilityCard from './MobilityCard'

export default function MobilityPage({ competitionWeek = 1, onStartSession, onOpenStats }) {
  const { user } = useAuth()
  const phase = getPhase(competitionWeek)
  const phaseConfig = PHASE_CONFIG[phase]

  const [streak, setStreak] = useState(null)
  const [weeklyDone, setWeeklyDone] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchStreak(user.id),
      fetchWeeklyCompletion(user.id),
    ]).then(([s, w]) => {
      setStreak(s)
      setWeeklyDone(w)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const todayStr = new Date().toISOString().split('T')[0]

  function isDoneToday(type) {
    return weeklyDone.some(s =>
      s.routine_type === type &&
      s.completed_at &&
      new Date(s.completed_at).toISOString().split('T')[0] === todayStr
    )
  }

  // Weekly target based on phase
  const weeklyTarget = parseInt(phaseConfig?.sessionsPerWeek) || 3
  const weeklyCount = weeklyDone.length
  const weeklyPct = Math.min(100, Math.round((weeklyCount / Math.max(weeklyTarget, 1)) * 100))

  return (
    <div className="flex-1 overflow-y-auto bg-dojo-bg">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-dojo-text">Mobilite</h2>
            <PhaseIndicator phase={phase} />
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={streak} />
            <button
              onClick={onOpenStats}
              className="p-2 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekly progress */}
        <div className="bg-white rounded-xl border border-dojo-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-dojo-muted">Cette semaine</span>
            <span className="text-xs font-semibold text-dojo-text">{weeklyCount}/{weeklyTarget} sessions</span>
          </div>
          <div className="w-full h-1.5 bg-dojo-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-dojo-accent rounded-full transition-all duration-500"
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
        </div>

        {/* Phase info */}
        <div className="bg-white rounded-xl border border-dojo-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-dojo-muted">Semaine {competitionWeek}/10</span>
            <span className="text-xs text-dojo-muted">
              {phaseConfig?.sessionsPerWeek} sessions · {phaseConfig?.durationMin} min
            </span>
          </div>
        </div>

        {/* Routine cards */}
        <div className="space-y-2">
          <MobilityCard
            type="pre"
            completedToday={isDoneToday('pre')}
            onStart={() => onStartSession('pre')}
          />
          {phaseConfig?.showPost !== false && (
            <MobilityCard
              type="post"
              completedToday={isDoneToday('post')}
              onStart={() => onStartSession('post')}
            />
          )}
          <MobilityCard
            type="morning"
            completedToday={isDoneToday('morning')}
            onStart={() => onStartSession('morning')}
          />
        </div>

        {/* Taper note */}
        {phase === 'taper' && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">
              Phase Taper : CARs uniquement. Pas de holds statiques.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
