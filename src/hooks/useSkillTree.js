import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSkillTree() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [positions, setPositions] = useState([])
  const [library, setLibrary] = useState([])
  const [combatLogs, setCombatLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [catRes, posRes, libRes, logRes] = await Promise.all([
      supabase.from('position_categories').select('*').order('sort_order'),
      supabase.from('positions').select('*').order('sort_order'),
      supabase
        .from('position_library')
        .select('id, position_id, technique_id, slot, technique:techniques(*)')
        .eq('user_id', user.id),
      supabase
        .from('combat_logs')
        .select('id, technique_id, position_id, attempted, succeeded, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(500),
    ])

    if (catRes.data) setCategories(catRes.data)
    if (posRes.data) setPositions(posRes.data)
    if (libRes.data) setLibrary(libRes.data)
    if (logRes.data) setCombatLogs(logRes.data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Lissage bayesien : a priori neutre 50%, equivalent a 10 essais virtuels
  const PRIOR_SUCCESS = 5
  const PRIOR_FAILURE = 5

  const positionStats = useCallback((positionId) => {
    const logs = combatLogs.filter((l) => l.position_id === positionId && l.attempted)
    const tested = logs.length
    const success = logs.filter((l) => l.succeeded).length

    const successRate =
      tested === 0
        ? null
        : Math.round(
            ((success + PRIOR_SUCCESS) / (tested + PRIOR_SUCCESS + PRIOR_FAILURE)) * 100
          )

    const techniquesCount = library.filter((l) => l.position_id === positionId).length
    return { tested, success, successRate, techniquesCount }
  }, [combatLogs, library])

  const categoryStats = useCallback((categoryId) => {
    const positionsInCat = positions.filter((p) => p.category_id === categoryId)
    let totalTested = 0
    let totalSuccess = 0
    let totalTechniques = 0
    let positionsWithContent = 0

    positionsInCat.forEach((p) => {
      const stats = positionStats(p.id)
      totalTested += stats.tested
      totalSuccess += stats.success
      totalTechniques += stats.techniquesCount
      if (stats.techniquesCount > 0) positionsWithContent += 1
    })

    const successRate =
      totalTested === 0
        ? null
        : Math.round(
            ((totalSuccess + PRIOR_SUCCESS) / (totalTested + PRIOR_SUCCESS + PRIOR_FAILURE)) * 100
          )

    return {
      successRate,
      totalTested,
      totalSuccess,
      totalTechniques,
      positionsCount: positionsInCat.length,
      positionsWithContent,
    }
  }, [positions, positionStats])

  async function logCombat({ techniqueId, positionId, succeeded, context = 'sparring', notes = null }) {
    if (!user) return
    const { error } = await supabase.from('combat_logs').insert({
      user_id: user.id,
      technique_id: techniqueId,
      position_id: positionId,
      attempted: true,
      succeeded: !!succeeded,
      context,
      notes,
    })
    if (error) {
      console.error('logCombat failed', error)
      return
    }
    const { data: tech } = await supabase
      .from('techniques')
      .select('mat_tested, mat_success')
      .eq('id', techniqueId)
      .single()
    if (tech) {
      await supabase
        .from('techniques')
        .update({
          mat_tested: (tech.mat_tested || 0) + 1,
          mat_success: (tech.mat_success || 0) + (succeeded ? 1 : 0),
        })
        .eq('id', techniqueId)
    }
    await loadAll()
  }

  async function swapSlot({ positionId, fromTechniqueId, toTechniqueId }) {
    if (!user) return
    const fromEntry = library.find(
      (l) => l.position_id === positionId && l.technique_id === fromTechniqueId
    )
    const toEntry = library.find(
      (l) => l.position_id === positionId && l.technique_id === toTechniqueId
    )
    if (!fromEntry || !toEntry) return

    const fromSlot = fromEntry.slot
    await supabase.from('position_library').update({ slot: null }).eq('id', fromEntry.id)
    await supabase.from('position_library').update({ slot: fromSlot }).eq('id', toEntry.id)

    await loadAll()
  }

  function getImageUrl(path) {
    if (!path) return null
    const { data } = supabase.storage.from('technique-images').getPublicUrl(path)
    return data.publicUrl
  }

  return {
    categories,
    positions,
    library,
    combatLogs,
    loading,
    positionStats,
    categoryStats,
    logCombat,
    swapSlot,
    getImageUrl,
    refresh: loadAll,
  }
}
