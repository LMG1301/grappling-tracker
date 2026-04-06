import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

export default function CoachingNotes({ exercise }) {
  const [open, setOpen] = useState(false)

  const notes = [
    { key: 'pourquoi', label: 'POURQUOI', value: exercise.cue_pourquoi },
    { key: 'comment', label: 'COMMENT', value: exercise.cue_comment },
    { key: 'focus', label: 'FOCUS', value: exercise.cue_focus },
    { key: 'grappling', label: 'GRAPPLING', value: exercise.grappling_why },
  ].filter(n => n.value)

  if (notes.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-dojo-muted hover:text-dojo-accent transition-colors bg-transparent border-none p-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Coaching</span>
      </button>

      {open && (
        <div className="mt-2 bg-dojo-surface rounded-lg p-3 space-y-2 relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-dojo-muted hover:text-dojo-text bg-transparent border-none p-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {notes.map(({ key, label, value }) => (
            <div key={key}>
              <p className="text-[10px] font-bold text-dojo-accent uppercase tracking-wider">{label}</p>
              <p className="text-xs text-dojo-text leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
