import { useState } from 'react'
import { Layers, List, Plus, LogOut, BookOpen, Activity } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTechniques } from '../hooks/useTechniques'
import { usePositions } from '../hooks/usePositions'
import { useJournal } from '../hooks/useJournal'
import { useSrsDeck } from '../hooks/useSrsDeck'
import TechniqueList from './TechniqueList'
import TechniqueForm from './TechniqueForm'
import TechniqueDetail from './TechniqueDetail'
import JournalPage from './JournalPage'
import CoachPage from './CoachPage'
import MobilityPage from './mobility/MobilityPage'
import MobilitySession from './mobility/MobilitySession'
import MobilityStats from './mobility/MobilityStats'
import ReviewPage from './srs/ReviewPage'
import ReviewSession from './srs/ReviewSession'
import ReviewFeedback from './srs/ReviewFeedback'
import ReviewDeck from './srs/ReviewDeck'

export default function Layout() {
  const { signOut } = useAuth()
  const { techniques, addTechnique, updateTechnique, deleteTechnique, uploadImage, getImageUrl, fetchLinks } = useTechniques()
  const { positions, addPosition } = usePositions()
  const { entries: journalEntries, addEntry, updateEntry, deleteEntry } = useJournal()
  const { dueCards } = useSrsDeck()

  const [view, setView] = useState('review')
  const [showForm, setShowForm] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState(null)
  const [selectedTechnique, setSelectedTechnique] = useState(null)

  // Mobility state
  const [mobilitySubView, setMobilitySubView] = useState('home')
  const [mobilityRoutineType, setMobilityRoutineType] = useState(null)
  const competitionWeek = 1 // TODO: connect to global context when S&C tracker is integrated

  // SRS Review state
  const [reviewSubView, setReviewSubView] = useState('home') // 'home' | 'session' | 'feedback' | 'deck'
  const [sessionDueCards, setSessionDueCards] = useState([])

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
      {view === 'review' ? (
        reviewSubView === 'session' && sessionDueCards.length > 0 ? (
          <ReviewSession
            dueCards={sessionDueCards}
            onBack={() => { setReviewSubView('home'); setSessionDueCards([]) }}
            onFeedback={() => setReviewSubView('feedback')}
          />
        ) : reviewSubView === 'feedback' ? (
          <ReviewFeedback onBack={() => setReviewSubView('home')} />
        ) : reviewSubView === 'deck' ? (
          <ReviewDeck onBack={() => setReviewSubView('home')} />
        ) : (
          <ReviewPage
            onStartSession={(cards) => { setSessionDueCards(cards); setReviewSubView('session') }}
            onOpenDeck={() => setReviewSubView('deck')}
            onOpenFeedback={() => setReviewSubView('feedback')}
          />
        )
      ) : view === 'list' ? (
        <TechniqueList
          techniques={techniques}
          getImageUrl={getImageUrl}
          onSelect={setSelectedTechnique}
        />
      ) : view === 'journal' ? (
        <JournalPage
          entries={journalEntries}
          onAdd={addEntry}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />
      ) : view === 'mobility' ? (
        mobilitySubView === 'session' && mobilityRoutineType ? (
          <MobilitySession
            routineType={mobilityRoutineType}
            competitionWeek={competitionWeek}
            onBack={() => { setMobilitySubView('home'); setMobilityRoutineType(null) }}
          />
        ) : mobilitySubView === 'stats' ? (
          <MobilityStats onBack={() => setMobilitySubView('home')} />
        ) : (
          <MobilityPage
            competitionWeek={competitionWeek}
            onStartSession={(type) => { setMobilityRoutineType(type); setMobilitySubView('session') }}
            onOpenStats={() => setMobilitySubView('stats')}
          />
        )
      ) : (
        <CoachPage />
      )}

      {/* Bottom nav */}
      <nav className="bg-dojo-surface border-t border-dojo-border px-2 pt-2 pb-2 flex items-end justify-around flex-shrink-0 safe-bottom relative">
        <button
          onClick={() => { setView('review'); setReviewSubView('home'); setSessionDueCards([]) }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none relative ${
            view === 'review' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">Review</span>
          {dueCards.length > 0 && view !== 'review' && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {dueCards.length > 9 ? '9+' : dueCards.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'list' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px]">Liste</span>
        </button>

        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => { setShowForm(true); setEditingTechnique(null) }}
            className="w-14 h-14 bg-dojo-accent hover:bg-dojo-accent-hover rounded-full flex items-center justify-center shadow-lg shadow-dojo-accent/30 transition-colors border-none text-white"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <button
          onClick={() => setView('journal')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'journal' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Journal</span>
        </button>

        <button
          onClick={() => { setView('mobility'); setMobilitySubView('home'); setMobilityRoutineType(null) }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors bg-transparent border-none ${
            view === 'mobility' ? 'text-dojo-accent' : 'text-dojo-muted'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">Mobilite</span>
        </button>
      </nav>

      {/* Modals */}
      {showForm && (
        <TechniqueForm
          positions={positions}
          techniques={techniques}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          onAddPosition={addPosition}
          initialData={editingTechnique}
        />
      )}

      {selectedTechnique && (
        <TechniqueDetail
          technique={selectedTechnique}
          techniques={techniques}
          imageUrl={getImageUrl(selectedTechnique.image_path)}
          onClose={() => setSelectedTechnique(null)}
          onEdit={handleEdit}
          onDelete={deleteTechnique}
          onUpdateTechnique={updateTechnique}
          fetchLinks={fetchLinks}
        />
      )}
    </div>
  )
}
