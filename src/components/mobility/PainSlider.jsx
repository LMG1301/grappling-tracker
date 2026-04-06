import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function PainSlider({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-dojo-muted hover:text-dojo-text transition-colors bg-transparent border-none p-0"
      >
        Douleur {value !== null && <span className="font-bold text-dojo-text">{value}/10</span>}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-dojo-muted">0</span>
          <input
            type="range"
            min={0}
            max={10}
            value={value ?? 0}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 accent-dojo-accent"
          />
          <span className="text-[10px] text-dojo-muted">10</span>
        </div>
      )}
    </div>
  )
}
