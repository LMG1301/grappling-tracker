import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getLevel, getLevelProgress } from '../lib/srs/xp'

export function useSrsStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('srs_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setStats(data)
      setLoading(false)
    }

    load()
  }, [user])

  const level = stats ? getLevel(stats.total_xp) : 1
  const progress = stats ? getLevelProgress(stats.total_xp) : { current: 0, needed: 50, percent: 0 }

  return { stats, level, progress, loading }
}
