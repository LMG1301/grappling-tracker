import { useState } from 'react'
import { X, Camera, Plus, Calendar, ChevronDown } from 'lucide-react'
import { ACTION_TYPES, MAX_IMAGE_SIZE, ACCEPTED_IMAGE_TYPES } from '../config/constants'

export default function TechniqueForm({ positions, techniques, onSubmit, onClose, onAddPosition, initialData }) {
  const [name, setName] = useState(initialData?.name || '')
  const [position, setPosition] = useState(initialData?.position || '')
  const [actionType, setActionType] = useState(initialData?.action_type || 'submission')
  const [isFocus, setIsFocus] = useState(initialData?.is_focus || false)
  const [situation, setSituation] = useState(initialData?.situation || '')
  const [answer, setAnswer] = useState(initialData?.answer || '')
  const [cues, setCues] = useState(initialData?.cues || '')
  const [showFlashcard, setShowFlashcard] = useState(!!(initialData?.situation || initialData?.answer))
  const [keyPoints, setKeyPoints] = useState(initialData?.key_points || '')
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [learnedDate, setLearnedDate] = useState(initialData?.learned_date || '')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [newPosition, setNewPosition] = useState('')
  const [showNewPosition, setShowNewPosition] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const focusCount = (techniques || []).filter((t) => t.is_focus && t.id !== initialData?.id).length
  const canToggleFocus = isFocus || focusCount < 5

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Format accepte : JPG, PNG, WebP')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image trop lourde (max 5 Mo)')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleAddPosition() {
    if (!newPosition.trim()) return
    try {
      await onAddPosition(newPosition.trim())
      setPosition(newPosition.trim())
      setNewPosition('')
      setShowNewPosition(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !position) return
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        name: name.trim(),
        position,
        action_type: actionType,
        is_focus: isFocus,
        situation: situation || null,
        answer: answer || null,
        cues: cues || null,
        srs_active: !!(situation && answer),
        key_points: keyPoints || null,
        video_url: videoUrl || null,
        notes: notes || null,
        learned_date: learnedDate || null,
      }, imageFile)
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
          <h2 className="text-lg font-semibold">{initialData ? 'Modifier' : 'Nouvelle technique'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
          )}

          {/* Focus toggle */}
          <label className="flex items-center gap-3 bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFocus}
              onChange={(e) => canToggleFocus && setIsFocus(e.target.checked)}
              disabled={!canToggleFocus}
              className="w-5 h-5 accent-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-dojo-text">★ En focus cette semaine</span>
              <span className="text-xs text-dojo-muted ml-2">({focusCount}/5 actifs)</span>
            </div>
          </label>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Nom de la technique *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kimura from closed guard"
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Position de depart *</label>
            {showNewPosition ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="Nom de la position"
                  className="flex-1 bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
                />
                <button type="button" onClick={handleAddPosition} className="bg-dojo-accent text-white px-4 py-3 rounded-lg border-none">
                  <Plus className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setShowNewPosition(false)} className="bg-dojo-card text-dojo-text px-4 py-3 rounded-lg border-none">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  className="flex-1 bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors appearance-none"
                >
                  <option value="">Choisir une position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewPosition(true)}
                  className="bg-dojo-card text-dojo-text px-4 py-3 rounded-lg border border-dojo-border hover:bg-dojo-border transition-colors"
                  title="Ajouter une position"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-2">Type d'action *</label>
            <div className="grid grid-cols-4 gap-2">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setActionType(type.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all border ${
                    actionType === type.value
                      ? 'border-transparent text-white shadow-lg'
                      : 'border-dojo-border bg-dojo-bg text-dojo-muted hover:border-dojo-accent/50'
                  }`}
                  style={actionType === type.value ? { backgroundColor: type.color } : {}}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flashcard fields (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowFlashcard(!showFlashcard)}
              className="flex items-center gap-1.5 text-sm text-dojo-muted hover:text-dojo-text transition-colors bg-transparent border-none p-0"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showFlashcard ? 'rotate-180' : ''}`} />
              Flashcard (pour la review SRS)
            </button>
            {showFlashcard && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm text-dojo-muted mb-1">Situation</label>
                  <textarea
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Tu es en side control subi. L'adversaire a le crossface..."
                    rows={3}
                    className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dojo-muted mb-1">Reponse</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="1) Recuperer la position interieure..."
                    rows={5}
                    className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dojo-muted mb-1">Cues</label>
                  <textarea
                    value={cues}
                    onChange={(e) => setCues(e.target.value)}
                    placeholder="Le corps suit la tete..."
                    rows={2}
                    className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none"
                    style={{ fontSize: '16px' }}
                  />
                  <p className="text-[10px] text-dojo-muted mt-0.5">Les cues qui t'aident a te rappeler</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Lien video (optionnel)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Image (optionnel)</label>
            {imagePreview || initialData?.image_path ? (
              <div className="relative">
                <img
                  src={imagePreview || initialData?._imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full bg-dojo-bg border-2 border-dashed border-dojo-border rounded-lg py-6 cursor-pointer hover:border-dojo-accent/50 transition-colors text-dojo-muted">
                <Camera className="w-5 h-5" />
                <span className="text-sm">Photo ou capture</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Date d'apprentissage</label>
            <div className="relative">
              <input
                type="date"
                value={learnedDate}
                onChange={(e) => setLearnedDate(e.target.value)}
                className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dojo-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details, tips, erreurs a eviter..."
              rows={3}
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none"
            />
          </div>

          {/* Key points - visible only for principle/drill */}
          {(actionType === 'principle' || actionType === 'drill') && (
            <div>
              <label className="block text-sm text-dojo-muted mb-1">Points cles</label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder={"- Point 1\n- Point 2\n- Point 3"}
                rows={6}
                className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors resize-none font-mono text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !position}
            className="w-full bg-dojo-accent hover:bg-dojo-accent-hover disabled:opacity-50 text-white font-medium py-4 rounded-lg transition-colors text-lg border-none"
          >
            {submitting ? 'Enregistrement...' : initialData ? 'Mettre a jour' : 'Ajouter la technique'}
          </button>
        </form>
      </div>
    </div>
  )
}
