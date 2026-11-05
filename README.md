![BIG DATA CHALLENGE ARCADE logo](https://raw.githubusercontent.com/rbigelow/big-data-arcade-challenge/refs/heads/main/logo.png)
# BIG DATA ARCADE CHALLENGE

> Can you find the story hidden in the data?

An interactive, touch-first exhibit for a Big Data Analytics program open house. Visitors pick a challenge, make one or two simple choices, watch synthetic data being processed, and discover an insight in 1–3 minutes. No typing, no backend.

**All data is SYNTHETIC**, generated in the browser. Nothing represents real Georgian College operations, and every displayed result is calculated from the generated records.

## Light and dark mode

Use the **Light mode / Dark mode** button in the header. The first visit follows the system preference (`prefers-color-scheme`); the choice is then remembered in `localStorage`. Colours come from CSS variables in `src/index.css`, and charts read the matching palette from `src/hooks/useTheme.jsx`.

## The 15 activities

| # | Activity | Technique |
|---|----------|-----------|
| 1 | 🏎️ Human vs Big Data | Data at scale (aggregation) |
| 2 | 🕵️ Find the Fraud | Anomaly detection |
| 3 | 🌎 Data Pulse | Streaming analytics |
| 4 | 📊 Dashboard Detective | Business intelligence |
| 5 | 🛒 Basket Detective | Association rules |
| 6 | 🌡️ Smart City Command Centre | IoT analytics |
| 7 | 🏥 Hospital Data Command Centre | Operational simulation (not a clinical tool) |
| 8 | 🧹 Clean the Data | Data quality |
| 9 | 🧩 Build the Data Pipeline | Data engineering |
| 10 | 📈 Predict the Future | Forecasting |
| 11 | 🔎 Query Race | Query optimization |
| 12 | 🗺️ Hotspot Hunter | Geospatial analytics |
| 13 | 📦 Supply Chain Rescue | Scenario analysis |
| 14 | 🎵 What's Trending? | Trend analysis |
| 15 | 🧠 Pattern Hunter | Clustering (k-means) |

## Technology stack

React, Vite, JavaScript/JSX, Tailwind CSS v4, Framer Motion, Lucide React, Recharts, HTML Canvas (Hotspot Hunter), ESLint. Activities are code-split with `React.lazy`. No TypeScript, no backend.

## Installation and commands

```bash
npm install
npm run dev       # development server
npm run lint      # ESLint
npm run build     # production build in dist/
npm run preview   # serve the production build
npm test          # unit tests for the analytics (node:test)
```

## Logo setup

Place the authorised logo at `public/logo.png`. If it is missing, a neutral same-sized placeholder is shown. Do not recreate the official logo. The footer QR code is a placeholder; no destination is invented.

## Project structure

```
src/
  components/   shared UI (header, home, Behind the Data, pipeline, idle reset, ...)
  activities/   the 15 activities
  analytics/    aggregation, anomalies, associationRules, forecasting, clustering,
                dataCleaning, pipelineValidation, spatial, scenarios, trends
  generators/   seeded synthetic data generators
  data/         activityRegistry.js
  hooks/        useIdleReset, useSimulation, useReducedMotion, useTheme, useAlive
```

**Adding an activity:** create a component in `src/activities/` (wrap it in `ActivityShell`) and add one entry to `src/data/activityRegistry.js`.

## Synthetic data

`src/generators/syntheticData.js` provides seeded (deterministic) generators for sales, transactions, events, baskets, IoT sensors, hospital operations, dirty records, time series, geographic events, supply chains, trend streams and cluster datasets. Activities use a fresh random seed each session; tests use fixed seeds.

## Kiosk setup

After 90 seconds of inactivity a "STILL THERE?" dialog appears. If unanswered after 10 seconds, running simulations are cancelled, the app returns home, session statistics are cleared and new synthetic data is generated on the next play. Run the browser in full-screen kiosk mode, for example `chromium --kiosk http://localhost:4173` after `npm run build && npm run preview`.

## Accessibility

Keyboard navigation and visible focus, semantic HTML, ARIA labels, text descriptions for charts, 48px+ touch targets, non-colour indicators (icons, text, patterns), high-contrast light and dark themes, and `prefers-reduced-motion` support (animations and streams are reduced). Errors never leave a blank screen: they show WHAT HAPPENED, HOW TO FIX IT, RETRY and BACK TO ARCADE.

## Analytical techniques

- **Aggregation:** hash-map GROUP BY / COUNT with measured processing time.
- **Anomaly score:** weighted features (amount z-score, location, device, hour, frequency) against a profile, max 100. An anomaly is not proof of fraud.
- **Streaming:** rolling aggregates; anomaly = more than 3 SD from the rolling mean.
- **BI drill-down:** share of the gross decline for the selected segment.
- **Association rules:** support, confidence, lift.
- **IoT:** baseline z-score anomaly and linear short-term forecast; scenario projection.
- **Operational/supply-chain scenarios:** transparent capacity and stock-cover models with fixed assumptions.
- **Data quality:** rule-based standardisation, validation, de-duplication, missing-value handling; before/after counts.
- **Pipeline validation:** rule checks of the configuration.
- **Forecasting:** least-squares trend + additive seasonal index, ±1.28 SD interval (about 80%). Forecasts are estimates, not certainty.
- **Query race:** a real full scan vs. pre-aggregated tables over 1,000,000 generated records; times are measured in your browser and vary by device. Both approaches are verified to return the same answer.
- **Hotspots:** 8×8 spatial buckets, density vs. expected uniform count.
- **Trends:** growth rate, velocity, moving average, share, rank change.
- **Clustering:** k-means (k-means++ seeding) with an elbow rule, Pearson correlation for trends, distance z-score for outliers.

Nothing here is AI; all techniques are deterministic statistics.

## Testing checklist

- [x] All 15 cards appear
- [x] All activities open and complete (verified in a browser run)
- [x] Back navigation works
- [x] No typing required
- [x] Synthetic data labels present
- [x] Displayed metrics derive from data (`npm test` covers aggregation, anomaly scores, support/confidence/lift, forecasts, cleaning, clustering, hotspots, trends, scenarios, query-race equivalence)
- [x] Light and dark mode toggle and persistence
- [x] Idle reset implemented (`src/hooks/useIdleReset.js`)
- [ ] Touchscreen, tablet/mobile, 1920×1080 and 1366×768 — verify on the exhibit hardware
- [x] `npm run lint` and `npm run build` pass

## Troubleshooting

- **Blank logo:** add `public/logo.png`.
- **Chart or simulation error:** use RETRY or BACK TO ARCADE.
- **Query Race is slow:** it generates 1,000,000 records in the browser; allow a few seconds on slower devices.
- **Unsupported browser:** use a current Chrome, Edge, Firefox or Safari.
