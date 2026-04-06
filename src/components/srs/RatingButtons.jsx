export default function RatingButtons({ intervals, onRate }) {
  const buttons = [
    { rating: 1, label: 'A revoir', sub: `${intervals?.again || 1}j`, color: 'bg-red-500 hover:bg-red-600' },
    { rating: 2, label: 'Difficile', sub: `${intervals?.hard || 1}j`, color: 'bg-gray-400 hover:bg-gray-500' },
    { rating: 3, label: 'Bon', sub: `${intervals?.good || 3}j`, color: 'bg-blue-500 hover:bg-blue-600' },
    { rating: 4, label: 'Facile', sub: `${intervals?.easy || 7}j`, color: 'bg-green-500 hover:bg-green-600' },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {buttons.map(({ rating, label, sub, color }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          className={`${color} text-white rounded-xl py-3 px-1 flex flex-col items-center gap-0.5 transition-colors border-none active:scale-95`}
        >
          <span className="text-xs font-bold">{label}</span>
          <span className="text-[10px] opacity-80">{sub}</span>
        </button>
      ))}
    </div>
  )
}
