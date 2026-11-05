// Reusable, deterministic (seeded) synthetic data generators. ALL data is SYNTHETIC.

export function makeRng(seed = 1) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1))
  next.pick = (arr) => arr[Math.floor(next() * arr.length)]
  next.normal = (mean = 0, sd = 1) => {
    const u = Math.max(next(), 1e-12)
    const v = next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  next.weighted = (items, weights) => {
    const total = weights.reduce((s, w) => s + w, 0)
    let r = next() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
  return next
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31)

export const PRODUCTS = ['Coffee', 'Sandwich', 'Notebook', 'Headphones', 'Water', 'Snack Bar', 'Backpack', 'Charger']
export const LOCATIONS = ['Barrie', 'Orillia', 'Owen Sound', 'Orangeville', 'Midland', 'Collingwood']
const PRODUCT_WEIGHTS = [26, 20, 9, 6, 17, 12, 5, 5]
const LOCATION_WEIGHTS = [24, 14, 12, 16, 10, 20]

/** Sales transactions with a biased distribution so a real winner emerges. */
export function generateSales(n, seed = 1) {
  const rng = makeRng(seed)
  const rows = new Array(n)
  const hourW = Array.from({ length: 24 }, (_, h) => (h >= 11 && h <= 13 ? 6 : h >= 8 && h <= 20 ? 3 : 0.4))
  const hours = Array.from({ length: 24 }, (_, h) => h)
  for (let i = 0; i < n; i++) {
    rows[i] = {
      id: i + 1,
      product: rng.weighted(PRODUCTS, PRODUCT_WEIGHTS),
      location: rng.weighted(LOCATIONS, LOCATION_WEIGHTS),
      hour: rng.weighted(hours, hourW),
      amount: Math.round((rng.normal(18, 8) + 2) * 100) / 100,
    }
  }
  return rows
}

export const MERCHANTS = ['GroceryMart', 'FuelUp', 'TechHub', 'CafeNorth', 'BookNook', 'GameZone']
export const DEVICES = ['Phone A', 'Laptop B', 'Tablet C', 'Unknown device']
export const CITIES = ['Barrie', 'Toronto', 'Orillia', 'Ottawa']

/** Transactions with a customer profile. Anomalies are injected at a known rate. */
export function generateTransactions(n, seed = 1, anomalyRate = 0.004) {
  const rng = makeRng(seed)
  const profile = { homeCity: 'Barrie', usualDevice: 'Phone A', meanAmount: 45, sdAmount: 15 }
  const rows = new Array(n)
  for (let i = 0; i < n; i++) {
    const anomalous = rng() < anomalyRate
    rows[i] = {
      id: i + 1,
      amount: Math.max(2, Math.round(anomalous ? rng.normal(420, 120) : rng.normal(profile.meanAmount, profile.sdAmount))),
      location: anomalous && rng() < 0.8 ? rng.pick(['Lagos', 'Oslo', 'Lima', 'Perth']) : profile.homeCity,
      hour: anomalous && rng() < 0.7 ? rng.int(1, 4) : rng.int(8, 21),
      device: anomalous && rng() < 0.7 ? 'Unknown device' : profile.usualDevice,
      merchant: rng.pick(MERCHANTS),
      frequency: anomalous && rng() < 0.7 ? rng.int(5, 12) : rng.int(0, 2),
      injected: anomalous,
    }
  }
  return { profile, rows }
}

export const EVENT_TYPES = ['Sales', 'Web visits', 'Sensors', 'Shipments', 'Errors', 'Customer interactions']
export function generateEventBatch(count, rng, sources = 47) {
  const weights = [18, 34, 30, 8, 2, 8]
  const out = new Array(count)
  for (let i = 0; i < count; i++) {
    const type = rng.weighted(EVENT_TYPES, weights)
    out[i] = { type, source: rng.int(1, sources), value: Math.abs(rng.normal(100, 30)) }
  }
  return out
}

export const BASKET_PRODUCTS = ['Bread', 'Butter', 'Soda', 'Shampoo', 'Batteries', 'Milk', 'Eggs', 'Chips', 'Jam']
/** Shopping baskets with planted associations (Bread+Butter strong, Bread+Soda weak). */
export function generateBaskets(n, seed = 1) {
  const rng = makeRng(seed)
  const baskets = []
  for (let i = 0; i < n; i++) {
    const b = new Set()
    if (rng() < 0.35) {
      b.add('Bread')
      if (rng() < 0.62) b.add('Butter')
      if (rng() < 0.3) b.add('Jam')
      if (rng() < 0.15) b.add('Soda')
    } else {
      if (rng() < 0.12) b.add('Butter')
      if (rng() < 0.18) b.add('Soda')
    }
    if (rng() < 0.1) b.add('Shampoo')
    if (rng() < 0.08) b.add('Batteries')
    if (rng() < 0.3) b.add('Milk')
    if (rng() < 0.2) b.add('Eggs')
    if (rng() < 0.15) b.add('Chips')
    if (b.size === 0) b.add(rng.pick(BASKET_PRODUCTS))
    baskets.push([...b])
  }
  return baskets
}

/** Retail sales for BI drill-down. Product X online in Western Ontario collapses in the second period. */
export const BI_REGIONS = ['Western Ontario', 'Central Ontario', 'Eastern Ontario', 'Northern Ontario']
export const BI_PRODUCTS = ['Product X', 'Product Y', 'Product Z']
export const BI_CHANNELS = ['Online', 'In-store']
export const BI_CUSTOMERS = ['New', 'Returning']
export const BI_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export function generateBISales(seed = 1, perCell = 14) {
  const rng = makeRng(seed)
  const rows = []
  for (const region of BI_REGIONS)
    for (const product of BI_PRODUCTS)
      for (const channel of BI_CHANNELS)
        for (const customer of BI_CUSTOMERS)
          for (let m = 0; m < BI_MONTHS.length; m++) {
            let base = 100 + rng.int(-10, 10)
            if (region === 'Western Ontario' && product === 'Product X' && channel === 'Online' && m >= 3) base *= 0.15
            for (let k = 0; k < perCell; k++)
              rows.push({ region, product, channel, customer, month: BI_MONTHS[m], monthIndex: m, revenue: Math.round(base * rng.normal(1, 0.08)) })
          }
  return rows
}

export const SENSOR_TYPES = ['Traffic', 'Transit', 'Water', 'Electricity', 'Weather', 'Air quality']
export function generateSensorReading(type, tick, rng, surge = false) {
  const wave = Math.sin(tick / 6)
  switch (type) {
    case 'Traffic': return surge ? 113 + rng.normal(0, 3) : 42 + 4 * wave + rng.normal(0, 2)
    case 'Transit': return 78 + 5 * wave + rng.normal(0, 2)
    case 'Water': return 62 + 3 * wave + rng.normal(0, 1.5)
    case 'Electricity': return 540 + 30 * wave + rng.normal(0, 8)
    case 'Weather': return 14 + 2 * wave + rng.normal(0, 0.4)
    default: return 35 + 4 * wave + rng.normal(0, 1.5)
  }
}

export function generateHospital(seed = 1) {
  const rng = makeRng(seed)
  return {
    waiting: 18 + rng.int(0, 4), rooms: 24, roomsOpen: 24, staff: 11, ambulances: 3,
    baseArrivalsPerHour: 11, predictedArrivalsPerHour: 19, minutesPerPatientPerStaff: 38,
  }
}

const FIRST = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Jamie']
const CITY_FIX = ['Barrie', 'Orillia', 'Midland', 'Owen Sound']
const typo = (s) => (s.length > 3 ? s.slice(0, 1) + s.slice(2, 3) + s.slice(1, 2) + s.slice(3) : s)
/** Dirty records with known injected issues per category. */
export function generateDirtyRecords(n = 60, seed = 1) {
  const rng = makeRng(seed)
  const rows = []
  for (let i = 0; i < n; i++) {
    const name = rng.pick(FIRST)
    const city = rng.pick(CITY_FIX)
    const month = rng.int(1, 12), day = rng.int(1, 28)
    rows.push({
      id: i + 1, name, city,
      email: `${name.toLowerCase()}${i}@example.test`,
      age: String(rng.int(18, 70)),
      date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    })
  }
  const dirty = rows.map((r) => ({ ...r }))
  const pickIdx = (frac) => dirty.map((_, i) => i).filter(() => rng() < frac)
  pickIdx(0.12).forEach((i) => { dirty[i].name = dirty[i].name.toUpperCase() })
  pickIdx(0.1).forEach((i) => { dirty[i].city = dirty[i].city.toLowerCase() })
  pickIdx(0.1).forEach((i) => { dirty[i].city = typo(dirty[i].city) })
  pickIdx(0.12).forEach((i) => {
    const [y, m, d] = dirty[i].date.split('-')
    dirty[i].date = `${d}/${m}/${y}`
  })
  pickIdx(0.1).forEach((i) => { dirty[i].age = `${dirty[i].age} yrs` })
  pickIdx(0.08).forEach((i) => { dirty[i].age = rng() < 0.5 ? '-5' : '240' })
  pickIdx(0.1).forEach((i) => { dirty[i][rng.pick(['email', 'city', 'age'])] = '' })
  const dupes = pickIdx(0.1).map((i) => ({ ...dirty[i] }))
  return [...dirty, ...dupes].sort(() => rng() - 0.5)
}

export const KNOWN_CITIES = CITY_FIX

/** Monthly series with trend + seasonality + noise + one outlier. */
export function generateTimeSeries(months = 24, seed = 1) {
  const rng = makeRng(seed)
  const base = 900 + rng.int(-50, 50)
  const slope = 12 + rng.int(0, 6)
  const amp = 70 + rng.int(0, 30)
  const pts = []
  for (let t = 0; t < months; t++) {
    pts.push({ t, value: Math.round(base + slope * t + amp * Math.sin((2 * Math.PI * t) / 12) + rng.normal(0, 18)) })
  }
  const outlier = rng.int(3, months - 4)
  pts[outlier].value += 220
  pts[outlier].outlier = true
  const actual = Math.round(base + slope * months + amp * Math.sin((2 * Math.PI * months) / 12) + rng.normal(0, 18))
  return { points: pts, simulatedActual: actual, period: 12 }
}

export const ZONE_COLS = 'ABCDEFGH'.split('')
export const ZONE_ROWS = 8
export function generateGeoEvents(kind, n, seed = 1) {
  const rng = makeRng(seed)
  const hot = { x: rng.int(2, 6) + 0.5, y: rng.int(1, 6) + 0.5 }
  const hot2 = { x: rng.int(0, 7) + 0.5, y: rng.int(0, 7) + 0.5 }
  const events = new Array(n)
  for (let i = 0; i < n; i++) {
    const r = rng()
    let x, y
    if (r < 0.3) { x = rng.normal(hot.x, 0.35); y = rng.normal(hot.y, 0.35) }
    else if (r < 0.4) { x = rng.normal(hot2.x, 0.6); y = rng.normal(hot2.y, 0.6) }
    else { x = rng() * 8; y = rng() * 8 }
    events[i] = { x: Math.min(7.999, Math.max(0, x)), y: Math.min(7.999, Math.max(0, y)), kind }
  }
  return events
}

export const SC_NODES = ['Supplier', 'Port', 'Warehouse', 'Truck', 'Store']
export function generateSupplyChain(seed = 1) {
  const rng = makeRng(seed)
  return {
    inventoryUnits: 800 + rng.int(-50, 50),
    dailyDemand: 520 + rng.int(-40, 40),
    inTransitUnits: 6000,
    delayHours: 48,
    customersPerDay: 1900 + rng.int(-100, 100),
    backupStock: 2500,
    transferableStock: 1500,
    baseCost: 100000,
  }
}

export const TREND_ITEMS = ['Song: Neon Sunrise', 'Video: Cat Flip', 'Product: Smart Mug', 'Hashtag: #Robots', 'App: PixelPal', 'Song: Slow Static']
/** Synthetic engagement streams: some items are steady-popular, one is growing fastest. */
export function generateTrendStreams(windows = 12, seed = 1) {
  const rng = makeRng(seed)
  const order = TREND_ITEMS.map((n, i) => ({ n, i })).sort(() => rng() - 0.5).map((o) => o.i)
  const base = [900, 700, 300, 200, 150, 500]
  const growth = [1.0, 1.01, 1.04, 1.08, 1.16, 1.03]
  const rows = TREND_ITEMS.map((name, i) => {
    const b = base[order[i]]
    const g = growth[order[i]]
    return { name, counts: Array.from({ length: windows }, (_, w) => Math.round(b * g ** w * rng.normal(1, 0.04))) }
  })
  return rows
}

export const PATTERN_SCENARIOS = ['Customer segments', 'Website behaviour', 'Product demand', 'Equipment readings']
export function generateClusterData(kind, n = 240, seed = 1) {
  const rng = makeRng(seed)
  const pts = []
  const blob = (cx, cy, count, sd) => { for (let i = 0; i < count; i++) pts.push({ x: rng.normal(cx, sd), y: rng.normal(cy, sd) }) }
  if (kind === 'none') for (let i = 0; i < n; i++) pts.push({ x: rng() * 100, y: rng() * 100 })
  else if (kind === 'two') { blob(28, 30, n / 2, 7); blob(72, 70, n / 2, 7) }
  else if (kind === 'three') { blob(22, 25, n / 3, 7); blob(75, 30, n / 3, 7); blob(50, 78, n / 3, 7) }
  else if (kind === 'outliers') {
    blob(50, 50, n - 8, 9)
    for (let i = 0; i < 8; i++) pts.push({ x: rng() < 0.5 ? rng() * 12 : 88 + rng() * 12, y: rng() * 100 })
  } else { for (let i = 0; i < n; i++) { const x = rng() * 100; pts.push({ x, y: 10 + 0.8 * x + rng.normal(0, 6) }) } }
  return pts.map((p) => ({ x: Math.min(100, Math.max(0, p.x)), y: Math.min(100, Math.max(0, p.y)) }))
}
