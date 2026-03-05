import { useState } from 'react'
import { Plus, X, Pencil, Trash2, Calendar, ChevronDown } from 'lucide-react'

const MOODS = [
  { value: 'great', label: 'Super', emoji: '🔥' },
  { value: 'good', label: 'Bien', emoji: '💪' },
  { value: 'ok', label: 'OK', emoji: '👊' },
  { value: 'tough', label: 'Dur', emoji: '😤' },
  { value: 'bad', label: 'Mauvais', emoji: '😞' },
]

function JournalForm({ onSubmit, onClose, initialData }) {
  const [entryDate, setEntryDate] = useState(initialData?.entry_date || new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [mood, setMood] = useState(initialData?.mood || '')
  const [techniquesWorked, setTechniquesWorked] = useState(initialData?.techniques_worked?.join(', ') || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const techniques = techniquesWorked.trim()
        ? techniquesWorked.split(',').map((t) => t.trim()).filter(Boolean)
        : null
      await onSubmit({
        entry_date: entryDate,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        techniques_worked: techniques,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-dojo-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto border border-dojo-border">
        <div className="sticky top-0 bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">{initialData ? 'Modifier' : 'Nouvelle entree'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Date *</label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Titre (optionnel)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cours du lundi, Open mat..."
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-2">Humeur</label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? '' : m.value)}
                  className={`flex-1 py-2 rounded-lg text-center transition-all border ${
                    mood === m.value
                      ? 'border-dojo-accent bg-dojo-accent/10 text-dojo-text'
                      : 'border-dojo-border bg-dojo-bg text-dojo-muted hover:border-dojo-accent/50'
                  }`}
                >
                  <div className="text-lg">{m.emoji}</div>
                  <div className="text-xs mt-0.5">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Ce que j'ai travaille *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ce qui s'est passe a l'entrainement, ce que j'en retiens..."
              rows={5}
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Techniques travaillees (optionnel)</label>
            <input
              type="text"
              value={techniquesWorked}
              onChange={(e) => setTechniquesWorked(e.target.value)}
              placeholder="Kimura, Triangle, Armbar... (separees par des virgules)"
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-full bg-dojo-accent hover:bg-dojo-accent-hover disabled:opacity-50 text-white font-medium py-4 rounded-lg transition-colors text-lg border-none"
          >
            {submitting ? 'Enregistrement...' : initialData ? 'Mettre a jour' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EntryCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const moodInfo = MOODS.find((m) => m.value === entry.mood)

  return (
    <div className="bg-dojo-surface border border-dojo-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left bg-transparent border-none text-dojo-text"
      >
        {moodInfo && <span className="text-xl mt-0.5">{moodInfo.emoji}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-dojo-muted mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(entry.entry_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {entry.title && <div className="font-semibold truncate">{entry.title}</div>}
          {!expanded && (
            <p className="text-sm text-dojo-muted mt-1 line-clamp-2">{entry.content}</p>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-dojo-muted transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-dojo-text whitespace-pre-wrap leading-relaxed text-sm">{entry.content}</p>

          {entry.techniques_worked?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.techniques_worked.map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-dojo-accent/10 text-dojo-accent rounded-full text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dojo-card border border-dojo-border rounded-lg text-sm text-dojo-muted hover:text-dojo-text transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button
              onClick={() => {
                if (window.confirm('Supprimer cette entree ?')) onDelete(entry.id)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dojo-card border border-dojo-border rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JournalPage({ entries, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  function handleEdit(entry) {
    setEditingEntry(entry)
    setShowForm(true)
  }

  async function handleSubmit(data) {
    if (editingEntry) {
      await onUpdate(editingEntry.id, data)
    } else {
      await onAdd(data)
    }
  }

  function handleClose() {
    setShowForm(false)
    setEditingEntry(null)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto p-4 space-y-3">
        <button
          onClick={() => { setEditingEntry(null); setShowForm(true) }}
          className="w-full flex items-center justify-center gap-2 bg-dojo-accent/10 border border-dashed border-dojo-accent/40 rounded-xl py-4 text-dojo-accent font-medium hover:bg-dojo-accent/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle entree
        </button>

        {entries.length === 0 && (
          <p className="text-center text-dojo-muted py-8 text-sm">Aucune entree pour le moment. Commence a noter tes entrainements !</p>
        )}

        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={handleEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {showForm && (
        <JournalForm
          onSubmit={handleSubmit}
          onClose={handleClose}
          initialData={editingEntry}
        />
      )}
    </div>
  )
}
