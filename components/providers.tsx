"use client"

import type React from "react"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { useInactivityTimer } from "@/hooks/use-inactivity-timer"
import { InactivityWarningModal } from "@/components/inactivity-warning-modal"
import { FloatingChatWidget } from "@/components/floating-chat-widget"
import { usePathname } from "next/navigation"
import { AccessibilityProvider } from "@/contexts/accessibility-context"

function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { showWarning, countdown, dismissWarning } = useInactivityTimer()

  // Don't show inactivity timer on public pages
  const isPublicPage =
    pathname?.startsWith("/auth") ||
    pathname === "/" ||
    pathname?.startsWith("/about") ||
    pathname?.startsWith("/contact")

  if (isPublicPage) {
    return (
      <>
        {children}
        <FloatingChatWidget />
      </>
    )
  }

  return (
    <>
      {children}
      <FloatingChatWidget />
      <InactivityWarningModal isOpen={showWarning} countdown={countdown} onDismiss={dismissWarning} />
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AccessibilityProvider>
        <InactivityWrapper>
          {children}
          <Toaster />
        </InactivityWrapper>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}
