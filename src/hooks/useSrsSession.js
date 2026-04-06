import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { sm2, previewIntervals } from '../lib/srs/sm2'
import { calculateSessionXp, XP_TABLE } from '../lib/srs/xp'

export function useSrsSession(dueCards) {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [ratings, setRatings] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Initialize with due cards
  useEffect(() => {
    if (dueCards && dueCards.length > 0) {
      setCards([...dueCards])
      setCurrentIndex(0)
      setIsFlipped(false)
      setRatings([])
      setIsComplete(false)
    }
  }, [dueCards])

  // Timer
  useEffect(() => {
    if (cards.length > 0 && !isComplete) {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [cards.length, isComplete])

  const currentCard = cards[currentIndex] || null
  const intervals = currentCard ? previewIntervals(currentCard) : null

  const flip = useCallback(() => setIsFlipped(true), [])

  const rate = useCallback(async (rating) => {
    if (!currentCard) return

    const srsUpdate = sm2(currentCard, rating)
    const wasCorrect = rating >= 3

    // Save to Supabase
    if (user) {
      await supabase
        .from('srs_cards')
        .update({
          ...srsUpdate,
          times_reviewed: currentCard.times_reviewed + 1,
          times_correct: currentCard.times_correct + (wasCorrect ? 1 : 0),
        })
        .eq('id', currentCard.id)
    }

    // If "Again", re-add card to end of queue
    if (rating === 1) {
      setCards(prev => [...prev, { ...currentCard, ...srsUpdate }])
    }

    setRatings(prev => [...prev, rating])

    // Next card or finish
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else {
      clearInterval(timerRef.current)
      setIsComplete(true)
      await saveSession([...ratings, rating])
    }
  }, [currentCard, currentIndex, cards.length, ratings, user])

  const saveSession = useCallback(async (allRatings) => {
    if (!user) return

    const xpEarned = calculateSessionXp(allRatings)
    const cardsCorrect = allRatings.filter(r => r >= 3).length
    const cardsAgain = allRatings.filter(r => r === 1).length

    const { data } = await supabase
      .from('srs_sessions')
      .insert({
        user_id: user.id,
        cards_reviewed: allRatings.length,
        cards_correct: cardsCorrect,
        cards_again: cardsAgain,
        xp_earned: xpEarned,
        duration_sec: elapsedSec,
      })
      .select()
      .single()

    if (data) setSessionId(data.id)

    // Update stats
    await updateStats(user.id, xpEarned, allRatings.length)
  }, [user, elapsedSec])

  return {
    currentCard,
    currentIndex,
    totalCards: cards.length,
    isFlipped,
    isComplete,
    ratings,
    intervals,
    elapsedSec,
    sessionId,
    flip,
    rate,
  }
}

async function updateStats(userId, xpEarned, reviewCount) {
  const today = new Date().toISOString().split('T')[0]

  let { data: stats } = await supabase
    .from('srs_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!stats) {
    await supabase.from('srs_stats').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      total_xp: xpEarned,
      level: 1,
      total_reviews: reviewCount,
      last_review_date: today,
    })
    return
  }

  const lastDate = stats.last_review_date
  const diffDays = lastDate
    ? Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24))
    : 999

  let newStreak = diffDays === 1 ? stats.current_streak + 1 : diffDays === 0 ? stats.current_streak : 1
  const streakXp = diffDays === 1 ? XP_TABLE.streakDay * newStreak : 0
  const totalXp = stats.total_xp + xpEarned + streakXp

  await supabase
    .from('srs_stats')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, stats.longest_streak),
      total_xp: totalXp,
      level: Math.floor(totalXp / 50) + 1,
      total_reviews: stats.total_reviews + reviewCount,
      last_review_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}
