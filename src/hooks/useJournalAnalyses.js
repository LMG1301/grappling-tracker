import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useJournalAnalyses() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAnalyses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('journal_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching journal analyses:', error)
    } else {
      setAnalyses(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  // Lance l'analyse cote serveur, puis sauvegarde le resultat dans Supabase.
  const analyzeEntries = useCallback(
    async (entries) => {
      if (!user) throw new Error('Non authentifie')
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Selection vide')
      }

      // 1. Appel a la fonction serverless Vercel
      const payload = entries.map((e) => ({
        date: e.entry_date,
        content: [e.title ? `Titre: ${e.title}` : '', e.content].filter(Boolean).join('\n'),
      }))

      const res = await fetch('/api/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: payload }),
      })

      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const j = await res.json()
          if (j?.error) detail = j.error
        } catch {
          // pas de JSON, on garde le statut HTTP
        }
        throw new Error(detail)
      }

      const data = await res.json()

      // 2. Sauvegarde dans Supabase
      const sortedDates = entries
        .map((e) => e.entry_date)
        .filter(Boolean)
        .sort()
      const dateStart = sortedDates[0] || null
      const dateEnd = sortedDates[sortedDates.length - 1] || null

      const { data: inserted, error } = await supabase
        .from('journal_analyses')
        .insert({
          user_id: user.id,
          entry_ids: entries.map((e) => e.id),
          entry_count: entries.length,
          date_range_start: dateStart,
          date_range_end: dateEnd,
          synthesis: data.synthesis,
          model_used: data.model || 'claude-opus-4-7',
          tokens_used: data.tokens || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save analysis', error)
        // On retourne quand meme la synthese pour l'afficher
        return {
          synthesis: data.synthesis,
          model_used: data.model,
          tokens_used: data.tokens,
          entry_count: entries.length,
          date_range_start: dateStart,
          date_range_end: dateEnd,
          created_at: new Date().toISOString(),
          _saveError: error.message,
        }
      }

      setAnalyses((prev) => [inserted, ...prev])
      return inserted
    },
    [user]
  )

  const deleteAnalysis = useCallback(async (id) => {
    const { error } = await supabase.from('journal_analyses').delete().eq('id', id)
    if (error) throw error
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return {
    analyses,
    loading,
    analyzeEntries,
    deleteAnalysis,
    refresh: fetchAnalyses,
  }
}
