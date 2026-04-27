#!/usr/bin/env node
// Telecharge un snapshot PNG des positions depuis GrappleMap (eel.is/GrappleMap),
// projet en domaine public.
//
// Approche : on parse le fichier source GrappleMap.txt (raw GitHub) qui liste
// les ~900 positions du dataset avec leurs tags. Pour chaque slug local, on
// definit un ensemble de tags requis ; on score les positions GrappleMap par
// le nombre de tags matches et on prend la meilleure. L'index sequentiel de
// la position correspond directement a son ID dans les URLs d'images :
//   http://eel.is/GrappleMap/res/p{ID}N480x360.png
//
// Usage : npm run download-images
// Aucun navigateur requis : juste fetch + node fs.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')
const POSITIONS_DIR = path.join(ROOT, 'public', 'images', 'positions')
const CATEGORIES_DIR = path.join(ROOT, 'public', 'images', 'categories')

const GM_TXT_URL = 'https://raw.githubusercontent.com/Eelis/GrappleMap/master/GrappleMap.txt'
const IMAGE_URL = (id) => `http://eel.is/GrappleMap/res/p${id}N480x360.png`

// Pour chaque slug local, on liste les tags requis. Le script choisira la
// position GrappleMap qui matche le plus de tags. `must` doit etre present,
// `prefer` ajoute des points. `avoid` retire des points. `name_contains`
// (optionnel) booste si le nom contient ces sous-chaines.
const POSITION_QUERIES = {
  // --- Standing ---
  standing_neutral: { must: ['standing'], name_avoid: ['headlock', 'sprawl', 'single', 'double leg', 'guard pull', 'body lock'], avoid: ['bottom_supine', 'bottom_seated', 'sprawl'] },
  front_headlock: { name_must: ['front headlock'], name_avoid: ['side control', 'side ctrl'] },
  single_leg: { must: ['single_leg_takedown'], name_avoid: ['sprawl'] },
  double_leg: { must: ['double_leg_takedown'], name_avoid: ['sprawl'] },
  snap_down: { name_must: ['snap'] },
  sprawl: { must: ['sprawl'] },
  body_lock: { must: ['body_lock'], prefer: ['standing'] },
  two_on_one: { must: ['two_on_one'] },

  // --- On top ---
  closed_guard_top: { must: ['closed_guard', 'top_kneeling'], avoid: ['rubber_guard', 'top_posture_broken', 'collar_tie'] },
  open_guard_top: { must: ['top_kneeling', 'bottom_supine'], avoid: ['closed_guard', 'half_guard', 'side_control', 'mount', 'knee_on_belly', 'back', 'rubber_guard', 'butterfly', 'twister_side'], name_avoid: ['rubber', 'mounted'] },
  half_guard_top: { must: ['half_guard', 'top_kneeling'], avoid: ['bottom_supine', 'reverse_half', 'deep_half'] },
  side_control_top: { must: ['side_control', 'top_kneeling'], avoid: ['twister_side', 'judo_side', 'reverse_half'] },
  mount_top: { must: ['mount', 'top_kneeling'], avoid: ['three_quarter_mount', 's_mount', 'bottom_supine'] },
  north_south_top: { must: ['north_south', 'top_kneeling'] },
  knee_on_belly: { must: ['knee_on_belly'], prefer: ['top_kneeling'], name_avoid: ['reverse', 'bottom'] },
  back_control: { must: ['back', 'seatbelt'], avoid: ['turtle', 'crucifix', 'truck', 'dogfight'], name_avoid: ['mounted', 'dogfight', 'turtle'] },
  turtle_top: { must: ['turtle', 'top_kneeling'], name_avoid: ['mounted'] },

  // --- On bottom ---
  closed_guard_bottom: { must: ['closed_guard', 'bottom_supine'], avoid: ['rubber_guard', 'top_posture_broken'], name_avoid: ['standing'] },
  butterfly_guard: { must: ['butterfly', 'bottom_seated'], avoid: ['engaged_butterfly', 'reverse_butterfly'], name_avoid: ['combat base'] },
  half_guard_bottom: { must: ['half_guard', 'bottom_supine'], avoid: ['top_kneeling', 'deep_half', 'reverse_half'], name_avoid: ['thwart'] },
  z_guard: { must: ['z_guard'] },
  x_guard: { must: ['x_guard'], avoid: ['slx'] },
  single_leg_x: { must: ['slx'] },
  seated_open_guard: { must: ['bottom_seated'], prefer: ['butterfly'], avoid: ['back', 'turtle', 'crab_ride', 'engaged_butterfly'], name_avoid: ['combat base'] },
  supine_guard: { must: ['bottom_supine'], avoid: ['closed_guard', 'half_guard', 'side_control', 'mount', 'knee_on_belly', 'back', 'north_south', 'rubber_guard', 'twister_side', 'top_kneeling'], name_contains: ['guard'], name_avoid: ['top'] },
  side_control_bottom: { must: ['side_control', 'bottom_supine'], avoid: ['twister_side', 'judo_side'] },
  mount_bottom: { must: ['mount', 'bottom_supine'], avoid: ['three_quarter_mount', 's_mount', 'top_kneeling'], name_avoid: ['strike'] },
  back_taken: { must: ['back', 'bottom_seated'], avoid: ['top_kneeling'], name_avoid: ['rnc'] },
  turtle_bottom: { must: ['turtle'], avoid: ['top_kneeling'], prefer: ['bottom_kneeling', 'all_fours'], name_avoid: ['mounted', 'parallel'] },
  north_south_bottom: { must: ['north_south', 'bottom_supine'], name_avoid: ['choke'] },
  kob_bottom: { must: ['knee_on_belly', 'bottom_supine'], name_avoid: ['reverse'] },

  // --- Transitions (rares dans GrappleMap, on prend ce qui s'en rapproche) ---
  // Pas de tag/nom "scramble" : on prend une takedown standing comme proxy visuel.
  scramble: { must: ['single_leg_takedown'], name_avoid: ['sprawl', 'kneeling'] },
  leg_entanglement: { prefer: ['ashi', 'ashi_waza', 'slx', '50_50'], name_contains: ['ashi', 'leg drag', '50/50', 'fifty'], name_avoid: ['back', 'dogfight'] },
  dogfight: { name_must: ['dogfight'], name_avoid: ['back', 'seatbelt', 'mounted'] },
}

// Categories utilisent un slug local de position comme source.
const CATEGORY_MAP = {
  standing: 'standing_neutral',
  on_top: 'mount_top',
  on_bottom: 'closed_guard_bottom',
  transitions: 'scramble',
}

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

// Parse GrappleMap.txt en blocks de 6 lignes :
//   1: nom (peut contenir des "\n" litteraux)
//   2: tags: t1 t2 t3
//   3-6: 4 lignes de coordonnees (commencent par 4 espaces)
function parsePositions(text) {
  // Le fichier contient d'abord la section positions, puis les transitions.
  // Les transitions ont une ligne `properties:` apres `tags:`. On coupe au
  // premier `properties:` rencontre pour ne garder que les positions.
  const cutoff = text.indexOf('\nproperties:')
  const positionSection = cutoff > 0 ? text.slice(0, cutoff) : text

  const lines = positionSection.split('\n')
  const positions = []
  let i = 0
  while (i < lines.length) {
    if (i + 1 >= lines.length) break
    const nameLine = lines[i]
    const tagsLine = lines[i + 1]
    if (!tagsLine || !tagsLine.startsWith('tags:')) {
      i++
      continue
    }
    // Une position valide a exactement 4 lignes de data (4-space-prefixed)
    const dataLines = []
    let j = i + 2
    while (j < lines.length && lines[j].startsWith('    ')) {
      dataLines.push(lines[j])
      j++
    }
    if (dataLines.length !== 4) {
      i++
      continue
    }
    const tags = tagsLine.replace(/^tags:\s*/, '').trim().split(/\s+/).filter(Boolean)
    const name = nameLine.replace(/\\n/g, ' ').trim()
    positions.push({ id: positions.length, name, tags })
    i = j
  }
  return positions
}

function scorePosition(pos, query) {
  const tags = new Set(pos.tags)
  const name = pos.name.toLowerCase()

  for (const t of (query.must || [])) {
    if (!tags.has(t)) return -Infinity
  }
  for (const sub of (query.name_must || [])) {
    if (!name.includes(sub.toLowerCase())) return -Infinity
  }
  for (const sub of (query.name_avoid || [])) {
    if (name.includes(sub.toLowerCase())) return -Infinity
  }

  let score = (query.must || []).length * 10
  for (const t of (query.prefer || [])) {
    if (tags.has(t)) score += 5
  }
  for (const t of (query.avoid || [])) {
    if (tags.has(t)) score -= 8
  }
  for (const sub of (query.name_contains || [])) {
    if (name.includes(sub.toLowerCase())) score += 6
  }
  // Tie-breaker : moins de tags = position plus "pure"
  score -= pos.tags.length * 0.05
  return score
}

function findBestMatch(positions, query) {
  let best = null
  let bestScore = -Infinity
  for (const p of positions) {
    const s = scorePosition(p, query)
    if (s > bestScore) {
      bestScore = s
      best = p
    }
  }
  return best && bestScore > -Infinity ? { ...best, score: bestScore } : null
}

async function main() {
  await fs.mkdir(POSITIONS_DIR, { recursive: true })
  await fs.mkdir(CATEGORIES_DIR, { recursive: true })

  console.log('fetching GrappleMap.txt ...')
  const txt = await fetchText(GM_TXT_URL)
  const positions = parsePositions(txt)
  console.log(`parsed ${positions.length} positions`)

  const matches = {}
  for (const [localSlug, query] of Object.entries(POSITION_QUERIES)) {
    const m = findBestMatch(positions, query)
    if (!m) {
      console.warn(`[no-match] ${localSlug}`)
      continue
    }
    matches[localSlug] = m
    console.log(`  ${localSlug} -> p${m.id} "${m.name}" (score ${m.score.toFixed(1)})`)
  }

  // Cache : plusieurs slugs peuvent pointer vers le meme p{id}, on ne re-download pas
  const idCache = new Map()

  for (const [localSlug, m] of Object.entries(matches)) {
    let buf = idCache.get(m.id)
    if (buf === undefined) {
      const url = IMAGE_URL(m.id)
      console.log(`fetching ${url}`)
      buf = await fetchBuffer(url)
      idCache.set(m.id, buf)
    }
    if (!buf) {
      console.warn(`[skip] ${localSlug} : no image for p${m.id}`)
      continue
    }
    const out = path.join(POSITIONS_DIR, `${localSlug}.png`)
    await fs.writeFile(out, buf)
    console.log(`  wrote ${path.relative(ROOT, out)}`)
  }

  for (const [categorySlug, sourceLocal] of Object.entries(CATEGORY_MAP)) {
    const m = matches[sourceLocal]
    if (!m) {
      console.warn(`[skip] category ${categorySlug}: source ${sourceLocal} has no match`)
      continue
    }
    const buf = idCache.get(m.id)
    if (!buf) {
      console.warn(`[skip] category ${categorySlug}: no image`)
      continue
    }
    const out = path.join(CATEGORIES_DIR, `${categorySlug}.png`)
    await fs.writeFile(out, buf)
    console.log(`  wrote ${path.relative(ROOT, out)}`)
  }

  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
