import { motion } from 'framer-motion'
import useReducedMotion from '../hooks/useReducedMotion.js'

export default function ActivityCard({ activity, index, onOpen }) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(activity.id)}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(index * 0.04, 0.4) }}
      whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className="card flex w-full min-h-48 cursor-pointer flex-col items-start gap-2 text-left text-ink hover:border-accent"
      aria-label={`${activity.title}. ${activity.tagline} ${activity.technique}`}
    >
      <span className="text-5xl" aria-hidden="true">{activity.emoji}</span>
      <span className="text-2xl font-black">{activity.title.toUpperCase()}</span>
      <span className="text-lg text-muted">{activity.tagline}</span>
      <span className="tag mt-auto">{activity.technique}</span>
    </motion.button>
  )
}
