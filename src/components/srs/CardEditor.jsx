import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ImagePicker from './ImagePicker'

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
  { value: 'coach', label: 'Coach' },
  { value: 'submeta', label: 'Submeta' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'custom', label: 'Custom' },
]

export default function CardEditor({ initialData, onSave, onDelete, onClose }) {
  const isEdit = !!initialData?.id
  const positionRef = useRef(null)

  const [form, setForm] = useState({
    position_name: initialData?.position_name || '',
    category: initialData?.category || 'guard_retention',
    situation: initialData?.situation || '',
    answer: initialData?.answer || '',
    cues: initialData?.cues || '',
    grappling_link: initialData?.grappling_link || '',
    video_url: initialData?.video_url || '',
    image_url: initialData?.image_url || '',
    source: initialData?.source || 'coach',
  })

  const [showMore, setShowMore] = useState(!!(form.cues || form.source !== 'coach'))
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const isDirty = form.position_name || form.situation || form.answer || form.image_url
  const canSave = form.position_name && form.situation && form.answer

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    if (isDirty && !isEdit) {
      if (!confirm('Tu as des modifications non sauvegardees. Quitter ?')) return
    }
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSave || saving) return

    setSaving(true)
    try {
      await onSave(form, isEdit ? initialData.id : null)
      setToast('Carte ' + (isEdit ? 'modifiee' : 'ajoutee'))
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error('Save failed:', err)
      setToast('Erreur de sauvegarde')
      setTimeout(() => setToast(null), 2000)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    if (onDelete && initialData?.id) {
      await onDelete(initialData.id)
      onClose()
    }
  }

  // Auto-focus position after image selected
  useEffect(() => {
    if (form.image_url && !form.position_name && positionRef.current) {
      positionRef.current.focus()
    }
  }, [form.image_url])

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[#F8F7F4] w-full max-w-lg max-h-[95dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dojo-border flex-shrink-0">
          <h3 className="text-sm font-bold text-dojo-text">
            {isEdit ? 'Modifier la carte' : 'Nouvelle carte'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Zone 1: Image */}
            <ImagePicker
              imageUrl={form.image_url}
              videoUrl={form.video_url}
              onImageChange={(url) => update('image_url', url)}
              onVideoChange={(url) => update('video_url', url)}
            />

            {/* Zone 2: Content */}
            <Field label="Position" required>
              <input
                ref={positionRef}
                value={form.position_name}
                onChange={(e) => update('position_name', e.target.value)}
                placeholder="Ex: Side control escape"
                className="input-field"
                style={{ fontSize: '16px' }}
              />
            </Field>

            <Field label="Categorie" required>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="input-field"
                style={{ fontSize: '16px' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Situation" required>
              <textarea
                value={form.situation}
                onChange={(e) => update('situation', e.target.value)}
                placeholder="Tu es en side control subi. L'adversaire a le crossface..."
                rows={3}
                className="input-field resize-none"
                style={{ fontSize: '16px' }}
              />
            </Field>

            <Field label="Reponse" required>
              <textarea
                value={form.answer}
                onChange={(e) => update('answer', e.target.value)}
                placeholder="1) Recuperer la position interieure..."
                rows={5}
                className="input-field resize-none"
                style={{ fontSize: '16px' }}
              />
            </Field>

            {/* Collapsible: More options */}
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-xs text-dojo-muted hover:text-dojo-text transition-colors bg-transparent border-none p-0"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              Plus d'options
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-4"
                >
                  <Field label="Cues techniques" hint="Les cues qui t'aident a te rappeler">
                    <textarea
                      value={form.cues}
                      onChange={(e) => update('cues', e.target.value)}
                      placeholder="Le corps suit la tete. Le dip du genou debloque l'insertion."
                      rows={2}
                      className="input-field resize-none"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>

                  <Field label="Lien grappling">
                    <input
                      value={form.grappling_link}
                      onChange={(e) => update('grappling_link', e.target.value)}
                      placeholder="Pourquoi c'est utile en combat"
                      className="input-field"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>

                  <Field label="Source">
                    <select
                      value={form.source}
                      onChange={(e) => update('source', e.target.value)}
                      className="input-field"
                      style={{ fontSize: '16px' }}
                    >
                      {SOURCES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete button (edit mode only) */}
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors border-none ${
                  confirmDelete
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmDelete ? 'Confirmer la suppression' : 'Supprimer cette carte'}
                </span>
              </button>
            )}
          </div>
        </form>

        {/* Zone 3: Sticky save bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-dojo-border bg-[#F8F7F4] flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3.5 rounded-xl bg-dojo-surface text-dojo-muted font-semibold text-sm hover:bg-dojo-card transition-colors border border-dojo-border"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSave || saving}
            className={`flex-[2] py-3.5 rounded-xl font-bold text-sm transition-colors border-none ${
              canSave && !saving
                ? 'bg-dojo-accent text-white hover:bg-dojo-accent-hover'
                : 'bg-dojo-card text-dojo-muted cursor-not-allowed'
            }`}
          >
            {saving ? 'Sauvegarde...' : isEdit ? 'Modifier' : 'Sauvegarder'}
          </button>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-dojo-text text-white text-sm font-medium shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="text-[13px] font-medium text-dojo-muted block mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-dojo-muted/60 mt-0.5">{hint}</p>}
    </div>
  )
}
