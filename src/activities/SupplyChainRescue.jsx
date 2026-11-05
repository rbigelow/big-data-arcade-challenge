import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateSupplyChain, SC_NODES, newSeed } from '../generators/syntheticData.js'
import { supplyProjection } from '../analytics/scenarios.js'
import { fmt } from '../analytics/util.js'
import { useTheme } from '../hooks/useTheme.jsx'

const ACTIONS = [
  { id: 'reroute', label: 'REROUTE SHIPMENT' }, { id: 'backup', label: 'USE BACKUP SUPPLIER' },
  { id: 'transfer', label: 'TRANSFER INVENTORY' }, { id: 'wait', label: 'WAIT' },
]
const STAGES = ['EVENT', 'INVENTORY', 'DEMAND', 'ROUTES', 'SCENARIO SIMULATION', 'DECISION']

export default function SupplyChainRescue({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const [seed] = useState(newSeed)
  const [sc] = useState(() => generateSupplyChain(seed))
  const [action, setAction] = useState(null)
  const all = Object.fromEntries(ACTIONS.map((a) => [a.id, supplyProjection(sc, a.id)]))
  const res = action ? all[action] : null
  const baseline = all.wait
  const chart = ACTIONS.map((a) => ({ name: a.label.split(' ')[0], id: a.id, cost: Math.round(all[a.id].cost / 1000), delay: all[a.id].delay, stockout: all[a.id].stockout, customers: all[a.id].customers }))
  const cover = Math.round((sc.inventoryUnits / sc.dailyDemand) * 24)

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC SUPPLY CHAIN']}
      behind={{
        stage: res ? 7 : 3, records: SC_NODES.length * 4 + 3, transform: 'Compare stock cover (hours) with the delay for each option',
        algorithm: 'Stockout risk = (delay + 12h − stock cover) ÷ (delay + 12h), bounded 0–100%; customers = risk × daily customers × delay days',
        result: res ? `Stockout risk ${baseline.stockout}% → ${res.stockout}%, cost $${fmt(res.cost)}` : undefined,
        why: 'Scenario simulation shows trade-offs between cost, delay and customer impact before you commit.',
      }}
      complete={res && { records: SC_NODES.length * 4 + 3, score: Math.round(100 - res.stockout), takeaway: 'Scenario analysis compares options on cost, delay and customer impact — every choice trades something off.' }}
    >
      <section className="card">
        <ol className="flex flex-wrap items-center gap-2" aria-label="Supply chain">{[...SC_NODES, 'Inventory', 'Demand'].map((n) => <li key={n} className={`rounded-2xl border-2 px-3 py-2 font-bold ${n === 'Port' ? 'border-warn text-warn' : 'border-line'}`}>{n === 'Port' ? '⚠ Port' : n}</li>)}</ol>
        <div className="mt-4 grid gap-3 sm:grid-cols-4"><Stat label="Stock on hand" value={fmt(sc.inventoryUnits)} sub="units" /><Stat label="Daily demand" value={fmt(sc.dailyDemand)} sub="units" /><Stat label="Stock cover" value={`${cover} h`} tone="warn" /><Stat label="Customers / day" value={fmt(sc.customersPerDay)} /></div>
        <div className="mt-4"><DataPipeline stages={STAGES} active={res ? 6 : 4} label="Supply chain pipeline" /></div>
      </section>
      <section className="card border-warn" role="alert"><h2 className="text-3xl font-black text-warn">⚠ PORT DELAY: {sc.delayHours} HOURS</h2>
        <p className="mb-3 text-lg">If we wait, stock covers only {cover} hours. What do you do?</p>
        <Choices label="Response" options={ACTIONS} value={action} onPick={setAction} /></section>
      {res && (
        <section className="card" role="status">
          <div className="grid gap-3 sm:grid-cols-4"><Stat label="Cost" value={`$${fmt(res.cost)}`} /><Stat label="Delay" value={`${res.delay} h`} /><Stat label="Stockout risk" value={`${res.stockout}%`} tone={res.stockout > 20 ? 'warn' : 'brand'} /><Stat label="Customers affected" value={fmt(res.customers)} /></div>
          {['cost', 'delay', 'stockout', 'customers'].map((k) => (
            <div key={k} className="mt-4"><ChartBox title={{ cost: 'Cost ($ thousands)', delay: 'Delay (hours)', stockout: 'Stockout risk (%)', customers: 'Customers affected' }[k]} description={`Bar chart comparing ${k} across the four options. Your choice: ${fmt(res[k === 'cost' ? 'cost' : k])}.`} height={170}>
              <BarChart data={chart}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={60} /><Tooltip />
                <Bar dataKey={k}>{chart.map((c) => <Cell key={c.id} fill={c.id === action ? colors.data3 : colors.data1} />)}</Bar></BarChart></ChartBox></div>
          ))}
        </section>
      )}
    </ActivityShell>
  )
}
