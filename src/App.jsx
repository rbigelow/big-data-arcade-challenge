import { Suspense, useCallback, useState } from 'react'
import { ThemeProvider } from './hooks/useTheme.jsx'
import ArcadeHome from './components/ArcadeHome.jsx'
import IdleReset from './components/IdleReset.jsx'
import { ErrorBoundary } from './components/ui.jsx'
import { ACTIVITIES } from './data/activityRegistry.js'

const EMPTY = { completed: 0, insights: 0, records: 0, best: 0 }

function Unsupported() {
  return (
    <div role="alert" className="card m-8">
      <h1 className="text-3xl font-black">Your browser is not supported</h1>
      <p><strong>WHAT HAPPENED:</strong> This exhibit needs a modern browser.</p>
      <p><strong>HOW TO FIX IT:</strong> Open it in a current version of Chrome, Edge, Firefox or Safari.</p>
    </div>
  )
}

function Arcade() {
  const [activeId, setActiveId] = useState(null)
  const [run, setRun] = useState(0)
  const [stats, setStats] = useState(EMPTY)
  const active = ACTIVITIES.find((a) => a.id === activeId)

  const home = useCallback(() => setActiveId(null), [])
  const open = useCallback((id) => { setRun((r) => r + 1); setActiveId(id) }, [])
  const restart = useCallback(() => setRun((r) => r + 1), [])
  const kioskReset = useCallback(() => { setActiveId(null); setRun((r) => r + 1); setStats(EMPTY) }, [])
  const complete = useCallback(({ records, score }) => {
    setStats((s) => ({ completed: s.completed + 1, insights: s.insights + 1, records: s.records + (Number.isFinite(records) ? records : 0), best: Math.max(s.best, score || 0) }))
  }, [])

  return (
    <>
      <ErrorBoundary onBack={home}>
        {active ? (
          <Suspense fallback={<p role="status" className="p-8 text-center text-2xl font-bold">Loading challenge…</p>}>
            <active.component key={`${active.id}-${run}`} meta={active} onBack={home} onComplete={complete} onRestart={restart} />
          </Suspense>
        ) : (
          <ArcadeHome stats={stats} onOpen={open} />
        )}
      </ErrorBoundary>
      <IdleReset onReset={kioskReset} />
    </>
  )
}

export default function App() {
  const supported = typeof Map !== 'undefined' && typeof requestAnimationFrame !== 'undefined'
  return <ThemeProvider>{supported ? <Arcade /> : <Unsupported />}</ThemeProvider>
}
