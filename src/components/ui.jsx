import { Component } from 'react'
import { ResponsiveContainer } from 'recharts'

export const SyntheticBadge = ({ children = 'SYNTHETIC DATA' }) => <span className="badge" role="note">{children}</span>

const TONES = { ink: 'text-ink', discover: 'text-discover', warn: 'text-warn', accent: 'text-accent', brand: 'text-brand' }

export function Stat({ label, value, tone = 'ink', sub }) {
  return (
    <div className="rounded-2xl bg-card2 p-4">
      <p className="tag">{label}</p>
      <p className={`text-3xl font-black ${TONES[tone] || 'text-ink'}`}>{value}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )
}

/** Chart wrapper with a text description for assistive tech and an error boundary. */
export function ChartBox({ title, description, height = 300, children }) {
  return (
    <figure className="m-0" aria-label={title}>
      <figcaption className="mb-2 text-lg font-extrabold">{title}</figcaption>
      <p className="sr-only">{description}</p>
      <div style={{ height }} role="img" aria-label={description}>
        <ErrorBoundary compact>
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </ErrorBoundary>
      </div>
    </figure>
  )
}

export class ErrorBoundary extends Component {
  state = { error: null, n: 0 }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return <div key={this.state.n} className="contents">{this.props.children}</div>
    return (
      <div role="alert" className="card border-warn">
        <h2 className="text-2xl font-black text-warn">Something went wrong</h2>
        <p className="mt-2"><strong>WHAT HAPPENED:</strong> {this.props.compact ? 'This chart could not be drawn.' : 'This screen hit an unexpected problem.'}</p>
        <p className="mt-1"><strong>HOW TO FIX IT:</strong> Try again. If it keeps happening, go back to the Arcade and pick another challenge.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => this.setState((s) => ({ error: null, n: s.n + 1 }))}>RETRY</button>
          {this.props.onBack && <button type="button" className="btn" onClick={() => { this.setState({ error: null }); this.props.onBack() }}>BACK TO ARCADE</button>}
        </div>
      </div>
    )
  }
}
