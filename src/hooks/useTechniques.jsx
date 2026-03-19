import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTechniques() {
  const { user } = useAuth()
  const [techniques, setTechniques] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTechniques = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('techniques')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching techniques:', error)
    } else {
      setTechniques(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTechniques()
  }, [fetchTechniques])

  const addTechnique = useCallback(async (technique) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('techniques')
      .insert({ ...technique, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setTechniques((prev) => [data, ...prev])
    return data
  }, [user])

  const updateTechnique = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('techniques')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setTechniques((prev) => prev.map((t) => (t.id === id ? data : t)))
    return data
  }, [])

  const deleteTechnique = useCallback(async (id) => {
    const technique = techniques.find((t) => t.id === id)
    if (technique?.image_path) {
      await supabase.storage.from('technique-images').remove([technique.image_path])
    }
    const { error } = await supabase.from('techniques').delete().eq('id', id)
    if (error) throw error
    setTechniques((prev) => prev.filter((t) => t.id !== id))
  }, [techniques])

  const uploadImage = useCallback(async (file) => {
    if (!user) return null
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('technique-images')
      .upload(path, file)
    if (error) throw error
    return path
  }, [user])

  const getImageUrl = useCallback((path) => {
    if (!path) return null
    const { data } = supabase.storage
      .from('technique-images')
      .getPublicUrl(path)
    return data.publicUrl
  }, [])

  // Technique links
  const fetchLinks = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('technique_links')
      .select('*')
      .eq('user_id', user.id)
    if (error) {
      console.error('Error fetching links:', error)
      return []
    }
    return data || []
  }, [user])

  const addLink = useCallback(async (sourceId, targetId) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('technique_links')
      .insert({ user_id: user.id, source_id: sourceId, target_id: targetId })
      .select()
      .single()
    if (error) throw error
    return data
  }, [user])

  const deleteLink = useCallback(async (id) => {
    const { error } = await supabase.from('technique_links').delete().eq('id', id)
    if (error) throw error
  }, [])

  return {
    techniques,
    loading,
    addTechnique,
    updateTechnique,
    deleteTechnique,
    uploadImage,
    getImageUrl,
    fetchLinks,
    addLink,
    deleteLink,
    refresh: fetchTechniques,
  }
}
