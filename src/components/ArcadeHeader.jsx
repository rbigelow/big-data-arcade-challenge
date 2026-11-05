import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function ArcadeHeader({ compact = false }) {
  return (
    <header className="grid grid-cols-3 items-center gap-4 px-4 pt-6 sm:px-8">
      <div className="col-start-2 flex items-center justify-self-center gap-4">
        <Logo />

      </div>
      <div className="col-start-3 justify-self-end">
        <ThemeToggle />
      </div>
    </header>
  )
}
