"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, Wallet, Bell, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: true },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/me", label: "Profile", icon: User },
]

export function AppNav() {
  const pathname = usePathname()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        console.log("[v0] AppNav - Fetching alert count")
        const supabase = getSupabaseBrowserClient()
        console.log("[v0] AppNav - Got Supabase client")

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("[v0] AppNav - User:", user?.id, "Error:", userError)

        if (userError) {
          console.error("[v0] AppNav - Error getting user:", userError)
          return
        }

        if (user) {
          const { count, error: countError } = await supabase
            .from("alerts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active")

          if (countError) {
            console.error("[v0] AppNav - Error getting alert count:", countError)
            return
          }

          console.log("[v0] AppNav - Alert count:", count)
          setAlertCount(count || 0)
        }
      } catch (error) {
        console.error("[v0] AppNav - Caught error:", error)
      }
    }

    fetchAlertCount()
    const interval = setInterval(fetchAlertCount, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MoneyMentor</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && alertCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1">
                      {alertCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
