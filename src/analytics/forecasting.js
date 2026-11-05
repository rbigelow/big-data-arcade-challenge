/** Least squares linear trend. */
export function linearFit(ys) {
  const n = ys.length
  const xs = ys.map((_, i) => i)
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2 }
  const slope = den ? num / den : 0
  return { slope, intercept: my - slope * mx }
}

/** Seasonal indices (additive) = mean residual per position in the cycle. */
export function seasonalIndices(ys, fit, period) {
  const sums = Array(period).fill(0), cnt = Array(period).fill(0)
  ys.forEach((y, i) => { sums[i % period] += y - (fit.intercept + fit.slope * i); cnt[i % period]++ })
  return sums.map((s, i) => (cnt[i] ? s / cnt[i] : 0))
}

/** Trend + seasonality forecast with an approximate 80% interval from residual SD. */
export function forecastNext(ys, period = 12) {
  const fit = linearFit(ys)
  const seas = ys.length >= period * 2 ? seasonalIndices(ys, fit, period) : Array(period).fill(0)
  const t = ys.length
  const trendOnly = fit.intercept + fit.slope * t
  const forecast = trendOnly + seas[t % period]
  const resid = ys.map((y, i) => y - (fit.intercept + fit.slope * i + seas[i % period]))
  const sd = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / Math.max(1, resid.length - 2))
  return { forecast, lower: forecast - 1.28 * sd, upper: forecast + 1.28 * sd, sd, fit, seasonal: seas, trendOnly }
}

export const naiveLast = (ys) => ys[ys.length - 1]
export function movingAverage(ys, w = 3) {
  return ys.map((_, i) => {
    const s = ys.slice(Math.max(0, i - w + 1), i + 1)
    return s.reduce((a, b) => a + b, 0) / s.length
  })
}
/** Indexes whose residual from the fit exceeds k SD. */
export function findOutliers(ys, k = 3) {
  const fit = linearFit(ys)
  const res = ys.map((y, i) => y - (fit.intercept + fit.slope * i))
  const mean = res.reduce((a, b) => a + b, 0) / res.length
  const sd = Math.sqrt(res.reduce((a, b) => a + (b - mean) ** 2, 0) / res.length)
  return res.map((r, i) => (sd && Math.abs(r - mean) > k * sd ? i : -1)).filter((i) => i >= 0)
}
