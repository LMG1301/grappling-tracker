import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { ACTION_TYPES, ACTION_COLOR_MAP, ACTION_LABEL_MAP } from '../config/constants'

export default function TechniqueList({ techniques, getImageUrl, onSelect }) {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterPosition, setFilterPosition] = useState('')

  const positions = useMemo(
    () => [...new Set(techniques.map((t) => t.position))].sort(),
    [techniques]
  )

  const filtered = useMemo(() => {
    return techniques.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterAction && t.action_type !== filterAction) return false
      if (filterPosition && t.position !== filterPosition) return false
      return true
    })
  }, [techniques, search, filterAction, filterPosition])

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dojo-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une technique..."
            className="w-full bg-dojo-surface border border-dojo-border rounded-xl pl-10 pr-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="flex-1 bg-dojo-surface border border-dojo-border rounded-lg px-3 py-2 text-sm text-dojo-text appearance-none focus:outline-none focus:border-dojo-accent"
          >
            <option value="">Tous les types</option>
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="flex-1 bg-dojo-surface border border-dojo-border rounded-lg px-3 py-2 text-sm text-dojo-text appearance-none focus:outline-none focus:border-dojo-accent"
          >
            <option value="">Toutes positions</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-dojo-muted py-12">
            {techniques.length === 0 ? 'Aucune technique enregistree' : 'Aucun resultat'}
          </div>
        ) : (
          filtered.map((t) => {
            const imgUrl = getImageUrl(t.image_path)
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="w-full bg-dojo-surface border border-dojo-border rounded-xl p-3 flex items-center gap-3 hover:bg-dojo-card transition-colors text-left"
              >
                {imgUrl ? (
                  <img src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: ACTION_COLOR_MAP[t.action_type] + '33' }}
                  >
                    {t.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-dojo-text font-medium truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: ACTION_COLOR_MAP[t.action_type] }}
                    >
                      {ACTION_LABEL_MAP[t.action_type]}
                    </span>
                    <span className="text-xs text-dojo-muted truncate">{t.position}</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
