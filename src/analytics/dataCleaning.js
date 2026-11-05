import { KNOWN_CITIES } from '../generators/syntheticData.js'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const sorted = (s) => s.toLowerCase().split('').sort().join('')
const isoDate = /^\d{4}-\d{2}-\d{2}$/

export function fixDate(d) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d
}
export function fixCity(c) {
  if (!c) return c
  const low = c.toLowerCase()
  const exact = KNOWN_CITIES.find((k) => k.toLowerCase() === low)
  if (exact) return exact
  const close = KNOWN_CITIES.find((k) => k.length === low.length && k.toLowerCase()[0] === low[0] && sorted(k) === sorted(low))
  return close || cap(low)
}

/** Count real issues in a record set, by category. */
export function measureQuality(rows) {
  const seen = new Set()
  const q = { duplicates: 0, missing: 0, format: 0, invalid: 0, total: rows.length }
  for (const r of rows) {
    const key = `${r.name.toLowerCase()}|${r.email}`
    if (seen.has(key)) q.duplicates++
    seen.add(key)
    if (!r.name || !r.city || !r.email || r.age === '' || r.age == null) q.missing++
    if (r.name && r.name !== cap(r.name)) q.format++
    if (r.city && r.city !== 'Unknown' && !KNOWN_CITIES.includes(r.city)) q.format++
    if (!isoDate.test(r.date)) q.format++
    const ageStr = String(r.age ?? '')
    if (ageStr !== '' && ageStr !== 'Unknown' && !/^-?\d+$/.test(ageStr)) q.format++
    const age = parseInt(r.age, 10)
    if (Number.isFinite(age) && (age < 0 || age > 120)) q.invalid++
  }
  q.issues = q.duplicates + q.missing + q.format + q.invalid
  q.score = q.total ? Math.max(0, 100 - (q.issues / q.total) * 100 / 2) : 0
  return q
}

/** Apply the chosen cleaning steps. Each flag corresponds to a visitor-selected category. */
export function cleanRecords(rows, opts) {
  let out = rows.map((r) => ({ ...r }))
  if (opts.format) out = out.map((r) => ({ ...r, name: r.name ? cap(r.name) : r.name, city: fixCity(r.city), date: fixDate(r.date), age: r.age === '' ? '' : String(parseInt(r.age, 10)).replace('NaN', '') }))
  if (opts.invalid) out = out.map((r) => { const a = parseInt(r.age, 10); return Number.isFinite(a) && (a < 0 || a > 120) ? { ...r, age: '' } : r })
  if (opts.duplicates) {
    const seen = new Set()
    out = out.filter((r) => { const k = `${r.name.toLowerCase()}|${r.email}`; if (seen.has(k)) return false; seen.add(k); return true })
  }
  if (opts.missing) out = out.map((r) => (r.city ? r : { ...r, city: 'Unknown' })).map((r) => (r.email ? r : { ...r, email: 'unknown@example.test' })).map((r) => (r.age === '' ? { ...r, age: 'Unknown' } : r)).filter((r) => r.name)
  return out
}
