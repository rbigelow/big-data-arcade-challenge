import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Fragment } from 'react'

/** Visual pipeline. `active` is the index of the current stage (-1 none); stages before it are done. */
export default function DataPipeline({ stages, active = -1, label = 'Data pipeline', vertical = false }) {
  return (
    <ol aria-label={label} className={`flex ${vertical ? 'flex-col' : 'flex-wrap'} items-center gap-2`}>
      {stages.map((s, i) => {
        const done = active > i, current = active === i
        return (
          <Fragment key={s}>
            <motion.li
              animate={{ scale: current ? 1.06 : 1 }}
              transition={{ duration: 0.2 }}
              aria-current={current ? 'step' : undefined}
              className={`rounded-2xl border-2 px-3 py-2 text-sm font-extrabold tracking-wide ${current ? 'border-discover bg-card2 text-discover' : done ? 'border-brand bg-card2 text-ink' : 'border-line text-muted'}`}
            >
              {done ? '✓ ' : current ? '▶ ' : ''}{s}
            </motion.li>
            {i < stages.length - 1 && (vertical ? <ArrowDown aria-hidden="true" className="text-muted" size={18} /> : <ArrowRight aria-hidden="true" className="text-muted" size={18} />)}
          </Fragment>
        )
      })}
    </ol>
  )
}
