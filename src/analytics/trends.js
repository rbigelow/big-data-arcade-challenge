/** Trend metrics from windowed counts. */
export function trendMetrics(streams) {
  const w = streams[0].counts.length
  const totalLast = streams.reduce((s, r) => s + r.counts[w - 1], 0)
  const rank = (arr, key) => [...arr].sort((a, b) => b[key] - a[key]).map((r, i) => [r.name, i + 1])
  const rows = streams.map((r) => {
    const last = r.counts[w - 1], prev = r.counts[w - 2], first = r.counts[0]
    const recent = r.counts.slice(-3)
    return {
      name: r.name, counts: r.counts, last,
      growth: prev ? ((last - prev) / prev) * 100 : 0,
      velocity: last - prev,
      cumulative: first ? ((last - first) / first) * 100 : 0,
      movingAvg: recent.reduce((a, b) => a + b, 0) / recent.length,
      share: totalLast ? (last / totalLast) * 100 : 0,
      earlyShare: 0,
    }
  })
  const totalFirst = streams.reduce((s, r) => s + r.counts[0], 0)
  rows.forEach((r, i) => { r.earlyShare = totalFirst ? (streams[i].counts[0] / totalFirst) * 100 : 0 })
  const earlyRank = Object.fromEntries(rank(streams.map((r) => ({ name: r.name, v: r.counts[0] })), 'v'))
  const nowRank = Object.fromEntries(rank(rows.map((r) => ({ name: r.name, v: r.last })), 'v'))
  rows.forEach((r) => { r.rankChange = earlyRank[r.name] - nowRank[r.name]; r.rank = nowRank[r.name] })
  const popular = [...rows].sort((a, b) => b.last - a.last)[0]
  const fastest = [...rows].sort((a, b) => b.cumulative - a.cumulative)[0]
  return { rows, popular, fastest }
}
