/** Feature-based anomaly score against a historical profile. Max 100. Not proof of fraud. */
export const SCORE_WEIGHTS = [
  ['Unusual amount', 25],
  ['New location', 20],
  ['New device', 15],
  ['Unusual time', 12],
  ['Rapid purchases', 22],
]

export function anomalyBreakdown(tx, profile) {
  const z = Math.abs((tx.amount - profile.meanAmount) / profile.sdAmount)
  const w = Object.fromEntries(SCORE_WEIGHTS)
  const parts = [
    ['Unusual amount', Math.round(w['Unusual amount'] * Math.min(1, Math.max(0, (z - 1) / 3)))],
    ['New location', tx.location !== profile.homeCity ? w['New location'] : 0],
    ['New device', tx.device !== profile.usualDevice ? w['New device'] : 0],
    ['Unusual time', tx.hour < 6 ? w['Unusual time'] : 0],
    ['Rapid purchases', Math.round(w['Rapid purchases'] * Math.min(1, tx.frequency / 6))],
  ]
  const score = parts.reduce((s, p) => s + p[1], 0)
  return { parts, score: Math.min(100, score) }
}

export function scoreAll(rows, profile) {
  const out = new Array(rows.length)
  for (let i = 0; i < rows.length; i++) out[i] = { tx: rows[i], score: anomalyBreakdown(rows[i], profile).score }
  return out
}

export function topAnomalies(rows, profile, k = 5) {
  return scoreAll(rows, profile).sort((a, b) => b.score - a.score).slice(0, k)
}

/** Simple rolling mean / sd detector for streams. */
export function isOutlier(value, mean, sd, z = 3) {
  return sd > 0 && Math.abs(value - mean) / sd > z
}
