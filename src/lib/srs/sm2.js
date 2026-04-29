// SM-2 algorithm (SuperMemo 2 simplifie) - quality 1..4
// 1 = A revoir   : EF -= 0.20 (min 1.30), reps=0, interval=1
// 2 = Difficile  : EF -= 0.15 (min 1.30), reps+1, interval=max(2, interval*1.2)
// 3 = Bien       : EF stable,             reps+1, interval=interval*EF (4 si premiere fois)
// 4 = Maitrise   : EF += 0.15 (max 2.80), reps+1, interval=interval*EF*1.3 (7 si premiere fois)

const EF_MIN = 1.30
const EF_MAX = 2.80

export function sm2(card, rating) {
  const r = Number(rating) || 0
  let ef = card.ease_factor ?? 2.5
  let interval = card.interval_days ?? 0
  let reps = card.repetitions ?? 0
  const wasFirstTime = reps === 0

  if (r === 1) {
    ef = Math.max(EF_MIN, ef - 0.20)
    reps = 0
    interval = 1
  } else if (r === 2) {
    ef = Math.max(EF_MIN, ef - 0.15)
    reps += 1
    interval = Math.max(2, Math.round(interval * 1.2))
  } else if (r === 3) {
    // ease_factor stable
    reps += 1
    interval = wasFirstTime ? 4 : Math.round(interval * ef)
  } else if (r === 4) {
    ef = Math.min(EF_MAX, ef + 0.15)
    reps += 1
    interval = wasFirstTime ? 7 : Math.round(interval * ef * 1.3)
  }

  if (interval < 1) interval = 1

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    ease_factor: Math.round(ef * 100) / 100,
    interval_days: interval,
    repetitions: reps,
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
