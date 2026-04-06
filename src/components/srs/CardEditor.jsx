import { useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = [
  { value: 'guard_retention', label: 'Guard Retention' },
  { value: 'escapes', label: 'Escapes' },
  { value: 'half_guard_bottom', label: 'Half Guard Bottom' },
  { value: 'mount_top', label: 'Mount Top' },
  { value: 'side_control_top', label: 'Side Control Top' },
  { value: 'back_control', label: 'Back Control' },
  { value: 'standing', label: 'Standing' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'turtle', label: 'Turtle' },
]

const SOURCES = [
  { value: 'custom', label: 'Custom' },
  { value: 'submeta', label: 'Submeta' },
  { value: 'coach', label: 'Coach' },
]

export default function CardEditor({ onSave, onClose }) {
  const [form, setForm] = useState({
    position_name: '',
    category: 'guard_retention',
    situation: '',
    answer: '',
    cues: '',
    grappling_link: '',
    video_url: '',
    image_url: '',
    source: 'custom',
  })

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.position_name || !form.situation || !form.answer) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-dojo-bg w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dojo-border sticky top-0 bg-dojo-bg z-10">
          <h3 className="text-sm font-bold text-dojo-text">Nouvelle carte</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Field label="Position" required>
            <input
              value={form.position_name}
              onChange={(e) => update('position_name', e.target.value)}
              placeholder="Ex: Toreando defense"
              className="input-field"
            />
          </Field>

          <Field label="Categorie">
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Situation (recto)" required>
            <textarea
              value={form.situation}
              onChange={(e) => update('situation', e.target.value)}
              placeholder="Decris la situation..."
              rows={3}
              className="input-field resize-none"
            />
          </Field>

          <Field label="Reponse (verso)" required>
            <textarea
              value={form.answer}
              onChange={(e) => update('answer', e.target.value)}
              placeholder="Que fais-tu ?"
              rows={4}
              className="input-field resize-none"
            />
          </Field>

          <Field label="Cues techniques">
            <input
              value={form.cues}
              onChange={(e) => update('cues', e.target.value)}
              placeholder="Points cles a retenir"
              className="input-field"
            />
          </Field>

          <Field label="Lien grappling">
            <input
              value={form.grappling_link}
              onChange={(e) => update('grappling_link', e.target.value)}
              placeholder="Pourquoi c'est utile en combat"
              className="input-field"
            />
          </Field>

          <Field label="URL video">
            <input
              value={form.video_url}
              onChange={(e) => update('video_url', e.target.value)}
              placeholder="https://..."
              type="url"
              className="input-field"
            />
          </Field>

          <Field label="URL image">
            <input
              value={form.image_url}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https://... ou /images/srs/..."
              className="input-field"
            />
          </Field>

          <Field label="Source">
            <select
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              className="input-field"
            >
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-dojo-accent text-white font-bold text-sm hover:bg-dojo-accent-hover transition-colors border-none"
          >
            Ajouter la carte
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-dojo-muted block mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
