import { motion } from 'framer-motion'
import { CheckCircle, SkipForward, Clock, ArrowLeft } from 'lucide-react'
import StreakBadge from './StreakBadge'

export default function SessionSummary({
  exercises,
  elapsedSec,
  completedCount,
  skippedCount,
  streakResult,
  onBack,
}) {
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const painNotes = exercises.filter(e => e.painLevel && e.painLevel > 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <h2 className="text-lg font-bold text-dojo-text text-center">Session terminee</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
          <Clock className="w-5 h-5 text-dojo-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-dojo-text">{formatDuration(elapsedSec)}</p>
          <p className="text-[10px] text-dojo-muted">Duree</p>
        </div>
        <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-dojo-text">{completedCount}/{exercises.length}</p>
          <p className="text-[10px] text-dojo-muted">Completes</p>
        </div>
        <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
          <SkipForward className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-dojo-text">{skippedCount}</p>
          <p className="text-[10px] text-dojo-muted">Sautes</p>
        </div>
      </div>

      {/* Streak */}
      {streakResult && (
        <motion.div
          className="bg-white rounded-xl border border-dojo-border p-4 flex items-center justify-center gap-3"
          animate={streakResult.isNewRecord ? { borderColor: ['#e2e8f0', '#f97316', '#e2e8f0'] } : {}}
          transition={{ duration: 1.5, repeat: streakResult.isNewRecord ? 2 : 0 }}
        >
          <StreakBadge streak={streakResult} isNewRecord={streakResult.isNewRecord} />
          <div>
            <p className="text-sm font-semibold text-dojo-text">
              {streakResult.current_streak} jour{streakResult.current_streak > 1 ? 's' : ''} consecutif{streakResult.current_streak > 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-dojo-muted">Record: {streakResult.longest_streak} jours</p>
          </div>
        </motion.div>
      )}

      {/* Pain notes */}
      {painNotes.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-3">
          <p className="text-xs font-semibold text-red-700 mb-1">Douleurs signalees</p>
          {painNotes.map((ex, i) => (
            <p key={i} className="text-xs text-red-600">
              {ex.name_fr}: {ex.painLevel}/10
              {ex.romNote && ` — ${ex.romNote}`}
            </p>
          ))}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dojo-accent text-white font-semibold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>
    </motion.div>
  )
}
