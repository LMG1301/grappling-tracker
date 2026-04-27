import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Target, Shield, ArrowLeftRight, RefreshCcw, Plus, Check, X } from 'lucide-react'
import { useSkillTree } from '../../hooks/useSkillTree'

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

// Donut SVG simple pour afficher un pourcentage
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

// --- Carte technique (style textuel, sans illustration pour l'instant) ---

function TechniqueCard({ entry, color, onClick, compact = false }) {
  const t = entry.technique
  if (!t) return null
  const matRate =
    t.mat_tested > 0 ? Math.round((t.mat_success / t.mat_tested) * 100) : null

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`text-left bg-dojo-card border rounded-2xl p-4 transition-shadow hover:shadow-md flex flex-col gap-2 ${compact ? '' : 'min-h-[120px]'}`}
      style={{ borderColor: color, borderWidth: 2 }}
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
    </motion.button>
  )
}

// --- Carte slot vide (placeholder) ---

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
// VUE 1 : HOME — Grille des 4 categories
// ============================================================================

function CategoryGrid({ categories, positions, categoryStats, onSelectCategory }) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      <div className="text-sm text-dojo-muted mb-2">
        Choisis une categorie pour voir les positions et tes cartes actives.
      </div>
      {categories.map((cat) => {
        const stats = categoryStats(cat.id)
        const positionsInCat = positions.filter((p) => p.category_id === cat.id)
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory(cat)}
            className="w-full bg-dojo-card border rounded-2xl p-4 flex items-center gap-4 text-left"
            style={{ borderColor: categoryColor(cat), borderWidth: 2 }}
          >
            <Donut value={stats.successRate} color={categoryColor(cat)} size={64} />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-dojo-text">{cat.name}</div>
              <div className="text-xs text-dojo-muted mt-1">
                {positionsInCat.length} positions ·{' '}
                {stats.positionsWithContent} avec contenu ·{' '}
                {stats.totalTested} essais
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-dojo-muted shrink-0" />
          </motion.button>
        )
      })}
    </div>
  )
}

// ============================================================================
// VUE 2 : CATEGORY — Liste des positions d'une categorie
// ============================================================================

function PositionList({ category, positions, positionStats, onBack, onSelectPosition }) {
  const positionsInCat = positions.filter((p) => p.category_id === category.id)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-dojo-border bg-dojo-surface">
        <button onClick={onBack} className="p-1 -ml-1 text-dojo-muted bg-transparent border-none">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-base font-bold text-dojo-text">{category.name}</div>
          <div className="text-xs text-dojo-muted">{positionsInCat.length} positions</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {positionsInCat.map((p) => {
          const stats = positionStats(p.id)
          const isEmpty = stats.techniquesCount === 0
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => !isEmpty && onSelectPosition(p)}
              disabled={isEmpty}
              className={`w-full bg-dojo-card border rounded-xl p-3 flex items-center gap-3 text-left transition-opacity ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ borderColor: categoryColor(category) }}
            >
              <Donut value={stats.successRate} color={categoryColor(category)} size={48} stroke={4} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-dojo-text">{p.name}</div>
                <div className="text-[11px] text-dojo-muted leading-tight mt-0.5 line-clamp-2">
                  {isEmpty ? 'Vide. Ajoute des techniques pour debloquer.' : p.description}
                </div>
                <div className="text-[10px] text-dojo-muted mt-1">
                  {stats.techniquesCount} techniques · {stats.tested} essais
                </div>
              </div>
              {!isEmpty && <ChevronRight className="w-4 h-4 text-dojo-muted shrink-0" />}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// VUE 3 : POSITION DETAIL — 3 slots actifs + bibliotheque + swap
// ============================================================================

function PositionDetail({ position, category, library, positionStats, onBack, onSwap, onLogCombat }) {
  const [swapping, setSwapping] = useState(null)
  const [logging, setLogging] = useState(null)

  const stats = positionStats(position.id)
  const entries = library.filter((l) => l.position_id === position.id)
  const activeSlots = [1, 2, 3].map((slot) =>
    entries.find((e) => e.slot === slot) || null
  )
  const inactive = entries.filter((e) => e.slot == null)
  const color = categoryColor(category)

  async function handleSwapPick(toTechniqueId) {
    if (!swapping) return
    await onSwap({
      positionId: position.id,
      fromTechniqueId: swapping,
      toTechniqueId,
    })
    setSwapping(null)
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-dojo-border bg-dojo-surface">
        <button onClick={onBack} className="p-1 -ml-1 text-dojo-muted bg-transparent border-none">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
            {category.name}
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
              {activeSlots.filter(Boolean).length}/3
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
                    onClick={() => setLogging(entry.technique_id)}
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
                  onClick={() => setLogging(entry.technique_id)}
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
                  <div className="text-[10px] text-dojo-muted">tente, pas reussi</div>
                </button>
                <button
                  onClick={() => handleLog(true)}
                  className="border-2 rounded-xl py-4 flex flex-col items-center gap-1"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  <Check className="w-6 h-6 text-white" />
                  <div className="text-sm font-bold text-white">Reussi</div>
                  <div className="text-[10px] text-white/80">tente et reussi</div>
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
  const { categories, positions, library, loading, positionStats, categoryStats, swapSlot, logCombat } = skillTree

  const [subView, setSubView] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (subView === 'position' && selectedPosition && selectedCategory) {
    return (
      <PositionDetail
        position={selectedPosition}
        category={selectedCategory}
        library={library}
        positionStats={positionStats}
        onBack={() => {
          setSelectedPosition(null)
          setSubView('category')
        }}
        onSwap={swapSlot}
        onLogCombat={logCombat}
      />
    )
  }

  if (subView === 'category' && selectedCategory) {
    return (
      <PositionList
        category={selectedCategory}
        positions={positions}
        positionStats={positionStats}
        onBack={() => {
          setSelectedCategory(null)
          setSubView('home')
        }}
        onSelectPosition={(p) => {
          setSelectedPosition(p)
          setSubView('position')
        }}
      />
    )
  }

  return (
    <CategoryGrid
      categories={categories}
      positions={positions}
      categoryStats={categoryStats}
      onSelectCategory={(cat) => {
        setSelectedCategory(cat)
        setSubView('category')
      }}
    />
  )
}
