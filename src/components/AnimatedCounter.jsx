import { useEffect, useRef, useState } from 'react'
import useReducedMotion from '../hooks/useReducedMotion.js'

export default function AnimatedCounter({ value, decimals = 0, duration = 600, suffix = '' }) {
  const reduced = useReducedMotion()
  const safe = Number.isFinite(value) ? value : 0
  const [shown, setShown] = useState(safe)
  const from = useRef(safe)
  useEffect(() => {
    if (reduced) { from.current = safe; const id = requestAnimationFrame(() => setShown(safe)); return () => cancelAnimationFrame(id) }
    const start = performance.now(), a = from.current
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const v = a + (safe - a) * (1 - (1 - p) ** 3)
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [safe, duration, reduced])
  return <span>{shown.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>
}
