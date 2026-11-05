import { makeRng } from '../generators/syntheticData.js'

const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

/** K-means (k-means++ seeding, Lloyd iterations). Deterministic given seed. */
export function kMeans(points, k, seed = 7, maxIter = 50) {
  if (!points.length || k < 1) return { centroids: [], assignments: [], sizes: [], iterations: 0 }
  const rng = makeRng(seed)
  const centroids = [{ ...points[Math.floor(rng() * points.length)] }]
  while (centroids.length < k) {
    const dist = points.map((p) => Math.min(...centroids.map((c) => d2(p, c))))
    const total = dist.reduce((a, b) => a + b, 0)
    let r = rng() * total, idx = 0
    for (; idx < dist.length - 1; idx++) { r -= dist[idx]; if (r <= 0) break }
    centroids.push({ ...points[idx] })
  }
  let assignments = new Array(points.length).fill(0)
  let iterations = 0
  for (; iterations < maxIter; iterations++) {
    let changed = false
    assignments = points.map((p, i) => {
      let best = 0, bd = Infinity
      centroids.forEach((c, ci) => { const d = d2(p, c); if (d < bd) { bd = d; best = ci } })
      if (best !== assignments[i]) changed = true
      return best
    })
    centroids.forEach((c, ci) => {
      const mem = points.filter((_, i) => assignments[i] === ci)
      if (mem.length) { c.x = mem.reduce((s, p) => s + p.x, 0) / mem.length; c.y = mem.reduce((s, p) => s + p.y, 0) / mem.length }
    })
    if (!changed && iterations > 0) break
  }
  const sizes = centroids.map((_, ci) => assignments.filter((a) => a === ci).length)
  const inertia = points.reduce((s, p, i) => s + d2(p, centroids[assignments[i]]), 0)
  return { centroids, assignments, sizes, iterations, inertia }
}

/** Pick k in 1..maxK using the largest relative inertia drop (elbow); k=1 if no real structure. */
export function chooseK(points, maxK = 4) {
  const runs = []
  for (let k = 1; k <= maxK; k++) runs.push(kMeans(points, k, 11).inertia)
  let k = 1
  for (let i = 1; i < runs.length; i++) if (runs[i] < runs[i - 1] * 0.5 && runs[i - 1] - runs[i] > runs[0] * 0.12) k = i + 1
  return { k, inertias: runs }
}

/** Points more than z SD away from the mean distance to their centroid. */
export function findOutlierPoints(points, z = 3) {
  const { centroids, assignments } = kMeans(points, 1)
  const ds = points.map((p, i) => Math.sqrt(d2(p, centroids[assignments[i]])))
  const m = ds.reduce((a, b) => a + b, 0) / ds.length
  const sd = Math.sqrt(ds.reduce((a, b) => a + (b - m) ** 2, 0) / ds.length)
  return points.map((p, i) => (ds[i] > m + z * sd ? i : -1)).filter((i) => i >= 0)
}

export function pearson(points) {
  const n = points.length
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const p of points) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2 }
  const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0
  const slope = sxx ? sxy / sxx : 0
  return { r, slope, intercept: my - slope * mx }
}

/** Decide what structure exists: clusters (k), trend, outliers, or none. */
export function detectStructure(points) {
  const { k } = chooseK(points)
  if (k > 1) {
    const result = kMeans(points, k, 11)
    // Points of a trend line also split into k-means groups, but stay strongly correlated inside each group.
    const within = result.centroids.map((_, ci) => Math.abs(pearson(points.filter((_p, i) => result.assignments[i] === ci)).r))
    if (within.reduce((a, b) => a + b, 0) / within.length < 0.5) return { type: 'clusters', k, result, outliers: [] }
  }
  const trend = pearson(points)
  if (Math.abs(trend.r) > 0.7) return { type: 'trend', ...trend }
  const out = findOutlierPoints(points, 3)
  if (out.length > 0 && out.length <= points.length * 0.1) return { type: 'outliers', outliers: out }
  return { type: 'none' }
}
