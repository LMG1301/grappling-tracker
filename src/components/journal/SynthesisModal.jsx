import { motion } from 'framer-motion'
import { X, Sparkles, History, CheckCircle } from 'lucide-react'

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function SynthesisModal({ analysis, onClose, onOpenHistory, savedOk }) {
  const { entry_count, date_range_start, date_range_end, synthesis } = analysis

  const range =
    date_range_start && date_range_end && date_range_start !== date_range_end
      ? `${formatDate(date_range_start)} → ${formatDate(date_range_end)}`
      : formatDate(date_range_start) || ''

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dojo-surface w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90dvh] flex flex-col border border-dojo-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-dojo-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-dojo-text leading-tight">
                Synthese de {entry_count} entree{entry_count > 1 ? 's' : ''}
              </h2>
              {range && <p className="text-[11px] text-dojo-muted truncate">{range}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-sm max-w-none">
            {synthesis.split(/\n\s*\n/).map((para, i) => (
              <p
                key={i}
                className="text-[14px] text-dojo-text leading-[1.7] mb-4 whitespace-pre-wrap"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="border-t border-dojo-border px-4 py-3 flex items-center justify-between gap-2 flex-wrap bg-dojo-surface">
          {savedOk !== false && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Sauvegardee dans tes syntheses
            </div>
          )}
          {savedOk === false && (
            <div className="text-[11px] text-amber-600">Affichee mais non sauvegardee</div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="px-3 py-1.5 rounded-lg bg-dojo-card border border-dojo-border text-xs font-semibold text-dojo-muted flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Mes syntheses
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-dojo-accent text-white text-xs font-bold border-none"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
