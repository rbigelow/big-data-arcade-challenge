import { lazy } from 'react'

/** Add an activity: create a component in src/activities and add one entry here. */
export const ACTIVITIES = [
  { id: 'human-vs-data', emoji: '🏎️', title: 'Human vs Big Data', tagline: 'Can you analyze a million records?', technique: 'DATA AT SCALE', component: lazy(() => import('../activities/HumanVsBigData.jsx')) },
  { id: 'fraud', emoji: '🕵️', title: 'Find the Fraud', tagline: 'Can you catch the anomaly?', technique: 'ANOMALY DETECTION', component: lazy(() => import('../activities/FindTheFraud.jsx')) },
  { id: 'data-pulse', emoji: '🌎', title: 'Data Pulse', tagline: 'Watch data arrive in real time.', technique: 'STREAMING ANALYTICS', component: lazy(() => import('../activities/DataPulse.jsx')) },
  { id: 'dashboard', emoji: '📊', title: 'Dashboard Detective', tagline: 'Solve the mystery in the charts.', technique: 'BUSINESS INTELLIGENCE', component: lazy(() => import('../activities/DashboardDetective.jsx')) },
  { id: 'basket', emoji: '🛒', title: 'Basket Detective', tagline: 'Which products belong together?', technique: 'ASSOCIATION RULES', component: lazy(() => import('../activities/BasketDetective.jsx')) },
  { id: 'smart-city', emoji: '🌡️', title: 'Smart City Command Centre', tagline: 'Can data keep the city moving?', technique: 'IOT ANALYTICS', component: lazy(() => import('../activities/SmartCity.jsx')) },
  { id: 'hospital', emoji: '🏥', title: 'Hospital Data Command Centre', tagline: 'Can analytics reduce the wait?', technique: 'OPERATIONAL SIMULATION', component: lazy(() => import('../activities/HospitalCommandCentre.jsx')) },
  { id: 'clean', emoji: '🧹', title: 'Clean the Data', tagline: 'Can you fix the dataset?', technique: 'DATA QUALITY', component: lazy(() => import('../activities/CleanTheData.jsx')) },
  { id: 'pipeline', emoji: '🧩', title: 'Build the Data Pipeline', tagline: 'Can you connect data to insight?', technique: 'DATA ENGINEERING', component: lazy(() => import('../activities/BuildThePipeline.jsx')) },
  { id: 'predict', emoji: '📈', title: 'Predict the Future', tagline: 'What happens next?', technique: 'FORECASTING', component: lazy(() => import('../activities/PredictTheFuture.jsx')) },
  { id: 'query-race', emoji: '🔎', title: 'Query Race', tagline: 'Ask a million records a question.', technique: 'QUERY OPTIMIZATION', component: lazy(() => import('../activities/QueryRace.jsx')) },
  { id: 'hotspot', emoji: '🗺️', title: 'Hotspot Hunter', tagline: 'Where is activity clustering?', technique: 'GEOSPATIAL ANALYTICS', component: lazy(() => import('../activities/HotspotHunter.jsx')) },
  { id: 'supply-chain', emoji: '📦', title: 'Supply Chain Rescue', tagline: 'Can data save the shipment?', technique: 'SCENARIO ANALYSIS', component: lazy(() => import('../activities/SupplyChainRescue.jsx')) },
  { id: 'trending', emoji: '🎵', title: "What's Trending?", tagline: 'Can you spot the trend first?', technique: 'TREND ANALYSIS', component: lazy(() => import('../activities/WhatsTrending.jsx')) },
  { id: 'pattern', emoji: '🧠', title: 'Pattern Hunter', tagline: 'Can you see the pattern before analytics?', technique: 'CLUSTERING', component: lazy(() => import('../activities/PatternHunter.jsx')) },
]
