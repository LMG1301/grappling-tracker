import { Flame, Layers, BarChart3 } from 'lucide-react'
import { useSrsDeck } from '../../hooks/useSrsDeck'
import { useSrsStats } from '../../hooks/useSrsStats'
import XpBar from './XpBar'

export default function ReviewPage({ onStartSession, onOpenFeedback, onOpenBrowse }) {
  const { dueCards, cardCounts, loading } = useSrsDeck()
  const { stats, level, progress, loading: statsLoading } = useSrsStats()

  if (loading || statsLoading) {
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dojo-text">Review</h2>
          <div className="flex items-center gap-2">
            <Flame
              className={`w-5 h-5 ${stats?.current_streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}
              fill={stats?.current_streak > 0 ? 'currentColor' : 'none'}
            />
            <span className="text-sm font-bold text-dojo-text">{stats?.current_streak || 0}</span>
          </div>
        </div>

        {/* XP bar */}
        <XpBar level={level} progress={progress} />

        {/* Due cards CTA */}
        {dueCards.length > 0 ? (
          <div className="bg-white rounded-xl border border-dojo-border p-5 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-dojo-accent/10 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8 text-dojo-accent" />
            </div>
            <p className="text-2xl font-bold text-dojo-text">{dueCards.length}</p>
            <p className="text-sm text-dojo-muted">carte{dueCards.length > 1 ? 's' : ''} a revoir aujourd'hui</p>
            <button
              onClick={() => onStartSession(dueCards)}
              className="w-full py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors border-none"
            >
              Commencer la review
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dojo-border p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-dojo-text">Toutes les cartes sont revues !</p>
            <p className="text-xs text-dojo-muted">Ajoute des flashcards a tes techniques pour les revoir ici.</p>
          </div>
        )}

        {/* Stats mini */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Nouvelles" value={cardCounts.new} color="text-orange-600" />
          <StatCard label="En cours" value={cardCounts.learning} color="text-blue-600" />
          <StatCard label="Maitrisees" value={cardCounts.mastered} color="text-green-600" />
        </div>

        {/* Global stats */}
        <div className="bg-white rounded-xl border border-dojo-border p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-dojo-muted">Total dans le deck</span>
            <span className="text-xs font-bold text-dojo-text">{cardCounts.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dojo-muted">XP total</span>
            <span className="text-xs font-bold text-dojo-accent">{stats?.total_xp || 0}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {cardCounts.total > 0 && (
            <button
              onClick={onOpenBrowse}
              className="py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-xs hover:bg-dojo-card transition-colors border border-dojo-border"
            >
              Consulter les cartes
            </button>
          )}
          <button
            onClick={onOpenFeedback}
            className={`py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-xs hover:bg-dojo-card transition-colors border border-dojo-border ${cardCounts.total === 0 ? 'col-span-2' : ''}`}
          >
            Feedback post-training
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-dojo-muted">{label}</p>
    </div>
  )
}
