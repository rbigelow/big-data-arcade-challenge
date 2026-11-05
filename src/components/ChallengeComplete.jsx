import { motion } from 'framer-motion'
import { fmt } from '../analytics/util.js'

export default function ChallengeComplete({ records, takeaway, onAgain, onBack }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card border-discover text-center" aria-labelledby="complete-title" role="status">
      <p className="text-6xl" aria-hidden="true">🏆</p>
      <h2 id="complete-title" className="text-4xl font-black text-discover">INSIGHT FOUND</h2>
      <p className="mt-2 text-xl">You analyzed {fmt(records)} records.</p>
      {takeaway && <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">{takeaway}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button type="button" className="btn btn-primary" onClick={onAgain}>PLAY AGAIN</button>
        <button type="button" className="btn" onClick={onBack}>BACK TO ARCADE</button>
      </div>
    </motion.section>
  )
}
