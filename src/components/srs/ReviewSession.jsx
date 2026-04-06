import { ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSrsSession } from '../../hooks/useSrsSession'
import ProgressDots from './ProgressDots'
import FlashCard from './FlashCard'
import SrsSessionSummary from './SessionSummary'

export default function ReviewSession({ dueCards, onBack, onFeedback }) {
  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isComplete,
    ratings,
    intervals,
    elapsedSec,
    flip,
    rate,
  } = useSrsSession(dueCards)

  if (isComplete) {
    return (
      <div className="flex-1 overflow-y-auto bg-dojo-bg">
        <SrsSessionSummary
          ratings={ratings}
          elapsedSec={elapsedSec}
          onBack={onBack}
          onFeedback={onFeedback}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-dojo-bg">
      {/* Header */}
      <div className="bg-white border-b border-dojo-border px-4 py-3 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-dojo-text">
            {currentIndex + 1} / {totalCards}
          </span>
          <div className="w-7" /> {/* spacer */}
        </div>
        <ProgressDots total={totalCards} currentIndex={currentIndex} ratings={ratings} />
      </div>

      {/* Card area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard?.id || currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25 }}
            >
              <FlashCard
                card={currentCard}
                isFlipped={isFlipped}
                intervals={intervals}
                onFlip={flip}
                onRate={rate}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
