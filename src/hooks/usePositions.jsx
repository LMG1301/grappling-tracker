import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { DEFAULT_POSITIONS } from '../config/constants'

// Les positions sont desormais globales (table partagee, pas de
// user_id) - cf migration-mindmap.sql et le module Skill Tree/Mindmap.
// On garde la signature du hook pour ne pas casser les appelants
// existants (TechniqueForm, Layout, etc.).

export function usePositions() {
  const { user } = useAuth()
  const [customPositions, setCustomPositions] = useState([])

  const fetchPositions = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('Error fetching positions:', error)
    } else {
      setCustomPositions(data || [])
    }
  }, [user])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Conserve pour compatibilite avec TechniqueForm. Les positions
  // sont globales : on n'ajoute plus de positions par utilisateur.
  const addPosition = useCallback(async () => null, [])

  const allPositions = [
    ...DEFAULT_POSITIONS,
    ...customPositions.map((p) => p.name),
  ]
    .filter((name, idx, arr) => arr.indexOf(name) === idx) // dedupe
    .sort()

  return { positions: allPositions, customPositions, addPosition, refresh: fetchPositions }
}
