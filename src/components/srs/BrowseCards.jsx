import { useState, useMemo } from 'react'
import { ArrowLeft, ExternalLink, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTION_TYPES, ACTION_COLOR_MAP, ACTION_LABEL_MAP, getSrsStatus, SRS_STATUS_META } from '../../config/constants'
import { extractYoutubeId, getYoutubeThumbnail } from '../../lib/srs/youtube'

function getThumb(card, getImageUrl) {
  if (card.image_path) {
    const url = getImageUrl?.(card.image_path)
    if (url) return url
  }
  const ytId = extractYoutubeId(card.video_url)
  if (ytId) return getYoutubeThumbnail(ytId)
  return null
}

export default function BrowseCards({ cards, getImageUrl, onBack }) {
  const [filterAction, setFilterAction] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)

  const actionTypes = useMemo(() => {
    const types = new Set(cards.map(c => c.action_type))
    return ACTION_TYPES.filter(t => types.has(t.value))
  }, [cards])

  const filtered = useMemo(() => {
    if (!filterAction) return cards
    return cards.filter(c => c.action_type === filterAction)
  }, [cards, filterAction])

  // Full-screen card view
  if (selectedCard) {
    const thumb = getThumb(selectedCard, getImageUrl)
    const srsStatus = getSrsStatus(selectedCard)

    return (
      <div className="flex-1 flex flex-col bg-dojo-bg">
        <div className="bg-white border-b border-dojo-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSelectedCard(null)}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-dojo-text truncate px-2">{selectedCard.name}</span>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto p-4 space-y-3">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACTION_COLOR_MAP[selectedCard.action_type] }}
              >
                {ACTION_LABEL_MAP[selectedCard.action_type]}
              </span>
              <span className="text-[10px] text-dojo-muted">{selectedCard.position}</span>
              {srsStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SRS_STATUS_META[srsStatus].bgClass}`}>
                  {SRS_STATUS_META[srsStatus].label}
                </span>
              )}
            </div>

            {/* Image */}
            {thumb && (
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-dojo-surface">
                <img src={thumb} alt={selectedCard.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Situation */}
            <div className="bg-white rounded-xl border border-dojo-border p-4">
              <p className="text-[10px] font-bold text-dojo-muted uppercase mb-1">Situation</p>
              <p className="text-sm text-dojo-text leading-relaxed">{selectedCard.situation}</p>
            </div>

            {/* Answer */}
            <div className="bg-white rounded-xl border-l-4 border-l-dojo-accent border border-dojo-border p-4 space-y-2">
              <p className="text-[10px] font-bold text-dojo-accent uppercase">Reponse</p>
              <p className="text-sm text-dojo-text leading-relaxed whitespace-pre-line">{selectedCard.answer}</p>
              {selectedCard.cues && (
                <p className="text-xs text-dojo-muted italic">{selectedCard.cues}</p>
              )}
            </div>

            {/* Video link */}
            {selectedCard.video_url && (
              <a
                href={selectedCard.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-dojo-surface text-dojo-text text-xs font-medium hover:bg-dojo-card transition-colors border border-dojo-border no-underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la video
              </a>
            )}

            {/* SRS info (read-only) */}
            {selectedCard.interval_days > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 border border-dojo-border">
                  <p className="text-xs font-bold text-dojo-text">{selectedCard.interval_days}j</p>
                  <p className="text-[9px] text-dojo-muted">Intervalle</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-dojo-border">
                  <p className="text-xs font-bold text-dojo-text">{selectedCard.times_reviewed || 0}</p>
                  <p className="text-[9px] text-dojo-muted">Reviews</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-dojo-border">
                  <p className="text-xs font-bold text-dojo-text">{selectedCard.mat_success || 0}/{selectedCard.mat_tested || 0}</p>
                  <p className="text-[9px] text-dojo-muted">Mat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="flex-1 flex flex-col bg-dojo-bg">
      <div className="bg-white border-b border-dojo-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold text-dojo-text">Consulter les cartes</h2>
        <span className="text-xs text-dojo-muted">{filtered.length} carte{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Category filter chips */}
      <div className="px-4 py-2 flex gap-1.5 overflow-x-auto flex-shrink-0 no-scrollbar">
        <FilterChip
          label="Toutes"
          active={filterAction === ''}
          onClick={() => setFilterAction('')}
        />
        {actionTypes.map(t => (
          <FilterChip
            key={t.value}
            label={t.label.replace(/^[^\s]+\s/, '')}
            active={filterAction === t.value}
            onClick={() => setFilterAction(t.value)}
            color={t.color}
          />
        ))}
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-dojo-muted text-sm py-8">Aucune carte dans cette categorie.</p>
        ) : (
          filtered.map(card => {
            const thumb = getThumb(card, getImageUrl)
            const color = ACTION_COLOR_MAP[card.action_type]

            return (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="w-full bg-white rounded-xl border border-dojo-border p-3 flex items-center gap-3 hover:border-dojo-accent/40 transition-colors text-left"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0 bg-dojo-surface" />
                ) : (
                  <div
                    className="w-14 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color + '33' }}
                  >
                    {card.name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dojo-text truncate">{card.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}
                    >
                      {ACTION_LABEL_MAP[card.action_type]}
                    </span>
                    <span className="text-[10px] text-dojo-muted truncate">{card.position}</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border-none flex-shrink-0 ${
        active
          ? 'bg-dojo-accent text-white'
          : 'bg-dojo-surface text-dojo-muted hover:bg-dojo-card'
      }`}
    >
      {label}
    </button>
  )
}
