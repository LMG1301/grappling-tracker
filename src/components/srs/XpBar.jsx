import { motion } from 'framer-motion'

export default function XpBar({ level, progress }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-dojo-accent">Niv. {level}</span>
      <div className="flex-1 h-2 bg-dojo-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-dojo-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[10px] text-dojo-muted">{progress.current}/{progress.needed} XP</span>
    </div>
  )
}
