import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import MatFeedback from './MatFeedback'

export default function ReviewFeedback({ onBack }) {
  const { user } = useAuth()
  const [recentCards, setRecentCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpEarned, setXpEarned] = useState(null)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      // Fetch cards reviewed in last 48h
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data } = await supabase
        .from('srs_cards')
        .select('*')
        .eq('user_id', user.id)
        .gte('last_review', twoDaysAgo.toISOString().split('T')[0])
        .order('last_review', { ascending: false })

      setRecentCards(data || [])
      setLoading(false)
    }

    load()
  }, [user])

  function handleDone(xp) {
    setXpEarned(xp)
  }

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
          <h2 className="text-lg font-bold text-dojo-text">Feedback post-training</h2>
        </div>

        {xpEarned !== null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-dojo-border p-6 text-center space-y-3"
          >
            <Trophy className="w-10 h-10 text-dojo-accent mx-auto" />
            <p className="text-2xl font-bold text-dojo-accent">+{xpEarned} XP</p>
            <p className="text-sm text-dojo-muted">Feedback enregistre !</p>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-dojo-accent text-white font-bold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
            >
              Retour
            </button>
          </motion.div>
        ) : recentCards.length === 0 ? (
          <div className="bg-white rounded-xl border border-dojo-border p-5 text-center">
            <p className="text-sm text-dojo-muted">Aucune carte revue recemment.</p>
            <p className="text-xs text-dojo-muted mt-1">Fais une session de review d'abord.</p>
          </div>
        ) : (
          <MatFeedback cards={recentCards} onDone={handleDone} />
        )}
      </div>
    </div>
  )
}
