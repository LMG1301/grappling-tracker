import { useState } from 'react'
import { X, Trash2, Sparkles, Calendar } from 'lucide-react'

function formatDate(d, fmt = 'short') {
  if (!d) return ''
  const opts =
    fmt === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(d).toLocaleDateString('fr-FR', opts)
}

export default function JournalAnalysisHistory({ analyses, onClose, onOpen, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null)

  async function confirmDelete() {
    if (!pendingDelete) return
    await onDelete(pendingDelete)
    setPendingDelete(null)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-dojo-surface w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90dvh] flex flex-col border border-dojo-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-dojo-accent" />
            <h2 className="text-base font-semibold text-dojo-text">Mes syntheses</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {analyses.length === 0 ? (
            <p className="text-center text-sm text-dojo-muted py-8">
              Aucune synthese pour le moment.
            </p>
          ) : (
            analyses.map((a) => {
              const range =
                a.date_range_start && a.date_range_end && a.date_range_start !== a.date_range_end
                  ? `${formatDate(a.date_range_start)} → ${formatDate(a.date_range_end)}`
                  : formatDate(a.date_range_start)
              const preview = (a.synthesis || '').slice(0, 130).trim()
              return (
                <div
                  key={a.id}
                  className="bg-dojo-card border border-dojo-border rounded-xl p-3 flex gap-2"
                >
                  <button
                    onClick={() => onOpen(a)}
                    className="flex-1 text-left bg-transparent border-none p-0 min-w-0"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-dojo-muted">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(a.created_at, 'long')}</span>
                      <span>·</span>
                      <span>
                        {a.entry_count} entree{a.entry_count > 1 ? 's' : ''}
                      </span>
                      {range && (
                        <>
                          <span>·</span>
                          <span className="truncate">{range}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-dojo-text mt-1 leading-snug line-clamp-2">
                      {preview}
                      {a.synthesis && a.synthesis.length > 130 ? '…' : ''}
                    </p>
                  </button>
                  <button
                    onClick={() => setPendingDelete(a.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 bg-transparent border-none text-red-400 self-start"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {pendingDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-dojo-surface border border-dojo-border rounded-2xl p-5 max-w-sm w-full">
              <p className="text-sm text-dojo-text mb-4">
                Supprimer cette synthese ? Cette action est definitive.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="px-3 py-1.5 rounded-lg bg-dojo-card border border-dojo-border text-xs font-semibold text-dojo-muted"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold border-none"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
