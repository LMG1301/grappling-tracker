export const ACTION_TYPES = [
  { value: 'submission', label: '🔒 Submission', color: '#ef4444' },
  { value: 'sweep', label: '🔄 Sweep', color: '#3b82f6' },
  { value: 'pass', label: '🚀 Pass', color: '#22c55e' },
  { value: 'escape', label: '💨 Escape', color: '#eab308' },
  { value: 'transition', label: '🔀 Transition', color: '#a855f7' },
  { value: 'takedown', label: '⬇️ Takedown', color: '#f97316' },
  { value: 'principle', label: '🧠 Principle', color: '#6366f1' },
  { value: 'drill', label: '🏋️ Drill', color: '#d97706' },
]

// SRS status derived from technique state
export function getSrsStatus(technique) {
  if (!technique.situation || !technique.answer) return null // no flashcard
  if (technique.srs_repetitions === 0 && technique.interval_days === 0) return 'new'
  if (technique.interval_days < 7) return 'learning'
  return 'mastered'
}

export const SRS_STATUS_META = {
  new: { label: 'Nouveau', color: '#f97316', bgClass: 'bg-orange-100 text-orange-700' },
  learning: { label: 'Apprentissage', color: '#3b82f6', bgClass: 'bg-blue-100 text-blue-700' },
  mastered: { label: 'Maitrise', color: '#22c55e', bgClass: 'bg-green-100 text-green-700' },
}

export const DEFAULT_POSITIONS = [
  'Closed Guard',
  'Half Guard',
  'Mount',
  'Side Control',
  'Back',
  'Turtle',
  'Standing',
  'Open Guard',
  'Deep Half',
  'Butterfly Guard',
  'De La Riva',
  'Spider Guard',
  'Lasso Guard',
  'X-Guard',
  'Knee on Belly',
  'North-South',
  'Rubber Guard',
  'Z-Guard',
]

export const ACTION_COLOR_MAP = Object.fromEntries(
  ACTION_TYPES.map((t) => [t.value, t.color])
)

export const ACTION_LABEL_MAP = Object.fromEntries(
  ACTION_TYPES.map((t) => [t.value, t.label])
)

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
