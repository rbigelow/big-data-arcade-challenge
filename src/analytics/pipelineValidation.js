export const PIPELINE_OPTIONS = {
  sources: ['Website', 'Store', 'Mobile app', 'Sensors'],
  ingestion: ['Batch', 'Stream'],
  processing: ['Clean', 'Validate', 'Join', 'Filter', 'Aggregate'],
  storage: ['Data lake', 'Warehouse'],
  destination: ['Dashboard', 'Forecast', 'Application'],
}

/** Validate a pipeline configuration for the "live sales dashboard" scenario. */
export function validatePipeline(cfg) {
  const issues = [], notes = []
  if (!cfg || typeof cfg !== 'object') return { valid: false, issues: ['No pipeline configuration was provided.'], notes }
  if (!cfg.sources?.length) issues.push('Choose at least one data source.')
  if (!cfg.ingestion) issues.push('Choose how data is ingested.')
  if (!cfg.processing?.length) issues.push('Choose at least one processing step.')
  if (!cfg.storage) issues.push('Choose where the data is stored.')
  if (!cfg.destination) issues.push('Choose a destination.')
  if (issues.length) return { valid: false, issues, notes }
  const p = cfg.processing
  if (cfg.ingestion === 'Batch') issues.push('A LIVE dashboard needs streaming ingestion; batch loads leave it stale.')
  if (!p.includes('Aggregate')) issues.push('A dashboard needs an Aggregate step to turn records into totals.')
  if (!p.includes('Clean') && !p.includes('Validate')) issues.push('Add Clean or Validate so bad records do not reach the dashboard.')
  if (cfg.sources.length > 1 && !p.includes('Join')) issues.push('Multiple sources need a Join step to combine them.')
  if (cfg.sources.includes('Sensors') && cfg.sources.length === 1) issues.push('Sensor data alone does not contain sales; add Website, Store or Mobile app.')
  if (cfg.storage === 'Data lake' && cfg.destination === 'Dashboard') notes.push('A warehouse often serves dashboards faster, but a lake can work.')
  if (cfg.destination === 'Forecast' && !p.includes('Aggregate')) issues.push('Forecasting needs aggregated history.')
  return { valid: issues.length === 0, issues, notes }
}
