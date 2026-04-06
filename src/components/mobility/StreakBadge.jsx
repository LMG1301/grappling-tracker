import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export default function StreakBadge({ streak, isNewRecord = false }) {
  const count = streak?.current_streak || 0

  return (
    <motion.div
      className="flex items-center gap-1.5"
      animate={isNewRecord ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Flame
        className={`w-5 h-5 ${count > 0 ? 'text-orange-500' : 'text-gray-300'}`}
        fill={count > 0 ? 'currentColor' : 'none'}
      />
      <span className="text-sm font-bold text-dojo-text">{count}</span>
      {isNewRecord && count > 1 && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-orange-500 uppercase"
        >
          Record!
        </motion.span>
      )}
    </motion.div>
  )
}
