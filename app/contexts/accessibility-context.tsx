"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export type ColorScheme =
  | "default"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "monochrome"
  | "high-contrast"

interface AccessibilityContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  toggleDarkMode: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const COLOR_SCHEME_STORAGE_KEY = "mm-color-scheme"

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("default")

  const applyColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
      document.documentElement.setAttribute("data-color-scheme", scheme)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) as ColorScheme | null
    const initial = stored ?? "default"
    applyColorScheme(initial)
  }, [])

  const resolvedTheme = theme === "system" ? systemTheme : theme
  const isDarkMode = resolvedTheme === "dark"

  const setIsDarkMode = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light")
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const value: AccessibilityContextType = {
    colorScheme,
    setColorScheme: applyColorScheme,
    isDarkMode: !!isDarkMode,
    setIsDarkMode,
    toggleDarkMode,
  }

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}

