import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { getSrsStatus } from '../config/constants'

export function useSrsDeck() {
  const { user } = useAuth()
  const [dueCards, setDueCards] = useState([])
  const [allSrsCards, setAllSrsCards] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCards = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch techniques with SRS active and due for review
      const { data: due } = await supabase
        .from('techniques')
        .select('*')
        .eq('user_id', user.id)
        .eq('srs_active', true)
        .or(`next_review.is.null,next_review.lte.${today}`)
        .order('next_review', { ascending: true })

      // Fetch all SRS-active techniques
      const { data: all } = await supabase
        .from('techniques')
        .select('*')
        .eq('user_id', user.id)
        .eq('srs_active', true)
        .order('created_at', { ascending: false })

      setDueCards(due || [])
      setAllSrsCards(all || [])
    } catch (e) {
      console.error('Failed to load SRS deck:', e)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadCards() }, [loadCards])

  const cardCounts = {
    new: allSrsCards.filter(c => getSrsStatus(c) === 'new').length,
    learning: allSrsCards.filter(c => getSrsStatus(c) === 'learning').length,
    mastered: allSrsCards.filter(c => getSrsStatus(c) === 'mastered').length,
    total: allSrsCards.length,
    due: dueCards.length,
  }

  return {
    dueCards,
    allSrsCards,
    cardCounts,
    loading,
    reload: loadCards,
  }
}
