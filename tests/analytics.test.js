import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSales, generateTransactions, generateBaskets, generateTimeSeries, generateDirtyRecords, generateGeoEvents, generateClusterData, generateSupplyChain, generateTrendStreams, generateBISales } from '../src/generators/syntheticData.js'
import { runAggregation, groupCount, declineShare, scanQuery, buildCube, cubeQuery } from '../src/analytics/aggregation.js'
import { anomalyBreakdown, topAnomalies } from '../src/analytics/anomalies.js'
import { ruleMetrics } from '../src/analytics/associationRules.js'
import { forecastNext, linearFit } from '../src/analytics/forecasting.js'
import { kMeans, detectStructure } from '../src/analytics/clustering.js'
import { measureQuality, cleanRecords } from '../src/analytics/dataCleaning.js'
import { validatePipeline } from '../src/analytics/pipelineValidation.js'
import { gridDensity, findHotspots } from '../src/analytics/spatial.js'
import { supplyProjection, hospitalProjection, trafficProjection } from '../src/analytics/scenarios.js'
import { generateHospital } from '../src/generators/syntheticData.js'
import { trendMetrics } from '../src/analytics/trends.js'

test('seeded generation is deterministic', () => {
  assert.deepEqual(generateSales(50, 3), generateSales(50, 3))
})
test('aggregation counts match', () => {
  const g = groupCount([{ a: 1 }, { a: 1 }, { a: 2 }], (r) => r.a)
  assert.equal(g[0].key, 1); assert.equal(g[0].count, 2); assert.ok(Math.abs(g[0].pct - 66.666) < 0.01)
  const r = runAggregation(generateSales(5000, 2), 'product')
  assert.equal(r.records, 5000)
  assert.equal(r.groups.reduce((s, x) => s + x.count, 0), 5000)
})
test('anomaly score bounded and injected anomalies rank high', () => {
  const { profile, rows } = generateTransactions(5000, 4, 0.01)
  const top = topAnomalies(rows, profile, 5)
  assert.ok(top.every((t) => t.score <= 100))
  assert.ok(top[0].score >= 60)
  assert.equal(anomalyBreakdown({ amount: 45, location: 'Barrie', device: 'Phone A', hour: 12, frequency: 0 }, profile).score, 0)
})
test('support/confidence/lift', () => {
  const b = [['a', 'b'], ['a', 'b'], ['a'], ['b'], ['c']]
  const m = ruleMetrics(b, 'a', 'b')
  assert.equal(m.support, 0.4); assert.ok(Math.abs(m.confidence - 2 / 3) < 1e-9); assert.ok(Math.abs(m.lift - (2 / 3) / 0.6) < 1e-9)
  const bs = generateBaskets(3000, 1)
  assert.ok(ruleMetrics(bs, 'Bread', 'Butter').lift > 1.5)
})
test('forecast recovers linear trend', () => {
  const f = linearFit([1, 3, 5, 7]); assert.ok(Math.abs(f.slope - 2) < 1e-9)
  const ts = generateTimeSeries(24, 5)
  const fc = forecastNext(ts.points.map((p) => p.value))
  assert.ok(fc.lower < fc.forecast && fc.forecast < fc.upper)
})
test('kmeans finds 3 groups', () => {
  const pts = generateClusterData('three', 240, 2)
  const r = kMeans(pts, 3)
  assert.equal(r.sizes.reduce((a, b) => a + b, 0), 240)
  assert.equal(detectStructure(pts).k, 3)
  assert.equal(detectStructure(generateClusterData('trend', 240, 2)).type, 'trend')
  assert.equal(detectStructure(generateClusterData('outliers', 240, 2)).type, 'outliers')
})
test('cleaning reduces issues', () => {
  const rows = generateDirtyRecords(80, 3)
  const before = measureQuality(rows)
  const after = measureQuality(cleanRecords(rows, { format: true, invalid: true, duplicates: true, missing: true }))
  assert.ok(before.issues > 0); assert.equal(after.issues, 0)
})
test('pipeline validation', () => {
  const ok = { sources: ['Website', 'Store'], ingestion: 'Stream', processing: ['Clean', 'Join', 'Aggregate'], storage: 'Warehouse', destination: 'Dashboard' }
  assert.equal(validatePipeline(ok).valid, true)
  assert.equal(validatePipeline({ ...ok, ingestion: 'Batch' }).valid, false)
  assert.equal(validatePipeline(null).valid, false)
})
test('hotspot detection', () => {
  const grid = gridDensity(generateGeoEvents('Sales', 5000, 1))
  assert.equal(grid.cells.reduce((s, c) => s + c.count, 0), 5000)
  assert.ok(findHotspots(grid).length >= 1)
})
test('scenarios', () => {
  const sc = generateSupplyChain(1)
  assert.ok(supplyProjection(sc, 'wait').stockout > supplyProjection(sc, 'transfer').stockout)
  const h = generateHospital(1)
  assert.ok(hospitalProjection(h, 'treatment').wait < hospitalProjection(h, 'none').wait)
  assert.ok(trafficProjection(42, 113, 'lights').after < 113)
})
test('trend: fastest growing differs from most popular', () => {
  const m = trendMetrics(generateTrendStreams(12, 1))
  assert.notEqual(m.popular.name, m.fastest.name)
})
test('query race cube equals scan', () => {
  const rows = generateSales(20000, 1).map((r, i) => ({ ...r, half: i % 2 }))
  const cube = buildCube(rows)
  for (const q of ['product', 'region', 'hour', 'average', 'growth']) {
    const a = scanQuery(rows, q).result, b = cubeQuery(cube, q).result
    assert.equal(a.label, b.label); assert.ok(Math.abs(a.value - b.value) < 1e-9)
  }
})
test('BI decline share', () => {
  const rows = generateBISales(1)
  const d = declineShare(rows, { region: 'Western Ontario', product: 'Product X', channel: 'Online' })
  assert.ok(d.share > 50 && d.share <= 100.0001)
})
