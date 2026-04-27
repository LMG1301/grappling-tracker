import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTechniques } from '../hooks/useTechniques'
import { usePositions } from '../hooks/usePositions'
import { useJournal } from '../hooks/useJournal'
import { useSrsDeck } from '../hooks/useSrsDeck'
import TechniqueList from './TechniqueList'
import TechniqueForm from './TechniqueForm'
import TechniqueDetail from './TechniqueDetail'
import JournalPage from './JournalPage'
import SkillTreePage from './skilltree/SkillTreePage'
import MobilityPage from './mobility/MobilityPage'
import MobilitySession from './mobility/MobilitySession'
import MobilityStats from './mobility/MobilityStats'
import ReviewPage from './srs/ReviewPage'
import ReviewSession from './srs/ReviewSession'
import ReviewFeedback from './srs/ReviewFeedback'
import BrowseCards from './srs/BrowseCards'

const TABS = [
  { id: 'review', label: 'Review' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'skilltree', label: 'Skill Tree' },
  { id: 'journal', label: 'Journal' },
  { id: 'mobility', label: 'Mobilite' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const { techniques, addTechnique, updateTechnique, deleteTechnique, uploadImage, getImageUrl, fetchLinks } = useTechniques()
  const { positions, addPosition } = usePositions()
  const { entries: journalEntries, addEntry, updateEntry, deleteEntry } = useJournal()
  const { dueCards, allSrsCards } = useSrsDeck()

  const [view, setView] = useState('review')
  const [showForm, setShowForm] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState(null)
  const [selectedTechnique, setSelectedTechnique] = useState(null)

  // Mobility state
  const [mobilitySubView, setMobilitySubView] = useState('home')
  const [mobilityRoutineType, setMobilityRoutineType] = useState(null)
  const competitionWeek = 1

  // SRS Review state
  const [reviewSubView, setReviewSubView] = useState('home')
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
      {/* Header + Tab bar */}
      <header className="bg-dojo-surface border-b border-dojo-border flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <h1 className="text-base font-bold text-dojo-text">Grappling Tracker</h1>
          <button
            onClick={signOut}
            className="p-2 hover:bg-dojo-card rounded-lg transition-colors bg-transparent border-none text-dojo-muted"
            title="Deconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {/* Tab bar */}
        <div className="flex px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id)
                if (tab.id === 'review') { setReviewSubView('home'); setSessionDueCards([]) }
                if (tab.id === 'mobility') { setMobilitySubView('home'); setMobilityRoutineType(null) }
              }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-none bg-transparent relative ${
                view === tab.id ? 'text-dojo-accent' : 'text-dojo-muted'
              }`}
            >
              {tab.label}
              {tab.id === 'review' && dueCards.length > 0 && view !== 'review' && (
                <span className="absolute top-1.5 ml-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full inline-flex items-center justify-center">
                  {dueCards.length > 9 ? '9+' : dueCards.length}
                </span>
              )}
              {view === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-dojo-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      {view === 'review' ? (
        reviewSubView === 'session' && sessionDueCards.length > 0 ? (
          <ReviewSession
            dueCards={sessionDueCards}
            onBack={() => { setReviewSubView('home'); setSessionDueCards([]) }}
            onFeedback={() => setReviewSubView('feedback')}
            getImageUrl={getImageUrl}
          />
        ) : reviewSubView === 'feedback' ? (
          <ReviewFeedback onBack={() => setReviewSubView('home')} />
        ) : reviewSubView === 'browse' ? (
          <BrowseCards
            cards={allSrsCards}
            getImageUrl={getImageUrl}
            onBack={() => setReviewSubView('home')}
          />
        ) : (
          <ReviewPage
            onStartSession={(cards) => { setSessionDueCards(cards); setReviewSubView('session') }}
            onOpenFeedback={() => setReviewSubView('feedback')}
            onOpenBrowse={() => setReviewSubView('browse')}
          />
        )
      ) : view === 'techniques' ? (
        <TechniqueList
          techniques={techniques}
          getImageUrl={getImageUrl}
          onSelect={setSelectedTechnique}
          onAdd={() => { setShowForm(true); setEditingTechnique(null) }}
        />
      ) : view === 'skilltree' ? (
        <SkillTreePage />
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
      ) : null}

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
