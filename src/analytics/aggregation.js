/** Group rows by a key and count. Returns sorted [{key,count,pct}] descending. */
export function groupCount(rows, keyFn) {
  const m = new Map()
  for (let i = 0; i < rows.length; i++) {
    const k = keyFn(rows[i])
    m.set(k, (m.get(k) || 0) + 1)
  }
  const total = rows.length
  return [...m.entries()]
    .map(([key, count]) => ({ key, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)))
}

export function groupSum(rows, keyFn, valFn) {
  const m = new Map()
  for (const r of rows) m.set(keyFn(r), (m.get(keyFn(r)) || 0) + valFn(r))
  return [...m.entries()].map(([key, sum]) => ({ key, sum })).sort((a, b) => b.sum - a.sum)
}

export const QUESTION_KEYS = {
  product: (r) => r.product,
  location: (r) => r.location,
  hour: (r) => r.hour,
}

/** Filter -> group -> aggregate -> sort, with measured time. */
export function runAggregation(rows, dimension) {
  const t0 = performance.now()
  const valid = rows.filter((r) => Number.isFinite(r.amount))
  const groups = groupCount(valid, QUESTION_KEYS[dimension])
  const ms = performance.now() - t0
  return { records: valid.length, groups, winner: groups[0] || null, ms }
}

export const safeNum = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback)

/** Scan-everything vs pre-aggregated index for the Query Race. */
export function scanQuery(rows, question) {
  const t0 = performance.now()
  let result, groups = 0
  if (question === 'average') {
    let s = 0
    for (let i = 0; i < rows.length; i++) s += rows[i].amount
    result = { label: 'Average order', value: s / rows.length }
  } else if (question === 'growth') {
    const h1 = new Map(), h2 = new Map()
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const m = r.half === 1 ? h2 : h1
      m.set(r.product, (m.get(r.product) || 0) + 1)
    }
    groups = h1.size
    let best = null
    for (const [k, v] of h1) { const g = ((h2.get(k) || 0) - v) / v; if (!best || g > best.g) best = { k, g } }
    result = { label: best.k, value: best.g * 100 }
  } else {
    const key = question === 'product' ? 'product' : question === 'region' ? 'location' : 'hour'
    const m = new Map()
    for (let i = 0; i < rows.length; i++) m.set(rows[i][key], (m.get(rows[i][key]) || 0) + 1)
    groups = m.size
    const [k, v] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]
    result = { label: String(k), value: v }
  }
  return { result, groups, scanned: rows.length, ms: performance.now() - t0 }
}

/** Build the pre-aggregation once (the "index"), then answer from it. */
export function buildCube(rows) {
  const t0 = performance.now()
  const cube = { product: new Map(), location: new Map(), hour: new Map(), p1: new Map(), p2: new Map(), sum: 0, n: 0 }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    cube.product.set(r.product, (cube.product.get(r.product) || 0) + 1)
    cube.location.set(r.location, (cube.location.get(r.location) || 0) + 1)
    cube.hour.set(r.hour, (cube.hour.get(r.hour) || 0) + 1)
    const m = r.half === 1 ? cube.p2 : cube.p1
    m.set(r.product, (m.get(r.product) || 0) + 1)
    cube.sum += r.amount
    cube.n++
  }
  cube.buildMs = performance.now() - t0
  return cube
}

export function cubeQuery(cube, question) {
  const t0 = performance.now()
  let result, groups = 0
  if (question === 'average') result = { label: 'Average order', value: cube.sum / cube.n }
  else if (question === 'growth') {
    groups = cube.p1.size
    let best = null
    for (const [k, v] of cube.p1) { const g = ((cube.p2.get(k) || 0) - v) / v; if (!best || g > best.g) best = { k, g } }
    result = { label: best.k, value: best.g * 100 }
  } else {
    const m = question === 'product' ? cube.product : question === 'region' ? cube.location : cube.hour
    groups = m.size
    const [k, v] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]
    result = { label: String(k), value: v }
  }
  return { result, groups, scanned: 0, ms: performance.now() - t0 }
}

/** BI drill-down: share of the gross decline (Jan-Mar vs Apr-Jun, summed over segments that fell). */
export function declineShare(rows, filters) {
  const match = (r) => Object.entries(filters).every(([k, v]) => r[k] === v)
  const delta = (subset) => {
    let a = 0, b = 0
    for (const r of subset) { if (r.monthIndex < 3) a += r.revenue; else b += r.revenue }
    return { early: a, late: b, change: b - a }
  }
  const total = delta(rows)
  const part = delta(rows.filter(match))
  const segs = new Map()
  for (const r of rows) {
    const k = `${r.region}|${r.product}|${r.channel}`
    segs.set(k, (segs.get(k) || 0) + (r.monthIndex < 3 ? -r.revenue : r.revenue))
  }
  const gross = [...segs.values()].filter((v) => v < 0).reduce((s, v) => s + v, 0)
  const share = gross < 0 ? Math.min(100, Math.max(0, (Math.min(0, part.change) / gross) * 100)) : 0
  return { total, part, share, gross }
}
