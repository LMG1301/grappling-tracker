import { useState, useCallback } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import { ROUTINE_META } from '../../lib/mobility/exercises'
import { useMobilitySession } from '../../hooks/useMobilitySession'
import PhaseIndicator from './PhaseIndicator'
import ExerciseRow from './ExerciseRow'
import SessionSummary from './SessionSummary'

export default function MobilitySession({ routineType, competitionWeek = 1, onBack }) {
  const meta = ROUTINE_META[routineType]
  const {
    exercises,
    currentIndex,
    setCurrentIndex,
    elapsedSec,
    isRunning,
    isComplete,
    phase,
    streakResult,
    completedCount,
    skippedCount,
    startSession,
    completeExercise,
    skipExercise,
    setPainLevel,
    setRomNote,
    goToNext,
    finishSession,
  } = useMobilitySession(routineType, competitionWeek)

  const [openIndex, setOpenIndex] = useState(0)

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleToggle = useCallback((index) => {
    setOpenIndex(prev => prev === index ? -1 : index)
  }, [])

  const handleComplete = useCallback((index, side) => {
    completeExercise(index, side)
  }, [completeExercise])

  const handleNext = useCallback(() => {
    const nextIdx = openIndex + 1
    if (nextIdx < exercises.length) {
      setOpenIndex(nextIdx)
      setCurrentIndex(nextIdx)
      goToNext()
    }
  }, [openIndex, exercises.length, setCurrentIndex, goToNext])

  const allDone = exercises.length > 0 && exercises.every(e => e.completed || e.skipped)

  // Show summary when complete
  if (isComplete) {
    return (
      <div className="flex-1 overflow-y-auto bg-dojo-bg">
        <SessionSummary
          exercises={exercises}
          elapsedSec={elapsedSec}
          completedCount={completedCount}
          skippedCount={skippedCount}
          streakResult={streakResult}
          onBack={onBack}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-dojo-bg">
      {/* Session header */}
      <div className="bg-white border-b border-dojo-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-dojo-text">{meta?.labelFr}</p>
              <div className="flex items-center gap-2">
                <PhaseIndicator phase={phase} />
                <span className="text-[10px] text-dojo-muted">{meta?.duration}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-dojo-muted" />
            <span className="text-sm font-mono font-bold text-dojo-text">{formatTime(elapsedSec)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full h-1 bg-dojo-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / Math.max(exercises.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Start button or exercise list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-2">
          {!isRunning ? (
            <button
              onClick={() => {
                startSession()
                setOpenIndex(0)
              }}
              className="w-full py-4 rounded-xl bg-dojo-accent text-white font-bold text-base hover:bg-dojo-accent-hover transition-colors border-none"
            >
              Commencer
            </button>
          ) : (
            <>
              {exercises.map((exercise, index) => (
                <ExerciseRow
                  key={index}
                  exercise={exercise}
                  index={index}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                  onComplete={handleComplete}
                  onSkip={skipExercise}
                  onPainLevel={setPainLevel}
                  onRomNote={setRomNote}
                  onNext={handleNext}
                />
              ))}

              {/* Finish button */}
              {allDone && (
                <button
                  onClick={finishSession}
                  className="w-full py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors border-none mt-4"
                >
                  Terminer la session
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
