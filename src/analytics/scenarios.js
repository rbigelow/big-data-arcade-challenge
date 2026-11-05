import { clampN } from './util.js'

/** Hospital: projected wait using a simple capacity model (geometric mean of room and staff throughput). SYNTHETIC. */
export function hospitalProjection(h, action) {
  const eff = { rooms: h.roomsOpen, staff: h.staff, discharge: 0 }
  if (action === 'treatment') eff.rooms += 6
  if (action === 'staff') eff.staff += 3
  if (action === 'discharge') eff.discharge = 6
  if (action === 'support') eff.staff += 4
  const roomThroughput = eff.rooms * 0.7
  const staffThroughput = eff.staff * (60 / h.minutesPerPatientPerStaff)
  const capacityPerHour = Math.sqrt(roomThroughput * staffThroughput)
  const arrivals = h.predictedArrivalsPerHour
  const queue = Math.max(0, h.waiting - eff.discharge + (arrivals - capacityPerHour) * 3)
  const wait = clampN((queue / Math.max(0.5, capacityPerHour)) * 60, 0, 600)
  return {
    wait: Math.round(wait),
    roomUtil: Math.round(clampN((arrivals / roomThroughput) * 100, 0, 200)),
    staffUtil: Math.round(clampN((arrivals / staffThroughput) * 100, 0, 200)),
    capacityPerHour,
  }
}

/** City traffic: projected vehicles/min and congestion. */
export function trafficProjection(normal, current, action) {
  const factor = { lights: 0.72, transit: 0.82, investigate: 0.95, ignore: 1.08 }[action] ?? 1
  const after = current * factor
  const delay = (v) => Math.max(0, Math.round((v - normal) * 0.35))
  return { before: current, after: Math.round(after), delayBefore: delay(current), delayAfter: delay(after) }
}

/** Supply chain scenario simulation: stockout risk from hours of stock cover vs. delay. */
export function supplyProjection(sc, action) {
  const opts = {
    reroute: { cost: sc.baseCost * 1.18, delay: 30, extraStock: 0 },
    backup: { cost: sc.baseCost * 1.32, delay: 18, extraStock: sc.backupStock },
    transfer: { cost: sc.baseCost * 1.08, delay: 6, extraStock: sc.transferableStock },
    wait: { cost: sc.baseCost, delay: sc.delayHours, extraStock: 0 },
  }
  const o = opts[action] || opts.wait
  const coverHours = ((sc.inventoryUnits + o.extraStock) / sc.dailyDemand) * 24
  const window = o.delay + 12
  const stockout = clampN(((window - coverHours) / window) * 100, 0, 100)
  return {
    cost: Math.round(o.cost), delay: o.delay, coverHours: Math.round(coverHours), stockout: Math.round(stockout),
    customers: Math.round((stockout / 100) * sc.customersPerDay * (o.delay / 24)),
  }
}
