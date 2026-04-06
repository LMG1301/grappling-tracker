export function getPhase(week) {
  if (week <= 3) return 'accumulation'
  if (week <= 6) return 'conversion'
  if (week <= 9) return 'peaking'
  return 'taper'
}

export const PHASE_CONFIG = {
  accumulation: {
    label: 'Accumulation',
    color: '#3b82f6',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    sessionsPerWeek: '4-5',
    durationMin: '20-30',
    postHoldSec: 60,
    showPost: true,
  },
  conversion: {
    label: 'Conversion',
    color: '#22c55e',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    sessionsPerWeek: '3-4',
    durationMin: '15-20',
    postHoldSec: 45,
    showPost: true,
  },
  peaking: {
    label: 'Peaking',
    color: '#f97316',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    sessionsPerWeek: '2-3',
    durationMin: '10-15',
    postHoldSec: 30,
    showPost: true,
  },
  taper: {
    label: 'Taper',
    color: '#6b7280',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    sessionsPerWeek: 'CARs only',
    durationMin: '5',
    postHoldSec: 0,
    showPost: false,
  },
}

export function getHoldDuration(exercise, phase) {
  if (!exercise.default_hold_sec) return null
  const config = PHASE_CONFIG[phase]
  if (!config) return exercise.default_hold_sec
  // Post-training holds adapt to phase
  if (exercise.routine_type === 'post' && config.postHoldSec > 0) {
    return config.postHoldSec
  }
  if (exercise.routine_type === 'post' && config.postHoldSec === 0) {
    return null // taper: no static holds
  }
  return exercise.default_hold_sec
}
