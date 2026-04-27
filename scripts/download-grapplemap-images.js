#!/usr/bin/env node
// Telecharge un snapshot PNG des positions de GrappleMap (eel.is/GrappleMap),
// projet en domaine public, et copie 4 images vers public/images/categories/.
//
// Usage : npm run download-images
// Prerequis : `npm install` (installe puppeteer en devDependency).

import puppeteer from 'puppeteer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')
const POSITIONS_DIR = path.join(ROOT, 'public', 'images', 'positions')
const CATEGORIES_DIR = path.join(ROOT, 'public', 'images', 'categories')

// slug local (Supabase) -> slug GrappleMap
const POSITION_MAP = {
  standing_neutral: 'standing',
  front_headlock: 'front_headlock',
  single_leg: 'single_leg',
  double_leg: 'double_leg',
  snap_down: 'front_headlock',
  sprawl: 'sprawl',
  body_lock: 'bodylock',
  two_on_one: 'standing',
  closed_guard_top: 'closed_guard_top',
  open_guard_top: 'open_guard_top',
  half_guard_top: 'half_guard_top',
  side_control_top: 'side_control',
  mount_top: 'mount',
  north_south_top: 'north_south',
  knee_on_belly: 'knee_on_belly',
  back_control: 'back_control',
  turtle_top: 'turtle_top',
  closed_guard_bottom: 'closed_guard',
  butterfly_guard: 'butterfly_guard',
  half_guard_bottom: 'half_guard',
  z_guard: 'z_guard',
  x_guard: 'x_guard',
  single_leg_x: 'single_leg_x',
  seated_open_guard: 'seated_guard',
  supine_guard: 'supine_guard',
  side_control_bottom: 'side_control_bottom',
  mount_bottom: 'mount_bottom',
  back_taken: 'back_taken',
  turtle_bottom: 'turtle',
  north_south_bottom: 'north_south_bottom',
  kob_bottom: 'knee_on_belly_bottom',
  scramble: 'scramble',
  leg_entanglement: 'leg_entanglement',
  dogfight: 'dogfight',
}

// categorie -> slug local (sera copie depuis le PNG positions correspondant)
const CATEGORY_MAP = {
  standing: 'standing_neutral',
  on_top: 'mount_top',
  on_bottom: 'closed_guard_bottom',
  transitions: 'scramble',
}

async function captureCanvas(browser, slug) {
  const url = `http://eel.is/GrappleMap/p/${slug}`
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 2 })
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    if (!response || response.status() === 404) {
      console.warn(`[skip] 404 for ${slug}`)
      await page.close()
      return null
    }
    // Le canvas WebGL met du temps a rendre le stick figure
    await page.waitForSelector('canvas', { timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2500))
    const canvas = await page.$('canvas')
    if (!canvas) {
      console.warn(`[skip] no canvas for ${slug}`)
      await page.close()
      return null
    }
    const buffer = await canvas.screenshot({ type: 'png', omitBackground: false })
    await page.close()
    return buffer
  } catch (err) {
    console.warn(`[skip] ${slug}: ${err.message}`)
    try { await page.close() } catch {}
    return null
  }
}

async function main() {
  await fs.mkdir(POSITIONS_DIR, { recursive: true })
  await fs.mkdir(CATEGORIES_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'new' })
  const localToBuffer = new Map()

  // Cache des slugs GrappleMap deja telecharges (plusieurs locaux peuvent
  // pointer vers le meme slug GrappleMap).
  const remoteCache = new Map()

  for (const [localSlug, remoteSlug] of Object.entries(POSITION_MAP)) {
    let buffer = remoteCache.get(remoteSlug)
    if (buffer === undefined) {
      console.log(`fetching ${remoteSlug} ...`)
      buffer = await captureCanvas(browser, remoteSlug)
      remoteCache.set(remoteSlug, buffer)
    }
    if (!buffer) continue
    const out = path.join(POSITIONS_DIR, `${localSlug}.png`)
    await fs.writeFile(out, buffer)
    localToBuffer.set(localSlug, buffer)
    console.log(`  wrote ${path.relative(ROOT, out)}`)
  }

  for (const [categorySlug, sourceLocal] of Object.entries(CATEGORY_MAP)) {
    const buffer = localToBuffer.get(sourceLocal)
    if (!buffer) {
      console.warn(`[skip] category ${categorySlug}: source ${sourceLocal} missing`)
      continue
    }
    const out = path.join(CATEGORIES_DIR, `${categorySlug}.png`)
    await fs.writeFile(out, buffer)
    console.log(`  wrote ${path.relative(ROOT, out)}`)
  }

  await browser.close()
  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
