import { motion } from 'framer-motion'
import { CheckCircle, RotateCcw, Trophy, ArrowLeft } from 'lucide-react'
import { calculateSessionXp } from '../../lib/srs/xp'

export default function SrsSessionSummary({ ratings, elapsedSec, onBack, onFeedback }) {
  const total = ratings.length
  const correct = ratings.filter(r => r >= 3).length
  const again = ratings.filter(r => r === 1).length
  const xp = calculateSessionXp(ratings)
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const perfect = pct === 100

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <h2 className="text-lg font-bold text-dojo-text text-center">
        {perfect ? 'Parfait !' : 'Session terminee'}
      </h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-dojo-text">{correct}/{total}</p>
          <p className="text-[10px] text-dojo-muted">Correctes</p>
        </div>
        <div className="bg-white rounded-xl border border-dojo-border p-3 text-center">
          <RotateCcw className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-dojo-text">{again}</p>
          <p className="text-[10px] text-dojo-muted">A revoir</p>
        </div>
      </div>

      {/* XP earned */}
      <motion.div
        className="bg-dojo-accent/10 rounded-xl p-4 text-center"
        animate={perfect ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: perfect ? 2 : 0 }}
      >
        <Trophy className="w-6 h-6 text-dojo-accent mx-auto mb-1" />
        <p className="text-2xl font-bold text-dojo-accent">+{xp} XP</p>
        <p className="text-xs text-dojo-muted">en {formatTime(elapsedSec)}</p>
      </motion.div>

      {/* Success rate bar */}
      <div className="bg-white rounded-xl border border-dojo-border p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-dojo-muted">Taux de reussite</span>
          <span className="text-xs font-bold text-dojo-text">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-dojo-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onFeedback}
          className="w-full py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-sm hover:bg-dojo-card transition-colors border border-dojo-border"
        >
          Feedback post-training
        </button>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dojo-accent text-white font-semibold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>
    </motion.div>
  )
}
