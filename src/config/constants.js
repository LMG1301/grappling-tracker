export const ACTION_TYPES = [
  { value: 'submission', label: '🔒 Submission', color: '#ef4444' },
  { value: 'sweep', label: '🔄 Sweep', color: '#3b82f6' },
  { value: 'pass', label: '🚀 Pass', color: '#22c55e' },
  { value: 'escape', label: '💨 Escape', color: '#eab308' },
  { value: 'transition', label: '🔀 Transition', color: '#a855f7' },
  { value: 'takedown', label: '⬇️ Takedown', color: '#f97316' },
]

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
