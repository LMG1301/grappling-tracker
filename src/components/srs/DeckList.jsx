import { useState } from 'react'
import { Plus, Eye, EyeOff, Search } from 'lucide-react'
import { CATEGORY_META, getCardStatus } from '../../lib/srs/deck'

const STATUS_LABELS = {
  new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  learning: { label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  mastered: { label: 'Maitrise', color: 'bg-green-100 text-green-700' },
}

export default function DeckList({ cards, onToggleActive, onAdd }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'new' | 'learning' | 'mastered'

  const filtered = cards.filter(card => {
    const matchSearch = !search ||
      card.position_name.toLowerCase().includes(search.toLowerCase()) ||
      card.situation.toLowerCase().includes(search.toLowerCase())
    const status = getCardStatus(card)
    const matchFilter = filter === 'all' || status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dojo-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-dojo-border text-sm text-dojo-text placeholder:text-dojo-muted/50 outline-none focus:border-dojo-accent"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {['all', 'new', 'learning', 'mastered'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors border-none ${
              filter === f
                ? 'bg-dojo-accent text-white'
                : 'bg-dojo-surface text-dojo-muted'
            }`}
          >
            {f === 'all' ? 'Toutes' : STATUS_LABELS[f]?.label}
          </button>
        ))}
      </div>

      {/* Cards list */}
      <div className="space-y-2">
        {filtered.map(card => {
          const status = getCardStatus(card)
          const statusMeta = STATUS_LABELS[status]
          const catMeta = CATEGORY_META[card.category]

          return (
            <div
              key={card.id}
              className={`bg-white rounded-xl border p-3 transition-all ${
                card.is_active ? 'border-dojo-border' : 'border-gray-200 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${catMeta?.color || 'bg-gray-100 text-gray-700'}`}>
                      {catMeta?.label}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusMeta?.color}`}>
                      {statusMeta?.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-dojo-text truncate">{card.position_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-dojo-muted">
                      Intervalle: {card.interval_days}j
                    </span>
                    {card.mat_tested > 0 && (
                      <span className="text-[10px] text-dojo-muted">
                        Mat: {card.mat_success}/{card.mat_tested}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onToggleActive(card.id, !card.is_active)}
                  className="p-1.5 rounded-lg hover:bg-dojo-surface transition-colors bg-transparent border-none text-dojo-muted"
                  title={card.is_active ? 'Desactiver' : 'Activer'}
                >
                  {card.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dojo-surface text-dojo-text font-semibold text-sm hover:bg-dojo-card transition-colors border border-dashed border-dojo-border"
      >
        <Plus className="w-4 h-4" />
        Ajouter une carte
      </button>
    </div>
  )
}
