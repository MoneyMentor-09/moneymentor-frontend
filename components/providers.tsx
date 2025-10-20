"use client"

import type React from "react"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { useInactivityTimer } from "@/hooks/use-inactivity-timer"
import { InactivityWarningModal } from "@/components/inactivity-warning-modal"
import { FloatingChatWidget } from "@/components/floating-chat-widget"
import { usePathname } from "next/navigation"

function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { showWarning, countdown, dismissWarning } = useInactivityTimer()

  // Don't show inactivity timer on public pages
  const isPublicPage = ["/", "/login", "/signup"].includes(pathname)

  return (
    <>
      {children}
      {!isPublicPage && (
        <>
          <InactivityWarningModal open={showWarning} countdown={countdown} onContinue={dismissWarning} />
          <FloatingChatWidget />
        </>
      )}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <InactivityWrapper>
        {children}
        <Toaster />
      </InactivityWrapper>
    </ThemeProvider>
  )
}
