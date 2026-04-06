import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useSrsDeck } from '../../hooks/useSrsDeck'
import DeckList from './DeckList'
import CardEditor from './CardEditor'

export default function ReviewDeck({ onBack }) {
  const { allCards, toggleActive, addCard, loading } = useSrsDeck()
  const [showEditor, setShowEditor] = useState(false)

  async function handleSave(formData) {
    await addCard(formData)
    setShowEditor(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dojo-bg">
        <div className="w-6 h-6 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dojo-bg">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-dojo-card transition-colors bg-transparent border-none text-dojo-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-dojo-text">Mon deck</h2>
          <span className="text-xs text-dojo-muted">{allCards.length} cartes</span>
        </div>

        <DeckList
          cards={allCards}
          onToggleActive={toggleActive}
          onAdd={() => setShowEditor(true)}
        />
      </div>

      {showEditor && (
        <CardEditor
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
