import { supabase } from '../supabase'

export async function fetchDueCards(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_review', today)
    .order('next_review', { ascending: true })

  if (error) throw error
  return data || []
}

export async function fetchAllCards(userId) {
  const { data, error } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateCardAfterReview(cardId, srsUpdate, wasCorrect) {
  const { error } = await supabase
    .from('srs_cards')
    .update({
      ...srsUpdate,
      times_reviewed: supabase.rpc ? undefined : undefined, // handled below
    })
    .eq('id', cardId)

  if (error) throw error

  // Increment counters via raw update
  await supabase.rpc('increment_srs_review', { card_id: cardId, correct: wasCorrect })
    .catch(() => {
      // Fallback: manual update if RPC not available
      return supabase
        .from('srs_cards')
        .update({
          ...srsUpdate,
          times_reviewed: supabase.sql`times_reviewed + 1`,
        })
        .eq('id', cardId)
    })
}

export async function createCard(userId, cardData) {
  const { data, error } = await supabase
    .from('srs_cards')
    .insert({ ...cardData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleCardActive(cardId, isActive) {
  const { error } = await supabase
    .from('srs_cards')
    .update({ is_active: isActive })
    .eq('id', cardId)

  if (error) throw error
}

export async function seedStarterDeck(userId, starterCards) {
  const cards = starterCards.map(c => ({ ...c, user_id: userId, source: 'starter' }))
  const { error } = await supabase.from('srs_cards').insert(cards)
  if (error) throw error
}

export function getCardStatus(card) {
  if (card.repetitions === 0 && card.interval_days === 0) return 'new'
  if (card.interval_days < 21) return 'learning'
  return 'mastered'
}

export const CATEGORY_META = {
  guard_retention: { label: 'Guard Retention', color: 'bg-blue-100 text-blue-700' },
  escapes: { label: 'Escapes', color: 'bg-red-100 text-red-700' },
  half_guard_bottom: { label: 'Half Guard Bottom', color: 'bg-purple-100 text-purple-700' },
  mount_top: { label: 'Mount Top', color: 'bg-green-100 text-green-700' },
  side_control_top: { label: 'Side Control Top', color: 'bg-emerald-100 text-emerald-700' },
  back_control: { label: 'Back Control', color: 'bg-amber-100 text-amber-700' },
  standing: { label: 'Standing', color: 'bg-orange-100 text-orange-700' },
  submissions: { label: 'Submissions', color: 'bg-rose-100 text-rose-700' },
  turtle: { label: 'Turtle', color: 'bg-teal-100 text-teal-700' },
}
