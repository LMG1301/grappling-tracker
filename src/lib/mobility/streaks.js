import { supabase } from '../supabase'

export async function fetchStreak(userId) {
  const { data, error } = await supabase
    .from('mobility_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0]

  // Get current streak record
  let { data: streak } = await supabase
    .from('mobility_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) {
    // Create initial streak
    const { data, error } = await supabase
      .from('mobility_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        total_sessions: 1,
        last_session_date: today,
      })
      .select()
      .single()
    if (error) throw error
    return { ...data, isNewRecord: true }
  }

  // Already counted today
  if (streak.last_session_date === today) {
    return { ...streak, isNewRecord: false }
  }

  const lastDate = new Date(streak.last_session_date)
  const todayDate = new Date(today)
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))

  let newStreak = diffDays === 1 ? streak.current_streak + 1 : 1
  const newLongest = Math.max(newStreak, streak.longest_streak)
  const isNewRecord = newStreak > streak.longest_streak

  const { data, error } = await supabase
    .from('mobility_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      total_sessions: streak.total_sessions + 1,
      last_session_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return { ...data, isNewRecord }
}

export async function fetchWeeklyCompletion(userId) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const mondayStr = monday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('mobility_sessions')
    .select('routine_type, completed_at')
    .eq('user_id', userId)
    .gte('session_date', mondayStr)
    .not('completed_at', 'is', null)

  if (error) throw error
  return data || []
}
