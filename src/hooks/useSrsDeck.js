import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { fetchDueCards, fetchAllCards, createCard, toggleCardActive, seedStarterDeck, getCardStatus } from '../lib/srs/deck'
import { STARTER_DECK } from '../lib/srs/starter-deck'

export function useSrsDeck() {
  const { user } = useAuth()
  const [dueCards, setDueCards] = useState([])
  const [allCards, setAllCards] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCards = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [due, all] = await Promise.all([
        fetchDueCards(user.id),
        fetchAllCards(user.id),
      ])
      setDueCards(due)
      setAllCards(all)

      // Auto-seed starter deck if no cards
      if (all.length === 0) {
        await seedStarterDeck(user.id, STARTER_DECK)
        const [newDue, newAll] = await Promise.all([
          fetchDueCards(user.id),
          fetchAllCards(user.id),
        ])
        setDueCards(newDue)
        setAllCards(newAll)
      }
    } catch (e) {
      console.error('Failed to load SRS deck:', e)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadCards() }, [loadCards])

  const addCard = useCallback(async (cardData) => {
    if (!user) return
    await createCard(user.id, cardData)
    await loadCards()
  }, [user, loadCards])

  const toggleActive = useCallback(async (cardId, isActive) => {
    await toggleCardActive(cardId, isActive)
    await loadCards()
  }, [loadCards])

  const cardCounts = {
    new: allCards.filter(c => getCardStatus(c) === 'new').length,
    learning: allCards.filter(c => getCardStatus(c) === 'learning').length,
    mastered: allCards.filter(c => getCardStatus(c) === 'mastered').length,
    total: allCards.length,
    due: dueCards.length,
  }

  return {
    dueCards,
    allCards,
    cardCounts,
    loading,
    addCard,
    toggleActive,
    reload: loadCards,
  }
}
