export default function ProgressDots({ total, currentIndex, ratings }) {
  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      {Array.from({ length: total }).map((_, i) => {
        let color = 'bg-gray-200' // pending
        if (i < currentIndex || (i === currentIndex && ratings[i])) {
          const r = ratings[i]
          if (r === 1) color = 'bg-red-400'
          else if (r === 2) color = 'bg-amber-400'
          else if (r >= 3) color = 'bg-green-400'
        } else if (i === currentIndex) {
          color = 'bg-dojo-accent'
        }
        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${color}`}
          />
        )
      })}
    </div>
  )
}
