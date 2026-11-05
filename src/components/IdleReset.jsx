import useIdleReset from '../hooks/useIdleReset.js'

export default function IdleReset({ onReset, idleMs, warnMs }) {
  const { warning, secondsLeft, stay } = useIdleReset({ idleMs, warnMs, onReset })
  if (!warning) return null
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="idle-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card max-w-lg text-center">
        <h2 id="idle-title" className="text-4xl font-black">STILL THERE?</h2>
        <p className="mt-3 text-xl">Returning to the Arcade in {secondsLeft} seconds...</p>
        <button type="button" autoFocus className="btn btn-primary mt-6" onClick={stay}>I&apos;M STILL HERE</button>
      </div>
    </div>
  )
}
