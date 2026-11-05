import { ZONE_COLS } from '../generators/syntheticData.js'

export const zoneName = (cx, cy) => `${ZONE_COLS[cx]}${cy + 1}`

/** Bucket events into an 8x8 grid and compute density vs. the expected uniform count. */
export function gridDensity(events, size = 8) {
  const counts = Array.from({ length: size }, () => Array(size).fill(0))
  for (const e of events) counts[Math.floor(e.y)][Math.floor(e.x)]++
  const expected = events.length / (size * size)
  const cells = []
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) cells.push({ x, y, zone: zoneName(x, y), count: counts[y][x], ratio: expected ? counts[y][x] / expected : 0 })
  return { cells, expected, max: Math.max(...cells.map((c) => c.count), 0) }
}
export const findHotspots = (grid, minRatio = 2) => grid.cells.filter((c) => c.ratio >= minRatio).sort((a, b) => b.count - a.count)
