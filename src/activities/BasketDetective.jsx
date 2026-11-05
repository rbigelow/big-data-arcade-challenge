import { useMemo, useState } from 'react'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { Stat } from '../components/ui.jsx'
import { generateBaskets, newSeed } from '../generators/syntheticData.js'
import { ruleMetrics, rankPartners } from '../analytics/associationRules.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const CHOICES = ['Butter', 'Soda', 'Shampoo', 'Batteries']
const STEPS = ['SHOPPING BASKETS', 'PRODUCT PAIRS', 'FREQUENCY', 'SUPPORT / CONFIDENCE / LIFT', 'ASSOCIATION']
const N = 20000

export default function BasketDetective({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const baskets = useMemo(() => generateBaskets(N, seed), [seed])
  const [pick, setPick] = useState(null)
  const [step, setStep] = useState(-1)
  const [done, setDone] = useState(false)

  const ranked = useMemo(() => rankPartners(baskets, 'Bread', CHOICES), [baskets])
  const m = pick ? ruleMetrics(baskets, 'Bread', pick) : null
  const best = ranked[0]

  const choose = async (p) => {
    setPick(p)
    for (let i = 0; i < STEPS.length; i++) { setStep(i); if (!(await wait(450))) return }
    setDone(true)
  }
  const nodes = CHOICES.map((c, i) => {
    const a = (i / CHOICES.length) * 2 * Math.PI - Math.PI / 4
    return { c, x: 200 + 130 * Math.cos(a), y: 150 + 100 * Math.sin(a), m: ranked.find((r) => r.item === c) }
  })

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC BASKETS']}
      behind={{
        stage: done ? 7 : pick ? 4 : 0, records: N, transform: 'Turn each basket into product pairs and count how often pairs appear',
        algorithm: 'Support = P(A∧B); Confidence = P(B|A); Lift = Confidence ÷ P(B)',
        result: m ? `Bread → ${pick}: support ${fmt(m.support * 100, 1)}%, confidence ${fmt(m.confidence * 100, 1)}%, lift ${fmt(m.lift, 2)}` : undefined,
        why: 'Lift above 1 means the products appear together more than chance alone would predict.',
      }}
      complete={done && { records: N, score: pick === best.item ? 100 : 60, takeaway: 'Association rules find which items co-occur more than chance — but co-occurrence is not causation.' }}
    >
      <section className="card">
        <h2 className="text-3xl font-black">🍞 BREAD</h2>
        <p className="mb-3 text-lg text-muted">Which product do you think is most likely to be in the same basket?</p>
        <Choices label="Related product" options={CHOICES} value={pick} onPick={choose} disabled={pick != null} />
      </section>
      {pick && (
        <section className="card" aria-live="polite">
          <DataPipeline stages={STEPS} active={done ? 5 : step} label="Association pipeline" />
          {done && m && (<>
            <h3 className="mt-4 text-xl font-bold">{pick === best.item ? '✅ Your pick has the strongest association!' : `Analytics found a stronger partner: ${best.item}`}</h3>
            <div className="my-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Support" value={`${fmt(m.support * 100, 1)}%`} sub="Of all baskets, how many had both" />
              <Stat label="Confidence" value={`${fmt(m.confidence * 100, 1)}%`} sub={`Of baskets with Bread, how many also had ${pick}`} />
              <Stat label="Lift" value={fmt(m.lift, 2)} tone={m.lift > 1 ? 'brand' : 'warn'} sub={m.lift > 1 ? 'Together more than chance' : 'Not more than chance'} />
            </div>
            <figure className="m-0"><figcaption className="mb-1 text-lg font-bold">Product network (line thickness = lift)</figcaption>
              <svg viewBox="0 0 400 300" className="w-full max-w-xl" role="img" aria-label={`Network linking Bread to ${CHOICES.join(', ')}. ${ranked.map((r) => `${r.item} lift ${fmt(r.lift, 2)}`).join('; ')}`}>
                {nodes.map((n) => <line key={n.c} x1="200" y1="150" x2={n.x} y2={n.y} stroke={n.m.lift > 1 ? colors.data2 : colors.data4} strokeWidth={Math.max(1, n.m.lift * 2.5)} strokeDasharray={n.m.lift > 1 ? undefined : '6 4'} />)}
                <circle cx="200" cy="150" r="30" fill={colors.data3} /><text x="200" y="155" textAnchor="middle" fontSize="14" fontWeight="800" fill="#061523">Bread</text>
                {nodes.map((n) => <g key={n.c}><circle cx={n.x} cy={n.y} r="28" fill={colors.card} stroke={pick === n.c ? colors.data3 : colors.data1} strokeWidth="3" /><text x={n.x} y={n.y - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill={colors.text}>{n.c}</text><text x={n.x} y={n.y + 13} textAnchor="middle" fontSize="11" fill={colors.text}>{fmt(n.m.lift, 2)}×</text></g>)}
              </svg></figure>
          </>)}
        </section>
      )}
    </ActivityShell>
  )
}
