import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Info,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  X,
  Wrench,
} from 'lucide-react'
import { useMindMap } from '../../hooks/useMindMap'
import TechniqueDetail from '../TechniqueDetail'

// IDs composites pour le set des noeuds deplies
const catKey = (id) => `cat:${id}`
const posKey = (id) => `pos:${id}`
const techKey = (id) => `tech:${id}`

// =====================================================================
// Helpers visuels
// =====================================================================

function actionTypeIcon(type) {
  const map = {
    submission: '🔒',
    sweep: '↻',
    pass: '→',
    escape: '↗',
    transition: '⇄',
    takedown: '↧',
    control: '◉',
    drill: '⚙',
    principle: '✦',
    defense: '⛨',
  }
  return map[type] || '•'
}

function PositionImage({ slug, className = '' }) {
  const [errored, setErrored] = useState(false)
  if (!slug || errored) {
    return (
      <div className={`flex items-center justify-center bg-dojo-bg text-dojo-muted ${className}`}>
        <HelpCircle className="w-6 h-6 opacity-40" />
      </div>
    )
  }
  return (
    <img
      src={`/images/positions/${slug}.png`}
      alt=""
      onError={() => setErrored(true)}
      className={`w-full h-full object-contain ${className}`}
    />
  )
}

// =====================================================================
// Position detail modal
// =====================================================================

function PositionDetailModal({ position, category, techniques, onClose, onOpenTechnique }) {
  const color = category?.color_hex || '#6b7280'
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-dojo-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
              {category?.name}
            </div>
            <h2 className="text-lg font-semibold truncate">{position.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="aspect-[4/3] rounded-xl border border-dojo-border overflow-hidden">
            <PositionImage slug={position.slug} className="w-full h-full" />
          </div>
          {position.description && (
            <p className="text-sm text-dojo-text leading-relaxed">{position.description}</p>
          )}
          <div>
            <h3 className="text-sm font-medium text-dojo-muted mb-2">
              Techniques rattachees ({techniques.length})
            </h3>
            <div className="space-y-1">
              {techniques.length === 0 ? (
                <p className="text-xs text-dojo-muted italic">Aucune technique pour le moment.</p>
              ) : (
                techniques.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTechnique(t)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-dojo-card border border-dojo-border hover:bg-dojo-bg flex items-center gap-2"
                  >
                    <span className="text-sm">{actionTypeIcon(t.action_type)}</span>
                    <span className="text-sm font-medium text-dojo-text flex-1">{t.name}</span>
                    <span className="text-[10px] uppercase text-dojo-muted">{t.action_type}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// Complete graph view (validation des transitions NULL)
// =====================================================================

function CompleteGraphView({ rows, positions, onUpdate, onClose }) {
  // Etat local : { [transitionId]: { toPositionId, isTerminal } }
  const [drafts, setDrafts] = useState({})

  function setDraft(trId, patch) {
    setDrafts((prev) => ({ ...prev, [trId]: { ...(prev[trId] || {}), ...patch } }))
  }

  async function handleSave(row) {
    const draft = drafts[row.transition.id] || {}
    if (draft.isTerminal) {
      await onUpdate({ techniqueId: row.technique.id, isTerminal: true })
    } else if (draft.toPositionId) {
      await onUpdate({
        techniqueId: row.technique.id,
        toPositionId: draft.toPositionId,
        isTerminal: false,
      })
    }
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[row.transition.id]
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-dojo-surface w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-dojo-text">Completer le graphe</h2>
            <p className="text-xs text-dojo-muted">
              {rows.length} technique{rows.length > 1 ? 's' : ''} sans position d&apos;arrivee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-sm text-dojo-muted">
              Toutes les transitions sont definies. Bravo.
            </div>
          ) : (
            rows.map((row) => {
              const draft = drafts[row.transition.id] || {}
              const canSave = !!(draft.isTerminal || draft.toPositionId)
              return (
                <div
                  key={row.transition.id}
                  className="bg-dojo-card border border-dojo-border rounded-xl p-3 space-y-2"
                >
                  <div>
                    <div className="text-sm font-bold text-dojo-text">{row.technique.name}</div>
                    <div className="text-[11px] text-dojo-muted">
                      {actionTypeIcon(row.technique.action_type)} {row.technique.action_type} · depuis{' '}
                      <span className="font-semibold">{row.fromPosition.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <select
                      value={draft.toPositionId || ''}
                      disabled={draft.isTerminal}
                      onChange={(e) =>
                        setDraft(row.transition.id, {
                          toPositionId: e.target.value || null,
                          isTerminal: false,
                        })
                      }
                      className="bg-dojo-bg border border-dojo-border rounded-lg px-2 py-1.5 text-sm text-dojo-text"
                    >
                      <option value="">Position d&apos;arrivee...</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-dojo-text">
                      <input
                        type="checkbox"
                        checked={!!draft.isTerminal}
                        onChange={(e) =>
                          setDraft(row.transition.id, {
                            isTerminal: e.target.checked,
                            toPositionId: e.target.checked ? null : draft.toPositionId,
                          })
                        }
                      />
                      Terminale
                    </label>
                    <button
                      onClick={() => handleSave(row)}
                      disabled={!canSave}
                      className="px-3 py-1.5 rounded-lg bg-dojo-accent text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed border-none"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// Tree node (recursif)
// =====================================================================

function TreeChevron({ open, color }) {
  return (
    <motion.span
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center justify-center"
      style={{ color }}
    >
      <ChevronRight className="w-4 h-4" />
    </motion.span>
  )
}

// =====================================================================
// Composant principal
// =====================================================================

export default function MindMapPage() {
  const mind = useMindMap()
  const {
    categories,
    positions,
    loading,
    getPositionsByCategory,
    getTechniquesByPosition,
    getTechniqueTarget,
    getNullTransitions,
    positionById,
    categoryById,
    positionStats,
    updateTransition,
    getImageUrl,
  } = mind

  const [expanded, setExpanded] = useState(() => new Set())
  const [pulsedId, setPulsedId] = useState(null)
  const [openTechnique, setOpenTechnique] = useState(null)
  const [openPosition, setOpenPosition] = useState(null)
  const [showCompleteGraph, setShowCompleteGraph] = useState(false)
  const containerRef = useRef(null)
  const positionRefs = useRef(new Map())

  const nullRows = useMemo(() => getNullTransitions(), [getNullTransitions])

  const toggle = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const navigateToPosition = useCallback(
    (positionId) => {
      const pos = positionById(positionId)
      if (!pos) return
      // Reset puis ouvre le chemin : categorie -> position
      const next = new Set([catKey(pos.category_id), posKey(pos.id)])
      setExpanded(next)
      setPulsedId(positionId)
      // Scroll apres le tick suivant pour que le DOM ait deplie
      setTimeout(() => {
        const el = positionRefs.current.get(positionId)
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 80)
      // Le pulse dure 1.5s
      setTimeout(() => setPulsedId(null), 1500)
    },
    [positionById]
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-dojo-border bg-dojo-surface flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-dojo-text">Mindmap</h1>
            <p className="text-[11px] text-dojo-muted">
              {categories.length} categories · {positions.length} positions
            </p>
          </div>
          {nullRows.length > 0 && (
            <button
              onClick={() => setShowCompleteGraph(true)}
              className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 text-xs font-bold flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Completer ({nullRows.length})
            </button>
          )}
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto p-4 space-y-3">
          {categories.map((cat) => {
            const catOpen = expanded.has(catKey(cat.id))
            const catPositions = getPositionsByCategory(cat.id)
            const color = cat.color_hex
            return (
              <div
                key={cat.id}
                className="bg-dojo-card border-2 rounded-xl overflow-hidden"
                style={{ borderColor: color }}
              >
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => toggle(catKey(cat.id))}
                    className="flex-1 flex items-center gap-2 bg-transparent border-none text-left p-0"
                  >
                    <TreeChevron open={catOpen} color={color} />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-dojo-text">{cat.name}</div>
                      <div className="text-[10px] text-dojo-muted">
                        {catPositions.length} positions
                      </div>
                    </div>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {catOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="border-l-2 ml-4 pl-3 py-1 space-y-1.5 mb-2"
                        style={{ borderColor: color }}
                      >
                        {catPositions.length === 0 ? (
                          <p className="text-xs text-dojo-muted italic px-2">
                            Aucune position dans cette categorie.
                          </p>
                        ) : (
                          catPositions.map((pos) => (
                            <PositionNode
                              key={pos.id}
                              position={pos}
                              category={cat}
                              expanded={expanded}
                              onToggle={toggle}
                              onOpenInfo={() => setOpenPosition(pos.id)}
                              onOpenTechnique={(t) => setOpenTechnique(t)}
                              onNavigate={navigateToPosition}
                              getTechniquesByPosition={getTechniquesByPosition}
                              getTechniqueTarget={getTechniqueTarget}
                              positionStats={positionStats}
                              pulsed={pulsedId === pos.id}
                              registerRef={(el) => {
                                if (el) positionRefs.current.set(pos.id, el)
                                else positionRefs.current.delete(pos.id)
                              }}
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {openTechnique && (
        <TechniqueDetail
          technique={openTechnique}
          imageUrl={getImageUrl(openTechnique.image_path)}
          onClose={() => setOpenTechnique(null)}
        />
      )}

      {openPosition && (
        <PositionDetailModal
          position={positionById(openPosition)}
          category={categoryById(positionById(openPosition)?.category_id)}
          techniques={getTechniquesByPosition(openPosition)}
          onClose={() => setOpenPosition(null)}
          onOpenTechnique={(t) => {
            setOpenPosition(null)
            setOpenTechnique(t)
          }}
        />
      )}

      {showCompleteGraph && (
        <CompleteGraphView
          rows={nullRows}
          positions={positions}
          onUpdate={updateTransition}
          onClose={() => setShowCompleteGraph(false)}
        />
      )}
    </>
  )
}

function PositionNode({
  position,
  category,
  expanded,
  onToggle,
  onOpenInfo,
  onOpenTechnique,
  onNavigate,
  getTechniquesByPosition,
  getTechniqueTarget,
  positionStats,
  pulsed,
  registerRef,
}) {
  const open = expanded.has(posKey(position.id))
  const techs = getTechniquesByPosition(position.id)
  const stats = positionStats(position.id)
  const color = category.color_hex

  return (
    <div ref={registerRef}>
      <motion.div
        animate={
          pulsed
            ? {
                backgroundColor: [
                  'rgba(0,0,0,0)',
                  `${color}33`,
                  `${color}22`,
                  'rgba(0,0,0,0)',
                ],
              }
            : { backgroundColor: 'rgba(0,0,0,0)' }
        }
        transition={{ duration: 1.5 }}
        className="rounded-lg"
      >
        <div className="flex items-center gap-2 p-2">
          <button
            onClick={() => onToggle(posKey(position.id))}
            className="flex-1 flex items-center gap-2 bg-transparent border-none text-left p-0 min-w-0"
          >
            <TreeChevron open={open} color={color} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-dojo-text leading-tight truncate">
                {position.name}
              </div>
              <div className="text-[10px] text-dojo-muted">
                {stats.techniquesCount} tech{stats.techniquesCount > 1 ? 's' : ''}
                {stats.tested > 0 && ` · ${stats.tested} essais`}
              </div>
            </div>
          </button>
          <button
            onClick={onOpenInfo}
            className="p-1.5 rounded-md hover:bg-dojo-bg bg-transparent border-none text-dojo-muted"
            title="Voir la fiche position"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="border-l-2 ml-4 pl-3 py-1 space-y-1"
              style={{ borderColor: color }}
            >
              {techs.length === 0 ? (
                <p className="text-xs text-dojo-muted italic px-2">
                  Aucune technique pour le moment.
                </p>
              ) : (
                techs.map((t) => (
                  <TechniqueNode
                    key={t.id}
                    technique={t}
                    color={color}
                    target={getTechniqueTarget(t.id)}
                    onOpenInfo={() => onOpenTechnique(t)}
                    onNavigate={onNavigate}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TechniqueNode({ technique, color, target, onOpenInfo, onNavigate }) {
  return (
    <div className="bg-dojo-bg/50 border border-dojo-border rounded-lg p-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">{actionTypeIcon(technique.action_type)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-dojo-text leading-tight truncate">
            {technique.name}
          </div>
        </div>
        <button
          onClick={onOpenInfo}
          className="p-1 rounded-md hover:bg-dojo-card bg-transparent border-none text-dojo-muted"
          title="Voir la fiche technique"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="ml-5 mt-1">
        {target.isTerminal ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <CheckCircle className="w-3 h-3" />
            END
          </span>
        ) : target.toPosition ? (
          <button
            onClick={() => onNavigate(target.toPosition.id)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-dojo-text hover:underline bg-transparent border-none p-0"
            style={{ color }}
          >
            <ArrowRight className="w-3 h-3" />
            voir {target.toPosition.name}
          </button>
        ) : target.hasTransition ? (
          <span className="text-[10px] italic text-amber-600">
            Position d&apos;arrivee a definir
          </span>
        ) : null}
      </div>
    </div>
  )
}
