import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, SkipForward, ChevronDown } from 'lucide-react'
import HoldTimer from './HoldTimer'
import BilateralToggle from './BilateralToggle'
import PainSlider from './PainSlider'
import CoachingNotes from './CoachingNotes'

export default function ExerciseRow({
  exercise,
  index,
  isOpen,
  onToggle,
  onComplete,
  onSkip,
  onPainLevel,
  onRomNote,
  onNext,
}) {
  const rowRef = useRef(null)

  useEffect(() => {
    if (isOpen && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isOpen])

  const isDone = exercise.completed
  const isSkipped = exercise.skipped

  return (
    <div
      ref={rowRef}
      className={`bg-white rounded-xl border transition-all ${
        isDone ? 'border-green-300' : isSkipped ? 'border-gray-200 opacity-60' : 'border-dojo-border'
      }`}
    >
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left bg-transparent border-none"
      >
        <span className="w-6 h-6 rounded-full bg-dojo-card flex items-center justify-center text-xs font-bold text-dojo-muted flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDone ? 'text-green-700' : 'text-dojo-text'}`}>
            {exercise.name_fr}
          </p>
          <p className="text-[10px] text-dojo-muted">
            {exercise.default_sets > 1 && `${exercise.default_sets}x `}
            {exercise.default_reps || (exercise.adjustedHoldSec ? `${exercise.adjustedHoldSec}s hold` : '')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {exercise.is_bilateral && (
            <span className="text-[9px] font-bold text-dojo-muted bg-dojo-card px-1.5 py-0.5 rounded">
              G/D
            </span>
          )}
          {isDone && <Check className="w-4 h-4 text-green-500" />}
          {isSkipped && <SkipForward className="w-4 h-4 text-gray-400" />}
          <ChevronDown className={`w-4 h-4 text-dojo-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3 border-t border-dojo-border pt-3">
              {/* Hold timer or bilateral toggle */}
              {exercise.adjustedHoldSec ? (
                <div className="flex justify-center">
                  <HoldTimer
                    durationSec={exercise.adjustedHoldSec}
                    onComplete={() => {
                      if (exercise.is_bilateral) {
                        // Will be handled by bilateral toggle
                      } else {
                        onComplete(index)
                      }
                    }}
                  />
                </div>
              ) : null}

              {exercise.is_bilateral ? (
                <div className="flex justify-center">
                  <BilateralToggle
                    sidesCompleted={exercise.sidesCompleted}
                    onComplete={(side) => onComplete(index, side)}
                  />
                </div>
              ) : !exercise.adjustedHoldSec ? (
                <button
                  onClick={() => onComplete(index)}
                  disabled={isDone}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all border-none ${
                    isDone
                      ? 'bg-green-100 text-green-700'
                      : 'bg-dojo-accent text-white hover:bg-dojo-accent-hover'
                  }`}
                >
                  {isDone ? 'Fait' : 'Valider'}
                </button>
              ) : null}

              {/* Optional fields */}
              <div className="flex items-center justify-between">
                <PainSlider value={exercise.painLevel} onChange={(v) => onPainLevel(index, v)} />
                <CoachingNotes exercise={exercise} />
              </div>

              {/* ROM note */}
              <input
                type="text"
                placeholder="Note ROM (optionnel)"
                value={exercise.romNote}
                onChange={(e) => onRomNote(index, e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-dojo-surface border border-dojo-border text-dojo-text placeholder:text-dojo-muted/50 outline-none focus:border-dojo-accent"
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSkip(index)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-dojo-muted bg-dojo-surface hover:bg-dojo-card transition-colors border-none"
                >
                  Skip
                </button>
                <button
                  onClick={onNext}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-dojo-accent hover:bg-dojo-accent-hover transition-colors border-none"
                >
                  Suivant
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
