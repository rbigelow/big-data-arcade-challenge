import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'bdac-theme'
const PALETTES = {
  dark: { data1: '#77c5d5', data2: '#64a70b', data3: '#f3d03e', data4: '#ff9a3d', grid: '#24506f', text: '#ffffff', card: '#0b2235' },
  light: { data1: '#00778b', data2: '#3f7a00', data3: '#c79a00', data4: '#e57200', grid: '#c9d8e4', text: '#0b2235', card: '#ffffff' },
}

const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, colors: PALETTES.dark })

function initialTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* storage unavailable: theme still applies for this session */ }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle, colors: PALETTES[theme] }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
