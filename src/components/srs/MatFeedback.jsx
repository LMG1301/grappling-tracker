import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { CATEGORY_META } from '../../lib/srs/deck'
import { XP_TABLE } from '../../lib/srs/xp'

export default function MatFeedback({ cards, onDone }) {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState({}) // cardId -> 'none' | 'tested' | 'success'

  async function handleSubmit() {
    if (!user) return

    let totalXp = 0
    const entries = Object.entries(feedback)

    for (const [cardId, status] of entries) {
      if (status === 'none') continue

      const attempted = status === 'tested' || status === 'success'
      const succeeded = status === 'success'

      await supabase.from('srs_mat_feedback').insert({
        user_id: user.id,
        card_id: cardId,
        attempted,
        succeeded,
      })

      // Update card mat counters
      const card = cards.find(c => c.id === cardId)
      if (card) {
        await supabase
          .from('srs_cards')
          .update({
            mat_tested: card.mat_tested + (attempted ? 1 : 0),
            mat_success: card.mat_success + (succeeded ? 1 : 0),
          })
          .eq('id', cardId)
      }

      totalXp += succeeded ? XP_TABLE.matSuccess : attempted ? XP_TABLE.matTested : 0
    }

    // Add XP to stats
    if (totalXp > 0) {
      const { data: stats } = await supabase
        .from('srs_stats')
        .select('total_xp, total_mat_tests')
        .eq('user_id', user.id)
        .single()

      if (stats) {
        const newXp = stats.total_xp + totalXp
        await supabase
          .from('srs_stats')
          .update({
            total_xp: newXp,
            level: Math.floor(newXp / 50) + 1,
            total_mat_tests: stats.total_mat_tests + entries.filter(([, s]) => s !== 'none').length,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
      }
    }

    onDone(totalXp)
  }

  function setStatus(cardId, status) {
    setFeedback(prev => ({ ...prev, [cardId]: status }))
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-dojo-muted text-center">
        As-tu teste ces techniques au training ?
      </p>

      {cards.map(card => {
        const catMeta = CATEGORY_META[card.category]
        const status = feedback[card.id] || 'none'

        return (
          <div key={card.id} className="bg-white rounded-xl border border-dojo-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${catMeta?.color || 'bg-gray-100 text-gray-700'}`}>
                {catMeta?.label}
              </span>
              <span className="text-xs font-medium text-dojo-text truncate">{card.position_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <FeedbackBtn
                label="Pas teste"
                xp="+0"
                active={status === 'none'}
                onClick={() => setStatus(card.id, 'none')}
                color="bg-gray-100 text-gray-600"
              />
              <FeedbackBtn
                label="Teste"
                xp="+5"
                active={status === 'tested'}
                onClick={() => setStatus(card.id, 'tested')}
                color="bg-blue-100 text-blue-700"
              />
              <FeedbackBtn
                label="Reussi"
                xp="+15"
                active={status === 'success'}
                onClick={() => setStatus(card.id, 'success')}
                color="bg-green-100 text-green-700"
              />
            </div>
          </div>
        )
      })}

      <button
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-dojo-accent text-white font-bold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
      >
        Enregistrer
      </button>
    </div>
  )
}

function FeedbackBtn({ label, xp, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-lg text-[10px] font-bold transition-all border-2 ${
        active ? `${color} border-current` : 'bg-dojo-surface text-dojo-muted border-transparent'
      }`}
    >
      {label}
      <br />
      <span className="opacity-70">{xp} XP</span>
    </button>
  )
}
