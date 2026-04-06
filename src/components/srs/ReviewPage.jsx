import { useState } from 'react'
import { Flame, Layers, BarChart3, Plus } from 'lucide-react'
import { useSrsDeck } from '../../hooks/useSrsDeck'
import { useSrsStats } from '../../hooks/useSrsStats'
import XpBar from './XpBar'
import CardEditor from './CardEditor'

export default function ReviewPage({ onStartSession, onOpenDeck, onOpenFeedback }) {
  const { dueCards, cardCounts, loading, addCard, reload } = useSrsDeck()
  const { stats, level, progress, loading: statsLoading } = useSrsStats()
  const [showEditor, setShowEditor] = useState(false)

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
            <p className="text-xs text-dojo-muted">Reviens demain ou ajoute des cartes.</p>
          </div>
        )}

        {/* Stats mini */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Nouvelles" value={cardCounts.new} color="text-blue-600" />
          <StatCard label="En cours" value={cardCounts.learning} color="text-amber-600" />
          <StatCard label="Maitrisees" value={cardCounts.mastered} color="text-green-600" />
        </div>

        {/* Global stats */}
        <div className="bg-white rounded-xl border border-dojo-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-dojo-muted">Reviews totales</span>
            <span className="text-xs font-bold text-dojo-text">{stats?.total_reviews || 0}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dojo-muted">Tests sur le mat</span>
            <span className="text-xs font-bold text-dojo-text">{stats?.total_mat_tests || 0}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dojo-muted">XP total</span>
            <span className="text-xs font-bold text-dojo-accent">{stats?.total_xp || 0}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenFeedback}
            className="py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-xs hover:bg-dojo-card transition-colors border border-dojo-border"
          >
            Feedback mat
          </button>
          <button
            onClick={onOpenDeck}
            className="py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-xs hover:bg-dojo-card transition-colors border border-dojo-border flex items-center justify-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Mon deck
          </button>
        </div>
        {/* FAB add button */}
        <button
          onClick={() => setShowEditor(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-dojo-accent hover:bg-dojo-accent-hover rounded-full flex items-center justify-center shadow-lg shadow-dojo-accent/30 transition-colors border-none text-white z-40"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {showEditor && (
        <CardEditor
          onSave={async (formData) => { await addCard(formData); await reload(); setShowEditor(false) }}
          onClose={() => setShowEditor(false)}
        />
      )}
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
