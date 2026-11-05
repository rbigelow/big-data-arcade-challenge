/** Large tap-friendly choice buttons. */
export default function Choices({ options, value, onPick, disabled, label }) {
  return (
    <div role="group" aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id
        const text = typeof o === 'string' ? o : o.label
        const sub = typeof o === 'string' ? null : o.sub
        return (
          <button key={id} type="button" className="btn choice" aria-pressed={value === id} disabled={disabled} onClick={() => onPick(id)}>
            <span>{text}</span>
            {sub && <span className="text-sm font-normal text-muted">{sub}</span>}
          </button>
        )
      })}
    </div>
  )
}
