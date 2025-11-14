"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  AlertTriangle, 
  User, 
  MessageSquare,
  Menu,
  X
} from "lucide-react"

interface SimpleDashboardLayoutProps {
  children: React.ReactNode
}

export function SimpleDashboardLayout({ children }: SimpleDashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: Target },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "Profile", href: "/me", icon: User },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
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
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={(e) => {
                    console.log('Simple nav clicked:', item.name, item.href)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
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
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
