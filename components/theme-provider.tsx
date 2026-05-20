'use client'

import * as React from 'react'

type ThemeOption = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemeOption
  enableSystem?: boolean
  attribute?: string
  disableTransitionOnChange?: boolean
  storageKey?: string
}

type ThemeContextValue = {
  theme: ThemeOption
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
  setTheme: (theme: ThemeOption) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeOption, attribute: string, enableColorScheme: boolean) {
  const element = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme

  if (attribute === 'class') {
    element.classList.remove('light', 'dark')
    element.classList.add(resolved)
  } else {
    element.setAttribute(attribute, resolved)
  }

  if (enableColorScheme) {
    element.style.colorScheme = resolved
  }
}

function disableTransitionOnChange() {
  const style = document.createElement('style')
  style.setAttribute('data-theme-transition-disable', 'true')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }, 0)
  })
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
  attribute = 'class',
  disableTransitionOnChange: disableTransition = false,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeOption>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const setTheme = React.useCallback(
    (nextTheme: ThemeOption) => {
      setThemeState(nextTheme)
      try {
        window.localStorage.setItem(storageKey, nextTheme)
      } catch {}
    },
    [storageKey]
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(storageKey) as ThemeOption | null
    if (storedTheme) {
      setThemeState(storedTheme)
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    updateSystemTheme(media)

    if (media.addEventListener) {
      media.addEventListener('change', updateSystemTheme)
    } else {
      media.addListener(updateSystemTheme)
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', updateSystemTheme)
      } else {
        media.removeListener(updateSystemTheme)
      }
    }
  }, [storageKey])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (disableTransition) {
      disableTransitionOnChange()
    }

    applyTheme(resolvedTheme, attribute, enableSystem)
  }, [resolvedTheme, attribute, enableSystem, disableTransition])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [theme, resolvedTheme, systemTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
