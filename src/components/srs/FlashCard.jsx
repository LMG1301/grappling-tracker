import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { ACTION_COLOR_MAP, ACTION_LABEL_MAP } from '../../config/constants'
import { extractYoutubeId, getYoutubeThumbnail } from '../../lib/srs/youtube'
import RatingButtons from './RatingButtons'

function getTechniqueImage(technique, getImageUrl) {
  if (technique.image_path) {
    const url = getImageUrl?.(technique.image_path)
    if (url) return url
  }
  const ytId = extractYoutubeId(technique.video_url)
  if (ytId) return getYoutubeThumbnail(ytId)
  return null
}

export default function FlashCard({ card, isFlipped, intervals, onFlip, onRate, getImageUrl }) {
  if (!card) return null

  const imageUrl = getTechniqueImage(card, getImageUrl)
  const color = ACTION_COLOR_MAP[card.action_type]

  return (
    <div className="space-y-3">
      {/* Badges */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {ACTION_LABEL_MAP[card.action_type]}
        </span>
        <span className="text-[10px] text-dojo-muted">{card.position}</span>
        <span className="text-[10px] font-medium text-dojo-text">{card.name}</span>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-dojo-surface">
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Situation (always visible) */}
      <div className="bg-white rounded-xl border border-dojo-border p-4">
        <p className="text-sm text-dojo-text leading-relaxed">{card.situation}</p>
      </div>

      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.button
            key="flip-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFlip}
            className="w-full py-3.5 rounded-xl bg-dojo-accent text-white font-bold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
          >
            Voir la reponse
          </motion.button>
        ) : (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Answer block */}
            <div className="bg-white rounded-xl border-l-4 border-l-dojo-accent border border-dojo-border p-4 space-y-2">
              <p className="text-xs font-bold text-dojo-accent uppercase tracking-wider">Reponse</p>
              <p className="text-sm text-dojo-text leading-relaxed whitespace-pre-line">{card.answer}</p>

              {card.cues && (
                <p className="text-xs text-dojo-muted italic">{card.cues}</p>
              )}
            </div>

            {/* Video link */}
            {card.video_url && (
              <a
                href={card.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-dojo-surface text-dojo-text text-xs font-medium hover:bg-dojo-card transition-colors border border-dojo-border no-underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la video
              </a>
            )}

            {/* Rating buttons */}
            <RatingButtons intervals={intervals} onRate={onRate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
