import { useEffect, useRef } from 'react'

/** Runs `onTick(tickNumber)` every `ms` while `running`. Cleans up on unmount (cancels simulation). */
export default function useSimulation(onTick, ms, running = true) {
  const cb = useRef(onTick)
  useEffect(() => { cb.current = onTick })
  useEffect(() => {
    if (!running) return undefined
    let n = 0
    const id = setInterval(() => cb.current(n++), ms)
    return () => clearInterval(id)
  }, [ms, running])
}
