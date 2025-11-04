"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type ColorScheme = "default" | "protanopia" | "deuteranopia" | "tritanopia" | "monochrome" | "high-contrast"

interface AccessibilityContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  toggleDarkMode: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("default")
  const [isDarkMode, setIsDarkModeState] = useState(false)

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedScheme = localStorage.getItem("accessibility-color-scheme") as ColorScheme
    const savedDarkMode = localStorage.getItem("accessibility-dark-mode") === "true"

    if (savedScheme) {
      setColorSchemeState(savedScheme)
      document.documentElement.setAttribute("data-color-scheme", savedScheme)
    }

    if (savedDarkMode) {
      setIsDarkModeState(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    localStorage.setItem("accessibility-color-scheme", scheme)
    document.documentElement.setAttribute("data-color-scheme", scheme)
  }

  const setIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark)
    localStorage.setItem("accessibility-dark-mode", String(isDark))
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <AccessibilityContext.Provider value={{ colorScheme, setColorScheme, isDarkMode, setIsDarkMode, toggleDarkMode }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}
