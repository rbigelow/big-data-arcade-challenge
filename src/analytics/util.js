export const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')

/** Run fn and measure real elapsed time in ms. */
export function timed(fn) {
  const t0 = performance.now()
  const value = fn()
  return { value, ms: performance.now() - t0 }
}
