import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Target, Shield, ArrowLeftRight, Plus, Check, X, Eye, RotateCcw, Library, BookOpen } from 'lucide-react'
import { useSkillTree } from '../../hooks/useSkillTree'
import TechniqueDetail from '../TechniqueDetail'

// --- Helpers visuels ---

function actionTypeIcon(type) {
  const map = {
    submission: '🔒',
    sweep: '↻',
    pass: '→',
    escape: '↗',
    transition: '⇄',
    takedown: '↧',
    control: '◉',
    drill: '⚙',
    principle: '✦',
    defense: '⛨',
  }
  return map[type] || '•'
}

function categoryColor(category, deep = false) {
  return deep ? category.color_deep_hex : category.color_hex
}

function masteryPercent(technique) {
  const reps = technique?.srs_repetitions || 0
  if (reps <= 0) return 0
  if (reps === 1) return 25
  if (reps === 2) return 50
  if (reps === 3) return 75
  return 100
}

function PositionImage({ slug, blurred = false, className = '' }) {
  const [errored, setErrored] = useState(false)
  if (!slug || errored) {
    return (
      <div className={`flex items-center justify-center bg-dojo-bg text-dojo-muted ${className}`}>
        <BookOpen className="w-6 h-6 opacity-40" />
      </div>
    )
  }
  return (
    <div className={`relative bg-dojo-bg overflow-hidden ${className}`}>
      <img
        src={`/images/positions/${slug}.png`}
        alt=""
        onError={() => setErrored(true)}
        className={`w-full h-full object-contain transition-[filter] duration-300 ${blurred ? 'blur-xl scale-110' : ''}`}
      />
    </div>
  )
}

function Donut({ value, color, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-dojo-border" strokeWidth={stroke} />
        {value != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-dojo-text">
        {value == null ? '–' : `${value}%`}
      </div>
    </div>
  )
}

function MasteryGauge({ value, color }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-dojo-muted">
        <span>Maitrise</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-dojo-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function TechniqueCard({ entry, color, onClick, onOpenDetail, compact = false }) {
  const t = entry.technique
  if (!t) return null
  const matRate =
    t.mat_tested > 0 ? Math.round((t.mat_success / t.mat_tested) * 100) : null

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`bg-dojo-card border rounded-2xl p-4 flex flex-col gap-2 ${compact ? '' : 'min-h-[120px]'}`}
      style={{ borderColor: color, borderWidth: 2 }}
    >
      <button
        onClick={onClick}
        className="text-left bg-transparent border-none p-0 flex flex-col gap-2 flex-1"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-dojo-muted flex items-center gap-1">
              <span>{actionTypeIcon(t.action_type)}</span>
              <span>{t.action_type || 'technique'}</span>
            </div>
            <div className="text-base font-bold text-dojo-text mt-0.5 leading-tight">
              {t.name}
            </div>
          </div>
          {entry.slot && (
            <div
              className="text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {entry.slot}
            </div>
          )}
        </div>
        {!compact && (
          <div className="flex items-center justify-between text-xs text-dojo-muted mt-auto">
            <div>
              {t.mat_tested > 0 ? (
                <>
                  <span className="font-semibold text-dojo-text">
                    {t.mat_success}/{t.mat_tested}
                  </span>
                  <span className="ml-1">tapis</span>
                </>
              ) : (
                <span>jamais tente</span>
              )}
            </div>
            {matRate != null && (
              <div className="font-semibold" style={{ color }}>{matRate}%</div>
            )}
          </div>
        )}
      </button>
      {onOpenDetail && (
        <button
          onClick={onOpenDetail}
          className="text-[11px] font-semibold text-dojo-muted underline bg-transparent border-none self-start"
        >
          Voir la fiche
        </button>
      )}
    </motion.div>
  )
}

function EmptySlotCard({ slot, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-dojo-card border-2 border-dashed rounded-2xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2 text-dojo-muted hover:bg-dojo-surface transition-colors"
      style={{ borderColor: color }}
    >
      <Plus className="w-5 h-5" />
      <div className="text-xs font-semibold">Slot {slot} vide</div>
      <div className="text-[10px]">Ajouter une carte</div>
    </button>
  )
}

// ============================================================================
// VUE 1 : HOME — Toutes les categories et positions sur un seul ecran
// ============================================================================

function PositionTile({ position, category, stats, onClick }) {
  const isEmpty = stats.techniquesCount === 0
  const color = categoryColor(category)
  return (
    <button
      onClick={() => !isEmpty && onClick()}
      disabled={isEmpty}
      className={`bg-dojo-card border rounded-xl p-3 text-left transition-opacity flex flex-col gap-2 min-h-[110px] relative ${isEmpty ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md'}`}
      style={{ borderColor: color, borderWidth: 2 }}
    >
      {stats.dueCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow">
          {stats.dueCount} due{stats.dueCount > 1 ? 's' : ''}
        </span>
      )}
      <div className="flex items-start gap-2">
        <Donut value={stats.successRate} color={color} size={36} stroke={3} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-dojo-text leading-tight line-clamp-2">
            {position.name}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-dojo-muted mt-auto">
        {stats.techniquesCount} tech · {stats.tested} essais
      </div>
    </button>
  )
}

function CategorySection({ category, positions, positionStats, categoryStats, onSelectPosition }) {
  const stats = categoryStats(category.id)
  const positionsInCat = positions.filter((p) => p.category_id === category.id)
  const color = categoryColor(category)

  return (
    <section className="space-y-3">
      <div
        className="bg-dojo-card border-2 rounded-2xl p-4 flex items-center gap-4"
        style={{ borderColor: color }}
      >
        <Donut value={stats.successRate} color={color} size={56} stroke={5} />
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-dojo-text leading-tight">{category.name}</div>
          <div className="text-[11px] text-dojo-muted mt-1">
            {positionsInCat.length} positions · {stats.positionsWithContent} avec contenu · {stats.totalTested} essais
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {positionsInCat.map((p) => (
          <PositionTile
            key={p.id}
            position={p}
            category={category}
            stats={positionStats(p.id)}
            onClick={() => onSelectPosition(p, category)}
          />
        ))}
      </div>
    </section>
  )
}

function SkillTreeHome({ categories, positions, positionStats, categoryStats, onSelectPosition }) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="text-sm text-dojo-muted">
        Tape une position pour entrer en mode jeu. Le badge rouge signale des techniques a reviser.
      </div>
      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          positions={positions}
          positionStats={positionStats}
          categoryStats={categoryStats}
          onSelectPosition={onSelectPosition}
        />
      ))}
    </div>
  )
}

// ============================================================================
// VUE 2 : LIBRARY (PositionDetail) — accessible depuis le mode jeu
// ============================================================================

function LibraryView({ position, category, library, positionStats, onBack, onSwap, onOpenTechnique }) {
  const [swapping, setSwapping] = useState(null)

  const stats = positionStats(position.id)
  const entries = library.filter((l) => l.position_id === position.id)
  const activeSlots = [1, 2, 3].map((slot) =>
    entries.find((e) => e.slot === slot) || null
  )
  const inactive = entries.filter((e) => e.slot == null)
  const color = categoryColor(category)
  const activeCount = activeSlots.filter(Boolean).length

  async function handleSwapPick(toTechniqueId) {
    if (!swapping) return
    await onSwap({
      positionId: position.id,
      fromTechniqueId: swapping,
      toTechniqueId,
    })
    setSwapping(null)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-dojo-border bg-dojo-surface">
        <button onClick={onBack} className="p-1 -ml-1 text-dojo-muted bg-transparent border-none">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
            {category.name} · Bibliotheque
          </div>
          <div className="text-base font-bold text-dojo-text truncate">{position.name}</div>
        </div>
        <Donut value={stats.successRate} color={color} size={42} stroke={4} />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {position.description && (
          <div className="text-xs text-dojo-muted italic leading-relaxed">
            {position.description}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" style={{ color }} />
            <h2 className="text-sm font-bold text-dojo-text">Cartes actives</h2>
            <div className="text-[10px] text-dojo-muted ml-auto">
              {activeCount}/3
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeSlots.map((entry, idx) => {
              const slot = idx + 1
              if (!entry) {
                return <EmptySlotCard key={slot} slot={slot} color={color} onClick={() => {}} />
              }
              return (
                <div key={entry.id} className="relative">
                  <TechniqueCard
                    entry={entry}
                    color={color}
                    onClick={() => onOpenTechnique(entry.technique, position.id)}
                    onOpenDetail={() => onOpenTechnique(entry.technique, position.id)}
                  />
                  {inactive.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSwapping(entry.technique_id)
                      }}
                      className="absolute top-2 right-2 bg-dojo-surface border border-dojo-border rounded-full p-1 shadow-sm"
                      title="Remplacer cette carte"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-dojo-muted" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {inactive.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-dojo-muted" />
              <h2 className="text-sm font-bold text-dojo-text">Bibliotheque</h2>
              <div className="text-[10px] text-dojo-muted ml-auto">
                {inactive.length} disponibles
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inactive.map((entry) => (
                <TechniqueCard
                  key={entry.id}
                  entry={entry}
                  color={color}
                  onClick={() => onOpenTechnique(entry.technique, position.id)}
                  onOpenDetail={() => onOpenTechnique(entry.technique, position.id)}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {swapping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSwapping(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-dojo-card rounded-2xl p-4 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-dojo-text">Remplacer par</h3>
                  <div className="text-xs text-dojo-muted">Choisis une carte de la bibliotheque</div>
                </div>
                <button onClick={() => setSwapping(null)} className="p-1 bg-transparent border-none text-dojo-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto space-y-2 flex-1">
                {inactive.map((entry) => (
                  <TechniqueCard
                    key={entry.id}
                    entry={entry}
                    color={color}
                    onClick={() => handleSwapPick(entry.technique_id)}
                    compact
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// VUE 3 : PLAY — Mode jeu vertical avec evaluation SRS
// ============================================================================

const SRS_BUTTONS = [
  { rating: 1, label: 'A revoir', shortcut: '1', bg: '#dc2626', text: 'white' },
  { rating: 2, label: 'Difficile', shortcut: '2', bg: '#f59e0b', text: 'white' },
  { rating: 3, label: 'Bien', shortcut: '3', useColor: true, text: 'white' },
  { rating: 4, label: 'Maitrise', shortcut: '4', bg: '#16a34a', text: 'white' },
]

function PlayMode({ position, category, library, onBack, onOpenLibrary, onOpenTechnique, onSrsRate, onLogCombat }) {
  const color = categoryColor(category)
  const entries = library.filter((l) => l.position_id === position.id)
  const activeEntries = useMemo(
    () => [1, 2, 3].map((slot) => entries.find((e) => e.slot === slot)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [position.id, library.length]
  )

  const [cardStates, setCardStates] = useState(() =>
    activeEntries.map(() => ({ revealed: false, rated: null }))
  )
  const [logging, setLogging] = useState(null)

  function reveal(idx) {
    setCardStates((prev) => prev.map((s, i) => (i === idx ? { ...s, revealed: true } : s)))
  }

  async function handleRate(idx, rating, techniqueId) {
    setCardStates((prev) => prev.map((s, i) => (i === idx ? { ...s, rated: rating } : s)))
    await onSrsRate({ techniqueId, rating })
  }

  function reset() {
    setCardStates(activeEntries.map(() => ({ revealed: false, rated: null })))
  }

  async function handleLog(succeeded) {
    if (!logging) return
    await onLogCombat({
      techniqueId: logging,
      positionId: position.id,
      succeeded,
    })
    setLogging(null)
  }

  if (activeEntries.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-dojo-border bg-dojo-surface">
          <button onClick={onBack} className="p-1 -ml-1 text-dojo-muted bg-transparent border-none">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
              Mode jeu
            </div>
            <div className="text-base font-bold text-dojo-text truncate">{position.name}</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="text-sm text-dojo-muted">
            Aucune carte active sur cette position. Ouvre la bibliotheque pour assigner des cartes aux 3 slots.
          </div>
          <button
            onClick={onOpenLibrary}
            className="rounded-xl py-3 px-5 font-bold text-white border-none flex items-center gap-2"
            style={{ backgroundColor: color }}
          >
            <Library className="w-4 h-4" />
            Ouvrir la bibliotheque
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-dojo-border bg-dojo-surface">
        <button onClick={onBack} className="p-1 -ml-1 text-dojo-muted bg-transparent border-none">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
            Mode jeu
          </div>
          <div className="text-base font-bold text-dojo-text truncate">{position.name}</div>
        </div>
        <button
          onClick={onOpenLibrary}
          className="p-2 bg-dojo-card border border-dojo-border rounded-lg text-dojo-muted"
          title="Bibliotheque"
        >
          <Library className="w-4 h-4" />
        </button>
        <button
          onClick={reset}
          className="p-2 bg-dojo-card border border-dojo-border rounded-lg text-dojo-muted"
          title="Recommencer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="bg-dojo-card border border-dojo-border rounded-xl p-3">
          <div className="text-xs font-bold text-dojo-text mb-1">
            Tu es en {position.name}.
          </div>
          <div className="text-xs text-dojo-muted leading-relaxed">
            Quelles sont tes 3 options principales depuis cette position ? Reflechis avant de reveler.
          </div>
        </div>

        <div className="space-y-4">
          {activeEntries.map((entry, idx) => {
            const state = cardStates[idx]
            const t = entry.technique
            const mastery = masteryPercent(t)
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-dojo-card border-2 rounded-2xl overflow-hidden"
                style={{ borderColor: color }}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-dojo-muted">
                      Carte {idx + 1}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-dojo-muted flex items-center gap-1">
                      <span>{actionTypeIcon(t.action_type)}</span>
                      <span>{t.action_type}</span>
                    </div>
                  </div>

                  {!state.revealed ? (
                    <button
                      onClick={() => reveal(idx)}
                      className="w-full py-6 px-4 bg-dojo-surface border-2 border-dashed border-dojo-border rounded-xl flex flex-col items-center gap-2 hover:bg-dojo-card transition-colors"
                    >
                      <div className="text-2xl font-bold text-dojo-muted tracking-widest blur-sm select-none">
                        ▓▓▓▓▓▓▓▓▓
                      </div>
                      <div className="flex items-center gap-2 text-dojo-muted text-xs font-semibold">
                        <Eye className="w-4 h-4" />
                        Toucher pour reveler
                      </div>
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3"
                    >
                      <div className="text-xl font-bold text-dojo-text leading-tight">
                        {t.name}
                      </div>

                      <MasteryGauge value={mastery} color={color} />

                      {state.rated === null ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {SRS_BUTTONS.map((btn) => (
                            <button
                              key={btn.rating}
                              onClick={() => handleRate(idx, btn.rating, t.id)}
                              className="rounded-xl py-3 px-2 flex flex-col items-center gap-0.5 border-none text-white font-bold"
                              style={{ backgroundColor: btn.useColor ? color : btn.bg }}
                            >
                              <div className="text-sm">{btn.label}</div>
                              <div className="text-[9px] opacity-75">[{btn.shortcut}]</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-dojo-muted">
                          Note: {SRS_BUTTONS.find((b) => b.rating === state.rated)?.label}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          onClick={() => onOpenTechnique(t, position.id)}
                          className="font-semibold text-dojo-muted underline bg-transparent border-none"
                        >
                          Voir la fiche
                        </button>
                        <button
                          onClick={() => setLogging(t.id)}
                          className="font-semibold text-dojo-muted underline bg-transparent border-none"
                        >
                          Logger au tapis
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Illustration de la position de base, sous les cartes */}
        <div className="flex justify-center pt-2">
          <PositionImage
            slug={position.slug}
            className="w-full max-w-xs aspect-[4/3] rounded-xl border border-dojo-border"
          />
        </div>
      </div>

      <AnimatePresence>
        {logging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setLogging(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-dojo-card rounded-2xl p-5"
            >
              <h3 className="text-base font-bold text-dojo-text mb-1">Log au tapis</h3>
              <div className="text-xs text-dojo-muted mb-4">
                Tu as tente cette technique au sparring. Resultat ?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLog(false)}
                  className="bg-dojo-surface border-2 border-dojo-border rounded-xl py-4 flex flex-col items-center gap-1 text-dojo-text"
                >
                  <X className="w-6 h-6 text-red-500" />
                  <div className="text-sm font-bold">Echec</div>
                </button>
                <button
                  onClick={() => handleLog(true)}
                  className="border-2 rounded-xl py-4 flex flex-col items-center gap-1"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  <Check className="w-6 h-6 text-white" />
                  <div className="text-sm font-bold text-white">Reussi</div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function SkillTreePage() {
  const skillTree = useSkillTree()
  const { categories, positions, library, loading, positionStats, categoryStats, swapSlot, logCombat, srsRate, getImageUrl } = skillTree

  const [subView, setSubView] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [openedTechnique, setOpenedTechnique] = useState(null)
  const [openedTechniquePositionId, setOpenedTechniquePositionId] = useState(null)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function openTechnique(technique, positionId) {
    setOpenedTechnique(technique)
    setOpenedTechniquePositionId(positionId)
  }

  function closeTechnique() {
    setOpenedTechnique(null)
    setOpenedTechniquePositionId(null)
  }

  let content
  if (subView === 'library' && selectedPosition && selectedCategory) {
    content = (
      <LibraryView
        position={selectedPosition}
        category={selectedCategory}
        library={library}
        positionStats={positionStats}
        onBack={() => setSubView('play')}
        onSwap={swapSlot}
        onOpenTechnique={openTechnique}
      />
    )
  } else if (subView === 'play' && selectedPosition && selectedCategory) {
    content = (
      <PlayMode
        position={selectedPosition}
        category={selectedCategory}
        library={library}
        onBack={() => {
          setSelectedPosition(null)
          setSelectedCategory(null)
          setSubView('home')
        }}
        onOpenLibrary={() => setSubView('library')}
        onOpenTechnique={openTechnique}
        onSrsRate={srsRate}
        onLogCombat={logCombat}
      />
    )
  } else {
    content = (
      <SkillTreeHome
        categories={categories}
        positions={positions}
        positionStats={positionStats}
        categoryStats={categoryStats}
        onSelectPosition={(p, cat) => {
          setSelectedCategory(cat)
          setSelectedPosition(p)
          setSubView('play')
        }}
      />
    )
  }

  return (
    <>
      {content}
      {openedTechnique && (
        <TechniqueDetail
          technique={openedTechnique}
          imageUrl={getImageUrl(openedTechnique.image_path)}
          onClose={closeTechnique}
          onLogCombat={async (succeeded) => {
            await logCombat({
              techniqueId: openedTechnique.id,
              positionId: openedTechniquePositionId,
              succeeded,
            })
            closeTechnique()
          }}
        />
      )}
    </>
  )
}
