/** Support, confidence and lift for the rule A -> B. */
export function ruleMetrics(baskets, a, b) {
  const n = baskets.length
  let ca = 0, cb = 0, cab = 0
  for (const bk of baskets) {
    const ha = bk.includes(a), hb = bk.includes(b)
    if (ha) ca++
    if (hb) cb++
    if (ha && hb) cab++
  }
  const support = n ? cab / n : 0
  const confidence = ca ? cab / ca : 0
  const pb = n ? cb / n : 0
  const lift = pb ? confidence / pb : 0
  return { n, countA: ca, countB: cb, countAB: cab, support, confidence, lift }
}

export function pairCounts(baskets) {
  const m = new Map()
  for (const bk of baskets) {
    const s = [...bk].sort()
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const k = `${s[i]}|${s[j]}`
      m.set(k, (m.get(k) || 0) + 1)
    }
  }
  return m
}

export function rankPartners(baskets, a, candidates) {
  return candidates.filter((c) => c !== a).map((c) => ({ item: c, ...ruleMetrics(baskets, a, c) })).sort((x, y) => y.lift - x.lift)
}
