// SM-2 algorithm (SuperMemo 2) — same as Anki
// quality mapping: 1=Again(1), 2=Hard(3), 3=Good(4), 4=Easy(5)

const QUALITY_MAP = { 1: 1, 2: 3, 3: 4, 4: 5 }

export function sm2(card, rating) {
  const q = QUALITY_MAP[rating] ?? rating
  let { ease_factor, interval_days, repetitions } = card

  if (q < 3) {
    // Fail: reset
    repetitions = 0
    interval_days = 1
  } else {
    // Success
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 3
    else interval_days = Math.round(interval_days * ease_factor)
    repetitions++
  }

  // Adjust ease factor
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ease_factor < 1.3) ease_factor = 1.3

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval_days)

  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review: nextReview.toISOString().split('T')[0],
    last_review: new Date().toISOString().split('T')[0],
  }
}

// Preview what the interval would be for each rating
export function previewIntervals(card) {
  return {
    again: sm2(card, 1).interval_days,
    hard: sm2(card, 2).interval_days,
    good: sm2(card, 3).interval_days,
    easy: sm2(card, 4).interval_days,
  }
}
