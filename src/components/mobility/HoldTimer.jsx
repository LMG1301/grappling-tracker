import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function HoldTimer({ durationSec, onComplete, autoStart = false }) {
  const [remaining, setRemaining] = useState(durationSec)
  const [isActive, setIsActive] = useState(autoStart)
  const intervalRef = useRef(null)
  const hasCompleted = useRef(false)

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = remaining / durationSec
  const offset = circumference * (1 - progress)

  useEffect(() => {
    if (isActive && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsActive(false)
            if (!hasCompleted.current) {
              hasCompleted.current = true
              // Vibrate if available
              if (navigator.vibrate) navigator.vibrate(200)
              onComplete?.()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, remaining, durationSec, onComplete])

  const toggle = useCallback(() => {
    if (remaining === 0) return
    setIsActive(prev => !prev)
  }, [remaining])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsActive(false)
    setRemaining(durationSec)
    hasCompleted.current = false
  }, [durationSec])

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG circle timer */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={remaining === 0 ? '#22c55e' : '#6366f1'}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-dojo-text font-mono">
            {formatTime(remaining)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-dojo-accent text-white flex items-center justify-center hover:bg-dojo-accent-hover transition-colors border-none"
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-dojo-card text-dojo-muted flex items-center justify-center hover:bg-dojo-border transition-colors border-none"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
