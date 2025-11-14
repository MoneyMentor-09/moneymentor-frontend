"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  CreditCard,
  Target,
  AlertTriangle,
  User,
  MessageSquare,
  LogOut,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false) // Prevent SSR hydration issues
  const [user, setUser] = useState<any>(null)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: Target },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "Profile", href: "/me", icon: User },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
  ]

  useEffect(() => {
    setMounted(true) // Mark as mounted to allow theme toggle
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: { user: any }) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) {
      setUnreadAlerts(0)
      return
    }

    async function fetchUnreadAlerts() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: alerts } = await supabase
          .from("alerts")
          .select("*")
          .eq("user_id", user.id)
          .eq("read", false)

        setUnreadAlerts(alerts?.length || 0)
      } catch (error) {
        console.error("Error fetching alerts:", error)
      }
    }

    fetchUnreadAlerts()
  }, [user])

  // Inactivity handling
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    function clearTimers() {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
        warningTimerRef.current = null
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current)
        logoutTimerRef.current = null
      }
    }

    function startTimers() {
      clearTimers()
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true)
      }, 4 * 60 * 1000)
      logoutTimerRef.current = setTimeout(async () => {
        await supabase.auth.signOut()
        toast.error("You have been logged out due to inactivity")
        router.push("/login")
      }, 5 * 60 * 1000)
    }

    function resetTimer() {
      if (showInactivityWarning) setShowInactivityWarning(false)
      startTimers()
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach((event) => document.addEventListener(event, resetTimer, true))

    startTimers()

    return () => {
      clearTimers()
      events.forEach((event) => document.removeEventListener(event, resetTimer, true))
    }
  }, [router, showInactivityWarning])

  const handleInactivityContinue = () => setShowInactivityWarning(false)

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Error logging out")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Session Timeout Warning</h3>
            <p className="text-muted-foreground mb-4">
              You've been inactive for a while. You will be logged out in 60 seconds unless you continue.
            </p>
            <Button onClick={handleInactivityContinue} className="w-full">
              Continue Session
            </Button>
          </div>
        </div>
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-border">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold">MoneyMentor</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsMobileMenuOpen(false)
                    router.push(item.href)
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {item.name === "Alerts" && unreadAlerts > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadAlerts}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info and actions */}
          <div className="p-4 border-t border-border space-y-4">
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            )}

            {user && (
              <div className="text-sm">
                <p className="font-medium">{user.email}</p>
                <p className="text-muted-foreground text-xs">Signed in</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-4 relative">
              {/* Notifications */}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/alerts">
                  <Bell className="h-5 w-5" />
                  {unreadAlerts > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadAlerts}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Quick chat access */}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/chat">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
  