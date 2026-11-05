import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const toLight = theme === 'dark'
  return (
    <button type="button" className="btn" onClick={toggle} aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}>
      {toLight ? <Sun aria-hidden="true" size={22} /> : <Moon aria-hidden="true" size={22} />}
      <span>{toLight ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
