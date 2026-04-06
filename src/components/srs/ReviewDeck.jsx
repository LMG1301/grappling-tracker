import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSrsDeck } from '../../hooks/useSrsDeck'
import DeckList from './DeckList'
import CardEditor from './CardEditor'

export default function ReviewDeck({ onBack }) {
  const { allCards, toggleActive, addCard, reload, loading } = useSrsDeck()
  const [editorState, setEditorState] = useState(null) // null | { mode: 'new' } | { mode: 'edit', card: {...} }

  async function handleSave(formData, cardId) {
    if (cardId) {
      // Edit mode
      await supabase.from('srs_cards').update(formData).eq('id', cardId)
    } else {
      // New card
      await addCard(formData)
    }
    await reload()
    setEditorState(null)
  }

  async function handleDelete(cardId) {
    await supabase.from('srs_cards').delete().eq('id', cardId)
    await reload()
    setEditorState(null)
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
          onAdd={() => setEditorState({ mode: 'new' })}
          onEdit={(card) => setEditorState({ mode: 'edit', card })}
        />
      </div>

      {editorState && (
        <CardEditor
          initialData={editorState.mode === 'edit' ? editorState.card : null}
          onSave={handleSave}
          onDelete={editorState.mode === 'edit' ? handleDelete : null}
          onClose={() => setEditorState(null)}
        />
      )}
    </div>
  )
}
