import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useJournal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
    if (error) {
      console.error('Error fetching journal:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const addEntry = useCallback(async (entry) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ ...entry, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => [data, ...prev])
    return data
  }, [user])

  const updateEntry = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }, [])

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (error) throw error
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh: fetchEntries }
}
