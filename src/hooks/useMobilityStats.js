import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { fetchStreak } from '../lib/mobility/streaks'

export function useMobilityStats() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      try {
        const [streakData, sessionsData] = await Promise.all([
          fetchStreak(user.id),
          fetchSessions(user.id),
        ])
        setStreak(streakData)
        setSessions(sessionsData || [])
      } catch (e) {
        console.error('Failed to load mobility stats:', e)
      }
      setLoading(false)
    }

    load()
  }, [user])

  return { streak, sessions, loading }
}

async function fetchSessions(userId) {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data, error } = await supabase
    .from('mobility_sessions')
    .select('id, session_date, routine_type, completed_at, total_duration_sec')
    .eq('user_id', userId)
    .gte('session_date', threeMonthsAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })

  if (error) throw error
  return data
}

export function buildHeatmapData(sessions) {
  const map = {}
  for (const s of sessions) {
    if (!map[s.session_date]) {
      map[s.session_date] = { date: s.session_date, types: [], completed: false }
    }
    map[s.session_date].types.push(s.routine_type)
    if (s.completed_at) map[s.session_date].completed = true
  }
  return map
}

export function getWeeklyBreakdown(sessions) {
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - ((thisWeekStart.getDay() + 6) % 7))
  const mondayStr = thisWeekStart.toISOString().split('T')[0]

  const weekSessions = sessions.filter(s => s.session_date >= mondayStr && s.completed_at)
  return {
    pre: weekSessions.filter(s => s.routine_type === 'pre').length,
    post: weekSessions.filter(s => s.routine_type === 'post').length,
    morning: weekSessions.filter(s => s.routine_type === 'morning').length,
    total: weekSessions.length,
  }
}
