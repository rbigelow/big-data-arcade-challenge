import { useMemo, useState } from 'react'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import { Stat } from '../components/ui.jsx'
import { generateTransactions, newSeed } from '../generators/syntheticData.js'
import { anomalyBreakdown, topAnomalies, SCORE_WEIGHTS } from '../analytics/anomalies.js'
import { fmt, timed } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'

const STEPS = ['TRANSACTION', 'FEATURES', 'HISTORICAL PATTERN', 'ANOMALY SCORE', 'FLAG FOR REVIEW']

function buildCards(seed) {
  const { profile, rows } = generateTransactions(400, seed, 0.06)
  const scored = rows.map((r) => ({ r, s: anomalyBreakdown(r, profile).score }))
  const bad = scored.filter((x) => x.s >= 50).sort((a, b) => b.s - a.s)[0] || scored.sort((a, b) => b.s - a.s)[0]
  const normal = scored.filter((x) => x.s < 20 && x !== bad).slice(0, 5)
  const cards = [...normal, bad].map((x, i) => ({ ...x.r, id: i }))
  const k = seed % 6
  ;[cards[k], cards[5]] = [cards[5], cards[k]]
  return { profile, cards }
}

export default function FindTheFraud({ meta, onBack, onComplete, onRestart }) {
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const { profile, cards } = useMemo(() => buildCards(seed), [seed])
  const [picked, setPicked] = useState(null)
  const [step, setStep] = useState(-1)
  const [big, setBig] = useState(null)

  const scores = cards.map((c) => anomalyBreakdown(c, profile))
  const topIdx = scores.reduce((b, s, i) => (s.score > scores[b].score ? i : b), 0)

  const pick = async (i) => {
    setPicked(i)
    for (let s = 0; s < STEPS.length; s++) { setStep(s); if (!(await wait(450))) return }
    if (!(await wait(300))) return
    const data = generateTransactions(250000, seed + 1, 0.002)
    const { value: top, ms } = timed(() => topAnomalies(data.rows, data.profile, 5))
    setBig({ top, n: data.rows.length, ms, profile: data.profile })
  }
  const stage = big ? 7 : picked == null ? 0 : 4

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC TRANSACTIONS']}
      behind={{
        stage, records: big ? big.n : cards.length, transform: 'Turn each transaction into features and compare with the customer\'s historical pattern',
        algorithm: 'Rule-weighted anomaly score (amount z-score, location, device, hour, purchase frequency), max 100',
        result: big ? `Top anomaly scored ${big.top[0].score}/100 across ${fmt(big.n)} transactions in ${fmt(big.ms, 0)} ms` : undefined,
        why: 'An anomaly is not proof of fraud — it is a flag that tells a human where to look first.',
      }}
      complete={big && { records: big.n, score: picked === topIdx ? 100 : 60, takeaway: 'An anomaly is not proof of fraud. Analytics ranks what is unusual so people can review it.' }}
    >
      <section className="card">
        <h2 className="text-2xl font-black">Click the suspicious transaction</h2>
        <p className="mb-4 text-muted">Usual pattern for this customer: {profile.homeCity}, {profile.usualDevice}, about ${profile.meanAmount} per purchase.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <button key={c.id} type="button" disabled={picked != null} onClick={() => pick(i)} aria-pressed={picked === i}
              className={`btn choice ${picked != null && i === topIdx ? '!border-warn' : ''}`} aria-label={`Transaction ${i + 1}: $${c.amount}, ${c.location}, ${c.hour}:00, ${c.device}, ${c.merchant}, ${c.frequency} recent purchases`}>
              <span className="text-2xl font-black">${c.amount}</span>
              <span>📍 {c.location} · 🕒 {String(c.hour).padStart(2, '0')}:00</span>
              <span>📱 {c.device}</span><span>🏪 {c.merchant}</span><span>🔁 {c.frequency} purchases last hour</span>
              {picked != null && <span className="font-black text-warn">Score {scores[i].score}/100{i === topIdx ? ' ⚠ highest' : ''}</span>}
            </button>
          ))}
        </div>
      </section>
      {picked != null && (
        <section className="card" aria-live="polite">
          <DataPipeline stages={STEPS} active={step >= STEPS.length - 1 ? 5 : step} label="Fraud pipeline" />
          <h3 className="mt-4 text-xl font-bold">{picked === topIdx ? '✅ You found the most anomalous one!' : 'Analytics ranked a different transaction highest.'}</h3>
          <p className="tag mt-3">Anomaly score — highest transaction</p>
          <p className="text-5xl font-black text-warn"><AnimatedCounter value={scores[topIdx].score} /> / 100</p>
          <ul className="mt-2 space-y-1 text-lg">{scores[topIdx].parts.map(([k, v]) => <li key={k}>{k.padEnd(18, '\u00a0')} <strong>+{v}</strong> <span className="text-muted">(max {SCORE_WEIGHTS.find((w) => w[0] === k)[1]})</span></li>)}</ul>
        </section>
      )}
      {big && (
        <section className="card" aria-live="polite">
          <h2 className="text-2xl font-black text-discover">Scaled to {fmt(big.n)} transactions</h2>
          <div className="my-3 grid gap-3 sm:grid-cols-3"><Stat label="Transactions scored" value={fmt(big.n)} /><Stat label="Flagged ≥ 70" value={fmt(big.top.filter((t) => t.score >= 70).length)} tone="warn" sub="among top 5" /><Stat label="Measured time" value={`${fmt(big.ms, 0)} ms`} tone="accent" /></div>
          <h3 className="mb-2 text-xl font-bold">Highest anomalies surfaced for review</h3>
          <ol className="space-y-2">{big.top.map((t) => <li key={t.tx.id} className="rounded-2xl bg-card2 p-3">Score <strong className="text-warn">{t.score}</strong> · ${t.tx.amount} · {t.tx.location} · {t.tx.hour}:00 · {t.tx.device} · {t.tx.frequency} purchases</li>)}</ol>
          <p className="mt-3 text-muted">Flagged transactions need human review — an anomaly is not proof of fraud.</p>
        </section>
      )}
    </ActivityShell>
  )
}
