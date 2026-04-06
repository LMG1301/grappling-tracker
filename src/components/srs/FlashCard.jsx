import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { CATEGORY_META } from '../../lib/srs/deck'
import RatingButtons from './RatingButtons'

export default function FlashCard({ card, isFlipped, intervals, onFlip, onRate }) {
  if (!card) return null

  const catMeta = CATEGORY_META[card.category] || { label: card.category, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="space-y-3">
      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catMeta.color}`}>
          {catMeta.label}
        </span>
        <span className="text-[10px] text-dojo-muted">{card.position_name}</span>
      </div>

      {/* Image */}
      {card.image_url && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-dojo-surface">
          <img
            src={card.image_url}
            alt={card.position_name}
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
          /* RECTO: Show answer button */
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
          /* VERSO: Answer + rating */
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

              {card.grappling_link && (
                <p className="text-xs text-dojo-accent font-medium">{card.grappling_link}</p>
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
