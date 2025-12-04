"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

//accessibility button import
import { AccessibilityButton } from "@/components/ui/accessibility-button"

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
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

/**
 * Props interface for DashboardLayout component
 * @property {React.ReactNode} children - Child components to render in the main content area
 */
interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * DashboardLayout Component
 * 
 * Main layout wrapper for the dashboard application featuring:
 * - Collapsible sidebar with persistent state (Added by William)
 * - Responsive mobile menu
 * - User authentication and profile management
 * - Inactivity timeout with warning (Implemented by Amrinder)
 * - Theme toggle (Dark/Light mode - Implemented by Amrinder, moved to header by William)
 * - Real-time unread alerts counter
 * - Top navigation bar with user dropdown
 * 
 * @param {DashboardLayoutProps} props - Component props
 * @returns {JSX.Element} The dashboard layout wrapper
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  // ============================================================================
  // HOOKS & ROUTING
  // ============================================================================
  const pathname = usePathname() // Current page path
  const router = useRouter() // Next.js router for navigation
  const { theme, setTheme } = useTheme() // Theme management hook

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // UI State
  const [mounted, setMounted] = useState(false) // Prevents SSR hydration issues with theme
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // Mobile menu visibility
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Sidebar collapse state (Added by William)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Prevents animation on mount (Added by William)
  
  // User & Profile State
  const [user, setUser] = useState<any>(null) // Current authenticated user
  const [profile, setProfile] = useState<any>(null) // User profile data from database (Added by William)
  const [unreadAlerts, setUnreadAlerts] = useState(0) // Count of unread alerts
  
  // Inactivity Management State (Added by Amrinder)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false) // Warning modal visibility

  // Timer refs for inactivity tracking (Added by Amrinder)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null) // Timer for showing warning
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null) // Timer for auto-logout

  // ============================================================================
  // NAVIGATION CONFIGURATION
  // ============================================================================
  
  /**
   * Main navigation menu items
   * Note: Profile moved to dropdown menu (Modified by William)
   */
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: Target },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
  ]

  // ============================================================================
  // EFFECTS - INITIALIZATION
  // ============================================================================
  
  /**
   * Effect: Mark component as mounted to prevent SSR issues
   * Runs once on component mount
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * Effect: Load sidebar collapse state from localStorage and enable transitions
   * Prevents animation flash on page load (Added by William)
   * Runs once on component mount
   */
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true')
    }
    // Allow transitions after initial load to prevent animation on mount
    setTimeout(() => setIsInitialLoad(false), 50)
  }, [])

  // ============================================================================
  // EFFECTS - USER AUTHENTICATION & PROFILE
  // ============================================================================
  
  /**
   * Effect: Fetch user data and set up authentication listener
   * - Retrieves current authenticated user
   * - Fetches user profile from database (Added by William)
   * - Sets up auth state change listener
   * - Redirects to login if signed out
   */
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    /**
     * Fetches the current user and their profile data
     */
    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setUser(user)

        // Fetch additional profile data from users table (Added by William)
        if (user) {
          const { data: profileData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()

          if (!error) setProfile(profileData)
        }
      } catch (error) {
        console.error("Error getting user profile:", error)
      }
    }

    fetchUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: { user: any }) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else {
        setUser(session.user)
        fetchUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // ============================================================================
  // EFFECTS - ALERTS MANAGEMENT
  // ============================================================================
  
  /**
   * Effect: Fetch unread alerts count
   * Runs when user changes
   */
  useEffect(() => {
    if (!user) {
      setUnreadAlerts(0)
      return
    }

    /**
     * Queries database for unread alerts for current user
     */
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

  // ============================================================================
  // EFFECTS - INACTIVITY TIMEOUT (Implemented by Amrinder)
  // ============================================================================
  
  /**
   * Effect: Manage inactivity detection and auto-logout
   * - Shows warning after 4 minutes of inactivity
   * - Logs out user after 5 minutes of inactivity
   * - Resets timers on user activity
   * Modified by William: Adjusted event sensitivity
   */
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    /**
     * Clears all inactivity timers
     */
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

    /**
     * Starts the inactivity timers
     * Warning at 4 minutes, logout at 5 minutes
     */
    function startTimers() {
      clearTimers()
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true)
      }, 4 * 60 * 1000) // 4 minutes
      
      logoutTimerRef.current = setTimeout(async () => {
        await supabase.auth.signOut()
        toast.error("You have been logged out due to inactivity")
        router.push("/login")
      }, 5 * 60 * 1000) // 5 minutes
    }

    /**
     * Resets inactivity timers on user activity
     */
    function resetTimer() {
      if (showInactivityWarning) setShowInactivityWarning(false)
      startTimers()
    }

    // Activity events to monitor (Modified by William to reduce sensitivity)
    const events = ["mousedown","mousemove","keypress", "scroll", "touchstart"]
    events.forEach((event) => document.addEventListener(event, resetTimer, true))

    startTimers()

    // Cleanup on unmount
    return () => {
      clearTimers()
      events.forEach((event) => document.removeEventListener(event, resetTimer, true))
    }
  }, [router, showInactivityWarning])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handles the "Continue Session" action from inactivity warning
   */
  const handleInactivityContinue = () => setShowInactivityWarning(false)

  /**
   * Handles user logout
   * - Signs out from Supabase
   * - Shows success toast
   * - Redirects to login page
   */
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

  /**
   * Toggles sidebar collapsed state and persists to localStorage
   * Added by William
   */
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  /**
   * Get user's full name with fallbacks
   * Added by William
   */
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "No name"
  
  /**
   * Get user's email with fallback
   * Added by William
   */
  const email = profile?.email || user?.email || "No email"

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-background">
      
      {/* ====================================================================
          INACTIVITY WARNING MODAL (Implemented by Amrinder)
          ==================================================================== */}
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

      {/* ====================================================================
          MOBILE MENU BUTTON
          ==================================================================== */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* ====================================================================
          SIDEBAR (Modified by William - Added collapse functionality)
          ==================================================================== */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-card border-r border-border transform lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64 ${
          isInitialLoad ? "" : "transition-all duration-300 ease-in-out"
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo Section */}
          <div className={`flex items-center gap-2 p-6 border-b border-border ${isSidebarCollapsed ? "justify-center" : ""}`}>
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            {!isSidebarCollapsed && <span className="text-xl font-bold whitespace-nowrap">MoneyMentor</span>}
          </div>

          {/* Navigation Links */}
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
                  } ${isSidebarCollapsed ? "justify-center" : ""}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsMobileMenuOpen(false)
                    router.push(item.href)
                  }}
                  title={isSidebarCollapsed ? item.name : ""} // Tooltip when collapsed
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      {item.name}
                      {/* Unread alerts badge */}
                      {item.name === "Alerts" && unreadAlerts > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {unreadAlerts}
                        </Badge>
                      )}
                    </>
                  )}
                  {/* Collapsed state badge for alerts */}
                  {isSidebarCollapsed && item.name === "Alerts" && unreadAlerts > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadAlerts}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info and Logout Section */}
          <div className={`p-4 border-t border-border space-y-4 ${isSidebarCollapsed ? "items-center" : ""}`}>
            {/* User email display (hidden when collapsed) */}
            {/* {user && !isSidebarCollapsed && (
              <div className="text-sm">
                <p className="font-medium truncate">{user.email}</p>
                <p className="text-muted-foreground text-xs">Signed in</p>
              </div>
            )} */}

            {/* Logout button */}
            {/* <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className={`w-full ${isSidebarCollapsed ? "px-2" : ""}`}
              title={isSidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button> */}
          </div>
        </div>

        {/* Sidebar Toggle Button (Added by William) - Desktop only */}
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:flex absolute -right-3 top-6 rounded-full h-6 w-6 border shadow-md bg-background"
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ====================================================================
          MOBILE MENU OVERLAY
          ==================================================================== */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ====================================================================
          MAIN CONTENT AREA
          ==================================================================== */}
      <div className={`${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} ${
        isInitialLoad ? "" : "transition-all duration-300"
      }`}>
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 relative">
              
              {/* Notifications Button */}
              <Button variant="ghost" size="icon" asChild className="relative">
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

              {/* Accessibility Button */}
                <AccessibilityButton />


              {/* Theme Toggle Button (Implemented by Amrinder, moved by William) */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}

              {/* User Dropdown Menu (Added by William) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  {/* User Info Header */}
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Profile Link */}
                  <DropdownMenuItem asChild>
                    <Link href="/me">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>

                  {/* Settings Link
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem> */}

                  <DropdownMenuSeparator />

                  {/* Logout Action */}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
