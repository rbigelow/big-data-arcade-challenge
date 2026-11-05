import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function ArcadeHeader({ compact = false }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-8">
      <div className="flex items-center gap-4">
        <Logo />
        <div>
          <p className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black tracking-wide text-ink`}>BIG DATA ARCADE CHALLENGE</p>
          <p className="text-base text-accent">Can you find the story hidden in the data?</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}
