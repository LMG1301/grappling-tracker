import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { ALL_EXERCISES } from '../lib/mobility/exercises'
import { getPhase, getHoldDuration } from '../lib/mobility/periodization'
import { updateStreak } from '../lib/mobility/streaks'

export function useMobilitySession(routineType, competitionWeek = 1) {
  const { user } = useAuth()
  const phase = getPhase(competitionWeek)

  const [sessionId, setSessionId] = useState(null)
  const [exercises, setExercises] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [streakResult, setStreakResult] = useState(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Initialize exercises from local data (fallback if Supabase not seeded)
  useEffect(() => {
    const rawExercises = ALL_EXERCISES[routineType] || []
    const prepared = rawExercises.map((ex, i) => ({
      ...ex,
      index: i,
      adjustedHoldSec: getHoldDuration(ex, phase),
      completed: false,
      skipped: false,
      sidesCompleted: ex.is_bilateral ? { left: false, right: false } : null,
      painLevel: null,
      romNote: '',
    }))
    setExercises(prepared)
    setCurrentIndex(0)
    setElapsedSec(0)
    setIsRunning(false)
    setIsComplete(false)
    setStreakResult(null)
  }, [routineType, phase])

  // Global timer
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedSec * 1000
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning])

  const startSession = useCallback(async () => {
    setIsRunning(true)
    if (!user) return

    const { data, error } = await supabase
      .from('mobility_sessions')
      .insert({
        user_id: user.id,
        routine_type: routineType,
        competition_week: competitionWeek,
        phase,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) setSessionId(data.id)
  }, [user, routineType, competitionWeek, phase])

  const completeExercise = useCallback((index, side) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== index) return ex
      if (ex.is_bilateral && side) {
        const newSides = { ...ex.sidesCompleted, [side]: true }
        const allDone = newSides.left && newSides.right
        return { ...ex, sidesCompleted: newSides, completed: allDone }
      }
      return { ...ex, completed: true }
    }))
  }, [])

  const skipExercise = useCallback((index) => {
    setExercises(prev => prev.map((ex, i) =>
      i === index ? { ...ex, skipped: true, completed: false } : ex
    ))
  }, [])

  const setPainLevel = useCallback((index, level) => {
    setExercises(prev => prev.map((ex, i) =>
      i === index ? { ...ex, painLevel: level } : ex
    ))
  }, [])

  const setRomNote = useCallback((index, note) => {
    setExercises(prev => prev.map((ex, i) =>
      i === index ? { ...ex, romNote: note } : ex
    ))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, exercises.length - 1))
  }, [exercises.length])

  const finishSession = useCallback(async () => {
    setIsRunning(false)
    clearInterval(timerRef.current)
    setIsComplete(true)

    if (!user || !sessionId) return

    // Save session entries
    const entries = exercises.map((ex, i) => ({
      session_id: sessionId,
      exercise_id: null, // Will be linked when Supabase is seeded
      exercise_order: i + 1,
      sets_completed: ex.completed ? ex.default_sets : 0,
      reps_or_hold: ex.default_reps || (ex.adjustedHoldSec ? `${ex.adjustedHoldSec}s` : null),
      side: ex.is_bilateral ? 'both' : null,
      completed: ex.completed,
      skipped: ex.skipped,
      pain_level: ex.painLevel,
      rom_note: ex.romNote || null,
    }))

    await supabase.from('mobility_session_entries').insert(entries)

    // Update session
    await supabase
      .from('mobility_sessions')
      .update({
        completed_at: new Date().toISOString(),
        total_duration_sec: elapsedSec,
      })
      .eq('id', sessionId)

    // Update streak
    try {
      const result = await updateStreak(user.id)
      setStreakResult(result)
    } catch (e) {
      console.error('Streak update failed:', e)
    }
  }, [user, sessionId, exercises, elapsedSec])

  const completedCount = exercises.filter(e => e.completed).length
  const skippedCount = exercises.filter(e => e.skipped).length

  return {
    exercises,
    currentIndex,
    setCurrentIndex,
    elapsedSec,
    isRunning,
    isComplete,
    phase,
    sessionId,
    streakResult,
    completedCount,
    skippedCount,
    startSession,
    completeExercise,
    skipExercise,
    setPainLevel,
    setRomNote,
    goToNext,
    finishSession,
  }
}
