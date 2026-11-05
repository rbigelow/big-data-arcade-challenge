import { useEffect, useRef } from 'react'

/** Returns helpers for cancellable async flows: wait(ms) rejects-silently (never resolves) after unmount. */
export default function useAlive() {
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(alive.current), ms))
  return { alive, wait }
}
