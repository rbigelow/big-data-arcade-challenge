import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import ArcadeHeader from './ArcadeHeader.jsx'
import BehindTheData from './BehindTheData.jsx'
import ChallengeComplete from './ChallengeComplete.jsx'
import { SyntheticBadge, ErrorBoundary } from './ui.jsx'

/**
 * Common layout for every activity.
 * `behind` = props for BehindTheData. `complete` = { records, takeaway, score } once finished.
 */
export default function ActivityShell({ meta, behind, complete, onComplete, onBack, onRestart, labels = [], children }) {
  const reported = useRef(false)
  useEffect(() => {
    if (complete && !reported.current) {
      reported.current = true
      onComplete?.({ records: complete.records, score: complete.score ?? 0 })
    }
  }, [complete, onComplete])
  return (
    <>
      <ArcadeHeader compact />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">
        <button type="button" className="btn" onClick={onBack}><ArrowLeft aria-hidden="true" size={20} /> ← Back to Arcade</button>
        <div>
          <p className="tag">{meta.technique}</p>
          <h1 className="text-4xl font-black sm:text-5xl"><span aria-hidden="true">{meta.emoji}</span> {meta.title.toUpperCase()}</h1>
          <p className="mt-1 text-xl text-muted">{meta.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2"><SyntheticBadge />{labels.map((l) => <SyntheticBadge key={l}>{l}</SyntheticBadge>)}</div>
        </div>
        <ErrorBoundary onBack={onBack}>
          <div className="space-y-6">{children}</div>
          {complete && <ChallengeComplete records={complete.records} takeaway={complete.takeaway} onAgain={onRestart} onBack={onBack} />}
          <BehindTheData {...behind} />
        </ErrorBoundary>
      </main>
    </>
  )
}
