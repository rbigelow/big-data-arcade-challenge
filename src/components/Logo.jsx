import { useState } from 'react'

export default function Logo({ className = 'h-16 w-40' }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return (
      <div role="img" aria-label="Logo placeholder" className={`${className} flex items-center justify-center rounded-2xl border-2 border-dashed border-line text-xs font-bold text-muted`}>
        LOGO
      </div>
    )
  }
  return <img src="/logo.png" alt="Program logo" className={`${className} object-contain`} onError={() => setMissing(true)} />
}
