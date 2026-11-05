import { useCallback, useEffect, useRef, useState } from 'react'

const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel']

/** Kiosk idle detection: warns after `idleMs`, resets after `warnMs` more unless the visitor responds. */
export default function useIdleReset({ idleMs = 90000, warnMs = 10000, onReset }) {
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.round(warnMs / 1000))
  const warnRef = useRef(false)
  const lastActive = useRef(0)
  const resetRef = useRef(onReset)
  useEffect(() => { resetRef.current = onReset })

  const stay = useCallback(() => {
    lastActive.current = Date.now()
    warnRef.current = false
    setWarning(false)
  }, [])

  useEffect(() => {
    lastActive.current = Date.now()
    const mark = () => { if (!warnRef.current) lastActive.current = Date.now() }
    EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const id = setInterval(() => {
      const idle = Date.now() - lastActive.current
      if (idle >= idleMs + warnMs) {
        warnRef.current = false
        setWarning(false)
        lastActive.current = Date.now()
        resetRef.current?.()
      } else if (idle >= idleMs) {
        warnRef.current = true
        setWarning(true)
        setSecondsLeft(Math.max(0, Math.ceil((idleMs + warnMs - idle) / 1000)))
      }
    }, 500)
    return () => {
      clearInterval(id)
      EVENTS.forEach((e) => window.removeEventListener(e, mark))
    }
  }, [idleMs, warnMs])

  return { warning, secondsLeft, stay }
}
