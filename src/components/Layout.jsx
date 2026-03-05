import { useState } from 'react'
import { Map, List, Plus, LogOut, BookOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTechniques } from '../hooks/useTechniques'
import { usePositions } from '../hooks/usePositions'
import { useJournal } from '../hooks/useJournal'
import MindMap from './MindMap'
import TechniqueList from './TechniqueList'
import TechniqueForm from './TechniqueForm'
import TechniqueDetail from './TechniqueDetail'
import JournalPage from './JournalPage'

export default function Layout() {
  const { signOut } = useAuth()
  const { techniques, addTechnique, updateTechnique, deleteTechnique, uploadImage, getImageUrl } = useTechniques()
  const { positions, addPosition } = usePositions()
  const { entries: journalEntries, addEntry, updateEntry, deleteEntry } = useJournal()

  const [view, setView] = useState('map')
  const [mindMapMode, setMindMapMode] = useState('position')
  const [showForm, setShowForm] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState(null)
  const [selectedTechnique, setSelectedTechnique] = useState(null)

  async function handleSubmit(data, imageFile) {
    let image_path = editingTechnique?.image_path || null

    if (imageFile) {
      image_path = await uploadImage(imageFile)
    }

    if (editingTechnique) {
      await updateTechnique(editingTechnique.id, { ...data, image_path })
    } else {
      await addTechnique({ ...data, image_path })
    }
  }

  function handleEdit(technique) {
    setSelectedTechnique(null)
    setEditingTechnique({ ...technique, _imageUrl: getImageUrl(technique.image_path) })
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingTechnique(null)
  }

  return (
    <div className="flex-1 flex flex-col h-dvh">
      {/* Header */}
      <header className="bg-dojo-surface border-b border-dojo-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-bold text-dojo-text">Grappling Tracker</h1>
        <div className="flex items-center gap-2">
          {view === 'map' && (
            <div className="flex bg-dojo-bg rounded-lg border border-dojo-border overflow-hidden">
              <button
                onClick={() => setMindMapMode('position')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-none ${
                  mindMapMode === 'position'
                    ? 'bg-dojo-accent text-white'
                    : 'bg-transparent text-dojo-muted hover:text-dojo-text'
                }`}
              >
                Position
              </button>
              <button
                onClick={() => setMindMapMode('action')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-none ${
                  mindMapMode === 'action'
                    ? 'bg-dojo-accent text-white'
                    : 'bg-transparent text-dojo-muted hover:text-dojo-text'
                }`}
              >
                Action
              </button>
            </div>
          )}
          <button
            onClick={signOut}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-muted"
            title="Deconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      {view === 'map' ? (
        <MindMap
          techniques={techniques}
          mode={mindMapMode}
          onSelectTechnique={setSelectedTechnique}
        />
      ) : view === 'list' ? (
        <TechniqueList
          techniques={techniques}
          getImageUrl={getImageUrl}
          onSelect={setSelectedTechnique}
        />
      ) : (
        <JournalPage
          entries={journalEntries}
          onAdd={addEntry}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />
      )}

      {/* Bottom nav */}
      <nav className="bg-dojo-surface border-t border-dojo-border px-4 py-2 flex items-center justify-around flex-shrink-0 safe-bottom">
        <button
          onClick={() => setView('map')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'map' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-xs">Mind Map</span>
        </button>

        <button
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'list' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-xs">Liste</span>
        </button>

        <button
          onClick={() => { setShowForm(true); setEditingTechnique(null) }}
          className="w-14 h-14 -mt-6 bg-dojo-accent hover:bg-dojo-accent-hover rounded-full flex items-center justify-center shadow-lg shadow-dojo-accent/30 transition-colors border-none text-white"
        >
          <Plus className="w-7 h-7" />
        </button>

        <button
          onClick={() => setView('journal')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'journal' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">Journal</span>
        </button>
      </nav>

      {/* Modals */}
      {showForm && (
        <TechniqueForm
          positions={positions}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          onAddPosition={addPosition}
          initialData={editingTechnique}
        />
      )}

      {selectedTechnique && (
        <TechniqueDetail
          technique={selectedTechnique}
          imageUrl={getImageUrl(selectedTechnique.image_path)}
          onClose={() => setSelectedTechnique(null)}
          onEdit={handleEdit}
          onDelete={deleteTechnique}
        />
      )}
    </div>
  )
}
