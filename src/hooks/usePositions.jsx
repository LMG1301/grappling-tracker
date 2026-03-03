import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { DEFAULT_POSITIONS } from '../config/constants'

export function usePositions() {
  const { user } = useAuth()
  const [customPositions, setCustomPositions] = useState([])

  const fetchPositions = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (error) {
      console.error('Error fetching positions:', error)
    } else {
      setCustomPositions(data || [])
    }
  }, [user])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  const addPosition = useCallback(async (name) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('positions')
      .insert({ name, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setCustomPositions((prev) => [...prev, data])
    return data
  }, [user])

  const allPositions = [
    ...DEFAULT_POSITIONS,
    ...customPositions.map((p) => p.name),
  ].sort()

  return { positions: allPositions, customPositions, addPosition, refresh: fetchPositions }
}
