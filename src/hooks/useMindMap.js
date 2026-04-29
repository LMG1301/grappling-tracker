import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Action types qui ne participent pas au graphe (concepts rattaches
// a une position, pas des aretes).
const NON_EDGE_ACTIONS = new Set(['control', 'drill', 'principle'])

export function useMindMap() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [positions, setPositions] = useState([])
  const [techniques, setTechniques] = useState([])
  const [transitions, setTransitions] = useState([])
  const [combatLogs, setCombatLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [catRes, posRes, techRes, transRes, logRes] = await Promise.all([
      supabase.from('position_categories').select('*').order('sort_order'),
      supabase.from('positions').select('*').order('sort_order'),
      supabase.from('techniques').select('*').eq('user_id', user.id),
      supabase.from('technique_transitions').select('*'),
      supabase
        .from('combat_logs')
        .select('id, technique_id, position_id, attempted, succeeded, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(500),
    ])

    if (catRes.data) setCategories(catRes.data)
    if (posRes.data) setPositions(posRes.data)
    if (techRes.data) setTechniques(techRes.data)
    if (transRes.data) setTransitions(transRes.data)
    if (logRes.data) setCombatLogs(logRes.data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // --- Selecteurs ---

  const getPositionsByCategory = useCallback(
    (categoryId) => positions.filter((p) => p.category_id === categoryId),
    [positions]
  )

  const positionById = useCallback(
    (id) => positions.find((p) => p.id === id) || null,
    [positions]
  )

  const techniqueById = useCallback(
    (id) => techniques.find((t) => t.id === id) || null,
    [techniques]
  )

  const categoryById = useCallback(
    (id) => categories.find((c) => c.id === id) || null,
    [categories]
  )

  // Techniques dont la position de depart est positionId.
  // On utilise transitions pour les techniques-aretes, et un match
  // par nom/slug pour les techniques-concepts (control/drill/principle).
  const getTechniquesByPosition = useCallback(
    (positionId) => {
      const pos = positionById(positionId)
      if (!pos) return []
      // Aretes : via transitions
      const fromIds = new Set(
        transitions
          .filter((tr) => tr.from_position_id === positionId)
          .map((tr) => tr.technique_id)
      )
      const edgeTechs = techniques.filter((t) => fromIds.has(t.id))
      // Concepts : techniques.position match le slug ou le nom de la position
      const conceptTechs = techniques.filter(
        (t) =>
          NON_EDGE_ACTIONS.has(t.action_type) &&
          (t.position === pos.slug || t.position === pos.name)
      )
      return [...edgeTechs, ...conceptTechs]
    },
    [transitions, techniques, positionById]
  )

  const getTechniqueTransition = useCallback(
    (techniqueId) =>
      transitions.find((tr) => tr.technique_id === techniqueId) || null,
    [transitions]
  )

  const getTechniqueTarget = useCallback(
    (techniqueId) => {
      const tr = getTechniqueTransition(techniqueId)
      if (!tr) return { isTerminal: false, toPosition: null, hasTransition: false }
      const toPosition = tr.to_position_id ? positionById(tr.to_position_id) : null
      return {
        isTerminal: tr.is_terminal,
        toPosition,
        hasTransition: true,
        transitionId: tr.id,
      }
    },
    [getTechniqueTransition, positionById]
  )

  // Liste des techniques avec to_position_id NULL (et qui doivent en
  // avoir un — donc exclut submission, control/drill/principle).
  const getNullTransitions = useCallback(() => {
    return transitions
      .filter((tr) => !tr.is_terminal && !tr.to_position_id)
      .map((tr) => {
        const t = techniqueById(tr.technique_id)
        const fromPos = positionById(tr.from_position_id)
        return { transition: tr, technique: t, fromPosition: fromPos }
      })
      .filter((row) => row.technique && row.fromPosition)
  }, [transitions, techniqueById, positionById])

  // --- Stats agregees ---

  const positionStats = useCallback(
    (positionId) => {
      const techs = getTechniquesByPosition(positionId)
      const techIds = new Set(techs.map((t) => t.id))
      const logs = combatLogs.filter(
        (l) => techIds.has(l.technique_id) && l.attempted
      )
      const tested = logs.length
      const success = logs.filter((l) => l.succeeded).length
      const successRate = tested === 0 ? null : Math.round((success / tested) * 100)
      return { tested, success, successRate, techniquesCount: techs.length }
    },
    [getTechniquesByPosition, combatLogs]
  )

  // --- Mutations ---

  const updateTransition = useCallback(
    async ({ techniqueId, toPositionId = null, isTerminal = false }) => {
      const existing = transitions.find((tr) => tr.technique_id === techniqueId)
      if (existing) {
        const { error } = await supabase
          .from('technique_transitions')
          .update({
            to_position_id: isTerminal ? null : toPositionId,
            is_terminal: isTerminal,
          })
          .eq('id', existing.id)
        if (error) {
          console.error('updateTransition failed', error)
          return
        }
      } else {
        const t = techniqueById(techniqueId)
        const fromId = t
          ? positions.find((p) => p.slug === t.position || p.name === t.position)?.id
          : null
        if (!fromId) {
          console.error('updateTransition: cannot resolve from_position_id')
          return
        }
        const { error } = await supabase.from('technique_transitions').insert({
          technique_id: techniqueId,
          from_position_id: fromId,
          to_position_id: isTerminal ? null : toPositionId,
          is_terminal: isTerminal,
        })
        if (error) {
          console.error('updateTransition insert failed', error)
          return
        }
      }
      await loadAll()
    },
    [transitions, techniqueById, positions, user, loadAll]
  )

  function getImageUrl(path) {
    if (!path) return null
    const { data } = supabase.storage.from('technique-images').getPublicUrl(path)
    return data.publicUrl
  }

  // Upload + assignation d'une image custom a une position. Le fichier
  // est stocke dans le bucket "technique-images" sous le prefixe
  // "positions/" (les positions sont globales, pas de scope user).
  async function uploadPositionImage(positionId, file) {
    if (!user) throw new Error('Non authentifie')
    if (!file) throw new Error('Fichier manquant')
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `positions/${positionId}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('technique-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/png',
      })
    if (uploadErr) throw uploadErr

    const { error: updateErr } = await supabase
      .from('positions')
      .update({ image_path: path })
      .eq('id', positionId)
    if (updateErr) throw updateErr

    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? { ...p, image_path: path } : p))
    )
    return path
  }

  // Retire l'image custom (revient au fallback statique GrappleMap)
  async function clearPositionImage(positionId) {
    if (!user) throw new Error('Non authentifie')
    const pos = positions.find((p) => p.id === positionId)
    if (pos?.image_path) {
      // Best-effort : supprime le fichier du storage
      await supabase.storage.from('technique-images').remove([pos.image_path]).catch(() => {})
    }
    const { error } = await supabase
      .from('positions')
      .update({ image_path: null })
      .eq('id', positionId)
    if (error) throw error
    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? { ...p, image_path: null } : p))
    )
  }

  return {
    categories,
    positions,
    techniques,
    transitions,
    combatLogs,
    loading,
    // selectors
    getPositionsByCategory,
    getTechniquesByPosition,
    getTechniqueTarget,
    getNullTransitions,
    positionById,
    techniqueById,
    categoryById,
    positionStats,
    // mutations
    updateTransition,
    uploadPositionImage,
    clearPositionImage,
    getImageUrl,
    refresh: loadAll,
  }
}
