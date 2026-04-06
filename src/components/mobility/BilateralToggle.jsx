import { Check } from 'lucide-react'

export default function BilateralToggle({ sidesCompleted, onComplete }) {
  return (
    <div className="flex items-center gap-2">
      <SideButton
        label="G"
        done={sidesCompleted?.left}
        onClick={() => onComplete('left')}
      />
      <SideButton
        label="D"
        done={sidesCompleted?.right}
        onClick={() => onComplete('right')}
      />
    </div>
  )
}

function SideButton({ label, done, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={done}
      className={`
        w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5
        text-xs font-bold transition-all border-none
        ${done
          ? 'bg-green-100 text-green-700 border-green-300'
          : 'bg-dojo-card text-dojo-muted border-dojo-border hover:border-dojo-accent hover:text-dojo-accent'
        }
      `}
    >
      {done ? <Check className="w-4 h-4" /> : <span>{label}</span>}
    </button>
  )
}
