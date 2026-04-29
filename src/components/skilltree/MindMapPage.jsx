import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position as HandlePosition,
  useReactFlow,
} from '@xyflow/react'
import { motion } from 'framer-motion'
import {
  Info,
  CheckCircle,
  ArrowRight,
  X,
  Wrench,
  HelpCircle,
  Maximize2,
  Upload,
  Trash2,
} from 'lucide-react'
import { useMindMap } from '../../hooks/useMindMap'
import TechniqueDetail from '../TechniqueDetail'

// =====================================================================
// Constantes & helpers
// =====================================================================

const CENTER_ID = 'center'

// Layout en colonnes verticales par quadrant.
// Chaque categorie occupe un quadrant ; ses positions sont empilees
// verticalement sur le cote exterieur de la categorie ; les techniques
// d'une position sont empilees a l'exterieur de la position.
//
// Indices = sort_order (0..3) : Debout, Au-dessus, En dessous, Scrambles.
// dx : -1 = cote gauche, +1 = cote droit
// dy : -1 = vers le haut, +1 = vers le bas
const QUADRANTS = [
  { dx: -1, dy: -1 }, // top-left  -> Debout
  { dx: +1, dy: -1 }, // top-right -> Au-dessus
  { dx: -1, dy: +1 }, // bot-left  -> En dessous
  { dx: +1, dy: +1 }, // bot-right -> Scrambles & Other
]

// Decalages absolus
const CAT_X = 360
const CAT_Y = 180
const POSITION_DX_FROM_CAT = 240 // les positions sont a l'exterieur de la categorie
const POSITION_GAP_Y = 70 // ecart vertical entre positions
const POSITION_FIRST_OFFSET = 30 // ecart vertical entre categorie et premiere position
const TECH_DX_FROM_POS = 230 // les techniques sont a l'exterieur de la position
const TECH_GAP_Y = 46
const LINK_DX = 180

// Calcule la position du i-eme element d'une pile verticale (orientation dy).
// dy = +1 -> elements croissent vers le bas
// dy = -1 -> elements croissent vers le haut
function stackY(baseY, i, count, gap, dy, firstOffset = 0) {
  // On centre la pile sur baseY +/- firstOffset
  const total = (count - 1) * gap
  const startY = dy === +1 ? baseY + firstOffset : baseY - firstOffset - total
  return startY + i * gap
}

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

// Convertit "#RRGGBB" en "rgba(r, g, b, alpha)"
function alphaColor(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex
  const clean = hex.slice(1)
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Handles invisibles (utilises par React Flow pour tracer les edges).
function HiddenHandles() {
  const style = { opacity: 0, pointerEvents: 'none', width: 1, height: 1 }
  return (
    <>
      <Handle type="target" position={HandlePosition.Left} style={style} />
      <Handle type="source" position={HandlePosition.Right} style={style} />
    </>
  )
}

// =====================================================================
// Custom nodes
// =====================================================================

function CenterNode({ data }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        data.onToggle(CENTER_ID)
      }}
      style={{
        background: '#1A2D4F',
        color: 'white',
        borderRadius: 24,
        padding: '12px 22px',
        fontFamily: 'Outfit, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 16,
        textAlign: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
        minWidth: 140,
      }}
    >
      <HiddenHandles />
      Grappling
    </div>
  )
}

function CategoryNode({ data }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        data.onToggle(data.id)
      }}
      style={{
        background: data.color,
        color: 'white',
        borderRadius: 22,
        padding: '8px 16px',
        fontFamily: 'Outfit, system-ui, sans-serif',
        boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
        minWidth: 120,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <HiddenHandles />
      <button
        onClick={(e) => {
          e.stopPropagation()
          data.onInfo(data.id)
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 6,
          padding: 2,
          cursor: 'pointer',
          color: 'white',
        }}
        title="Voir la fiche"
      >
        <Info style={{ width: 12, height: 12 }} />
      </button>
      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>
        {data.count} position{data.count > 1 ? 's' : ''}
      </div>
    </div>
  )
}

function PositionNode({ data }) {
  return (
    <motion.div
      animate={
        data.pulsed
          ? {
              boxShadow: [
                '0 0 0 0 ' + alphaColor(data.color, 0.0),
                '0 0 0 14px ' + alphaColor(data.color, 0.5),
                '0 0 0 0 ' + alphaColor(data.color, 0.0),
              ],
            }
          : { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }
      }
      transition={{ duration: 1.5 }}
      onClick={(e) => {
        e.stopPropagation()
        data.onToggle(data.id)
      }}
      style={{
        background: alphaColor(data.color, 0.18),
        border: `2px solid ${data.color}`,
        color: '#1A1A1A',
        borderRadius: 20,
        padding: '7px 14px',
        fontFamily: 'Outfit, system-ui, sans-serif',
        minWidth: 110,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <HiddenHandles />
      <button
        onClick={(e) => {
          e.stopPropagation()
          data.onInfo(data.id)
        }}
        style={{
          position: 'absolute',
          top: 3,
          right: 3,
          background: 'rgba(255,255,255,0.85)',
          border: 'none',
          borderRadius: 6,
          padding: 2,
          cursor: 'pointer',
          color: data.color,
        }}
        title="Voir la fiche"
      >
        <Info style={{ width: 11, height: 11 }} />
      </button>
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.15 }}>{data.label}</div>
      <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
        {data.count} tech{data.count > 1 ? 's' : ''}
      </div>
    </motion.div>
  )
}

function TechniqueNode({ data }) {
  // Terminale = soumission -> cercle plein avec icone
  if (data.isTerminal) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation()
          data.onInfo(data.id)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}
      >
        <HiddenHandles />
        <div
          style={{
            background: data.color,
            border: `2px solid ${data.colorDeep || data.color}`,
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            flexShrink: 0,
          }}
        >
          <CheckCircle style={{ width: 16, height: 16, color: 'white' }} />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 11,
            color: '#1A1A1A',
            background: 'rgba(255,255,255,0.85)',
            padding: '2px 6px',
            borderRadius: 6,
            maxWidth: 110,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.label}
        </span>
      </div>
    )
  }
  // Transition -> pilule allongee
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        data.onInfo(data.id)
      }}
      style={{
        background: '#F8F7F4',
        border: `1.5px solid ${data.color}`,
        color: '#1A1A1A',
        borderRadius: 16,
        padding: '5px 12px',
        fontFamily: 'Outfit, system-ui, sans-serif',
        fontSize: 12,
        minWidth: 100,
        maxWidth: 160,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'pointer',
      }}
    >
      <HiddenHandles />
      <span style={{ marginRight: 4, opacity: 0.7 }}>{actionTypeIcon(data.action_type)}</span>
      {data.label}
    </div>
  )
}

function LinkNode({ data }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        data.onNavigate(data.targetPositionId)
      }}
      style={{
        background: 'white',
        border: `1.5px dashed ${data.color}`,
        color: data.color,
        borderRadius: 14,
        padding: '4px 10px',
        fontFamily: 'Outfit, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <HiddenHandles />
      <ArrowRight style={{ width: 11, height: 11 }} />
      voir {data.label}
    </div>
  )
}

const nodeTypes = {
  center: CenterNode,
  category: CategoryNode,
  position: PositionNode,
  technique: TechniqueNode,
  link: LinkNode,
}

// =====================================================================
// Construction des nodes / edges depuis les donnees
// =====================================================================

function buildFlow({
  categories,
  getPositionsByCategory,
  getTechniquesByPosition,
  getTechniqueTarget,
  expanded,
  pulsedPositionId,
  callbacks,
}) {
  const nodes = []
  const edges = []

  // Centre
  nodes.push({
    id: CENTER_ID,
    type: 'center',
    position: { x: 0, y: 0 },
    data: { onToggle: callbacks.onToggle },
    draggable: false,
    selectable: false,
  })

  if (!expanded.has(CENTER_ID)) return { nodes, edges }

  // Categories : un par quadrant
  categories.forEach((cat, idx) => {
    const q = QUADRANTS[idx % QUADRANTS.length]
    const catX = q.dx * CAT_X
    const catY = q.dy * CAT_Y
    const catId = `cat:${cat.id}`
    const catColor = cat.color_hex || '#666'
    nodes.push({
      id: catId,
      type: 'category',
      position: { x: catX, y: catY },
      data: {
        id: catId,
        label: cat.name,
        color: catColor,
        count: getPositionsByCategory(cat.id).length,
        onToggle: callbacks.onToggle,
        onInfo: () => callbacks.onCategoryInfo(cat),
      },
      draggable: false,
    })
    edges.push({
      id: `e:${CENTER_ID}-${catId}`,
      source: CENTER_ID,
      target: catId,
      type: 'smoothstep',
      style: { stroke: catColor, strokeWidth: 2.5 },
    })

    if (!expanded.has(catId)) return

    // Positions empilees verticalement a l'exterieur de la categorie
    const positions = getPositionsByCategory(cat.id)
    const posBaseX = catX + q.dx * POSITION_DX_FROM_CAT
    positions.forEach((p, pi) => {
      const posX = posBaseX
      const posY = stackY(catY, pi, positions.length, POSITION_GAP_Y, q.dy, POSITION_FIRST_OFFSET)
      const posId = `pos:${p.id}`
      nodes.push({
        id: posId,
        type: 'position',
        position: { x: posX, y: posY },
        data: {
          id: posId,
          rawPositionId: p.id,
          label: p.name,
          color: catColor,
          count: getTechniquesByPosition(p.id).length,
          pulsed: pulsedPositionId === p.id,
          onToggle: callbacks.onToggle,
          onInfo: () => callbacks.onPositionInfo(p),
        },
        draggable: false,
      })
      edges.push({
        id: `e:${catId}-${posId}`,
        source: catId,
        target: posId,
        type: 'smoothstep',
        style: { stroke: catColor, strokeWidth: 2 },
      })

      if (!expanded.has(posId)) return

      // Techniques empilees verticalement a l'exterieur de la position
      const techs = getTechniquesByPosition(p.id)
      const techBaseX = posX + q.dx * TECH_DX_FROM_POS
      techs.forEach((t, ti) => {
        const tx = techBaseX
        const ty = stackY(posY, ti, techs.length, TECH_GAP_Y, q.dy, 0)
        const techId = `tech:${t.id}`
        const target = getTechniqueTarget(t.id)
        nodes.push({
          id: techId,
          type: 'technique',
          position: { x: tx, y: ty },
          data: {
            id: techId,
            rawTechniqueId: t.id,
            label: t.name,
            action_type: t.action_type,
            color: catColor,
            colorDeep: cat.color_deep_hex,
            isTerminal: target.isTerminal,
            onInfo: () => callbacks.onTechniqueInfo(t),
          },
          draggable: false,
        })
        edges.push({
          id: `e:${posId}-${techId}`,
          source: posId,
          target: techId,
          type: 'smoothstep',
          style: { stroke: catColor, strokeWidth: 1.5 },
        })

        // Mini-noeud "voir [Position]" si transition vers une autre position
        if (!target.isTerminal && target.toPosition) {
          const lx = tx + q.dx * LINK_DX
          const ly = ty
          const linkId = `link:${t.id}`
          nodes.push({
            id: linkId,
            type: 'link',
            position: { x: lx, y: ly },
            data: {
              label: target.toPosition.name,
              color: catColor,
              targetPositionId: target.toPosition.id,
              onNavigate: callbacks.onNavigate,
            },
            draggable: false,
          })
          edges.push({
            id: `e:${techId}-${linkId}`,
            source: techId,
            target: linkId,
            type: 'smoothstep',
            style: { stroke: catColor, strokeWidth: 1, strokeDasharray: '4 3' },
          })
        }
      })
    })
  })

  return { nodes, edges }
}

// =====================================================================
// Modals
// =====================================================================

function PositionImage({ slug, customUrl, className = '' }) {
  // 0: custom upload | 1: static GrappleMap PNG | 2: placeholder
  const [tier, setTier] = useState(customUrl ? 0 : slug ? 1 : 2)

  // Si la prop customUrl change (apres upload), revenir au tier 0
  // Sinon si elle disparait, revenir au tier 1 (static).
  // Detecte le changement via useEffect en synchronisant tier sur les props.
  useEffect(() => {
    setTier(customUrl ? 0 : slug ? 1 : 2)
  }, [customUrl, slug])

  if (tier === 2) {
    return (
      <div className={`flex items-center justify-center bg-dojo-bg text-dojo-muted ${className}`}>
        <HelpCircle className="w-6 h-6 opacity-40" />
      </div>
    )
  }
  const src = tier === 0 ? customUrl : `/images/positions/${slug}.png`
  return (
    <img
      src={src}
      alt=""
      onError={() => setTier((t) => t + 1)}
      className={`w-full h-full object-contain ${className}`}
    />
  )
}

function PositionDetailModal({
  position,
  category,
  techniques,
  customImageUrl,
  onClose,
  onOpenTechnique,
  onUploadImage,
  onClearImage,
}) {
  const color = category?.color_hex || '#6b7280'
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // reset input pour permettre re-upload du meme fichier
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      await onUploadImage(position.id, file)
    } catch (err) {
      setUploadError(err.message || 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleClear() {
    if (!window.confirm('Retirer l\'image custom et revenir a l\'image GrappleMap par defaut ?')) return
    setUploadError('')
    try {
      await onClearImage(position.id)
    } catch (err) {
      setUploadError(err.message || 'Erreur suppression')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-dojo-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{category?.name}</div>
            <h2 className="text-lg font-semibold truncate">{position.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="relative aspect-[4/3] rounded-xl border border-dojo-border overflow-hidden bg-dojo-bg">
            <PositionImage slug={position.slug} customUrl={customImageUrl} className="w-full h-full" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dojo-card border border-dojo-border text-xs font-semibold text-dojo-muted cursor-pointer hover:bg-dojo-bg"
            >
              <Upload className="w-3.5 h-3.5" />
              {customImageUrl ? 'Remplacer l\'image' : 'Uploader une image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {customImageUrl && (
              <button
                onClick={handleClear}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent border border-dojo-border text-xs font-semibold text-red-500 hover:bg-red-500/5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Retirer l&apos;image custom
              </button>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{uploadError}</p>
          )}
          {position.description && <p className="text-sm text-dojo-text leading-relaxed">{position.description}</p>}
          <div>
            <h3 className="text-sm font-medium text-dojo-muted mb-2">Techniques rattachees ({techniques.length})</h3>
            <div className="space-y-1">
              {techniques.length === 0 ? (
                <p className="text-xs text-dojo-muted italic">Aucune technique pour le moment.</p>
              ) : techniques.map((t) => (
                <button key={t.id} onClick={() => onOpenTechnique(t)} className="w-full text-left px-3 py-2 rounded-lg bg-dojo-card border border-dojo-border hover:bg-dojo-bg flex items-center gap-2">
                  <span className="text-sm">{actionTypeIcon(t.action_type)}</span>
                  <span className="text-sm font-medium text-dojo-text flex-1">{t.name}</span>
                  <span className="text-[10px] uppercase text-dojo-muted">{t.action_type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryDetailModal({ category, positions, onClose, onOpenPosition }) {
  const color = category.color_hex
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-dojo-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>Categorie</div>
            <h2 className="text-lg font-semibold">{category.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {positions.map((p) => (
            <button key={p.id} onClick={() => onOpenPosition(p)} className="w-full text-left px-3 py-2 rounded-lg bg-dojo-card border-2 hover:bg-dojo-bg" style={{ borderColor: color }}>
              <div className="text-sm font-bold text-dojo-text">{p.name}</div>
              {p.description && <div className="text-[11px] text-dojo-muted line-clamp-2 mt-0.5">{p.description}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompleteGraphView({ rows, positions, onUpdate, onClose }) {
  const [drafts, setDrafts] = useState({})
  function setDraft(trId, patch) {
    setDrafts((prev) => ({ ...prev, [trId]: { ...(prev[trId] || {}), ...patch } }))
  }
  async function handleSave(row) {
    const draft = drafts[row.transition.id] || {}
    if (draft.isTerminal) await onUpdate({ techniqueId: row.technique.id, isTerminal: true })
    else if (draft.toPositionId) await onUpdate({ techniqueId: row.technique.id, toPositionId: draft.toPositionId, isTerminal: false })
    setDrafts((prev) => { const n = { ...prev }; delete n[row.transition.id]; return n })
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-dojo-surface w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-dojo-text">Completer le graphe</h2>
            <p className="text-xs text-dojo-muted">{rows.length} technique{rows.length > 1 ? 's' : ''} sans position d&apos;arrivee</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-sm text-dojo-muted">Toutes les transitions sont definies.</div>
          ) : rows.map((row) => {
            const draft = drafts[row.transition.id] || {}
            const canSave = !!(draft.isTerminal || draft.toPositionId)
            return (
              <div key={row.transition.id} className="bg-dojo-card border border-dojo-border rounded-xl p-3 space-y-2">
                <div>
                  <div className="text-sm font-bold text-dojo-text">{row.technique.name}</div>
                  <div className="text-[11px] text-dojo-muted">
                    {actionTypeIcon(row.technique.action_type)} {row.technique.action_type} · depuis <span className="font-semibold">{row.fromPosition.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <select
                    value={draft.toPositionId || ''}
                    disabled={draft.isTerminal}
                    onChange={(e) => setDraft(row.transition.id, { toPositionId: e.target.value || null, isTerminal: false })}
                    className="bg-dojo-bg border border-dojo-border rounded-lg px-2 py-1.5 text-sm text-dojo-text"
                  >
                    <option value="">Position d&apos;arrivee...</option>
                    {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-dojo-text">
                    <input type="checkbox" checked={!!draft.isTerminal}
                      onChange={(e) => setDraft(row.transition.id, { isTerminal: e.target.checked, toPositionId: e.target.checked ? null : draft.toPositionId })} />
                    Terminale
                  </label>
                  <button onClick={() => handleSave(row)} disabled={!canSave}
                    className="px-3 py-1.5 rounded-lg bg-dojo-accent text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed border-none">
                    Valider
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// Composant principal (wrappe par ReactFlowProvider en bas du fichier)
// =====================================================================

function MindMapInner() {
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
    updateTransition,
    uploadPositionImage,
    clearPositionImage,
    getImageUrl,
  } = mind

  const rf = useReactFlow()
  const [expanded, setExpanded] = useState(() => new Set([CENTER_ID]))
  const [pulsedPositionId, setPulsedPositionId] = useState(null)
  const [openTechnique, setOpenTechnique] = useState(null)
  const [openPosition, setOpenPosition] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)
  const [showCompleteGraph, setShowCompleteGraph] = useState(false)

  const nullRows = useMemo(() => getNullTransitions(), [getNullTransitions])

  const onToggle = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onNavigate = useCallback(
    (positionId) => {
      const pos = positionById(positionId)
      if (!pos) return
      // Reduit a center + categorie + position
      const next = new Set([CENTER_ID, `cat:${pos.category_id}`, `pos:${pos.id}`])
      setExpanded(next)
      setPulsedPositionId(pos.id)
      setTimeout(() => setPulsedPositionId(null), 1500)
      // Centre la vue apres un tick (les nodes doivent etre re-layoutes)
      setTimeout(() => {
        try {
          const slotIdx = categories.findIndex((c) => c.id === pos.category_id)
          const q = QUADRANTS[slotIdx % QUADRANTS.length] || QUADRANTS[0]
          const catX = q.dx * CAT_X
          const catY = q.dy * CAT_Y
          const catPositions = getPositionsByCategory(pos.category_id)
          const pi = Math.max(0, catPositions.findIndex((p) => p.id === pos.id))
          const posX = catX + q.dx * POSITION_DX_FROM_CAT
          const posY = stackY(catY, pi, catPositions.length, POSITION_GAP_Y, q.dy, POSITION_FIRST_OFFSET)
          rf.setCenter(posX, posY, { duration: 600, zoom: 1.0 })
        } catch (err) {
          console.warn('navigate setCenter failed', err)
        }
      }, 80)
    },
    [positionById, categories, getPositionsByCategory, rf]
  )

  const callbacks = useMemo(
    () => ({
      onToggle,
      onCategoryInfo: (c) => setOpenCategory(c),
      onPositionInfo: (p) => setOpenPosition(p),
      onTechniqueInfo: (t) => setOpenTechnique(t),
      onNavigate,
    }),
    [onToggle, onNavigate]
  )

  const { nodes, edges } = useMemo(
    () =>
      buildFlow({
        categories,
        getPositionsByCategory,
        getTechniquesByPosition,
        getTechniqueTarget,
        expanded,
        pulsedPositionId,
        callbacks,
      }),
    [categories, getPositionsByCategory, getTechniquesByPosition, getTechniqueTarget, expanded, pulsedPositionId, callbacks]
  )

  function onNodeDoubleClick(_, node) {
    try {
      rf.setCenter(node.position.x + 60, node.position.y + 20, { duration: 500, zoom: 1.3 })
    } catch (err) {
      console.warn('setCenter failed', err)
    }
  }

  function fitAll() {
    try {
      rf.fitView({ duration: 600, padding: 0.2 })
    } catch (err) {
      console.warn('fitView failed', err)
    }
  }

  // Re-fit auto a chaque changement d'expansion pour eviter que
  // les nouveaux noeuds apparaissent hors-ecran.
  const lastExpandedSize = useRef(expanded.size)
  useEffect(() => {
    if (loading) return
    if (expanded.size !== lastExpandedSize.current) {
      lastExpandedSize.current = expanded.size
      const t = setTimeout(() => {
        try {
          rf.fitView({ padding: 0.2, duration: 400 })
        } catch {
          /* ignore */
        }
      }, 60)
      return () => clearTimeout(t)
    }
  }, [expanded, loading, rf])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="px-4 py-3 border-b border-dojo-border bg-dojo-surface flex items-center gap-2 z-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-dojo-text">Mindmap</h1>
          <p className="text-[11px] text-dojo-muted">
            {categories.length} cat · {positions.length} pos · {nodes.length} noeuds · {edges.length} liens
          </p>
        </div>
        <button
          onClick={fitAll}
          className="p-2 rounded-lg bg-dojo-card border border-dojo-border text-dojo-muted"
          title="Ajuster la vue"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
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

      <div
        className="relative bg-dojo-bg"
        style={{
          height: 'calc(100dvh - 180px)',
          minHeight: '420px',
          width: '100%',
        }}
      >
        {categories.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-semibold text-dojo-text">Aucune categorie chargee</p>
              <p className="text-xs text-dojo-muted">
                Verifie que la migration Skill Tree / Mindmap a ete passee dans Supabase et que les
                tables <code>position_categories</code> et <code>positions</code> sont peuplees.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeDoubleClick={onNodeDoubleClick}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            panOnScroll
            zoomOnScroll
            zoomOnPinch
            panOnDrag
            minZoom={0.2}
            maxZoom={2.5}
            fitView
            fitViewOptions={{ padding: 0.25, duration: 0 }}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <Background gap={24} size={1} color="#e5e5e5" />
            <Controls
              showInteractive={false}
              position="bottom-right"
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            />
          </ReactFlow>
        )}
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
          position={positionById(openPosition.id) || openPosition}
          category={categoryById(openPosition.category_id)}
          techniques={getTechniquesByPosition(openPosition.id)}
          customImageUrl={getImageUrl(positionById(openPosition.id)?.image_path)}
          onClose={() => setOpenPosition(null)}
          onOpenTechnique={(t) => {
            setOpenPosition(null)
            setOpenTechnique(t)
          }}
          onUploadImage={uploadPositionImage}
          onClearImage={clearPositionImage}
        />
      )}

      {openCategory && (
        <CategoryDetailModal
          category={openCategory}
          positions={getPositionsByCategory(openCategory.id)}
          onClose={() => setOpenCategory(null)}
          onOpenPosition={(p) => {
            setOpenCategory(null)
            setOpenPosition(p)
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
    </div>
  )
}

export default function MindMapPage() {
  return (
    <ReactFlowProvider>
      <MindMapInner />
    </ReactFlowProvider>
  )
}
