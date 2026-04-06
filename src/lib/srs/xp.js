// XP and level system

export const XP_TABLE = {
  reviewed: 2,     // any card reviewed
  good: 8,         // rated "Good"
  easy: 10,        // rated "Easy"
  matTested: 5,    // tested on the mat
  matSuccess: 15,  // tested + succeeded
  streakDay: 3,    // per consecutive day
}

export const XP_PER_LEVEL = 50

export function getLevel(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1
}

export function getLevelProgress(totalXp) {
  const xpInLevel = totalXp % XP_PER_LEVEL
  return {
    current: xpInLevel,
    needed: XP_PER_LEVEL,
    percent: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
  }
}

export function calculateSessionXp(ratings) {
  let xp = 0
  for (const r of ratings) {
    xp += XP_TABLE.reviewed
    if (r === 3) xp += XP_TABLE.good
    if (r === 4) xp += XP_TABLE.easy
  }
  return xp
}
