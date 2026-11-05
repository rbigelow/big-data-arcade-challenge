import ArcadeHeader from './ArcadeHeader.jsx'
import ActivityCard from './ActivityCard.jsx'
import AnimatedCounter from './AnimatedCounter.jsx'
import Logo from './Logo.jsx'
import DataPipeline from './DataPipeline.jsx'
import { ACTIVITIES } from '../data/activityRegistry.js'

const FLOW = ['DATA SOURCES', 'INGEST', 'CLEAN', 'TRANSFORM', 'ANALYZE', 'VISUALIZE', 'INSIGHT', 'DECISION']

export default function ArcadeHome({ stats, onOpen }) {
  const items = [
    ['CHALLENGES COMPLETED', stats.completed],
    ['INSIGHTS FOUND', stats.insights],
    ['RECORDS ANALYZED', stats.records],
    ['BEST SCORE', stats.best],
  ]
  return (
    <>
      <ArcadeHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <section className="text-center">
          <h1 className="text-4xl font-black tracking-wide sm:text-6xl">BIG DATA ARCADE CHALLENGE</h1>
          <h2 className="mt-3 text-2xl font-bold text-accent sm:text-3xl">Can you find the story hidden in the data?</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted">
            Explore interactive data challenges and discover how millions of records become patterns, predictions, visualizations and decisions.
          </p>
          <div className="mt-6 flex justify-center"><DataPipeline stages={FLOW} label="Big data analytics flow" /></div>
        </section>

        <section aria-label="Session statistics" className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map(([label, v]) => (
            <div key={label} className="card text-center">
              <p className="text-4xl font-black text-discover"><AnimatedCounter value={v} /></p>
              <p className="tag mt-1">{label}</p>
            </div>
          ))}
        </section>

        <h2 className="mt-12 mb-6 text-center text-3xl font-black tracking-wide">CHOOSE YOUR DATA CHALLENGE</h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
          {ACTIVITIES.map((a, i) => <li key={a.id} className="flex"><ActivityCard activity={a} index={i} onOpen={onOpen} /></li>)}
        </ul>
      </main>
      <footer className="mt-8 border-t-2 border-line px-4 py-10 text-center">
      
        <p className="mt-3 text-2xl font-black">BIG DATA ARCADE CHALLENGE</p>
        <p className="text-accent">Can you find the story hidden in the data?</p>
       
        <p className="mt-4 text-sm text-muted">All data shown is SYNTHETIC and generated in your browser. It does not represent real Georgian College operations.</p>
      </footer>
    </>
  )
}
