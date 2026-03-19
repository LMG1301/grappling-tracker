import { useState, useEffect } from 'react'
import { X, ExternalLink, Pencil, Trash2, Calendar } from 'lucide-react'
import { ACTION_COLOR_MAP, ACTION_LABEL_MAP, MATURITY_LEVELS, MATURITY_COLOR_MAP } from '../config/constants'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function KeyPointsDisplay({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div>
      <h3 className="text-sm font-medium text-dojo-muted mb-2">Points cles</h3>
      <div className="bg-dojo-bg rounded-xl p-4 border border-dojo-border space-y-1">
        {lines.map((line, i) => {
          const trimmed = line.trim()
          if (!trimmed) return null
          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•')
          const content = isBullet ? trimmed.slice(1).trim() : trimmed
          // Simple bold support: **text**
          const parts = content.split(/(\*\*[^*]+\*\*)/)
          const rendered = parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>
            }
            return part
          })
          return (
            <div key={i} className="flex gap-2 text-sm text-dojo-text leading-relaxed">
              {isBullet && <span className="text-dojo-accent flex-shrink-0">•</span>}
              <span>{rendered}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TechniqueDetail({ technique, imageUrl, techniques, onClose, onEdit, onDelete, onUpdateTechnique, fetchLinks }) {
  const ytId = getYouTubeId(technique.video_url)
  const color = ACTION_COLOR_MAP[technique.action_type]
  const [linkedTechniques, setLinkedTechniques] = useState([])

  useEffect(() => {
    if (!fetchLinks) return
    let cancelled = false
    fetchLinks().then((links) => {
      if (cancelled) return
      // Find all links where this technique is source or target
      const related = new Set()
      links.forEach((link) => {
        if (link.source_id === technique.id) related.add(link.target_id)
        if (link.target_id === technique.id) related.add(link.source_id)
      })
      const linkedList = (techniques || []).filter((t) => related.has(t.id))
      setLinkedTechniques(linkedList)
    })
    return () => { cancelled = true }
  }, [technique.id, fetchLinks, techniques])

  async function handleDelete() {
    if (!window.confirm('Supprimer cette technique ?')) return
    await onDelete(technique.id)
    onClose()
  }

  async function handleMaturityChange(newMaturity) {
    if (!onUpdateTechnique || newMaturity === technique.maturity) return
    await onUpdateTechnique(technique.id, { maturity: newMaturity })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-dojo-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold truncate pr-4">
            {technique.is_focus && <span className="text-amber-500 mr-1">★</span>}
            {technique.name}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(technique)} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-muted">
              <Pencil className="w-5 h-5" />
            </button>
            <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors bg-transparent border-none text-red-400">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {imageUrl && (
            <img src={imageUrl} alt={technique.name} className="w-full h-48 sm:h-56 object-cover rounded-xl" />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {ACTION_LABEL_MAP[technique.action_type]}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-dojo-card text-dojo-text border border-dojo-border">
              {technique.position}
            </span>
            {technique.learned_date && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-dojo-card text-dojo-muted border border-dojo-border">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(technique.learned_date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {/* Maturity quick-change */}
          <div>
            <h3 className="text-sm font-medium text-dojo-muted mb-2">Maturite</h3>
            <div className="flex gap-2">
              {MATURITY_LEVELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMaturityChange(m.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                    technique.maturity === m.value
                      ? 'border-transparent text-white shadow-md'
                      : 'border-dojo-border bg-dojo-bg text-dojo-muted hover:border-dojo-accent/50'
                  }`}
                  style={technique.maturity === m.value ? { backgroundColor: m.color } : {}}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {ytId && (
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>
          )}

          {technique.video_url && !ytId && (
            <a
              href={technique.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-dojo-card border border-dojo-border rounded-xl px-4 py-3 text-dojo-accent hover:bg-dojo-border transition-colors no-underline"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Voir la video</span>
            </a>
          )}

          {technique.notes && (
            <div>
              <h3 className="text-sm font-medium text-dojo-muted mb-2">Notes</h3>
              <p className="text-dojo-text whitespace-pre-wrap leading-relaxed bg-dojo-bg rounded-xl p-4 border border-dojo-border">
                {technique.notes}
              </p>
            </div>
          )}

          {/* Key points */}
          <KeyPointsDisplay text={technique.key_points} />

          {/* Linked techniques */}
          {linkedTechniques.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dojo-muted mb-2">Techniques liees</h3>
              <div className="flex flex-wrap gap-1.5">
                {linkedTechniques.map((lt) => (
                  <span
                    key={lt.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: ACTION_COLOR_MAP[lt.action_type] }}
                  >
                    {ACTION_LABEL_MAP[lt.action_type]} — {lt.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
